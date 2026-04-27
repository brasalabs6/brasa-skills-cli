import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseInstallFile } from "./schemas.js";
import type {
  InstallRequest,
  InstallScope,
  SkillsInstallFile,
  TargetKind,
} from "./types.js";

const INSTALL_SCHEMA_URL =
  "https://raw.githubusercontent.com/brasalabs6/brasa-skills-cli/main/schemas/skills-install.schema.json";

export type InstallFileSaveStatus =
  | "created"
  | "added"
  | "updated"
  | "unchanged";

export interface SaveInstallEntryInput {
  file: string;
  repo: string;
  skill?: string;
  target: TargetKind;
  scope: InstallScope;
  ref: string;
  dryRun?: boolean;
}

export interface SaveInstallEntryResult {
  path: string;
  status: InstallFileSaveStatus;
  entry: InstallRequest;
  installFile: SkillsInstallFile;
  content: string;
}

function createInstallFile(input: SaveInstallEntryInput): SkillsInstallFile {
  return {
    $schema: INSTALL_SCHEMA_URL,
    schemaVersion: 1,
    defaults: {
      target: input.target,
      scope: input.scope,
      ref: input.ref,
    },
    skills: [],
  };
}

async function readInstallFile(
  file: string,
  input: SaveInstallEntryInput,
): Promise<{ installFile: SkillsInstallFile; created: boolean }> {
  if (!existsSync(file)) {
    return { installFile: createInstallFile(input), created: true };
  }
  const raw = JSON.parse(await readFile(file, "utf8"));
  return { installFile: parseInstallFile(raw), created: false };
}

function normalizeEntry(input: SaveInstallEntryInput): InstallRequest {
  return {
    repo: input.repo,
    ...(input.skill ? { skill: input.skill } : {}),
    target: input.target,
    scope: input.scope,
    ref: input.ref,
  };
}

function sameInstallIdentity(
  left: InstallRequest,
  right: InstallRequest,
): boolean {
  return (
    left.repo === right.repo && (left.skill ?? null) === (right.skill ?? null)
  );
}

function sameInstallEntry(
  left: InstallRequest,
  right: InstallRequest,
): boolean {
  return (
    sameInstallIdentity(left, right) &&
    left.target === right.target &&
    left.scope === right.scope &&
    left.ref === right.ref
  );
}

function serializeInstallFile(installFile: SkillsInstallFile): string {
  return `${JSON.stringify(installFile, null, 2)}\n`;
}

export async function saveInstallEntry(
  input: SaveInstallEntryInput,
): Promise<SaveInstallEntryResult> {
  const absolutePath = path.resolve(input.file);
  const { installFile, created } = await readInstallFile(absolutePath, input);
  const entry = normalizeEntry(input);
  const existingIndex = installFile.skills.findIndex((candidate) =>
    sameInstallIdentity(candidate, entry),
  );
  let status: InstallFileSaveStatus = created ? "created" : "added";

  if (existingIndex >= 0) {
    if (sameInstallEntry(installFile.skills[existingIndex], entry)) {
      status = "unchanged";
    } else {
      installFile.skills[existingIndex] = entry;
      status = "updated";
    }
  } else {
    installFile.skills.push(entry);
  }

  const content = serializeInstallFile(installFile);
  parseInstallFile(JSON.parse(content));

  if (!input.dryRun) {
    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, content, "utf8");
  }

  return { path: absolutePath, status, entry, installFile, content };
}
