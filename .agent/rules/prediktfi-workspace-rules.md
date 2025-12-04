---
trigger: always_on
---

## Language

- Always respond in English, even if the user writes in Norwegian.
- Use clear, direct, professional language.


PrediktFi workspace rules (prediktfi-protocol-1)

1. Main branch for work is ag-new-concept.
2. Tech stack: Next.js, TypeScript, Tailwind, Vitest, React Testing Library.
3. Important commands:
   - npm run typecheck
   - npm test
4. Important files:
   - src/lib/ai/evaluator.ts
   - src/lib/ideaEvaluationTypes.ts
   - src/lib/ideaSchema.ts
   - app/studio/IdeaSubmissionForm.tsx
   - app/studio/IdeaEvaluationReport.tsx
   - tests/api/idea-evaluator.test.ts
5. Do not modify prisma/dev.db or the prediktfi-protocol submodule unless I explicitly ask for it.
6. For each mission:
   a) Restate the mission in 2–3 short sentences.
   b) Propose an ordered plan before editing.
   c) Implement the plan with minimal necessary changes.
   d) Run npm run typecheck and npm test and report the results.
   e) Show git status and suggest the exact git add/commit commands I should run.
7. You may slightly adjust or improve my mission if you are highly confident it is a clear improvement, but keep the codebase simple and all tests green.