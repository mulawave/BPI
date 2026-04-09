# Autonomous Mission Artifact Storage And Resume

This document defines the canonical repo-native storage convention for autonomous mission artifacts and the resume discipline required for later autonomous sessions.

## Purpose

Mission-state snapshots and handoffs only become operationally useful when they live in predictable repo locations and can be converted into a strict resume artifact for the next session.

## Why This Layer Exists

Without canonical storage and resume rules, continuity still drifts in these ways:

- state artifacts are saved in inconsistent locations
- later sessions cannot tell which artifact is authoritative
- validation history gets split across unrelated notes
- resume work starts from a narrative summary instead of an execution-safe brief
- blocked missions restart without the same approval or dependency context

## Canonical Mission Root

Long-running autonomous missions should store their persistent artifacts under:

- `.github/missions/<mission-slug>/`

The mission slug should be stable for the life of the mission and derived from the core mission goal, tracker, or feature name rather than a temporary session label.

Bootstrap prompt:

- `.github/prompts/mission-intake-to-mission-root.prompt.md`

Reconciliation prompt:

- `.github/prompts/mission-root-and-new-sources-to-reconciled-mission-root.prompt.md`

## Canonical Artifact Set

Each long-running mission should treat these files as the default authoritative set:

1. `mission-state.md`
   - the latest validated mission truth

2. `handoff.md`
   - the current cross-session or reviewer handoff artifact

3. `resume-brief.md`
   - the strict restart artifact for the next autonomous session

4. `validation-log.md`
   - the running history of relevant validations, failures, repairs, and current gate status

5. `sources.md`
   - resolved mission inputs such as specs, trackers, scripts, audits, and acceptance artifacts

## Canonical Vs Derived

- Canonical mission roots remain authoritative for mission truth.
- Operator summaries, delta summaries, standup briefings, and end-of-day operations summaries are derived coordination outputs only.

## Template Bundle

Default templates live under:

- `.github/missions/templates/`

The template bundle should be used when initializing a new mission root so every long-running mission starts from the same artifact structure.

Validation-log update prompt:

- `.github/prompts/validation-state-to-validation-log.prompt.md`

## Storage Rules

The autonomous system should:

1. create the mission root as soon as the mission becomes long-running, multi-phase, or likely to cross session boundaries
2. initialize that mission root from `.github/missions/templates/` when the canonical artifact set does not already exist
3. keep one canonical current artifact for each file type instead of scattering versions across root docs or ad hoc notes
4. refresh `mission-state.md` after meaningful execution, validation, repair, mode, or blocker changes
5. refresh `handoff.md` whenever the session is ending or a reviewer must take over
6. refresh `resume-brief.md` whenever the next autonomous session would need an exact restart point
7. append or update `validation-log.md` whenever hard gate state changes materially
8. update `sources.md` whenever mission inputs expand or the authoritative artifact set changes
9. reconcile the mission root before deeper execution resumes whenever new or changed source artifacts materially expand or redirect mission scope
10. derive operator-facing summaries from the canonical mission root when maintainers need a quick status view, while keeping the canonical artifacts authoritative
11. derive delta summaries from canonical mission artifacts when maintainers need to compare earlier and later mission states without introducing a second source of truth

## Source Expansion And Reconciliation

Bootstrap covers new mission creation, but in-flight missions also need a canonical reconciliation step when source artifacts change after execution has already started.

Use the reconciliation prompt when:

- a new tracker, spec, bug audit, script, or handoff arrives for an already initialized mission
- an existing source artifact is superseded and the mission root must reflect the new authority
- the newly added artifacts materially change acceptance criteria, affected surfaces, blockers, or execution priority
- the next session would otherwise have to infer scope expansion from scattered notes or chat history

Reconciliation should update the existing mission root in place rather than creating a second mission root for the same core mission.

Primary prompt:

- `.github/prompts/mission-root-and-new-sources-to-reconciled-mission-root.prompt.md`

## Derived Operator Summaries

Maintainers may need a compact mission dashboard view, but that summary must remain derived from the canonical mission root rather than becoming a competing state record.

Use the operator summary prompt when:

- a maintainer needs a quick scan of current mission status before reading full artifacts
- a reviewer needs the current verdict, blockers, validation state, and exact next step in one place
- a restart or escalation flow needs a concise briefing without replacing the canonical mission-state or handoff artifacts

Primary prompt:

- `.github/prompts/mission-root-to-operator-summary.prompt.md`

Operational rule:

- treat the operator summary as a derived view only; authoritative mission truth remains in `sources.md`, `mission-state.md`, `validation-log.md`, `handoff.md`, and `resume-brief.md`

## Derived Delta Summaries

Maintainers may also need to compare two mission states quickly, especially after a repair loop, reconciliation event, blocker transition, or release-prep handoff.

Use the delta summary prompt when:

- a maintainer wants to know what materially changed between an earlier and later mission state
- a reviewer needs a compact comparison of validation progress, blocker drift, or next-step changes
- a handoff or standup needs mission progress expressed as change over time rather than as a single-state snapshot

Primary prompt:

- `.github/prompts/mission-roots-to-delta-summary.prompt.md`

Operational rule:

- treat the delta summary as a derived view only; authoritative mission truth remains in `sources.md`, `mission-state.md`, `validation-log.md`, `handoff.md`, and `resume-brief.md`

## Derived Standup And End-Of-Day Reporting

Cross-mission standup briefings and close-of-day operations summaries may also be derived from canonical mission artifacts, operator summaries, and delta summaries when maintainers need a higher-level operational view.

Use the standup briefing prompt when:

- multiple active missions need one execution-drift view before work begins or resumes
- standup coordination needs blockers, drift, and next actions rolled up across missions

Primary prompt:

- `.github/prompts/mission-briefings-to-standup-drift-briefing.prompt.md`

Use the end-of-day operations summary prompt when:

- maintainers need a concise close-of-day summary across active missions
- leadership and operators need aligned reporting on progress, blockers, validation posture, and next-day priorities

Primary prompt:

- `.github/prompts/mission-briefings-to-end-of-day-operations-summary.prompt.md`

Operational rule:

- treat standup and end-of-day reporting as derived views only; authoritative mission truth remains in `sources.md`, `mission-state.md`, `validation-log.md`, `handoff.md`, and `resume-brief.md`

## Resume Discipline

The next autonomous session should not resume from raw mission-state or handoff artifacts alone when a dedicated resume brief exists.

It should instead:

1. read the canonical mission root
2. verify the latest mission-state and handoff with the integrity agent when needed
3. derive a fresh `resume-brief.md`
4. continue from the exact first next step named in that resume brief

## When To Generate A Resume Brief

The system should generate or refresh `resume-brief.md` when:

- a session is ending before the mission is complete
- the mission is blocked on approval or dependency resolution
- the next session would otherwise need to reconstruct the execution narrative manually
- validation failures were repaired and the next step changed materially
- the mission changed mode or authority profile

## Operational Rule

Mission continuity is only reliable when artifact locations are predictable, current state is authoritative, and the next session resumes from a dedicated restart brief rather than memory or scattered notes.

## Worked Example

Example mission roots live under:

- `.github/missions/examples/`

Start with:

- `.github/missions/examples/README.md`

Use the example mission roots to see how `sources.md`, `mission-state.md`, `validation-log.md`, `handoff.md`, and `resume-brief.md` work together in practice.

The example set should include both an active repairable mission and a true blocked mission so maintainers can compare technical-red versus approval or dependency-stop states.

It should also include a derived reporting example chain so maintainers can see how canonical mission roots feed operator summaries, delta summaries, and cross-mission standup briefings without creating a second source of truth.

That reporting example chain should also show how a standup briefing can feed an end-of-day operations summary without becoming a new canonical mission artifact.