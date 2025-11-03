import { promises as fs } from 'node:fs';
import path from 'node:path';

const dataDir = path.resolve(process.cwd(), 'data');
const dataFile = path.join(dataDir, 'waitlist.json');

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

export async function saveWaitlistEntry(entry) {
  await ensureDataFile();
  const raw = await fs.readFile(dataFile, 'utf8');
  const items = JSON.parse(raw);
  const record = {
    ...entry,
    submitted_at: new Date().toISOString(),
  };
  items.push(record);
  await fs.writeFile(dataFile, JSON.stringify(items, null, 2));
  return record;
}
