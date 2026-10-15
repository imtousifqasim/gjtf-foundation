import * as React from "react";
import Link from "next/link";
import { ShieldCheck, Lock, EyeOff, FileText, Phone, Mail, CheckCircle2 } from "lucide-react";
import { CONTACT_INFO } from "@/data/navigation";

export const metadata = {
  title: "Privacy & Data Protection Policy | Ghais Jhuggi Taleem Foundation (GJTF)",
  description: "Official Privacy Policy of GJTF Foundation. Learn how we safeguard donor, volunteer, and student data with Zero-Trust isolation.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="py-12 md:py-20 bg-warm-50 text-charcoal">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary-100 text-primary-800 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-primary-700" />
            Zero-Trust Data Protection
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-heading text-charcoal-deep tracking-tight">
            Privacy &amp; Data Protection Policy
          </h1>
          <p className="text-sm md:text-base text-charcoal-muted max-w-2xl mx-auto leading-relaxed">
            Effective Date: January 1, 2026 &bull; Ghais Jhuggi Taleem Foundation (GJTF)
          </p>
        </div>

        {/* Content Body */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-warm-200 shadow-soft space-y-8 text-sm md:text-base leading-relaxed text-charcoal">
          <section className="space-y-3">
            <h2 className="text-xl md:text-2xl font-bold font-heading text-charcoal-deep">
              1. Our Foundational Commitment
            </h2>
            <p>
              At <strong>Ghais Jhuggi Taleem Foundation (GJTF)</strong>, established in 2014 to bring education to children in nomadic settlements (&ldquo;Jhuggi Nasheen&rdquo;), we treat the trust of our donors, volunteers, and beneficiaries with the highest level of responsibility and transparency.
            </p>
            <p>
              We operate on a <strong>Zero-Trust Data Isolation Architecture</strong>: nobody can see anyone else&rsquo;s donation records, pledges, receipts, or contact information. Every donor is isolated to their own verified session, and public lists never display donor financial contributions.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl md:text-2xl font-bold font-heading text-charcoal-deep">
              2. Information We Collect
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-charcoal-muted">
              <li>
                <strong className="text-charcoal-deep">Donors:</strong> Name (optional for anonymous gifts), email address (for official tax-exemption receipts), phone/WhatsApp number (for doorstep cash collection or wire confirmation), country, and pledged amount. We <em>never</em> store bank login details, card numbers, or CVVs.
              </li>
              <li>
                <strong className="text-charcoal-deep">Volunteers:</strong> Full name, verified email, mobile phone number, city, university affiliation, and message.
              </li>
              <li>
                <strong className="text-charcoal-deep">Subscribers:</strong> Email address for our occasional mission newsletter.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl md:text-2xl font-bold font-heading text-charcoal-deep">
              3. Strict Data Isolation &amp; Zero Public Exposure
            </h2>
            <p>
              To protect the dignity and privacy of all supporters and beneficiaries:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-charcoal-muted">
              <li>
                <strong>No Public Donor Walls:</strong> We do not publish public rankings or feeds of donor names and amounts.
              </li>
              <li>
                <strong>Anonymous Support:</strong> Donors who select the &ldquo;Anonymous&rdquo; option will have their names omitted even from internal thank-you remarks, addressed only as &ldquo;Generous Donor&rdquo;.
              </li>
              <li>
                <strong>Redacted Email Logs:</strong> One-time password reset links, OTP codes, and activation tokens are permanently redacted (masked as <code>[secure-link-hidden]</code>) before being saved to database audit logs, preventing unauthorized inspection.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl md:text-2xl font-bold font-heading text-charcoal-deep">
              4. Data Retention &amp; Automatic Log Cleanup
            </h2>
            <p>
              Transactional email records and communication logs are subject to automated scheduled retention policies (7, 15, 30, or 90 days), after which logs are deleted from our servers.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl md:text-2xl font-bold font-heading text-charcoal-deep">
              5. Your Rights: Export &amp; Account Deletion (GDPR)
            </h2>
            <p>
              Through your personal <Link href="/donor/profile" className="text-primary-700 font-bold underline">Supporter Portal Profile</Link>, you can:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-charcoal-muted">
              <li>
                <strong>Export Your Data:</strong> Download a machine-readable JSON copy of all personal records, pledges, and receipt metadata.
              </li>
              <li>
                <strong>Right to be Forgotten:</strong> Request permanent anonymization of your profile. Financial pledge totals remain anonymized for charity regulatory compliance.
              </li>
            </ul>
          </section>

          <section className="space-y-3 border-t border-warm-200 pt-6">
            <h2 className="text-xl md:text-2xl font-bold font-heading text-charcoal-deep">
              6. Contact Our Data Protection Officer
            </h2>
            <p>
              For privacy inquiries, data deletion requests, or security reports:
            </p>
            <div className="p-4 rounded-2xl bg-warm-100 border border-warm-200 text-sm space-y-1 text-charcoal">
              <div><strong>Ghais Jhuggi Taleem Foundation</strong> — Head Office</div>
              <div>Office # 46-47, First Floor, New Liberty Tower, Model Town Link Road, Lahore, Pakistan</div>
              <div>Toll-Free Helpline: <strong>0800-00823</strong> | WhatsApp: <strong>+92 303 3934771</strong></div>
              <div>Official Email: <strong>jhuggitaleemiproject@gmail.com</strong></div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
