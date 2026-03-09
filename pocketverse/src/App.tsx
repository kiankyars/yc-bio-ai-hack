import { startTransition, useDeferredValue, useEffect, useRef, useState } from 'react';

import {
  formatPercent,
  getProteinModel,
  getLigandById,
  getResidueById,
  proteinCatalog,
  type OverlayMode,
} from './data/pocketData';
import { askPocketCopilot, type ChatMessage } from './lib/gemini';
import { PocketVerseScene } from './lib/pocketverse-scene';

const DEFAULT_GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-flash-3-preview';

function makeWelcomeMessage(protein: string): ChatMessage {
  return {
    role: 'assistant',
    content: `Ask me about ${protein} ligands, residues, resistance hotspots, or which scaffold looks most resilient.`,
  };
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<PocketVerseScene | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  const [selectedProteinId, setSelectedProteinId] = useState('egfr');
  const [sceneReady, setSceneReady] = useState(false);
  const [overlayMode, setOverlayMode] = useState<OverlayMode>('resistance');
  const [autoplay, setAutoplay] = useState(true);
  const model = getProteinModel(selectedProteinId);
  const [selectedResidueId, setSelectedResidueId] = useState(model.defaultResidueId);
  const [selectedLigandId, setSelectedLigandId] = useState(model.defaultLigandId);
  const [selectedStopId, setSelectedStopId] = useState(model.defaultStopId);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    makeWelcomeMessage(getProteinModel('egfr').targetProfile.name),
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatBusy, setChatBusy] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [chatModelUsed, setChatModelUsed] = useState(DEFAULT_GEMINI_MODEL);

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
    setChatMessages([makeWelcomeMessage(model.targetProfile.name)]);
    setChatInput('');
    setChatError(null);
    setChatModelUsed(DEFAULT_GEMINI_MODEL);
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

  useEffect(() => {
    chatScrollRef.current?.scrollTo({
      top: chatScrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [chatMessages, chatBusy]);

  async function submitChat(prompt: string): Promise<void> {
    const trimmed = prompt.trim();
    if (!trimmed || chatBusy) {
      return;
    }

    const nextMessages = [...chatMessages, { role: 'user', content: trimmed } as ChatMessage];
    setChatMessages(nextMessages);
    setChatInput('');
    setChatBusy(true);
    setChatError(null);

    try {
      const reply = await askPocketCopilot({
        model: DEFAULT_GEMINI_MODEL,
        messages: nextMessages.slice(-8),
        context: {
          protein: model.targetProfile.name,
          targetId: model.targetProfile.targetId,
          selectedLigand: selectedLigand.name,
          selectedResidue: selectedResidue.label,
          selectedView: model.cameraStops.find((stop) => stop.id === resolvedStopId)?.title || resolvedStopId,
          ligands: model.ligands.map((ligand) => ({
            name: ligand.name,
            stage: ligand.stage,
            tag: ligand.tag,
            pocketFit: ligand.pocketFit,
            mutationCoverage: ligand.mutationCoverage,
            storyline: ligand.storyline,
            risk: ligand.risk,
          })),
          residues: model.residues.map((residue) => ({
            label: residue.label,
            aminoAcid: residue.aminoAcid,
            role: residue.role,
            mutationPressure: residue.mutationPressure,
            conservation: residue.conservation,
            note: residue.note,
            ligandInsight: residue.ligandInsight,
          })),
        },
      });

      setChatModelUsed(reply.model);
      setChatMessages((current) => [...current, { role: 'assistant', content: reply.content }]);
    } catch (error) {
      setChatError(error instanceof Error ? error.message : 'Gemini request failed.');
    } finally {
      setChatBusy(false);
    }
  }

  function askAboutLigand(ligandId: string): void {
    const ligand = model.ligands.find((entry) => entry.id === ligandId);
    if (!ligand) {
      return;
    }
    setSelectedLigandId(ligandId);
    void submitChat(`Explain ${ligand.name} in this ${model.targetProfile.name} pocket. Why does it fit or fail?`);
  }

  function askAboutResidue(residueId: string): void {
    const residue = model.residues.find((entry) => entry.id === residueId);
    if (!residue) {
      return;
    }
    setSelectedResidueId(residueId);
    setAutoplay(false);
    void submitChat(`What does ${residue.label} do in this ${model.targetProfile.name} pocket, and why does it matter for resistance?`);
  }

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
              <span>{sceneReady ? 'Drag to orbit, click to select residues' : 'Initializing scene...'}</span>
              <span>{selectedResidue.label} selected</span>
            </div>
          </div>

          <div className="viewport__footer">
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
        </section>

        <aside className="panel rail chat-panel">
          <div className="panel__block">
            <div className="panel__row">
              <p className="kicker">Pocket copilot</p>
              <span className="badge badge--accent">{chatModelUsed}</span>
            </div>
            <div className="chat-context">
              <span className="badge">Ligand {selectedLigand.name}</span>
              <span className="badge">Residue {selectedResidue.label}</span>
            </div>
          </div>

          <div className="panel__block">
            <p className="kicker">Quick ask: ligands</p>
            <div className="chat-chip-grid">
              {model.ligands.map((ligand) => (
                <button
                  key={ligand.id}
                  className="chat-chip"
                  onClick={() => askAboutLigand(ligand.id)}
                  type="button"
                >
                  {ligand.name}
                </button>
              ))}
            </div>
          </div>

          <div className="panel__block">
            <p className="kicker">Quick ask: residues</p>
            <div className="chat-chip-grid">
              {model.residues.map((residue) => (
                <button
                  key={residue.id}
                  className="chat-chip"
                  onClick={() => askAboutResidue(residue.id)}
                  type="button"
                >
                  {residue.label}
                </button>
              ))}
            </div>
          </div>

          <div className="panel__block chat-log" ref={chatScrollRef}>
            {chatMessages.map((message, index) => (
              <article
                className={message.role === 'assistant' ? 'chat-bubble chat-bubble--assistant' : 'chat-bubble chat-bubble--user'}
                key={`${message.role}-${index}-${message.content.slice(0, 24)}`}
              >
                {message.content}
              </article>
            ))}
            {chatBusy ? <article className="chat-bubble chat-bubble--assistant">Thinking…</article> : null}
          </div>

          <div className="panel__block">
            <form
              className="chat-form"
              onSubmit={(event) => {
                event.preventDefault();
                void submitChat(chatInput);
              }}
            >
              <textarea
                className="chat-input"
                onChange={(event) => setChatInput(event.target.value)}
                placeholder={`Ask about ${selectedLigand.name}, ${selectedResidue.label}, or compare ligands in ${model.targetProfile.name}.`}
                rows={4}
                value={chatInput}
              />
              <button className="chat-send" disabled={chatBusy || !chatInput.trim()} type="submit">
                Send
              </button>
            </form>
            {chatError ? <p className="chat-error">{chatError}</p> : null}
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
