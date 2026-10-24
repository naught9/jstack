# Examples

## PR vs trunk

User: `/grind-epic pr 188 -> dev`

```markdown
You are the grind-epic orchestrator for `jake/some-feature` vs `dev` in muse-monorepo.
You do not implement fixes yourself — you spawn specialists to review and fix, verify outcomes yourself, and grind until the diff is review-clean and test-green.

Follow the `grind-epic` skill.

## Mission
Conduct one initial thermos audit, then fix → single-pass re-review cycles scoped as:

```bash
git diff origin/dev...HEAD
```

(after `gh pr checkout 188`)

**Review policy:** run thermos once initially. After fixes, use one `quick-review` reviewer by default or one `thermo-nuclear-review` reviewer for high-risk fixes.

**Definition of done:** initial thermos complete; either it is clean or the latest required re-review has zero BLOCKER/MAJOR findings; scoped test/type-check gates green. Do not merge anything.

## Ground truth

| Resource | Value |
|----------|-------|
| Work branch | PR #188 head |
| Base / trunk | `dev` |
| PR | #188 |

## Prior known risks
none

## Verification commands
```bash
pnpm --filter @muse/agent type-check
pnpm --filter muse-desktop type-check
```

## Pre-existing flakes
none known

Grind until CLEAN. Do not merge.
```

## Epic via Linear project

User: `/grind-epic MUSE-537`

Orchestrator resolves MUSE-537's project (Audio Tracks), reads the plan document and phase sub-issues, takes the stack tip from `gh stack view --json`, and reviews the cumulative diff `git diff origin/dev...origin/{tip-branch}`.

```markdown
## Ground truth

| Resource | Value |
|----------|-------|
| Linear project | Audio Tracks — https://linear.app/muse-art/project/audio-tracks |
| Parent issue | MUSE-537 |
| Plan document | "Audio Tracks — Plan of record" (in the project) |
| Work branch (stack tip) | `jake/muse-619-audio-tracks-p5-agent-tools-docs` |
| Base / trunk | `dev` |
| Phase table | P0 MUSE-614 #137 … P5 MUSE-619 #142 |
| Orchestration log | `tmp/orchestration/MUSE-537.md` (local, git-ignored) |
```

After each clean cycle the orchestrator comments on MUSE-537 with verdict, fix SHAs, and verification results.

## Default (current branch → dev)

User: `/grind-epic`

Orchestrator assumes current branch vs `origin/dev`, infers verification from `git diff --stat`, runs one initial thermos audit, and uses one reviewer for each later re-review.

### What works

- Parent never implements; review and fix specialists remain separate.
- Initial thermos supplies the two broad parallel rubrics; later re-reviews use one selected reviewer.
- Independent fix batches may still run in parallel.
- Orchestrator verifies commands after every fix round instead of trusting specialist claims.
