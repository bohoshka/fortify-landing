import http from 'node:http';
import { URL } from 'node:url';
import { createReadStream } from 'node:fs';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { saveWaitlistEntry } from './waitlistRepository.js';

const ROOT_DIR = path.resolve(process.cwd());
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.json': 'application/json; charset=utf-8',
};

function applyCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

async function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on('data', (chunk) => {
      chunks.push(chunk);
      total += chunk.length;
      if (total > 1024 * 128) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!chunks.length) {
        resolve({});
        return;
      }
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function isValidEmail(email) {
  return typeof email === 'string' && /.+@.+\..+/.test(email);
}

async function serveStatic(urlPath, res, method) {
  const normalized = path.normalize(urlPath);
  let filePath = path.resolve(ROOT_DIR, '.' + normalized);

  if (!filePath.startsWith(ROOT_DIR)) {
    throw new Error('Forbidden');
  }

  let stat;
  try {
    stat = await fs.stat(filePath);
  } catch (err) {
    const isRoot = normalized === '/' || normalized === '.' || normalized === path.sep;
    if (err && err.code === 'ENOENT' && isRoot) {
      filePath = path.join(ROOT_DIR, 'index.html');
      stat = await fs.stat(filePath);
    } else {
      throw err;
    }
  }

  if (stat.isDirectory()) {
    filePath = path.join(filePath, 'index.html');
    stat = await fs.stat(filePath);
  }

  const ext = path.extname(filePath).toLowerCase();
  const type = MIME_TYPES[ext] || 'application/octet-stream';

  await new Promise((resolve, reject) => {
    const stream = createReadStream(filePath);
    let settled = false;
    stream.on('error', (err) => {
      if (!settled) {
        settled = true;
        reject(err);
      }
    });
    stream.on('open', () => {
      res.writeHead(200, { 'Content-Type': type });
      if (method === 'HEAD') {
        stream.destroy();
        res.end();
        if (!settled) {
          settled = true;
          resolve();
        }
        return;
      }
      stream.pipe(res);
    });
    stream.on('end', () => {
      if (!settled) {
        settled = true;
        resolve();
      }
    });
  });
}

export function createServer() {
  return http.createServer(async (req, res) => {
    applyCors(res);

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === 'POST' && url.pathname === '/api/waitlist') {
      try {
        const payload = await parseJsonBody(req);
        const { email, source = 'waitlist' } = payload;

        if (!isValidEmail(email)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid email' }));
          return;
        }

        const normalizedSource = typeof source === 'string' && source.trim().length
          ? source.trim()
          : 'waitlist';

        await saveWaitlistEntry({
          email: email.trim().toLowerCase(),
          source: normalizedSource,
        });

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok' }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid request' }));
      }
      return;
    }

    if (req.method === 'GET' || req.method === 'HEAD') {
      try {
        await serveStatic(url.pathname, res, req.method);
      } catch (err) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
      }
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  });
}
