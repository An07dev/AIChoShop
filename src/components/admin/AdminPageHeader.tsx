import React from "react";

export interface AdminPageHeaderProps {
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  iconGradient?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function AdminPageHeader({
  title,
  subtitle,
  icon: Icon,
  iconGradient = "from-blue-600 to-indigo-600",
  badge,
  actions,
  className = "",
}: AdminPageHeaderProps) {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-3.5 shrink-0 ${className}`}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <div
          className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br ${iconGradient} text-white flex items-center justify-center shadow-md shadow-blue-600/15 shrink-0`}
        >
          <Icon size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 tracking-tight">
              {title}
            </h1>
            {badge}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 line-clamp-2 font-normal">
            {subtitle}
          </p>
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
          {actions}
        </div>
      )}
    </div>
  );
}
