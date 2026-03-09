import * as pc from 'playcanvas';

import {
  cameraStops,
  getLigandById,
  getResidueById,
  ligands,
  residues,
  type Ligand,
  type OverlayMode,
  type Residue,
  type Vec3Tuple,
} from '../data/pocketData';

type SceneCallbacks = {
  onResidueSelect: (id: string) => void;
  onStopChange?: (id: string) => void;
};

type ResidueVisual = {
  entity: pc.Entity;
  aura: pc.Entity;
  residue: Residue;
  material: pc.StandardMaterial;
  auraMaterial: pc.StandardMaterial;
};

type BeamVisual = {
  entity: pc.Entity;
  material: pc.StandardMaterial;
  residueId: string;
};

const CAMERA_EASE = 5.5;

function tupleToVec3(values: Vec3Tuple): pc.Vec3 {
  return new pc.Vec3(values[0], values[1], values[2]);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function hexToColor(hex: string): pc.Color {
  const normalized = hex.replace('#', '');
  const value = normalized.length === 3
    ? normalized
        .split('')
        .map((char) => `${char}${char}`)
        .join('')
    : normalized;

  const r = Number.parseInt(value.slice(0, 2), 16) / 255;
  const g = Number.parseInt(value.slice(2, 4), 16) / 255;
  const b = Number.parseInt(value.slice(4, 6), 16) / 255;

  return new pc.Color(r, g, b);
}

function mixColors(a: pc.Color, b: pc.Color, t: number): pc.Color {
  return new pc.Color(
    a.r + (b.r - a.r) * t,
    a.g + (b.g - a.g) * t,
    a.b + (b.b - a.b) * t,
  );
}

function makeMaterial(
  color: string,
  options?: {
    opacity?: number;
    emissive?: string;
    emissiveIntensity?: number;
    useLighting?: boolean;
    blend?: boolean;
    depthWrite?: boolean;
    gloss?: number;
  },
): pc.StandardMaterial {
  const material = new pc.StandardMaterial();
  material.diffuse = hexToColor(color);
  material.emissive = hexToColor(options?.emissive ?? color);
  material.emissiveIntensity = options?.emissiveIntensity ?? 0.4;
  material.gloss = options?.gloss ?? 0.25;
  material.useLighting = options?.useLighting ?? true;
  material.opacity = options?.opacity ?? 1;

  if (options?.blend) {
    material.blendType = pc.BLEND_NORMAL;
    material.depthWrite = options.depthWrite ?? false;
  }

  material.update();
  return material;
}

export class PocketVerseScene {
  private readonly canvas: HTMLCanvasElement;

  private readonly callbacks: SceneCallbacks;

  private readonly app: pc.Application;

  private readonly camera: pc.Entity;

  private readonly residueVisuals = new Map<string, ResidueVisual>();

  private readonly cavityRings: pc.Entity[] = [];

  private readonly driftingParticles: pc.Entity[] = [];

  private ligandRoot: pc.Entity | null = null;

  private contactBeams: BeamVisual[] = [];

  private selectedResidueId = 'T790M';

  private selectedLigandId = 'osimertinib';

  private overlayMode: OverlayMode = 'resistance';

  private selectedStopId = 'overview';

  private currentCameraPosition = tupleToVec3(cameraStops[0].position);

  private targetCameraPosition = tupleToVec3(cameraStops[0].position);

  private currentCameraTarget = tupleToVec3(cameraStops[0].target);

  private targetCameraTarget = tupleToVec3(cameraStops[0].target);

  private autoplay = true;

  private autoplayTimer = 0;

  private elapsed = 0;

  private readonly handleResize = () => {
    const rect = this.canvas.getBoundingClientRect();
    this.app.resizeCanvas(rect.width, rect.height);
  };

  private readonly handlePointerMove = (event: PointerEvent) => {
    const residueId = this.pickResidue(event);
    this.canvas.style.cursor = residueId ? 'pointer' : 'default';
  };

  private readonly handlePointerDown = (event: PointerEvent) => {
    const residueId = this.pickResidue(event);
    if (!residueId) {
      return;
    }

    this.callbacks.onResidueSelect(residueId);
  };

  private readonly handleUpdate = (dt: number) => {
    this.update(dt);
  };

  constructor(canvas: HTMLCanvasElement, callbacks: SceneCallbacks) {
    this.canvas = canvas;
    this.callbacks = callbacks;

    this.app = new pc.Application(canvas, {
      graphicsDeviceOptions: {
        deviceTypes: [pc.DEVICETYPE_WEBGPU, pc.DEVICETYPE_WEBGL2],
        antialias: true,
        alpha: false,
      },
    });

    this.app.setCanvasFillMode(pc.FILLMODE_NONE);
    this.app.setCanvasResolution(pc.RESOLUTION_AUTO);
    this.app.scene.ambientLight.set(0.08, 0.1, 0.12);
    this.app.scene.exposure = 1.4;

    this.camera = this.createCamera();
    this.createLights();
    this.createPocketShell();
    this.createResidues();
    this.createParticles();
    this.rebuildLigand(getLigandById(this.selectedLigandId));
    this.applyResidueColors();

    this.app.on('update', this.handleUpdate);
    this.app.start();

    window.addEventListener('resize', this.handleResize);
    this.canvas.addEventListener('pointermove', this.handlePointerMove);
    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    this.handleResize();
  }

  setSelectedResidue(id: string): void {
    if (!this.residueVisuals.has(id)) {
      return;
    }

    this.selectedResidueId = id;
    this.applyResidueColors();
  }

  setSelectedLigand(id: string): void {
    if (id === this.selectedLigandId) {
      return;
    }

    this.selectedLigandId = id;
    this.rebuildLigand(getLigandById(id));
    this.applyResidueColors();
  }

  setOverlay(mode: OverlayMode): void {
    this.overlayMode = mode;
    this.applyResidueColors();
  }

  setAutoplay(enabled: boolean): void {
    this.autoplay = enabled;
    this.autoplayTimer = 0;
  }

  focusStop(id: string): void {
    const stop = cameraStops.find((entry) => entry.id === id);
    if (!stop) {
      return;
    }

    this.selectedStopId = id;
    this.targetCameraPosition = tupleToVec3(stop.position);
    this.targetCameraTarget = tupleToVec3(stop.target);
    this.callbacks.onStopChange?.(id);
  }

  destroy(): void {
    window.removeEventListener('resize', this.handleResize);
    this.canvas.removeEventListener('pointermove', this.handlePointerMove);
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.app.off('update', this.handleUpdate);
    this.app.destroy();
  }

  private createCamera(): pc.Entity {
    const entity = new pc.Entity('camera');
    entity.addComponent('camera', {
      clearColor: new pc.Color(0.027, 0.039, 0.067),
      fov: 48,
      nearClip: 0.1,
      farClip: 100,
    });
    entity.setPosition(this.currentCameraPosition);
    this.app.root.addChild(entity);
    entity.lookAt(this.currentCameraTarget);

    return entity;
  }

  private createLights(): void {
    const key = new pc.Entity('key-light');
    key.addComponent('light', {
      type: 'directional',
      color: new pc.Color(0.95, 0.93, 1),
      intensity: 1.5,
      castShadows: false,
    });
    key.setEulerAngles(45, 28, 0);
    this.app.root.addChild(key);

    const fill = new pc.Entity('fill-light');
    fill.addComponent('light', {
      type: 'omni',
      color: new pc.Color(0.12, 0.76, 0.86),
      intensity: 1.7,
      range: 18,
      castShadows: false,
    });
    fill.setPosition(-2.5, 2.2, 3.5);
    this.app.root.addChild(fill);

    const warm = new pc.Entity('warm-light');
    warm.addComponent('light', {
      type: 'omni',
      color: new pc.Color(1, 0.45, 0.28),
      intensity: 1.1,
      range: 14,
      castShadows: false,
    });
    warm.setPosition(2.8, -1.6, 0.5);
    this.app.root.addChild(warm);
  }

  private createPocketShell(): void {
    for (let index = 0; index < 16; index += 1) {
      const ring = new pc.Entity(`ring-${index}`);
      ring.addComponent('model', {
        type: 'torus',
      });

      const z = 1.6 - index * 0.42;
      const x = Math.sin(index * 0.7) * 0.22;
      const y = Math.cos(index * 0.55) * 0.18;
      const width = 4.6 - index * 0.11;
      const height = 2.15 + Math.sin(index * 0.6) * 0.2;
      ring.setPosition(x, y, z);
      ring.setLocalScale(width, 0.24, height);

      const material = makeMaterial('#173954', {
        opacity: 0.16,
        emissive: index % 2 === 0 ? '#2accc3' : '#ff6c4f',
        emissiveIntensity: 0.75,
        useLighting: false,
        blend: true,
        depthWrite: false,
      });
      ring.model!.material = material;
      this.app.root.addChild(ring);
      this.cavityRings.push(ring);
    }

    for (let index = 0; index < 6; index += 1) {
      const cloud = new pc.Entity(`cloud-${index}`);
      cloud.addComponent('model', { type: 'sphere' });
      cloud.setPosition(
        Math.sin(index * 0.8) * 0.8,
        Math.cos(index * 0.65) * 0.45,
        0.65 - index * 0.65,
      );
      cloud.setLocalScale(2.9 - index * 0.18, 1.05 + index * 0.05, 1.4);
      cloud.model!.material = makeMaterial('#132641', {
        opacity: 0.08,
        emissive: '#236579',
        emissiveIntensity: 0.45,
        useLighting: false,
        blend: true,
        depthWrite: false,
      });
      this.app.root.addChild(cloud);
    }
  }

  private createResidues(): void {
    residues.forEach((residue, index) => {
      const entity = new pc.Entity(`residue-${residue.id}`);
      entity.addComponent('model', { type: 'sphere' });
      entity.setPosition(tupleToVec3(residue.position));
      entity.setLocalScale(0.35, 0.35, 0.35);

      const material = makeMaterial('#5dd9cb', {
        emissive: '#c5fff2',
        emissiveIntensity: 0.4,
        useLighting: true,
      });
      entity.model!.material = material;
      this.app.root.addChild(entity);

      const aura = new pc.Entity(`aura-${residue.id}`);
      aura.addComponent('model', { type: 'sphere' });
      aura.setPosition(tupleToVec3(residue.position));
      aura.setLocalScale(0.52, 0.52, 0.52);

      const auraMaterial = makeMaterial('#5dd9cb', {
        opacity: 0.16,
        emissive: '#c5fff2',
        emissiveIntensity: 0.95,
        useLighting: false,
        blend: true,
        depthWrite: false,
      });
      aura.model!.material = auraMaterial;
      this.app.root.addChild(aura);

      if (index % 2 === 0) {
        entity.rotateLocal(22, 18, 0);
      }

      this.residueVisuals.set(residue.id, {
        entity,
        aura,
        residue,
        material,
        auraMaterial,
      });
    });
  }

  private createParticles(): void {
    for (let index = 0; index < 48; index += 1) {
      const particle = new pc.Entity(`particle-${index}`);
      particle.addComponent('model', { type: 'sphere' });
      particle.setPosition(
        Math.sin(index * 13.1) * 7,
        Math.cos(index * 7.7) * 4.5,
        -8 + (index % 12) * 1.1,
      );
      const scale = 0.03 + (index % 4) * 0.015;
      particle.setLocalScale(scale, scale, scale);
      particle.model!.material = makeMaterial(index % 3 === 0 ? '#6cece8' : '#ffd4c6', {
        emissive: index % 3 === 0 ? '#6cece8' : '#ffd4c6',
        emissiveIntensity: 1.2,
        useLighting: false,
      });
      this.app.root.addChild(particle);
      this.driftingParticles.push(particle);
    }
  }

  private rebuildLigand(ligand: Ligand): void {
    this.ligandRoot?.destroy();
    this.contactBeams.forEach((beam) => beam.entity.destroy());
    this.contactBeams = [];

    const root = new pc.Entity(`ligand-${ligand.id}`);
    root.setPosition(tupleToVec3(ligand.center));
    this.app.root.addChild(root);
    this.ligandRoot = root;

    ligand.atoms.forEach((atom, index) => {
      const entity = new pc.Entity(`${ligand.id}-atom-${index}`);
      entity.addComponent('model', {
        type: atom.type,
      });
      entity.setLocalPosition(tupleToVec3(atom.offset));
      entity.setLocalScale(tupleToVec3(atom.scale));
      entity.model!.material = makeMaterial(atom.color, {
        emissive: atom.color,
        emissiveIntensity: 0.85,
        useLighting: true,
        gloss: 0.55,
      });
      root.addChild(entity);
    });

    const core = new pc.Entity(`${ligand.id}-core`);
    core.addComponent('model', { type: 'sphere' });
    core.setLocalScale(0.1, 0.1, 0.1);
    core.model!.material = makeMaterial(ligand.color, {
      emissive: '#ffffff',
      emissiveIntensity: 0.6,
      useLighting: false,
    });
    root.addChild(core);

    ligand.contactResidues.forEach((residueId) => {
      const beam = new pc.Entity(`${ligand.id}-${residueId}-beam`);
      beam.addComponent('model', { type: 'box' });
      const material = makeMaterial(ligand.color, {
        opacity: 0.28,
        emissive: ligand.color,
        emissiveIntensity: 1,
        useLighting: false,
        blend: true,
        depthWrite: false,
      });
      beam.model!.material = material;
      this.app.root.addChild(beam);
      this.contactBeams.push({ entity: beam, material, residueId });
    });

    this.updateContactBeams();
  }

  private update(dt: number): void {
    this.elapsed += dt;

    if (this.autoplay) {
      this.autoplayTimer += dt;
      if (this.autoplayTimer > 6.5) {
        const nextIndex = (cameraStops.findIndex((entry) => entry.id === this.selectedStopId) + 1) % cameraStops.length;
        this.focusStop(cameraStops[nextIndex].id);
        this.autoplayTimer = 0;
      }
    }

    const ease = 1 - Math.exp(-CAMERA_EASE * dt);
    this.currentCameraPosition = this.interpolateVec3(this.currentCameraPosition, this.targetCameraPosition, ease);
    this.currentCameraTarget = this.interpolateVec3(this.currentCameraTarget, this.targetCameraTarget, ease);
    this.camera.setPosition(this.currentCameraPosition);
    this.camera.lookAt(this.currentCameraTarget);

    this.cavityRings.forEach((ring, index) => {
      ring.rotateLocal(
        0,
        (index % 2 === 0 ? 1 : -1) * dt * (2.8 + index * 0.1),
        dt * 1.2,
      );

      const baseY = Math.cos(index * 0.55) * 0.18;
      const position = ring.getPosition();
      position.y = baseY + Math.sin(this.elapsed * 0.8 + index) * 0.02;
      ring.setPosition(position);
    });

    this.driftingParticles.forEach((particle, index) => {
      const position = particle.getPosition();
      position.y += Math.sin(this.elapsed * 0.55 + index) * 0.0008;
      position.x += Math.cos(this.elapsed * 0.42 + index) * 0.0007;
      particle.setPosition(position);
    });

    this.residueVisuals.forEach(({ aura, entity, residue }, id, map) => {
      const index = Array.from(map.keys()).indexOf(id);
      const pulse = 1 + Math.sin(this.elapsed * 2.4 + index * 0.6) * 0.05;
      const activeBoost = id === this.selectedResidueId ? 1.18 : 1;
      entity.setLocalScale(0.35 * pulse * activeBoost, 0.35 * pulse * activeBoost, 0.35 * pulse * activeBoost);
      aura.setLocalScale(0.55 * pulse * activeBoost, 0.55 * pulse * activeBoost, 0.55 * pulse * activeBoost);

      const offset = Math.sin(this.elapsed * 1.2 + residue.position[2]) * 0.015;
      entity.setPosition(residue.position[0], residue.position[1] + offset, residue.position[2]);
      aura.setPosition(residue.position[0], residue.position[1] + offset, residue.position[2]);
    });

    if (this.ligandRoot) {
      this.ligandRoot.setEulerAngles(
        Math.sin(this.elapsed * 0.5) * 6,
        this.elapsed * 18,
        Math.cos(this.elapsed * 0.3) * 4,
      );
    }

    this.updateContactBeams();
  }

  private applyResidueColors(): void {
    const ligand = getLigandById(this.selectedLigandId);

    this.residueVisuals.forEach(({ residue, material, auraMaterial }, id) => {
      const base = this.colorForResidue(residue);
      const active = id === this.selectedResidueId;
      const contacted = ligand.contactResidues.includes(id);
      const emissive = contacted ? mixColors(base, new pc.Color(1, 1, 1), 0.18) : base;

      material.diffuse = active ? mixColors(base, new pc.Color(1, 1, 1), 0.15) : base;
      material.emissive = emissive;
      material.emissiveIntensity = active ? 1.15 : contacted ? 0.75 : 0.38;
      material.gloss = active ? 0.72 : 0.38;
      material.update();

      auraMaterial.diffuse = base;
      auraMaterial.emissive = base;
      auraMaterial.opacity = active ? 0.36 : contacted ? 0.22 : 0.12;
      auraMaterial.emissiveIntensity = active ? 1.65 : contacted ? 1.05 : 0.55;
      auraMaterial.update();
    });
  }

  private colorForResidue(residue: Residue): pc.Color {
    if (this.overlayMode === 'chemistry') {
      switch (residue.chemistry) {
        case 'hydrophobic':
          return hexToColor('#e3a65b');
        case 'polar':
          return hexToColor('#62d8da');
        case 'charged':
          return hexToColor('#ff7d68');
        case 'mutation':
          return hexToColor('#d8b2ff');
        default:
          return hexToColor('#9fe9d9');
      }
    }

    if (this.overlayMode === 'conservation') {
      return mixColors(hexToColor('#295774'), hexToColor('#f5d17b'), residue.conservation);
    }

    return mixColors(hexToColor('#213a5d'), hexToColor('#ff6c52'), residue.mutationPressure);
  }

  private updateContactBeams(): void {
    const ligand = getLigandById(this.selectedLigandId);
    const ligandCenter = tupleToVec3(ligand.center);

    this.contactBeams.forEach((beam, index) => {
      const residue = getResidueById(beam.residueId);
      const start = ligandCenter.clone();
      const end = tupleToVec3(residue.position);
      const midpoint = start.clone().add(end).mulScalar(0.5);
      const distance = start.distance(end);

      beam.entity.setPosition(midpoint);
      beam.entity.lookAt(end);
      beam.entity.setLocalScale(0.04 + index * 0.005, 0.04 + index * 0.005, distance);
      beam.material.opacity = beam.residueId === this.selectedResidueId ? 0.5 : 0.2;
      beam.material.emissiveIntensity = beam.residueId === this.selectedResidueId ? 1.4 : 0.9;
      beam.material.update();
    });
  }

  private pickResidue(event: PointerEvent): string | null {
    const rect = this.canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * this.canvas.width;
    const y = ((event.clientY - rect.top) / rect.height) * this.canvas.height;

    let bestId: string | null = null;
    let bestDistance = 32;

    this.residueVisuals.forEach(({ entity }, id) => {
      const screen = this.camera.camera!.worldToScreen(entity.getPosition());
      if (screen.z < 0) {
        return;
      }

      const dx = screen.x - x;
      const dy = screen.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < bestDistance) {
        bestDistance = distance;
        bestId = id;
      }
    });

    return bestId;
  }

  private interpolateVec3(current: pc.Vec3, target: pc.Vec3, t: number): pc.Vec3 {
    return new pc.Vec3(
      current.x + (target.x - current.x) * t,
      current.y + (target.y - current.y) * t,
      current.z + (target.z - current.z) * t,
    );
  }
}

export function getDefaultLigand(): Ligand {
  return ligands[1];
}
