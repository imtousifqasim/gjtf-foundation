import { NextResponse } from "next/server";
import { exportFullDatabaseSql } from "@/lib/db/mysql";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "sql";

    const sqlContent = await exportFullDatabaseSql();
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `gjtf_hostinger_mysql_backup_${dateStr}.${format === "txt" ? "txt" : "sql"}`;

    return new Response(sqlContent, {
      status: 200,
      headers: {
        "Content-Type": "application/sql; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (err: any) {
    console.error("Database backup generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate database backup", details: err.message },
      { status: 500 }
    );
  }
}
