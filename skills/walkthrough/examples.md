# Walkthrough examples

Target density and tone. Do not copy these files into a real tour.

Read this as the output contract: overview → review focuses → themed stops (stats, watch-outs, a focused hunk, a visual when control flow is the point) → tests rollup → leftover plumbing.

## Full tour (stacked-PR-shaped)

### Overview

Submitting from the empty composer raced project activation: `setProject` flipped bootstrap to loading (hiding the empty composer) before send finished, and the new project reloaded composition settings from defaults — snapping the model back to the fallback.

This change keeps the empty-composer → bootstrap → send contract intact by stashing the prompt, ensuring a chat exists on an already-active project, carrying `selectedModel` into the new project (including when `projectId` is still null), and seeding a user message in `ask()` when the optimistic `messageId` never landed. Scope is `packages/agent` only.

### Review focuses

- **No double-send:** auto-send must no-op when a message already exists, a send already happened, or the chat is not ready; failed handoff must clear the stash and keep the textarea.
- **Model carry:** empty-composer selection should win on new project load without clobbering unrelated composition fields.
- **ask() seeding:** seed only when the message is missing and there is no prepared run — cold-start always passes `messageId`, so this is the “optimistic row never landed” path.

### Pending prompt handoff

#### Stash before bootstrap

1 file · +13 −5

`submitPrompt` now stashes the trimmed prompt into `pendingPrompt` before `ensureProject` when there is no `currentChatId`, so `AgentChatSurface` can finish the send if this view unmounts mid-bootstrap. On failure it clears the stash; on success it returns true so the manual textarea only clears after a real handoff.

**Watch:** stash only when no chat — once a chat exists, send stays on the normal path.
**Confirm:** failed bootstrap/send leaves the typed prompt in the box.

`packages/agent/src/agent/chat/components/EmptyComposerView.tsx`

```diff
-  const submitPrompt = useCallback(async (prompt: string) => {
+  const submitPrompt = useCallback(async (prompt: string): Promise<boolean> => {
     const trimmed = prompt.trim()
-    if (!trimmed) return
+    if (!trimmed) return false
     const optimisticMessageId = `bootstrap-user-${crypto.randomUUID?.() ?? Date.now()}`
+    if (!useAgentStore.getState().currentChatId) {
+      onSetPendingPrompt?.(trimmed)
+    }
     try {
       await onSendPrompt(trimmed, { messageId: optimisticMessageId })
+      return true
     } catch (error) {
       onRemoveOptimisticPrompt?.(optimisticMessageId)
+      onClearPendingPrompt?.()
+      return false
     }
```

```diff
-    await submitPrompt(manualPrompt)
-    setManualPrompt('')
+    const handedOff = await submitPrompt(manualPrompt)
+    if (handedOff) setManualPrompt('')
```

### Auto-send when ready

#### Gate the post-bootstrap effect

1 file · +33 −6

`shouldAutoSendPendingPrompt` is the gate: chat bound, not loading/streaming, empty transcript, non-blank prompt, and not already sent. If messages show up while a pending prompt is still set, the effect clears the stash instead of sending again.

```text
EmptyComposer submit
  stash pendingPrompt
  ensureProject / setProject
    Composer still mounted? → send in EmptyComposer
    else AgentChatSurface ready
      shouldAutoSendPendingPrompt?
        yes → auto-send once
        messages already there → clear pendingPrompt
```

**Confirm:** auto-send no-ops when `alreadySent`, `messageCount > 0`, or chat is not ready.

### Tests

5 files · +217

Covers the auto-send gate, `ensureActiveProjectChat` early return, model carry helpers, settings-without-project writes, and `shouldSeedUserMessageForAsk`.

### Leftover plumbing

3 files · +7 −1

Threads `onSetPendingPrompt` from `AgentExperience` → `AgentPage` → `EmptyComposerView`. No behavior beyond plumbing.

## Stop that needs a shape diff, not a code dump

When the interesting change is structure, show the tree/call-shape diff and keep the hunk tiny:

```diff
 src/agent/
 ├── chat/
+│   └── pendingPrompt.ts
 └── state/
-    └── projectSlice.ts
+    └── slices/
+        └── projectSlice.ts
```

## Stop that should stay compact

Mechanical wiring does not get a mermaid diagram or a full function paste. Stats, one sentence, done.
