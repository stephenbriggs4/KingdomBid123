import assert from "node:assert/strict";
import fs from "node:fs";

const app = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const contract = fs.readFileSync(new URL("../docs/admin-navigation-contract.md", import.meta.url), "utf8");

assert.equal((app.match(/label:"Admin Review"/g) || []).length, 2, "both role navs must identify the review surface");
assert.match(app, /section:'Admin operations'/);
assert.match(app, /label:'Concierge Pilot Operations'[\s\S]{0,160}right:'Pilot ops'/);
assert.match(app, /label:'Growth Engine'[\s\S]{0,160}right:'Research'/);
assert.match(app, /label:'QA Console'[\s\S]{0,160}right:'Release'/);
assert.match(app, /<div className="mobile-nav-section-label">Admin operations<\/div>/);
assert.match(app, />Concierge Pilot Operations<\/button>/);

const accountStart = app.indexOf('{label:"My Profile"');
const accountEnd = app.indexOf('].map((item)=>(', accountStart);
assert.ok(accountStart > -1 && accountEnd > accountStart, "account menu block must remain identifiable");
const accountMenu = app.slice(accountStart, accountEnd);
assert.doesNotMatch(accountMenu, /Growth Engine|Concierge/, "operational tools must not be duplicated in the account menu");

assert.match(contract, /Admin Review/);
assert.match(contract, /Admin operations/);
assert.match(contract, /founder-owned/);

console.log("B4d navigation contract passed: review and operations are differentiated, and Concierge has one clear admin-operations entry per viewport.");
