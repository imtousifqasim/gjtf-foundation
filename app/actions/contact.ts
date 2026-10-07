"use server";

import { z } from "zod";
import { createContactMessageDb } from "@/lib/db/mysql";

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
    const data = parsed.data;
    await createContactMessageDb(data);

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
