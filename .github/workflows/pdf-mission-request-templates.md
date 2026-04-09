# PDF Mission Request Templates

Use this file when a new project or workflow starts from a PDF and you want a copy-paste request template instead of writing the intake from scratch.

## Before You Start

- Put the PDF somewhere stable in the repo, for example `docs/specs/project-workflow.pdf`.
- If the PDF is scanned or hard to parse, add a text or markdown companion file and include both as source artifacts.
- Canonical mission artifacts should live under `.github/missions/` once execution begins.
- Summaries, dashboards, standups, and end-of-day reporting are derived outputs only.

## 1. Implement This Fully

Use this when the PDF describes a product or system that should be built end to end.

```text
Mission goal:
- Read [path-to-pdf] and fully implement the project described there across this repo, including the complete software platform, web application, Android mobile experience, homepage, and web admin panel, and continue until the work is deploy-ready or truly blocked.

Source artifacts:
- [path-to-pdf]
- [optional-path-to-text-or-markdown-extract]
- [optional-related-specs-or-trackers]

What I want from it:
- Build the project fully from the workflow documentation.
- Derive the correct task graph before implementation starts.
- Cover frontend, backend, data, validation, and release-readiness work as needed.

Execution expectations:
- Create and maintain canonical mission artifacts under .github/missions/.
- Work across all required repo surfaces.
- Build the complete user-facing product, including homepage and web admin panel.
- Build the Android mobile version when the workflow requires mobile coverage.
- Run relevant validation after major execution batches.
- Keep repairing until the mission is deploy-ready or truly blocked.

Constraints:
- Stop at approval boundaries.
- Surface missing credentials, third-party dependencies, or ambiguous business rules as blockers.
- Do not stop at planning or code edits alone.
- Do not treat summaries as the source of truth.

Notes:
- If the PDF is scanned or hard to parse, say so first and use a text or markdown companion file.
```

## 2. Just Summarize The PDF

Use this when you only want understanding, not implementation.

```text
Mission goal:
- Read [path-to-pdf] and produce a clear summary of the workflow documentation without implementing anything.

Source artifacts:
- [path-to-pdf]
- [optional-path-to-text-or-markdown-extract]

What I want from it:
- Summarize the workflow simply.
- Identify the main phases, responsibilities, dependencies, and decision points.
- Call out anything unclear, risky, or missing.

Constraints:
- Do not implement code.
- Do not create execution artifacts unless needed for the summary.
- If the PDF is hard to parse, say so first.

Preferred output:
- short overview
- step-by-step flow
- blockers, assumptions, and open questions
```

## 3. Turn The PDF Into Maintainer Docs

Use this when the PDF should become repo-native operational documentation.

```text
Mission goal:
- Read [path-to-pdf] and convert the workflow documentation into maintainable repo-native maintainer docs.

Source artifacts:
- [path-to-pdf]
- [optional-path-to-text-or-markdown-extract]
- [optional-existing-docs-to-align-with]

What I want from it:
- Extract the durable workflow guidance.
- Turn it into maintainer-facing markdown documentation.
- Avoid duplicating guidance that already exists elsewhere in the repo.

Execution expectations:
- Propose the correct target docs or doc updates.
- Preserve existing governance and workflow boundaries.
- Prefer updating existing maintainer docs when they already cover adjacent areas.
- Make the final docs easy to navigate and operationally clear.

Constraints:
- Do not create fragmented duplicate docs.
- Surface overlap with existing README, workflow, deployment, or handoff docs.
- If the PDF is scanned or hard to parse, say so first and use a text or markdown companion file.
```

## 4. Turn The PDF Into A Phased Build Roadmap

Use this when you want a delivery plan before implementation starts.

```text
Mission goal:
- Read [path-to-pdf] and turn the workflow documentation into a phased build roadmap for this repo.

Source artifacts:
- [path-to-pdf]
- [optional-path-to-text-or-markdown-extract]

What I want from it:
- Break the project into logical phases.
- Identify dependencies, risks, validation gates, and approval boundaries.
- Show what should be built first, next, and last.

Preferred output:
- project overview
- phase-by-phase roadmap
- dependencies and blockers
- validation plan
- recommended first implementation slice

Constraints:
- Do not implement yet.
- Keep the roadmap practical and build-sequenced.
- If the PDF is hard to parse, say so first.
```

## 5. Turn The PDF Into Tickets Or Tasks Only

Use this when you want execution-ready work items without full implementation yet.

```text
Mission goal:
- Read [path-to-pdf] and convert the workflow documentation into a practical task list for execution in this repo.

Source artifacts:
- [path-to-pdf]
- [optional-path-to-text-or-markdown-extract]

What I want from it:
- Break the workflow into concrete tasks.
- Group tasks by area such as frontend, backend, mobile, admin, data, validation, and deployment.
- Identify blockers, dependencies, and approval-required items.

Preferred output:
- task list grouped by surface
- dependencies between tasks
- validation tasks
- blocker and approval list

Constraints:
- Do not implement yet.
- Do not collapse everything into vague high-level bullets.
- If the PDF is hard to parse, say so first.
```

## 6. Fast Chat Version

Use this when you want the shortest possible intake message.

```text
Read [path-to-pdf] and [implement it fully / summarize it / turn it into maintainer docs / turn it into a phased roadmap / turn it into execution tasks]. If the PDF is hard to parse, say so first. Keep canonical mission artifacts under .github/missions/ and do not treat summaries as source of truth.
```

## 7. Business-Facing Version

Use this when the request should be framed in terms of product outcome, delivery scope, and business readiness instead of implementation detail.

```text
Mission goal:
- Read [path-to-pdf] and turn it into the correct business-facing delivery output for this repo.

Source artifacts:
- [path-to-pdf]
- [optional-path-to-text-or-markdown-extract]

What I want from it:
- Explain what the project is trying to achieve.
- Identify the main product surfaces, stakeholders, dependencies, and rollout risks.
- Turn the PDF into either a delivery plan, business summary, or execution request depending on what the document supports.

Preferred output:
- executive summary
- major product areas
- rollout phases
- dependency and risk list
- recommended next action

Constraints:
- Keep the output practical, not academic.
- Surface missing information, approvals, or external dependencies clearly.
- If the PDF is hard to parse, say so first.
```

## 8. Technical Engineering Version

Use this when the request should be framed for engineering execution.

```text
Mission goal:
- Read [path-to-pdf] and convert it into an engineering-ready execution plan for this repo.

Source artifacts:
- [path-to-pdf]
- [optional-path-to-text-or-markdown-extract]
- [optional-related-specs-trackers-tests]

What I want from it:
- Break the PDF into concrete technical requirements.
- Identify affected surfaces across frontend, backend, mobile, admin, data, infrastructure, and validation.
- Produce either a task graph, implementation plan, or execution roadmap.

Execution expectations:
- Call out architecture decisions, dependencies, validation gates, and approval boundaries.
- Separate required build work from optional nice-to-have work.
- Make the output detailed enough for engineering execution.

Constraints:
- Do not blur product summary and implementation detail.
- Flag ambiguity, missing API details, missing data rules, and missing environment requirements.
- If the PDF is hard to parse, say so first.
```

## 9. Mobile-App-First Version

Use this when the PDF describes a platform where mobile is the lead product surface.

```text
Mission goal:
- Read [path-to-pdf] and turn it into a mobile-app-first delivery plan for this repo, with Android as a required surface and web/admin coverage included where the workflow requires it.

Source artifacts:
- [path-to-pdf]
- [optional-path-to-text-or-markdown-extract]
- [optional-mobile-or-backend-specs]

What I want from it:
- Prioritize the mobile user journey first.
- Identify which capabilities belong in Android, which belong in the public web experience, and which belong in the admin panel.
- Produce either a full implementation request, roadmap, or tasks list centered on the mobile product.

Execution expectations:
- Separate mobile flows, admin flows, backend dependencies, and validation requirements.
- Highlight anything that blocks mobile delivery such as auth, notifications, APIs, payments, offline handling, or app-store requirements.
- Keep web and admin coverage aligned with the mobile core experience.

Constraints:
- Do not reduce the scope to web only if the PDF clearly requires mobile.
- Surface device, platform, credential, or store-review dependencies explicitly.
- If the PDF is hard to parse, say so first.
```

## 10. Safe Overnight Mode

Use this when you want the system to make progress while you are away, but you want it to stop cleanly at uncertainty instead of inventing missing details.

```text
Mission goal:
- Read [path-to-pdf] and make the maximum safe autonomous progress on this repo before stopping at any real blocker, ambiguity, approval boundary, missing credential, or missing external dependency.

Source artifacts:
- [path-to-pdf]
- [optional-path-to-text-or-markdown-extract]
- [optional-related-specs-trackers-tests]

What I want from it:
- Build only what is well-supported by the source artifacts and repo context.
- Keep going through planning, implementation, validation, and repair where the path is clear.
- Stop and mark the mission blocked when the remaining work depends on unclear requirements, approvals, credentials, or external systems.

Execution expectations:
- Create and maintain canonical mission artifacts under .github/missions/.
- Record exact blockers and next actions before stopping.
- Prefer a correct blocked verdict over guessing.

Constraints:
- Do not invent missing product rules, API contracts, or business logic.
- Do not force completion if the PDF is high-level or incomplete.
- Do not treat partial implementation as complete.
```

## 11. Aggressive Away-Mode

Use this when you want the system to implement as much as possible while you are away, accepting a higher chance that it will stop later at a blocker.

```text
Mission goal:
- Read [path-to-pdf] and implement as much of the project as can be completed autonomously in this repo while I am away, continuing until the work is deploy-ready or a true blocker remains.

Source artifacts:
- [path-to-pdf]
- [optional-path-to-text-or-markdown-extract]
- [optional-related-specs-trackers-tests]

What I want from it:
- Derive the task graph and execute aggressively across the repo.
- Complete all well-supported frontend, backend, admin, mobile, validation, and documentation work that can be done without supervision.
- Repair failures and continue unless a real blocker remains.

Execution expectations:
- Maximize completed work before stopping.
- Run relevant validations after major execution batches.
- Leave a precise mission state, validation log, handoff, and resume brief if blocked.

Constraints:
- Stop only for real blockers such as missing credentials, approvals, external dependencies, or unresolved ambiguity that would make continued work unsafe.
- Do not hide uncertainty; record it in the mission artifacts.
- Do not claim completion if major required surfaces remain unfinished.
```

## 12. Best Two-Stage Unattended Workflow

Use this when you want the most reliable unattended pattern instead of a single all-in run.

### Stage 1: Planning And Risk Discovery

```text
Mission goal:
- Read [path-to-pdf] and convert it into a phased execution plan, task graph, blocker list, dependency map, and validation strategy for this repo before implementation begins.

Source artifacts:
- [path-to-pdf]
- [optional-path-to-text-or-markdown-extract]
- [optional-related-specs-trackers-tests]

What I want from it:
- Identify what is clear enough to build now.
- Identify what is missing, risky, approval-gated, or externally dependent.
- Produce the best execution-ready roadmap for an unattended implementation pass.

Constraints:
- Do not implement yet.
- Prefer clarity and blocker discovery over optimistic execution.
```

### Stage 2: Execution After Review

```text
Mission goal:
- Use the confirmed roadmap, clarified assumptions, and source artifacts to implement the project autonomously in this repo until it is deploy-ready or truly blocked.

Source artifacts:
- [path-to-pdf]
- [optional-path-to-text-or-markdown-extract]
- [roadmap-or-task-graph-artifact]
- [any-clarified-assumptions-or-approved-decisions]

What I want from it:
- Execute from the reviewed plan instead of reinterpreting the PDF from scratch.
- Build the agreed scope across the necessary surfaces.
- Validate, repair, and stop only at true remaining blockers.

Constraints:
- Treat the reviewed roadmap and clarified assumptions as part of the source authority.
- Do not reopen already settled decisions unless the source artifacts conflict.
- Record any remaining blockers precisely in the mission artifacts.
```

## 13. Master Autonomous Delivery Intake

Use this when you want one top-level request that tells the orchestrator to drive the full autonomous pattern and call the helper layers as needed.

```text
Mission goal:
- Read [path-to-pdf] and autonomously drive this project from source documentation to an end-to-end implementation result for this repo, continuing until the work is deploy-ready or a true blocker remains.

Source artifacts:
- [path-to-pdf]
- [optional-path-to-text-or-markdown-extract]
- [optional-related-specs-trackers-tests]

Execution sequence:
- Turn the PDF and related artifacts into an implementation roadmap.
- Identify required keys, credentials, external dependencies, approval boundaries, and missing repo prerequisites.
- Convert the roadmap into implementable phases and concrete execution steps.
- Implement phase by phase across all required surfaces.
- Run tests, validation, and QA after every major implementation batch.
- Run production-readiness analysis before any completion claim.
- Fix gaps, failures, and incomplete coverage.
- Run a final overall audit before returning a final verdict.

Required coverage:
- Cover all required product surfaces described by the source artifacts, including software platform, web experience, homepage, admin panel, backend, data, validation, and Android/mobile surfaces when required.
- Use the repo's end-to-end implementation expectations for feature completeness.
- Use premium UI standards where visible product surfaces are involved.
- Detect repo gaps, missing infrastructure, unclear requirements, and approval-gated work early instead of guessing.

Helper behavior:
- Use the orchestrator as the top-level controller.
- Call the relevant helper prompts, workers, hidden review agents, and workflow rules as needed to complete the mission correctly.
- Use frontend, backend, validation, repair, release, reporting, and review layers where appropriate instead of trying to force everything through a single step.
- Use existing repo instructions and skills such as premium UI coherence, end-to-end implementation, supporting UI completeness, mission-state continuity, reporting, readiness, and audit layers whenever they apply.

Execution expectations:
- Create and maintain canonical mission artifacts under .github/missions/.
- Keep mission-state, validation-log, handoff, resume-brief, and sources updated as execution progresses.
- Reconcile the mission root if new source artifacts appear mid-flight.
- Run repair loops instead of stopping at the first failure.
- Return only one of these final states: deploy-ready, blocked, or not ready.

Constraints:
- Do not invent missing business logic, API behavior, credentials, or external approvals.
- Do not stop at planning or partial implementation if more autonomous progress is possible.
- Do not treat summaries or reports as the source of truth.
- Stop cleanly and mark the mission blocked if the remaining work depends on real external blockers, approval boundaries, or unresolved ambiguity.

Preferred final output:
- mission summary
- implemented phases and completed work
- validation and QA status
- production-readiness status
- remaining blockers or missing dependencies
- final verdict: deploy-ready, blocked, or not ready
```

## Simple Rule

- PDF = source artifact
- Orchestrator = entrypoint for execution
- Canonical mission root = source of truth
- Summaries and reports = derived views only