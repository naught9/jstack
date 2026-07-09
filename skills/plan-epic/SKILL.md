---
name: plan-phased-feature
description: >-
  Plan large phased features interactively: clarify scope with structured
  questions, write the plan of record in work/planning, create a Linear epic
  with sub-issues, and optionally scaffold a Graphite PR stack. Use when
  starting a new epic, hardening a planning doc, creating phased Linear issues,
  scaffolding a PR stack, or when the user mentions plan of record, MUSE-XXX
  planning, or phased rollout.
disable-model-invocation: true
---

# Plan Phased Feature

Interactive planning workflow for large features. Produce three artifacts (when requested):

1. **Plan of record** — `work/planning/<FEATURE>.md`
2. **Linear** — parent epic + one sub-issue per phase
3. **Graphite stack** (optional) — daisy-chained draft PRs with scaffold placeholders

**When to use [plan](../plan/SKILL.md) instead:** daily / single-task planning without Linear, Graphite, or a multi-phase plan of record.

**Pair with:** [orchestrate-phased-feature](../orchestrate-phased-feature/SKILL.md) for implementation; [orchestrate-phased-review](../orchestrate-phased-review/SKILL.md) for epic review grinding after the stack lands; [ship-stack](../ship-stack/SKILL.md) / [heal-gt-stack](../heal-gt-stack/SKILL.md) to publish or repair the Graphite stack.

Host question-tool details: [host-conventions.md](../../references/host-conventions.md).

## Hard rules

- **Ask before finalize.** Use the host's structured question tool (or clear chat options) to resolve ambiguity before writing the final plan doc **or** creating Linear issues. Do not skip clarification rounds when open questions remain.
- **Two approval gates.** (1) Plan doc draft → user approves → commit. (2) Linear issue set → user approves → create. Graphite scaffold is a third optional gate.
- **Do not implement.** Planning only — no feature code, migrations, or phase implementation.
- **Plan is source of truth.** Linear epic/sub-issues summarize and link to the doc; detailed scope lives in `work/planning/`.
- **One branch + one PR per phase** on `dev` when scaffolding (P0 base = `dev`, Pn base = P(n−1)).

## Workflow overview

```
1. Intake          → read context, inventory codebase if needed
2. Clarify         → resolve open questions (may repeat)
3. Draft plan      → work/planning/<FEATURE>.md
4. Approve plan    → structured question or explicit user OK
5. Linear          → epic + sub-issues (after approval)
6. Scaffold?       → ask; if yes, Graphite stack
7. Cross-link      → epic ↔ doc ↔ PRs; handoff summary
```

Track progress with the checklist in [plan-template.md](plan-template.md#planning-checklist).

---

## 1. Intake

Gather starting context from the user and repo:

| Source | Look for |
|--------|----------|
| User request | goal, constraints, quality bar, timeline |
| Existing docs | `work/planning/`, `docs/internal/`, ADRs, related Linear issues |
| Codebase | current state inventory (what exists vs missing) |
| Dependencies | upstream work landed, in review, or blocking |

Read related planning docs and architecture references before asking questions — come prepared, not blank-slate.

---

## 2. Clarify

Ask the user for decisions they must make. Prefer the host structured question tool; otherwise ask in chat with clear options. **Batch related questions** (2–5 per round); run multiple rounds if needed.

### Round A — Scope & shape (before drafting)

Ask about anything unresolved:

- Feature goal in one sentence vs explicit non-goals
- v1 quality bar (e.g. sample-accurate, export parity, golden tests)
- Phase count and rough deliverables per phase
- Follow-on phases to **plan but not implement** (e.g. P6 recording)
- Gates: which phases block on upstream merges?
- Desktop-only vs web; agent tools in scope?
- Open product/technical choices that affect architecture

### Round B — Plan doc (before commit)

After drafting, if anything material is still ambiguous, ask again. Otherwise present a short summary and ask:

- Approve plan doc as-is / request edits / defer Linear

### Round C — Linear (before creating issues)

Confirm:

- Epic title and Linear project
- Priority and estimates per phase (or "no estimates")
- Assignee
- Sub-issue naming pattern (e.g. `Feature P0 — Short label`)

### Round D — Graphite (optional)

Ask whether to scaffold the PR stack now. If yes:

- Include follow-on placeholder PRs at stack tip? (e.g. P6)
- P0 PR carries plan doc hardening, or plan lands separately first?

**When NOT to use structured questions:** trivial style preferences you can infer from repo conventions.

---

## 3. Draft plan doc

Write `work/planning/<FEATURE>.md` using [plan-template.md](plan-template.md).

Conventions from existing plans (`AUDIO_TRACKS.md`, `NATIVE_AUDIO_HOST_EVENT_LANES.md`):

- YAML-style header block: Status, Last verified, Author, Scope, Depends on, Related
- Numbered sections: problem → current state → target model/architecture → phases → open questions → risks → testing → key files
- Phase table with deliverable + success criteria per phase
- Resolve open questions during clarification; move decided items out of "open" into the spec body
- Status starts `proposed`; after user approval and hardening pass, set to `plan of record` with date

**Do not commit** until gate 1 approval.

---

## 4. Linear epic + sub-issues

After plan approval, create issues via Linear MCP (`save_issue`). Templates: [linear-templates.md](linear-templates.md).

### Parent epic

- Title: concise feature name
- Description: goal, quality bar, architecture anchors, phase table (sub-issue links added after creation), depends on, non-goals, link to plan doc on GitHub (`main` path)
- Project, priority, assignee per user answers
- Attach or link plan doc

### Sub-issues (one per phase)

- `parentId` = epic identifier
- Title: `{Feature} P{n} — {short label}`
- Description: `## Scope` bullets from plan §6, link to plan sections, acceptance criteria, gates if any
- Estimate from user input or plan complexity
- `blockedBy` when a phase gates on upstream work

After creation, update epic description with sub-issue links (`<issue id="..." href="...">MUSE-XXX</issue>` format).

**Do not create issues** until gate 2 approval.

---

## 5. Graphite stack scaffold (optional)

After user opts in, follow [graphite-scaffold.md](graphite-scaffold.md).

Summary:

```bash
git fetch origin dev
gt init --trunk dev --no-interactive
# bottom-up: P0, P1, …, Pn (never commit on or gt sync dev)
gt create <linear-suggested-branch>   # per phase
# minimal placeholder commit per phase (except P0 may include plan doc)
gt submit --stack --no-edit
```

PR conventions:

- **P0:** `docs(<area>): harden <feature> plan of record; scaffold P0 (MUSE-XXX)` — may include the approved plan doc changes
- **P1–Pn:** `chore(<area>): stack scaffold placeholder for P{n} (MUSE-XXX)` — draft PR, minimal diff (~placeholder marker only)
- Follow-on phases (out of v1 scope): scaffold at stack tip but mark **do not implement** in epic

Verify: `gt log --stack --reverse` shows P0→`dev`, P1→P0, …

---

## 6. Cross-link & handoff

When done, report:

| Artifact | Link |
|----------|------|
| Plan doc | `work/planning/<FEATURE>.md` path |
| Epic | Linear URL |
| Sub-issues | P0…Pn identifiers |
| Stack | PR numbers + branch names (if scaffolded) |

Suggest next step: launch orchestrator with `orchestrate-phased-feature` skill.

---

## Examples

See [examples.md](examples.md) for MUSE-537 (Audio Tracks).
