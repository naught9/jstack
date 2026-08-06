---
name: build
description: >-
  Implement an approved plan or clear task as the primary agent: follow the
  plan, make focused code changes, verify with scoped checks, and stop at
  review-ready. Use for build, implement the plan, execute the plan, or
  everyday single-agent implementation. Not for parallel worker waves or
  phased epics.
disable-model-invocation: true
---

# Build

Everyday single-agent implementation. You are the **primary implementer** — execute an approved plan (or a clear, small task), verify, and stop at review-ready. Do not commit/push unless the user also asks for [ship](../ship/SKILL.md).

When the parent orchestrates instead of coding: spawn role **`worker`** with a self-contained prompt (plan path, scope, definition of done). Fall back to host general-purpose only if `worker` is not installed.

Host spawn details: [host-conventions.md](../../references/host-conventions.md).

**Escalate when:**

- Need parallel specialist waves → [parallelize](../parallelize/SKILL.md) (plan first with [parallel-plan](../parallel-plan/SKILL.md) if missing)
- Multi-phase epic / Graphite stack → [build-epic](../build-epic/SKILL.md)
- No plan and scope is ambiguous → [plan](../plan/SKILL.md) first, then return here
- Bug unknown / needs repro → [investigate](../investigate/SKILL.md)

## Hard rules

- **Follow the plan.** Prefer an approved `plans/*.md` or the plan just agreed in chat. Do not reopen architecture unless blocked.
- **If there is no plan:** only proceed when the task is small and unambiguous; otherwise run / hand off to [plan](../plan/SKILL.md).
- **Stay on scope.** No drive-by refactors, unrelated files, or expanding into epic scaffolding.
- **Verify as you go.** Run scoped tests / type-check / lint for touched packages. Fix failures you introduced.
- **Stop at review-ready.** Summarize what changed and how to verify. Suggest [quick-review](../quick-review/SKILL.md) or [ship](../ship/SKILL.md) — do not auto-commit or auto-review unless asked.
- **Blocked → ask.** If the plan is wrong or a product decision is required, stop and ask (1–2 questions). Do not invent product behavior.

## Workflow

```
1. Load plan     → plans/*.md, chat-approved plan, or clear user task
2. Orient        → read cited files; confirm branch / working tree
3. Implement     → todos / steps in order; keep diffs localized
4. Verify        → scoped checks for touched packages
5. Report        → summary, commands run, remaining risks / follow-ups
6. Stop          → offer quick-review / ship; do not push
```

### Plan sources (priority)

1. Explicit path the user named
2. Latest `plans/<slug>.md` for this task
3. Plan content already approved in this chat
4. Clear one-shot task (no formal plan file)

### Implementation habits

- Match existing code style; minimal comments
- Prefer editing existing files over new abstractions
- Update tests when behavior changes
- Rebuild/commit `dist/` only if the repo already commits artifacts and the change requires it — still no git commit unless `/ship`

## Out of scope

- Planning only → [plan](../plan/SKILL.md) / [parallel-plan](../parallel-plan/SKILL.md)
- Parallel worker orchestration → [parallelize](../parallelize/SKILL.md)
- Commit / push → [ship](../ship/SKILL.md)
- Deep review / fix grind → [quick-review](../quick-review/SKILL.md) / [thermos](../thermos/SKILL.md) / [grind-to-green](../grind-to-green/SKILL.md)
- Root-cause unknown bugs → [investigate](../investigate/SKILL.md)
