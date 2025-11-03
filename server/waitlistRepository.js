import { promises as fs } from 'node:fs';
import path from 'node:path';

const dataDir = path.resolve(process.cwd(), 'data');
const dataFile = path.join(dataDir, 'waitlist.json');
const lockFile = path.join(dataDir, 'waitlist.lock');

async function ensureDataFile() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(dataFile);
  } catch (err) {
    if (err && err.code === 'ENOENT') {
      await fs.writeFile(dataFile, '[]', 'utf8');
    } else {
      throw err;
    }
  }
}

async function acquireLock() {
  const maxRetries = 50;
  const retryDelay = 100;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      await fs.writeFile(lockFile, String(process.pid), { flag: 'wx' });
      return;
    } catch (err) {
      if (err && err.code === 'EEXIST') {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      } else {
        throw err;
      }
    }
  }
  throw new Error('Failed to acquire lock');
}

async function releaseLock() {
  try {
    await fs.unlink(lockFile);
  } catch (err) {
    // Ignore errors when releasing lock
  }
}

export async function saveWaitlistEntry(entry) {
  await ensureDataFile();
  await acquireLock();
  
  try {
    const raw = await fs.readFile(dataFile, 'utf8');
    const items = JSON.parse(raw);
    const record = {
      ...entry,
      submitted_at: new Date().toISOString(),
    };
    items.push(record);
    await fs.writeFile(dataFile, JSON.stringify(items, null, 2));
    return record;
  } finally {
    await releaseLock();
  }
}
