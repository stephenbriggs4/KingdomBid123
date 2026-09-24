import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const source = readFileSync(new URL("../src/MessagesTab.jsx", import.meta.url), "utf8");

test("Messages tab collapses to a single pane with a back control on phones", () => {
  assert.match(source, /.mt-panes.thread-open/);
  assert.match(source, /.mt-back/);
  assert.match(source, /@media\(max-width:820px\)/);
});

test("Messages tab keeps the composer, attach and send controls", () => {
  assert.match(source, /className="mt-attach"/);
  assert.match(source, /className="mt-send"/);
  assert.match(source, /aria-label="Message"/);
});
