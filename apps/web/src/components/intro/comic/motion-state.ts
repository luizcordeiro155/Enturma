import { createContext } from "react";
import type { IntroQuality } from "../intro-model";

export const Quality = createContext<IntroQuality>("high");
// Acting stays at 24 fps while the surrounding comic panels can hold frames.
export const PresenterFrame = createContext<number | null>(null);
