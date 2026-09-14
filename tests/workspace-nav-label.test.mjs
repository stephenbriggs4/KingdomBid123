import assert from "node:assert/strict";
import fs from "node:fs";

const app = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../src/styles/legacy-route-patches.css", import.meta.url), "utf8");

assert.match(app, /className="kb-topnav-trigger-label">Workspace<\/span>/);
assert.match(css, /\.kb-topnav-workspace-trigger\{[\s\S]{0,180}width:148px!important;min-width:148px!important/);
assert.match(css, /grid-template-columns:26px max-content 12px!important/);
assert.match(css, /\.kb-topnav-trigger-label\{[^}]*overflow:visible!important;[^}]*text-overflow:clip!important;[^}]*white-space:nowrap!important/);
assert.match(css, /@media\(max-width:1180px\)[\s\S]{0,500}\.topnav-utility-btn\{display:none!important;/);

const triggerWidth = 148;
const fixedChrome = 26 + 12 + (7 * 2) + (9 * 2);
const workspaceTextAllowance = triggerWidth - fixedChrome;
assert.ok(workspaceTextAllowance >= 72, `Workspace label allowance is only ${workspaceTextAllowance}px`);

console.log(`B4c workspace label passed: ${workspaceTextAllowance}px is reserved for the full desktop label, with mobile using the drawer.`);
