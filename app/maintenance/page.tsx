import MaintenanceClient from "./MaintenanceClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Maintenance | BPI - BeepAgro Palliative Initiative",
  description: "We are upgrading the platform. We'll be back shortly.",
};

export default function MaintenancePage() {
  // Read the target return time from env (ISO string or unix ms).
  // If unset, default to 2 hours from the time the server rendered this page.
  const rawUntil = process.env.MAINTENANCE_UNTIL;
  let targetMs: number;
  if (rawUntil) {
    const parsed = Date.parse(rawUntil);
    targetMs = isNaN(parsed) ? Date.now() + 2 * 60 * 60 * 1000 : parsed;
  } else {
    targetMs = Date.now() + 2 * 60 * 60 * 1000;
  }

  return <MaintenanceClient targetMs={targetMs} />;
}
