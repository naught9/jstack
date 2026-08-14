---
name: parallel-plan
description: >-
  Create a reviewable parallel-worker implementation plan: research, clarify,
  commit to one decomposition, and write sequential vs parallel waves with file
  ownership and review gates. Use for parallel-plan, parallelize planning, or
  before spawning multiple implementation workers. Planning only — pair with
  parallelize to execute.
disable-model-invocation: true
---

# Parallel Plan

CreatePlan-style planning for **parallel specialist execution**. Research, clarify, commit to one wave decomposition, write a reviewable plan, then **stop** — do not implement or spawn workers.

**Pair with:** [parallelize](../parallelize/SKILL.md) to execute the plan.

**When to use [plan](../plan/SKILL.md) instead:** a single-agent concrete plan without specialist-wave decomposition.

**Escalate when:** multi-phase epic with Linear / GitHub stacks → offer [plan-epic](../plan-epic/SKILL.md); phased orchestration → offer [build-epic](../build-epic/SKILL.md). Wait for the user to opt in before using either skill.

Host question / spawn details: [host-conventions.md](../../references/host-conventions.md).

## Hard rules

- **Read-only until approved.** No edits, installs, commits, implementation, or worker spawns. Research and plan only.
- **Clarify first.** If requirements are ambiguous or multiple decompositions materially change the waves, ask **1–2 critical questions** immediately (host structured question tool; else numbered chat options). Do not ship a placeholder plan.
- **Commit to one decomposition.** No Option A/B or soft optionality inside the plan. Pick a sensible default; state it briefly.
- **Research before writing.** Prefer spawning `explorer` (or parallel read) of relevant files; cite real paths.
- **Proportional.** If the task is small enough for one agent, say so and point to [plan](../plan/SKILL.md) — do not invent fake parallelism.
- **One file owner per worker** when possible — serialize shared files/interfaces.
- **Stop after the plan.** Present the plan and wait for approval / `/parallelize` — do not auto-execute.

### Cursor note

If already in Cursor Plan mode with `CreatePlan` available, prefer the native tool (same content rules). Still use the parallel wave format below. Do not also write a duplicate file unless the user asks to save to workspace.

## Workflow

```
1. Intake     → parse request; if clearly a multi-phase epic, offer plan-epic and wait for opt-in
2. Clarify    → 1–2 questions if needed; wait
3. Research   → codebase + docs; optional parallel `explorer` agents
4. Decompose  → tasks with inputs, outputs, file ownership (may use `planner` role)
5. Classify   → sequential | parallel | user gate; collision risks; review checkpoints
6. Write plan → markdown artifact (format below)
7. Stop       → user reviews; execution is parallelize
```

## Plan artifact

**Default write location:** `plans/<slug>-parallel.md` at the active workspace root (create `plans/` if needed).

### Frontmatter

```yaml
---
name: <short 3-4 word name>
overview: <1-2 sentences>
todos:
  - id: <kebab-id>
    content: <actionable wave or gate>
---
```

### Body format

```markdown
# <Title>

## Goal
<one sentence>

## Approach
<one concrete decomposition; any default you chose>

## Prerequisites
- <anything that must exist before work starts>

## Phase 1 — Sequential (blocking)
- Step 1: <task> — files/scope — done when <criterion>
- Step 2: ...

## Phase 2 — Parallel workers
Launch in a single turn (one specialist per row):

- W1: <task> — files/scope — depends on Phase 1 — soft model: capable/high (e.g. grok-4.5-high)
- W2: ...

## Phase 3 — Integration / sequential
- <task> — why sequential

## User gates
- [ ] <decision> — before <what>

## Review checkpoints
- After Phase 2: verify <what> before Phase 3

## Definition of done
- <how parallelize / the user knows the feature is complete>

## Risks
- <collision, scope creep, or unknown>
```

Prefer bullet lists over markdown tables when targeting Cursor CreatePlan UI parity. Mermaid only when it clarifies wave dependencies (same mermaid rules as [plan](../plan/SKILL.md)).

## Soft model hints

- Implementation workers: **capable/high** soft default (e.g. grok-4.5-high when available).
- Do not hard-require a model slug. Honor user overrides at execute time.

## Out of scope

- Spawning workers / integrating results → [parallelize](../parallelize/SKILL.md)
- Single-agent daily plan → [plan](../plan/SKILL.md)
- Linear / GitHub stack epics → [plan-epic](../plan-epic/SKILL.md)
