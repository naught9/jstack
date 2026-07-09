# Plan doc template

Copy structure for `work/planning/<FEATURE>.md`. Adapt sections to feature size.

## Planning checklist

```
Planning progress:
- [ ] Intake complete (context + inventory)
- [ ] Clarification round(s) via structured questions
- [ ] Plan draft written
- [ ] User approved plan (gate 1)
- [ ] Plan committed; status → plan of record
- [ ] User approved Linear set (gate 2)
- [ ] Epic + sub-issues created and cross-linked
- [ ] User opted into Graphite scaffold (gate 3)
- [ ] Stack scaffolded and submitted
- [ ] Handoff summary delivered
```

---

## Document skeleton

```markdown
# <Feature Name> — <Subtitle if needed>

**Status:** proposed | plan of record
**Last verified:** YYYY-MM-DD
**Author:** <name> (via assistant)
**Scope:** <packages/apps touched>
**Depends on:**
- <dependency> — <landed | in review | blocked>
**Related:**
- <link to architecture doc, ADR, related plan>

> **Disclaimer** (while status = proposed): one-line scope boundary.

---

## 1. Problem statement

What users need today vs what exists. Goal and non-goals.

---

## 2. Current state (inventory)

| Layer | State | Key locations |
|-------|-------|---------------|
| ... | ... | `path/to/code` |

---

## 3. Proposed product model

Decisions made during clarification. Tables for enums, semantics, UX rules.

---

## 4. Target architecture

Diagrams (text or mermaid). Ownership boundaries. What stays TS vs native.

---

## 5. <Feature-specific sections>

Recording strategy, migration, agent tools, etc. as needed.

---

## 6. Phased rollout

| Phase | Deliverable | Success criteria |
|-------|-------------|------------------|
| **0 — <label>** | ... | ... |
| **1 — <label>** | ... | ... |

Note phase dependencies and gates (e.g. "P2 blocked until X merges").

---

## 7. Open product questions

| # | Question | Decision | Notes |
|---|----------|----------|-------|
| 1 | ... | **Resolved: …** or TBD | |

Empty or "none" when clarification resolved all questions.

---

## 8. Risks and mitigations

| Risk | Mitigation |
|------|------------|

---

## 9. Testing strategy

| Layer | Tests |
|-------|-------|

---

## 10. Key files (starting points)

| Area | Location |
|------|----------|

---

## 11. Relationship to other plans

How this fits the broader roadmap.

---

## Changelog

| Date | Change |
|------|--------|
| YYYY-MM-DD | Initial spec |
```

## Status transitions

| Status | Meaning |
|--------|---------|
| `proposed` | Draft; open questions may remain |
| `plan of record` | User-approved; drives Linear + implementation |

When hardening to plan of record: resolve open questions, remove exploratory disclaimer, update **Last verified**, add changelog entry.
