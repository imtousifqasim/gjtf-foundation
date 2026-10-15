import { renderBaseEmailHtml, escapeHtml } from "./baseLayout";

export interface VolunteerData {
  full_name: string;
  email: string;
  phone: string;
  type: string;
  city: string;
  university?: string | null;
  message?: string | null;
}

export function formatVolunteerRole(type: string): string {
  switch (type) {
    case "city_chapter":
      return "City Chapter Lead";
    case "university_chapter":
      return "University Chapter Member / Lead";
    case "general":
      return "General Volunteer";
    default:
      return type.replace(/_/g, " ");
  }
}

// -------------------------------------------------------------
// 1. Volunteer Sign-up Confirmation
// -------------------------------------------------------------
export function createVolunteerSignupEmail(data: VolunteerData) {
  const roleName = formatVolunteerRole(data.type);
  const subject = `Application Received: Welcome to GJTF Volunteers, ${data.full_name}!`;
  const preheader = `We have received your application for ${roleName}. Our team is reviewing it.`;

  const contentHtml = `
    <div style="margin-bottom: 24px;">
      <span style="display: inline-block; background-color: #dbeafe; color: #1e40af; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">
        Application Under Review
      </span>
      <h1 style="margin: 0 0 12px; font-size: 24px; font-weight: 800; color: #0b1536; line-height: 1.3;">
        Thank You for Stepping Up, ${escapeHtml(data.full_name)}!
      </h1>
      <p style="margin: 0; color: #475569; font-size: 15px; line-height: 1.6;">
        We have received your volunteer application for <strong>${escapeHtml(roleName)}</strong> at 
        <strong>Ghais Jhuggi Taleem Foundation (GJTF)</strong>. Our chapter coordination team is currently reviewing 
        your profile to align your skills with ongoing school units and teaching drives in <strong>${escapeHtml(data.city)}</strong>.
      </p>
    </div>

    <!-- Application Summary Table -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 16px 20px; border-bottom: 1px solid #e2e8f0;">
          <strong style="color: #0b1536; font-size: 14px;">Summary of Submitted Application</strong>
        </td>
      </tr>
      <tr>
        <td style="padding: 16px 20px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td class="detail-label" style="width: 35%; padding: 6px 0; color: #64748b; font-size: 13px;">Applicant Name:</td>
              <td class="detail-val" style="width: 65%; padding: 6px 0; font-weight: 700; color: #0f172a; font-size: 13px;">${escapeHtml(data.full_name)}</td>
            </tr>
            <tr>
              <td class="detail-label" style="padding: 6px 0; color: #64748b; font-size: 13px;">Role / Chapter:</td>
              <td class="detail-val" style="padding: 6px 0; font-weight: 700; color: #2563eb; font-size: 13px;">${escapeHtml(roleName)}</td>
            </tr>
            <tr>
              <td class="detail-label" style="padding: 6px 0; color: #64748b; font-size: 13px;">City:</td>
              <td class="detail-val" style="padding: 6px 0; color: #0f172a; font-size: 13px;">${escapeHtml(data.city)}</td>
            </tr>
            ${
              data.university
                ? `<tr>
                    <td class="detail-label" style="padding: 6px 0; color: #64748b; font-size: 13px;">University / College:</td>
                    <td class="detail-val" style="padding: 6px 0; color: #0f172a; font-size: 13px;">${escapeHtml(data.university)}</td>
                  </tr>`
                : ""
            }
            <tr>
              <td class="detail-label" style="padding: 6px 0; color: #64748b; font-size: 13px;">Phone / WhatsApp:</td>
              <td class="detail-val" style="padding: 6px 0; color: #0f172a; font-size: 13px;">${escapeHtml(data.phone)}</td>
            </tr>
            <tr>
              <td class="detail-label" style="padding: 6px 0; color: #64748b; font-size: 13px;">Email Address:</td>
              <td class="detail-val" style="padding: 6px 0; color: #0f172a; font-size: 13px;">${escapeHtml(data.email)}</td>
            </tr>
            ${
              data.message
                ? `<tr>
                    <td class="detail-label" style="padding: 6px 0; color: #64748b; font-size: 13px; vertical-align: top;">Your Notes:</td>
                    <td class="detail-val" style="padding: 6px 0; color: #334155; font-size: 13px; font-style: italic; line-height: 1.5;">"${escapeHtml(data.message)}"</td>
                  </tr>`
                : ""
            }
          </table>
        </td>
      </tr>
    </table>

    <!-- Next Steps -->
    <div style="background-color: #ffffff; border-left: 4px solid #2563eb; padding: 16px 20px; margin-bottom: 24px; background: #eff6ff; border-radius: 0 10px 10px 0;">
      <h3 style="margin: 0 0 6px; font-size: 14px; font-weight: 700; color: #1e3a8a;">What Happens Next?</h3>
      <ol style="margin: 0; padding-left: 20px; color: #334155; font-size: 13px; line-height: 1.6;">
        <li>Our regional coordinator will verify your information within <strong>24 to 48 hours</strong>.</li>
        <li>You will receive an orientation schedule and an invitation to join the local chapter WhatsApp community.</li>
        <li>You will be briefed on upcoming weekend teaching drives and classroom activity schedules.</li>
      </ol>
    </div>

    <p style="margin: 0; color: #64748b; font-size: 13px; line-height: 1.6;">
      Warm regards,<br/>
      <strong>Volunteer Engagement Directorate</strong><br/>
      Ghais Jhuggi Taleem Foundation Pakistan
    </p>
  `;

  const html = renderBaseEmailHtml({
    title: subject,
    preheader,
    contentHtml,
    recipientEmail: data.email,
  });

  const text = `
Dear ${data.full_name},

Thank you for applying to volunteer with Ghais Jhuggi Taleem Foundation (GJTF).
Your application for the role of "${roleName}" has been received and is currently under review.

Submitted Details:
- Name: ${data.full_name}
- Role / Chapter: ${roleName}
- City: ${data.city}
${data.university ? `- Institution: ${data.university}\n` : ""}- Phone: ${data.phone}
- Email: ${data.email}
${data.message ? `- Notes: ${data.message}\n` : ""}

What happens next?
1. Our regional coordinator will review your application within 24 to 48 hours.
2. You will receive an orientation schedule and local chapter details.
3. You will be scheduled for your first settlement school drive.

If you have any questions, feel free to reply to this email or call our toll-free helpline at 0800-00823.

Warm regards,
Volunteer Engagement Directorate
Ghais Jhuggi Taleem Foundation (GJTF)
https://gjtfoundation.com
  `.trim();

  return { subject, html, text };
}

// -------------------------------------------------------------
// 2. Volunteer Application Accepted
// -------------------------------------------------------------
export function createVolunteerAcceptedEmail(data: VolunteerData, customNotes?: string) {
  const roleName = formatVolunteerRole(data.type);
  const subject = `Congratulations, ${data.full_name}! Your GJTF Volunteer Application is Approved`;
  const preheader = `Welcome to the GJTF Family! Next steps for your onboarding as ${roleName}.`;

  const contentHtml = `
    <div style="margin-bottom: 24px; text-align: left;">
      <span style="display: inline-block; background-color: #dcfce7; color: #166534; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">
        Application Approved • Welcome Aboard
      </span>
      <h1 style="margin: 0 0 12px; font-size: 24px; font-weight: 800; color: #0b1536; line-height: 1.3;">
        Welcome to the Movement, ${escapeHtml(data.full_name)}!
      </h1>
      <p style="margin: 0; color: #334155; font-size: 15px; line-height: 1.6;">
        We are thrilled to formally welcome you to <strong>Ghais Jhuggi Taleem Foundation (GJTF)</strong> as an approved 
        <strong>${escapeHtml(roleName)}</strong> in <strong>${escapeHtml(data.city)}</strong>.
      </p>
    </div>

    ${
      customNotes
        ? `<div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 18px 20px; margin-bottom: 24px;">
            <strong style="color: #166534; font-size: 13px; display: block; margin-bottom: 4px;">Coordinator Note for You:</strong>
            <p style="margin: 0; color: #14532d; font-size: 14px; line-height: 1.5;">${escapeHtml(customNotes)}</p>
          </div>`
        : ""
    }

    <!-- Onboarding Steps -->
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <h3 style="margin: 0 0 12px; font-size: 15px; font-weight: 700; color: #0b1536;">Your Next Steps</h3>
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding: 8px 0; vertical-align: top; width: 24px;">
            <span style="display: inline-block; width: 20px; height: 20px; background: #2563eb; color: #fff; border-radius: 50%; text-align: center; font-size: 11px; font-weight: bold; line-height: 20px;">1</span>
          </td>
          <td style="padding: 8px 0 8px 12px; color: #334155; font-size: 13px; line-height: 1.5;">
            <strong>WhatsApp Chapter Group:</strong> Our chapter lead will add you to the official ${escapeHtml(data.city)} chapter coordination group.
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; vertical-align: top;">
            <span style="display: inline-block; width: 20px; height: 20px; background: #2563eb; color: #fff; border-radius: 50%; text-align: center; font-size: 11px; font-weight: bold; line-height: 20px;">2</span>
          </td>
          <td style="padding: 8px 0 8px 12px; color: #334155; font-size: 13px; line-height: 1.5;">
            <strong>Volunteer Orientation:</strong> You will attend a 30-minute orientation covering safeguarding protocols and curriculum delivery in nomadic settlements.
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; vertical-align: top;">
            <span style="display: inline-block; width: 20px; height: 20px; background: #2563eb; color: #fff; border-radius: 50%; text-align: center; font-size: 11px; font-weight: bold; line-height: 20px;">3</span>
          </td>
          <td style="padding: 8px 0 8px 12px; color: #334155; font-size: 13px; line-height: 1.5;">
            <strong>Deployment:</strong> Assigned to your first weekend teaching session or community outreach project.
          </td>
        </tr>
      </table>
    </div>

    <!-- CTA -->
    <div style="text-align: center; margin-bottom: 24px;">
      <a href="https://gjtfoundation.com/our-school" class="btn-primary" target="_blank" style="color: #ffffff; text-decoration: none;">
        Explore Our Settlement Schools &rarr;
      </a>
    </div>

    <p style="margin: 0; color: #64748b; font-size: 13px; line-height: 1.6;">
      Together, we are educating thousands of nomadic children who were once left behind.<br/>
      <strong>Welcome to the team!</strong><br/>
      Ghais Jhuggi Taleem Foundation
    </p>
  `;

  const html = renderBaseEmailHtml({
    title: subject,
    preheader,
    contentHtml,
    recipientEmail: data.email,
  });

  const text = `
Dear ${data.full_name},

Congratulations! We are delighted to inform you that your volunteer application for "${roleName}" has been APPROVED.

${customNotes ? `Coordinator Note:\n${customNotes}\n\n` : ""}Next Steps:
1. You will be added to the official ${data.city} Chapter coordination WhatsApp group.
2. You will receive an invite to the online orientation session.
3. You will be matched with a school unit in ${data.city} for upcoming drives.

Thank you for committing your time to educate nomadic children across Pakistan.

Warm regards,
Volunteer Engagement Team
Ghais Jhuggi Taleem Foundation (GJTF)
https://gjtfoundation.com
  `.trim();

  return { subject, html, text };
}

// -------------------------------------------------------------
// 3. Volunteer Application Rejected / Archived
// -------------------------------------------------------------
export function createVolunteerRejectedEmail(data: VolunteerData, reason?: string) {
  const roleName = formatVolunteerRole(data.type);
  const subject = `Update Regarding Your Volunteer Application - GJTF Foundation`;
  const preheader = `Thank you for your application to GJTF Foundation.`;

  const contentHtml = `
    <div style="margin-bottom: 24px;">
      <h1 style="margin: 0 0 12px; font-size: 22px; font-weight: 800; color: #0b1536; line-height: 1.3;">
        Thank You for Your Interest, ${escapeHtml(data.full_name)}
      </h1>
      <p style="margin: 0 0 14px; color: #334155; font-size: 15px; line-height: 1.6;">
        We sincerely appreciate the time and passion you put into applying for the 
        <strong>${escapeHtml(roleName)}</strong> role with Ghais Jhuggi Taleem Foundation.
      </p>
      <p style="margin: 0 0 14px; color: #334155; font-size: 14px; line-height: 1.6;">
        Due to current chapter capacities and specific regional scheduling requirements in <strong>${escapeHtml(data.city)}</strong>, 
        we are unable to proceed with your onboarding for this active cycle.
      </p>
      ${
        reason
          ? `<div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 18px; margin: 18px 0; font-size: 13px; color: #475569;">
              <strong style="color: #0b1536;">Feedback:</strong> ${escapeHtml(reason)}
            </div>`
          : ""
      }
      <p style="margin: 0; color: #334155; font-size: 14px; line-height: 1.6;">
        We have kept your details on file, and we warmly invite you to participate in our open public awareness events, 
        donation campaigns, or reapply in upcoming chapters.
      </p>
    </div>

    <p style="margin: 0; color: #64748b; font-size: 13px; line-height: 1.6;">
      With sincere appreciation for your community spirit,<br/>
      <strong>Volunteer Coordination Team</strong><br/>
      Ghais Jhuggi Taleem Foundation
    </p>
  `;

  const html = renderBaseEmailHtml({
    title: subject,
    preheader,
    contentHtml,
    recipientEmail: data.email,
  });

  const text = `
Dear ${data.full_name},

Thank you for your sincere interest in volunteering with Ghais Jhuggi Taleem Foundation for the role of "${roleName}".

After careful consideration of current chapter capacities in ${data.city}, we are unable to proceed with your application for this cycle.

${reason ? `Feedback:\n${reason}\n\n` : ""}We have kept your information on file and invite you to participate in upcoming public drives and future recruitment cycles.

Thank you again for your dedication to education and service.

Sincerely,
Volunteer Coordination Team
Ghais Jhuggi Taleem Foundation
https://gjtfoundation.com
  `.trim();

  return { subject, html, text };
}

// -------------------------------------------------------------
// 4. Admin Reply to Volunteer
// -------------------------------------------------------------
export function createVolunteerReplyEmail({
  recipientName,
  recipientEmail,
  subject,
  message,
  adminName = "GJTF Volunteer Directorate",
}: {
  recipientName: string;
  recipientEmail: string;
  subject: string;
  message: string;
  adminName?: string;
}) {
  const preheader = `A reply from Ghais Jhuggi Taleem Foundation regarding your inquiry.`;

  const contentHtml = `
    <div style="margin-bottom: 24px;">
      <h1 style="margin: 0 0 12px; font-size: 22px; font-weight: 800; color: #0b1536; line-height: 1.3;">
        Hello, ${escapeHtml(recipientName)}
      </h1>
      <p style="margin: 0 0 18px; color: #475569; font-size: 14px; line-height: 1.5;">
        You have received a direct response from the <strong>Ghais Jhuggi Taleem Foundation</strong> administration:
      </p>

      <!-- Message Container -->
      <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-left: 4px solid #2563eb; border-radius: 8px; padding: 20px; font-size: 14px; color: #1e293b; line-height: 1.7; white-space: pre-wrap;">
        ${escapeHtml(message)}
      </div>
    </div>

    <p style="margin: 0; color: #64748b; font-size: 13px; line-height: 1.6;">
      Warm regards,<br/>
      <strong>${escapeHtml(adminName)}</strong><br/>
      Ghais Jhuggi Taleem Foundation
    </p>
  `;

  const html = renderBaseEmailHtml({
    title: subject,
    preheader,
    contentHtml,
    recipientEmail,
  });

  const text = `
Dear ${recipientName},

You have received a direct message from the Ghais Jhuggi Taleem Foundation administration:

--------------------------------------------------
${message}
--------------------------------------------------

Warm regards,
${adminName}
Ghais Jhuggi Taleem Foundation
https://gjtfoundation.com
  `.trim();

  return { subject, html, text };
}
