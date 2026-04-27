# SPECs — brasa-skills-cli

## Purpose

`brasa-skills-cli` provides the `@brasalabs/skills` package and `brasa-skills` binary for installing and updating skills from BrasaLabs skill repositories.

## Requirements

- Provide a TypeScript CLI package named `@brasalabs/skills`.
- Provide a binary named `brasa-skills`.
- Support installing one skill with `--repo` and `--skill`.
- Support installing all skills in a repo when `--repo` is provided without `--skill`.
- Support batch installation from `.brasa/skills.install.json` through `--skills`.
- Support destination flags `--codex`, `--agents`, `--project`, and `--global`.
- Default destination MUST be project-local `.codex/skills`.
- Update already installed skills by replacing them transactionally.
- Define JSON schemas for marketplace and batch install files.
- Include an embedded marketplace for `brasalabs6/skills-for-planning` and `brasalabs6/skills-for-git`.

## Non-Goals

- Do not migrate every workspace skill repository in v1.
- Do not replace Codex plugin `.codex-plugin/plugin.json` manifests.
- Do not manage secrets or authentication setup beyond using existing `GITHUB_TOKEN` or `GH_TOKEN` when present.
