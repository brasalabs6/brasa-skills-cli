import {
  findRepository,
  loadEmbeddedMarketplace,
  loadMarketplaceFile,
  mergeMarketplaces,
} from "../catalog.js";
import type { SkillsMarketplace } from "../types.js";

export interface ListCommandOptions {
  repo?: string;
  marketplace?: string;
  json?: boolean;
}

export async function runListCommand(
  options: ListCommandOptions,
): Promise<void> {
  const marketplaces: SkillsMarketplace[] = [await loadEmbeddedMarketplace()];
  if (options.marketplace) {
    marketplaces.push(await loadMarketplaceFile(options.marketplace));
  }
  const marketplace = mergeMarketplaces(marketplaces);
  const repositories = options.repo
    ? [findRepository(marketplace, options.repo)].filter(Boolean)
    : marketplace.repositories;

  if (options.json) {
    console.log(JSON.stringify({ repositories }, null, 2));
    return;
  }

  for (const repository of repositories) {
    if (!repository) {
      continue;
    }
    console.log(`${repository.repo} (${repository.defaultRef ?? "main"})`);
    for (const skill of repository.skills) {
      const description = skill.description ? ` - ${skill.description}` : "";
      console.log(`  - ${skill.name} -> ${skill.path}${description}`);
    }
  }
}
