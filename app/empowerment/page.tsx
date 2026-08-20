import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import EmpowermentShell from "@/components/empowerment/EmpowermentShell";
import EmpowermentContent from "@/components/empowerment/EmpowermentContent";

export const dynamic = "force-dynamic";

export default async function EmpowermentPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <EmpowermentShell session={session}>
      <EmpowermentContent />
    </EmpowermentShell>
  );
}
