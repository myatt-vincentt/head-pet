// Hands: poke the pet with a fingertip (poke.ts), or sweep sideways in the
// air for the next / previous pet (swipe.ts). Hands also stay in front of
// the pet (HandCutout), so a finger poking it looks right.
//
// One hand drives it at a time, followed by its stable identity (the SDK's
// `poses.left` / `poses.right`); only fresh detections count. Near the pet a
// moving hand is reaching to poke, so it doesn't swipe there.
import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { XRModel } from "@vincentt-xr/sdk";
import {
  useXRModelNode,
  type XRModelNodeHandTracking,
} from "@vincentt-xr/sdk/low-level";
import {
  HandCutout,
  HandTracker,
  useFaceInfo,
} from "@vincentt-xr/sdk/tracking";

import { FACE_FPS } from "./FilteredHead";
import { live, touched } from "./live";
import { POKE, inBox, petBox, pokeState, stepPoke, type Box } from "./poke";
import { petActions } from "./state";
import { feedSwipe, swipeState } from "./swipe";

/** Palm centre (middle-finger knuckle) — steadier than a fingertip. */
const PALM = 9;
const INDEX_TIP = 8;
/** Hand inference rate (the hand model is the costliest on screen). */
const HAND_FPS = 12;
/** Seconds the face box is remembered when a hand covers the face. */
const FACE_MEMORY = 1;
/** No swipe this soon after a poke (s). */
const AFTER_POKE = 0.6;

type Side = "left" | "right";

export const HandInput = () => {
  const hands = useXRModelNode<XRModelNodeHandTracking>(XRModel.HAND_TRACKER);
  const face = useFaceInfo({ active: true, numFaces: 1, targetFps: FACE_FPS });
  const faceBox = useRef<{ box: Box; t: number } | null>(null);
  const swipe = useRef(swipeState());
  const poke = useRef(pokeState());
  const side = useRef<Side | null>(null);
  const lastStamp = useRef(-1);

  useEffect(() => {
    if (face?.bounds)
      faceBox.current = { box: face.bounds, t: performance.now() / 1000 };
  }, [face]);

  useFrame(() => {
    const t = performance.now() / 1000;
    const poses = hands?.poses;
    const fresh = (s: Side) => {
      const h = poses?.[s];
      return h && !h.held && h.image.length > 20 ? h : null;
    };
    // Keep the hand we're following while it's in view; else take one.
    let s: Side | null =
      side.current && fresh(side.current) ? side.current : null;
    if (!s)
      s = (fresh("right") && "right") || (fresh("left") && "left") || null;
    if (s !== side.current) {
      side.current = s;
      feedSwipe(swipe.current, performance.now(), null);
    }
    const hand = s ? fresh(s) : null;
    if (!hand || hand.timestampMs === lastStamp.current) return;
    lastStamp.current = hand.timestampMs;

    // Tracker points: centre origin, y up, already mirrored → frame fractions.
    const at = (i: number) => ({
      x: hand.image[i].x * 0.5 + 0.5,
      y: 0.5 - hand.image[i].y * 0.5,
    });
    const f = faceBox.current;
    const pet = f && t - f.t < FACE_MEMORY ? petBox(f.box) : null;
    const tip = at(INDEX_TIP);

    const r = stepPoke(poke.current, t, tip, pet);
    poke.current = r.state;
    if (r.poked) {
      live.pokes += 1;
      touched();
    }

    const reaching = !!pet && inBox(tip, pet, POKE.noSwipe);
    const resting = t - poke.current.last < AFTER_POKE;
    const dir = feedSwipe(
      swipe.current,
      hand.timestampMs,
      reaching || resting ? null : at(PALM),
    );
    if (dir) {
      touched();
      // A sweep to the left brings the next pet, like a carousel.
      if (dir < 0) petActions.next();
      else petActions.previous();
    }
  });

  return (
    <HandTracker targetFps={HAND_FPS}>
      <HandCutout />
    </HandTracker>
  );
};
