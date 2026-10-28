# dev-media

Optional dev-only preview media. Nothing here ships: only
`src/DevMediaSwitcher.tsx` reads this folder, and it is stripped from
production builds.

You don't need anything here. Without a webcam, `pnpm dev` starts on the SDK's
built-in "Person Shaking Head" video and lists every SDK sample video and
image. In development keys 1–6 pick a pet and the arrow keys step through
them.

To preview with your own clip, add it at `dev-media/pet.mp4` (H.264 MP4); it
is listed first and used as the start. A clip with room above the head shows
the whole pet. Clips here are git-ignored. Restart `pnpm dev` after adding or
removing one.
