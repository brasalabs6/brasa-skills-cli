import { describe, expect, it } from "vitest";
import {
  assertSafeRelativePath,
  resolveDefaultInstallFile,
  resolveDestination,
} from "../src/paths.js";

describe("path and destination resolution", () => {
  it("defaults to project-local codex skills", () => {
    expect(
      resolveDestination({ cwd: "/tmp/project", home: "/tmp/home" }),
    ).toEqual({
      target: "codex",
      scope: "project",
      root: "/tmp/project/.codex/skills",
    });
  });

  it("resolves global agents skills", () => {
    expect(
      resolveDestination({
        agents: true,
        global: true,
        cwd: "/tmp/project",
        home: "/tmp/home",
      }),
    ).toEqual({
      target: "agents",
      scope: "global",
      root: "/tmp/home/.agents/skills",
    });
  });

  it("resolves project and global default install files", () => {
    expect(
      resolveDefaultInstallFile({ cwd: "/tmp/project", home: "/tmp/home" }),
    ).toBe("/tmp/project/.llms/skills.json");
    expect(
      resolveDefaultInstallFile({
        global: true,
        cwd: "/tmp/project",
        home: "/tmp/home",
      }),
    ).toBe("/tmp/home/.llms/skills.json");
  });

  it("rejects unsafe relative paths", () => {
    expect(() => assertSafeRelativePath("../bad")).toThrow(
      /inside the repository/,
    );
    expect(() => assertSafeRelativePath("/bad")).toThrow(/relative/);
  });
});
