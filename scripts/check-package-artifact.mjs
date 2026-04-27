import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    encoding: "utf8",
    stdio: options.stdio ?? "pipe",
    ...options,
  });
}

function readJson(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}

function githubAuthEnv() {
  const env = { ...process.env };
  if (env.GITHUB_TOKEN || env.GH_TOKEN) {
    return env;
  }
  try {
    const token = run("gh", ["auth", "token"]).trim();
    if (token) {
      env.GH_TOKEN = token;
    }
  } catch {
    // Keep the environment unchanged; private remote smoke will surface auth gaps.
  }
  return env;
}

function main() {
  const packageJson = JSON.parse(
    run("node", [
      "-e",
      "process.stdout.write(require('fs').readFileSync('package.json','utf8'))",
    ]),
  );
  run("pnpm", ["build"], { stdio: "inherit" });
  const packOutput = run("npm", ["pack", "--json"]);
  const [artifact] = JSON.parse(packOutput);
  if (!artifact?.filename) {
    throw new Error("npm pack did not return an artifact filename.");
  }
  const tarball = path.resolve(artifact.filename);
  const tempRoot = mkdtempSync(path.join(tmpdir(), "brasa-skills-pack-check-"));
  const homeRoot = path.join(tempRoot, "home");
  const smokeEnv = githubAuthEnv();
  try {
    run("npm", ["init", "-y"], { cwd: tempRoot });
    run("npm", ["install", tarball], { cwd: tempRoot, stdio: "inherit" });
    const bin = path.join(tempRoot, "node_modules", ".bin", "brasa-skills");
    run(bin, ["--help"], { cwd: tempRoot });
    run(bin, ["list", "--json"], { cwd: tempRoot });
    run(
      bin,
      ["validate-marketplace", path.resolve("catalog/skills.marketplace.json")],
      { cwd: tempRoot },
    );

    run(
      bin,
      [
        "add",
        "--repo",
        "brasalabs6/skills-for-git",
        "--skill",
        "github-projects",
        "--project",
      ],
      { cwd: tempRoot, env: smokeEnv },
    );
    const projectInstallFile = path.join(tempRoot, ".llms", "skills.json");
    const projectInstall = readJson(projectInstallFile);
    if (projectInstall.skills?.[0]?.skill !== "github-projects") {
      throw new Error("brasa-skills add did not create .llms/skills.json.");
    }
    run(bin, ["validate-skills", projectInstallFile], { cwd: tempRoot });
    run(bin, ["install", "--project"], { cwd: tempRoot, env: smokeEnv });
    if (
      !existsSync(
        path.join(tempRoot, ".codex", "skills", "github-projects", "SKILL.md"),
      )
    ) {
      throw new Error(
        "brasa-skills install --project did not install github-projects.",
      );
    }

    const globalInstallFile = path.join(homeRoot, ".llms", "skills.json");
    mkdirSync(path.dirname(globalInstallFile), { recursive: true });
    writeFileSync(
      globalInstallFile,
      JSON.stringify(
        {
          schemaVersion: 1,
          skills: [
            { repo: "brasalabs6/skills-for-git", skill: "git-workflow" },
          ],
        },
        null,
        2,
      ),
    );
    const beforeGlobalDryRun = readFileSync(globalInstallFile, "utf8");
    run(bin, ["install", "--global", "--dry-run"], {
      cwd: tempRoot,
      env: { ...smokeEnv, HOME: homeRoot },
    });
    const afterGlobalDryRun = readFileSync(globalInstallFile, "utf8");
    if (beforeGlobalDryRun !== afterGlobalDryRun) {
      throw new Error("Global dry-run mutated ~/.llms/skills.json.");
    }
    if (existsSync(path.join(homeRoot, ".codex", "skills", "git-workflow"))) {
      throw new Error("Global dry-run wrote an install destination.");
    }

    const githubModuleUrl = pathToFileURL(
      path.join(
        tempRoot,
        "node_modules",
        "@brasalabs",
        "skills",
        "dist",
        "github.js",
      ),
    ).href;
    run(
      "node",
      [
        "--input-type=module",
        "-e",
        `const { fetchRemoteMarketplace } = await import(${JSON.stringify(githubModuleUrl)}); const marketplace = await fetchRemoteMarketplace('brasalabs6/skills-for-git', 'main'); if (!marketplace?.repositories?.some((entry) => entry.repo === 'brasalabs6/skills-for-git')) throw new Error('Remote .llms marketplace lookup failed');`,
      ],
      { cwd: tempRoot, env: smokeEnv },
    );

    console.log(
      `Package artifact OK: ${packageJson.name}@${packageJson.version} (${artifact.filename})`,
    );
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
}

main();
