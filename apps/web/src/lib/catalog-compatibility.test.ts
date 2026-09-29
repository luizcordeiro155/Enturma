import { it, expect, vi } from "vitest";
import { ApiError, catalogOptions } from "@enturma/contracts";
it("keeps onboarding available during the separate SquareCloud upload", async () => {
  const fetcher = vi
    .fn()
    .mockRejectedValueOnce(new ApiError(500, "Old backend route"))
    .mockResolvedValueOnce([
      { id: "1", name: "Análise e Desenvolvimento de Sistemas" },
    ]);
  const result = await catalogOptions(fetcher, "kind=COURSE&search=ADS&page=0");
  expect(result.items).toHaveLength(1);
  expect(fetcher.mock.calls[1][0]).toContain("/academics?");
  expect(
    decodeURIComponent(fetcher.mock.calls[1][0]).replaceAll("+", " "),
  ).toContain("Análise e Desenvolvimento de Sistemas");
});
it("does not bypass authorization failures", async () => {
  const fetcher = vi.fn().mockRejectedValue(new ApiError(403, "Forbidden"));
  await expect(
    catalogOptions(fetcher, "kind=INSTITUTION"),
  ).rejects.toHaveProperty("status", 403);
  expect(fetcher).toHaveBeenCalledTimes(1);
});
