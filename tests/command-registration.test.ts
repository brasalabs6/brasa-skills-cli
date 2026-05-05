import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import {
  createStandaloneProgram,
  registerSkillsCommands,
} from "../src/command-registration.js";
import { readPackageVersion } from "../src/version.js";

describe("command registration", () => {
  it("mounts the shared skills command surface on any Commander node", () => {
    const program = createStandaloneProgram();

    expect(program.name()).toBe("brasa-skills");
    expect(program.commands.map((command) => command.name())).toEqual([
      "install",
      "add",
      "list",
      "validate-marketplace",
      "validate-skills",
    ]);
  });

  it("registers commands on an arbitrary parent node", () => {
    const parent = registerSkillsCommands(
      createStandaloneProgram().createCommand("skills"),
      {
        mode: "module",
      },
    );

    expect(parent.commands.map((command) => command.name())).toContain(
      "install",
    );
    expect(parent.commands.map((command) => command.name())).toContain(
      "validate-skills",
    );
  });

  it("uses package.json as the version source", async () => {
    const packageJson = JSON.parse(await readFile("package.json", "utf8")) as {
      version: string;
    };

    expect(readPackageVersion()).toBe(packageJson.version);
  });
});
