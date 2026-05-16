---
description: Lighter human-touch final pass — runs after /verify
---

Execute the /review command defined in .sdd/workflow.md.

The spec name is whatever you typed after the command (e.g. `/review auth-refresh`).

Read the implementation qualitatively: clarity, naming, simplicity, leaky abstractions, copy-paste smell, comments that lie. Note minor follow-ups; don't enforce mechanical checks (that's /verify's job). If a structural issue is found, escalate to /spec-amend.
