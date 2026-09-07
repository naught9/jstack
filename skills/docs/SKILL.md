---
name: docs
description: >-
  Add documentation to selected code matching the project's existing style.
  Use when the user asks to document functions, classes, modules, or APIs,
  or says "add docs", "document this", or "write docstrings".
disable-model-invocation: true
---

# Add Documentation

Document the code the user selected or pointed at. Match the documentation style already used in the codebase — read nearby files first.

This skill covers **code-adjacent docs**: docstrings, JSDoc/TSDoc, module headers, and inline comments. For prose in `docs/internal/`, READMEs, or runbooks, use [technical-writing](../technical-writing/SKILL.md). For auditing whether internal docs are current, use [docs-audit](../docs-audit/SKILL.md).

## Workflow

1. **Read context** — inspect the target code and 2–3 similar files to learn the project's doc conventions (JSDoc, TSDoc, docstrings, etc.).
2. **Assess scope** — document only what the user indicated. If they selected a function, document that function; if a module, cover public API surface.
3. **Choose the right surface** — see "Code docs vs internal docs" below. Don't put architecture essays in docstrings.
4. **Write docs** — apply the conventions below and [technical-writing](../technical-writing/SKILL.md) for prose quality.
5. **Skip the obvious** — do not document self-explanatory getters, trivial wrappers, or code whose name and types already say what it does.

## Code docs vs internal docs

| Belongs in code docs | Belongs in `docs/internal/` instead |
|----------------------|-------------------------------------|
| What this function/type does | How subsystems connect across packages |
| Parameters, return value, thrown errors | Multi-process flows, sync pipelines, ownership boundaries |
| Local invariants and preconditions | ADRs, runbooks, operational failure modes |
| Non-obvious usage for this API | Diagrams of architecture that spans many modules |

If the user asks to document something that needs a diagram or cross-module narrative, write the minimal code doc and suggest a `docs/internal/` update or a [docs-audit](../docs-audit/SKILL.md) finding.

## What to document

| Target | Include |
|--------|---------|
| Functions / methods | Purpose (first line), parameters, return value, thrown errors, side effects, units |
| Classes / types | Role in the system, when to use it, key invariants |
| Modules / files | Brief module-level summary only when the file's purpose isn't clear from its name |
| Complex logic | Inline comments for *why*, not *what* |

## Style guidelines

Follow [technical-writing](../technical-writing/SKILL.md) for sentence quality. For code docs specifically:

- **Answer first.** The summary line should state what the symbol does and any critical constraint. A reader (or agent) skimming signatures should get the gist from line one.
- **Use exact identifiers.** Name parameters and types as they appear in code (`userId`, not "the user's ID").
- **State units and ranges.** "Timeout in milliseconds." "Must be >= 0." "Revision from the server, not the local projection."
- **Document failure, not just success.** Thrown errors, rejected promises, `null` returns, and retry behavior matter as much as the happy path.
- **Be concise but complete** — one clear sentence beats a paragraph of filler.
- **Include `@example`** (or language equivalent) when usage is non-obvious or when the types alone don't show the calling convention.
- **Document edge cases, preconditions, and gotchas** the reader can't infer from types alone.
- **Match the file** — same tense, voice, and annotation format as existing docs in the repo.

## What not to document

- Generic framework or language behavior any developer (or coding agent) already knows.
- Restatements of the type signature with no added meaning ("Returns a string" on `(): string`).
- Architecture that belongs in `docs/internal/` — link there instead of duplicating it in every call site.

## Hard rules

- **Do not** over-document. If the types and name are sufficient, leave it alone.
- **Do not** change implementation logic — documentation only unless a bug blocks accurate docs.
- **Do not** add docs to files outside the user's scope.

## Relationship to other skills

| Need | Skill |
|------|-------|
| Prose style, clarity, agent-readable sections | [technical-writing](../technical-writing/SKILL.md) |
| Audit `docs/internal/` for accuracy, diagrams, gaps | [docs-audit](../docs-audit/SKILL.md) |
| Strip AI noise from code on the current branch | [deslop](../deslop/SKILL.md) |
| Reconcile `work/` logs with Linear/GitHub state | [docs-linear-github-audit](../docs-linear-github-audit/SKILL.md) |
