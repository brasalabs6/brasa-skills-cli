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

## Marketplace Files

Repo skill catalogs live at:

```text
.brasa/skills.marketplace.json
```

Batch install files use:

```text
.brasa/skills.install.json
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
