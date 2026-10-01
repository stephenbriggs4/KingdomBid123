import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const baselinePath = path.join(repositoryRoot, 'quality', 'eslint-baseline.json');
const writeBaseline = process.argv.includes('--write-baseline');
const eslint = new ESLint({ cwd: repositoryRoot });
const results = await eslint.lintFiles(['src', 'scripts', 'tests', 'vite.config.js', 'eslint.config.js']);

function summarize(entries) {
  const files = {};
  let errors = 0;
  let warnings = 0;
  for (const result of entries) {
    const relativePath = path.relative(repositoryRoot, result.filePath).replaceAll('\\', '/');
    const rules = {};
    for (const message of result.messages) {
      const severity = message.severity === 2 ? 'errors' : 'warnings';
      const ruleId = message.ruleId || 'parser';
      rules[ruleId] ||= { errors: 0, warnings: 0 };
      rules[ruleId][severity] += 1;
      if (severity === 'errors') errors += 1;
      else warnings += 1;
    }
    if (result.messages.length) {
      files[relativePath] = {
        errors: result.errorCount,
        warnings: result.warningCount,
        rules: Object.fromEntries(Object.entries(rules).sort(([a], [b]) => a.localeCompare(b))),
      };
    }
  }
  return {
    generatedBy: 'scripts/check-lint-baseline.mjs',
    scope: ['src', 'scripts', 'tests', 'vite.config.js', 'eslint.config.js'],
    errors,
    warnings,
    files: Object.fromEntries(Object.entries(files).sort(([a], [b]) => a.localeCompare(b))),
  };
}

const current = summarize(results);
if (writeBaseline) {
  fs.mkdirSync(path.dirname(baselinePath), { recursive: true });
  fs.writeFileSync(baselinePath, `${JSON.stringify(current, null, 2)}\n`, 'utf8');
  console.log(`Wrote ESLint baseline: ${current.errors} errors, ${current.warnings} warnings.`);
  process.exit(0);
}

if (!fs.existsSync(baselinePath)) {
  console.error('ESLint baseline is missing. Run this script with --write-baseline after reviewing the current debt.');
  process.exit(1);
}

const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
const regressions = [];
for (const [file, details] of Object.entries(current.files)) {
  const priorFile = baseline.files?.[file];
  for (const [rule, counts] of Object.entries(details.rules)) {
    const prior = priorFile?.rules?.[rule] || { errors: 0, warnings: 0 };
    if (counts.errors > prior.errors) regressions.push(`${file}: ${rule} errors ${prior.errors} -> ${counts.errors}`);
    if (counts.warnings > prior.warnings) regressions.push(`${file}: ${rule} warnings ${prior.warnings} -> ${counts.warnings}`);
  }
}

if (current.errors > baseline.errors) regressions.push(`total errors ${baseline.errors} -> ${current.errors}`);
if (current.warnings > baseline.warnings) regressions.push(`total warnings ${baseline.warnings} -> ${current.warnings}`);

if (regressions.length) {
  console.error('ESLint debt increased:');
  for (const regression of regressions.slice(0, 40)) console.error(`- ${regression}`);
  if (regressions.length > 40) console.error(`- …and ${regressions.length - 40} more`);
  process.exit(1);
}

const errorReduction = baseline.errors - current.errors;
const warningReduction = baseline.warnings - current.warnings;
console.log(`ESLint non-regression passed: ${current.errors} errors, ${current.warnings} warnings (${errorReduction} errors and ${warningReduction} warnings removed from baseline).`);
