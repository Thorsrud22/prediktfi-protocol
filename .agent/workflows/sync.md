---
description: Sync local workspace to canonical remote state before starting work
---

# Sync Workspace

Always use `/Users/thorsrud/prediktfi-protocol-1`. No other clones.

// turbo-all

1. Fetch latest from origin:
```bash
git fetch origin
```

2. Checkout and hard-reset to remote `ag-new-concept`:
```bash
git checkout ag-new-concept
git reset --hard origin/ag-new-concept
```

3. Verify correct Vercel project:
```bash
cat .vercel/project.json
```
Expected: `prediktfi-protocol`

4. Start local dev server:
```bash
npm run dev -p 3000
```

5. Deploy (push only, no merge to main):
```bash
git push origin ag-new-concept
```

## Rules
- **Production branch is `ag-new-concept`**, not `main`.
- **Do NOT merge to `main`** unless the user explicitly asks.
- **Do NOT use any other local clone** besides `/Users/thorsrud/prediktfi-protocol-1`.
