---
description: IMPORTANT
---

# Global Coding Workflow (Antigravity)

## 0) Non-negotiables
1) Be honest about what you did. Never claim you ran tests, checked files, or verified behavior unless you actually did.
2) Minimize blast radius. Do not change unrelated logic, formatting, or files “while you’re here”.
3) Keep the project in a working state. At every checkpoint, tests should be green (or return to last green state).

## 1) Plan first (before editing code)
1) Write a short plan (in the chat output) before coding:
   a) Goal (what “done” means)
   b) Non-goals (explicit)
   c) Steps (small, ordered)
   d) Risks or unknowns
   e) Later list (ideas to park, not implement)
2) You may adjust and improve the plan only if you are highly confident it is a clear improvement, and only if it keeps tests green and avoids unnecessary complexity.

## 2) Scope control
1) Implement only what is required for the goal.
2) If you see extra improvements, add them to Later and do not implement them unless asked.

## 3) Incremental implementation
1) Work step by step, not in one huge change.
2) After each step:
   a) Ensure the app builds
   b) Run the most relevant checks
   c) Only then proceed

## 4) Git discipline (no “layered mess”)
1) Commit after each completed step that is verified working.
2) If you get stuck or a fix attempt fails:
   a) Do not stack more patches on top of a broken state
   b) Reset or revert back to the last known good (green) commit
   c) Re-implement the fix cleanly from that clean base
3) If a change requires multiple attempts, prefer “one clean implementation” over “many incremental hacks”.

## 5) Testing is a gate
1) Before moving to the next step, run the repo’s standard checks (use what exists in package.json scripts).
2) Prioritize higher-level coverage where available:
   a) Typecheck and build
   b) Integration or e2e tests
   c) Unit tests
3) If tests fail:
   a) Fix immediately, or
   b) Return to last green commit and re-implement cleanly

## 6) Effective debugging loop
1) Start with the exact error message and the minimal reproduction.
2) Analyze likely causes before changing code.
3) Add small, targeted logging only where it reduces uncertainty.
4) If a fix attempt does not work, reset to last green and try a cleaner approach.

## 7) Complex features (prototype-first)
1) For complex features, build a small standalone prototype or minimal isolated implementation first.
2) Once validated, port the clean solution into the main codebase with minimal edits.
3) Keep external APIs stable unless the task explicitly requires breaking changes.

## 8) Codebase hygiene
1) Prefer small, modular files and functions.
2) Avoid giant files and giant refactors.
3) Do not introduce new dependencies unless clearly justified by the goal.

## 9) Communication format (keep it short and useful)
After work is done, respond with:
1) What changed (high level)
2) What you validated (exact commands or checks you actually ran)
3) Any risks or follow-ups (if needed)
4) Later list (only if relevant)