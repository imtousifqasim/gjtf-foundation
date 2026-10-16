"use server";

import { getAdminSession } from "@/lib/auth/admin";
import { query } from "@/lib/db/mysql";
import { RowDataPacket } from "mysql2/promise";

export interface SqlQueryResult {
  success: boolean;
  data?: any[];
  columns?: string[];
  count?: number;
  durationMs?: number;
  error?: string;
}

/**
 * Runs a query on the Hostinger MySQL database securely for authenticated admins.
 */
export async function runAdminSqlQueryAction(sqlQuery: string): Promise<SqlQueryResult> {
  const session = await getAdminSession();
  if (!session) {
    return { success: false, error: "Unauthorized: Admin session required." };
  }

  const trimmed = sqlQuery.trim();
  if (!trimmed) {
    return { success: false, error: "Query cannot be empty." };
  }

  // Safety filter: Block catastrophic database destruction
  const upper = trimmed.toUpperCase();
  if (
    upper.includes("DROP DATABASE") ||
    upper.includes("SHUTDOWN") ||
    upper.includes("GRANT ALL") ||
    upper.includes("FLUSH PRIVILEGES")
  ) {
    return {
      success: false,
      error: "Command blocked: Critical administrative command not permitted via web console.",
    };
  }

  const startTime = Date.now();
  try {
    const rawResult: any = await query(trimmed);
    const durationMs = Date.now() - startTime;

    if (Array.isArray(rawResult)) {
      const rows = rawResult as RowDataPacket[];
      const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
      return {
        success: true,
        data: rows,
        columns,
        count: rows.length,
        durationMs,
      };
    } else {
      // Non-SELECT (e.g. UPDATE, INSERT) result
      return {
        success: true,
        data: [rawResult],
        columns: Object.keys(rawResult || {}),
        count: rawResult?.affectedRows ?? 1,
        durationMs,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "SQL Execution Error",
      durationMs: Date.now() - startTime,
    };
  }
}

/**
 * Retrieves the list of all tables in the Hostinger MySQL database.
 */
export async function getAdminDatabaseTablesAction(): Promise<{ success: boolean; tables?: string[]; error?: string }> {
  const session = await getAdminSession();
  if (!session) {
    return { success: false, error: "Unauthorized: Admin session required." };
  }

  try {
    const rows: any = await query("SHOW TABLES");
    const tables: string[] = Array.isArray(rows)
      ? rows.map((r: any) => Object.values(r)[0] as string)
      : [];
    return { success: true, tables };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to list tables." };
  }
}

/**
 * Pings the Hostinger MySQL database to verify connectivity and measure latency.
 */
export async function pingDatabaseLatencyAction(): Promise<{ success: boolean; latencyMs?: number; error?: string }> {
  const session = await getAdminSession();
  if (!session) {
    return { success: false, error: "Unauthorized: Admin session required." };
  }

  const start = Date.now();
  try {
    await query("SELECT 1 as ping");
    const durationMs = Date.now() - start;
    return { success: true, latencyMs: durationMs };
  } catch (err: any) {
    return { success: false, error: err.message || "Database connection error." };
  }
}
