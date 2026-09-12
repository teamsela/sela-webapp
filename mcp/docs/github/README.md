# `tools/github.py` — PRs & Vercel previews

Create draft PRs and find a branch's Vercel preview deployment via the GitHub CLI.

## Tools

| Tool | Purpose |
| --- | --- |
| `check_pr(branch='')` | Report whether a PR exists for a branch. |
| `create_draft_pr(title='', body='', base='main')` | Idempotently create a draft PR for the current branch. |
| `check_vercel_deployment(branch='')` | Report the Vercel preview URL and check status. |
| `open_vercel_preview(branch='')` | Open the preview URL in a browser. |

## Usage

Create a branch, push, `create_draft_pr`, then `check_vercel_deployment` until the preview URL appears.

See [`SETUP.md`](SETUP.md) for prerequisites.
