import { GoogleDriveStorage } from "../lib/storage/googleDrive";

describe("GoogleDriveStorage: Ancestry Lock, Lazy Folders & Security", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    delete (global as any).__driveAccessToken;
    delete (global as any).__driveTokenExpiresAt;
    (global as any).__verifiedAncestryCache?.clear();
  });

  test("Ancestry Lock: approves item inside root folder hierarchy", async () => {
    const storage = new GoogleDriveStorage({
      clientId: "mock-client-id",
      clientSecret: "mock-client-secret",
      refreshToken: "mock-refresh-token",
      rootFolderId: "root_12345",
    });

    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes("oauth2.googleapis.com/token")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ access_token: "mock_token_abc", expires_in: 3600 }),
        });
      }
      if (url.includes("files/child_999")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: "child_999", name: "test.webp", parents: ["month_folder_888"], trashed: false }),
        });
      }
      if (url.includes("files/month_folder_888")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: "month_folder_888", name: "10-October", parents: ["year_folder_777"], trashed: false }),
        });
      }
      if (url.includes("files/year_folder_777")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: "year_folder_777", name: "2026", parents: ["root_12345"], trashed: false }),
        });
      }
      return Promise.reject(new Error("Unknown URL: " + url));
    }) as any;

    const isVerified = await storage.verifyAncestry("child_999");
    expect(isVerified).toBe(true);
  });

  test("Ancestry Lock: rejects item outside root folder hierarchy", async () => {
    const storage = new GoogleDriveStorage({
      clientId: "mock-client-id",
      clientSecret: "mock-client-secret",
      refreshToken: "mock-refresh-token",
      rootFolderId: "root_12345",
    });

    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes("oauth2.googleapis.com/token")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ access_token: "mock_token_abc", expires_in: 3600 }),
        });
      }
      if (url.includes("files/alien_file_666")) {
        // Parents trace to an external folder "other_root_000", not "root_12345"
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: "alien_file_666", name: "other.pdf", parents: ["other_root_000"], trashed: false }),
        });
      }
      if (url.includes("files/other_root_000")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: "other_root_000", name: "My Drive", parents: [], trashed: false }),
        });
      }
      return Promise.reject(new Error("Unknown URL: " + url));
    }) as any;

    await expect(storage.verifyAncestry("alien_file_666")).rejects.toThrow("Security Violation");
  });

  test("Health check: detects public permissions and warns immediately", async () => {
    const storage = new GoogleDriveStorage({
      clientId: "mock-client-id",
      clientSecret: "mock-client-secret",
      refreshToken: "mock-refresh-token",
      rootFolderId: "root_12345",
    });

    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes("oauth2.googleapis.com/token")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ access_token: "mock_token_abc", expires_in: 3600 }),
        });
      }
      if (url.includes("files/root_12345")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            id: "root_12345",
            name: "GJTF Payment Proofs",
            trashed: false,
            permissions: [{ id: "anyoneWithLink", type: "anyone", role: "reader" }],
          }),
        });
      }
      if (url.includes("drive/v3/about")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            storageQuota: { limit: "16106127360", usage: "1073741824" }, // 1 GB / 15 GB
          }),
        });
      }
      return Promise.reject(new Error("Unknown URL: " + url));
    }) as any;

    const health = await storage.health();
    expect(health.healthy).toBe(true);
    expect(health.publicPermissionDetected).toBe(true);
    expect(health.message).toContain("CRITICAL WARNING: Root folder has a public permission");
    expect(health.quota?.usageFormatted).toBe("1.00 GB");
  });
});
