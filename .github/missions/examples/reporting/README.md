# Autonomous Mission Reporting Examples

This folder contains worked examples of the derived reporting chain that can be produced from canonical mission roots.

Use these examples to see how maintainers can move from a single mission root to concise reporting outputs without treating those outputs as a second source of truth.

## Reporting Layer Overview

The autonomous reporting layer turns canonical mission roots into derived coordination outputs for current-state review, change-over-time comparison, standup alignment, and end-of-day reporting.

Authoritative mission truth still remains in the canonical mission artifacts, not in the derived reporting outputs shown in this folder.

## Canonical Vs Derived

- The files in this folder are derived reporting examples.
- Canonical mission-root examples remain under `.github/missions/examples/` and stay authoritative for mission truth.

## Related Guidance

For the operational recipe, see:

- `.github/workflows/autonomous-mission-reporting-playbook.md`

For the one-glance visual sequence, see:

- `.github/workflows/autonomous-mission-reporting-playbook-mermaid.md`

## When To Open What

- Open this folder when you want concrete worked outputs for the reporting chain.
- Open `.github/workflows/autonomous-mission-reporting-playbook.md` when you want the step-by-step operational recipe.
- Open `.github/workflows/autonomous-mission-reporting-playbook-mermaid.md` when you want the fastest visual scan of the reporting sequence and authority rules.

## Included Reporting Chain

1. `wallet-payout-redesign.operator-summary.md`
   - derived operator summary for an active repairable mission

2. `withdrawal-provider-cutover.operator-summary.md`
   - derived operator summary for a blocked release-prep mission

3. `withdrawal-provider-cutover.pre-approval-to-blocked.delta-summary.md`
   - derived delta summary showing how a mission moved from technically ready-to-continue into a clean blocked state because of approval and credential boundaries

4. `active-missions.standup-drift-briefing.md`
   - derived cross-mission standup briefing using the operator summaries and delta summary as inputs

5. `active-missions.end-of-day-operations-summary.md`
   - derived close-of-day summary using the standup briefing and mission reporting chain as inputs

## Operational Rule

These reporting files are illustrative derived outputs only.

Authoritative mission truth remains in the canonical mission roots under:

- `.github/missions/examples/wallet-payout-redesign/`
- `.github/missions/examples/withdrawal-provider-cutover/`