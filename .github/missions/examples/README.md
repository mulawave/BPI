# Autonomous Mission Examples

This folder contains worked examples of canonical mission roots for the autonomous delivery system.

Use these examples to understand how a long-running mission should look after bootstrap, validation, repair, handoff, and resume steps have started producing real artifacts.

## Reporting Layer Overview

The autonomous reporting layer turns canonical mission roots into derived coordination outputs for current-state review, change-over-time comparison, standup alignment, and end-of-day reporting.

Authoritative mission truth still remains in the canonical mission artifacts, not in the derived reporting outputs linked from this examples area.

## Canonical Vs Derived

- The mission folders in this directory are canonical mission-root examples.
- The reporting files under `.github/missions/examples/reporting/` are derived views only and do not replace canonical mission truth.

## Related Navigation

For broader workflow navigation, see:

- `.github/workflows/README.md`
- `.github/workflows/customization-system-map.md`

For the reporting recipe and visual companion, see:

- `.github/workflows/autonomous-mission-reporting-playbook.md`
- `.github/workflows/autonomous-mission-reporting-playbook-mermaid.md`

## Included Examples

### `wallet-payout-redesign/`

An example mission showing:

- source artifact resolution
- mission-state tracking
- structured validation-log updates
- reviewer or session handoff
- restart-safe resume briefing

This example is illustrative. It is meant to demonstrate artifact shape, sequencing, and operating discipline rather than represent live product truth.

### `withdrawal-provider-cutover/`

An example mission showing:

- source artifact expansion that introduces an external dependency
- mission-state tracking with a true `blocked` verdict
- validation-log history that is technically green enough to proceed but stopped by missing external access
- reviewer or stakeholder handoff at an approval or credential boundary
- restart-safe resume briefing that cannot continue autonomously until the dependency is resolved

This example is also illustrative. It is meant to show how the canonical mission root should express a clean stop condition instead of pretending execution can continue.

## Derived Reporting Examples

### `reporting/`

A worked example bundle showing the derived reporting chain that can be produced from canonical mission roots:

- mission root to operator summary
- earlier versus later mission delta summary
- multi-mission standup drift briefing
- end-of-day operations summary

These files are illustrative derived outputs only. They are not authoritative mission artifacts and should be read as reporting views over the canonical mission roots.