import MaintenanceClient from "./MaintenanceClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Maintenance | BPI - BeepAgro Palliative Initiative",
  description: "We are upgrading the platform. We'll be back shortly.",
};

export default async function MaintenancePage() {
  // Read the estimated return time from AdminSettings (set via admin panel).
  // Fall back to 2 hours from now if unset or unparseable.
  let targetMs: number;
  try {
    const { prisma } = await import("@/lib/prisma");
    const row = await prisma.adminSettings.findUnique({
      where: { settingKey: "maintenance_until" },
    });
    const parsed = row?.settingValue ? Date.parse(row.settingValue) : NaN;
    targetMs = isNaN(parsed) ? Date.now() + 2 * 60 * 60 * 1000 : parsed;
  } catch {
    targetMs = Date.now() + 2 * 60 * 60 * 1000;
  }

  return <MaintenanceClient targetMs={targetMs} />;
}
