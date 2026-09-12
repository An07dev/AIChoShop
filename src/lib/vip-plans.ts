export interface VipPlanItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice: number;
  period: string;
  durationDays?: number | null;
  desc: string;
  tag?: string | null;
  isPopular: boolean;
  features: string[];
  order: number;
  active: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export const DEFAULT_VIP_PLANS = [
  {
    id: "default-month",
    slug: "month",
    name: "Gói 1 Tháng",
    price: 299000,
    originalPrice: 499000,
    period: "/ tháng",
    durationDays: 30,
    desc: "Trải nghiệm sức mạnh toàn bộ công cụ AI và khóa học",
    tag: "Trải Nghiệm",
    isPopular: false,
    order: 1,
    active: true,
    features: [
      "Không giới hạn 8 công cụ AI bán hàng",
      "Mở khóa toàn bộ 27 video Masterclass",
      "Xuất file Excel tính giá & thuế sàn",
      "Hỗ trợ kỹ thuật viên 1-1 qua Zalo",
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "default-year",
    slug: "year",
    name: "Gói 1 Năm",
    price: 1290000,
    originalPrice: 3588000,
    period: "/ năm",
    durationDays: 365,
    desc: "Tiết kiệm 65%, tặng kèm bộ 100+ Prompt AI bán hàng độc quyền",
    tag: "Tiết Kiệm 65%",
    isPopular: false,
    order: 2,
    active: true,
    features: [
      "Không giới hạn 8 công cụ AI bán hàng",
      "Mở khóa toàn bộ 27 video Masterclass",
      "Xuất file Excel tính giá & thuế sàn",
      "Hỗ trợ kỹ thuật viên 1-1 qua Zalo",
      "Tặng bộ 100+ Prompt AI chốt đơn thực chiến",
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "default-lifetime",
    slug: "lifetime",
    name: "Gói Trọn Đời",
    price: 1990000,
    originalPrice: 4990000,
    period: "trọn đời",
    durationDays: 0,
    desc: "Đầu tư 1 lần – Sở hữu vĩnh viễn, cập nhật miễn phí toàn bộ công cụ mới",
    tag: "Best-Seller - Khuyên Dùng",
    isPopular: true,
    order: 3,
    active: true,
    features: [
      "Không giới hạn 8 công cụ AI bán hàng",
      "Mở khóa toàn bộ 27 video Masterclass",
      "Xuất file Excel tính giá & thuế sàn",
      "Hỗ trợ kỹ thuật viên 1-1 qua Zalo",
      "Cập nhật miễn phí tính năng trọn đời",
      "Đặc quyền tham gia nhóm kín Top Seller",
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
