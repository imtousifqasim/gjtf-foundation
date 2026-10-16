import { NextRequest, NextResponse } from "next/server";
import {
  deleteContactMessageDb,
  deleteContactMessagesBulkDb,
  getContactMessagesDb,
  clearAllContactMessagesDb,
  createAuditLogDb,
} from "@/lib/db/mysql";
import { verifyAdminApi } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await verifyAdminApi(req);
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get("limit")) || 100;
    const data = await getContactMessagesDb(limit);

    return NextResponse.json({ success: true, data }, {
      headers: { "Cache-Control": "no-store, private, max-age=0" },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await verifyAdminApi(req);
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const queryId = searchParams.get("id");

    let ids: string[] = [];
    let isClearAll = false;
    let confirmation = "";

    if (queryId) {
      ids = [queryId];
    } else {
      try {
        const body = await req.json();
        if (body.clearAll) {
          isClearAll = true;
          confirmation = body.confirmation || "";
        } else if (Array.isArray(body.ids)) {
          ids = body.ids;
        } else if (body.id) {
          ids = [body.id];
        }
      } catch {}
    }

    if (isClearAll) {
      if (confirmation !== "DELETE") {
        return NextResponse.json(
          { success: false, error: "Confirmation code must be 'DELETE' to clear all messages." },
          { status: 400 }
        );
      }
      const count = await clearAllContactMessagesDb(confirmation);
      await createAuditLogDb({
        actor_type: "admin",
        actor_id: auth.session.email,
        action: "contact_messages.clear_all",
        target_type: "contact_submissions",
        metadata: { clearedCount: count },
      });
      return NextResponse.json({ success: true, count, message: `Cleared ${count} messages.` });
    }

    if (!ids || ids.length === 0) {
      return NextResponse.json({ success: false, error: "Missing message ID(s) to delete" }, { status: 400 });
    }

    let deletedCount = 0;
    if (ids.length === 1) {
      const ok = await deleteContactMessageDb(ids[0]);
      if (!ok) {
        return NextResponse.json({ success: false, error: "Record not found or already deleted." }, { status: 404 });
      }
      deletedCount = 1;
    } else {
      deletedCount = await deleteContactMessagesBulkDb(ids);
      if (deletedCount === 0) {
        return NextResponse.json({ success: false, error: "No records found or already deleted." }, { status: 404 });
      }
    }

    await createAuditLogDb({
      actor_type: "admin",
      actor_id: auth.session.email,
      action: "contact_messages.deleted",
      target_type: "contact_submissions",
      metadata: { deletedCount, ids },
    });

    return NextResponse.json({
      success: true,
      count: deletedCount,
      message: `${deletedCount} message(s) deleted successfully.`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
