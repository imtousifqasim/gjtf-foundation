import {
  ensurePaymentProofTablesDb,
  getEnabledCurrenciesDb,
  getPaymentProofsSettingsDb,
} from "../lib/db/paymentProofsSchema";

describe("Payment Proofs Database Schema & Currency Enforcement", () => {
  test("getEnabledCurrenciesDb returns only PKR by default", async () => {
    const currencies = await getEnabledCurrenciesDb();
    expect(currencies).toEqual(["PKR"]);
    expect(currencies.includes("AED")).toBe(false);
  });

  test("getPaymentProofsSettingsDb returns correct default configuration", async () => {
    const settings = await getPaymentProofsSettingsDb();
    expect(settings.storage_driver).toBe("google-drive");
    expect(settings.retention_days).toBe(90);
    expect(settings.max_active_proofs_per_pledge).toBe(3);
    expect(settings.max_file_size_bytes).toBe(5242880);
    expect(settings.allow_guest_uploads).toBe(true);
  });
});
