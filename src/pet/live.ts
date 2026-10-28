// Live per-frame values shared without re-renders: the face's readings
// (FaceSignals), what the pet should do (input → PetHop, PetHearts) and
// where it is on screen (PetScene).
export const live = {
  blendshapes: {} as Readonly<Record<string, number | undefined>>,
  /** A face is being tracked (FilteredHead). */
  tracked: false,
  /** Bumps on each head shake: the pet plays its wobble. */
  shakes: 0,
  /** Bumps on each nod: the pet bounces. */
  nods: 0,
  /** Bumps on each poke: the pet jumps and hearts pop out. */
  pokes: 0,
  /** When someone last played with the pet (s; the hint waits for idle). */
  lastAction: 0,
  /** The pet's middle on the canvas (CSS px) and about how big it is. */
  petScreen: null as { x: number; y: number; r: number } | null,
  /** Dev checks only (window.__pet): stands in for the face's readings. */
  override: null as Readonly<Record<string, number | undefined>> | null,
};

/** Someone played with the pet (resets the hint's idle timer). */
export const touched = () => {
  live.lastAction = performance.now() / 1000;
};
