"use client";

import * as React from "react";
import {
  Users,
  Search,
  CheckCircle2,
  Archive,
  Phone,
  Mail,
  Building,
  Eye,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { updateVolunteerStatus, deleteVolunteerSignup } from "@/app/actions/admin";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

interface VolunteerRecord {
  id: string;
  created_at: string;
  type: "general" | "university_chapter" | "city_chapter";
  full_name: string;
  email: string;
  phone: string;
  city: string;
  university: string | null;
  message: string | null;
  status: "new" | "contacted" | "archived";
}

const INITIAL_SIGNUPS: VolunteerRecord[] = [
  {
    id: "vol-1",
    created_at: "2025-02-14T09:20:00Z",
    type: "city_chapter",
    full_name: "Saad Farooq",
    email: "saad.farooq@example.com",
    phone: "0300-5544332",
    city: "Karachi",
    university: "IBA Karachi",
    message: "I have 3 years experience leading youth debate societies and wish to lead the Karachi City Chapter.",
    status: "new",
  },
  {
    id: "vol-2",
    created_at: "2025-02-13T18:00:00Z",
    type: "university_chapter",
    full_name: "Hira Mansoor",
    email: "hira.m@lums.edu.pk",
    phone: "0322-8877665",
    city: "Lahore",
    university: "LUMS",
    message: "We have established a 12-member student group wishing to register GJTF society on campus.",
    status: "new",
  },
  {
    id: "vol-3",
    created_at: "2025-02-12T15:40:00Z",
    type: "general",
    full_name: "Maryam Tariq",
    email: "maryam.t@example.com",
    phone: "0333-1122334",
    city: "Faisalabad",
    university: null,
    message: "I am a high school math teacher available for Saturday morning teaching drives.",
    status: "contacted",
  },
];

export default function AdminVolunteerSignupsPage() {
  const [signups, setSignups] = React.useState<VolunteerRecord[]>(INITIAL_SIGNUPS);
  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<string>("All");
  const [selectedVolunteer, setSelectedVolunteer] = React.useState<VolunteerRecord | null>(null);

  React.useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("volunteer_signups")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) {
          setSignups(data as any);
        }
      } catch (err) {
        console.error("Supabase load error:", err);
      }
    }
    loadData();
  }, []);

  const handleStatusChange = async (newStatus: "new" | "contacted" | "archived") => {
    if (!selectedVolunteer) return;
    await updateVolunteerStatus(selectedVolunteer.id, newStatus);
    setSignups((prev) =>
      prev.map((v) =>
        v.id === selectedVolunteer.id ? { ...v, status: newStatus } : v
      )
    );
    setSelectedVolunteer((prev) => (prev ? { ...prev, status: newStatus } : null));
  };

  const [volunteerToDelete, setVolunteerToDelete] = React.useState<string | null>(null);

  const confirmDeleteVolunteer = async () => {
    if (!volunteerToDelete) return;
    await deleteVolunteerSignup(volunteerToDelete);
    setSignups((prev) => prev.filter((v) => v.id !== volunteerToDelete));
    if (selectedVolunteer?.id === volunteerToDelete) {
      setSelectedVolunteer(null);
    }
    setVolunteerToDelete(null);
  };

  const filtered = signups.filter((v) => {
    const matchesSearch =
      v.full_name.toLowerCase().includes(search.toLowerCase()) ||
      v.email.toLowerCase().includes(search.toLowerCase()) ||
      v.city.toLowerCase().includes(search.toLowerCase());

    const matchesType = typeFilter === "All" || v.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 tracking-tight">
            Volunteer Applications
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Review candidate applications for General, University, and City Chapter roles.
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
          <Input
            placeholder="Search by volunteer name, city, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 text-sm border-slate-200 text-slate-900"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="All">All Volunteer Types</option>
          <option value="general">General Volunteer</option>
          <option value="university_chapter">University Chapter</option>
          <option value="city_chapter">City Chapter Lead</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Applicant</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>City & Campus</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length > 0 ? (
              filtered.map((vol) => (
                <TableRow
                  key={vol.id}
                  className="cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setSelectedVolunteer(vol)}
                >
                  <TableCell className="text-xs font-medium text-slate-500 whitespace-nowrap">
                    {new Date(vol.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="font-bold text-sm text-slate-900">{vol.full_name}</div>
                    <div className="text-xs text-slate-500">{vol.email}</div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        vol.type === "city_chapter"
                          ? "accent"
                          : vol.type === "university_chapter"
                          ? "default"
                          : "secondary"
                      }
                      className="text-[10px] uppercase"
                    >
                      {vol.type.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-medium text-slate-700">
                    {vol.city}
                    {vol.university ? ` • ${vol.university}` : ""}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        vol.status === "new"
                          ? "accent"
                          : vol.status === "contacted"
                          ? "success"
                          : "outline"
                      }
                      className="text-[10px] capitalize"
                    >
                      {vol.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedVolunteer(vol)}
                        className="h-8 px-2.5 text-xs font-semibold text-primary-700 border-slate-200 hover:bg-primary-50"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" /> View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setVolunteerToDelete(vol.id)}
                        className="h-8 px-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                        title="Delete Application"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                  No volunteer sign-ups found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail Dialog */}
      <Dialog
        open={Boolean(selectedVolunteer)}
        onOpenChange={(open) => !open && setSelectedVolunteer(null)}
      >
        {selectedVolunteer && (
          <div className="space-y-6">
            <DialogHeader>
              <div className="flex items-center justify-between gap-3">
                <DialogTitle className="text-xl font-heading font-extrabold text-slate-900 leading-snug">
                  {selectedVolunteer.full_name}
                </DialogTitle>
                <Badge
                  variant={
                    selectedVolunteer.status === "new"
                      ? "default"
                      : selectedVolunteer.status === "contacted"
                      ? "secondary"
                      : "outline"
                  }
                  className="capitalize text-xs font-semibold px-2.5 py-0.5"
                >
                  {selectedVolunteer.status}
                </Badge>
              </div>
              <DialogDescription className="text-xs text-slate-500 mt-1">
                Applied for <strong className="text-slate-800 font-semibold">{selectedVolunteer.type.replace("_", " ")}</strong> on{" "}
                {new Date(selectedVolunteer.created_at).toLocaleString()}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-200 text-sm">
              <div>
                <span className="text-xs text-slate-500 block font-medium">Phone / WhatsApp</span>
                <span className="font-bold text-slate-900">{selectedVolunteer.phone}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block font-medium">Email</span>
                <span className="font-semibold text-slate-900">{selectedVolunteer.email}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block font-medium">City</span>
                <span className="font-medium text-slate-900">{selectedVolunteer.city}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block font-medium">Institution / University</span>
                <span className="font-medium text-slate-900">
                  {selectedVolunteer.university || "Not applicable"}
                </span>
              </div>
            </div>

            {selectedVolunteer.message && (
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Statement / Application Notes:
                </span>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {selectedVolunteer.message}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setVolunteerToDelete(selectedVolunteer.id)}
                className="text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 gap-1.5 self-start sm:self-auto rounded-xl px-3"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Application
              </Button>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange("contacted")}
                  className="text-xs font-semibold rounded-xl border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 gap-1.5 px-3 py-2"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Mark Contacted
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange("archived")}
                  className="text-xs font-semibold rounded-xl border-slate-300 text-slate-700 hover:bg-slate-100 gap-1.5 px-3 py-2"
                >
                  <Archive className="w-3.5 h-3.5 text-slate-500" /> Archive
                </Button>
                <a href={`tel:${selectedVolunteer.phone}`} className="inline-block">
                  <Button size="sm" variant="outline" className="text-xs font-semibold rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50 gap-1.5 px-3 py-2">
                    <Phone className="w-3.5 h-3.5" /> Call
                  </Button>
                </a>
                <a
                  href={`mailto:${selectedVolunteer.email}?subject=GJTF Volunteer Application - ${encodeURIComponent(
                    selectedVolunteer.full_name
                  )}`}
                  className="inline-block"
                >
                  <Button size="sm" variant="primary" className="text-xs font-bold rounded-xl shadow-sm gap-1.5 px-4 py-2">
                    <Mail className="w-3.5 h-3.5" /> Email
                  </Button>
                </a>
              </div>
            </div>
          </div>
        )}
      </Dialog>

      {/* Modern Custom Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(volunteerToDelete)}
        onOpenChange={(open) => !open && setVolunteerToDelete(null)}
        title="Delete Volunteer Application?"
        description="Are you sure you want to permanently delete this volunteer application? This action cannot be undone."
        onConfirm={confirmDeleteVolunteer}
      />
    </div>
  );
}
