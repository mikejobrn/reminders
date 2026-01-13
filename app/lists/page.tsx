"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  IoAdd,
  IoListOutline,
  IoCalendarOutline,
  IoFlagOutline,
  IoCheckmarkCircleOutline,
} from "react-icons/io5";
import { ListHeader } from "@/components/ui/list-header";

interface List {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  incompleteCount: number;
  isOwner: boolean;
  role: "viewer" | "editor" | "admin";
}

export default function ListsPage() {
  const [lists, setLists] = useState<List[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewListDialog, setShowNewListDialog] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newListColor, setNewListColor] = useState("#007AFF");
  const [newListIcon, setNewListIcon] = useState("list-outline");
  const router = useRouter();

  // Carregar listas
  useEffect(() => {
    fetchLists();
  }, []);

  const fetchLists = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/lists");

      if (response.status === 401 || response.status === 403) {
        router.replace(`/login?callbackUrl=${encodeURIComponent("/lists")}`);
        return;
      }
      
      if (!response.ok) {
        throw new Error("Erro ao carregar listas");
      }
      
      const data = await response.json();
      setLists(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  // Criar nova lista
  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newListName.trim()) return;
    
    try {
      const response = await fetch("/api/lists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newListName,
          color: newListColor,
          icon: newListIcon,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Erro ao criar lista");
      }
      
      const newList = await response.json();
      setLists([...lists, newList]);
      setNewListName("");
      setShowNewListDialog(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao criar lista");
    }
  };

  // Navegar para lista
  const handleListClick = (listId: string) => {
    router.push(`/lists/${listId}`);
  };

  // Listas inteligentes padrão
  const renderIcon = (icon?: string, color?: string) => {
    const iconColor = color ?? "#007AFF";
    switch (icon) {
      case "calendar-outline":
        return <IoCalendarOutline size={20} color={iconColor} />;
      case "flag-outline":
        return <IoFlagOutline size={20} color={iconColor} />;
      case "checkmark-circle-outline":
        return <IoCheckmarkCircleOutline size={20} color={iconColor} />;
      case "list-outline":
      default:
        return <IoListOutline size={20} color={iconColor} />;
    }
  };

  const smartLists = [
    { id: "today", name: "Hoje", icon: "calendar-outline", color: "#007AFF", count: 0 },
    { id: "scheduled", name: "Agendados", icon: "calendar-outline", color: "#FF3B30", count: 0 },
    { id: "all", name: "Todos", icon: "list-outline", color: "#8E8E93", count: 0 },
    { id: "flagged", name: "Sinalizados", icon: "flag-outline", color: "#FF9500", count: 0 },
    { id: "completed", name: "Concluídos", icon: "checkmark-circle-outline", color: "#8E8E93", count: 0 },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="text-(--color-ios-gray-1) dark:text-(--color-ios-dark-gray-1)">
          Carregando...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="text-(--color-ios-red) p-4 text-center">
          <p className="font-semibold mb-2">Erro ao carregar listas</p>
          <p className="text-sm">{error}</p>
          <button
            onClick={fetchLists}
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
          <div className="flex items-center justify-between">
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
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Listas Inteligentes */}
        <section className="mb-8">
          <h2 className="text-[13px] uppercase font-semibold text-(--color-ios-gray-1) dark:text-(--color-ios-dark-gray-1) mb-3 px-2">
            Listas Inteligentes
          </h2>
          <div className="space-y-2">
            {smartLists.map((list) => (
              <button
                key={list.id}
                onClick={() => handleListClick(list.id)}
                className="w-full bg-(--color-ios-gray-6) dark:bg-(--color-ios-dark-gray-6) hover:bg-(--color-ios-gray-5) dark:hover:bg-(--color-ios-dark-gray-5) rounded-xl px-4 py-3 transition-colors"
              >
                <ListHeader
                  icon={renderIcon(list.icon, list.color)}
                  title={list.name}
                  count={list.count}
                  color={list.color}
                />
              </button>
            ))}
          </div>
        </section>

        {/* Minhas Listas */}
        <section>
          <h2 className="text-[13px] uppercase font-semibold text-(--color-ios-gray-1) dark:text-(--color-ios-dark-gray-1) mb-3 px-2">
            Minhas Listas
          </h2>
          {lists.length === 0 ? (
            <div className="text-center py-12 text-(--color-ios-gray-1) dark:text-(--color-ios-dark-gray-1)">
              <IoListOutline size={48} className="mx-auto mb-4 opacity-50" />
              <p>Nenhuma lista criada</p>
              <p className="text-sm mt-2">Clique em &quot;Nova Lista&quot; para começar</p>
            </div>
          ) : (
            <div className="space-y-2">
              {lists.map((list) => (
                <button
                  key={list.id}
                  onClick={() => handleListClick(list.id)}
                  className="w-full bg-(--color-ios-gray-6) dark:bg-(--color-ios-dark-gray-6) hover:bg-(--color-ios-gray-5) dark:hover:bg-(--color-ios-dark-gray-5) rounded-xl px-4 py-3 transition-colors"
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
                </button>
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
            <form onSubmit={handleCreateList}>
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
                      className={`w-10 h-10 rounded-full border-2 ${
                        newListColor === color
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
                  disabled={!newListName.trim()}
                  className="flex-1 px-4 py-2 rounded-lg bg-(--color-ios-blue) dark:bg-(--color-ios-dark-blue) text-white hover:opacity-80 transition-opacity disabled:opacity-50"
                >
                  Criar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
