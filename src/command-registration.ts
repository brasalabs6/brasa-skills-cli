import { Command } from "commander";
import type { BrCliContextLike } from "./cli-core-compat.js";
import { runAddCommand } from "./commands/add.js";
import { runInstallCommand } from "./commands/install.js";
import { runListCommand } from "./commands/list.js";
import {
  runValidateMarketplaceCommand,
  runValidateSkillsCommand,
} from "./commands/validate.js";
import { BrasaSkillsError } from "./errors.js";
import { readPackageVersion } from "./version.js";

export interface SkillsCommandRegistrationOptions {
  mode?: "standalone" | "module";
  context?: BrCliContextLike;
}

export function registerSkillsCommands(
  program: Command,
  _options: SkillsCommandRegistrationOptions = {},
): Command {
  addDestinationOptions(
    program
      .command("install")
      .description(
        "Install or update skills from a repo or .llms/skills.json file.",
      )
      .option("--repo <owner/repo>", "Skill repository")
      .option("--skill <name>", "Specific skill to install from --repo")
      .option("--skills <file>", "Batch install JSON file override")
      .option(
        "--save",
        "Save the requested --repo/--skill into the install file",
      )
      .option("--ref <ref>", "Git ref to install", "main")
      .option("--marketplace <file>", "Additional marketplace JSON file")
      .option("--dry-run", "Print actions without writing files")
      .option("--json", "Print JSON output"),
  ).action(async (options) => {
    await runInstallCommand({
      repo: options.repo,
      skill: options.skill,
      skillsFile: options.skills,
      save: options.save,
      ref: options.ref,
      marketplace: options.marketplace,
      codex: options.codex,
      agents: options.agents,
      project: options.project,
      global: options.global,
      dryRun: options.dryRun,
      json: options.json,
    });
  });

  addDestinationOptions(
    program
      .command("add")
      .description("Add or update an entry in a .llms/skills.json file.")
      .option("--skills <file>", "Install JSON file override")
      .option("--repo <owner/repo>", "Skill repository")
      .option("--skill <name>", "Specific skill to add from --repo")
      .option("--ref <ref>", "Git ref to save", "main")
      .option("--dry-run", "Print actions without writing files")
      .option("--json", "Print JSON output"),
  ).action(async (options) => {
    await runAddCommand({
      skillsFile: options.skills,
      repo: options.repo,
      skill: options.skill,
      ref: options.ref,
      codex: options.codex,
      agents: options.agents,
      project: options.project,
      global: options.global,
      dryRun: options.dryRun,
      json: options.json,
    });
  });

  program
    .command("list")
    .description("List skills from the embedded or provided marketplace.")
    .option("--repo <owner/repo>", "Only list one repository")
    .option("--marketplace <file>", "Additional marketplace JSON file")
    .option("--json", "Print JSON output")
    .action(async (options) => {
      await runListCommand(options);
    });

  program
    .command("validate-marketplace <file>")
    .description("Validate a .llms/skills.marketplace.json file.")
    .option("--json", "Print JSON output")
    .action(async (file, options) => {
      await runValidateMarketplaceCommand(file, options);
    });

  program
    .command("validate-skills <file>")
    .description("Validate a .llms/skills.json file.")
    .option("--json", "Print JSON output")
    .action(async (file, options) => {
      await runValidateSkillsCommand(file, options);
    });

  return program;
}

export function createStandaloneProgram(): Command {
  return registerSkillsCommands(
    new Command()
      .name("brasa-skills")
      .description("Install and update BrasaLabs Codex and Agents skills.")
      .version(readPackageVersion()),
    { mode: "standalone" },
  );
}

export async function runStandalone(
  argv: string[] = process.argv,
): Promise<number> {
  try {
    await createStandaloneProgram().parseAsync(argv);
    return 0;
  } catch (error) {
    const message =
      error instanceof BrasaSkillsError || error instanceof Error
        ? error.message
        : String(error);
    console.error(`Error: ${message}`);
    return 1;
  }
}

function addDestinationOptions(command: Command): Command {
  return command
    .option("--codex", "Install into .codex/skills")
    .option("--agents", "Install into .agents/skills")
    .option("--project", "Install into the current project directory")
    .option("--global", "Install into the current user's home directory");
}
