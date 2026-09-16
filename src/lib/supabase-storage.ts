import { createClient } from "@supabase/supabase-js";

const DEFAULT_BUCKET = "course-videos";
const DEFAULT_MAX_MIB = 500;
const MAX_DATABASE_BYTES = 2_000_000_000;

export function storageConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceRoleKey) throw new Error("Supabase Storage chưa được cấu hình trên server.");
  const bucket = process.env.SUPABASE_STORAGE_BUCKET?.trim() || DEFAULT_BUCKET;
  const configuredMib = Number(process.env.VIDEO_MAX_UPLOAD_MIB || DEFAULT_MAX_MIB);
  const maxBytes = Math.min(
    Number.isFinite(configuredMib) && configuredMib > 0 ? Math.floor(configuredMib * 1024 * 1024) : DEFAULT_MAX_MIB * 1024 * 1024,
    MAX_DATABASE_BYTES,
  );
  return {
    url,
    serviceRoleKey,
    bucket,
    maxBytes,
  };
}

export function storageAdmin() {
  const config = storageConfig();
  return {
    config,
    client: createClient(config.url, config.serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    }),
  };
}

export function storageVideoInput(input: unknown) {
  if (!input || typeof input !== "object") throw new Error("Thông tin video không hợp lệ.");
  const value = input as Record<string, unknown>;
  const originalName = typeof value.name === "string" ? value.name.trim() : "";
  const mimeType = typeof value.type === "string" ? value.type.toLowerCase().trim() : "";
  const sizeBytes = Number(value.size);
  const extension = originalName.toLowerCase().match(/\.(mp4|webm)$/)?.[0];
  const allowedMime = extension === ".mp4"
    ? ["video/mp4", "application/octet-stream"]
    : ["video/webm", "application/octet-stream"];
  if (!originalName || originalName.length > 240 || !extension || !allowedMime.includes(mimeType)) {
    throw new Error("Chỉ hỗ trợ video MP4 hoặc WebM hợp lệ.");
  }
  if (!Number.isSafeInteger(sizeBytes) || sizeBytes < 12) throw new Error("Dung lượng video không hợp lệ.");
  const { maxBytes } = storageConfig();
  if (sizeBytes > maxBytes) throw new Error(`Video vượt giới hạn ${Math.floor(maxBytes / 1024 / 1024)} MiB.`);
  return { originalName, mimeType: extension === ".webm" ? "video/webm" : "video/mp4", sizeBytes, extension };
}
