# Graphite stack scaffold

Optional third deliverable. Only run after user approval (gate 3).

## Prerequisites

- Plan doc committed on `dev` (or will land in P0 PR)
- Linear sub-issues exist (for MUSE-XXX IDs and branch names)
- `gt` available; trunk is `dev`

## Workflow

### 1. Fetch trunk (do not modify `dev`)

```bash
git fetch origin dev
gt init --trunk dev --no-interactive
```

Do **not** `git checkout dev`, commit on `dev`, or run `gt sync` on `dev` — see `AGENTS.md` (`dev` safety).

### 2. Create stack bottom-up

For each phase P0, P1, …, Pn (including follow-on placeholders if requested):

```bash
gt create <gitBranchName from Linear>
```

Use the branch name Linear attached to each sub-issue (e.g. `jake/muse-614-audio-tracks-p0-track-kind-data-contract`). Do **not** invent branch names.

### 3. Placeholder commits

Each phase branch needs a minimal commit so PRs can open. Keep diffs tiny — implementation replaces these later.

**P0** (often includes plan doc):

- Add or update `work/planning/<FEATURE>.md` if not already on `dev`
- Optional: `work/planning/<FEATURE>.stack.md` with phase→branch map (delete when P0 implementation starts)
- Commit message: `docs(<area>): harden <feature> plan of record; scaffold P0 (MUSE-XXX)`

**P1–Pn** (placeholder only):

- Add a single marker file, e.g. `work/scaffolds/MUSE-XXX.stack-placeholder` containing:
  ```text
  Stack scaffold for <Feature> P{n} (MUSE-XXX).
  Replace with phase implementation. Do not merge as-is.
  Plan: work/planning/<FEATURE>.md
  ```
- Commit message: `chore(<area>): stack scaffold placeholder for P{n} (MUSE-XXX)`

### 4. Submit stack

```bash
gt submit --stack --no-edit
```

Set each PR to **draft**. Titles:

| Phase | PR title pattern |
|-------|------------------|
| P0 | `docs(<area>): harden <feature> plan of record; scaffold P0 (MUSE-XXX)` |
| P1–Pn | `chore(<area>): stack scaffold placeholder for P{n} (MUSE-XXX)` |

PR bodies: link plan doc, sub-issue, parent epic. Note "scaffold only — not for merge."

### 5. Verify

```bash
gt log --stack --reverse
```

Expected: P0 → `dev`, P1 → P0 branch, …, tip = last phase (or follow-on placeholder).

Confirm on GitHub: each PR base is the previous phase branch, all drafts.

### 6. Comment on epic

Add Linear comment listing PR numbers and branch names for orchestrator handoff.

---

## Repair (if stack breaks)

Prefer the dedicated skill: [heal-gt-stack](../heal-gt-stack/SKILL.md). Summary:

1. `git fetch origin dev` and each stack branch from `origin`
2. `gt init --trunk dev --no-interactive` if trunk metadata is wrong
3. `gt track -p <parent>` bottom-up (P0→`dev`, P1→P0, …)
4. **Do not** `gt sync` on `dev`, `gt track --force` from the tip, or push/reset `dev`
5. `gt log --stack --reverse` then `gt submit --stack --no-edit` (or [ship-stack](../ship-stack/SKILL.md))

---

## What orchestrator does later

Implementation agent renames PRs from scaffold titles, removes placeholder files, and implements real work — see [orchestrate-phased-feature](../orchestrate-phased-feature/SKILL.md).
