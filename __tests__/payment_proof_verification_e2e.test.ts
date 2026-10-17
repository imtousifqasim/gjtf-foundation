import {
  confirmDonationWithProofAction,
  rejectPaymentProofAdminAction,
  getDonationProofsAdminAction,
} from "@/app/actions/admin";
import { createPledgeAccessToken, verifyPledgeAccess } from "@/lib/db/pledgeTokens";
import { executePaymentProofRetention } from "@/lib/storage/retention";
import { GoogleDriveStorage } from "@/lib/storage/googleDrive";

// Mock requireAdmin to authenticate as Super Admin in unit/integration tests
jest.mock("@/lib/auth/admin", () => ({
  requireAdmin: jest.fn().mockResolvedValue({
    id: "admin-test-1",
    email: "superadmin@gjtf.org",
    role: "super_admin",
  }),
  getAdminSession: jest.fn().mockResolvedValue({
    id: "admin-test-1",
    email: "superadmin@gjtf.org",
    role: "super_admin",
  }),
}));

// Mock mysql query for predictable e2e action checks
jest.mock("@/lib/db/mysql", () => {
  const original = jest.requireActual("@/lib/db/mysql");
  return {
    ...original,
    query: jest.fn(),
    createAuditLogDb: jest.fn().mockResolvedValue({}),
    getOrCreateReceiptDb: jest.fn().mockResolvedValue({ receiptNo: "REC-2026-00099" }),
    cancelDonationReminderDb: jest.fn().mockResolvedValue({}),
  };
});

// Mock transactional email sender
jest.mock("@/lib/email/sender", () => ({
  sendTransactionalEmail: jest.fn().mockResolvedValue({ success: true }),
}));

describe("Payment Proof Verification & Admin Actions End-to-End", () => {
  const { query } = require("@/lib/db/mysql");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Admin Confirmation Flow (confirmDonationWithProofAction)", () => {
    test("Automatically generates system reference when bank transaction reference is missing or empty", async () => {
      query.mockImplementation(async (sql: string, params: any[]) => {
        if (sql.includes("SELECT * FROM donations WHERE id = ?")) {
          return [
            {
              id: "don-test-101",
              reference_no: "GJTF-2026-000101",
              amount: 5000,
              donor_name: "Tariq Mahmood",
              donor_email: "tariq@example.com",
              proof_status: "submitted",
              cause: "Education",
              frequency: "once",
            },
          ];
        }
        return [];
      });

      const res = await confirmDonationWithProofAction({
        donationId: "don-test-101",
        receivedAmount: 5000,
        bankAccountId: "ba-islami",
        bankTransactionRef: "   ",
      });

      expect(res.success).toBe(true);
      expect(res.receiptUrl).toMatch(/GJTF-2026-000101/);

      // Verify UPDATE was called with an auto-generated SYS-INV reference
      const donationUpdateCall = query.mock.calls.find((call: any[]) =>
        call[0].includes("UPDATE donations") && call[0].includes("status = 'completed'")
      );
      expect(donationUpdateCall).toBeDefined();
      expect(donationUpdateCall[1][1]).toMatch(/SYS-INV-GJTF-2026-000101/);
    });

    test("Automatically defaults to active bank account when bankAccountId is omitted", async () => {
      query.mockImplementation(async (sql: string, params: any[]) => {
        if (sql.includes("SELECT * FROM donations WHERE id = ?")) {
          return [
            {
              id: "don-test-101",
              reference_no: "GJTF-2026-000101",
              amount: 5000,
              donor_name: "Tariq Mahmood",
              donor_email: "tariq@example.com",
              proof_status: "submitted",
              cause: "Education",
              frequency: "once",
            },
          ];
        }
        return [];
      });

      const res = await confirmDonationWithProofAction({
        donationId: "don-test-101",
        receivedAmount: 5000,
        bankAccountId: "",
        bankTransactionRef: "TXN-998877",
      });

      expect(res.success).toBe(true);
    });

    test("Rejects confirmation when custom bank transaction reference is already used on another donation", async () => {
      query.mockImplementation(async (sql: string, params: any[]) => {
        if (sql.includes("SELECT * FROM donations WHERE id = ?")) {
          return [{ id: "don-test-101", reference_no: "GJTF-2026-000101" }];
        }
        if (sql.includes("SELECT id, reference_no FROM donations WHERE bank_transaction_ref = ?")) {
          return [{ id: "don-existing-888", reference_no: "GJTF-2026-000888" }];
        }
        return [];
      });

      const res = await confirmDonationWithProofAction({
        donationId: "don-test-101",
        receivedAmount: 5000,
        bankAccountId: "ba-islami",
        bankTransactionRef: "TXN-DUPLICATE-123",
      });

      expect(res.success).toBe(false);
      expect(res.error).toMatch(/Duplicate Bank Transaction Reference/i);
      expect(res.error).toMatch(/GJTF-2026-000888/);
    });

    test("Successfully confirms donation, updates proof_status, records receipt and returns receiptUrl", async () => {
      query.mockImplementation(async (sql: string, params: any[]) => {
        if (sql.includes("SELECT id, reference_no FROM donations WHERE bank_transaction_ref = ?")) {
          return []; // Unique reference
        }
        if (sql.includes("SELECT * FROM donations WHERE id = ?")) {
          return [
            {
              id: "don-test-101",
              reference_no: "GJTF-2026-000101",
              amount: 5000,
              donor_name: "Tariq Mahmood",
              donor_email: "tariq@example.com",
              plan_id: "plan-monthly-1",
              proof_status: "submitted",
              cause: "Education",
              frequency: "monthly",
            },
          ];
        }
        return [];
      });

      const res = await confirmDonationWithProofAction({
        donationId: "don-test-101",
        receivedAmount: 5000,
        bankAccountId: "ba-islami",
        bankTransactionRef: "TXN-UNIQUE-554433",
        adminNote: "Verified against Bank Islami online portal",
      });

      expect(res.success).toBe(true);
      expect(res.receiptUrl).toBe("/receipt/GJTF-2026-000101");

      // Verify UPDATE donations query was called with status 'completed' and 'approved'
      const donationUpdateCall = query.mock.calls.find((call: any[]) =>
        call[0].includes("UPDATE donations") && call[0].includes("status = 'completed'")
      );
      expect(donationUpdateCall).toBeDefined();

      // Verify recurring plan cycles were incremented
      const planUpdateCall = query.mock.calls.find((call: any[]) =>
        call[0].includes("UPDATE donation_plans") && call[0].includes("cycles_completed + 1")
      );
      expect(planUpdateCall).toBeDefined();

      // Verify payment proofs were updated to approved
      const proofUpdateCall = query.mock.calls.find((call: any[]) =>
        call[0].includes("UPDATE payment_proofs") && call[0].includes("status = 'approved'")
      );
      expect(proofUpdateCall).toBeDefined();
    });
  });

  describe("Admin Rejection Flow (rejectPaymentProofAdminAction)", () => {
    test("Rejection strictly requires a non-empty reason", async () => {
      const res = await rejectPaymentProofAdminAction({
        donationId: "don-test-101",
        reason: "    ",
      });

      expect(res.success).toBe(false);
      expect(res.error).toMatch(/Rejection reason is required/i);
    });

    test("Successfully sets proof_status = 'rejected', updates database and generates re-upload token", async () => {
      query.mockImplementation(async (sql: string, params: any[]) => {
        if (sql.includes("SELECT * FROM donations WHERE id = ?")) {
          return [
            {
              id: "don-test-101",
              reference_no: "GJTF-2026-000101",
              amount: 5000,
              donor_name: "Fatima Noor",
              donor_email: "fatima@example.com",
              donor_id: null, // Guest donor -> requires signed token link
            },
          ];
        }
        return [];
      });

      const res = await rejectPaymentProofAdminAction({
        donationId: "don-test-101",
        proofId: "proof-999",
        reason: "Screenshot does not show transaction date or reference ID. Please re-upload full receipt.",
      });

      expect(res.success).toBe(true);

      // Verify donations table marked as rejected
      const donationUpdate = query.mock.calls.find((call: any[]) =>
        call[0].includes("UPDATE donations SET proof_status = 'rejected'")
      );
      expect(donationUpdate).toBeDefined();

      // Verify payment_proofs row updated with reason and status = rejected
      const proofUpdate = query.mock.calls.find((call: any[]) =>
        call[0].includes("UPDATE payment_proofs") && call[0].includes("status = 'rejected'")
      );
      expect(proofUpdate).toBeDefined();
    });
  });

  describe("Duplicate SHA-256 Proof Detection", () => {
    test("Detects duplicate SHA-256 hash across pledges and produces warning", async () => {
      query.mockImplementation(async (sql: string, params: any[]) => {
        if (sql.includes("FROM payment_proofs p") || sql.includes("p.sha256 IN")) {
          return [
            {
              proof_id: "proof-old-55",
              sha256: "aabbccdd11223344556677889900aabbccdd11223344556677889900aabbccdd",
              donation_id: "don-previous-055",
              reference_no: "GJTF-2026-000055",
            },
          ];
        }
        if (sql.includes("FROM payment_proofs")) {
          return [
            {
              id: "proof-1",
              donation_id: "don-100",
              sha256: "aabbccdd11223344556677889900aabbccdd11223344556677889900aabbccdd",
              status: "submitted",
              filename: "payment_receipt.webp",
            },
          ];
        }
        return [];
      });

      const res = await getDonationProofsAdminAction("don-100");
      expect(res.success).toBe(true);
      expect(res.proofs.length).toBe(1);
      expect(res.duplicates.length).toBe(1);
      expect(res.duplicates[0].otherRefNo).toBe("GJTF-2026-000055");
    });
  });

  describe("Single-Pledge Access Token Lifecycle", () => {
    test("Generates and verifies 7-day scoped token", async () => {
      const donationId = "don-lifecycle-777";
      query.mockResolvedValue([]);

      const rawToken = await createPledgeAccessToken(donationId, "GJTF-2026-000777");
      expect(rawToken).toBeDefined();
      expect(rawToken.length).toBeGreaterThan(20);

      // Verify token
      query.mockImplementation(async (sql: string, params: any[]) => {
        if (sql.includes("FROM pledge_access_tokens")) {
          if (params && params[0] === donationId) {
            return [
              {
                id: "pat-1",
                donation_id: donationId,
                expires_at: new Date(Date.now() + 86400000), // tomorrow
              },
            ];
          }
          return [];
        }
        return [];
      });

      const isValid = await verifyPledgeAccess(donationId, "GJTF-2026-000777", rawToken);
      expect(isValid).toBe(true);

      // Different donation ID should fail
      const isInvalidDonation = await verifyPledgeAccess("don-other-999", "GJTF-2026-000999", rawToken);
      expect(isInvalidDonation).toBe(false);
    });
  });

  describe("Google Drive Ancestry Safety Lock", () => {
    test("Throws security violation when an item is not an authentic descendant of root", async () => {
      const driver = new GoogleDriveStorage();
      driver["clientId"] = "mock-client-id";
      driver["clientSecret"] = "mock-client-secret";
      driver["refreshToken"] = "mock-refresh-token";
      driver["rootFolderId"] = "root-folder-123";

      // Mock fetch returning file parents that never trace to root-folder-123
      global.fetch = jest.fn().mockImplementation(async (url: string) => {
        if (url.includes("oauth2.googleapis.com/token")) {
          return {
            ok: true,
            json: async () => ({ access_token: "fake-token", expires_in: 3600 }),
          };
        }
        if (url.includes("/drive/v3/files/foreign-file-999")) {
          return {
            ok: true,
            json: async () => ({ parents: ["unrelated-parent-000"] }),
          };
        }
        if (url.includes("/drive/v3/files/unrelated-parent-000")) {
          return {
            ok: true,
            json: async () => ({ parents: ["external-drive-root"] }),
          };
        }
        if (url.includes("/drive/v3/files/external-drive-root")) {
          return {
            ok: true,
            json: async () => ({ parents: [] }), // terminated without reaching root-folder-123
          };
        }
        return { ok: false, status: 404 };
      }) as any;

      await expect(driver.get("foreign-file-999")).rejects.toThrow(
        /Security Violation.*root/i
      );
    });
  });

  describe("Retention Cron Execution (executePaymentProofRetention)", () => {
    test("Skips execution when retention_days is 0 (never)", async () => {
      query.mockImplementation(async (sql: string) => {
        if (sql.includes("FROM payment_proofs_settings")) {
          return [{ retention_days: 0 }];
        }
        return [];
      });

      const res = await executePaymentProofRetention();
      expect(res.skipped).toBe(true);
      expect(res.reason).toMatch(/Retention disabled/i);
    });

    test("Deletes expired files and marks records deleted when retention_days is positive", async () => {
      query.mockImplementation(async (sql: string) => {
        if (sql.includes("FROM payment_proofs_settings")) {
          return [{ retention_days: 90 }];
        }
        if (sql.includes("SELECT id, drive_file_id, folder_path, filename, status, reviewed_at")) {
          return [
            {
              id: "proof-old-1",
              drive_file_id: "drive-file-old-1",
              status: "approved",
              reviewed_at: new Date(Date.now() - 100 * 86400000), // 100 days ago
            },
          ];
        }
        return [];
      });

      // Mock delete on storage
      const storageMock = require("@/lib/storage").getProofStorage();
      jest.spyOn(storageMock, "delete").mockResolvedValue(true);
      jest.spyOn(storageMock, "health").mockResolvedValue({ status: "healthy" });

      const res = await executePaymentProofRetention();
      expect(res.success).toBe(true);
      expect(res.expiredFound).toBe(1);
      expect(res.deletedCount).toBe(1);

      // Verify DB update set status = 'deleted'
      const updateCall = query.mock.calls.find((call: any[]) =>
        call[0].includes("UPDATE payment_proofs") && call[0].includes("status = 'deleted'")
      );
      expect(updateCall).toBeDefined();
    });
  });
});
