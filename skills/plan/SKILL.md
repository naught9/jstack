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

- Open product / architecture decisions that would fork the plan → offer [ask-me](../ask-me/SKILL.md) and wait for opt-in
- Multi-phase epic with Linear / GitHub stacks → offer [plan-epic](../plan-epic/SKILL.md) and wait for the user to opt in
- Parallel specialist worker waves → [parallelize](../parallelize/SKILL.md)

## Hard rules

- **Read-only until approved.** No edits, installs, commits, or implementation. Research and plan only.
- **Clarify first.** If requirements are ambiguous or multiple approaches materially change the design, ask **1–2 critical questions** immediately (host structured question tool; else numbered chat options). Do not ship a placeholder or “awaiting answers” plan. Skip this when [ask-me](../ask-me/SKILL.md) already settled the tree.
- **Commit to one approach.** No Option A/B, TBDs, or soft optionality inside the plan. Pick a sensible default when the user hasn’t specified; state it briefly.
- **Research before writing.** Prefer spawning `explorer` (or parallel read) of relevant files; cite real paths.
- **Proportional.** Short plans for small tasks; deeper plans only when complexity warrants.
- **Linear is opt-in.** Never create or edit a Linear issue unless the user asks or approves. If no issue is linked, ask once whether to record one (see [Linear issue](#linear-issue)); the default is no.
- **Stop after the plan.** Present the plan and wait for user approval / “build” — do not auto-implement.

### Cursor note

If already in Cursor Plan mode with `CreatePlan` available, prefer the native tool (same content rules). Do not also write a duplicate file unless the user asks to save to workspace.

## Workflow

```
1. Intake     → parse request; if clearly a multi-phase epic, offer plan-epic and wait for opt-in
2. Clarify    → 1–2 questions if needed; wait
3. Research   → codebase + docs; optional parallel `explorer` agents
4. Decide     → one concrete approach
5. Write plan → markdown artifact (format below); may spawn `planner` if the parent stays orchestrator-only
6. Linear?    → if no issue is linked, ask whether to record one; create only on approval
7. Stop       → user reviews / edits; implementation is the next step or a `worker` spawn
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

## Linear issue

Check whether the work is already tracked: an issue ID or URL in the request, an ID in the branch name or PR (e.g. `jake/muse-614-…`), or an issue the user attached.

- **Linked:** read it (`get_issue`) during intake for context and acceptance criteria, and reference its identifier in the plan. Do not edit it unless asked.
- **Not linked:** after presenting the plan, ask once with the host structured question tool (else a chat yes/no): "Record this as a Linear issue?" Options: no (default), yes (create from the plan), link an existing issue.
- **Skip the question** when the user already declined or said no Linear, when Linear tools are unavailable, or for trivial one-step tasks.
- **On yes (or if the user asked up front):** create one issue with `save_issue` using [linear-template.md](linear-template.md). Confirm team (and project if the work belongs to one) first, and show the title and description before creating if the user hasn't seen them. Report the identifier and URL.
- Never create an issue as a side effect of planning, and never create more than the one the user approved. Multi-phase epics go through [plan-epic](../plan-epic/SKILL.md) instead.

## Out of scope

- Requirements interview before a plan → [ask-me](../ask-me/SKILL.md)
- Linear epics / GitHub stacks → [plan-epic](../plan-epic/SKILL.md)
- Parallel worker waves → `parallelize`
- Bug / root cause → [investigate](../investigate/SKILL.md)
- Thermos → [thermos](../thermos/SKILL.md)
- GitHub stack repair → [heal-stack](../heal-stack/SKILL.md)
- Brainstorm-only architecture with no implementation intent → stay conversational; only use this skill when the user wants a buildable plan
