---
description: Lighter human-touch final pass — writes review-report.md
mode: agent
---

Execute the /review command defined in .sdd/workflow.md.

Read the implementation qualitatively: clarity, naming, simplicity, leaky abstractions, copy-paste smell, comments that lie. Write specs/${input:specName}/review-report.md with findings, follow-ups, or escalation. Don't enforce mechanical checks (that's /verify's job). If a structural issue is found, record `Result: ESCALATED` and escalate to /spec-amend.

Spec: ${input:specName}
