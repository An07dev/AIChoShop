import path from "node:path";

export function mediaName(value: string) {
  return /^[a-zA-Z0-9_-][a-zA-Z0-9_.-]{0,220}\.(mp4|webm|mov|m4v|ogg|mkv)$/.test(value) && !value.includes("..");
}
export function privateMediaRoot() {
  const root = path.resolve(process.env.MEDIA_ROOT || path.join(process.cwd(), ".data", "media"));
  const publicRoot = path.resolve(process.cwd(), "public");
  const relative = path.relative(publicRoot, root);
  if (!relative || (!relative.startsWith("..") && !path.isAbsolute(relative))) throw new Error("MEDIA_ROOT must be outside public");
  return root;
}
export function byteRange(header: string | null, size: number) {
  if (!header) return { start: 0, end: size - 1, partial: false };
  const match = /^bytes=(\d*)-(\d*)$/.exec(header);
  if (!match || (!match[1] && !match[2])) return null;
  const start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
  const end = match[1] && match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start > end || start >= size) return null;
  return { start, end, partial: true };
}
