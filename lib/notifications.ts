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

let webNotificationTimeouts: ReturnType<typeof setTimeout>[] = [];

export async function syncLocalNotifications(
  userUid: string,
  members: any[],
  reminders: any[],
  medicines: any[],
  caregiverForIds: string[] = [],
  appointments: any[] = []
) {
  const myMember = members.find(m => m.uid === userUid);
  if (!myMember) return;

  const validMemberIds = [myMember.id, ...caregiverForIds];
  const myReminders = reminders.filter(r => validMemberIds.includes(r.memberId) && (r.status === 'upcoming' || r.status === 'pending'));

  const notificationsToSchedule: any[] = [];
  const now = new Date();

  // Clear existing web timeouts
  webNotificationTimeouts.forEach(clearTimeout);
  webNotificationTimeouts = [];

  // Group reminders by exact time (e.g., "08:00")
  const groupedReminders = myReminders.reduce((acc, reminder) => {
    if (!acc[reminder.time]) acc[reminder.time] = [];
    acc[reminder.time].push(reminder);
    return acc;
  }, {} as Record<string, typeof myReminders>);

  for (const [time, group] of Object.entries(groupedReminders) as [string, any[]][]) {
    const { hour, minute } = parseTime(time);
    const reminderIds = group.map((r: any) => r.id);
    
    let title = '';
    let body = '';
    
    if (group.length === 1) {
      const reminder = group[0];
      const medicine = medicines.find(m => m.id === reminder.medicineId);
      const member = members.find(m => m.id === reminder.memberId);
      if (!medicine || !member) continue;
      
      const isForMe = member.id === myMember.id;
      title = isForMe ? `Time to take ${medicine.name}` : `Time for ${member.name} to take ${medicine.name}`;
      body = `Dosage: ${medicine.dosage} (${medicine.mealInstruction})`;
    } else {
      title = `Time to take ${group.length} medicines`;
      const medNames = group.map(r => {
        const med = medicines.find(m => m.id === r.medicineId);
        const mem = members.find(m => m.id === r.memberId);
        return med ? (mem && mem.id !== myMember.id ? `${med.name} (${mem.name})` : med.name) : 'Unknown';
      });
      body = medNames.join(', ');
    }

    const baseIdStr = reminderIds.join('_');

    // Standard Alert
    notificationsToSchedule.push({
      title,
      body,
      id: stringToId(baseIdStr + '_norm'),
      schedule: { on: { hour, minute }, allowWhileIdle: true },
      actionTypeId: 'MEDICINE_ACTIONS',
      extra: { reminderIds }, // array of ids
    });

    // Escalation Alert (30 mins later)
    const escalationDate = new Date();
    escalationDate.setHours(hour, minute + 30, 0, 0);
    const escTitle = group.length === 1 
      ? `⚠️ ESCALATION: Missed a dose!` 
      : `⚠️ ESCALATION: ${group.length} doses missed!`;
      
    notificationsToSchedule.push({
      title: escTitle,
      body: `Medications due at ${time} were missed. Please check.`,
      id: stringToId(baseIdStr + '_esc'),
      schedule: { on: { hour: escalationDate.getHours(), minute: escalationDate.getMinutes() }, allowWhileIdle: true },
      extra: { reminderIds },
    });

    // Web Fallback Logic
    if (!Capacitor.isNativePlatform() && 'Notification' in window && Notification.permission === 'granted') {
      const target = new Date();
      target.setHours(hour, minute, 0, 0);
      if (target.getTime() < now.getTime()) target.setDate(target.getDate() + 1);
      
      const msUntilNormal = target.getTime() - now.getTime();
      webNotificationTimeouts.push(setTimeout(() => {
        new Notification(title, { body });
      }, msUntilNormal));

      const escTarget = new Date();
      escTarget.setHours(escalationDate.getHours(), escalationDate.getMinutes(), 0, 0);
      if (escTarget.getTime() < now.getTime()) escTarget.setDate(escTarget.getDate() + 1);

      const msUntilEsc = escTarget.getTime() - now.getTime();
      webNotificationTimeouts.push(setTimeout(() => {
        new Notification(escTitle, { body: `Medications due at ${time} were missed.` });
      }, msUntilEsc));
    }
  }

  const upcomingAppointments = appointments.filter(a => a.status === 'Scheduled' && validMemberIds.includes(a.memberId));
  for (const appointment of upcomingAppointments) {
    const member = members.find(m => m.id === appointment.memberId);
    if (!member) continue;
    const isForMe = member.id === myMember.id;
    // Set for 6 AM on the day of the appointment
    const dateObj = new Date(appointment.date);
    dateObj.setHours(6, 0, 0, 0);

    const title = isForMe ? `Appointment Today: ${appointment.doctorName}` : `${member.name} has an appointment today: ${appointment.doctorName}`;
    const body = `Time: ${appointment.time}, Location: ${appointment.location}`;

    notificationsToSchedule.push({
      title,
      body,
      id: stringToId(appointment.id + '_appt'),
      schedule: { at: dateObj, allowWhileIdle: true },
    });

    if (!Capacitor.isNativePlatform() && 'Notification' in window && Notification.permission === 'granted') {
      const msUntil = dateObj.getTime() - now.getTime();
      // Only schedule if it's in the future and less than 24h (to avoid huge setTimeouts)
      if (msUntil > 0 && msUntil < 86400000 * 30) {
        webNotificationTimeouts.push(setTimeout(() => {
          new Notification(title, { body });
        }, msUntil));
      }
    }
  }

  if (Capacitor.isNativePlatform()) {
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel(pending);
    }
    
    await LocalNotifications.registerActionTypes({
      types: [
        {
          id: 'MEDICINE_ACTIONS',
          actions: [
            {
              id: 'take',
              title: 'Take All Now',
              foreground: false,
            }
          ]
        }
      ]
    });

    if (notificationsToSchedule.length > 0) {
      await LocalNotifications.schedule({ notifications: notificationsToSchedule });
    }
  }
}
