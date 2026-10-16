import { NextRequest, NextResponse } from "next/server";
import siteConfig from "@/lib/siteConfig";
import { sendTransactionalEmail } from "@/lib/email/sender";
import { createDonationReceivedEmail } from "@/lib/email/templates/donationTemplates";
import {
  createWelcomeSetPasswordEmail,
  createMagicLinkEmail,
} from "@/lib/email/templates/donorTemplates";
import { createVolunteerSignupEmail } from "@/lib/email/templates/volunteerTemplates";
import { renderBaseEmailHtml } from "@/lib/email/templates/baseLayout";
import { query as mysqlQuery } from "@/lib/db/mysql";

export const dynamic = "force-dynamic";

/**
 * Protected test email and migration endpoint.
 *
 * Query params:
 *   secret: string (Matches CRON_SECRET or default secret)
 *   preview: "true" | "1" (Renders HTML directly in browser)
 *   send: "true" | "1" (Dispatches sample email)
 *   to: string (Recipient email for dispatch, defaults to foundation email)
 *   type: "donation" | "welcome" | "volunteer" | "newsletter" | "otp"
 *   migrate: "true" | "1" (Executes DB migration for site_settings and payment_settings)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // Security Verification
  const validSecret = process.env.CRON_SECRET || "gjtf-secret-2026";
  const providedSecret = searchParams.get("secret") || req.headers.get("x-test-secret");

  if (!providedSecret || providedSecret !== validSecret) {
    return NextResponse.json(
      {
        error: "Unauthorized",
        message: "Provide a valid ?secret= query parameter to access this test utility.",
      },
      { status: 401 }
    );
  }

  // Database Migration Action (?migrate=1)
  if (searchParams.get("migrate") === "true" || searchParams.get("migrate") === "1") {
    try {
      // 1. Update site_settings
      const siteResult = await mysqlQuery<any>(`
        UPDATE site_settings
        SET
          head_office_address = ?,
          telephone = ?,
          mobile = ?,
          whatsapp = ?,
          email = ?,
          secondary_email = ?,
          toll_free = '',
          facebook_url = ?,
          instagram_url = ?,
          youtube_url = ?,
          tiktok_url = ?,
          linkedin_url = '',
          updated_at = NOW()
        WHERE id = 'default'
      `, [
        siteConfig.address,
        siteConfig.phone1.number,
        siteConfig.phone2.number,
        siteConfig.phone2.number,
        siteConfig.email.address,
        siteConfig.email.address,
        siteConfig.socials.facebook,
        siteConfig.socials.instagram,
        siteConfig.socials.youtube,
        siteConfig.socials.tiktok,
      ]);

      // 2. Update payment_settings (Bank Islami Details)
      const paymentResult = await mysqlQuery<any>(`
        UPDATE payment_settings
        SET
          bank_name = 'Bank Islami',
          branch_name = 'Allama Iqbal Town, Lahore',
          account_title = 'Ghais Jhuggi Taleem Foundation',
          account_number = '203756213050001',
          iban = 'PK19BKIP0203756213050001',
          swift_code = '',
          doorstep_phone = ?,
          jazzcash_number = ?,
          updated_at = NOW()
        WHERE id = 'default'
      `, [
        siteConfig.phone1.number,
        siteConfig.phone2.number,
      ]);

      // 3. Update smtp_settings (Hostinger SMTP SSL configuration)
      const smtpResult = await mysqlQuery<any>(`
        INSERT INTO smtp_settings (
          id, host, port, secure, user_name, password, from_name, from_email, updated_at
        ) VALUES (
          'default', 'smtp.hostinger.com', 465, 1, 'admin@gjtfoundation.com', '4hZN6j9Nr+', 'Ghais Jhuggi Taleem Foundation', 'admin@gjtfoundation.com', NOW()
        ) ON DUPLICATE KEY UPDATE
          host = VALUES(host),
          port = VALUES(port),
          secure = VALUES(secure),
          user_name = VALUES(user_name),
          password = VALUES(password),
          from_name = VALUES(from_name),
          from_email = VALUES(from_email),
          updated_at = NOW()
      `);

      // 4. Section 15 Tables: pricing_settings, fx_rates, bank_accounts
      const { ensurePricingTablesDb } = await import("@/lib/db/pricingDb");
      const { ensureBankAccountsTableDb } = await import("@/lib/db/bankAccounts");
      await ensurePricingTablesDb();
      await ensureBankAccountsTableDb();

      // 5. Section 15 Alterations for donations & donation_plans
      const alterQueries = [
        "ALTER TABLE donations ADD COLUMN IF NOT EXISTS children_equivalent DECIMAL(10, 2) NULL DEFAULT 0.00;",
        "ALTER TABLE donations ADD COLUMN IF NOT EXISTS pricing_version INT NOT NULL DEFAULT 1;",
        "ALTER TABLE donations ADD COLUMN IF NOT EXISTS amount_pkr_minor BIGINT NULL;",
        "ALTER TABLE donations ADD COLUMN IF NOT EXISTS display_currency VARCHAR(10) NOT NULL DEFAULT 'PKR';",
        "ALTER TABLE donations ADD COLUMN IF NOT EXISTS display_amount_minor BIGINT NULL;",
        "ALTER TABLE donations ADD COLUMN IF NOT EXISTS fx_rate DECIMAL(16, 6) NULL;",
        "ALTER TABLE donations ADD COLUMN IF NOT EXISTS fx_buffer_pct DECIMAL(5, 2) NULL DEFAULT 1.00;",
        "ALTER TABLE donations ADD COLUMN IF NOT EXISTS fx_locked_at TIMESTAMP NULL;",
        "ALTER TABLE donations ADD COLUMN IF NOT EXISTS fx_valid_until TIMESTAMP NULL;",
        "ALTER TABLE donations ADD COLUMN IF NOT EXISTS bank_account_id VARCHAR(64) NULL DEFAULT 'bank-islami-primary';",
        "ALTER TABLE donations ADD COLUMN IF NOT EXISTS received_amount_minor BIGINT NULL;",
        "ALTER TABLE donations ADD COLUMN IF NOT EXISTS received_currency VARCHAR(10) NULL;",
        "ALTER TABLE donations ADD COLUMN IF NOT EXISTS received_pkr_minor BIGINT NULL;",
        "ALTER TABLE donations ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(128) NULL;",
        "ALTER TABLE donation_plans ADD COLUMN IF NOT EXISTS children_count DECIMAL(10, 2) NOT NULL DEFAULT 1.00;",
        "ALTER TABLE donation_plans ADD COLUMN IF NOT EXISTS pledge_basis ENUM('pkr_fixed', 'aed_fixed') NOT NULL DEFAULT 'pkr_fixed';",
        "ALTER TABLE donation_plans ADD COLUMN IF NOT EXISTS end_date TIMESTAMP NULL;",
        "ALTER TABLE donation_plans ADD COLUMN IF NOT EXISTS total_cycles INT NULL;",
        "INSERT INTO app_settings (setting_key, setting_value) VALUES ('enrolled_children', '1000') ON DUPLICATE KEY UPDATE updated_at = NOW();",
      ];

      for (const q of alterQueries) {
        try {
          await mysqlQuery(q);
        } catch (e) {
          // Ignore if exists
        }
      }

      // 6. Sync Backup to Supabase
      const { syncBackupToSupabase } = await import("@/lib/db/mysql");
      await syncBackupToSupabase("migrateSiteSettings", (sb) =>
        sb.from("site_settings").upsert({
          id: "default",
          head_office_address: siteConfig.address,
          telephone: siteConfig.phone1.number,
          mobile: siteConfig.phone2.number,
          whatsapp: siteConfig.phone2.number,
          email: siteConfig.email.address,
          secondary_email: siteConfig.email.address,
          toll_free: "",
          facebook_url: siteConfig.socials.facebook,
          instagram_url: siteConfig.socials.instagram,
          youtube_url: siteConfig.socials.youtube,
          tiktok_url: siteConfig.socials.tiktok,
          linkedin_url: "",
          updated_at: new Date().toISOString(),
        })
      );

      await syncBackupToSupabase("migrateSmtpSettings", (sb) =>
        sb.from("smtp_settings").upsert({
          id: "default",
          host: "smtp.hostinger.com",
          port: 465,
          secure: true,
          user_name: "admin@gjtfoundation.com",
          password: "4hZN6j9Nr+",
          from_name: "Ghais Jhuggi Taleem Foundation",
          from_email: "admin@gjtfoundation.com",
          updated_at: new Date().toISOString(),
        })
      );

      const siteRows = await mysqlQuery<any[]>("SELECT * FROM site_settings WHERE id = 'default'");
      const payRows = await mysqlQuery<any[]>("SELECT id, bank_name, account_number, iban, doorstep_phone, jazzcash_number FROM payment_settings WHERE id = 'default'");
      const smtpRows = await mysqlQuery<any[]>("SELECT id, host, port, secure, user_name, from_name, from_email FROM smtp_settings WHERE id = 'default'");
      const pricingRows = await mysqlQuery<any[]>("SELECT * FROM pricing_settings WHERE is_active = 1 LIMIT 1");
      const bankRows = await mysqlQuery<any[]>("SELECT * FROM bank_accounts WHERE is_active = 1 LIMIT 1");

      return NextResponse.json({
        success: true,
        message: "Section 15 pricing tables, Bank Islami accounts, and schemas successfully migrated on Hostinger MySQL.",
        siteSettingsAffected: siteResult?.affectedRows ?? 0,
        paymentSettingsAffected: paymentResult?.affectedRows ?? 0,
        smtpSettingsAffected: smtpResult?.affectedRows ?? 0,
        currentSiteSettings: siteRows?.[0] || null,
        currentPaymentSettings: payRows?.[0] || null,
        currentSmtpSettings: smtpRows?.[0] || null,
        activePricingSetting: pricingRows?.[0] || null,
        activeBankAccount: bankRows?.[0] || null,
      });
    } catch (err: any) {
      return NextResponse.json(
        {
          success: false,
          error: "Database migration execution failed",
          details: err?.message || String(err),
        },
        { status: 500 }
      );
    }
  }

  // Section 15 Test Pricing Runner (?test_pricing=1)
  if (searchParams.get("test_pricing") === "true" || searchParams.get("test_pricing") === "1") {
    try {
      const { calculateImpact, DEFAULT_PRICING } = await import("@/lib/pricing/impact");
      const { toMinorUnits, toMajorUnits, roundAedCeil } = await import("@/lib/pricing/money");
      const { convertPkrToAed, convertAedToPkr, lockFxRate } = await import("@/lib/pricing/fx");

      const testResults: { name: string; passed: boolean; details?: any }[] = [];

      // Test 1: Whole child impact
      const imp1 = calculateImpact(5000, "monthly", DEFAULT_PRICING);
      testResults.push({
        name: "15.1: Whole Child Monthly (PKR 5,000 = 1 child)",
        passed: imp1.childrenCount === 1 && imp1.isTruthfulPooled,
        details: imp1.summary,
      });

      // Test 2: Fractional child impact (PKR 7,500 = 1.5 children)
      const impFrac = calculateImpact(7500, "monthly", DEFAULT_PRICING);
      testResults.push({
        name: "15.3: Fractional Child Monthly (PKR 7,500 = 1.5 children)",
        passed: impFrac.childrenCount === 1.5,
        details: impFrac.summary,
      });

      // Test 3: Fractional 40% child (PKR 2,000)
      const imp2k = calculateImpact(2000, "monthly", DEFAULT_PRICING);
      testResults.push({
        name: "15.3: Fractional Child (PKR 2,000 = 40% of 1 child)",
        passed: imp2k.childrenCount === 0.4,
        details: imp2k.summary,
      });

      // Test 4: One-time gift child-months (PKR 60,000 = 12 child-months)
      const impOnce = calculateImpact(60000, "once", DEFAULT_PRICING);
      testResults.push({
        name: "15.3: One-Time Impact (PKR 60,000 = 12 child-months)",
        passed: impOnce.childMonthsFunded === 12,
        details: impOnce.summary,
      });

      // Test 5: Minor unit zero-float arithmetic
      const minor = toMinorUnits(5000);
      const major = toMajorUnits(minor);
      testResults.push({
        name: "15.4: Minor Units Zero-Float Arithmetic (5000 PKR = 500000 paisa)",
        passed: minor === 500000n && major === 5000,
      });

      // Test 6: Round AED ceil
      const ceil1 = roundAedCeil(64.12);
      const ceil2 = roundAedCeil(64.0);
      testResults.push({
        name: "15.5: AED Rounding UP to Next Whole Dirham (64.12 -> 65, 64.0 -> 64)",
        passed: ceil1 === 65 && ceil2 === 64,
      });

      // Test 7: PKR to AED with 1% buffer
      const fxConv = convertPkrToAed(5000, 1 / 76.5, 1.0);
      testResults.push({
        name: "15.5: PKR to AED conversion with 1% buffer",
        passed: fxConv.aedAmount === 67,
        details: fxConv,
      });

      // Test 8: Rate Lock 48h validity
      const lock = lockFxRate(5000, 1 / 76.5, 1.0);
      const diffHours = (lock.fxValidUntil.getTime() - lock.fxLockedAt.getTime()) / (1000 * 60 * 60);
      testResults.push({
        name: "15.5: Rate Lock 48-Hour Validity",
        passed: diffHours === 48 && lock.aedAmount === 67,
        details: lock.lockNotice,
      });

      // Test 9: Bank Islami credentials check
      const bankIslamiMatch =
        siteConfig.bankAccount.bankName === "Bank Islami" &&
        siteConfig.bankAccount.accountNumber === "203756213050001" &&
        siteConfig.bankAccount.iban === "PK19BKIP0203756213050001";
      testResults.push({
        name: "15.6: Bank Islami Credentials Verification",
        passed: bankIslamiMatch,
        details: siteConfig.bankAccount,
      });

      const allPassed = testResults.every((t) => t.passed);

      return NextResponse.json({
        success: true,
        allPassed,
        totalTests: testResults.length,
        passedTests: testResults.filter((t) => t.passed).length,
        tests: testResults,
      });
    } catch (err: any) {
      return NextResponse.json(
        {
          success: false,
          error: "Unit tests failed to execute",
          details: err?.message || String(err),
        },
        { status: 500 }
      );
    }

  }

  // Template Selection
  const type = (searchParams.get("type") || "donation").toLowerCase();
  let emailPayload: { subject: string; html: string; text?: string };

  switch (type) {
    case "welcome":
      emailPayload = createWelcomeSetPasswordEmail({
        donorName: "Tousif Qasim",
        donorEmail: searchParams.get("to") || siteConfig.email.address,
        actionUrl: `${siteConfig.baseUrl}/donor/set-password?token=sample-token-12345`,
        expiresInText: "24 hours",
      });
      break;

    case "volunteer":
      emailPayload = createVolunteerSignupEmail({
        full_name: "Sara Rehman",
        email: searchParams.get("to") || siteConfig.email.address,
        phone: siteConfig.phone2.display,
        type: "university_chapter",
        city: "Lahore",
        university: "LUMS",
        message: "Eager to mobilize student volunteers for nomadic community schools.",
      });
      break;

    case "newsletter":
      {
        const newsletterSubject = "Education in Nomadic Settlements: Monthly Digest";
        const contentHtml = `
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;line-height:1.6;">
            <h2 style="font-size:20px;font-weight:700;color:#0f172a;margin-top:0;margin-bottom:12px;">Transforming Jhuggi Classrooms with AI Literacy</h2>
            <p style="font-size:15px;margin-bottom:16px;">Over 20 million nomadic communities across Pakistan lack access to formal schools. With your generous support, GJTF has established 50 new mobile weather-proof classroom units this quarter.</p>
            <div style="text-align:center;margin:28px 0;">
              <a href="${siteConfig.baseUrl}/stories" style="display:inline-block;background-color:#0a5c36;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">Read Student Stories &rarr;</a>
            </div>
          </div>
        `;
        const renderedHtml = renderBaseEmailHtml({
          title: newsletterSubject,
          preheader: "Discover how nomadic children are breaking barriers with digital education.",
          contentHtml,
          isTransactional: false,
          unsubscribeUrl: `${siteConfig.baseUrl}/newsletter/unsubscribe?token=sample-test-token`,
        });
        emailPayload = {
          subject: newsletterSubject,
          html: renderedHtml,
          text: "Education in Nomadic Settlements: Monthly Digest - GJTF Foundation",
        };
      }
      break;

    case "otp":
      emailPayload = createMagicLinkEmail({
        donorName: "Tousif Qasim",
        donorEmail: searchParams.get("to") || siteConfig.email.address,
        actionUrl: `${siteConfig.baseUrl}/donor/verify?otp=839201`,
        expiresInText: "15 minutes",
        otpCode: "839201",
      });
      break;

    case "donation":
    default:
      emailPayload = createDonationReceivedEmail({
        pledgeId: "PLG-2026-90412",
        donorName: "Tousif Qasim",
        donorEmail: searchParams.get("to") || siteConfig.email.address,
        donorPhone: siteConfig.phone2.display,
        amount: 10000,
        currency: "PKR",
        cause: "Educate a Child",
        frequency: "monthly",
        donationType: "Zakat",
        createdAt: new Date().toISOString(),
      });
      break;
  }

  // Preview Mode: render directly in browser
  if (searchParams.get("preview") === "true" || searchParams.get("preview") === "1") {
    return new Response(emailPayload.html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store, max-age=0",
      },
    });
  }

  // Send Mode: dispatch real email
  if (searchParams.get("send") === "true" || searchParams.get("send") === "1") {
    const to = searchParams.get("to") || siteConfig.email.address;
    try {
      const result = await sendTransactionalEmail({
        to,
        recipientName: "Test Recipient",
        emailType: `test_${type}`,
        subject: `[TEST] ${emailPayload.subject}`,
        html: emailPayload.html,
        text: emailPayload.text || `This is a preview test email from GJTF Foundation. Type: ${type}`,
      });

      return NextResponse.json({
        success: result.success,
        logId: result.logId,
        recipient: to,
        emailType: type,
        subject: emailPayload.subject,
        error: result.error || null,
        message: result.success
          ? `Test email dispatched successfully to ${to}`
          : `Failed to dispatch email: ${result.error}`,
      });
    } catch (sendErr: any) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to dispatch email",
          details: sendErr?.message || String(sendErr),
        },
        { status: 500 }
      );
    }
  }

  // Default JSON help response
  return NextResponse.json({
    status: "ready",
    message: "GJTF Email Test Utility is configured and protected.",
    usage: {
      previewInBrowser: `GET /api/test-email?secret=${validSecret}&preview=1&type=donation|welcome|volunteer|newsletter|otp`,
      sendTestEmail: `GET /api/test-email?secret=${validSecret}&send=1&to=your-email@example.com&type=donation`,
      runDatabaseMigration: `GET /api/test-email?secret=${validSecret}&migrate=1`,
    },
    singleSourceOfTruth: {
      organisation: siteConfig.name,
      tagline: siteConfig.tagline,
      address: siteConfig.address,
      phone1: siteConfig.phone1,
      phone2: siteConfig.phone2,
      email: siteConfig.email,
      supportHours: siteConfig.supportHours,
      socials: siteConfig.socials,
    },
  });
}
