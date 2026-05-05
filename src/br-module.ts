import type { BrCommandModuleLike } from "./cli-core-compat.js";
import { registerSkillsCommands } from "./command-registration.js";
import { readPackageVersion } from "./version.js";

export const brModule: BrCommandModuleLike = {
  id: "skills",
  command: "skills",
  summary: "Install, validate, and manage BrasaLabs skills.",
  version: readPackageVersion(),
  register(program, context) {
    const skills = program
      .command("skills")
      .description("Install, validate, and manage BrasaLabs skills.");
    registerSkillsCommands(skills, { mode: "module", context });
  },
};
