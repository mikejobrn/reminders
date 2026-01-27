import Dexie, { Table } from 'dexie';

export interface CachedList {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  incompleteCount: number;
  updatedAt: string;
}

export interface CachedReminder {
  id: string;
  listId: string;
  title: string;
  notes?: string;
  completed: boolean;
  priority: number;
  utcDatetime?: string;
  timezone?: string;
  isFloating: boolean;
  isDateOnly: boolean;
  updatedAt: string;
}

export interface SyncMetadata {
  entityType: 'lists' | 'reminders';
  lastSyncAt: string;
}

export class LembretesDB extends Dexie {
  lists!: Table<CachedList>;
  reminders!: Table<CachedReminder>;
  syncMetadata!: Table<SyncMetadata>;

  constructor() {
    super('LembretesDB');
    this.version(1).stores({
      lists: 'id, updatedAt',
      reminders: 'id, listId, updatedAt, completed',
      syncMetadata: 'entityType',
    });
  }
}

export const db = new LembretesDB();

export async function getLastSyncTime(entityType: 'lists' | 'reminders'): Promise<string | null> {
  try {
    const metadata = await db.syncMetadata.get(entityType);
    return metadata?.lastSyncAt ?? null;
  } catch {
    return null;
  }
}

export async function setLastSyncTime(entityType: 'lists' | 'reminders', timestamp: string) {
  try {
    await db.syncMetadata.put({ entityType, lastSyncAt: timestamp });
  } catch (error) {
    console.error('Error setting sync time:', error);
  }
}
