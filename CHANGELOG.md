# Changelog

## Unreleased

- No unreleased changes yet.

## 0.2.0 - 2026-04-27

- Migrate active skill install and marketplace paths from `.brasa/*` to `.llms/skills.json` and `.llms/skills.marketplace.json`.
- Add default project/global `.llms/skills.json` resolution for `add`, batch `install`, and `install --save`.
- Preserve `--skills <file>` as the explicit custom install-list override.
- Fetch private `.llms/skills.marketplace.json` manifests through GitHub Contents API with token support.
- Add package artifact smoke coverage for `.llms` add/install/global dry-run and remote marketplace lookup flows.

## 0.1.0

- Initial `brasa-skills` CLI for listing, validating, installing, and updating BrasaLabs skills.
