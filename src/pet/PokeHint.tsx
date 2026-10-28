// The only hint, wordless and in the scene: when nobody has played with the
// pet for a while, a ghost hand (the SDK's HandGestureHint) appears beside
// it for a few seconds — pointing and nudging toward the pet (poke it), or
// an open palm sweeping sideways (swipe for another). It alternates, and
// fades in and out (strict ease-out). On the filtered head, canonical cm.
import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { defineGltfAsset, useXRAsset } from "@vincentt-xr/sdk";
import { HandGestureHint } from "@vincentt-xr/sdk/instructions";

import { live } from "./live";

const HINT = {
  /** Seconds after start, then after the last play, before it shows. */
  first: 4,
  idle: 12,
  /** Seconds it stays. */
  show: 3.6,
  /** Beside the pet: right of the crown (cm), and its height. */
  at: [13, 17, 2] as const,
  height: 9,
  renderOrder: 15,
};

const handAsset = defineGltfAsset("/models/hand-v1.glb");
const easeOut = (t: number) => 1 - (1 - t) ** 3;

export const PokeHint = () => {
  const { value: hand } = useXRAsset(handAsset);
  const g = useRef<Group>(null);
  const shownAt = useRef(-1);
  const count = useRef(0);
  const [gesture, setGesture] = useState<"point" | "palm">("point");
  const startT = useMemo(() => performance.now() / 1000, []);

  useFrame(() => {
    const o = g.current;
    if (!o) return;
    const t = performance.now() / 1000;
    const since = live.lastAction > 0 ? live.lastAction : startT;
    const wait = live.lastAction > 0 ? HINT.idle : HINT.first;
    // Start one when it's been quiet long enough; stop at once on play.
    if (shownAt.current < 0 && t - since > wait && live.tracked) {
      shownAt.current = t;
      setGesture(count.current % 2 ? "palm" : "point");
      count.current += 1;
    }
    if (shownAt.current < 0) {
      o.visible = false;
      return;
    }
    const age = t - shownAt.current;
    if (age > HINT.show || live.lastAction > shownAt.current) {
      // Done (or someone played): wait the idle time again before the next.
      if (age > HINT.show) live.lastAction = Math.max(live.lastAction, t);
      shownAt.current = -1;
      o.visible = false;
      return;
    }
    o.visible = true;
    const fadeIn = easeOut(Math.min(1, age / 0.35));
    const fadeOut = easeOut(Math.min(1, (HINT.show - age) / 0.35));
    o.scale.setScalar(Math.max(1e-4, Math.min(fadeIn, fadeOut)));
    // Point: nudge toward the pet. Palm: sweep sideways.
    const wave = Math.sin(age * Math.PI * 2 * 1.2);
    o.position.set(
      HINT.at[0] + (gesture === "point" ? -1.5 : 4) * wave,
      HINT.at[1],
      HINT.at[2],
    );
  });

  if (!hand) return null;
  return (
    <group ref={g} position={HINT.at} visible={false}>
      <HandGestureHint
        key={gesture}
        gesture={gesture}
        model={hand.scene}
        poses={hand.animations}
        height={HINT.height}
        orbit={0}
        renderOrder={HINT.renderOrder}
      />
    </group>
  );
};
