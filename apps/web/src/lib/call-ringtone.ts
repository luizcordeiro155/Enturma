"use client";
import { useEffect } from "react";

/** Browsers may require a prior gesture; the incoming dialog always works without audio. */
export function useCallRingtone(ringing: boolean) {
  useEffect(() => {
    if (!ringing || typeof AudioContext === "undefined") return;
    let context: AudioContext;
    try {
      context = new AudioContext();
    } catch {
      return;
    }
    const sound = () => {
      if (context.state !== "running") return;
      for (const delay of [0, 0.24]) {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const start = context.currentTime + delay;
        oscillator.frequency.value = delay ? 660 : 520;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.045, start + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18);
        oscillator.connect(gain).connect(context.destination);
        oscillator.onended = () => {
          oscillator.disconnect();
          gain.disconnect();
        };
        oscillator.start(start);
        oscillator.stop(start + 0.2);
      }
    };
    void context
      .resume()
      .then(sound)
      .catch(() => {});
    const timer = setInterval(sound, 2400);
    return () => {
      clearInterval(timer);
      void context.close().catch(() => {});
    };
  }, [ringing]);
}
