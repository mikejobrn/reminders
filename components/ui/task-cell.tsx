"use client";

import React, { ReactNode, useEffect, useRef } from "react";
import { CheckboxIOS } from "./checkbox-ios";
import { DateBadge } from "./date-badge";
import { PriorityBadge } from "./priority-badge";
import { IoInformationCircleOutline, IoFlag } from "react-icons/io5";

interface TaskCellProps {
  id: string;
  title: string;
  notes?: string;
  completed?: boolean;
  priority?: "none" | "low" | "medium" | "high";
  flagged?: boolean;
  dueDate?: Date | string;
  color?: string;
  tags?: Array<{ id: string; name: string; color: string }>;
  subtaskCount?: number;
  onToggle?: (id: string) => void;
  // onClick: id, optional mouse event, optional caret position when clicking inside title
  onClick?: (id: string, e?: React.MouseEvent, caretPos?: number) => void;
  onInfoClick?: (id: string) => void;
  isEditing?: boolean;
  editValue?: string;
  onEditChange?: (value: string) => void;
  onEditSubmit?: () => void;
  onEditCancel?: () => void;
  onEnterPress?: (id: string) => void; // when Enter is pressed while not editing
  canEdit?: boolean;
  // initial caret position when entering edit mode
  initialCaretPos?: number | null;
  className?: string;
  children?: ReactNode;
}

export function TaskCell({
  id,
  title,
  notes,
  completed = false,
  priority = "none",
  flagged = false,
  dueDate,
  color = "var(--color-ios-blue)",
  tags,
  subtaskCount,
  onToggle,
  onClick,
  onInfoClick,
  isEditing = false,
  editValue,
  onEditChange,
  onEditSubmit,
  onEditCancel,
  onEnterPress,
  canEdit = true,
  initialCaretPos = null,
  className = "",
  children,
}: TaskCellProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isEditing) return;
    const el = inputRef.current;
    if (!el) return;

    const timeout = setTimeout(() => {
      el.focus();
      el.click();
      const val = el.value ?? "";
      if (typeof initialCaretPos === "number" && initialCaretPos >= 0) {
        const pos = Math.min(initialCaretPos, val.length);
        el.setSelectionRange(pos, pos);
      } else {
        const len = val.length;
        el.setSelectionRange(len, len);
      }
    }, 50);

    return () => clearTimeout(timeout);
  }, [isEditing, initialCaretPos]);

  const handleCheckboxChange = (checked: boolean) => {
    if (!canEdit) return;
    onToggle?.(id);
  };

  const handleCellClick = (e: React.MouseEvent) => {
    if (!canEdit) return;
    // ignore clicks in action buttons; input will stop propagation itself
    const target = e.target as HTMLElement;
    if (target.closest("button")) return;
    onClick?.(id, e, undefined);
  };

  const handleContainerKeyDown = (e: React.KeyboardEvent) => {
    if (!canEdit) return;
    if (isEditing) return;
    if (e.key === "Enter") {
      e.preventDefault();
      // Se tem onEnterPress, chama ele (para criar novo item); senão, entra em edição
      if (onEnterPress) {
        onEnterPress(id);
      } else {
        onClick?.(id);
      }
    } else if (e.key === " ") {
      e.preventDefault();
      onClick?.(id);
    }
  };

  return (
    <div
      className={
        `group flex items-start gap-3 p-4
        bg-white dark:bg-black
        border-b border-(--color-ios-gray-5) dark:border-(--color-ios-dark-gray-5)
        hover:bg-(--color-ios-gray-6) dark:hover:bg-(--color-ios-dark-gray-5)
        transition-colors duration-150
        ${canEdit ? "cursor-pointer" : "cursor-default"} select-none
        min-h-[44px]
        ${className}`
      }
      onClick={handleCellClick}
      onKeyDown={handleContainerKeyDown}
      tabIndex={canEdit ? 0 : -1}
      role={canEdit ? "button" : undefined}
      aria-label={canEdit ? "Editar título da tarefa" : "Tarefa"}
    >
      <div className="flex-shrink-0 mt-0.5" onClick={(e) => e.stopPropagation()}>
        <CheckboxIOS checked={completed} onChange={handleCheckboxChange} color={color} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <input
            ref={inputRef}
            value={isEditing ? (editValue ?? title) : title}
            readOnly={!isEditing}
            inputMode="text"
            onChange={(e) => onEditChange?.(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onMouseUp={(e) => {
              e.stopPropagation();
              if (!isEditing && canEdit) {
                const pos = inputRef.current?.selectionStart ?? undefined;
                onClick?.(id, e as React.MouseEvent, pos);
              }
            }}
            disabled={!canEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (isEditing) {
                  onEditSubmit?.();
                } else if (onEnterPress) {
                  onEnterPress(id);
                } else {
                  onClick?.(id);
                }
              }
              if (e.key === "Escape") {
                e.preventDefault();
                if (isEditing) {
                  onEditCancel?.();
                }
              }
            }}
            onBlur={() => onEditSubmit?.()}
            className={
              `w-full bg-transparent text-[17px] leading-[22px] outline-none border-none disabled:opacity-60 flex-1 ` +
              (completed
                ? "line-through text-(--color-ios-gray-1) dark:text-(--color-ios-dark-gray-2)"
                : "te8t-black dark:text-white")
            }
            aria-label="Título da tarefa"
          />
          {flagged && (
            <IoFlag
              size={14}
              className="text-(--color-ios-orange) dark:text-(--color-ios-dark-orange) flex-shrink-0"
            />
          )}
          {priority !== "none" && <PriorityBadge priority={priority} />}
        </div>

        {notes && (
          <p
            className={
              `text-[15px] leading-[20px] mb-2 ` +
              (completed
                ? "text-(--color-ios-gray-2) dark:text-(--color-ios-dark-gray-3)"
                : "text-(--color-ios-gray-1) dark:text-(--color-ios-dark-gray-2)")
            }
          >
            {notes}
          </p>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          {dueDate && <DateBadge date={dueDate} />}

          {tags && tags.length > 0 && (
            <div className="flex gap-1.5 items-center">
              {tags.map((tag) => (
                <div
                  key={tag.id}
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: tag.color || "#8E8E93" }}
                  title={tag.name}
                />
              ))}
            </div>
          )}

          {subtaskCount !== undefined && subtaskCount > 0 && (
            <span className="text-[13px] text-(--color-ios-gray-1) dark:text-(--color-ios-dark-gray-2)">
              {subtaskCount} subtarefa{subtaskCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {children && <div className="mt-2">{children}</div>}
      </div>

      <div className="flex-shrink-0">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (!canEdit) return;
            onInfoClick?.(id);
          }}
          disabled={!canEdit}
          className={
            `p-1 rounded-full transition-opacity ` +
            `opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus:opacity-100 ` +
            `hover:bg-(--color-ios-gray-6) dark:hover:bg-(--color-ios-dark-gray-5) ` +
            `disabled:opacity-30 disabled:cursor-not-allowed`
          }
          aria-label="Detalhes"
        >
          <IoInformationCircleOutline size={22} className="text-(--color-ios-blue) dark:text-(--color-ios-dark-blue)" />
        </button>
      </div>
    </div>
  );
}
