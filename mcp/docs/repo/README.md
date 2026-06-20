# `tools/repo.py` — repo navigation

Browse and read source files in the repo so the assistant can inspect code without shell access.

## Tools

| Tool | Purpose |
| --- | --- |
| `repo_info()` | Repo root path + a checklist of key source files. |
| `read_source_file(path)` | Read a file (path relative to repo root). Refuses paths outside the repo. |
| `list_source_files(glob_pattern='src/**/*.ts')` | List files matching a glob. |

## Usage

Call `repo_info` first to orient, then `read_source_file` / `list_source_files` to navigate.

See [`SETUP.md`](SETUP.md) for prerequisites.
