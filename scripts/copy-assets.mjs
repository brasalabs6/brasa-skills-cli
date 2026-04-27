import { cpSync, mkdirSync } from "node:fs";

mkdirSync("dist/catalog", { recursive: true });
mkdirSync("dist/schemas", { recursive: true });
cpSync("catalog", "dist/catalog", { recursive: true });
cpSync("schemas", "dist/schemas", { recursive: true });
