# Agent Rules & Anti-Patterns

Derived from historical feedback ("The Table").

## 🚨 Critical Rules
1.  **Testing**: Always use `vitest` (via `npm test`). NEVER convert to `bun:test`.
2.  **Verification**: NEVER use `--no-verify`. Always run hooks.
3.  **Dependencies**: Respect existing versions.
    *   AI SDK: Check version (v5 vs v6) before using specific imports.
    *   Do not add `.js` extensions blindly (breaks Turbopack).
4.  **Environment**:
    *   Use `echo -n` for env vars to avoid newlines.
    *   Apps don't share root `.env`. Configure DB locally.
5.  **Architecture**:
    *   **Serverless**: No singleton state or heavy class instantiations at global scope in serverless/edge functions (Item #10).
    *   **Refunding**: Do not execute refunds directly.
    *   **Database**: `DATABASE_URL` is required; do not skip build checks by removing it.

## 🧠 Mindset
- **Own the Repo**: Do not blame "pre-existing errors". Fix them or work around them intelligently.
- **Institutional Degen**: Professional, high-signal, but aligned with the culture.
