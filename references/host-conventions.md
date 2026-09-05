# Host conventions

jstack skills name roles and workflows; the installer maps those roles into each host's native discovery and spawn interfaces.

## Structured questions

| Host | Interface |
|---|---|
| Cursor | `AskQuestion` |
| Pi | configured question extension or chat |
| OpenCode | `question` |
| Codex | available structured input tool or chat |
| Prime Agent | chat or an available question UI |

Batch related decisions when the host supports structured questions. Otherwise ask the same concise questions in chat.

## Subagents

| Host | Spawn shape | Installed definition |
|---|---|---|
| Cursor | `Task` with `subagent_type: "<role>"` and Cursor Grok `model` (see [Models](#models)) | `.cursor/agents/<role>.md` |
| Pi (`pi-subagents`) | `subagent({ agent: "<role>", task })` | `.agents/agents/<role>.md` |
| OpenCode | `task` or `@<role>` | `opencode.json` `agent.<role>` |
| Codex | spawn by custom agent name | `.codex/agents/<role>.toml` |
| Prime Agent RLM | `handle = await rlm(prompt, name="<role>-<task>")` | `.agents/skills/jstack-subagents/SKILL.md` + adapter-relative `../../prompts/<role>.md` |

Launch independent read-heavy work in parallel when the user or applicable project/skill instructions request delegation. Keep one writer per overlapping filesystem scope.

Subagent prompts must include the role contract, task, relevant paths and context, constraints, definition of done, and the runtime's explicit return/handoff instruction. Prefer the installed named role when the host supports named roles. On a prompt-only runtime, embed the installed role body or a faithful concise rendering of it in the child prompt.

### Prompt-only and asynchronous runtimes

Role IDs are portable orchestration labels, not a guarantee that the host has a named-agent registry. Spawn admission is not task completion. Retain one handle per admitted child, admit every independent child in a wave before collecting results, and collect an explicit terminal handoff from every child before reviewing, integrating, or synthesizing. Never treat a spawn return value as the child result.

On Prime Agent RLM:

1. Read the generated `jstack-subagents` skill and the selected adapter-relative `../../prompts/<role>.md` role body. Resolve prompt paths from the adapter skill directory, never from the process working directory.
2. Require the child to reply with `await agent_message.send(message, receiver_role="parent")`.
3. Call `await rlm(prompt, name=...)` once per independent child and retain every returned handle. The handle confirms admission immediately and never contains the answer.
4. End the parent turn after admitting the wave instead of polling or awaiting completion. Replies arrive as ordinary messages and may span multiple parent turns.
5. Recover handles with `await rlm.list_subagents()`. Follow up only with a retained direct child via `await agent_message.send(..., receiver_role="child", receiver_name=handle.name)`.

Do not invent a synchronous wrapper, generic wait API, or named-agent lookup. Nested children report to their direct parent, which must aggregate and relay the handoff upward. Prime does not discover `.agents/agents`; that path is the Pi adapter.

## Models

- High-reasoning defaults: `oracle`, `planner`, `reviewer`, `thermo-review`, `thermo-quality`.
- Capable/fast defaults: `explorer`, `worker`.
- Do not hard-require provider model slugs in portable skills or canonical agent bodies.
- Always honor explicit user overrides.

### Cursor

On Cursor, **Cursor Grok is the default for every jstack subagent**, including reviewers. Do not spawn Anthropic Opus (for example `claude-opus-5-thinking-high` / "Opus 5 high") or other Claude models unless the user explicitly named that family.

When calling `Task`:

1. Use the installed jstack role (`reviewer`, `thermo-review`, `thermo-quality`, `worker`, …). Do not substitute a built-in reviewer that selects Opus.
2. Set `model` to the latest Cursor Grok slug from the Task tool's available list (ids containing `grok`, such as `cursor-grok-4.6-xhigh`). Prefer the high/xhigh variant for high-reasoning roles when listed.
3. Do not treat "high-reasoning" as permission to select Opus. Do not pass `inherit` when the parent is not already Cursor Grok — an Auto or Claude parent would otherwise produce an Opus child.
4. `composer-2.5` is an acceptable Cursor-native fallback for capable/fast workers only when no Grok slug is listed.
5. The Cursor adapter writes `model: grok-4.6` on generated `.cursor/agents/<role>.md` files. Keep that pin; do not replace it with Opus.

### Prime Agent

- Prime children inherit the parent model and thinking configuration by default. For an explicit model override, use an exact selector returned by `await rlm.find_models(...)`; `rlm()` accepts `name` and `model`, not a per-child thinking option.
- GPT-5.6 models support `max` thinking. Honor an explicit `max` request on the parent/session instead of clamping it to `xhigh`.

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
