from pathlib import Path
import re

import matplotlib.pyplot as plt


ROOT = Path(__file__).resolve().parent
TABLE_PATH = ROOT / "table.md"
OUTPUT_DIR = ROOT / "assets"
OUTPUT_DIR.mkdir(exist_ok=True)
OUTPUT_PATH = OUTPUT_DIR / "training_loss_raw.png"


def parse_points(text: str) -> list[tuple[int, float]]:
    points = []
    for line in text.splitlines():
        match = re.match(r"^\s*(\d+)\s+([0-9]*\.[0-9]+)\s*$", line)
        if match:
            points.append((int(match.group(1)), float(match.group(2))))
    return points


def main() -> None:
    text = TABLE_PATH.read_text()
    points = parse_points(text)
    if not points:
        raise SystemExit("No training points found in table.md")

    steps = [step for step, _ in points]
    losses = [loss for _, loss in points]

    plt.style.use("default")
    fig, ax = plt.subplots(figsize=(8, 4.5), dpi=180)
    ax.plot(steps, losses, color="#1f77b4", marker="o", linewidth=1.8, markersize=3.5)
    ax.set_title("Training Loss from table.md")
    ax.set_xlabel("Step")
    ax.set_ylabel("Loss")
    ax.grid(True, alpha=0.25)
    fig.tight_layout()
    fig.savefig(OUTPUT_PATH, bbox_inches="tight")


if __name__ == "__main__":
    main()
