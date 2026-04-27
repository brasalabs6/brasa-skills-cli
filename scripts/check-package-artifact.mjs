import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    encoding: "utf8",
    stdio: options.stdio ?? "pipe",
    ...options,
  });
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
    const installFile = path.join(tempRoot, "skills.install.json");
    writeFileSync(
      installFile,
      JSON.stringify(
        {
          schemaVersion: 1,
          defaults: { target: "codex", scope: "project", ref: "main" },
          skills: [
            { repo: "brasalabs6/skills-for-git", skill: "git-workflow" },
          ],
        },
        null,
        2,
      ),
    );
    run(bin, ["validate-skills", installFile], { cwd: tempRoot });
    console.log(
      `Package artifact OK: ${packageJson.name}@${packageJson.version} (${artifact.filename})`,
    );
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
}

main();
