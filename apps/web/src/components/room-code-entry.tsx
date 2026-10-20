"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, ArrowRight } from "lucide-react";

export function RoomCodeEntry() {
  const [code, setCode] = useState("");
  const router = useRouter();
  return (
    <form
      className="room-code-entry"
      onSubmit={(event) => {
        event.preventDefault();
        router.push(`/join/${encodeURIComponent(code.trim().toUpperCase())}`);
      }}
    >
      <label>
        <KeyRound size={18} />
        <span>
          Recebeu um convite?
          <small>Entre por código, mesmo com as entradas fechadas.</small>
        </span>
        <input
          aria-label="Código da sala"
          placeholder="8 letras ou números"
          value={code}
          onChange={(event) =>
            setCode(event.target.value.replace(/\s/g, "").toUpperCase())
          }
          maxLength={8}
          minLength={8}
          pattern="[A-Za-z2-9]{8}"
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          required
        />
      </label>
      <button type="submit">
        Entrar com código <ArrowRight size={16} />
      </button>
    </form>
  );
}
