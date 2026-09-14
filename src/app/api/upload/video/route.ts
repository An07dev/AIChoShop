import { adminRouteGuard } from "@/lib/auth/session";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { randomUUID } from "node:crypto";
import { privateMediaRoot } from "@/lib/media";
import { RequestBodyError } from "@/lib/http/body";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const denial = await adminRouteGuard(req);
  if (denial) return denial;
  try {
    const limit = 100 * 1024 * 1024;
    if (Number(req.headers.get("content-length")) > limit) throw new RequestBodyError("Video tối đa 100 MB.", 413);
    if (!req.body) throw new RequestBodyError("Thiếu video.");
    let received = 0;
    const bounded = req.body.pipeThrough(new TransformStream<Uint8Array, Uint8Array>({ transform(chunk, controller) {
      received += chunk.byteLength;
      if (received > limit) throw new RequestBodyError("Video tối đa 100 MB.", 413);
      controller.enqueue(chunk);
    } }));
    const formData = await new Response(bounded, { headers: { "Content-Type": req.headers.get("content-type") || "" } }).formData();
    const file = formData.get("video") as File | null;

    if (!(file instanceof File) || file.size < 12) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy file video để tải lên" },
        { status: 400 }
      );
    }

    // Kiểm tra định dạng video hợp lệ
    const allowedExtensions = [".mp4", ".webm"];
    const ext = path.extname(file.name).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      return NextResponse.json(
        {
          success: false,
          error: `Định dạng ${ext} không được hỗ trợ. Vui lòng tải file: ${allowedExtensions.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Đảm bảo thư mục public/uploads/videos tồn tại
    const signature = Buffer.from(await file.slice(0, 16).arrayBuffer());
    if (!((ext === ".mp4" && signature.toString("ascii", 4, 8) === "ftyp") || (ext === ".webm" && signature.subarray(0, 4).toString("hex") === "1a45dfa3"))) {
      throw new RequestBodyError("Nội dung video không đúng định dạng MP4/WebM.");
    }
    const uploadDir = privateMediaRoot();
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Tạo tên file duy nhất và an toàn
    const filename = `${randomUUID()}${ext}`;
    const filePath = path.join(uploadDir, filename);

    // Ghi buffer vào ổ đĩa
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await fs.promises.writeFile(filePath, buffer, { flag: "wx" });

    // Đường dẫn tĩnh truy cập trực tiếp qua Next.js public
    const publicUrl = `/api/media/${filename}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename,
      size: file.size,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof RequestBodyError ? error.message : "Lỗi máy chủ khi tải file video" },
      { status: error instanceof RequestBodyError ? error.status : 500 }
    );
  }
}
