# `tools/code_quality.py` — Setup

## Dependencies

Node.js + project `npm install` already done (uses `npx`/`npm`).

## Verify

```powershell
From the repo root: `npx tsc --noEmit` and `npm run lint`.
```

## Usage

Run after making code changes, before opening a PR.

## Notes

Both tools have a 120s timeout; large changes may need a manual `npm run build`.
