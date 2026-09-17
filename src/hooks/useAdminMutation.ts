"use client";
import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
export function useAdminMutation(onError: (message: string) => void) {
    const router = useRouter();
    const busy = useRef(false);
    const [pending, transition] = useTransition();
    const start = (action: () => void | Promise<void>) => {
        if (busy.current)
            return;
        busy.current = true;
        transition(async () => { try {
            await action();
        }
        catch {
            onError("Không thực hiện được thao tác. Hãy kiểm tra kết nối và thử lại.");
        }
        finally {
            busy.current = false;
            router.refresh();
        } });
    };
    return [pending, start] as const;
}
