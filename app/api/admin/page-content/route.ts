import { NextResponse } from "next/server";
import { getPageContentsDb, savePageContentsDb } from "@/lib/db/mysql";
import { verifyAdminApi } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = searchParams.get("page") || undefined;
    const contents = await getPageContentsDb(page);
    return NextResponse.json({ success: true, data: contents });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  // P0 Security: Strict Admin Check for content modification
  const authCheck = await verifyAdminApi(req);
  if (!authCheck.authorized) {
    return authCheck.response;
  }

  try {
    const body = await req.json();
    const items = Array.isArray(body) ? body : body.items;

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ success: false, error: "Invalid items array" }, { status: 400 });
    }

    const res = await savePageContentsDb(items);
    return NextResponse.json({ success: true, count: res.count });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
