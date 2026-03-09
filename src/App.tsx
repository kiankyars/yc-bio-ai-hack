import { startTransition, useDeferredValue, useEffect, useRef, useState } from 'react';

import {
  buildCopilotBrief,
  cameraStops,
  evidenceCards,
  formatPercent,
  getLigandById,
  getResidueById,
  ligands,
  residues,
  targetProfile,
  type OverlayMode,
} from './data/pocketData';
import { PocketVerseScene } from './lib/pocketverse-scene';

function MetricBar({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'teal' | 'gold' | 'coral' | 'violet';
}) {
  return (
    <div className="metric-bar">
      <div className="metric-bar__header">
        <span>{label}</span>
        <strong>{formatPercent(value)}</strong>
      </div>
      <div className="metric-bar__track">
        <div className={`metric-bar__fill metric-bar__fill--${tone}`} style={{ width: formatPercent(value) }} />
      </div>
    </div>
  );
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<PocketVerseScene | null>(null);

  const [sceneReady, setSceneReady] = useState(false);
  const [selectedResidueId, setSelectedResidueId] = useState('T790M');
  const [selectedLigandId, setSelectedLigandId] = useState('osimertinib');
  const [overlayMode, setOverlayMode] = useState<OverlayMode>('resistance');
  const [selectedStopId, setSelectedStopId] = useState('overview');
  const [autoplay, setAutoplay] = useState(true);

  const deferredResidueId = useDeferredValue(selectedResidueId);
  const selectedResidue = getResidueById(deferredResidueId);
  const selectedLigand = getLigandById(selectedLigandId);
  const copilotBrief = buildCopilotBrief(selectedResidue, selectedLigand);

  useEffect(() => {
    if (!canvasRef.current) {
      return undefined;
    }

    const scene = new PocketVerseScene(canvasRef.current, {
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
    });

    sceneRef.current = scene;
    scene.setSelectedResidue(selectedResidueId);
    scene.setSelectedLigand(selectedLigandId);
    scene.setOverlay(overlayMode);
    scene.setAutoplay(autoplay);
    setSceneReady(true);

    return () => {
      setSceneReady(false);
      scene.destroy();
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    sceneRef.current?.setSelectedResidue(selectedResidueId);
  }, [selectedResidueId]);

  useEffect(() => {
    sceneRef.current?.setSelectedLigand(selectedLigandId);
  }, [selectedLigandId]);

  useEffect(() => {
    sceneRef.current?.setOverlay(overlayMode);
  }, [overlayMode]);

  useEffect(() => {
    sceneRef.current?.setAutoplay(autoplay);
    if (!autoplay) {
      sceneRef.current?.focusStop(selectedStopId);
    }
  }, [autoplay, selectedStopId]);

  return (
    <div className="app-shell">
      <div className="app-shell__glow app-shell__glow--left" />
      <div className="app-shell__glow app-shell__glow--right" />

      <header className="hero">
        <div>
          <p className="eyebrow">
            {targetProfile.track} <span>with a live {targetProfile.companionTrack} story</span>
          </p>
          <h1>PocketVerse</h1>
          <p className="hero__lede">{targetProfile.demoClaim}</p>
        </div>

        <div className="hero__stats">
          <article className="hero-stat">
            <span>Pocket signal</span>
            <strong>{targetProfile.pocketSignal}</strong>
          </article>
          <article className="hero-stat">
            <span>Contact density</span>
            <strong>{targetProfile.contactDensity}</strong>
          </article>
          <article className="hero-stat">
            <span>Resistance risk</span>
            <strong>{targetProfile.resistanceRisk}</strong>
          </article>
        </div>
      </header>

      <main className="layout">
        <section className="panel rail">
          <div className="panel__block">
            <p className="kicker">Demo target</p>
            <h2>{targetProfile.name}</h2>
            <p className="muted">{targetProfile.subtitle}</p>
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
              <p className="kicker">Camera beats</p>
              <button
                className={autoplay ? 'toggle toggle--active' : 'toggle'}
                onClick={() => setAutoplay((current) => !current)}
                type="button"
              >
                {autoplay ? 'Auto tour on' : 'Auto tour off'}
              </button>
            </div>

            <div className="stack-list">
              {cameraStops.map((stop) => (
                <button
                  key={stop.id}
                  className={stop.id === selectedStopId ? 'stop-card stop-card--active' : 'stop-card'}
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

          <div className="panel__block">
            <p className="kicker">Why this demo lands</p>
            <div className="stack-list">
              {evidenceCards.map((card) => (
                <article key={card.title} className="note-card">
                  <strong>{card.title}</strong>
                  <p>{card.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="viewport panel">
          <div className="viewport__header">
            <div>
              <p className="kicker">Live scene</p>
              <h2>3D resistance pocket</h2>
            </div>
            <div className="viewport__badges">
              <span className="badge">Target {targetProfile.targetId}</span>
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

          <div className="viewport__footer">
            {ligands.map((ligand) => (
              <button
                key={ligand.id}
                className={ligand.id === selectedLigandId ? 'ligand-card ligand-card--active' : 'ligand-card'}
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
        </section>

        <aside className="panel rail">
          <div className="panel__block">
            <p className="kicker">Selected residue</p>
            <h2>{selectedResidue.label}</h2>
            <p className="muted">
              {selectedResidue.aminoAcid} • {selectedResidue.role}
            </p>
            <p>{selectedResidue.note}</p>
          </div>

          <div className="panel__block">
            <MetricBar label="Mutation pressure" value={selectedResidue.mutationPressure} tone="coral" />
            <MetricBar label="Conservation" value={selectedResidue.conservation} tone="gold" />
            <MetricBar label="Pocket fit" value={selectedLigand.pocketFit} tone="teal" />
            <MetricBar label="Mutation coverage" value={selectedLigand.mutationCoverage} tone="violet" />
          </div>

          <div className="panel__block">
            <p className="kicker">Copilot explanation</p>
            <div className="stack-list">
              {copilotBrief.map((line) => (
                <article key={line} className="quote-card">
                  {line}
                </article>
              ))}
            </div>
          </div>

          <div className="panel__block">
            <p className="kicker">Ligand review</p>
            <article className="review-card">
              <div className="review-card__header">
                <strong>{selectedLigand.name}</strong>
                <span>{selectedLigand.confidence}</span>
              </div>
              <p>{selectedLigand.storyline}</p>
              <p className="review-card__risk">{selectedLigand.risk}</p>
            </article>
          </div>

          <div className="panel__block">
            <p className="kicker">Current contacts</p>
            <div className="contact-grid">
              {selectedLigand.contactResidues.map((residueId) => {
                const residue = getResidueById(residueId);
                return (
                  <button
                    key={residue.id}
                    className={residue.id === selectedResidueId ? 'contact-pill contact-pill--active' : 'contact-pill'}
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
        <span>1 target</span>
        <span>3 ligands</span>
        <span>7 residues</span>
        <span>3 camera beats</span>
      </footer>
    </div>
  );
}
