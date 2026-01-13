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
    <div
      className={`
        flex items-center justify-between
        px-4 py-3
        border-b border-[--color-ios-gray-5] dark:border-[--color-ios-dark-gray-5]
        bg-white dark:bg-black
        ${className}
      `}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <div
            className="flex items-center justify-center w-8 h-8 rounded-full"
            style={{ backgroundColor: color }}
          >
            {icon}
          </div>
        )}
        <div>
          <h2 className="text-[22px] leading-[28px] font-semibold text-black dark:text-white">
            {title}
          </h2>
          {count !== undefined && (
            <p className="text-[13px] text-[--color-ios-gray-1] dark:text-[--color-ios-dark-gray-2]">
              {count} tarefa{count !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      </div>

      {onMoreClick && (
        <button
          onClick={onMoreClick}
          className="
            p-2 rounded-full
            text-[--color-ios-blue] dark:text-[--color-ios-dark-blue]
            hover:bg-[--color-ios-gray-6] dark:hover:bg-[--color-ios-dark-gray-5]
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
