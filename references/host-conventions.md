# Host conventions (jstack)

Agent-agnostic rules for skills and subagents. Skills describe **roles and workflows**; hosts differ only in how you spawn and ask questions.

## Structured questions

When a skill says **ask the user** (fixed choices, approvals, multi-select):

| Host | Tool |
|------|------|
| Cursor | `AskQuestion` |
| Pi | `ask_user_question` ([@juicesharp/rpiv-ask-user-question](https://pi.dev/packages/@juicesharp/rpiv-ask-user-question)) |
| OpenCode | `question` |
| Droid | `AskUserQuestion` |
| Codex / others | Ask in chat with clear numbered options |

Batch 2–4 related questions per turn when the tool allows. If no structured tool exists, ask the same questions in prose.

## Spawning subagents

Skills name **roles** (e.g. `explorer`, `worker`, `thermo-review`). Map the role to the host's spawn API:

| Host | Spawn shape | Custom agent path |
|------|-------------|-------------------|
| Cursor | `Task` + `subagent_type: "<role>"` | agents dir / plugin agents |
| Droid | `Task` + `subagent_type: "<role>"` | `.factory/droids/<role>.md` |
| Pi (@tintinweb/pi-subagents) | `Agent({ subagent_type: "<role>", prompt, run_in_background? })` | `.pi/agents/<role>.md` |
| Pi (pi-subagents / nicobailon) | `subagent({ agent: "<role>", task, async? })` | package `agents/` or project agents |
| OpenCode | `task` tool or `@<role>` | `.opencode/agents/<role>.md` (`mode: subagent`) |
| oh-my-pi | `task({ agent: "<role>", tasks: [...] })` | `.omp/agents/<role>.md` |
| Codex | spawn by agent `name` (explicit user request) | `.codex/agents/<role>.toml` |

**Parallel / background:** Prefer launching independent specialists in one turn. Use background/async when the host supports it (`run_in_background`, `async: true`, etc.). If the host has no subagents, run the role prompts **inline** in the parent session (sequential is fine).

**Self-contained prompts:** Child agents do not see the parent conversation. Every spawn prompt must include the full task, paths, diff/context, and definition of done.

**Fallbacks:** Prefer the jstack role when installed. If missing: `explorer` → host Explore/scout; `worker` → host general-purpose / Build / default; `planner` / `reviewer` → run the role body inline in the parent.

## Models

- Do **not** hard-require a model slug in skills.
- Soft defaults:
  - **High-reasoning** — `thermo-review`, `thermo-quality`, `planner`, `reviewer`
  - **Capable / fast** — `explorer`, `worker`
- Always honor explicit user overrides, e.g. `/thermos use grok 4.5 for the review` or `use opus for thermo-quality`.
- When the user names a model for one role only, leave the other role on the host default unless they specify both.

## jstack role IDs

| Role ID | Purpose | R/W intent |
|---------|---------|------------|
| `explorer` | Local codebase recon → compressed handoff | read |
| `planner` | Concrete implementation plan, no product edits | read (+ plan file if asked) |
| `worker` | Single-writer implementer for approved tasks / fixes | write |
| `reviewer` | Everyday multi-angle review (lighter than thermos) | read |
| `thermo-review` | Diff-scoped bugs / security / breaking / devex / feature-gate audit | read |
| `thermo-quality` | Diff-scoped maintainability / structure / code-judo audit | read |

Canonical definitions live in `subagents/<role>.md`. Host setup (see root `README.md`) may add frontmatter or wrap Codex TOML; the **body** stays the source of truth.

**v2 (not registered yet):** `web-researcher`, `oracle`, `debugger`.

Skills may still embed specialized prompt templates (e.g. under `build-epic/`, `grind-epic/`, `grind-to-green/`, `parallelize/`). Those templates target the roles above — do not invent parallel `*-worker` IDs.
