/**
 * Automatic Year and Month Folders Generator for GJTF Payment Proofs.
 * Decides folder path strictly based on upload timestamp converted to Asia/Karachi (PKT, UTC+5).
 * 
 * Layout:
 *   <ROOT FOLDER>
 *     2026
 *       10-October
 *       11-November
 *       12-December
 *     2027
 *       01-January
 */

export const MONTH_NAMES_EN = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export interface ProofFolderPathInfo {
  year: string; // "2026"
  monthNumber: string; // "10"
  monthName: string; // "October"
  monthFolder: string; // "October" (just month name)
  day: string; // "17"
  dateFolder: string; // "17-October"
  pathKey: string; // "2026/10/17"
  folderPath: string; // "2026/October/17-October"
  timezone: string; // "Asia/Karachi"
  localTimestampFormatted: string; // e.g. "20261016-1432"
}

/**
 * Converts a Date to the target timezone (default: Asia/Karachi)
 * and formats the Year -> MonthName -> Date folder structure.
 */
export function getProofFolderPath(
  date: Date = new Date(),
  timezone: string = process.env.APP_TIMEZONE || "Asia/Karachi"
): ProofFolderPathInfo {
  // Use Intl.DateTimeFormat with parts to guarantee exact local values in target timezone
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const partMap: Record<string, string> = {};
  for (const p of parts) {
    partMap[p.type] = p.value;
  }

  const year = partMap["year"] || String(date.getUTCFullYear());
  const monthNumber = partMap["month"] || String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = partMap["day"] || String(date.getUTCDate()).padStart(2, "0");
  const hour = partMap["hour"] || "00";
  const minute = partMap["minute"] || "00";

  const monthIdx = parseInt(monthNumber, 10) - 1;
  const monthName = MONTH_NAMES_EN[monthIdx] || "January";
  const monthFolder = monthName; // e.g. "October" (pure month name)
  const dateFolder = `${day}-${monthName}`; // e.g. "17-October"
  const pathKey = `${year}/${monthNumber}/${day}`;
  const folderPath = `${year}/${monthFolder}/${dateFolder}`;
  const localTimestampFormatted = `${year}${monthNumber}${day}-${hour}${minute}`;

  return {
    year,
    monthNumber,
    monthName,
    monthFolder,
    day,
    dateFolder,
    pathKey,
    folderPath,
    timezone,
    localTimestampFormatted,
  };
}
