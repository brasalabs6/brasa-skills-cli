import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export function readPackageVersion(): string {
  const packageJsonPath = fileURLToPath(
    new URL("../package.json", import.meta.url),
  );
  const parsed = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
    version?: unknown;
  };
  return typeof parsed.version === "string" ? parsed.version : "0.0.0";
}
