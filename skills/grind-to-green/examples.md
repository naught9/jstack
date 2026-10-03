# Examples

## PR vs trunk

User: `/grind-to-green pr 188 -> dev`

```markdown
You are the grind-to-green orchestrator for `jake/some-feature` vs `dev` in muse-monorepo.
You do not implement fixes yourself — you spawn specialists to review and fix, verify outcomes yourself, and grind until the diff is review-clean and test-green.

Follow the `grind-to-green` skill.

## Mission
Conduct one initial thermos audit, then fix → single-pass re-review cycles scoped as:

```bash
git diff origin/dev...HEAD
```

(after `gh pr checkout 188`)

**Models:** honor launch overrides; otherwise soft defaults (high-reasoning initial thermos/deep re-review, balanced quick re-review, capable/fast fix). On Cursor, prefer Cursor Grok.

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

## Default (current branch → dev)

User: `/grind-to-green`

Orchestrator assumes current branch vs `origin/dev`, infers verification from `git diff --stat`, runs one initial thermos audit, and uses one reviewer for each later re-review.

### What works

- Parent never implements; review and fix specialists remain separate.
- Initial thermos supplies the two broad parallel rubrics; later re-reviews use one selected reviewer.
- Independent fix batches may still run in parallel.
- Orchestrator verifies commands after every fix round instead of trusting specialist claims.
