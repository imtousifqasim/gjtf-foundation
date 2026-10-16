/**
 * Single source of truth for pricing constants and impact calculations.
 * Rebuilt strictly around the "child-month" unit:
 * Educating ONE child for ONE month costs PKR 5,000.
 * 30 children (classroom unit) cost PKR 150,000 / month.
 * 50 children cost PKR 250,000 / month.
 */

export interface PricingConfig {
  version: number;
  costPerChildMonthPkr: number; // 5000
  costPerChildMonthMinor: bigint; // 500000 paisa
  classroomSize: number; // 30
  presetChildCounts: number[]; // [1, 2, 5, 10, 30, 50]
  minCustomAmountPkr: number; // 500
  maxCustomAmountPkr: number; // 10000000
  sponsorshipMonths: number; // 120 (KG to Matric, 10 years)
}

export const DEFAULT_PRICING: PricingConfig = {
  version: 1,
  costPerChildMonthPkr: 5000,
  costPerChildMonthMinor: BigInt(500000),
  classroomSize: 30,
  presetChildCounts: [1, 2, 5, 10, 30, 50],
  minCustomAmountPkr: 500,
  maxCustomAmountPkr: 10000000,
  sponsorshipMonths: 120,
};

export interface ImpactResult {
  childrenCount: number;
  childMonths: number;
  childMonthsFunded: number;
  headline: string;
  summary: string;
  description: string;
  badge: string;
  isFractional: boolean;
  percentageOfChild?: number;
  isTruthfulPooled: boolean;
}


/**
 * Shared server-side and client-side impact calculation helper.
 * Used by /donate-now, APIs, emails, donor dashboard, and admin reports.
 */
export function calculateImpact(
  amountPkr: number,
  frequency: "monthly" | "once" = "monthly",
  pricing: PricingConfig = DEFAULT_PRICING
): ImpactResult {
  const cost = pricing.costPerChildMonthPkr || 5000;
  const safeAmount = Math.max(0, Number(amountPkr) || 0);

  if (frequency === "monthly") {
    const rawChildren = safeAmount / cost;
    const children = Math.round(rawChildren * 100) / 100;
    const isFractional = children % 1 !== 0;

    let headline = "";
    let badge = "";
    let percentageOfChild: number | undefined;

    if (children === 0) {
      headline = "Enter an amount to see your educational impact";
      badge = "Support Children";
    } else if (children === 1) {
      headline = "Full education for 1 child every month";
      badge = "1 Child / Month";
    } else if (children >= 30 && children % 30 === 0) {
      const classrooms = children / 30;
      headline = `Full education for ${classrooms} entire classroom${classrooms > 1 ? "s" : ""} (${children} children) every month`;
      badge = `${children} Children (Classroom)`;
    } else if (children >= 1) {
      headline = `Full education for ${children} children every month`;
      badge = `${children} Children / Month`;
    } else {
      const pct = Math.round(children * 100);
      percentageOfChild = pct;
      headline = `${pct}% of 1 child's full monthly education`;
      badge = `${pct}% Child Support`;
    }

    const summary = children > 0
      ? `Your monthly pledge of PKR ${safeAmount.toLocaleString()} covers tuition, syllabus books, uniforms, warm meals, and teacher salaries for ${children === 1 ? "1 child" : `${children} children`} in nomadic settlement schools.`
      : "Your donation is pooled with community contributions to provide holistic education for nomadic children.";

    return {
      childrenCount: children,
      childMonths: children, // 1 month of coverage for N children
      childMonthsFunded: children,
      headline,
      summary,
      description: summary,
      badge,
      isFractional,
      percentageOfChild,
      isTruthfulPooled: true,
    };
  }


  // Frequency === "once" (Single Gift)
  const rawChildMonths = safeAmount / cost;
  const childMonths = Math.round(rawChildMonths * 100) / 100;
  const isFractional = childMonths % 1 !== 0;

  let headline = "";
  let badge = "";
  let percentageOfChild: number | undefined;

  if (childMonths === 0) {
    headline = "Enter an amount to see your educational impact";
    badge = "Support Children";
  } else if (childMonths >= 12 && childMonths % 12 === 0) {
    const years = childMonths / 12;
    headline = `Full education for 1 child for ${years} academic year${years > 1 ? "s" : ""} (${childMonths} child-months)`;
    badge = `${childMonths} Child-Months`;
  } else if (childMonths === 1) {
    headline = "Full education for 1 child for 1 month";
    badge = "1 Child-Month";
  } else if (childMonths > 1) {
    headline = `Provides ${childMonths} child-months of education`;
    badge = `${childMonths} Child-Months`;
  } else {
    const pct = Math.round(childMonths * 100);
    percentageOfChild = pct;
    headline = `${pct}% of 1 child's education for 1 month`;
    badge = `${pct}% Child-Month`;
  }

  const summary = childMonths > 0
    ? `Your contribution of PKR ${safeAmount.toLocaleString()} provides ${childMonths} child-months of uninterrupted schooling, learning kits, and nutrition in nomadic settlements.`
    : "Your contribution directly funds classroom materials and teacher stipends for children residing in temporary jhuggi settlements.";

  return {
    childrenCount: childMonths >= 1 ? Math.floor(childMonths) : childMonths,
    childMonths,
    childMonthsFunded: childMonths,
    headline,
    summary,
    description: summary,
    badge,
    isFractional,
    percentageOfChild,
    isTruthfulPooled: true,
  };
}

