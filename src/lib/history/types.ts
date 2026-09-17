export type HistoryActivity<T> = {
  id: string; tool: string; toolName: string; action: string;
  createdAt: string; time?: string; output?: string | null;
  snapshot?: T; input?: { snapshotId?: string; snapshot?: T; [key: string]: unknown } | null;
};
export function createHistoryId(): string {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  const bytes = new Uint8Array(16); globalThis.crypto.getRandomValues(bytes);
  return [...bytes].map(value => value.toString(16).padStart(2, "0")).join("");
}
