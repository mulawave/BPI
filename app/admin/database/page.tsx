import { redirect } from "next/navigation";
import DatabaseMaintenancePanel from "@/components/admin/DatabaseMaintenancePanel";
import { requireSuperAdmin } from "@/lib/adminAuth";

export default async function DatabaseMaintenancePage() {
  try {
    await requireSuperAdmin();
  } catch (err) {
    redirect("/admin");
  }

  return <DatabaseMaintenancePanel />;
}
