---
name: cleanup-branches
description: >-
  Audit local and remote branches for stale/merged work, present categorized
  findings (safe to delete, active, needs review), and delete only after
  explicit user approval. Use for cleanup-branches, branch audit, prune merged
  branches, or cleaning dead local/remote branches.
disable-model-invocation: true
---

# Cleanup Branches

Full local + remote branch audit, then gated cleanup. **Never delete until the user approves** a concrete list (or phased plan).

Modeled on real muse audits (e.g. post-merge stack cleanup): fetch/prune → cross-ref `gh` PR state (squash-aware) → categorize → wait → delete only what was approved.

Host question-tool details: [host-conventions.md](../../references/host-conventions.md).

## Hard rules

- **Standard Git/GitHub workflow.** Use ordinary `git` and `gh` for branch auditing and cleanup. Do not invoke Graphite or `gt`; any `graphite-base/*` names are legacy branches to classify only.
- **Audit first, delete second.** Present findings and wait. Do not delete in the same turn as the first audit unless the user already approved a named list.
- **Never delete trunk:** `main`, `master`, `dev`, or the repo default branch. Never delete the currently checked-out branch — switch to trunk first.
- **Never force-push or rewrite trunk** as part of cleanup (pushing trunk only if the user separately asks, e.g. after a salvage cherry-pick).
- **Squash-aware:** a branch tip may not be an ancestor of trunk after squash merge. Treat **merged PR** (`gh` state `MERGED`) as safe-to-delete even when `git merge-base --is-ancestor` fails.
- **Stack-landed CLOSED:** a PR may be `CLOSED` (not MERGED) yet its tip commits/subjects already landed via a parent stack merge — still **safe to delete** if you verify the work is on trunk. Call this out explicitly in the report.
- **Closed ≠ disposable.** If PR is `CLOSED` and unique commits/files are **not** on trunk, put it in **Closed — work not in trunk** (salvage vs drop). Do not auto-delete.
- **Open PRs stay.** Branches with open PRs are **keep** unless the user explicitly wants those PRs closed first.
- Prefer deleting **remote then local**, then `git fetch --prune`.

## Trunk

Detect the integration trunk:

1. If `dev` exists locally or on `origin`, use `dev` (muse-monorepo).
2. Else use the repo default branch (`gh repo view --json defaultBranchRef` or `origin/HEAD`).

Fetch before classifying:

```bash
git fetch --prune origin
```

Note branches that disappear during prune under **Already gone from remote** (context only — nothing to delete).

## Workflow

### 1. Inventory

Gather in parallel where possible:

- Current branch: `git branch --show-current`
- Locals: `git branch -vv` and `git for-each-ref --sort=-committerdate refs/heads/`
- Remotes: `git branch -r` (exclude `origin/HEAD`)
- Open + recent merged/closed PRs via `gh`:

```bash
gh pr list --state open --limit 200 --json number,title,headRefName,baseRefName,isDraft,updatedAt
gh pr list --state merged --limit 200 --json number,title,headRefName,mergedAt
gh pr list --state closed --limit 100 --json number,title,headRefName,closedAt,mergedAt
```

For closed/merged candidates that look squash-ambiguous, spot-check whether tip subjects or unique paths exist on trunk (`git log <trunk> --grep=…`, `git cat-file -e <trunk>:<path>`).

Optional: `gh api repos/{owner}/{repo} --jq '.delete_branch_on_merge'` (note if auto-delete is off — explains lingering remotes).

Optional hygiene: `git stash list`; whether local `main`/`dev` diverge from `origin/*`.

### 2. Classify each feature branch

Skip trunk names. For each local and remote feature branch, assign **one** primary bucket:

| Bucket | Criteria |
|--------|----------|
| **Active — keep** | Open PR (include last activity / draft flag), or clearly part of an in-flight GitHub stack / named WIP |
| **Safe to delete** | PR `MERGED` and branch still present; **or** tip is ancestor of trunk; **or** `CLOSED` but tip/work verified on trunk (stack-landed); **or** upstream gone (`: gone]`) and work is on trunk |
| **Already gone from remote** | Expected after fetch prune (merged/closed stack parents already deleted) — informational |
| **Leftover Graphite scaffolding** | `graphite-base/*` (and similar) with no open PR — leftover from the old Graphite workflow; usually safe after the related stack has merged; list separately for approval |
| **Closed — work not in trunk** | PR `CLOSED` (or abandoned) and unique commits/files **missing** from trunk — salvage (cherry-pick / reopen PR) vs drop |
| **Stale / wrong base** | Open PR targeting the wrong trunk (e.g. `main` when integration trunk is `dev`), or clearly abandoned draft — needs user call |
| **No PR / unclear** | No PR association — do not auto-mark safe; ask |

Also note **Other local housekeeping** (informational, not auto-delete):

- Local trunk ahead/behind `origin` (e.g. `main` 1 commit ahead)
- Expected long `dev`↔`main` divergence
- Stashes from older work
- Diverged locals on active branches (reset to remote only if user asks)

### 3. Present findings

Use this shape (adapt counts; tables fine in chat):

```markdown
## Branch audit — <repo> (trunk: <trunk>)

### Snapshot
| Category | Count |
|----------|-------|
| Safe to delete | N local + N remote |
| Already gone from remote | N |
| Closed — work not in trunk | N |
| Open PRs — keep | N |
| Stale / wrong base | N |
| Leftover Graphite scaffolding | N |
| delete_branch_on_merge | on/off/unknown |

### Safe to delete
| Branch | PR | Status | Local / remote |
|--------|-----|--------|----------------|
| … | #N | MERGED / CLOSED (tip on trunk) / ancestor | both |

Note squash/stack caveats when ancestry checks disagree with PR state.

Ready-to-run (do not execute yet):

git checkout <trunk>
git branch -D …
git push origin --delete …

### Already gone from remote
- <branch> — merged/closed #N (pruned)

### Closed — work not in trunk — decide before deleting
| Branch | PR | What's missing on trunk | Options |
|--------|-----|-------------------------|---------|
| … | #N CLOSED | path / commits | cherry-pick / reopen small PR / delete |

### Active — keep
| Branch | PR | Last activity |
|--------|-----|---------------|
| … | #N | date |

### Stale / wrong base
| Branch | PR | Issue |
|--------|-----|-------|
| … | #N OPEN | targets main not dev; stale since … |

### Leftover Graphite scaffolding
- graphite-base/…

### Other local housekeeping
- …

### Ask
Want me to run the safe-delete commands (local + remote), handle salvage first
(cherry-pick / reopen), or both in a stated order?
```

Include ready-to-run command blocks for the **safe** sets, but **do not execute** until approved.

### 4. Approval gate

Ask (structured question tool when available), e.g.:

- Delete all **Safe to delete** (remote + local)?
- Also delete listed leftover **graphite-base/*** branches?
- For each **Closed — work not in trunk**: salvage then delete, or drop?
- Leave **Stale / wrong base** alone for now?

Only delete branches the user explicitly includes. If they name a subset or an order (“prune safe deletes, then cherry-pick X”), honor that sequence.

### 5. Execute (after approval only)

**Deletes:**

```bash
git checkout <trunk>

# Remotes (approved list)
git push origin --delete <branch> [<branch> ...]

# Locals (approved list)
git branch -D <branch> [<branch> ...]

git fetch --prune origin
```

Use `-D` for locals when squash-merged (not ancestors). Prefer batch deletes matching the approved list.

**Salvage** (only if requested), typical pattern:

1. Inspect unique commits on the closed branch vs trunk.
2. Cherry-pick onto trunk (or open a small PR) — do **not** push trunk unless the user asks.
3. After salvage lands on trunk (local or pushed), reclassify that branch as **safe to delete** and ask before deleting the leftover remote/local.

### 6. Verify + report

Re-list locals/remotes. Report what was pruned, any salvage commits (SHA + whether trunk needs push), and what remains (active + skipped review items). Offer a follow-up for leftover **Needs review** / wrong-base items — do not close PRs unless asked.

## Out of scope

- Merging PRs or shipping stacks → [ship](../ship/SKILL.md) / [ship-stack](../ship-stack/SKILL.md)
- Repairing GitHub stack parent links → [heal-stack](../heal-stack/SKILL.md)
- Enabling `delete_branch_on_merge` unless the user asks (mention as optional prevention tip only)
