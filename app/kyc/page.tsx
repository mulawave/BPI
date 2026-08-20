import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";
import KycVerificationFlow from "@/components/kyc/KycVerificationFlow";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Identity Verification (KYC) | BPI",
  description: "Complete your identity verification to unlock full platform access.",
};

export default async function KycPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <DashboardShell session={session}>
      <KycVerificationFlow />
    </DashboardShell>
  );
}
