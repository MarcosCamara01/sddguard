---
description: Targeted exploration with non-binding artifact — separates exploration from commitment
mode: agent
---

Execute the /research command defined in .sdd/workflow.md.

Usage: /research ${input:specName} ${input:topic}

Investigate options for the topic. Read specs/${input:specName}/1-requirements.md and write specs/${input:specName}/research-${input:topic}.md with options, pros/cons, current versions/maintenance status, and a non-binding recommendation. Do NOT modify 2-plan.md.
