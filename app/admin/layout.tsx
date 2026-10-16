import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/admin";
import { AdminLayoutClient } from "@/components/admin/AdminLayoutClient";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const reqHeaders = await headers();
  const pathname = reqHeaders.get("x-pathname") || "";

  // If on login page, render children without sidebar/topbar
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  // Defence in depth: Verify server-side admin session before generating any layout or child markup
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  return (
    <AdminLayoutClient adminEmail={session.email}>
      {children}
    </AdminLayoutClient>
  );
}
