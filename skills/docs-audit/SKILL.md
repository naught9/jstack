---
name: docs-audit
description: Audit internal engineering docs in docs/internal/ for accuracy, coverage, and writing quality against the current codebase. Use when docs/internal/ may be stale, after significant feature work, or when the user asks for an internal docs audit, engineering docs review, or documentation freshness check. Not for work-log or Linear/GitHub reconciliation — use docs-linear-github-audit for that.
disable-model-invocation: true
---

# Docs Audit

Produce a read-only audit of `docs/internal/` against the current codebase. Find stale or missing content, flag undocumented areas worth covering, and apply clear technical writing. Do not rewrite docs in the audit pass — present findings and proposed edits for user approval first.

This skill covers **engineering documentation content**. It does not reconcile `work/` logs, Linear issues, or branch state. Use [docs-linear-github-audit](../docs-linear-github-audit/SKILL.md) for that.

## Writing standard

Follow the [technical-writing](../technical-writing/SKILL.md) standard. Core rules for this audit:

- **Cut words that do no work.** "In order to" → "to". Delete hedges like "it is important to note that".
- **Use short, everyday words.** "Use", not "utilize". "Do", not "perform".
- **Name real symbols.** Write the actual file, function, flag, or command — not a synonym or metaphor.
- **One document, one mode.** Tutorial, how-to, reference, or explanation. Do not mix modes in one file.
- **Talk to the reader.** Second person, present tense, active voice. Instructions are commands.
- **The codebase is the word list.** Paths, counts, and behavior claims must match the code at the audited commit.

Flag writing issues as findings even when the underlying facts are correct.

## Required workflow

### 1. Scope the docs corpus

- Enumerate `docs/internal/` with `rg --files`, excluding `node_modules`.
- Read any index, README, or manifest that lists internal docs (for example `docs/internal/README.md`, `docs/README.md`, or repository `AGENTS.md` / `CLAUDE.md`).
- Note each file's stated purpose, last-updated metadata, and cross-links.
- Record the target branch and current commit. Call out a dirty worktree; do not fold unrelated changes into the audit.

### 2. Start from recent change, not a full linear read

Do **not** read every internal doc end-to-end before looking at the codebase. Use recent change as a guide:

1. **Merged PRs** — `gh pr list --state merged --limit 30` (or `git log --oneline -30` on the target branch). Read titles and bodies for features, refactors, API changes, and removed behavior.
2. **Recent commits** — `git log --since="90 days ago" --name-only` on the target branch. Group changed paths by subsystem.
3. **Open PRs** — skim in-flight work that may land soon and affect docs.

Build a **change map**: subsystems touched recently, new or removed modules, renamed paths, behavior changes, and config or CLI changes. This map drives which docs to inspect first.

### 3. Targeted accuracy review

For each doc in the change map's blast radius (and any doc whose metadata or links look stale):

1. Identify the authoritative code paths the doc describes.
2. Spot-check those paths in the current tree — signatures, defaults, error behavior, env vars, feature flags, and file locations.
3. Classify each finding:
   - **Stale fact** — doc contradicts current code.
   - **Missing update** — recent change is not reflected.
   - **Orphan doc** — describes removed or renamed behavior with no replacement.
   - **Broken link** — internal or repo link no longer resolves.
   - **Wrong mode** — tutorial mixed into reference, etc.
   - **Writing** — correct facts, unclear or bloated prose.

Prefer evidence: cite `file:line` for code and quote the outdated doc passage. Do not guess.

### 4. Coverage review (undocumented areas)

After the targeted pass, look for **significant code with no internal doc**:

- Entry points: CLIs, HTTP routes, background jobs, public SDK surfaces.
- Cross-cutting systems: auth, caching, migrations, deployment, observability.
- Non-obvious invariants, failure modes, or extension points a new engineer would need.

Use heuristics, not exhaustive search:

- Compare top-level package or service directories against `docs/internal/` topics.
- Check README files at subsystem roots — if the only doc lives in code comments, note it.
- Weight **recently changed** and **high-churn** areas higher than stable utilities.

For each gap, state **what** is undocumented, **why it matters** (onboarding, operations, agent context), and **suggested doc** (new file vs section in an existing doc). Do not create docs in the audit pass.

### 5. Prioritize findings

| Priority | Meaning |
|----------|---------|
| **P0** | Doc asserts wrong behavior that could cause bad deploys, data loss, or security mistakes |
| **P1** | Doc is materially out of date with merged code; readers will follow wrong steps |
| **P2** | Missing coverage for an important subsystem or recent feature |
| **P3** | Writing clarity, structure, or link hygiene |

### 6. Report and stop

Deliver the audit report using the template below. Ask the user which findings to fix, which new docs to add, and whether to run an implementation pass. Do not edit `docs/internal/` until approved.

## Audit report template

```markdown
# Internal docs audit

**Branch:** <branch> @ <short sha>
**Audited:** <date>
**Scope:** docs/internal/ (<N> files)

## Summary

<2–4 sentences: overall health, biggest risks, recommended next actions>

## Recent change map

| Area | Evidence (PR / commit) | Docs touched |
|------|------------------------|--------------|
| … | … | … |

## Findings

### P0 — Incorrect or dangerous

- **[doc/path.md](doc/path.md)** — <issue>. Code: `path:line`. Proposed fix: <one line>.

### P1 — Stale or missing updates

- …

### P2 — Undocumented areas

| Area | Code paths | Why document | Suggested home |
|------|------------|--------------|----------------|
| … | … | … | `docs/internal/…` |

### P3 — Writing and structure

- **[doc/path.md](doc/path.md)** — <issue>. Example rewrite: <short before/after if helpful>.

## Docs not reviewed

<List files outside the change map that were not spot-checked, so the user knows coverage limits>

## Proposed implementation (pending approval)

- [ ] <concrete edit or new doc>
- [ ] …
```

## Implementation after approval

Only after explicit approval:

1. Create a feature branch from the repository's integration branch (for Muse repos, branch from `origin/dev`; never commit directly to `dev`).
2. Apply only approved edits. Prefer the smallest change that makes the doc true.
3. When adding docs, pick one Diátaxis mode and match existing `docs/internal/` structure and tone.
4. Verify links, symbol names, and any commands or counts cited in changed docs.
5. Commit intentionally. Push and open a PR if the user asked for publication. Do not merge unless asked.

## Relationship to other skills

| Need | Skill |
|------|-------|
| Reconcile `work/` logs with Linear/GitHub state | [docs-linear-github-audit](../docs-linear-github-audit/SKILL.md) |
| Add docstrings or API comments to code | [docs](../docs/SKILL.md) |
| Deep prose/style pass on a specific doc | [technical-writing](../technical-writing/SKILL.md) |

## Anti-patterns

- Reading every `docs/internal/` file sequentially before checking recent PRs.
- Marking docs stale from PR titles alone without verifying code.
- Proposing large rewrites when a one-paragraph fix would do.
- Duplicating content that belongs in reference into tutorials.
- Creating new top-level docs when an existing file should gain a section.
- Treating missing docs as P0 unless the gap blocks safe operation.
