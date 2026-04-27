export type TargetKind = "codex" | "agents";
export type InstallScope = "project" | "global";
export type InstallStatus = "installed" | "updated" | "skipped-dry-run";

export interface SkillEntry {
  name: string;
  path: string;
  description?: string;
  tags?: string[];
  aliases?: string[];
}

export interface RepositoryEntry {
  repo: string;
  defaultRef?: string;
  description?: string;
  skills: SkillEntry[];
}

export interface SkillsMarketplace {
  $schema?: string;
  schemaVersion: 1;
  name: string;
  repositories: RepositoryEntry[];
}

export interface SkillsInstallFile {
  $schema?: string;
  schemaVersion: 1;
  defaults?: {
    target?: TargetKind;
    scope?: InstallScope;
    ref?: string;
  };
  skills: InstallRequest[];
}

export interface InstallRequest {
  repo: string;
  skill?: string;
  target?: TargetKind;
  scope?: InstallScope;
  ref?: string;
}

export interface DestinationOptions {
  codex?: boolean;
  agents?: boolean;
  project?: boolean;
  global?: boolean;
  cwd?: string;
  home?: string;
}

export interface ResolvedDestination {
  target: TargetKind;
  scope: InstallScope;
  root: string;
}

export interface ResolvedSkillInstall {
  repo: string;
  ref: string;
  skill: SkillEntry;
  destination: ResolvedDestination;
}

export interface InstallResult {
  repo: string;
  ref: string;
  skill: string;
  sourcePath: string;
  destination: string;
  status: InstallStatus;
}

export interface InstallOptions extends DestinationOptions {
  repo?: string;
  skill?: string;
  skillsFile?: string;
  ref?: string;
  marketplace?: string;
  dryRun?: boolean;
  save?: boolean;
  json?: boolean;
  cwd?: string;
  home?: string;
}
