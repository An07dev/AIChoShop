import { randomUUID } from "node:crypto";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { auditOutcome } from "@/lib/auth/audit-operations";
import { adminRouteGuard, requireAdmin } from "@/lib/auth/session";
import { audit } from "@/lib/auth/audit";
import { prisma } from "@/lib/prisma";
import { storageAdmin, storageVideoInput } from "@/lib/supabase-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type UploadRequest =
  | { action: "prepare"; file: { name: string; type: string; size: number } }
  | { action: "finalize"; mediaAssetId: string };

async function hasValidVideoSignature(signedUrl: string, mimeType: string) {
  const response = await fetch(signedUrl, { headers: { Range: "bytes=0-15" }, cache: "no-store" });
  if (!response.ok || !response.body) return false;
  const reader = response.body.getReader();
  const { value } = await reader.read();
  await reader.cancel();
  const signature = Buffer.from(value || []).subarray(0, 16);
  return mimeType === "video/webm"
    ? signature.subarray(0, 4).toString("hex") === "1a45dfa3"
    : signature.toString("ascii", 4, 8) === "ftyp";
}

export async function POST(req: NextRequest) {
  const denial = await adminRouteGuard(req);
  if (denial) return denial;
  const admin = await requireAdmin("POST /api/upload/video");
  return auditOutcome(admin.id, "POST /api/upload/video", async () => {
    try {
      const body = await req.json() as UploadRequest;
      if (body.action === "prepare") {
        const input = storageVideoInput(body.file);
        const { client, config } = storageAdmin();
        const filename = `${randomUUID()}${input.extension}`;
        const objectPath = `uploads/${admin.id}/${new Date().toISOString().slice(0, 10)}/${filename}`;
        const { data, error } = await client.storage.from(config.bucket).createSignedUploadUrl(objectPath);
        if (error || !data?.token) throw new Error(error?.message || "Không thể cấp quyền upload video.");
        const asset = await prisma.$transaction(async tx => {
          const created = await tx.mediaAsset.create({
            data: {
              filename,
              originalName: path.basename(input.originalName),
              mimeType: input.mimeType,
              sizeBytes: input.sizeBytes,
              uploadedBy: admin.id,
              storageProvider: "SUPABASE",
              storageBucket: config.bucket,
              storagePath: objectPath,
            },
          });
          await audit(tx, admin.id, "VIDEO_UPLOAD_PREPARED", created.id, { bytes: input.sizeBytes });
          return created;
        });
        return NextResponse.json({
          success: true,
          mediaAssetId: asset.id,
          filename,
          bucket: config.bucket,
          objectPath,
          token: data.token,
          tusEndpoint: config.tusEndpoint,
        });
      }

      if (body.action === "finalize") {
        const asset = await prisma.mediaAsset.findFirst({
          where: { id: body.mediaAssetId, uploadedBy: admin.id, storageProvider: "SUPABASE" },
        });
        if (!asset?.storageBucket || !asset.storagePath) throw new Error("Phiên upload không tồn tại.");
        const { client } = storageAdmin();
        const { data, error } = await client.storage.from(asset.storageBucket).info(asset.storagePath);
        if (error || !data) throw new Error("Video chưa được upload hoàn tất.");
        const actualSize = Number(data.metadata?.size ?? asset.sizeBytes);
        if (Number.isFinite(actualSize) && actualSize !== asset.sizeBytes) {
          await client.storage.from(asset.storageBucket).remove([asset.storagePath]);
          throw new Error("Dung lượng video tải lên không khớp.");
        }
        const signed = await client.storage.from(asset.storageBucket).createSignedUrl(asset.storagePath, 60);
        if (signed.error || !signed.data?.signedUrl || !await hasValidVideoSignature(signed.data.signedUrl, asset.mimeType)) {
          await client.storage.from(asset.storageBucket).remove([asset.storagePath]);
          await prisma.mediaAsset.delete({ where: { id: asset.id } });
          throw new Error("Nội dung file không đúng định dạng MP4/WebM.");
        }
        await prisma.$transaction(async tx => {
          await tx.mediaAsset.update({ where: { id: asset.id }, data: { updatedAt: new Date() } });
          await audit(tx, admin.id, "VIDEO_UPLOADED", asset.id, { bytes: asset.sizeBytes, storedRemotely: true });
        });
        return NextResponse.json({
          success: true,
          url: `/api/media/${asset.filename}`,
          filename: asset.filename,
          mediaAssetId: asset.id,
          size: asset.sizeBytes,
        });
      }

      return NextResponse.json({ success: false, error: "Thao tác upload không hợp lệ." }, { status: 400 });
    } catch (error) {
      return NextResponse.json(
        { success: false, error: error instanceof Error ? error.message : "Không thể tải video lên Supabase Storage." },
        { status: 400 },
      );
    }
  });
}
