"use client";

import { ReactNode } from "react";
import { CheckboxIOS } from "./checkbox-ios";
import { DateBadge } from "./date-badge";
import { PriorityBadge } from "./priority-badge";

interface TaskCellProps {
  id: string;
  title: string;
  notes?: string;
  completed?: boolean;
  priority?: "none" | "low" | "medium" | "high";
  dueDate?: Date | string;
  color?: string;
  tags?: string[];
  subtaskCount?: number;
  onToggle?: (id: string) => void;
  onClick?: (id: string) => void;
  className?: string;
  children?: ReactNode;
}

export function TaskCell({
  id,
  title,
  notes,
  completed = false,
  priority = "none",
  dueDate,
  color = "var(--color-ios-blue)",
  tags,
  subtaskCount,
  onToggle,
  onClick,
  className = "",
  children,
}: TaskCellProps) {
  const handleCheckboxChange = (checked: boolean) => {
    onToggle?.(id);
  };

  const handleCellClick = () => {
    onClick?.(id);
  };

  return (
    <div
      className={`
        flex items-start gap-3 p-4
        bg-white dark:bg-black
        border-b border-(--color-ios-gray-5) dark:border-(--color-ios-dark-gray-5)
        hover:bg-(--color-ios-gray-6) dark:hover:bg-(--color-ios-dark-gray-5)
        transition-colors duration-150
        cursor-pointer select-none
        min-h-[44px]
        ${className}
      `}
      onClick={handleCellClick}
    >
      {/* Checkbox */}
      <div
        className="flex-shrink-0 mt-0.5"
        onClick={(e) => e.stopPropagation()}
      >
        <CheckboxIOS
          checked={completed}
          onChange={handleCheckboxChange}
          color={color}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Title and Priority */}
        <div className="flex items-center gap-2 mb-1">
          <span
            className={`
              text-[17px] leading-[22px] flex-1
              ${completed
                ? "line-through text-(--color-ios-gray-1) dark:text-(--color-ios-dark-gray-2)"
                : "text-black dark:text-white"
              }
            `}
          >
            {title}
          </span>
          {priority !== "none" && <PriorityBadge priority={priority} />}
        </div>

        {/* Notes */}
        {notes && (
          <p
            className={`
              text-[15px] leading-[20px] mb-2
              ${completed
                ? "text-(--color-ios-gray-2) dark:text-(--color-ios-dark-gray-3)"
                : "text-(--color-ios-gray-1) dark:text-(--color-ios-dark-gray-2)"
              }
            `}
          >
            {notes}
          </p>
        )}

        {/* Metadata row */}
        <div className="flex items-center gap-2 flex-wrap">
          {dueDate && <DateBadge date={dueDate} />}
          
          {tags && tags.length > 0 && (
            <div className="flex gap-1">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[13px] text-(--color-ios-gray-1) dark:text-(--color-ios-dark-gray-2)"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {subtaskCount !== undefined && subtaskCount > 0 && (
            <span className="text-[13px] text-(--color-ios-gray-1) dark:text-(--color-ios-dark-gray-2)">
              {subtaskCount} subtarefa{subtaskCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Children (subtasks) */}
        {children && <div className="mt-2">{children}</div>}
      </div>
    </div>
  );
}
