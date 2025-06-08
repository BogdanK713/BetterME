import React, { useEffect, useState, useRef } from "react";
import { db, auth } from "../utils/firebase";
import { collection, query, where, onSnapshot, getDocs } from "firebase/firestore";
import CalendarRow from "./CalendarRow";
import WeeklyChallenge from "./WeeklyChallenge";
import Loader from "./Loader";
import ApiStatus from "./ApiStatus";
import ProgressAlbum from "./ProgressAlbum";
import { theme } from "../theme";

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

export default function Dashboard() {
  const [habits, setHabits] = useState(null);
  const habitsListRef = useRef();

  // Scroll fade watch
  useEffect(() => {
    const el = habitsListRef.current;
    if (!el) return;
    const container = el.parentElement;
    const onScroll = () => {
      const atTop = el.scrollTop <= 2;
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 2;
      container.classList.toggle("scrolled-to-top", atTop);
      container.classList.toggle("scrolled-to-bottom", atBottom);
    };
    el.addEventListener("scroll", onScroll);
    window.addEventListener("resize", onScroll);
    setTimeout(onScroll, 20);
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [habits]);

  // Load habits
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const q = query(collection(db, "habits"), where("userId", "==", user.uid));
    const unsub = onSnapshot(q, async (snap) => {
      const list = [];
      for (const docSnap of snap.docs) {
        const habit = { id: docSnap.id, ...docSnap.data(), checkins: {} };
        const checkinsSnap = await getDocs(
          collection(db, "habits", habit.id, "checkins")
        );
        checkinsSnap.forEach(c => {
          habit.checkins[c.id] = true;
        });
        list.push(habit);
      }
      setHabits(list);
    });
    return unsub;
  }, []);

  if (!auth.currentUser) return null;
  if (!habits) return <Loader />;

  const today = getToday();
  const completed = habits.filter(h => h.checkins?.[today]).length;
  const activeStreaks = habits.filter(h => (h.streak || 0) > 0).length;
  const bestStreak = Math.max(...habits.map(h => h.longestStreak || 0), 0);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        gap: "1.5rem",
        width: "100%",
        maxWidth: "1900px",
        margin: "0 auto 0 0",
      }}
    >
      {/* LEFT: Stats & Today's Habits */}
      <div
        className="card"
        style={{
          flex: 1,
          minWidth: 340,
          display: "flex",
          flexDirection: "column"
        }}
      >
        <h1 style={{ marginBottom: 38 }}>Welcome back!</h1>
        <div
          style={{
            display: "flex",
            gap: "1rem",
            flexWrap: "wrap",
            marginBottom: 20,
          }}
        >
          <StatBlock label="Habits Tracked" value={habits.length} icon="📈" />
          <StatBlock label="Completed Today" value={completed} icon="✅" />
          <StatBlock label="Active Streaks" value={activeStreaks} icon="🔥" />
          <StatBlock label="Best Streak" value={bestStreak} icon="🏆" />
        </div>
        <h3 style={{ margin: 16, textAlign:'center'}}>Today's Habits</h3>
        <div className="scroll-container" style={{ position: "relative", height: 350 }}>
          <ul
            ref={habitsListRef}
            className="scroll-fade-list"
            style={{ overflowY: "auto", maxHeight: 310 }}
          >
            {habits.map(h => (
              <li key={h.id} className="habit-row">
                <span
                  role="img"
                  aria-label="habit"
                  style={{
                    display: "inline-block",
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#7C83FD",
                    border: "2px solid #7C83FD",
                    verticalAlign: "middle",
                    marginRight: 6,
                  }}
                />
                <span
                  className="dashboard-habit-title"
                  title={h.name}
                  style={{
                    textDecoration: h.checkins?.[today]
                      ? "line-through"
                      : undefined,
                    color: h.checkins?.[today] ? "#bbb" : theme.text,
                  }}
                >
                  {h.name}
                </span>
                <span style={{ marginLeft: "auto", color: "#7C83FD" }}>
                  {h.checkins?.[today] ? "Done" : "Pending"}
                </span>
                <span style={{ marginLeft: 15, color: "#ff7b7b" }}>
                  Streak {h.streak || 0}
                </span>
              </li>
            ))}
          </ul>
        </div><ApiStatus />
      </div>

      {/* RIGHT: Calendar */}
      <div
        style={{
          flex: 2,
          minWidth: 600,
          display: "flex",
          flexDirection: "column",
        }}
       >
        <div className="card" style={{ flex: 1, width: "100%", maxWidth: "none", minWidth: "900px", maxHeight:"310px" }}>
          <CalendarRow habits={habits} />
        </div>

{/* Bottom: Progress Albums + Weekly Challenge */}
        <div
            style={{ display: "flex", flexDirection: "row", gap: "1rem", minWidth: "990px" }}
           >
            <div
              className="card"
              style={{
                flex: 1,
                minWidth: 380,
                maxHeight: 620,
                overflowY: "auto",
              }}
            >
              <ProgressAlbum />
            </div>

            <div
              className="card"
              style={{
                flex: 1,
                minWidth: 380,
                maxHeight: 620,
                overflowY: "auto",
              }}
            >
              <WeeklyChallenge />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBlock({ label, value, icon }) {
  return (
    <div className="stat-block">
      <div style={{ fontSize: 28 }}>{icon}</div>
      <div style={{ fontSize: 23, fontWeight: 600, color: "#7C83FD" }}>
        {value}
      </div>
      <div style={{ fontSize: 14, color: "#555", marginTop: 2 }}>{label}</div>
    </div>
  );
}
