"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { IoChevronBack, IoAdd, IoEllipsisHorizontal } from "react-icons/io5";
import { TaskCell } from "@/components/ui/task-cell";
import { ReminderModal, ReminderData } from "@/components/ui/reminder-modal";

interface Reminder {
  id: string;
  title: string;
  notes?: string;
  completed: boolean;
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
  isOwner?: boolean;
  role?: "viewer" | "editor" | "admin";
}

const SMART_LISTS: Record<string, { name: string; color: string; icon: string; allowCreate: boolean; includeCompleted?: boolean }> = {
  today: { name: "Hoje", color: "#007AFF", icon: "calendar-outline", allowCreate: false },
  scheduled: { name: "Agendados", color: "#FF3B30", icon: "calendar-outline", allowCreate: false },
  all: { name: "Todos", color: "#8E8E93", icon: "list-outline", allowCreate: false },
  flagged: { name: "Sinalizados", color: "#FF9500", icon: "flag-outline", allowCreate: false },
  completed: { name: "Concluídos", color: "#8E8E93", icon: "checkmark-circle-outline", allowCreate: false, includeCompleted: true },
};

export default function ListDetailPage({
  params,
}: {
  params: Promise<{ listId: string }>;
}) {
  // Resolver params (Next.js 16)
  const { listId } = React.use(params);
  
  const [list, setList] = useState<List | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | undefined>(undefined);
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingTitleValue, setEditingTitleValue] = useState<string>("");
  const [savingTitleId, setSavingTitleId] = useState<string | null>(null);
  const [creatingNewId, setCreatingNewId] = useState<string | null>(null); // null ou 'bottom' ou ID do reminder
  const [newItemTitle, setNewItemTitle] = useState<string>("");
  const router = useRouter();

  const newItemInputRef = React.useRef<HTMLInputElement | null>(null);

  const fetchListAndReminders = React.useCallback(async () => {
    try {
      setLoading(true);

      const smart = SMART_LISTS[listId];
      if (smart) {
        setList({ id: listId, name: smart.name, color: smart.color, icon: smart.icon, incompleteCount: 0, role: "viewer" });

        const query = new URLSearchParams();
        query.set("parentId", "null");
        if (smart.includeCompleted) query.set("includeCompleted", "true");

        const remindersResponse = await fetch(`/api/smart-lists/${listId}/reminders?${query.toString()}`);
        if (remindersResponse.status === 401) {
          router.replace(`/login?callbackUrl=${encodeURIComponent(`/lists/${listId}`)}`);
          return;
        }
        if (!remindersResponse.ok) throw new Error("Erro ao carregar lembretes");

        const remindersData = await remindersResponse.json();
        setReminders(remindersData);
        return;
      }
      
      // Carregar lista
      const listResponse = await fetch(`/api/lists/${listId}`);
      if (listResponse.status === 401) {
        router.replace(`/login?callbackUrl=${encodeURIComponent(`/lists/${listId}`)}`);
        return;
      }
      if (listResponse.status === 403) {
        throw new Error("Sem permissão para acessar esta lista");
      }
      if (listResponse.status === 404) {
        throw new Error("Lista não encontrada");
      }
      if (!listResponse.ok) throw new Error("Erro ao carregar lista");
      const listData = await listResponse.json();
      setList(listData);
      
      // Carregar lembretes
      const remindersResponse = await fetch(
        `/api/lists/${listId}/reminders?parentId=null`
      );
      if (remindersResponse.status === 401) {
        router.replace(`/login?callbackUrl=${encodeURIComponent(`/lists/${listId}`)}`);
        return;
      }
      if (remindersResponse.status === 403) {
        throw new Error("Sem permissão para acessar os lembretes desta lista");
      }
      if (remindersResponse.status === 404) {
        throw new Error("Lista não encontrada");
      }
      if (!remindersResponse.ok) throw new Error("Erro ao carregar lembretes");
      const remindersData = await remindersResponse.json();
      setReminders(remindersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, [listId, router]);

  // Carregar lista e lembretes
  useEffect(() => {
    fetchListAndReminders();
  }, [fetchListAndReminders]);

  // Salvar lembrete (novo ou edição)
  const handleSaveReminder = async (data: ReminderData) => {
    try {
      if (editingReminder) {
        // Editar
        const response = await fetch(`/api/reminders/${editingReminder.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });
        
        if (!response.ok) throw new Error("Erro ao atualizar lembrete");
        
        const updatedReminder = await response.json();
        setReminders(
          reminders.map((r) =>
            r.id === editingReminder.id ? updatedReminder : r
          )
        );
      } else {
        // Criar
        const response = await fetch(`/api/lists/${listId}/reminders`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });
        
        if (!response.ok) throw new Error("Erro ao criar lembrete");
        
        const newReminder = await response.json();
        setReminders([...reminders, newReminder]);
      }
      
      setShowReminderModal(false);
      setEditingReminder(undefined);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao salvar lembrete");
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
          completed: completed,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Erro ao atualizar lembrete");
      }
      
      // Atualizar localmente
      setReminders(
        reminders.map((r) =>
          r.id === reminderId ? { ...r, completed: completed } : r
        )
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao atualizar lembrete");
    }
  };

  const canCreateInThisView = !SMART_LISTS[listId];
  const canEditInThisView = !SMART_LISTS[listId] && (list?.role ?? "admin") !== "viewer";

  const beginInlineEdit = (reminder: Reminder) => {
    if (!canEditInThisView) return;
    setEditingTitleId(reminder.id);
    setEditingTitleValue(reminder.title);
  };

  const beginInlineEditWithCaret = (reminder: Reminder, caretPos?: number) => {
    if (!canEditInThisView) return;
    setEditingTitleId(reminder.id);
    setEditingTitleValue(reminder.title);
    // store caret position in a temporary prop by embedding in reminder object? store separately
    setTimeout(() => {
      // no-op: caret will be passed via TaskCell prop from parent state below
    }, 0);
    // we set a per-id caret mapping
    setInitialCaretForId((prev) => ({ ...prev, [reminder.id]: typeof caretPos === 'number' ? caretPos : null }));
  };

  const [initialCaretForId, setInitialCaretForId] = useState<Record<string, number | null>>({});

  const consumeInitialCaret = (id: string) => {
    const v = initialCaretForId[id] ?? null;
    // remove after consuming
    setInitialCaretForId((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    return v;
  };

  const cancelInlineEdit = () => {
    setEditingTitleId(null);
    setEditingTitleValue("");
  };

  const saveInlineTitle = async (reminderId: string) => {
    if (!canEditInThisView) return;

    const reminder = reminders.find((r) => r.id === reminderId);
    if (!reminder) {
      cancelInlineEdit();
      return;
    }

    const nextTitle = editingTitleValue.trim();
    if (!nextTitle) {
      // Não permite título vazio; reverte.
      cancelInlineEdit();
      return;
    }

    if (nextTitle === reminder.title) {
      cancelInlineEdit();
      return;
    }

    setSavingTitleId(reminderId);
    try {
      // Otimista
      setReminders((prev) =>
        prev.map((r) => (r.id === reminderId ? { ...r, title: nextTitle } : r))
      );

      const response = await fetch(`/api/reminders/${reminderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: nextTitle,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao atualizar lembrete");
      }

      const updatedReminder = await response.json();
      setReminders((prev) =>
        prev.map((r) => (r.id === reminderId ? updatedReminder : r))
      );
    } catch (err) {
      // Reverte (melhor do que deixar inconsistente)
      setReminders((prev) =>
        prev.map((r) => (r.id === reminderId ? { ...r, title: reminder.title } : r))
      );
      alert(err instanceof Error ? err.message : "Erro ao atualizar lembrete");
    } finally {
      setSavingTitleId(null);
      cancelInlineEdit();
    }
  };

  const createNewItemInline = async () => {
    if (!canCreateInThisView || !canEditInThisView) return;
    const title = newItemTitle.trim();
    if (!title) {
      cancelNewItem();
      return;
    }

    try {
      const response = await fetch(`/api/lists/${listId}/reminders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          listId,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao criar lembrete");
      }

      const newReminder = await response.json();
      // Inserir após o item especificado ou no final
      if (creatingNewId && creatingNewId !== 'bottom') {
        const idx = reminders.findIndex((r) => r.id === creatingNewId);
        if (idx >= 0) {
          const newList = [...reminders];
          newList.splice(idx + 1, 0, newReminder);
          setReminders(newList);
        } else {
          setReminders((prev) => [...prev, newReminder]);
        }
      } else {
        setReminders((prev) => [...prev, newReminder]);
      }
      setNewItemTitle("");
      setCreatingNewId(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao criar lembrete");
      cancelNewItem();
    }
  };

  const cancelNewItem = () => {
    setCreatingNewId(null);
    setNewItemTitle("");
  };

  const startCreatingAfter = (reminderId: string | null) => {
    if (!canEditInThisView) return;
    cancelInlineEdit();
    setCreatingNewId(reminderId ?? 'bottom');
    setNewItemTitle("");
    setTimeout(() => newItemInputRef.current?.focus(), 10);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="text-(--color-ios-gray-1) dark:text-(--color-ios-dark-gray-1)">
          Carregando...
        </div>
      </div>
    );
  }

  if (error || !list) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="text-(--color-ios-red) p-4 text-center">
          <p className="font-semibold mb-2">Não foi possível abrir a lista</p>
          <p className="text-sm">{error}</p>
          <button
            onClick={() => router.push("/lists")}
            className="mt-4 px-4 py-2 bg-(--color-ios-blue) dark:bg-(--color-ios-dark-blue) text-white rounded-lg"
          >
            Voltar para Listas
          </button>
        </div>
      </div>
    );
  }

  const incompleteTasks = reminders.filter((r) => !r.completed);
  const completedTasks = reminders.filter((r) => r.completed);

  return (
    <div className="min-h-screen bg-white dark:bg-black pb-24 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-black border-b border-(--color-ios-gray-6) dark:border-(--color-ios-dark-gray-6)">
        <div className="max-w-3xl px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.push("/lists")}
              className="flex items-center gap-2 text-(--color-ios-blue) dark:text-(--color-ios-dark-blue) hover:opacity-70 transition-opacity"
            >
              <IoChevronBack size={24} />
              <span>Listas</span>
            </button>
            <button className="p-2 hover:bg-(--color-ios-gray-6) dark:hover:bg-(--color-ios-dark-gray-6) rounded-full transition-colors">
              <IoEllipsisHorizontal size={24} className="text-black dark:text-white" />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[34px] font-bold text-black dark:text-white">
                {list.name}
              </h1>
              <p className="text-[17px] text-(--color-ios-gray-1) dark:text-(--color-ios-dark-gray-1)">
                {incompleteTasks.length} {incompleteTasks.length === 1 ? "tarefa" : "tarefas"}
              </p>
            </div>
            <div className="h-12" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl px-4 py-6 flex flex-col flex-1">
        {reminders.length === 0 && creatingNewId !== 'bottom' ? (
          <div className="text-center py-16 text-(--color-ios-gray-1) dark:text-(--color-ios-dark-gray-1)">
            <p>Nenhum lembrete</p>
            <p className="text-sm mt-2">
              {SMART_LISTS[listId] ? "Nada para mostrar aqui" : "Clique abaixo para adicionar"}
            </p>
          </div>
        ) : reminders.length === 0 && creatingNewId === 'bottom' ? (
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-4 bg-(--color-ios-gray-6) dark:bg-(--color-ios-dark-gray-6) rounded-xl">
              <div className="flex-shrink-0 w-6 h-6" />
              <input
                ref={newItemInputRef}
                value={newItemTitle}
                onChange={(e) => setNewItemTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    createNewItemInline();
                  }
                  if (e.key === "Escape") {
                    e.preventDefault();
                    cancelNewItem();
                  }
                }}
                onBlur={() => createNewItemInline()}
                placeholder="Novo lembrete"
                className="flex-1 bg-transparent text-[17px] leading-[22px] text-black dark:text-white outline-none border-none placeholder:text-(--color-ios-gray-1) dark:placeholder:text-(--color-ios-dark-gray-1)"
                aria-label="Novo lembrete"
              />
            </div>
          </div>
        ) : (
          <>
            {/* Tarefas Incompletas */}
            {incompleteTasks.length > 0 && (
              <div className="space-y-2 mb-6">
                {incompleteTasks.map((reminder, idx) => {
                  const priorityMap = { 0: "none" as const, 1: "low" as const, 2: "medium" as const, 3: "high" as const };
                  return (
                  <React.Fragment key={reminder.id}>
                  <TaskCell
                    id={reminder.id}
                    completed={reminder.completed}
                    title={reminder.title}
                    notes={reminder.notes}
                    dueDate={reminder.utcDatetime ? new Date(reminder.utcDatetime) : undefined}
                    priority={priorityMap[reminder.priority as 0 | 1 | 2 | 3]}
                    tags={reminder.tags.map((t) => t.tag.name)}
                    subtaskCount={reminder._count.children}
                    onToggle={(id) => handleToggleReminder(id, true)}
                    canEdit={canEditInThisView && savingTitleId !== reminder.id}
                    isEditing={editingTitleId === reminder.id}
                    editValue={editingTitleId === reminder.id ? editingTitleValue : undefined}
                    onEditChange={setEditingTitleValue}
                    onEditCancel={cancelInlineEdit}
                    onEditSubmit={() => saveInlineTitle(reminder.id)}
                    onClick={(id, e, caret) => beginInlineEditWithCaret(reminder, caret)}
                    initialCaretPos={initialCaretForId[reminder.id] ?? null}
                    onEnterPress={(id) => startCreatingAfter(id)}
                    onInfoClick={() => {
                      if (!canEditInThisView) return;
                      setEditingReminder(reminder);
                      setShowReminderModal(true);
                    }}
                  />
                  {creatingNewId === reminder.id && (
                    <div className="flex items-center gap-3 p-4 bg-(--color-ios-gray-6) dark:bg-(--color-ios-dark-gray-6) rounded-xl mt-2">
                      <div className="flex-shrink-0 w-6 h-6" />
                      <input
                        ref={newItemInputRef}
                        value={newItemTitle}
                        onChange={(e) => setNewItemTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            createNewItemInline();
                          }
                          if (e.key === "Escape") {
                            e.preventDefault();
                            cancelNewItem();
                          }
                        }}
                        onBlur={() => createNewItemInline()}
                        placeholder="Novo lembrete"
                        className="flex-1 bg-transparent text-[17px] leading-[22px] text-black dark:text-white outline-none border-none placeholder:text-(--color-ios-gray-1) dark:placeholder:text-(--color-ios-dark-gray-1)"
                        aria-label="Novo lembrete"
                      />
                    </div>
                  )}
                  </React.Fragment>
                );})}
                {creatingNewId === 'bottom' && incompleteTasks.length > 0 && (
                  <div className="flex items-center gap-3 p-4 bg-(--color-ios-gray-6) dark:bg-(--color-ios-dark-gray-6) rounded-xl mt-2">
                    <div className="flex-shrink-0 w-6 h-6" />
                    <input
                      ref={newItemInputRef}
                      value={newItemTitle}
                      onChange={(e) => setNewItemTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          createNewItemInline();
                        }
                        if (e.key === "Escape") {
                          e.preventDefault();
                          cancelNewItem();
                        }
                      }}
                      onBlur={() => createNewItemInline()}
                      placeholder="Novo lembrete"
                      className="flex-1 bg-transparent text-[17px] leading-[22px] text-black dark:text-white outline-none border-none placeholder:text-(--color-ios-gray-1) dark:placeholder:text-(--color-ios-dark-gray-1)"
                      aria-label="Novo lembrete"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Tarefas Concluídas */}
            {completedTasks.length > 0 && (
              <div className="mt-8">
                <h2 className="text-[13px] uppercase font-semibold text-(--color-ios-gray-1) dark:text-(--color-ios-dark-gray-1) mb-3 px-2">
                  Concluídas ({completedTasks.length})
                </h2>
                <div className="space-y-2">
                  {completedTasks.map((reminder) => {
                    const priorityMap = { 0: "none" as const, 1: "low" as const, 2: "medium" as const, 3: "high" as const };
                    return (
                    <TaskCell
                      key={reminder.id}
                      id={reminder.id}
                      completed={reminder.completed}
                      title={reminder.title}
                      notes={reminder.notes}
                      dueDate={reminder.utcDatetime ? new Date(reminder.utcDatetime) : undefined}
                      priority={priorityMap[reminder.priority as 0 | 1 | 2 | 3]}
                      tags={reminder.tags.map((t) => t.tag.name)}
                      subtaskCount={reminder._count.children}
                      onToggle={(id) => handleToggleReminder(id, false)}
                      canEdit={canEditInThisView && savingTitleId !== reminder.id}
                      isEditing={editingTitleId === reminder.id}
                      editValue={editingTitleId === reminder.id ? editingTitleValue : undefined}
                      onEditChange={setEditingTitleValue}
                      onEditCancel={cancelInlineEdit}
                      onEditSubmit={() => saveInlineTitle(reminder.id)}
                      onClick={(id, e, caret) => beginInlineEditWithCaret(reminder, caret)}
                      initialCaretPos={initialCaretForId[reminder.id] ?? null}
                      onEnterPress={(id) => startCreatingAfter(id)}
                      onInfoClick={() => {
                        if (!canEditInThisView) return;
                        setEditingReminder(reminder);
                        setShowReminderModal(true);
                      }}
                    />
                  );})}
                </div>
              </div>
            )}
          </>
        )}

        {/* Área clicável no final para criar novo lembrete */}
        {!SMART_LISTS[listId] && canEditInThisView && creatingNewId === null && reminders.length > 0 && (
          <div
            className="flex-1 min-h-[120px] cursor-pointer hover:bg-(--color-ios-gray-6) dark:hover:bg-(--color-ios-dark-gray-6) transition-colors"
            onClick={() => startCreatingAfter(null)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                startCreatingAfter(null);
              }
            }}
            aria-label="Adicionar novo lembrete"
          />
        )}
      </div>

      {/* FAB + */}
      {!SMART_LISTS[listId] && canEditInThisView && (
        <button
          type="button"
          onClick={() => {
            setEditingReminder(undefined);
            setShowReminderModal(true);
          }}
          className="fixed z-20 bottom-6 right-6 p-4 rounded-full shadow-lg transition-opacity bg-(--color-ios-blue) dark:bg-(--color-ios-dark-blue) text-white hover:opacity-90"
          aria-label="Adicionar lembrete"
        >
          <IoAdd size={26} />
        </button>
      )}

      <ReminderModal
        isOpen={showReminderModal}
        onClose={() => {
          setShowReminderModal(false);
          setEditingReminder(undefined);
        }}
        onSave={handleSaveReminder}
        reminder={editingReminder}
        listId={listId}
      />
    </div>
  );
}
