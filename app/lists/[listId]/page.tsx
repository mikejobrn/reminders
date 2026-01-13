"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { IoChevronBack, IoAdd, IoEllipsisHorizontal } from "react-icons/io5";
import { TaskCell } from "@/components/ui/task-cell";
import { CheckboxIOS } from "@/components/ui/checkbox-ios";

interface Reminder {
  id: string;
  title: string;
  notes?: string;
  isCompleted: boolean;
  priority: number;
  flagged: boolean;
  utcDatetime?: string;
  timezone?: string;
  isFloating: boolean;
  isDateOnly: boolean;
  tags: Array<{
    tag: {
      id: string;
      name: string;
      color: string;
    };
  }>;
  _count: {
    children: number;
    attachments: number;
  };
}

interface List {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  incompleteCount: number;
}

export default function ListDetailPage({
  params,
}: {
  params: { listId: string };
}) {
  const [list, setList] = useState<List | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewReminderDialog, setShowNewReminderDialog] = useState(false);
  const [newReminderTitle, setNewReminderTitle] = useState("");
  const router = useRouter();

  // Carregar lista e lembretes
  useEffect(() => {
    fetchListAndReminders();
  }, [params.listId]);

  const fetchListAndReminders = async () => {
    try {
      setLoading(true);
      
      // Carregar lista
      const listResponse = await fetch(`/api/lists/${params.listId}`);
      if (!listResponse.ok) throw new Error("Erro ao carregar lista");
      const listData = await listResponse.json();
      setList(listData);
      
      // Carregar lembretes
      const remindersResponse = await fetch(
        `/api/lists/${params.listId}/reminders?parentId=null`
      );
      if (!remindersResponse.ok) throw new Error("Erro ao carregar lembretes");
      const remindersData = await remindersResponse.json();
      setReminders(remindersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  // Criar novo lembrete
  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newReminderTitle.trim()) return;
    
    try {
      const response = await fetch(`/api/lists/${params.listId}/reminders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newReminderTitle,
          listId: params.listId,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Erro ao criar lembrete");
      }
      
      const newReminder = await response.json();
      setReminders([...reminders, newReminder]);
      setNewReminderTitle("");
      setShowNewReminderDialog(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao criar lembrete");
    }
  };

  // Alternar conclusão do lembrete
  const handleToggleReminder = async (reminderId: string, completed: boolean) => {
    try {
      const response = await fetch(`/api/reminders/${reminderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isCompleted: completed,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Erro ao atualizar lembrete");
      }
      
      // Atualizar localmente
      setReminders(
        reminders.map((r) =>
          r.id === reminderId ? { ...r, isCompleted: completed } : r
        )
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao atualizar lembrete");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="text-[--color-ios-gray-1] dark:text-[--color-ios-dark-gray-1]">
          Carregando...
        </div>
      </div>
    );
  }

  if (error || !list) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="text-[--color-ios-red] p-4 text-center">
          <p className="font-semibold mb-2">Erro ao carregar lista</p>
          <p className="text-sm">{error}</p>
          <button
            onClick={() => router.push("/lists")}
            className="mt-4 px-4 py-2 bg-[--color-ios-blue] dark:bg-[--color-ios-dark-blue] text-white rounded-lg"
          >
            Voltar para Listas
          </button>
        </div>
      </div>
    );
  }

  const incompleteTasks = reminders.filter((r) => !r.isCompleted);
  const completedTasks = reminders.filter((r) => r.isCompleted);

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-black border-b border-[--color-ios-gray-6] dark:border-[--color-ios-dark-gray-6]">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.push("/lists")}
              className="flex items-center gap-2 text-[--color-ios-blue] dark:text-[--color-ios-dark-blue] hover:opacity-70 transition-opacity"
            >
              <IoChevronBack size={24} />
              <span>Listas</span>
            </button>
            <button className="p-2 hover:bg-[--color-ios-gray-6] dark:hover:bg-[--color-ios-dark-gray-6] rounded-full transition-colors">
              <IoEllipsisHorizontal size={24} className="text-black dark:text-white" />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[34px] font-bold text-black dark:text-white">
                {list.name}
              </h1>
              <p className="text-[17px] text-[--color-ios-gray-1] dark:text-[--color-ios-dark-gray-1]">
                {incompleteTasks.length} {incompleteTasks.length === 1 ? "tarefa" : "tarefas"}
              </p>
            </div>
            <button
              onClick={() => setShowNewReminderDialog(true)}
              className="p-3 bg-[--color-ios-blue] dark:bg-[--color-ios-dark-blue] text-white rounded-full hover:opacity-80 transition-opacity"
            >
              <IoAdd size={24} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        {reminders.length === 0 ? (
          <div className="text-center py-16 text-[--color-ios-gray-1] dark:text-[--color-ios-dark-gray-1]">
            <p>Nenhum lembrete</p>
            <p className="text-sm mt-2">Toque em + para adicionar</p>
          </div>
        ) : (
          <>
            {/* Tarefas Incompletas */}
            {incompleteTasks.length > 0 && (
              <div className="space-y-2 mb-6">
                {incompleteTasks.map((reminder) => {
                  const priorityMap = { 0: "none" as const, 1: "low" as const, 2: "medium" as const, 3: "high" as const };
                  return (
                  <TaskCell
                    key={reminder.id}
                    id={reminder.id}
                    completed={reminder.isCompleted}
                    title={reminder.title}
                    notes={reminder.notes}
                    dueDate={reminder.utcDatetime ? new Date(reminder.utcDatetime) : undefined}
                    priority={priorityMap[reminder.priority as 0 | 1 | 2 | 3]}
                    tags={reminder.tags.map((t) => t.tag.name)}
                    subtaskCount={reminder._count.children}
                    onToggle={(id) => handleToggleReminder(id, true)}
                  />
                );})}
              </div>
            )}

            {/* Tarefas Concluídas */}
            {completedTasks.length > 0 && (
              <div className="mt-8">
                <h2 className="text-[13px] uppercase font-semibold text-[--color-ios-gray-1] dark:text-[--color-ios-dark-gray-1] mb-3 px-2">
                  Concluídas ({completedTasks.length})
                </h2>
                <div className="space-y-2">
                  {completedTasks.map((reminder) => {
                    const priorityMap = { 0: "none" as const, 1: "low" as const, 2: "medium" as const, 3: "high" as const };
                    return (
                    <TaskCell
                      key={reminder.id}
                      id={reminder.id}
                      completed={reminder.isCompleted}
                      title={reminder.title}
                      notes={reminder.notes}
                      dueDate={reminder.utcDatetime ? new Date(reminder.utcDatetime) : undefined}
                      priority={priorityMap[reminder.priority as 0 | 1 | 2 | 3]}
                      tags={reminder.tags.map((t) => t.tag.name)}
                      subtaskCount={reminder._count.children}
                      onToggle={(id) => handleToggleReminder(id, false)}
                    />
                  );})}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Dialog Novo Lembrete */}
      {showNewReminderDialog && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50">
          <div className="bg-white dark:bg-[--color-ios-dark-gray-6] rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-black dark:text-white">
              Novo Lembrete
            </h2>
            <form onSubmit={handleCreateReminder}>
              <div className="mb-6">
                <input
                  type="text"
                  value={newReminderTitle}
                  onChange={(e) => setNewReminderTitle(e.target.value)}
                  placeholder="Título do lembrete"
                  className="w-full px-4 py-3 rounded-lg bg-[--color-ios-gray-6] dark:bg-[--color-ios-dark-gray-5] text-black dark:text-white border-none focus:ring-2 focus:ring-[--color-ios-blue]"
                  autoFocus
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewReminderDialog(false);
                    setNewReminderTitle("");
                  }}
                  className="flex-1 px-4 py-3 rounded-lg bg-[--color-ios-gray-6] dark:bg-[--color-ios-dark-gray-5] text-black dark:text-white hover:opacity-80 transition-opacity"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!newReminderTitle.trim()}
                  className="flex-1 px-4 py-3 rounded-lg bg-[--color-ios-blue] dark:bg-[--color-ios-dark-blue] text-white hover:opacity-80 transition-opacity disabled:opacity-50"
                >
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
