import { readFile } from "node:fs/promises";
import { z } from "zod";
import { BrasaSkillsError } from "./errors.js";
import { assertSafeRelativePath, validateSkillName } from "./paths.js";

const repoNameSchema = z
  .string()
  .regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/, "Expected owner/repo format.");
const skillNameSchema = z
  .string()
  .regex(
    /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/,
    "Expected kebab-case skill name.",
  );
const safePathSchema = z
  .string()
  .min(1)
  .transform((value) => assertSafeRelativePath(value, "skill path"));

export const skillEntrySchema = z
  .object({
    name: skillNameSchema.transform((value) => validateSkillName(value)),
    path: safePathSchema,
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    aliases: z.array(skillNameSchema).optional(),
  })
  .strict();

export const repositoryEntrySchema = z
  .object({
    repo: repoNameSchema,
    defaultRef: z.string().min(1).optional(),
    description: z.string().optional(),
    skills: z.array(skillEntrySchema).min(1),
  })
  .strict();

export const marketplaceSchema = z
  .object({
    $schema: z.string().optional(),
    schemaVersion: z.literal(1),
    name: skillNameSchema,
    repositories: z.array(repositoryEntrySchema).min(1),
  })
  .strict();

export const installFileSchema = z
  .object({
    $schema: z.string().optional(),
    schemaVersion: z.literal(1),
    defaults: z
      .object({
        target: z.enum(["codex", "agents"]).optional(),
        scope: z.enum(["project", "global"]).optional(),
        ref: z.string().min(1).optional(),
      })
      .strict()
      .optional(),
    skills: z
      .array(
        z
          .object({
            repo: repoNameSchema,
            skill: skillNameSchema.optional(),
            target: z.enum(["codex", "agents"]).optional(),
            scope: z.enum(["project", "global"]).optional(),
            ref: z.string().min(1).optional(),
          })
          .strict(),
      )
      .min(1),
  })
  .strict();

export type MarketplaceInput = z.infer<typeof marketplaceSchema>;
export type InstallFileInput = z.infer<typeof installFileSchema>;

function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join(".") || "<root>"}: ${issue.message}`)
    .join("; ");
}

export async function readJsonFile(path: string): Promise<unknown> {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new BrasaSkillsError(`Failed to read JSON file ${path}: ${message}`);
  }
}

export function parseMarketplace(value: unknown): MarketplaceInput {
  const result = marketplaceSchema.safeParse(value);
  if (!result.success) {
    throw new BrasaSkillsError(
      `Invalid skills marketplace: ${formatZodError(result.error)}`,
    );
  }
  return result.data;
}

export function parseInstallFile(value: unknown): InstallFileInput {
  const result = installFileSchema.safeParse(value);
  if (!result.success) {
    throw new BrasaSkillsError(
      `Invalid skills install file: ${formatZodError(result.error)}`,
    );
  }
  return result.data;
}
