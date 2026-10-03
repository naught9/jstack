---
name: grind-to-green
description: >-
  Grind a branch or PR to review-clean and test-green via an initial thermos
  audit followed by fix and single-pass re-review cycles in one chat.
  Use when the user says grind-to-green, grind to green, thermo grind,
  review-fix loop, or wants review + fix specialists without
  phased/Linear/GitHub-stack orchestration.
disable-model-invocation: true
---

# Grind to Green

You are the **review/fix orchestrator** for a single branch or PR. You do **not** implement fixes yourself — you spawn specialists to review and fix, verify outcomes yourself, and grind until the diff is review-clean and test-green.

Host spawn details: [host-conventions.md](../../references/host-conventions.md).

## Models

- Soft default: **high-reasoning** for initial thermos roles and deep `thermo-review` re-reviews; **balanced-reasoning** for `reviewer` re-reviews; **capable/fast** for fix `worker`s; capable parent.
- Honor user overrides (e.g. `/grind-to-green use grok 4.7 for review and fix`).
- Host mapping: [host-conventions.md](../../references/host-conventions.md#models). On Cursor, prefer Cursor Grok for review and fix children; do not select Opus unless the user named that family.

**Related:** For stacked phased epics with Linear/GitHub stacks, use [grind-epic](../grind-epic/SKILL.md) instead. For a one-shot dual review without a fix loop, use [thermos](../thermos/SKILL.md).

## Before you start

Resolve the review surface from the user prompt:

| User says | Review surface |
|-----------|----------------|
| `/grind-to-green pr 188 -> dev` | PR #188 diff vs `dev` (fetch PR head; base = `dev`) |
| `/grind-to-green` (no args) | Current branch vs trunk: `git diff origin/dev...HEAD` |
| Explicit branch/base | `git diff origin/{base}...origin/{branch}` or `...HEAD` |

Default trunk is `dev` in muse-monorepo; use the repo’s default base elsewhere if the user doesn’t specify.

Gather or confirm:

| Input | Default / how to find |
|-------|------------------------|
| Work branch | Current branch, or PR head |
| Base / trunk | `dev` unless user specifies otherwise |
| Diff command | From table above |
| Verification commands | Infer from changed packages; ask if unclear |
| Known residual risks | User-provided, or none |
| Pre-existing flakes | User-provided, or none |

Bootstrap:

```bash
git fetch origin {base}
# If PR: gh pr checkout {n}   (or fetch PR head ref)
git checkout {work-branch}
git diff origin/{base}...HEAD --stat
```

## Definition of done

- One initial thermos audit completed; either it is clean or the latest required re-review has zero **BLOCKER** / **MAJOR** findings
- Scoped test / type-check gates green (orchestrator verifies output — do not trust specialist claims)
- **Do not merge** unless the user explicitly asks

## Review → fix loop

Repeat until CLEAN (zero BLOCKER/MAJOR):

```
- [ ] 1. Bootstrap — fetch, checkout, orient on diff stat
- [ ] 2. Run one initial thermos audit — two review roles in parallel, never implement
- [ ] 3. Spawn fix specialist(s) — separate from reviewers; parallelize independent finding batches
- [ ] 4. Verify yourself — run verification commands, inspect output
- [ ] 5. Run one single-pass re-review on the updated diff
- [ ] 6. Report to user
```

### 1. Bootstrap

Orient on the diff. Infer verification commands from touched packages (e.g. `pnpm --filter @muse/agent type-check`, scoped vitest/cargo). Prefer the smallest relevant gates.

### 2. Initial review (thermos)

Run [thermos](../thermos/SKILL.md) **once** on the full review surface (`thermo-review` + `thermo-quality` in parallel). Never let either reviewer implement fixes. This establishes the broad correctness, security, and maintainability baseline.

Prompt template: [subagent-prompts.md](subagent-prompts.md#initial-review).

Classify findings: **BLOCKER**, **MAJOR**, **MINOR**, **NIT**. Verdict: **CLEAN** or **NEEDS_FIXES**.

### 3. Spawn fix specialist

For BLOCKER/MAJOR batches, spawn a **`worker`** (host general-purpose only if `worker` is not installed).

Prompt template: [subagent-prompts.md](subagent-prompts.md#fix).

Rules:
- Work on the review branch (PR head / current branch)
- Minimal, localized diffs; match repo conventions (pnpm-only, strict TS, no drive-by reformat in muse)
- Run scoped tests before finishing
- **Never** let the fix specialist run thermo review on its own work
- **Parallelize** independent fix batches (disjoint files/subsystems) in the same iteration

Cap: if the same finding survives **3** fix/review cycles, stop and escalate with evidence.

### 4. Verify yourself

After every fix round, **you** run the verification commands. Check pass/fail output directly.

### 5. Single-pass re-review

After each fix round, spawn **one fresh re-review specialist**, not another two-role thermos pair:

- Default to [quick-review](../quick-review/SKILL.md) via role `reviewer` for localized fixes and direct confirmation that reported findings are resolved.
- Use [thermo-nuclear-review](../thermo-nuclear-review/SKILL.md) via role `thermo-review` when the findings or fixes involve security, correctness invariants, breaking behavior, devex, feature gates, cross-cutting behavior, or otherwise remain high risk.

The re-review must inspect the updated overall review surface, verify prior findings end to end, and check for regressions introduced by the fixes. Repeat steps 3–5 until CLEAN.

Re-run full thermos only if a fix materially expands scope, introduces substantial structural/maintainability changes not covered by the initial quality pass, or the user explicitly requests it. Prompt template: [subagent-prompts.md](subagent-prompts.md#re-review).

### 6. Report

See [Final deliverable](#final-deliverable).

## Thermo review rubric

Customize from the change set. Default categories:

| Area | What to hunt |
|------|--------------|
| Correctness | Logic bugs; contract drops; math/invariants |
| Security | Trust boundaries; path traversal; secrets; IPC |
| Breaking changes | Defaults for existing users; migration safety |
| Scope | Unrelated drive-bys; incomplete wiring |
| Tests | Missing coverage for new behavior; broken gates |
| Devex | Type-check failures; flakes introduced by the change |

## Operating rules

- Review and fix are **always separate specialists**
- Spawn prompts must be **fully self-contained** (children cannot see parent conversation)
- A cycle is done only when **you** verify test output and diff, not when a specialist says so
- Initial thermos uses its two parallel roles; subsequent re-reviews use one selected review role
- Prefer **parallel** fix batches when work is independent
- Pre-existing flakes: ignore unless this change introduces them
- Do not merge; deliver a green, review-clean branch/PR

## Final deliverable

Report to the user:

- Final verdict: CLEAN (initial thermos + re-review iteration count)
- Fix commits (SHAs + summary) if any were made
- Verification summary (commands run + pass/fail)
- Remaining MINOR/NIT items (accepted or deferred)
- Diff surface used (`pr N -> base` or `branch...base`)

## Launch prompt

Fill `{...}` from the user invocation. Full template: [subagent-prompts.md](subagent-prompts.md#orchestrator-launch).

## Examples

See [examples.md](examples.md).
