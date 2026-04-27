# brasa-skills-cli

`brasa-skills-cli` publishes the `@brasalabs/skills` package and the `brasa-skills` binary.

It installs and updates Codex/Agents skills from BrasaLabs skill repositories using `.brasa/skills.marketplace.json` manifests.

## Usage

```bash
brasa-skills list
brasa-skills list --repo brasalabs6/skills-for-git
brasa-skills install --repo brasalabs6/skills-for-planning
brasa-skills install --repo brasalabs6/skills-for-planning --skill create-changes-plan
brasa-skills install --repo brasalabs6/skills-for-git --skill github-projects --global --agents
brasa-skills install --skills .brasa/skills.install.json
brasa-skills add --skills .brasa/skills.install.json --repo brasalabs6/skills-for-git --skill github-projects
brasa-skills install --skills .brasa/skills.install.json --repo brasalabs6/skills-for-git --skill github-projects --save
brasa-skills validate-marketplace .brasa/skills.marketplace.json
brasa-skills validate-skills .brasa/skills.install.json
```

## Destination Flags

Default destination is project-local Codex skills: `<cwd>/.codex/skills`.

| Flags | Destination |
|---|---|
| default | `<cwd>/.codex/skills` |
| `--codex --project` | `<cwd>/.codex/skills` |
| `--agents --project` | `<cwd>/.agents/skills` |
| `--codex --global` | `~/.codex/skills` |
| `--agents --global` | `~/.agents/skills` |

## Commands

### `brasa-skills install`

Installs or updates skills. Re-running the same command replaces the installed skill directory with the current repository contents.

| Flag | Description |
|---|---|
| `--repo <owner/repo>` | Install from a versioned skill repository. |
| `--skill <name>` | Install only one marketplace skill from `--repo`. Omit it to install every skill in the repo. |
| `--skills <file>` | Install every entry from a `.brasa/skills.install.json` file. |
| `--save` | With `--skills` and `--repo`, upsert the requested repo/skill into the install file before installing it. |
| `--ref <ref>` | Git ref to install or save. Defaults to `main`. |
| `--marketplace <file>` | Merge an additional marketplace manifest into the embedded catalog. |
| `--dry-run` | Resolve and print actions without writing install destinations or install files. |
| `--json` | Print machine-readable output. |

### `brasa-skills add`

Adds or updates an install entry without installing it immediately.

```bash
brasa-skills add --skills .brasa/skills.install.json \
  --repo brasalabs6/skills-for-git \
  --skill github-projects \
  --agents --project
```

The command creates parent directories when needed, creates a valid install file when it does not exist, avoids duplicate `repo` + `skill` entries, and updates the saved `target`, `scope`, and `ref` when the entry already exists.

### Validation commands

```bash
brasa-skills validate-marketplace .brasa/skills.marketplace.json
brasa-skills validate-skills .brasa/skills.install.json
```

## Marketplace Files

Repo skill catalogs live at:

```text
.brasa/skills.marketplace.json
```

Each marketplace repository entry references a versioned skill repository and the path of each skill inside that repository. The embedded marketplace currently includes `brasalabs6/skills-for-planning` and `brasalabs6/skills-for-git`.

## Install Files

Batch install files use:

```text
.brasa/skills.install.json
```

Example:

```json
{
  "$schema": "https://raw.githubusercontent.com/brasalabs6/brasa-skills-cli/main/schemas/skills-install.schema.json",
  "schemaVersion": 1,
  "defaults": {
    "target": "codex",
    "scope": "project",
    "ref": "main"
  },
  "skills": [
    {
      "repo": "brasalabs6/skills-for-git",
      "skill": "git-workflow",
      "target": "agents",
      "scope": "project",
      "ref": "main"
    }
  ]
}
```

The install file supports repo-wide entries by omitting `skill`. In that case, every skill listed for the repository in the marketplace is installed.

A default Brainstorm install file already exists at `/home/guilherme/brainstorm/brasalabs/.brasa/skills.install.json` and can be used from a project with:

```bash
brasa-skills install --skills /home/guilherme/brainstorm/brasalabs/.brasa/skills.install.json
```

Schemas are available in `schemas/`.

## Development

```bash
pnpm install
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

## Release Readiness

Run the release readiness matrix before publishing or cutting a GitHub release:

```bash
pnpm check:release
```

For local tarball installation and publish gates, see `docs/release.md`.

## Automatic Updates

Automatic skill updates are not enabled by default. Use explicit, reviewable installs such as:

```bash
brasa-skills install --skills .brasa/skills.install.json
```

For the recommended opt-in update strategy, see `docs/automatic-updates.md`.
