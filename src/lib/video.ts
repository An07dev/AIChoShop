/**
 * Tiện ích phân tích và xử lý các định dạng Video (YouTube, Vimeo, MP4 direct,...)
 */

export interface VideoInfo {
  type: "youtube" | "vimeo" | "direct" | "embed" | "unknown";
  embedUrl: string | null;
  videoId?: string;
  originalUrl: string;
}

export function parseVideoUrl(url?: string | null): VideoInfo {
  if (!url || typeof url !== "string" || !url.trim()) {
    return {
      type: "unknown",
      embedUrl: null,
      originalUrl: "",
    };
  }

  const cleanUrl = url.trim();

  // 1. YouTube (watch, embed, youtu.be, shorts)
  const ytMatch = cleanUrl.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/i
  );

  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    return {
      type: "youtube",
      videoId,
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`,
      originalUrl: cleanUrl,
    };
  }

  // 2. Vimeo (vimeo.com/123456789)
  const vimeoMatch = cleanUrl.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/i);
  if (vimeoMatch && vimeoMatch[3]) {
    const videoId = vimeoMatch[3];
    return {
      type: "vimeo",
      videoId,
      embedUrl: `https://player.vimeo.com/video/${videoId}`,
      originalUrl: cleanUrl,
    };
  }

  // 3. Direct video file (.mp4, .webm, .ogg, .mov, .m4v, .mkv hoặc file từ /uploads/videos/)
  if (
    /\.(mp4|webm|ogg|mov|m4v|mkv)(\?.*)?$/i.test(cleanUrl) ||
    cleanUrl.startsWith("/uploads/videos/") ||
    cleanUrl.startsWith("/api/media/") ||
    cleanUrl.startsWith("blob:") ||
    cleanUrl.startsWith("data:video/")
  ) {
    return {
      type: "direct",
      embedUrl: cleanUrl,
      originalUrl: cleanUrl,
    };
  }


  // 4. Nếu đã là link embed thông thường
  if (cleanUrl.startsWith("http://") || cleanUrl.startsWith("https://")) {
    return {
      type: "embed",
      embedUrl: cleanUrl,
      originalUrl: cleanUrl,
    };
  }

  return {
    type: "unknown",
    embedUrl: null,
    originalUrl: cleanUrl,
  };
}
