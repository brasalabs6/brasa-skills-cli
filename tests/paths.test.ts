import { describe, expect, it } from "vitest";
import { assertSafeRelativePath, resolveDestination } from "../src/paths.js";

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

  it("rejects unsafe relative paths", () => {
    expect(() => assertSafeRelativePath("../bad")).toThrow(
      /inside the repository/,
    );
    expect(() => assertSafeRelativePath("/bad")).toThrow(/relative/);
  });
});
