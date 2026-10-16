/**
 * Backfill and Orphan Donation Linking Script
 * 
 * Usage:
 *   npx tsx scripts/link-orphan-donations.ts            (Dry run, no changes written)
 *   npx tsx scripts/link-orphan-donations.ts --apply   (Applies linkings in database)
 */

import { query, getPool } from "../lib/db/mysql";
import { RowDataPacket } from "mysql2/promise";

export interface OrphanReport {
  mode: "dry-run" | "apply";
  totalOrphans: number;
  linked: Array<{ donationId: string; referenceNo: string; email: string; matchedDonorId: string }>;
  ambiguous: Array<{ donationId: string; referenceNo: string; email: string; matchingDonorIds: string[] }>;
  unmatched: Array<{ donationId: string; referenceNo: string; email: string | null; reason: string }>;
  caseDuplicatesInDonors: Array<{ normalizedEmail: string; count: number; donorIds: string[] }>;
  summary: {
    totalOrphansEvaluated: number;
    linkedCount: number;
    ambiguousCount: number;
    unmatchedCount: number;
    caseDuplicatesFound: number;
  };
}

export async function runOrphanDonationBackfill(mode: "dry-run" | "apply" = "dry-run"): Promise<OrphanReport> {
  const isApply = mode === "apply";

  console.log(`\n======================================================`);
  console.log(` GJTF ORPHAN DONATION BACKFILL & AUDIT (${mode.toUpperCase()} MODE)`);
  console.log(`======================================================\n`);

  // 1. Fetch all orphan donations (donor_id is NULL or empty string)
  const orphanRows = await query<RowDataPacket[]>(`
    SELECT id, reference_no, donor_email, donor_name, amount, currency, created_at 
    FROM donations 
    WHERE donor_id IS NULL OR donor_id = ''
    ORDER BY created_at ASC
  `);

  const linked: OrphanReport["linked"] = [];
  const ambiguous: OrphanReport["ambiguous"] = [];
  const unmatched: OrphanReport["unmatched"] = [];

  for (const row of orphanRows || []) {
    const rawEmail = row.donor_email;

    if (!rawEmail || typeof rawEmail !== "string" || !rawEmail.trim()) {
      unmatched.push({
        donationId: row.id,
        referenceNo: row.reference_no,
        email: null,
        reason: "No contact email provided on donation record",
      });
      continue;
    }

    const normalizedEmail = rawEmail.trim().toLowerCase();

    // Find donor by normalized email
    const donorMatches = await query<RowDataPacket[]>(
      `SELECT id, email, name, created_at FROM donors WHERE LOWER(TRIM(email)) = ?`,
      [normalizedEmail]
    );

    if (donorMatches.length === 1) {
      const donor = donorMatches[0];
      linked.push({
        donationId: row.id,
        referenceNo: row.reference_no,
        email: normalizedEmail,
        matchedDonorId: donor.id,
      });

      if (isApply) {
        await query(
          `UPDATE donations SET donor_id = ? WHERE id = ?`,
          [donor.id, row.id]
        );

        try {
          await query(
            `INSERT INTO audit_logs (id, actor_type, actor_id, action, target_type, target_id, metadata)
             VALUES (?, 'system', 'script:link-orphan-donations', 'donation.orphan_linked', 'donation', ?, ?)`,
            [
              "aud_" + Math.random().toString(36).substring(2, 10),
              row.id,
              JSON.stringify({
                matchedDonorId: donor.id,
                email: normalizedEmail,
                referenceNo: row.reference_no,
              }),
            ]
          );
        } catch {}
      }
    } else if (donorMatches.length > 1) {
      ambiguous.push({
        donationId: row.id,
        referenceNo: row.reference_no,
        email: normalizedEmail,
        matchingDonorIds: donorMatches.map((d) => d.id),
      });
    } else {
      unmatched.push({
        donationId: row.id,
        referenceNo: row.reference_no,
        email: normalizedEmail,
        reason: "No registered donor account found with this email (guest donation)",
      });
    }
  }

  // 2. Audit existing donors table for case duplicates (e.g. Ali@gmail.com vs ali@gmail.com)
  const caseDuplicateRows = await query<RowDataPacket[]>(`
    SELECT LOWER(TRIM(email)) as norm_email, COUNT(*) as cnt, GROUP_CONCAT(id) as ids
    FROM donors
    GROUP BY LOWER(TRIM(email))
    HAVING cnt > 1
  `);

  const caseDuplicatesInDonors: OrphanReport["caseDuplicatesInDonors"] = (caseDuplicateRows || []).map(
    (row) => ({
      normalizedEmail: row.norm_email,
      count: Number(row.cnt),
      donorIds: typeof row.ids === "string" ? row.ids.split(",") : [],
    })
  );

  const report: OrphanReport = {
    mode,
    totalOrphans: orphanRows?.length || 0,
    linked,
    ambiguous,
    unmatched,
    caseDuplicatesInDonors,
    summary: {
      totalOrphansEvaluated: orphanRows?.length || 0,
      linkedCount: linked.length,
      ambiguousCount: ambiguous.length,
      unmatchedCount: unmatched.length,
      caseDuplicatesFound: caseDuplicatesInDonors.length,
    },
  };

  console.log(`Total Orphan Donations Found: ${report.summary.totalOrphansEvaluated}`);
  console.log(`Eligible to Link:             ${report.summary.linkedCount}`);
  console.log(`Ambiguous (multiple donors):  ${report.summary.ambiguousCount}`);
  console.log(`Unmatched (no donor yet):     ${report.summary.unmatchedCount}`);
  console.log(`Donor Case Duplicates:        ${report.summary.caseDuplicatesFound}`);
  console.log(`\nStatus: ${isApply ? "CHANGES APPLIED TO DATABASE" : "DRY-RUN ONLY (pass --apply to execute)"}\n`);

  return report;
}

// Direct execution from CLI
if (require.main === module || (typeof process !== "undefined" && process.argv[1]?.includes("link-orphan-donations"))) {
  const args = process.argv.slice(2);
  const applyFlag = args.includes("--apply");
  runOrphanDonationBackfill(applyFlag ? "apply" : "dry-run")
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Backfill script error:", err);
      process.exit(1);
    });
}
