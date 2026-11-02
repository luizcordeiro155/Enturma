"use client";
import { createContext, useContext } from "react";

export const VisitorContext = createContext<{
  active: boolean;
  path: string;
  requestLogin: (path: string) => void;
}>({
  active: false,
  path: "/home",
  requestLogin: () => {},
});
export function useVisitor() {
  return useContext(VisitorContext);
}

export function visitorDestination(path: string) {
  return path === "/home"
    ? "/visitante"
    : `/visitante?path=${encodeURIComponent(path)}`;
}

export function canExploreAsVisitor(path: string) {
  const pathname = path.split("?")[0];
  return (
    ["/home", "/forum", "/rooms", "/caronas", "/settings"].includes(pathname) ||
    /^\/forum\/[a-f0-9-]{36}$/i.test(pathname)
  );
}
