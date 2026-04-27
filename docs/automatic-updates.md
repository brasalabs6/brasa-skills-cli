# Automatic Skill Updates

Automatic skill updates must be opt-in and reviewable. The CLI must not enable a background daemon, cron job, or unattended mutation by default.

## Recommended v1 Strategy

Use an explicit command invocation from the project that owns the destination skills:

```bash
brasa-skills install --project
```

This reads `.llms/skills.json` from the project, keeping updates deterministic because the JSON file names the repos, skills, target, scope, and ref. Use `--skills <file>` only when intentionally updating from a custom install file.

## Recommended Future Strategy

Add a future `brasa-skills update` command that is still manually invoked by default. If scheduling is needed later, prefer one of these explicit wrappers:

- a repository-owned CI job that opens a PR with updated project-local `.codex/skills` or `.agents/skills` content;
- a developer-controlled cron/systemd timer that runs only after local opt-in and writes logs;
- a dry-run report command that checks remote refs and prints pending updates without writing files.

## Safety Constraints

- No updater should run globally by default.
- No updater should silently merge files into existing skill directories.
- Scheduled updates should use `--dry-run` first or produce reviewable diffs.
- Rollback must be possible by reverting the generated skill directory changes or rerunning install from a known `ref`.
