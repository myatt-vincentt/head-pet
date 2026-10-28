// Dev-only: keys 1–6 show that pet, arrows step through them;
// window.__pet exposes the store and the live face readings for checks.
// Scene.tsx lazy-imports this behind an inline NODE_ENV check, so it never
// reaches production.
import { useEffect } from "react";
import { useThree } from "@react-three/fiber";

import { live } from "./live";
import { PETS } from "./pets";
import { getPet, petActions } from "./state";

const DevKeys = () => {
  const scene = useThree((st) => st.scene);
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__pet = {
      actions: petActions,
      get: getPet,
      pets: PETS,
      live,
      scene,
    };
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (e.key.length === 1 && n >= 1 && n <= PETS.length)
        petActions.show(n - 1);
      else if (e.key === "ArrowRight") petActions.next();
      else if (e.key === "ArrowLeft") petActions.previous();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [scene]);
  return null;
};

export default DevKeys;
