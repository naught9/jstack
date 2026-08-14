# Examples

## MUSE-537 — Audio Track Support (epic review grind)

Orchestrator launch prompt (filled):

```markdown
You are the epic review orchestrator for **MUSE-537** (Audio Track Support) in muse-monorepo.
You do not implement fixes yourself — you spawn subagents to review and fix, verify outcomes yourself, and grind until the entire epic diff is thermo-clean and test-green.

Follow the `grind-epic` skill.

## Mission
Conduct repeated deep thermo-nuclear reviews → fix → re-review cycles on the full stacked epic (P0–P6), scoped as:

```bash
git diff origin/dev...origin/jake/muse-620-audio-tracks-p6-recording
```

**Definition of done:** zero BLOCKER/MAJOR findings from thermo review, scoped test/type-check gates green, orchestration log updated, all PRs in the stack remain ready for review (not draft). Do not merge anything.

## Ground truth

| Resource | Location |
|----------|----------|
| Parent issue | MUSE-537 |
| Plan of record | `work/planning/AUDIO_TRACKS.md` |
| Orchestration log | `work/active/MUSE-537_ORCHESTRATION_LOG.md` |
| Epic tip branch | `jake/muse-620-audio-tracks-p6-recording` |
| Trunk | `dev` |

### GitHub stack (daisy-chained)

| Phase | Issue | Branch | PR |
|-------|-------|--------|-----|
| P0 | MUSE-614 | `jake/muse-614-audio-tracks-p0-track-kind-data-contract` | #137 |
| P1 | MUSE-615 | `jake/muse-615-audio-tracks-p1-import-persistence` | #138 |
| P2 | MUSE-616 | `jake/muse-616-audio-tracks-p2-engine-region-playback` | #139 |
| P3 | MUSE-617 | `jake/muse-617-audio-tracks-p3-waveform-ui-trim` | #140 |
| P4 | MUSE-618 | `jake/muse-618-audio-tracks-p4-mixer-export-parity` | #141 |
| P5 | MUSE-619 | `jake/muse-619-audio-tracks-p5-agent-tools-docs` | #142 |
| P6 | MUSE-620 | `jake/muse-620-audio-tracks-p6-recording` | #143 |

Epic scope: ~101 files, ~8k insertions vs dev (22 commits on stack tip).

## Plan sections to read
- Quality bar: `work/planning/AUDIO_TRACKS.md` §3.5
- Phase boundaries: `work/planning/AUDIO_TRACKS.md` §6

## Prior known risks
From orchestration log: migration RPC parity, offline SRC, cpal formats, peak cache, alignment semantics.

## Regression checklist

| Phase | Commit | What to re-check |
|-------|--------|------------------|
| P0 | 3a0cef86 | migration pg_get_functiondef anchor scoping |
| P1 | 146bdc18 | Electron FileFilter readonly |
| P2 | 2b4220dc | offline SRC on cache miss, buffer_slot full scan, rubato delay trim |
| P6 | 96eeaed8 | cpal F32/I16/U16 input formats |

## Parallel review splits

| Subagent | Focus |
|----------|-------|
| A | Supabase migration + RPC (`supabase/migrations/20260704120000_agent_track_kind.sql`) |
| B | project-ops + midi-types + muse-api contract |
| C | packages/agent client plumbing (adapter, store, import, waveform, recording) |
| D | Rust engine + sidecar (playback plan, region_player, SRC, offline render, input_capture) |
| E | Desktop main/preload IPC (import, recording, asset paths, sidecar bridge) |
| F | Agent tools + docs (ChatController, prompts, clip-arrangement.md, agent-manual.md) |

## Verification commands

```bash
pnpm --filter @muse/project-ops test
pnpm --filter @muse/agent type-check
pnpm --filter muse-desktop type-check
pnpm --filter muse-api type-check

cd apps/muse-desktop/native/muse-audio-host && cargo test -- --test-threads=1
cd packages/agent/native/muse-audio-engine && cargo test

pnpm --filter @muse/agent exec vitest run \
  src/agent/sync/__tests__/engineSnapshotAdapter.test.ts \
  src/agent/audio/__tests__/buildAudioTrimOps.test.ts \
  src/agent/audio/__tests__/resamplePeaks.test.ts \
  src/agent/recording/__tests__/audioRecordingAlignment.test.ts \
  src/agent/chat/__tests__/toolPayloads.test.ts \
  src/agent/__tests__/agent-tool-schemas.test.ts \
  src/agent/__tests__/agent-prompt-audio-tracks.test.ts

pnpm --filter @muse/agent exec vitest run \
  src/agent/audio-engine/__tests__/buildPlaybackPlanAudioRegions.test.ts
```

Migration smoke test if SQL changed: reconstruct base + apply `20260704120000_agent_track_kind.sql`.

## Pre-existing flakes

- `chat-title-service.test.ts` LLM mock
- `tempo_sync_lfo` under parallel cargo test
- Sidecar `open_device` / real mic tests in cloud VM (no sound card)

## Thermo rubric focus areas

| Area | What to hunt |
|------|--------------|
| Correctness | Reducer/RPC parity gaps; client asset/trackKind drops; beat→seconds math; clip invariants |
| Engine quality | Region player bit-transparency; declick ramps; rubato SRC delay/flush; offline export rate parity; buffer slot leaks |
| Security | Path traversal in import/recording/offline roots; IPC trust boundaries; temp file lifecycle |
| Breaking changes | Existing MIDI projects default midi; migration backfill safety |
| Scope | No punch/comping/input monitoring in P6; no parallel scheduler; no renderer mediaDevices |
| Tests | Golden WAV / alignment tests; migration apply; format matrix; missing gates for new behavior |
| Devex | Type-check failures; flaky tests introduced by epic |

Grind until CLEAN. Do not merge.
```

### What worked

- Parent orchestrator never implemented fixes; separate thermo review + fix subagents each iteration.
- Cumulative epic diff as authoritative review surface; fixes attributed to correct phase branch when needed.
- Parallel subsystem review splits for ~8k-line diffs; merged and deduped before fix batching.
- Orchestrator ran verification commands after every fix push instead of trusting subagent claims.
- Regression checklist prevented reintroduction of already-fixed phase bugs.
