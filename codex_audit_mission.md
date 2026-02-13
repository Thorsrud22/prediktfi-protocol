# Mission: Comprehensive Website Audit & Bug Hunt

**Role:** You are acting as a meticulous QA Engineer and UI/UX Designer.
**Target:** Local environment running at `http://localhost:3000`.
**Constraint:** READ-ONLY. Do not fix anything yet. Report findings first.

## Objective
Go through every page on the website. Look for bugs, console errors, broken links, UI glitches, and UX improvements.

## Rules of Engagement
1.  **Console Check:** On every page, open the developer console. Look for red errors (Exceptions, 404s) and yellow warnings (Hydration mismatches, unique key props).
2.  **Visual Check:** Look for broken images, misaligned text, weird spacing, or elements that look "off" on both Desktop and Mobile sizes.
3.  **Functional Check:** Click main buttons to ensure they don't crash the app. Form inputs should be type-able.
4.  **No Fixes Yet:** Compile a list of issues. Do not apply fixes until I review the list.

## Route Checklist
Please visit and inspect the following specific routes:

### Public Pages
- [ ] **Home / Landing Page**: `http://localhost:3000/`
- [ ] **Pricing**: `http://localhost:3000/pricing`
- [ ] **About**: `http://localhost:3000/about`
- [ ] **Methodology**: `http://localhost:3000/methodology`
- [ ] **Quality Framework**: `http://localhost:3000/quality`
- [ ] **Transparency**: `http://localhost:3000/transparency`
- [ ] **Changelog**: `http://localhost:3000/changelog`

### Legal
- [ ] **Terms**: `http://localhost:3000/legal/terms`
- [ ] **Privacy**: `http://localhost:3000/legal/privacy`

### Application (The Studio)
- [ ] **Studio Main**: `http://localhost:3000/studio`
  - *Note: Check the "Idea Submission" form UI.*

### Protected / Account (Verify Redirects or Access)
- [ ] **Account Pages**: `http://localhost:3000/account`
- [ ] **Billing**: `http://localhost:3000/billing`
- [ ] **Admin**: `http://localhost:3000/admin`

## Deliverable
Output a **Markdown Report** with the following sections:

### 🚨 Critical Issues
- App crashes, 500 errors, or broken core flows.
- Console errors that indicate logic failure.

### ⚠️ Functional Bugs
- Broken links, buttons that do nothing.
- Forms that don't validate or submit (if testing submission).

### 🎨 UI/UX Polish
- Spacing issues, font inconsistencies.
- Mobile responsiveness problems.
- "Weird" behavior that feels unpolished.

---
**Ready? Start with the Home Page.**
