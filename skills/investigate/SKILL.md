---
name: investigate
description: >-
  Investigate a bug or unexpected behavior: reproduce, find root cause with
  evidence, then either apply a small fix or produce a short fix plan. Use for
  investigate, debug, root cause, why is this broken, or triage a regression.
disable-model-invocation: true
---

# Investigate

Everyday debug loop: **repro → evidence → root cause → fix or plan**. Prefer a minimal verified fix when the change is small and local; otherwise hand a concrete fix plan to [build](../build/SKILL.md) / [plan](../plan/SKILL.md).

**Escalate when:**

- Fix is large / multi-file / architectural → [plan](../plan/SKILL.md) then [build](../build/SKILL.md)
- Needs parallel exploration across packages → spawn explore workers, then continue here
- After a fix, want review → [quick-review](../quick-review/SKILL.md)

Host question-tool details: [host-conventions.md](../../references/host-conventions.md).

## Hard rules

- **Evidence over guesses.** Cite file:line, logs, failing tests, or repro steps. Do not ship a “probably” root cause.
- **Repro first** when possible. If you cannot reproduce, say what you tried and what info you need (1–2 questions).
- **Minimal fix.** Touch only what the root cause requires. No drive-by cleanup.
- **Verify the fix.** Re-run the failing case / scoped test. If you cannot automate, give exact manual steps.
- **Know when to stop coding.** If the fix is large, stop after root cause + proposed plan — do not half-implement an epic under “investigate.”
- **Read-only until the cause is clear** when the user only asked “why”; ask before applying a fix if unclear.

## Workflow

```
1. Intake       → symptom, expected vs actual, when it started, env hints
2. Clarify      → 1–2 questions only if blocked (missing repro, version, surface)
3. Reproduce    → failing test, script, or documented manual steps
4. Narrow       → bisect paths: recent diff, logs, stack traces, related modules
5. Root cause   → one primary cause with evidence (secondary factors listed briefly)
6. Act          → small fix + verify  OR  short fix plan + stop
7. Report       → cause, evidence, what changed / next steps
```

### Act decision

| Situation | Do |
|-----------|-----|
| Local bug, clear one-file or tight fix, tests exist or easy to add | Fix now, verify, summarize |
| Multi-module / product decision / large blast radius | Root-cause write-up + fix plan; suggest `/plan` or `/build` |
| Cannot repro | List attempts; ask for the missing signal; do not “fix blind” |

### Fix plan shape (when not fixing now)

```markdown
## Root cause
<one paragraph + file:line evidence>

## Fix plan
- [ ] <step>
- [ ] <step>

## Verify
- <test or manual check>

## Out of scope / risks
- …
```

## Out of scope

- Feature implementation from a greenfield request → [plan](../plan/SKILL.md) / [build](../build/SKILL.md)
- Commit / push → [ship](../ship/SKILL.md)
- Deep PR audit without a live bug → [quick-review](../quick-review/SKILL.md) / [thermos](../thermos/SKILL.md)
