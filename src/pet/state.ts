// Which pet is on your head (and the one hopping off). One small store for
// the scene, the input and the dev keys.
import { useSyncExternalStore } from "react";

import { LEAVE } from "./Part";
import { PETS } from "./pets";

export type PetState = {
  /** Index into PETS. */
  pet: number;
  /** The pet hopping off, −1 = none. */
  leaving: number;
  /** Bumps on every switch. */
  switches: number;
};

let current: PetState = { pet: 0, leaving: -1, switches: 0 };
const listeners = new Set<() => void>();
let leaveTimer = 0;

const set = (next: PetState) => {
  current = next;
  listeners.forEach((l) => l());
};

export const getPet = () => current;

export const usePet = () =>
  useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    getPet,
    getPet,
  );

export const petActions = {
  /** Show pet `i`; the one before hops off. */
  show(i: number) {
    const next = ((i % PETS.length) + PETS.length) % PETS.length;
    if (next === current.pet) return;
    window.clearTimeout(leaveTimer);
    set({ pet: next, leaving: current.pet, switches: current.switches + 1 });
    leaveTimer = window.setTimeout(
      () => set({ ...current, leaving: -1 }),
      LEAVE * 1000 + 50,
    );
  },
  next() {
    petActions.show(current.pet + 1);
  },
  previous() {
    petActions.show(current.pet - 1);
  },
};
