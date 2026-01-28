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
        <div className="relative">
            <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none select-none">
                <div className="flex items-center text-(--color-ios-blue) gap-2 opacity-80">
                    <IoGitMerge size={20} />
                    <span className="text-sm font-medium">Criar Subtarefa</span>
                </div>
                <div className="flex items-center text-(--color-ios-red) gap-2 opacity-80">
                    <span className="text-sm font-medium">Apagar</span>
                    <IoTrash size={20} />
                </div>
            </div>

            <motion.div
                drag="x"
                dragConstraints={{ left: -160, right: 160 }}
                dragElastic={0.2}
                onDrag={handleDrag}
                onDragEnd={handleDragEnd}
                animate={controls}
                className="relative z-10"
                style={{ touchAction: "pan-y" }}
            >
                {children}
            </motion.div>
        </div>
    );
}
