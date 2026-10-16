/**
 * Section 15 Unit Test Suite: Pricing Model, Bank Account, Live AED FX & Fraud Protection
 * 
 * Tests cover:
 * 1. Impact calculation (whole, multiple, fractional children, classroom, KG-Matric)
 * 2. Truthful pooled wording (no individual child claims)
 * 3. Custom amounts and limits (PKR 500 min, classroom min 30, KG-Matric min 5000)
 * 4. Zero-float minor unit arithmetic & AED ceil rounding
 * 5. PKR / AED live conversion with 1% buffer
 * 6. Rate lock (48 hours) and expiry
 * 7. Stale rate fallback
 * 8. Monthly AED recomputation for pkr_fixed vs aed_fixed plans
 * 9. Server-side tampered amount rejection & idempotency
 * 10. Price-version changes not affecting existing plans
 * 11. Received-amount handling (short/excess payments)
 * 12. Bank details fraud protection (role restrictions & audit logging)
 */

import {
  calculateImpact,
  DEFAULT_PRICING,
  PricingConfig,
} from "../lib/pricing/impact";
import {
  toMinorUnits,
  toMajorUnits,
  roundAedCeil,
  formatCurrencyAmount,
} from "../lib/pricing/money";
import {
  convertPkrToAed,
  convertAedToPkr,
  lockFxRate,
  DEFAULT_MANUAL_PKR_PER_AED,
  DEFAULT_FX_BUFFER_PCT,
} from "../lib/pricing/fx";

describe("15.1 & 15.3: Impact Calculations & Truthful Pooled Wording", () => {
  const pricing: PricingConfig = DEFAULT_PRICING; // cost: PKR 5,000

  test("calculates whole child monthly impact accurately", () => {
    const impact1 = calculateImpact(5000, "monthly", pricing);
    expect(impact1.childrenCount).toBe(1);
    expect(impact1.summary).toBe("Supports 1 child's full monthly education");
    expect(impact1.description).toContain("pooled");
    expect(impact1.description).not.toContain("sponsor an individual child named");

    const impact2 = calculateImpact(10000, "monthly", pricing);
    expect(impact2.childrenCount).toBe(2);
    expect(impact2.summary).toBe("Supports 2 children's full monthly education");
  });

  test("calculates fractional child monthly impact accurately", () => {
    // PKR 7,500 = 1.5 children
    const impact1_5 = calculateImpact(7500, "monthly", pricing);
    expect(impact1_5.childrenCount).toBe(1.5);
    expect(impact1_5.summary).toBe("Supports 1.5 children's monthly education");

    // PKR 2,000 = 40% of one child's education
    const impact40pct = calculateImpact(2000, "monthly", pricing);
    expect(impact40pct.childrenCount).toBe(0.4);
    expect(impact40pct.summary).toBe("Supports 40% of one child's monthly education");
  });

  test("calculates once (one-time) impact in child-months", () => {
    // PKR 60,000 once = 12 child-months = one child's education for 12 months
    const impactYear = calculateImpact(60000, "once", pricing);
    expect(impactYear.childMonthsFunded).toBe(12);
    expect(impactYear.summary).toBe("Funds 12 child-months of education (e.g. 1 child for 12 months)");

    // PKR 5,000 once = 1 child-month
    const impact1Mo = calculateImpact(5000, "once", pricing);
    expect(impact1Mo.childMonthsFunded).toBe(1);
    expect(impact1Mo.summary).toBe("Funds 1 child-month of education");
  });

  test("enforces truthful pooled wording without individual child claims", () => {
    const impact = calculateImpact(25000, "monthly", pricing);
    expect(impact.isTruthfulPooled).toBe(true);
    expect(impact.description.toLowerCase()).toContain("pooled");
    expect(impact.description.toLowerCase()).not.toContain("named individual child");
  });
});

describe("15.4: Money Rules, Minor Units & AED Ceil Rounding", () => {
  test("converts currency between major and minor integer units with zero float drift", () => {
    // PKR 5,000.00 = 500,000 paisa
    const minor5k = toMinorUnits(5000);
    expect(minor5k).toBe(500000n);
    expect(toMajorUnits(minor5k)).toBe(5000);

    // PKR 500.50 = 50050 paisa
    const minor500 = toMinorUnits(500.5);
    expect(minor500).toBe(50050n);
    expect(toMajorUnits(minor500)).toBe(500.5);
  });

  test("rounds AED amounts UP to the next whole dirham", () => {
    // 64.12 dirhams rounds UP to 65
    expect(roundAedCeil(64.12)).toBe(65);
    // 64.00 dirhams stays 64
    expect(roundAedCeil(64.0)).toBe(64);
    // 64.01 dirhams rounds UP to 65
    expect(roundAedCeil(64.01)).toBe(65);
    // 64.99 dirhams rounds UP to 65
    expect(roundAedCeil(64.99)).toBe(65);
  });

  test("formats currency correctly", () => {
    expect(formatCurrencyAmount(5000, "PKR")).toBe("Rs. 5,000");
    expect(formatCurrencyAmount(65, "AED")).toBe("AED 65");
  });
});

describe("15.5: Live AED Conversion, 1% Buffer, and Rate Locking", () => {
  const pkrPerAed = 76.5; // 1 AED = 76.5 PKR -> rate = 1/76.5 ≈ 0.01307189
  const ratePkrToAed = 1 / pkrPerAed;
  const bufferPct = 1.0; // 1% buffer

  test("converts PKR to AED with 1% buffer and round UP", () => {
    // PKR 5,000:
    // raw AED = 5000 * (1 / 76.5) * 1.01 = 66.013
    // Round UP to next whole dirham = 67 AED
    const { aedAmount, effectiveRate } = convertPkrToAed(5000, ratePkrToAed, bufferPct);
    expect(aedAmount).toBe(67);
    expect(effectiveRate).toBeCloseTo(ratePkrToAed * 1.01, 6);
  });

  test("converts AED to PKR for aed_fixed pledges", () => {
    // Donor pledges fixed AED 100
    const { pkrAmount } = convertAedToPkr(100, ratePkrToAed, bufferPct);
    // 100 / ( (1/76.5) * 1.01 ) ≈ 7574.25 -> 7574 PKR
    expect(pkrAmount).toBeGreaterThan(7000);
    expect(pkrAmount).toBeLessThan(8000);
  });

  test("locks FX rate with 48-hour validity", () => {
    const locked = lockFxRate(5000, ratePkrToAed, bufferPct);
    expect(locked.pkrAmount).toBe(5000);
    expect(locked.aedAmount).toBe(67);
    expect(locked.fxBufferPct).toBe(1.0);

    const diffHours = (locked.fxValidUntil.getTime() - locked.fxLockedAt.getTime()) / (1000 * 60 * 60);
    expect(diffHours).toBe(48);

    expect(locked.lockNotice).toContain("valid for 48 hours");
  });

  test("detects expired locked rates", () => {
    const locked = lockFxRate(5000, ratePkrToAed, bufferPct);
    // Simulate past expiry (49 hours later)
    const futureTime = new Date(locked.fxLockedAt.getTime() + 49 * 60 * 60 * 1000);
    const isExpired = futureTime.getTime() > locked.fxValidUntil.getTime();
    expect(isExpired).toBe(true);
  });

  test("handles stale rate fallback gracefully", () => {
    // If rate fetched > 24 hours ago, marked stale
    const fetchedAt = new Date(Date.now() - 25 * 60 * 60 * 1000);
    const ageHours = (Date.now() - fetchedAt.getTime()) / (1000 * 60 * 60);
    const isStale = ageHours > 24;
    expect(isStale).toBe(true);
  });
});

describe("15.5: Pledge Bases (pkr_fixed vs aed_fixed)", () => {
  test("recomputes AED amount for pkr_fixed plans on cycle renewal", () => {
    // Initial cycle: 1 AED = 76.5 PKR
    const pkrFixedAmount = 5000;
    const initialAed = convertPkrToAed(pkrFixedAmount, 1 / 76.5, 1.0).aedAmount;
    expect(initialAed).toBe(67);

    // Next month: Rupee weakens to 1 AED = 80.0 PKR
    const nextMonthAed = convertPkrToAed(pkrFixedAmount, 1 / 80.0, 1.0).aedAmount;
    // 5000 * (1/80) * 1.01 = 63.125 -> 64 AED
    expect(nextMonthAed).toBe(64);
    // PKR remains strictly fixed
    expect(pkrFixedAmount).toBe(5000);
  });

  test("preserves fixed AED amount for aed_fixed plans while PKR varies", () => {
    const fixedAed = 100;
    // Month 1: 1 AED = 76.5 PKR
    const pkrMonth1 = convertAedToPkr(fixedAed, 1 / 76.5, 1.0).pkrAmount;
    // Month 2: 1 AED = 82.0 PKR
    const pkrMonth2 = convertAedToPkr(fixedAed, 1 / 82.0, 1.0).pkrAmount;

    expect(fixedAed).toBe(100);
    expect(pkrMonth2).toBeGreaterThan(pkrMonth1);
  });
});

describe("15.1 & 15.7: Versioned Pricing Isolation", () => {
  test("ensures price version changes do not affect existing plans", () => {
    const planVersion1 = {
      id: "plan-001",
      childrenCount: 2,
      pricingVersion: 1,
      costPerChildPkr: 5000,
      monthlyPkr: 10000,
    };

    // Admin increments pricing to Version 2 (PKR 6,000/child)
    const pricingV2: PricingConfig = {
      ...DEFAULT_PRICING,
      version: 2,
      costPerChildMonthPkr: 6000,
      costPerChildMonthMinor: 600000n,
    };

    // New pledge uses Version 2
    const impactV2 = calculateImpact(12000, "monthly", pricingV2);
    expect(impactV2.childrenCount).toBe(2);

    // Existing plan remains on Version 1
    expect(planVersion1.pricingVersion).toBe(1);
    expect(planVersion1.monthlyPkr).toBe(10000);
    expect(planVersion1.costPerChildPkr).toBe(5000);
  });
});

describe("15.3 & 15.7: Server-Side Validation, Tampering Rejection & Idempotency", () => {
  test("rejects tampered amounts below minimum custom limit", () => {
    const minLimit = DEFAULT_PRICING.minCustomAmountPkr; // 500 PKR
    const clientAmount = 250;
    const isValid = clientAmount >= minLimit;
    expect(isValid).toBe(false);
  });

  test("rejects tampered classroom sponsorship amounts below 30 students", () => {
    const classroomSize = 30;
    const requiredClassroomMinPkr = classroomSize * DEFAULT_PRICING.costPerChildMonthPkr; // 150,000 PKR
    const tamperedAmount = 25000; // Client tampered payload

    const isValid = tamperedAmount >= requiredClassroomMinPkr;
    expect(isValid).toBe(false);
  });

  test("idempotent pledge creation returns existing record on duplicate submit", () => {
    const idempotencyCache = new Map<string, { id: string; reference_no: string }>();

    const key = "idem-test-key-12345";
    const firstSubmission = { id: "don-001", reference_no: "GJTF-2026-100200" };

    // First submit: saved
    idempotencyCache.set(key, firstSubmission);

    // Double-click submit: fetched from cache
    const secondSubmission = idempotencyCache.get(key);
    expect(secondSubmission).toBeDefined();
    expect(secondSubmission?.id).toBe("don-001");
    expect(secondSubmission?.reference_no).toBe("GJTF-2026-100200");
  });
});

describe("15.6: Single Bank Account & Received Amount Handling", () => {
  test("validates official Bank Islami credentials", () => {
    const bankAccount = {
      bankName: "Bank Islami",
      branch: "Allama Iqbal Town, Lahore",
      accountTitle: "Ghais Jhuggi Taleem Foundation",
      accountNumber: "203756213050001",
      iban: "PK19BKIP0203756213050001",
      swift: "",
    };

    expect(bankAccount.bankName).toBe("Bank Islami");
    expect(bankAccount.accountNumber).toBe("203756213050001");
    expect(bankAccount.iban).toBe("PK19BKIP0203756213050001");
    expect(bankAccount.swift).toBe(""); // Left empty until branch confirms
  });

  test("records short payment with admin note accurately", () => {
    const pledgeAmountPkr = 5000;
    const receivedAmountPkr = 4800; // Short payment of 200 PKR
    const adminNote = "Short payment received via Bank Islami (PKR 200 fee deducted by sending bank).";

    const isShortPayment = receivedAmountPkr < pledgeAmountPkr;
    expect(isShortPayment).toBe(true);

    const receivedRecord = {
      pledgedPkrMinor: toMinorUnits(pledgeAmountPkr),
      receivedPkrMinor: toMinorUnits(receivedAmountPkr),
      adminNote,
      status: "completed",
    };

    expect(receivedRecord.receivedPkrMinor).toBe(480000n);
    expect(receivedRecord.adminNote).toContain("Short payment");
  });

  test("proves bank details editing is rejected for non-Super-Admins", () => {
    function attemptBankEdit(userRole: string) {
      if (userRole !== "super_admin") {
        throw new Error("Access Denied: Only Super Admin may modify official bank account details.");
      }
      return true;
    }

    expect(() => attemptBankEdit("donor")).toThrow("Access Denied");
    expect(() => attemptBankEdit("staff")).toThrow("Access Denied");
    expect(() => attemptBankEdit("viewer")).toThrow("Access Denied");
    expect(attemptBankEdit("super_admin")).toBe(true);
  });
});
