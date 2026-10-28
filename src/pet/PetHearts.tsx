// A poke pops a few little hearts out of the pet, up and outward, shrinking
// away. Instanced, unlit, on the filtered head (canonical cm), drawn over
// the pet.
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  CanvasTexture,
  Color,
  InstancedMesh,
  MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
  SRGBColorSpace,
} from "three";

import { live } from "./live";

const HEARTS = {
  count: 7,
  /** Seconds each lasts. */
  life: 1.1,
  /** Where they pop from: above the crown (canonical cm). */
  from: [0, 20, -2] as const,
  colors: ["#ff4f8b", "#ff7aa8", "#e0115f", "#ffc2d6"],
  renderOrder: 20,
};

const heartTexture = () => {
  const s = 64;
  const c = document.createElement("canvas");
  c.width = s;
  c.height = s;
  const g = c.getContext("2d") as CanvasRenderingContext2D;
  g.translate(s / 2, s * 0.56);
  g.scale(s / 36, s / 36);
  g.fillStyle = "#fff";
  g.fill(
    new Path2D(
      "M0 11 C-3 8 -15 1 -15 -6 C-15 -11 -11 -14 -7.5 -14 C-4 -14 -1.5 -12 0 -9 C1.5 -12 4 -14 7.5 -14 C11 -14 15 -11 15 -6 C15 1 3 8 0 11 Z",
    ),
  );
  g.fillStyle = "rgba(255,255,255,0.55)";
  g.beginPath();
  g.ellipse(-7, -8, 3.2, 2, -0.6, 0, Math.PI * 2);
  g.fill();
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
};

const easeOut = (t: number) => 1 - (1 - t) ** 3;

export const PetHearts = () => {
  const mesh = useRef<InstancedMesh>(null);
  const seen = useRef(live.pokes);
  const born = useRef(-1);
  const parts = useMemo(() => {
    const palette = HEARTS.colors.map((c) => new Color(c));
    return {
      geo: new PlaneGeometry(1, 1),
      mat: new MeshBasicMaterial({
        map: heartTexture(),
        transparent: true,
        depthWrite: false,
        depthTest: false,
        toneMapped: false,
      }),
      bits: Array.from({ length: HEARTS.count }, (_, i) => {
        // Fanned out above the pet.
        const a = Math.PI * (0.15 + (0.7 * i) / (HEARTS.count - 1));
        return {
          dx: Math.cos(a) * (7 + Math.random() * 4),
          dy: Math.sin(a) * (8 + Math.random() * 5),
          size: 1.8 + Math.random() * 1.4,
          spin: (Math.random() - 0.5) * 1.2,
          color: palette[i % palette.length],
        };
      }),
    };
  }, []);
  const dummy = useMemo(() => new Object3D(), []);

  useFrame((state) => {
    const m = mesh.current;
    if (!m) return;
    const now = state.clock.elapsedTime;
    if (live.pokes !== seen.current) {
      seen.current = live.pokes;
      born.current = now;
      parts.bits.forEach((b, i) => m.setColorAt(i, b.color));
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }
    const age = born.current < 0 ? Infinity : now - born.current;
    m.visible = age < HEARTS.life;
    if (!m.visible) return;
    const k = age / HEARTS.life;
    const e = easeOut(Math.min(1, k * 1.4));
    parts.bits.forEach((b, i) => {
      dummy.position.set(
        HEARTS.from[0] + b.dx * e,
        HEARTS.from[1] + b.dy * e,
        HEARTS.from[2] + 3,
      );
      dummy.rotation.set(0, 0, b.spin * e);
      const grow = easeOut(Math.min(1, age / 0.18));
      const fade = k < 0.6 ? 1 : 1 - easeOut((k - 0.6) / 0.4);
      dummy.scale.setScalar(Math.max(1e-4, b.size * grow * fade));
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={mesh}
      args={[parts.geo, parts.mat, HEARTS.count]}
      frustumCulled={false}
      renderOrder={HEARTS.renderOrder}
      visible={false}
    />
  );
};
