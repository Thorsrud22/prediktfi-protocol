# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] - 2026-02-04

### Added
-   **Security**: Added `/.well-known/security.txt` for vulnerability disclosure.
-   **Sitemap**: Added dynamic sitemap entries for pricing, legal, and share pages.
-   **Share UX**: Added "Copy Link" features to evaluation reports.

### Changed
-   **SEO**: Fixed canonical tags to stick to `https://prediktfi.xyz` and removed localhost defaults.
-   **UX**: Updated PDF Download button to "Print / Save PDF" for clarity.
-   **Accessibility**: Added missing `aria` labels and IDs to Studio forms.
-   **Account**: Disabled "Email Login" button with "Coming Soon" label.
-   **Legal**: Consolidated `/policy` into `/legal/privacy` and added redirects.
-   **Security**: Hardened CSP to block `unsafe-eval` in production.
