import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { StudyTermNotice, NEW_TERM_SUBJECTS } from "./study-term";
import type { TermOverview } from "@/lib/planner";

const api = vi.hoisted(() => vi.fn());
const push = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api", () => ({ api }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const term = {
  id: "t1",
  name: "2026.2",
  startsOn: "2026-08-03",
  endsOn: "2026-12-18",
  periodId: "p3",
  periodName: "3º período",
  subjects: [{ id: "calc", name: "Cálculo I" }],
  subjectsConfirmed: true,
};

const overview = (overrides: Partial<TermOverview> = {}): TermOverview => ({
  current: term,
  needs: "NONE",
  suggestion: { name: "2027.1", startsOn: "2027-02-01", endsOn: "2027-06-30" },
  terms: [term],
  ...overrides,
});

beforeEach(() => {
  api.mockReset().mockResolvedValue(overview({ needs: "SUBJECTS" }));
  push.mockReset();
});
afterEach(cleanup);

it("says nothing while the semester is going on", () => {
  const { container } = render(<StudyTermNotice overview={overview()} starting={false} close={() => {}} />);
  expect(container).toBeEmptyDOMElement();
});

it("when the semester ended, starts the next one and goes to choose the new subjects", async () => {
  render(<StudyTermNotice overview={overview({ needs: "NEW_TERM" })} starting={false} close={() => {}} />);
  expect(screen.getByRole("heading", { name: "Seu semestre 2026.2 terminou" })).toBeInTheDocument();
  expect(screen.getByLabelText("Começa em")).toHaveValue("2027-02-01");
  expect(screen.getByLabelText("Termina em")).toHaveValue("2027-06-30");
  expect(screen.getByLabelText("Nome")).toHaveValue("2027.1");
  await act(async () => fireEvent.submit(screen.getByRole("form", { name: "Novo semestre" })));
  expect(api).toHaveBeenCalledWith(
    "/planner/terms",
    expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ name: "2027.1", startsOn: "2027-02-01", endsOn: "2027-06-30" }),
    }),
  );
  expect(push).toHaveBeenCalledWith(NEW_TERM_SUBJECTS);
});

it("a new semester needs its end after its start", async () => {
  render(<StudyTermNotice overview={overview({ needs: "NEW_TERM" })} starting={false} close={() => {}} />);
  fireEvent.change(screen.getByLabelText("Termina em"), { target: { value: "2027-01-01" } });
  await act(async () => fireEvent.submit(screen.getByRole("form", { name: "Novo semestre" })));
  expect(screen.getByRole("alert")).toHaveTextContent(/fim precisa ser depois/i);
  expect(api).not.toHaveBeenCalled();
});

it("a semester without its subjects points to choosing them", () => {
  render(
    <StudyTermNotice
      overview={overview({ needs: "SUBJECTS", current: { ...term, subjectsConfirmed: false } })}
      starting={false}
      close={() => {}}
    />,
  );
  expect(screen.getByRole("heading", { name: "Configure as matérias do semestre 2026.2" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Escolher período e matérias/ })).toHaveAttribute("href", NEW_TERM_SUBJECTS);
});

it("the student can start the next semester early and close the form", () => {
  const close = vi.fn();
  render(<StudyTermNotice overview={overview()} starting close={close} />);
  expect(screen.getByRole("heading", { name: "Começar um novo semestre" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Fechar" }));
  expect(close).toHaveBeenCalled();
});
