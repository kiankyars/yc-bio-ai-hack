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

### What problem are you solving?

Drug discovery teams still spend too much time translating structural biology into a shared, actionable story. A docking score, mutation table, or flat protein viewer does not make it obvious why one ligand survives a resistance mutation and another fails. PocketVerse solves that communication gap. We turn an EGFR resistance pocket into an explorable 3D environment where scientists can see mutation pressure, conservation, chemistry, and ligand fit in the same spatial frame. Instead of arguing over screenshots and PDFs, a team can click into the pocket, inspect residues like T790M or C797, and understand the binding logic behind a design decision in seconds.

### What did you build?

We built PocketVerse, a React + Vite + PlayCanvas web app for interactive 3D drug-discovery storytelling. The demo renders a live EGFR kinase pocket with animated cavity geometry, clickable residues, multiple overlay modes, cinematic camera beats, and side-by-side ligand comparison for Gefitinib, Osimertinib, and a synthetic analog called PVX-201. Each interaction updates a copilot-style explanation panel that turns structural context into a medicinal chemistry narrative. The result is not just a molecule viewer, but a navigable scientific argument that helps judges and researchers see why a candidate wins or fails under resistance pressure.
