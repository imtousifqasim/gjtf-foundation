"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { SmtpConfig, createTransporter, getSmtpConfig } from "@/lib/email/smtp";

export async function getSmtpSettingsAction(): Promise<SmtpConfig> {
  return await getSmtpConfig();
}

export async function saveSmtpSettingsAction(settings: SmtpConfig) {
  try {
    const supabase = createAdminClient();

    const { error } = await supabase
      .from("smtp_settings")
      .upsert(
        {
          id: "default",
          host: settings.host.trim(),
          port: Number(settings.port),
          secure: Boolean(settings.secure),
          user_name: settings.user_name.trim(),
          password: settings.password || "",
          from_name: settings.from_name.trim(),
          from_email: settings.from_email.trim(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

    if (error) {
      console.error("Supabase smtp_settings update error:", error);
      return { success: false, message: error.message };
    }

    return {
      success: true,
      message: "SMTP configuration saved successfully to database in real time!",
    };
  } catch (err: any) {
    console.error("Save SMTP error:", err);
    return { success: false, message: err.message || "Failed to save SMTP settings." };
  }
}

export async function testSmtpConnectionAction({
  settings,
  recipientEmail,
}: {
  settings: SmtpConfig;
  recipientEmail: string;
}) {
  try {
    const transporter = await createTransporter(settings);

    // 1. Verify connection
    await transporter.verify();

    // 2. Send test email
    const info = await transporter.sendMail({
      from: `"${settings.from_name}" <${settings.from_email || settings.user_name}>`,
      to: recipientEmail,
      subject: "Test Email from GJTF Foundation System",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 550px; margin: 20px auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
          <div style="background: #1e3a8a; padding: 16px; border-radius: 8px; text-align: center; color: #ffffff;">
            <h2 style="margin: 0; font-size: 18px;">SMTP Configuration Verified</h2>
          </div>
          <div style="padding: 20px 0; color: #334155; line-height: 1.5;">
            <p><strong>Congratulations!</strong> Your SMTP connection was successfully verified on the <strong>Ghais Jhuggi Taleem Foundation</strong> platform.</p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px;">
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px 0; color: #64748b;">SMTP Host:</td>
                <td style="padding: 8px 0; font-weight: bold;">${settings.host}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px 0; color: #64748b;">Port & Security:</td>
                <td style="padding: 8px 0; font-weight: bold;">Port ${settings.port} (${settings.secure ? "SSL" : "TLS/STARTTLS"})</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px 0; color: #64748b;">User:</td>
                <td style="padding: 8px 0; font-weight: bold;">${settings.user_name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Tested at:</td>
                <td style="padding: 8px 0;">${new Date().toLocaleString()}</td>
              </tr>
            </table>
          </div>
          <div style="font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 12px; text-align: center;">
            This email confirms that newsletter and transactional messages can now be delivered automatically.
          </div>
        </div>
      `,
    });

    return {
      success: true,
      message: `SMTP connection established successfully! Verified test email delivered to ${recipientEmail} (Message ID: ${info.messageId}).`,
    };
  } catch (err: any) {
    console.error("Test SMTP error:", err);
    return {
      success: false,
      error: err.message || "Failed to establish SMTP connection.",
    };
  }
}
