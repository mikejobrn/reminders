/**
 * Notification service for scheduling reminder notifications via OneSignal.
 * Only active if NEXT_PUBLIC_ONESIGNAL_APP_ID is configured.
 */

export interface ScheduleNotificationParams {
  reminderId: string;
  title: string;
  body?: string;
  scheduledAt: Date; // Exact time to send notification (already in user's timezone)
  userId: string;
  listId: string;
}

export interface CancelNotificationParams {
  oneSignalNotificationId: string;
}

/**
 * Check if OneSignal is configured
 */
export function isOneSignalConfigured(): boolean {
  return !!(
    typeof window !== 'undefined' &&
    process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID
  );
}

/**
 * Initialize OneSignal SDK on client side
 */
export async function initOneSignal(): Promise<void> {
  if (!isOneSignalConfigured()) {
    console.log('OneSignal not configured, skipping initialization');
    return;
  }

  if (typeof window === 'undefined') {
    return;
  }

  // OneSignal will be initialized in layout.tsx with script tag
  // This function just ensures the SDK is loaded
  return new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      if (window.OneSignal) {
        clearInterval(checkInterval);
        resolve();
      }
    }, 100);

    // Timeout after 10 seconds
    setTimeout(() => {
      clearInterval(checkInterval);
      resolve();
    }, 10000);
  });
}

/**
 * Get OneSignal player ID for current user
 */
export async function getOneSignalPlayerId(): Promise<string | null> {
  if (!isOneSignalConfigured() || typeof window === 'undefined') {
    return null;
  }

  await initOneSignal();

  if (!window.OneSignal) {
    return null;
  }

  try {
    const playerId = await window.OneSignal.getUserId();
    return playerId || null;
  } catch (error) {
    console.error('Error getting OneSignal player ID:', error);
    return null;
  }
}

/**
 * Request notification permission and subscribe to OneSignal
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isOneSignalConfigured() || typeof window === 'undefined') {
    return false;
  }

  await initOneSignal();

  if (!window.OneSignal) {
    return false;
  }

  try {
    // Check if already subscribed
    const isPushEnabled = await window.OneSignal.isPushNotificationsEnabled();
    if (isPushEnabled) {
      return true;
    }

    // Request permission
    await window.OneSignal.showNativePrompt();
    
    // Check again after prompt
    const isNowEnabled = await window.OneSignal.isPushNotificationsEnabled();
    return isNowEnabled;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
}

/**
 * Schedule a notification via server-side API
 */
export async function scheduleNotification(params: ScheduleNotificationParams): Promise<string | null> {
  if (!isOneSignalConfigured()) {
    console.log('OneSignal not configured, skipping notification scheduling');
    return null;
  }

  try {
    const response = await fetch('/api/notifications/schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Error scheduling notification:', error);
      return null;
    }

    const data = await response.json();
    return data.oneSignalNotificationId || null;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return null;
  }
}

/**
 * Cancel a scheduled notification via server-side API
 */
export async function cancelNotification(params: CancelNotificationParams): Promise<boolean> {
  if (!isOneSignalConfigured() || !params.oneSignalNotificationId) {
    return false;
  }

  try {
    const response = await fetch('/api/notifications/cancel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    return response.ok;
  } catch (error) {
    console.error('Error cancelling notification:', error);
    return false;
  }
}

// TypeScript declarations for OneSignal SDK
declare global {
  interface Window {
    OneSignal?: {
      init(options: any): Promise<void>;
      getUserId(): Promise<string | null>;
      isPushNotificationsEnabled(): Promise<boolean>;
      showNativePrompt(): Promise<void>;
      setExternalUserId(userId: string): Promise<void>;
    };
  }
}
