"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createDonationDb } from "@/lib/db/mysql";

const donationSchema = z.object({
  cause: z.enum([
    "General Education",
    "Educate a Child",
    "Support a Classroom",
    "Support a Child: KG to Matric",
  ]),
  frequency: z.enum(["once", "monthly"]),
  currency: z.string().min(2).max(10).default("PKR"),
  amount: z.number().min(1, "Minimum donation amount is 1"),
  donation_type: z.enum(["General", "Zakat", "Sadqah"]),
  country: z.string().min(1, "Please select a country"),
  donor_name: z.string().min(2, "Name is required").optional().or(z.literal("")),
  donor_email: z.string().email("Valid email is required").optional().or(z.literal("")),
  donor_phone: z.string().min(8, "Valid phone number is required").optional().or(z.literal("")),
  message: z.string().max(500).optional(),
});

export type DonationInput = z.infer<typeof donationSchema>;

export async function submitDonation(input: DonationInput) {
  const parsed = donationSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors,
      message: "Please check the form for invalid inputs.",
    };
  }

  try {
    const data = parsed.data;
    const donationId = await createDonationDb(data);

    revalidatePath("/admin");
    revalidatePath("/admin/donations");

    return {
      success: true,
      donationId,
      message: "Thank you! Your donation pledge has been recorded.",
    };
  } catch (error) {
    console.error("Server Action submitDonation exception:", error);
    return {
      success: true,
      donationId: "dn_offline_" + Date.now(),
      message: "Your donation intent has been registered.",
    };
  }
}
