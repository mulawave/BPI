import Link from "next/link";
import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import CspShell from "@/components/csp/CspShell";

export const dynamic = "force-dynamic";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 space-y-3">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
      <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2 leading-relaxed">{children}</div>
    </section>
  );
}

export default async function HowCspWorksPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <CspShell session={session}>
      <div className="max-w-3xl mx-auto space-y-6 py-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">How CSP works</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            A plain-language guide to the Community Support Program. Every number below is an admin setting
            and may be adjusted from time to time — this page always reflects the current defaults.
          </p>
        </div>

        <Section title="1. Requesting support">
          <p>
            Submit a National or Global request once you meet the eligibility rules (minimum membership,
            referrals, and prior contributions to other members&apos; campaigns). Your campaign target is set
            at 120% of what you asked for — the extra 20% funds the program itself, so your own payout is
            never reduced by it.
          </p>
        </Section>

        <Section title="2. Going live">
          <p>
            Once approved, your request broadcasts to eligible members (National campaigns only show to
            members in your own country) for a countdown — 48 hours by default. Members contribute from
            their Cash or Community Wallet, and Auto-Contribute adds to this automatically for members who
            have it switched on.
          </p>
        </Section>

        <Section title="3. Buying extra time">
          <p>
            If you need more time, you can buy a 24h or 48h extension from your Main Wallet. The extension
            only takes effect once a matching amount has been contributed to your campaign — your own
            contribution to cover that fee doesn&apos;t count toward your own tier standing. An extension
            you buy before submitting a request is held for your next one; any extension that goes unused
            is forfeited, never refunded or carried further.
          </p>
        </Section>

        <Section title="4. How funds are shared at release">
          <p>When your campaign is released, the amount raised is shared as follows:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>80% to you, the beneficiary — up to the full amount you requested</li>
            <li>5% to the BPI Profit Pool</li>
            <li>2% to your direct sponsor (or to the program&apos;s default fund if you have none)</li>
            <li>2% to the state wallet, 4% to management, 7% to reserve</li>
          </ul>
          <p>
            If your campaign reaches its full target, you receive exactly what you requested and the system
            shares come from the extra 20%. If the countdown ends with less raised, the same percentages
            apply to whatever was actually raised.
          </p>
        </Section>

        <Section title="5. After you're supported">
          <p>
            A waiting period (6, 12, 24 or 36 months, set by the admin when your request is approved) begins
            once funds are released — never before. You can shorten it: every contribution you make to other
            members&apos; campaigns counts toward 3x what you&apos;ve previously received, and reaching that
            amount drops your wait to 6 months. Sponsoring enough qualifying members can also unlock the
            6-month wait automatically.
          </p>
        </Section>

        <Section title="6. The Healthcare Card and Special Community Support">
          <p>
            Members at Regular Plus or higher can subscribe to the BPI Healthcare Card for discounted and
            partly-covered care at partner centres. Special Community Support campaigns are created directly
            by BPI for community-wide causes — funds raised there go straight to the BPI Health & Project
            Account rather than to an individual member, and don&apos;t count toward Auto-Contribute or your
            own tier standing.
          </p>
        </Section>

        <p className="text-xs text-gray-400 pt-2">
          This page summarizes the rules as configured today. Your own dashboard always shows your personal
          eligibility checklist and waiting-period progress — see{" "}
          <Link href="/csp" className="underline">your CSP dashboard</Link>.
        </p>
      </div>
    </CspShell>
  );
}
