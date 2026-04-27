import { homedir } from "node:os";
import path from "node:path";
import { BrasaSkillsError } from "./errors.js";
import type {
  DestinationOptions,
  InstallScope,
  ResolvedDestination,
  TargetKind,
} from "./types.js";

export function assertSafeRelativePath(value: string, label = "path"): string {
  if (!value.trim()) {
    throw new BrasaSkillsError(`${label} must not be empty.`);
  }
  if (path.posix.isAbsolute(value) || path.win32.isAbsolute(value)) {
    throw new BrasaSkillsError(`${label} must be relative: ${value}`);
  }
  const normalized = path.posix.normalize(value.replaceAll("\\", "/"));
  if (
    normalized === "." ||
    normalized.startsWith("../") ||
    normalized === ".." ||
    normalized.includes("/../")
  ) {
    throw new BrasaSkillsError(
      `${label} must stay inside the repository: ${value}`,
    );
  }
  return normalized;
}

export function validateSkillName(value: string): string {
  if (!/^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/.test(value)) {
    throw new BrasaSkillsError(`Invalid skill name: ${value}`);
  }
  return value;
}

export function resolveDestination(
  options: DestinationOptions = {},
): ResolvedDestination {
  if (options.codex && options.agents) {
    throw new BrasaSkillsError("Use only one of --codex or --agents.");
  }
  if (options.project && options.global) {
    throw new BrasaSkillsError("Use only one of --project or --global.");
  }
  const target: TargetKind = options.agents ? "agents" : "codex";
  const scope: InstallScope = options.global ? "global" : "project";
  const base =
    scope === "global"
      ? (options.home ?? homedir())
      : (options.cwd ?? process.cwd());
  const root = path.resolve(
    base,
    target === "codex" ? ".codex/skills" : ".agents/skills",
  );
  return { target, scope, root };
}
