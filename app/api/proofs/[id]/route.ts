import { NextRequest, NextResponse } from "next/server";
import { query, RowDataPacket } from "@/lib/db/mysql";
import { getAdminSession } from "@/lib/auth/admin";
import { getAuthenticatedDonor } from "@/lib/auth/donor";
import { verifyPledgeAccess } from "@/lib/db/pledgeTokens";
import { getProofStorage } from "@/lib/storage";
import { ensurePaymentProofTablesDb } from "@/lib/db/paymentProofsSchema";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensurePaymentProofTablesDb();
    const { id } = await params;

    if (!id || id.length < 5) {
      return new NextResponse("Not Found", { status: 404 });
    }

    // 1. Fetch Proof Record
    const proofRows = await query<RowDataPacket[]>(`
      SELECT p.*, d.reference_no, d.donor_id as donation_donor_id
      FROM payment_proofs p
      INNER JOIN donations d ON p.donation_id = d.id
      WHERE p.id = ? AND p.status != 'deleted'
      LIMIT 1
    `, [id]);

    if (!proofRows || proofRows.length === 0) {
      // Zero-trust: return 404
      return new NextResponse("Not Found", { status: 404 });
    }

    const proof = proofRows[0];

    // 2. Authorization Check (Admin, Owner Donor, or Guest with Valid Pledge Token)
    let isAuthorized = false;
    let actorType = "unauthorized";
    let actorId: string | null = null;

    // A. Check Admin Session
    const adminSession = await getAdminSession();
    if (adminSession) {
      isAuthorized = true;
      actorType = "admin";
      actorId = adminSession.email;
    }

    // B. Check Donor Session
    if (!isAuthorized) {
      const loggedInDonor = await getAuthenticatedDonor();
      if (loggedInDonor && (proof.donor_id === loggedInDonor.id || proof.donation_donor_id === loggedInDonor.id)) {
        isAuthorized = true;
        actorType = "donor";
        actorId = loggedInDonor.id;
      }
    }

    // C. Check Guest Pledge Token (from query param ?token=... or header or cookie)
    if (!isAuthorized) {
      const tokenCandidate = req.nextUrl.searchParams.get("token") || req.headers.get("x-pledge-token");
      isAuthorized = await verifyPledgeAccess(proof.donation_id, proof.reference_no, tokenCandidate);
      if (isAuthorized) {
        actorType = "guest";
      }
    }

    // Non-owner gets strict 404 (never 403, preventing resource enumeration)
    if (!isAuthorized) {
      return new NextResponse("Not Found", { status: 404 });
    }

    // 3. Log Admin Views in audit_logs
    if (actorType === "admin") {
      try {
        await query(`
          INSERT INTO audit_logs (id, actor_type, actor_id, action, target_type, target_id, metadata, ip, created_at)
          VALUES (UUID(), 'admin', ?, 'proof.viewed', 'payment_proof', ?, ?, ?, NOW())
        `, [
          actorId,
          proof.id,
          JSON.stringify({ donationRef: proof.reference_no, filename: proof.filename }),
          req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || null,
        ]);
      } catch {}
    }

    // 4. Fetch File from Storage Driver (Google Drive)
    const storage = getProofStorage();
    const fileResult = await storage.get(proof.drive_file_id, {
      isEncrypted: Boolean(proof.is_encrypted),
      wrappedDataKey: proof.wrapped_data_key,
      encryptionIv: proof.encryption_iv,
      encryptionTag: proof.encryption_tag,
    });

    const headers = new Headers();
    headers.set("Content-Type", proof.mime || fileResult.mime || "image/webp");
    headers.set("Content-Length", String(fileResult.buffer.length));
    headers.set("Cache-Control", "private, no-store, no-cache, must-revalidate");
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("Content-Disposition", `inline; filename="${proof.filename || "proof.webp"}"`);

    return new NextResponse(new Uint8Array(fileResult.buffer), {
      status: 200,
      headers,
    });
  } catch (err: any) {
    console.error("[Proof View Error]:", err.message);
    return new NextResponse("Not Found", { status: 404 });
  }
}
