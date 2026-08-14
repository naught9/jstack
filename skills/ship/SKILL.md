---
name: ship
description: >-
  Stage relevant changes, create a git commit, then wait for explicit user
  confirmation before pushing. Use for ship, commit and push, or everyday
  "land my work" on a single branch. Not for GitHub stacks — use ship-stack.
disable-model-invocation: true
---

# Ship

Everyday single-branch land: stage → commit → **ask before push**. No merge.

**Escalate when:**

- Still implementing → [build](../build/SKILL.md) / [parallelize](../parallelize/SKILL.md)
- GitHub phased stack publish → [ship-stack](../ship-stack/SKILL.md)
- Broken / orphan stack repair → [heal-stack](../heal-stack/SKILL.md)

Host question-tool details: [host-conventions.md](../../references/host-conventions.md).

## Hard rules

- **Only when invoked.** Do not commit or push unless the user asked for this skill (or explicitly asked to commit/push).
- **No secrets.** Never stage `.env`, credentials, tokens, or similar. Warn if the user asks to include them.
- **No force push to main/master.** Warn and stop if requested.
- **No `--no-verify` / skip hooks** unless the user explicitly asks.
- **No amend** unless the user explicitly asks and amend safety checks pass (HEAD is yours, not pushed, or hook-only amend case).
- **Push is gated.** After a successful commit, ask whether to push. Do not push until they confirm.
- **Empty commit:** if there is nothing to commit, say so and stop — do not create an empty commit.

## Workflow

### 1. Inspect (parallel)

Run together:

- `git status`
- `git diff` and `git diff --cached`
- `git log -5 --oneline` (match repo commit style)
- `git branch -vv` (tracking / ahead-behind)

### 2. Stage

- Stage only files relevant to the work just done.
- Exclude unrelated dirty files; mention what you left out.
- Prefer explicit paths over blanket `git add -A` when the tree is mixed.

### 3. Commit

Draft a concise 1–2 sentence message focused on **why**, matching recent style. Then:

```bash
git commit -m "$(cat <<'EOF'
Commit message here.

EOF
)"
```

If a pre-commit hook fails: fix the issue and create a **new** commit (do not amend unless amend rules allow).

If the hook auto-modified files and the commit succeeded: stage those files and amend **only** when HEAD was created by you in this session and has not been pushed.

### 4. Confirm push

Ask (structured question tool when available):

- Push to the tracked remote branch now?
- If no upstream: push with `-u` to `origin HEAD`?

On yes:

```bash
git push
# or, if no upstream:
git push -u origin HEAD
```

On no: stop after commit; report SHA and that push was skipped.

### 5. Verify

`git status` — clean working tree (or only unrelated leftovers), branch tracking as expected.

## Out of scope

- Creating PRs or GitHub stacks
- Merging
- Multi-branch restack / submit → `ship-stack`
- Stack repair → `heal-stack`
