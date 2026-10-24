---
name: build-epic
description: >-
  Orchestrate large phased features by spawning implementation and review
  specialists per phase, managing GitHub PR stacks and Linear progress until
  merge-ready. Use when launching a parent agent for a multi-phase epic,
  grinding P0–Pn implementation with thermos reviews, or when the user mentions
  build-epic, orchestrate-phased-feature, orchestrator, phased subagents, stack
  scaffold, or grinding a feature to merge-ready.
  Require explicit user invocation; do not use it automatically.
disable-model-invocation: true
---

# Build Epic

You are the **orchestrator and integrator** for a large phased feature. You do **not** implement phases yourself. You spawn specialists, keep the PR stack coherent, update Linear, and grind until every in-scope phase is merge-ready.

## Invocation gate

Use this skill only when the user explicitly asks for `/build-epic` or otherwise clearly requests this workflow. If it looks useful but was not requested, ask whether they would like to use `/build-epic`, then wait for their answer.

**Pair with:** [grind-epic](../grind-epic/SKILL.md) for post-implementation epic review grinding (thermo clean + test-green across the full stack).

## Before you start

Gather or confirm:

| Input | Where to find it |
|-------|------------------|
| Parent Linear issue | e.g. MUSE-537 |
| Linear project | The epic's project (from the parent issue's `project`) |
| Plan of record | The plan Linear document in that project (`list_documents` with `projectId`, then `get_document`) |
| Phase sub-issues | Linear children (P0…Pn) |
| GitHub stack | Draft PRs + branch names, or plan to create them |
| Out-of-scope phases | e.g. follow-on P6 — do not implement |
| Gates / blockers | e.g. upstream stack must merge before P2 |

Read the plan of record and parent issue fully before spawning any specialist. If the project has no plan document, stop and ask — suggest [plan-epic](../plan-epic/SKILL.md). Set the project state to `started` when P0 begins.

## Orchestration log

Keep a running orchestration log for the whole run. It is local scratch, **never committed** and not stored in Linear.

- Path: `tmp/orchestration/<parent-issue>.md` at the repo root (e.g. `tmp/orchestration/MUSE-537.md`).
- Before writing, confirm it is untracked and ignored: `git check-ignore -q tmp/orchestration/<parent-issue>.md`. If it isn't ignored, add `tmp/orchestration/` to the local exclude file (`$(git rev-parse --git-path info/exclude)`) rather than editing a tracked `.gitignore`.
- Create it at the start with the ground truth (parent, project, plan document link, phase table, gates, out-of-scope phases). Re-read it after any context loss.
- Append as you go: specialists spawned (role, scope, handle), review iterations and verdicts, fix SHAs, verification commands and results, gates hit, residual risks, accepted MINOR/NIT items, decisions made.
- Specialist prompts may quote relevant log excerpts; children never get the log path as a dependency.

## Stack conventions (muse-monorepo)

- **GitHub Stacks only.** Use `gh stack` for stack operations and ordinary `git`/`gh` for standard branch and PR work. Do not use Graphite or `gt` commands.
- One branch + one PR per phase, daisy-chained on `dev` (P0 base = `dev`, Pn base = P(n−1) branch).
- Prefer **existing scaffold branches** when present — do not create parallel branches.
- Use Linear-suggested branch names (e.g. `jake/muse-614-audio-tracks-p0-...`).
- Restack descendants after each phase (`gh stack rebase --remote origin`, `gh stack submit --auto --remote origin` as needed). Never run `gh stack modify`. If PRs are orphaned or bases are wrong, use [heal-stack](../heal-stack/SKILL.md) first.
- **Do not merge** unless the user explicitly asks. Deliverable = merge-ready PRs.

## Per-phase loop

Run phases **in order** (P0 → Pn). For each in-scope phase:

```
- [ ] 1. Promote PR from scaffold → in-progress
- [ ] 2. Spawn implementation specialist
- [ ] 3. Run one initial thermos review (thermo-review + thermo-quality)
- [ ] 4. Fix loop with single-pass re-reviews until clean
- [ ] 5. Mark PR ready + restack + update Linear
- [ ] 6. Verify acceptance criteria yourself
- [ ] 7. Log progress; comment on parent issue
```

### 1. Promote PR

When the stack is pre-scaffolded:

- Check out the phase branch.
- **Rename** the PR from `chore(...): stack scaffold placeholder …` to a real conventional-commit title with `(MUSE-XXX)`.
- Replace placeholder PR body with a proper description.
- Remove scaffold-only placeholder files in the first real commit.
- Set Linear sub-issue → **In Progress**.

If there is no scaffold, create the branch stacked on the previous phase and open a draft PR.

### 2. Implementation specialist

Spawn a **fresh** `worker` with a fully self-contained prompt (children cannot see your conversation). Fall back to host general-purpose only if `worker` is not installed. Template: [subagent-prompts.md](subagent-prompts.md#implementation).

Include: sub-issue ID, exact branch, base branch, plan sections, scope boundaries, definition of done, repo conventions.

Retain the implementer handle and collect its explicit terminal handoff before starting thermos. On asynchronous runtimes such as Prime RLM, end the admission turn and resume the phase only after that handoff arrives; do not inspect or review an in-progress diff.

The implementer may spawn nested exploration workers if the host allows and the phase needs it.

### 3. Initial review (thermos)

Spawn a **separate** review path — never let the implementer review its own work.

Invoke [thermos](../thermos/SKILL.md) **once** against the phase PR/branch (roles `thermo-review` + `thermo-quality` in parallel). This establishes the broad correctness, security, and maintainability baseline. Template: [subagent-prompts.md](subagent-prompts.md#initial-review).

### 4. Fix loop

If the initial thermos or a later re-review reports findings:

1. Spawn a fix specialist, or send the finding list to the retained implementer handle when the runtime supports direct-child follow-up; otherwise spawn a fresh `worker`.
2. Collect the fixer or implementer's explicit terminal handoff. On asynchronous runtimes, end the admission/follow-up turn and do not review an in-progress fix.
3. Spawn **one fresh re-review specialist**, not another two-role thermos pair:
   - Default to [quick-review](../quick-review/SKILL.md) via role `reviewer` for localized fixes and direct confirmation that reported findings are resolved.
   - Use [thermo-nuclear-review](../thermo-nuclear-review/SKILL.md) via role `thermo-review` when the findings or fixes involve security, correctness invariants, breaking behavior, devex, feature gates, cross-cutting behavior, or otherwise remain high risk.
4. Repeat until the selected re-review is clean.

Re-run full thermos only if the fix materially expands the PR's scope, introduces substantial structural/maintainability changes that the initial quality pass did not cover, or the user explicitly requests it. Template: [subagent-prompts.md](subagent-prompts.md#re-review).

Cap: if the same finding survives 3 fix/review cycles, stop the phase and escalate with evidence.

### 5. Mark ready + restack + Linear

- Mark PR **ready for review** (not draft).
- Restack all descendant branches (including untouched follow-on placeholders at the stack tip).
- Linear sub-issue → **In Review** or **Done** per team convention; comment with PR link + shipped summary.

### 6. Verify (orchestrator duty)

A phase is done only when **you** confirm:

- Initial thermos completed and the latest required re-review is clean
- Scoped tests / type-check / lint green (check output, don't trust specialist claims)
- Acceptance criteria from sub-issue + plan doc met
- PR title/body no longer say "scaffold"

### 7. Log + parent comment

Append to the local orchestration log: phase, specialists run, review iterations, risks.

Post a progress comment on the parent Linear issue when the phase reaches merge-ready.

## Gate handling

When a phase is blocked on an upstream merge (e.g. event-lane stack into `dev`):

1. Check gate status before starting the blocked phase.
2. If blocked: **do not** work around the gate (no parallel schedulers, stubs, or architectural shortcuts).
3. Either pause and report, or continue only later phases that stack cleanly without rebase churn.
4. Document the gate and resume plan in the orchestration log.

## Integration duties (yours alone)

- Resolve mechanical rebase conflicts after restacks.
- Keep PR titles/descriptions accurate as work evolves.
- Re-run affected tests after restacks that touch shared files.
- If a phase reveals a plan-level problem, stop, document it in the log and as a comment on the plan document or parent issue, and surface it — don't improvise architecture. Update the Linear plan document only when the user approves the change.

## Out-of-scope / tip placeholders

Leave follow-on scaffold PRs (e.g. P6) **untouched** except restacking on top of completed work.

## Final deliverable

Report to the user:

- Stack summary (PR numbers, branches, draft/ready status)
- Per-phase: review iterations, test commands run, residual risks
- Any blocked gates or plan issues needing human decision
- Path to the local orchestration log (untracked; not in Linear or the repo)

## Examples

See [examples.md](examples.md) for MUSE-537 (Audio Tracks).
