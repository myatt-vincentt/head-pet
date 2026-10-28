# Plan — Head Pet

A little pet on your head that you can poke, nod at and swap. Built on SDK 2.0.0-alpha.9 with the
vincentt.studio head pets; the head pipeline is shared with the other head templates.

## Decisions (from the creator)

- Six pets: capybara, corgi puppy, sloth, axolotl, red panda, sea otter.
- Switch with an air swipe (as in Try-On Studio) or a tap.
- A poke with a finger makes it jump, with little hearts. A nod makes it bounce.
- No overlay: when idle, a small 3D ghost hand beside the pet shows the moves.

## How it works

- `pets.ts`: the six pets and their fit (the capybara and sea otter are authored small, so they're
  scaled up and set back onto the crown).
- `Part.tsx`: loads a pet (shared cache), applies its default preset's finish, plays its idle
  loops, mirrors the face through its authored face triggers (`rig.ts`), wobbles on a head shake,
  pops in and shrinks away when switched.
- `FilteredHead.tsx` + `headFilter.ts` (tested): the SDK's canonical head fit through a
  speed-adaptive critically damped spring, the depth-only v3 head occluder in the same group, the
  SDK's `NeckOccluder` in the face tracker. Face model 20 Hz.
- `PetHop.tsx`: a poke sends the pet up 6 cm in half a second and squashes it on landing; a nod
  (the SDK's `headNod` gesture) gives a 2.5 cm bounce. It pivots on the crown. `PetHearts.tsx`:
  seven hearts fan out from above the pet.
- `poke.ts` (tested): in the tracker's image space, the pet's box is the face box moved up 0.95 face
  heights, 1.15 face widths wide; a poke is the index fingertip entering it, once per entry, with a
  0.7 s rest. `HandInput.tsx`: one followed hand (hand model 12 Hz, `HandCutout`); pokes, and
  swipes (palm) except near the pet and for 0.6 s after a poke.
- `TouchInput.tsx`: tap on the pet (its projected position) pokes, a tap elsewhere is the next
  pet, a sideways drag swipes.
- `PokeHint.tsx`: the SDK's `HandGestureHint` beside the pet after 4 s and then after every 12 s
  without play, alternating a pointing hand nudging toward the pet and an open palm sweeping.
- Dev only: `DevKeys.tsx` (1–6, arrows, `window.__pet`), `DevMediaSwitcher.tsx`, `?occ`.

## Known limits

- The poke box is set from the face box, so very tall or wide pets (the sloth hangs off the side)
  are poked only near the top of the head.
- Swipes and pokes were tested with a composited hand clip; the thresholds need a webcam / phone
  check.
