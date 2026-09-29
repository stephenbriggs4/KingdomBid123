import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");

// R-70: these 4 project-detail modals (gallery, your-proposal,
// withdraw-confirm, file preview) all had role="dialog" aria-modal="true"
// but no real focus trap -- same gap as the bid review / confirm-action /
// save-search modals fixed earlier this pass. Build-verified (no scope
// errors calling useFocusTrap 4x in one component) but NOT individually
// live-clicked: the seed data has no project with photos, attachments, or
// a vendor-side proposal to open, and no vendor session was available in
// this pass. The mechanism itself (useFocusTrap) is the same one already
// live-verified 3 times elsewhere in this file.
const cases = [
  ["Project photos", "projectGalleryTrapRef", /const projectGalleryTrapRef = useFocusTrap\(projectGalleryOpen\);/],
  ["Your proposal", "myProposalModalTrapRef", /const myProposalModalTrapRef = useFocusTrap\(myProposalModalOpen\);/],
  ["Withdraw proposal", "myProposalWithdrawTrapRef", /const myProposalWithdrawTrapRef = useFocusTrap\(myProposalWithdrawConfirm\);/],
  ["File preview", "activeFilePreviewTrapRef", /const activeFilePreviewTrapRef = useFocusTrap\(!!activeFilePreview\);/],
];

for (const [label, refName, hookPattern] of cases) {
  test(`${label} modal declares and attaches ${refName}`, () => {
    assert.match(source, hookPattern);
    assert.match(source, new RegExp(`ref=\\{${refName}\\} className="modal" role="dialog" aria-modal="true" aria-label="${label}"`));
  });
}
