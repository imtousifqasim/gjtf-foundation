import { NextResponse } from "next/server";
import { getLiveStatsDb } from "@/lib/db/mysql";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const stats = await getLiveStatsDb();
    return NextResponse.json({ success: true, data: stats });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        data: {
          totalSchools: 24,
          totalStudents: 7000,
          yearsOfService: 11,
          nomadsTargetMillion: 20,
        },
      },
      { status: 200 }
    );
  }
}
