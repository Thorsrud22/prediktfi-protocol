---
description: Standard mission flow for PrediktFi (plan, small changes, run tests, git status, summary).
---

You are working in the repo prediktfi-protocol-1 on branch ag-new-concept.

For the mission I am about to describe, follow this procedure:

1. Restate the mission in 2–3 short sentences so it is clear what you will do.
2. Propose a small ordered plan of steps.
3. Execute the plan with minimal, focused changes. Prefer editing existing structures instead of adding new abstractions.
4. After making changes, run:
   - npm run typecheck
   - npm test
5. Summarize what changed:
   - files touched
   - important logic or type updates
   - any new fields or scoring rules
6. Show git status and propose the exact git add and git commit commands I should run.

You are allowed to adjust or improve my initial mission if you are highly confident it is a clear improvement, but always keep tests passing and avoid unnecessary complexity.
