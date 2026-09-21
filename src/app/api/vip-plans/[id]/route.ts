import { dataErrorResponse } from "@/lib/db-errors";
import { adminRouteGuard } from "@/lib/auth/session";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mutateVipPlan } from "@/lib/admin/vip-plan-api";
type Params = {
    params: Promise<{
        id: string;
    }>;
};
export async function GET(req: Request, { params }: Params) { try {
    const { id } = await params;
    const plan = await prisma.vipPlan.findFirst({ where: { OR: [{ id }, { slug: id }] } });
    if (!plan || (!plan.active && await adminRouteGuard(req)))
        return NextResponse.json({ success: false, error: 'Không tìm thấy gói VIP' }, { status: 404 });
    return NextResponse.json({ success: true, data: plan }, { headers: { 'Cache-Control': 'no-store' } });
}
catch (error) {
    return dataErrorResponse(error, 'get-vip-plan');
} }
export async function PUT(req: Request, { params }: Params) { return mutateVipPlan(req, (await params).id); }
export async function PATCH(req: Request, { params }: Params) { return mutateVipPlan(req, (await params).id); }
export async function DELETE(req: Request, { params }: Params) { return mutateVipPlan(req, (await params).id, true); }
