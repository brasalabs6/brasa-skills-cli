import {
  expandRepositorySkills,
  findRepository,
  loadEmbeddedMarketplace,
  loadMarketplaceFile,
  mergeMarketplaces,
} from "../catalog.js";
import { BrasaSkillsError } from "../errors.js";
import { fetchRemoteMarketplace, prepareGithubRepo } from "../github.js";
import { saveInstallEntry } from "../install-file.js";
import { installSkillFromRepoRoot } from "../installer.js";
import { resolveDestination } from "../paths.js";
import {
  parseInstallFile,
  parseMarketplace,
  readJsonFile,
} from "../schemas.js";
import type {
  InstallOptions,
  InstallRequest,
  InstallResult,
  InstallScope,
  RepositoryEntry,
  ResolvedSkillInstall,
  SkillsMarketplace,
  TargetKind,
} from "../types.js";

function destinationFlags(target?: TargetKind, scope?: InstallScope) {
  return {
    codex: target === "codex" ? true : undefined,
    agents: target === "agents" ? true : undefined,
    project: scope === "project" ? true : undefined,
    global: scope === "global" ? true : undefined,
  };
}

function cliDestinationOverrides(options: InstallOptions): {
  target?: TargetKind;
  scope?: InstallScope;
} {
  return {
    target: options.agents ? "agents" : options.codex ? "codex" : undefined,
    scope: options.global ? "global" : options.project ? "project" : undefined,
  };
}

async function loadMarketplace(
  options: InstallOptions,
): Promise<SkillsMarketplace> {
  const marketplaces: SkillsMarketplace[] = [await loadEmbeddedMarketplace()];
  if (options.marketplace) {
    marketplaces.push(await loadMarketplaceFile(options.marketplace));
  }
  return mergeMarketplaces(marketplaces);
}

async function resolveRepository(
  marketplace: SkillsMarketplace,
  repo: string,
  ref: string,
): Promise<RepositoryEntry> {
  const known = findRepository(marketplace, repo);
  if (known) {
    return known;
  }
  return (
    parseMarketplace(await fetchRemoteMarketplace(repo, ref)).repositories.find(
      (entry) => entry.repo === repo,
    ) ??
    (() => {
      throw new BrasaSkillsError(
        `Remote marketplace for ${repo} did not contain repository entry ${repo}.`,
      );
    })()
  );
}

function requestsFromDirectOptions(options: InstallOptions): InstallRequest[] {
  if (!options.repo) {
    throw new BrasaSkillsError("Provide --repo or --skills.");
  }
  return [{ repo: options.repo, skill: options.skill, ref: options.ref }];
}

async function requestsFromSkillsFile(
  options: InstallOptions,
): Promise<InstallRequest[]> {
  if (!options.skillsFile) {
    return requestsFromDirectOptions(options);
  }
  if (options.repo || options.skill) {
    if (!options.save) {
      throw new BrasaSkillsError(
        "Use --save when combining --skills with --repo/--skill.",
      );
    }
    return requestsFromDirectOptions(options);
  }
  if (options.save) {
    throw new BrasaSkillsError(
      "Use --save with --repo to choose what to save.",
    );
  }
  const installFile = parseInstallFile(await readJsonFile(options.skillsFile));
  const cliOverrides = cliDestinationOverrides(options);
  return installFile.skills.map((item) => ({
    repo: item.repo,
    skill: item.skill,
    ref: item.ref ?? installFile.defaults?.ref ?? options.ref,
    target: cliOverrides.target ?? item.target ?? installFile.defaults?.target,
    scope: cliOverrides.scope ?? item.scope ?? installFile.defaults?.scope,
  }));
}

function destinationForRequest(
  request: InstallRequest,
  options: InstallOptions,
) {
  const cliOverrides = cliDestinationOverrides(options);
  const target = cliOverrides.target ?? request.target;
  const scope = cliOverrides.scope ?? request.scope;
  return resolveDestination({
    ...destinationFlags(target, scope),
    cwd: options.cwd,
    home: options.home,
  });
}

async function resolveInstalls(
  options: InstallOptions,
): Promise<ResolvedSkillInstall[]> {
  const marketplace = await loadMarketplace(options);
  const requests = await requestsFromSkillsFile(options);
  const installs: ResolvedSkillInstall[] = [];

  for (const request of requests) {
    const ref = request.ref ?? options.ref ?? "main";
    const repository = await resolveRepository(marketplace, request.repo, ref);
    const effectiveRef =
      request.ref ?? options.ref ?? repository.defaultRef ?? "main";
    const destination = destinationForRequest(request, options);
    for (const skill of expandRepositorySkills(repository, request.skill)) {
      installs.push({
        repo: repository.repo,
        ref: effectiveRef,
        skill,
        destination,
      });
    }
  }
  return installs;
}

async function saveRequestedInstall(
  options: InstallOptions,
  installs: ResolvedSkillInstall[],
) {
  if (!options.save) {
    return undefined;
  }
  if (!options.skillsFile) {
    throw new BrasaSkillsError("Use --save with --skills <file>.");
  }
  if (!options.repo) {
    throw new BrasaSkillsError("Use --save with --repo <owner/repo>.");
  }
  const firstInstall = installs[0];
  if (!firstInstall) {
    throw new BrasaSkillsError("No install target resolved for --save.");
  }
  return saveInstallEntry({
    file: options.skillsFile,
    repo: options.repo,
    skill: options.skill,
    target: firstInstall.destination.target,
    scope: firstInstall.destination.scope,
    ref: firstInstall.ref,
    dryRun: options.dryRun,
  });
}

export async function runInstallCommand(
  options: InstallOptions,
): Promise<void> {
  const installs = await resolveInstalls(options);
  const saveResult = await saveRequestedInstall(options, installs);
  const byRepo = new Map<string, ResolvedSkillInstall[]>();
  for (const install of installs) {
    const key = `${install.repo}@${install.ref}`;
    byRepo.set(key, [...(byRepo.get(key) ?? []), install]);
  }

  const results: InstallResult[] = [];
  for (const repoInstalls of byRepo.values()) {
    const first = repoInstalls[0];
    const repo = await prepareGithubRepo(
      first.repo,
      first.ref,
      repoInstalls.map((item) => item.skill.path),
    );
    try {
      for (const install of repoInstalls) {
        results.push(
          await installSkillFromRepoRoot(repo.root, install, {
            dryRun: options.dryRun,
          }),
        );
      }
    } finally {
      await repo.cleanup();
    }
  }

  if (options.json) {
    console.log(JSON.stringify({ save: saveResult, results }, null, 2));
    return;
  }
  if (saveResult) {
    const dryRunPrefix = options.dryRun ? "dry-run: " : "";
    const skillLabel = options.skill
      ? `${options.repo}/${options.skill}`
      : options.repo;
    console.log(
      `${dryRunPrefix}${saveResult.status}: ${skillLabel} -> ${saveResult.path}`,
    );
  }
  for (const result of results) {
    console.log(`${result.status}: ${result.skill} -> ${result.destination}`);
  }
}
