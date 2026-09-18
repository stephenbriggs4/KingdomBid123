import { execFileSync } from 'node:child_process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Identifies the exact commit a bundle was built from, so Sentry releases and
// window.__KB_BUILD_INFO stay accurate even when the hand-numbered build label
// in App.jsx lags. Hosted builds expose the commit through their own env vars;
// local builds read git and append -dirty when tracked files have changes.
function resolveBuildCommit() {
  const hosted = process.env.VERCEL_GIT_COMMIT_SHA
    || process.env.GITHUB_SHA
    || process.env.CF_PAGES_COMMIT_SHA
    || process.env.COMMIT_REF
  if (hosted) return String(hosted).slice(0, 9)
  try {
    const git = (args) => execFileSync('git', args, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
    const sha = git(['rev-parse', '--short=9', 'HEAD'])
    const dirty = git(['status', '--porcelain', '--untracked-files=no']) ? '-dirty' : ''
    return `${sha}${dirty}`
  } catch {
    return 'unknown'
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __KB_BUILD_COMMIT__: JSON.stringify(resolveBuildCommit()),
  },
  server: {
    force: true
  }
})
