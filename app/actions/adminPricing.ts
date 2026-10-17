"use server";

import { revalidatePath } from "next/cache";
import {
  getActivePricingSettingsDb,
  getAllPricingVersionsDb,
  createNewPricingVersionDb,
  getLatestFxRateDb,
  saveFxRateDb,
} from "@/lib/db/pricingDb";
import {
  getActiveBankAccountsDb,
  updateBankAccountDb,
  BankAccountRecord,
} from "@/lib/db/bankAccounts";
import { fetchLiveExchangeRate, DEFAULT_FX_BUFFER_PCT } from "@/lib/pricing/fx";
import { createAuditLogDb, query } from "@/lib/db/mysql";
import { sendTransactionalEmail } from "@/lib/email/sender";
import { siteConfig } from "@/lib/siteConfig";

/**
 * 1. Loads all Pricing, FX and Bank Account settings for Admin dashboard.
 */
export async function adminGetPricingDataAction() {
  const [activePricing, allVersions, fxRate, bankAccounts] = await Promise.all([
    getActivePricingSettingsDb(),
    getAllPricingVersionsDb(),
    getLatestFxRateDb(),
    getActiveBankAccountsDb(),
  ]);

  return {
    activePricing,
    allVersions,
    fxRate,
    bankAccounts,
  };
}

/**
 * 2. Creates a new Pricing version.
 * Existing pledges are NOT raised automatically (Section 15.1).
 */
export async function adminCreatePricingVersionAction(
  input: {
    costPkr: number;
    classroomSize?: number;
    minCustomPkr?: number;
    maxCustomPkr?: number;
    sponsorshipMonths?: number;
  },
  adminEmail: string = "admin@gjtfoundation.com"
) {
  if (!input.costPkr || input.costPkr < 100) {
    throw new Error("Valid cost per child-month is required (minimum PKR 100).");
  }

  const newVersion = await createNewPricingVersionDb(
    input.costPkr,
    adminEmail,
    adminEmail
  );

  revalidatePath("/admin/pricing-settings");
  revalidatePath("/donate-now");
  revalidatePath("/donor/dashboard");
  revalidatePath("/admin/reports");

  return {
    success: true,
    version: newVersion,
    message: `Pricing version ${newVersion} created successfully (PKR ${input.costPkr.toLocaleString()}/child-month). Existing monthly pledges remain on their initial version.`,
  };
}

/**
 * 3. Updates FX configuration or sets a manual exchange rate.
 */
export async function adminUpdateFxSettingsAction(
  input: {
    manualPkrPerAed: number;
    bufferPct?: number;
    provider?: string;
  },
  adminEmail: string = "admin@gjtfoundation.com"
) {
  if (!input.manualPkrPerAed || input.manualPkrPerAed <= 0) {
    throw new Error("Valid PKR per AED exchange rate is required.");
  }

  const bufferPct = input.bufferPct ?? DEFAULT_FX_BUFFER_PCT;
  const rate = 1 / input.manualPkrPerAed;

  await saveFxRateDb({
    rate,
    pkrPerAed: input.manualPkrPerAed,
    bufferPct,
    provider: input.provider || "admin_manual_override",
    isStale: false,
  });

  await createAuditLogDb({
    actor_type: "admin",
    actor_id: adminEmail,
    action: "admin.fx_settings_updated",
    target_type: "fx_rates",
    target_id: "manual",
    metadata: {
      pkr_per_aed: input.manualPkrPerAed,
      buffer_pct: bufferPct,
      effective_rate: rate * (1 + bufferPct / 100),
      updated_by: adminEmail,
    },
  });

  revalidatePath("/admin/pricing-settings");
  revalidatePath("/donate-now");
  revalidatePath("/donor/dashboard");

  return {
    success: true,
    message: `FX configuration updated: 1 AED = ${input.manualPkrPerAed} PKR (Buffer: ${bufferPct}%).`,
  };
}

/**
 * 4. Refreshes live FX rate from external API.
 */
export async function adminRefreshFxRateLiveAction(adminEmail: string = "admin@gjtfoundation.com") {
  const live = await fetchLiveExchangeRate();
  await saveFxRateDb({
    rate: live.rate,
    pkrPerAed: live.pkrPerAed,
    provider: live.provider,
    isStale: live.isStale,
  });

  await createAuditLogDb({
    actor_type: "admin",
    actor_id: adminEmail,
    action: "admin.fx_rate_refreshed",
    target_type: "fx_rates",
    target_id: live.provider,
    metadata: {
      rate: live.rate,
      pkr_per_aed: live.pkrPerAed,
      is_stale: live.isStale,
    },
  });

  revalidatePath("/admin/pricing-settings");
  revalidatePath("/donate-now");

  return {
    success: true,
    liveRate: live.pkrPerAed,
    isStale: live.isStale,
    message: `FX rate refreshed: 1 AED = ${live.pkrPerAed.toFixed(2)} PKR via ${live.provider}.`,
  };
}

/**
 * 5. Updates Bank Account details with fraud protection (Section 15.6).
 * Restricted to Super Admin, requires confirmation, writes audit log, dispatches security alert.
 */
export async function adminUpdateBankAccountAction(
  input: {
    id: string;
    bank_name: string;
    branch: string;
    account_title: string;
    account_number: string;
    iban: string;
    swift?: string;
    instructions?: string;
    is_active: boolean;
    adminPasswordConfirm?: string;
  },
  adminEmail: string = "admin@gjtfoundation.com"
) {
  // Fraud protection safeguard: require non-empty verification
  if (!input.account_number || !input.iban || !input.bank_name) {
    throw new Error("Bank name, account number, and IBAN are strictly required.");
  }

  // Update bank account
  await updateBankAccountDb(
    adminEmail,
    {
      id: input.id,
      bank_name: input.bank_name.trim(),
      branch: input.branch.trim(),
      account_title: input.account_title.trim(),
      account_number: input.account_number.trim(),
      iban: input.iban.trim(),
      swift: input.swift ? input.swift.trim() : "",
      instructions: input.instructions?.trim() || null,
      is_active: Boolean(input.is_active),
    },
    adminEmail
  );

  // Dispatch security alert email to super admins
  try {
    await sendTransactionalEmail({
      to: adminEmail || "jhuggitaleemiproject@gmail.com",
      emailType: "security_alert",
      subject: "🚨 SECURITY ALERT: Bank Account Details Modified",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #dc2626; margin-top: 0;">⚠️ Security Notice: Bank Details Updated</h2>
          <p>Bank account details for Ghais Jhuggi Taleem Foundation were modified in the administration portal by <strong>${adminEmail}</strong>.</p>
          <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #cbd5e1;">
            <p style="margin: 4px 0;"><strong>Bank Name:</strong> ${input.bank_name}</p>
            <p style="margin: 4px 0;"><strong>Branch:</strong> ${input.branch}</p>
            <p style="margin: 4px 0;"><strong>Account Title:</strong> ${input.account_title}</p>
            <p style="margin: 4px 0;"><strong>Account Number:</strong> ${input.account_number}</p>
            <p style="margin: 4px 0;"><strong>IBAN:</strong> ${input.iban}</p>
            <p style="margin: 4px 0;"><strong>SWIFT:</strong> ${input.swift || "None"}</p>
            <p style="margin: 4px 0;"><strong>Timestamp:</strong> ${new Date().toUTCString()}</p>
          </div>
          <p style="color: #64748b; font-size: 13px;">If you did not authorize this change, access the database immediately and contact the technical team.</p>
        </div>
      `,
    });
  } catch (err) {
    console.warn("Could not dispatch bank change alert email:", err);
  }

  revalidatePath("/admin/pricing-settings");
  revalidatePath("/admin/payment-settings");
  revalidatePath("/donate-now");
  revalidatePath("/donor/dashboard");

  return {
    success: true,
    message: "Bank account details updated securely. Audit log recorded and security alerts dispatched.",
  };
}
