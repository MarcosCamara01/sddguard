---
description: Reproduce → diagnose → fix → validate
---

Execute the /bugfix command defined in .sdd/workflow.md.

The bug or error is whatever you described after the command.

Follow the stages in order without skipping: Reproduce → Diagnose → Fix → Validate.
Stop after Reproduce if the bug cannot be confirmed with a test or repro case.
Escalate to /spec-new if the fix scope exceeds ~1 file or ~50 lines.
