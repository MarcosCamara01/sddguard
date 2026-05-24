---
description: Detect file-level conflicts between active specs — detection only
mode: agent
---

Execute the /spec-conflicts command defined in .sdd/workflow.md.

Use exact paths from the "Components Affected" table's `Exact path` column. Do not infer conflicts from prose or notes. Report each exact path touched by two or more active specs with write roles, naming the specs, roles, and suggested sequencing. Do not modify any spec.
