import { describe, expect, it, vi } from "vitest";
import {
  GithubError,
  githubLogin,
  listRepos,
  projectFromRepo,
  repoLanguages,
  type GithubRepo,
} from "./github-repos";

const answer = (
  body: unknown,
  status = 200,
  headers: Record<string, string> = {},
) => new Response(JSON.stringify(body), { status, headers });

const raw = {
  full_name: "ana-dev/caronas",
  name: "caronas",
  description: "App de caronas",
  html_url: "https://github.com/ana-dev/caronas",
  homepage: "https://caronas.example.test",
  language: "Java",
  topics: ["spring-boot", "postgresql"],
  stargazers_count: 12,
  fork: false,
  archived: false,
  pushed_at: "2026-10-02T12:00:00Z",
};

describe("GitHub repositories", () => {
  it("accepts a user name however the student writes it", () => {
    expect(githubLogin("ana-dev")).toBe("ana-dev");
    expect(githubLogin(" @ana-dev ")).toBe("ana-dev");
    expect(githubLogin("https://github.com/ana-dev/")).toBe("ana-dev");
    expect(githubLogin("github.com/ana-dev/caronas")).toBe("ana-dev");
    expect(githubLogin("ana dev")).toBeNull();
    expect(githubLogin("https://evil.example.test/ana-dev")).toBeNull();
    expect(githubLogin("")).toBeNull();
  });

  it("asks GitHub only for the public repositories the user owns", async () => {
    const fetcher = vi.fn(async () => answer([raw]));
    const repos = await listRepos("ana-dev", fetcher);
    expect(fetcher).toHaveBeenCalledTimes(1);
    const [url, init] = fetcher.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe(
      "https://api.github.com/users/ana-dev/repos?type=owner&sort=pushed&per_page=100",
    );
    // no token, no cookies: nothing of the student's goes along
    expect(init.credentials).toBe("omit");
    expect(new Headers(init.headers).has("authorization")).toBe(false);
    expect(repos).toEqual([
      {
        fullName: "ana-dev/caronas",
        name: "caronas",
        description: "App de caronas",
        url: "https://github.com/ana-dev/caronas",
        homepage: "https://caronas.example.test",
        language: "Java",
        topics: ["spring-boot", "postgresql"],
        stars: 12,
        fork: false,
        archived: false,
        pushedAt: "2026-10-02T12:00:00Z",
      },
    ]);
  });

  it("says what went wrong in words the student can act on", async () => {
    await expect(
      listRepos("ninguem", async () => answer({ message: "Not Found" }, 404)),
    ).rejects.toMatchObject({ reason: "missing" });
    await expect(
      listRepos("ana-dev", async () =>
        answer({ message: "rate limit" }, 403, {
          "x-ratelimit-remaining": "0",
        }),
      ),
    ).rejects.toMatchObject({ reason: "limited" });
    await expect(
      listRepos("ana-dev", async () => {
        throw new TypeError("Failed to fetch");
      }),
    ).rejects.toBeInstanceOf(GithubError);
  });

  it("orders languages by how much of the repository they are", async () => {
    const languages = await repoLanguages("ana-dev/caronas", async () =>
      answer({ CSS: 200, Java: 9000, TypeScript: 3000 }),
    );
    expect(languages).toEqual(["Java", "TypeScript", "CSS"]);
    // languages are a nicety: a failure leaves the import going
    expect(
      await repoLanguages("ana-dev/caronas", async () => answer({}, 500)),
    ).toEqual([]);
  });

  it("turns a repository into a project draft the student can still edit", () => {
    const repo: GithubRepo = {
      fullName: "ana-dev/caronas-app",
      name: "caronas-app",
      description: "App de caronas",
      url: "https://github.com/ana-dev/caronas-app",
      homepage: "javascript:alert(1)",
      language: "Java",
      topics: ["spring-boot", "java"],
      stars: 12,
      fork: true,
      archived: false,
      pushedAt: "2026-10-02T12:00:00Z",
    };
    const draft = projectFromRepo(repo, ["Java", "TypeScript"]);
    expect(draft).toMatchObject({
      name: "caronas-app",
      description: "App de caronas",
      url: "",
      repoUrl: "https://github.com/ana-dev/caronas-app",
      kind: "OPEN_SOURCE",
      technologies: ["Java", "TypeScript", "spring-boot"],
      github: {
        fullName: "ana-dev/caronas-app",
        stars: 12,
        fork: true,
        updatedAt: "2026-10-02T12:00:00Z",
      },
    });
    expect(draft.id).toBeTruthy();
    expect(projectFromRepo({ ...repo, fork: false }, []).kind).toBe("PERSONAL");
  });
});
