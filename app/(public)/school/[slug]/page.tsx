import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  MapPin,
  BookOpen,
  Users,
  Calendar,
  CheckCircle2,
  Heart,
  ArrowLeft,
  School as SchoolIcon,
  Maximize2,
} from "lucide-react";
import { schools, getSchoolBySlug, School } from "@/data/schools";
import { createAdminClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return schools.map((school) => ({
    slug: school.slug,
  }));
}

export default async function SchoolDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // 1. Try live database fetch from Supabase
  let school: School | undefined;
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("schools")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (data) {
      school = {
        id: data.id,
        slug: data.slug,
        name: data.name,
        campusType: (data.campus_type || "Primary") as any,
        shift: (data.shift || "Morning") as any,
        city: data.city || "",
        province: (data.province || "Punjab") as any,
        areaSqFt: data.area_sq_ft || 0,
        classrooms: data.classrooms || 0,
        studentCapacity: data.student_capacity || 0,
        currentStudents: data.current_students || 0,
        establishedYear: data.established_year || 2024,
        description: data.description || "",
        facilities: Array.isArray(data.facilities) ? data.facilities : [],
        cardImage: data.card_image || "https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=900",
        heroImage: data.hero_image || data.card_image || "https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=1800",
        galleryImages: Array.isArray(data.gallery_images) ? data.gallery_images : [],
        featured: Boolean(data.featured),
        coordinates: { lat: 31.5204, lng: 74.3587 },
      };
    }
  } catch (err) {
    // Continue to fallback
  }

  // 2. Fallback to local schools dataset
  if (!school) {
    school = getSchoolBySlug(slug);
  }

  if (!school) {
    notFound();
  }

  return (
    <div className="space-y-16 md:space-y-24 pb-20">
      {/* Hero Header */}
      <section className="relative min-h-[50vh] lg:min-h-[60vh] flex items-end overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src={school.heroImage}
            alt={school.name}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal-deep via-charcoal-deep/60 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-white w-full space-y-4">
          <Link
            href="/our-school"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent-300 hover:text-white transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to All Schools
          </Link>

          <div className="flex flex-wrap gap-2">
            <Badge variant="default" className="bg-primary-600 text-white border-0 text-xs">
              {school.campusType} School
            </Badge>
            <Badge variant="secondary" className="bg-white/90 text-charcoal border-0 text-xs">
              {school.shift} Shift
            </Badge>
            <Badge variant="accent" className="bg-accent-600 text-white border-0 text-xs">
              Established {school.establishedYear}
            </Badge>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-heading text-white tracking-tight">
            {school.name}
          </h1>

          <div className="flex items-center gap-2 text-sm sm:text-base text-white/90 font-medium">
            <MapPin className="w-4 h-4 text-accent-400" />
            <span>{school.city}, {school.province}, Pakistan</span>
          </div>
        </div>
      </section>

      {/* Main Specs and Overview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left: Description & Facilities & Gallery */}
          <div className="lg:col-span-8 space-y-12">
            <div>
              <h2 className="text-2xl font-bold font-heading text-charcoal-deep mb-4">
                Campus Overview
              </h2>
              <p className="text-base sm:text-lg text-charcoal-muted leading-relaxed">
                {school.description}
              </p>
            </div>

            {/* Key Facilities */}
            <div>
              <h2 className="text-2xl font-bold font-heading text-charcoal-deep mb-4">
                Campus Facilities
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {school.facilities.map((facility, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-warm-200 shadow-sm"
                  >
                    <CheckCircle2 className="w-5 h-5 text-primary-600 shrink-0" />
                    <span className="text-sm font-medium text-charcoal-deep">{facility}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Photo Gallery */}
            {school.galleryImages && school.galleryImages.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold font-heading text-charcoal-deep mb-4">
                  Campus Photo Gallery
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {school.galleryImages.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-[16/11] rounded-3xl overflow-hidden bg-warm-100 shadow-soft"
                    >
                      <Image
                        src={imgUrl}
                        alt={`${school.name} gallery image ${idx + 1}`}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar: Key Specs & Donate CTA */}
          <div className="lg:col-span-4 space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-warm-200 shadow-soft space-y-6 sticky top-28">
              <h3 className="text-xl font-bold font-heading text-charcoal-deep pb-4 border-b border-warm-200">
                School Specifications
              </h3>

              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-charcoal-muted flex items-center gap-2">
                    <Maximize2 className="w-4 h-4 text-primary-600" /> Plot Area
                  </span>
                  <span className="font-bold text-charcoal-deep">~{school.areaSqFt.toLocaleString()} sq ft</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-charcoal-muted flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary-600" /> Classrooms
                  </span>
                  <span className="font-bold text-charcoal-deep">{school.classrooms} units</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-charcoal-muted flex items-center gap-2">
                    <Users className="w-4 h-4 text-accent-600" /> Enrolled Students
                  </span>
                  <span className="font-bold text-accent-700">{school.currentStudents} students</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-charcoal-muted flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary-600" /> Established
                  </span>
                  <span className="font-bold text-charcoal-deep">{school.establishedYear}</span>
                </div>
              </div>

              {/* Support this school */}
              <div className="pt-6 border-t border-warm-200 space-y-4">
                <div className="bg-primary-50 rounded-2xl p-4 text-xs text-primary-900 leading-relaxed">
                  Support the operational expenses, learning tablets, and teacher salaries for this landmark campus.
                </div>

                <Link href={`/donate-now?cause=Support%20a%20Classroom`} className="block w-full">
                  <Button variant="primary" size="lg" className="w-full font-bold shadow-sm rounded-xl">
                    <Heart className="w-4 h-4 fill-white mr-2" />
                    Support this School
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
