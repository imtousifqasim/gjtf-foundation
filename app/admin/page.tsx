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
  getLiveStatsDb,
  getDonationStatsDb,
} from "@/lib/db/mysql";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  let donations: any[] = [];
  let contactMessages: any[] = [];
  let volunteerCount = 0;
  let volunteerCitiesCount = 0;
  let subscriberCount = 0;
  let liveStats = { totalSchools: 0, totalStudents: 0 };
  let donationStats = {
    byCurrency: [] as Array<{ currency: string; totalAmount: number; count: number; completedAmount: number }>,
    totalPledges: 0,
  };

  try {
    const [dbDonations, dbMessages, dbVolunteers, dbSubscribers, dbStats, dbDonationStats] = await Promise.all([
      getDonationsDb(10),
      getContactMessagesDb(10),
      getVolunteerSignupsDb(100),
      getSubscribersDb(),
      getLiveStatsDb(),
      getDonationStatsDb(),
    ]);

    if (Array.isArray(dbDonations)) {
      donations = dbDonations;
    }
    if (Array.isArray(dbMessages)) {
      contactMessages = dbMessages;
    }
    if (Array.isArray(dbVolunteers)) {
      volunteerCount = dbVolunteers.length;
      volunteerCitiesCount = new Set(
        dbVolunteers.map((v: any) => (v.city || "").trim()).filter(Boolean)
      ).size;
    }
    if (Array.isArray(dbSubscribers)) {
      subscriberCount = dbSubscribers.length;
    }
    if (dbStats) {
      liveStats = dbStats;
    }
    if (dbDonationStats) {
      donationStats = dbDonationStats;
    }
  } catch (err) {
    console.error("Error loading Hostinger MySQL dashboard data:", err);
  }

  const newMessagesCount = contactMessages.filter((m) => m.status === "new").length;

  const pkrStats = donationStats.byCurrency.find(
    (c) => c.currency.toUpperCase() === "PKR"
  ) || {
    currency: "PKR",
    totalAmount: 0,
    count: 0,
    completedAmount: 0,
  };

  const aedStats = donationStats.byCurrency.find(
    (c) => c.currency.toUpperCase() === "AED"
  ) || {
    currency: "AED",
    totalAmount: 0,
    count: 0,
    completedAmount: 0,
  };

  const otherCurrencies = donationStats.byCurrency.filter(
    (c) => c.currency.toUpperCase() !== "PKR" && c.currency.toUpperCase() !== "AED"
  );

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
        {/* Card 1: Total Donations — PKR, AED & Dynamic Currencies */}
        <Card className="p-5 sm:p-6 bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Total Donations
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
                <Heart className="w-5 h-5 fill-amber-500" />
              </div>
            </div>

            <div className="space-y-2.5">
              {/* PKR Metric Row */}
              <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-100/90 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-200/90 text-emerald-900 tracking-wider">
                      PKR
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-800">Pakistani Rupee</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-extrabold font-heading text-emerald-950 mt-1">
                    Rs. {pkrStats.totalAmount.toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-semibold text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-200 shadow-xs">
                    {pkrStats.count} {pkrStats.count === 1 ? "pledge" : "pledges"}
                  </span>
                </div>
              </div>

              {/* AED Metric Row */}
              <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-100/90 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-200/90 text-amber-900 tracking-wider">
                      AED
                    </span>
                    <span className="text-[11px] font-semibold text-amber-800">UAE Dirham</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-extrabold font-heading text-amber-950 mt-1">
                    AED {aedStats.totalAmount.toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-semibold text-amber-700 bg-white px-2 py-0.5 rounded-full border border-amber-200 shadow-xs">
                    {aedStats.count} {aedStats.count === 1 ? "pledge" : "pledges"}
                  </span>
                </div>
              </div>

              {/* Additional Currencies (USD, EUR, GBP, etc.) */}
              {otherCurrencies.map((item) => (
                <div
                  key={item.currency}
                  className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-100 text-blue-900 tracking-wider">
                      {item.currency}
                    </span>
                    <span className="font-extrabold text-slate-800 font-heading">
                      {item.currency} {item.totalAmount.toLocaleString()}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500">
                    {item.count} {item.count === 1 ? "pledge" : "pledges"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>{donationStats.totalPledges} total logged pledges</span>
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
            <span>{volunteerCitiesCount > 0 ? `Across ${volunteerCitiesCount} Pakistani cities` : "Active applicant pipeline"}</span>
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
              {liveStats.totalSchools} Units
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {liveStats.totalStudents.toLocaleString()} students enrolled
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Live from Database</span>
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
            {donations.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 font-medium">
                No donation pledges logged yet.
              </div>
            ) : (
              donations.slice(0, 5).map((donation) => (
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
                      {donation.currency} {Number(donation.amount).toLocaleString()}
                    </div>
                    <Badge
                      variant={donation.status === "completed" ? "success" : "warning"}
                      className="text-[10px] py-0 px-2 mt-0.5"
                    >
                      {donation.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
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
            {contactMessages.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 font-medium">
                No inquiries received yet.
              </div>
            ) : (
              contactMessages.slice(0, 5).map((msg) => (
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
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
