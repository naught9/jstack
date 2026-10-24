# Linear project template

One Linear project per epic. Look for it with `list_projects` (`query` = feature name, `team`). Create it with `save_project` **before** the plan document or any issue, and only when no match exists. Confirm name, team, and lead with the user first.

If the workspace has a native Linear project template for epics (`list_templates`), pass it as `template` on create; a `description` you supply replaces the template body, so omit `description` to keep it. Otherwise use the fields and description below.

## Fields

| Field | Value |
|-------|-------|
| `name` | Feature name, matching the epic title (e.g. `Audio Tracks`) |
| `addTeams` | `Muse` (or the team the user named); required on create |
| `lead` | `me` unless the user names someone else |
| `summary` | One line (≤255 chars): what ships and why |
| `description` | Markdown below |
| `targetDate` | ISO date, only if the user gave one |
| `state` | `planned` (set to `started` via `save_project` when `build-epic` begins P0) |

## Description

```markdown
## Goal

<2–3 sentences: what this epic delivers and for whom>

## Scope

* In: <bullet>
* Out (non-goals for v1): <bullet>

## Where things live

* **Plan of record:** Linear document "<Feature> — Plan of record" in this project
* **Epic issue:** <added after the epic is created>
* **Phases:** sub-issues of the epic, `P0…Pn`
* **GitHub stack:** <PR list added after scaffold, or "not scaffolded">

## Status

Planning — plan of record not yet approved.
```

## After creation

1. Capture the project id and URL; every later `save_document` and `save_issue` for this epic passes this project (`list_documents` with `projectId` finds its documents).
2. When the plan document is saved, update the `Plan of record` bullet with its link (`save_project` with `patch`).
3. When the epic and sub-issues exist, add the epic link and update **Status**.
4. When `build-epic` starts, set the project state to `started`.
