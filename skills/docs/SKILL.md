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

## Workflow

1. **Read context** — inspect the target code and 2–3 similar files to learn the project's doc conventions (JSDoc, TSDoc, docstrings, etc.).
2. **Assess scope** — document only what the user indicated. If they selected a function, document that function; if a module, cover public API surface.
3. **Write docs** — apply the conventions below.
4. **Skip the obvious** — do not document self-explanatory getters, trivial wrappers, or code whose name already says what it does.

## What to document

| Target | Include |
|--------|---------|
| Functions / methods | Purpose, parameters, return value, thrown errors, side effects |
| Classes / types | Role in the system, when to use it, key invariants |
| Modules / files | Brief module-level summary only when the file's purpose isn't clear from its name |
| Complex logic | Inline comments for *why*, not *what* |

## Style guidelines

- Be concise but complete — one clear sentence beats a paragraph of filler
- Include `@example` (or language equivalent) when usage is non-obvious
- Document edge cases, preconditions, and gotchas the reader can't infer from types alone
- Use the same tense, voice, and annotation format as existing docs in the repo

## Hard rules

- **Do not** over-document. If the types and name are sufficient, leave it alone.
- **Do not** change implementation logic — documentation only unless a bug blocks accurate docs.
- **Do not** add docs to files outside the user's scope.
