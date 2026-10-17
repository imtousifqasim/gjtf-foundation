import { NextRequest, NextResponse } from "next/server";
import { query, RowDataPacket } from "@/lib/db/mysql";
import { getAdminSession } from "@/lib/auth/admin";
import { getAuthenticatedDonor } from "@/lib/auth/donor";
import { verifyPledgeAccess } from "@/lib/db/pledgeTokens";
import { getProofStorage } from "@/lib/storage";
import { ensurePaymentProofTablesDb } from "@/lib/db/paymentProofsSchema";
import { revalidatePath } from "next/cache";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensurePaymentProofTablesDb();
    const { id } = await params;

    const proofRows = await query<RowDataPacket[]>(`
      SELECT p.*, d.reference_no, d.status as donation_status, d.donor_id as donation_donor_id
      FROM payment_proofs p
      INNER JOIN donations d ON p.donation_id = d.id
      WHERE p.id = ? AND p.status != 'deleted'
      LIMIT 1
    `, [id]);

    if (!proofRows || proofRows.length === 0) {
      return NextResponse.json({ success: false, message: "Proof not found." }, { status: 404 });
    }

    const proof = proofRows[0];

    // Authorization
    let isAuthorized = false;
    let actorType = "unauthorized";
    let actorId: string | null = null;

    const adminSession = await getAdminSession();
    if (adminSession) {
      isAuthorized = true;
      actorType = "admin";
      actorId = adminSession.email;
    } else {
      const loggedInDonor = await getAuthenticatedDonor();
      if (loggedInDonor && (proof.donor_id === loggedInDonor.id || proof.donation_donor_id === loggedInDonor.id)) {
        isAuthorized = true;
        actorType = "donor";
        actorId = loggedInDonor.id;
      } else {
        const tokenCandidate = req.nextUrl.searchParams.get("token") || req.headers.get("x-pledge-token");
        isAuthorized = await verifyPledgeAccess(proof.donation_id, proof.reference_no, tokenCandidate);
        if (isAuthorized) {
          actorType = "guest";
        }
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ success: false, message: "Proof not found." }, { status: 404 });
    }

    // Donors can only delete unapproved proofs
    if (actorType !== "admin" && proof.status === "approved") {
      return NextResponse.json(
        { success: false, message: "Approved proofs cannot be deleted by donors." },
        { status: 403 }
      );
    }

    // Delete file from Google Drive
    const storage = getProofStorage();
    await storage.delete(proof.drive_file_id).catch(() => {});

    // Soft delete in database
    await query(`
      UPDATE payment_proofs
      SET
        status = 'deleted',
        deleted_at = NOW()
      WHERE id = ?
    `, [proof.id]);

    // Check remaining active proofs for this donation
    const remainingProofs = await query<RowDataPacket[]>(`
      SELECT id, status FROM payment_proofs
      WHERE donation_id = ? AND status != 'deleted'
      ORDER BY uploaded_at DESC
      LIMIT 1
    `, [proof.donation_id]);

    if (!remainingProofs || remainingProofs.length === 0) {
      await query(`
        UPDATE donations
        SET proof_status = 'none', proof_url = NULL
        WHERE id = ?
      `, [proof.donation_id]);
    } else {
      const latest = remainingProofs[0];
      await query(`
        UPDATE donations
        SET proof_status = ?, proof_url = ?
        WHERE id = ?
      `, [latest.status, `/api/proofs/${latest.id}`, proof.donation_id]);
    }

    // Log in audit_logs
    try {
      await query(`
        INSERT INTO audit_logs (id, actor_type, actor_id, action, target_type, target_id, metadata, ip, created_at)
        VALUES (UUID(), ?, ?, 'proof.deleted', 'payment_proof', ?, ?, ?, NOW())
      `, [
        actorType,
        actorId,
        proof.id,
        JSON.stringify({ donationRef: proof.reference_no, filename: proof.filename, priorStatus: proof.status }),
        req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || null,
      ]);
    } catch {}

    try {
      revalidatePath(`/donor/donations/${proof.donation_id}`);
      revalidatePath(`/donate-now/pay/${proof.reference_no}`);
      revalidatePath("/admin/donations");
    } catch {}

    return NextResponse.json({
      success: true,
      message: "Payment proof deleted successfully.",
    });
  } catch (err: any) {
    console.error("[Delete Proof Error]:", err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
