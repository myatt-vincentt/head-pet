// The pet's jumps, around whatever pet it holds: a poke sends it up in a
// hop that squashes on landing; a nod gives a small bounce. Pivots on the
// crown, where the pets sit, so the squash stays on the head. Model frame
// (metres, see FRAME).
import { useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";

import { live } from "./live";

/** Where the pets sit: the crown, in the models' frame (m). */
const CROWN = [0, 0.143, -0.111] as const;

const HOP = {
  /** A poke: how high (m) and how long (s). */
  poke: { height: 0.06, time: 0.5 },
  /** A nod: a small bounce. */
  nod: { height: 0.025, time: 0.34 },
  /** The landing squash: how flat and how long (s). */
  squash: { amount: 0.18, time: 0.22 },
};

const easeOut = (t: number) => 1 - (1 - t) ** 3;

export const PetHop = ({ children }: { children: ReactNode }) => {
  const g = useRef<Group>(null);
  const seen = useRef({ pokes: live.pokes, nods: live.nods });
  const hop = useRef({ start: -1, height: 0, time: 1 });

  useFrame((state) => {
    const o = g.current;
    if (!o) return;
    const now = state.clock.elapsedTime;
    const s = seen.current;
    if (live.pokes !== s.pokes) {
      s.pokes = live.pokes;
      hop.current = { start: now, ...HOP.poke };
    } else if (live.nods !== s.nods) {
      s.nods = live.nods;
      // A nod doesn't cut short a jump that's in the air.
      if (now - hop.current.start > hop.current.time)
        hop.current = { start: now, ...HOP.nod };
    }
    const h = hop.current;
    const k = h.start < 0 ? 2 : (now - h.start) / h.time;
    // Up and down (a parabola), then the squash as it lands.
    const up = k < 1 ? 4 * k * (1 - k) * h.height : 0;
    const after = (k - 1) * h.time;
    const squash =
      k >= 1 && after < HOP.squash.time
        ? HOP.squash.amount *
          (h.height / HOP.poke.height) *
          (1 - easeOut(after / HOP.squash.time))
        : 0;
    o.position.set(CROWN[0], CROWN[1] + up, CROWN[2]);
    o.scale.set(1 + squash * 0.6, 1 - squash, 1 + squash * 0.6);
  });

  return (
    <group ref={g} position={CROWN}>
      <group position={[-CROWN[0], -CROWN[1], -CROWN[2]]}>{children}</group>
    </group>
  );
};
