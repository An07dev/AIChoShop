"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemeMode = "light" | "dark";
export type ThemeColor = "blue" | "emerald" | "purple" | "amber" | "rose";

export interface ThemeColorOption {
  id: ThemeColor;
  name: string;
  colorHex: string;
  gradientClass: string;
  previewBg: string;
  desc: string;
}

export const THEME_COLOR_OPTIONS: ThemeColorOption[] = [
  {
    id: "blue",
    name: "Xanh Dương (Ocean)",
    colorHex: "#2563eb",
    gradientClass: "from-blue-600 to-indigo-600",
    previewBg: "bg-blue-600",
    desc: "Màu xanh công nghệ hiện đại, tin cậy (Mặc định)",
  },
  {
    id: "emerald",
    name: "Xanh Ngọc (Emerald)",
    colorHex: "#059669",
    gradientClass: "from-emerald-600 to-teal-600",
    previewBg: "bg-emerald-600",
    desc: "Màu xanh ngọc phong thủy tài lộc, phát triển",
  },
  {
    id: "purple",
    name: "Tím Hoàng Gia (Purple)",
    colorHex: "#7c3aed",
    gradientClass: "from-purple-600 to-violet-700",
    previewBg: "bg-purple-600",
    desc: "Màu tím sang trọng, quyền quý, sáng tạo",
  },
  {
    id: "amber",
    name: "Cam Hổ Phách (Amber)",
    colorHex: "#d97706",
    gradientClass: "from-amber-500 to-yellow-600",
    previewBg: "bg-amber-500",
    desc: "Màu cam vàng ấm áp, tràn đầy năng lượng chốt đơn",
  },
  {
    id: "rose",
    name: "Đỏ Ruby (Rose)",
    colorHex: "#e11d48",
    gradientClass: "from-rose-600 to-pink-600",
    previewBg: "bg-rose-600",
    desc: "Màu đỏ quyến rũ, nhiệt huyết và may mắn",
  },
];

interface ThemeContextType {
  themeMode: ThemeMode;
  themeColor: ThemeColor;
  setThemeMode: (mode: ThemeMode) => void;
  setThemeColor: (color: ThemeColor) => void;
  toggleThemeMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>("light");
  const [themeColor, setThemeColorState] = useState<ThemeColor>("blue");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // 1. Đọc từ localStorage khi client hydrate
    try {
      const savedMode = localStorage.getItem("aicho_theme_mode") as ThemeMode | null;
      const savedColor = localStorage.getItem("aicho_theme_color") as ThemeColor | null;

      if (savedMode === "dark" || savedMode === "light") {
        setThemeModeState(savedMode);
        applyModeToDom(savedMode);
      } else {
        // Kiểm tra cài đặt hệ điều hành
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const initialMode = prefersDark ? "dark" : "light";
        setThemeModeState(initialMode);
        applyModeToDom(initialMode);
      }

      if (savedColor && THEME_COLOR_OPTIONS.some((c) => c.id === savedColor)) {
        setThemeColorState(savedColor);
        applyColorToDom(savedColor);
      } else {
        applyColorToDom("blue");
      }
    } catch (e) {
      console.warn("Could not load theme from localStorage", e);
    }
    setMounted(true);
  }, []);

  const applyModeToDom = (mode: ThemeMode) => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (mode === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  };

  const applyColorToDom = (color: ThemeColor) => {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute("data-theme-color", color);
  };

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    applyModeToDom(mode);
    try {
      localStorage.setItem("aicho_theme_mode", mode);
    } catch (e) {
      console.warn("Could not save theme mode to localStorage", e);
    }
  };

  const setThemeColor = (color: ThemeColor) => {
    setThemeColorState(color);
    applyColorToDom(color);
    try {
      localStorage.setItem("aicho_theme_color", color);
    } catch (e) {
      console.warn("Could not save theme color to localStorage", e);
    }
  };

  const toggleThemeMode = () => {
    setThemeMode(themeMode === "dark" ? "light" : "dark");
  };

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        themeColor,
        setThemeMode,
        setThemeColor,
        toggleThemeMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
