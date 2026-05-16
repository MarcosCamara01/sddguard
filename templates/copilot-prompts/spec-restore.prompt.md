---
description: Restore a spec folder from a snapshot in .sdd/snapshots/
mode: agent
---

Execute the /spec-restore command defined in .sdd/workflow.md.

Usage: /spec-restore ${input:specName} ${input:timestamp}

If no timestamp is supplied, list available timestamps. Confirm the target with the user before overwriting, then copy the snapshot files over specs/${input:specName}/1-requirements.md, 2-plan.md, 3-tasks.md. Report what was restored and what was lost.
