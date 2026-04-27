import {
  parseInstallFile,
  parseMarketplace,
  readJsonFile,
} from "../schemas.js";

export async function runValidateMarketplaceCommand(
  file: string,
  options: { json?: boolean } = {},
): Promise<void> {
  const marketplace = parseMarketplace(await readJsonFile(file));
  if (options.json) {
    console.log(JSON.stringify({ valid: true, marketplace }, null, 2));
    return;
  }
  console.log(`Valid marketplace: ${file}`);
}

export async function runValidateSkillsCommand(
  file: string,
  options: { json?: boolean } = {},
): Promise<void> {
  const skills = parseInstallFile(await readJsonFile(file));
  if (options.json) {
    console.log(JSON.stringify({ valid: true, skills }, null, 2));
    return;
  }
  console.log(`Valid skills install file: ${file}`);
}
