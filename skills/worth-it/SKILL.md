---
name: worth-it
description: Weigh the value of each review finding against the effort to fix it. Use when the user invokes /worth-it or asks to triage review findings, decide which to fix, or skip minor issues.
disable-model-invocation: true
---

# Worth It

Every finding has a value and an effort, and we fix the ones where value wins. Value is how likely the issue is to come up and how much it hurts when it does. Effort is the size of the change, the risk it adds, and the review churn it causes. It's fine to leave a verified issue unfixed if it is minor and rarely hit. Being real isn't enough to earn a fix. When you skip one, say so in a line with the reason, so the choice is visible and can be revisited.
