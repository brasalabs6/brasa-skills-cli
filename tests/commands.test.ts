import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runAddCommand } from "../src/commands/add.js";
import { runInstallCommand } from "../src/commands/install.js";

const githubMocks = vi.hoisted(() => ({
  fetchRemoteMarketplace: vi.fn(),
  prepareGithubRepo: vi.fn(),
}));

vi.mock("../src/github.js", () => githubMocks);

const tempDirs: string[] = [];
let logSpy: ReturnType<typeof vi.spyOn>;

async function makeTempDir() {
  const dir = await mkdtemp(path.join(tmpdir(), "brasa-skills-command-"));
  tempDirs.push(dir);
  return dir;
}

async function writeFixtureMarketplace(dir: string) {
  const file = path.join(dir, "skills.marketplace.json");
  await writeFile(
    file,
    JSON.stringify(
      {
        schemaVersion: 1,
        name: "fixture-marketplace",
        repositories: [
          {
            repo: "brasalabs6/fixture-skills",
            defaultRef: "main",
            skills: [
              { name: "alpha-skill", path: "alpha-skill" },
              { name: "beta-skill", path: "beta-skill" },
            ],
          },
        ],
      },
      null,
      2,
    ),
    "utf8",
  );
  return file;
}

beforeEach(() => {
  githubMocks.prepareGithubRepo.mockResolvedValue({
    root: path.resolve("tests/fixtures/local-repo"),
    cleanup: vi.fn(async () => undefined),
  });
  githubMocks.fetchRemoteMarketplace.mockReset();
  logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
});

afterEach(async () => {
  logSpy.mockRestore();
  githubMocks.prepareGithubRepo.mockReset();
  await Promise.all(
    tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  );
});

describe("commands", () => {
  it("adds to the project .llms default when --skills is omitted", async () => {
    const cwd = await makeTempDir();
    const home = await makeTempDir();

    await runAddCommand({
      repo: "brasalabs6/fixture-skills",
      skill: "alpha-skill",
      cwd,
      home,
      project: true,
    });

    const parsed = JSON.parse(
      await readFile(path.join(cwd, ".llms", "skills.json"), "utf8"),
    );
    expect(parsed.skills).toEqual([
      {
        repo: "brasalabs6/fixture-skills",
        skill: "alpha-skill",
        target: "codex",
        scope: "project",
        ref: "main",
      },
    ]);
  });

  it("adds to the global .llms default when --global is selected", async () => {
    const cwd = await makeTempDir();
    const home = await makeTempDir();

    await runAddCommand({
      repo: "brasalabs6/fixture-skills",
      cwd,
      home,
      global: true,
    });

    const parsed = JSON.parse(
      await readFile(path.join(home, ".llms", "skills.json"), "utf8"),
    );
    expect(parsed.defaults.scope).toBe("global");
    await expect(
      readFile(path.join(cwd, ".llms", "skills.json"), "utf8"),
    ).rejects.toThrow();
  });

  it("keeps --skills as an explicit custom install file override", async () => {
    const cwd = await makeTempDir();
    const customFile = path.join(cwd, "custom", "skills.json");

    await runAddCommand({
      skillsFile: customFile,
      repo: "brasalabs6/fixture-skills",
      skill: "beta-skill",
      cwd,
      project: true,
    });

    const parsed = JSON.parse(await readFile(customFile, "utf8"));
    expect(parsed.skills[0].skill).toBe("beta-skill");
    await expect(
      readFile(path.join(cwd, ".llms", "skills.json"), "utf8"),
    ).rejects.toThrow();
  });

  it("install --repo --save writes the project default install file", async () => {
    const cwd = await makeTempDir();
    const home = await makeTempDir();
    const marketplace = await writeFixtureMarketplace(cwd);

    await runInstallCommand({
      repo: "brasalabs6/fixture-skills",
      skill: "alpha-skill",
      save: true,
      marketplace,
      cwd,
      home,
      project: true,
    });

    const parsed = JSON.parse(
      await readFile(path.join(cwd, ".llms", "skills.json"), "utf8"),
    );
    expect(parsed.skills).toHaveLength(1);
    expect(parsed.skills[0].skill).toBe("alpha-skill");
    expect(
      await readFile(
        path.join(cwd, ".codex", "skills", "alpha-skill", "SKILL.md"),
        "utf8",
      ),
    ).toContain("Alpha fixture");
  });

  it("install --repo --save keeps --skills as a custom file override", async () => {
    const cwd = await makeTempDir();
    const home = await makeTempDir();
    const marketplace = await writeFixtureMarketplace(cwd);
    const customFile = path.join(cwd, "custom", "skills.json");

    await runInstallCommand({
      skillsFile: customFile,
      repo: "brasalabs6/fixture-skills",
      skill: "beta-skill",
      save: true,
      marketplace,
      cwd,
      home,
      project: true,
    });

    const parsed = JSON.parse(await readFile(customFile, "utf8"));
    expect(parsed.skills[0].skill).toBe("beta-skill");
    await expect(
      readFile(path.join(cwd, ".llms", "skills.json"), "utf8"),
    ).rejects.toThrow();
  });

  it("install reads the project default install file for batch installs", async () => {
    const cwd = await makeTempDir();
    const home = await makeTempDir();
    const marketplace = await writeFixtureMarketplace(cwd);
    await mkdir(path.join(cwd, ".llms"), { recursive: true });
    await writeFile(
      path.join(cwd, ".llms", "skills.json"),
      JSON.stringify(
        {
          schemaVersion: 1,
          skills: [{ repo: "brasalabs6/fixture-skills", skill: "beta-skill" }],
        },
        null,
        2,
      ),
      "utf8",
    );

    await runInstallCommand({
      marketplace,
      cwd,
      home,
      project: true,
      dryRun: true,
    });

    expect(githubMocks.prepareGithubRepo).toHaveBeenCalledWith(
      "brasalabs6/fixture-skills",
      "main",
      ["beta-skill"],
    );
  });

  it("install --global reads the home .llms default install file", async () => {
    const cwd = await makeTempDir();
    const home = await makeTempDir();
    const marketplace = await writeFixtureMarketplace(cwd);
    await mkdir(path.join(home, ".llms"), { recursive: true });
    await writeFile(
      path.join(home, ".llms", "skills.json"),
      JSON.stringify(
        {
          schemaVersion: 1,
          skills: [{ repo: "brasalabs6/fixture-skills", skill: "alpha-skill" }],
        },
        null,
        2,
      ),
      "utf8",
    );

    await runInstallCommand({
      marketplace,
      cwd,
      home,
      global: true,
      dryRun: true,
    });

    expect(githubMocks.prepareGithubRepo).toHaveBeenCalledWith(
      "brasalabs6/fixture-skills",
      "main",
      ["alpha-skill"],
    );
  });
});
