# Host conventions

jstack skills name roles and workflows; the installer maps those roles into each host's native discovery and spawn interfaces.

## Structured questions

| Host | Interface |
|---|---|
| Cursor | `AskQuestion` |
| Pi | configured question extension or chat |
| OpenCode | `question` |
| Codex | available structured input tool or chat |

Batch related decisions when the host supports structured questions. Otherwise ask the same concise questions in chat.

## Subagents

| Host | Spawn shape | Installed definition |
|---|---|---|
| Cursor | `Task` with `subagent_type: "<role>"` | `.cursor/agents/<role>.md` |
| Pi (`pi-subagents`) | `subagent({ agent: "<role>", task })` | `.agents/agents/<role>.md` |
| OpenCode | `task` or `@<role>` | `opencode.json` `agent.<role>` |
| Codex | spawn by custom agent name | `.codex/agents/<role>.toml` |

Launch independent read-heavy work in parallel when the user or applicable project/skill instructions request delegation. Keep one writer per overlapping filesystem scope.

Subagent prompts must include the task, relevant paths and context, constraints, and definition of done. Prefer the installed role; if it is missing, run the role body inline or use the closest host built-in.

## Models

- High-reasoning defaults: `oracle`, `planner`, `reviewer`, `thermo-review`, `thermo-quality`.
- Capable/fast defaults: `explorer`, `worker`.
- Do not hard-require provider model slugs in portable skills or agent definitions.
- Always honor explicit user overrides.

## Role IDs

| Role | Purpose | Intent |
|---|---|---|
| `explorer` | codebase reconnaissance and compressed handoff | read |
| `oracle` | decision-consistency second opinion; protect inherited state | read |
| `planner` | concrete implementation plan | read |
| `worker` | approved implementation and fixes | write |
| `reviewer` | everyday evidence-backed review | read |
| `thermo-review` | correctness, security, breaking, and devex audit | read |
| `thermo-quality` | maintainability and structural audit | read |

Canonical definitions live in `subagents/<role>.md`. Host adapters may transform frontmatter or wrap the body, but the body remains the source of truth.
