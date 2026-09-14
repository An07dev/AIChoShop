import { open } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { isVipActive } from "@/lib/vip-expiration";
import { byteRange, mediaName, privateMediaRoot } from "@/lib/media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request, context: { params: Promise<{ filename: string }> }) {
  const { filename } = await context.params;
  if (!mediaName(filename)) return new Response(null, { status: 404 });
  try {
    const user = await getSessionUser();
    const lessons = await prisma.lesson.findMany({ where: { videoUrl: { in: [`/api/media/${filename}`, `/uploads/videos/${filename}`] } }, select: { isVIP: true } });
    if (user?.role !== "ADMIN") {
      if (!lessons.length) return new Response(null, { status: 404 });
      // If a file is shared with a VIP lesson, apply the stricter entitlement.
      if (lessons.some(lesson => lesson.isVIP)) {
        const member = user ? await prisma.user.findUnique({ where: { id: user.id } }) : null;
        if (!isVipActive(member)) return new Response(null, { status: 403 });
      }
    }
    let file;
    try { file = await open(path.join(privateMediaRoot(), filename), "r"); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      file = await open(path.join(process.cwd(), "public", "uploads", "videos", filename), "r");
    }
    const size = (await file.stat()).size;
    const range = byteRange(req.headers.get("range"), size);
    const headers = new Headers({ "Cache-Control": "private, no-store", "Accept-Ranges": "bytes", "X-Content-Type-Options": "nosniff" });
    if (!range) { await file.close(); headers.set("Content-Range", `bytes */${size}`); return new Response(null, { status: 416, headers }); }
    headers.set("Content-Type", filename.endsWith(".webm") ? "video/webm" : filename.endsWith(".ogg") ? "video/ogg" : "video/mp4");
    headers.set("Content-Length", String(range.end - range.start + 1));
    if (range.partial) headers.set("Content-Range", `bytes ${range.start}-${range.end}/${size}`);
    if (req.method === "HEAD") { await file.close(); return new Response(null, { status: range.partial ? 206 : 200, headers }); }
    let position = range.start;
    const stream = new ReadableStream<Uint8Array>({
      async pull(controller) {
        try {
          const buffer = Buffer.alloc(Math.min(65536, range.end - position + 1));
          const { bytesRead } = await file.read(buffer, 0, buffer.length, position);
          if (!bytesRead) { await file.close(); controller.close(); return; }
          position += bytesRead;
          controller.enqueue(buffer.subarray(0, bytesRead));
          if (position > range.end) { await file.close(); controller.close(); }
        } catch (error) { await file.close().catch(() => {}); controller.error(error); }
      },
      async cancel() { await file.close(); },
    });
    return new Response(stream, { status: range.partial ? 206 : 200, headers });
  } catch (error) {
    return new Response(null, { status: (error as NodeJS.ErrnoException).code === "ENOENT" ? 404 : 503 });
  }
}
export const HEAD = GET;
