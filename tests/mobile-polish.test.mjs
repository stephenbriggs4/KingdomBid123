import assert from "node:assert/strict";
import fs from "node:fs";

const app = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const messages = fs.readFileSync(new URL("../src/MessagesScreen.jsx", import.meta.url), "utf8");

assert.match(messages, /aria-label={`Show Deal Rooms needing my action \(\$\{needsMeCount\}\)`}/);
assert.match(messages, /<span>Needs Me<\/span>/);
assert.doesNotMatch(messages, /\.kbdr2-hub-needs-me>span:nth-child\(2\)\{display:none\}/);
assert.match(messages, /@media\(max-width:430px\)\{[\s\S]{0,180}\.kbdr2-hub-controls\{grid-template-columns:minmax\(0,1fr\)\}/);
assert.match(messages, /\.kbdr2-hub-needs-me\{[^}]*justify-self:start/);

assert.match(app, /screen !== "landing" && screen !== "auth" && screen !== "invite" && screen !== "about"/);
assert.match(app, /function AboutScreen[\s\S]*className="sub-page-nav"/);

console.log("B4e mobile polish passed: Needs Me remains visible at phone width and About owns exactly one page header.");
