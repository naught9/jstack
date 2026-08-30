# jstack subagent taxonomy

Portable role contracts for Cursor, Codex, Pi, OpenCode, Droid, and oh-my-pi.
Skills orchestrate; subagents execute slices. Canonical bodies: `subagents/<role>.md`.

## v1 roles

| Role | Intent | Soft model | Typical skills |
|------|--------|------------|----------------|
| `explorer` | Local recon → compressed handoff | capable/fast | plan, parallel-plan, investigate, build-epic recon, maintain-verification-skill |
| `oracle` | Advisory second opinion; decision consistency; no edits | high-reasoning | plan, investigate, parallel-plan |
| `planner` | Concrete plan, no product edits | balanced-reasoning | plan, parallel-plan, plan-epic |
| `worker` | Single-writer implement / fix | capable/fast | build, parallelize, grind-*, build-epic |
| `reviewer` | Everyday multi-angle review | balanced-reasoning | quick-review, parallelize integrate |
| `thermo-review` | Deep correctness / security / breaking / devex | high-reasoning | thermos, grind-* |
| `thermo-quality` | Deep maintainability / code-judo | high-reasoning | thermos |

## Design rules

1. Bodies are host-agnostic; hosts add frontmatter or Codex TOML only.
2. Prefer jstack role IDs in skills; fall back per `host-conventions.md`.
3. Read-only by default except `worker`.
4. Do not invent parallel `*-worker` IDs or host glue roles (Browser/Cloud/Bugbot).
5. Thermos stay the deep-review brand; `reviewer` stays lighter.

## v2 (not registered)

| Role | Intent |
|------|--------|
| `web-researcher` | External docs/API/version evidence with links |
| `debugger` | Runtime repro / log isolation; no feature work |

## Explicit non-roles

Keep as **skills** only: deslop, docs, ship, ship-stack, frontend-design, supabase, create-verification-skill, maintain-verification-skill, etc.
