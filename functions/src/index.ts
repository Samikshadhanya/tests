import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import twilio from 'twilio';

admin.initializeApp();
const db = admin.firestore();

// 1. Twilio Inbound Webhook
export const twilioWebhook = functions.https.onRequest(async (request, response) => {
  try {
    const text = request.rawBody.toString('utf8');
    const params = new URLSearchParams(text);
    
    const fromNumber = params.get('From');
    const bodyText = params.get('Body')?.toLowerCase().trim() || '';

    if (!fromNumber) {
      response.status(400).send('Missing From number');
      return;
    }

    const isTakenIntent = ['done', 'taken', 'yes', 'yep', 'y', 'ok', 'okay'].includes(bodyText);

    if (!isTakenIntent) {
      sendTwilioResponse(response, 'MedHome Bot: Unrecognized command. Reply with "taken" or "done" to log your next upcoming medicine.');
      return;
    }

    const caregiversSnapshot = await db.collection('caregivers')
      .where('phone', '==', fromNumber)
      .limit(1)
      .get();

    if (caregiversSnapshot.empty) {
      sendTwilioResponse(response, 'MedHome Bot: Phone number not recognized. Please update your Caregiver profile in the app with this number in E.164 format (e.g. +12345678900).');
      return;
    }

    const householdId = caregiversSnapshot.docs[0].data().householdId;

    const remindersSnapshot = await db.collection('reminders')
      .where('householdId', '==', householdId)
      .where('status', '==', 'upcoming')
      .get();

    if (remindersSnapshot.empty) {
      sendTwilioResponse(response, 'MedHome Bot: You have no upcoming medicine reminders at this time.');
      return;
    }

    const reminders = remindersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    reminders.sort((a: any, b: any) => a.time.localeCompare(b.time));
    const nextReminder = reminders[0] as any;

    await db.collection('reminders').doc(nextReminder.id).update({
      status: 'taken',
      takenAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    if (nextReminder.medicineId) {
      const medRef = db.collection('medicines').doc(nextReminder.medicineId);
      const medDoc = await medRef.get();
      
      if (medDoc.exists) {
        const medData = medDoc.data();
        if (medData && typeof medData.quantity === 'number') {
          await medRef.update({
            quantity: Math.max(0, medData.quantity - 1)
          });
        }
      }
    }

    sendTwilioResponse(response, 'MedHome Bot: Successfully marked your medicine as taken!');
  } catch (error) {
    console.error('Twilio Webhook Error:', error);
    sendTwilioResponse(response, 'MedHome Bot: An error occurred processing your request.');
  }
});

function sendTwilioResponse(response: functions.Response, message: string) {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>${message}</Message>
</Response>`;
  response.set('Content-Type', 'text/xml');
  response.send(xml);
}

// 2. Outbound SMS Reminders (Cron Job)
export const sendRemindersCron = functions.pubsub.schedule('every 15 minutes').onRun(async (context) => {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !twilioPhone) {
      console.warn('Twilio environment variables are not set. Skipping SMS sending.');
      return null;
    }

    const client = twilio(accountSid, authToken);

    const remindersSnapshot = await db.collection('reminders').where('status', '==', 'upcoming').get();
    
    if (remindersSnapshot.empty) {
      console.log('No upcoming reminders');
      return null;
    }

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTotalMinutes = currentHour * 60 + currentMinute;

    let sentCount = 0;

    for (const doc of remindersSnapshot.docs) {
      const reminder = doc.data();
      const [rHour, rMinute] = reminder.time.split(':').map(Number);
      const reminderTotalMinutes = rHour * 60 + rMinute;
      
      if (currentTotalMinutes >= reminderTotalMinutes && currentTotalMinutes - reminderTotalMinutes < 15) {
        if (reminder.lastNotifiedAt) {
          const lastNotified = new Date(reminder.lastNotifiedAt);
          if (now.getTime() - lastNotified.getTime() < 60 * 60 * 1000) {
            continue;
          }
        }

        const medicineDoc = await db.collection('medicines').doc(reminder.medicineId).get();
        const medicine = medicineDoc.data();
        
        const caregiversSnapshot = await db.collection('caregivers')
          .where('householdId', '==', reminder.householdId)
          .get();
          
        let targetPhone = null;
        for (const cg of caregiversSnapshot.docs) {
          if (cg.data().phone) {
            targetPhone = cg.data().phone;
            break;
          }
        }

        if (targetPhone && medicine) {
          try {
            await client.messages.create({
              body: `MedHome Alert: It's time to take ${medicine.dosage} of ${medicine.name}. Reply "taken" or "done" when you have taken it.`,
              from: twilioPhone,
              to: targetPhone
            });
            
            await db.collection('reminders').doc(doc.id).update({
              lastNotifiedAt: now.toISOString()
            });
            sentCount++;
          } catch (err) {
            console.error('Failed to send SMS for reminder', doc.id, err);
          }
        }
      }
    }
    console.log(`Processed ${sentCount} reminders`);
    return null;
  } catch (error) {
    console.error('Cron Error:', error);
    return null;
  }
});
