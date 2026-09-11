import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("video") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy file video để tải lên" },
        { status: 400 }
      );
    }

    // Kiểm tra định dạng video hợp lệ
    const allowedExtensions = [".mp4", ".webm", ".ogg", ".mov", ".m4v", ".mkv"];
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
    const uploadDir = path.join(process.cwd(), "public", "uploads", "videos");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Tạo tên file duy nhất và an toàn
    const cleanName = file.name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9.-]/g, "_")
      .toLowerCase();

    const filename = `video_${Date.now()}_${cleanName}`;
    const filePath = path.join(uploadDir, filename);

    // Ghi buffer vào ổ đĩa
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await fs.promises.writeFile(filePath, buffer);

    // Đường dẫn tĩnh truy cập trực tiếp qua Next.js public
    const publicUrl = `/uploads/videos/${filename}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename,
      size: file.size,
    });
  } catch (error: any) {
    console.error("Error uploading video:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Lỗi máy chủ khi tải file video" },
      { status: 500 }
    );
  }
}
