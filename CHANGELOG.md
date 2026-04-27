# Changelog

## Unreleased

- Migrate active skill install and marketplace paths from `.brasa/*` to `.llms/skills.json` and `.llms/skills.marketplace.json`.
- Add `brasa-skills add` for upserting `.llms/skills.json` entries without installing immediately.
- Add `brasa-skills install --save` to install a repo or skill and save it to the selected install file in one step.

## 0.1.0

- Initial `brasa-skills` CLI for listing, validating, installing, and updating BrasaLabs skills.
