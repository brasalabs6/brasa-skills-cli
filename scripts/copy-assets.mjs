import { chmodSync, cpSync, mkdirSync } from "node:fs";

mkdirSync("dist/catalog", { recursive: true });
cpSync("catalog", "dist/catalog", { recursive: true });

chmodSync("dist/cli.js", 0o755);
