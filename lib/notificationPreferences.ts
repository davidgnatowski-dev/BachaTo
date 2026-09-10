export interface NotificationPreferences {
  plannedClasses: boolean;
  plannedEvents: boolean;
  followed: boolean;
  reminderMinutes: number;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  plannedClasses: true,
  plannedEvents: true,
  followed: true,
  reminderMinutes: 60,
};

export function parseNotificationPreferences(raw: string | null | undefined): NotificationPreferences {
  if (!raw) return DEFAULT_NOTIFICATION_PREFERENCES;
  try {
    const value = JSON.parse(raw) as Partial<NotificationPreferences>;
    const allowedMinutes = [60, 180, 1440];
    return {
      plannedClasses: value.plannedClasses !== false,
      plannedEvents: value.plannedEvents !== false,
      followed: value.followed !== false,
      reminderMinutes: allowedMinutes.includes(Number(value.reminderMinutes)) ? Number(value.reminderMinutes) : 60,
    };
  } catch {
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }
}
