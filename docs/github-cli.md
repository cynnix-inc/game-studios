# GitHub CLI (`gh`) — Repo Workflow Notes

This repo supports using GitHub CLI to create PRs from feature branches to `dev`.

## Verify `gh` is installed and authenticated

In this environment, `gh` may exist but not be on `PATH`. If `gh` fails with “command not found”, try the absolute path:

```bash
/opt/homebrew/bin/gh --version
/opt/homebrew/bin/gh auth status
```

If `gh` is on `PATH`, the equivalent commands are:

```bash
gh --version
gh auth status
```

## Create a PR to `dev` (non-interactive)

Run from the repo root:

```bash
/opt/homebrew/bin/gh pr create \
  --base dev \
  --head feature/<branch-name> \
  --title "<PR title>" \
  --body "<PR body>"
```

Example for Epic 4 (Daily leaderboards):

```bash
/opt/homebrew/bin/gh pr create \
  --base dev \
  --head feature/epic-4-daily-leaderboards \
  --title "Epic 4: Daily leaderboards (Score/Raw Time, Top 100 + Around You)" \
  --body "Delivers Epic 4 Daily leaderboards.

- UI: Daily leaderboards for today + archive days, Score/Raw Time tabs, Top 100, Around You (signed-in).
- Schema: add daily_runs.display_name + ranked leaderboard views.
- Edge: submit-score snapshots display_name and assigns pseudonymous Player-XXXX when missing.
- Tests: add MVP-gate coverage for Epic 4; lint/typecheck/tests all green locally.

Future work tracked: editable display names (dice + manual), moderation/validation TBD in docs/sudoku-future-work.md."
```


