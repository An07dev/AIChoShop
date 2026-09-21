import { adminRouteGuard, requireAdmin } from "@/lib/auth/session";
import { auditOutcome } from "@/lib/auth/audit-operations";
import { readLimitedJson, RequestBodyError } from "@/lib/http/body";
import { classifyDatabaseError, dataErrorResponse, safeOperationMessage } from "@/lib/db-errors";
import { writeVipPlan, removeVipPlan } from "./vip-plan-service";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
export async function mutateVipPlan(req: Request, id: string | null, remove = false) {
    const denial = await adminRouteGuard(req);
    if (denial)
        return denial;
    const operation = `${req.method} /api/vip-plans${id ? '/[id]' : ''}`, admin = await requireAdmin(operation);
    return auditOutcome(admin.id, operation, async () => {
        try {
            const data = remove ? await removeVipPlan(admin.id, id!) : await writeVipPlan(admin.id, id, await readLimitedJson(req, 65536));
            for (const path of ["/admin/vip-plans", "/profile", "/"])
                revalidatePath(path);
            return NextResponse.json({ success: true, data }, { headers: { 'Cache-Control': 'no-store' } });
        }
        catch (error) {
            if (classifyDatabaseError(error))
                return dataErrorResponse(error, operation);
            return NextResponse.json({ success: false, error: safeOperationMessage(error, "Dữ liệu gói VIP không hợp lệ.") }, { status: error instanceof RequestBodyError ? error.status : 400 });
        }
    });
}
