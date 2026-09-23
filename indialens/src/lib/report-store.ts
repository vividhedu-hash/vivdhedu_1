import fs from "fs";
import path from "path";
import os from "os";

export interface SavedReport {
  token: string;
  created_at: string;
  expires_at: string;
  student_input: any;
  results: any;
  _source: 'database' | 'mock';
}

// [AI-CoLab: Cursor] Reports previously lived only in a per-process Map, so
// every share link 404'd after a server restart (Supabase, the durable store,
// is unreachable). The store now writes through to disk and lazily rehydrates.
// On serverless hosts the disk layer degrades gracefully to memory-only.

const DISK_DIR = path.join(os.tmpdir(), "indialens-reports");

function diskPath(token: string): string | null {
  // Tokens are base64url / alphanumeric; refuse anything path-like.
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(token)) return null;
  return path.join(DISK_DIR, `${token}.json`);
}

function readFromDisk(token: string): SavedReport | null {
  try {
    const file = diskPath(token);
    if (!file || !fs.existsSync(file)) return null;
    const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as SavedReport;
    if (parsed.expires_at && new Date(parsed.expires_at).getTime() < Date.now()) {
      fs.unlinkSync(file);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeToDisk(report: SavedReport): void {
  try {
    const file = diskPath(report.token);
    if (!file) return;
    fs.mkdirSync(DISK_DIR, { recursive: true });
    fs.writeFileSync(file, JSON.stringify(report));
  } catch {
    // Read-only filesystem (e.g. serverless) — memory cache still works.
  }
}

class ReportStore {
  private memory: Map<string, SavedReport>;

  constructor(memory: Map<string, SavedReport>) {
    this.memory = memory;
  }

  get(token: string): SavedReport | undefined {
    const cached = this.memory.get(token);
    if (cached) return cached;
    const fromDisk = readFromDisk(token);
    if (fromDisk) {
      this.memory.set(token, fromDisk);
      return fromDisk;
    }
    return undefined;
  }

  set(token: string, report: SavedReport): void {
    this.memory.set(token, report);
    writeToDisk(report);
  }
}

// Persist the memory map across dev hot reloads / warm serverless instances.
const globalForReports = global as unknown as {
  reportsMap: Map<string, SavedReport>;
};

const memoryMap = globalForReports.reportsMap || new Map<string, SavedReport>();
globalForReports.reportsMap = memoryMap;

export const reportStore = new ReportStore(memoryMap);
