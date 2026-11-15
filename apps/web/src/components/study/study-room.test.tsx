import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { StudyRoom } from "./study-room";

const api = vi.hoisted(() => vi.fn());
const push = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api", () => ({ api }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("../shell", () => ({ Shell: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("../study-notebooks", () => ({ StudyAnswer: ({ content }: { content: string }) => <p>{content}</p> }));

const session = {
  id: "s1",
  subjectId: "calc",
  subjectName: "Cálculo I",
  notebookId: "n1",
  startsAt: "2026-12-03T22:00:00Z",
  minutes: 45,
  goal: "Limites laterais",
  status: "ACTIVE",
  personality: "BALANCED",
  difficulty: "",
  startedAt: new Date().toISOString(),
  finishedAt: null,
};

const quiz = {
  id: "q1",
  kind: "QUIZ",
  question: "Gerar quiz",
  status: "READY",
  createdAt: "2026-12-03T22:20:00Z",
  quiz: [
    { question: "Limite de x em 2?", options: ["1", "2"], topic: "Limites" },
    { question: "Derivada de x²?", options: ["2x", "x"], topic: "Derivadas" },
  ],
};

function serve(room: Record<string, unknown>) {
  api.mockImplementation((path: string, init?: RequestInit) => {
    if (path === "/study/sessions/s1" && !init?.method) return Promise.resolve(room);
    if (path.endsWith("/answers"))
      return Promise.resolve({
        score: 1,
        total: 2,
        done: false,
        weakTopics: ["Limites"],
        results: [
          { correct: false, chosen: 0, answer: 1, explanation: "Substitua x por 2.", topic: "Limites" },
          { correct: true, chosen: 0, answer: 0, explanation: "Regra da potência.", topic: "Derivadas" },
        ],
      });
    return Promise.resolve({ id: "x" });
  });
}

beforeEach(() => {
  api.mockReset();
  push.mockReset();
});
afterEach(cleanup);

it("greets with the tutor's personality and sends the student's difficulty", async () => {
  serve({ session, messages: [], sources: [], mastery: { level: "BEGINNER" } });
  render(<StudyRoom id="s1" />);
  expect(await screen.findByRole("heading", { name: "Cálculo I" })).toBeInTheDocument();
  expect(screen.getByText(/qual é a sua maior dificuldade/i)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /gerar quiz/i })).toBeDisabled();

  fireEvent.change(screen.getByLabelText("Mensagem para o tutor"), { target: { value: "Não entendo limites laterais" } });
  await act(async () => fireEvent.click(screen.getByRole("button", { name: "Enviar" })));
  const call = api.mock.calls.find(([path]) => path === "/study/sessions/s1/messages");
  expect(JSON.parse(String(call?.[1]?.body))).toMatchObject({ message: "Não entendo limites laterais" });
  expect(JSON.parse(String(call?.[1]?.body)).id).toMatch(/^[0-9a-f-]{36}$/);
});

it("a planned session asks before starting and can be given up", async () => {
  serve({ session: { ...session, status: "PLANNED", startedAt: null }, messages: [], sources: [], mastery: { level: "BEGINNER" } });
  render(<StudyRoom id="s1" />);
  expect(await screen.findByRole("heading", { name: /pronto para estudar cálculo i/i })).toBeInTheDocument();
  expect(screen.queryByLabelText("Mensagem para o tutor")).not.toBeInTheDocument();
  await act(async () => fireEvent.click(screen.getByRole("button", { name: /desistir desta vez/i })));
  expect(api).toHaveBeenCalledWith("/study/sessions/s1/skip", { method: "POST" });
  expect(push).toHaveBeenCalledWith("/home#enturma-study");
});

it("grades the quiz, shows the right answers and offers to continue or schedule", async () => {
  serve({ session, messages: [quiz], sources: [], mastery: { level: "BEGINNER" } });
  render(<StudyRoom id="s1" />);
  const card = await screen.findByRole("heading", { name: "Quiz da sessão" });
  const form = card.closest("form")!;
  expect(within(form).getByRole("button", { name: /enviar respostas/i })).toBeDisabled();

  fireEvent.click(within(form).getAllByRole("radio")[0]);
  fireEvent.click(within(form).getAllByRole("radio")[2]);
  await act(async () => fireEvent.click(within(form).getByRole("button", { name: /enviar respostas/i })));
  const call = api.mock.calls.find(([path]) => path === "/study/sessions/s1/quiz/q1/answers");
  expect(JSON.parse(String(call?.[1]?.body))).toEqual({ answers: [0, 0] });
  expect(await within(form).findByText("Você acertou 1 de 2.")).toBeInTheDocument();
  expect(within(form).getByText("Substitua x por 2.")).toBeInTheDocument();
  expect(within(form).getAllByLabelText("Resposta certa", { selector: "svg" })).toHaveLength(2);
  expect(within(form).getAllByLabelText("Sua resposta", { selector: "svg" })).toHaveLength(1);
  expect(within(form).queryByRole("button", { name: /enviar respostas/i })).not.toBeInTheDocument();
});

const graded = {
  ...quiz,
  quiz: quiz.quiz.map((q, i) => ({ ...q, answer: i ? 0 : 1, explanation: "x" })),
  attempt: { answers: [0, 0], score: 1, total: 2, wrongTopics: ["Limites"] },
};

it("'Continuar agora' sends the weak topics and the panel leaves until the next quiz", async () => {
  const room = { session, messages: [graded] as unknown[], sources: [], mastery: { level: "DEVELOPING" } };
  serve(room);
  api.mockImplementation((path: string, init?: RequestInit) => {
    if (path === "/study/sessions/s1/messages") {
      room.messages = [...room.messages, { id: "c1", kind: "CHAT", question: JSON.parse(String(init!.body)).message, answer: "Vamos lá.", status: "READY", createdAt: "" }];
      return Promise.resolve({ id: "c1" });
    }
    return Promise.resolve({ ...room });
  });
  render(<StudyRoom id="s1" />);
  const next = await screen.findByRole("group", { name: "Próximo passo" });
  expect(next).toHaveTextContent("Limites");
  await act(async () => fireEvent.click(within(next).getByRole("button", { name: /continuar agora/i })));
  const call = api.mock.calls.find(([path]) => path === "/study/sessions/s1/messages");
  expect(JSON.parse(String(call?.[1]?.body)).message).toContain("Limites");
  expect(screen.queryByRole("group", { name: "Próximo passo" })).not.toBeInTheDocument();
  // A new quiz can be generated once the lesson moves on.
  expect(screen.getByRole("button", { name: "Gerar quiz" })).toBeEnabled();
});

it("scheduling another lesson checks the time, then closes the panel and the lesson goes on", async () => {
  serve({ session, messages: [graded], sources: [], mastery: { level: "DEVELOPING" } });
  render(<StudyRoom id="s1" />);
  const next = await screen.findByRole("group", { name: "Próximo passo" });
  fireEvent.click(within(next).getByRole("button", { name: /agendar outra aula/i }));
  const when = within(next).getByLabelText("Quando");
  const typed = (date: Date) => new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  fireEvent.change(when, { target: { value: typed(new Date(Date.now() - 3600000)) } });
  await act(async () => fireEvent.click(within(next).getByRole("button", { name: "Agendar" })));
  expect(screen.getByRole("alert")).toHaveTextContent(/esse horário já passou/i);
  expect(api.mock.calls.some(([path]) => path === "/study/sessions/s1/continue")).toBe(false);
  fireEvent.change(when, { target: { value: typed(new Date(Date.now() + 86400000)) } });
  await act(async () => fireEvent.click(within(next).getByRole("button", { name: "Agendar" })));
  expect(api.mock.calls.some(([path]) => path === "/study/sessions/s1/continue")).toBe(true);
  expect(await screen.findByRole("status")).toHaveTextContent(/próxima aula agendada/i);
  expect(screen.queryByRole("group", { name: "Próximo passo" })).not.toBeInTheDocument();
  expect(screen.getByLabelText("Mensagem para o tutor")).toBeEnabled();
});

it("a quiz that was still being written can be answered once it arrives, and only sent when complete", { timeout: 10000 }, async () => {
  const room = { session, messages: [{ ...quiz, status: "PROCESSING", quiz: undefined }] as unknown[], sources: [], mastery: { level: "BEGINNER" } };
  serve(room);
  api.mockImplementation((path: string) => Promise.resolve(path.endsWith("/answers") ? { score: 2, total: 2, done: true, weakTopics: [], results: [] } : { ...room }));
  render(<StudyRoom id="s1" />);
  await screen.findByLabelText("O tutor está escrevendo");
  room.messages = [quiz];
  // The room polls while the tutor writes.
  const form = (await screen.findByRole("heading", { name: "Quiz da sessão" }, { timeout: 4000 })).closest("form")!;
  const send = within(form).getByRole("button", { name: /enviar respostas/i });
  expect(send).toBeDisabled();
  fireEvent.click(within(form).getAllByRole("radio")[1]);
  expect(within(form).getAllByRole("radio")[1]).toBeChecked();
  expect(send).toBeDisabled();
  expect(within(form).getByText("Falta 1 questão")).toBeInTheDocument();
  fireEvent.click(within(form).getAllByRole("radio")[2]);
  expect(send).toBeEnabled();
});

it("a finished session thanks the student and lets them open or delete the notebook", async () => {
  serve({ session: { ...session, status: "DONE", finishedAt: new Date().toISOString() }, messages: [], sources: [], mastery: { level: "ADVANCED" } });
  render(<StudyRoom id="s1" />);
  expect(await screen.findByRole("heading", { name: "Sessão concluída!" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /abrir caderno/i })).toHaveAttribute("href", "/notebooks/n1");
  expect(screen.queryByLabelText("Mensagem para o tutor")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /excluir caderno/i }));
  await act(async () => fireEvent.click(screen.getByRole("button", { name: /confirmar exclusão/i })));
  expect(api).toHaveBeenCalledWith("/study/sessions/s1", { method: "DELETE" });
  expect(push).toHaveBeenCalledWith("/home#enturma-study");
});
