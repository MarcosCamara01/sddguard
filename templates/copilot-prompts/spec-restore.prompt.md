---
description: Restore a spec folder from a snapshot in .sdd/snapshots/
mode: agent
---

Execute the /spec-restore command defined in .sdd/workflow.md.

List available timestamps for the feature, confirm the target with the user, then copy the snapshot files over specs/${input:specName}/1-requirements.md, 2-plan.md, 3-tasks.md. Report what was restored and what was lost.
