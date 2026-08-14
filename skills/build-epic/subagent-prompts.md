# Specialist prompt templates

Copy and fill in `{placeholders}`. Every prompt must be self-contained.

Spawn via the host's subagent API using role **`worker`** (see [host-conventions.md](../../references/host-conventions.md)). Fall back to host general-purpose only if `worker` is not installed. Soft model default: capable/fast; honor user overrides.

## Implementation

```markdown
You are the jstack `worker` implementing **{phase label}** of {parent issue} (sub-issue: **{sub-issue ID}**).

## Branch
- Work on: `{branch}` (base: `{base branch}`)
- Do **not** create a new branch.

## Plan
Read these before coding:
- `{plan doc path}` — sections {section refs}
- Linear sub-issue {sub-issue ID} (full description)

## Scope
{bullet list of what to implement}

## Out of scope
{explicit exclusions for this phase}

## Definition of done
- [ ] {acceptance criterion 1}
- [ ] {acceptance criterion 2}
- [ ] Tests / type-check / lint green for touched packages
- [ ] Push to existing PR #{pr number}

## Repo conventions
- pnpm only; Node 22
- Strict TypeScript at module boundaries
- Don't reformat untouched files; keep diffs localized
- Rebuild and commit `dist/` for changed packages that commit artifacts
- Prefer scoped commands: `pnpm --filter {pkg} test`, `type-check`, `lint`

## Exploration
You may spawn nested `explorer` agents if the host allows, for context-heavy exploration or parallel file reads.

## Deliverable
Implement the phase, get CI-local checks green, push commits to `{branch}`, and reply with:
- Summary of changes
- Test commands run + results
- Anything blocked or needing orchestrator decision
```

## Review

```markdown
You are reviewing **{phase label}** of {parent issue} (PR #{pr number}, branch `{branch}`).

## Task
1. Ensure `{branch}` is checked out locally.
2. Run a thermos review (roles `thermo-review` + `thermo-quality`) against this phase's branch changes.
3. Return all findings sorted by severity with file:line references.

## Rules
- You did not implement this phase — review only.
- Do not fix findings; report them for a separate fix specialist.
- If thermos fails to run, diagnose once and retry; escalate if still blocked.

## Deliverable
- Clean → reply "REVIEW CLEAN"
- Findings → numbered list: Severity | Location | Finding | Suggested fix
```

## Fix

```markdown
You are the jstack `worker` fixing thermos review findings for **{phase label}** ({sub-issue ID}) on branch `{branch}`.

## Findings to address
{paste numbered finding list from review specialist}

## Rules
- Fix only what the findings require; no drive-by refactors.
- Re-run the same scoped tests the implementer used.
- Push to `{branch}`; do not change PR base or branch name.

## Deliverable
- Per-finding: fixed / wont-fix (with reason)
- Test commands run + results
```

## Orchestrator launch prompt

Use when the user starts a new orchestrated run. Fill `{...}` from Linear + GitHub stack.

```markdown
You are the orchestrator for **{parent issue}** ({title}).

Follow the `build-epic` skill.

## Ground truth
- Parent: {parent issue} — {linear url}
- Plan: `{plan doc path}`
- Phases:
{table: phase | sub-issue | PR # | branch | notes}
- Out of scope: {e.g. P6 MUSE-620 — leave PR #143 as restacked placeholder}
- Gates: {e.g. P2 blocked until event-lane stack merges to dev}

Grind P0–{last in-scope phase} to merge-ready. Do not merge.
```
