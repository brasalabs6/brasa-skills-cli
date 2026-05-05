# brasa-skills-cli

`brasa-skills-cli` publishes the `@brasalabs/skills` package and the `brasa-skills` binary.

It installs and updates Codex/Agents skills from BrasaLabs skill repositories using `.llms/skills.marketplace.json` manifests.

## Usage

```bash
brasa-skills list
br skills list
brasa-skills list --repo brasalabs6/skills-for-git
brasa-skills install --repo brasalabs6/skills-for-planning
br skills install --repo brasalabs6/skills-for-planning
brasa-skills install --repo brasalabs6/skills-for-planning --skill create-changes-plan
brasa-skills install --repo brasalabs6/skills-for-git --skill github-projects --global --agents
brasa-skills install --project
brasa-skills install --skills .llms/skills.json
brasa-skills add --repo brasalabs6/skills-for-git --skill github-projects
brasa-skills add --skills custom-skills.json --repo brasalabs6/skills-for-git --skill github-projects
brasa-skills install --repo brasalabs6/skills-for-git --skill github-projects --save
brasa-skills validate-marketplace .llms/skills.marketplace.json
brasa-skills validate-skills .llms/skills.json
br skills validate-skills .llms/skills.json
```

`brasa-skills` remains the standalone compatibility binary. When `@brasalabs/cli` and `@brasalabs/skills` are installed together, the root `br` binary loads the exported `brModule` and exposes the same command implementation under `br skills`.

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
| `--skills <file>` | Install every entry from a custom install file instead of the `.llms/skills.json` default. |
| `--save` | With `--repo`, upsert the requested repo/skill into `.llms/skills.json` or the `--skills` override before installing it. |
| `--ref <ref>` | Git ref to install or save. Defaults to `main`. |
| `--marketplace <file>` | Merge an additional marketplace manifest into the embedded catalog. |
| `--dry-run` | Resolve and print actions without writing install destinations or install files. |
| `--json` | Print machine-readable output. |

When `--repo` and `--skills` are both omitted, `install` reads the default install file for the selected scope:

- project scope: `<cwd>/.llms/skills.json`
- global scope: `~/.llms/skills.json`

### `brasa-skills add`

Adds or updates an install entry without installing it immediately.

```bash
brasa-skills add   --repo brasalabs6/skills-for-git   --skill github-projects   --agents --project
```

By default, `add` writes the selected scope's `.llms/skills.json` file. Use `--skills <file>` only when a custom install file is required. The command creates parent directories when needed, creates a valid install file when it does not exist, avoids duplicate `repo` + `skill` entries, and updates the saved `target`, `scope`, and `ref` when the entry already exists.

### Validation commands

```bash
brasa-skills validate-marketplace .llms/skills.marketplace.json
brasa-skills validate-skills .llms/skills.json
```

## Marketplace Files

Repo skill catalogs live at:

```text
.llms/skills.marketplace.json
```

Each marketplace repository entry references a versioned skill repository and the path of each skill inside that repository. The embedded marketplace currently includes `brasalabs6/skills-for-planning` and `brasalabs6/skills-for-git`.

## Install Files

Default install files live at:

```text
.llms/skills.json
```

Example:

```json
{
  "$schema": "https://raw.githubusercontent.com/brasalabs6/schemas/main/json/skills/skills.schema.json",
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

A default BrasaLabs organization install file is expected at `/home/guilherme/brainstorm/brasalabs/.llms/skills.json` after the organization manifest migration. It can be used from any project with:

```bash
brasa-skills install --skills /home/guilherme/brainstorm/brasalabs/.llms/skills.json
```

Canonical JSON Schemas are owned by the private `brasalabs6/schemas` repository under `json/skills/`. Public schema publication is tracked separately; do not treat the raw private schema URLs as a public hosting guarantee.

## Development

```bash
pnpm install
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm check:br-integration
```

## Release Readiness

Run the release readiness matrix before publishing or cutting a GitHub release:

```bash
pnpm check:release
```

Run `pnpm check:br-integration` when the sibling `../cli` workspace is available to pack local `@brasalabs/cli-core`, `@brasalabs/cli`, and `@brasalabs/skills` tarballs and smoke `br skills`.

For local tarball installation and publish gates, see `docs/release.md`.

## Automatic Updates

Automatic skill updates are not enabled by default. Use explicit, reviewable installs such as:

```bash
brasa-skills install --project
```

For the recommended opt-in update strategy, see `docs/automatic-updates.md`.
