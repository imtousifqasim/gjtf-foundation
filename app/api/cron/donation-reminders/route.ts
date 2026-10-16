import { NextRequest, NextResponse } from "next/server";
import { getDueDonationRemindersDb, markReminderSentDb } from "@/lib/db/mysql";
import { createDonationReminderEmail } from "@/lib/email/templates/donationTemplates";
import { sendTransactionalEmail } from "@/lib/email/sender";

export const dynamic = "force-dynamic";

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
    const dueReminders = await getDueDonationRemindersDb();
    const results = {
      totalFound: dueReminders.length,
      sent: 0,
      failed: 0,
    };

    for (const item of dueReminders) {
      try {
        // Double check status idempotency
        if (item.donation_status !== "pending") {
          continue;
        }

        const { subject, html, text } = createDonationReminderEmail({
          pledgeId: item.pledge_id,
          donorName: item.donor_name,
          donorEmail: item.donor_email,
          donorPhone: item.donor_phone,
          amount: item.amount,
          currency: item.currency || "PKR",
          cause: item.cause,
          customMessage: item.custom_message,
          unsubscribeToken: item.unsubscribe_token,
        });

        const sendRes = await sendTransactionalEmail({
          to: item.donor_email,
          recipientName: item.donor_name,
          emailType: "donation_reminder",
          subject,
          html,
          text,
          metadata: {
            pledgeId: item.pledge_id,
            reminderId: item.id,
            sentViaCron: true,
            iteration: (item.sent_count || 0) + 1,
          },
        });

        if (sendRes.success) {
          results.sent++;
          const nextIteration = (item.sent_count || 0) + 1;
          const maxReminders = item.max_reminders || 1;
          const repeatDays = item.repeat_interval_days || 0;

          if (repeatDays > 0 && nextIteration < maxReminders) {
            // Schedule next reminder date
            const nextDate = new Date(Date.now() + repeatDays * 24 * 60 * 60 * 1000)
              .toISOString()
              .slice(0, 19)
              .replace("T", " ");
            await markReminderSentDb(item.id, nextDate);
          } else {
            // Mark completed
            await markReminderSentDb(item.id, null);
          }
        } else {
          results.failed++;
        }
      } catch (innerErr) {
        console.error("Error processing reminder ID", item.id, innerErr);
        results.failed++;
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (err: any) {
    console.error("Donation reminders cron error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
