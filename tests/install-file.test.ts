import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { saveInstallEntry } from "../src/install-file.js";

const tempDirs: string[] = [];

async function makeTempDir() {
  const dir = await mkdtemp(path.join(tmpdir(), "brasa-skills-install-file-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  );
});

describe("install file writer", () => {
  it("creates a new install file with defaults", async () => {
    const dir = await makeTempDir();
    const file = path.join(dir, ".brasa", "skills.install.json");

    const result = await saveInstallEntry({
      file,
      repo: "brasalabs6/skills-for-git",
      skill: "git-workflow",
      target: "codex",
      scope: "project",
      ref: "main",
    });

    expect(result.status).toBe("created");
    const parsed = JSON.parse(await readFile(file, "utf8"));
    expect(parsed.defaults).toEqual({
      target: "codex",
      scope: "project",
      ref: "main",
    });
    expect(parsed.skills).toEqual([
      {
        repo: "brasalabs6/skills-for-git",
        skill: "git-workflow",
        target: "codex",
        scope: "project",
        ref: "main",
      },
    ]);
  });

  it("adds a repo-wide entry without a skill", async () => {
    const dir = await makeTempDir();
    const file = path.join(dir, ".brasa", "skills.install.json");

    const result = await saveInstallEntry({
      file,
      repo: "brasalabs6/skills-for-planning",
      target: "agents",
      scope: "global",
      ref: "main",
    });

    expect(result.entry).toEqual({
      repo: "brasalabs6/skills-for-planning",
      target: "agents",
      scope: "global",
      ref: "main",
    });
  });

  it("does not duplicate an unchanged entry", async () => {
    const dir = await makeTempDir();
    const file = path.join(dir, "skills.install.json");
    await saveInstallEntry({
      file,
      repo: "brasalabs6/skills-for-git",
      skill: "git-workflow",
      target: "codex",
      scope: "project",
      ref: "main",
    });

    const result = await saveInstallEntry({
      file,
      repo: "brasalabs6/skills-for-git",
      skill: "git-workflow",
      target: "codex",
      scope: "project",
      ref: "main",
    });

    expect(result.status).toBe("unchanged");
    expect(result.installFile.skills).toHaveLength(1);
  });

  it("updates an existing entry in place", async () => {
    const dir = await makeTempDir();
    const file = path.join(dir, "skills.install.json");
    await saveInstallEntry({
      file,
      repo: "brasalabs6/skills-for-git",
      skill: "git-workflow",
      target: "codex",
      scope: "project",
      ref: "main",
    });

    const result = await saveInstallEntry({
      file,
      repo: "brasalabs6/skills-for-git",
      skill: "git-workflow",
      target: "agents",
      scope: "global",
      ref: "stable",
    });

    expect(result.status).toBe("updated");
    expect(result.installFile.skills).toEqual([
      {
        repo: "brasalabs6/skills-for-git",
        skill: "git-workflow",
        target: "agents",
        scope: "global",
        ref: "stable",
      },
    ]);
  });

  it("does not write during dry-run", async () => {
    const dir = await makeTempDir();
    const file = path.join(dir, "skills.install.json");

    await saveInstallEntry({
      file,
      repo: "brasalabs6/skills-for-git",
      skill: "git-workflow",
      target: "codex",
      scope: "project",
      ref: "main",
      dryRun: true,
    });

    await expect(readFile(file, "utf8")).rejects.toThrow();
  });

  it("rejects invalid existing JSON without overwriting it", async () => {
    const dir = await makeTempDir();
    const file = path.join(dir, "skills.install.json");
    await writeFile(file, "{ bad json", "utf8");

    await expect(
      saveInstallEntry({
        file,
        repo: "brasalabs6/skills-for-git",
        skill: "git-workflow",
        target: "codex",
        scope: "project",
        ref: "main",
      }),
    ).rejects.toThrow();
    expect(await readFile(file, "utf8")).toBe("{ bad json");
  });
});
