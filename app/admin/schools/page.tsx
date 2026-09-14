"use client";

import * as React from "react";
import Image from "next/image";
import {
  School as SchoolIcon,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  Save,
  X,
  MapPin,
  Users,
  BookOpen,
  Calendar,
  Image as ImageIcon,
  Layers,
  Sparkles,
} from "lucide-react";
import { schools as initialSchools, School } from "@/data/schools";
import { saveSchool, deleteSchool } from "@/app/actions/admin";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

export default function AdminSchoolsPage() {
  const [schoolsList, setSchoolsList] = React.useState<School[]>(initialSchools);
  const [editingSchool, setEditingSchool] = React.useState<Partial<School> | null>(null);
  const [facilitiesInput, setFacilitiesInput] = React.useState("");
  const [galleryInput, setGalleryInput] = React.useState("");
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  // Fetch live schools from Supabase on mount
  React.useEffect(() => {
    async function loadSchools() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("schools")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) {
          const mapped: School[] = data.map((s: any) => ({
            id: s.id,
            slug: s.slug,
            name: s.name,
            campusType: (s.campus_type || "Primary") as any,
            shift: (s.shift || "Morning") as any,
            city: s.city || "",
            province: (s.province || "Punjab") as any,
            areaSqFt: s.area_sq_ft || 0,
            classrooms: s.classrooms || 0,
            studentCapacity: s.student_capacity || 0,
            currentStudents: s.current_students || 0,
            establishedYear: s.established_year || 2024,
            description: s.description || "",
            facilities: Array.isArray(s.facilities) ? s.facilities : [],
            cardImage: s.card_image || "",
            heroImage: s.hero_image || s.card_image || "",
            galleryImages: Array.isArray(s.gallery_images) ? s.gallery_images : [],
            featured: Boolean(s.featured),
            coordinates: { lat: 31.5204, lng: 74.3587 },
          }));
          setSchoolsList(mapped);
        }
      } catch (err) {
        console.error("Error loading schools from Supabase:", err);
      }
    }
    loadSchools();
  }, []);

  const handleOpenNew = () => {
    setEditingSchool({
      id: "sch-" + Date.now(),
      slug: "",
      name: "",
      campusType: "Primary",
      shift: "Morning",
      city: "",
      province: "Punjab",
      areaSqFt: 6500,
      classrooms: 6,
      studentCapacity: 180,
      currentStudents: 150,
      establishedYear: 2024,
      description: "",
      facilities: ["Airy Classrooms", "Filtered Drinking Water", "Enclosed Playground", "Digital Tablet Corner"],
      cardImage: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=900&auto=format&fit=crop",
      heroImage: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=1800&auto=format&fit=crop",
      galleryImages: [],
      featured: false,
      coordinates: { lat: 31.5204, lng: 74.3587 },
    });
    setFacilitiesInput("Airy Classrooms, Filtered Drinking Water, Enclosed Playground, Digital Tablet Corner");
    setGalleryInput("");
    setIsModalOpen(true);
  };

  const handleEdit = (school: School) => {
    setEditingSchool({ ...school });
    setFacilitiesInput((school.facilities || []).join(", "));
    setGalleryInput((school.galleryImages || []).join("\n"));
    setIsModalOpen(true);
  };

  const [schoolToDelete, setSchoolToDelete] = React.useState<string | null>(null);

  const confirmDeleteSchool = async () => {
    if (!schoolToDelete) return;
    await deleteSchool(schoolToDelete);
    setSchoolsList((prev) => prev.filter((s) => s.id !== schoolToDelete));
    setSchoolToDelete(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchool || !editingSchool.name) return;

    setSaving(true);
    const slug =
      editingSchool.slug ||
      editingSchool.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const facilitiesArray = facilitiesInput
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const galleryArray = galleryInput
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    const fullSchool: School = {
      ...(editingSchool as School),
      slug,
      classrooms: Number(editingSchool.classrooms) || 0,
      currentStudents: Number(editingSchool.currentStudents) || 0,
      studentCapacity: Number(editingSchool.studentCapacity) || 0,
      establishedYear: Number(editingSchool.establishedYear) || 2024,
      areaSqFt: Number(editingSchool.areaSqFt) || 0,
      cardImage: editingSchool.cardImage || "https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=900",
      heroImage: editingSchool.heroImage || editingSchool.cardImage || "https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=1800",
      facilities: facilitiesArray.length > 0 ? facilitiesArray : ["Classrooms", "Drinking Water"],
      galleryImages: galleryArray,
    };

    await saveSchool(fullSchool);

    setSchoolsList((prev) => {
      const idx = prev.findIndex((s) => s.id === fullSchool.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = fullSchool;
        return copy;
      }
      return [fullSchool, ...prev];
    });

    setSaving(false);
    setIsModalOpen(false);
    setEditingSchool(null);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 tracking-tight">
            Schools Directory CMS
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Manage school campus profiles, enrolled students, classrooms, specifications, and photo galleries.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleOpenNew}
          className="gap-2 px-5 py-2.5 font-bold self-start sm:self-auto shadow-sm rounded-xl hover:shadow"
        >
          <Plus className="w-4 h-4" /> Add New Campus
        </Button>
      </div>

      {/* Grid of schools */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {schoolsList.map((school) => (
          <div
            key={school.id}
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div>
              <div className="relative aspect-[16/9] w-full bg-slate-100">
                <Image
                  src={school.cardImage || "https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=900"}
                  alt={school.name}
                  fill
                  className="object-cover"
                />
                <div className="absolute top-3 left-3 flex gap-1.5">
                  <Badge variant="default" className="text-[10px] font-semibold bg-primary-700 text-white">
                    {school.campusType}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px] font-semibold bg-white/95 text-slate-800 backdrop-blur-sm">
                    {school.shift} Shift
                  </Badge>
                </div>
              </div>

              <div className="p-5 space-y-3">
                <div>
                  <h3 className="font-bold font-heading text-lg text-slate-900 line-clamp-1">
                    {school.name}
                  </h3>
                  <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-primary-600 shrink-0" />
                    <span>{school.city}, {school.province}</span>
                  </div>
                </div>

                {/* Specs Pill Summary */}
                <div className="grid grid-cols-2 gap-2 py-2 px-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-primary-600" />
                    <span className="font-medium">{school.classrooms} Classrooms</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="font-medium">{school.currentStudents} Students</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2">
                  {school.description}
                </p>

                {/* Facilities Tags preview */}
                {school.facilities && school.facilities.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {school.facilities.slice(0, 3).map((f, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium"
                      >
                        {f}
                      </span>
                    ))}
                    {school.facilities.length > 3 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">
                        +{school.facilities.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <a
                href={`/school/${school.slug}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-primary-700 hover:underline flex items-center gap-1"
              >
                <ExternalLink className="w-3.5 h-3.5" /> View Live
              </a>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(school)}
                  className="h-8 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-200/70"
                >
                  <Edit2 className="w-3.5 h-3.5 mr-1 text-primary-600" /> Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSchoolToDelete(school.id)}
                  className="h-8 px-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                  title="Delete School"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit / Create Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        {editingSchool && (
          <form onSubmit={handleSave} className="space-y-5">
            <DialogHeader>
              <DialogTitle className="text-xl font-heading font-extrabold text-slate-900">
                {editingSchool.name ? `Edit: ${editingSchool.name}` : "Create New Campus"}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Configure campus images, student enrollment, classroom specifications, facilities, and photo gallery.
              </DialogDescription>
            </DialogHeader>

            {/* Section 1: Basic Information */}
            <div className="space-y-3 bg-slate-50/60 p-4 rounded-2xl border border-slate-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary-800 flex items-center gap-1.5">
                <SchoolIcon className="w-4 h-4 text-primary-600" /> Basic Campus Information
              </h4>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Campus Name *
                </label>
                <Input
                  required
                  value={editingSchool.name || ""}
                  onChange={(e) =>
                    setEditingSchool({ ...editingSchool, name: e.target.value })
                  }
                  placeholder="e.g. Faisalabad Settlement Learning Campus"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    City *
                  </label>
                  <Input
                    required
                    value={editingSchool.city || ""}
                    onChange={(e) =>
                      setEditingSchool({ ...editingSchool, city: e.target.value })
                    }
                    placeholder="e.g. Karachi, Lahore, Faisalabad"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Province *
                  </label>
                  <select
                    value={editingSchool.province || "Punjab"}
                    onChange={(e) =>
                      setEditingSchool({ ...editingSchool, province: e.target.value as any })
                    }
                    className="w-full h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="Punjab">Punjab</option>
                    <option value="Sindh">Sindh</option>
                    <option value="Khyber Pakhtunkhwa">Khyber Pakhtunkhwa</option>
                    <option value="Balochistan">Balochistan</option>
                    <option value="Islamabad">Islamabad</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Campus Type *
                  </label>
                  <select
                    value={editingSchool.campusType || "Primary"}
                    onChange={(e) =>
                      setEditingSchool({ ...editingSchool, campusType: e.target.value as any })
                    }
                    className="w-full h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="Primary">Primary Campus</option>
                    <option value="Secondary">Secondary Campus</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Shift *
                  </label>
                  <select
                    value={editingSchool.shift || "Morning"}
                    onChange={(e) =>
                      setEditingSchool({ ...editingSchool, shift: e.target.value as any })
                    }
                    className="w-full h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="Morning">Morning Shift</option>
                    <option value="Afternoon">Afternoon Shift</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description *
                </label>
                <Textarea
                  required
                  rows={2}
                  value={editingSchool.description || ""}
                  onChange={(e) =>
                    setEditingSchool({ ...editingSchool, description: e.target.value })
                  }
                  placeholder="Detailed campus description and impact in the local settlement..."
                />
              </div>
            </div>

            {/* Section 2: Specifications & Enrolled Students */}
            <div className="space-y-3 bg-slate-50/60 p-4 rounded-2xl border border-slate-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary-800 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-primary-600" /> School Specifications & Enrollment
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Enrolled Students *
                  </label>
                  <Input
                    type="number"
                    min="0"
                    required
                    value={editingSchool.currentStudents ?? 0}
                    onChange={(e) =>
                      setEditingSchool({ ...editingSchool, currentStudents: Number(e.target.value) })
                    }
                    placeholder="e.g. 172"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Student Capacity *
                  </label>
                  <Input
                    type="number"
                    min="0"
                    required
                    value={editingSchool.studentCapacity ?? 0}
                    onChange={(e) =>
                      setEditingSchool({ ...editingSchool, studentCapacity: Number(e.target.value) })
                    }
                    placeholder="e.g. 200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Classrooms *
                  </label>
                  <Input
                    type="number"
                    min="1"
                    required
                    value={editingSchool.classrooms ?? 1}
                    onChange={(e) =>
                      setEditingSchool({ ...editingSchool, classrooms: Number(e.target.value) })
                    }
                    placeholder="e.g. 6"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Established Year
                  </label>
                  <Input
                    type="number"
                    min="2014"
                    max="2030"
                    value={editingSchool.establishedYear ?? 2024}
                    onChange={(e) =>
                      setEditingSchool({ ...editingSchool, establishedYear: Number(e.target.value) })
                    }
                    placeholder="e.g. 2017"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Area (Sq Ft)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={editingSchool.areaSqFt ?? 0}
                    onChange={(e) =>
                      setEditingSchool({ ...editingSchool, areaSqFt: Number(e.target.value) })
                    }
                    placeholder="e.g. 6500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Campus Facilities (comma separated)
                </label>
                <Input
                  value={facilitiesInput}
                  onChange={(e) => setFacilitiesInput(e.target.value)}
                  placeholder="e.g. Airy Classrooms, Solar Power, Digital Tablet Lab, Filtered Drinking Water, Playground"
                />
                <span className="text-[11px] text-slate-500">
                  Separate each facility with a comma.
                </span>
              </div>
            </div>

            {/* Section 3: Campus Images & Photo Gallery */}
            <div className="space-y-3 bg-slate-50/60 p-4 rounded-2xl border border-slate-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary-800 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-primary-600" /> Campus Images & Gallery
              </h4>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Main Card Image URL *
                </label>
                <Input
                  required
                  value={editingSchool.cardImage || ""}
                  onChange={(e) =>
                    setEditingSchool({ ...editingSchool, cardImage: e.target.value })
                  }
                  placeholder="https://images.unsplash.com/... or /images/..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hero Banner Image URL (Optional)
                </label>
                <Input
                  value={editingSchool.heroImage || ""}
                  onChange={(e) =>
                    setEditingSchool({ ...editingSchool, heroImage: e.target.value })
                  }
                  placeholder="https://images.unsplash.com/... (if empty, uses card image)"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Campus Photo Gallery URLs (one URL per line)
                </label>
                <Textarea
                  rows={3}
                  value={galleryInput}
                  onChange={(e) => setGalleryInput(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-1...&#10;https://images.unsplash.com/photo-2..."
                />
                <span className="text-[11px] text-slate-500">
                  Paste one image URL per line. These images will be featured in the school gallery.
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border-slate-300 rounded-xl w-auto shrink-0"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="gap-2 px-6 py-2.5 text-xs sm:text-sm font-bold shadow-sm rounded-xl w-auto shrink-0"
                disabled={saving}
              >
                <Save className="w-4 h-4" />
                {saving ? "Saving to Database..." : "Save Campus"}
              </Button>
            </div>
          </form>
        )}
      </Dialog>

      {/* Modern Custom Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(schoolToDelete)}
        onOpenChange={(open) => !open && setSchoolToDelete(null)}
        title="Delete School Campus?"
        description="Are you sure you want to permanently delete this school campus? This action cannot be undone and will remove it from both the public directory and the admin panel."
        onConfirm={confirmDeleteSchool}
      />
    </div>
  );
}
