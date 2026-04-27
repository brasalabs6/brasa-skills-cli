import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchRemoteMarketplace } from "../src/github.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("GitHub marketplace fetch", () => {
  it("fetches remote marketplaces from the .llms path", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        content: Buffer.from(
          JSON.stringify({
            schemaVersion: 1,
            name: "remote",
            repositories: [],
          }),
        ).toString("base64"),
        encoding: "base64",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await fetchRemoteMarketplace("brasalabs6/skills-for-git", "main");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.github.com/repos/brasalabs6/skills-for-git/contents/.llms/skills.marketplace.json?ref=main",
      expect.objectContaining({ headers: expect.any(Object) }),
    );
  });
});
