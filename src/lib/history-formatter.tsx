"use client";

import React, { useState } from "react";
import {
  Copy,
  Check,
  Sparkles,
  MessageSquare,
  Video,
  Phone,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
} from "lucide-react";

/**
 * Trích xuất đoạn xem trước ngắn gọn, tiếng Việt, dễ hiểu cho cột danh sách bên trái.
 * Không để lộ cú pháp JSON ({"key": "value"}).
 */
export function getHumanReadableSnippet(
  output: string | null,
  _tool?: string,
  action?: string
): string {
  if (!output) return "Chưa có nội dung kết quả.";

  const trimmed = output.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
    return trimmed.replace(/\n+/g, " ").slice(0, 120);
  }

  try {
    const data = JSON.parse(trimmed) as Record<string, unknown>;

    // 0. Ra mắt sản phẩm 5-in-1 (product-launchpad)
    if (data.overview && (data.seoListing || data.videoScripts || data.adCopies)) {
      const o = data.overview as Record<string, string>;
      const pName = o.productName || action || "Sản phẩm";
      const slogan = o.slogan || o.positioning || "Bộ hồ sơ 5-in-1 trọn gói";
      return `🚀 Ra mắt "${pName}": ${slogan}`.slice(0, 120);
    }

    // 1. Kịch bản video (script-writer)
    if (Array.isArray(data.videoScripts) && data.videoScripts[0]) {
      const s = data.videoScripts[0] as Record<string, string>;
      return `🎬 Kịch bản: "${s.title || action}" (${s.estimatedDuration || "30s"}) - ${s.angleLabel || "Hút khách"}`;
    }

    // 2. Chống hoàn COD (anti-return-nudge)
    if (data.scenarioName || data.chatMessages) {
      const scenario = typeof data.scenarioName === "string" ? data.scenarioName : "Xử lý đơn COD";
      const product = typeof data.productName === "string" ? `${data.productName} · ` : "";
      const chatArr = Array.isArray(data.chatMessages) ? data.chatMessages : [];
      const firstMsg = (chatArr[0] as Record<string, string>)?.content || (typeof data.goldenHourTip === "string" ? data.goldenHourTip : "");
      return `🛡️ ${product}${scenario}: ${firstMsg}`.slice(0, 120);
    }

    // 3. Bẻ gãy từ chối (objection-killer)
    if (data.customerObjection || data.quickReplies) {
      const obj = typeof data.customerObjection === "string" ? `Khách nói: "${data.customerObjection}"` : "";
      const repliesArr = Array.isArray(data.quickReplies) ? data.quickReplies : [];
      const firstRep = (repliesArr[0] as Record<string, string>)?.replyText || (typeof data.flexibleOffer === "string" ? data.flexibleOffer : "");
      return `💬 ${obj} ➔ Phản hồi: ${firstRep}`.slice(0, 120);
    }

    // 4. Đối thủ & USP (competitor-miner)
    if (data.battleOverview || data.uniqueSellingPoints) {
      const battle = (data.battleOverview as Record<string, string>) || {};
      const slogan = battle.coreSlogan || (typeof data.productName === "string" ? data.productName : "");
      const badge = battle.marketOpportunityBadge || "";
      return `🎯 ${badge ? `[${badge}] ` : ""}${slogan}`.slice(0, 120);
    }

    // 5. Nhân bản tiêu đề (title-spinner)
    if (Array.isArray(data.titles) && data.titles[0]) {
      const first = data.titles[0];
      const firstTitle = typeof first === "string" ? first : (first as Record<string, string>).title || "";
      return `🏷️ Tiêu đề #1: ${firstTitle}`.slice(0, 120);
    }

    // 6. Mẫu quảng cáo Ads (ad-copy)
    if (Array.isArray(data.headlines) || Array.isArray(data.copies)) {
      const hl = Array.isArray(data.headlines) ? String(data.headlines[0] || "") : "";
      const cpItem = Array.isArray(data.copies) ? data.copies[0] : null;
      const cp = typeof cpItem === "string" ? cpItem : (cpItem as Record<string, string>)?.text || "";
      return `📢 Ads: ${hl || cp}`.slice(0, 120);
    }

    // 7. Tối ưu SEO (seo-optimizer)
    if (data.optimizedTitle || data.title) {
      return `🔍 SEO: ${String(data.optimizedTitle || data.title)}`.slice(0, 120);
    }

    // 8. Trả lời đánh giá (review-replier)
    if (data.reply || Array.isArray(data.replies)) {
      const rep = typeof data.reply === "string" ? data.reply : (data.replies as Record<string, string>[])?.[0]?.text || "";
      return `⭐ Phản hồi đánh giá: ${rep}`.slice(0, 120);
    }

    // 9. Thẩm định sản phẩm (product-validator)
    if (data.overallScore || data.verdict) {
      return `📊 Thẩm định: ${data.overallScore}/100đ · ${data.verdict || ""} - ${data.executiveSummary || ""}`.slice(0, 120);
    }

    // 10. Tính giá / Tính thuế (pricing-calculator, tax-calculator)
    if (data.suggestedSellingPrice || data.sellingPrice || data.totalTax) {
      if (data.totalTax) {
        return `💰 Tổng tiền thuế dự kiến: ${Number(data.totalTax).toLocaleString("vi-VN")}đ`;
      }
      const price = data.suggestedSellingPrice || data.sellingPrice;
      const profit = data.netProfit || data.profit;
      return `💵 Giá bán đề xuất: ${Number(price).toLocaleString("vi-VN")}đ · Lãi: ${Number(profit).toLocaleString("vi-VN")}đ`;
    }

    // 11. Thư cảm ơn nhét hộp (unboxing-card)
    if (data.headline || data.thankYouNote) {
      return `💌 Thư cảm ơn: ${String(data.headline || data.thankYouNote)}`.slice(0, 120);
    }

    // JSON tổng quát
    for (const val of Object.values(data)) {
      if (typeof val === "string" && val.length > 5 && !val.startsWith("http")) {
        return val.replace(/\n+/g, " ").slice(0, 120);
      }
    }

    return `${action || "Dữ liệu AI đã tạo"} (Nhấn để xem chi tiết)`;
  } catch {
    return trimmed.slice(0, 120);
  }
}

/**
 * Chuyển đổi dữ liệu JSON thành văn bản thuần tiếng Việt chuẩn chỉnh,
 * đẹp mắt, dùng để Sao Chép 1-Click, Tải file .TXT và Xuất Excel.
 */
export function getCleanPlainText(
  output: string | null,
  tool?: string,
  action?: string
): string {
  if (!output) return "";
  const trimmed = output.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
    return trimmed;
  }

  try {
    const data = JSON.parse(trimmed) as Record<string, unknown>;
    const lines: string[] = [];

    if (action) {
      lines.push(`📌 ${action}\n`);
    } else if (tool) {
      lines.push(`🛠️ Công cụ: ${tool}\n`);
    }

    // 0. AI RA MẮT SẢN PHẨM TRỌN GÓI 5-IN-1 (product-launchpad)
    if (data.overview && (data.seoListing || data.videoScripts || data.unboxingCard)) {
      const o = data.overview as Record<string, string>;
      const s = data.seoListing as Record<string, unknown> | undefined;
      const u = data.unboxingCard as Record<string, string> | undefined;
      const a = data.antiReturnNudge as Record<string, string> | undefined;

      if (o.productName) lines.push(`🚀 SẢN PHẨM: ${o.productName}`);
      if (o.category) lines.push(`📂 Ngành hàng: ${o.category}`);
      if (o.slogan) lines.push(`✨ Slogan: "${o.slogan}"`);
      if (o.positioning) lines.push(`🎯 Định vị: ${o.positioning}`);
      if (o.grossMarginEst) lines.push(`💰 Ước tính tài chính: ${o.grossMarginEst}\n`);

      if (s) {
        lines.push(`--- BỘ LISTING CHUẨN SEO ---`);
        if (s.shopeeTitle) lines.push(`* Tiêu đề Shopee:\n${String(s.shopeeTitle)}`);
        if (s.tiktokTitle) lines.push(`* Tiêu đề TikTok Shop:\n${String(s.tiktokTitle)}`);
        if (Array.isArray(s.bulletPoints)) {
          lines.push(`* 5 Điểm nổi bật:`);
          s.bulletPoints.forEach((bp: unknown, i: number) => lines.push(`  ${i + 1}. ${String(bp)}`));
        }
        if (s.detailedDescription) lines.push(`\n* Mô tả chi tiết:\n${String(s.detailedDescription)}`);
        if (Array.isArray(s.hashtags)) lines.push(`\n* Hashtags: ${s.hashtags.join(" ")}\n`);
      }

      if (Array.isArray(data.videoScripts)) {
        lines.push(`--- 3 KỊCH BẢN VIDEO NGẮN ---`);
        data.videoScripts.forEach((rawVs: unknown, i: number) => {
          const vs = rawVs as Record<string, unknown>;
          lines.push(`\n[Kịch bản #${i + 1}: ${String(vs.title || "")}] (${String(vs.angle || "Video ngắn")})`);
          if (vs.hook3s) lines.push(`⚡ Hook 3s: "${String(vs.hook3s)}"`);
          if (Array.isArray(vs.scenes)) {
            vs.scenes.forEach((rawSc: unknown) => {
              const sc = rawSc as Record<string, string>;
              lines.push(`  [${sc.time || ""}] Góc máy: ${sc.visual || ""} | Thoại: ${sc.voiceover || ""} | Chữ: ${sc.textOverlay || ""}`);
            });
          }
          if (vs.callToAction) lines.push(`👉 CTA: ${String(vs.callToAction)}`);
        });
        lines.push(``);
      }

      if (Array.isArray(data.adCopies)) {
        lines.push(`--- BỘ 3 MẪU BÀI QUẢNG CÁO ADS ---`);
        data.adCopies.forEach((rawAd: unknown, i: number) => {
          const ad = rawAd as Record<string, unknown>;
          lines.push(`\n[Mẫu Ads #${i + 1}: ${String(ad.headline || "")}] (${String(ad.angleName || "Ads")})`);
          lines.push(`${String(ad.bodyText || "")}`);
          if (ad.callToAction) lines.push(`👉 CTA: ${String(ad.callToAction)}`);
        });
        lines.push(``);
      }

      if (u) {
        lines.push(`--- THƯ CẢM ƠN NHÉT HỘP ---`);
        if (u.title) lines.push(`* Tiêu đề thiệp: ${u.title}`);
        if (u.letterBody) lines.push(`${u.letterBody}`);
        if (u.reorderVoucherCode) lines.push(`* Voucher tái mua: ${u.reorderVoucherCode}`);
        if (u.fiveStarTip) lines.push(`* Lời kêu gọi 5 sao: ${u.fiveStarTip}`);
        if (u.warrantyPolicy) lines.push(`* Chính sách: ${u.warrantyPolicy}\n`);
      }

      if (a) {
        lines.push(`--- KỊCH BẢN CSKH & CHỐNG BOM COD ---`);
        if (a.dispatchSms) lines.push(`* Khi xuất kho:\n${a.dispatchSms}`);
        if (a.outForDeliverySms) lines.push(`* Khi đang giao:\n${a.outForDeliverySms}`);
        if (a.hesitationRescue) lines.push(`* Kịch bản cứu đơn hủy:\n${a.hesitationRescue}`);
      }

      return lines.join("\n");
    }

    // 1. KỊCH BẢN CHỐNG HOÀN COD (anti-return-nudge)
    if (data.chatMessages || data.scenarioName || data.phoneCallScript) {
      if (data.productName) lines.push(`📦 Sản phẩm: ${data.productName}`);
      if (data.codAmount) lines.push(`💰 Tiền thu hộ COD: ${data.codAmount}`);
      if (data.scenarioName) lines.push(`🎯 Tình huống: ${data.scenarioName}`);
      if (data.goldenHourTip) lines.push(`⏰ Thời gian vàng xử lý: ${data.goldenHourTip}\n`);

      if (Array.isArray(data.chatMessages)) {
        lines.push(`--- MẪU TIN NHẮN CHAT GỬI KHÁCH ---`);
        data.chatMessages.forEach((rawMsg, i: number) => {
          const msg = rawMsg as Record<string, string>;
          lines.push(`\n[${msg.sampleNumber || `Mẫu #${i + 1}`}: ${msg.title || "Mẫu tin nhắn"}]`);
          lines.push(`${msg.content || msg.text || ""}`);
          if (msg.note) lines.push(`💡 Lưu ý: ${msg.note}`);
        });
      }

      if (data.phoneCallScript && typeof data.phoneCallScript === "object") {
        const phone = data.phoneCallScript as Record<string, string>;
        lines.push(`\n--- KỊCH BẢN GỌI ĐIỆN CHO KHÁCH HÀNG ---`);
        if (phone.callOpening) lines.push(`* Lời chào mở đầu:\n${phone.callOpening}\n`);
        if (phone.objectionHandling) lines.push(`* Xử lý khéo léo khi khách ngần ngại:\n${phone.objectionHandling}\n`);
        if (phone.closingAdvice) lines.push(`* Chốt phương án an toàn:\n${phone.closingAdvice}\n`);
      }

      if (typeof data.shipperNote === "string") {
        lines.push(`\n--- DẶN DÒ SHIPPER GIAO HÀNG ---`);
        lines.push(data.shipperNote);
      }

      return lines.join("\n");
    }

    // 2. BẺ GÃY LỜI TỪ CHỐI (objection-killer)
    if (data.customerObjection || data.quickReplies) {
      if (data.productName) lines.push(`📦 Sản phẩm: ${data.productName}`);
      if (data.price) lines.push(`💵 Giá bán: ${data.price}`);
      if (data.customerObjection) lines.push(`🛑 Lời từ chối của khách:\n"${data.customerObjection}"\n`);
      if (data.flexibleOffer) lines.push(`🎁 Đòn bẩy quà tặng / ưu đãi:\n${data.flexibleOffer}\n`);

      if (Array.isArray(data.quickReplies)) {
        lines.push(`--- CÁC MẪU PHẢN HỒI CHỐT ĐƠN (CHỌN 1 MẪU ĐỂ GỬI) ---`);
        data.quickReplies.forEach((rawRep, i: number) => {
          const rep = rawRep as Record<string, string>;
          lines.push(`\n[Lựa chọn #${i + 1}: ${rep.title || "Phản hồi chốt sales"}] (${rep.tone || "Thuyết phục"})`);
          lines.push(`${rep.replyText || rep.content || ""}`);
          if (rep.whyItWorks) lines.push(`💡 Cơ chế tâm lý: ${rep.whyItWorks}`);
        });
      }

      return lines.join("\n");
    }

    // 3. ĐỐI THỦ & USP (competitor-miner)
    if (data.battleOverview || data.uniqueSellingPoints || data.competitorWeaknesses) {
      if (data.productName) lines.push(`📦 Sản phẩm: ${data.productName}`);
      if (data.category) lines.push(`📂 Ngành hàng: ${data.category}`);
      const battle = data.battleOverview as Record<string, string> | undefined;
      if (battle?.coreSlogan) lines.push(`✨ Slogan định vị:\n"${battle.coreSlogan}"\n`);

      if (Array.isArray(data.uniqueSellingPoints)) {
        lines.push(`--- LỢI THẾ ĐỘC QUYỀN (USP) CỦA SHOP BẠN ---`);
        data.uniqueSellingPoints.forEach((rawUsp, i: number) => {
          const usp = rawUsp as Record<string, string>;
          lines.push(`${i + 1}. ${usp.title || usp.name || ""}: ${usp.description || usp.detail || ""}`);
        });
      }

      if (Array.isArray(data.competitorWeaknesses)) {
        lines.push(`\n--- TỬ HUYỆT ĐỐI THỦ (ĐÁNH MẠNH ĐỂ HÚT KHÁCH) ---`);
        data.competitorWeaknesses.forEach((rawW, i: number) => {
          const w = rawW as Record<string, string>;
          lines.push(`${i + 1}. ${w.title || w.name || ""}: ${w.description || w.counterAttack || ""}`);
        });
      }

      return lines.join("\n");
    }

    // 4. KỊCH BẢN VIDEO (script-writer)
    if (Array.isArray(data.videoScripts)) {
      data.videoScripts.forEach((rawScript, sIdx: number) => {
        const script = rawScript as Record<string, unknown>;
        lines.push(`🎬 KỊCH BẢN #${sIdx + 1}: ${script.title || "Kịch bản video triệu view"}`);
        lines.push(`Thời lượng: ${script.estimatedDuration || "30s"} | Góc độ: ${script.angleLabel || "Bán lẻ"}\n`);

        if (Array.isArray(script.scenes)) {
          lines.push(`--- CÁC PHÂN CẢNH CHI TIẾT ---`);
          script.scenes.forEach((rawScene, cIdx: number) => {
            const scene = rawScene as Record<string, string>;
            lines.push(`[Cảnh ${cIdx + 1}: ${scene.timeRange || ""}] (${scene.phase || "Phân cảnh"})`);
            lines.push(`- Hình ảnh/Hành động: ${scene.visual || ""}`);
            lines.push(`- Lời thoại/Thuyết minh: ${scene.voiceover || ""}`);
            if (scene.tip) lines.push(`- Mẹo quay: ${scene.tip}`);
            lines.push(``);
          });
        }
        if (script.callToAction) lines.push(`🎯 Kêu gọi hành động (CTA): ${script.callToAction}\n`);
      });
      return lines.join("\n");
    }

    // 5. NHÂN BẢN TIÊU ĐỀ (title-spinner)
    if (Array.isArray(data.titles)) {
      lines.push(`DANH SÁCH TIÊU ĐỀ CHUẨN SEO & CHỐNG SPAM:\n`);
      data.titles.forEach((t, i: number) => {
        const isStr = typeof t === "string";
        const titleStr = isStr ? t : (t as Record<string, string>).title;
        const tag = isStr ? "" : (t as Record<string, string>).strategyName || (t as Record<string, string>).strategyTag || "";
        lines.push(`${i + 1}. ${titleStr}`);
        if (tag) lines.push(`   (${tag} · ${titleStr.length} ký tự)`);
        lines.push(``);
      });
      if (data.recommendation) lines.push(`💡 Lời khuyên tối ưu:\n${data.recommendation}`);
      return lines.join("\n");
    }

    // 6. MẪU QUẢNG CÁO ADS (ad-copy)
    if (Array.isArray(data.headlines) || Array.isArray(data.copies)) {
      if (Array.isArray(data.headlines)) {
        lines.push(`--- GỢI Ý TIÊU ĐỀ QUẢNG CÁO (HEADLINES) ---`);
        data.headlines.forEach((h, i: number) => lines.push(`${i + 1}. ${h}`));
        lines.push(``);
      }
      if (Array.isArray(data.copies)) {
        lines.push(`--- NỘI DUNG BÀI VIẾT QUẢNG CÁO (PRIMARY TEXT) ---`);
        data.copies.forEach((c, i: number) => {
          lines.push(`\n[Mẫu bài viết #${i + 1}]`);
          lines.push(typeof c === "string" ? c : (c as Record<string, string>).text || (c as Record<string, string>).content || "");
        });
      }
      if (Array.isArray(data.hashtags)) {
        lines.push(`\n--- BỘ HASHTAG ĐỀ XUẤT ---`);
        lines.push(data.hashtags.join(" "));
      }
      return lines.join("\n");
    }

    // 7. CÁC ĐỐI TƯỢNG JSON TỔNG QUÁT: BÓC TÁCH TỰ ĐỘNG THÀNH DÒNG VĂN BẢN
    const extractObjectToText = (obj: Record<string, unknown>, indent = 0) => {
      const pad = "  ".repeat(indent);
      for (const [key, val] of Object.entries(obj)) {
        const readableKey = key
          .replace(/([A-Z])/g, " $1")
          .replace(/_/g, " ")
          .trim();
        const capKey = readableKey.charAt(0).toUpperCase() + readableKey.slice(1);

        if (val === null || val === undefined) continue;
        if (typeof val === "object" && !Array.isArray(val)) {
          lines.push(`${pad}▶ ${capKey}:`);
          extractObjectToText(val as Record<string, unknown>, indent + 1);
        } else if (Array.isArray(val)) {
          lines.push(`${pad}▶ ${capKey}:`);
          val.forEach((item, idx) => {
            if (typeof item === "object" && item !== null) {
              lines.push(`${pad}  [#${idx + 1}]`);
              extractObjectToText(item as Record<string, unknown>, indent + 2);
            } else {
              lines.push(`${pad}  - ${item}`);
            }
          });
        } else {
          lines.push(`${pad}• ${capKey}: ${val}`);
        }
      }
    };

    extractObjectToText(data);
    return lines.join("\n");
  } catch {
    return trimmed;
  }
}

/**
 * Component React hiển thị nội dung trực quan, thẩm mỹ, dễ hiểu cho người bán.
 * Không hiển thị cú pháp JSON thô.
 */
export function HumanizedHistoryView({
  output,
}: {
  output: string | null;
  tool?: string;
  action?: string;
}) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopySnippet = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  if (!output) {
    return (
      <div className="p-6 text-center text-slate-400 text-xs">
        Chưa có nội dung kết quả trả về.
      </div>
    );
  }

  const trimmed = output.trim();
  let parsed: Record<string, unknown> | null = null;
  try {
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      parsed = JSON.parse(trimmed) as Record<string, unknown>;
    }
  } catch {
    parsed = null;
  }

  // Nếu không phải JSON, hiển thị văn bản thuần túy với định dạng đẹp
  if (!parsed) {
    return (
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-100 leading-relaxed whitespace-pre-wrap font-sans select-text">
        {trimmed}
      </div>
    );
  }

  // 1. GIAO DIỆN CHỐNG HOÀN COD (anti-return-nudge)
  if (parsed.chatMessages || parsed.scenarioName || parsed.phoneCallScript) {
    const chatMessages = Array.isArray(parsed.chatMessages) ? (parsed.chatMessages as Record<string, string>[]) : null;
    const phoneCallScript = parsed.phoneCallScript as Record<string, string> | undefined;

    return (
      <div className="space-y-4 select-text">
        {/* Banner Tổng quan */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-slate-800 dark:to-slate-800/80 border border-indigo-100 dark:border-indigo-900/40 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-600 text-white flex items-center gap-1">
              <ShieldAlert size={13} /> {String(parsed.scenarioName || "Xử lý cứu đơn COD")}
            </span>
            {Boolean(parsed.codAmount) && (
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                COD: {String(parsed.codAmount)}
              </span>
            )}
            {Boolean(parsed.shopName) && (
              <span className="text-xs text-slate-500 font-medium">
                Shop: <strong>{String(parsed.shopName)}</strong>
              </span>
            )}
          </div>

          {Boolean(parsed.productName) && (
            <p className="text-xs font-bold text-slate-900 dark:text-white">
              Sản phẩm: {String(parsed.productName)}
            </p>
          )}

          {Boolean(parsed.goldenHourTip) && (
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 text-[11px] text-amber-800 dark:text-amber-300">
              <Lightbulb size={14} className="shrink-0 mt-0.5 text-amber-600" />
              <span>
                <strong>Khung giờ vàng:</strong> {String(parsed.goldenHourTip)}
              </span>
            </div>
          )}
        </div>

        {/* Danh sách Mẫu Tin Nhắn Chat */}
        {chatMessages && (
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <MessageSquare size={15} className="text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Mẫu Tin Nhắn Chat Sẵn Sàng Gửi Cho Khách
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {chatMessages.map((msg, idx: number) => {
                const key = `chat_${idx}`;
                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {msg.sampleNumber || `Mẫu #${idx + 1}`}: {msg.title}
                      </span>
                      <button
                        onClick={() => handleCopySnippet(key, msg.content)}
                        className="px-2 py-1 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-brand hover:text-white text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === key ? (
                          <>
                            <Check size={11} className="text-emerald-500" /> Đã chép!
                          </>
                        ) : (
                          <>
                            <Copy size={11} /> Sao chép mẫu này
                          </>
                        )}
                      </button>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-sans border border-slate-100 dark:border-slate-800">
                      {msg.content}
                    </div>
                    {msg.note && (
                      <p className="text-[10px] text-slate-400 italic">
                        💡 Lưu ý: {msg.note}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Kịch bản gọi điện */}
        {phoneCallScript && (
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center gap-2">
              <Phone size={15} className="text-emerald-600" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Kịch Bản Gọi Điện Cho Khách
              </h3>
            </div>
            <div className="space-y-2 text-xs">
              {phoneCallScript.callOpening && (
                <div className="p-2.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
                  <strong className="text-emerald-800 dark:text-emerald-400 block mb-0.5">
                    1. Lời chào mở đầu:
                  </strong>
                  <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                    {phoneCallScript.callOpening}
                  </p>
                </div>
              )}
              {phoneCallScript.objectionHandling && (
                <div className="p-2.5 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
                  <strong className="text-amber-800 dark:text-amber-400 block mb-0.5">
                    2. Xử lý khi khách chần chừ:
                  </strong>
                  <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                    {phoneCallScript.objectionHandling}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. GIAO DIỆN BẺ GÃY TỪ CHỐI (objection-killer)
  if (parsed.customerObjection || parsed.quickReplies) {
    const quickReplies = Array.isArray(parsed.quickReplies) ? (parsed.quickReplies as Record<string, string>[]) : null;

    return (
      <div className="space-y-4 select-text">
        {/* Hộp Lời từ chối */}
        <div className="p-4 rounded-2xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/40 space-y-1.5">
          <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-xs uppercase tracking-wide">
            <AlertCircle size={14} /> Khách Hàng Nói:
          </div>
          <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white italic">
            &quot;{String(parsed.customerObjection)}&quot;
          </p>
          {Boolean(parsed.flexibleOffer) && (
            <div className="mt-2 pt-2 border-t border-rose-200/60 dark:border-rose-900/40 text-xs text-rose-900 dark:text-rose-300">
              <strong>Đòn bẩy quà tặng:</strong> {String(parsed.flexibleOffer)}
            </div>
          )}
        </div>

        {/* Các phương án phản hồi */}
        {quickReplies && (
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles size={14} className="text-brand" /> Các Phương Án Phản Hồi Chốt Đơn
            </h3>
            <div className="space-y-2.5">
              {quickReplies.map((rep, idx: number) => {
                const key = `obj_${idx}`;
                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-brand/10 text-brand font-bold text-[11px] flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {rep.title || "Phản hồi"}
                        </span>
                        {rep.tone && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
                            {rep.tone}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleCopySnippet(key, rep.replyText)}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-brand hover:text-white text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === key ? (
                          <>
                            <Check size={12} className="text-emerald-500" /> Đã chép!
                          </>
                        ) : (
                          <>
                            <Copy size={12} /> Sao chép
                          </>
                        )}
                      </button>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-sans border border-slate-100 dark:border-slate-800">
                      {rep.replyText}
                    </div>

                    {rep.whyItWorks && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        💡 <strong>Tại sao hiệu quả:</strong> {rep.whyItWorks}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 3. GIAO DIỆN ĐỐI THỦ & TÌM USP (competitor-miner)
  if (parsed.battleOverview || parsed.uniqueSellingPoints || parsed.competitorWeaknesses) {
    const battle = parsed.battleOverview as Record<string, string> | undefined;
    const usps = Array.isArray(parsed.uniqueSellingPoints) ? (parsed.uniqueSellingPoints as Record<string, string>[]) : null;
    const weaknesses = Array.isArray(parsed.competitorWeaknesses) ? (parsed.competitorWeaknesses as Record<string, string>[]) : null;

    return (
      <div className="space-y-4 select-text">
        {/* Slogan định vị */}
        {battle && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-cyan-500/10 border border-teal-500/20 space-y-2">
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-teal-600 text-white">
              {battle.marketOpportunityBadge || "Cơ hội thị trường"}
            </span>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              Slogan: &quot;{battle.coreSlogan}&quot;
            </h3>
          </div>
        )}

        {/* 2 Cột: Tử huyệt đối thủ vs Lợi thế của ta */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Lợi thế của shop */}
          {usps && (
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-950/60 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={15} /> Điểm Khác Biệt (USP) Của Shop
              </div>
              <div className="space-y-2 text-xs">
                {usps.map((usp, idx: number) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
                    <strong className="block text-slate-900 dark:text-white">{usp.title}</strong>
                    <p className="text-slate-600 dark:text-slate-300 mt-0.5 text-[11px]">{usp.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tử huyệt đối thủ */}
          {weaknesses && (
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-950/60 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                <AlertCircle size={15} /> Tử Huyệt Đối Thủ Để Tấn Công
              </div>
              <div className="space-y-2 text-xs">
                {weaknesses.map((w, idx: number) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30">
                    <strong className="block text-slate-900 dark:text-white">{w.title}</strong>
                    <p className="text-slate-600 dark:text-slate-300 mt-0.5 text-[11px]">{w.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 4. GIAO DIỆN KỊCH BẢN VIDEO (script-writer)
  if (Array.isArray(parsed.videoScripts)) {
    return (
      <div className="space-y-4 select-text">
        {parsed.videoScripts.map((rawScript, sIdx: number) => {
          const script = rawScript as Record<string, unknown>;
          const scenes = Array.isArray(script.scenes) ? (script.scenes as Record<string, string>[]) : null;

          return (
            <div key={sIdx} className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <Video size={16} className="text-brand" />
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    {String(script.title || `Kịch bản #${sIdx + 1}`)}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-brand/10 text-brand">
                    {String(script.estimatedDuration || "30s")}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    {String(script.angleLabel || "Video bán lẻ")}
                  </span>
                </div>
              </div>

              {/* Phân cảnh */}
              {scenes && (
                <div className="space-y-2">
                  {scenes.map((scene, cIdx: number) => (
                    <div
                      key={cIdx}
                      className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                        <span>Cảnh {cIdx + 1}: {scene.phase || "Phân cảnh"}</span>
                        <span className="font-mono text-brand">{scene.timeRange}</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                          <strong className="text-slate-500 text-[10px] block uppercase">Hình ảnh / Diễn xuất:</strong>
                          <p className="text-slate-800 dark:text-slate-200 mt-0.5">{scene.visual}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-brand/5 dark:bg-brand/10 border border-brand/20">
                          <strong className="text-brand text-[10px] block uppercase">Lời thoại thuyết minh:</strong>
                          <p className="text-slate-800 dark:text-slate-200 mt-0.5 font-medium">{scene.voiceover}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // 5. GIAO DIỆN NHÂN BẢN TIÊU ĐỀ (title-spinner)
  if (Array.isArray(parsed.titles)) {
    return (
      <div className="space-y-3 select-text">
        <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
          <span>{parsed.titles.length} Biến thể tiêu đề độc bản</span>
          <span>Click icon copy để sao chép từng tiêu đề</span>
        </div>

        <div className="space-y-2">
          {parsed.titles.map((item, idx: number) => {
            const isStr = typeof item === "string";
            const titleStr = isStr ? item : String((item as Record<string, string>).title || "");
            const tag = isStr ? "" : String((item as Record<string, string>).strategyName || (item as Record<string, string>).strategyTag || "");
            const key = `title_${idx}`;

            return (
              <div
                key={idx}
                className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand/40 shadow-xs flex items-center justify-between gap-3 group"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                      #{idx + 1}
                    </span>
                    {tag && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand/10 text-brand shrink-0">
                        {tag}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 font-mono">
                      {titleStr.length} ký tự
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white leading-snug">
                    {titleStr}
                  </p>
                </div>

                <button
                  onClick={() => handleCopySnippet(key, titleStr)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-brand hover:text-white text-slate-700 dark:text-slate-300 transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === key ? (
                    <>
                      <Check size={13} className="text-emerald-500" /> Đã chép
                    </>
                  ) : (
                    <>
                      <Copy size={13} /> Chép
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 6. GIAO DIỆN TỔNG QUÁT: PHÂN RÃ CÁC TRƯỜNG DỮ LIỆU ĐẸP MẮT
  return (
    <div className="space-y-3 select-text">
      {Object.entries(parsed).map(([key, val], idx) => {
        if (val === null || val === undefined) return null;
        const readableKey = key
          .replace(/([A-Z])/g, " $1")
          .replace(/_/g, " ")
          .trim();
        const capKey = readableKey.charAt(0).toUpperCase() + readableKey.slice(1);

        if (typeof val === "string" || typeof val === "number" || typeof val === "boolean") {
          return (
            <div
              key={idx}
              className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-start justify-between gap-2"
            >
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide shrink-0">
                {capKey}:
              </span>
              <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white whitespace-pre-wrap">
                {String(val)}
              </span>
            </div>
          );
        }

        if (Array.isArray(val)) {
          return (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2"
            >
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                {capKey} ({val.length})
              </h4>
              <div className="space-y-1.5">
                {val.map((item, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-sans"
                  >
                    {typeof item === "object" ? (
                      <pre className="text-[11px] whitespace-pre-wrap font-mono">
                        {JSON.stringify(item, null, 2)}
                      </pre>
                    ) : (
                      <span>{String(item)}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        }

        return (
          <div
            key={idx}
            className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2"
          >
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {capKey}
            </h4>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-800 dark:text-slate-200">
              <pre className="text-[11px] whitespace-pre-wrap font-sans">
                {JSON.stringify(val, null, 2)}
              </pre>
            </div>
          </div>
        );
      })}
    </div>
  );
}
