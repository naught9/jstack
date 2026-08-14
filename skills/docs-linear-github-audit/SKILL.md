---
name: docs-linear-github-audit
description: Audit repository work and planning documents against Linear issue state and GitHub or git branch evidence, classify documents as active, planned, completed, or promotion candidates, and prepare a reviewable cleanup proposal. Use when a repository has stale work logs, implementation plans, orchestration notes, or internal documentation that needs status reconciliation before archiving, deletion, or promotion to durable internal docs.
---

# Docs Linear GitHub Audit

Produce a read-only, evidence-backed disposition report before changing repository documentation. Separate current implementation state from document location, and leave deletion, archiving, promotion, and issue updates to an explicit user decision.

## Required workflow

1. **Scope the repository and source of truth.**
   - Read the repository's `AGENTS.md`/`CLAUDE.md`, `work/README.md`, and documentation indexes.
   - Confirm the target branch. In Muse repositories, use `dev` as the integration target and never commit, push, or reset `dev`.
   - Inspect `git status` first. Preserve existing user changes and call out dirty worktrees; do not fold unrelated changes into the audit.

2. **Inventory the documents.**
   - Enumerate `work/active/`, `work/planning/`, `work/logs/`, and `work/archive/` with `rg --files` while excluding `node_modules`.
   - Extract each document's status, verification date, issue identifiers, branch names, PR links, and references to `docs/internal/`.
   - Treat missing or non-standard status metadata as an audit finding, not proof that the work is incomplete.

3. **Reconcile issue state.**
   - Use connected Linear tools for read-only lookups. Resolve the team before listing issues, then fetch the specific issue IDs found in documents.
   - Record the issue identifier, title, current status, status type, completion timestamp, and Linear branch name.
   - Distinguish `Done`/`Canceled`/`Duplicate` from `In Progress`/`In Review`/`Paused`, `Todo`, and `Backlog`. A parent issue being Done does not make unfinished child issues complete.
   - Do not update Linear issues or add comments as part of this skill.

4. **Reconcile git and GitHub evidence.**
   - Inspect local and `origin/*` refs, branch tips, merge-base/ancestor relationships, and `git log` on the target branch.
   - Prefer squash-merge/PR evidence in the target branch over `git merge-base --is-ancestor` alone; feature branches are often deleted or rebased after merge.
   - If GitHub tools are connected, use them for PR state and merge metadata when branch evidence is ambiguous. Otherwise report the git-ref evidence and its limits.
   - Never infer completion from a branch existing alone. Never infer that a document is active only because an old branch still exists.

5. **Bucket every document.**
   - **Still active:** implementation or planning is underway, or the document is a live product/architecture decision with unresolved work.
   - **Planning:** proposed work with no implementation evidence, including paused/backlog/todo issues.
   - **Completed/merged:** implementation is complete and supported by Linear plus target-branch/PR evidence.
   - **Candidate for promotion:** a separate, non-exclusive label for completed or stable material that describes durable architecture, operating behavior, or a repeatedly referenced contract. Prefer extending an existing gold document over creating a duplicate.
   - Keep every document in its current location during the audit. Do not move, delete, archive, promote, or rewrite it before user approval.

6. **Report stale metadata and cleanup options.**
   - Identify documents whose directory or status disagrees with the evidence, stale branch/PR tables, duplicate orchestration logs, missing headers, and links to superseded plans.
   - Recommend archive over deletion for historical records unless the user explicitly chooses deletion. Do not delete a document merely because its issue is Done.
   - For promotion candidates, name the target `docs/internal/` document or section and explain what durable content must be extracted; leave the source document in place.

7. **Stop for user decisions.**
   - Present the full bucketed inventory and the proposed delete/archive/promote set.
   - Ask the user to approve exact changes. Do not create a branch, edit files, update Linear, or open a PR in the audit pass.

## Implementation after approval

Only after explicit approval:

1. Create a feature branch from `origin/dev`; do not work directly on `dev`.
2. Apply only the approved moves, archives, deletions, promotions, metadata fixes, and documentation-index updates.
3. Keep historical implementation logs concise; extract durable decisions into `docs/internal/` and link back only when useful.
4. Validate links, status headers, manifest/index consistency, and repository-specific documentation checks.
5. Review the diff, commit intentionally, push the feature branch, and open a PR targeting `dev` if the user asked for publication. Do not merge the PR.

## Promotion rubric

Promote or fold content into `docs/internal/` only when most of the following are true:

- The implementation is merged and verified against the current target branch.
- The content describes behavior or architecture that should remain true beyond one issue or PR.
- It has clear ownership and authoritative code paths.
- It is likely to be referenced by multiple engineers or agents.
- Open risks and known limitations can be stated without retaining task orchestration noise.

Do not promote raw brainstorming, product memos, review transcripts, temporary handoffs, or issue-specific stack choreography. For a candidate, propose the smallest durable extraction and leave the original work document untouched until approval.
