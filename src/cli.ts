#!/usr/bin/env node
import { Command } from "commander";
import { runInstallCommand } from "./commands/install.js";
import { runListCommand } from "./commands/list.js";
import {
  runValidateMarketplaceCommand,
  runValidateSkillsCommand,
} from "./commands/validate.js";
import { BrasaSkillsError } from "./errors.js";

const program = new Command();

function addDestinationOptions(command: Command): Command {
  return command
    .option("--codex", "Install into .codex/skills")
    .option("--agents", "Install into .agents/skills")
    .option("--project", "Install into the current project directory")
    .option("--global", "Install into the current user's home directory");
}

program
  .name("brasa-skills")
  .description("Install and update BrasaLabs Codex and Agents skills.")
  .version("0.1.0");

addDestinationOptions(
  program
    .command("install")
    .description(
      "Install or update skills from a repo or .brasa/skills.install.json file.",
    )
    .option("--repo <owner/repo>", "Skill repository")
    .option("--skill <name>", "Specific skill to install from --repo")
    .option("--skills <file>", "Batch install JSON file")
    .option("--ref <ref>", "Git ref to install", "main")
    .option("--marketplace <file>", "Additional marketplace JSON file")
    .option("--dry-run", "Print actions without writing files")
    .option("--json", "Print JSON output"),
).action(async (options) => {
  await runInstallCommand({
    repo: options.repo,
    skill: options.skill,
    skillsFile: options.skills,
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
  .description("Validate a .brasa/skills.marketplace.json file.")
  .option("--json", "Print JSON output")
  .action(async (file, options) => {
    await runValidateMarketplaceCommand(file, options);
  });

program
  .command("validate-skills <file>")
  .description("Validate a .brasa/skills.install.json file.")
  .option("--json", "Print JSON output")
  .action(async (file, options) => {
    await runValidateSkillsCommand(file, options);
  });

try {
  await program.parseAsync(process.argv);
} catch (error) {
  const message =
    error instanceof BrasaSkillsError || error instanceof Error
      ? error.message
      : String(error);
  console.error(`Error: ${message}`);
  process.exitCode = 1;
}
