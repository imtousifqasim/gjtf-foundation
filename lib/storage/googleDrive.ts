import crypto from "crypto";
import { query, RowDataPacket } from "@/lib/db/mysql";
import {
  ProofStorage,
  PutMeta,
  PutResult,
  GetFileResult,
  StorageHealth,
} from "./types";
import { getProofFolderPath } from "./folderPath";
import { encryptFileBuffer, decryptFileBuffer } from "./encryption";
import {
  ensurePaymentProofTablesDb,
  getPaymentProofsSettingsDb,
  updatePaymentProofsSettingsDb,
} from "@/lib/db/paymentProofsSchema";

declare global {
  // eslint-disable-next-line no-var
  var __driveAccessToken: string | null | undefined;
  // eslint-disable-next-line no-var
  var __driveTokenExpiresAt: number | undefined;
  // eslint-disable-next-line no-var
  var __verifiedAncestryCache: Set<string> | undefined;
}

if (!global.__verifiedAncestryCache) {
  global.__verifiedAncestryCache = new Set<string>();
}

export class GoogleDriveStorage implements ProofStorage {
  private clientId: string;
  private clientSecret: string;
  private refreshToken: string;
  private rootFolderId: string;
  private scopeMode: "drive" | "drive.file";

  constructor(config?: {
    clientId?: string;
    clientSecret?: string;
    refreshToken?: string;
    rootFolderId?: string;
    scopeMode?: "drive" | "drive.file";
  }) {
    this.clientId = config?.clientId || process.env.GOOGLE_CLIENT_ID || "";
    this.clientSecret = config?.clientSecret || process.env.GOOGLE_CLIENT_SECRET || "";
    this.refreshToken = config?.refreshToken || process.env.GOOGLE_REFRESH_TOKEN || "";
    this.rootFolderId = config?.rootFolderId || process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || "";
    this.scopeMode = (config?.scopeMode || process.env.GOOGLE_DRIVE_SCOPE_MODE || "drive") as any;
  }

  /**
   * Mints or returns cached OAuth2 access token.
   * Handles invalid_grant and auth failure gracefully with alerts.
   */
  async getAccessToken(): Promise<string> {
    const now = Date.now();
    if (global.__driveAccessToken && global.__driveTokenExpiresAt && global.__driveTokenExpiresAt > now + 300000) {
      return global.__driveAccessToken;
    }

    if (!this.clientId || !this.clientSecret || !this.refreshToken) {
      try {
        const settings = await getPaymentProofsSettingsDb();
        if (settings.client_id) this.clientId = settings.client_id;
        if (settings.client_secret) this.clientSecret = settings.client_secret;
        if (settings.refresh_token) this.refreshToken = settings.refresh_token;
        if (settings.root_folder_id && !this.rootFolderId) this.rootFolderId = settings.root_folder_id;
      } catch (err) {}
    }

    if (!this.clientId || !this.clientSecret || !this.refreshToken) {
      throw new Error("Google Drive credentials are not fully configured in environment variables or database settings.");
    }

    const tokenUrl = "https://oauth2.googleapis.com/token";
    const bodyParams = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      refresh_token: this.refreshToken,
      grant_type: "refresh_token",
    });

    try {
      const res = await fetch(tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: bodyParams.toString(),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errMessage = errorData.error_description || errorData.error || `HTTP ${res.status}`;

        // Update health status in DB
        await updatePaymentProofsSettingsDb({
          last_health_check_at: new Date().toISOString().slice(0, 19).replace("T", " "),
          last_health_status: "disconnected",
          last_health_error: `OAuth Token Refresh Failed: ${errMessage}`,
        }).catch(() => {});

        throw new Error(`Google OAuth Refresh Failed (${res.status}): ${errMessage}`);
      }

      const tokenData = await res.json();
      const accessToken = tokenData.access_token;
      const expiresInSec = Number(tokenData.expires_in) || 3600;

      global.__driveAccessToken = accessToken;
      global.__driveTokenExpiresAt = now + expiresInSec * 1000;

      // Mark healthy in DB
      await updatePaymentProofsSettingsDb({
        last_health_check_at: new Date().toISOString().slice(0, 19).replace("T", " "),
        last_health_status: "connected",
        last_health_error: null,
      }).catch(() => {});

      return accessToken;
    } catch (err: any) {
      console.error("[Google Drive Storage] Token refresh error:", err.message);
      throw err;
    }
  }

  /**
   * Resolves or ensures the active root folder ID.
   */
  async getRootFolderId(): Promise<string> {
    if (this.rootFolderId) {
      return this.rootFolderId;
    }

    const settings = await getPaymentProofsSettingsDb();
    if (settings.root_folder_id) {
      this.rootFolderId = settings.root_folder_id;
      return this.rootFolderId;
    }

    // In drive.file scope mode, create root folder if not already existing
    if (this.scopeMode === "drive.file") {
      const token = await this.getAccessToken();
      const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "GJTF Payment Proofs",
          mimeType: "application/vnd.google-apps.folder",
          description: "GJTF Foundation automated payment proofs root folder",
        }),
      });

      if (createRes.ok) {
        const data = await createRes.json();
        this.rootFolderId = data.id;
        await updatePaymentProofsSettingsDb({ root_folder_id: data.id }).catch(() => {});
        return data.id;
      }
    }

    throw new Error("GOOGLE_DRIVE_ROOT_FOLDER_ID is required for Google Drive storage driver.");
  }

  /**
   * Safety Lock: Verifies that a target file or folder is an authentic descendant of rootFolderId.
   * Walks parent IDs recursively and caches verified IDs.
   */
  async verifyAncestry(fileOrFolderId: string, depth = 0): Promise<boolean> {
    const rootId = await this.getRootFolderId();

    if (fileOrFolderId === rootId) {
      return true;
    }

    if (global.__verifiedAncestryCache?.has(fileOrFolderId)) {
      return true;
    }

    if (depth > 6) {
      throw new Error(`Ancestry lock violation: Maximum folder depth exceeded for ID ${fileOrFolderId}`);
    }

    const token = await this.getAccessToken();
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileOrFolderId)}?fields=id,name,parents,trashed`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      throw new Error(`Failed to verify ancestry for Drive ID ${fileOrFolderId} (HTTP ${res.status})`);
    }

    const data = await res.json();
    if (data.trashed) {
      throw new Error(`Drive item ${fileOrFolderId} is trashed`);
    }

    const parents: string[] = data.parents || [];
    if (parents.length === 0) {
      throw new Error(`Security Violation: Drive item ${fileOrFolderId} is outside GJTF root folder hierarchy`);
    }

    for (const parentId of parents) {
      if (parentId === rootId) {
        global.__verifiedAncestryCache?.add(fileOrFolderId);
        return true;
      }
      const isParentVerified = await this.verifyAncestry(parentId, depth + 1);
      if (isParentVerified) {
        global.__verifiedAncestryCache?.add(fileOrFolderId);
        return true;
      }
    }

    throw new Error(`Security Violation: Drive item ${fileOrFolderId} has no ancestry to GJTF root folder`);
  }

  /**
   * Lazy creation of Year (YYYY) and Month (MM-MonthName) folders with DB race-safety and self-healing.
   */
  async getOrCreateMonthFolder(date: Date = new Date()): Promise<{
    folderId: string;
    folderPath: string;
    pathKey: string;
  }> {
    await ensurePaymentProofTablesDb();
    const rootId = await this.getRootFolderId();
    const folderInfo = getProofFolderPath(date);
    const pathKey = folderInfo.pathKey; // e.g. "2026/10"

    // 1. Check database for existing folder mapping
    const existingDb = await query<RowDataPacket[]>(
      "SELECT * FROM drive_folders WHERE path_key = ? LIMIT 1",
      [pathKey]
    );

    if (existingDb && existingDb.length > 0) {
      const cachedFolderId = existingDb[0].drive_folder_id;
      // Verify self-healing: check if folder is active in Drive
      const isStillValid = await this.isFolderActiveInDrive(cachedFolderId);
      if (isStillValid) {
        return {
          folderId: cachedFolderId,
          folderPath: folderInfo.folderPath,
          pathKey,
        };
      }
      // If folder was trashed or deleted in Drive, continue below to heal/recreate it!
    }

    const token = await this.getAccessToken();

    // 2. Find or Create Year Folder (e.g. "2026") under Root Folder
    const yearFolderId = await this.findOrCreateFolderUnderParent(
      token,
      rootId,
      folderInfo.year
    );

    // 3. Find or Create Month Folder (e.g. "10-October") under Year Folder
    const monthFolderId = await this.findOrCreateFolderUnderParent(
      token,
      yearFolderId,
      folderInfo.monthFolder
    );

    // 4. Concurrency-safe UPSERT in database
    const folderRecordId = `df_${pathKey.replace("/", "_")}`;
    await query(`
      INSERT INTO drive_folders (id, path_key, folder_name, drive_folder_id, parent_folder_id, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        drive_folder_id = VALUES(drive_folder_id),
        parent_folder_id = VALUES(parent_folder_id);
    `, [
      folderRecordId,
      pathKey,
      folderInfo.monthFolder,
      monthFolderId,
      yearFolderId,
    ]);

    global.__verifiedAncestryCache?.add(yearFolderId);
    global.__verifiedAncestryCache?.add(monthFolderId);

    return {
      folderId: monthFolderId,
      folderPath: folderInfo.folderPath,
      pathKey,
    };
  }

  private async isFolderActiveInDrive(folderId: string): Promise<boolean> {
    try {
      const token = await this.getAccessToken();
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(folderId)}?fields=id,trashed,mimeType`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        return !data.trashed && data.mimeType === "application/vnd.google-apps.folder";
      }
    } catch {}
    return false;
  }

  private async findOrCreateFolderUnderParent(
    token: string,
    parentId: string,
    folderName: string
  ): Promise<string> {
    // Query existing folder
    const q = `name = '${folderName.replace(/'/g, "\\'")}' and '${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,createdTime)&orderBy=createdTime asc`;

    const searchRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (searchData.files && searchData.files.length > 0) {
        // Deterministically pick the oldest created folder if duplicates exist in Drive
        return searchData.files[0].id;
      }
    }

    // Folder does not exist, create it
    const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: folderName,
        mimeType: "application/vnd.google-apps.folder",
        parents: [parentId],
      }),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      throw new Error(`Failed to create Drive folder '${folderName}': ${errText}`);
    }

    const newFolder = await createRes.json();
    return newFolder.id;
  }

  /**
   * Uploads a payment proof file to Google Drive under the Asia/Karachi Year/Month folder.
   */
  async put(fileBuffer: Buffer, meta: PutMeta): Promise<PutResult> {
    const uploadDate = meta.uploadDate || new Date();
    const folderResult = await this.getOrCreateMonthFolder(uploadDate);
    const folderInfo = getProofFolderPath(uploadDate);

    // Compute SHA-256 of the authentic unencrypted buffer
    const sha256 = crypto.createHash("sha256").update(fileBuffer).digest("hex");

    // File naming mode
    const settings = await getPaymentProofsSettingsDb();
    const isEncryptionOn = settings.encryption_enabled || process.env.PROOF_ENCRYPTION === "on";

    const seq = meta.sequenceNumber || 1;
    let filename = "";
    if (settings.filename_mode === "random") {
      filename = `${crypto.randomUUID()}.${isEncryptionOn ? "bin" : "webp"}`;
    } else {
      // Reference mode: GJTF-YYYY-NNNNNN_proof-1_YYYYMMDD-HHMM.webp
      filename = `${meta.referenceNo}_proof-${seq}_${folderInfo.localTimestampFormatted}.${isEncryptionOn ? "bin" : "webp"}`;
    }

    // Encrypt if encryption is enabled
    const encryptedData = encryptFileBuffer(fileBuffer, isEncryptionOn);
    const payloadToUpload = encryptedData.ciphertextBuffer;
    const uploadMime = encryptedData.isEncrypted ? "application/octet-stream" : meta.mime || "image/webp";

    const token = await this.getAccessToken();

    // Multipart upload to Google Drive v3 API
    const boundary = "-------314159265358979323846";
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadataPart = JSON.stringify({
      name: filename,
      parents: [folderResult.folderId],
      appProperties: {
        proofId: meta.proofId || "",
        donationRef: meta.referenceNo,
        source: "gjtf",
        sha256: sha256,
      },
    });

    const multipartHeader = Buffer.from(
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      metadataPart +
      delimiter +
      `Content-Type: ${uploadMime}\r\n\r\n`
    );
    const multipartFooter = Buffer.from(closeDelimiter);
    const fullBody = Buffer.concat([multipartHeader, payloadToUpload, multipartFooter]);

    const uploadRes = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
        "Content-Length": String(fullBody.length),
      },
      body: fullBody,
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      throw new Error(`Google Drive upload failed (${uploadRes.status}): ${errText}`);
    }

    const driveFile = await uploadRes.json();
    global.__verifiedAncestryCache?.add(driveFile.id);

    return {
      fileId: driveFile.id,
      folderId: folderResult.folderId,
      folderPath: folderResult.folderPath,
      filename,
      sizeBytes: fileBuffer.length,
      mime: meta.mime,
      sha256,
      isEncrypted: encryptedData.isEncrypted,
      encryptionVersion: encryptedData.encryptionVersion,
      wrappedDataKey: encryptedData.wrappedDataKey,
      encryptionIv: encryptedData.encryptionIv,
      encryptionTag: encryptedData.encryptionTag,
      webViewLink: driveFile.webViewLink || null,
    };
  }

  /**
   * Fetches and decrypts a proof file from Google Drive server-side.
   */
  async get(
    fileId: string,
    encryptionMeta?: {
      isEncrypted: boolean;
      wrappedDataKey?: string | null;
      encryptionIv?: string | null;
      encryptionTag?: string | null;
    }
  ): Promise<GetFileResult> {
    // 1. Ancestry Safety Lock verification
    await this.verifyAncestry(fileId);

    const token = await this.getAccessToken();

    // 2. Fetch file content via alt=media
    const downloadRes = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!downloadRes.ok) {
      throw new Error(`Failed to download proof from Drive (HTTP ${downloadRes.status})`);
    }

    const arrayBuffer = await downloadRes.arrayBuffer();
    const rawBuffer = Buffer.from(arrayBuffer);

    // 3. Decrypt if file is encrypted
    const finalBuffer = encryptionMeta?.isEncrypted
      ? decryptFileBuffer(rawBuffer, encryptionMeta)
      : rawBuffer;

    return {
      buffer: finalBuffer,
      mime: encryptionMeta?.isEncrypted ? "image/webp" : (downloadRes.headers.get("content-type") || "image/webp"),
      size: finalBuffer.length,
    };
  }

  /**
   * Permanently deletes a proof file from Google Drive.
   */
  async delete(fileId: string): Promise<boolean> {
    await this.verifyAncestry(fileId);

    const token = await this.getAccessToken();
    const deleteRes = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (deleteRes.status === 204 || deleteRes.status === 200 || deleteRes.status === 404) {
      global.__verifiedAncestryCache?.delete(fileId);
      return true;
    }

    const err = await deleteRes.text();
    console.error(`[Google Drive] Permanent delete failed (${deleteRes.status}): ${err}`);
    return false;
  }

  /**
   * Checks if a file exists and is an authentic descendant of root.
   */
  async exists(fileId: string): Promise<boolean> {
    try {
      await this.verifyAncestry(fileId);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Evaluates storage health, OAuth validity, root folder status,
   * quota usage, and verifies NO public permission on root folder.
   */
  async health(): Promise<StorageHealth> {
    const todayFolder = getProofFolderPath();

    try {
      const token = await this.getAccessToken();
      const rootId = await this.getRootFolderId();

      // 1. Check root folder exists and is not trashed
      const rootRes = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(rootId)}?fields=id,name,trashed,permissions`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!rootRes.ok) {
        return {
          healthy: false,
          message: `Root folder inaccessible (HTTP ${rootRes.status})`,
          storageDriver: "google-drive",
          rootFolderId: rootId,
          folderPathToday: todayFolder.folderPath,
        };
      }

      const rootData = await rootRes.json();
      if (rootData.trashed) {
        return {
          healthy: false,
          message: `Root folder is in trash! Please restore it in Google Drive.`,
          storageDriver: "google-drive",
          rootFolderId: rootId,
          folderPathToday: todayFolder.folderPath,
        };
      }

      // 2. Check for public permissions (Security lock)
      let publicPermissionDetected = false;
      if (Array.isArray(rootData.permissions)) {
        publicPermissionDetected = rootData.permissions.some(
          (p: any) => p.type === "anyone" || p.id === "anyoneWithLink"
        );
      }

      // 3. Check storage quota via about.get
      const aboutRes = await fetch("https://www.googleapis.com/drive/v3/about?fields=storageQuota,user", {
        headers: { Authorization: `Bearer ${token}` },
      });

      let quotaInfo: any = undefined;
      if (aboutRes.ok) {
        const aboutData = await aboutRes.json();
        const sq = aboutData.storageQuota || {};
        const limitBytes = Number(sq.limit) || 15 * 1024 * 1024 * 1024; // 15 GB default
        const usageBytes = Number(sq.usageInDrive || sq.usage) || 0;
        const percentUsed = limitBytes > 0 ? Math.round((usageBytes / limitBytes) * 100) : 0;

        const formatGB = (bytes: number) => (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
        quotaInfo = {
          limitBytes,
          usageBytes,
          percentUsed,
          limitFormatted: formatGB(limitBytes),
          usageFormatted: formatGB(usageBytes),
        };
      }

      return {
        healthy: true,
        message: publicPermissionDetected
          ? "CRITICAL WARNING: Root folder has a public permission ('Anyone with link'). Remove public access immediately!"
          : "Connected and healthy",
        storageDriver: "google-drive",
        rootFolderId: rootId,
        publicPermissionDetected,
        quota: quotaInfo,
        folderPathToday: todayFolder.folderPath,
      };
    } catch (err: any) {
      return {
        healthy: false,
        message: `Storage disconnected: ${err.message}`,
        storageDriver: "google-drive",
        folderPathToday: todayFolder.folderPath,
      };
    }
  }
}
