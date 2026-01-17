---
description: Automatically stages, commits, and pushes changes to the repository.
---

1. Check the current git status to see what has changed.
   - Run: `git status`

2. Stage all changes.
   - Run: `git add .`
   // turbo

3. Commit the changes.
   - Ask the user for a commit message if one wasn't provided in the initial request.
   - If the user just said "commit", propose a message based on the `git status` output.
   - Run: `git commit -m "[message]"`

4. Push the changes to the remote repository.
   - Run: `git push`
   // turbo

5. Confirm success to the user.
