import { getSiteSettingsAction } from "@/app/actions/siteSettings";
import {
  getAdminSecuritySettingsAction,
  getDatabaseMetricsAction,
} from "@/app/actions/security";
import AdminSettingsClient from "./AdminSettingsClient";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const [siteSettings, securitySettings, metrics] = await Promise.all([
    getSiteSettingsAction().catch(() => null),
    getAdminSecuritySettingsAction().catch(() => null),
    getDatabaseMetricsAction().catch(() => null),
  ]);

  return (
    <AdminSettingsClient
      initialSiteSettings={siteSettings}
      initialSecuritySettings={securitySettings}
      initialMetrics={metrics}
    />
  );
}
