export type OverlayMode = 'chemistry' | 'resistance' | 'conservation';

export type Vec3Tuple = [number, number, number];

export type Residue = {
  id: string;
  label: string;
  aminoAcid: string;
  role: string;
  chemistry: 'hydrophobic' | 'polar' | 'charged' | 'mutation';
  mutationPressure: number;
  conservation: number;
  position: Vec3Tuple;
  note: string;
  ligandInsight: string;
};

export type LigandAtom = {
  type: 'sphere' | 'box';
  offset: Vec3Tuple;
  scale: Vec3Tuple;
  color: string;
};

export type Ligand = {
  id: string;
  name: string;
  stage: string;
  tag: string;
  confidence: string;
  pocketFit: number;
  mutationCoverage: number;
  selectivity: number;
  color: string;
  center: Vec3Tuple;
  contactResidues: string[];
  storyline: string;
  risk: string;
  atoms: LigandAtom[];
};

export type CameraStop = {
  id: string;
  title: string;
  description: string;
  position: Vec3Tuple;
  target: Vec3Tuple;
};

export const targetProfile = {
  name: 'EGFR kinase pocket',
  subtitle: 'Resistance-focused atlas for L858R / T790M non-small-cell lung cancer',
  track: 'Scientific Data Visualization',
  companionTrack: 'AI Drug Discovery',
  targetId: 'P00533',
  demoClaim:
    'A navigable 3D argument that explains why one ligand survives resistance pressure while another fails.',
  pocketSignal: 91,
  contactDensity: 78,
  resistanceRisk: 64,
};

export const residues: Residue[] = [
  {
    id: 'L858R',
    label: 'L858R',
    aminoAcid: 'Arg858',
    role: 'Activating mutation',
    chemistry: 'mutation',
    mutationPressure: 0.56,
    conservation: 0.82,
    position: [-1.45, 0.65, 1.15],
    note:
      'This mutation shifts the kinase toward an active conformation, making the pocket more druggable but also more dynamic.',
    ligandInsight:
      'Ligands that tolerate the active-state geometry gain potency without overfilling the back pocket.',
  },
  {
    id: 'K745',
    label: 'K745',
    aminoAcid: 'Lys745',
    role: 'Electrostatic guide rail',
    chemistry: 'charged',
    mutationPressure: 0.18,
    conservation: 0.92,
    position: [-0.55, 1.15, 0.25],
    note:
      'A positively charged residue near the hinge mouth that helps orient ligands entering the cavity.',
    ligandInsight:
      'Polar ligand heads gain steering here, but bulky aromatic groups tend to lose efficiency.',
  },
  {
    id: 'M793',
    label: 'M793',
    aminoAcid: 'Met793',
    role: 'Hinge anchor',
    chemistry: 'polar',
    mutationPressure: 0.22,
    conservation: 0.97,
    position: [0.15, 0.35, -0.35],
    note:
      'The hinge contact is the most stable recognition feature in the pocket. Lose this and the whole pose becomes fragile.',
    ligandInsight:
      'Osimertinib-like scaffolds lock here first, then extend into the mutant back pocket.',
  },
  {
    id: 'T790M',
    label: 'T790M',
    aminoAcid: 'Met790',
    role: 'Gatekeeper resistance mutation',
    chemistry: 'mutation',
    mutationPressure: 0.96,
    conservation: 0.88,
    position: [0.95, -0.25, -0.95],
    note:
      'The classic gatekeeper mutation narrows the hydrophobic channel and penalizes first-generation inhibitors.',
    ligandInsight:
      'This is the make-or-break hotspot. Ligands need shape complementarity instead of brute-force bulk.',
  },
  {
    id: 'C797',
    label: 'C797',
    aminoAcid: 'Cys797',
    role: 'Covalent anchor',
    chemistry: 'polar',
    mutationPressure: 0.87,
    conservation: 0.84,
    position: [1.6, 0.15, -1.85],
    note:
      'Covalent inhibitors exploit this cysteine for durable engagement, but a C797S swap removes that advantage.',
    ligandInsight:
      'If the ligand depends too heavily on this residue, the resistance story flips immediately.',
  },
  {
    id: 'D855',
    label: 'D855',
    aminoAcid: 'Asp855',
    role: 'Activation loop stabilizer',
    chemistry: 'charged',
    mutationPressure: 0.31,
    conservation: 0.9,
    position: [0.55, -1.05, 0.95],
    note:
      'This acidic residue shapes the lower wall of the cavity and reports whether the activation loop remains organized.',
    ligandInsight:
      'Good analogs stay close enough to sense this wall without colliding into the loop.',
  },
  {
    id: 'L718',
    label: 'L718',
    aminoAcid: 'Leu718',
    role: 'Front-pocket selector',
    chemistry: 'hydrophobic',
    mutationPressure: 0.72,
    conservation: 0.69,
    position: [-1.15, -0.25, -1.35],
    note:
      'A compact hydrophobic shelf that often drives selectivity and can create front-pocket resistance liabilities.',
    ligandInsight:
      'Wide head groups pay a steric tax here. Narrow, bent scaffolds outperform flat ones.',
  },
];

export const ligands: Ligand[] = [
  {
    id: 'gefitinib',
    name: 'Gefitinib',
    stage: '1st generation reference',
    tag: 'Shows the failure mode',
    confidence: 'High public precedent',
    pocketFit: 0.48,
    mutationCoverage: 0.2,
    selectivity: 0.44,
    color: '#ff8b5c',
    center: [0.2, 0.18, -0.85],
    contactResidues: ['K745', 'M793', 'L718'],
    storyline:
      'Fast hinge engagement, but the scaffold crowds the gatekeeper zone and collapses under T790M pressure.',
    risk:
      'The fit score drops when the hydrophobic channel narrows. This is the baseline your judges will understand immediately.',
    atoms: [
      { type: 'box', offset: [-0.65, 0.08, 0.4], scale: [0.5, 0.14, 0.24], color: '#ffe0c2' },
      { type: 'sphere', offset: [-0.1, 0.18, 0.05], scale: [0.28, 0.28, 0.28], color: '#ff8b5c' },
      { type: 'box', offset: [0.3, -0.05, -0.2], scale: [0.34, 0.14, 0.6], color: '#ff9f73' },
      { type: 'sphere', offset: [0.62, 0.16, -0.58], scale: [0.22, 0.22, 0.22], color: '#fff0df' },
      { type: 'box', offset: [0.02, -0.22, -0.72], scale: [0.18, 0.12, 0.3], color: '#ffc7a5' },
    ],
  },
  {
    id: 'osimertinib',
    name: 'Osimertinib',
    stage: '3rd generation anchor',
    tag: 'Best demo story',
    confidence: 'Clinical benchmark',
    pocketFit: 0.87,
    mutationCoverage: 0.82,
    selectivity: 0.78,
    color: '#4fe3c1',
    center: [0.55, 0.15, -1.2],
    contactResidues: ['M793', 'T790M', 'C797', 'L858R'],
    storyline:
      'A curved scaffold that keeps the hinge contact while bending around the gatekeeper mutation and reaching the covalent anchor.',
    risk:
      'Excellent against T790M, but any design that overweights C797 can still crack when a C797S resistance path appears.',
    atoms: [
      { type: 'box', offset: [-0.8, 0.12, 0.42], scale: [0.62, 0.16, 0.22], color: '#b8fff0' },
      { type: 'sphere', offset: [-0.2, 0.22, 0.06], scale: [0.24, 0.24, 0.24], color: '#79f6da' },
      { type: 'box', offset: [0.28, 0.05, -0.28], scale: [0.28, 0.16, 0.72], color: '#4fe3c1' },
      { type: 'sphere', offset: [0.72, 0.18, -0.74], scale: [0.2, 0.2, 0.2], color: '#ebfff9' },
      { type: 'box', offset: [0.96, -0.06, -1.08], scale: [0.16, 0.12, 0.34], color: '#3bcaa8' },
      { type: 'sphere', offset: [1.18, 0.08, -1.36], scale: [0.2, 0.2, 0.2], color: '#d8fff5' },
    ],
  },
  {
    id: 'pvx201',
    name: 'PVX-201',
    stage: 'Hackathon analog',
    tag: 'C797S-aware concept',
    confidence: 'Synthetic design hypothesis',
    pocketFit: 0.79,
    mutationCoverage: 0.9,
    selectivity: 0.71,
    color: '#a793ff',
    center: [0.38, 0.08, -1.05],
    contactResidues: ['M793', 'T790M', 'D855', 'L718'],
    storyline:
      'A non-covalent analog that gives up some raw potency to spread its energy budget across hinge, gatekeeper, and lower-loop contacts.',
    risk:
      'The design is broader and may cost selectivity, but it is less brittle if C797 chemistry disappears.',
    atoms: [
      { type: 'box', offset: [-0.74, 0.06, 0.3], scale: [0.56, 0.16, 0.2], color: '#ddd1ff' },
      { type: 'sphere', offset: [-0.16, 0.18, -0.02], scale: [0.25, 0.25, 0.25], color: '#a793ff' },
      { type: 'box', offset: [0.26, 0.0, -0.34], scale: [0.24, 0.14, 0.64], color: '#c2b4ff' },
      { type: 'sphere', offset: [0.58, -0.16, -0.66], scale: [0.18, 0.18, 0.18], color: '#f3efff' },
      { type: 'box', offset: [0.9, -0.2, -0.95], scale: [0.14, 0.1, 0.34], color: '#8e7cf6' },
      { type: 'sphere', offset: [0.4, -0.28, -1.28], scale: [0.22, 0.22, 0.22], color: '#cec2ff' },
    ],
  },
];

export const cameraStops: CameraStop[] = [
  {
    id: 'overview',
    title: 'Pocket overview',
    description: 'Enter the cavity and show the density of contacts surrounding the inhibitor pose.',
    position: [0.2, 1.85, 7.2],
    target: [0.2, 0.1, -0.6],
  },
  {
    id: 'gatekeeper',
    title: 'Gatekeeper choke point',
    description: 'Rotate toward T790M to show where first-generation inhibitors lose room.',
    position: [3.2, 0.9, 2.65],
    target: [0.95, -0.15, -0.9],
  },
  {
    id: 'covalent',
    title: 'Covalent anchor',
    description: 'Slide deeper to reveal the C797 region and discuss C797S brittleness.',
    position: [2.15, 0.8, -0.2],
    target: [1.58, 0.12, -1.82],
  },
];

export const evidenceCards = [
  {
    title: 'Pocket narrative',
    body:
      'Judges do not need to parse a docking table. They can see the cavity narrow, the mutation light up, and the ligand bend around it.',
  },
  {
    title: 'Drug-discovery bridge',
    body:
      'The same interface doubles as a medicinal chemistry review surface: select a residue, inspect a clash, compare analogs, tell a resistance story.',
  },
  {
    title: 'Demo-safe scope',
    body:
      'One target, three ligands, seven residues, three camera beats. Everything on screen contributes to the 3-minute live demo.',
  },
];

export function getResidueById(id: string): Residue {
  const residue = residues.find((entry) => entry.id === id);
  if (!residue) {
    throw new Error(`Unknown residue: ${id}`);
  }

  return residue;
}

export function getLigandById(id: string): Ligand {
  const ligand = ligands.find((entry) => entry.id === id);
  if (!ligand) {
    throw new Error(`Unknown ligand: ${id}`);
  }

  return ligand;
}

export function buildCopilotBrief(residue: Residue, ligand: Ligand): string[] {
  const lines = [
    `${ligand.name} treats ${residue.label} as a ${residue.role.toLowerCase()}, not a decorative contact.`,
    residue.ligandInsight,
    ligand.storyline,
  ];

  if (residue.id === 'T790M' && ligand.id === 'gefitinib') {
    lines.push('This is the cleanest failure story in the scene: the gatekeeper region tightens and the reference scaffold runs out of geometric margin.');
  }

  if (residue.id === 'C797' && ligand.id === 'osimertinib') {
    lines.push('The covalent anchor is powerful, but it concentrates too much of the binding budget in one residue if C797 chemistry changes.');
  }

  if (residue.id === 'C797' && ligand.id === 'pvx201') {
    lines.push('PVX-201 is deliberately less dependent on the anchor, which makes the pose less brittle under a C797S escape route.');
  }

  return lines;
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}
