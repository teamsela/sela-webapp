# `tools/git.py` — Setup

## Dependencies

`git` on PATH.

## Verify

```powershell
python -c "import sys; sys.path.insert(0,'mcp'); from tools.git import git_list_branches; print(git_list_branches())"
```

## Usage

On a conflict from `git_pull_merge_main`, read each conflicted file, edit out the markers, then `git_merge_continue`.

## Notes

Never force-pushes or rewrites history.
