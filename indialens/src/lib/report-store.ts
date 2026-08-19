export interface SavedReport {
  token: string;
  created_at: string;
  expires_at: string;
  student_input: any;
  results: any;
  _source: 'database' | 'mock';
}

// In-memory Map persisting across serverless invocation warm instances
const globalForReports = global as unknown as {
  reportsMap: Map<string, SavedReport>;
};

export const reportStore = globalForReports.reportsMap || new Map<string, SavedReport>();
globalForReports.reportsMap = reportStore;
