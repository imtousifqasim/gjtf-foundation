import { NextRequest, NextResponse } from "next/server";
import {
  query,
  createDonationDb,
  createDonationStatusHistoryDb,
} from "@/lib/db/mysql";
import { RowDataPacket } from "mysql2/promise";
import { sendTransactionalEmail } from "@/lib/email/sender";
import { createPlanDueReminderEmail } from "@/lib/email/templates/donorTemplates";
import { createDonationReceivedEmail } from "@/lib/email/templates/donationTemplates";

export const dynamic = "force-dynamic";

/**
 * Calculates the next billing date given current date and target billing day.
 * Safely handles month end differences (e.g. Feb 28/29, April 30, etc.).
 */
function getNextBillingDate(currentDueDateStr: string, billingDay: number): string {
  const current = new Date(currentDueDateStr);
  let year = current.getFullYear();
  let month = current.getMonth() + 1; // move to next month (0-indexed + 1)

  if (month > 11) {
    month = 0;
    year += 1;
  }

  // Find max days in the target month
  // Date with day 0 of month + 1 gives last day of current target month
  const maxDaysInMonth = new Date(year, month + 1, 0).getDate();
  const day = Math.min(billingDay, maxDaysInMonth);

  const nextDate = new Date(Date.UTC(year, month, day));
  return nextDate.toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  // 1. Verify Cron Secret if configured
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && cronSecret.trim() !== "") {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized cron access" }, { status: 401 });
    }
  }

  try {
    const todayStr = new Date().toISOString().slice(0, 10);
    const inThreeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    // 2. Fetch all active monthly plans
    const activePlans = await query<RowDataPacket[]>(`
      SELECT 
        p.*,
        d.name as donor_name,
        d.email as donor_email,
        d.phone as donor_phone,
        d.country as donor_country
      FROM donation_plans p
      INNER JOIN donors d ON p.donor_id = d.id
      WHERE p.status = 'active'
    `);

    let remindersSent = 0;
    let cyclesGenerated = 0;
    const errors: string[] = [];

    for (const plan of activePlans) {
      try {
        const planDueDate = plan.next_due_date ? String(plan.next_due_date).slice(0, 10) : "";
        if (!planDueDate) continue;

        // --- SCENARIO A: 3 Days Prior Reminder ---
        if (planDueDate === inThreeDays) {
          // Idempotency check: verify reminder has not already been logged for this plan & date
          const existingReminder = await query<RowDataPacket[]>(
            `SELECT id FROM email_logs 
             WHERE related_donor_id = ? 
               AND type = 'plan_due_reminder' 
               AND created_at >= DATE_SUB(NOW(), INTERVAL 5 DAY)
             LIMIT 1`,
            [plan.donor_id]
          );

          if (!existingReminder || existingReminder.length === 0) {
            const { subject, html, text } = createPlanDueReminderEmail({
              donorName: plan.donor_name,
              donorEmail: plan.donor_email,
              amount: plan.amount,
              currency: plan.currency || "PKR",
              cause: plan.cause,
              nextDueDate: planDueDate,
              billingDay: plan.billing_day || 1,
            });

            await sendTransactionalEmail({
              to: plan.donor_email,
              recipientName: plan.donor_name,
              emailType: "plan_due_reminder",
              subject,
              html,
              text,
              metadata: { planId: plan.id, donorId: plan.donor_id, dueDate: planDueDate },
            });

            remindersSent++;
          }
        }

        // --- SCENARIO B: Due Date Reached or Past (Generate New Cycle Pledge) ---
        if (planDueDate <= todayStr) {
          // Idempotency check: has a donation already been recorded for this plan for this cycle?
          const existingCycleDonation = await query<RowDataPacket[]>(
            `SELECT id FROM donations 
             WHERE plan_id = ? 
               AND (due_date = ? OR (created_at >= DATE_SUB(NOW(), INTERVAL 20 DAY) AND frequency = 'monthly'))
             LIMIT 1`,
            [plan.id, planDueDate]
          );

          if (!existingCycleDonation || existingCycleDonation.length === 0) {
            const currentYear = new Date().getFullYear();
            const referenceNo = `GJTF-${currentYear}-${Math.floor(100000 + Math.random() * 900000)}`;

            const donationId = await createDonationDb({
              donor_id: plan.donor_id,
              plan_id: plan.id,
              reference_no: referenceNo,
              donor_name: plan.donor_name,
              donor_email: plan.donor_email,
              donor_phone: plan.donor_phone,
              cause: plan.cause,
              amount: plan.amount,
              currency: plan.currency || "PKR",
              donation_type: plan.donation_type || "General",
              frequency: "monthly",
              country: plan.donor_country || "Pakistan",
              payment_method: plan.payment_method || "bank_transfer",
              status: "pending",
              due_date: planDueDate,
            });

            await createDonationStatusHistoryDb({
              donation_id: donationId,
              old_status: null,
              new_status: "pending",
              changed_by: "system:cron:monthly-plans",
              note: `Automated monthly plan cycle generated for cycle due on ${planDueDate}`,
            });

            // Calculate next month due date according to billing day
            const billingDay = plan.billing_day || parseInt(planDueDate.split("-")[2], 10) || 1;
            const nextDueDate = getNextBillingDate(planDueDate, billingDay);

            await query(
              `UPDATE donation_plans 
               SET next_due_date = ?, 
                   updated_at = NOW() 
               WHERE id = ?`,
              [nextDueDate, plan.id]
            );

            // Send notification to donor with payment details for this cycle
            try {
              const { subject, html, text } = createDonationReceivedEmail({
                pledgeId: referenceNo,
                donorName: plan.donor_name,
                donorEmail: plan.donor_email,
                donorPhone: plan.donor_phone,
                amount: plan.amount,
                currency: plan.currency || "PKR",
                cause: plan.cause,
                donationType: plan.donation_type,
                frequency: "monthly",
              });

              await sendTransactionalEmail({
                to: plan.donor_email,
                recipientName: plan.donor_name,
                emailType: "donation_received",
                subject,
                html,
                text,
                metadata: {
                  donationId,
                  referenceNo,
                  planId: plan.id,
                  isMonthlyCycle: true,
                },
              });
            } catch (err: any) {
              console.error(`Failed to send cycle email to ${plan.donor_email}:`, err);
            }

            cyclesGenerated++;
          }
        }
      } catch (itemErr: any) {
        errors.push(`Plan ${plan.id} error: ${itemErr.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      activePlansChecked: activePlans.length,
      remindersSent,
      cyclesGenerated,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("Monthly plans cron processing error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process monthly plans cron" },
      { status: 500 }
    );
  }
}
