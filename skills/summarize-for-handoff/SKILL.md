---
name: summarize-for-handoff
description: >-
  Summarize the current conversation for a fresh agent session: problem, context,
  decisions, files touched, and next steps. Use for handoff, summarize for handoff,
  context for next agent, or continuing this in a new chat.
disable-model-invocation: true
---

# Summarize for Handoff

Produce a handoff summary that a new agent instance can read cold and continue the work without re-deriving context.

## Output destination

- Write the handoff **in your chat response** (structured markdown is fine).
- **Do not** create or write a handoff file (`HANDOFF.md`, `docs/handoff.md`, etc.) unless the user explicitly asks for a file.
- If unclear, default to in-message output and offer to save a file only if they want one.

## Workflow

1. **Scan the conversation** — problem statement, constraints, decisions, dead ends, and current state.
2. **Inventory artifacts** — files created/edited, commands run, branches, PRs, external links.
3. **Identify what's done vs in-flight** — completed steps, partial work, blockers.
4. **Write the handoff** using the template below. Be dense and factual — no filler.

## Handoff template

```markdown
## Goal
<what we're trying to accomplish>

## Problem / context
<background a new agent needs — stack, constraints, URLs>

## Decisions made
- <decision> — <why> (or "open: <question>")

## Files touched
| Path | Change |
|------|--------|
| ... | created / modified / deleted — brief what |

## Commands / state
- Branch: ...
- PR: ...
- Tests: passed / failing / not run
- Env / secrets: anything the next agent must know

## Current task
<exactly what to do next — one clear action>

## Do not redo
- <work already completed that the next agent should not repeat>

## Open questions / blockers
- ...
```

## Hard rules

- **Assume zero prior context** — the reader is a fresh session.
- **Prefer links and paths** over vague references ("the config file" → `path/to/file`).
- **Include failures** — what didn't work matters as much as what did.
- Keep it scannable — bullets and tables over prose walls.
