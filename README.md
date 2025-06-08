# BetterMe FaaS Serverless App

## 📝 Project Overview

BetterMe FaaS is a serverless backend and React frontend application for personal habit and routine tracking. Users can create habits, log daily progress, earn streaks and challenges, and upload progress photos—all powered by Firebase Functions (FaaS) and Firestore.

## 🚀 Features

* **User Authentication**: Secure sign-up and login with Firebase Auth (JWT-protected API).
* **Habit Management**: Add, edit, and delete habits and routines via HTTP-triggered functions.
* **Daily Check-Ins**: Log habits each day, with Firestore-triggered streak calculation.
* **Reminders & Follow-Ups**: Scheduled cron functions send timely notifications if a habit is missed or needs follow-up.
* **Weekly Challenges**: Assign a new weekly challenge on Mondays with a scheduled function.
* **Progress Album**: Upload and view progress photos, with storage-triggered metadata handling (thumbnail generation placeholder).

## 📦 Tech Stack

* **Frontend**: React
* **Backend**: Firebase Functions (v2 SDK)
* **Database**: Cloud Firestore
* **Authentication**: Firebase Auth
* **Storage**: Firebase Cloud Storage
* **Notifications**: Firestore collections for user notifications

## 🏗 Architecture & Event Mapping

| Function Name             | Trigger Type                | Path/Pattern                            | Purpose                                   |
| ------------------------- | --------------------------- | --------------------------------------- | ----------------------------------------- |
| **helloWorld**            | HTTP (onRequest v2)         | `/helloWorld`                           | Health-check & CORS demo                  |
| **updateHabitStreak**     | Firestore onDocumentWritten | `habits/{habitId}/checkins/{checkinId}` | Recalculate current and longest streak    |
| **handlePhotoUpload**     | Storage onObjectFinalized   | `progress_photos/{uid}/{albumId}/*`     | Log uploads, placeholder for thumbnailing |
| **habitReminders**        | Scheduler onSchedule        | `every 1 minutes`                       | Send main & follow-up habit reminders     |
| **assignWeeklyChallenge** | Scheduler onSchedule        | `every monday 08:00`                    | Select and persist a new weekly challenge |

## 🔧 Prerequisites

* Node.js >= 14.x
* Firebase CLI (`npm install -g firebase-tools`)
* A Firebase project with Firestore, Auth, and Storage enabled

## ⚙️ Environment Setup

1. Clone this repository:

   ```bash
   git clone https://github.com/BogdanK713/BetterME.git
   ```
2. Install dependencies:

   ```bash
   # In the root (frontend)
   cd frontend
   npm install

   # In the functions folder (backend)
   cd functions
   npm install
   ```
3. Initialize Firebase functions config (if using a custom bucket):

   ```bash
   firebase functions:config:set photo.bucket="your-bucket-name"
   ```

## 🏃 Running Locally

### Frontend

```bash
npm run start
```

### Backend Functions (emulator)

```bash
# From the functions folder
firebase emulators:start --only functions,firestore,auth,storage
```

## ☁️ Deployment

1. Build frontend (if using a framework like CRA or Next.js):

   ```bash
   npm run build
   ```
2. Deploy Firebase functions and hosting:

   ```bash
   firebase deploy --only functions,hosting
   ```

## 📂 Folder Structure

```
/ (repo root)
├─ functions/          # Firebase Functions source
│  ├─ index.js         # All FaaS handlers
│  └─ package.json
├─ src/                # React frontend code
│  ├─ components/
│  ├─ utils/firebase.js
│  └─ App.jsx
├─ public/
├─ .firebaserc
├─ firebase.json
└─ README.md
```

## 🎯 Usage

1. Sign up or log in.
2. Create a new habit or routine.
3. Log your habit each day; streaks update automatically.
4. Receive push reminders if you miss a check-in.
5. View and upload progress photos in your album.
6. Get a new weekly challenge every Monday.


