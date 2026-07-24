import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export async function requestNotificationPermissions() {
  if (Capacitor.isNativePlatform()) {
    const { display } = await LocalNotifications.requestPermissions();
    return display === 'granted';
  } else if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
}

function parseTime(timeStr: string) {
  const [hour, minute] = timeStr.split(':').map(Number);
  return { hour, minute };
}

function stringToId(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export async function syncLocalNotifications(
  userUid: string,
  members: any[],
  reminders: any[],
  medicines: any[]
) {
  if (!Capacitor.isNativePlatform()) return;

  const myMember = members.find(m => m.uid === userUid);
  if (!myMember) return;

  const myReminders = reminders.filter(r => r.memberId === myMember.id && (r.status === 'upcoming' || r.status === 'pending'));

  // Cancel all existing to ensure clean slate
  const pending = await LocalNotifications.getPending();
  if (pending.notifications.length > 0) {
    await LocalNotifications.cancel(pending);
  }
  
  // Register action types for actionable notifications
  await LocalNotifications.registerActionTypes({
    types: [
      {
        id: 'MEDICINE_ACTIONS',
        actions: [
          {
            id: 'take',
            title: 'Take Now',
            foreground: false, // execute action in the background
          }
        ]
      }
    ]
  });

  const notificationsToSchedule = [];
  for (const reminder of myReminders) {
    const medicine = medicines.find(m => m.id === reminder.medicineId);
    if (medicine) {
      const { hour, minute } = parseTime(reminder.time);
      notificationsToSchedule.push({
        title: `Time to take ${medicine.name}`,
        body: `Dosage: ${medicine.dosage} (${medicine.mealInstruction})`,
        id: stringToId(reminder.id),
        schedule: {
          on: { hour, minute },
          allowWhileIdle: true,
        },
        actionTypeId: 'MEDICINE_ACTIONS',
        extra: { reminderId: reminder.id },
      });
    }
  }

  if (notificationsToSchedule.length > 0) {
    await LocalNotifications.schedule({ notifications: notificationsToSchedule });
  }
}
