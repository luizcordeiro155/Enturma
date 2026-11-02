import { expect, test } from "vitest";
import { messageReceiptState } from "./message-receipt";
test("never reports delivery for unknown history or partial group receipts", () => {
  expect(messageReceiptState({})).toBe("sent");
  expect(
    messageReceiptState({ receiptTotal: 2, deliveredCount: 1, readCount: 1 }),
  ).toBe("sent");
  expect(
    messageReceiptState({ receiptTotal: 2, deliveredCount: 2, readCount: 1 }),
  ).toBe("delivered");
  expect(
    messageReceiptState({ receiptTotal: 2, deliveredCount: 2, readCount: 2 }),
  ).toBe("read");
});
