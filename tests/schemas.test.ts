import { describe, expect, it } from "vitest";
import { parseInstallFile, parseMarketplace } from "../src/schemas.js";

describe("schemas", () => {
  it("parses a valid marketplace", () => {
    const marketplace = parseMarketplace({
      schemaVersion: 1,
      name: "fixture-marketplace",
      repositories: [
        {
          repo: "brasalabs6/fixture-skills",
          skills: [{ name: "alpha-skill", path: "alpha-skill" }],
        },
      ],
    });
    expect(marketplace.repositories[0].skills[0].path).toBe("alpha-skill");
  });

  it("rejects unsafe marketplace paths", () => {
    expect(() =>
      parseMarketplace({
        schemaVersion: 1,
        name: "fixture-marketplace",
        repositories: [
          {
            repo: "brasalabs6/fixture-skills",
            skills: [{ name: "alpha-skill", path: "../alpha-skill" }],
          },
        ],
      }),
    ).toThrow(/inside the repository/);
  });

  it("parses an install file", () => {
    const installFile = parseInstallFile({
      schemaVersion: 1,
      defaults: { target: "agents", scope: "global", ref: "main" },
      skills: [{ repo: "brasalabs6/skills-for-git", skill: "git-workflow" }],
    });
    expect(installFile.defaults?.target).toBe("agents");
  });
});
