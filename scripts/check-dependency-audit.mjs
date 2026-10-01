import { spawnSync } from 'node:child_process'

const reviewedAdvisories = new Set([
  'https://github.com/advisories/GHSA-5p2g-fcmc-qvqq',
  'https://github.com/advisories/GHSA-w3rx-r6r6-pgpr',
])
const reviewExpiresAt = new Date('2026-12-01T00:00:00Z')

if (Date.now() >= reviewExpiresAt.getTime()) {
  throw new Error('The image-size advisory exception expired. Re-review pptxgenjs and the published image-size versions.')
}

const npmCli = process.env.npm_execpath
if (!npmCli) throw new Error('Run this check through npm so npm_execpath is available.')
const result = spawnSync(process.execPath, [npmCli, 'audit', '--json'], {
  cwd: process.cwd(),
  encoding: 'utf8',
  windowsHide: true,
})

if (result.error) throw result.error
if (!String(result.stdout || '').trim()) {
  throw new Error(`npm audit produced no JSON. ${String(result.stderr || '').trim()}`)
}

const report = JSON.parse(result.stdout)
const vulnerabilities = report.vulnerabilities || {}
const packageNames = Object.keys(vulnerabilities).sort()

if (packageNames.length === 0) {
  console.log('Dependency audit passed with no known vulnerabilities.')
  process.exit(0)
}

const expectedPackages = ['image-size', 'pptxgenjs']
if (JSON.stringify(packageNames) !== JSON.stringify(expectedPackages)) {
  throw new Error(`Dependency audit found an unreviewed package set: ${packageNames.join(', ')}`)
}

const imageSize = vulnerabilities['image-size']
const pptxgen = vulnerabilities.pptxgenjs
const advisoryUrls = (imageSize.via || [])
  .filter((entry) => entry && typeof entry === 'object')
  .map((entry) => entry.url)
  .sort()

if (
  advisoryUrls.length !== reviewedAdvisories.size
  || advisoryUrls.some((url) => !reviewedAdvisories.has(url))
  || JSON.stringify([...(imageSize.effects || [])].sort()) !== JSON.stringify(['pptxgenjs'])
  || JSON.stringify([...(pptxgen.via || [])].sort()) !== JSON.stringify(['image-size'])
) {
  throw new Error(`The reviewed image-size → pptxgenjs advisory shape changed; perform a new security review. ${JSON.stringify({ advisoryUrls, imageSizeFix: imageSize.fixAvailable, imageSizeEffects: imageSize.effects, pptxgenVia: pptxgen.via })}`)
}

if ((report.metadata?.vulnerabilities?.critical || 0) !== 0) {
  throw new Error('Dependency audit found a critical vulnerability.')
}

console.log(
  `Dependency audit passed with one time-bounded exception: two unpatched image-size DoS advisories inherited through pptxgenjs. No other advisory is allowed. npm fix suggestion: ${JSON.stringify(imageSize.fixAvailable)}.`,
)
