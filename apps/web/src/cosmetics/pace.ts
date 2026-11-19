/** Seconds a pack's entrance runs at the screen's own rate; after that the art idles. */
const ENTRANCE = 4.5;
/** Average milliseconds a frame may take before the quality steps down. */
const SLOW = 12;
/** Frames averaged before deciding, so one slow frame changes nothing. */
const WINDOW = 30;

/**
 * Decides how often the cosmetics are redrawn and how sharp. The entrance draws every frame
 * and the idle loop every other one. A device that cannot keep up gets fewer, lighter frames,
 * so a decorated profile never slows the rest of the app down; it does not step back up.
 */
export function createPacer() {
  let level = 0,
    sum = 0,
    count = 0;
  return {
    /** Least milliseconds between two frames, `time` seconds into the animation. */
    gap(time: number) {
      if (level >= 2) return 50;
      return level === 1 || time >= ENTRANCE ? 1000 / 30 : 0;
    },
    /** The canvas pixel ratio to use, given the most the screen asks for. */
    ratio(most: number) {
      return level === 0 ? most : Math.min(most, level === 1 ? 1.5 : 1);
    },
    /** Reports how long the last frame took to draw. */
    took(ms: number) {
      sum += ms;
      if (++count < WINDOW) return;
      if (sum / count > SLOW && level < 2) level++;
      sum = count = 0;
    },
  };
}
