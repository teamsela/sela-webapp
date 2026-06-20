# `tools/repo.py` — Setup

## Dependencies

None beyond `fastmcp`.

## Verify

```powershell
python -c "import sys; sys.path.insert(0,'mcp'); from tools.repo import repo_info; print(repo_info())"
```

## Usage

Call `repo_info` first to orient, then `read_source_file` / `list_source_files` to navigate.

## Notes

Paths are sandboxed to `REPO_ROOT` for safety.
