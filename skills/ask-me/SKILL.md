---
name: ask-me
description: >-
  Interview the user in rounds about implementation requirements and
  decisions until nothing is silently assumed. Use for ask-me, ask me,
  clarify requirements, stress-test a plan or idea, or when the user
  wants questions before planning or building.
disable-model-invocation: true
---

# Ask Me

Requirements interview **before** [plan](../plan/SKILL.md) or [build](../build/SKILL.md). Map the work as a **design tree**: every decision branches into the decisions that hang off it. Do not plan or implement until the user confirms a shared understanding.

Host question-tool and spawn details: [host-conventions.md](../../references/host-conventions.md).

**Escalate when:**

- Shared understanding reached → [plan](../plan/SKILL.md) (epic → [plan-epic](../plan-epic/SKILL.md); parallel waves → [parallel-plan](../parallel-plan/SKILL.md))
- Bug / root cause, not a design → [investigate](../investigate/SKILL.md)

## Hard rules

- **Read-only.** No edits, installs, commits, plans, or implementation during this interview.
- **Decisions are the user's.** Put each to them and wait. Never silently assume a product or architecture choice.
- **Facts are yours.** Codebase, docs, APIs, git — look them up (spawn `explorer` when that is faster). Never ask the user for something you can find.
- **Rounds, not a dump.** Ask only the current **frontier**: questions whose prerequisites are already settled. Wait for answers before the next round.
- **Recommend every time.** Each question includes your recommended answer and a one-line why.
- **Stop when the frontier is empty.** Recap settled decisions. Do not act until the user confirms shared understanding.

## Workflow

```
1. Intake     → parse the request; sketch the design tree privately
2. Facts      → read / spawn explorer for anything the tree needs from the repo
3. Frontier   → ask every currently unblocked decision in one round; wait
4. Reshape    → apply answers; recompute frontier; repeat 2–4
5. Recap      → when frontier is empty, summarize decisions; wait for confirm
6. Hand off   → plan / plan-epic / parallel-plan if they asked for that next; otherwise stop
```

## Design tree

The **frontier** is every decision whose prerequisites are settled — questions you can ask *now* without guessing at answers you have not heard.

- A question whose answer depends on another question still open in this round belongs to a **later** round.
- Each round of answers reshapes the tree: settled decisions push the frontier outward.
- A running exploration is an unsettled prerequisite. Do not block the rest of the frontier on it — ask every question that does not depend on that fact now.

Typical branches (not a checklist — only ask what this work actually forks on):

- Outcome and non-goals
- Scope / phasing (what is in v1)
- Data model and APIs
- Auth, permissions, tenancy
- UX / empty / error / loading states
- Compatibility, migrations, feature flags
- Verification and rollout

## Asking a round

Batch the whole frontier in one round. Prefer the host structured question tool when the host has one; otherwise numbered chat.

Each question:

1. Short title
2. Body: enough context that the user can choose without reading the repo
3. Discrete options when the choice is discrete (recommended option first, labeled recommended)
4. Your recommended answer plus one-line why

Chat fallback:

```
Q1 - <title>: <body>

Recommended: <answer> — <why>
```

Do not ask:

- Anything you could grep, read, or spawn `explorer` to answer
- Questions that depend on an unsettled answer from this same round
- Taste questions that do not change the implementation
- More than the current frontier (no extras)

If the user answers with "recommended", "yes", or a short "1, 2b, recommended", take it and move on.

## Recap

When the frontier is empty:

```markdown
## Shared understanding
- <decision>: <choice> — <why it matters>
```

Ask them to confirm or correct. Only after confirm: follow their original next-step (plan/build) or offer [plan](../plan/SKILL.md).

## Out of scope

- Writing the plan → [plan](../plan/SKILL.md)
- Implementing → [build](../build/SKILL.md)
- Debugging a live bug → [investigate](../investigate/SKILL.md)
