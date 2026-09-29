import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");

test("NotificationBell closes on Escape and returns focus to the bell button (keyboard users had no way to dismiss it before)", () => {
  const start = source.indexOf("function NotificationBell(");
  const end = source.indexOf("const markAllRead=async()=>{", start);
  const component = source.slice(start, end);
  assert.match(component, /document\.addEventListener\("mousedown",h\)/, "outside-click handler should still be present");
  assert.match(component, /e\.key===?"Escape"/, "expected an Escape-key handler");
  assert.match(component, /setOpen\(false\)/);
  assert.match(component, /bellRef\.current\?\.querySelector\("button"\)\?\.focus\(\)/, "focus should return to the bell trigger, not get lost");
});
