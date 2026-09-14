import { getSmtpSettingsAction } from "@/app/actions/smtp";
import AdminSmtpClient from "./AdminSmtpClient";

export const dynamic = "force-dynamic";

export default async function AdminSmtpPage() {
  const config = await getSmtpSettingsAction().catch(() => null);

  return <AdminSmtpClient initialConfig={config} />;
}
