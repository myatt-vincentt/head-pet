// Your pet on your head (Part.tsx on the filtered head: FilteredHead.tsx,
// the SDK's canonical head fit through a spring, with the depth-only head
// occluder in the same group). A new pet pops in while the old one hops
// off. It jumps when poked (PetHop, PetHearts), bounces on a nod, and a
// ghost hand hints at what to do when it's left alone (PokeHint). Input:
// HandInput (poke, air swipe) and TouchInput (tap, drag). The pets are in metres in the Spark AR face frame; FRAME turns them
// into canonical centimetres.
import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PMREMGenerator, Vector3, type Group } from "three";
// eslint-disable-next-line import/extensions
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { useFaceInfo, useGesture } from "@vincentt-xr/sdk/tracking";

import { FACE_FPS, FilteredHead } from "./FilteredHead";
import { HandInput } from "./HandInput";
import { live } from "./live";
import { Part } from "./Part";
import { PetHearts } from "./PetHearts";
import { PetHop } from "./PetHop";
import { FRAME, PETS } from "./pets";
import { PokeHint } from "./PokeHint";
import { usePet } from "./state";
import { TouchInput } from "./TouchInput";

/**
 * The blendshapes the pets' face_triggers read (see rig.ts).
 */
const FACE_INPUTS = [
  "jawOpen",
  "mouthSmileLeft",
  "mouthSmileRight",
  "eyeBlinkLeft",
  "eyeBlinkRight",
  "browInnerUp",
];
/** Per-second easing of the readings (higher = snappier, noisier). */
const FACE_EASE = 14;

/** Copies the face's blendshapes into `live` and counts nods and shakes. */
const FaceSignals = () => {
  // Same options as FilteredHead's FaceTracker: the first consumer of the
  // shared face model sets its face count and rate.
  const face = useFaceInfo({ active: true, numFaces: 1, targetFps: FACE_FPS });
  const raw = useRef<Readonly<Record<string, number | undefined>>>({});
  raw.current = face?.blendshapes ?? {};
  // Raw blendshapes flicker a few percent frame to frame; ease toward them.
  const smooth = useRef<Record<string, number>>({});
  useFrame((_st, dt) => {
    const k = 1 - Math.exp(-FACE_EASE * Math.min(dt, 0.1));
    const out = smooth.current;
    FACE_INPUTS.forEach((name) => {
      const v = raw.current[name] ?? 0;
      out[name] = (out[name] ?? v) + (v - (out[name] ?? v)) * k;
    });
    live.blendshapes = out;
  }, -1);
  useGesture("headShake", {
    onBegin: () => {
      live.shakes += 1;
    },
  });
  useGesture("headNod", {
    onBegin: () => {
      live.nods += 1;
    },
  });
  return null;
};

/** Soft studio reflections, so fur sheen and gloss read on camera. */
const useStudioLight = () => {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    const pmrem = new PMREMGenerator(gl);
    const tex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    const before = scene.environment;
    scene.environment = tex;
    return () => {
      scene.environment = before;
      tex.dispose();
    };
  }, [gl, scene]);
};

/** How far from its middle a tap still hits the pet (cm). */
const PET_RADIUS = 9;

/** Where the pet is on the canvas, for taps (CSS px, from the crown). */
const PetOnScreen = () => {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const ref = useRef<Group>(null);
  const at = useMemo(() => new Vector3(), []);
  const edge = useMemo(() => new Vector3(), []);
  useFrame(() => {
    const g = ref.current;
    if (!g || !live.tracked) {
      live.petScreen = null;
      return;
    }
    g.getWorldPosition(at);
    // A point a pet's width to the side gives its size on screen.
    edge.set(PET_RADIUS, 0, 0);
    g.localToWorld(edge);
    at.project(camera);
    edge.project(camera);
    const x = ((at.x + 1) / 2) * size.width;
    const y = ((1 - at.y) / 2) * size.height;
    const r = Math.hypot(
      ((edge.x + 1) / 2) * size.width - x,
      ((1 - edge.y) / 2) * size.height - y,
    );
    live.petScreen = { x, y, r: Math.max(r, 30) };
  });
  // The pet's middle: above the crown (canonical cm).
  return <group ref={ref} position={[0, 18, -2]} />;
};

export const PetScene = () => {
  const { pet, leaving } = usePet();
  useStudioLight();
  return (
    <>
      <FaceSignals />
      <FilteredHead>
        <group name="pet-frame" scale={FRAME.scale} position={FRAME.position}>
          {leaving >= 0 ? (
            <Part
              key={`${PETS[leaving].id}:out`}
              part={PETS[leaving]}
              leaving
            />
          ) : null}
          <PetHop>
            <Part key={PETS[pet].id} part={PETS[pet]} />
          </PetHop>
        </group>
        <PetHearts />
        <PokeHint />
        <PetOnScreen />
      </FilteredHead>
      <HandInput />
      <TouchInput />
    </>
  );
};
