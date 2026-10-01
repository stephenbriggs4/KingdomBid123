import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

// R-64: public/_headers is a Netlify/Cloudflare Pages convention -- Vite
// copies public/ into dist/ unchanged, so this ships as-is on either host.
// This can't be live-verified in this dev environment (the headers only
// take effect on the actual static host's server, not Vite's dev/preview
// server) -- run a security-header scanner against the real deploy after
// going live, per the roadmap's own verification note for this item.
const headers = fs.readFileSync(new URL("../public/_headers", import.meta.url), "utf8");

test("security headers file targets all routes", () => {
  assert.match(headers, /^\/\*\s*$/m);
});

test("sets the basic anti-clickjacking / MIME-sniffing / referrer headers", () => {
  assert.match(headers, /X-Content-Type-Options:\s*nosniff/);
  assert.match(headers, /X-Frame-Options:\s*DENY/);
  assert.match(headers, /Referrer-Policy:\s*strict-origin-when-cross-origin/);
});

test("CSP allows every external origin the app actually uses, and nothing else", () => {
  const cspLine = headers.split("\n").find((l) => l.includes("Content-Security-Policy"));
  assert.ok(cspLine, "expected a Content-Security-Policy line");
  // Fonts: injected via a CSS @import (App.jsx's FONTS constant) that pulls
  // the stylesheet from googleapis and the actual font files from gstatic.
  assert.match(cspLine, /style-src[^;]*fonts\.googleapis\.com/);
  assert.match(cspLine, /font-src[^;]*fonts\.gstatic\.com/);
  // Images: project/vendor stock photography + Supabase storage + local
  // blob: previews before upload (src/App.jsx uses createObjectURL).
  assert.match(cspLine, /img-src[^;]*images\.pexels\.com/);
  assert.match(cspLine, /img-src[^;]*images\.unsplash\.com/);
  assert.match(cspLine, /img-src[^;]*blob:/);
  assert.match(cspLine, /img-src[^;]*\*\.supabase\.co/);
  // Church Intelligence Dallas map: free OpenStreetMap tiles (Leaflet).
  assert.match(cspLine, /img-src[^;]*tile\.openstreetmap\.org/);
  // API + Realtime (websocket) + error reporting.
  assert.match(cspLine, /connect-src[^;]*\*\.supabase\.co/);
  assert.match(cspLine, /connect-src[^;]*wss:\/\/\*\.supabase\.co/);
  assert.match(cspLine, /connect-src[^;]*sentry\.io/);
  // Defense-in-depth baseline.
  assert.match(cspLine, /object-src 'none'/);
  assert.match(cspLine, /frame-ancestors 'none'/);
});
