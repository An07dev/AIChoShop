export const CONTENT_STATUSES = ["DRAFT", "PUBLISHED", "HIDDEN"] as const;
export type LearningContentStatus = (typeof CONTENT_STATUSES)[number];

export type LessonInput = {
  courseId?: string;
  title: string;
  moduleName?: string;
  content?: string;
  videoUrl?: string;
  mediaAssetId?: string | null;
  order?: number;
  isVIP?: boolean;
  status?: LearningContentStatus;
  durationSeconds?: number | null;
};

export function normalizeCourseInput(input: { title: string; description?: string; thumbnail?: string; status?: LearningContentStatus }) {
  const title = input.title?.trim();
  const description = input.description?.trim() || null;
  const thumbnail = input.thumbnail?.trim() || null;
  const status = CONTENT_STATUSES.includes(input.status as LearningContentStatus) ? input.status! : "DRAFT";
  if (!title || title.length > 160) throw new Error("Tên khóa học phải có từ 1 đến 160 ký tự.");
  if (description && description.length > 2_000) throw new Error("Mô tả khóa học tối đa 2.000 ký tự.");
  if (thumbnail && !isSafeMediaUrl(thumbnail, true)) throw new Error("Ảnh bìa phải dùng HTTPS hoặc đường dẫn nội bộ hợp lệ.");
  return { title, description, thumbnail, status };
}

export function normalizeLessonInput(input: LessonInput) {
  const title = input.title?.trim();
  const moduleName = input.moduleName?.trim() || "Phần 1";
  const content = input.content?.trim() || null;
  const videoUrl = input.videoUrl?.trim() || null;
  const courseId = input.courseId?.trim() || undefined;
  const mediaAssetId = input.mediaAssetId?.trim() || null;
  const order = Number(input.order);
  const durationSeconds = input.durationSeconds == null || input.durationSeconds === 0 ? null : Number(input.durationSeconds);
  const status = CONTENT_STATUSES.includes(input.status as LearningContentStatus) ? input.status! : "DRAFT";

  if (!title || title.length > 200) throw new Error("Tên bài học phải có từ 1 đến 200 ký tự.");
  if (!moduleName || moduleName.length > 100) throw new Error("Tên học phần phải có từ 1 đến 100 ký tự.");
  if (content && content.length > 50_000) throw new Error("Nội dung bài học tối đa 50.000 ký tự.");
  if (!Number.isSafeInteger(order) || order < 1 || order > 10_000) throw new Error("Thứ tự bài học phải là số nguyên từ 1 đến 10.000.");
  if (durationSeconds !== null && (!Number.isSafeInteger(durationSeconds) || durationSeconds < 1 || durationSeconds > 86_400)) {
    throw new Error("Thời lượng video phải từ 1 giây đến 24 giờ.");
  }
  if (videoUrl && !isSafeMediaUrl(videoUrl)) throw new Error("Video chỉ hỗ trợ HTTPS YouTube/Vimeo, tệp MP4/WebM hoặc media nội bộ.");
  if (videoUrl?.startsWith("/api/media/") && !mediaAssetId) throw new Error("Video tải lên thiếu mã tài sản media.");
  if (mediaAssetId && !videoUrl?.startsWith("/api/media/")) throw new Error("Mã tài sản chỉ được dùng với video tải lên nội bộ.");

  return { courseId, title, moduleName, content, videoUrl, mediaAssetId, order, isVIP: Boolean(input.isVIP), status, durationSeconds };
}

export function canAccessLesson(input: {
  courseStatus: LearningContentStatus;
  lessonStatus: LearningContentStatus;
  lessonIsVIP: boolean;
  isAdmin?: boolean;
  isVipActive?: boolean;
}) {
  if (input.isAdmin) return true;
  return input.courseStatus === "PUBLISHED" && input.lessonStatus === "PUBLISHED" && (!input.lessonIsVIP || Boolean(input.isVipActive));
}

export function normalizePlaybackProgress(positionSeconds: number, durationSeconds?: number | null) {
  const duration = Number.isFinite(durationSeconds) && Number(durationSeconds) > 0
    ? Math.min(86_400, Math.floor(Number(durationSeconds)))
    : null;
  const position = Number.isFinite(positionSeconds) ? Math.max(0, Math.floor(positionSeconds)) : 0;
  return { positionSeconds: duration === null ? Math.min(position, 86_400) : Math.min(position, duration), durationSeconds: duration };
}

function isSafeMediaUrl(value: string, image = false) {
  if (value.startsWith("/api/media/")) return /^\/api\/media\/[a-zA-Z0-9_.-]+$/.test(value);
  if (value.startsWith("/")) return image && /^\/[a-zA-Z0-9_./-]+$/.test(value) && !value.includes("..");
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    if (image) return true;
    const host = url.hostname.toLowerCase();
    return host === "youtu.be" || host.endsWith(".youtube.com") || host === "youtube.com" || host.endsWith(".vimeo.com") || host === "vimeo.com" || /\.(mp4|webm)(?:$|\?)/i.test(url.pathname + url.search);
  } catch {
    return false;
  }
}

