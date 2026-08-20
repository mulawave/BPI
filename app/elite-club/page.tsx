import { auth } from '@/server/auth';
import { redirect } from 'next/navigation';
import EliteClubShell from '@/components/elite-club/EliteClubShell';
import EliteClubContent from '@/components/elite-club/EliteClubContent';

export const dynamic = 'force-dynamic';

export default async function EliteClubPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  return (
    <EliteClubShell session={session}>
      <EliteClubContent />
    </EliteClubShell>
  );
}
