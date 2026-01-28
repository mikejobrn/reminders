"use client";

import React, { useState, useEffect } from "react";
import { IoClose, IoCalendar, IoFlag, IoPricetag, IoChevronForward } from "react-icons/io5";
import { requestNotificationPermission, getOneSignalPlayerId } from "@/lib/notifications";

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ReminderData) => Promise<void>;
  reminder?: {
    id: string;
    title: string;
    notes?: string;
    priority: number;
    flagged: boolean;
    utcDatetime?: string;
    timezone?: string;
    tags: Array<{
      tag: {
        id: string;
        name: string;
        color: string;
      };
    }>;
  };
  listId: string;
}

export interface ReminderData {
  title: string;
  notes?: string;
  priority?: number;
  flagged?: boolean;
  dueDate?: string;
  timezone?: string;
  listId: string;
  tagIds?: string[];
}

interface TagOption {
  id: string;
  name: string;
  color: string;
}

export const ReminderModal: React.FC<ReminderModalProps> = ({
  isOpen,
  onClose,
  onSave,
  reminder,
  listId,
}) => {
  const [title, setTitle] = useState(reminder?.title || "");
  const [notes, setNotes] = useState(reminder?.notes || "");
  const [priority, setPriority] = useState(reminder?.priority || 0);
  const [flagged, setFlagged] = useState(reminder?.flagged || false);
  const [dueDate, setDueDate] = useState<Date | null>(
    reminder?.utcDatetime ? new Date(reminder.utcDatetime) : null
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tags, setTags] = useState<TagOption[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const tagColors = ["blue", "red", "orange", "yellow", "green", "teal", "purple", "pink"] as const;
  const [newTagColor, setNewTagColor] = useState<(typeof tagColors)[number]>("blue");

  useEffect(() => {
    if (!isOpen) return;

    if (reminder) {
      setTitle(reminder.title);
      setNotes(reminder.notes || "");
      setPriority(reminder.priority);
      setFlagged(reminder.flagged);
      setDueDate(reminder.utcDatetime ? new Date(reminder.utcDatetime) : null);
      setSelectedTagIds(reminder.tags?.map((t) => t.tag.id) || []);
    } else {
      setTitle("");
      setNotes("");
      setPriority(0);
      setFlagged(false);
      setDueDate(null);
      setSelectedTagIds([]);
    }

    setShowDatePicker(false);
    setShowPriorityPicker(false);
  }, [isOpen, reminder]);

  useEffect(() => {
    if (!isOpen) return;
    const fetchTags = async () => {
      try {
        setTagsLoading(true);
        const res = await fetch("/api/tags");
        if (!res.ok) throw new Error("Erro ao carregar tags");
        const data: TagOption[] = await res.json();
        setTags(data);
      } catch (error) {
        console.error(error);
      } finally {
        setTagsLoading(false);
      }
    };

    fetchTags();
  }, [isOpen]);

  const handleSave = async () => {
    if (!title.trim()) return;

    setSaving(true);
    try {
      // Request notification permission if setting datetime for the first time
      if (dueDate && !reminder?.utcDatetime) {
        const hasPermission = await requestNotificationPermission();
        if (hasPermission) {
          // Update user's OneSignal player ID
          const playerId = await getOneSignalPlayerId();
          if (playerId) {
            try {
              await fetch('/api/user/onesignal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerId }),
              });
            } catch (error) {
              console.error('Error saving OneSignal player ID:', error);
            }
          }
        }
      }

      await onSave({
        title: title.trim(),
        notes: notes.trim() || undefined,
        priority,
        flagged,
        dueDate: dueDate?.toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        listId,
        tagIds: selectedTagIds,
      });
      onClose();
    } catch (error) {
      console.error("Erro ao salvar lembrete:", error);
      alert("Erro ao salvar lembrete");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Adicionar data";

    // Usar Date.now() cache para evitar hydration mismatch
    const now = Date.now();
    const today = new Date(now);
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dateStr = date.toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "short",
      year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
    });

    const timeStr = date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (date.toDateString() === today.toDateString()) {
      return `Hoje, ${timeStr}`;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Amanhã, ${timeStr}`;
    }

    return `${dateStr}, ${timeStr}`;
  };

  const priorityLabels = ["Nenhuma", "Baixa", "Média", "Alta"];
  const priorityIcons = ["", "!", "!!", "!!!"];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-(--color-ios-dark-gray-6) rounded-t-2xl sm:rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-(--color-ios-gray-6) dark:border-(--color-ios-dark-gray-5)">
          <button
            onClick={onClose}
            className="p-2 hover:bg-(--color-ios-gray-6) dark:hover:bg-(--color-ios-dark-gray-5) rounded-full transition-colors"
          >
            <IoClose size={24} className="text-black dark:text-white" />
          </button>
          <h2 className="text-[17px] font-semibold text-black dark:text-white">
            {reminder ? "Editar Lembrete" : "Novo Lembrete"}
          </h2>
          <button
            onClick={handleSave}
            disabled={!title.trim() || saving}
            className="px-4 py-2 rounded-lg bg-(--color-ios-blue) dark:bg-(--color-ios-dark-blue) text-white hover:opacity-80 transition-opacity disabled:opacity-50 text-[17px] font-semibold"
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Title Input */}
          <div className="mb-4">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título"
              className="w-full px-4 py-3 text-[17px] rounded-lg bg-(--color-ios-gray-6) dark:bg-(--color-ios-dark-gray-5) text-black dark:text-white border-none focus:ring-2 focus:ring-(--color-ios-blue) placeholder:text-(--color-ios-gray-1) dark:placeholder:text-(--color-ios-dark-gray-1)"
              autoFocus
            />
          </div>

          {/* Notes Input */}
          <div className="mb-6">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas"
              rows={4}
              className="w-full px-4 py-3 text-[17px] rounded-lg bg-(--color-ios-gray-6) dark:bg-(--color-ios-dark-gray-5) text-black dark:text-white border-none focus:ring-2 focus:ring-(--color-ios-blue) placeholder:text-(--color-ios-gray-1) dark:placeholder:text-(--color-ios-dark-gray-1) resize-none"
            />
          </div>

          {/* Options */}
          <div className="space-y-2">
            {/* Date Picker Button */}
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="w-full flex items-center justify-between p-4 rounded-lg bg-(--color-ios-gray-6) dark:bg-(--color-ios-dark-gray-5) hover:opacity-80 transition-opacity"
            >
              <div className="flex items-center gap-3">
                <IoCalendar
                  size={20}
                  className="text-(--color-ios-blue) dark:text-(--color-ios-dark-blue)"
                />
                <span className="text-[17px] text-black dark:text-white">
                  {formatDate(dueDate)}
                </span>
              </div>
              <IoChevronForward
                size={20}
                className="text-(--color-ios-gray-1) dark:text-(--color-ios-dark-gray-1)"
              />
            </button>

            {/* Date Picker */}
            {showDatePicker && (
              <div className="p-4 rounded-lg bg-(--color-ios-gray-6) dark:bg-(--color-ios-dark-gray-5)">
                <input
                  type="datetime-local"
                  value={
                    dueDate
                      ? dueDate.toISOString().slice(0, 16)
                      : ""
                  }
                  onChange={(e) => {
                    if (e.target.value) {
                      setDueDate(new Date(e.target.value));
                    } else {
                      setDueDate(null);
                    }
                  }}
                  className="w-full px-4 py-3 rounded-lg bg-white dark:bg-(--color-ios-dark-gray-6) text-black dark:text-white border border-(--color-ios-gray-5) dark:border-(--color-ios-dark-gray-4) focus:ring-2 focus:ring-(--color-ios-blue)"
                />
                {dueDate && (
                  <button
                    onClick={() => setDueDate(null)}
                    className="mt-2 text-[15px] text-(--color-ios-red) dark:text-(--color-ios-dark-red) hover:opacity-80"
                  >
                    Remover data
                  </button>
                )}
              </div>
            )}

            {/* Priority Picker Button */}
            <button
              onClick={() => setShowPriorityPicker(!showPriorityPicker)}
              className="w-full flex items-center justify-between p-4 rounded-lg bg-(--color-ios-gray-6) dark:bg-(--color-ios-dark-gray-5) hover:opacity-80 transition-opacity"
            >
              <div className="flex items-center gap-3">
                <IoFlag
                  size={20}
                  className="text-(--color-ios-blue) dark:text-(--color-ios-dark-blue)"
                />
                <span className="text-[17px] text-black dark:text-white">
                  Prioridade: {priorityLabels[priority]}
                </span>
              </div>
              <IoChevronForward
                size={20}
                className="text-(--color-ios-gray-1) dark:text-(--color-ios-dark-gray-1)"
              />
            </button>

            {/* Priority Picker */}
            {showPriorityPicker && (
              <div className="p-2 rounded-lg bg-(--color-ios-gray-6) dark:bg-(--color-ios-dark-gray-5) space-y-1">
                {priorityLabels.map((label, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setPriority(index);
                      setShowPriorityPicker(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${priority === index
                      ? "bg-(--color-ios-blue) dark:bg-(--color-ios-dark-blue) text-white"
                      : "bg-white dark:bg-(--color-ios-dark-gray-6) text-black dark:text-white hover:bg-(--color-ios-gray-5) dark:hover:bg-(--color-ios-dark-gray-5)"
                      }`}
                  >
                    <span className="text-[17px]">{label}</span>
                    {priorityIcons[index] && (
                      <span className="text-[17px] font-semibold">
                        {priorityIcons[index]}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Flagged Toggle */}
            <button
              onClick={() => setFlagged(!flagged)}
              className="w-full flex items-center justify-between p-4 rounded-lg bg-(--color-ios-gray-6) dark:bg-(--color-ios-dark-gray-5) hover:opacity-80 transition-opacity"
            >
              <div className="flex items-center gap-3">
                <IoFlag
                  size={20}
                  className={
                    flagged
                      ? "text-(--color-ios-orange) dark:text-(--color-ios-dark-orange)"
                      : "text-(--color-ios-blue) dark:text-(--color-ios-dark-blue)"
                  }
                />
                <span className="text-[17px] text-black dark:text-white">
                  Sinalizado
                </span>
              </div>
              <div
                className={`w-12 h-7 rounded-full transition-colors ${flagged
                  ? "bg-(--color-ios-orange) dark:bg-(--color-ios-dark-orange)"
                  : "bg-(--color-ios-gray-5) dark:bg-(--color-ios-dark-gray-4)"
                  }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${flagged ? "translate-x-6" : "translate-x-1"
                    } mt-1`}
                />
              </div>
            </button>

            {/* Tags (Placeholder) */}
            <div className="p-4 rounded-lg bg-(--color-ios-gray-6) dark:bg-(--color-ios-dark-gray-5) space-y-3">
              <div className="flex items-center gap-2">
                <IoPricetag size={20} className="text-(--color-ios-blue) dark:text-(--color-ios-dark-blue)" />
                <span className="text-[17px] text-black dark:text-white">Tags</span>
                {tagsLoading && <span className="text-[13px] text-(--color-ios-gray-1)">Carregando...</span>}
              </div>

              {selectedTagIds.length === 0 && (
                <p className="text-[14px] text-(--color-ios-gray-1) dark:text-(--color-ios-dark-gray-2)">Nenhuma tag selecionada</p>
              )}

              {selectedTagIds.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedTagIds.map((tagId) => {
                    const tag = tags.find((t) => t.id === tagId);
                    if (!tag) return null;
                    return (
                      <button
                        key={tag.id}
                        onClick={() =>
                          setSelectedTagIds((prev) => prev.filter((id) => id !== tag.id))
                        }
                        className="px-3 py-1 rounded-full text-[14px] bg-(--color-ios-blue)/10 dark:bg-(--color-ios-dark-blue)/20 text-(--color-ios-blue) dark:text-(--color-ios-dark-blue)"
                      >
                        #{tag.name}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => {
                  const selected = selectedTagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      onClick={() =>
                        setSelectedTagIds((prev) =>
                          prev.includes(tag.id)
                            ? prev.filter((id) => id !== tag.id)
                            : [...prev, tag.id]
                        )
                      }
                      className={`px-3 py-1 rounded-full text-[14px] border transition-colors ${selected
                        ? "bg-(--color-ios-blue) dark:bg-(--color-ios-dark-blue) text-white border-transparent"
                        : "bg-white dark:bg-(--color-ios-dark-gray-6) text-(--color-ios-gray-1) dark:text-(--color-ios-dark-gray-1) border-(--color-ios-gray-5) dark:border-(--color-ios-dark-gray-4) hover:border-(--color-ios-blue)"
                        }`}
                    >
                      #{tag.name}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-(--color-ios-gray-5) dark:border-(--color-ios-dark-gray-4)">
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Nova tag"
                  className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-(--color-ios-dark-gray-6) text-black dark:text-white border border-(--color-ios-gray-5) dark:border-(--color-ios-dark-gray-4)"
                />
                <select
                  value={newTagColor}
                  onChange={(e) => setNewTagColor(e.target.value as typeof tagColors[number])}
                  className="px-3 py-2 rounded-lg bg-white dark:bg-(--color-ios-dark-gray-6) text-black dark:text-white border border-(--color-ios-gray-5) dark:border-(--color-ios-dark-gray-4)"
                >
                  {tagColors.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={!newTagName.trim()}
                  onClick={async () => {
                    if (!newTagName.trim()) return;
                    try {
                      const res = await fetch("/api/tags", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ name: newTagName.trim(), color: newTagColor }),
                      });
                      if (!res.ok) throw new Error("Erro ao criar tag");
                      const created: TagOption = await res.json();
                      setTags((prev) => {
                        const exists = prev.some((t) => t.id === created.id);
                        return exists ? prev : [...prev, created];
                      });
                      setSelectedTagIds((prev) => [...new Set([...prev, created.id])]);
                      setNewTagName("");
                    } catch (error) {
                      console.error(error);
                      alert("Erro ao criar tag");
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-(--color-ios-blue) dark:bg-(--color-ios-dark-blue) text-white hover:opacity-80 transition-opacity disabled:opacity-50"
                >
                  Adicionar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
