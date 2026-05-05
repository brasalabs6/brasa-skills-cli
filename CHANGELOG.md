# Changelog

## Unreleased

- Export `brModule` so the root `@brasalabs/cli` package can mount the existing skills command implementation under `br skills`.
- Refactor command registration so `brasa-skills ...` and `br skills ...` share the same TypeScript command surface.
- Read `brasa-skills --version` from `package.json` instead of the stale hardcoded `0.1.0`.
- Add local root CLI integration smoke coverage for `br skills list --json` and `br skills validate-skills`.

## 0.2.0 - 2026-04-27

- Migrate active skill install and marketplace paths from `.brasa/*` to `.llms/skills.json` and `.llms/skills.marketplace.json`.
- Add default project/global `.llms/skills.json` resolution for `add`, batch `install`, and `install --save`.
- Preserve `--skills <file>` as the explicit custom install-list override.
- Fetch private `.llms/skills.marketplace.json` manifests through GitHub Contents API with token support.
- Add package artifact smoke coverage for `.llms` add/install/global dry-run and remote marketplace lookup flows.

## 0.1.0

- Initial `brasa-skills` CLI for listing, validating, installing, and updating BrasaLabs skills.
