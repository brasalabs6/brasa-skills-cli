import { describe, expect, it } from "vitest";
import {
  expandRepositorySkills,
  findRepository,
  loadEmbeddedMarketplace,
} from "../src/catalog.js";

describe("catalog", () => {
  it("loads the embedded marketplace", async () => {
    const marketplace = await loadEmbeddedMarketplace();
    expect(
      findRepository(marketplace, "brasalabs6/skills-for-planning")?.skills
        .length,
    ).toBe(5);
  });

  it("expands all repo skills or a single skill", async () => {
    const marketplace = await loadEmbeddedMarketplace();
    const repository = findRepository(marketplace, "brasalabs6/skills-for-git");
    if (!repository) {
      throw new Error(
        "Expected skills-for-git repository in embedded marketplace.",
      );
    }
    expect(expandRepositorySkills(repository, undefined)).toHaveLength(2);
    expect(expandRepositorySkills(repository, "git-workflow")).toHaveLength(1);
  });
});
