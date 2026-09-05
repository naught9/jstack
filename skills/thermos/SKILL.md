---
name: thermos
description: >-
  Launch thermo-review and thermo-quality specialists in parallel, then
  synthesize findings. Use for thermos, double thermo review, or combined
  bug/security and code-quality branch audits.
disable-model-invocation: true
---

# Thermos

Run both thermo review passes as parallel specialists, then synthesize.

Host spawn / question details: [host-conventions.md](../../references/host-conventions.md).

## Roles

| Role | Focus |
|------|--------|
| `thermo-review` | Bugs, breakages, security, devex, feature-flag leaks |
| `thermo-quality` | Maintainability, structure, file-size growth, spaghetti, code-judo |

## Models

- Soft default: **high-reasoning** model for both roles.
- Honor user overrides, e.g. `/thermos use grok 4.6 for the review`. If the user names a family for one role only, leave the other on the host default.
- Host mapping: [host-conventions.md](../../references/host-conventions.md#models). On Cursor, prefer Cursor Grok for both specialists; do not select Opus unless the user named that family.

## Workflow

1. **Scope** — determine review target from the user request, PR, current branch, or named files.
2. **Context** — gather the diff and any file excerpts reviewers need (parent may do this, or each specialist gathers its own). Prefer merge-base vs the repo default base branch.
3. **Admit both roles before collecting either result**:
   - `thermo-review`
   - `thermo-quality`
   Retain both handles. Pass the same scoped context to each and ask for prioritized findings with file:line evidence.
4. **Collect both handoffs** — require one explicit terminal handoff from each admitted specialist before synthesis. A spawn/admission return is not a review result.
5. **Fallback** — if the host has no subagent system, run both rubrics **inline** in this session (sequential is fine): load each skill and produce both reports before synthesizing.
6. **Synthesize** — findings first, deduplicated. Weight overlapping findings more heavily; resolve disagreements with your own judgment. Keep the summary brief.

If individual specialist summaries are already visible to the user, do not restate them wholesale. Surface the unified verdict, highest-signal findings, and remaining uncertainty.
