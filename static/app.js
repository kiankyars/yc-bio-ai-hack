const state = {
  cases: [],
  selectedBranch: "c797s",
  run: null,
};

const caseMeta = document.querySelector("#case-meta");
const branchPicker = document.querySelector("#branch-picker");
const startRunButton = document.querySelector("#start-run");
const advanceRunButton = document.querySelector("#advance-run");
const runSummary = document.querySelector("#run-summary");
const scoreboard = document.querySelector("#scoreboard");
const timeline = document.querySelector("#timeline");
const artifactPanel = document.querySelector("#artifact-panel");

function fmt(value) {
  return `${Math.round(value * 100)}%`;
}

function renderCase() {
  const currentCase = state.cases[0];
  if (!currentCase) {
    return;
  }

  caseMeta.innerHTML = `
    <div>
      <h2>${currentCase.target}</h2>
      <p>${currentCase.drug} in ${currentCase.indication}</p>
    </div>
    <p>${currentCase.overview}</p>
  `;

  branchPicker.innerHTML = "";
  currentCase.branches.forEach((branch) => {
    const button = document.createElement("button");
    button.textContent = branch.title;
    button.className = branch.id === state.selectedBranch ? "active" : "";
    button.addEventListener("click", () => {
      state.selectedBranch = branch.id;
      state.run = null;
      renderCase();
      renderRun();
    });
    branchPicker.appendChild(button);
  });
}

function renderRun() {
  if (!state.run) {
    runSummary.textContent = "No run yet.";
    scoreboard.textContent = "Start a run to see the recommendation score.";
    timeline.innerHTML = "";
    artifactPanel.textContent = "Choose or advance a run to inspect evidence.";
    advanceRunButton.disabled = true;
    return;
  }

  advanceRunButton.disabled = state.run.completed;
  runSummary.innerHTML = `
    <strong>${state.run.branch.title}</strong>
    <p>Turn ${state.run.current_turn + 1} of ${state.run.turns.length}${state.run.completed ? " • Completed" : ""}</p>
    <p>${state.run.branch.summary}</p>
  `;

  const latestTurn = state.run.turns[state.run.turns.length - 1];
  scoreboard.innerHTML = `
    <div class="score-grid">
      ${scoreChip("Total", latestTurn.scorecard.total_score)}
      ${scoreChip("Response", latestTurn.scorecard.response_score)}
      ${scoreChip("Risk", 1 - latestTurn.scorecard.resistance_risk)}
      ${scoreChip("Toxicity", 1 - latestTurn.scorecard.toxicity_penalty)}
      ${scoreChip("Plausibility", latestTurn.scorecard.plausibility_score)}
    </div>
  `;

  timeline.innerHTML = state.run.turns.map(renderTurnCard).join("");
  renderEvidence(latestTurn.evidence_artifacts);
}

function scoreChip(label, value) {
  return `<div class="score-chip"><strong>${fmt(value)}</strong><p>${label}</p></div>`;
}

function renderTurnCard(turn) {
  return `
    <article class="turn-card">
      <div class="turn-head">
        <div>
          <div class="badge">Turn ${turn.index + 1}</div>
          <h3>${turn.title}</h3>
          <p>${turn.summary}</p>
        </div>
        <div>
          <strong>${turn.recommended_intervention.name}</strong>
          <p>${turn.recommended_intervention.summary}</p>
        </div>
      </div>
      ${
        turn.resistance_event
          ? `<div class="badge">${turn.resistance_event.label} • ${fmt(turn.resistance_event.confidence)} confidence</div>`
          : ""
      }
      <div class="metric-grid">
        ${metric("Tumor burden", turn.tumor_state.burden)}
        ${metric("Fitness", turn.tumor_state.fitness)}
        ${metric("Resistance risk", turn.tumor_state.resistance_risk)}
        ${metric("EGFR activity", turn.tumor_state.pathway_activity.EGFR)}
      </div>
    </article>
  `;
}

function metric(label, value) {
  return `<div class="metric"><strong>${fmt(value)}</strong><p>${label}</p></div>`;
}

async function renderEvidence(artifacts) {
  if (!artifacts.length) {
    artifactPanel.textContent = "No linked artifacts for this turn.";
    return;
  }

  const cards = await Promise.all(
    artifacts.map(async (artifact) => {
      const response = await fetch(artifact.local_path);
      const payload = await response.json();
      const content = payload.content || {};
      const metrics = Object.entries(payload.metrics || {})
        .map(([key, value]) => `<span class="badge">${key.replaceAll("_", " ")}: ${fmt(value)}</span>`)
        .join("");
      return `
        <article class="artifact-card">
          <div>
            <div class="badge">${payload.provider}</div>
            <h3>${payload.title}</h3>
          </div>
          <p>${payload.summary}</p>
          ${metrics}
          <p>${content.note || ""}</p>
          ${payload.source_url ? `<a class="artifact-link" href="${payload.source_url}" target="_blank" rel="noreferrer">Source</a>` : ""}
        </article>
      `;
    }),
  );

  artifactPanel.innerHTML = `<div class="artifact-grid">${cards.join("")}</div>`;
}

async function startRun() {
  const currentCase = state.cases[0];
  const response = await fetch("/runs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      case_id: currentCase.id,
      branch: state.selectedBranch,
    }),
  });
  state.run = await response.json();
  renderRun();
}

async function advanceRun() {
  if (!state.run) {
    return;
  }
  const response = await fetch(`/runs/${state.run.run_id}/advance`, {
    method: "POST",
  });
  state.run = await response.json();
  renderRun();
}

async function bootstrap() {
  const response = await fetch("/cases");
  state.cases = await response.json();
  renderCase();
  renderRun();
}

startRunButton.addEventListener("click", startRun);
advanceRunButton.addEventListener("click", advanceRun);

bootstrap();
