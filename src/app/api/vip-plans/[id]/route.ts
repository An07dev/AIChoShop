import { dataErrorResponse } from "@/lib/db-errors";
import { auditOutcome, auditedWrite } from "@/lib/auth/audit-operations";
import { adminRouteGuard, requireAdmin } from "@/lib/auth/session";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/vip-plans/[id] - Lấy chi tiết gói VIP theo ID hoặc Slug
export async function GET(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const plan = await prisma.vipPlan.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
    });

    if (!plan || (!plan.active && await adminRouteGuard(req))) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy gói VIP" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: plan });
  } catch (error) {
    return dataErrorResponse(error, "app/api/vip-plans/[id]/route.ts");
  }
}

// PUT /api/vip-plans/[id] - Cập nhật toàn bộ thông tin gói VIP
export async function PUT(req: Request, { params }: Params) {
  const denial = await adminRouteGuard(req);
  if (denial) return denial;
  const auditAdmin = await requireAdmin("PUT /api/vip-plans/[id]");
  return auditOutcome(auditAdmin.id, "PUT /api/vip-plans/[id]", async () => {
  try {
    const { id } = await params;
    const body = await req.json();
    const {
      name,
      slug,
      price,
      originalPrice,
      period,
      durationDays,
      desc,
      tag,
      isPopular,
      features,
      order,
      active,
    } = body;

    const existing = await prisma.vipPlan.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy gói VIP cần cập nhật" },
        { status: 404 }
      );
    }

    // Nếu slug thay đổi, kiểm tra trùng lặp
    let cleanSlug = existing.slug;
    if (slug && slug.trim() !== existing.slug) {
      cleanSlug = slug.trim().toLowerCase().replace(/\s+/g, "-");
      const checkDuplicate = await prisma.vipPlan.findFirst({
        where: { slug: cleanSlug, NOT: { id } },
      });
      if (checkDuplicate) {
        return NextResponse.json(
          { success: false, error: `Mã gói (slug) '${cleanSlug}' đã được sử dụng` },
          { status: 400 }
        );
      }
    }

    const formattedFeatures = Array.isArray(features)
      ? features.map((f) => String(f).trim()).filter(Boolean)
      : typeof features === "string"
      ? features
          .split("\n")
          .map((f) => f.trim())
          .filter(Boolean)
      : existing.features;

    const updated = await auditedWrite(auditAdmin.id, "VIP_PLAN_UPDATED", tx => tx.vipPlan.update({
      where: { id },
      data: {
        name: name !== undefined ? String(name).trim() : existing.name,
        slug: cleanSlug,
        price: price !== undefined ? Number(price) : existing.price,
        originalPrice:
          originalPrice !== undefined
            ? Number(originalPrice)
            : existing.originalPrice,
        period: period !== undefined ? String(period).trim() : existing.period,
        durationDays:
          durationDays !== undefined ? Number(durationDays) : existing.durationDays,
        desc: desc !== undefined ? String(desc).trim() : existing.desc,
        tag: tag !== undefined ? (tag ? String(tag).trim() : null) : existing.tag,
        isPopular: isPopular !== undefined ? Boolean(isPopular) : existing.isPopular,
        features: formattedFeatures,
        order: order !== undefined ? Number(order) : existing.order,
        active: active !== undefined ? Boolean(active) : existing.active,
      },
    }));

    return NextResponse.json({
      success: true,
      message: "Cập nhật gói VIP thành công",
      data: updated,
    });
  } catch (error) {
    return dataErrorResponse(error, "app/api/vip-plans/[id]/route.ts");
  }

  });
}

// PATCH /api/vip-plans/[id] - Cập nhật nhanh một số trường (Bật/Tắt active, isPopular)
export async function PATCH(req: Request, { params }: Params) {
  const denial = await adminRouteGuard(req);
  if (denial) return denial;
  const auditAdmin = await requireAdmin("PATCH /api/vip-plans/[id]");
  return auditOutcome(auditAdmin.id, "PATCH /api/vip-plans/[id]", async () => {
  try {
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.vipPlan.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy gói VIP" },
        { status: 404 }
      );
    }

    const updated = await auditedWrite(auditAdmin.id, "VIP_PLAN_UPDATED", tx => tx.vipPlan.update({
      where: { id },
      data: {
        ...(body.active !== undefined && { active: Boolean(body.active) }),
        ...(body.isPopular !== undefined && { isPopular: Boolean(body.isPopular) }),
        ...(body.order !== undefined && { order: Number(body.order) }),
      },
    }));

    return NextResponse.json({
      success: true,
      message: "Cập nhật nhanh gói VIP thành công",
      data: updated,
    });
  } catch (error) {
    return dataErrorResponse(error, "app/api/vip-plans/[id]/route.ts");
  }

  });
}

// DELETE /api/vip-plans/[id] - Xóa gói VIP
export async function DELETE(req: Request, { params }: Params) {
  const denial = await adminRouteGuard(req);
  if (denial) return denial;
  const auditAdmin = await requireAdmin("DELETE /api/vip-plans/[id]");
  return auditOutcome(auditAdmin.id, "DELETE /api/vip-plans/[id]", async () => {
  try {
    const { id } = await params;
    const existing = await prisma.vipPlan.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy gói VIP để xóa" },
        { status: 404 }
      );
    }

    await auditedWrite(auditAdmin.id, "VIP_PLAN_DELETED", tx => tx.vipPlan.delete({ where: { id } }));

    return NextResponse.json({
      success: true,
      message: `Đã xóa gói VIP '${existing.name}' thành công`,
    });
  } catch (error) {
    return dataErrorResponse(error, "app/api/vip-plans/[id]/route.ts");
  }

  });
}
