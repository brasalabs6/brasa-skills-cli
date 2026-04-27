import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { cp, mkdir, rename, rm } from "node:fs/promises";
import path from "node:path";
import { BrasaSkillsError } from "./errors.js";
import { assertSafeRelativePath } from "./paths.js";
import type { InstallResult, ResolvedSkillInstall } from "./types.js";

async function validateSkillSource(source: string): Promise<void> {
  if (!existsSync(source)) {
    throw new BrasaSkillsError(`Skill source not found: ${source}`);
  }
  if (!existsSync(path.join(source, "SKILL.md"))) {
    throw new BrasaSkillsError(`SKILL.md not found in ${source}`);
  }
}

export async function installSkillFromRepoRoot(
  repoRoot: string,
  item: ResolvedSkillInstall,
  options: { dryRun?: boolean } = {},
): Promise<InstallResult> {
  const skillPath = assertSafeRelativePath(item.skill.path, "skill path");
  const source = path.resolve(repoRoot, skillPath);
  const repoRootResolved = path.resolve(repoRoot);
  if (
    !source.startsWith(`${repoRootResolved}${path.sep}`) &&
    source !== repoRootResolved
  ) {
    throw new BrasaSkillsError(
      `Skill path escapes repository: ${item.skill.path}`,
    );
  }
  await validateSkillSource(source);

  const destination = path.join(item.destination.root, item.skill.name);
  const existed = existsSync(destination);
  const status = options.dryRun
    ? "skipped-dry-run"
    : existed
      ? "updated"
      : "installed";

  if (!options.dryRun) {
    await mkdir(item.destination.root, { recursive: true });
    const tempDestination = path.join(
      item.destination.root,
      `.tmp-${item.skill.name}-${randomUUID()}`,
    );
    const backupDestination = path.join(
      item.destination.root,
      `.backup-${item.skill.name}-${randomUUID()}`,
    );
    await cp(source, tempDestination, {
      recursive: true,
      force: false,
      errorOnExist: true,
    });
    try {
      if (existed) {
        await rename(destination, backupDestination);
      }
      await rename(tempDestination, destination);
      if (existed) {
        await rm(backupDestination, { recursive: true, force: true });
      }
    } catch (error) {
      await rm(tempDestination, { recursive: true, force: true });
      if (
        existed &&
        existsSync(backupDestination) &&
        !existsSync(destination)
      ) {
        await rename(backupDestination, destination);
      }
      throw error;
    }
  }

  return {
    repo: item.repo,
    ref: item.ref,
    skill: item.skill.name,
    sourcePath: item.skill.path,
    destination,
    status,
  };
}
