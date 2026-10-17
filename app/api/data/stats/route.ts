import { NextResponse } from "next/server";
import { getLiveStatsDb } from "@/lib/db/mysql";
import { schools } from "@/data/schools";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const stats = await getLiveStatsDb();
    return NextResponse.json(
      { success: true, data: stats },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=3600",
        },
      }
    );
  } catch (err: any) {
    const fallbackCount = schools.length;
    const fallbackStudents = schools.reduce((acc, s) => acc + (s.currentStudents || 0), 0);
    return NextResponse.json(
      {
        success: false,
        data: {
          totalSchools: fallbackCount,
          totalStudents: fallbackStudents,
          yearsOfService: 11,
          totalVolunteers: 10000,
          nomadsTargetMillion: 20,
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      }
    );
  }
}
