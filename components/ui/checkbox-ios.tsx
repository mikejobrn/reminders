"use client";

import { useState } from "react";

interface CheckboxIOSProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  color?: string;
  disabled?: boolean;
  className?: string;
}

export function CheckboxIOS({
  checked = false,
  onChange,
  color = "var(--color-ios-blue)",
  disabled = false,
  className = "",
}: CheckboxIOSProps) {
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = () => {
    if (disabled) return;
    
    // Haptic feedback
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(10);
    }
    
    onChange?.(!checked);
  };

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={handleClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      className={`
        relative inline-flex items-center justify-center
        w-[22px] h-[22px] rounded-full
        transition-all duration-200 ease-out
        ${isPressed ? "scale-95" : "scale-100"}
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        ${className}
      `}
      style={{
        backgroundColor: checked ? color : "transparent",
        border: checked ? "none" : `2px solid ${color}`,
      }}
    >
      {/* Checkmark */}
      <svg
        viewBox="0 0 12 10"
        fill="none"
        className={`
          w-3 h-3 transition-all duration-200
          ${checked ? "scale-100 opacity-100" : "scale-0 opacity-0"}
        `}
      >
        <path
          d="M1 5L4.5 8.5L11 1.5"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
