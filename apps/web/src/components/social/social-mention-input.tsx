"use client";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
  type ComponentProps,
} from "react";
import { api } from "@/lib/api";
import type { SocialPerson } from "@/lib/social";
import { Avatar } from "../user-identity";

/** Only the token at the caret is replaced; emails and URLs are left alone. */
export function mentionAt(value: string, caret: number) {
  const match = /(?:^|[\s(])@([\p{L}\p{M}\p{N}_]*)$/u.exec(
    value.slice(0, caret),
  );
  return match
    ? { query: match[1], start: caret - match[1].length - 1, end: caret }
    : null;
}

type Props = Omit<ComponentProps<"textarea">, "value" | "onChange" | "ref"> & {
  value: string;
  onValueChange: (value: string) => void;
  inputRef?: RefObject<HTMLTextAreaElement | null>;
};

export function SocialMentionInput({
  value,
  onValueChange,
  inputRef,
  ...props
}: Props) {
  const local = useRef<HTMLTextAreaElement>(null),
    field = inputRef ?? local;
  const id = useId();
  const popup = useRef<HTMLDivElement>(null);
  const [caret, setCaret] = useState(0),
    [focused, setFocused] = useState(false),
    [composing, setComposing] = useState(false),
    [dismissed, setDismissed] = useState(false),
    [active, setActive] = useState(0);
  const token =
    focused && !composing && !dismissed && !props.disabled
      ? mentionAt(value, caret)
      : null;
  const query = token?.query;
  useLayoutEffect(() => {
    if (query === undefined) return;
    const fit = () => {
      const input = field.current,
        panel = popup.current;
      if (!input || !panel) return;
      const rect = input.getBoundingClientRect();
      const scroll = input
        .closest(".social-pager-page,.social-dialog-body")
        ?.getBoundingClientRect();
      const viewport = window.visualViewport;
      const keyboard =
        parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue(
            "--social-ime-height",
          ),
        ) || 0;
      const top = Math.max(viewport?.offsetTop ?? 0, scroll?.top ?? 0);
      const bottom = Math.min(
        (viewport?.height ?? innerHeight) + (viewport?.offsetTop ?? 0),
        innerHeight - keyboard,
        scroll?.bottom ?? innerHeight,
      );
      const above = rect.top - top - 8,
        below = bottom - rect.bottom - 8;
      const upward = above >= Math.min(162, below);
      panel.style.bottom = upward ? "calc(100% + 6px)" : "auto";
      panel.style.top = upward ? "auto" : "calc(100% + 6px)";
      panel.style.maxHeight = `${Math.max(1, Math.min(240, upward ? above : below))}px`;
    };
    fit();
    window.addEventListener("resize", fit);
    window.addEventListener("enturma-social-viewport", fit);
    document.addEventListener("scroll", fit, true);
    window.visualViewport?.addEventListener("resize", fit);
    return () => {
      window.removeEventListener("resize", fit);
      window.removeEventListener("enturma-social-viewport", fit);
      document.removeEventListener("scroll", fit, true);
      window.visualViewport?.removeEventListener("resize", fit);
    };
  }, [query, field]);
  const [result, setResult] = useState<{
    query: string;
    people: SocialPerson[];
    error: boolean;
  }>();
  useEffect(() => {
    if (query === undefined) return;
    let alive = true;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      void api<SocialPerson[]>(
        `/social/people/mentions?q=${encodeURIComponent(query)}`,
        {
          cache: "no-store",
          signal: controller.signal,
        },
      )
        .then((people) => {
          if (alive)
            setResult({
              query,
              people: people.filter((person) => person.username).slice(0, 6),
              error: false,
            });
        })
        .catch(() => {
          if (alive) setResult({ query, people: [], error: true });
        });
    }, 300);
    return () => {
      alive = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);
  const ready = result?.query === query;
  const people = ready ? (result?.people ?? []) : [];
  const selected = Math.min(active, Math.max(0, people.length - 1));
  function choose(person: SocialPerson) {
    if (!token) return;
    const inserted = `@${person.username} `;
    const next =
      value.slice(0, token.start) + inserted + value.slice(token.end);
    if (props.maxLength && next.length > props.maxLength) return;
    onValueChange(next);
    setDismissed(true);
    const position = token.start + inserted.length;
    requestAnimationFrame(() => {
      field.current?.focus({ preventScroll: true });
      field.current?.setSelectionRange(position, position);
      setCaret(position);
    });
  }
  return (
    <div className="social-mention-field" data-social-gesture="ignore">
      <textarea
        className="resize-none"
        {...props}
        ref={field}
        value={value}
        aria-autocomplete="list"
        aria-haspopup="listbox"
        aria-controls={token ? id : undefined}
        aria-activedescendant={
          token && people.length ? `${id}-${selected}` : undefined
        }
        onFocus={(event) => {
          setFocused(true);
          setCaret(event.currentTarget.selectionStart);
          props.onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          props.onBlur?.(event);
        }}
        onChange={(event) => {
          onValueChange(event.target.value);
          setCaret(event.target.selectionStart);
          setDismissed(false);
          setActive(0);
        }}
        onSelect={(event) => {
          setCaret(event.currentTarget.selectionStart);
          props.onSelect?.(event);
        }}
        onCompositionStart={(event) => {
          setComposing(true);
          props.onCompositionStart?.(event);
        }}
        onCompositionEnd={(event) => {
          setComposing(false);
          setCaret(event.currentTarget.selectionStart);
          props.onCompositionEnd?.(event);
        }}
        onKeyDown={(event) => {
          if (event.nativeEvent.isComposing || composing) return;
          if (token && event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            setDismissed(true);
            return;
          }
          if (token && people.length) {
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              const next =
                (selected +
                  (event.key === "ArrowDown" ? 1 : -1) +
                  people.length) %
                people.length;
              setActive(next);
              document
                .getElementById(`${id}-${next}`)
                ?.scrollIntoView?.({ block: "nearest" });
              return;
            }
            if (event.key === "Enter") {
              event.preventDefault();
              choose(people[selected]);
              return;
            }
          }
          props.onKeyDown?.(event);
        }}
      />
      {token && (
        <div ref={popup} className="social-mention-popover">
          <div id={id} role="listbox" aria-label="Pessoas para marcar">
            {people.map((person, index) => (
              <button
                type="button"
                role="option"
                id={`${id}-${index}`}
                key={person.id}
                tabIndex={-1}
                aria-selected={index === selected}
                onPointerDown={(event) => event.preventDefault()}
                onClick={() => choose(person)}
              >
                <Avatar user={person} />
                <span>
                  <strong>{person.name}</strong>
                  <small>@{person.username}</small>
                </span>
              </button>
            ))}
          </div>
          {!people.length && (
            <p role="status">
              {!ready
                ? "Buscando pessoas…"
                : result?.error
                  ? "Não foi possível buscar. Continue digitando para tentar novamente."
                  : query
                    ? "Nenhuma pessoa encontrada."
                    : "Digite o nome ou usuário de quem deseja marcar."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
