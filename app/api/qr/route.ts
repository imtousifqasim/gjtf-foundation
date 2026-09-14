import { NextRequest, NextResponse } from "next/server";
import { getTwoFactorQRAction } from "@/app/actions/security";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email") || "tousifdev@outlook.com";
    const secret = searchParams.get("secret") || "GJTF2025SECUREAUTH7890";

    const res = await getTwoFactorQRAction(email, secret);
    return NextResponse.json(res);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "QR Generation Error" },
      { status: 500 }
    );
  }
}
