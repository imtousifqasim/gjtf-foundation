/**
 * Money and Currency Utilities for GJTF Foundation.
 * All financial storage is canonicalized to integer minor units (paisa for PKR, fils for AED).
 * Floating-point numbers are NEVER used for financial calculations or storage.
 */

export const MINOR_UNIT_DECIMALS: Record<string, number> = {
  PKR: 2, // 1 PKR = 100 Paisa
  AED: 2, // 1 AED = 100 Fils
  USD: 2, // 1 USD = 100 Cents
};

/**
 * Converts a major currency unit (e.g. 5000 PKR) to integer minor units (500000 paisa).
 */
export function toMinorUnits(amount: number | string, currency: string = "PKR"): bigint {
  const dec = MINOR_UNIT_DECIMALS[currency.toUpperCase()] ?? 2;
  const str = typeof amount === "number" ? amount.toFixed(dec) : String(amount).trim();

  if (!str || isNaN(Number(str))) {
    return BigInt(0);
  }

  const parts = str.split(".");
  const whole = parts[0] || "0";
  let fraction = parts[1] || "";

  if (fraction.length > dec) {
    fraction = fraction.slice(0, dec);
  } else {
    fraction = fraction.padEnd(dec, "0");
  }

  const sign = whole.startsWith("-") ? "-" : "";
  const cleanWhole = whole.replace(/^-/, "");
  return BigInt(`${sign}${cleanWhole}${fraction}`);
}

/**
 * Converts integer minor units (500000 paisa) back to major units (5000).
 */
export function toMajorUnits(minor: bigint | number | string, currency: string = "PKR"): number {
  const dec = MINOR_UNIT_DECIMALS[currency.toUpperCase()] ?? 2;
  const num = typeof minor === "bigint" ? Number(minor) : Number(minor) || 0;
  return num / Math.pow(10, dec);
}

/**
 * Formats a major or minor currency amount for human display.
 */
export function formatCurrencyAmount(
  amount: number | bigint | string,
  currency: string = "PKR",
  isMinor: boolean = false
): string {
  const curr = currency.toUpperCase();
  const majorValue = isMinor ? toMajorUnits(amount, curr) : Number(amount) || 0;

  const formattedNumber = Math.round(majorValue).toLocaleString("en-US");
  return `${curr} ${formattedNumber}`;
}

/**
 * Rounds an AED amount UP to the next whole dirham as required by Section 15.5.
 */
export function roundAedCeil(aedAmount: number): number {
  return Math.ceil(aedAmount);
}
