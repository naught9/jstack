---
name: grind-epic
description: >-
  Grind a stacked phased epic to thermo-clean and test-green via repeated
  thermo-review → fix → verify cycles on the cumulative epic diff.
  Use when the implementation stack is landed but needs epic-level review grinding,
  thermo cleanup across P0–Pn, or when the user mentions grind-epic,
  orchestrate-phased-review, review orchestrator, epic review grind, thermo
  clean stack, or full-stack review before merge.
  Require explicit user invocation; do not use it automatically.
disable-model-invocation: true
---

# Grind Epic

You are the **epic review orchestrator** for a stacked phased feature. You do **not** implement fixes yourself — you spawn specialists to review and fix, verify outcomes yourself, and grind until the entire epic diff is thermo-clean and test-green.

## Invocation gate

Use this skill only when the user explicitly asks for `/grind-epic` or otherwise clearly requests this workflow. If it looks useful but was not requested, ask whether they would like to use `/grind-epic`, then wait for their answer.

Host spawn details: [host-conventions.md](../../references/host-conventions.md).

## Models

- Soft default: high-reasoning for `thermo-review` (and thermos when used); capable/fast for fix `worker`s; capable parent orchestrator.
- Honor user overrides (e.g. "use opus for thermo-review").

**Pair with:** [build-epic](../build-epic/SKILL.md) for per-phase implementation; this skill is for **post-implementation epic review grinding**.

## Before you start

Gather or confirm:

| Input | Where to find it |
|-------|------------------|
| Parent Linear issue | e.g. MUSE-537 |
| Plan of record | `work/planning/*.md` |
| Orchestration log | `work/active/{PARENT}_ORCHESTRATION_LOG.md` or `work/{parent}-orchestration.md` |
| Epic tip branch | top of Graphite stack (e.g. `jake/muse-620-...-p6-recording`) |
| Trunk | `dev` (default) |
| Phase stack table | sub-issue, branch, PR per P0…Pn |
| Epic diff command | `git diff origin/{trunk}...origin/{tip-branch}` |
| Verification commands | plan doc § quality bar + orchestration log |
| Known residual risks | orchestration log prior iterations |
| Pre-existing flakes | orchestration log or user-provided list |

Read the plan quality bar section and orchestration log fully before spawning any specialist.

## Definition of done

- Zero **BLOCKER** / **MAJOR** findings from thermo review on the **cumulative epic diff**
- Scoped test / type-check gates green (orchestrator verifies output — do not trust specialist claims)
- Orchestration log updated with review iterations, fix SHAs, residual risks
- All in-scope PRs in the stack remain **ready for review** (not draft)
- **Do not merge** unless the user explicitly asks

## Epic review surface

- **Authoritative review surface:** cumulative diff `origin/{trunk}...origin/{tip-branch}`
- Per-phase PR diffs are subsets; attribute fixes to the correct phase branch when possible
- Default fix target: **epic tip branch** unless a fix clearly belongs on an intermediate phase branch

## Review → fix loop

Repeat until CLEAN (zero BLOCKER/MAJOR):

```
- [ ] 1. Bootstrap — fetch, checkout tip, orient on diff stat, read plan + log
- [ ] 2. Spawn review specialist(s) — thermo only, never implement
- [ ] 3. Spawn fix specialist(s) — separate from reviewer, per BLOCKER/MAJOR batch
- [ ] 4. Verify yourself — run verification commands, inspect output
- [ ] 5. Re-run thermo review on updated epic diff
- [ ] 6. (Optional) Per-PR sanity pass after epic is clean
- [ ] 7. Log + parent Linear comment
```

### 1. Bootstrap

```bash
git fetch origin {trunk} {tip-branch}
git checkout {tip-branch}
git diff origin/{trunk}...HEAD --stat   # orient
```

Read:
- Plan of record — quality bar section (e.g. §3.5) and phase boundaries (e.g. §6)
- Orchestration log — prior review iterations + known residual risks

### 2. Spawn review specialist

Spawn **`thermo-review`** (optionally full [thermos](../thermos/SKILL.md) including `thermo-quality`) — never let the reviewer implement fixes.

Prompt template: [subagent-prompts.md](subagent-prompts.md#epic-review).

**Large diffs:** spawn parallel review specialists by subsystem (one split per iteration). Merge findings, dedupe, escalate cross-cutting issues to epic-level. Example split table in [examples.md](examples.md).

Classify findings: **BLOCKER**, **MAJOR**, **MINOR**, **NIT**. Verdict: **CLEAN** or **NEEDS_FIXES**.

### 3. Spawn fix specialist

For each BLOCKER/MAJOR batch, spawn a **separate** `worker` (host general-purpose only if `worker` is not installed).

Prompt template: [subagent-prompts.md](subagent-prompts.md#epic-fix).

Rules:
- Work on `{tip-branch}` unless fix clearly belongs on an intermediate phase branch
- Minimal, localized diffs; match repo conventions (pnpm-only, strict TS, no drive-by reformat)
- Run scoped tests before push
- **Never** let the fix specialist run thermo review on its own work

Cap: if the same finding survives **3** fix/review cycles, stop and escalate with evidence.

### 4. Verify yourself

After every fix push, **you** run the verification commands from the launch prompt (plan-derived + orchestration log). Check pass/fail output directly.

Include migration smoke tests when SQL changed (reconstruct base + apply migration — see prior patterns in orchestration log).

### 5. Re-run thermo review

Spawn a **fresh** `thermo-review` (or thermos) on the updated epic diff. Repeat steps 3–5 until CLEAN.

### 6. Optional: per-PR sanity pass

After epic is clean, optionally run one lightweight thermo pass per PR vs its base to catch stack-specific regressions. Not required if epic diff is clean and stack is coherent.

### 7. Log + parent comment

Append to orchestration log: iteration number, findings, fix SHAs, verification results, accepted MINOR/NIT items.

Post progress comment on parent Linear issue after each clean epic review cycle (retry once if Linear times out).

## Thermo review rubric (generalize per epic)

Fill focus areas from the plan quality bar. Default categories:

| Area | What to hunt |
|------|--------------|
| Correctness | Reducer/RPC parity; client/server contract drops; math/invariants |
| Engine quality | Sample accuracy, SRC, declick, offline/export parity, resource leaks |
| Security | Path traversal; IPC trust boundaries; temp file lifecycle |
| Breaking changes | Migration backfill safety; defaults for existing projects |
| Scope | Phase boundary creep; out-of-scope features shipped early |
| Tests | Golden tests, migration apply, format matrix, missing gates |
| Devex | Type-check failures; flaky tests introduced by epic |

Also maintain a **regression checklist** of prior phase-specific fixes (commit SHAs + what to re-check) in the launch prompt and orchestration log.

## Integration duties (yours alone)

- All fixes default to epic tip branch unless restack is required
- Intermediate phase fix: fix on that branch → rebase descendants P(n+1)…Pn → force-push with lease
- Keep all PRs ready for review with accurate titles (no "scaffold placeholder")
- Resolve mechanical rebase conflicts after restacks
- Re-run affected tests after restacks that touch shared files
- If a finding reveals a **plan-level problem** (schema conflict, architectural mismatch), stop, write recommendation on parent issue — do not improvise

## Operating rules

- Review and fix are **always separate specialists**
- Spawn prompts must be **fully self-contained** (children cannot see parent conversation)
- A cycle is done only when **you** verify test output and diff, not when a specialist says so
- Pre-existing flakes: ignore unless the epic introduces them (list in launch prompt)
- Do not merge; deliver merge-ready stack

## Final deliverable

Report to the user:

- Final verdict: CLEAN epic review (iteration count)
- Fix commits pushed (SHAs + subsystem)
- Verification summary (commands run + pass/fail)
- Remaining MINOR/NIT items (explicitly accepted or deferred)
- Stack status: all PRs ready, daisy-chained on trunk
- Updated orchestration log path

## Launch prompt

Fill `{...}` from Linear + Graphite + plan doc. Full template: [subagent-prompts.md](subagent-prompts.md#orchestrator-launch).

## Examples

See [examples.md](examples.md) for MUSE-537 (Audio Tracks epic review grind).
