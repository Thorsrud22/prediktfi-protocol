# Security Configuration

This document outlines the security headers and Content Security Policy (CSP) implementation for the Predikt platform.

## Security Headers

We use a comprehensive set of security headers to protect against common web vulnerabilities like XSS, Clickjacking, and MIME-sniffing. These are managed in `lib/security/headers.ts` and applied via `middleware.ts`.

| Header | Value | Purpose |
|--------|-------|---------|
| `Content-Security-Policy` | Dynamic (Nonce-based) | Prevents XSS and unauthorized resource loading. |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` | Enforces HTTPS connections. |
| `X-Frame-Options` | `DENY` | Prevents Clickjacking by disallowing framing. |
| `X-Content-Type-Options` | `nosniff` | Prevents browser MIME-sniffing. |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Controls how much referrer information is shared. |
| `Permissions-Policy` | `camera=(), microphone=(), ...` | Disables access to unused browser features. |
| `Cross-Origin-Opener-Policy`| `same-origin` | Isolates the browsing context to prevent cross-origin attacks. |
| `Cross-Origin-Embedder-Policy`| `credentialless` | Allows loading cross-origin resources without credentials. |

## Content Security Policy (CSP)

Our CSP is dynamic and uses a **cryptographic nonce** for inline scripts to ensure only trusted scripts are executed.

### Allowed Sources

- **Scripts**: Self, Vercel Live, PostHog, and nonce-based inline scripts.
- **Images**: Self, Data URIs, Blob URIs, Dicebear, Vercel, and PostHog.
- **Connect**: Self, CoinGecko, CoinCap, Vercel Live, and PostHog.
- **Fonts**: Self, Google Fonts (Gstatic).
- **Styles**: Self, Inline styles (required for Tailwind/styled-components), and Google Fonts.

### Special Configurations

- **strict-dynamic**: Used in production to allow trusted scripts to load their own dependencies.
- **frame-ancestors 'none'**: Complementary to `X-Frame-Options: DENY`.
- **object-src 'none'**: Disallows plugins like Flash.

## Implementation Details

1. **Nonce Generation**: A unique nonce is generated for every request in `middleware.ts`.
2. **Context Injection**: The nonce is passed to `RootLayout` via request headers to be included in `<script>` tags.
3. **Response Header**: The `Content-Security-Policy` header is then set on the response with the same nonce.
