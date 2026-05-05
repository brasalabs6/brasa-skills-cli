import { Command } from "commander";
import { describe, expect, it } from "vitest";

import { brModule } from "../src/br-module.js";

describe("brModule", () => {
  it("exposes the root CLI module metadata", () => {
    expect(brModule).toMatchObject({
      id: "skills",
      command: "skills",
      summary: "Install, validate, and manage BrasaLabs skills.",
      version: "0.2.0",
    });
  });

  it("mounts skills commands under an arbitrary parent program", async () => {
    const program = new Command("br").exitOverride();

    await brModule.register(program, {
      cwd: "/tmp/brasa-skills-test",
      env: {},
    });

    const skills = program.commands.find(
      (command) => command.name() === "skills",
    );
    expect(skills?.commands.map((command) => command.name())).toEqual([
      "install",
      "add",
      "list",
      "validate-marketplace",
      "validate-skills",
    ]);
  });
});
