import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { installSkillFromRepoRoot } from "../src/installer.js";
import type { ResolvedSkillInstall } from "../src/types.js";

const tempDirs: string[] = [];

async function makeTempDir() {
  const dir = await mkdtemp(path.join(tmpdir(), "brasa-skills-test-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  );
});

describe("installer", () => {
  it("installs and updates a skill directory", async () => {
    const repoRoot = path.resolve("tests/fixtures/local-repo");
    const destRoot = await makeTempDir();
    const install: ResolvedSkillInstall = {
      repo: "brasalabs6/fixture-skills",
      ref: "main",
      skill: { name: "alpha-skill", path: "alpha-skill" },
      destination: { target: "codex", scope: "project", root: destRoot },
    };

    const first = await installSkillFromRepoRoot(repoRoot, install);
    expect(first.status).toBe("installed");
    expect(
      await readFile(path.join(destRoot, "alpha-skill", "SKILL.md"), "utf8"),
    ).toContain("Alpha fixture");

    await writeFile(
      path.join(destRoot, "alpha-skill", "local.txt"),
      "old local file",
    );
    const second = await installSkillFromRepoRoot(repoRoot, install);
    expect(second.status).toBe("updated");
    await expect(
      readFile(path.join(destRoot, "alpha-skill", "local.txt"), "utf8"),
    ).rejects.toThrow();
  });

  it("does not write during dry-run", async () => {
    const repoRoot = path.resolve("tests/fixtures/local-repo");
    const destRoot = await makeTempDir();
    const result = await installSkillFromRepoRoot(
      repoRoot,
      {
        repo: "brasalabs6/fixture-skills",
        ref: "main",
        skill: { name: "beta-skill", path: "beta-skill" },
        destination: { target: "agents", scope: "project", root: destRoot },
      },
      { dryRun: true },
    );
    expect(result.status).toBe("skipped-dry-run");
    await expect(
      readFile(path.join(destRoot, "beta-skill", "SKILL.md"), "utf8"),
    ).rejects.toThrow();
  });
});
