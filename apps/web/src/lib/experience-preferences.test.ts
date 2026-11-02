import { beforeEach, expect, it, vi } from "vitest";
vi.mock("./api", () => ({ api: vi.fn() }));
beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  vi.resetModules();
});
it("ignores a stale server response after a local theme choice", async () => {
  const { api } = await import("./api");
  let resolve!: (value: unknown) => void;
  vi.mocked(api).mockImplementation(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  const store = await import("./experience-preferences");
  const pending = store.syncExperience();
  await store.saveExperience(
    { ...store.experienceDefaults, theme: "ENTURMA", highContrast: true },
    true,
  );
  resolve({ ...store.experienceDefaults, theme: "LIGHT" });
  await pending;
  expect(store.getExperience()).toMatchObject({
    theme: "ENTURMA",
    highContrast: true,
  });
  store.hydrateExperience();
  expect(store.getExperience().theme).toBe("ENTURMA");
});
it("serializes rapid saves and keeps the newest preference pending until acknowledged", async () => {
  const { api } = await import("./api");
  const completions: (() => void)[] = [];
  vi.mocked(api).mockImplementation(
    () => new Promise<void>((r) => completions.push(r)),
  );
  const store = await import("./experience-preferences");
  const first = store.saveExperience({
    ...store.experienceDefaults,
    theme: "DARK",
  });
  const second = store.saveExperience({
    ...store.experienceDefaults,
    theme: "ENTURMA",
  });
  expect(api).toHaveBeenCalledTimes(1);
  completions.shift()!();
  await vi.waitFor(() => expect(api).toHaveBeenCalledTimes(2));
  expect(
    JSON.parse(localStorage.getItem("enturma-experience-pending")!).theme,
  ).toBe("ENTURMA");
  completions.shift()!();
  await Promise.all([first, second]);
  expect(localStorage.getItem("enturma-experience-pending")).toBeNull();
  expect(store.getExperience().theme).toBe("ENTURMA");
});
