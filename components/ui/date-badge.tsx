"use client";

import { useMemo } from "react";

interface DateBadgeProps {
  date: Date | string;
  className?: string;
  showTime?: boolean;
}

export function DateBadge({ date, className = "", showTime = false }: DateBadgeProps) {
  const dateObj = useMemo(() => {
    return typeof date === "string" ? new Date(date) : date;
  }, [date]);

  const { label, colorClass, bgColorVar, textColorVar } = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const targetDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
    
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Today
    if (diffDays === 0) {
      return {
        label: showTime ? `Hoje às ${formatTime(dateObj)}` : "Hoje",
        colorClass: "bg-[--color-ios-blue] dark:bg-[--color-ios-dark-blue]",
        bgColorVar: "var(--color-ios-blue)",
        textColorVar: "white",
      };
    }
    
    // Tomorrow
    if (diffDays === 1) {
      return {
        label: showTime ? `Amanhã às ${formatTime(dateObj)}` : "Amanhã",
        colorClass: "bg-[--color-ios-orange] dark:bg-[--color-ios-dark-orange]",
        bgColorVar: "var(--color-ios-orange)",
        textColorVar: "white",
      };
    }
    
    // Yesterday or overdue
    if (diffDays < 0) {
      const daysAgo = Math.abs(diffDays);
      return {
        label: daysAgo === 1 ? "Ontem" : formatDate(dateObj),
        colorClass: "bg-[--color-ios-red] dark:bg-[--color-ios-dark-red]",
        bgColorVar: "var(--color-ios-red)",
        textColorVar: "white",
      };
    }
    
    // Future dates
    return {
      label: formatDate(dateObj, showTime),
      colorClass: "bg-transparent",
      bgColorVar: "transparent",
      textColorVar: "var(--color-ios-gray-1)",
    };
  }, [dateObj, showTime]);

  return (
    <span
      className={`
        inline-flex items-center justify-center
        px-2 py-0.5 rounded-full
        text-[13px] font-semibold leading-tight
        ${colorClass}
        ${className}
      `}
      style={{
        backgroundColor: bgColorVar,
        color: textColorVar,
      }}
    >
      {label}
    </span>
  );
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(date: Date, withTime = false): string {
  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
  };
  
  const formatted = date.toLocaleDateString("pt-BR", options);
  
  if (withTime) {
    return `${formatted} às ${formatTime(date)}`;
  }
  
  return formatted;
}
