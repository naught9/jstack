---
name: update-model-pins
description: >-
  Audit and refresh hardcoded model pins across jstack: list current slugs,
  ask what to update them to, and apply the change in sync. Use for
  /update-model-pins, refresh model defaults, model slugs are stale, or
  periodic model pin maintenance.
disable-model-invocation: true
---

# Update Model Pins

jstack bodies stay host-agnostic with tier labels (`capable/fast`, `balanced-reasoning`, `high-reasoning`). Concrete provider slugs rot fast, so this skill re-syncs them periodically. You audit, the user decides, you apply everywhere.

Host question details: [host-conventions.md](../../references/host-conventions.md).

## Pin sources (audit all of these)

| Source | What to look for |
|---|---|
| `references/host-conventions.md` | Cursor Grok default, `cursor-grok-*` example slug, `model: grok-*` file pin, `composer-*` fallback, `claude-opus-*` / Opus anti-example, `GPT-*` + `max` thinking |
| `references/subagent-taxonomy.md` | `grok-*` Cursor mapping, tier table (`capable/fast`, `balanced-reasoning`, `high-reasoning`) |
| `lib/installer.mjs` | `CURSOR_SUBAGENT_MODEL`, Prime `GPT-*` thinking text |
| `skills/*/SKILL.md`, `skills/*/subagent-prompts.md`, `skills/*/examples.md` | `grok-*`, `composer-*`, `opus`, `GPT-*` mentions, soft-default tier labels |
| `README.md` | Cursor Grok / Opus summary |
| `test/jstack.test.mjs` | Assertions on Grok default, `grok-*`, `GPT-*`, `claude-opus` absence |

Search pattern to start from (adapt per repo):

```bash
rg -n "grok|opus|composer-|GPT-|claude-opus|cursor-grok" references lib skills README.md test --glob '*.md' --glob '*.mjs' --glob '*.js'
```

Also surface tier-label drift: `planner` / `reviewer` are `balanced-reasoning` in `subagent-taxonomy.md` but listed under high-reasoning in `host-conventions.md`. Flag it; do not silently re-tier.

## Workflow

1. **Audit** — run the search above, read each hit in context, and build a table: current slug/text → file:line → purpose (Cursor Task slug, Cursor file pin, fallback, anti-example, Prime thinking, example).
2. **Ask** — present the table, then ask what each pin should become via the host structured-question interface (`AskUserQuestion` on Claude Code, `AskQuestion` on Cursor, `question` on OpenCode, chat otherwise). Batch related decisions. One question per pin family (Cursor Grok slug, Cursor file pin, fallback, Prime model/thinking, Opus anti-example). Accept "keep", exact replacement slug, or "drop to tier-only". Do not guess new slugs.
3. **Apply** — after answers, update every source in sync:
   - `lib/installer.mjs` `CURSOR_SUBAGENT_MODEL` + generated Prime adapter text if renamed.
   - `references/host-conventions.md` Cursor + Prime sections.
   - `references/subagent-taxonomy.md` Cursor mapping line.
   - Each skill body / subagent-prompts / examples hit.
   - `README.md` summary if it names a slug.
   - `test/jstack.test.mjs` assertions that pin old slugs.
   - Keep tier labels (`capable/fast`, `balanced-reasoning`, `high-reasoning`) intact; only swap concrete slugs. Honor explicit user overrides principle — never hard-require a slug in portable skill bodies beyond the established Cursor/Prime host-mapping lines.
4. **Verify** — run `npm test` and `node bin/jstack.mjs doctor --project-root .`. Fix failures you introduced. Report: what changed (file list), new pins, anything kept as tier-only, residual risks.

## Hard rules

- **Do not invent slugs.** If the user says "latest Grok", ask for the exact version or confirm the discovered Task-tool slug before writing files.
- **Keep the Cursor file pin and Task slug consistent.** If they diverge intentionally (file pin `grok-4.x` vs Task slug `cursor-grok-4.x-xhigh`), state why in the final report.
- **Do not touch canonical `subagents/*.md` descriptions** to add model slugs — bodies stay host-agnostic.
- **Blocked → ask.** If a pin's purpose is unclear, stop and ask instead of deleting it.
