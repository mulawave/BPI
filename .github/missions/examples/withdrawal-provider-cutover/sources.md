# Mission Sources

## Mission Identity

- Mission slug: `withdrawal-provider-cutover`
- Mission goal: complete the withdrawal provider cutover across backend, validation, and release-prep surfaces until the mission is deploy-ready or truly blocked
- Owning execution mode: `Release-Prep`

## Primary Source Artifacts

- `docs/specs/withdrawal-provider-cutover.md`
- `WITHDRAWAL_IMPLEMENTATION.md`
- `WITHDRAWAL_SANDBOX_TESTING.md`

## Supporting Inputs

- `server/trpc/router/`
- `lib/`
- `app/admin/`
- `DEPLOYMENT_CHECKLIST.md`

## Acceptance Or Validation Inputs

- lint
- typecheck
- targeted withdrawal regression checks
- sandbox provider verification
- release rollback review

## Affected Repo Surfaces

- `app/admin/`
- `components/`
- `server/`
- `lib/`
- `tests/`
- release and deployment docs

## Notes

- Example mission only; artifact contents are illustrative.
- Current blocker is external: production provider credentials and final cutover approval are not yet available.