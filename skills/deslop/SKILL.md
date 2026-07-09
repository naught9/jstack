---
name: deslop
description: >-
  Remove AI-generated slop from the current branch vs main: unnecessary comments,
  defensive try/catch, any casts, and style inconsistent with the file.
  Use for deslop, de-slop, cleanup AI comments, or strip over-defensive code.
disable-model-invocation: true
---

# Deslop

Clean up AI-generated noise introduced on the current branch. Only change lines that are part of the branch diff — do not refactor unrelated code.

## Workflow

1. **Establish scope** — diff the current branch against the default base branch (usually `main`). Use merge-base semantics so you only see this branch's changes.
2. **Scan the diff** for slop patterns (below).
3. **Fix in place** — match each file's existing style, naming, and error-handling conventions.
4. **Verify** — run relevant linters/typecheckers if the project has them; fix any issues your edits introduced.
5. **Report** — 1–3 sentences on what you changed. No file-by-file dump unless the user asks.

## Slop patterns to remove

- Comments a human wouldn't write: restating the obvious, "TODO: implement", section banners, change-log narration
- Extra defensive checks or try/catch in trusted/validated codepaths where the surrounding file doesn't use them
- `as any` or equivalent casts to silence type errors — fix the types instead when feasible
- Redundant abstractions: one-use helpers, unnecessary wrappers, verbose null checks on already-guarded values
- Style drift: different quote style, import ordering, naming, or formatting than the rest of the file

## Hard rules

- **Do not** add features, change behavior, or "improve" logic beyond removing slop.
- **Do not** remove comments that explain non-obvious business logic or gotchas.
- When unsure whether something is slop or intentional, leave it and mention it in the summary.
