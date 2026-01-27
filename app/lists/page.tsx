"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  IoAdd,
  IoListOutline,
  IoCalendarOutline,
  IoFlagOutline,
  IoCheckmarkCircleOutline,
} from "react-icons/io5";
import { ListHeader } from "@/components/ui/list-header";
import { SyncIndicator } from "@/components/ui/sync-indicator";

interface List {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  incompleteCount: number;
  isOwner: boolean;
  role: "viewer" | "editor" | "admin";
}

async function fetchLists(): Promise<List[]> {
  const response = await fetch("/api/lists");

  if (response.status === 401 || response.status === 403) {
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    throw new Error("Erro ao carregar listas");
  }

  return response.json();
}

async function fetchSmartLists(): Promise<Array<{ id: string; name: string; icon: string; color: string; count: number }>> {
  const response = await fetch("/api/smart-lists");

  if (response.status === 401 || response.status === 403) {
    return [];
  }

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

async function createList(data: { name: string; color: string; icon: string }): Promise<List> {
  const response = await fetch("/api/lists", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Erro ao criar lista");
  }

  return response.json();
}

export default function ListsPage() {
  const [showNewListDialog, setShowNewListDialog] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newListColor, setNewListColor] = useState("#007AFF");
  const [newListIcon, setNewListIcon] = useState("list-outline");
  const router = useRouter();
  const queryClient = useQueryClient();

  // Queries
  const { data: lists = [], isLoading: listsLoading, error: listsError, refetch: refetchLists } = useQuery({
    queryKey: ["lists"],
    queryFn: fetchLists,
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message === "Unauthorized") {
        router.replace(`/login?callbackUrl=${encodeURIComponent("/lists")}`);
        return false;
      }
      return failureCount < 3;
    },
  });

  const { data: smartLists = [], isLoading: smartListsLoading } = useQuery({
    queryKey: ["smart-lists"],
    queryFn: fetchSmartLists,
  });

  // Mutation para criar lista
  const { mutate: handleCreateListMutation, isPending: isCreating } = useMutation({
    mutationFn: (data: { name: string; color: string; icon: string }) => createList(data),
    onSuccess: (newList) => {
      queryClient.setQueryData(["lists"], (old: List[] = []) => [...old, newList]);
      setShowNewListDialog(false);
      setNewListName("");
      setNewListColor("#007AFF");
      setNewListIcon("list-outline");
    },
    onError: (error) => {
      alert(error instanceof Error ? error.message : "Erro ao criar lista");
    },
  });

  const handleSubmitCreateList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;

    handleCreateListMutation({
      name: newListName,
      color: newListColor,
      icon: newListIcon,
    });
  };

  // Renderizar ícone
  const renderIcon = (icon?: string, color?: string) => {
    switch (icon) {
      case "calendar-outline":
        return <IoCalendarOutline size={20} />;
      case "flag-outline":
        return <IoFlagOutline size={20} />;
      case "checkmark-circle-outline":
        return <IoCheckmarkCircleOutline size={20} />;
      case "list-outline":
      default:
        return <IoListOutline size={20} />;
    }
  };

  const fallbackSmartLists = [
    { id: "today", name: "Hoje", icon: "calendar-outline", color: "#007AFF", count: 0 },
    { id: "scheduled", name: "Agendados", icon: "calendar-outline", color: "#FF3B30", count: 0 },
    { id: "all", name: "Todos", icon: "list-outline", color: "#8E8E93", count: 0 },
    { id: "flagged", name: "Sinalizados", icon: "flag-outline", color: "#FF9500", count: 0 },
    { id: "completed", name: "Concluídos", icon: "checkmark-circle-outline", color: "#8E8E93", count: 0 },
  ];

  const effectiveSmartLists = smartLists.length > 0 ? smartLists : fallbackSmartLists;

  if (listsError && listsError instanceof Error && listsError.message !== "Unauthorized") {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="text-(--color-ios-red) p-4 text-center">
          <p className="font-semibold mb-2">Erro ao carregar listas</p>
          <p className="text-sm">{listsError.message}</p>
          <button
            onClick={() => refetchLists()}
            className="mt-4 px-4 py-2 bg-(--color-ios-blue) dark:bg-(--color-ios-dark-blue) text-white rounded-lg"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-black border-b border-(--color-ios-gray-6) dark:border-(--color-ios-dark-gray-6)">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-[34px] font-bold text-black dark:text-white">
              Listas
            </h1>
            <button
              onClick={() => setShowNewListDialog(true)}
              className="flex items-center gap-2 px-4 py-2 bg-(--color-ios-blue) dark:bg-(--color-ios-dark-blue) text-white rounded-lg hover:opacity-80 transition-opacity"
            >
              <IoAdd size={20} />
              <span>Nova Lista</span>
            </button>
          </div>
          <SyncIndicator />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Listas Inteligentes */}
        <section className="mb-8">
          <h2 className="text-[13px] uppercase font-semibold text-(--color-ios-gray-1) dark:text-(--color-ios-dark-gray-1) mb-3 px-2">
            Listas Inteligentes
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {effectiveSmartLists.map((list) => (
              <Link
                key={list.id}
                href={`/lists/${list.id}`}
                prefetch
                className="text-left rounded-2xl p-4 bg-(--color-ios-gray-6) dark:bg-(--color-ios-dark-gray-6) hover:bg-(--color-ios-gray-5) dark:hover:bg-(--color-ios-dark-gray-5) transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className="flex items-center justify-center w-10 h-10 rounded-full text-white shrink-0"
                    style={{ backgroundColor: list.color }}
                    aria-hidden
                  >
                    {renderIcon(list.icon, list.color)}
                  </div>
                  <div className="tabular-nums text-[22px] leading-[28px] font-semibold text-black dark:text-white">
                    {list.count}
                  </div>
                </div>
                <div className="mt-2 text-[17px] leading-[22px] font-semibold text-black dark:text-white truncate">
                  {list.name}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Minhas Listas */}
        <section>
          <h2 className="text-[13px] uppercase font-semibold text-(--color-ios-gray-1) dark:text-(--color-ios-dark-gray-1) mb-3 px-2">
            Minhas Listas
          </h2>
          {listsLoading ? (
            <div className="text-center py-12 text-(--color-ios-gray-1) dark:text-(--color-ios-dark-gray-1)">
              <p>Carregando listas...</p>
            </div>
          ) : lists.length === 0 ? (
            <div className="text-center py-12 text-(--color-ios-gray-1) dark:text-(--color-ios-dark-gray-1)">
              <IoListOutline size={48} className="mx-auto mb-4 opacity-50" />
              <p>Nenhuma lista criada</p>
              <p className="text-sm mt-2">Clique em &quot;Nova Lista&quot; para começar</p>
            </div>
          ) : (
            <div className="space-y-2">
              {lists.map((list) => (
                <Link
                  key={list.id}
                  href={`/lists/${list.id}`}
                  prefetch
                  className="block bg-(--color-ios-gray-6) dark:bg-(--color-ios-dark-gray-6) hover:bg-(--color-ios-gray-5) dark:hover:bg-(--color-ios-dark-gray-5) rounded-xl px-4 py-3 transition-colors"
                >
                  <ListHeader
                    icon={renderIcon(list.icon || "list-outline", list.color)}
                    title={list.name}
                    count={list.incompleteCount}
                    color={list.color || "#007AFF"}
                  />
                  {!list.isOwner && (
                    <div className="mt-1 pl-12 text-xs text-(--color-ios-gray-1) dark:text-(--color-ios-dark-gray-1)">
                      Compartilhada • {list.role === "viewer" ? "Visualizador" : list.role === "editor" ? "Editor" : "Admin"}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Dialog Nova Lista */}
      {showNewListDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-(--color-ios-dark-gray-6) rounded-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-black dark:text-white">
              Nova Lista
            </h2>
            <form onSubmit={handleSubmitCreateList}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-black dark:text-white">
                  Nome
                </label>
                <input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="Nome da lista"
                  className="w-full px-4 py-2 rounded-lg bg-(--color-ios-gray-6) dark:bg-(--color-ios-dark-gray-5) text-black dark:text-white border-none focus:ring-2 focus:ring-(--color-ios-blue)"
                  autoFocus
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2 text-black dark:text-white">
                  Cor
                </label>
                <div className="flex gap-2">
                  {[
                    "#007AFF", // Blue
                    "#FF3B30", // Red
                    "#FF9500", // Orange
                    "#FFCC00", // Yellow
                    "#34C759", // Green
                    "#5AC8FA", // Light Blue
                    "#AF52DE", // Purple
                    "#FF2D55", // Pink
                  ].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewListColor(color)}
                      className={`w-10 h-10 rounded-full border-2 ${newListColor === color
                          ? "border-black dark:border-white"
                          : "border-transparent"
                        }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewListDialog(false);
                    setNewListName("");
                  }}
                  className="flex-1 px-4 py-2 rounded-lg bg-(--color-ios-gray-6) dark:bg-(--color-ios-dark-gray-5) text-black dark:text-white hover:opacity-80 transition-opacity"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!newListName.trim() || isCreating}
                  className="flex-1 px-4 py-2 rounded-lg bg-(--color-ios-blue) dark:bg-(--color-ios-dark-blue) text-white hover:opacity-80 transition-opacity disabled:opacity-50"
                >
                  {isCreating ? "Criando..." : "Criar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}