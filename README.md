# jstack

Portable agent config: skills, subagents, and MCP servers that work across Cursor, Codex, Pi, OpenCode, Droid, and oh-my-pi — without depending on Cursor plugin cache paths.

```
jstack/
├── manifest.json              # catalog of what this pack contains
├── mcp.json                   # linear, supabase, context7
├── references/host-conventions.md
├── skills/                    # SKILL.md trees
└── subagents/                 # role definitions (canonical bodies)
```

`manifest.json` is the inventory. `references/host-conventions.md` is the spawn/question matrix. This README is the **setup playbook** — paste a host section into your agent on first load and let it wire things up.

---

## Quick start

1. Clone this repo somewhere stable (e.g. `~/source/jstack`).
2. Open your coding agent in that directory (or point it at this README).
3. Paste the **Setup prompt** for your host from [Harness setup](#harness-setup) below.
4. Authenticate MCP servers when prompted (Linear / Supabase OAuth; context7 needs no key).
5. Verify with [Smoke test](#smoke-test).

There is no install binary yet. Prefer symlink or copy; keep jstack as the source of truth so updates are a `git pull`.

---

## What’s included

### MCP (`mcp.json`)

| ID | Transport |
|----|-----------|
| `linear` | HTTP `https://mcp.linear.app/mcp` |
| `supabase` | HTTP `https://mcp.supabase.com/mcp` |
| `context7` | stdio `npx -y @upstash/context7-mcp` |

### Global skills

| Skill | Purpose |
|-------|---------|
| `thermos` | Parallel `thermo-review` + `thermo-quality`, then synthesize |
| `thermo-nuclear-review` | Deep correctness / security / breaking / devex rubric |
| `thermo-nuclear-code-quality-review` | Deep maintainability / code-judo rubric |
| `deslop` | Strip AI slop from branch vs base |
| `docs` | Add docs matching repo style |
| `quick-review` | Everyday branch review (lighter than thermos) |
| `summarize-for-handoff` | Cold-start handoff for a new session |
| `plan` | CreatePlan-style task plan (research → clarify → concrete plan; no code) |
| `build` | Execute an approved plan / clear task as primary implementer |
| `investigate` | Repro → root cause → small fix or fix plan |
| `parallel-plan` | CreatePlan-style plan for parallel worker waves (no code) |
| `parallelize` | Orchestrate sequential/parallel subagent workers; review + integrate |
| `ship` | Stage + commit; ask before push (single branch) |
| `cleanup-branches` | Audit stale/merged branches; delete only after approval |
| `frontend-design` | Distinctive UI work |
| `supabase` | Supabase workflows + MCP |
| `supabase-postgres-best-practices` | Postgres performance rules |

### Project skills (muse-monorepo)

| Skill | Purpose |
|-------|---------|
| `plan-epic` | Plan of record + Linear + optional Graphite scaffold |
| `ship-stack` | Restack + `gt submit --stack` (no merge) |
| `heal-stack` | Repair orphan/broken Graphite stacks onto `dev` |
| `build-epic` | Per-phase implement → thermos → fix grind |
| `grind-epic` | Epic-level thermo → fix grind |
| `grind-to-green` | Single PR/branch thermo → fix loop (no Linear/Graphite) |

Install project skills only into muse (or repos that share those conventions).

### Subagent roles

| Role ID | File | Scope |
|---------|------|-------|
| `thermo-review` | `subagents/thermo-review.md` | global — register on every host |
| `thermo-quality` | `subagents/thermo-quality.md` | global — register on every host |

**Canonical rule:** copy the markdown **body** as-is. Only add host-specific frontmatter fields listed in the harness section. Do not invent new role IDs. Implementation/fix worker prompts live inside `build-epic` / `grind-epic` / `grind-to-green` skill folders — not as registered subagents.

### Not in the active pack

- Cursor built-ins (skills-cursor, bugbot, account rules, etc.)
- `tmp/orchestrate` — Cursor cloud SDK orchestrator, gitignored; kept for possible later reuse

---

## Models

Skills use **soft defaults** (high-reasoning for deep review; capable/fast for implementers). Always honor user overrides:

```text
/thermos use grok 4.5 for the review
/thermos opus for thermo-quality, grok for thermo-review
```

---

## Harness setup

Each subsection has a **paste-this prompt** for your agent, then exact paths and notes.

Shared reading for every harness:

- `README.md` (this file)
- `references/host-conventions.md`
- `manifest.json`
- `mcp.json`

### Cursor

**Skills:** symlink or copy each `skills/<id>/` → `~/.cursor/skills/<id>/` (user) and/or `<project>/.cursor/skills/<id>/` (project).

**Subagents:** install `thermo-review` and `thermo-quality` where Cursor discovers custom agents (user or project agents directory). Frontmatter `name` must match the role ID. Spawn via `Task` with `subagent_type: "thermo-review"` / `"thermo-quality"`.

**MCP:** merge `mcp.json` into `~/.cursor/mcp.json` or project `.cursor/mcp.json` (do not clobber unrelated servers).

**Questions:** `AskQuestion`.

**Setup prompt (paste into Cursor):**

```text
Read jstack README.md § Cursor and references/host-conventions.md.
Using JSTACK_ROOT = the directory that contains this README:

1. Symlink (prefer) or copy every skills/*/ directory into ~/.cursor/skills/.
2. For muse-monorepo project skills only (plan-epic, build-epic, grind-epic, grind-to-green, ship-stack, heal-stack), also link them into muse-monorepo/.cursor/skills/.
3. Register subagents/thermo-review.md and subagents/thermo-quality.md as Cursor custom agents so Task can spawn subagent_type thermo-review and thermo-quality. Keep bodies intact; name frontmatter must match the role id.
4. Merge mcp.json into ~/.cursor/mcp.json without removing other servers.
5. Summarize what you linked and how to invoke /thermos.
```

### Codex

**Skills:** copy or symlink skill dirs into `$CODEX_HOME/skills/` (usually `~/.codex/skills/`) and/or `.agents/skills/` in a repo.

**Subagents:** Codex wants **TOML** under `~/.codex/agents/` or `.codex/agents/`:

```toml
name = "thermo-review"
description = "<from markdown frontmatter description>"
developer_instructions = """
<full markdown body from subagents/thermo-review.md, without the YAML frontmatter>
"""
```

Repeat for `thermo-quality`. Soft-pin models in the TOML only if the user asks.

**MCP:** map `mcp.json` into `~/.codex/config.toml` `[mcp_servers.*]` entries.

**Questions:** no structured tool — ask in chat with numbered options.

**Setup prompt (paste into Codex):**

```text
Read jstack README.md § Codex and references/host-conventions.md.
JSTACK_ROOT = directory containing this README.

1. Symlink or copy skills/*/ into ~/.codex/skills/ (skip muse-only skills unless this repo is muse-monorepo).
2. Convert subagents/thermo-review.md and thermo-quality.md into ~/.codex/agents/*.toml (name, description, developer_instructions = body).
3. Merge mcp.json servers into ~/.codex/config.toml.
4. Tell me how to ask Codex to spawn thermo-review and thermo-quality explicitly.
```

### Pi

Recommended packages:

- Subagents: [@tintinweb/pi-subagents](https://pi.dev/packages/@tintinweb/pi-subagents) (`Agent({ subagent_type })`) and/or [pi-subagents](https://pi.dev/packages/pi-subagents) (`subagent({ agent })`) — pick one after you finish comparing
- Questions: [@juicesharp/rpiv-ask-user-question](https://pi.dev/packages/@juicesharp/rpiv-ask-user-question) → `ask_user_question`

**Skills:** Pi-standard skill dirs (e.g. `~/.pi/agent/skills/`, `.pi/skills/`, `.agents/skills/`) — use whatever your Pi install already discovers; symlink from jstack.

**Subagents (tintinweb):** copy to `.pi/agents/thermo-review.md` and `.pi/agents/thermo-quality.md` (project) or the user agents dir. Keep `name` = role ID. Optional: restrict tools to read/search/bash for review-only.

**Subagents (nicobailon):** register the same role IDs in that package’s agents layout; spawn with `subagent({ agent: "thermo-review", task: "..." })`.

**MCP:** merge into Pi’s MCP config (user/project).

**Setup prompt (paste into Pi):**

```text
Read jstack README.md § Pi and references/host-conventions.md.
JSTACK_ROOT = directory containing this README.

1. Confirm pi-subagents (tintinweb and/or nicobailon) and @juicesharp/rpiv-ask-user-question are installed; note which subagent package is active.
2. Symlink skills/*/ into the Pi skills path this install actually discovers.
3. Register thermo-review and thermo-quality from subagents/ into .pi/agents/ (tintinweb) or the active package’s agents path. Keep bodies intact; name must match role id.
4. Merge mcp.json into Pi MCP config.
5. Show an example spawn for thermos (both roles in parallel / background if supported).
```

### OpenCode

**Skills:** `.opencode/skills/<id>/SKILL.md` or `~/.config/opencode/skills/`, also `.agents/skills/`.

**Subagents:** `.opencode/agents/<role>.md` with frontmatter including `mode: subagent`. Body = jstack subagent body. Spawn via `task` or `@thermo-review`.

**MCP:** OpenCode config MCP block — merge from `mcp.json`.

**Questions:** `question` tool (permission `question`).

**Setup prompt:**

```text
Read jstack README.md § OpenCode and references/host-conventions.md.
JSTACK_ROOT = directory containing this README.

1. Symlink skills into .opencode/skills/ (or global opencode skills path).
2. Create .opencode/agents/thermo-review.md and thermo-quality.md with mode: subagent; body from jstack subagents/.
3. Merge mcp.json into opencode MCP config.
4. Confirm task/@ invocation for both roles.
```

### Droid (Factory)

**Skills:** Droid/Claude-compatible skills paths (project or user).

**Subagents:** `.factory/droids/<role>.md` or `~/.factory/droids/`. Suggest `tools: read-only` (or equivalent) for thermo roles. Spawn via `Task` + `subagent_type`.

**MCP:** `~/.factory/mcp.json` or project `.factory/mcp.json`.

**Questions:** `AskUserQuestion`.

**Setup prompt:**

```text
Read jstack README.md § Droid and references/host-conventions.md.
JSTACK_ROOT = directory containing this README.

1. Install skills into Droid’s skills discovery path.
2. Copy thermo-review and thermo-quality into ~/.factory/droids/ (or project .factory/droids/), tools read-only, bodies intact.
3. Merge mcp.json into Factory MCP config.
4. Confirm Task subagent_type names.
```

### oh-my-pi (omp)

**Skills:** omp/Pi-compatible skills paths.

**Subagents:** `.omp/agents/<role>.md` or `~/.omp/agent/agents/`. Spawn via `task({ agent: "<role>", tasks: [...] })`.

**MCP:** omp MCP config — merge from `mcp.json`.

**Questions:** `ask` tool.

**Setup prompt:**

```text
Read jstack README.md § oh-my-pi and references/host-conventions.md.
JSTACK_ROOT = directory containing this README.

1. Symlink skills into omp’s skills path.
2. Register thermo-review and thermo-quality under .omp/agents/ (or user agents dir); bodies intact.
3. Merge mcp.json into omp MCP config.
4. Show a task() example that runs both roles.
```

---

## Muse-monorepo extras

Only when working in muse-monorepo:

1. Install project-scoped skills: `plan-epic`, `build-epic`, `grind-epic`, `grind-to-green`, `ship-stack`, `heal-stack`.
2. Keep Graphite (`gt`) and Linear MCP available — phased skills assume them; `grind-to-green` only needs git/`gh`.
3. Daily skills (`plan`, `build`, `investigate`, `parallel-plan`, `parallelize`, …) are global — already installed with other globals.

**Setup prompt add-on:**

```text
Also wire muse project skills from jstack into this repo’s agent skills path
(plan-epic, build-epic, grind-epic, grind-to-green, ship-stack, heal-stack).
Do not install them globally.
```

---

## Smoke test

After setup, in a repo with a non-empty branch vs its base:

```text
Run /thermos (or invoke the thermos skill) on the current branch.
Use background/parallel specialists if the host supports it.
Synthesize findings; do not restate both reports in full.
```

Expect:

1. `thermo-review` and `thermo-quality` both run (or inline fallback if no subagents).
2. A short combined verdict with prioritized findings.
3. User model overrides respected when given.

---

## Updating

```bash
cd /path/to/jstack && git pull
```

Re-run the host setup prompt if new skills or roles appeared (`manifest.json` is the checklist). Prefer symlinks so pulls apply automatically.

---

## Design notes

- **Agent-agnostic catalog** — flat `skills` / `subagents` / `mcp` in `manifest.json`; no Cursor-only nesting.
- **Roles not tool APIs** — skills say `thermo-review`; hosts map that to `Task` / `Agent` / `subagent` / TOML.
- **No Cursor plugin cache** — everything lives in this repo.
- **README-first setup** — no install emitters yet; agents follow this playbook. A thin symlink/doctor script may come later if the mechanical bits get annoying.

See also: [references/host-conventions.md](references/host-conventions.md).
