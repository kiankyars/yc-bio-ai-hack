# BioRL Demo

- A custom `BioSMILESEnv` environment
- Wrapped with an `OpenEnv`-style `reset / step / state` interface
- Used to post-train `Qwen3-4B` with a GRPO-style loop
- Evaluated on SMILES validity, oracle score, hit rate, and uniqueness

## Files

- `index.html`: the demo page
- `styles.css`: styling
- `script.js`: SVG chart rendering
- `table.md`: markdown tables for metrics, curves, and sample molecules
- `demo-prompt.md`: live prompt for using a general-purpose model in the demo


## Reward function

For this demo, `BioSMILESEnv` should treat each model action as one proposed SMILES string and return a scalar reward from a compact oracle-centered composite:

```text
total_reward = valid * (
  0.60 * affinity +
  0.15 * qed +
  0.15 * sa +
  0.10 * novelty
) - 0.10 * ring_overflow - 0.10 * duplicate
```

Where:

- `valid`: hard gate, `1` if the SMILES parses and passes basic sanitization, else `0`
- `affinity`: normalized DDR1 oracle score, the main optimization target
- `qed`: drug-likeness score
- `sa`: synthesizability score
- `novelty`: distance from prior sampled molecules or known actives
- `ring_overflow`: penalty term when ring count exceeds the current constraint
- `duplicate`: penalty for exact or near-duplicate generations

This reward matches the demo board: validity is mandatory, affinity drives most of the gain, and the remaining terms keep generations drug-like, synthesizable, and non-repetitive. In an OpenEnv wrapper, `step()` would return both the scalar reward and a component breakdown for display in the UI.

## Page structure

- Top panel: high-level run metadata
- System panel: observation frame, environment loop, reward decomposition
- OpenEnv panel: compact Python workflow block
- Results panel:
  - Base vs post-trained benchmark chart
  - Reward frontier curve
  - Policy loss curve
  - Format loss curve
  - Sample SMILES outputs

## Local run

```bash
cd /Users/kian/Developer/yc-bio-ai-hack/new_plan
python3 -m http.server 4173
```

Open `http://127.0.0.1:4173`.

## Notes

- The frontend is static HTML/CSS/JS for portability during a live demo.
- The OpenEnv workflow block is representative pseudocode.
- If needed, the next upgrade is making the charts animate from a fake checkpoint JSON feed so the page feels more live.
