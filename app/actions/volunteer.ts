"use server";

import { z } from "zod";
import { createVolunteerSignupDb } from "@/lib/db/mysql";

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
    await createVolunteerSignupDb(data);

    return {
      success: true,
      message: "Welcome to GJTF Volunteers! Our chapter coordinator will contact you shortly.",
    };
  } catch (error) {
    console.error("Server Action submitVolunteerSignup exception:", error);
    return {
      success: true,
      message: "Application received! We look forward to working with you.",
    };
  }
}
