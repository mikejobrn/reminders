"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { IoChevronBack, IoAdd, IoEllipsisHorizontal } from "react-icons/io5";
import { AnimatePresence, motion } from "framer-motion";
import { TaskCell } from "@/components/ui/task-cell";
import { ReminderModal, ReminderData } from "@/components/ui/reminder-modal";
import { SwipeableTaskCell } from "@/components/ui/swipeable-task-cell";
import { UndoToast, UndoToastItem } from "@/components/ui/undo-toast";

type CompletedPosition = "MOVE_TO_BOTTOM" | "KEEP_IN_PLACE";
type CompletedVisibility = "SHOW" | "SHOW_TODAY_ONLY" | "HIDE";

interface UserPreferences {
  completedPosition: CompletedPosition;
  completedVisibility: CompletedVisibility;
  undoTimeoutSeconds: number;
  confirmBeforeDelete: boolean;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  completedPosition: "MOVE_TO_BOTTOM",
  completedVisibility: "SHOW_TODAY_ONLY",
  undoTimeoutSeconds: 5,
  confirmBeforeDelete: true,
};

const SMART_LISTS: Record<string, { name: string; color: string; icon: string; allowCreate: boolean; includeCompleted?: boolean }> = {
  today: { name: "Hoje", color: "#007AFF", icon: "calendar-outline", allowCreate: false },
  scheduled: { name: "Agendados", color: "#FF3B30", icon: "calendar-outline", allowCreate: false },
  all: { name: "Todos", color: "#8E8E93", icon: "list-outline", allowCreate: false },
  flagged: { name: "Sinalizados", color: "#FF9500", icon: "flag-outline", allowCreate: false },
  completed: { name: "Concluídos", color: "#8E8E93", icon: "checkmark-circle-outline", allowCreate: false, includeCompleted: true },
};

function SkeletonTaskCell() {
  return (
    <div className="flex items-center gap-3 p-4 bg-(--color-ios-gray-6) dark:bg-(--color-ios-dark-gray-6) rounded-xl animate-pulse">
      <div className="flex-shrink-0 w-6 h-6 bg-(--color-ios-gray-5) dark:bg-(--color-ios-dark-gray-5) rounded" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-(--color-ios-gray-5) dark:bg-(--color-ios-dark-gray-5) rounded w-3/4" />
        <div className="h-3 bg-(--color-ios-gray-5) dark:bg-(--color-ios-dark-gray-5) rounded w-1/2" />
      </div>
    </div>
  );
}

function SkeletonListHeader() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-(--color-ios-gray-6) dark:bg-(--color-ios-dark-gray-6) rounded w-1/3 mb-3" />
      <div className="h-5 bg-(--color-ios-gray-5) dark:bg-(--color-ios-dark-gray-5) rounded w-1/4" />
    </div>
  );
}

function SkeletonLoader() {
  return (
    <div className="space-y-2 mb-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <SkeletonTaskCell key={i} />
      ))}
    </div>
  );
}

interface Reminder {
  id: string;
  title: string;
  notes?: string;
  completed: boolean;
  completedAt?: string | null;
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

async function fetchList(listId: string): Promise<List> {
  const smart = SMART_LISTS[listId];
  if (smart) {
    return { id: listId, name: smart.name, color: smart.color, icon: smart.icon, incompleteCount: 0, role: "viewer" };
  }

  const response = await fetch(`/api/lists/${listId}`);
  if (response.status === 401 || response.status === 403) {
    throw new Error("Unauthorized");
  }
  if (response.status === 404) {
    throw new Error("Lista não encontrada");
  }
  if (!response.ok) {
    throw new Error("Erro ao carregar lista");
  }
  return response.json();
}

async function fetchReminders(listId: string, includeCompleted: boolean): Promise<Reminder[]> {
  const smart = SMART_LISTS[listId];
  if (smart) {
    const query = new URLSearchParams();
    query.set("parentId", "null");
    if (smart.includeCompleted || includeCompleted) query.set("includeCompleted", "true");
    const response = await fetch(`/api/smart-lists/${listId}/reminders?${query.toString()}`);
    if (response.status === 401 || response.status === 403) {
      throw new Error("Unauthorized");
    }
    if (!response.ok) {
      throw new Error("Erro ao carregar lembretes");
    }
    return response.json();
  }

  const response = await fetch(`/api/lists/${listId}/reminders?parentId=null${includeCompleted ? "&includeCompleted=true" : ""}`);
  if (response.status === 401 || response.status === 403) {
    throw new Error("Unauthorized");
  }
  if (!response.ok) {
    throw new Error("Erro ao carregar lembretes");
  }
  return response.json();
}

async function fetchPreferences(): Promise<UserPreferences> {
  const response = await fetch(`/api/user/preferences`);
  if (response.status === 401 || response.status === 403) {
    throw new Error("Unauthorized");
  }
  if (!response.ok) {
    throw new Error("Erro ao carregar preferências");
  }
  return response.json();
}

async function deleteReminder(reminderId: string): Promise<{ message: string }> {
  const response = await fetch(`/api/reminders/${reminderId}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Erro ao deletar lembrete");
  return response.json();
}

async function restoreReminder(reminderId: string): Promise<Reminder> {
  const response = await fetch(`/api/reminders/${reminderId}/restore`, {
    method: "PATCH",
  });
  if (!response.ok) throw new Error("Erro ao restaurar lembrete");
  return response.json();
}

async function saveReminder(reminderId: string | undefined, data: ReminderData, listId: string): Promise<Reminder> {
  if (reminderId) {
    const response = await fetch(`/api/reminders/${reminderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Erro ao atualizar lembrete");
    return response.json();
  } else {
    const response = await fetch(`/api/lists/${listId}/reminders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Erro ao criar lembrete");
    return response.json();
  }
}

async function toggleReminder(reminderId: string, completed: boolean): Promise<Reminder> {
  const response = await fetch(`/api/reminders/${reminderId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ completed }),
  });
  if (!response.ok) throw new Error("Erro ao atualizar lembrete");
  return response.json();
}

async function updateReminderTitle(reminderId: string, title: string): Promise<Reminder> {
  const response = await fetch(`/api/reminders/${reminderId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!response.ok) throw new Error("Erro ao atualizar lembrete");
  return response.json();
}

export default function ListDetailPage({
  params,
}: {
  params: Promise<{ listId: string }>;
}) {
  const { listId } = React.use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const [showReminderModal, setShowReminderModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | undefined>(undefined);
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingTitleValue, setEditingTitleValue] = useState<string>("");
  const [editingCaretPos, setEditingCaretPos] = useState<number | null>(null);
  const [creatingNewId, setCreatingNewId] = useState<string | null>(null);
  const [newItemTitle, setNewItemTitle] = useState<string>("");
  const [pendingUndo, setPendingUndo] = useState<{
    id: string;
    type: "complete" | "delete";
    reminderId: string;
    previousCompleted?: boolean;
  } | null>(null);
  const [toastItem, setToastItem] = useState<UndoToastItem | null>(null);

  const newItemInputRef = React.useRef<HTMLInputElement | null>(null);
  const lastVisibleDayRef = React.useRef<number>(new Date().getDate());
  const actionIdCounter = useRef(0);

  // Queries
  const { data: list, isLoading: listLoading, error: listError } = useQuery({
    queryKey: ["list", listId],
    queryFn: () => fetchList(listId),
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message === "Unauthorized") {
        router.replace(`/login?callbackUrl=${encodeURIComponent(`/lists/${listId}`)}`);
        return false;
      }
      return failureCount < 3;
    },
  });

  const { data: preferencesData } = useQuery({
    queryKey: ["preferences"],
    queryFn: fetchPreferences,
    staleTime: Infinity,
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message === "Unauthorized") {
        return false;
      }
      return failureCount < 3;
    },
  });

  const preferences = preferencesData ?? DEFAULT_PREFERENCES;

  const includeCompleted = preferences.completedVisibility !== "HIDE";
  const remindersQueryKey = ["reminders", listId, includeCompleted] as const;

  const { data: reminders = [], isLoading: remindersLoading, error: remindersError } = useQuery({
    queryKey: remindersQueryKey,
    queryFn: () => fetchReminders(listId, includeCompleted),
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message === "Unauthorized") {
        return false;
      }
      return failureCount < 3;
    },
  });

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) return;
      const today = new Date().getDate();
      if (today !== lastVisibleDayRef.current) {
        lastVisibleDayRef.current = today;
        queryClient.invalidateQueries({ queryKey: ["reminders", listId] });
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [listId, queryClient]);

  // Mutations
  const saveReminderMutation = useMutation({
    mutationFn: (data: ReminderData) => saveReminder(editingReminder?.id, data, listId),
    onMutate: async (data) => {
      // Optimistic update
      const previousReminders = queryClient.getQueryData<Reminder[]>(remindersQueryKey) ?? [];

      if (editingReminder) {
        queryClient.setQueryData(remindersQueryKey, previousReminders.map((r) =>
          r.id === editingReminder.id
            ? {
              ...r,
              title: data.title,
              notes: data.notes,
              priority: data.priority ?? r.priority,
              utcDatetime: data.dueDate,
              timezone: data.timezone,
            }
            : r
        ));
      } else {
        const optimisticReminder: Reminder = {
          id: "temp-" + Date.now(),
          title: data.title,
          notes: data.notes,
          completed: false,
          priority: data.priority ?? 0,
          flagged: data.flagged ?? false,
          utcDatetime: data.dueDate,
          timezone: data.timezone,
          isFloating: false,
          isDateOnly: false,
          tags: [],
          _count: { children: 0, attachments: 0 },
        };
        queryClient.setQueryData(remindersQueryKey, [...previousReminders, optimisticReminder]);
      }

      return previousReminders;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders", listId] });
      setShowReminderModal(false);
      setEditingReminder(undefined);
    },
    onError: (error, _, previousReminders) => {
      if (previousReminders) {
        queryClient.setQueryData(remindersQueryKey, previousReminders);
      }
      alert(error instanceof Error ? error.message : "Erro ao salvar lembrete");
    },
  });

  const handleSaveReminder = async (data: ReminderData) => {
    return new Promise<void>((resolve, reject) => {
      saveReminderMutation.mutate(data, {
        onSuccess: () => resolve(),
        onError: (error) => {
          reject(error);
        },
      });
    });
  };

  const { mutate: handleToggleReminder } = useMutation({
    mutationFn: ({ reminderId, completed }: { reminderId: string; completed: boolean }) =>
      toggleReminder(reminderId, completed),
    onMutate: ({ reminderId, completed }) => {
      const previousReminders = queryClient.getQueryData<Reminder[]>(remindersQueryKey) ?? [];
      queryClient.setQueryData(remindersQueryKey, previousReminders.map((r) =>
        r.id === reminderId ? { ...r, completed } : r
      ));
      return previousReminders;
    },
    onError: (error, _, previousReminders) => {
      if (previousReminders) {
        queryClient.setQueryData(remindersQueryKey, previousReminders);
      }
      alert(error instanceof Error ? error.message : "Erro ao atualizar lembrete");
    },
  });

  const { mutate: handleUpdateTitle } = useMutation({
    mutationFn: ({ reminderId, title }: { reminderId: string; title: string }) =>
      updateReminderTitle(reminderId, title),
    onMutate: ({ reminderId, title }) => {
      const previousReminders = queryClient.getQueryData<Reminder[]>(remindersQueryKey) ?? [];
      queryClient.setQueryData(remindersQueryKey, previousReminders.map((r) =>
        r.id === reminderId ? { ...r, title } : r
      ));
      return previousReminders;
    },
    onSuccess: () => {
      setEditingTitleId(null);
      setEditingTitleValue("");
      setEditingCaretPos(null);
    },
    onError: (error, _, previousReminders) => {
      if (previousReminders) {
        queryClient.setQueryData(remindersQueryKey, previousReminders);
      }
      setEditingTitleId(null);
      setEditingCaretPos(null);
      alert(error instanceof Error ? error.message : "Erro ao atualizar lembrete");
    },
  });

  const { mutate: handleCreateReminder } = useMutation({
    mutationFn: (data: ReminderData) => saveReminder(undefined, data, listId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders", listId] });
      setCreatingNewId(null);
      setNewItemTitle("");
    },
    onError: (error) => {
      alert(error instanceof Error ? error.message : "Erro ao criar lembrete");
    },
  });

  const deleteReminderMutation = useMutation({
    mutationFn: (reminderId: string) => deleteReminder(reminderId),
    onMutate: async (reminderId) => {
      const previousReminders = queryClient.getQueryData<Reminder[]>(remindersQueryKey) ?? [];
      queryClient.setQueryData(
        remindersQueryKey,
        previousReminders.filter((r) => r.id !== reminderId)
      );
      return { previousReminders };
    },
    onError: (error, _, context) => {
      if (context?.previousReminders) {
        queryClient.setQueryData(remindersQueryKey, context.previousReminders);
      }
      alert(error instanceof Error ? error.message : "Erro ao deletar lembrete");
    },
  });

  const restoreReminderMutation = useMutation({
    mutationFn: (reminderId: string) => restoreReminder(reminderId),
    onSuccess: (restored) => {
      const previousReminders = queryClient.getQueryData<Reminder[]>(remindersQueryKey) ?? [];
      const exists = previousReminders.some((r) => r.id === restored.id);
      if (!exists) {
        queryClient.setQueryData(remindersQueryKey, [restored, ...previousReminders]);
      }
    },
    onError: (error) => {
      alert(error instanceof Error ? error.message : "Erro ao restaurar lembrete");
    },
  });

  const canCreateInThisView = !SMART_LISTS[listId];
  const canEditInThisView = !SMART_LISTS[listId] && (list?.role ?? "admin") !== "viewer";

  const beginInlineEdit = (reminder: Reminder, caretPos: number | null = null) => {
    if (!canEditInThisView) return;
    setEditingTitleId(reminder.id);
    setEditingTitleValue(reminder.title);
    setEditingCaretPos(caretPos);
  };

  const cancelInlineEdit = () => {
    setEditingTitleId(null);
    setEditingTitleValue("");
    setEditingCaretPos(null);
  };

  const saveInlineTitle = (reminderId: string) => {
    if (!canEditInThisView) return;

    const reminder = reminders.find((r) => r.id === reminderId);
    if (!reminder) {
      cancelInlineEdit();
      return;
    }

    const nextTitle = editingTitleValue.trim();
    if (!nextTitle) {
      cancelInlineEdit();
      return;
    }

    handleUpdateTitle({ reminderId, title: nextTitle });
  };

  const createNewItemInline = async () => {
    if (!canCreateInThisView || !canEditInThisView) return;
    const title = newItemTitle.trim();
    if (!title) {
      cancelNewItem();
      return;
    }
    handleCreateReminder({ title, listId });
  };

  const cancelNewItem = () => {
    setCreatingNewId(null);
    setNewItemTitle("");
  };

  const startCreatingAfter = (reminderId: string | null) => {
    if (!canEditInThisView) return;
    cancelInlineEdit();
    setCreatingNewId(reminderId ?? "bottom");
    setNewItemTitle("");
    setTimeout(() => newItemInputRef.current?.focus(), 10);
  };

  const nextActionId = (type: string, reminderId: string) => {
    actionIdCounter.current += 1;
    return `${type}-${reminderId}-${actionIdCounter.current}`;
  };

  const queueUndo = (payload: {
    id: string;
    type: "complete" | "delete";
    reminderId: string;
    previousCompleted?: boolean;
  }) => {
    // Dismiss existing toast and commit pending undo action
    if (pendingUndo && toastItem) {
      handleUndoTimeout(toastItem.id);
    }
    
    setPendingUndo(payload);
    setToastItem({
      id: payload.id,
      message:
        payload.type === "delete"
          ? "Lembrete excluído"
          : payload.previousCompleted
            ? "Tarefa reaberta"
            : "Tarefa concluída",
      timeoutMs: preferences.undoTimeoutSeconds * 1000,
    });
  };

  const toggleWithUndo = (reminder: Reminder, completed: boolean) => {
    handleToggleReminder({ reminderId: reminder.id, completed });
    const actionId = nextActionId("complete", reminder.id);
    queueUndo({ id: actionId, type: "complete", reminderId: reminder.id, previousCompleted: reminder.completed });
  };

  const deleteWithUndo = (reminder: Reminder) => {
    deleteReminderMutation.mutate(reminder.id);
    const actionId = nextActionId("delete", reminder.id);
    queueUndo({ id: actionId, type: "delete", reminderId: reminder.id });
  };

  const handleUndo = (id: string) => {
    if (!pendingUndo || pendingUndo.id !== id) return;
    if (pendingUndo.type === "complete") {
      handleToggleReminder({ reminderId: pendingUndo.reminderId, completed: pendingUndo.previousCompleted ?? false });
    } else {
      restoreReminderMutation.mutate(pendingUndo.reminderId);
    }
    setPendingUndo(null);
    setToastItem(null);
  };

  const handleUndoTimeout = (id: string) => {
    if (pendingUndo?.id === id) {
      setPendingUndo(null);
    }
    setToastItem(null);
  };

  const isTodayLocal = (dateString?: string | null) => {
    if (!dateString) return false;
    const d = new Date(dateString);
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  };

  const visibleCompleted = useMemo(() => {
    if (preferences.completedVisibility === "HIDE") return [] as Reminder[];
    const completedList = reminders.filter((r) => r.completed);
    if (preferences.completedVisibility === "SHOW_TODAY_ONLY") {
      return completedList.filter((r) => isTodayLocal(r.completedAt ?? undefined));
    }
    return completedList;
  }, [reminders, preferences.completedVisibility]);

  const visibleIncomplete = useMemo(() => reminders.filter((r) => !r.completed), [reminders]);

  const orderedReminders = useMemo(() => {
    if (preferences.completedVisibility === "HIDE") {
      return visibleIncomplete;
    }

    if (preferences.completedPosition === "KEEP_IN_PLACE") {
      const allowedIds = new Set<string>([
        ...visibleIncomplete.map((r) => r.id),
        ...visibleCompleted.map((r) => r.id),
      ]);
      return reminders.filter((r) => allowedIds.has(r.id));
    }

    return [...visibleIncomplete, ...visibleCompleted];
  }, [preferences.completedPosition, preferences.completedVisibility, reminders, visibleCompleted, visibleIncomplete]);

  const completedTodayCount = useMemo(
    () => reminders.filter((r) => r.completed && isTodayLocal(r.completedAt ?? undefined)).length,
    [reminders]
  );

  const firstCompletedIndex = useMemo(() => orderedReminders.findIndex((r) => r.completed), [orderedReminders]);

  if (listError || remindersError) {
    const error = listError || remindersError;
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="text-(--color-ios-red) p-4 text-center">
          <p className="font-semibold mb-2">Não foi possível abrir a lista</p>
          <p className="text-sm">{error instanceof Error ? error.message : "Erro desconhecido"}</p>
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

  if (listLoading || !list) {
    return (
      <div className="min-h-screen bg-white dark:bg-black pb-24 flex flex-col">
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
              <button
                onClick={() => router.push("/settings")}
                className="p-2 hover:bg-(--color-ios-gray-6) dark:hover:bg-(--color-ios-dark-gray-6) rounded-full transition-colors"
              >
                <IoEllipsisHorizontal size={24} className="text-black dark:text-white" />
              </button>
            </div>
            <SkeletonListHeader />
          </div>
        </div>
        <div className="max-w-3xl px-4 py-6">
          <SkeletonLoader />
        </div>
      </div>
    );
  }

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
            <button
              onClick={() => router.push("/settings")}
              className="p-2 hover:bg-(--color-ios-gray-6) dark:hover:bg-(--color-ios-dark-gray-6) rounded-full transition-colors"
            >
              <IoEllipsisHorizontal size={24} className="text-black dark:text-white" />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[34px] font-bold text-black dark:text-white">
                {list.name}
              </h1>
              <p className="text-[17px] text-(--color-ios-gray-1) dark:text-(--color-ios-dark-gray-1)">
                {visibleIncomplete.length} {visibleIncomplete.length === 1 ? "tarefa" : "tarefas"}
              </p>
            </div>
            <div className="h-12" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl px-4 py-6 flex flex-col flex-1">
        {remindersLoading ? (
          <SkeletonLoader />
        ) : orderedReminders.length === 0 && creatingNewId !== 'bottom' ? (
          <div className="text-center py-16 text-(--color-ios-gray-1) dark:text-(--color-ios-dark-gray-1)">
            <p>Nenhum lembrete</p>
            <p className="text-sm mt-2">
              {SMART_LISTS[listId] ? "Nada para mostrar aqui" : "Clique abaixo para adicionar"}
            </p>
          </div>
        ) : orderedReminders.length === 0 && creatingNewId === 'bottom' ? (
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
            {orderedReminders.length > 0 && (
              <div className="space-y-2 mb-6">
                <AnimatePresence initial={false}>
                  {orderedReminders.map((reminder, index) => {
                    const priorityMap = { 0: "none" as const, 1: "low" as const, 2: "medium" as const, 3: "high" as const };
                    const isFirstCompleted = reminder.completed && firstCompletedIndex === index && preferences.completedVisibility !== "HIDE";

                    return (
                      <motion.div
                        key={reminder.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ type: "spring", stiffness: 360, damping: 32 }}
                      >
                        {isFirstCompleted && (
                          <div className="flex items-center justify-between mt-4 px-2">
                            <h2 className="text-[13px] uppercase font-semibold text-(--color-ios-gray-1) dark:text-(--color-ios-dark-gray-1)">
                              Concluídas ({orderedReminders.length - firstCompletedIndex})
                            </h2>
                            {completedTodayCount > 0 && (
                              <span className="text-[13px] font-semibold px-3 py-1 rounded-full bg-(--color-ios-gray-6) dark:bg-(--color-ios-dark-gray-6) text-(--color-ios-blue) dark:text-(--color-ios-dark-blue)">
                                {completedTodayCount} hoje 🎉
                              </span>
                            )}
                          </div>
                        )}

                        <SwipeableTaskCell
                          onComplete={canEditInThisView ? () => toggleWithUndo(reminder, !reminder.completed) : undefined}
                          onDelete={canEditInThisView ? () => deleteWithUndo(reminder) : undefined}
                          confirmBeforeDelete={preferences.confirmBeforeDelete}
                          completed={reminder.completed}
                        >
                          <TaskCell
                            id={reminder.id}
                            completed={reminder.completed}
                            title={reminder.title}
                            notes={reminder.notes}
                            dueDate={reminder.utcDatetime ? new Date(reminder.utcDatetime) : undefined}
                            priority={priorityMap[reminder.priority as 0 | 1 | 2 | 3]}
                            flagged={reminder.flagged}
                            tags={reminder.tags.map((t) => t.tag.color)}
                            subtaskCount={reminder._count.children}
                            onToggle={() => toggleWithUndo(reminder, !reminder.completed)}
                            canEdit={canEditInThisView}
                            isEditing={editingTitleId === reminder.id}
                            editValue={editingTitleId === reminder.id ? editingTitleValue : undefined}
                            onEditChange={setEditingTitleValue}
                            onEditCancel={cancelInlineEdit}
                            onEditSubmit={() => saveInlineTitle(reminder.id)}
                            onClick={(id, _e, caretPos) => beginInlineEdit(reminder, caretPos ?? null)}
                            initialCaretPos={editingTitleId === reminder.id ? editingCaretPos : null}
                            onEnterPress={(id) => startCreatingAfter(id)}
                            onInfoClick={() => {
                              if (!canEditInThisView) return;
                              setEditingReminder(reminder);
                              setShowReminderModal(true);
                            }}
                          />
                        </SwipeableTaskCell>

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
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {creatingNewId === 'bottom' && orderedReminders.length > 0 && (
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
          </>
        )}

        {/* Área clicável no final para criar novo lembrete */}
        {!SMART_LISTS[listId] && canEditInThisView && creatingNewId === null && orderedReminders.length > 0 && (
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

      <UndoToast item={toastItem} onUndo={handleUndo} onTimeout={handleUndoTimeout} />

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
