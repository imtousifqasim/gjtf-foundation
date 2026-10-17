import { submitDonation } from "../app/actions/donations";
import { getEnabledCurrenciesDb } from "../lib/db/paymentProofsSchema";

describe("PKR-Only Currency Lockdown & Server-Side Enforcement", () => {
  jest.setTimeout(30000);

  test("getEnabledCurrenciesDb returns ['PKR']", async () => {
    const enabled = await getEnabledCurrenciesDb();
    expect(enabled).toEqual(["PKR"]);
  });

  test("server strictly rejects AED pledge when only PKR is enabled", async () => {
    const result = await submitDonation({
      cause: "Educate a Child",
      frequency: "once",
      currency: "AED" as any,
      amount: 67,
      country: "United Arab Emirates",
      donor_name: "Test Donor",
      donor_email: "test.donor.aed@example.com",
      donation_type: "General",
      payment_method: "bank_transfer",
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain("disabled");
    expect(result.message).toContain("Only PKR donations are accepted");
  });

  test("server accepts PKR pledge and creates pending donation with bank details & redirectUrl", async () => {
    const result = await submitDonation({
      cause: "Educate a Child",
      frequency: "once",
      currency: "PKR",
      amount: 5000,
      country: "Pakistan",
      donor_name: "Ahmad Khan",
      donor_email: `ahmad.test.${Date.now()}@example.com`,
      idempotency_key: `idemp_test_${Date.now()}`,
      donation_type: "General",
      payment_method: "bank_transfer",
    });

    expect(result.success).toBe(true);
    expect(result.displayCurrency).toBe("PKR");
    expect(result.displayAmount).toBe(5000);
    expect(result.proofStatus).toBe("none");
    expect(result.bankAccount).toBeDefined();
    expect(result.bankAccount?.bank_name).toBe("Bank Islami");
    expect(result.redirectUrl).toBeDefined();
    expect(result.redirectUrl).toContain("/donate-now/pay/GJTF-");
  });
});
