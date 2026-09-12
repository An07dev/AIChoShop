import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveVipPlans } from "@/lib/vip-plans-server";

// GET /api/vip-plans - Lấy danh sách gói VIP
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const all = searchParams.get("all") === "true";

    if (all) {
      const plans = await prisma.vipPlan.findMany({
        orderBy: { order: "asc" },
      });
      return NextResponse.json({ success: true, data: plans });
    }

    const activePlans = await getActiveVipPlans();
    return NextResponse.json({ success: true, data: activePlans });
  } catch (error) {
    console.error("GET /api/vip-plans error:", error);
    return NextResponse.json(
      { success: false, error: "Không thể lấy danh sách gói VIP" },
      { status: 500 }
    );
  }
}

// POST /api/vip-plans - Tạo gói VIP mới (Cấu hình bởi Admin)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      slug,
      price,
      originalPrice,
      period = "/ tháng",
      durationDays = 30,
      desc = "",
      tag = "",
      isPopular = false,
      features = [],
      order = 0,
      active = true,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "Tên gói VIP không được để trống" },
        { status: 400 }
      );
    }

    const cleanSlug = slug
      ? slug.trim().toLowerCase().replace(/\s+/g, "-")
      : name.trim().toLowerCase().replace(/[^a-z0-9]/g, "-");

    const existingSlug = await prisma.vipPlan.findUnique({
      where: { slug: cleanSlug },
    });

    if (existingSlug) {
      return NextResponse.json(
        { success: false, error: `Mã gói (slug) '${cleanSlug}' đã tồn tại, vui lòng chọn mã khác` },
        { status: 400 }
      );
    }

    const parsedPrice = Number(price) || 0;
    const parsedOriginal = Number(originalPrice) || parsedPrice;

    // Chuẩn hóa features mảng chuỗi
    const formattedFeatures = Array.isArray(features)
      ? features.map((f) => String(f).trim()).filter(Boolean)
      : typeof features === "string"
      ? features
          .split("\n")
          .map((f) => f.trim())
          .filter(Boolean)
      : [];

    const newPlan = await prisma.vipPlan.create({
      data: {
        name: name.trim(),
        slug: cleanSlug,
        price: parsedPrice,
        originalPrice: parsedOriginal,
        period: period.trim(),
        durationDays: Number(durationDays) || 0,
        desc: desc.trim(),
        tag: tag ? tag.trim() : null,
        isPopular: Boolean(isPopular),
        features: formattedFeatures,
        order: Number(order) || 0,
        active: Boolean(active),
      },
    });

    return NextResponse.json(
      { success: true, message: "Tạo gói VIP thành công", data: newPlan },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/vip-plans error:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi hệ thống khi tạo gói VIP" },
      { status: 500 }
    );
  }
}
