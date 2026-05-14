---
description: Cross-consistency analysis (goal-task coverage, plan-task coverage, scope creep)
mode: agent
---

Execute the /spec-analyze command defined in .sdd/workflow.md.

Check: every G-ID referenced by at least one task; every "Components Affected" entry referenced by at least one task; any task lacking a goal reference (scope creep). Write specs/${input:specName}/analysis.md.
