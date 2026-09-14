import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSePayConfig, calculateNewVipExpiration } from "@/lib/sepay-server";
import { getActiveVipPlans } from "@/lib/vip-plans-server";

export const dynamic = "force-dynamic";

/**
 * GET /api/webhooks/sepay
 * Dùng để kiểm tra trạng thái webhook hoặc khi SePay ping verify
 */
export async function GET(req: NextRequest) {
  return NextResponse.json({
    status: "ok",
    message: "AIChoShop SePay Webhook Endpoint is active and ready.",
    timestamp: new Date().toISOString(),
  });
}

/**
 * POST /api/webhooks/sepay
 * Lắng nghe thông báo biến động số dư từ SePay
 */
export async function POST(req: NextRequest) {
  try {
    const config = await getSePayConfig();

    // 1. Xác thực API Key nếu được cấu hình
    if (config.apiKey && config.apiKey.trim() !== "") {
      const authHeader = req.headers.get("authorization") || "";
      const xApiKey = req.headers.get("x-api-key") || "";

      let clientKey = "";
      if (authHeader.startsWith("Apikey ")) {
        clientKey = authHeader.replace("Apikey ", "").trim();
      } else if (authHeader.startsWith("Bearer ")) {
        clientKey = authHeader.replace("Bearer ", "").trim();
      } else if (authHeader) {
        clientKey = authHeader.trim();
      } else if (xApiKey) {
        clientKey = xApiKey.trim();
      }

      if (clientKey !== config.apiKey.trim()) {
        console.warn("[SePay Webhook] Unauthorized request - API key mismatch");
        return NextResponse.json(
          { error: "Unauthorized: Invalid API key" },
          { status: 401 }
        );
      }
    }

    const body = await req.json();
    console.log("[SePay Webhook Received]:", JSON.stringify(body));

    // SePay payload fields
    const {
      id: sepayId,
      gateway,
      transactionDate,
      accountNumber,
      content = "",
      transferType,
      transferAmount = 0,
      referenceCode,
      description,
    } = body;

    // Chỉ xử lý giao dịch tiền vào ("in")
    if (transferType && transferType.toLowerCase() === "out") {
      return NextResponse.json({
        success: true,
        message: "Ignored outgoing transfer",
      });
    }

    const uniqueTxId = String(sepayId || referenceCode || "").trim();
    if (uniqueTxId) {
      // 2. Chống trùng lặp giao dịch (Idempotency)
      const existingTx = await prisma.transaction.findFirst({
        where: {
          sepayId: uniqueTxId,
          status: "SUCCESS",
        },
      });

      if (existingTx) {
        console.log(`[SePay Webhook] Transaction ${uniqueTxId} already processed.`);
        return NextResponse.json({
          success: true,
          message: "Transaction already processed",
          transactionId: existingTx.id,
        });
      }
    }

    const amountNumber = Number(transferAmount) || 0;
    if (amountNumber <= 0) {
      return NextResponse.json(
        { error: "Invalid transfer amount" },
        { status: 400 }
      );
    }

    // 3. Tìm kiếm học viên từ nội dung chuyển khoản (content)
    const contentStr = String(content || description || "").trim();
    let identifiedUser = null;

    // A. Thử tìm số điện thoại trong nội dung (chuỗi 10 số bắt đầu bằng 0)
    const phoneMatches = contentStr.match(/(?:0|\+84)[3|5|7|8|9][0-9]{8}/g);
    if (phoneMatches && phoneMatches.length > 0) {
      for (const rawPhone of phoneMatches) {
        const normalizedPhone = rawPhone.startsWith("+84")
          ? "0" + rawPhone.slice(3)
          : rawPhone;
        const userByPhone = await prisma.user.findFirst({
          where: {
            OR: [{ phone: normalizedPhone }, { phone: rawPhone }],
          },
        });
        if (userByPhone) {
          identifiedUser = userByPhone;
          break;
        }
      }
    }

    // B. Thử tìm email trong nội dung
    if (!identifiedUser) {
      const emailMatches = contentStr.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
      if (emailMatches && emailMatches.length > 0) {
        for (const email of emailMatches) {
          const userByEmail = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
          });
          if (userByEmail) {
            identifiedUser = userByEmail;
            break;
          }
        }
      }
    }

    // C. Thử tìm theo cú pháp: VIP <token> hoặc syntaxPrefix <token> (không lấy dấu chấm để tránh dính .CT, .MB của ngân hàng)
    if (!identifiedUser) {
      const prefix = config.syntaxPrefix || "VIP";
      const regex = new RegExp(`${prefix}\\s*([a-zA-Z0-9_]+)`, "i");
      const match = contentStr.match(regex);
      if (match && match[1]) {
        const token = match[1].trim();
        identifiedUser = await prisma.user.findFirst({
          where: {
            OR: [
              { id: token },
              { phone: token },
              { email: { equals: token, mode: "insensitive" } },
              { email: { startsWith: token.toLowerCase() + "@", mode: "insensitive" } },
            ],
          },
        });
      }
    }

    // D. Quét toàn bộ từng từ trong content xem có từ nào khớp SĐT hoặc username email không
    if (!identifiedUser) {
      const cleanWords = contentStr
        .toLowerCase()
        .replace(/[^a-z0-9]/g, " ")
        .split(/\s+/)
        .filter(Boolean);

      for (const word of cleanWords) {
        if (word.length >= 4) {
          const user = await prisma.user.findFirst({
            where: {
              OR: [
                { phone: word },
                { email: { startsWith: word + "@", mode: "insensitive" } },
                { email: { equals: word, mode: "insensitive" } },
              ],
            },
          });
          if (user) {
            identifiedUser = user;
            break;
          }
        }
      }
    }

    // D2. Thử khớp theo tên học viên (bỏ dấu tiếng Việt, ví dụ: "LE VAN AN chuyen tien")
    if (!identifiedUser) {
      const allUsers = await prisma.user.findMany({
        where: { name: { not: null } },
      });

      const removeVietnameseTones = (str: string) => {
        return str
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/đ/g, "d")
          .replace(/Đ/g, "D")
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "");
      };

      const cleanContentNoTones = removeVietnameseTones(contentStr);

      for (const u of allUsers) {
        if (u.name && u.name.trim().length >= 3) {
          const cleanName = removeVietnameseTones(u.name);
          if (cleanName.length >= 4 && cleanContentNoTones.includes(cleanName)) {
            identifiedUser = u;
            console.log(`[SePay Webhook] User identified via user name match: ${u.name} (${u.email})`);
            break;
          }
        }
      }
    }

    // E. Nếu vẫn chưa tìm ra, kiểm tra các giao dịch PENDING được tạo gần nhất (trong 60 phút qua) có số tiền khớp
    if (!identifiedUser) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentPendingTxs = await prisma.transaction.findMany({
        where: {
          status: "PENDING",
          amount: amountNumber,
          createdAt: { gte: oneHourAgo },
          user: { role: { not: "ADMIN" } },
        },
        include: { user: true },
        orderBy: { createdAt: "desc" },
      });

      if (recentPendingTxs.length === 1) {
        identifiedUser = recentPendingTxs[0].user;
        console.log(`[SePay Webhook] User identified via unique recent PENDING transaction: ${identifiedUser.email}`);
      } else if (recentPendingTxs.length > 1) {
        const matched = recentPendingTxs.find((tx) => {
          const u = tx.user;
          const userEmailPrefix = u.email.split("@")[0].toLowerCase();
          const cleanContent = contentStr.toLowerCase().replace(/[^a-z0-9]/g, "");
          return (
            cleanContent.includes(userEmailPrefix.replace(/[^a-z0-9]/g, "")) ||
            (u.name && cleanContent.includes(u.name.toLowerCase().replace(/[^a-z0-9]/g, "")))
          );
        });
        if (matched) {
          identifiedUser = matched.user;
          console.log(`[SePay Webhook] User identified via PENDING transaction & content match: ${identifiedUser.email}`);
        }
      }
    }

    if (!identifiedUser) {
      console.warn(`[SePay Webhook] Cannot identify user from content: "${contentStr}"`);
      // Vẫn lưu transaction trạng thái PENDING để admin có thể kiểm tra và gán thủ công nếu có user hệ thống
      const fallbackUser =
        (await prisma.user.findFirst({ where: { role: "ADMIN" } })) ||
        (await prisma.user.findFirst());

      let pendingTxId: string | undefined = undefined;
      if (fallbackUser) {
        const pendingTx = await prisma.transaction.create({
          data: {
            userId: fallbackUser.id,
            amount: amountNumber,
            status: "PENDING",
            type: "UPGRADE_VIP_UNASSIGNED",
            sepayId: uniqueTxId || `unidentified-${Date.now()}`,
          },
        });
        pendingTxId = pendingTx.id;
      }

      return NextResponse.json({
        success: false,
        message: "User could not be identified from transaction content. Saved as PENDING for admin review.",
        transactionId: pendingTxId,
      });
    }

    // 4. Khớp số tiền với Gói VIP để lấy durationDays
    const activePlans = await getActiveVipPlans();
    
    // Tìm gói khớp chính xác số tiền
    let matchedPlan = activePlans.find((p) => p.price === amountNumber);

    // Nếu không khớp chính xác, tìm gói có giá nhỏ hơn hoặc bằng số tiền chuyển khoản cao nhất
    if (!matchedPlan) {
      const eligiblePlans = activePlans
        .filter((p) => p.price <= amountNumber)
        .sort((a, b) => b.price - a.price);
      if (eligiblePlans.length > 0) {
        matchedPlan = eligiblePlans[0];
      }
    }

    // Mặc định nếu không tìm thấy gói nào nhưng số tiền >= 99.000: mặc định gói 30 ngày
    const durationDays = matchedPlan
      ? (matchedPlan.durationDays ?? 0)
      : amountNumber >= 990000 ? 0 : 30;

    // 5. Kiểm tra thiết lập AutoActivate
    if (!config.autoActivate) {
      const tx = await prisma.transaction.create({
        data: {
          userId: identifiedUser.id,
          amount: amountNumber,
          status: "PENDING",
          type: "UPGRADE_VIP",
          sepayId: uniqueTxId || `pending-${Date.now()}`,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Auto-activate is disabled in admin. Transaction recorded as PENDING.",
        transactionId: tx.id,
        user: { id: identifiedUser.id, email: identifiedUser.email },
      });
    }

    // 6. Tính ngày hết hạn VIP mới và kích hoạt VIP
    const newExpiresAt = calculateNewVipExpiration(
      identifiedUser.vipExpiresAt,
      identifiedUser.isVIP,
      durationDays
    );

    // Cập nhật User
    const updatedUser = await prisma.user.update({
      where: { id: identifiedUser.id },
      data: {
        isVIP: true,
        vipExpiresAt: newExpiresAt,
      },
    });

    // Cập nhật giao dịch PENDING trước đó (nếu có) hoặc tạo bản ghi mới
    const typeLabel = matchedPlan ? `UPGRADE_VIP_${matchedPlan.slug.toUpperCase()}` : "UPGRADE_VIP";
    const existingPending = await prisma.transaction.findFirst({
      where: {
        userId: identifiedUser.id,
        status: "PENDING",
      },
      orderBy: { createdAt: "desc" },
    });

    let transaction;
    if (existingPending) {
      transaction = await prisma.transaction.update({
        where: { id: existingPending.id },
        data: {
          amount: amountNumber,
          status: "SUCCESS",
          type: typeLabel,
          sepayId: uniqueTxId || `tx-${Date.now()}`,
        },
      });
    } else {
      transaction = await prisma.transaction.create({
        data: {
          userId: identifiedUser.id,
          amount: amountNumber,
          status: "SUCCESS",
          type: typeLabel,
          sepayId: uniqueTxId || `tx-${Date.now()}`,
        },
      });
    }

    console.log(
      `[SePay Webhook SUCCESS] User ${updatedUser.email} upgraded to VIP. Expires: ${
        newExpiresAt ? newExpiresAt.toISOString() : "LIFETIME"
      }`
    );

    return NextResponse.json({
      success: true,
      message: "VIP upgraded successfully",
      transactionId: transaction.id,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        phone: updatedUser.phone,
        isVIP: updatedUser.isVIP,
        vipExpiresAt: updatedUser.vipExpiresAt,
      },
      plan: matchedPlan
        ? { name: matchedPlan.name, durationDays: matchedPlan.durationDays }
        : { name: "Tự động kích hoạt", durationDays },
    });
  } catch (error: any) {
    console.error("[SePay Webhook Error]:", error);
    return NextResponse.json(
      { error: "Internal server error processing webhook", details: error.message },
      { status: 500 }
    );
  }
}
