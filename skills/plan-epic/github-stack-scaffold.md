# GitHub stack scaffold

Optional third deliverable. Only run after user approval (gate 3).

## Prerequisites

- Plan doc committed on `dev` (or will land in P0 PR)
- Linear sub-issues exist (for MUSE-XXX IDs and branch names)
- `gh` + `gh stack` available (`gh extension install github/gh-stack` if missing); trunk is `dev`

## Agent CLI rules

- Use `gh stack` for stacked PR operations and ordinary `git`/`gh` for standard branch and PR work. Do not use Graphite or `gt` commands.
- Always pass non-interactive flags. Never run TUI commands: `gh stack modify`, `gh stack switch`, or bare `submit` / `view` / `init` / `add` / `checkout`.
- Inspect with `gh stack view --json`. Submit with `gh stack submit --auto --remote origin`.
- After submit, set titles/bodies with `gh pr edit` (auto titles are not enough).
- Do **not** `git checkout dev`, commit on `dev`, or push/reset `dev` — see `AGENTS.md` (`dev` safety).

## Workflow

### 1. Fetch trunk (do not modify `dev`)

```bash
git fetch origin dev
```

### 2. Create stack bottom-up

For each phase P0, P1, …, Pn (including follow-on placeholders if requested), use the branch name Linear attached to each sub-issue (e.g. `jake/muse-614-audio-tracks-p0-track-kind-data-contract`). Do **not** invent branch names.

```bash
gh stack init --base dev <p0-gitBranchName>
# placeholder commit on P0 (see below)
gh stack add <p1-gitBranchName>
# placeholder commit on P1
# … repeat add + commit through Pn
```

`add` must run from the current top of the stack. If the phase branches already exist, adopt them in one shot instead:

```bash
gh stack init --base dev <p0> <p1> … <pn>
```

Then check out each branch (`gh stack checkout <branch>`) and add the placeholder commit.

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
gh stack submit --auto --remote origin
```

`--auto` opens **draft** PRs. Then set titles and bodies with `gh pr edit`:

| Phase | PR title pattern |
|-------|------------------|
| P0 | `docs(<area>): harden <feature> plan of record; scaffold P0 (MUSE-XXX)` |
| P1–Pn | `chore(<area>): stack scaffold placeholder for P{n} (MUSE-XXX)` |

PR bodies: link plan doc, sub-issue, parent epic. Note "scaffold only — not for merge."

### 5. Verify

```bash
gh stack view --json
```

Expected: P0 → `dev`, P1 → P0 branch, …, tip = last phase (or follow-on placeholder).

Confirm on GitHub: each PR base is the previous phase branch, all drafts.

### 6. Comment on epic

Add Linear comment listing PR numbers and branch names for orchestrator handoff.

---

## Repair (if stack breaks)

Prefer the dedicated skill: [heal-stack](../heal-stack/SKILL.md). Summary:

1. `git fetch origin dev` and each stack branch from `origin`
2. `gh stack unstack --local` then `gh stack init --base dev <p0> <p1> … <pn>` (or `gh stack link --base dev --remote origin …` when PRs already exist)
3. **Do not** commit/push/reset `dev`, or run `gh stack modify`
4. `gh stack rebase --remote origin` then `gh stack submit --auto --remote origin` (or [ship-stack](../ship-stack/SKILL.md))

---

## What orchestrator does later

Implementation agent renames PRs from scaffold titles, removes placeholder files, and implements real work — see [build-epic](../build-epic/SKILL.md).
