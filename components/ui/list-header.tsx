"use client";

import { ReactNode } from "react";
import { IoEllipsisHorizontal } from "react-icons/io5";

interface ListHeaderProps {
  title: string;
  count?: number;
  color?: string;
  icon?: ReactNode;
  onMoreClick?: () => void;
  className?: string;
}

export function ListHeader({
  title,
  count,
  color = "var(--color-ios-blue)",
  icon,
  onMoreClick,
  className = "",
}: ListHeaderProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {icon && (
          <div
            className="flex items-center justify-center w-9 h-9 rounded-full shrink-0 text-white"
            style={{ backgroundColor: color }}
          >
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[17px] leading-[22px] font-semibold text-black dark:text-white truncate">
              {title}
            </h2>
            {count !== undefined && (
              <span
                className="shrink-0 tabular-nums text-[13px] leading-[18px] px-2 py-0.5 rounded-full bg-(--color-ios-gray-5) dark:bg-(--color-ios-dark-gray-5) text-(--color-ios-gray-1) dark:text-(--color-ios-dark-gray-1)"
                aria-label={`${count} tarefa${count !== 1 ? "s" : ""}`}
              >
                {count}
              </span>
            )}
          </div>
        </div>
      </div>

      {onMoreClick && (
        <button
          onClick={onMoreClick}
          className="
            p-2 rounded-full
            text-(--color-ios-blue) dark:text-(--color-ios-dark-blue)
            hover:bg-(--color-ios-gray-6) dark:hover:bg-(--color-ios-dark-gray-5)
            transition-colors duration-150
          "
          aria-label="Mais opções"
        >
          <IoEllipsisHorizontal size={24} />
        </button>
      )}
    </div>
  );
}
