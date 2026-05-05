import type { Command } from "commander";

export interface BrCliContextLike {
  cwd: string;
  env: NodeJS.ProcessEnv;
  output?: {
    write(message: string): void;
    warn(message: string): void;
    error(message: string): void;
    json(value: unknown): void;
  };
}

export interface BrCommandModuleLike {
  id: string;
  command: string;
  summary: string;
  version?: string;
  register(program: Command, context: BrCliContextLike): void | Promise<void>;
}
