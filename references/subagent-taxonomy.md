# jstack subagent taxonomy

Portable role contracts for Cursor, Codex, Pi, OpenCode, Droid, and oh-my-pi.
Skills orchestrate; subagents execute slices. Canonical bodies: `subagents/<role>.md`.

## v1 roles

| Role | Intent | Typical skills |
|------|--------|----------------|
| `explorer` | Local recon → compressed handoff | plan, parallelize, investigate, maintain-verification-skill |
| `oracle` | Advisory second opinion; decision consistency; no edits | plan, investigate, parallelize |
| `planner` | Concrete plan, no product edits | plan, parallelize, plan-epic |
| `worker` | Single-writer implement / fix | parallelize, grind-epic |
| `reviewer` | Everyday multi-angle review | quick-review, parallelize integrate |
| `thermo-review` | Deep correctness / security / breaking / devex | thermos, grind-epic |
| `thermo-quality` | Deep maintainability / code-judo | thermos |

## Design rules

1. Bodies are host-agnostic; hosts add frontmatter or Codex TOML only.
2. Prefer jstack role IDs in skills; fall back to the host's general-purpose agent when a role is not installed.
3. Read-only by default except `worker`.
4. Do not invent parallel `*-worker` IDs or host glue roles (Browser/Cloud/Bugbot).
5. Thermos stay the deep-review brand; `reviewer` stays lighter.

## Spawning

- Subagent prompts include the role contract, task, relevant paths and context, constraints, definition of done, and the runtime's explicit return/handoff instruction. On a prompt-only runtime, embed the installed role body (or a faithful concise rendering) in the child prompt.
- Launch independent read-heavy work in parallel when the user or applicable project/skill instructions request delegation. Keep one writer per overlapping filesystem scope.
- Spawn admission is not task completion. Retain one handle per admitted child, admit every independent child in a wave before collecting results, and collect an explicit terminal handoff from every child before reviewing, integrating, or synthesizing.
- Nested children report to their direct parent, which aggregates and relays the handoff upward.
- Claude Code subagents cannot spawn further subagents; fan-out must be orchestrated from the parent session.

## v2 (not registered)

| Role | Intent |
|------|--------|
| `web-researcher` | External docs/API/version evidence with links |
| `debugger` | Runtime repro / log isolation; no feature work |

## Explicit non-roles

Keep as **skills** only: deslop, supabase, create-verification-skill, maintain-verification-skill, etc.
