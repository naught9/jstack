# Linear issue templates

Use Linear MCP `save_issue`. Team: **Muse**. Read `get_issue` / `list_issue_statuses` if unsure of project or state names.

## Parent epic

```markdown
Title: <Feature Name>

Description:
First-class **<feature>** in Muse Desktop — <one-line goal>.

**Plan of record:** [<FEATURE>.md](https://github.com/muse-art/muse-monorepo/blob/main/work/planning/<FEATURE>.md)

## Goal

<2–3 sentences from plan §1>

## Quality bar

<Bullet list from clarification — e.g. bit-transparent playback, golden-WAV tests>

## Architecture anchors

* <decision 1>
* <decision 2>

## Phases (sub-issues)

* **P0** <issue link> — <label>
* **P1** <issue link> — <label>
…

Stack skeleton: one branch + one PR per phase, daisy-chained on `dev` per repo GitHub stack convention.

## Depends on

* <dependency> — **landed** | **in review** | blocked

## Non-goals (v1)

* <item>
```

Fields (adjust per clarification answers):

- `team`: `Muse`
- `project`: e.g. `Audio Engine & Instruments`
- `priority`: 1–4
- `assignee`: `me` or named user
- `links`: `[{ "url": "<plan github url>", "title": "<FEATURE>.md" }]`

After sub-issues exist, edit epic description to insert real issue links.

---

## Phase sub-issue

```markdown
Title: <Feature> P{n} — <short label>

Description:
Phase {n} of [<FEATURE>.md](https://github.com/muse-art/muse-monorepo/blob/main/work/planning/<FEATURE>.md) (§6, §<relevant>).

## Scope

* <bullet from plan phase row>
* <bullet>

## Acceptance criteria

* <from success criteria column>
* Tests / type-check green for touched packages

## Out of scope

* <explicit exclusions for this phase>

## Gate (if any)

<Blocked until … merges into dev. Do not work around.>
```

Fields:

- `parentId`: epic identifier (e.g. `MUSE-537`)
- `team`: `Muse`
- `project`: same as epic
- `priority`: usually same or step down for follow-ons
- `estimate`: story points if user provided
- `blockedBy`: `["MUSE-XXX"]` when gated
- `assignee`: same as epic unless specified

Title pattern: `{Feature short name} P{n} — {Label}`  
Example: `Audio Tracks P0 — Track kind + data contract`

Linear auto-suggests `gitBranchName` like `jake/muse-614-audio-tracks-p0-track-kind-data-contract` — use these for GitHub stack scaffold.

---

## Follow-on phase (planned, not v1)

Same as sub-issue but:

- Lower priority (often `4` Low)
- Description notes: "Intentionally last; may be re-planned after v1 ships"
- Still scaffold PR if user wants stack tip placeholder
