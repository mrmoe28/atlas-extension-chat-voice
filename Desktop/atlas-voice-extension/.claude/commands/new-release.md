---
description: Create a new versioned release of Atlas Voice Extension
---

You are helping the user create a new release of the Atlas Voice Extension.

## Your Task:

1. **Ask the user for the new version number** using the AskUserQuestion tool:
   - Ask: "What version number do you want to release?"
   - Provide 3 suggestions based on the current version in manifest.json:
     - Patch version (e.g., 0.2.2 → 0.2.3) - for bug fixes
     - Minor version (e.g., 0.2.3 → 0.3.0) - for new features
     - Custom version - let them specify

2. **Update manifest.json** with the new version number

3. **Commit the version bump**:
   ```bash
   git add manifest.json
   git commit -m "chore: Bump version to X.X.X"
   ```

4. **Push to GitHub**:
   ```bash
   git push origin main
   ```

5. **Create and push the version tag**:
   ```bash
   git tag vX.X.X
   git push origin vX.X.X
   ```

6. **Monitor the workflow** (wait ~20 seconds):
   ```bash
   sleep 20
   gh run list --repo mrmoe28/atlas-extension-chat-voice --limit 1
   ```

7. **Verify the release was created**:
   ```bash
   gh release view vX.X.X --repo mrmoe28/atlas-extension-chat-voice
   ```

8. **Report success** with:
   - ✅ Version number
   - ✅ Release URL
   - ✅ Update endpoint verification (test with old version)

## Important:
- Use TodoWrite to track progress through the 7 steps
- Mark each step complete as you go
- If any step fails, stop and report the error to the user
- Always verify the workflow succeeded before reporting completion

## Success Criteria:
- manifest.json updated
- Commit pushed to GitHub
- Tag pushed to GitHub
- GitHub Actions workflow completed successfully
- Release created with ZIP file attached
- Update endpoint returns the new version
