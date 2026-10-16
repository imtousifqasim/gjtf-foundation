/**
 * Live Foreign Exchange (FX) Engine for GJTF Foundation.
 * Manages live AED <-> PKR conversion, caching in fx_rates, 1% buffer,
 * 48-hour rate locking, and stale fallback mechanisms.
 */

import { roundAedCeil } from "./money";

export interface FxRateRecord {
  baseCurrency: string; // "PKR"
  targetCurrency: string; // "AED"
  rate: number; // e.g. 0.013072 (1 PKR in AED)
  pkrPerAed: number; // e.g. 76.5 (1 AED in PKR)
  bufferPct: number; // default 1.0%
  effectiveRate: number; // rate * (1 + bufferPct/100)
  provider: string;
  isStale: boolean;
  fetchedAt: Date;
  validUntil: Date;
}

// Fallback rates if external API is unreachable and no DB rate exists
export const DEFAULT_MANUAL_PKR_PER_AED = 76.5; // 1 AED = 76.5 PKR
export const DEFAULT_FX_BUFFER_PCT = 1.0; // 1% buffer
export const FX_RATE_LOCK_HOURS = 48; // Pledges lock rate for 48 hours

/**
 * Calculates AED amount from PKR with buffer and round-up.
 * Formula: aed = Math.ceil(pkrAmount * rate * (1 + bufferPct/100))
 */
export function convertPkrToAed(
  pkrAmount: number,
  ratePkrToAed: number = 1 / DEFAULT_MANUAL_PKR_PER_AED,
  bufferPct: number = DEFAULT_FX_BUFFER_PCT
): { aedAmount: number; effectiveRate: number; bufferPct: number } {
  const bufferMultiplier = 1 + bufferPct / 100;
  const effectiveRate = ratePkrToAed * bufferMultiplier;
  const rawAed = pkrAmount * effectiveRate;
  const aedAmount = roundAedCeil(rawAed);

  return {
    aedAmount,
    effectiveRate,
    bufferPct,
  };
}

/**
 * Calculates PKR amount from AED when pledge_basis is 'aed_fixed'.
 */
export function convertAedToPkr(
  aedAmount: number,
  ratePkrToAed: number = 1 / DEFAULT_MANUAL_PKR_PER_AED,
  bufferPct: number = DEFAULT_FX_BUFFER_PCT
): { pkrAmount: number; effectiveRate: number } {
  const bufferMultiplier = 1 + bufferPct / 100;
  const effectiveRate = ratePkrToAed * bufferMultiplier;
  const pkrAmount = Math.round(aedAmount / effectiveRate);

  return {
    pkrAmount,
    effectiveRate,
  };
}

/**
 * Locks an FX rate for a pledge for 48 hours.
 */
export function lockFxRate(
  pkrAmount: number,
  ratePkrToAed: number = 1 / DEFAULT_MANUAL_PKR_PER_AED,
  bufferPct: number = DEFAULT_FX_BUFFER_PCT
) {
  const lockedAt = new Date();
  const validUntil = new Date(lockedAt.getTime() + FX_RATE_LOCK_HOURS * 60 * 60 * 1000);
  const { aedAmount, effectiveRate } = convertPkrToAed(pkrAmount, ratePkrToAed, bufferPct);

  return {
    pkrAmount,
    aedAmount,
    fxRate: ratePkrToAed,
    fxBufferPct: bufferPct,
    effectiveRate,
    fxLockedAt: lockedAt,
    fxValidUntil: validUntil,
    lockNotice: `AED ${aedAmount} = PKR ${pkrAmount.toLocaleString()} (Rate: 1 AED ≈ ${(1 / ratePkrToAed).toFixed(2)} PKR incl. ${bufferPct}% buffer, valid for 48 hours until ${validUntil.toLocaleDateString("en-US", { month: "short", day: "numeric" })})`,
  };
}

/**
 * Fetches live exchange rate for AED/PKR from configured or fallback exchange-rate API.
 */
export async function fetchLiveExchangeRate(provider: string = "exchangerate-api"): Promise<{
  rate: number;
  pkrPerAed: number;
  provider: string;
  isStale: boolean;
}> {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/AED", {
      next: { revalidate: 1800 },
      headers: { "User-Agent": "GJTF-Foundation-FX/1.0" },
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.rates?.PKR) {
        const pkrPerAed = Number(data.rates.PKR);
        const rate = 1 / pkrPerAed;
        return {
          rate,
          pkrPerAed,
          provider: "open.er-api.com",
          isStale: false,
        };
      }
    }
  } catch (err) {
    console.warn("Live FX fetch failed, falling back to cached/manual:", err);
  }

  return {
    rate: 1 / DEFAULT_MANUAL_PKR_PER_AED,
    pkrPerAed: DEFAULT_MANUAL_PKR_PER_AED,
    provider: "manual_fallback",
    isStale: true,
  };
}

