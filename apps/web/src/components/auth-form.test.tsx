import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { AuthForm } from "./auth-form";
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));
vi.mock("@/lib/api", () => ({
  api: vi.fn().mockRejectedValue(new Error("E-mail ou senha inválidos.")),
  post: vi.fn().mockRejectedValue(new Error("E-mail ou senha inválidos.")),
}));
afterEach(() => { cleanup(); localStorage.clear(); });
describe("autenticação", () => {
  it("apresenta erro de credenciais e libera nova tentativa", async () => {
    render(<AuthForm mode="login" />);
    fireEvent.change(screen.getByLabelText("E-mail"), {
      target: { value: "test@example.test" },
    });
    fireEvent.change(screen.getByLabelText("Senha"), {
      target: { value: "wrong-password" },
    });
    fireEvent.submit(
      screen.getByRole("button", { name: "Entrar" }).closest("form")!,
    );
    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toContain(
        "E-mail ou senha inválidos",
      ),
    );
    expect(
      (screen.getByRole("button", { name: "Entrar" }) as HTMLButtonElement)
        .disabled,
    ).toBe(false);
  });
  it("oferece manter conectado no login", () => {
    render(<AuthForm mode="login" />);
    const remember = screen.getByLabelText("Manter conectado") as HTMLInputElement;
    expect(remember.checked).toBe(true);
    fireEvent.click(remember);
    expect(remember.checked).toBe(false);
  });
  it("exige senha longa para criação de conta", () => {
    render(<AuthForm mode="register" />);
    expect((screen.getByLabelText("Senha") as HTMLInputElement).minLength).toBe(
      12,
    );
    expect(
      (screen.getByLabelText("Confirmar senha") as HTMLInputElement).minLength,
    ).toBe(12);
    expect(screen.getByLabelText("Nome de usuário")).toBeTruthy();
  });
});
