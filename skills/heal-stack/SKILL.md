---
name: heal-stack
description: >-
  Repair a broken or incomplete GitHub stack so all phase PRs daisy-chain onto
  dev (P0→dev, Pn→P(n−1)). Use when PRs are orphaned, missing from gh stack view,
  bases point at the wrong parent, or the GitHub stack does not show up as one
  unit.
disable-model-invocation: true
---

# Heal Stack

Realign phase branches and GitHub stack metadata so the full stack appears as one daisy-chain on `dev`. Then optionally hand off to [ship-stack](../ship-stack/SKILL.md) to submit.

**Symptoms this fixes:**

- A PR (e.g. mid-phase) does not appear in the GitHub stack
- PR base is `dev` when it should be the previous phase branch (or the reverse for P0)
- Parallel branches were created instead of a linear stack
- `gh stack view --json` disagrees with GitHub PR bases
- Existing PR branches have correct ancestry but no GitHub stack object

## Hard rules

- **GitHub Stacks only.** Repair stacks with `gh stack` plus ordinary `git`/`gh` inspection. Do not use Graphite or `gt` commands.
- Require `gh` + `gh stack` (`gh extension install github/gh-stack` if missing).
- **Trunk is `dev`.** Fetch only — never commit on, push, or reset `dev`. `gh stack sync` may fast-forward local `dev` to `origin/dev`; that is OK.
- **Bottom-up only.** Fix Git ancestry from P0 → tip, then rebuild stack metadata. Never reorder from the tip alone hoping parents fix themselves.
- **Do not invent branch names.** Use existing phase branches / Linear `gitBranchName`.
- **Do not merge.**
- **Never run `gh stack modify`** (TUI-only). Restructure with `unstack` then `init`, or `gh stack link`.
- Always pass non-interactive flags. Never run `gh stack switch` or bare `submit` / `view` / `init` / `add` / `checkout`.
- After heal, verify with `gh stack view --json` **and** GitHub bases before claiming success.
- If the repo has more than one remote, pass `--remote origin` on `rebase`, `submit`, `sync`, `push`, and `link`.

## Workflow

### 1. Inventory intended stack

Collect the ordered phase list from the user, Linear epic, plan of record, or PR titles (`P0`…`Pn`, MUSE-XXX). For each phase record:

- branch name
- PR number (if any)
- current GitHub base (`gh pr view <n> --json baseRefName,headRefName,title`)

Expected end state:

| Phase | Parent |
|-------|--------|
| P0 | `dev` |
| P1 | P0 branch |
| Pn | P(n−1) branch |

### 2. Fetch

```bash
git fetch origin dev
# fetch each stack branch from origin as needed
```

### 3. Repair Git ancestry if needed

If history diverged (parallel bases), rebase each phase onto its correct parent **before** rebuilding stack metadata — keep the intended commit set; do not squash across phases unless the user asks.

Then tear down broken local/remote grouping and rebuild. `init` adopts existing branches:

```bash
gh stack unstack --local    # keeps the GitHub grouping; drop --local to unstack on GitHub too
gh stack init --base dev <p0-branch> <p1-branch> … <pn-branch>
```

If PRs already exist but are not stacked (or bases are wrong) and Git ancestry is already correct, link them without rewriting local tracking:

```bash
gh stack link --base dev --remote origin <p0-branch> <p1-branch> … <pn-branch>
gh stack checkout <p0-or-tip-pr-number>
```

`checkout` by branch name only sees locally tracked stacks. After `link`, use a PR or stack number so GitHub tracking is pulled down.

`link` arguments are bottom-to-top. It corrects PR base branches automatically.

### 4. Rebase + submit

```bash
gh stack checkout <stack-tip>
gh stack rebase --remote origin
gh stack view --json
gh stack submit --auto --remote origin
```

### 5. Verify (both views)

1. `gh stack view --json` — full P0…Pn chain, P0 → `dev`
2. GitHub — each PR `baseRefName` matches the parent branch (not a sibling, not wrong trunk)
3. The GitHub stack includes every intended PR (no orphans)

If a PR still sits alone, re-check its base and rebuild from that phase upward (`unstack` → `init` / `link`).

### 6. Report

List before → after for each PR (old base → new base), and note any conflict resolutions. Suggest `/ship-stack` only if submit was skipped or needs a clean re-run.

## Forbidden

- Committing on, pushing, or resetting `dev`
- `gh stack modify` (no non-interactive path)
- Creating a second parallel stack “to replace” the broken one without user approval
- `gh stack merge`

## Related

- Scaffold new stacks: [github-stack-scaffold.md](../plan-epic/github-stack-scaffold.md)
- Healthy publish: [ship-stack](../ship-stack/SKILL.md)
- Single-branch commit: [ship](../ship/SKILL.md)
