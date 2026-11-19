import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react";
import { RideChat, useRideConversation } from "./ride-chat";

const api = vi.hoisted(() => vi.fn());
const post = vi.hoisted(() => vi.fn());
const live = vi.hoisted(() => ({
  refresh: undefined as undefined | (() => Promise<void>),
}));
vi.mock("@/lib/api", () => ({ api, post }));
vi.mock("@/lib/use-ride-updates", () => ({
  useRideUpdates: (refresh: () => Promise<void>, enabled = true) => {
    live.refresh = enabled ? refresh : undefined;
    return true;
  },
}));

// The API answers newest first.
const fromDriver = {
  id: "m2",
  body: "Estou chegando",
  createdAt: "2026-11-18T21:02:00Z",
  userId: "driver",
  name: "Caco",
};
const fromMe = {
  id: "m1",
  body: "Oi, estou na portaria",
  createdAt: "2026-11-18T21:01:00Z",
  userId: "me",
  name: "Luiz",
};

beforeEach(() => {
  sessionStorage.clear();
  api.mockResolvedValue([fromDriver, fromMe]);
  post.mockResolvedValue(undefined);
  Element.prototype.scrollTo = vi.fn();
});
afterEach(() => {
  cleanup();
  api.mockReset();
  post.mockReset();
});

const conversation = (open: boolean, matchId: string | undefined = "match-1") =>
  renderHook(({ open }) => useRideConversation(matchId, "me", open), {
    initialProps: { open },
  });

it("loads the conversation of the ride in the order it happened", async () => {
  const { result } = conversation(true);
  await waitFor(() => expect(result.current.messages).toHaveLength(2));
  expect(api).toHaveBeenCalledWith("/matches/match-1/messages", {
    cache: "no-store",
  });
  expect(result.current.messages.map((message) => message.id)).toEqual([
    "m1",
    "m2",
  ]);
});

it("counts what the other person wrote while the chat was closed", async () => {
  const { result, rerender } = conversation(false);
  await waitFor(() => expect(result.current.unread).toBe(1));
  rerender({ open: true });
  await waitFor(() => expect(result.current.unread).toBe(0));
  rerender({ open: false });
  api.mockResolvedValue([
    { ...fromDriver, id: "m3", body: "Cheguei" },
    fromDriver,
    fromMe,
  ]);
  await act(async () => {
    await live.refresh?.();
  });
  expect(result.current.unread).toBe(1);
});

it("sends a message and shows it without waiting for the next update", async () => {
  const { result } = conversation(true);
  await waitFor(() => expect(result.current.messages).toHaveLength(2));
  api.mockResolvedValue([
    { ...fromMe, id: "m3", body: "Já desço" },
    fromDriver,
    fromMe,
  ]);
  await act(async () => {
    await result.current.send("  Já desço  ");
  });
  expect(post).toHaveBeenCalledWith("/matches/match-1/messages", {
    body: "Já desço",
  });
  expect(result.current.messages.at(-1)?.body).toBe("Já desço");
});

it("closes for good when the ride is over", async () => {
  const { result } = conversation(true);
  await waitFor(() => expect(result.current.messages).toHaveLength(2));
  post.mockRejectedValue(
    new Error(
      "Conversa encerrada. Não é possível enviar mensagens ou entrar na chamada.",
    ),
  );
  await act(async () => {
    await result.current.send("Oi?");
  });
  expect(result.current.closed).toBe(true);
});

it("does nothing without a ride", () => {
  const { result } = conversation(true, undefined);
  expect(result.current.messages).toEqual([]);
  expect(api).not.toHaveBeenCalled();
});

const panel = (override: Partial<Parameters<typeof RideChat>[0]> = {}) => {
  const props = {
    me: "me",
    peer: { id: "driver", name: "Caco", detail: "Honda Fit · Prata" },
    messages: [fromMe, fromDriver],
    closed: false,
    error: "",
    send: vi.fn().mockResolvedValue(undefined),
    onClose: vi.fn(),
    ...override,
  };
  render(<RideChat {...props} />);
  return props;
};

it("shows who said what, and that the conversation is temporary", () => {
  panel();
  const chat = screen.getByRole("dialog", { name: "Conversa com Caco" });
  expect(chat).toHaveTextContent("Honda Fit · Prata");
  expect(screen.getByText(/só existe durante a corrida/i)).toBeInTheDocument();
  expect(
    screen.getByText("Oi, estou na portaria").closest("li"),
  ).toHaveAttribute("data-mine", "true");
  expect(screen.getByText("Estou chegando").closest("li")).toHaveAttribute(
    "data-mine",
    "false",
  );
});

it("sends what was typed with Enter and clears the field", async () => {
  const { send } = panel();
  const field = screen.getByLabelText("Mensagem");
  fireEvent.change(field, { target: { value: "Já desço" } });
  fireEvent.submit(field.closest("form")!);
  await waitFor(() => expect(send).toHaveBeenCalledWith("Já desço"));
  await waitFor(() => expect(field).toHaveValue(""));
});

it("offers quick replies that are sent with one tap", async () => {
  const { send } = panel({ messages: [] });
  fireEvent.click(screen.getByRole("button", { name: "Estou a caminho" }));
  await waitFor(() => expect(send).toHaveBeenCalledWith("Estou a caminho"));
});

it("stops taking messages once the ride has ended", () => {
  panel({ closed: true });
  expect(screen.queryByLabelText("Mensagem")).toBeNull();
  expect(screen.getByRole("status")).toHaveTextContent(
    "Conversa encerrada: a corrida terminou.",
  );
});

it("goes back to the ride", () => {
  const { onClose } = panel();
  fireEvent.click(screen.getByRole("button", { name: "Voltar à corrida" }));
  expect(onClose).toHaveBeenCalled();
});
