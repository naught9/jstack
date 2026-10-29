# Specialist prompt templates

Copy and fill in `{placeholders}`. Every prompt must be self-contained.

Spawn via the host's subagent API:
- Initial review → [thermos](../thermos/SKILL.md), roles `thermo-review` + `thermo-quality`
- Quick re-review → role `reviewer`
- Deep re-review → role `thermo-review`
- Implementation or fix → role `worker` (fall back to host general-purpose if missing)

## Implementation

~~~~markdown
You are the jstack `worker` implementing {phase} of {parent issue}, sub-issue {issue ID}.

## Ground truth
- Repository/worktree: {absolute path}
- Existing work branch: {branch}; dependency base: {base branch and SHA}
- Plan of record: {document URL plus relevant plan excerpts}
- Phase issue: {URL plus scope and acceptance criteria}
- Files/subsystems owned: {explicit ownership}
- Out of scope and gates: {exclusions, follow-on phases, satisfied prerequisites}
- Repo conventions: {instructions discovered in this repository}
- Verification commands: {scoped tests, type-check, acceptance/integration checks}
- Commit/push permissions: {authorized actions and limits}

Implement the entire phase within these boundaries, including caller integration and meaningful tests. Remove scaffold-only markers when replacing them with real work. Do not create parallel branches, change PR bases, merge, or expand the plan. Escalate missing decisions or blockers with evidence.

Run the scoped checks. Return an explicit terminal handoff with changed files, commit/head SHA, acceptance evidence, exact commands/results, and unresolved risks. Do not review your own implementation.
~~~~

## Initial review

~~~~markdown
You are reviewing the diff for `{work-branch}` vs `{base}`.

## Task
Run one initial thermos audit (`thermo-review` + `thermo-quality` in parallel) on the full review surface. **Review only — do not implement fixes.**

## Diff command
```bash
git diff {base-sha}...{head-sha}
```

Use the orchestrator-provided repository/worktree and pinned base/head SHAs. Confirm that the intended branch and head are present; do not switch a shared checkout under active workers.

## Context (optional)
{paste repository/worktree, pinned base/head, phase issue, plan scope and acceptance criteria, prior phase contracts, or PR-only context}

## Prior known risks
{paste residual risks or "none"}

## Focus areas
{paste rubric table — correctness, security, breaking changes, scope, tests, devex, maintainability}

## Classification
Classify each finding: **BLOCKER**, **MAJOR**, **MINOR**, **NIT**

## Deliverable
- Verdict: **CLEAN** (zero BLOCKER/MAJOR) or **NEEDS_FIXES**
- Findings: Severity | Location | Finding | Suggested fix
- Cross-cutting issues that span review rubrics
~~~~

## Re-review

~~~~markdown
You are re-reviewing the updated diff for `{work-branch}` vs `{base}`.
The initial thermos audit has already completed. Run exactly one review pass; do not launch thermos or a second parallel reviewer.

## Review mode
Use `{quick-review | thermo-nuclear-review}`:
- `quick-review` / role `reviewer` for localized fixes and direct finding confirmation.
- `thermo-nuclear-review` / role `thermo-review` for security, correctness invariants, breaking behavior, devex, feature gates, cross-cutting behavior, or other high-risk fixes.

## Findings to confirm
{paste findings that prompted this fix round}

## Diff command
```bash
git diff {base-sha}...{head-sha}
```

## Context and known risks
{paste PR summary, residual risks, or "none"}

## Task
1. Confirm the provided repository/worktree and pinned base/head SHAs match the review target.
2. Verify each prior finding end to end on the updated diff.
3. Check the overall review surface for regressions introduced by the fixes under the selected rubric.
4. Report only evidence-backed findings.

## Rules
- Review only; do not implement fixes.
- Do not spawn both review roles.

## Deliverable
- Verdict: **CLEAN** (zero BLOCKER/MAJOR) or **NEEDS_FIXES**
- Findings: Severity | Location | Finding | Suggested fix
~~~~

## Fix

~~~~markdown
You are the jstack `worker` fixing thermo review findings on branch `{work-branch}`.

## Findings to address
{paste numbered BLOCKER/MAJOR list from review specialist}

## Branch rules
- Repository/worktree: `{absolute path}`
- Pinned starting head: `{head-sha}`
- Work branch: `{work-branch}`
- Base: `{base}`
- Do not merge; push only if the user/orchestrator expects remote updates

## Scope
- Fix only what the findings require; no drive-by refactors
- Keep diffs minimal and localized

## Repo conventions
{paste the repository instructions; for muse-monorepo: pnpm only, Node 24, strict TypeScript at module boundaries}
- Don't reformat untouched files
- Rebuild and commit `dist/` for changed packages that commit artifacts (only if orchestrator asked you to commit)

## Verification (run before finishing)
{paste verification commands from launch prompt}

## Rules
- Do **not** run thermo review on your own work
- Leave the working tree ready for the orchestrator to verify

## Deliverable
- Per-finding: fixed / wont-fix (with reason)
- Files changed
- Test commands run + results
- Anything needing orchestrator decision
~~~~

## Orchestrator launch

Fill from the invocation and approved planning artifacts. For explicit PR/branch review-only runs, state that mode and omit phase implementation.

~~~~markdown
You are the grind-epic orchestrator for {parent issue / project} in {repository}.
Follow the `grind-epic` skill. Build all unfinished in-scope phases from the approved plan and issues; no existing implementation diff is required.

## Ground truth
- Mode: {epic execution / resume / review-fix only}
- Repository/worktree: {absolute path}
- Project and parent issue: {links}
- Approved plan of record: {document link}
- Phase table: {phase | issue | dependency | scope | status | branch | PR | base/head SHA}
- Trunk: {verified base}
- Out-of-scope phases: {follow-on boundaries}
- Gates: {upstream merges and user decisions}
- Verification: {per-phase and cumulative acceptance commands}
- Prior review evidence and flakes: {pinned SHAs, findings, limitations}
- Publication permissions: {commits, push, PR, Linear updates, history rewrite limits}
- Orchestration log: tmp/orchestration/{parent-issue-or-branch}.md (local, ignored)

For each phase: implementation worker → collect terminal handoff → orchestrator verification → one initial thermos audit → fix workers → collect handoffs → orchestrator verification → one fresh re-review. Use quick-review by default, thermo-nuclear-review for high-risk fixes. Keep reviewers separate from implementers/fixers.

Continue through every in-scope phase, then verify and review cumulative integration at the final SHA. Completion means the approved epic is implemented, acceptance gates are green, reviews are clean, and the stack is coherent and ready for review. Report blockers as incomplete. Do not merge.
~~~~
