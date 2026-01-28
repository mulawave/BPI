import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import BlogContent from "@/components/BlogContent";
import DashboardShell from "@/components/layout/DashboardShell";

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  console.log("📚 Blog page loading...");

  try {
    const session = await auth();
    console.log("📚 Blog session check:", {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user ? (session.user as any).id : null
    });

    if (!session?.user) {
      console.log("❌ Blog: No session/user, redirecting to login");
      redirect("/login");
    }

    console.log("✅ Blog: Rendering content for user:", session.user.email);
    return (
      <DashboardShell session={session}>
        <BlogContent session={session} embedded />
      </DashboardShell>
    );
  } catch (error) {
    console.error("❌ Blog error:", error);
    redirect("/login");
  }
}
