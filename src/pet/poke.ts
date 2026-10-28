// Poking the pet — pure, unit-tested (poke.test.ts).
//
// Everything is in the tracker's image space as the person sees themselves
// (fractions of the frame, top-left origin), where the face box and the
// fingertips both live. The pet sits on the head, so its box is the face
// box moved up by most of a face height. A poke is the index fingertip
// coming into that box; it fires once, then not again until the finger has
// left and a short rest has passed.

export type Box = { minX: number; minY: number; maxX: number; maxY: number };
export type Point = { x: number; y: number };

export const POKE = {
  /** The pet's box: from just below the face box's top… */
  overlap: 0.05,
  /** …up this many face heights… */
  above: 0.95,
  /** …and this many face widths wide. */
  width: 1.15,
  /** Seconds before another poke counts. */
  cooldown: 0.7,
  /** Around the pet, swipes don't count (a hand reaching to poke moves). */
  noSwipe: 0.12,
};

/** Where the pet is, from the face box. */
export const petBox = (face: Box): Box => {
  const w = face.maxX - face.minX;
  const h = face.maxY - face.minY;
  const cx = (face.minX + face.maxX) / 2;
  return {
    minX: cx - (w * POKE.width) / 2,
    maxX: cx + (w * POKE.width) / 2,
    minY: face.minY - h * POKE.above,
    maxY: face.minY + h * POKE.overlap,
  };
};

export const inBox = (p: Point, b: Box, pad = 0) =>
  p.x >= b.minX - pad &&
  p.x <= b.maxX + pad &&
  p.y >= b.minY - pad &&
  p.y <= b.maxY + pad;

export type PokeState = { inside: boolean; last: number };

export const pokeState = (): PokeState => ({ inside: false, last: -Infinity });

/** One detection: the fingertip (or null) against the pet's box (or null). */
export const stepPoke = (
  s: PokeState,
  t: number,
  tip: Point | null,
  box: Box | null,
): { state: PokeState; poked: boolean } => {
  const inside = !!tip && !!box && inBox(tip, box);
  const poked = inside && !s.inside && t - s.last >= POKE.cooldown;
  return { state: { inside, last: poked ? t : s.last }, poked };
};
