import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");

// R-70: the "Update which vendor?" and "Set stage for <vendor>" modals
// (shown from the Manage vendors / vendor-stage actions on a project card)
// had role="dialog" aria-modal="true" but no Escape handling and no focus
// trap -- only a mouse-clickable "Cancel" button.
const cases = [
  ["vendorPickModal", "vendorPickTrapRef"],
  ["stagePickModal", "stagePickTrapRef"],
];

for (const [stateName, refName] of cases) {
  test(`${stateName} traps focus and closes on Escape`, () => {
    assert.match(source, new RegExp(`const ${refName} = useFocusTrap\\(!!${stateName}\\);`));
    const start = source.indexOf(`const ${refName} = useFocusTrap(!!${stateName});`);
    const block = source.slice(start, start + 400);
    assert.match(block, new RegExp(`if \\(e\\.key === 'Escape'\\) set${stateName[0].toUpperCase()}${stateName.slice(1)}\\(null\\);`));
    assert.match(source, new RegExp(`<div ref=\\{${refName}\\} style=\\{\\{background:'#fff'`));
  });
}
