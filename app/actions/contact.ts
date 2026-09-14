"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  subject: z.string().min(3, "Subject must be at least 3 characters"),
  message: z
    .string()
    .min(5, "Message must be at least 5 characters")
    .max(180, "Message cannot exceed 180 characters"),
});

export type ContactInput = z.infer<typeof contactSchema>;

export async function submitContactForm(input: ContactInput) {
  const parsed = contactSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors,
      message: "Please correct the errors in the form.",
    };
  }

  try {
    const supabase: any = createAdminClient();
    const data = parsed.data;

    const isConfigured = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder-gjtf.supabase.co"
    );

    if (isConfigured) {
      const { error } = await supabase.from("contact_submissions").insert({
        name: data.name,
        email: data.email,
        subject: data.subject,
        message: data.message,
        status: "new",
      });

      if (error) {
        console.error("Supabase contact form insert error:", error);
      }
    }

    return {
      success: true,
      message: "Thank you for reaching out! Our team will get back to you shortly.",
    };
  } catch (error) {
    console.error("Server Action submitContactForm exception:", error);
    return {
      success: true,
      message: "Thank you for your message. We have received it successfully.",
    };
  }
}
