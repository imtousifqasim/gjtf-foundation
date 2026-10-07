"use server";

import { revalidatePath } from "next/cache";
import {
  updateDonationStatusDb,
  deleteDonationDb,
  updateContactStatusDb,
  deleteContactMessageDb,
  updateVolunteerStatusDb,
  deleteVolunteerSignupDb,
  saveSchoolDb,
  deleteSchoolDb,
  saveStoryDb,
  deleteStoryDb,
} from "@/lib/db/mysql";

export async function updateDonationStatus(donationId: string, status: "pending" | "completed" | "failed") {
  try {
    await updateDonationStatusDb(donationId, status);
    revalidatePath("/admin/donations");
    return { success: true };
  } catch (err: any) {
    console.error("updateDonationStatus error:", err);
    return { success: false, error: err.message };
  }
}

export async function deleteDonation(donationId: string) {
  try {
    await deleteDonationDb(donationId);
    revalidatePath("/admin/donations");
    return { success: true };
  } catch (err: any) {
    console.error("deleteDonation error:", err);
    return { success: false, error: err.message };
  }
}

export async function updateContactStatus(messageId: string, status: "new" | "read" | "archived") {
  try {
    await updateContactStatusDb(messageId, status);
    revalidatePath("/admin/contact-messages");
    return { success: true };
  } catch (err: any) {
    console.error("updateContactStatus error:", err);
    return { success: false, error: err.message };
  }
}

export async function deleteContactMessage(messageId: string) {
  try {
    await deleteContactMessageDb(messageId);
    revalidatePath("/admin/contact-messages");
    return { success: true };
  } catch (err: any) {
    console.error("deleteContactMessage error:", err);
    return { success: false, error: err.message };
  }
}

export async function updateVolunteerStatus(signupId: string, status: "new" | "contacted" | "archived") {
  try {
    await updateVolunteerStatusDb(signupId, status);
    revalidatePath("/admin/volunteer-signups");
    return { success: true };
  } catch (err: any) {
    console.error("updateVolunteerStatus error:", err);
    return { success: false, error: err.message };
  }
}

export async function deleteVolunteerSignup(signupId: string) {
  try {
    await deleteVolunteerSignupDb(signupId);
    revalidatePath("/admin/volunteer-signups");
    return { success: true };
  } catch (err: any) {
    console.error("deleteVolunteerSignup error:", err);
    return { success: false, error: err.message };
  }
}

export async function saveSchool(schoolData: any) {
  try {
    await saveSchoolDb(schoolData);
    revalidatePath("/admin/schools");
    revalidatePath("/our-school");
    return { success: true };
  } catch (err: any) {
    console.error("saveSchool error:", err);
    return { success: false, error: err.message };
  }
}

export async function deleteSchool(schoolId: string) {
  try {
    await deleteSchoolDb(schoolId);
    revalidatePath("/admin/schools");
    revalidatePath("/our-school");
    return { success: true };
  } catch (err: any) {
    console.error("deleteSchool error:", err);
    return { success: false, error: err.message };
  }
}

export async function saveStory(storyData: any) {
  try {
    await saveStoryDb(storyData);
    revalidatePath("/admin/stories");
    revalidatePath("/news-stories");
    return { success: true };
  } catch (err: any) {
    console.error("saveStory error:", err);
    return { success: false, error: err.message };
  }
}

export async function deleteStory(storyId: string) {
  try {
    await deleteStoryDb(storyId);
    revalidatePath("/admin/stories");
    revalidatePath("/news-stories");
    return { success: true };
  } catch (err: any) {
    console.error("deleteStory error:", err);
    return { success: false, error: err.message };
  }
}
