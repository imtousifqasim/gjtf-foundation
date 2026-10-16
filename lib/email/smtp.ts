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

    // Use DB settings if both username and password are saved
    if (data && data.user_name && data.password) {
      const port = Number(data.port) || Number(process.env.SMTP_PORT) || 465;
      const isSecure = data.secure !== undefined ? Boolean(data.secure) : port === 465;
      return {
        host: data.host || process.env.SMTP_HOST || "smtp.hostinger.com",
        port,
        secure: isSecure,
        user_name: data.user_name || process.env.SMTP_USER || "admin@gjtfoundation.com",
        password: data.password || process.env.SMTP_PASS || "4hZN6j9Nr+",
        from_name: data.from_name || process.env.SMTP_FROM_NAME || "Ghais Jhuggi Taleem Foundation",
        from_email: data.from_email || data.user_name || process.env.SMTP_FROM || "admin@gjtfoundation.com",
      };
    }
  } catch (err) {
    console.warn("Could not fetch smtp_settings from Hostinger MySQL:", err);
  }

  // Fallback to environment variables or Hostinger defaults
  const envPort = Number(process.env.SMTP_PORT) || 465;
  const envSecure = process.env.SMTP_SECURE === "true" || envPort === 465;

  return {
    host: process.env.SMTP_HOST || "smtp.hostinger.com",
    port: envPort,
    secure: envSecure,
    user_name: process.env.SMTP_USER || "admin@gjtfoundation.com",
    password: process.env.SMTP_PASS || "4hZN6j9Nr+",
    from_name: process.env.SMTP_FROM_NAME || "Ghais Jhuggi Taleem Foundation",
    from_email: process.env.SMTP_FROM || process.env.SMTP_USER || "admin@gjtfoundation.com",
  };
}

export async function createTransporter(config?: SmtpConfig) {
  const settings = config || (await getSmtpConfig());

  if (!settings.host || !settings.user_name || !settings.password) {
    throw new Error("SMTP credentials are not configured yet. Please configure them in Admin Settings or .env.local.");
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
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
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

  const senderAddress = config.from_email || config.user_name || "admin@gjtfoundation.com";
  const mailOptions = {
    from: `"${config.from_name || "Ghais Jhuggi Taleem Foundation"}" <${senderAddress}>`,
    replyTo: `"${config.from_name || "Ghais Jhuggi Taleem Foundation"}" <${senderAddress}>`,
    to: Array.isArray(to) ? to.join(", ") : to,
    subject,
    text: text || html.replace(/<[^>]*>?/gm, ""),
    html,
  };

  return await transporter.sendMail(mailOptions);
}

import { renderBaseEmailHtml } from "./templates/baseLayout";

export async function sendWelcomeNewsletterEmail(subscriberEmail: string) {
  const contentHtml = `
    <h2 style="color: #0f172a; font-size: 20px; font-weight: 700; margin-top: 0;">Welcome to our Community!</h2>
    <p>Assalam-o-Alaikum,</p>
    <p>Thank you for subscribing to the <strong>Ghais Jhuggi Taleem Foundation (GJTF)</strong> newsletter. Your support brings us one step closer to our goal of uplifting over 20 million nomadic community members across Pakistan.</p>
    
    <div style="background: #f1f5f9; border-left: 4px solid #0d5c3a; padding: 16px; border-radius: 8px; margin: 20px 0;">
      <strong style="color: #0d5c3a;">What to expect:</strong>
      <ul style="margin: 8px 0 0; padding-left: 20px; color: #334155; line-height: 1.6;">
        <li>Updates on new school openings in remote squatter settlements</li>
        <li>Inspiring stories of nomadic children stepping into classrooms for the first time</li>
        <li>Opportunities to volunteer in medical camps, teaching, and youth chapters</li>
        <li>Transparent reports on how zakat and donations transform lives</li>
      </ul>
    </div>

    <p>If you'd like to get actively involved today, you can explore our schools directory or become a volunteer in your city:</p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="https://gjtfoundation.com/donate-now" class="btn-primary" style="color: #ffffff; text-decoration: none;">Support a Child's Education</a>
    </div>
    <p style="margin: 20px 0 0; color: #64748b; font-size: 13px; line-height: 1.6;">
      With warm regards,<br/>
      <strong>GJTF Executive Team</strong><br/>
      Ghais Jhuggi Taleem Foundation
    </p>
  `;

  const html = renderBaseEmailHtml({
    title: "Welcome to GJTF Foundation — Thank You for Subscribing!",
    preheader: "Thank you for subscribing to the Ghais Jhuggi Taleem Foundation newsletter.",
    contentHtml,
    recipientEmail: subscriberEmail,
    isTransactional: false,
    unsubscribeUrl: "https://gjtfoundation.com/unsubscribe",
  });

  return await sendEmail({
    to: subscriberEmail,
    subject: "Welcome to GJTF Foundation — Thank You for Subscribing!",
    html,
  });
}
