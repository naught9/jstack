---
name: orchestrate-phased-feature
description: >-
  Orchestrate large phased features by spawning implementation and review
  specialists per phase, managing Graphite PR stacks and Linear progress until
  merge-ready. Use when launching a parent agent for a multi-phase epic,
  grinding P0–Pn implementation with thermos reviews, or when the user mentions
  orchestrator, phased subagents, stack scaffold, or grinding a feature to
  merge-ready.
disable-model-invocation: true
---

# Orchestrate Phased Feature

You are the **orchestrator and integrator** for a large phased feature. You do **not** implement phases yourself. You spawn specialists, keep the PR stack coherent, update Linear, and grind until every in-scope phase is merge-ready.

Host spawn details: [host-conventions.md](../../references/host-conventions.md).

## Models

- Soft default: capable/fast model for the parent orchestrator and implementation workers; high-reasoning for thermos review roles.
- Honor user overrides for parent or any child role (e.g. "use grok 4.5 for implementers").

**Pair with:** [orchestrate-phased-review](../orchestrate-phased-review/SKILL.md) for post-implementation epic review grinding (thermo clean + test-green across the full stack).

## Before you start

Gather or confirm:

| Input | Where to find it |
|-------|------------------|
| Parent Linear issue | e.g. MUSE-537 |
| Plan of record | `work/planning/*.md` or issue attachment |
| Phase sub-issues | Linear children (P0…Pn) |
| Graphite stack | Draft PRs + branch names, or plan to create them |
| Out-of-scope phases | e.g. follow-on P6 — do not implement |
| Gates / blockers | e.g. upstream stack must merge before P2 |

Read the plan of record and parent issue fully before spawning any specialist.

## Stack conventions (muse-monorepo)

- One branch + one PR per phase, daisy-chained on `dev` (P0 base = `dev`, Pn base = P(n−1) branch).
- Prefer **existing scaffold branches** when present — do not create parallel branches.
- Use Linear-suggested branch names (e.g. `jake/muse-614-audio-tracks-p0-...`).
- Restack descendants after each phase (`gt restack`, `gt submit` as needed). For a full-stack publish, use [ship-stack](../ship-stack/SKILL.md); if PRs are orphaned or bases are wrong, use [heal-gt-stack](../heal-gt-stack/SKILL.md) first.
- **Do not merge** unless the user explicitly asks. Deliverable = merge-ready PRs.

## Per-phase loop

Run phases **in order** (P0 → Pn). For each in-scope phase:

```
- [ ] 1. Promote PR from scaffold → in-progress
- [ ] 2. Spawn implementation specialist
- [ ] 3. Run thermos review (thermo-review + thermo-quality)
- [ ] 4. Fix loop until clean review
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

Spawn a **fresh** general-purpose / implementation worker with a fully self-contained prompt (children cannot see your conversation). Template: [subagent-prompts.md](subagent-prompts.md#implementation).

Include: sub-issue ID, exact branch, base branch, plan sections, scope boundaries, definition of done, repo conventions.

The implementer may spawn nested exploration workers if the host allows and the phase needs it.

### 3. Review (thermos)

Spawn a **separate** review path — never let the implementer review its own work.

Invoke the [thermos](../thermos/SKILL.md) skill against the phase PR/branch (roles `thermo-review` + `thermo-quality`). Template: [subagent-prompts.md](subagent-prompts.md#review).

### 4. Fix loop

If thermos reports findings:

1. Spawn a fix specialist (or resume implementer) with the finding list.
2. Re-run thermos.
3. Repeat until clean.

Cap: if the same finding survives 3 fix/review cycles, stop the phase and escalate with evidence.

### 5. Mark ready + restack + Linear

- Mark PR **ready for review** (not draft).
- Restack all descendant branches (including untouched follow-on placeholders at the stack tip).
- Linear sub-issue → **In Review** or **Done** per team convention; comment with PR link + shipped summary.

### 6. Verify (orchestrator duty)

A phase is done only when **you** confirm:

- Thermos review clean
- Scoped tests / type-check / lint green (check output, don't trust specialist claims)
- Acceptance criteria from sub-issue + plan doc met
- PR title/body no longer say "scaffold"

### 7. Log + parent comment

Append to `work/<parent-issue>-orchestration.md`: phase, specialists run, review iterations, risks.

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
- If a phase reveals a plan-level problem, stop, document, and surface — don't improvise architecture.

## Out-of-scope / tip placeholders

Leave follow-on scaffold PRs (e.g. P6) **untouched** except restacking on top of completed work.

## Final deliverable

Report to the user:

- Stack summary (PR numbers, branches, draft/ready status)
- Per-phase: review iterations, test commands run, residual risks
- Any blocked gates or plan issues needing human decision
- Link to orchestration log in `work/`

## Examples

See [examples.md](examples.md) for MUSE-537 (Audio Tracks).
