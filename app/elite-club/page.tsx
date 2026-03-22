import { auth } from '@/server/auth';
import { redirect } from 'next/navigation';
import DashboardShell from '@/components/layout/DashboardShell';
import EliteClubContent from '@/components/elite-club/EliteClubContent';

export const dynamic = 'force-dynamic';

export default async function EliteClubPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  return (
    <DashboardShell session={session}>
      <EliteClubContent />
    </DashboardShell>
  );
}
