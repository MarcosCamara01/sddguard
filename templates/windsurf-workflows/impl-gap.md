---
description: Stop and report when a task is blocked by ambiguity or impossibility
---

Execute the /impl-gap command defined in .sdd/workflow.md.

The spec name is whatever you typed after the command (e.g. `/impl-gap auth-refresh`).

STOP execution. Append a GAP entry to specs/<spec>/impl-gaps.md with current task, problem, impact, proposed resolution, and action required. Wait for human direction. If the gap requires changing the spec, escalate to /spec-amend.
