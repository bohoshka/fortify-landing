import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from '../server/app.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, '..', 'data');
const dataFile = path.join(dataDir, 'waitlist.json');

let server;
let baseUrl;

beforeEach(async () => {
  await fs.rm(dataFile, { force: true });
  server = createServer();
  await new Promise((resolve) => {
    server.listen(0, () => {
      const { port } = server.address();
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

afterEach(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
});

test('stores submissions with metadata', async () => {
  const response = await fetch(`${baseUrl}/api/waitlist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'alice@example.com', source: 'join_waitlist' }),
  });

  assert.equal(response.status, 201);
  const payload = await response.json();
  assert.deepEqual(payload, { status: 'ok' });

  const raw = await fs.readFile(dataFile, 'utf8');
  const saved = JSON.parse(raw);

  assert.equal(saved.length, 1);
  assert.equal(saved[0].email, 'alice@example.com');
  assert.equal(saved[0].source, 'join_waitlist');
  assert.ok(saved[0].submitted_at);
});

test('rejects invalid email submissions', async () => {
  const response = await fetch(`${baseUrl}/api/waitlist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'invalid', source: 'join_waitlist' }),
  });

  assert.equal(response.status, 400);
  const payload = await response.json();
  assert.deepEqual(payload, { error: 'Invalid email' });

  const exists = await fs.access(dataFile).then(() => true).catch(() => false);
  if (exists) {
    const raw = await fs.readFile(dataFile, 'utf8');
    const saved = JSON.parse(raw);
    assert.equal(saved.length, 0);
  }
});
