# Examples

## MUSE-537 — Audio Track Support

Orchestrator launch prompt (filled):

```markdown
You are the orchestrator for **MUSE-537** (Audio Track Support).

Follow the `orchestrate-phased-feature` skill.

## Ground truth
- Parent: MUSE-537 — https://linear.app/muse-art/issue/MUSE-537
- Plan: `work/planning/AUDIO_TRACKS.md`
- Phases:
  | Phase | Sub-issue | PR | Branch |
  |-------|-----------|-----|--------|
  | P0 | MUSE-614 | #137 | `jake/muse-614-audio-tracks-p0-track-kind-data-contract` (base `dev`; includes hardened plan docs) |
  | P1 | MUSE-615 | #138 | `jake/muse-615-audio-tracks-p1-import-persistence` |
  | P2 | MUSE-616 | #139 | `jake/muse-616-audio-tracks-p2-engine-region-playback` |
  | P3 | MUSE-617 | #140 | `jake/muse-617-audio-tracks-p3-waveform-ui-trim` |
  | P4 | MUSE-618 | #141 | `jake/muse-618-audio-tracks-p4-mixer-export-parity` |
  | P5 | MUSE-619 | #142 | `jake/muse-619-audio-tracks-p5-agent-tools-docs` |
- Out of scope: P6 MUSE-620 — leave PR #143 / `jake/muse-620-audio-tracks-p6-recording` as restacked placeholder only
- Gates: P2 requires host-owned PlaybackPlan / event-lane stack merged into `dev`; no parallel scheduler workaround

Grind P0–P5 to merge-ready. Do not merge.
```

### What worked

- Parent Grok 4.5 High orchestrator spawned separate implement + thermos review subagents per phase.
- Scaffold stack (#137–#143) avoided branch/PR setup churn; PRs renamed when phases started.
- Orchestrator verified test output and diffs instead of trusting subagent "done" claims.
- P6 left untouched at stack tip, restacked as lower phases landed.

### Orchestration log path

`work/MUSE-537-orchestration.md`
