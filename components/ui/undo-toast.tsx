"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface UndoToastItem {
  id: string;
  message: string;
  timeoutMs: number;
  actionLabel?: string;
}

interface UndoToastProps {
  item: UndoToastItem | null;
  onUndo: (id: string) => void;
  onTimeout: (id: string) => void;
}

export function UndoToast({ item, onUndo, onTimeout }: UndoToastProps) {
  React.useEffect(() => {
    if (!item) return;
    const timer = setTimeout(() => onTimeout(item.id), item.timeoutMs);
    return () => clearTimeout(timer);
  }, [item, onTimeout]);

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: "spring", stiffness: 380, damping: 26 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md"
        >
          <div className="flex items-center justify-between rounded-2xl bg-black text-white dark:bg-white dark:text-black shadow-xl px-4 py-3">
            <span className="text-sm font-medium">{item.message}</span>
            <button
              type="button"
              onClick={() => onUndo(item.id)}
              className="ml-4 px-3 py-1 rounded-full bg-white/10 dark:bg-black/10 text-white dark:text-black text-sm font-semibold hover:opacity-80 transition"
            >
              {item.actionLabel ?? "Desfazer"}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
