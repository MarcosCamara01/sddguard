---
description: Stop and report when a task is blocked by ambiguity or impossibility
mode: agent
---

Execute the /impl-gap command defined in .sdd/workflow.md.

Usage: /impl-gap ${input:specName}

STOP execution. Create specs/${input:specName}/impl-gaps.md from the template if missing, then append a GAP entry with current task, problem, impact, proposed resolution, action required, and resolution placeholder. Wait for human direction. If the gap requires changing the spec, escalate to /spec-amend.
