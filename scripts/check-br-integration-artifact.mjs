import { execFile } from "node:child_process";
import { mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const repoRoot = resolve(".");
const cliWorkspace = resolve("../cli");
const tempRoot = await mkdtemp(join(tmpdir(), "brasa-skills-br-smoke-"));

try {
  const tarballDir = join(tempRoot, "tarballs");
  const projectDir = join(tempRoot, "project");

  await execFileAsync("mkdir", ["-p", tarballDir, projectDir]);
  await execFileAsync("pnpm", [
    "--dir",
    cliWorkspace,
    "--filter",
    "@brasalabs/cli-core",
    "build",
  ]);
  await execFileAsync("pnpm", [
    "--dir",
    cliWorkspace,
    "--filter",
    "@brasalabs/cli",
    "build",
  ]);
  await execFileAsync("pnpm", [
    "--dir",
    cliWorkspace,
    "--filter",
    "@brasalabs/cli-core",
    "pack",
    "--pack-destination",
    tarballDir,
  ]);
  await execFileAsync("pnpm", [
    "--dir",
    cliWorkspace,
    "--filter",
    "@brasalabs/cli",
    "pack",
    "--pack-destination",
    tarballDir,
  ]);
  await execFileAsync("pnpm", ["--dir", repoRoot, "build"]);
  await execFileAsync("npm", ["pack", "--pack-destination", tarballDir], {
    cwd: repoRoot,
  });

  const tarballs = await readdir(tarballDir);
  const coreTarball = requireTarball(tarballs, "brasalabs-cli-core-");
  const cliTarball = requireTarball(
    tarballs.filter((name) => !name.startsWith("brasalabs-cli-core-")),
    "brasalabs-cli-",
  );
  const skillsTarball = requireTarball(tarballs, "brasalabs-skills-");
  const coreTarballPath = join(tarballDir, coreTarball);
  const cliTarballPath = join(tarballDir, cliTarball);
  const skillsTarballPath = join(tarballDir, skillsTarball);

  await writeFile(
    join(projectDir, "package.json"),
    JSON.stringify(
      {
        name: "brasa-skills-br-integration-smoke",
        private: true,
        type: "module",
        dependencies: {
          "@brasalabs/cli-core": `file:${coreTarballPath}`,
          "@brasalabs/cli": `file:${cliTarballPath}`,
          "@brasalabs/skills": `file:${skillsTarballPath}`,
        },
        pnpm: {
          overrides: {
            "@brasalabs/cli-core": `file:${coreTarballPath}`,
          },
        },
      },
      null,
      2,
    ),
  );
  await execFileAsync("pnpm", ["--dir", projectDir, "install"]);

  const br = join(projectDir, "node_modules", ".bin", "br");
  await assertCommand(
    br,
    ["skills", "list", "--json"],
    "brasalabs6/skills-for-git",
  );

  const skillsFile = join(projectDir, "skills.json");
  await writeFile(
    skillsFile,
    JSON.stringify(
      {
        schemaVersion: 1,
        skills: [
          { repo: "brasalabs6/skills-for-git", skill: "github-projects" },
        ],
      },
      null,
      2,
    ),
  );
  await assertCommand(br, ["skills", "validate-skills", skillsFile], "Valid");
} finally {
  await rm(tempRoot, { recursive: true, force: true });
}

function requireTarball(tarballs, prefix) {
  const tarball = tarballs.find(
    (name) => name.startsWith(prefix) && name.endsWith(".tgz"),
  );
  if (!tarball) {
    throw new Error(
      `Missing tarball with prefix ${prefix}; found ${tarballs.join(", ")}`,
    );
  }
  return tarball;
}

async function assertCommand(command, args, expected) {
  const { stdout, stderr } = await execFileAsync(command, args, {
    cwd: repoRoot,
  });
  const output = `${stdout}\n${stderr}`;
  if (!output.includes(expected)) {
    throw new Error(
      `Expected ${command} ${args.join(" ")} to include ${expected}; got ${output}`,
    );
  }
}
