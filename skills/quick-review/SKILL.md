---
name: quick-review
description: >-
  Thorough but practical code review of the current branch vs target: understand
  intent, check surrounding context, report real findings only. Use for
  quick-review, everyday branch review, or review my changes. Lighter than
  thermos / thermo-nuclear-review — use those for deep dual-pass audits.
disable-model-invocation: true
---

# Quick Review

Everyday branch review against the default base branch (usually `main` / `dev`). Focus on issues that would matter in a real PR — not style nits or pre-existing problems outside the diff.

**Spawn:** prefer role **`reviewer`** with a self-contained prompt (diff scope + base branch). If subagents are unavailable, run this skill **inline** in the parent session.

Host spawn details: [host-conventions.md](../../references/host-conventions.md).

**Escalate when:**

- Deep dual-pass bug/security + quality audit → [thermos](../thermos/SKILL.md)
- Single deep correctness / security pass → [thermo-nuclear-review](../thermo-nuclear-review/SKILL.md)
- Review → fix grind until green → [grind-to-green](../grind-to-green/SKILL.md)

## Workflow

1. **Get the diff** — branch changes vs merge-base with the target base (committed + staged + unstaged unless the user asked for committed-only).
2. **Understand intent** — skim commit messages, PR description if available, and the overall shape of the change. State the intent in one sentence before diving in.
3. **Deep context** — for each significant change, read surrounding code (callers, tests, related modules) so you understand impact beyond the diff hunk.
4. **Review** — look for bugs, logic errors, missing tests, broken contracts, and regressions in the changed code.
5. **Prune findings** — drop false positives, pre-existing issues, and nitpicks. If you aren't confident, investigate further or omit.
6. **Present** — concise summary with findings grouped by severity.

## What to look for

- Incorrect assumptions about callers, data shape, or error paths
- Missing or broken tests for new behavior
- Changed public API without updating consumers in the diff
- Edge cases the author likely didn't consider
- Behavior changes that aren't obvious from the diff

## What to skip

- Formatting, naming, or style preferences (unless egregious)
- Issues in unchanged lines
- Theoretical problems with no realistic trigger
- Duplicating linter output the user can run themselves

## Output format

```markdown
## Intent
<one sentence on what this branch does>

## Findings

### High
- <finding> — <file:line, brief why>

### Medium
- ...

### Low / notes
- ...

## Summary
<2–4 sentences: ship / fix first / looks good>
```

## Hard rules

- **Never** report an issue you haven't verified by reading the relevant code.
- **Never** pad the list — an empty findings section with "looks good" is valid.
- Check PR discussion with `gh` only *after* your own review, if a PR exists and you want to cross-reference automated review bots or human comments.
- Do **not** implement fixes in this skill — report findings; use `worker` or [grind-to-green](../grind-to-green/SKILL.md) for fixes.
