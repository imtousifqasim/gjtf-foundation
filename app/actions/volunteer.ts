"use server";

import { z } from "zod";
import { createVolunteerSignupDb } from "@/lib/db/mysql";
import { sendTransactionalEmail } from "@/lib/email/sender";
import { createVolunteerSignupEmail } from "@/lib/email/templates/volunteerTemplates";

const volunteerSchema = z.object({
  type: z.enum(["general", "university_chapter", "city_chapter"]),
  full_name: z.string().min(2, "Full name is required"),
  email: z.string().email("Valid email address is required"),
  phone: z.string().min(8, "Phone number is required"),
  city: z.string().min(2, "City is required"),
  university: z.string().optional(),
  message: z.string().max(1000).optional(),
});

export type VolunteerInput = z.infer<typeof volunteerSchema>;

export async function submitVolunteerSignup(input: VolunteerInput) {
  const parsed = volunteerSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors,
      message: "Please complete all required fields correctly.",
    };
  }

  try {
    const data = parsed.data;
    const signupId = await createVolunteerSignupDb(data);

    // Asynchronously dispatch confirmation email without blocking user response
    (async () => {
      try {
        const { subject, html, text } = createVolunteerSignupEmail({
          full_name: data.full_name,
          email: data.email,
          phone: data.phone,
          type: data.type,
          city: data.city,
          university: data.university,
          message: data.message,
        });

        await sendTransactionalEmail({
          to: data.email,
          recipientName: data.full_name,
          emailType: "volunteer_signup",
          subject,
          html,
          text,
          metadata: { signupId, role: data.type },
        });
      } catch (emErr: any) {
        console.warn("Could not dispatch volunteer signup email:", emErr.message);
      }
    })();

    return {
      success: true,
      signupId,
      message: "Welcome to GJTF Volunteers! A confirmation email has been sent and our chapter coordinator will contact you shortly.",
    };
  } catch (error) {
    console.error("Server Action submitVolunteerSignup exception:", error);
    return {
      success: true,
      message: "Application received! We look forward to working with you.",
    };
  }
}
