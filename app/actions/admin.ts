"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateDonationStatus(donationId: string, status: "pending" | "completed" | "failed") {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("donations")
      .update({ status })
      .eq("id", donationId);

    if (error) throw error;
    revalidatePath("/admin/donations");
    return { success: true };
  } catch (err: any) {
    console.error("updateDonationStatus error:", err);
    return { success: false, error: err.message };
  }
}

export async function deleteDonation(donationId: string) {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("donations")
      .delete()
      .eq("id", donationId);

    if (error) throw error;
    revalidatePath("/admin/donations");
    return { success: true };
  } catch (err: any) {
    console.error("deleteDonation error:", err);
    return { success: false, error: err.message };
  }
}

export async function updateContactStatus(messageId: string, status: "new" | "read" | "archived") {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("contact_submissions")
      .update({ status })
      .eq("id", messageId);

    if (error) throw error;
    revalidatePath("/admin/contact-messages");
    return { success: true };
  } catch (err: any) {
    console.error("updateContactStatus error:", err);
    return { success: false, error: err.message };
  }
}

export async function deleteContactMessage(messageId: string) {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("contact_submissions")
      .delete()
      .eq("id", messageId);

    if (error) throw error;
    revalidatePath("/admin/contact-messages");
    return { success: true };
  } catch (err: any) {
    console.error("deleteContactMessage error:", err);
    return { success: false, error: err.message };
  }
}

export async function updateVolunteerStatus(signupId: string, status: "new" | "contacted" | "archived") {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("volunteer_signups")
      .update({ status })
      .eq("id", signupId);

    if (error) throw error;
    revalidatePath("/admin/volunteer-signups");
    return { success: true };
  } catch (err: any) {
    console.error("updateVolunteerStatus error:", err);
    return { success: false, error: err.message };
  }
}

export async function deleteVolunteerSignup(signupId: string) {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("volunteer_signups")
      .delete()
      .eq("id", signupId);

    if (error) throw error;
    revalidatePath("/admin/volunteer-signups");
    return { success: true };
  } catch (err: any) {
    console.error("deleteVolunteerSignup error:", err);
    return { success: false, error: err.message };
  }
}

export async function saveSchool(schoolData: any) {
  try {
    const supabase = createAdminClient();
    const payload = {
      id: schoolData.id,
      slug: schoolData.slug,
      name: schoolData.name,
      campus_type: schoolData.campusType || schoolData.campus_type || "Primary",
      shift: schoolData.shift || "Morning",
      city: schoolData.city || "Karachi",
      province: schoolData.province || "Punjab",
      area_sq_ft: Number(schoolData.areaSqFt ?? schoolData.area_sq_ft ?? 0),
      classrooms: Number(schoolData.classrooms ?? 0),
      student_capacity: Number(schoolData.studentCapacity ?? schoolData.student_capacity ?? 0),
      current_students: Number(schoolData.currentStudents ?? schoolData.current_students ?? 0),
      established_year: Number(schoolData.establishedYear ?? schoolData.established_year ?? 2024),
      description: schoolData.description || "",
      facilities: Array.isArray(schoolData.facilities) ? schoolData.facilities : [],
      card_image: schoolData.cardImage || schoolData.card_image || "",
      hero_image: schoolData.heroImage || schoolData.hero_image || schoolData.cardImage || schoolData.card_image || "",
      gallery_images: Array.isArray(schoolData.galleryImages)
        ? schoolData.galleryImages
        : Array.isArray(schoolData.gallery_images)
        ? schoolData.gallery_images
        : [],
      featured: Boolean(schoolData.featured),
    };

    const { error } = await supabase
      .from("schools")
      .upsert(payload as any, { onConflict: "id" });

    if (error) {
      console.error("Supabase saveSchool error:", error);
    }
    revalidatePath("/admin/schools");
    revalidatePath("/our-school");
    return { success: !error, error: error?.message };
  } catch (err: any) {
    console.error("saveSchool error:", err);
    return { success: false, error: err.message };
  }
}

export async function deleteSchool(schoolId: string) {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("schools")
      .delete()
      .eq("id", schoolId);

    if (error) throw error;
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
    const supabase = createAdminClient();
    const payload = {
      id: storyData.id,
      slug: storyData.slug,
      title: storyData.title,
      category: storyData.category || "Success Stories",
      excerpt: storyData.excerpt || "",
      body: Array.isArray(storyData.content) ? storyData.content.join("\n\n") : (storyData.body || ""),
      cover_image_url: storyData.coverImage || storyData.cover_image_url || "",
      author_name: storyData.author?.name || storyData.author_name || "GJTF Editorial",
      author_role: storyData.author?.role || storyData.author_role || "Communications",
    };

    const { error } = await supabase
      .from("stories")
      .upsert(payload as any, { onConflict: "id" });

    if (error) {
      console.error("Supabase saveStory error:", error);
    }
    revalidatePath("/admin/stories");
    revalidatePath("/news-stories");
    return { success: !error, error: error?.message };
  } catch (err: any) {
    console.error("saveStory error:", err);
    return { success: false, error: err.message };
  }
}

export async function deleteStory(storyId: string) {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("stories")
      .delete()
      .eq("id", storyId);

    if (error) throw error;
    revalidatePath("/admin/stories");
    revalidatePath("/news-stories");
    return { success: true };
  } catch (err: any) {
    console.error("deleteStory error:", err);
    return { success: false, error: err.message };
  }
}
