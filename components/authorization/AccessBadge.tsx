"use client";

import { ACCESS_LEVEL_CONFIG, type AccessLevel } from "@/types/accessControl";

interface AccessBadgeProps {
  level: AccessLevel;
  showDescription?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function AccessBadge({ level, showDescription = false, size = "md" }: AccessBadgeProps) {
  const config = ACCESS_LEVEL_CONFIG[level] || ACCESS_LEVEL_CONFIG.L0;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm font-bold",
  };

  return (
    <div className="inline-flex flex-col items-start gap-0.5">
      <span
        className={`inline-flex items-center gap-1.5 rounded border font-mono font-semibold uppercase ${config.badgeBg} ${config.badgeBorder} ${config.color} ${sizeClasses[size]}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
        <span>{config.code}: {config.label}</span>
      </span>
      {showDescription && (
        <span className="text-[10px] text-on-surface-variant font-medium">{config.description}</span>
      )}
    </div>
  );
}
