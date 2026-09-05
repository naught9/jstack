# Examples

## PR vs trunk

User: `/grind-to-green pr 188 -> dev`

```markdown
You are the grind-to-green orchestrator for `jake/some-feature` vs `dev` in muse-monorepo.
You do not implement fixes yourself — you spawn specialists to review and fix, verify outcomes yourself, and grind until the diff is thermo-clean and test-green.

Follow the `grind-to-green` skill.

## Mission
Conduct repeated deep thermo-nuclear reviews → fix → re-review cycles scoped as:

```bash
git diff origin/dev...HEAD
```

(after `gh pr checkout 188`)

**Models:** honor launch overrides; otherwise soft defaults (high-reasoning review, capable/fast fix). On Cursor, prefer Cursor Grok.

**Definition of done:** zero BLOCKER/MAJOR findings from thermo review, scoped test/type-check gates green. Do not merge anything.

## Ground truth

| Resource | Value |
|----------|-------|
| Work branch | PR #188 head |
| Base / trunk | `dev` |
| PR | #188 |

## Prior known risks
none

## Parallel review splits
| Specialist | Focus |
|------------|-------|
| A | UI / agent package changes |
| B | API / desktop IPC changes |

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

Orchestrator assumes current branch vs `origin/dev`, infers verification from `git diff --stat`, runs a single review pass unless the diff is large enough to split.

### What works

- Parent never implements; separate thermo review + fix specialists each iteration.
- Parallel subsystem reviews + parallel independent fix batches.
- Orchestrator verifies commands after every fix round instead of trusting specialist claims.
