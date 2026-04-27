import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchRemoteMarketplace } from "../src/github.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("GitHub marketplace fetch", () => {
  it("fetches remote marketplaces from the .llms path", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({ schemaVersion: 1, name: "remote", repositories: [] }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await fetchRemoteMarketplace("brasalabs6/skills-for-git", "main");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://raw.githubusercontent.com/brasalabs6/skills-for-git/main/.llms/skills.marketplace.json",
      expect.objectContaining({ headers: expect.any(Object) }),
    );
  });
});
