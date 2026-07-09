---
name: plan
description: >-
  Create a reviewable implementation plan before coding: research the codebase,
  ask clarifying questions, commit to one approach, and write a concrete plan
  with file paths and todos. Use for task plan, plan mode, CreatePlan-style
  planning, or when scope is unclear and you want approval before building.
disable-model-invocation: true
---

# Plan

Portable CreatePlan / Cursor Plan mode workflow for daily task planning. Research, clarify, commit to one approach, write a reviewable plan, then **stop** — do not implement.

**Escalate when:**

- Multi-phase epic with Linear / Graphite → [plan-phased-feature](../plan-phased-feature/SKILL.md)
- Parallel specialist worker waves → [parallel-plan](../parallel-plan/SKILL.md)

Host question-tool details: [host-conventions.md](../../references/host-conventions.md).

## Hard rules

- **Read-only until approved.** No edits, installs, commits, or implementation. Research and plan only.
- **Clarify first.** If requirements are ambiguous or multiple approaches materially change the design, ask **1–2 critical questions** immediately (host structured question tool; else numbered chat options). Do not ship a placeholder or “awaiting answers” plan.
- **Commit to one approach.** No Option A/B, TBDs, or soft optionality inside the plan. Pick a sensible default when the user hasn’t specified; state it briefly.
- **Research before writing.** Prefer parallel explore/read of relevant files; cite real paths.
- **Proportional.** Short plans for small tasks; deeper plans only when complexity warrants.
- **Stop after the plan.** Present the plan and wait for user approval / “build” — do not auto-implement.

### Cursor note

If already in Cursor Plan mode with `CreatePlan` available, prefer the native tool (same content rules). Do not also write a duplicate file unless the user asks to save to workspace.

## Workflow

```
1. Intake     → parse request; if clearly a multi-phase epic, hand off to plan-phased-feature
2. Clarify    → 1–2 questions if needed; wait
3. Research   → codebase + docs; optional parallel explore agents
4. Decide     → one concrete approach
5. Write plan → markdown artifact (format below)
6. Stop       → user reviews / edits; build is a separate step
```

## Plan artifact

**Default write location:** `plans/<slug>.md` at the active workspace root (create `plans/` if needed).

### Frontmatter

```yaml
---
name: <short 3-4 word name>
overview: <1-2 sentences>
todos:
  - id: <kebab-id>
    content: <actionable step>
---
```

### Body requirements

1. First line after frontmatter: `# Title`
2. Short overview (may live only in frontmatter `overview:`)
3. Concrete steps with markdown links to files; essential snippets only
4. Mermaid only when it clarifies architecture/data flow (see Mermaid rules below)
5. Optional YAML todos: `{id, content}` — actionable and trackable
6. No emojis; prefer bullet lists over markdown tables
7. End with **Definition of done** / verification so a later build step can check itself

### Mermaid rules

- No spaces in node IDs (use camelCase / underscores)
- Quote edge labels that contain parentheses or special characters
- Quote node labels that contain parentheses, commas, or colons
- Use explicit subgraph IDs: `subgraph id [Label]`
- No HTML entities or angle brackets in labels
- No explicit colors / styling (theme handles it)
- No `click` syntax

## Out of scope

- Linear epics / Graphite stacks → `plan-phased-feature`
- Parallel worker wave charts → `parallel-plan`
- Implementation, CI grind, thermos → build / grind skills
- Commit / push → [ship](../ship/SKILL.md); Graphite stack publish/repair → [ship-stack](../ship-stack/SKILL.md) / [heal-stack](../heal-stack/SKILL.md)
- Brainstorm-only architecture with no implementation intent → stay conversational; only use this skill when the user wants a buildable plan
