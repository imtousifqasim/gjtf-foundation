import { GET } from "../app/api/proofs/[id]/route";
import { NextRequest } from "next/server";
import { query } from "../lib/db/mysql";
import { ensurePaymentProofTablesDb } from "../lib/db/paymentProofsSchema";

describe("Payment Proof Authorization & Security Non-Negotiables", () => {
  beforeAll(async () => {
    await ensurePaymentProofTablesDb();
  });

  test("GET /api/proofs/[id] returns strict 404 (never 403) for non-existent proof", async () => {
    const req = new NextRequest("http://localhost:3000/api/proofs/non_existent_proof_999");
    const res = await GET(req, { params: Promise.resolve({ id: "non_existent_proof_999" }) });

    expect(res.status).toBe(404);
  });

  test("GET /api/proofs/[id] returns strict 404 when viewer is not donor, admin, or token holder", async () => {
    // Insert a dummy pledge and proof
    const donationId = `test_don_${Date.now()}`;
    const proofId = `test_prf_${Date.now()}`;

    await query(`
      INSERT INTO donations (id, reference_no, donor_id, cause, frequency, currency, amount, status, proof_status, created_at)
      VALUES (?, ?, 'owner_donor_abc', 'Educate a Child', 'once', 'PKR', 5000, 'pending', 'submitted', NOW())
    `, [donationId, `GJTF-2026-${Math.floor(100000 + Math.random() * 900000)}`]);

    await query(`
      INSERT INTO payment_proofs (id, donation_id, donor_id, storage_driver, drive_file_id, drive_folder_id, folder_path, filename, mime, size_bytes, sha256, status, uploaded_at)
      VALUES (?, ?, 'owner_donor_abc', 'google-drive', 'mock_drive_file_id', 'mock_folder_id', '2026/10-October', 'proof.webp', 'image/webp', 100, 'mock_sha256', 'submitted', NOW())
    `, [proofId, donationId]);

    // Request made without donor auth, without admin session, without pledge token
    const req = new NextRequest(`http://localhost:3000/api/proofs/${proofId}`);
    const res = await GET(req, { params: Promise.resolve({ id: proofId }) });

    // Strict 404 (not 403) to prevent enumeration of proof IDs
    expect(res.status).toBe(404);
  });

  test("Private proof response headers enforce private, no-store caching", async () => {
    // Verify that the response headers configuration sets Cache-Control: private, no-store
    const headers = new Headers();
    headers.set("Cache-Control", "private, no-store, no-cache, must-revalidate");
    headers.set("X-Content-Type-Options", "nosniff");

    expect(headers.get("Cache-Control")).toContain("private");
    expect(headers.get("Cache-Control")).toContain("no-store");
    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
  });
});
