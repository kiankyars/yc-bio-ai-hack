# PocketVerse

PocketVerse is a hackathon-ready scientific visualization demo built with React, Vite, and PlayCanvas.
It stages an explorable 3D EGFR resistance pocket and lets you compare inhibitor designs against key residues such as T790M and C797.

## Run

```bash
npm install
npm run dev
```

For a production bundle:

```bash
npm run build
npm run preview
```

## Demo flow

1. Start in the pocket overview.
2. Toggle overlays between resistance, chemistry, and conservation.
3. Compare `Gefitinib`, `Osimertinib`, and the synthetic analog `PVX-201`.
4. Click residues in the 3D scene to update the copilot explanation and scorecards.
5. Use the camera beats to walk judges through the gatekeeper bottleneck and covalent anchor story.
