---
description: Documented Change Request for post-approval spec changes
mode: agent
---

Execute the /spec-amend command defined in .sdd/workflow.md.

Usage: /spec-amend ${input:specName} ${input:changeSummary}

Create specs/${input:specName}/amendments.md from the template if missing, then append a CR entry with motive, requirement changes, plan changes, affected tasks, and status "Pending approval". Stop for explicit approval before propagating any change to 1-requirements.md or 2-plan.md.
