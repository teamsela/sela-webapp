# `tools/git.py` — git workflow

Branch switching plus pulling/merging `main` and resolving merge conflicts from within the assistant.

## Tools

| Tool | Purpose |
| --- | --- |
| `git_list_branches()` | List local + origin branches. |
| `git_checkout_branch(branch)` | Fetch and switch (creates a tracking branch if needed). |
| `git_pull_merge_main()` | Merge origin/main; on conflict leaves the repo conflicted with a report. |
| `git_merge_continue()` | Commit the merge once markers are resolved. |
| `git_merge_abort()` | Abort an in-progress merge. |

## Usage

On a conflict from `git_pull_merge_main`, read each conflicted file, edit out the markers, then `git_merge_continue`.

See [`SETUP.md`](SETUP.md) for prerequisites.
