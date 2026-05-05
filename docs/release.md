# Release Readiness

`brasa-skills-cli` separates release readiness from publish authorization.

The package publishes to the BrasaLabs Verdaccio registry:

```text
https://npm.brasaai.com.br/
```

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
- npm publish dry-run from a freshly staged tarball.

## Root CLI Integration Smoke

When the sibling `../cli` workspace is available, run:

```bash
pnpm check:br-integration
```

This packs local `@brasalabs/cli-core`, `@brasalabs/cli`, and `@brasalabs/skills` tarballs into a temporary project and verifies:

- `br skills list --json`
- `br skills validate-skills <file>`

The smoke proves `br skills` and `brasa-skills` share the same command implementation through the exported `brModule`.

## Local Tarball Install

```bash
pnpm release:pack
npm install -g ./dist/release/brasalabs-skills-0.2.0.tgz
brasa-skills --help
```

For project-local testing without global install:

```bash
tmp="$(mktemp -d)"
cd "$tmp"
npm init -y
npm install /home/guilherme/brainstorm/brasa-skills-cli/dist/release/brasalabs-skills-0.2.0.tgz
./node_modules/.bin/brasa-skills list
```

## Publish Gate

Do not run `pnpm release:publish` unless npm authentication and BrasaLabs release policy are confirmed for this package. If `npm whoami --registry=https://npm.brasaai.com.br/` fails, stop at pack/install validation and record the package artifact evidence instead.

GitHub Actions release tags publish through the reusable `brasalabs6/github-playbook` npm package release workflow when `BRASALABS_NPM_TOKEN` or `NPM_TOKEN` is available.
