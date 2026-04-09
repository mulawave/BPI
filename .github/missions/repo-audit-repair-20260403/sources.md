# Mission Sources

## Mission Identity

- Mission slug: `repo-audit-repair-20260403`
- Mission goal: execute the repo-wide audit repair flow from `reports/repo-wide-gap-audit.md`, prioritizing verified high-risk gaps and continuing through validation until the repo is deploy-ready, blocked, or not ready
- Owning execution mode: `Repair`

## Primary Source Artifacts

- `reports/repo-wide-gap-audit.md`
- `.github/prompts/repo-audit-to-repair-execution.prompt.md`
- `.github/prompts/repo-wide-gap-audit.prompt.md`

## Supporting Inputs

- `app/api/admin/seed-packages/route.ts`
- `app/api/cron/pool-distribution/route.ts`
- `app/api/cron/elite-club-reminder/route.ts`
- `app/api/cron/elite-club-deadline/route.ts`
- `app/api/auth/impersonate/route.ts`
- `app/api/webhooks/paystack/route.ts`
- `app/api/webhooks/flutterwave/route.ts`
- `server/trpc/router/solarAssessment.ts`
- `server/trpc/router/youtube.ts`
- `components/community/SolarAssessmentModal.tsx`
- `prisma/schema.prisma`

## Acceptance Or Validation Inputs

- typecheck
- lint
- targeted behavioral review of repaired audit findings

## Affected Repo Surfaces

- `app/`
- `components/`
- `server/`
- `lib/`
- `prisma/`
- `reports/`

## Notes

- The original audit is partially stale because several public-route and webhook findings were already fixed before this mission started.
- Current verified phase-1 targets are solar assessment backend completeness and YouTube admin authorization hardening.