import { dataErrorResponse } from "@/lib/db-errors";
import { adminRouteGuard } from "@/lib/auth/session";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveVipPlans } from "@/lib/vip-plans-server";
import { mutateVipPlan } from "@/lib/admin/vip-plan-api";
export async function GET(req: Request) { try {
    if (new URL(req.url).searchParams.get('all') === 'true') {
        const denial = await adminRouteGuard(req);
        if (denial)
            return denial;
        return NextResponse.json({ success: true, data: await prisma.vipPlan.findMany({ orderBy: [{ order: 'asc' }, { id: 'asc' }] }) }, { headers: { 'Cache-Control': 'no-store' } });
    }
    return NextResponse.json({ success: true, data: await getActiveVipPlans() }, { headers: { 'Cache-Control': 'no-store' } });
}
catch (error) {
    return dataErrorResponse(error, 'get-vip-plans');
} }
export async function POST(req: Request) { return mutateVipPlan(req, null); }
