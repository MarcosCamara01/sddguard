---
description: Lighter human-touch final pass — writes review-report.md
---

Execute the /review command defined in .sdd/workflow.md.

The spec name is whatever you typed after the command (e.g. `/review auth-refresh`).

Read the implementation qualitatively: clarity, naming, simplicity, leaky abstractions, copy-paste smell, comments that lie. Write specs/<spec>/review-report.md with findings, follow-ups, or escalation. Don't enforce mechanical checks (that's /verify's job). If a structural issue is found, record `Result: ESCALATED` and escalate to /spec-amend.
