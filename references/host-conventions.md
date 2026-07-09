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

Skills name **roles** (e.g. `thermo-review`, `thermo-quality`). Map the role to the host's spawn API:

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

## Models

- Do **not** hard-require a model slug in skills.
- Soft default: prefer a **high-reasoning** model for deep review; a **capable/high** model for implementation workers (e.g. grok-4.5-high when available).
- Always honor explicit user overrides, e.g. `/thermos use grok 4.5 for the review` or `use opus for thermo-quality`.
- When the user names a model for one role only, leave the other role on the host default unless they specify both.

## jstack role IDs

| Role ID | Purpose |
|---------|---------|
| `thermo-review` | Diff-scoped bugs / security / breaking / devex / feature-gate audit |
| `thermo-quality` | Diff-scoped maintainability / structure / code-judo audit |

Canonical definitions live in `subagents/<role>.md`. Host setup (see root `README.md`) may add frontmatter or wrap Codex TOML; the **body** stays the source of truth.

For implementation/fix work, spawn the host's **general-purpose** worker with a self-contained prompt (templates under `skills/build-epic/`, `skills/grind-epic/`, `skills/grind-to-green/`, `skills/parallelize/`). Do not register separate `*-worker` role IDs.
