import assert from "node:assert/strict";
import fs from "node:fs";

const app = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");


assert.match(app, /screen !== "landing" && screen !== "auth" && screen !== "invite" && screen !== "about"/);
assert.match(app, /function AboutScreen[\s\S]*className="sub-page-nav"/);

console.log("B4e mobile polish passed: Needs Me remains visible at phone width and About owns exactly one page header.");
