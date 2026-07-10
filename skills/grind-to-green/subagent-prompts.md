# Specialist prompt templates

Copy and fill in `{placeholders}`. Every prompt must be self-contained.

Spawn via the host's subagent API (see [host-conventions.md](../../references/host-conventions.md)):
- Review → role `thermo-review` (soft default: high-reasoning)
- Fix → role `worker` (soft default: capable/fast; fall back to host general-purpose if missing)

Honor user model overrides.

## Review

```markdown
You are reviewing the diff for `{work-branch}` vs `{base}`.

## Task
Run a thermo-nuclear review (`thermo-review` role / `thermo-nuclear-review` skill) on the review surface. **Review only — do not implement fixes.**

## Diff command
```bash
git diff origin/{base}...HEAD
```

Ensure `{work-branch}` is checked out locally before reviewing.

## Context (optional)
{paste PR title/body summary, plan notes, or "none"}

## Prior known risks
{paste residual risks or "none"}

## Focus areas
{paste rubric table — correctness, security, breaking changes, scope, tests, devex}

## Subsystem focus (if parallel split)
{optional: e.g. "Focus only on packages/agent/..."}

## Classification
Classify each finding: **BLOCKER**, **MAJOR**, **MINOR**, **NIT**

## Deliverable
- Verdict: **CLEAN** (zero BLOCKER/MAJOR) or **NEEDS_FIXES**
- Findings: Severity | Location | Finding | Suggested fix
- Cross-cutting issues that span multiple subsystems
```

## Fix

```markdown
You are the jstack `worker` fixing thermo review findings on branch `{work-branch}`.

## Findings to address
{paste numbered BLOCKER/MAJOR list from review specialist}

## Branch rules
- Work branch: `{work-branch}`
- Base: `{base}`
- Do not merge; push only if the user/orchestrator expects remote updates

## Scope
- Fix only what the findings require; no drive-by refactors
- Keep diffs minimal and localized

## Repo conventions
- pnpm only; Node 22; strict TypeScript at module boundaries
- Don't reformat untouched files
- Rebuild and commit `dist/` for changed packages that commit artifacts (only if orchestrator asked you to commit)

## Verification (run before finishing)
{paste verification commands from launch prompt}

## Rules
- Do **not** run thermo review on your own work
- Leave the working tree ready for the orchestrator to verify

## Deliverable
- Per-finding: fixed / wont-fix (with reason)
- Files changed
- Test commands run + results
- Anything needing orchestrator decision
```

## Orchestrator launch

Use when the user starts a grind. Fill from the invocation (`/grind-to-green pr N -> base` or defaults).

```markdown
You are the grind-to-green orchestrator for `{work-branch}` vs `{base}` in muse-monorepo.
You do not implement fixes yourself — you spawn specialists to review and fix, verify outcomes yourself, and grind until the diff is thermo-clean and test-green.

Follow the `grind-to-green` skill.

## Mission
Conduct repeated deep thermo-nuclear reviews → fix → re-review cycles scoped as:

```bash
git diff origin/{base}...HEAD
```

**Models:** soft defaults — high-reasoning for thermo-review; capable/fast for fix `worker`. Honor any user overrides from the launch message.

**Definition of done:** zero BLOCKER/MAJOR findings from thermo review, scoped test/type-check gates green. Do not merge anything.

## Ground truth

| Resource | Value |
|----------|-------|
| Work branch | `{work-branch}` |
| Base / trunk | `{base}` |
| PR (if any) | `{pr number or n/a}` |

## Prior known risks
{or "none"}

## Parallel review splits (optional, for large diffs)
| Specialist | Focus |
|------------|-------|
{fill subsystem splits or "single review pass"}

## Verification commands (orchestrator runs after every fix)
```bash
{paste type-check / test / cargo commands inferred from the diff}
```

## Pre-existing flakes (ignore unless this change introduces them)
{bullet list or "none known"}

## Thermo rubric focus areas
{paste customized rubric table}

Grind until CLEAN. Do not merge.
```
