import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const mainSource = fs.readFileSync(new URL('../src/main.jsx', import.meta.url), 'utf8')
const touchCss = fs.readFileSync(new URL('../src/styles/mobile-touch-targets.css', import.meta.url), 'utf8')

test('the final mobile layer guarantees 44px controls outside Growth Engine without inflating checkboxes', () => {
  assert.match(mainSource, /import ['"]\.\/styles\/mobile-touch-targets\.css['"]/)
  assert.match(touchCss, /@media \(max-width: 700px\)/)
  assert.match(touchCss, /#root:not\(:has\(\.kbge-root\)\) button[\s\S]*min-width: 44px !important[\s\S]*min-height: 44px !important/)
  assert.match(touchCss, /#root:not\(:has\(\.kbge-root\)\) \[role="tab"\][\s\S]*flex: 0 0 auto !important[\s\S]*white-space: nowrap/)
  assert.match(touchCss, /input:not\(\[type="hidden"\]\):not\(\[type="checkbox"\]\):not\(\[type="radio"\]\)/)
  assert.match(touchCss, /#root:not\(:has\(\.kbge-root\)\) select,[\s\S]*#root:not\(:has\(\.kbge-root\)\) textarea[\s\S]*min-height: 44px !important/)
})
