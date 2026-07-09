---
name: ship-stack
description: >-
  Publish or update a Graphite PR stack: restack onto trunk, submit the stack,
  verify daisy-chain bases. Does not merge. Use for ship-stack, submit stack,
  gt submit --stack, or landing a phased feature stack after implementation.
disable-model-invocation: true
---

# Ship Stack

Publish/update a Graphite daisy-chained PR stack. Restack + submit only — **never merge** (merge stays manual in Graphite UI).

**Pair with:** [heal-stack](../heal-stack/SKILL.md) if PRs are missing from the stack or bases are wrong; [ship](../ship/SKILL.md) for single-branch commit/push; [build-epic](../build-epic/SKILL.md) for phase implementation.

## Hard rules

- **Trunk is `dev`** (muse-monorepo). `gt init --trunk dev --no-interactive` if needed.
- **Do not** commit on `dev`, push/reset `dev`, or run `gt sync` on `dev`. Fetch only: `git fetch origin dev`.
- **Do not merge** unless the user explicitly asks in a separate request (out of scope for this skill).
- Prefer **existing** stack branches — do not create parallel branches while shipping.
- If the stack is broken or a PR is orphaned (not in `gt log --stack`), stop and run / hand off to [heal-stack](../heal-stack/SKILL.md) first.

## When to use

Healthy stacks that already look like:

```
P0 → dev
P1 → P0
…
Pn → P(n−1)
```

Example shape: automation lanes #171–#177 (P0–P6) as one Graphite stack.

## Workflow

### 1. Resolve stack tip

From user prompt, PR number, or current branch. Check out the **tip** of the intended stack (highest phase / top PR).

### 2. Fetch + trunk

```bash
git fetch origin dev
gt init --trunk dev --no-interactive
```

### 3. Inspect

```bash
gt log --stack --reverse
```

Confirm: P0 parent = `dev`, each Pn parent = P(n−1) branch. Also spot-check GitHub PR bases if needed (`gh pr view`).

If any PR is missing from the stack, bases point at `dev` incorrectly (except P0), or Graphite metadata disagrees with GitHub → **heal-stack**, then return here.

### 4. Restack

From tip (or as `gt` requires):

```bash
gt restack
```

Resolve conflicts if they appear; do not skip restack when trunk or parents moved.

### 5. Submit

```bash
gt submit --stack --no-edit
```

Use `--force` only when Graphite requires it after a linear rebase/heal and the user is aware (prefer asking once if unsure).

### 6. Verify

```bash
gt log --stack --reverse
```

Report: PR numbers, branch names, parent chain, draft vs ready. Pasteable stack links if useful.

## Out of scope

- Bottom-up merge / merge queue
- Creating scaffold placeholders → [plan-epic](../plan-epic/SKILL.md) / [graphite-scaffold.md](../plan-epic/graphite-scaffold.md)
- Single-branch commit without Graphite → [ship](../ship/SKILL.md)
- Repairing broken stacks → [heal-stack](../heal-stack/SKILL.md)
