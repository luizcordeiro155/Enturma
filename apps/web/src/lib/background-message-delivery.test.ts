import { afterEach, expect, test, vi } from "vitest";
import { receivePendingMessages } from "./background-message-delivery";
import { api, post } from "./api";
vi.mock("./api", () => ({ api: vi.fn(), post: vi.fn() }));
afterEach(() => vi.resetAllMocks());
const message = "00000000-0000-4000-8000-000000000001";
const conversation = "00000000-0000-4000-8000-000000000002";
test("background delivery fetches encrypted contents before acknowledging, never marks reading", async () => {
  vi.mocked(api)
    .mockResolvedValueOnce([
      { id: message, contextKey: `friend:${conversation}` },
    ])
    .mockImplementationOnce(async () => {
      expect(post).not.toHaveBeenCalled();
      return [{ id: message, ciphertext: "ciphertext", iv: "iv" }];
    });
  await receivePendingMessages(() => true, new AbortController().signal);
  expect(api).toHaveBeenLastCalledWith(
    `/friends/${conversation}/messages/target/${message}`,
    expect.anything(),
  );
  expect(post).toHaveBeenCalledExactlyOnceWith(
    `/friends/${conversation}/messages/receipts`,
    { messageIds: [message], read: false },
  );
});
test("a notice alone, failed fetch, inaccessible or deleted message cannot acknowledge delivery", async () => {
  for (const result of [
    [],
    [{ id: message, deletedAt: "now" }],
    [{ id: message, hiddenAt: "now" }],
    [{ id: message }],
  ]) {
    vi.mocked(api)
      .mockResolvedValueOnce([
        { id: message, contextKey: `friend:${conversation}` },
      ])
      .mockResolvedValueOnce(result);
    await receivePendingMessages(() => true, new AbortController().signal);
  }
  vi.mocked(api)
    .mockResolvedValueOnce([
      { id: message, contextKey: `friend:${conversation}` },
    ])
    .mockRejectedValueOnce(Error("Forbidden"));
  await receivePendingMessages(() => true, new AbortController().signal);
  expect(post).not.toHaveBeenCalled();
});
test("session switch during fetch cannot acknowledge as the next account", async () => {
  let active = true;
  vi.mocked(api)
    .mockResolvedValueOnce([
      { id: message, contextKey: `room:${conversation}` },
    ])
    .mockImplementationOnce(async () => {
      active = false;
      return [{ id: message, body: "Hello" }];
    });
  await receivePendingMessages(() => active, new AbortController().signal);
  expect(post).not.toHaveBeenCalled();
});
