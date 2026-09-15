"use server";

import { auditedWrite } from "@/lib/auth/audit-operations";
import { auditOutcome } from "@/lib/auth/audit-operations";
import { requireAdmin } from "@/lib/auth/session";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { DEFAULT_VIP_PLANS } from "@/lib/vip-plans";

// Lấy danh sách toàn bộ gói VIP (cho Admin)
export async function getAdminVipPlans() {
  const admin = await requireAdmin("getAdminVipPlans");
  return auditOutcome(admin.id, "getAdminVipPlans", async () => {
  try {
    const plans = await prisma.vipPlan.findMany({
      orderBy: { order: "asc" },
    });
    return { success: true, data: plans };
  } catch (error) {
    console.error("Error fetching admin VIP plans:", error);
    return { success: false, error: "Không thể lấy danh sách gói VIP" };
  }

  });
}

// Bật / Tắt trạng thái hiển thị của gói VIP (1-click)
export async function toggleVipPlanActive(planId: string, currentActive: boolean) {
  const admin = await requireAdmin("toggleVipPlanActive");
  return auditOutcome(admin.id, "toggleVipPlanActive", async () => {
  try {
    const updated = await auditedWrite(admin.id, "VIP_PLAN_UPDATED", tx => tx.vipPlan.update({
      where: { id: planId },
      data: { active: !currentActive },
    }));

    revalidatePath("/admin/vip-plans");
    revalidatePath("/profile");
    revalidatePath("/");

    return { success: true, active: updated.active };
  } catch (error) {
    console.error("Error toggling VIP plan active:", error);
    return { success: false, error: "Không thể cập nhật trạng thái gói VIP" };
  }

  });
}

// Đặt gói VIP làm Best Seller (Phổ biến nhất)
export async function toggleVipPlanPopular(planId: string, currentPopular: boolean) {
  const admin = await requireAdmin("toggleVipPlanPopular");
  return auditOutcome(admin.id, "toggleVipPlanPopular", async () => {
  try {
    const updated = await auditedWrite(admin.id, "VIP_PLAN_UPDATED", tx => tx.vipPlan.update({
      where: { id: planId },
      data: { isPopular: !currentPopular },
    }));

    revalidatePath("/admin/vip-plans");
    revalidatePath("/profile");
    revalidatePath("/");

    return { success: true, isPopular: updated.isPopular };
  } catch (error) {
    console.error("Error toggling VIP plan popular:", error);
    return { success: false, error: "Không thể cập nhật nhãn nổi bật" };
  }

  });
}

// Thêm gói VIP mới
export async function createVipPlan(data: {
  name: string;
  slug?: string;
  price: number;
  originalPrice?: number;
  period?: string;
  durationDays?: number;
  desc?: string;
  tag?: string;
  isPopular?: boolean;
  features: string[];
  order?: number;
  active?: boolean;
}) {
  const admin = await requireAdmin("createVipPlan");
  return auditOutcome(admin.id, "createVipPlan", async () => {
  try {
    if (!data.name || !data.name.trim()) {
      return { success: false, error: "Vui lòng nhập tên gói VIP" };
    }

    const cleanSlug = data.slug && data.slug.trim()
      ? data.slug.trim().toLowerCase().replace(/\s+/g, "-")
      : data.name.trim().toLowerCase().replace(/[^a-z0-9]/g, "-");

    const existing = await prisma.vipPlan.findUnique({
      where: { slug: cleanSlug },
    });

    if (existing) {
      return {
        success: false,
        error: `Mã gói (slug) '${cleanSlug}' đã tồn tại, vui lòng chọn mã khác`,
      };
    }

    // Nếu không nhập thứ tự, tự tính order cao nhất + 1
    let order = Number(data.order);
    if (isNaN(order) || order <= 0) {
      const highest = await prisma.vipPlan.findFirst({
        orderBy: { order: "desc" },
      });
      order = (highest?.order || 0) + 1;
    }

    const newPlan = await auditedWrite(admin.id, "VIP_PLAN_CREATED", tx => tx.vipPlan.create({
      data: {
        name: data.name.trim(),
        slug: cleanSlug,
        price: Number(data.price) || 0,
        originalPrice: Number(data.originalPrice) || Number(data.price) || 0,
        period: (data.period || "/ tháng").trim(),
        durationDays: Number(data.durationDays) || 0,
        desc: (data.desc || "").trim(),
        tag: data.tag ? data.tag.trim() : null,
        isPopular: Boolean(data.isPopular),
        features: Array.isArray(data.features)
          ? data.features.map((f) => f.trim()).filter(Boolean)
          : [],
        order,
        active: data.active !== undefined ? Boolean(data.active) : true,
      },
    }));

    revalidatePath("/admin/vip-plans");
    revalidatePath("/profile");
    revalidatePath("/");

    return { success: true, data: newPlan };
  } catch (error) {
    console.error("Error creating VIP plan:", error);
    return { success: false, error: "Lỗi hệ thống khi tạo gói VIP mới" };
  }

  });
}

// Cập nhật thông tin gói VIP
export async function updateVipPlan(
  id: string,
  data: {
    name?: string;
    slug?: string;
    price?: number;
    originalPrice?: number;
    period?: string;
    durationDays?: number;
    desc?: string;
    tag?: string;
    isPopular?: boolean;
    features?: string[];
    order?: number;
    active?: boolean;
  }
) {
  const admin = await requireAdmin("updateVipPlan");
  return auditOutcome(admin.id, "updateVipPlan", async () => {
  try {
    const existing = await prisma.vipPlan.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Không tìm thấy gói VIP cần chỉnh sửa" };
    }

    let cleanSlug = existing.slug;
    if (data.slug && data.slug.trim() !== existing.slug) {
      cleanSlug = data.slug.trim().toLowerCase().replace(/\s+/g, "-");
      const checkDuplicate = await prisma.vipPlan.findFirst({
        where: { slug: cleanSlug, NOT: { id } },
      });
      if (checkDuplicate) {
        return {
          success: false,
          error: `Mã gói (slug) '${cleanSlug}' đã được sử dụng`,
        };
      }
    }

    const updated = await auditedWrite(admin.id, "VIP_PLAN_UPDATED", tx => tx.vipPlan.update({
      where: { id },
      data: {
        name: data.name !== undefined ? data.name.trim() : existing.name,
        slug: cleanSlug,
        price: data.price !== undefined ? Number(data.price) : existing.price,
        originalPrice:
          data.originalPrice !== undefined
            ? Number(data.originalPrice)
            : existing.originalPrice,
        period: data.period !== undefined ? data.period.trim() : existing.period,
        durationDays:
          data.durationDays !== undefined
            ? Number(data.durationDays)
            : existing.durationDays,
        desc: data.desc !== undefined ? data.desc.trim() : existing.desc,
        tag: data.tag !== undefined ? (data.tag ? data.tag.trim() : null) : existing.tag,
        isPopular:
          data.isPopular !== undefined ? Boolean(data.isPopular) : existing.isPopular,
        features:
          data.features !== undefined
            ? data.features.map((f) => f.trim()).filter(Boolean)
            : existing.features,
        order: data.order !== undefined ? Number(data.order) : existing.order,
        active: data.active !== undefined ? Boolean(data.active) : existing.active,
      },
    }));

    revalidatePath("/admin/vip-plans");
    revalidatePath("/profile");
    revalidatePath("/");

    return { success: true, data: updated };
  } catch (error) {
    console.error("Error updating VIP plan:", error);
    return { success: false, error: "Lỗi hệ thống khi cập nhật gói VIP" };
  }

  });
}

// Xóa gói VIP
export async function deleteVipPlan(id: string) {
  const admin = await requireAdmin("deleteVipPlan");
  return auditOutcome(admin.id, "deleteVipPlan", async () => {
  try {
    const existing = await prisma.vipPlan.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Không tìm thấy gói VIP để xóa" };
    }

    await auditedWrite(admin.id, "VIP_PLAN_DELETED", tx => tx.vipPlan.delete({ where: { id } }));

    revalidatePath("/admin/vip-plans");
    revalidatePath("/profile");
    revalidatePath("/");

    return { success: true, message: `Đã xóa gói '${existing.name}' thành công` };
  } catch (error) {
    console.error("Error deleting VIP plan:", error);
    return { success: false, error: "Lỗi hệ thống khi xóa gói VIP" };
  }

  });
}

// Khôi phục 3 gói VIP mặc định
export async function seedDefaultVipPlans() {
  const admin = await requireAdmin("seedDefaultVipPlans");
  return auditOutcome(admin.id, "seedDefaultVipPlans", async () => {
  try {
    for (const plan of DEFAULT_VIP_PLANS) {
      await auditedWrite(admin.id, "VIP_PLAN_SEEDED", tx => tx.vipPlan.upsert({
        where: { slug: plan.slug },
        update: {},
        create: plan,
      }));
    }

    revalidatePath("/admin/vip-plans");
    revalidatePath("/profile");
    revalidatePath("/");

    return { success: true, message: "Đã khởi tạo thành công 3 gói VIP mặc định" };
  } catch (error) {
    console.error("Error seeding default VIP plans:", error);
    return { success: false, error: "Không thể khởi tạo gói VIP mặc định" };
  }

  });
}
