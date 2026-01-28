# OneSignal Setup Guide

This app uses OneSignal for push notifications. Notifications are **optional** - the app works fine without them, but users won't receive alerts for scheduled reminders.

## Features

- Push notifications sent at exact reminder datetime
- Works even when app is closed
- Automatic notification cancellation when reminders are deleted or datetime is removed
- Notification permission requested only when user sets first reminder with time

## Setup Instructions

### 1. Create OneSignal Account

1. Go to [OneSignal](https://onesignal.com) and sign up for free
2. Create a new app (choose "Web Push" platform)
3. Follow the setup wizard for web push notifications

### 2. Get API Keys

After creating your app, you'll need two keys:

1. **App ID** (found in Settings > Keys & IDs)
2. **REST API Key** (found in Settings > Keys & IDs)

### 3. Configure Environment Variables

Add to your `.env.local` or deployment environment:

```bash
# Client-side (must have NEXT_PUBLIC_ prefix)
NEXT_PUBLIC_ONESIGNAL_APP_ID="your-app-id-here"

# Server-side
ONESIGNAL_REST_API_KEY="your-rest-api-key-here"

# App URL (for notification deep links)
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
```

### 4. Configure OneSignal Dashboard

In your OneSignal dashboard:

1. Go to **Settings > Web Configuration**
2. Add your site URL(s) to "Site URL" and "Default Notification URL"
3. For localhost testing, add `http://localhost:3000` (OneSignal supports localhost)
4. Configure notification icon (optional): Upload a 256x256px icon
5. Configure welcome notification (optional): Shown when users grant permission

### 5. Test Notifications

1. Start your app: `npm run dev`
2. Create a reminder with a date/time
3. When you set the first reminder with time, you'll be prompted for notification permission
4. Accept the permission
5. The app will schedule a notification via OneSignal
6. Check OneSignal dashboard > Audience to see if the user was subscribed

### 6. Production Deployment

For production (Vercel, etc.):

1. Add the environment variables to your deployment platform
2. Update `NEXT_PUBLIC_APP_URL` to your production domain
3. Update OneSignal dashboard with your production URL
4. Deploy!

## How It Works

### Notification Flow

1. **User sets reminder with datetime** → Permission prompt appears (first time only)
2. **User grants permission** → OneSignal SDK subscribes user and returns Player ID
3. **Player ID saved to database** → Associated with user account
4. **Reminder saved** → API calls `/api/notifications/schedule`
5. **OneSignal schedules notification** → Sent at exact datetime in user's timezone
6. **Notification sent** → User receives push notification even if app is closed

### Notification Cancellation

- When reminder is **deleted**: Notification cancelled via OneSignal API
- When reminder **datetime is removed**: Notification cancelled
- When reminder **datetime is changed**: Old notification cancelled, new one scheduled

### Timezone Handling

- Reminders store `utcDatetime` and `timezone` fields
- OneSignal's `delayed_option: "timezone"` ensures notification respects user's timezone
- If user travels to different timezone, notification still fires at correct local time

## Troubleshooting

### "Notifications not working"

1. Check environment variables are set correctly
2. Check browser console for OneSignal errors
3. Verify user granted notification permission (check browser settings)
4. Check OneSignal dashboard > Delivery > All Notifications to see if notifications were sent

### "Permission prompt not appearing"

1. User may have already blocked notifications (check browser settings)
2. OneSignal SDK may not have loaded (check browser console)
3. Environment variables may be missing

### "Notification cancelled but still received"

- OneSignal caches notifications. There's a small window where cancellation may not work if notification was already queued for delivery.

## Cost

OneSignal free tier includes:
- Unlimited users
- Unlimited notifications
- Full API access

Perfect for most use cases. Check [OneSignal Pricing](https://onesignal.com/pricing) for details.

## Security Notes

- `ONESIGNAL_REST_API_KEY` is **server-side only** (never exposed to client)
- `NEXT_PUBLIC_ONESIGNAL_APP_ID` is public (safe to expose)
- Player IDs are stored securely in database
- Notification scheduling requires authentication (users can only schedule their own notifications)

## Disabling Notifications

To disable notifications entirely:

1. Remove or don't set the `NEXT_PUBLIC_ONESIGNAL_APP_ID` environment variable
2. App will work normally without notification features
3. Users won't be prompted for permission
4. No notifications will be scheduled

## Support

- [OneSignal Documentation](https://documentation.onesignal.com/docs/web-push-quickstart)
- [OneSignal Web SDK Reference](https://documentation.onesignal.com/docs/web-push-sdk)
- [OneSignal REST API](https://documentation.onesignal.com/reference/create-notification)
