// Touch and mouse: tap the pet to poke it, tap anywhere else for the next
// pet, or drag sideways like the air swipe (left for the next one).
import { useEffect } from "react";
import { useThree } from "@react-three/fiber";

import { live, touched } from "./live";
import { petActions } from "./state";

const DRAG = {
  /** Minimum sideways travel, px. */
  distance: 50,
  /** Sideways travel must beat vertical by this factor. */
  straightness: 1.5,
  /** Longest drag that still counts, ms. */
  time: 700,
};
const TAP = { time: 300, move: 12 }; // ms, px

export const TouchInput = () => {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    const el = gl.domElement;
    el.style.touchAction = "none";
    let start: { x: number; y: number; t: number; id: number } | null = null;
    const down = (e: PointerEvent) => {
      if (e.button > 0) return;
      start = {
        x: e.clientX,
        y: e.clientY,
        t: performance.now(),
        id: e.pointerId,
      };
    };
    const up = (e: PointerEvent) => {
      const s = start;
      start = null;
      if (!s || s.id !== e.pointerId) return;
      const dx = e.clientX - s.x;
      const dy = e.clientY - s.y;
      const dt = performance.now() - s.t;
      if (dt < TAP.time && Math.hypot(dx, dy) < TAP.move) {
        touched();
        // On the pet: a poke. Anywhere else: the next pet.
        const rect = el.getBoundingClientRect();
        const p = live.petScreen;
        const onPet =
          !!p &&
          Math.hypot(e.clientX - rect.left - p.x, e.clientY - rect.top - p.y) <
            p.r;
        if (onPet) live.pokes += 1;
        else petActions.next();
        return;
      }
      if (
        Math.abs(dx) >= DRAG.distance &&
        Math.abs(dx) >= Math.abs(dy) * DRAG.straightness &&
        dt <= DRAG.time
      ) {
        touched();
        if (dx < 0) petActions.next();
        else petActions.previous();
      }
    };
    const cancel = () => {
      start = null;
    };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
    };
  }, [gl]);
  return null;
};
