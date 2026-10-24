# Linear issue template

Use only when the user asked for, or approved, recording the plan as a Linear issue. Linear MCP `save_issue`; one issue, no sub-issues (epics go through [plan-epic](../plan-epic/SKILL.md)). Read `list_teams` / `list_projects` / `list_issue_statuses` if unsure of team, project, or state names.

## Fields

| Field | Value |
|-------|-------|
| `title` | Imperative, concise; matches the plan title |
| `team` | Confirm with the user; do not guess |
| `project` | Only if the work belongs to an existing project the user named or the repo's branch/issues indicate |
| `assignee` | `me` if the user will do the work; otherwise leave unset |
| `priority` | Only if the user gave one |
| `estimate` | Only if the user gave one |
| `state` | Team default (backlog/todo); do not start it |
| `description` | Markdown below |

## Description

```markdown
## Goal

<1–2 sentences: what changes and why>

## Approach

<the single chosen approach, 3–6 lines; no options>

## Steps

* <actionable step with file/module reference>
* <step>

## Acceptance criteria

* <from the plan's Definition of done>
* Tests / type-check green for touched packages

## Out of scope

* <explicit exclusions, if any>
```

Keep it a summary of the plan, not a copy. If the plan was saved to `plans/<slug>.md`, mention the path or paste the key steps; do not attach local files.

## After creation

- Report the identifier and URL to the user.
- Add the identifier to the plan (frontmatter `overview` or a `Linear:` line under the title) if the plan file or CreatePlan artifact is still editable.
- Do not change the issue's state, assignee, or labels beyond what the user approved.
