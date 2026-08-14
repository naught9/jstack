---
name: ship-stack
description: >-
  Publish or update a GitHub stacked PR: rebase onto trunk, submit the stack,
  verify daisy-chain bases. Does not merge. Use for ship-stack, submit stack,
  gh stack submit, Graphite stack publish, or landing a phased feature stack
  after implementation.
disable-model-invocation: true
---

# Ship Stack

Publish/update a GitHub daisy-chained PR stack. Rebase + submit only — **never merge** (merge stays a separate user request; do not run `gh stack merge`).

**Pair with:** [heal-stack](../heal-stack/SKILL.md) if PRs are missing from the stack or bases are wrong; [ship](../ship/SKILL.md) for single-branch commit/push; [build-epic](../build-epic/SKILL.md) for phase implementation.

## Hard rules

- Require `gh` + `gh stack` (`gh extension install github/gh-stack` if missing).
- **Trunk is `dev`** (muse-monorepo). Pass `--base dev` on `init` / `link` when creating or repairing a stack.
- **Do not** commit on `dev`, push/reset `dev`. Fetch only: `git fetch origin dev`. `gh stack sync` may fast-forward local `dev` to `origin/dev`; that is OK. Never rewrite trunk.
- **Do not merge** unless the user explicitly asks in a separate request (out of scope for this skill).
- Prefer **existing** stack branches — do not create parallel branches while shipping.
- Always pass non-interactive flags. Never run TUI commands: `gh stack modify`, `gh stack switch`, or bare `gh stack submit` / `view` / `init` / `add` / `checkout`.
- If the stack is broken or a PR is orphaned (not in `gh stack view --json`), stop and run / hand off to [heal-stack](../heal-stack/SKILL.md) first.
- If the repo has more than one remote, pass `--remote origin` on `rebase`, `submit`, `sync`, `push`, and `link`.

## When to use

Healthy stacks that already look like:

```
P0 → dev
P1 → P0
…
Pn → P(n−1)
```

Example shape: automation lanes #171–#177 (P0–P6) as one GitHub stack.

## Workflow

### 1. Resolve stack tip

From user prompt, PR number, or current branch. Check out the **tip** of the intended stack (highest phase / top PR):

```bash
gh stack checkout <branch-or-pr-number>
```

### 2. Fetch + inspect

```bash
git fetch origin dev
gh stack view --json
```

Confirm: P0 parent = `dev`, each Pn parent = P(n−1) branch. Spot-check GitHub PR bases if needed (`gh pr view <n> --json baseRefName,headRefName,title,isDraft`).

If any PR is missing from the stack, bases point at `dev` incorrectly (except P0), or local stack metadata disagrees with GitHub → **heal-stack**, then return here.

### 3. Rebase

From the stack (not from `dev`):

```bash
gh stack rebase --remote origin
```

Resolve conflicts if they appear (`git add` then `gh stack rebase --continue`; or `gh stack rebase --abort` to restore). Do not skip rebase when trunk or parents moved.

### 4. Submit

```bash
gh stack submit --auto --remote origin
```

`--auto` skips the editor and opens **draft** PRs for any new branches. Existing PRs are updated in place. After submit, set titles/bodies with `gh pr edit` when the auto-generated text is wrong.

### 5. Verify

```bash
gh stack view --json
```

Report: PR numbers, branch names, parent chain, draft vs ready. Stack URLs if useful.

## Out of scope

- Bottom-up merge / merge queue (`gh stack merge`)
- Creating scaffold placeholders → [plan-epic](../plan-epic/SKILL.md) / [github-stack-scaffold.md](../plan-epic/github-stack-scaffold.md)
- Single-branch commit without a stack → [ship](../ship/SKILL.md)
- Repairing broken stacks → [heal-stack](../heal-stack/SKILL.md)
