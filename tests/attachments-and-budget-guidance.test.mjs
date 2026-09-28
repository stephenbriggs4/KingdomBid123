import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
const mig = read('../supabase/migrations/20260928210000_bid_and_project_attachments.sql');
const app = read('../src/App.jsx');
const att = read('../src/Attachments.jsx');
const has = (src, re, msg) => assert.ok(re.test(src), msg);

has(mig, /'bid-attachments', 'bid-attachments', false/, 'proposal attachments bucket is private');
has(mig, /'project-files', 'project-files', false/, 'project files bucket is private');
has(mig, />= 5 then/, 'a proposal is limited to 5 attachments');
has(mig, />= 10 then/, 'a project is limited to 10 attachments');
has(mig, /kb_can_view_project_files_v1[\s\S]{0,700}kb_vendor_invited_to_project_v1/, 'invited vendors can open project files');
has(att, /createSignedUrl\(path, 300\)/, 'files open via short-lived signed URLs');
has(att, /ATTACH_MAX_BYTES = 15 \* 1024 \* 1024/, 'client enforces the 15 MB limit');
has(app, /<FilePicker id="kb-bid-form-files"/, 'the proposal form accepts attachments');
has(app, /uploadBidAttachments\(\{ bidId: createdBid\.id/, 'attachments upload after the proposal is created');
has(app, /<BidAttachmentList bidId=\{b\.id\} heading="Proposal files"/, 'the church sees proposal attachments');
has(app, /<ProjectFilesList projectId=\{project\.id\}/, 'project detail lists project files');

// R-42: budget guidance is advisory and reads both structured and text budgets.
const src = app.slice(app.indexOf('function getBidBudgetGuidance'), app.indexOf('function BidForm('));
const guidance = new Function(`${src}; return getBidBudgetGuidance;`)();
assert.equal(guidance({ budget_min: 2500, budget_max: 5000 }, 3000).warning, '');
assert.match(guidance({ budget_min: 2500, budget_max: 5000 }, 9000).warning, /well above/);
assert.match(guidance({ budget_min: 2500, budget_max: 5000 }, 900).warning, /well below/);
assert.equal(guidance({ budget: '$2,500–$5,000' }, 4000).rangeLabel, '$2,500–$5,000');
assert.equal(guidance({ budget: 'Under $500' }, 300).rangeLabel, 'up to $500');
assert.equal(guidance({}, 5000).rangeLabel, '');
console.log('attachments-and-budget-guidance: ok');
