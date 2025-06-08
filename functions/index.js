/* eslint-disable indent, max-len */

const { onRequest } = require("firebase-functions/v2/https");
const cors = require('cors')({ origin: true });
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { onObjectFinalized } = require("firebase-functions/v2/storage");
const { onUserCreated } = require("firebase-functions/v2/identity");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();

function pad(n) { return n.toString().padStart(2, '0'); }

// Example CORS-wrapped function
exports.helloWorld = onRequest((req, res) => {
  cors(req, res, () => {
    res.status(200).send("Hello from BetterME FaaS!");
  });
});

  // Europe/Ljubljana is UTC+2 in summer, UTC+1 in winter
function getLocalTimeInLjubljana(date = new Date()) {
  return new Date(date.toLocaleString('en-US', { timeZone: 'Europe/Ljubljana' }));
}

// --- 1. SCHEDULED FUNCTION: Send notifications for habit reminders ---
exports.habitReminders = onSchedule(
  { schedule: "every 1 minutes", timeZone: "Europe/Ljubljana" },
  async () => {
    function pad(n) { return n.toString().padStart(2, '0'); }

    // THIS is the fix:
    const now = getLocalTimeInLjubljana();
    const today = now.toISOString().slice(0, 10);
    const hh = pad(now.getHours());
    const mm = pad(now.getMinutes());
    const timeNow = `${hh}:${mm}`;

    // Previous minutes for "relaxed" matching
    const prev1 = new Date(now.getTime() - 1 * 60000);
    const prev2 = new Date(now.getTime() - 2 * 60000);
    const timePrev1 = `${pad(prev1.getHours())}:${pad(prev1.getMinutes())}`;
    const timePrev2 = `${pad(prev2.getHours())}:${pad(prev2.getMinutes())}`;

    // Ten minutes ago
    const tenMinAgoObj = new Date(now.getTime() - 10 * 60000);
    const tenMinAgo = `${pad(tenMinAgoObj.getHours())}:${pad(tenMinAgoObj.getMinutes())}`;
    const tenMinAgoPlus1 = `${pad(new Date(tenMinAgoObj.getTime() + 1 * 60000).getHours())}:${pad(new Date(tenMinAgoObj.getTime() + 1 * 60000).getMinutes())}`;
    const tenMinAgoPlus2 = `${pad(new Date(tenMinAgoObj.getTime() + 2 * 60000).getHours())}:${pad(new Date(tenMinAgoObj.getTime() + 2 * 60000).getMinutes())}`;

    const habitsSnap = await db.collection("habits").get();
    console.log(`Cloud Function running at: ${now.toString()} (ISO: ${now.toISOString()})`);

    for (const habitDoc of habitsSnap.docs) {
      const habit = habitDoc.data();
      const habitId = habitDoc.id;
      if (!habit.reminderTime || !habit.userId) continue;

      // Logging current comparison context
      console.log(
        `[${habit.name}] reminderTime=${habit.reminderTime} | now=${timeNow}, prev1=${timePrev1}, prev2=${timePrev2}, tenMinAgo=${tenMinAgo}`
      );

      // Helper to check if notification already sent today
      async function notificationSent(type) {
        const userNotifSnap = await db
          .collection("users")
          .doc(habit.userId)
          .collection("notifications")
          .where("habitId", "==", habitId)
          .where("type", "==", type)
          .where("date", "==", today)
          .get();
        return !userNotifSnap.empty;
      }

      // --- 1. Main Reminder at habit time, relaxed by 2 minutes ---
      if (
        [timeNow, timePrev1, timePrev2].includes(habit.reminderTime)
      ) {
        const checkinSnap = await db
          .collection("habits")
          .doc(habitId)
          .collection("checkins")
          .doc(today)
          .get();

        if (!checkinSnap.exists && !(await notificationSent("reminder"))) {
          console.log(`[${habit.name}] Sending main reminder (not checked in, not already sent).`);
          await db
            .collection("users")
            .doc(habit.userId)
            .collection("notifications")
            .add({
              title: "Habit Reminder",
              message: `It's time for your habit: "${habit.name}"!`,
              habitId,
              date: today,
              sentAt: admin.firestore.FieldValue.serverTimestamp(),
              read: false,
              type: "reminder",
            });
        } else {
          if (checkinSnap.exists) {
            console.log(`[${habit.name}] Already checked in, no reminder sent.`);
          } else {
            console.log(`[${habit.name}] Reminder already sent today, skipping.`);
          }
        }
      }

      // --- 2. Follow-Up 10 Minutes Later (relaxed by 2 minutes) ---
      if (
        [tenMinAgo, tenMinAgoPlus1, tenMinAgoPlus2].includes(habit.reminderTime)
      ) {
        const checkinSnap = await db
          .collection("habits")
          .doc(habitId)
          .collection("checkins")
          .doc(today)
          .get();

        if (!checkinSnap.exists && !(await notificationSent("followup"))) {
          console.log(`[${habit.name}] Sending follow-up reminder (not checked in, not already sent).`);
          await db
            .collection("users")
            .doc(habit.userId)
            .collection("notifications")
            .add({
              title: "Follow-Up Reminder",
              message: `Don't forget to check in for: "${habit.name}"!`,
              habitId,
              date: today,
              sentAt: admin.firestore.FieldValue.serverTimestamp(),
              read: false,
              type: "followup",
            });
        } else {
          if (checkinSnap.exists) {
            console.log(`[${habit.name}] Already checked in (followup), no reminder sent.`);
          } else {
            console.log(`[${habit.name}] Follow-up reminder already sent today, skipping.`);
          }
        }
      }
    }
    return null;
  }
);


// --- 2. DATABASE TRIGGER: Update habit streaks on habit checkin change ---
exports.updateHabitStreak = onDocumentWritten(
  "habits/{habitId}/checkins/{checkinId}",
  async (event) => {
    if (!event.data?.after) return;
    const habitId = event.params.habitId;
    const habitRef = db.collection("habits").doc(habitId);
    const checkinsSnapshot = await habitRef.collection("checkins").get();

    let streak = 0;
    let longestStreak = 0;
    let lastDate = null;
    const checkins = checkinsSnapshot.docs
      .map(doc => doc.data())
      .sort((a, b) => (a.date > b.date ? 1 : -1));

    checkins.forEach((log) => {
      if (lastDate) {
        const diff = (new Date(log.date) - new Date(lastDate)) / (1000 * 3600 * 24);
        if (diff === 1) {
          streak++;
        } else {
          streak = 1;
        }
      } else {
        streak = 1;
      }
      lastDate = log.date;
      if (streak > longestStreak) longestStreak = streak;
    });

    await habitRef.update({
      streak,
      longestStreak,
    });
    return null;
  }
);

// --- 3. SCHEDULED FUNCTION: Assign weekly challenge every Monday at 8:00 ---
exports.assignWeeklyChallenge = onSchedule(
  {
    schedule: "every monday 08:00",
    timeZone: "Europe/Ljubljana",
  },
  async (event) => {
    const challenges = [
      "Try a new healthy recipe.",
      "Wake up 30 minutes earlier each day.",
      "Write a gratitude journal for 7 days.",
      "Walk 10,000 steps each day.",
      "No social media after 8pm.",
      "Read a book for 30 minutes daily.",
      "Drink only water for the week.",
      "No sweets/desserts for 7 days.",
      "Do a random act of kindness every day.",
      "Take a 15-minute walk after each meal.",
    ];
    const selectedChallenge = challenges[Math.floor(Math.random() * challenges.length)];
    const now = new Date();
    const monday = new Date(now.setDate(now.getDate() - now.getDay() + 1));
    const weekId = monday.toISOString().slice(0, 10);

    await db
      .collection("weekly_challenges")
      .doc(weekId)
      .set({
        challenge: selectedChallenge,
        assignedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    return null;
  }
);

// --- 4. STORAGE TRIGGER: When user uploads a progress photo ---
exports.handlePhotoUpload = onObjectFinalized(
  { bucket: process.env.PHOTO_BUCKET || undefined },
  async (event) => {
    const filePath = event.data.name;
    const contentType = event.data.contentType;
    console.log("User uploaded file: ", filePath, "type:", contentType);
    return null;
  }
);

// --- 5. SCHEDULED FUNCTION: Send notification if user hasn't checked in ---
/*
exports.sendHabitReminders = onSchedule(
    {
        schedule: "every 30 minutes",
        timeZone: "Europe/Ljubljana",
    },
    async (event) => {
        const now = new Date();
        const today = now.toISOString().slice(0, 10);
        const habitsSnapshot = await db.collection("habits").get();
        const notifications = [];

        for (const habitDoc of habitsSnapshot.docs) {
            const habit = habitDoc.data();
            const habitId = habitDoc.id;
            if (!habit.reminderTime || !habit.userId) continue;
            const [hh, mm] = habit.reminderTime.split(":");
            const reminderDate = new Date(today + "T" + hh.padStart(2, "0") + ":" + mm.padStart(2, "0") + ":00");
            reminderDate.setMinutes(reminderDate.getMinutes() + 30);
            if (now < reminderDate) continue;
            const logsRef = db.collection("habits").doc(habitId).collection("logs");
            const logsSnapshot = await logsRef.where("date", "==", today).get();
            if (!logsSnapshot.empty) continue;
            notifications.push(
                db
                    .collection("users")
                    .doc(habit.userId)
                    .collection("notifications")
                    .add({
                        title: "Don’t forget your habit!",
                        message: `You haven't logged "${habit.name}" today. Tap to check in!`,
                        habitId,
                        sentAt: admin.firestore.FieldValue.serverTimestamp(),
                        read: false,
                    })
            );
        }
        await Promise.all(notifications);
        return null;
    }
);
*/



exports.onProgressPhotoUpload = onObjectFinalized(
  { bucket: process.env.PHOTO_BUCKET  },
  async (event) => {
    const filePath    = event.data.name;
    const contentType = event.data.contentType;

    console.log("Storage trigger fired for:", filePath);

    if (!filePath.startsWith("progress_photos/")) return null;

    const [ , userId, albumId ] = filePath.split("/");

    const bucket    = admin.storage().bucket(event.data.bucket);
    const file      = bucket.file(filePath);
    const thumbPath = filePath.replace(/(\.\w+)$/, "_thumb$1");
    const thumbFile = bucket.file(thumbPath);

    const sharp     = require("sharp");
    const [buffer]  = await file.download();
    const thumbBuf  = await sharp(buffer).resize(200, 200).toBuffer();
    await thumbFile.save(thumbBuf, { contentType });

    const [ thumbUrl ] = await thumbFile.getSignedUrl({
      action: "read",
      expires: "03-01-2500"
    });
    await db
      .collection("users")
      .doc(userId)
      .collection("progress_albums")
      .doc(albumId)
      .collection("photos")
      .add({
        url:         event.data.mediaLink,
        thumbnail:   thumbUrl,
        storagePath: filePath,
        createdAt:   admin.firestore.FieldValue.serverTimestamp(),
      });

    return null;
  }
);
