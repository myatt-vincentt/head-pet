// The six head pets: vincentt.studio head accessories
// (public/models/vincentt-pet-*.glb), authored sitting on the crown in
// metres in the "Complete 3D Reference - Spark AR" face frame (origin at the
// front of the face, +Y up, +Z out of the face) — see FRAME. Each mirrors
// your face as its author built it (blinks with you, perks up, chews…).

export type Part = {
  /** File name in public/models without `vincentt-` / `.glb`. */
  id: string;
  /**
   * Material swaps by name, to another material in the same file. The
   * default preset's finish is applied first.
   */
  materials?: Record<string, string>;
  /** Tints by material name (on this part's own copy of the material). */
  colors?: Record<string, string>;
  /** Fine placement: `x` / `y` / `z` canonical cm, `scale` about its middle. */
  fit?: { x?: number; y?: number; z?: number; scale?: number };
};

/**
 * Some are authored small for a head; `fit.scale` grows them about their
 * middle and `fit.y` lifts them back onto the crown (cm).
 */
export const PETS: readonly Part[] = [
  { id: "pet-capybara", fit: { scale: 1.7, y: -0.6 } },
  { id: "pet-corgi-puppy", fit: { scale: 1.15, y: 1.4 } },
  { id: "pet-sloth", fit: { scale: 1.1 } },
  { id: "pet-axolotl", fit: { scale: 1.15, y: 1.4 } },
  { id: "pet-red-panda", fit: { scale: 1.1, y: 1.1 } },
  { id: "pet-sea-otter", fit: { scale: 1.5, y: -2.6 } },
];

export const modelUrl = (id: string) => `/models/vincentt-${id}.glb`;

/** The SDK's v3 head occluder, hosted here until the SDK CDN serves it. */
export const OCCLUDER_URL = "/models/head-occluder-v3.glb";

/** The SDK's neck-and-shoulders bust occluder (same story). */
export const NECK_OCCLUDER_URL = "/models/neck-occluder-bust-v1.glb";

/**
 * The models' frame → the SDK's canonical head frame (centimetres): ×100,
 * then the same shift the SDK used to move the Spark AR reference into the
 * canonical frame (chins and nose tips aligned; vincentt-xr-sdk
 * assets-src/head-occluder/README.md).
 */
export const FRAME = {
  scale: 100,
  position: [0, -1.03, 7.3] as const,
};
