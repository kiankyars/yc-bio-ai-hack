import { startTransition, useDeferredValue, useEffect, useRef, useState } from 'react';

import {
  formatPercent,
  getProteinModel,
  getLigandById,
  getResidueById,
  proteinCatalog,
  type OverlayMode,
} from './data/pocketData';
import { PocketVerseScene } from './lib/pocketverse-scene';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<PocketVerseScene | null>(null);

  const [selectedProteinId, setSelectedProteinId] = useState('egfr');
  const [sceneReady, setSceneReady] = useState(false);
  const [overlayMode, setOverlayMode] = useState<OverlayMode>('resistance');
  const [autoplay, setAutoplay] = useState(true);
  const model = getProteinModel(selectedProteinId);
  const [selectedResidueId, setSelectedResidueId] = useState(model.defaultResidueId);
  const [selectedLigandId, setSelectedLigandId] = useState(model.defaultLigandId);
  const [selectedStopId, setSelectedStopId] = useState(model.defaultStopId);

  const resolvedResidueId = model.residues.some((residue) => residue.id === selectedResidueId)
    ? selectedResidueId
    : model.defaultResidueId;
  const resolvedLigandId = model.ligands.some((ligand) => ligand.id === selectedLigandId)
    ? selectedLigandId
    : model.defaultLigandId;
  const resolvedStopId = model.cameraStops.some((stop) => stop.id === selectedStopId)
    ? selectedStopId
    : model.defaultStopId;

  const deferredResidueId = useDeferredValue(resolvedResidueId);
  const selectedResidue = getResidueById(model, deferredResidueId);
  const selectedLigand = getLigandById(model, resolvedLigandId);

  useEffect(() => {
    if (!canvasRef.current) {
      return undefined;
    }

    const scene = new PocketVerseScene(canvasRef.current, model, {
      onResidueSelect: (id) => {
        startTransition(() => {
          setAutoplay(false);
          setSelectedResidueId(id);
        });
      },
      onStopChange: (id) => {
        startTransition(() => {
          setSelectedStopId(id);
        });
      },
      onCameraInteract: () => {
        startTransition(() => {
          setAutoplay(false);
        });
      },
    });

    sceneRef.current = scene;
    scene.setSelectedResidue(resolvedResidueId);
    scene.setSelectedLigand(resolvedLigandId);
    scene.setOverlay(overlayMode);
    scene.setAutoplay(autoplay);
    if (!autoplay) {
      scene.focusStop(resolvedStopId);
    }
    setSceneReady(true);

    return () => {
      setSceneReady(false);
      scene.destroy();
      sceneRef.current = null;
    };
  }, [model, overlayMode, autoplay, resolvedResidueId, resolvedLigandId, resolvedStopId]);

  useEffect(() => {
    setSceneReady(false);
    setAutoplay(true);
    setSelectedResidueId(model.defaultResidueId);
    setSelectedLigandId(model.defaultLigandId);
    setSelectedStopId(model.defaultStopId);
  }, [model]);

  useEffect(() => {
    sceneRef.current?.setSelectedResidue(resolvedResidueId);
  }, [resolvedResidueId]);

  useEffect(() => {
    sceneRef.current?.setSelectedLigand(resolvedLigandId);
  }, [resolvedLigandId]);

  useEffect(() => {
    sceneRef.current?.setOverlay(overlayMode);
  }, [overlayMode]);

  useEffect(() => {
    sceneRef.current?.setAutoplay(autoplay);
    if (!autoplay) {
      sceneRef.current?.focusStop(resolvedStopId);
    }
  }, [autoplay, resolvedStopId]);

  return (
    <div className="app-shell">
      <div className="app-shell__glow app-shell__glow--left" />
      <div className="app-shell__glow app-shell__glow--right" />

      <header className="hero">
        <div>
          <p className="eyebrow">{model.targetProfile.track}</p>
          <h1>PocketVerse</h1>
          <p className="hero__lede">{model.targetProfile.demoClaim}</p>
        </div>

        <div className="hero__stats">
          <article className="hero-stat">
            <span>Pocket signal</span>
            <strong>{model.targetProfile.pocketSignal}</strong>
          </article>
          <article className="hero-stat">
            <span>Contact density</span>
            <strong>{model.targetProfile.contactDensity}</strong>
          </article>
          <article className="hero-stat">
            <span>Resistance risk</span>
            <strong>{model.targetProfile.resistanceRisk}</strong>
          </article>
        </div>
      </header>

      <main className="layout">
        <section className="panel rail">
          <div className="panel__block">
            <p className="kicker">Cancer protein</p>
            <div className="select-wrap">
              <select
                className="protein-select"
                onChange={(event) => setSelectedProteinId(event.target.value)}
                value={selectedProteinId}
              >
                {proteinCatalog.map((protein) => (
                  <option key={protein.id} value={protein.id}>
                    {protein.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="panel__block">
            <p className="kicker">Overlay mode</p>
            <div className="button-row">
              {(['resistance', 'chemistry', 'conservation'] as OverlayMode[]).map((mode) => (
                <button
                  key={mode}
                  className={mode === overlayMode ? 'chip chip--active' : 'chip'}
                  onClick={() => setOverlayMode(mode)}
                  type="button"
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="panel__block">
            <div className="panel__row">
              <p className="kicker">Pocket views</p>
              <button
                className={autoplay ? 'toggle toggle--active' : 'toggle'}
                onClick={() => setAutoplay((current) => !current)}
                type="button"
              >
                {autoplay ? 'Guided tour on' : 'Guided tour off'}
              </button>
            </div>

            <div className="stack-list">
              {model.cameraStops.map((stop) => (
                <button
                  key={stop.id}
                  className={stop.id === resolvedStopId ? 'stop-card stop-card--active' : 'stop-card'}
                  onClick={() => {
                    setAutoplay(false);
                    setSelectedStopId(stop.id);
                  }}
                  type="button"
                >
                  <strong>{stop.title}</strong>
                  <span>{stop.description}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="viewport panel">
          <div className="viewport__header">
            <div>
              <p className="kicker">Pocket scene</p>
              <h2>3D resistance pocket</h2>
            </div>
            <div className="viewport__badges">
              <span className="badge">Target {model.targetProfile.targetId}</span>
              <span className="badge badge--accent">{selectedLigand.stage}</span>
            </div>
          </div>

          <div className="viewport__frame">
            <canvas ref={canvasRef} className="viewport__canvas" />
            <div className="viewport__overlay">
              <span>{sceneReady ? 'Click residues to interrogate contacts' : 'Initializing scene...'}</span>
              <span>{selectedResidue.label} selected</span>
            </div>
          </div>
        </section>

        <aside className="panel rail">
          <div className="panel__block">
            <p className="kicker">Ligands</p>
            <div className="stack-list">
              {model.ligands.map((ligand) => (
                <button
                  key={ligand.id}
                  className={ligand.id === resolvedLigandId ? 'ligand-card ligand-card--active' : 'ligand-card'}
                  onClick={() => setSelectedLigandId(ligand.id)}
                  type="button"
                >
                  <div className="ligand-card__title">
                    <strong>{ligand.name}</strong>
                    <span>{ligand.tag}</span>
                  </div>
                  <div className="ligand-card__metrics">
                    <span>Fit {formatPercent(ligand.pocketFit)}</span>
                    <span>Coverage {formatPercent(ligand.mutationCoverage)}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="panel__block">
            <p className="kicker">Residues</p>
            <div className="contact-grid">
              {model.residues.map((residue) => {
                return (
                  <button
                    key={residue.id}
                    className={residue.id === resolvedResidueId ? 'contact-pill contact-pill--active' : 'contact-pill'}
                    onClick={() => {
                      setAutoplay(false);
                      setSelectedResidueId(residue.id);
                    }}
                    type="button"
                  >
                    <strong>{residue.label}</strong>
                    <span>{residue.role}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>
      </main>

      <footer className="footer-note">
        <span>{proteinCatalog.filter((protein) => protein.implemented).length} live targets</span>
        <span>{proteinCatalog.length} listed proteins</span>
        <span>{model.ligands.length} ligands</span>
        <span>{model.residues.length} residues</span>
      </footer>
    </div>
  );
}
