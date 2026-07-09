---
name: heal-stack
description: >-
  Repair a broken or incomplete Graphite stack so all phase PRs daisy-chain onto
  dev (P0→dev, Pn→P(n−1)). Use when PRs are orphaned, missing from gt log,
  bases point at the wrong parent, or the stack does not show up as one unit.
  Also matches heal-gt-stack.
disable-model-invocation: true
---

# Heal Stack

Realign phase branches and Graphite metadata so the full stack appears as one daisy-chain on `dev`. Then optionally hand off to [ship-stack](../ship-stack/SKILL.md) to submit.

**Symptoms this fixes:**

- A PR (e.g. mid-phase) does not appear in the pasteable / full Graphite stack
- PR base is `dev` when it should be the previous phase branch (or the reverse for P0)
- Parallel branches were created instead of a linear stack
- `gt log --stack` disagrees with GitHub PR bases

## Hard rules

- **Trunk is `dev`.** Fetch only — never commit on, push, reset, or `gt sync` `dev`.
- **Bottom-up only.** Re-track / rebase from P0 → tip. Never `gt track --force` from the tip alone hoping parents fix themselves.
- **Do not invent branch names.** Use existing phase branches / Linear `gitBranchName`.
- **Do not merge.**
- After heal, verify with `gt log --stack --reverse` **and** GitHub bases before claiming success.

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
gt init --trunk dev --no-interactive
```

### 3. Re-track bottom-up

For each phase in order:

```bash
gt checkout <phase-branch>
gt track -p <parent>    # P0: parent = dev; else previous phase branch
```

If history diverged (parallel bases), rebase the phase onto its correct parent **before** or as part of restack — keep the intended commit set; do not squash across phases unless the user asks.

### 4. Restack + submit

```bash
gt checkout <stack-tip>
gt restack
gt log --stack --reverse
gt submit --stack --no-edit
```

Add `--force` only when required after rewriting stack links and the user expects remote update.

### 5. Verify (both views)

1. `gt log --stack --reverse` — full P0…Pn chain, P0 → `dev`
2. GitHub — each PR `baseRefName` matches the parent branch (not a sibling, not wrong trunk)
3. Pasteable Graphite stack includes every intended PR (no orphans)

If a PR still sits alone, re-check its base and `gt track -p` for that branch; repeat from that phase upward.

### 6. Report

List before → after for each PR (old base → new base), and note any conflict resolutions. Suggest `/ship-stack` only if submit was skipped or needs a clean re-run.

## Forbidden

- `gt sync` on `dev`
- `gt track --force` from tip without bottom-up parents
- Pushing or resetting `dev`
- Creating a second parallel stack “to replace” the broken one without user approval

## Related

- Scaffold new stacks: [graphite-scaffold.md](../plan-epic/graphite-scaffold.md)
- Healthy publish: [ship-stack](../ship-stack/SKILL.md)
- Single-branch commit: [ship](../ship/SKILL.md)
