import { BrasaSkillsError } from "../errors.js";
import { saveInstallEntry } from "../install-file.js";
import { resolveDefaultInstallFile, resolveDestination } from "../paths.js";
import type { DestinationOptions, InstallScope, TargetKind } from "../types.js";

export interface AddCommandOptions extends DestinationOptions {
  skillsFile?: string;
  repo?: string;
  skill?: string;
  ref?: string;
  dryRun?: boolean;
  json?: boolean;
}

function destinationMetadata(options: AddCommandOptions): {
  target: TargetKind;
  scope: InstallScope;
} {
  const destination = resolveDestination(options);
  return { target: destination.target, scope: destination.scope };
}

export async function runAddCommand(options: AddCommandOptions): Promise<void> {
  if (!options.repo) {
    throw new BrasaSkillsError(
      "Provide --repo <owner/repo> to add an install entry.",
    );
  }
  const skillsFile = options.skillsFile ?? resolveDefaultInstallFile(options);
  const destination = destinationMetadata(options);
  const result = await saveInstallEntry({
    file: skillsFile,
    repo: options.repo,
    skill: options.skill,
    target: destination.target,
    scope: destination.scope,
    ref: options.ref ?? "main",
    dryRun: options.dryRun,
  });

  if (options.json) {
    console.log(JSON.stringify({ result }, null, 2));
    return;
  }
  const dryRunPrefix = options.dryRun ? "dry-run: " : "";
  const skillLabel = options.skill
    ? `${options.repo}/${options.skill}`
    : options.repo;
  console.log(
    `${dryRunPrefix}${result.status}: ${skillLabel} -> ${result.path}`,
  );
}
