---
name: parallelize-work
description: >-
  Orchestrate implementation via parallel subagent workers: plan waves if
  needed, spawn sequential then parallel specialists, review and integrate
  between waves. Use for parallelize-work, parallelize, or executing a
  parallel-plan. Parent stays orchestrator — not the primary implementer.
disable-model-invocation: true
---

# Parallelize Work

Execute work with **subagent workers** for efficiency. Your role shifts to **orchestration, code review, and integration** — not doing all the implementation yourself.

**Pair with:** [parallel-plan](../parallel-plan/SKILL.md) for the wave chart (run that skill first, or produce an equivalent plan inline if the user already approved a decomposition).

Host spawn details: [host-conventions.md](../../references/host-conventions.md).

## Hard rules

- **Orchestrate, don't monopolize.** Prefer spawning implementation workers over writing all the code in the parent session.
- **Plan waves up front** when no approved parallel plan exists — brief [parallel-plan](../parallel-plan/SKILL.md) style chart (sequential vs parallel vs user gates). For large/ambiguous work, stop and get approval before spawning.
- **Sequential when required.** If a step must land first (shared types, migrations, core abstractions), spawn one worker, **wait**, review/integrate, then open the next parallel wave.
- **Parallel in one turn.** Independent workers with disjoint file ownership launch together (background/async when the host allows).
- **Self-contained prompts.** Children do not see this conversation — every spawn includes goal, paths, constraints, definition of done, and what not to touch.
- **One file owner per worker.** Serialize shared files; never assign two workers the same hot file in one wave.
- **Review between waves.** After each wave: read diffs, run or request scoped checks, fix collisions, then proceed.
- **Don't over-parallelize.** Tiny tasks stay in one worker (or the parent). Say so and keep it simple.
- Soft model default for implementation workers: **capable/high** (prefer **grok-4.5-high** when the host offers it). Honor user overrides (e.g. `/parallelize-work use opus for workers`).

## Workflow

```
1. Intake + plan   → use existing parallel-plan artifact, or draft waves now
2. Gate            → if ambiguous / large, confirm waves with user; else proceed
3. Sequential wave → spawn worker(s) that must finish first; wait; review; integrate
4. Parallel wave   → spawn independent workers in one turn; wait; review; integrate
5. Repeat          → more seq/parallel waves as the plan requires
6. Close           → definition of done, remaining risks, suggest ship / quick-review
```

### 1. Resolve the plan

- If `plans/*-parallel.md` (or an attached parallel plan) exists and is approved → execute it.
- Else produce a short wave chart (Goal / Sequential / Parallel / Gates / Done) before spawning.
- Flag collision risks and assign file owners explicitly in each worker prompt.

### 2. Spawn workers

Map to the host's general-purpose / implementation worker role (see host-conventions). Prefer background for parallel waves.

**Prompt skeleton** (fill every field):

```markdown
You are an implementation worker on a parallelized task.

## Goal
{one sentence}

## Scope
{bullet list — what to implement}

## Out of scope
{files / concerns other workers own — do not edit}

## Files you own
{explicit paths}

## Constraints
{branch, tests to run, repo conventions}

## Definition of done
- [ ] {criterion}
- [ ] Scoped tests / type-check green for your files
- [ ] Brief summary of changes + commands run

Do not expand into other workers' files. Escalate blockers instead of guessing.
```

### 3. Parent loop (per wave)

1. Launch the wave (one worker, or N in parallel).
2. Wait for completion (or poll background results).
3. **Review** — intent vs diff; collisions; missing tests.
4. **Integrate** — resolve overlaps yourself or with a small fix worker; re-run checks if needed.
5. Only then start the next wave.

### 4. User gates

Stop and ask when the plan marks a user gate, or when workers disagree / block on a product decision. Do not invent product behavior across workers.

## Fallback

If the host has **no** subagent system: run worker prompts **inline** sequentially in this session, still respecting wave order and review checkpoints. Say that you're in inline mode once.

## Out of scope

- Planning-only (no spawns) → [parallel-plan](../parallel-plan/SKILL.md)
- Single-agent plan/build without workers → [plan](../plan/SKILL.md)
- Muse phased epic orchestration / Graphite → [orchestrate-phased-feature](../orchestrate-phased-feature/SKILL.md)
- Thermo grind → [thermos](../thermos/SKILL.md) / [grind-to-green](../grind-to-green/SKILL.md)
- Commit / push → [ship](../ship/SKILL.md)
