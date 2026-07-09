# Specialist prompt templates

Copy and fill in `{placeholders}`. Every prompt must be self-contained.

Spawn via the host's subagent API (see [host-conventions.md](../../references/host-conventions.md)):
- Epic review → role `thermo-review` (soft default: high-reasoning)
- Epic fix → general-purpose / implementation worker (soft default: capable/fast)

Honor user model overrides.

## Epic review

```markdown
You are reviewing the **full stacked epic** for {parent issue} ({title}).

## Task
Run a thermo-nuclear review (`thermo-review` role / `thermo-nuclear-review` skill) on the cumulative epic diff. **Review only — do not implement fixes.**

## Diff command
```bash
git diff origin/{trunk}...origin/{tip-branch}
```

Ensure `{tip-branch}` is checked out locally before reviewing.

## Plan quality bar
From `{plan doc path}` {quality bar section ref}:
{paste or summarize quality bar bullets}

## Phase boundaries
{table or bullets: what belongs in P0…Pn; flag scope creep}

## Prior known risks
From orchestration log `{orchestration log path}`:
{paste prior residual risks + regression checklist}

## Focus areas
{paste rubric table from launch prompt — correctness, engine, security, etc.}

## Subsystem focus (if parallel split)
{optional: e.g. "Focus only on Supabase migration + RPC in supabase/migrations/..."}

## Classification
Classify each finding: **BLOCKER**, **MAJOR**, **MINOR**, **NIT**

## Deliverable
- Verdict: **CLEAN** (zero BLOCKER/MAJOR) or **NEEDS_FIXES**
- Findings: Severity | Location | Finding | Suggested fix
- Cross-cutting issues that span multiple phases
```

## Epic fix

```markdown
You are fixing thermo review findings for the **{parent issue} epic** on branch `{fix-branch}`.

## Findings to address
{paste numbered BLOCKER/MAJOR list from review specialist}

## Branch rules
- Default work branch: `{tip-branch}`
- If a fix clearly belongs on an intermediate phase branch `{phase-branch}`, fix there and note that orchestrator must restack descendants

## Scope
- Fix only what the findings require; no drive-by refactors
- Attribute fixes to the correct subsystem; keep diffs minimal and localized

## Repo conventions
- pnpm only; Node 22; strict TypeScript at module boundaries
- Don't reformat untouched files
- Rebuild and commit `dist/` for changed packages that commit artifacts

## Verification (run before push)
{paste verification commands from launch prompt}

## Rules
- Do **not** run thermo review on your own work
- Push to `{fix-branch}` when checks pass

## Deliverable
- Per-finding: fixed / wont-fix (with reason)
- Test commands run + results
- Anything needing orchestrator restack or plan-level decision
```

## Orchestrator launch

Use when the user starts an epic review grind. Fill from Linear + Graphite + plan doc.

```markdown
You are the epic review orchestrator for **{parent issue}** ({title}) in muse-monorepo.
You do not implement fixes yourself — you spawn specialists to review and fix, verify outcomes yourself, and grind until the entire epic diff is thermo-clean and test-green.

Follow the `orchestrate-phased-review` skill.

## Mission
Conduct repeated deep thermo-nuclear reviews → fix → re-review cycles on the full stacked epic ({phase range}), scoped as:

```bash
git diff origin/{trunk}...origin/{tip-branch}
```

**Definition of done:** zero BLOCKER/MAJOR findings from thermo review, scoped test/type-check gates green, orchestration log updated, all PRs in the stack remain ready for review (not draft). Do not merge anything.

## Ground truth

| Resource | Location |
|----------|----------|
| Parent issue | {parent issue} |
| Plan of record | `{plan doc path}` |
| Orchestration log | `{orchestration log path}` |
| Epic tip branch | `{tip-branch}` |
| Trunk | `{trunk}` |

### Graphite stack (daisy-chained)

| Phase | Issue | Branch | PR |
|-------|-------|--------|-----|
{fill rows}

Epic scope: {file count / insertion summary if known}. Per-phase PR diffs are subsets; the authoritative review surface is the cumulative epic diff, but attribute fixes to the correct phase branch when possible.

## Plan sections to read
- Quality bar: `{plan doc path}` {section ref}
- Phase boundaries: `{plan doc path}` {section ref}

## Prior known risks
{from orchestration log}

## Regression checklist (prior fixes — re-verify)
| Phase | Commit | What to re-check |
|-------|--------|------------------|
{fill rows or "none yet"}

## Parallel review splits (optional, for large diffs)
| Specialist | Focus |
|------------|-------|
{fill subsystem splits — see examples.md}

## Verification commands (orchestrator runs after every fix)
```bash
{paste type-check, test, cargo, migration smoke commands}
```

## Pre-existing flakes (ignore unless epic introduces them)
{bullet list}

## Thermo rubric focus areas
{paste customized rubric table}

Grind until CLEAN. Do not merge.
```
