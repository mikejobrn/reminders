"use client";

import React from "react";
import { motion, useAnimationControls } from "framer-motion";
import { IoGitMerge, IoTrash, IoArrowUndo } from "react-icons/io5";

interface SwipeableTaskCellProps {
    children: React.ReactNode;
    onCreateSubtask?: () => void;
    onDelete?: () => void;
    confirmBeforeDelete?: boolean;
    completed?: boolean;
}

const COMPLETE_THRESHOLD = 60; // swipe right
const DELETE_THRESHOLD = -80; // swipe left

const haptic = (pattern: number | number[] = 50) => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try {
            navigator.vibrate(pattern as number[]);
        } catch {
            // ignore
        }
    }
};

export function SwipeableTaskCell({
    children,
    onCreateSubtask,
    onDelete,
    confirmBeforeDelete = true,
    completed = false,
}: SwipeableTaskCellProps) {
    const controls = useAnimationControls();
    const [actionArmed, setActionArmed] = React.useState<"createSubtask" | "delete" | null>(null);

    const resetPosition = () =>
        controls.start({ x: 0, transition: { type: "spring", stiffness: 320, damping: 28 } });

    const handleDrag = (_: any, info: { offset: { x: number } }) => {
        const { x } = info.offset;
        if (x > COMPLETE_THRESHOLD && actionArmed !== "createSubtask") {
            setActionArmed("createSubtask");
            haptic();
        } else if (x < DELETE_THRESHOLD && actionArmed !== "delete") {
            setActionArmed("delete");
            haptic();
        } else if (x <= COMPLETE_THRESHOLD && x >= DELETE_THRESHOLD && actionArmed) {
            setActionArmed(null);
        }
    };

    const handleDragEnd = async (_: any, info: { offset: { x: number } }) => {
        const { x } = info.offset;

        if (x > COMPLETE_THRESHOLD && onCreateSubtask) {
            haptic(30);
            onCreateSubtask();
            await resetPosition();
            return;
        }

        if (x < DELETE_THRESHOLD && onDelete) {
            const shouldDelete = confirmBeforeDelete ? window.confirm("Excluir este lembrete?") : true;
            if (shouldDelete) {
                haptic(30);
                onDelete();
                await resetPosition();
                return;
            }
        }

        await resetPosition();
    };

    return (
        <div className="relative group overflow-hidden">
            {/* Left Action (Swipe Right) */}
            <div className="absolute inset-y-0 left-0 w-1/2 bg-(--color-ios-gray-2) dark:bg-(--color-ios-dark-gray-3) flex items-center justify-start px-6 transition-colors duration-200"
                style={{ backgroundColor: actionArmed === "createSubtask" ? "var(--color-ios-blue)" : undefined }}
            >
                <div className={`flex flex-col items-center gap-1 ${actionArmed === "createSubtask" ? "text-white" : "text-white dark:text-black"}`}>
                    <IoGitMerge size={24} />
                    {actionArmed === "createSubtask" && <span className="text-[12px] font-bold">Subtarefa</span>}
                </div>
            </div>

            {/* Right Action (Swipe Left) */}
            <div className="absolute inset-y-0 right-0 w-1/2 bg-(--color-ios-red) flex items-center justify-end px-6">
                <div className="flex flex-col items-center gap-1 text-white">
                    <IoTrash size={24} />
                    {actionArmed === "delete" && <span className="text-[12px] font-bold">Apagar</span>}
                </div>
            </div>

            <motion.div
                drag="x"
                dragConstraints={{ left: -100, right: 100 }}
                dragElastic={0.1}
                onDrag={handleDrag}
                onDragEnd={handleDragEnd}
                animate={controls}
                className="relative z-10 bg-white dark:bg-black"
                style={{ touchAction: "pan-y" }}
            >
                {children}
            </motion.div>
        </div>
    );
}
