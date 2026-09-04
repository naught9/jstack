---
name: branch-and-pr
description: >-
  Move the current unstaged work from a specified source branch onto a new
  Git branch, commit the intended changes, push the branch, and open a draft
  GitHub pull request targeting the source branch. Use when work was started
  on the wrong branch or needs to become a reviewable PR without losing the
  dirty worktree.
disable-model-invocation: true
---

# Branch and PR

Turn dirty work on a source branch into a new review branch and draft PR. The
source branch remains the PR base; do not silently retarget the PR to the
repository default branch.

## Hard rules

- **Standard Git/GitHub workflow.** Use ordinary `git` for branches and commits and `gh` for the PR. Do not use Graphite, `gt`, or `gh stack` for this non-stack workflow.
- **Only when invoked.** This skill performs branch, commit, push, and PR
  mutations. Do not run it from an implicit match.
- **Inspect before mutating.** Read the current branch, status, staged and
  unstaged diffs, remotes, and recent commits first.
- **Never lose work.** Do not switch branches with a dirty worktree. If the
  requested source branch is not checked out, stop and ask the user to check
  it out (or explicitly resolve the state first).
- **Confirm scope.** Stage only the changes belonging to the requested work.
  If unrelated changes are mixed in and cannot be identified safely, stop and
  ask which files belong.
- **Never include secrets.** Do not stage `.env` files, credentials, tokens,
  private keys, or similar sensitive material; warn and stop if the requested
  scope includes them.
- **No force push, amend, merge, reset, or skipped hooks.** Use ordinary branch
  creation, commit, and push. A user must request any materially different
  operation separately.
- **No empty commit.** If there are no relevant changes, stop without creating
  a branch or commit.
- **Draft by default.** Open a draft PR unless the user explicitly requests a
  ready-for-review PR.

## Workflow

### 1. Resolve and inspect the source branch

Interpret the request as follows:

- If the user names a source branch, that is the source branch.
- Otherwise use the currently checked-out branch.
- If the named source branch is not the current branch, do not run `git switch`
  while the worktree is dirty. Stop and ask the user to check it out first.

Run:

```bash
git status --short --branch
git diff --stat
git diff --cached --stat
git diff
git diff --cached
git branch --show-current
git remote -v
git log -5 --oneline
```

Confirm that the source branch is a valid local branch and that the worktree
contains the requested work. Include staged changes in the review: the skill
may restage the complete intended set, but must not silently absorb unrelated
files.

Check the requested or inferred branch name before creating it:

```bash
git check-ref-format --branch "agent/<slug>"
git show-ref --verify --quiet "refs/heads/agent/<slug>"
```

Choose a concise `agent/<slug>` branch name from the work. If it already
exists, choose a different name or stop for user direction; never reuse it
without explicit confirmation.

### 2. Verify GitHub access and PR target

Before mutating the repository, verify that the `origin` remote is a GitHub
remote and that the GitHub CLI is available and authenticated:

```bash
gh --version
gh auth status
gh repo view --json nameWithOwner,defaultBranchRef
```

The PR base is the source branch unless the user explicitly names another
base. A branch created from `feature-x` should therefore default to a PR
targeting `feature-x`, not `main`.

If the repository is not connected to an accessible GitHub remote or `gh` is
not authenticated, stop before creating the branch and explain the blocker.

### 3. Create the new branch without disturbing the worktree

Only after the scope and destination are clear:

```bash
git switch -c "agent/<slug>"
```

Creating the branch carries the existing staged and unstaged work with it.
Verify immediately:

```bash
git status --short --branch
```

The source branch must remain unchanged; the new branch now owns the pending
work.

### 4. Stage and commit intentionally

Stage explicit paths for a mixed worktree. Use `git add -A` only when the
inspection established that every pending change belongs to this request.
Never stage ignored or sensitive files by force.

Review the staged result:

```bash
git diff --cached --check
git diff --cached --stat
git diff --cached
```

Run the most relevant available repository checks before committing. Do not
skip hooks or tests to force the workflow through. Commit with a concise
message describing the change:

```bash
git commit -m "<imperative summary>"
```

If a hook modifies files, inspect the new diff, stage only intended hook
changes, and create a new commit as appropriate. Do not amend automatically.

### 5. Push the new branch

After the commit succeeds and the worktree is reviewed:

```bash
git push -u origin HEAD
```

Do not force-push. If the push fails because the remote branch already exists,
stop rather than overwriting it.

### 6. Open and verify the draft PR

Create a draft PR targeting the source branch:

```bash
gh pr create --draft --base "<source-branch>" --head "$(git branch --show-current)" --fill
```

If the user explicitly requested a ready PR, omit `--draft`. If `--fill`
produces an inadequate title or body, edit the title/body before creating the
PR or use a temporary Markdown file with `--body-file`.

Verify the result:

```bash
git status --short --branch
gh pr view --json number,url,isDraft,baseRefName,headRefName
```

Report the source branch, new branch, commit SHA, checks run, PR URL, PR base,
and any remaining warnings. Do not merge the PR.

## Failure handling

- If the worktree becomes conflicted or branch creation fails, stop and report
  the exact state; do not reset, stash, or discard user work automatically.
- If tests fail, report the failures and do not push unless the user explicitly
  asks to publish despite them.
- If the PR cannot be created after a successful push, report the pushed branch
  and the failure reason; do not delete the branch automatically.
