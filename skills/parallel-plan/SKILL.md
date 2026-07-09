---
name: parallel-plan
description: >-
  Form an implementation plan for parallel specialist workers: which steps are
  sequential, which can run in parallel, and where the user must review.
  Use for parallel-plan, parallel implementation plan, or before spawning
  multiple implementation workers on a feature.
disable-model-invocation: true
---

# Parallel Implementation Plan

Produce a plan structured for parallel specialist execution. Planning only — do not implement.

**Pair with:** [orchestrate-phased-feature](../orchestrate-phased-feature/SKILL.md) for phased epic execution; [plan-phased-feature](../plan-phased-feature/SKILL.md) for epic-level planning with Linear/Graphite.

Host spawn details: [host-conventions.md](../../references/host-conventions.md).

## Context

Implementation will use parallel specialist workers. The plan must make dependencies explicit so workers don't collide or build on incomplete work.

## Workflow

1. **Understand the request** — read relevant code; ask clarifying questions if scope is ambiguous (structured question tool when available).
2. **Decompose** into discrete tasks with clear inputs, outputs, and file ownership.
3. **Classify each task:**
   - **Sequential** — must complete before downstream tasks start (shared types, migrations, core abstractions)
   - **Parallel** — independent files/modules; safe to run concurrently
   - **User gate** — needs review, decision, or approval before continuing
4. **Identify collision risks** — files or interfaces multiple workers might touch; assign a single owner or serialize those steps.
5. **Define review checkpoints** — when you (the planner) should inspect worker output before the next wave starts.
6. **Present the plan** using the format below.

## Output format

```markdown
## Goal
<one sentence>

## Prerequisites
- <anything that must exist before work starts>

## Phase 1 — Sequential (blocking)
| Step | Task | Files / scope | Done when |
|------|------|---------------|-----------|
| 1 | ... | ... | ... |

## Phase 2 — Parallel workers
Launch these in a single turn (one specialist per row):

| Worker | Task | Files / scope | Model hint (soft) | Depends on |
|--------|------|---------------|-------------------|------------|
| W1 | ... | ... | ... | Phase 1 |
| W2 | ... | ... | ... | Phase 1 |

## Phase 3 — Integration / sequential
| Step | Task | Why sequential |
|------|------|----------------|
| ... | ... | ... |

## User gates
- [ ] <decision point> — before <what>

## Review checkpoints
After Phase 2: verify <what> before starting Phase 3.

## Risks
- <collision, scope creep, or unknown>
```

## Hard rules

- **Do not implement** — output the plan only unless the user explicitly asks to start workers.
- **One file owner per worker** when possible — avoid two workers editing the same file.
- **Flag thin plans** — if the task is small enough for one agent, say so instead of over-parallelizing.
- Soft model hints only; honor user overrides when launching.
