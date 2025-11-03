import { test } from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const cssPath = path.resolve('css', 'styles.css');

const loadCss = async () => fs.readFile(cssPath, 'utf8');

const expectRule = (css, selector, properties) => {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const blockRegex = new RegExp(`\\s*${escapedSelector}\\s*\\{([^}]*)\\}`, 'm');
  const match = css.match(blockRegex);
  assert.ok(match, `Missing block for selector ${selector}`);
  const block = match[1];
  for (const prop of properties) {
    assert.match(block, new RegExp(`${prop.key}\\s*:\\s*${prop.value}`), `Missing ${prop.key}: ${prop.value} in ${selector}`);
  }
};

test('defines responsive layout adjustments for mobile widths', async () => {
  const css = await loadCss();

  const mediaRegex = /@media\s*\(max-width:\s*600px\)\s*\{([\s\S]*?)\n\}/m;
  const mediaMatch = css.match(mediaRegex);
  assert.ok(mediaMatch, 'Missing @media (max-width:600px) block');
  const mediaBody = mediaMatch[1];

  expectRule(mediaBody, '.nav', [
    { key: 'flex-direction', value: 'column' },
    { key: 'align-items', value: 'flex-start' },
    { key: 'gap', value: '12px' },
  ]);

  expectRule(mediaBody, '.hero-copy h1', [
    { key: 'font-size', value: '32px' },
    { key: 'line-height', value: '1.2' },
  ]);

  expectRule(mediaBody, '.hero', [
    { key: 'text-align', value: 'center' },
    { key: 'padding-top', value: '12px' },
  ]);

  expectRule(mediaBody, '.hero-copy p', [
    { key: 'margin', value: '0 auto' },
  ]);

  expectRule(mediaBody, '.footer', [
    { key: 'flex-direction', value: 'column' },
    { key: 'align-items', value: 'flex-start' },
    { key: 'gap', value: '12px' },
  ]);
});
