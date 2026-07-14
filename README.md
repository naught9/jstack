# jstack

Portable skills, subagent roles, and MCP metadata for Codex, Cursor, Pi, and OpenCode.

```text
jstack/
├── .agents/.mcp.json          # host-neutral MCP inventory
├── bin/jstack.mjs             # installer and doctor CLI
├── manifest.json              # canonical inventory
├── references/host-conventions.md
├── skills/                    # Agent Skills trees
└── subagents/                 # canonical role definitions
```

`manifest.json` is the inventory. Skills and subagent Markdown remain the source of truth; the installer generates only the host adapters that require a different format.

## Quick start

Install into a project from a stable jstack clone or a pinned `./jstack` submodule:

```bash
node jstack/bin/jstack.mjs install --project-root .
node jstack/bin/jstack.mjs doctor --project-root .
```

The default host set is `codex,cursor,pi,opencode`. Narrow it when needed:

```bash
node jstack/bin/jstack.mjs install --project-root . --hosts codex,cursor
```

Install a personal baseline only from the stable primary jstack checkout:

```bash
node bin/jstack.mjs install --global
node bin/jstack.mjs doctor --global
```

Global mode intentionally rejects submodules and disposable Git worktrees.

## Installed layout

| Capability | Shared / Pi | Cursor | Codex | OpenCode |
|---|---|---|---|---|
| Skills | `.agents/skills/` | shared | shared | shared |
| Agents | `.agents/agents/` | `.cursor/agents/` | `.codex/agents/` | `opencode.json` |
| Prompts | `.agents/prompts/` | canonical Markdown | generated TOML | `{file:...}` references |
| MCP source | `.agents/.mcp.json` | `.cursor/mcp.json` | `.codex/config.toml` | `opencode.json` |

Pi uses the [`pi-subagents`](https://pi.dev/packages/pi-subagents) package. jstack supplies its project agents under `.agents/`; it does not install the package or create `.pi/` files.

## MCP is opt-in

Normal installation links the portable `.agents/.mcp.json` inventory but does not activate servers. Inspect the optional adapters with doctor, then merge them explicitly:

```bash
node jstack/bin/jstack.mjs install --project-root . --with-mcp
node jstack/bin/jstack.mjs doctor --project-root . --with-mcp
```

The merge preserves unrelated servers and host-specific fields. Authentication and OAuth remain host-owned. Restart the host after adding new agents, skills, or MCP servers if discovery is cached.

## Safety

- Correct installer-owned entries are idempotent and broken expected links are repaired.
- Unowned files, links, and same-name host config entries are conflicts.
- `--force` moves conflicts to `.agents/.jstack-backups/<timestamp>/` before replacement.
- `.agents/.jstack-install.json` records installer ownership and the source revision.
- Project links are relative, so a Muse worktree resolves through its pinned `./jstack` submodule.

## Inventory

The active roles are `explorer`, `oracle`, `planner`, `worker`, `reviewer`, `thermo-review`, and `thermo-quality`. The complete skill list lives in `manifest.json`; workflow and spawn mappings live in [host conventions](references/host-conventions.md).

Skills use soft model defaults only. Always honor explicit user model overrides.

## Verification

```bash
npm test
node bin/jstack.mjs doctor --project-root /path/to/project
```

For a host smoke test, start a fresh session, enumerate a shared skill, invoke each installed role, and confirm MCP is absent unless `--with-mcp` was used. OpenCode configuration can be inspected with `opencode debug config`.

## Updating

Pull the canonical checkout or advance the project submodule, then rerun `install`. The command reconciles new and stale installer-owned inventory without touching unrelated user files.
