# PartyCue

## Daily routine

When I say "eod" or "good night":
1. Make sure the project builds (or for a skill, runs) successfully.
2. Write .claude/session-handoff.md with: what we finished, files changed,
   decisions made, anything unfinished or buggy, and the next step.
   Include the current branch name.
3. Commit everything and push this branch.
4. Tell me in 2-3 lines what we did and whether this branch is ready
   to merge into main.

When I say "good morning":
1. Read .claude/session-handoff.md. If it isn't on this branch, check
   the most recently pushed branches for it and tell me which branch
   has it and whether I should switch.
2. Summarize where we left off and the next step in 2-3 lines.
3. Wait for me to say go before making changes.

## Safety rules

1. Guests must always be able to join from their phone without signing
   in. Don't break the TV-to-phone connection or the join flow.
2. Never lose saved data such as queues, favorites, or settings. Any
   format change needs a migration.
3. Never commit API keys to the repo.
4. Never change the applicationId or signing key for the APK. Increase
   the version with every release.
5. New work goes on a branch; merge to main only when the build passes.
