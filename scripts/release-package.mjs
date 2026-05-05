import { spawn } from "node:child_process";
import { mkdir, readdir, readFile, rm } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const releaseDir = join(repoRoot, "dist", "release");
const registry =
  process.env.BRASALABS_NPM_REGISTRY ??
  process.env.NPM_CONFIG_REGISTRY ??
  "https://registry.npmjs.org/";
const publishAccess = process.env.NPM_PUBLISH_ACCESS ?? "";
const mode = process.argv[2] ?? "dry-run";
const packageName = "@brasalabs/skills";
const tarballPrefix = "brasalabs-skills-";

if (!["pack", "dry-run", "publish"].includes(mode)) {
  throw new Error(
    `Unsupported release mode '${mode}'. Use pack, dry-run, or publish.`,
  );
}

await validateTagVersion();
await rm(releaseDir, { recursive: true, force: true });
await run("pnpm", ["build"]);
await mkdir(releaseDir, { recursive: true });
await run("npm", ["pack", "--pack-destination", releaseDir]);

const tarballs = await readdir(releaseDir);
const tarball = tarballs.find(
  (name) => name.startsWith(tarballPrefix) && name.endsWith(".tgz"),
);
if (!tarball) {
  throw new Error(
    `Missing ${packageName} tarball; found ${tarballs.join(", ")}`,
  );
}
const tarballPath = join(releaseDir, tarball);

if (mode === "pack") {
  console.log(`${packageName}: ${tarballPath}`);
  process.exit(0);
}

const publishArgs = [
  "publish",
  tarballPath,
  "--registry",
  registry,
  "--no-git-checks",
];
if (publishAccess) {
  publishArgs.push("--access", publishAccess);
}
if (mode === "dry-run") {
  publishArgs.push("--dry-run");
}
await run("npm", publishArgs);
console.log(
  `${mode === "publish" ? "Published" : "Publish dry-run OK"}: ${packageName} (${tarball})`,
);

async function validateTagVersion() {
  const refName = process.env.GITHUB_REF_NAME ?? "";
  if (!refName.startsWith("v")) return;

  const manifest = JSON.parse(
    await readFile(join(repoRoot, "package.json"), "utf8"),
  );
  if (manifest.version !== refName.slice(1)) {
    throw new Error(
      `${manifest.name}@${manifest.version} does not match release tag ${refName}.`,
    );
  }
}

function run(command, args) {
  console.log(`$ ${command} ${args.join(" ")}`);
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd: repoRoot,
      env: process.env,
      stdio: "inherit",
    });
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (code === 0) {
        resolvePromise();
        return;
      }
      reject(
        new Error(`${command} ${args.join(" ")} failed with ${signal ?? code}`),
      );
    });
  });
}
