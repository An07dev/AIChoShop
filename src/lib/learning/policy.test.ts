import test from "node:test";
import assert from "node:assert/strict";
import { canAccessLesson, normalizeCourseInput, normalizeLessonInput, normalizePlaybackProgress } from "./policy.ts";

test("published free lessons are public while VIP and draft content remain protected", () => {
  assert.equal(canAccessLesson({ courseStatus: "PUBLISHED", lessonStatus: "PUBLISHED", lessonIsVIP: false }), true);
  assert.equal(canAccessLesson({ courseStatus: "PUBLISHED", lessonStatus: "PUBLISHED", lessonIsVIP: true }), false);
  assert.equal(canAccessLesson({ courseStatus: "PUBLISHED", lessonStatus: "PUBLISHED", lessonIsVIP: true, isVipActive: true }), true);
  assert.equal(canAccessLesson({ courseStatus: "DRAFT", lessonStatus: "PUBLISHED", lessonIsVIP: false }), false);
  assert.equal(canAccessLesson({ courseStatus: "PUBLISHED", lessonStatus: "HIDDEN", lessonIsVIP: false }), false);
});

test("lesson validation rejects unsafe and incomplete media references", () => {
  const base = { title: "Bài học", order: 1 };
  assert.throws(() => normalizeLessonInput({ ...base, videoUrl: "http://example.com/video.mp4" }), /HTTPS/);
  assert.throws(() => normalizeLessonInput({ ...base, videoUrl: "/api/media/a.mp4" }), /mã tài sản/);
  assert.throws(() => normalizeLessonInput({ ...base, order: 0 }), /Thứ tự/);
  assert.equal(normalizeLessonInput({ ...base, videoUrl: "https://youtu.be/dQw4w9WgXcQ" }).status, "DRAFT");
});

test("course input and playback position are normalized", () => {
  assert.equal(normalizeCourseInput({ title: "  Khóa học  " }).title, "Khóa học");
  assert.deepEqual(normalizePlaybackProgress(125, 100), { positionSeconds: 100, durationSeconds: 100 });
  assert.deepEqual(normalizePlaybackProgress(-3, null), { positionSeconds: 0, durationSeconds: null });
});
