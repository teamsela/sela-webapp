# `tools/github.py` — Setup

## Dependencies

`gh` (GitHub CLI) authenticated on PATH.

## Verify

```powershell
gh auth status
```

## Usage

Create a branch, push, `create_draft_pr`, then `check_vercel_deployment` until the preview URL appears.

## Notes

Does not need a Vercel API token — it scrapes the Vercel bot's PR comment for the preview URL.
