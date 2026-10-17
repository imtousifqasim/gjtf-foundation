import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import sharp from "sharp";
import { query, RowDataPacket } from "@/lib/db/mysql";
import { getAuthenticatedDonor } from "@/lib/auth/donor";
import { verifyPledgeAccess } from "@/lib/db/pledgeTokens";
import { getProofStorage } from "@/lib/storage";
import { getProofFolderPath } from "@/lib/storage/folderPath";
import { ensurePaymentProofTablesDb, getPaymentProofsSettingsDb } from "@/lib/db/paymentProofsSchema";
import { sendTransactionalEmail } from "@/lib/email/sender";
import { createPaymentProofReceivedEmail } from "@/lib/email/templates/donationTemplates";
import { revalidatePath } from "next/cache";

// Magic bytes validation signatures
const MAGIC_BYTES = {
  jpeg: [0xff, 0xd8, 0xff],
  png: [0x89, 0x50, 0x4e, 0x47],
  webp: [0x52, 0x49, 0x46, 0x46], // "RIFF"
  pdf: [0x25, 0x50, 0x44, 0x46],  // "%PDF"
};

function matchesMagicBytes(buffer: Buffer, magic: number[]): boolean {
  if (buffer.length < magic.length) return false;
  for (let i = 0; i < magic.length; i++) {
    if (buffer[i] !== magic[i]) return false;
  }
  return true;
}

function detectFileType(buffer: Buffer): "jpeg" | "png" | "webp" | "pdf" | "heic" | null {
  if (matchesMagicBytes(buffer, MAGIC_BYTES.jpeg)) return "jpeg";
  if (matchesMagicBytes(buffer, MAGIC_BYTES.png)) return "png";
  if (matchesMagicBytes(buffer, MAGIC_BYTES.pdf)) return "pdf";

  // WebP check: starts with RIFF and at byte 8 has "WEBP"
  if (matchesMagicBytes(buffer, MAGIC_BYTES.webp) && buffer.length >= 12) {
    const sub = buffer.slice(8, 12).toString("ascii");
    if (sub === "WEBP") return "webp";
  }

  // HEIC/HEIF check: starts with ftyp at offset 4
  if (buffer.length >= 12) {
    const ftyp = buffer.slice(4, 8).toString("ascii");
    const brand = buffer.slice(8, 12).toString("ascii");
    if (ftyp === "ftyp" && (brand.startsWith("heic") || brand.startsWith("mif1") || brand.startsWith("msf1") || brand.startsWith("heix"))) {
      return "heic";
    }
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    await ensurePaymentProofTablesDb();
    const settings = await getPaymentProofsSettingsDb();

    // 1. Parse Multipart Form Data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const donationRef = (formData.get("donationRef") as string || "").trim();
    const tokenFromClient = (formData.get("token") as string || "").trim();

    // Optional donor fields
    const transactionRef = (formData.get("transactionRef") as string || "").trim() || null;
    const senderBank = (formData.get("senderBank") as string || "").trim() || null;
    const paidAtRaw = (formData.get("paidAt") as string || "").trim() || null;
    const paidAmount = Number(formData.get("paidAmount")) || null;
    const note = (formData.get("note") as string || "").trim() || null;

    if (!file || !donationRef) {
      return NextResponse.json(
        { success: false, message: "File and donation reference are required." },
        { status: 400 }
      );
    }

    // 2. Fetch Donation Record
    const donations = await query<RowDataPacket[]>(
      "SELECT * FROM donations WHERE reference_no = ? LIMIT 1",
      [donationRef]
    );

    if (!donations || donations.length === 0) {
      // Return 404 for non-existent donation
      return NextResponse.json({ success: false, message: "Donation pledge not found." }, { status: 404 });
    }

    const donation = donations[0];

    // 3. Strict Ownership & Access Authorization
    const loggedInDonor = await getAuthenticatedDonor();
    let isAuthorized = false;

    if (loggedInDonor && donation.donor_id === loggedInDonor.id) {
      isAuthorized = true;
    } else {
      // Check pledge token from request parameter or cookie
      const tokenHeader = req.headers.get("x-pledge-token") || tokenFromClient;
      isAuthorized = await verifyPledgeAccess(donation.id, donation.reference_no, tokenHeader);
    }

    if (!isAuthorized) {
      // Zero-trust: return 404 to avoid enumeration
      return NextResponse.json({ success: false, message: "Donation pledge not found." }, { status: 404 });
    }

    // Check if donation already confirmed
    if (donation.status === "completed") {
      return NextResponse.json(
        { success: false, message: "This donation has already been verified and completed." },
        { status: 400 }
      );
    }

    // 4. Validate Max Active Proofs (max 3)
    const activeProofs = await query<RowDataPacket[]>(
      "SELECT COUNT(*) as count FROM payment_proofs WHERE donation_id = ? AND status != 'deleted'",
      [donation.id]
    );

    const activeCount = Number(activeProofs?.[0]?.count) || 0;
    if (activeCount >= settings.max_active_proofs_per_pledge) {
      return NextResponse.json(
        { success: false, message: `Maximum ${settings.max_active_proofs_per_pledge} payment proofs per pledge allowed.` },
        { status: 400 }
      );
    }

    // 5. File Size & Magic Bytes Validation
    const arrayBuffer = await file.arrayBuffer();
    const rawBuffer = Buffer.from(arrayBuffer);

    if (rawBuffer.length > settings.max_file_size_bytes) {
      return NextResponse.json(
        { success: false, message: `File size exceeds the 5 MB limit. Please compress or select a smaller image.` },
        { status: 400 }
      );
    }

    const detectedType = detectFileType(rawBuffer);
    if (!detectedType) {
      return NextResponse.json(
        { success: false, message: "Invalid file type. Only JPEG, PNG, WebP, HEIC, or PDF files are accepted." },
        { status: 400 }
      );
    }

    // 6. Process with Sharp (strip EXIF, resize max 1600px, convert to WebP)
    let processedBuffer: Buffer = rawBuffer;
    let outputMime = "image/webp";

    if (detectedType !== "pdf") {
      try {
        processedBuffer = await sharp(rawBuffer)
          .rotate() // auto-orient based on EXIF before stripping
          .resize(1600, 1600, {
            fit: "inside",
            withoutEnlargement: true,
          })
          .webp({ quality: 82, effort: 4 })
          .toBuffer();
        outputMime = "image/webp";
      } catch (err: any) {
        console.warn("[Sharp] Image conversion notice:", err.message);
        // Fallback to original buffer if sharp fails on unusual encoding
        processedBuffer = rawBuffer;
        outputMime = file.type || "image/jpeg";
      }
    } else {
      outputMime = "application/pdf";
    }

    // 7. Calculate SHA-256 Hash and check duplicate fraud
    const sha256 = crypto.createHash("sha256").update(processedBuffer).digest("hex");

    const duplicateCheck = await query<RowDataPacket[]>(
      "SELECT donation_id, filename FROM payment_proofs WHERE sha256 = ? AND donation_id != ? AND status != 'deleted' LIMIT 1",
      [sha256, donation.id]
    );

    let isDuplicateHash = false;
    let duplicateDonationId: string | null = null;
    if (duplicateCheck && duplicateCheck.length > 0) {
      isDuplicateHash = true;
      duplicateDonationId = duplicateCheck[0].donation_id;
    }

    // 8. Upload to Storage (Google Drive with automatic Year/Month folders)
    const storage = getProofStorage();
    const proofId = `prf_${crypto.randomUUID()}`;
    const sequenceNumber = activeCount + 1;

    const putResult = await storage.put(processedBuffer, {
      donationId: donation.id,
      referenceNo: donation.reference_no,
      sequenceNumber,
      mime: outputMime,
      proofId,
      uploadDate: new Date(),
    });

    // 9. Insert Record into payment_proofs Table
    const paidAmountMinor = paidAmount ? Math.round(paidAmount * 100) : null;
    const paidAtTimestamp = paidAtRaw ? new Date(paidAtRaw).toISOString().slice(0, 19).replace("T", " ") : null;

    await query(`
      INSERT INTO payment_proofs (
        id, donation_id, donor_id, storage_driver, drive_file_id, drive_folder_id,
        folder_path, filename, mime, size_bytes, sha256, is_encrypted, encryption_version,
        wrapped_data_key, encryption_iv, encryption_tag, transaction_ref, sender_bank,
        paid_at, paid_amount_minor, note, status, uploaded_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, 'submitted', NOW()
      )
    `, [
      proofId,
      donation.id,
      donation.donor_id || null,
      putResult.fileId ? "google-drive" : "local",
      putResult.fileId,
      putResult.folderId,
      putResult.folderPath,
      putResult.filename,
      outputMime,
      processedBuffer.length,
      sha256,
      putResult.isEncrypted ? 1 : 0,
      putResult.encryptionVersion || 1,
      putResult.wrappedDataKey || null,
      putResult.encryptionIv || null,
      putResult.encryptionTag || null,
      transactionRef,
      senderBank,
      paidAtTimestamp,
      paidAmountMinor,
      note,
    ]);

    // 10. Update Donations status: proof_status = 'submitted'
    await query(`
      UPDATE donations
      SET
        proof_status = 'submitted',
        proof_url = ?
      WHERE id = ?
    `, [`/api/proofs/${proofId}`, donation.id]);

    // 11. Write Status History & Audit Log
    await query(`
      INSERT INTO donation_status_history (id, donation_id, old_status, new_status, changed_by, note, created_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `, [
      `dsh_${crypto.randomUUID()}`,
      donation.id,
      donation.status,
      donation.status,
      loggedInDonor ? `donor:${loggedInDonor.id}` : "guest:donor",
      `Payment proof uploaded (#${putResult.filename}). Status set to proof_submitted.${isDuplicateHash ? " [WARNING: Duplicate SHA-256 hash detected]" : ""}`,
    ]);

    await query(`
      INSERT INTO audit_logs (id, actor_type, actor_id, action, target_type, target_id, metadata, ip, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      `aud_${crypto.randomUUID()}`,
      loggedInDonor ? "donor" : "guest",
      loggedInDonor ? loggedInDonor.id : null,
      "proof.uploaded",
      "payment_proof",
      proofId,
      JSON.stringify({
        donationRef: donation.reference_no,
        filename: putResult.filename,
        folderPath: putResult.folderPath,
        sha256,
        isDuplicateHash,
        duplicateDonationId,
        sizeBytes: processedBuffer.length,
        transactionRef,
        senderBank,
      }),
      req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || null,
    ]);

    // 12. Asynchronously Dispatch "Proof Received" Email
    if (donation.donor_email) {
      (async () => {
        try {
          const appUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://gjtf-foundation.vercel.app";
          const uploadUrl = loggedInDonor
            ? `${appUrl}/donor/donations/${donation.id}`
            : `${appUrl}/donate-now/pay/${donation.reference_no}`;

          const email = createPaymentProofReceivedEmail({
            pledgeId: donation.reference_no,
            donorName: donation.donor_name,
            donorEmail: donation.donor_email,
            amount: donation.amount,
            currency: donation.currency || "PKR",
            cause: donation.cause,
            uploadUrl,
          });

          await sendTransactionalEmail({
            to: donation.donor_email,
            recipientName: donation.donor_name,
            emailType: "proof_received",
            subject: email.subject,
            html: email.html,
            text: email.text,
            metadata: { donationId: donation.id, proofId },
          });
        } catch (emErr: any) {
          console.warn("[Proof Email] Warning:", emErr.message);
        }
      })();
    }

    try {
      revalidatePath(`/donor/donations/${donation.id}`);
      revalidatePath(`/donate-now/pay/${donation.reference_no}`);
      revalidatePath("/admin/donations");
    } catch {}

    return NextResponse.json({
      success: true,
      proofId,
      filename: putResult.filename,
      folderPath: putResult.folderPath,
      status: "submitted",
      isDuplicateHash,
      message: "Payment proof uploaded successfully and queued for verification.",
    });
  } catch (err: any) {
    console.error("[Proof Upload] Server Error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Failed to upload payment proof. Please try again." },
      { status: 500 }
    );
  }
}
