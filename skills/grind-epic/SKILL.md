---
name: grind-epic
description: >-
  Grind an epic (a Linear project's branch, PR, or GitHub stack) to
  review-clean and test-green via an initial thermos audit followed by fix and
  single-pass re-review cycles in one chat. Use when the user says grind-epic,
  grind to green, thermo grind, review-fix loop, or wants review + fix
  specialists on an epic's diff.
disable-model-invocation: true
---

# Grind Epic

You are the **review/fix orchestrator** for an epic: a Linear project whose work lives on one branch, one PR, or a GitHub stack. You do **not** implement fixes yourself — you spawn specialists to review and fix, verify outcomes yourself, and grind until the diff is review-clean and test-green.

**Related:** For a one-shot dual review without a fix loop, use [thermos](../thermos/SKILL.md). To plan the epic (project, plan document, issues), use [plan-epic](../plan-epic/SKILL.md). To repair a broken stack, use [heal-stack](../heal-stack/SKILL.md).

## Before you start

The Linear project is the source of truth for scope. Resolve it from the user prompt (project name/URL, parent issue like `MUSE-537`, or a PR/branch whose issue belongs to a project), then gather:

| Input | Where to find it |
|-------|------------------|
| Linear project | `list_projects` / the parent issue's `project` |
| Plan of record | The plan document in the project (`list_documents` with `projectId`, then `get_document`) — scope, quality bar, phase boundaries |
| Parent epic + phase sub-issues | Linear issues in the project (`list_issues` with the project) |
| Branches / PRs | Each sub-issue's `gitBranchName` and linked PRs; `gh stack view --json` for the stack |
| Tip branch | Top of the stack, or the single work branch/PR head |
| Trunk | `dev` unless the user specifies otherwise |
| Verification commands | Plan quality bar; else infer from changed packages and ask if unclear |
| Known residual risks | Prior review comments on the parent issue, or user-provided |
| Pre-existing flakes | User-provided, or none |

Read the plan document's quality bar and the parent issue fully before spawning any specialist. If the project has no plan document, say so and continue from the issues and diff; suggest [plan-epic](../plan-epic/SKILL.md) afterward.

If the user gives only a PR or branch with no Linear project, proceed on that diff alone and skip the Linear steps.

### Review surface

| User says | Review surface |
|-----------|----------------|
| `/grind-epic MUSE-537` or a project name/URL | Cumulative epic diff: `git diff origin/{trunk}...origin/{tip-branch}` |
| `/grind-epic pr 188 -> dev` | PR #188 diff vs `dev` (fetch PR head; base = `dev`) |
| `/grind-epic` (no args) | Current branch vs trunk: `git diff origin/dev...HEAD` |
| Explicit branch/base | `git diff origin/{base}...origin/{branch}` or `...HEAD` |

For a stack, the cumulative diff is authoritative; per-phase PR diffs are subsets. Attribute fixes to the correct phase branch when possible.

Bootstrap:

```bash
git fetch origin {base} {tip-branch}
# If PR: gh pr checkout {n}   (or fetch PR head ref)
git checkout {tip-branch}
git diff origin/{base}...HEAD --stat
```

## Orchestration log

Keep a running log for the whole run. It is local scratch, **never committed** and not stored in Linear.

- Path: `tmp/orchestration/<parent-issue-or-branch>.md` at the repo root.
- Before writing, confirm it is ignored: `git check-ignore -q <path>`. If not, add `tmp/orchestration/` to `$(git rev-parse --git-path info/exclude)` rather than editing a tracked `.gitignore`.
- Start it with the ground truth (project, plan document link, phase/branch table, diff command, verification commands, flakes). Re-read it after any context loss.
- Append per iteration: specialists spawned, findings and verdict, fix SHAs, verification results, accepted MINOR/NIT items, residual risks.

## Definition of done

- One initial thermos audit completed; either it is clean or the latest required re-review has zero **BLOCKER** / **MAJOR** findings
- Scoped test / type-check gates green (orchestrator verifies output — do not trust specialist claims)
- Local orchestration log updated; progress comment posted on the parent Linear issue (when a project is in play)
- In-scope PRs stay **ready for review** (not draft) if they were
- **Do not merge** unless the user explicitly asks

## Review → fix loop

Repeat until CLEAN (zero BLOCKER/MAJOR):

```
- [ ] 1. Bootstrap — resolve project, plan, surface; fetch, checkout, orient on diff stat
- [ ] 2. Run one initial thermos audit — two review roles in parallel, never implement
- [ ] 3. Spawn fix specialist(s) — separate from reviewers; parallelize independent finding batches
- [ ] 4. Verify yourself — run verification commands, inspect output
- [ ] 5. Run one single-pass re-review on the updated diff
- [ ] 6. Log + Linear comment + report to user
```

### 1. Bootstrap

Resolve the Linear project and plan (see above), then orient on the diff. Infer verification commands from touched packages (e.g. `pnpm --filter @muse/agent type-check`, scoped vitest/cargo). Prefer the smallest relevant gates.

### 2. Initial review (thermos)

Run [thermos](../thermos/SKILL.md) **once** on the full review surface (`thermo-review` + `thermo-quality` in parallel). Never let either reviewer implement fixes. This establishes the broad correctness, security, and maintainability baseline. Give reviewers the plan document's quality bar and phase boundaries so they can flag scope creep and missing coverage.

**Large diffs:** split the initial review by subsystem (one split per iteration), merge and dedupe findings, and escalate cross-cutting issues to epic level.

Prompt template: [subagent-prompts.md](subagent-prompts.md#initial-review).

Classify findings: **BLOCKER**, **MAJOR**, **MINOR**, **NIT**. Verdict: **CLEAN** or **NEEDS_FIXES**.

### 3. Spawn fix specialist

For BLOCKER/MAJOR batches, spawn a **`worker`** (host general-purpose only if `worker` is not installed).

Prompt template: [subagent-prompts.md](subagent-prompts.md#fix).

Rules:
- Work on the tip branch (PR head / current branch) unless a fix clearly belongs on an intermediate phase branch
- Minimal, localized diffs; match repo conventions (pnpm-only, strict TS, no drive-by reformat in muse)
- Run scoped tests before finishing
- **Never** let the fix specialist run thermo review on its own work
- **Parallelize** independent fix batches (disjoint files/subsystems) in the same iteration
- Retain each fixer's handle and collect its explicit terminal handoff before verifying or re-reviewing. On asynchronous runtimes such as Prime RLM, end the admission turn and resume only after the handoff arrives; do not review an in-progress fix

Cap: if the same finding survives **3** fix/review cycles, stop and escalate with evidence. If a finding reveals a plan-level problem (schema conflict, architectural mismatch), stop and report it — do not improvise; add a comment on the parent issue and leave the plan document unchanged unless the user approves an update.

### 4. Verify yourself

After every fix round, **you** run the verification commands. Check pass/fail output directly. Include migration smoke tests when SQL changed.

When a fix landed on an intermediate phase branch, restack descendants (`gh stack rebase --remote origin`, then `gh stack submit --auto --remote origin` as needed; never `gh stack modify`) and re-run affected tests. Use [heal-stack](../heal-stack/SKILL.md) if bases are wrong.

### 5. Single-pass re-review

After each fix round, spawn **one fresh re-review specialist**, not another two-role thermos pair:

- Default to [quick-review](../quick-review/SKILL.md) via role `reviewer` for localized fixes and direct confirmation that reported findings are resolved.
- Use [thermo-nuclear-review](../thermo-nuclear-review/SKILL.md) via role `thermo-review` when the findings or fixes involve security, correctness invariants, breaking behavior, devex, feature gates, cross-cutting behavior, or otherwise remain high risk.

The re-review must inspect the updated overall review surface, verify prior findings end to end, and check for regressions introduced by the fixes. Repeat steps 3–5 until CLEAN.

Re-run full thermos only if a fix materially expands scope, introduces substantial structural/maintainability changes not covered by the initial quality pass, or the user explicitly requests it. Prompt template: [subagent-prompts.md](subagent-prompts.md#re-review).

### 6. Log, comment, report

Append the iteration to the local orchestration log. After each clean cycle, post a progress comment on the parent Linear issue (`save_comment`; retry once if Linear times out): verdict, fix SHAs, verification summary, accepted MINOR/NIT items. Then report to the user (see [Final deliverable](#final-deliverable)).

## Thermo review rubric

Customize from the plan document's quality bar and the change set. Default categories:

| Area | What to hunt |
|------|--------------|
| Correctness | Logic bugs; contract drops; math/invariants |
| Security | Trust boundaries; path traversal; secrets; IPC |
| Breaking changes | Defaults for existing users; migration safety |
| Scope | Phase boundary creep; unrelated drive-bys; incomplete wiring |
| Tests | Missing coverage for new behavior; broken gates |
| Devex | Type-check failures; flakes introduced by the change |

For a multi-iteration run, also keep a **regression checklist** of prior fixes (SHAs + what to re-check) in the launch prompt and the log.

## Operating rules

- Review and fix are **always separate specialists**
- Spawn prompts must be **fully self-contained** (children cannot see parent conversation)
- A cycle is done only when **you** verify test output and diff, not when a specialist says so
- Initial thermos uses its two parallel roles; subsequent re-reviews use one selected review role
- Prefer **parallel** fix batches when work is independent
- Pre-existing flakes: ignore unless this change introduces them
- Do not merge; deliver a green, review-clean branch/PR/stack

## Final deliverable

Report to the user:

- Final verdict: CLEAN (initial thermos + re-review iteration count)
- Fix commits (SHAs + summary) if any were made
- Verification summary (commands run + pass/fail)
- Remaining MINOR/NIT items (accepted or deferred)
- Diff surface used (project/stack tip, `pr N -> base`, or `branch...base`)
- Linear project and parent issue comment link (if any), and the local orchestration log path

## Launch prompt

Fill `{...}` from the user invocation and the Linear project. Full template: [subagent-prompts.md](subagent-prompts.md#orchestrator-launch).

## Examples

See [examples.md](examples.md).
