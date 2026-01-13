"use client";

type PriorityLevel = "none" | "low" | "medium" | "high";

interface PriorityBadgeProps {
  priority: PriorityLevel;
  className?: string;
}

export function PriorityBadge({ priority, className = "" }: PriorityBadgeProps) {
  if (priority === "none") return null;

  const config = {
    low: {
      symbol: "!",
      color: "var(--color-ios-blue)",
      darkColor: "var(--color-ios-dark-blue)",
    },
    medium: {
      symbol: "!!",
      color: "var(--color-ios-orange)",
      darkColor: "var(--color-ios-dark-orange)",
    },
    high: {
      symbol: "!!!",
      color: "var(--color-ios-red)",
      darkColor: "var(--color-ios-dark-red)",
    },
  }[priority];

  return (
    <span
      className={`
        inline-flex items-center justify-center
        px-1.5 py-0.5 rounded
        text-[13px] font-bold leading-none
        min-w-[25px] h-[16px]
        ${className}
      `}
      style={{
        backgroundColor: config.color,
        color: "white",
      }}
      aria-label={`Prioridade ${priority}`}
    >
      {config.symbol}
    </span>
  );
}
