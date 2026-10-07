import nodemailer from "nodemailer";
import { getSmtpSettingsDb } from "@/lib/db/mysql";

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user_name: string;
  password?: string;
  from_name: string;
  from_email: string;
}

export async function getSmtpConfig(): Promise<SmtpConfig> {
  try {
    const data = await getSmtpSettingsDb();

    if (data) {
      return {
        host: data.host || process.env.SMTP_HOST || "smtp.gmail.com",
        port: Number(data.port) || Number(process.env.SMTP_PORT) || 587,
        secure: Boolean(data.secure),
        user_name: data.user_name || process.env.SMTP_USER || "",
        password: data.password || process.env.SMTP_PASS || "",
        from_name: data.from_name || "Ghais Jhuggi Taleem Foundation",
        from_email: data.from_email || data.user_name || "info@gjtfoundation.com",
      };
    }
  } catch (err) {
    console.warn("Could not fetch smtp_settings from Hostinger MySQL:", err);
  }

  return {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    user_name: process.env.SMTP_USER || "",
    password: process.env.SMTP_PASS || "",
    from_name: "Ghais Jhuggi Taleem Foundation",
    from_email: process.env.SMTP_FROM || "info@gjtfoundation.com",
  };
}

export async function createTransporter(config?: SmtpConfig) {
  const settings = config || (await getSmtpConfig());

  if (!settings.host || !settings.user_name || !settings.password) {
    throw new Error("SMTP credentials are not configured yet. Please configure them in Admin Settings.");
  }

  return nodemailer.createTransport({
    host: settings.host,
    port: settings.port,
    secure: settings.secure,
    auth: {
      user: settings.user_name,
      pass: settings.password,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}) {
  const config = await getSmtpConfig();
  const transporter = await createTransporter(config);

  const mailOptions = {
    from: `"${config.from_name}" <${config.from_email || config.user_name}>`,
    to: Array.isArray(to) ? to.join(", ") : to,
    subject,
    text: text || html.replace(/<[^>]*>?/gm, ""),
    html,
  };

  return await transporter.sendMail(mailOptions);
}

export async function sendWelcomeNewsletterEmail(subscriberEmail: string) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
          .wrapper { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
          .header { background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 36px 30px; text-align: center; color: #ffffff; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
          .header p { margin: 8px 0 0; font-size: 14px; opacity: 0.9; }
          .content { padding: 32px 30px; color: #334155; line-height: 1.6; }
          .content h2 { color: #0f172a; font-size: 20px; font-weight: 700; margin-top: 0; }
          .feature-box { background: #f1f5f9; border-left: 4px solid #2563eb; padding: 16px; border-radius: 8px; margin: 20px 0; }
          .button { display: inline-block; background-color: #2563eb; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 700; font-size: 14px; margin-top: 10px; }
          .footer { background: #f8fafc; padding: 24px 30px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="header">
            <h1>Ghais Jhuggi Taleem Foundation</h1>
            <p>Empowering Nomadic & Slum Children Across Pakistan</p>
          </div>
          <div class="content">
            <h2>Welcome to our Community!</h2>
            <p>Assalam-o-Alaikum,</p>
            <p>Thank you for subscribing to the <strong>Ghais Jhuggi Taleem Foundation (GJTF)</strong> newsletter. Your support brings us one step closer to our goal of uplifting over 20 million nomadic community members across Pakistan.</p>
            
            <div class="feature-box">
              <strong style="color: #1e3a8a;">What to expect:</strong>
              <ul style="margin: 8px 0 0; padding-left: 20px;">
                <li>Updates on new school openings in remote squatter settlements</li>
                <li>Inspiring stories of nomadic children stepping into classrooms for the first time</li>
                <li>Opportunities to volunteer in medical camps, teaching, and youth chapters</li>
                <li>Transparent reports on how zakat and donations transform lives</li>
              </ul>
            </div>

            <p>If you'd like to get actively involved today, you can explore our schools directory or become a volunteer in your city:</p>
            <div style="text-align: center; margin: 24px 0;">
              <a href="https://gjtfoundation.com/donate-now" class="button">Support a Child's Education</a>
            </div>
            <p>With warm regards,<br><strong>GJTF Executive Team</strong><br>Head Office: 20-E, Maulana Shaukat Ali Road, Lahore<br>Toll-Free: 0800-00823</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Ghais Jhuggi Taleem Foundation. All rights reserved.</p>
            <p>You received this email because you subscribed to updates on gjtfoundation.com.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return await sendEmail({
    to: subscriberEmail,
    subject: "Welcome to GJTF Foundation — Thank You for Subscribing!",
    html,
  });
}
