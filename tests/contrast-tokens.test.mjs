import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');

function readHexToken(name) {
  const match = source.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, 'i'));
  assert.ok(match, `Missing --${name} hex token`);
  return match[1];
}

function rgb(hex) {
  const value = hex.replace('#', '');
  return [0, 2, 4].map((offset) => Number.parseInt(value.slice(offset, offset + 2), 16));
}

function luminance(hex) {
  const channels = rgb(hex).map((channel) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return (0.2126 * channels[0]) + (0.7152 * channels[1]) + (0.0722 * channels[2]);
}

function contrast(foreground, background) {
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

const contracts = [
  {
    token: 'text-muted',
    backgrounds: ['#FFFFFF', '#F7F6F4', '#FFFDF8', '#F7F4ED', '#ECEAE6'],
  },
  {
    token: 'kb-text-eyebrow',
    backgrounds: ['#FFFDF8', '#F7F4ED', '#ECEAE6'],
  },
  {
    token: 'kb-text-nav-inactive',
    backgrounds: ['#FFFDF8', '#F7F6F4', '#EBE7DC'],
  },
];

for (const contract of contracts) {
  test(`--${contract.token} remains WCAG AA on every standard background`, () => {
    const foreground = readHexToken(contract.token);
    for (const background of contract.backgrounds) {
      const ratio = contrast(foreground, background);
      assert.ok(
        ratio >= 4.5,
        `--${contract.token} ${foreground} on ${background} is ${ratio.toFixed(2)}:1`,
      );
    }
  });
}

test('the audited inactive-navigation and Concierge surfaces use the AA tokens', () => {
  assert.match(source, /\.topnav \.nav-tab\{[^}]*color:var\(--kb-text-nav-inactive\)!important/);
  assert.match(source, /\.fb-concierge-tab\{[^}]*color:var\(--kb-text-nav-inactive\)/);
  assert.match(source, /\.fb-concierge-eyebrow\{[^}]*color:var\(--kb-text-eyebrow\)/);
});
