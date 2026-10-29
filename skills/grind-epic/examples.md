# Examples

## Plan → entire epic

User: `/grind-epic MUSE-537`

The approved Audio Tracks plan and issues exist; no feature code or PR scaffold exists yet. The orchestrator reads the plan, MUSE-537, and its phase issues. P0–P5 are in scope; recording P6 is a follow-on.

1. Record phase dependencies, acceptance gates, and branches in `tmp/orchestration/MUSE-537.md` (local, ignored). Resolve trunk from repo instructions.
2. Create/reuse P0's branch, dispatch an implementation worker, and collect its terminal handoff. Inspect the implementation and run the scoped acceptance checks.
3. Run thermos once on P0. If it finds MAJOR issues, send them to a fix worker, collect its handoff, verify, then use one fresh reviewer. Repeat until clean.
4. Restack descendants, verify affected integration, mark P0's PR ready, update its issue, and comment on the parent. Continue P1–P5 in dependency order.
5. Check upstream merge gates before dependent phases; do not invent stubs to bypass them. Leave P6 unimplemented, restacking its placeholder if present.
6. Run epic acceptance checks and a fresh cumulative integration review from trunk to the P5 tip. Fix and re-review integration findings before reporting the epic merge-ready. Do not merge.

An empty starting diff is expected; reviewing it as CLEAN would not satisfy this request.

## Resume a partially built epic

User: `/grind-epic MUSE-537 — resume`

P0 has acceptance and clean-review evidence at its current SHA. P1 is half-built; P2–P5 are untouched. Reuse P0, reconcile P1's actual diff with its acceptance criteria, finish P1 with an implementation worker, then run its review loop. Continue through P5 and the cumulative integration gate. Do not stop because the existing P1 diff becomes clean while later phases remain unbuilt.

## Existing PR, review/fix only

User: `/grind-epic pr 188 -> main — review/fix only`

State the limited scope, pin PR #188's head and base, and infer scoped verification from the changed packages. Run one initial thermos audit, then fix → verification → single-pass re-review cycles until clean. Preserve an already-ready PR's status. Report the reviewed diff and checks without claiming completion of an associated epic.

## Planning handoff

User: `/plan-epic Audio Tracks`

Use ask-me to resolve the decision frontier and confirm shared understanding, then draft and obtain approval for the plan and issue set. Save the approved Linear artifacts, optionally scaffold the stack, and hand off `/grind-epic MUSE-537` to implement and review the entire in-scope epic. Planning does not implement phases.
