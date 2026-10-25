---
name: plan-epic
description: >-
  Plan large phased features interactively: clarify scope with structured
  questions, create the epic's Linear project if missing, write the plan of
  record as a Linear document in that project, create a Linear epic with
  sub-issues, and optionally scaffold a GitHub PR stack. Use when
  starting a new epic, hardening a planning doc, creating phased Linear issues,
  scaffolding a PR stack, or when the user mentions plan-epic,
  plan-phased-feature, plan of record, MUSE-XXX planning, phased rollout,
  or GitHub stacks.
  Require explicit user invocation; do not use it automatically.
disable-model-invocation: true
---

# Plan Epic

Interactive planning workflow for large features. Produce these artifacts (when requested):

## Invocation gate

Use this skill only when the user explicitly asks for `/plan-epic` or otherwise clearly requests this workflow. If it looks useful but was not requested, ask whether they would like to use `/plan-epic`, then wait for their answer.

1. **Linear project** — one per epic; reuse it if it exists, create it first if it doesn't
2. **Plan of record** — a Linear document belonging to that project (not a file in the repo)
3. **Linear issues** — parent epic + one sub-issue per phase, all in the project
4. **GitHub stack** (optional) — daisy-chained draft PRs with scaffold placeholders

**When to use [plan](../plan/SKILL.md) instead:** daily / single-task planning without Linear, GitHub stacks, or a multi-phase plan of record.

**Pair with:** [grind-epic](../grind-epic/SKILL.md) for review grinding once phases are implemented; [heal-stack](../heal-stack/SKILL.md) to repair the GitHub stack.

## Hard rules

- **GitHub Stacks only for stacked PRs.** Use `gh stack`; do not use Graphite or `gt` commands. Use ordinary `git` and `gh` for non-stack branch and PR operations.
- **Ask before finalize.** Use the host's structured question tool (or clear chat options) to resolve ambiguity before saving the final plan document **or** creating Linear issues. Do not skip clarification rounds when open questions remain.
- **Project first.** The plan document belongs to a Linear project, so resolve (find or create) the project before saving any document or issue. Never create a duplicate of an existing project.
- **Two approval gates.** (1) Plan doc draft → user approves → save to the Linear project. (2) Linear issue set → user approves → create. GitHub stack scaffold is a third optional gate.
- **Do not implement.** Planning only — no feature code, migrations, or phase implementation.
- **Plan is source of truth.** Linear epic/sub-issues summarize and link to the plan document; detailed scope lives in that Linear document, not in the repo.
- **One branch + one PR per phase** on `main` when scaffolding (P0 base = `main`, Pn base = P(n−1)).

## Workflow overview

```
1. Intake          → read context, inventory codebase if needed
2. Clarify         → resolve open questions (may repeat)
3. Project         → find the Linear project; create it if missing
4. Draft plan      → draft in chat (not saved yet)
5. Approve plan    → structured question or explicit user OK; save as Linear document
6. Linear issues   → epic + sub-issues in the project (after approval)
7. Scaffold?       → ask; if yes, GitHub stack
8. Cross-link      → project ↔ doc ↔ epic ↔ PRs; handoff summary
```

Track progress with the checklist in [plan-template.md](plan-template.md#planning-checklist).

---

## 1. Intake

Gather starting context from the user and repo:

| Source | Look for |
|--------|----------|
| User request | goal, constraints, quality bar, timeline |
| Existing docs | the epic's Linear project and its documents, `docs/internal/`, ADRs, related Linear issues |
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
- Linear project: existing project to use, or name/team/lead for a new one

### Round B — Plan doc (before saving)

After drafting, if anything material is still ambiguous, ask again. Otherwise present a short summary and ask:

- Approve plan doc as-is / request edits / defer Linear issues

### Round C — Linear (before creating issues)

Confirm:

- Epic title (the project was settled in step 3)
- Priority and estimates per phase (or "no estimates")
- Assignee
- Sub-issue naming pattern (e.g. `Feature P0 — Short label`)

### Round D — GitHub stack (optional)

Ask whether to scaffold the PR stack now. If yes:

- Include follow-on placeholder PRs at stack tip? (e.g. P6)
- P0 PR carries plan doc hardening, or plan lands separately first?

**When NOT to use structured questions:** trivial style preferences you can infer from repo conventions.

---

## 3. Linear project

Every epic has exactly one Linear project; the plan document and all issues belong to it. Resolve it **before** drafting or saving anything, using the Linear MCP.

1. `list_projects` (filter by the feature name / team) to look for an existing project. Also check with the user if a likely match exists under a different name.
2. **Found:** reuse it. `list_documents` for that project — if a plan document already exists, update it in place later instead of creating a second one.
3. **Not found:** create it first with `save_project`, using [linear-project-template.md](linear-project-template.md) for the description. Confirm name, team, lead, and target date with the user (Round A) before creating. Capture the project id and URL.

Do not create issues or documents outside the project.

---

## 4. Draft plan doc

Draft the plan using [plan-template.md](plan-template.md). Present it in chat (or in a scratch file outside tracked repo paths); it is **not** saved to Linear until gate 1 approval.

Conventions from existing plans:

- Header block: Status, Last verified, Author, Scope, Depends on, Related
- Numbered sections: problem → current state → target model/architecture → phases → open questions → risks → testing → key files
- Phase table with deliverable + success criteria per phase
- Resolve open questions during clarification; move decided items out of "open" into the spec body
- Status starts `proposed`; after user approval and hardening pass, set to `plan of record` with date

**After gate 1 approval**, save it with `save_document`: `project` = the epic's project, title `<Feature> — Plan of record`, content = the approved markdown. Later edits (hardening, status change) update the same document id rather than creating another.

**Do not save** the document until gate 1 approval.

---

## 5. Linear epic + sub-issues

After plan approval, create issues via Linear MCP (`save_issue`). Templates: [linear-templates.md](linear-templates.md).

### Parent epic

- Title: concise feature name
- Description: goal, quality bar, architecture anchors, phase table (sub-issue links added after creation), depends on, non-goals, link to the plan document in the project
- `project` = the epic's project; priority and assignee per user answers

### Sub-issues (one per phase)

- `parentId` = epic identifier; `project` = the epic's project
- Title: `{Feature} P{n} — {short label}`
- Description: `## Scope` bullets from plan §6, link to plan sections, acceptance criteria, gates if any
- Estimate from user input or plan complexity
- `blockedBy` when a phase gates on upstream work

After creation, update epic description with sub-issue links (`<issue id="..." href="...">MUSE-XXX</issue>` format).

**Do not create issues** until gate 2 approval.

---

## 6. GitHub stack scaffold (optional)

After user opts in, follow [github-stack-scaffold.md](github-stack-scaffold.md).

Summary:

```bash
git fetch origin dev
gh stack init --base main <p0-gitBranchName>
# bottom-up: P0, P1, …, Pn (never commit on or push/reset dev)
gh stack add <linear-suggested-branch>   # per later phase
# minimal placeholder commit per phase (except P0 may include plan doc)
gh stack submit --auto --remote origin
# gh pr edit each PR for scaffold titles/bodies
```

PR conventions:

- **P0–Pn:** `chore(<area>): stack scaffold placeholder for P{n} (MUSE-XXX)` — draft PR, minimal diff (~placeholder marker only)
- Follow-on phases (out of v1 scope): scaffold at stack tip but mark **do not implement** in epic

Verify: `gh stack view --json` shows P0→`main`, P1→P0, …

---

## 7. Cross-link & handoff

When done, report:

| Artifact | Link |
|----------|------|
| Project | Linear project URL (note if newly created) |
| Plan doc | Linear document URL |
| Epic | Linear URL |
| Sub-issues | P0…Pn identifiers |
| Stack | PR numbers + branch names (if scaffolded) |

Suggest next step: implement the phases (e.g. [parallelize](../parallelize/SKILL.md) per phase), then run `grind-epic` on the project.

---

## Examples

See [examples.md](examples.md) for MUSE-537 (Audio Tracks).
