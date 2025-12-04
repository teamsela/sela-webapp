# Syntax UI behavioral test harness

This folder holds Playwright-based behavioral tests to prove syntax label chips reflect user recoloring.

## Setup
1) Install dev deps:
   - `npm i -D @playwright/test playwright`
   - `npx playwright install --with-deps`
2) Ensure the app is running locally (or set `BASE_URL`):
   - `npm run dev` (default: http://localhost:3000)

## Running
- `npx playwright test tests/syntax`
- Optional: `BASE_URL=http://localhost:3000 npx playwright test tests/syntax`

## Notes
- Tests assume you add stable selectors (e.g., `data-testid`) to chips/words. See the TODOs in `syntax-chip.spec.ts`.
- Keep the fixture data stable so label counts and IDs don’t drift between runs.
