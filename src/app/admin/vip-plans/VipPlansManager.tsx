"use client";

import { useState } from "react";
import {
  Crown,
  Plus,
  Edit2,
  Trash2,
  Star,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Sparkles,
  Zap,
  Check,
  X,
  Layers,
  ArrowUpDown,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  createVipPlan,
  updateVipPlan,
  toggleVipPlanActive,
  toggleVipPlanPopular,
  deleteVipPlan,
  seedDefaultVipPlans,
} from "./actions";
import type { VipPlanItem } from "@/lib/vip-plans";

interface Props {
  initialPlans: VipPlanItem[];
}

export default function VipPlansManager({ initialPlans }: Props) {
  const [plans, setPlans] = useState<VipPlanItem[]>(initialPlans);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<VipPlanItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    price: 299000,
    originalPrice: 499000,
    period: "/ tháng",
    durationDays: 30,
    desc: "",
    tag: "",
    isPopular: false,
    order: 1,
    active: true,
  });
  const [featuresList, setFeaturesList] = useState<string[]>([
    "Không giới hạn 8 công cụ AI bán hàng",
    "Mở khóa toàn bộ 27 video Masterclass",
    "Xuất file Excel tính giá & thuế sàn",
    "Hỗ trợ kỹ thuật viên 1-1 qua Zalo",
  ]);
  const [newFeatureInput, setNewFeatureInput] = useState("");

  const activeCount = plans.filter((p) => p.active).length;
  const popularPlan = plans.find((p) => p.isPopular);

  const openCreateModal = () => {
    setEditingPlan(null);
    setFormData({
      name: "",
      slug: "",
      price: 299000,
      originalPrice: 499000,
      period: "/ tháng",
      durationDays: 30,
      desc: "Trải nghiệm sức mạnh toàn bộ công cụ AI và khóa học",
      tag: "Gói Mới",
      isPopular: false,
      order: plans.length + 1,
      active: true,
    });
    setFeaturesList([
      "Không giới hạn 8 công cụ AI bán hàng",
      "Mở khóa toàn bộ 27 video Masterclass",
      "Xuất file Excel tính giá & thuế sàn",
      "Hỗ trợ kỹ thuật viên 1-1 qua Zalo",
    ]);
    setIsModalOpen(true);
  };

  const openEditModal = (plan: VipPlanItem) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      slug: plan.slug,
      price: plan.price,
      originalPrice: plan.originalPrice,
      period: plan.period,
      durationDays: plan.durationDays ?? 0,
      desc: plan.desc,
      tag: plan.tag ?? "",
      isPopular: plan.isPopular,
      order: plan.order,
      active: plan.active,
    });
    setFeaturesList(Array.isArray(plan.features) ? [...plan.features] : []);
    setIsModalOpen(true);
  };

  const handleAddFeature = () => {
    if (!newFeatureInput.trim()) return;
    setFeaturesList([...featuresList, newFeatureInput.trim()]);
    setNewFeatureInput("");
  };

  const handleRemoveFeature = (index: number) => {
    setFeaturesList(featuresList.filter((_, i) => i !== index));
  };

  const handleToggleActive = async (plan: VipPlanItem) => {
    const res = await toggleVipPlanActive(plan.id, plan.active);
    if (res.success) {
      setPlans(plans.map((p) => (p.id === plan.id ? { ...p, active: res.active! } : p)));
      setStatusMessage({ type: "success", text: `Đã ${res.active ? "bật hiển thị" : "tạm ẩn"} gói '${plan.name}'` });
    } else {
      setStatusMessage({ type: "error", text: res.error || "Không thể đổi trạng thái" });
    }
  };

  const handleTogglePopular = async (plan: VipPlanItem) => {
    const res = await toggleVipPlanPopular(plan.id, plan.isPopular);
    if (res.success) {
      setPlans(plans.map((p) => (p.id === plan.id ? { ...p, isPopular: res.isPopular! } : p)));
      setStatusMessage({
        type: "success",
        text: `Đã ${res.isPopular ? "gắn nhãn Best-Seller cho" : "bỏ nhãn Best-Seller của"} gói '${plan.name}'`,
      });
    } else {
      setStatusMessage({ type: "error", text: res.error || "Không thể đổi nhãn nổi bật" });
    }
  };

  const handleDelete = async (plan: VipPlanItem) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn gói '${plan.name}' không?`)) {
      return;
    }
    const res = await deleteVipPlan(plan.id);
    if (res.success) {
      setPlans(plans.filter((p) => p.id !== plan.id));
      setStatusMessage({ type: "success", text: res.message || "Đã xóa gói VIP" });
    } else {
      setStatusMessage({ type: "error", text: res.error || "Không thể xóa gói" });
    }
  };

  const handleResetDefaults = async () => {
    if (!confirm("Khôi phục danh sách 3 gói VIP mặc định (1 Tháng, 1 Năm, Trọn Đời)?")) {
      return;
    }
    setIsSubmitting(true);
    const res = await seedDefaultVipPlans();
    setIsSubmitting(false);
    if (res.success) {
      window.location.reload();
    } else {
      setStatusMessage({ type: "error", text: res.error || "Lỗi khi khôi phục" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Vui lòng nhập tên gói VIP");
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      if (editingPlan) {
        // Cập nhật gói
        const res = await updateVipPlan(editingPlan.id, {
          name: formData.name,
          slug: formData.slug,
          price: Number(formData.price),
          originalPrice: Number(formData.originalPrice),
          period: formData.period,
          durationDays: Number(formData.durationDays),
          desc: formData.desc,
          tag: formData.tag,
          isPopular: formData.isPopular,
          order: Number(formData.order),
          active: formData.active,
          features: featuresList,
        });

        if (res.success && res.data) {
          setPlans(plans.map((p) => (p.id === editingPlan.id ? (res.data as VipPlanItem) : p)));
          setIsModalOpen(false);
          setStatusMessage({ type: "success", text: `Đã cập nhật gói '${formData.name}' thành công!` });
        } else {
          setStatusMessage({ type: "error", text: res.error || "Cập nhật thất bại" });
        }
      } else {
        // Tạo gói mới
        const res = await createVipPlan({
          name: formData.name,
          slug: formData.slug,
          price: Number(formData.price),
          originalPrice: Number(formData.originalPrice),
          period: formData.period,
          durationDays: Number(formData.durationDays),
          desc: formData.desc,
          tag: formData.tag,
          isPopular: formData.isPopular,
          order: Number(formData.order),
          active: formData.active,
          features: featuresList,
        });

        if (res.success && res.data) {
          setPlans([...plans, res.data as VipPlanItem].sort((a, b) => a.order - b.order));
          setIsModalOpen(false);
          setStatusMessage({ type: "success", text: `Đã thêm mới gói '${formData.name}' thành công!` });
        } else {
          setStatusMessage({ type: "error", text: res.error || "Tạo mới thất bại" });
        }
      }
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: "error", text: "Đã xảy ra lỗi hệ thống" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── HEADER ──────────────────────────────────────────────────────────── */}


      {/* ── STATUS MESSAGE ──────────────────────────────────────────────────── */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl text-xs font-medium flex items-center justify-between gap-3 ${statusMessage.type === "success"
            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
            : "bg-rose-50 text-rose-800 border border-rose-200"
            }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === "success" ? (
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle size={18} className="text-rose-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── TIÊU ĐỀ TRANG CẤU HÌNH GÓI VIP ─────────────────────────────────── */}
      <AdminPageHeader
        title="Cấu Hình Bảng Giá & Gói Cước VIP"
        subtitle="Thiết lập giá bán, thời hạn, quyền lợi và huy hiệu nổi bật các gói VIP hiển thị trên toàn hệ thống."
        icon={Crown}
        iconGradient="from-amber-500 to-yellow-600"
        badge={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
            {plans.length} gói cước
          </span>
        }
      />

      {/* ── 3 KPI CARDS ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Tổng số gói VIP</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">{plans.length} gói</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
            <Layers size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Đang mở bán trên web</span>
            <span className="text-2xl font-black text-emerald-600 mt-1 block">{activeCount} gói hoạt động</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
            <CheckCircle2 size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Gói Best-Seller</span>
            <span className="text-base font-black text-amber-600 mt-1 block truncate max-w-[160px]">
              {popularPlan ? popularPlan.name : "Chưa gắn"}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200">
            <Star size={22} className="fill-purple-600" />
          </div>
        </div>
      </div>

      {/* ── TABLE LIST ──────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-black text-slate-900 text-base">Danh Sách Gói Cước VIP</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">
              {plans.length}
            </span>
          </div>
          <span className="text-xs text-slate-400">Các gói đang bật sẽ xuất hiện trực tiếp tại trang /profile của học viên</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100">
              <tr>
                <th className="px-5 py-3.5">STT</th>
                <th className="px-5 py-3.5">Tên Gói & Mã Slug</th>
                <th className="px-5 py-3.5">Giá Bán / Giá Gốc</th>
                <th className="px-5 py-3.5">Chu Kỳ & Thời Hạn</th>
                <th className="px-5 py-3.5">Huy Hiệu Tag</th>
                <th className="px-5 py-3.5 text-center">Nổi Bật</th>
                <th className="px-5 py-3.5 text-center">Trạng Thái</th>
                <th className="px-5 py-3.5 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {plans.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 text-xs">
                    Chưa có gói VIP nào được cấu hình. Bấm nút &quot;Thêm Gói VIP Mới&quot; hoặc &quot;Khôi Phục Gói Chuẩn&quot;.
                  </td>
                </tr>
              ) : (
                plans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* STT */}
                    <td className="px-5 py-4 font-mono font-bold text-slate-400">{plan.order}</td>

                    {/* Name & Slug */}
                    <td className="px-5 py-4">
                      <div className="font-black text-slate-900 flex items-center gap-1.5">
                        {plan.name}
                        {plan.isPopular && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-0.5">
                            <Star size={10} className="fill-amber-800" /> Best-Seller
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>slug: {plan.slug}</span>
                        <span>•</span>
                        <span>{plan.features?.length || 0} tính năng</span>
                      </div>
                    </td>

                    {/* Price */}
                    <td className="px-5 py-4">
                      <div className="font-black text-emerald-600 text-sm">
                        {plan.price.toLocaleString("vi-VN")} đ
                      </div>
                      <div className="text-[11px] text-slate-400 line-through">
                        {plan.originalPrice.toLocaleString("vi-VN")} đ
                      </div>
                    </td>

                    {/* Period & Duration */}
                    <td className="px-5 py-4">
                      <span className="font-bold text-slate-700 block">{plan.period}</span>
                      <span className="text-[11px] text-slate-400 block">
                        {plan.durationDays && plan.durationDays > 0 ? `${plan.durationDays} ngày` : "Vĩnh viễn (Trọn đời)"}
                      </span>
                    </td>

                    {/* Tag */}
                    <td className="px-5 py-4">
                      {plan.tag ? (
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
                          {plan.tag}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    {/* Popular Toggle */}
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => handleTogglePopular(plan)}
                        className={`p-2 rounded-xl transition-all cursor-pointer ${plan.isPopular
                          ? "bg-amber-100 text-amber-600 hover:bg-amber-200"
                          : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                          }`}
                        title={plan.isPopular ? "Đang là Best-Seller, bấm để bỏ" : "Bấm để đặt làm Best-Seller"}
                      >
                        <Star size={16} className={plan.isPopular ? "fill-amber-600" : ""} />
                      </button>
                    </td>

                    {/* Active Toggle */}
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => handleToggleActive(plan)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${plan.active
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                          : "bg-slate-100 text-slate-400 border border-slate-200 hover:bg-slate-200"
                          }`}
                      >
                        {plan.active ? (
                          <>
                            <CheckCircle2 size={13} className="text-emerald-600" />
                            <span>Đang Bán</span>
                          </>
                        ) : (
                          <>
                            <XCircle size={13} className="text-slate-400" />
                            <span>Tạm Ẩn</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(plan)}
                          className="p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer"
                          title="Chỉnh sửa gói"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(plan)}
                          className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                          title="Xóa gói"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL CREATE / EDIT ─────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
                  <Crown size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {editingPlan ? `Chỉnh Sửa Gói: ${editingPlan.name}` : "Thêm Gói VIP Mới"}
                  </h3>
                  <p className="text-xs text-slate-500">Cấu hình giá cước, chu kỳ và quyền lợi chi tiết</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Tên gói */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Tên Gói VIP <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="VD: Gói 6 Tháng VIP"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 font-semibold"
                  />
                </div>

                {/* Slug */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Mã Slug (Không dấu, duy nhất)
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="VD: 6-month, lifetime..."
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Giá bán thực tế */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Giá Bán Thực Tế (VND) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={1000}
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 font-black text-emerald-600"
                  />
                </div>

                {/* Giá gốc niêm yết */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Giá Gốc Niêm Yết Gạch Ngang (VND)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={formData.originalPrice}
                    onChange={(e) => setFormData({ ...formData, originalPrice: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 font-semibold text-slate-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Chu kỳ */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Chu Kỳ Hiển Thị
                  </label>
                  <input
                    type="text"
                    value={formData.period}
                    onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                    placeholder="VD: / tháng, / năm, trọn đời"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                {/* Số ngày hiệu lực */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Thời Hạn (Số Ngày)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.durationDays}
                    onChange={(e) => setFormData({ ...formData, durationDays: Number(e.target.value) })}
                    placeholder="30, 365, 0 = trọn đời"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Nhập 0 nếu là gói Vĩnh Viễn</span>
                </div>

                {/* Thứ tự sắp xếp STT */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Thứ Tự Sắp Xếp (STT)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nhãn Tag */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Nhãn Tag / Huy Hiệu Nổi Bật
                  </label>
                  <input
                    type="text"
                    value={formData.tag}
                    onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                    placeholder="VD: Best-Seller, Tiết Kiệm 65%..."
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                {/* Mô tả ngắn */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Mô Tả Ngắn Gọn
                  </label>
                  <input
                    type="text"
                    value={formData.desc}
                    onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                    placeholder="VD: Tiết kiệm tối đa chi phí cho shop lớn..."
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              </div>

              {/* Toggles: isPopular, active */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={formData.isPopular}
                    onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                  />
                  <span>Đánh dấu là Gói Nổi Bật Nhất (Best-Seller)</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400"
                  />
                  <span>Bật kích hoạt bán ngay</span>
                </label>
              </div>

              {/* Danh sách tính năng (Features Checklist) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 block">
                    Danh Sách Quyền Lợi & Tính Năng Gói
                  </label>
                  <span className="text-[11px] text-slate-400">{featuresList.length} quyền lợi</span>
                </div>

                <div className="space-y-2">
                  {featuresList.map((feature, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 shadow-2xs"
                    >
                      <div className="flex items-center gap-2">
                        <Check size={14} className="text-emerald-500 shrink-0" />
                        <span>{feature}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(idx)}
                        className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Thêm tính năng mới */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newFeatureInput}
                    onChange={(e) => setNewFeatureInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddFeature();
                      }
                    }}
                    placeholder="Nhập quyền lợi mới rồi bấm Thêm..."
                    className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer transition-all shrink-0"
                  >
                    + Thêm Dòng
                  </button>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                >
                  Hủy Bỏ
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs transition-all shadow-md shadow-amber-500/20 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Đang lưu..." : editingPlan ? "Cập Nhật Gói VIP" : "Tạo Gói VIP Mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
