# AGENTS Guide for brasa-skills-cli

Scope: this file applies to the whole repository.

## Requirement Language

The key words `MUST`, `MUST NOT`, `REQUIRED`, `SHOULD`, `SHOULD NOT`, `RECOMMENDED`, `NOT RECOMMENDED`, `MAY`, and `OPTIONAL` in this document are to be interpreted as described in BCP 14, RFC 2119, and RFC 8174 when, and only when, they appear in all capitals.

## Purpose

This repository owns the `@brasalabs/skills` TypeScript package and `brasa-skills` CLI for installing and updating BrasaLabs skills from versioned skill repositories.

## Repository Rules

- Keep the CLI focused on skill discovery, validation, installation, and update workflows.
- Keep `.brasa/skills.marketplace.json` and `.brasa/skills.install.json` schemas backward compatible within the same `schemaVersion`.
- Reject absolute paths and parent-directory traversal in skill paths before any filesystem write.
- Updates MUST replace installed skill directories transactionally rather than merging files.
- Do not claim ownership of individual skill content; source skill repositories own their own `SKILL.md` contracts.

## Commands

- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
- `pnpm build`

## What Not To Do

- MUST NOT install outside computed `.codex/skills` or `.agents/skills` roots.
- MUST NOT require global installation as the default; default scope is project-local `.codex/skills`.
- MUST NOT alter `.codex-plugin/plugin.json` semantics in skill repositories.

## References

- `README.md`
- `SPECs.md`
- `schemas/skills-marketplace.schema.json`
- `schemas/skills-install.schema.json`
