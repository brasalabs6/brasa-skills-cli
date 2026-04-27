import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { BrasaSkillsError } from "./errors.js";
import { parseMarketplace, readJsonFile } from "./schemas.js";
import type { RepositoryEntry, SkillsMarketplace } from "./types.js";

const filename = fileURLToPath(import.meta.url);
const here = dirname(filename);

function candidateAssetPaths(relativePath: string): string[] {
  return [join(here, relativePath), join(here, "..", relativePath)];
}

export async function loadEmbeddedMarketplace(): Promise<SkillsMarketplace> {
  const errors: string[] = [];
  for (const candidate of candidateAssetPaths(
    "catalog/skills.marketplace.json",
  )) {
    try {
      return parseMarketplace(await readJsonFile(candidate));
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }
  throw new BrasaSkillsError(
    `Unable to load embedded marketplace: ${errors.join(" | ")}`,
  );
}

export async function loadMarketplaceFile(
  path: string,
): Promise<SkillsMarketplace> {
  return parseMarketplace(await readJsonFile(path));
}

export function mergeMarketplaces(
  marketplaces: SkillsMarketplace[],
): SkillsMarketplace {
  const repositories = new Map<string, RepositoryEntry>();
  for (const marketplace of marketplaces) {
    for (const repository of marketplace.repositories) {
      repositories.set(repository.repo, repository);
    }
  }
  return {
    schemaVersion: 1,
    name: "merged-brasalabs-skills",
    repositories: [...repositories.values()],
  };
}

export function findRepository(
  marketplace: SkillsMarketplace,
  repo: string,
): RepositoryEntry | undefined {
  return marketplace.repositories.find((entry) => entry.repo === repo);
}

export function expandRepositorySkills(
  repository: RepositoryEntry,
  skillName?: string,
) {
  if (!skillName) {
    return repository.skills;
  }
  const skill = repository.skills.find(
    (entry) => entry.name === skillName || entry.aliases?.includes(skillName),
  );
  if (!skill) {
    throw new BrasaSkillsError(
      `Skill ${skillName} not found in ${repository.repo}.`,
    );
  }
  return [skill];
}
