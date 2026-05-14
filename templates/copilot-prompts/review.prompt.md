---
description: Lighter human-touch final pass — runs after /verify
mode: agent
---

Execute the /review command defined in .sdd/workflow.md.

Read the implementation qualitatively: clarity, naming, simplicity, leaky abstractions, copy-paste smell, comments that lie. Note minor follow-ups; don't enforce mechanical checks (that's /verify's job). If a structural issue is found, escalate to /spec-amend.

Spec: ${input:specName}
