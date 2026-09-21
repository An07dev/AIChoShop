"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { usePathname } from "next/navigation";

interface SidebarContextType {
  isMobileOpen: boolean;
  toggleMobile: () => void;
  closeMobile: () => void;
  openMobile: () => void;
}

const SidebarContext = createContext<SidebarContextType>({
  isMobileOpen: false,
  toggleMobile: () => {},
  closeMobile: () => {},
  openMobile: () => {},
});

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  // Tự động đóng sidebar mobile khi điều hướng sang trang khác
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Ngăn chặn cuộn trang phía sau khi mở sidebar trên mobile
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileOpen]);

  const toggleMobile = () => setIsMobileOpen((prev) => !prev);
  const closeMobile = () => setIsMobileOpen(false);
  const openMobile = () => setIsMobileOpen(true);

  return (
    <SidebarContext.Provider
      value={{
        isMobileOpen,
        toggleMobile,
        closeMobile,
        openMobile,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}
