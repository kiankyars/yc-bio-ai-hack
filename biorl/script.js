function parseTrainingLog(text) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^\d+\s+/.test(line))
    .map((line) => {
      const parts = line.split(/\s+/);
      return {
        step: Number(parts[0]),
        loss: Number(parts[1]),
      };
    })
    .filter((point) => Number.isFinite(point.step) && Number.isFinite(point.loss));
}
