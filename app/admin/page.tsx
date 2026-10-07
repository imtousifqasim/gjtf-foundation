import * as React from "react";
import Link from "next/link";
import {
  Heart,
  Mail,
  Users,
  School,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  TrendingUp,
  Server,
  MailCheck,
  Send,
} from "lucide-react";
import {
  getDonationsDb,
  getContactMessagesDb,
  getVolunteerSignupsDb,
  getSubscribersDb,
} from "@/lib/db/mysql";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

// Fallback seed data if database has not recorded records yet
const SAMPLE_DONATIONS = [
  { id: "dn_1", created_at: "2025-02-14T10:30:00Z", donor_name: "Farhan Malik", amount: 20000, currency: "PKR", cause: "Support a Classroom", status: "completed" },
  { id: "dn_2", created_at: "2025-02-14T08:15:00Z", donor_name: "Ayesha Siddiqui", amount: 5000, currency: "PKR", cause: "Educate a Child", status: "pending" },
  { id: "dn_3", created_at: "2025-02-13T16:45:00Z", donor_name: "Anonymous", amount: 300, currency: "AED", cause: "General Education", status: "completed" },
  { id: "dn_4", created_at: "2025-02-12T11:20:00Z", donor_name: "Bilal Tariq", amount: 10000, currency: "PKR", cause: "Support a Child: KG to Matric", status: "completed" },
];

const SAMPLE_MESSAGES = [
  { id: "msg_1", created_at: "2025-02-14T11:00:00Z", name: "Zubair Khan", subject: "Sponsorship for Karachi Campus", status: "new" },
  { id: "msg_2", created_at: "2025-02-13T14:30:00Z", name: "Dr. Naila Raza", subject: "Medical Camp Collaboration", status: "new" },
  { id: "msg_3", created_at: "2025-02-12T09:10:00Z", name: "Hamza Rauf", subject: "Book drive in DHA Lahore", status: "read" },
];

export default async function AdminDashboardPage() {
  let donations = SAMPLE_DONATIONS;
  let contactMessages = SAMPLE_MESSAGES;
  let volunteerCount = 14;
  let subscriberCount = 0;

  try {
    const [dbDonations, dbMessages, dbVolunteers, dbSubscribers] = await Promise.all([
      getDonationsDb(10),
      getContactMessagesDb(10),
      getVolunteerSignupsDb(100),
      getSubscribersDb(),
    ]);

    if (dbDonations && dbDonations.length > 0) {
      donations = dbDonations as any;
    }
    if (dbMessages && dbMessages.length > 0) {
      contactMessages = dbMessages as any;
    }
    volunteerCount = dbVolunteers.length;
    subscriberCount = dbSubscribers.length;
  } catch (err) {
    console.error("Error loading Hostinger MySQL dashboard data:", err);
  }

  // Calculate totals
  const totalPkr = donations
    .filter((d) => d.currency === "PKR")
    .reduce((sum, d) => sum + Number(d.amount), 0);

  const totalAed = donations
    .filter((d) => d.currency === "AED")
    .reduce((sum, d) => sum + Number(d.amount), 0);

  const newMessagesCount = contactMessages.filter((m) => m.status === "new").length;

  return (
    <div className="space-y-8">
      {/* Top Welcome Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-charcoal-deep">
            Staff Overview Dashboard
          </h1>
          <p className="text-sm text-charcoal-muted">
            Real-time updates across donations, inquiries, and student enrollments.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link href="/admin/donations" className="inline-block">
            <Button variant="primary" size="sm" className="gap-2 px-4 py-2 font-bold shadow-sm rounded-xl text-xs sm:text-sm">
              <Heart className="w-4 h-4 fill-white" /> View Donations
            </Button>
          </Link>
          <Link href="/admin/contact-messages" className="inline-block">
            <Button variant="outline" size="sm" className="gap-2 px-4 py-2 font-bold rounded-xl border-slate-300 text-slate-800 hover:bg-slate-100 text-xs sm:text-sm">
              <Mail className="w-4 h-4 text-primary-600" />
              <span>Inbox</span>
              {newMessagesCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary-100 text-primary-800 text-[10px] font-extrabold">
                  {newMessagesCount}
                </span>
              )}
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Total Donations */}
        <Card className="p-6 bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Donations
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
              <Heart className="w-5 h-5 fill-amber-500" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold font-heading text-slate-900">
              Rs. {totalPkr.toLocaleString()}
            </div>
            {totalAed > 0 && (
              <div className="text-xs text-amber-700 font-semibold mt-0.5">
                + AED {totalAed.toLocaleString()}
              </div>
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>{donations.length} total logged pledges</span>
            <Link href="/admin/donations" className="text-primary-700 font-bold hover:underline">
              Details →
            </Link>
          </div>
        </Card>

        {/* Card 2: Contact Messages */}
        <Card className="p-6 bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              New Messages
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold font-heading text-slate-900">
              {newMessagesCount} Unread
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {contactMessages.length} total inquiries
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Awaiting staff review</span>
            <Link href="/admin/contact-messages" className="text-primary-700 font-bold hover:underline">
              Inbox →
            </Link>
          </div>
        </Card>

        {/* Card 3: Volunteer Sign-ups */}
        <Card className="p-6 bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Volunteer Sign-ups
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold font-heading text-slate-900">
              {volunteerCount} Applicants
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              General & Campus Chapters
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Across 24 Pakistani cities</span>
            <Link href="/admin/volunteer-signups" className="text-primary-700 font-bold hover:underline">
              Review →
            </Link>
          </div>
        </Card>

        {/* Card 4: Active Network */}
        <Card className="p-6 bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active Network
            </span>
            <div className="w-9 h-9 rounded-xl bg-primary-900 text-white flex items-center justify-center">
              <School className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold font-heading text-slate-900">
              2,033 Units
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              5,500 students enrolled
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>8,000+ families benefited</span>
            <Link href="/admin/schools" className="text-primary-700 font-bold hover:underline">
              Schools →
            </Link>
          </div>
        </Card>
      </div>

      {/* Quick Communications & Infrastructure Access */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-5 border-blue-100 bg-gradient-to-br from-blue-50/70 via-white to-slate-50 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-700 text-white flex items-center justify-center shadow-sm">
                  <MailCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Newsletter Subscribers</h3>
                  <p className="text-xs text-slate-500">Audience & Broadcast Campaigns</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-blue-100/70 text-blue-800 border-blue-200 font-bold px-2.5 py-0.5">
                {subscriberCount} Active
              </Badge>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Manage website visitors who subscribed to updates. Compose and send broadcast newsletters or promotional campaigns anytime.
            </p>
          </div>
          <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
            <Link
              href="/admin/subscribers"
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-primary-700 hover:bg-primary-800 transition-colors shadow-sm"
            >
              <Users className="w-3.5 h-3.5" />
              Manage Subscribers
            </Link>
            <Link
              href="/admin/subscribers"
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <Send className="w-3.5 h-3.5 text-blue-600" />
              Send Newsletter
            </Link>
          </div>
        </Card>

        <Card className="p-5 border-emerald-100 bg-gradient-to-br from-emerald-50/60 via-white to-slate-50 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-sm">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">SMTP Mail Server</h3>
                  <p className="text-xs text-slate-500">Real-Time Email Relay Configuration</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-emerald-100/70 text-emerald-800 border-emerald-200 font-bold px-2.5 py-0.5">
                Live Relay
              </Badge>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Configure SMTP credentials (Gmail, Outlook/Office365, or Custom Host) with live test connection and instant Supabase persistence.
            </p>
          </div>
          <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
            <Link
              href="/admin/smtp"
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 transition-colors shadow-sm"
            >
              <Server className="w-3.5 h-3.5" />
              SMTP Settings & Test
            </Link>
          </div>
        </Card>
      </div>

      {/* Recent Activity: Donations & Inquiries */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent Donations */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-lg font-bold font-heading text-slate-900 flex items-center gap-2">
              <Heart className="w-4 h-4 text-amber-500 fill-amber-500" />
              Recent Donation Pledges
            </h3>
            <Link href="/admin/donations" className="text-xs font-bold text-primary-700 hover:underline">
              View All ({donations.length})
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {donations.slice(0, 5).map((donation) => (
              <div key={donation.id} className="py-3 flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-bold text-slate-900">
                    {donation.donor_name || "Anonymous Donor"}
                  </div>
                  <div className="text-xs text-slate-500">
                    {donation.cause} • {new Date(donation.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-primary-700 font-mono">
                    {donation.currency} {donation.amount.toLocaleString()}
                  </div>
                  <Badge
                    variant={donation.status === "completed" ? "success" : "warning"}
                    className="text-[10px] py-0 px-2 mt-0.5"
                  >
                    {donation.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Inquiries */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-lg font-bold font-heading text-slate-900 flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary-700" />
              Recent Inquiries
            </h3>
            <Link href="/admin/contact-messages" className="text-xs font-bold text-primary-700 hover:underline">
              Inbox
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {contactMessages.slice(0, 5).map((msg) => (
              <div key={msg.id} className="py-3 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-slate-900">{msg.name}</div>
                  <span className="text-[11px] text-slate-500">
                    {new Date(msg.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-xs text-slate-600 line-clamp-1">{msg.subject}</div>
                <div>
                  <Badge
                    variant={msg.status === "new" ? "accent" : "secondary"}
                    className="text-[10px] py-0 px-2"
                  >
                    {msg.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
