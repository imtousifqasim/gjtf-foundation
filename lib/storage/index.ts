import { ProofStorage } from "./types";
import { GoogleDriveStorage } from "./googleDrive";

let storageInstance: ProofStorage | null = null;

export function getProofStorage(): ProofStorage {
  if (storageInstance) {
    return storageInstance;
  }

  const driver = process.env.PROOF_STORAGE_DRIVER || "google-drive";

  if (driver === "google-drive") {
    storageInstance = new GoogleDriveStorage();
    return storageInstance;
  }

  // Fallback to Google Drive
  storageInstance = new GoogleDriveStorage();
  return storageInstance;
}

export * from "./types";
export * from "./folderPath";
export * from "./encryption";
export * from "./googleDrive";
