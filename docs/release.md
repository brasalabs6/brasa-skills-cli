# Release Readiness

`brasa-skills-cli` separates release readiness from publish authorization.

## Local Release Check

Run the full package validation matrix before publishing or attaching artifacts to a GitHub release:

```bash
pnpm check:release
```

This runs:

- lint, typecheck, tests, and build;
- `npm pack --dry-run`;
- a real `npm pack`;
- local install of the packed tarball into a temporary project;
- binary smoke checks for `brasa-skills --help`, `list`, `validate-marketplace`, `validate-skills`, `.llms/skills.json` add/install flows, and `.llms/skills.marketplace.json` remote lookup.

## Local Tarball Install

```bash
pnpm build
npm pack
npm install -g ./brasalabs-skills-0.2.0.tgz
brasa-skills --help
```

For project-local testing without global install:

```bash
tmp="$(mktemp -d)"
cd "$tmp"
npm init -y
npm install /home/guilherme/brainstorm/brasa-skills-cli/brasalabs-skills-0.2.0.tgz
./node_modules/.bin/brasa-skills list
```

## Publish Gate

Do not run `npm publish` unless npm authentication and BrasaLabs release policy are confirmed for this package. If `npm whoami` fails, stop at pack/install validation and record the package artifact evidence instead.
