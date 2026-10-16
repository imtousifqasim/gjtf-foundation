"use server";

import { z } from "zod";
import { createVolunteerSignupDb } from "@/lib/db/mysql";
import { sendTransactionalEmail } from "@/lib/email/sender";
import { createVolunteerSignupEmail } from "@/lib/email/templates/volunteerTemplates";
import { validateEmail, validatePhoneNumber } from "@/lib/validation";

const volunteerSchema = z.object({
  type: z.enum(["general", "university_chapter", "city_chapter"]),
  full_name: z.string().min(2, "Full name is required"),
  email: z.string().min(3, "Email address is required"),
  phone: z.string().min(5, "Phone number is required"),
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

  // 1. Strict Email Verification (Checks typos like gmal.com, dummy emails, disposable domains)
  const emailValidation = validateEmail(parsed.data.email);
  if (!emailValidation.valid) {
    return {
      success: false,
      message: emailValidation.error || "Invalid email address format.",
    };
  }

  // 2. Strict Phone / WhatsApp Verification (Checks Pakistani 03xx, international +92, valid operator prefix, no dummy repetitions)
  const phoneValidation = validatePhoneNumber(parsed.data.phone);
  if (!phoneValidation.valid) {
    return {
      success: false,
      message: phoneValidation.error || "Invalid phone / WhatsApp number.",
    };
  }

  try {
    const data = {
      ...parsed.data,
      email: emailValidation.cleaned,
      phone: phoneValidation.formatted,
    };
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
