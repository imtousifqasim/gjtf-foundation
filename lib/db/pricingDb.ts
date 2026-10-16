import { query, RowDataPacket } from "./mysql";
import { PricingConfig, DEFAULT_PRICING } from "@/lib/pricing/impact";
import { DEFAULT_MANUAL_PKR_PER_AED, DEFAULT_FX_BUFFER_PCT } from "@/lib/pricing/fx";
import { createAuditLogDb } from "./mysql";

export async function ensurePricingTablesDb(): Promise<void> {
  // 1. pricing_settings (versioned)
  await query(`
    CREATE TABLE IF NOT EXISTS pricing_settings (
      id VARCHAR(64) PRIMARY KEY,
      version INT NOT NULL UNIQUE,
      cost_per_child_month_minor BIGINT NOT NULL DEFAULT 500000,
      classroom_size INT NOT NULL DEFAULT 30,
      preset_child_counts JSON NOT NULL,
      min_custom_amount_pkr INT NOT NULL DEFAULT 500,
      max_custom_amount_pkr INT NOT NULL DEFAULT 10000000,
      sponsorship_months INT NOT NULL DEFAULT 120,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      effective_from TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_by VARCHAR(128) NOT NULL DEFAULT 'system',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_active (is_active),
      INDEX idx_version (version)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Seed Version 1 if not exists
  await query(`
    INSERT IGNORE INTO pricing_settings (
      id, version, cost_per_child_month_minor, classroom_size, preset_child_counts,
      min_custom_amount_pkr, max_custom_amount_pkr, sponsorship_months, is_active, created_by
    ) VALUES (
      'pricing-v1', 1, 500000, 30, '[1, 2, 5, 10, 30, 50]',
      500, 10000000, 120, 1, 'system'
    );
  `);

  // 2. fx_rates
  await query(`
    CREATE TABLE IF NOT EXISTS fx_rates (
      id VARCHAR(64) PRIMARY KEY,
      base_currency VARCHAR(10) NOT NULL DEFAULT 'PKR',
      target_currency VARCHAR(10) NOT NULL DEFAULT 'AED',
      rate DECIMAL(16, 6) NOT NULL,
      pkr_per_aed DECIMAL(16, 6) NOT NULL,
      buffer_pct DECIMAL(5, 2) NOT NULL DEFAULT 1.00,
      effective_rate DECIMAL(16, 6) NOT NULL,
      provider VARCHAR(64) NOT NULL DEFAULT 'manual',
      is_stale TINYINT(1) NOT NULL DEFAULT 0,
      fetched_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_pair (base_currency, target_currency)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Seed default FX rate if not exists
  const defaultRate = 1 / DEFAULT_MANUAL_PKR_PER_AED;
  const defaultEffective = defaultRate * (1 + DEFAULT_FX_BUFFER_PCT / 100);

  await query(`
    INSERT IGNORE INTO fx_rates (
      id, base_currency, target_currency, rate, pkr_per_aed, buffer_pct, effective_rate, provider, is_stale
    ) VALUES (
      'fx-default', 'PKR', 'AED', ?, ?, ?, ?, 'manual', 0
    );
  `, [defaultRate, DEFAULT_MANUAL_PKR_PER_AED, DEFAULT_FX_BUFFER_PCT, defaultEffective]);
}

/**
 * Returns the currently active pricing settings.
 */
export async function getActivePricingSettingsDb(): Promise<PricingConfig> {
  try {
    await ensurePricingTablesDb();
    const rows = await query<RowDataPacket[]>(
      "SELECT * FROM pricing_settings WHERE is_active = 1 ORDER BY version DESC LIMIT 1"
    );
    if (!rows || rows.length === 0) {
      return DEFAULT_PRICING;
    }
    const r = rows[0];
    let presets = DEFAULT_PRICING.presetChildCounts;
    if (r.preset_child_counts) {
      presets = typeof r.preset_child_counts === "string" ? JSON.parse(r.preset_child_counts) : r.preset_child_counts;
    }

    const costPkr = Number(r.cost_per_child_month_minor) / 100;

    return {
      version: Number(r.version),
      costPerChildMonthPkr: costPkr || 5000,
      costPerChildMonthMinor: BigInt(r.cost_per_child_month_minor || 500000),
      classroomSize: Number(r.classroom_size) || 30,
      presetChildCounts: Array.isArray(presets) ? presets : [1, 2, 5, 10, 30, 50],
      minCustomAmountPkr: Number(r.min_custom_amount_pkr) || 500,
      maxCustomAmountPkr: Number(r.max_custom_amount_pkr) || 10000000,
      sponsorshipMonths: Number(r.sponsorship_months) || 120,
    };
  } catch {
    return DEFAULT_PRICING;
  }
}

/**
 * Creates a NEW version of pricing settings.
 * Existing pledges and monthly plans are NOT raised automatically (Section 15.1).
 */
export async function createNewPricingVersionDb(
  newCostPkr: number,
  adminId: string,
  actorEmail: string
): Promise<number> {
  await ensurePricingTablesDb();
  const current = await getActivePricingSettingsDb();
  const nextVersion = current.version + 1;
  const newMinor = BigInt(Math.round(newCostPkr * 100));

  // Mark previous versions inactive for future pledges
  await query("UPDATE pricing_settings SET is_active = 0");

  const newId = `pricing-v${nextVersion}`;
  await query(`
    INSERT INTO pricing_settings (
      id, version, cost_per_child_month_minor, classroom_size, preset_child_counts,
      min_custom_amount_pkr, max_custom_amount_pkr, sponsorship_months, is_active, created_by
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, 1, ?
    )
  `, [
    newId,
    nextVersion,
    newMinor.toString(),
    current.classroomSize,
    JSON.stringify(current.presetChildCounts),
    current.minCustomAmountPkr,
    current.maxCustomAmountPkr,
    current.sponsorshipMonths,
    actorEmail,
  ]);

  await createAuditLogDb({
    actor_type: "admin",
    actor_id: adminId,
    action: "pricing.version_created",
    target_type: "pricing_settings",
    target_id: newId,
    metadata: {
      old_version: current.version,
      old_cost_pkr: current.costPerChildMonthPkr,
      new_version: nextVersion,
      new_cost_pkr: newCostPkr,
      changed_by: actorEmail,
      note: "Existing pledges remain on original version without automatic alteration.",
    },
  });

  return nextVersion;
}

/**
 * Returns latest FX rate with buffer.
 */
export async function getLatestFxRateDb(): Promise<{
  rate: number;
  pkrPerAed: number;
  bufferPct: number;
  effectiveRate: number;
  isStale: boolean;
  fetchedAt: Date;
}> {
  try {
    await ensurePricingTablesDb();
    const rows = await query<RowDataPacket[]>(
      "SELECT * FROM fx_rates WHERE base_currency = 'PKR' AND target_currency = 'AED' ORDER BY fetched_at DESC LIMIT 1"
    );

    if (rows && rows.length > 0) {
      const r = rows[0];
      const rate = Number(r.rate);
      const buffer = Number(r.buffer_pct) || DEFAULT_FX_BUFFER_PCT;
      const effective = rate * (1 + buffer / 100);

      // Check staleness (if older than 24 hours, mark stale)
      const fetchedTime = new Date(r.fetched_at).getTime();
      const ageHours = (Date.now() - fetchedTime) / (1000 * 60 * 60);
      const isStale = Boolean(r.is_stale) || ageHours > 24;

      return {
        rate,
        pkrPerAed: Number(r.pkr_per_aed) || 1 / rate,
        bufferPct: buffer,
        effectiveRate: Number(r.effective_rate) || effective,
        isStale,
        fetchedAt: new Date(r.fetched_at),
      };
    }
  } catch (e) {
    console.warn("Could not load FX rate from DB, using fallback:", e);
  }

  const defaultRate = 1 / DEFAULT_MANUAL_PKR_PER_AED;
  return {
    rate: defaultRate,
    pkrPerAed: DEFAULT_MANUAL_PKR_PER_AED,
    bufferPct: DEFAULT_FX_BUFFER_PCT,
    effectiveRate: defaultRate * (1 + DEFAULT_FX_BUFFER_PCT / 100),
    isStale: false,
    fetchedAt: new Date(),
  };
}

/**
 * Returns all pricing versions ordered by version DESC.
 */
export async function getAllPricingVersionsDb(): Promise<any[]> {
  try {
    await ensurePricingTablesDb();
    const rows = await query<RowDataPacket[]>(
      "SELECT * FROM pricing_settings ORDER BY version DESC"
    );
    return rows || [];
  } catch {
    return [];
  }
}

/**
 * Inserts a newly fetched or manual FX rate into fx_rates.
 */
export async function saveFxRateDb(input: {
  rate: number;
  pkrPerAed: number;
  bufferPct?: number;
  provider?: string;
  isStale?: boolean;
}): Promise<void> {
  await ensurePricingTablesDb();
  const buffer = input.bufferPct ?? DEFAULT_FX_BUFFER_PCT;
  const effective = input.rate * (1 + buffer / 100);
  const id = `fx-${Date.now()}`;
  await query(`
    INSERT INTO fx_rates (
      id, base_currency, target_currency, rate, pkr_per_aed, buffer_pct, effective_rate, provider, is_stale, fetched_at
    ) VALUES (
      ?, 'PKR', 'AED', ?, ?, ?, ?, ?, ?, NOW()
    )
  `, [
    id,
    input.rate,
    input.pkrPerAed,
    buffer,
    effective,
    input.provider || "manual",
    input.isStale ? 1 : 0,
  ]);
}

