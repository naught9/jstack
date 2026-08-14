# Examples

## MUSE-537 — Audio Track Support

### Clarification rounds (illustrative)

**Round A — before draft:**

- Separate `midi` / `audio` track kinds vs hybrid lanes? → separate for v1
- Tempo stretch in v1? → no; native-speed playback
- Recording in v1? → follow-on P6
- P2 gate? → host-owned PlaybackPlan must merge first
- Scaffold full stack including P6 placeholder? → yes

**Round B — plan approval:**

- Approve `work/planning/AUDIO_TRACKS.md` as plan of record? → yes

**Round C — Linear:**

- Project: Audio Engine & Instruments; assignee: me; estimates per phase → confirmed

### Artifacts produced

| Artifact | Result |
|----------|--------|
| Plan | `work/planning/AUDIO_TRACKS.md` — hardened 2026-07-03 |
| Epic | MUSE-537 |
| Sub-issues | MUSE-614 (P0) … MUSE-620 (P6 follow-on) |
| Stack | PRs #137–#143, branches `jake/muse-614-…` through `jake/muse-620-…` |

### Stack mapping (for orchestrator handoff)

| Phase | Issue | PR | Branch |
|-------|-------|-----|--------|
| P0 | MUSE-614 | #137 | `jake/muse-614-audio-tracks-p0-track-kind-data-contract` |
| P1 | MUSE-615 | #138 | `jake/muse-615-audio-tracks-p1-import-persistence` |
| P2 | MUSE-616 | #139 | `jake/muse-616-audio-tracks-p2-engine-region-playback` |
| P3 | MUSE-617 | #140 | `jake/muse-617-audio-tracks-p3-waveform-ui-trim` |
| P4 | MUSE-618 | #141 | `jake/muse-618-audio-tracks-p4-mixer-export-parity` |
| P5 | MUSE-619 | #142 | `jake/muse-619-audio-tracks-p5-agent-tools-docs` |
| P6 | MUSE-620 | #143 | `jake/muse-620-audio-tracks-p6-recording` (placeholder only) |

### Launch prompt for planning skill

```markdown
Plan a new phased feature using the `plan-epic` skill.

Feature: <describe>
Starting context: <links, constraints>
I already have a rough idea of phases: <optional>

Ask structured clarifying questions before finalizing the plan or Linear issues.
Scaffold GitHub stack: yes/no
```

### Next step

```markdown
Orchestrate MUSE-537 using the `build-epic` skill.
```
