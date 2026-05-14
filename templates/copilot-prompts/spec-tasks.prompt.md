---
description: Execute approved plan one task at a time, TDD-first; snapshot first
mode: agent
---

Execute the /spec-tasks command defined in .sdd/workflow.md.

First action: invoke `sddx-workflow snapshot ${input:specName}` to capture the approved spec state. If the CLI is unavailable, skip silently.

Then read the approved specs/${input:specName}/2-plan.md and execute tasks one at a time. Write the test first (red), implement until green, run the full suite, then move to the next task.

If a task is blocked by ambiguity, contradiction, or technical impossibility, STOP and run /impl-gap — never improvise. If the gap requires changing the spec, escalate to /spec-amend.
