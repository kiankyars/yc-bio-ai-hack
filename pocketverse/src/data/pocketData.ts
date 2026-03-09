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

export type TargetProfile = {
  name: string;
  subtitle: string;
  track: string;
  targetId: string;
  demoClaim: string;
  pocketSignal: number;
  contactDensity: number;
  resistanceRisk: number;
};

export type ProteinModel = {
  id: string;
  targetProfile: TargetProfile;
  residues: Residue[];
  ligands: Ligand[];
  cameraStops: CameraStop[];
  defaultResidueId: string;
  defaultLigandId: string;
  defaultStopId: string;
};

export type ProteinOption = {
  id: string;
  label: string;
  implemented: boolean;
};

const egfrModel: ProteinModel = {
  id: 'egfr',
  targetProfile: {
    name: 'EGFR kinase pocket',
    subtitle: 'Resistance-focused atlas for L858R / T790M non-small-cell lung cancer',
    track: 'Scientific Data Visualization',
    targetId: 'P00533',
    demoClaim:
      'An interactive 3D pocket atlas for explaining why one ligand survives resistance pressure while another fails.',
    pocketSignal: 91,
    contactDensity: 78,
    resistanceRisk: 64,
  },
  residues: [
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
  ],
  ligands: [
    {
      id: 'gefitinib',
      name: 'Gefitinib',
      stage: '1st generation reference',
      tag: 'Reference failure mode',
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
        'The fit score drops when the hydrophobic channel narrows.',
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
      tag: 'Clinical anchor',
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
        'Excellent against T790M, but can still crack when a C797S resistance path appears.',
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
      stage: 'Exploratory analog',
      tag: 'C797S-aware concept',
      confidence: 'Design hypothesis',
      pocketFit: 0.79,
      mutationCoverage: 0.9,
      selectivity: 0.71,
      color: '#a793ff',
      center: [0.38, 0.08, -1.05],
      contactResidues: ['M793', 'T790M', 'D855', 'L718'],
      storyline:
        'A non-covalent analog that spreads binding energy across hinge, gatekeeper, and lower-loop contacts.',
      risk:
        'Broader and less brittle if C797 chemistry disappears.',
      atoms: [
        { type: 'box', offset: [-0.74, 0.06, 0.3], scale: [0.56, 0.16, 0.2], color: '#ddd1ff' },
        { type: 'sphere', offset: [-0.16, 0.18, -0.02], scale: [0.25, 0.25, 0.25], color: '#a793ff' },
        { type: 'box', offset: [0.26, 0.0, -0.34], scale: [0.24, 0.14, 0.64], color: '#c2b4ff' },
        { type: 'sphere', offset: [0.58, -0.16, -0.66], scale: [0.18, 0.18, 0.18], color: '#f3efff' },
        { type: 'box', offset: [0.9, -0.2, -0.95], scale: [0.14, 0.1, 0.34], color: '#8e7cf6' },
        { type: 'sphere', offset: [0.4, -0.28, -1.28], scale: [0.22, 0.22, 0.22], color: '#cec2ff' },
      ],
    },
  ],
  cameraStops: [
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
  ],
  defaultResidueId: 'T790M',
  defaultLigandId: 'osimertinib',
  defaultStopId: 'overview',
};

const alkModel: ProteinModel = {
  id: 'alk',
  targetProfile: {
    name: 'ALK kinase pocket',
    subtitle: 'Resistance-focused atlas for EML4-ALK / L1196M and G1202R lung cancer',
    track: 'Scientific Data Visualization',
    targetId: 'Q9UM73',
    demoClaim:
      'An interactive 3D pocket atlas for comparing ALK inhibitor resilience under gatekeeper and solvent-front pressure.',
    pocketSignal: 88,
    contactDensity: 74,
    resistanceRisk: 67,
  },
  residues: [
    {
      id: 'L1196M',
      label: 'L1196M',
      aminoAcid: 'Met1196',
      role: 'Gatekeeper resistance mutation',
      chemistry: 'mutation',
      mutationPressure: 0.93,
      conservation: 0.87,
      position: [0.88, -0.22, -0.9],
      note: 'The ALK gatekeeper swap tightens the hydrophobic path and penalizes older scaffolds.',
      ligandInsight: 'Inhibitors need a cleaner bend through the channel instead of a flat hydrophobic slab.',
    },
    {
      id: 'G1202R',
      label: 'G1202R',
      aminoAcid: 'Arg1202',
      role: 'Solvent-front resistance mutation',
      chemistry: 'mutation',
      mutationPressure: 0.98,
      conservation: 0.66,
      position: [-1.1, 0.55, 0.98],
      note: 'This solvent-front mutation adds bulk and charge right where many ALK inhibitors need clearance.',
      ligandInsight: 'Compact, flexible heads do better here than rigid aromatic caps.',
    },
    {
      id: 'M1199',
      label: 'M1199',
      aminoAcid: 'Met1199',
      role: 'Hinge anchor',
      chemistry: 'polar',
      mutationPressure: 0.27,
      conservation: 0.95,
      position: [0.1, 0.33, -0.28],
      note: 'This hinge contact stabilizes the pose before the ligand reaches the back pocket.',
      ligandInsight: 'Lose this interaction and the rest of the scaffold becomes much more fragile.',
    },
    {
      id: 'E1197',
      label: 'E1197',
      aminoAcid: 'Glu1197',
      role: 'Electrostatic wall',
      chemistry: 'charged',
      mutationPressure: 0.24,
      conservation: 0.9,
      position: [-0.48, 1.02, 0.22],
      note: 'A charged wall at the hinge mouth that steers ligands into the ATP pocket.',
      ligandInsight: 'Polar groups can use this as a guide rail, but overshoot creates a clash fast.',
    },
    {
      id: 'C1156',
      label: 'C1156',
      aminoAcid: 'Cys1156',
      role: 'Front-pocket reporter',
      chemistry: 'polar',
      mutationPressure: 0.69,
      conservation: 0.8,
      position: [1.48, 0.18, -1.76],
      note: 'This region reports whether a scaffold leans too heavily on the front pocket.',
      ligandInsight: 'Balanced occupancy here helps broad coverage, but overcommitting makes the pose brittle.',
    },
    {
      id: 'D1203',
      label: 'D1203',
      aminoAcid: 'Asp1203',
      role: 'Solvent-front stabilizer',
      chemistry: 'charged',
      mutationPressure: 0.42,
      conservation: 0.85,
      position: [0.6, -1.02, 0.92],
      note: 'This acidic residue shapes the lower solvent-front wall and reports whether the loop stays ordered.',
      ligandInsight: 'Good analogs graze this wall without becoming too bulky for G1202R.',
    },
    {
      id: 'L1122',
      label: 'L1122',
      aminoAcid: 'Leu1122',
      role: 'Back-pocket shelf',
      chemistry: 'hydrophobic',
      mutationPressure: 0.61,
      conservation: 0.72,
      position: [-1.2, -0.28, -1.22],
      note: 'A hydrophobic shelf that rewards narrow scaffolds with good back-pocket complementarity.',
      ligandInsight: 'Lorlatinib-style curvature fits here better than older flat inhibitors.',
    },
  ],
  ligands: [
    {
      id: 'crizotinib',
      name: 'Crizotinib',
      stage: '1st generation reference',
      tag: 'Reference failure mode',
      confidence: 'Clinical precedent',
      pocketFit: 0.45,
      mutationCoverage: 0.24,
      selectivity: 0.52,
      color: '#ff8b5c',
      center: [0.18, 0.15, -0.82],
      contactResidues: ['E1197', 'M1199', 'L1122'],
      storyline:
        'Fast hinge engagement, but the scaffold loses geometric room at the ALK gatekeeper and solvent front.',
      risk: 'L1196M and G1202R both erode the original fit quickly.',
      atoms: [
        { type: 'box', offset: [-0.68, 0.08, 0.38], scale: [0.48, 0.14, 0.24], color: '#ffe0c2' },
        { type: 'sphere', offset: [-0.12, 0.2, 0.04], scale: [0.28, 0.28, 0.28], color: '#ff8b5c' },
        { type: 'box', offset: [0.28, -0.03, -0.22], scale: [0.34, 0.14, 0.58], color: '#ff9f73' },
        { type: 'sphere', offset: [0.58, 0.15, -0.56], scale: [0.22, 0.22, 0.22], color: '#fff0df' },
      ],
    },
    {
      id: 'lorlatinib',
      name: 'Lorlatinib',
      stage: '3rd generation anchor',
      tag: 'Clinical anchor',
      confidence: 'Clinical benchmark',
      pocketFit: 0.86,
      mutationCoverage: 0.84,
      selectivity: 0.8,
      color: '#4fe3c1',
      center: [0.5, 0.16, -1.12],
      contactResidues: ['M1199', 'L1196M', 'G1202R', 'C1156'],
      storyline:
        'A compact macrocycle that bends through the gatekeeper region while preserving enough clearance near the solvent front.',
      risk: 'Still feels pressure at G1202R, but carries more geometric margin than crizotinib.',
      atoms: [
        { type: 'box', offset: [-0.76, 0.12, 0.4], scale: [0.58, 0.16, 0.22], color: '#b8fff0' },
        { type: 'sphere', offset: [-0.2, 0.22, 0.04], scale: [0.24, 0.24, 0.24], color: '#79f6da' },
        { type: 'box', offset: [0.26, 0.04, -0.3], scale: [0.3, 0.16, 0.68], color: '#4fe3c1' },
        { type: 'sphere', offset: [0.74, 0.16, -0.72], scale: [0.2, 0.2, 0.2], color: '#ebfff9' },
        { type: 'box', offset: [1.0, -0.04, -1.02], scale: [0.16, 0.12, 0.32], color: '#3bcaa8' },
      ],
    },
    {
      id: 'pvx-alk1',
      name: 'PVX-ALK1',
      stage: 'Exploratory analog',
      tag: 'G1202R-aware concept',
      confidence: 'Design hypothesis',
      pocketFit: 0.77,
      mutationCoverage: 0.91,
      selectivity: 0.69,
      color: '#a793ff',
      center: [0.36, 0.04, -1.0],
      contactResidues: ['M1199', 'G1202R', 'D1203', 'L1122'],
      storyline:
        'A non-covalent ALK analog that shifts binding weight away from the solvent front and into hinge plus lower-loop contacts.',
      risk: 'Likely trades some raw potency for broader mutation tolerance.',
      atoms: [
        { type: 'box', offset: [-0.7, 0.06, 0.28], scale: [0.54, 0.16, 0.2], color: '#ddd1ff' },
        { type: 'sphere', offset: [-0.14, 0.18, -0.02], scale: [0.25, 0.25, 0.25], color: '#a793ff' },
        { type: 'box', offset: [0.24, 0.0, -0.32], scale: [0.24, 0.14, 0.62], color: '#c2b4ff' },
        { type: 'sphere', offset: [0.56, -0.16, -0.64], scale: [0.18, 0.18, 0.18], color: '#f3efff' },
        { type: 'box', offset: [0.88, -0.18, -0.92], scale: [0.14, 0.1, 0.32], color: '#8e7cf6' },
      ],
    },
  ],
  cameraStops: [
    {
      id: 'overview',
      title: 'Pocket overview',
      description: 'Show the ALK cavity and the distribution of ligand contacts.',
      position: [0.1, 1.75, 7.0],
      target: [0.15, 0.08, -0.55],
    },
    {
      id: 'solvent-front',
      title: 'Solvent-front choke point',
      description: 'Rotate toward G1202R to show where bulky inhibitor heads lose clearance.',
      position: [-2.9, 1.0, 2.95],
      target: [-1.05, 0.52, 0.92],
    },
    {
      id: 'gatekeeper',
      title: 'Gatekeeper channel',
      description: 'Swing toward L1196M to show how the hydrophobic path narrows for older scaffolds.',
      position: [3.0, 0.92, 2.4],
      target: [0.9, -0.18, -0.92],
    },
  ],
  defaultResidueId: 'G1202R',
  defaultLigandId: 'lorlatinib',
  defaultStopId: 'overview',
};

export const proteinCatalog: ProteinOption[] = [
  { id: 'egfr', label: 'EGFR', implemented: true },
  { id: 'alk', label: 'ALK', implemented: true },
  { id: 'braf', label: 'BRAF', implemented: true },
  { id: 'kras', label: 'KRAS', implemented: true },
  { id: 'bcr-abl', label: 'BCR-ABL', implemented: true },
  { id: 'pi3k', label: 'PI3K', implemented: true },
  { id: 'her2', label: 'HER2', implemented: true },
];

function makeSharedScaffoldModel(
  id: string,
  name: string,
  targetId: string,
  template: ProteinModel,
): ProteinModel {
  return {
    ...template,
    id,
    targetProfile: {
      ...template.targetProfile,
      name: `${name} pocket`,
      subtitle: `${name} exploratory atlas on a shared resistance-view scaffold`,
      targetId,
      demoClaim:
        'An interactive 3D pocket atlas on a shared scaffold for comparing ligand resilience under resistance pressure.',
    },
  };
}

const proteinModels: Record<string, ProteinModel> = {
  egfr: egfrModel,
  alk: alkModel,
  braf: makeSharedScaffoldModel('braf', 'BRAF kinase', 'P15056', egfrModel),
  kras: makeSharedScaffoldModel('kras', 'KRAS switch-II', 'P01116', egfrModel),
  'bcr-abl': makeSharedScaffoldModel('bcr-abl', 'BCR-ABL kinase', 'P00519', alkModel),
  pi3k: makeSharedScaffoldModel('pi3k', 'PI3K alpha', 'P42336', alkModel),
  her2: makeSharedScaffoldModel('her2', 'HER2 kinase', 'P04626', egfrModel),
};

export function getProteinModel(id: string): ProteinModel {
  return proteinModels[id] ?? egfrModel;
}

export function getLigandById(model: ProteinModel, id: string): Ligand {
  const ligand = model.ligands.find((entry) => entry.id === id);
  if (!ligand) {
    throw new Error(`Unknown ligand: ${id}`);
  }

  return ligand;
}

export function getResidueById(model: ProteinModel, id: string): Residue {
  const residue = model.residues.find((entry) => entry.id === id);
  if (!residue) {
    throw new Error(`Unknown residue: ${id}`);
  }

  return residue;
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}
