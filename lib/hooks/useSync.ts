'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { db, getLastSyncTime, setLastSyncTime, type CachedList, type CachedReminder } from '@/lib/db';

interface SyncResponse {
  lists: (CachedList & { deletedAt?: string | null })[];
  reminders: (CachedReminder & { deletedAt?: string | null })[];
  timestamp: string;
}

export function useSync(enabled: boolean = true) {
  const queryClient = useQueryClient();
  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isOnlineRef = useRef(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const isTabVisibleRef = useRef(typeof document !== 'undefined' ? !document.hidden : true);

  const performSync = useCallback(async () => {
    if (!enabled || !isOnlineRef.current || !isTabVisibleRef.current) {
      return;
    }

    try {
      // Buscar última sincronização
      const lastSyncLists = await getLastSyncTime('lists');
      const lastSyncReminders = await getLastSyncTime('reminders');

      const sinceParam = new URLSearchParams();
      if (lastSyncLists) sinceParam.append('sinceLists', lastSyncLists);
      if (lastSyncReminders) sinceParam.append('sinceReminders', lastSyncReminders);

      const response = await fetch(`/api/sync?${sinceParam.toString()}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          // Sessão expirou
          return;
        }
        throw new Error(`Sync failed: ${response.statusText}`);
      }

      const data: SyncResponse = await response.json();

      // Atualizar IndexedDB
      if (data.lists.length > 0) {
        await db.lists.bulkPut(
          data.lists.map(l => ({
            id: l.id,
            name: l.name,
            color: l.color,
            icon: l.icon,
            incompleteCount: l.incompleteCount,
            updatedAt: l.updatedAt,
          }))
        );
      }

      if (data.reminders.length > 0) {
        // Last-write-wins: atualizar apenas se servidor é mais novo
        const existingReminders = await db.reminders.bulkGet(
          data.reminders.map(r => r.id)
        );

        const toUpdate = data.reminders.filter((remoteR) => {
          const local = existingReminders.find(l => l?.id === remoteR.id);
          if (!local) return true; // Novo
          return new Date(remoteR.updatedAt) > new Date(local.updatedAt); // Mais novo
        });

        if (toUpdate.length > 0) {
          await db.reminders.bulkPut(
            toUpdate.map(r => ({
              id: r.id,
              listId: r.listId,
              title: r.title,
              notes: r.notes,
              completed: r.completed,
              priority: r.priority,
              utcDatetime: r.utcDatetime,
              timezone: r.timezone,
              isFloating: r.isFloating,
              isDateOnly: r.isDateOnly,
              updatedAt: r.updatedAt,
            }))
          );

          // Log de sincronização
          if (toUpdate.length > 0) {
            console.log(`📦 Sincronizado: ${toUpdate.length} itens`);
          }
        }
      }

      // Atualizar timestamp da sincronização
      await setLastSyncTime('lists', data.timestamp);
      await setLastSyncTime('reminders', data.timestamp);

      // Invalidar queries afetadas
      queryClient.invalidateQueries({ queryKey: ['lists'] });
      queryClient.invalidateQueries({ queryKey: ['reminders'] });

    } catch (error) {
      console.error('Sync error:', error);
    }
  }, [enabled, queryClient]);

  // Setup: listeners de visibilidade e online
  useEffect(() => {
    if (!enabled || typeof document === 'undefined') return;

    const handleVisibilityChange = () => {
      isTabVisibleRef.current = !document.hidden;
      if (!document.hidden) {
        performSync();
      }
    };

    const handleOnline = () => {
      isOnlineRef.current = true;
      performSync();
    };

    const handleOffline = () => {
      isOnlineRef.current = false;
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [enabled, performSync]);

  // Setup: polling a cada 15s
  useEffect(() => {
    if (!enabled) return;

    // Sync imediato na montagem
    performSync();

    // Setup intervalo
    syncIntervalRef.current = setInterval(performSync, 15 * 1000);

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [enabled, performSync]);
}
