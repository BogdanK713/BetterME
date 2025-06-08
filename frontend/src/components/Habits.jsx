import React, { useState, useEffect } from "react";
import { db, auth } from "../utils/firebase";
import {
  collection, addDoc, query, where, onSnapshot, doc,
  updateDoc, deleteDoc, serverTimestamp, getDocs, setDoc, getDoc
} from "firebase/firestore";

const CheckIcon = ({ checked }) => (
  <svg height="24" width="24" viewBox="0 0 24 24">
    <circle
      cx="12" cy="12" r="11"
      fill={checked ? "#D4F7DC" : "#F0F8FF"}    
      stroke={checked ? "#4CD964" : "#7C83FD"} 
      strokeWidth="2"
    />
    {checked && (
      <polyline
        points="7,12 11,16 17,8"
        fill="none"
        stroke="#4CD964" 
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    )}
  </svg>
);

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

export default function Habits() {
  const [habitName, setHabitName] = useState("");
  const [habitDesc, setHabitDesc] = useState("");
  const [reminderTime, setReminderTime] = useState("08:00");
  const [habits, setHabits] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editTime, setEditTime] = useState("");
  const [toast, setToast] = useState("");
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "habits"), where("userId", "==", user.uid));
    const unsub = onSnapshot(q, async (snap) => {
      const habitsList = [];
      for (const docSnap of snap.docs) {
        const habit = { id: docSnap.id, ...docSnap.data(), checkins: {} };
        const checkinsSnap = await getDocs(collection(db, "habits", habit.id, "checkins"));
        checkinsSnap.forEach((c) => {
          habit.checkins[c.id] = true;
        });
        habitsList.push(habit);
      }
      setHabits(habitsList);
    });
    return unsub;
  }, [user]);

  const addHabit = async (e) => {
    e.preventDefault();
    if (!habitName.trim()) return;
    await addDoc(collection(db, "habits"), {
      userId: user.uid,
      name: habitName,
      description: habitDesc,
      reminderTime,
      createdAt: serverTimestamp(),
      streak: 0,
      longestStreak: 0,
    });
    setHabitName("");
    setHabitDesc("");
    setReminderTime("08:00");
    setToast("Habit added!");
    setTimeout(() => setToast(""), 1600);
  };

  const removeHabit = async (id) => {
    await deleteDoc(doc(db, "habits", id));
    setToast("Habit deleted.");
    setTimeout(() => setToast(""), 1600);
  };

  const startEdit = (habit) => {
    setEditing(habit.id);
    setEditName(habit.name);
    setEditDesc(habit.description || "");
    setEditTime(habit.reminderTime || "08:00");
  };

  const saveEdit = async (id) => {
    await updateDoc(doc(db, "habits", id), {
      name: editName,
      description: editDesc,
      reminderTime: editTime,
    });
    setEditing(null);
    setToast("Habit updated.");
    setTimeout(() => setToast(""), 1600);
  };

  const checkIn = async (habit) => {
    const today = getToday();
    const checkinRef = doc(db, "habits", habit.id, "checkins", today);
    const checkinSnap = await getDoc(checkinRef);
    if (checkinSnap.exists()) {
      setToast("Already checked in today!");
      setTimeout(() => setToast(""), 1500);
      return;
    }
    // Streak logic
    const yest = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const yestRef = doc(db, "habits", habit.id, "checkins", yest);
    const yestSnap = await getDoc(yestRef);
    let newStreak = 1;
    if (yestSnap.exists()) newStreak = (habit.streak || 0) + 1;
    await setDoc(checkinRef, { date: today, timestamp: serverTimestamp() });
    await updateDoc(doc(db, "habits", habit.id), {
      streak: newStreak,
      longestStreak: Math.max(habit.longestStreak || 0, newStreak),
    });
    setToast("Checked in! 🔥");
    setTimeout(() => setToast(""), 1500);
  };

  const hasCheckedInToday = (habit) => habit.checkins && habit.checkins[getToday()];

  return (
    <div className="card">
      <h2 style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 7 }}>
        <span role="img" aria-label="habit"></span>Your Habits
      </h2>
      <form
        onSubmit={addHabit}
        className="habit-form-row"
        autoComplete="off"
      >
        <input
          placeholder="New habit name"
          value={habitName}
          onChange={e => setHabitName(e.target.value)}
          required
          maxLength={48}
        />
        <input
          placeholder="Description (optional)"
          value={habitDesc}
          onChange={e => setHabitDesc(e.target.value)}
          maxLength={80}
        />
        <input
          type="time"
          value={reminderTime}
          onChange={e => setReminderTime(e.target.value)}
          title="Set daily reminder"
        />
        <button type="submit" className="add-habit-btn">Add Habit</button>
      </form>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {(habits && habits.length > 0) ? habits.map(habit => (
          <li
            key={habit.id}
            className="habit-row"
          >
            {editing === habit.id ? (
              <div className="habit-edit-row">
                <input value={editName} onChange={e => setEditName(e.target.value)} maxLength={48} />
                <input value={editDesc} onChange={e => setEditDesc(e.target.value)} maxLength={80} />
                <input
                  type="time"
                  value={editTime}
                  onChange={e => setEditTime(e.target.value)}
                />
                <button onClick={() => saveEdit(habit.id)}>Save</button>
                <button onClick={() => setEditing(null)} style={{ marginLeft: 8, background: "#eee", color: "#555" }}>Cancel</button>
              </div>
            ) : (
              <>
                <button
                  className="habit-check-btn"
                  aria-label="Check in"
                  disabled={hasCheckedInToday(habit)}
                  onClick={() => checkIn(habit)}
                  style={{
                    marginRight: 12,
                    opacity: hasCheckedInToday(habit) ? 0.5 : 1,
                  }}
                >
                  <CheckIcon checked={hasCheckedInToday(habit)} />
                </button>
                <div className="habit-main-col">
                  <div className="habit-title" title={habit.name}>{habit.name}</div>
                  {habit.description &&
                    <div className="habit-desc" title={habit.description}>{habit.description}</div>
                  }
                </div>
                <div className="habit-reminder">
                  <span style={{ fontSize: 14, color: "#7C83FD" }}>ⓘ {habit.reminderTime || "—"}</span>
                </div>
                <div className="habit-actions">
                  <button onClick={() => startEdit(habit)}>Edit</button>
                  <button onClick={() => removeHabit(habit.id)} style={{ background: "#fff4f4", color: "#e25151" }}>Delete</button>
                </div>
                <div className="habit-streak">
                  <span style={{ color: "#ff7b7b", fontWeight: 600 }}>♨️ {habit.streak || 0}</span>
                  <span style={{ color: "#aaa", fontWeight: 400, marginLeft: 4, fontSize: 13 }}>(Best: {habit.longestStreak || 0})</span>
                </div>
              </>
            )}
          </li>
        )) : (
          <li style={{ color: "#bbb", fontStyle: "italic", padding: "1.5em 0", textAlign: "center" }}>
            No habits yet. Add your first habit above!
          </li>
        )}
      </ul>
      {toast && <div style={{
        position: "fixed", left: "50%", bottom: 40, transform: "translateX(-50%)",
        background: "#fff", color: "#7C83FD", border: "1.5px solid #A0E7E5",
        borderRadius: 16, boxShadow: "0 2px 12px #0002", padding: "0.8em 2em", fontWeight: 600, zIndex: 100
      }}>{toast}</div>}
    </div>
  );
}
