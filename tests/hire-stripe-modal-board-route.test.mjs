import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const app = readFileSync(join(here, "..", "src", "App.jsx"), "utf8");

// Every route that renders the compact bid review must also render the Hire payment modal,
// otherwise Hire sets state and nothing appears (found on the My Projects board route).
test("every route that renders the bid review also renders the Hire payment modal", () => {
  const lines = app.split(/\r?\n/);
  const reviewLines = lines
    .map((line, i) => ({ line, i }))
    .filter(({ line }) => /\{bidReviewModalNode\}/.test(line));
  assert.ok(reviewLines.length >= 3, "expected bid review to render on several routes");
  for (const { i } of reviewLines) {
    const window = lines.slice(i, i + 2).join("\n");
    assert.match(window, /\{stripeModalNode\}/, `route near line ${i + 1} renders bid review without the Hire modal`);
  }
});
