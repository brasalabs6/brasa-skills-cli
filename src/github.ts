import { execFileSync } from "node:child_process";
import { rmSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import AdmZip from "adm-zip";
import { BrasaSkillsError } from "./errors.js";
import { assertSafeRelativePath } from "./paths.js";

export interface PreparedRepo {
  root: string;
  cleanup: () => Promise<void>;
}

function splitRepo(repo: string): { owner: string; name: string } {
  const [owner, name] = repo.split("/");
  if (!owner || !name) {
    throw new BrasaSkillsError(`Expected owner/repo format: ${repo}`);
  }
  return { owner, name };
}

function githubHeaders(): Record<string, string> {
  const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
  return token
    ? { Authorization: `Bearer ${token}`, "User-Agent": "brasa-skills" }
    : { "User-Agent": "brasa-skills" };
}

async function downloadZip(
  repo: string,
  ref: string,
  dest: string,
): Promise<string> {
  const { owner, name } = splitRepo(repo);
  const response = await fetch(
    `https://codeload.github.com/${owner}/${name}/zip/${encodeURIComponent(ref)}`,
    {
      headers: githubHeaders(),
    },
  );
  if (!response.ok) {
    throw new BrasaSkillsError(
      `Download failed for ${repo}@${ref}: HTTP ${response.status}`,
    );
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  const zip = new AdmZip(bytes);
  const entries = zip.getEntries();
  const topLevels = new Set<string>();
  for (const entry of entries) {
    const normalized = entry.entryName.replaceAll("\\", "/");
    if (
      path.posix.isAbsolute(normalized) ||
      normalized.split("/").includes("..")
    ) {
      throw new BrasaSkillsError("Downloaded archive contains an unsafe path.");
    }
    const [top] = normalized.split("/");
    if (top) {
      topLevels.add(top);
    }
  }
  if (topLevels.size !== 1) {
    throw new BrasaSkillsError("Downloaded archive has an unexpected layout.");
  }
  zip.extractAllTo(dest, true);
  return path.join(dest, [...topLevels][0]);
}

function gitSparseCheckout(
  repo: string,
  ref: string,
  paths: string[],
  dest: string,
): string {
  const { owner, name } = splitRepo(repo);
  const repoDir = path.join(dest, "repo");
  const httpsUrl = `https://github.com/${owner}/${name}.git`;
  const sshUrl = `git@github.com:${owner}/${name}.git`;
  const safePaths = paths.map((value) =>
    assertSafeRelativePath(value, "sparse path"),
  );

  const clone = (url: string, withBranch: boolean) => {
    const args = [
      "clone",
      "--filter=blob:none",
      "--depth",
      "1",
      "--sparse",
      "--single-branch",
    ];
    if (withBranch) {
      args.push("--branch", ref);
    }
    args.push(url, repoDir);
    execFileSync("git", args, { stdio: "pipe" });
  };

  try {
    clone(httpsUrl, true);
  } catch {
    try {
      rmSync(repoDir, { recursive: true, force: true });
      clone(httpsUrl, false);
    } catch {
      rmSync(repoDir, { recursive: true, force: true });
      clone(sshUrl, false);
    }
  }
  execFileSync("git", ["-C", repoDir, "sparse-checkout", "set", ...safePaths], {
    stdio: "pipe",
  });
  execFileSync("git", ["-C", repoDir, "checkout", ref], { stdio: "pipe" });
  return repoDir;
}

export async function prepareGithubRepo(
  repo: string,
  ref: string,
  paths: string[],
): Promise<PreparedRepo> {
  const tempRoot = await mkdtemp(path.join(tmpdir(), "brasa-skills-"));
  try {
    let root: string;
    try {
      root = await downloadZip(repo, ref, tempRoot);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (
        !message.includes("HTTP 401") &&
        !message.includes("HTTP 403") &&
        !message.includes("HTTP 404")
      ) {
        throw error;
      }
      root = gitSparseCheckout(repo, ref, paths, tempRoot);
    }
    return {
      root,
      cleanup: () => rm(tempRoot, { recursive: true, force: true }),
    };
  } catch (error) {
    await rm(tempRoot, { recursive: true, force: true });
    throw error;
  }
}

export async function fetchRemoteMarketplace(
  repo: string,
  ref: string,
): Promise<unknown> {
  const { owner, name } = splitRepo(repo);
  const url = `https://raw.githubusercontent.com/${owner}/${name}/${encodeURIComponent(ref)}/.llms/skills.marketplace.json`;
  const response = await fetch(url, { headers: githubHeaders() });
  if (!response.ok) {
    throw new BrasaSkillsError(
      `Remote marketplace not found for ${repo}@${ref}: HTTP ${response.status}`,
    );
  }
  return response.json();
}
