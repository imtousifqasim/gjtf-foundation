export interface PutMeta {
  donationId: string;
  referenceNo: string;
  sequenceNumber?: number;
  mime: string;
  originalFilename?: string;
  proofId?: string;
  uploadDate?: Date;
}

export interface PutResult {
  fileId: string;
  folderId: string;
  folderPath: string;
  filename: string;
  sizeBytes: number;
  mime: string;
  sha256: string;
  isEncrypted: boolean;
  encryptionVersion?: number;
  wrappedDataKey?: string | null;
  encryptionIv?: string | null;
  encryptionTag?: string | null;
  webViewLink?: string | null;
}

export interface GetFileResult {
  buffer: Buffer;
  mime: string;
  size: number;
  filename?: string;
}

export interface StorageHealth {
  healthy: boolean;
  message: string;
  storageDriver: string;
  rootFolderId?: string;
  quota?: {
    limitBytes: number;
    usageBytes: number;
    percentUsed: number;
    limitFormatted: string;
    usageFormatted: string;
  };
  publicPermissionDetected?: boolean;
  folderPathToday?: string;
  error?: string;
  hasPublicPermissions?: boolean;
  driver?: string;
}

export interface ProofStorage {
  put(fileBuffer: Buffer, meta: PutMeta): Promise<PutResult>;
  get(fileId: string, encryptionMeta?: { isEncrypted: boolean; wrappedDataKey?: string | null; encryptionIv?: string | null; encryptionTag?: string | null }): Promise<GetFileResult>;
  delete(fileId: string): Promise<boolean>;
  exists(fileId: string): Promise<boolean>;
  health(): Promise<StorageHealth>;
}
