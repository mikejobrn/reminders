"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface UserPreferences {
    completedPosition: "MOVE_TO_BOTTOM" | "KEEP_IN_PLACE";
    completedVisibility: "SHOW_TODAY_ONLY" | "HIDE" | "SHOW_ALL";
    undoTimeoutSeconds: number;
    confirmBeforeDelete: boolean;
}

const DEFAULT_PREFERENCES: UserPreferences = {
    completedPosition: "MOVE_TO_BOTTOM",
    completedVisibility: "SHOW_TODAY_ONLY",
    undoTimeoutSeconds: 5,
    confirmBeforeDelete: true,
};

async function fetchPreferences(): Promise<UserPreferences> {
    const res = await fetch("/api/user/preferences");
    if (!res.ok) throw new Error("Erro ao carregar preferências");
    return res.json();
}

async function savePreferences(prefs: Partial<UserPreferences>): Promise<UserPreferences> {
    const res = await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
    });
    if (!res.ok) throw new Error("Erro ao salvar preferências");
    return res.json();
}

export default function SettingsPage() {
    const router = useRouter();
    const queryClient = useQueryClient();

    const { data: prefs = DEFAULT_PREFERENCES, isLoading } = useQuery({
        queryKey: ["preferences"],
        queryFn: fetchPreferences,
        staleTime: Infinity,
    });

    const saveMutation = useMutation({
        mutationFn: (data: Partial<UserPreferences>) => savePreferences(data),
        onMutate: async (data) => {
            const previous = queryClient.getQueryData<UserPreferences>(["preferences"]);
            queryClient.setQueryData(["preferences"], { ...prefs, ...data });
            return { previous };
        },
        onError: (_error, _variables, context) => {
            if (context?.previous) {
                queryClient.setQueryData(["preferences"], context.previous);
            }
            alert("Não foi possível salvar. Tente novamente.");
        },
        onSuccess: (updated) => {
            queryClient.setQueryData(["preferences"], updated);
        },
    });

    const handleChange = (data: Partial<UserPreferences>) => {
        saveMutation.mutate(data);
    };

    const visibility = prefs.completedVisibility;
    const positionDisabled = visibility === "HIDE";

    return (
        <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
            <div className="max-w-3xl mx-auto px-4 py-6">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-[28px] font-bold">Configurações</h1>
                    <button
                        onClick={() => router.back()}
                        className="px-4 py-2 rounded-full bg-(--color-ios-gray-6) dark:bg-(--color-ios-dark-gray-6) hover:opacity-80"
                    >
                        Voltar
                    </button>
                </div>

                {isLoading ? (
                    <p className="text-(--color-ios-gray-1)">Carregando preferências...</p>
                ) : (
                    <div className="space-y-8">
                        <section className="space-y-3">
                            <h2 className="text-[17px] font-semibold">Visibilidade de Tarefas Concluídas</h2>
                            <div className="space-y-2">
                                {[
                                    { value: "SHOW_TODAY_ONLY", label: "Apenas as concluídas hoje" },
                                    { value: "SHOW_ALL", label: "Mostrar todas as concluídas" },
                                    { value: "HIDE", label: "Ocultar todas as concluídas" },
                                ].map((opt) => (
                                    <label key={opt.value} className="flex items-center gap-3 p-3 rounded-xl bg-(--color-ios-gray-6) dark:bg-(--color-ios-dark-gray-6)">
                                        <input
                                            type="radio"
                                            name="completedVisibility"
                                            value={opt.value}
                                            checked={prefs.completedVisibility === opt.value}
                                            onChange={() => handleChange({ completedVisibility: opt.value as UserPreferences["completedVisibility"] })}
                                        />
                                        <span>{opt.label}</span>
                                    </label>
                                ))}
                            </div>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-[17px] font-semibold">Posição de Tarefas Concluídas</h2>
                            <div className="space-y-2">
                                {[
                                    { value: "MOVE_TO_BOTTOM", label: "Mover para o final" },
                                    { value: "KEEP_IN_PLACE", label: "Manter na mesma posição" },
                                ].map((opt) => (
                                    <label key={opt.value} className={`flex items-center gap-3 p-3 rounded-xl bg-(--color-ios-gray-6) dark:bg-(--color-ios-dark-gray-6) ${positionDisabled ? "opacity-50" : ""}`}>
                                        <input
                                            type="radio"
                                            name="completedPosition"
                                            value={opt.value}
                                            disabled={positionDisabled}
                                            checked={prefs.completedPosition === opt.value}
                                            onChange={() => handleChange({ completedPosition: opt.value as UserPreferences["completedPosition"] })}
                                        />
                                        <span>{opt.label}</span>
                                    </label>
                                ))}
                            </div>
                            {positionDisabled && (
                                <p className="text-sm text-(--color-ios-gray-1)">Ative a visibilidade de concluídas para alterar a posição.</p>
                            )}
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-[17px] font-semibold">Tempo para desfazer</h2>
                            <div className="flex items-center gap-3">
                                <input
                                    type="range"
                                    min={3}
                                    max={10}
                                    value={prefs.undoTimeoutSeconds}
                                    onChange={(e) => handleChange({ undoTimeoutSeconds: Number(e.target.value) })}
                                    className="flex-1"
                                />
                                <span className="text-[15px] w-12 text-right">{prefs.undoTimeoutSeconds}s</span>
                            </div>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-[17px] font-semibold">Confirmação</h2>
                            <label className="flex items-center gap-3 p-3 rounded-xl bg-(--color-ios-gray-6) dark:bg-(--color-ios-dark-gray-6)">
                                <input
                                    type="checkbox"
                                    checked={prefs.confirmBeforeDelete}
                                    onChange={(e) => handleChange({ confirmBeforeDelete: e.target.checked })}
                                />
                                <span>Confirmar antes de excluir (swipe requer arrastar 80px)</span>
                            </label>
                        </section>
                    </div>
                )}
            </div>
        </div>
    );
}
