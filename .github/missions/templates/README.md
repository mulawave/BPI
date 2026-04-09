# Autonomous Mission Templates

This folder contains the default template set for canonical autonomous mission artifacts.

Use these files when a long-running mission needs a repo-native mission root under:

- `.github/missions/<mission-slug>/`

## Template Set

1. `sources.template.md`
   - resolved mission inputs and authoritative source artifacts
2. `mission-state.template.md`
   - current mission truth
3. `validation-log.template.md`
   - running validation and repair history
4. `handoff.template.md`
   - current cross-session or reviewer handoff
5. `resume-brief.template.md`
   - strict restart artifact for the next autonomous session

## Working Rule

When a mission becomes multi-phase, long-running, or likely to cross session boundaries, initialize the mission root from this template set first, then refresh the artifacts as execution progresses.