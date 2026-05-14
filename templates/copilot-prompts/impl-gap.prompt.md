---
description: Stop and report when a task is blocked by ambiguity or impossibility
mode: agent
---

Execute the /impl-gap command defined in .sdd/workflow.md.

STOP execution. Append a GAP entry to specs/${input:specName}/impl-gaps.md with current task, problem, impact, proposed resolution, and action required. Wait for human direction. If the gap requires changing the spec, escalate to /spec-amend.
