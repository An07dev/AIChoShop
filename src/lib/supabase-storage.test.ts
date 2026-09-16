import test from "node:test";
import assert from "node:assert/strict";
import { storageConfig, storageVideoInput } from "./supabase-storage.ts";

function withStorageEnv(run: () => void) {
  const previous = {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY,
    bucket: process.env.SUPABASE_STORAGE_BUCKET,
    limit: process.env.VIDEO_MAX_UPLOAD_MIB,
  };
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project-ref.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "server-only-test-key";
  process.env.SUPABASE_STORAGE_BUCKET = "course-videos";
  process.env.VIDEO_MAX_UPLOAD_MIB = "200";
  try { run(); }
  finally {
    if (previous.url === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL; else process.env.NEXT_PUBLIC_SUPABASE_URL = previous.url;
    if (previous.key === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY; else process.env.SUPABASE_SERVICE_ROLE_KEY = previous.key;
    if (previous.bucket === undefined) delete process.env.SUPABASE_STORAGE_BUCKET; else process.env.SUPABASE_STORAGE_BUCKET = previous.bucket;
    if (previous.limit === undefined) delete process.env.VIDEO_MAX_UPLOAD_MIB; else process.env.VIDEO_MAX_UPLOAD_MIB = previous.limit;
  }
}

test("storage config uses the direct Supabase TUS hostname and private bucket", () => withStorageEnv(() => {
  const config = storageConfig();
  assert.equal(config.bucket, "course-videos");
  assert.equal(config.maxBytes, 200 * 1024 * 1024);
  assert.equal(config.tusEndpoint, "https://project-ref.storage.supabase.co/storage/v1/upload/resumable");
}));

test("video input accepts MP4/WebM and enforces configured size", () => withStorageEnv(() => {
  assert.equal(storageVideoInput({ name: "lesson.mp4", type: "video/mp4", size: 1024 }).extension, ".mp4");
  assert.equal(storageVideoInput({ name: "lesson.webm", type: "video/webm", size: 1024 }).mimeType, "video/webm");
  assert.throws(() => storageVideoInput({ name: "fake.mp4", type: "image/png", size: 1024 }), /MP4 hoặc WebM/);
  assert.throws(() => storageVideoInput({ name: "huge.mp4", type: "video/mp4", size: 201 * 1024 * 1024 }), /200 MiB/);
}));
