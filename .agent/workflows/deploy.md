---
description: How to deploy changes to production (ag-new-concept)
---

# Deployment Workflow

**Rule**: Do not auto-push to dev branches. Accumulate commits locally.

1. **Verify**: Ensure `npm run typecheck` and tests pass.
2. **Commit**: Commit changes to your current dev branch (e.g., `ag-v1.25-dev`).
3. **Wait**: Do NOT push yet. Wait for user instruction to "deploy" or "push".
4. **Merge & Push**:
   ```bash
   git checkout ag-new-concept
   git pull origin ag-new-concept
   git merge <dev-branch>
   git push origin ag-new-concept
   git checkout <dev-branch>
   ```
5. **Notify**: Inform user that deployment is triggered.
