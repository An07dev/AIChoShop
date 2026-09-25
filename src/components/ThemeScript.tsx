"use client";

import { useServerInsertedHTML } from "next/navigation";

const THEME_SCRIPT = `
try {
  var p = window.location.pathname;
  var isExempt = p === '/' || p.indexOf('/admin') === 0;
  if (!isExempt) {
    var m = localStorage.getItem('aicho_theme_mode');
    var c = localStorage.getItem('aicho_theme_color');
    if (m === 'dark' || (!m && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    if (c) {
      document.documentElement.setAttribute('data-theme-color', c);
    } else {
      document.documentElement.setAttribute('data-theme-color', 'blue');
    }
  } else {
    document.documentElement.classList.remove('dark');
    document.documentElement.setAttribute('data-theme-color', 'blue');
  }
} catch(e) {}
`;

export function ThemeScript() {
  useServerInsertedHTML(() => (
    <script
      key="theme-initializer"
      dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }}
    />
  ));
  return null;
}
