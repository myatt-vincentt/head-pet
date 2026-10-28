import { describe, expect, it } from "vitest";

import { POKE, inBox, petBox, pokeState, stepPoke, type Box } from "./poke";

const FACE: Box = { minX: 0.35, minY: 0.4, maxX: 0.65, maxY: 0.7 };

describe("where the pet is", () => {
  const pet = petBox(FACE);
  it("above the face, about as wide", () => {
    // It only just overlaps the top of the face box.
    expect(pet.maxY).toBeLessThanOrEqual(FACE.minY + 0.3 * POKE.overlap + 1e-9);
    expect(pet.minY).toBeLessThan(FACE.minY - 0.2);
    expect((pet.minX + pet.maxX) / 2).toBeCloseTo(0.5);
    expect(pet.maxX - pet.minX).toBeGreaterThan(FACE.maxX - FACE.minX);
  });
  it("the forehead and the nose aren't the pet", () => {
    expect(inBox({ x: 0.5, y: 0.55 }, pet)).toBe(false);
    expect(inBox({ x: 0.5, y: 0.25 }, pet)).toBe(true);
  });
});

describe("poking", () => {
  const pet = petBox(FACE);
  const on = { x: 0.5, y: 0.25 };
  const off = { x: 0.9, y: 0.25 };

  it("a finger coming onto the pet pokes it once", () => {
    let s = pokeState();
    const hits: number[] = [];
    [off, on, on, on].forEach((p, i) => {
      const r = stepPoke(s, i * 0.1, p, pet);
      s = r.state;
      if (r.poked) hits.push(i);
    });
    expect(hits).toEqual([1]);
  });
  it("in and out quickly is one poke; after a rest, another", () => {
    let s = pokeState();
    const hits: number[] = [];
    const seq = [on, off, on, off, off, off, off, off, off, off, on];
    seq.forEach((p, i) => {
      const r = stepPoke(s, i * 0.1, p, pet);
      s = r.state;
      if (r.poked) hits.push(i);
    });
    expect(hits[0]).toBe(0);
    expect(hits.length).toBe(2);
    expect(hits[1] * 0.1).toBeGreaterThanOrEqual(POKE.cooldown);
  });
  it("no face or no hand, no poke", () => {
    expect(stepPoke(pokeState(), 0, on, null).poked).toBe(false);
    expect(stepPoke(pokeState(), 0, null, pet).poked).toBe(false);
  });
});
