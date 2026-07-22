# `tools/code_quality.py` — type-check & lint

Runs the project's TypeScript and ESLint checks and returns the results as text.

## Tools

| Tool | Purpose |
| --- | --- |
| `run_type_check()` | `npx tsc --noEmit` — reports type errors. |
| `run_lint()` | `npm run lint` (next lint) — reports lint issues. |

## Usage

Run after making code changes, before opening a PR.

See [`SETUP.md`](SETUP.md) for prerequisites.
