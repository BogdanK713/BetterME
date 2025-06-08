import React, { useEffect, useState } from "react";
import { db, auth } from "../utils/firebase";
import { doc, getDoc, setDoc, updateDoc, arrayUnion, collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import Loader from "./Loader";

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function getMonday(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay(), diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().slice(0, 10);
}

export default function WeeklyChallenge() {
  const [challenge, setChallenge] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confetti, setConfetti] = useState(false);
  const [history, setHistory] = useState([]);
  const today = getToday();
  const weekId = getMonday();

  useEffect(() => {
    if (!auth.currentUser) return;
    setLoading(true);

    async function fetchAll() {
      const chalRef = doc(db, "weekly_challenges", weekId);
      const chalSnap = await getDoc(chalRef);

      const progRef = doc(db, "challenge_progress", `${auth.currentUser.uid}_${weekId}`);
      const progSnap = await getDoc(progRef);

      setChallenge(chalSnap.exists() ? chalSnap.data().challenge : "No challenge for this week.");
      setProgress(
        progSnap.exists()
          ? progSnap.data()
          : { completedDays: [], completed: false, userId: auth.currentUser.uid, weekId }
      );

      setLoading(false);
    }

    fetchAll();
  }, [auth.currentUser, weekId]);

  useEffect(() => {
    if (progress && progress.completed) {
      setConfetti(true);
      const t = setTimeout(() => setConfetti(false), 3200);
      return () => clearTimeout(t);
    }
  }, [progress && progress.completed]);

  useEffect(() => {
    if (!auth.currentUser) return;
    async function fetchHistory() {
      const q = query(collection(db, "weekly_challenges"), orderBy("assignedAt", "desc"), limit(6));
      const chalSnaps = await getDocs(q);
      let arr = [];
      for (const docSnap of chalSnaps.docs) {
        const wk = docSnap.id;
        const progRef = doc(db, "challenge_progress", `${auth.currentUser.uid}_${wk}`);
        const progSnap = await getDoc(progRef);
        arr.push({
          weekId: wk,
          challenge: docSnap.data().challenge,
          completedDays: progSnap.exists() ? progSnap.data().completedDays : [],
          completed: progSnap.exists() ? progSnap.data().completed : false,
        });
      }
      setHistory(arr);
    }
    fetchHistory();
  }, [auth.currentUser, progress && progress.completed]);

  async function markTodayDone() {
    if (!auth.currentUser) return;
    const ref = doc(db, "challenge_progress", `${auth.currentUser.uid}_${weekId}`);
    let newData = {};
    if (progress && !progress.completedDays.includes(today)) {
      const newDays = [...progress.completedDays, today];
      const isCompleted = newDays.length >= 7;
      newData = {
        userId: auth.currentUser.uid,
        weekId,
        completedDays: newDays,
        completed: isCompleted,
      };
      await setDoc(ref, newData, { merge: true });
      setProgress(newData);
    }
  }

  if (loading || !challenge) return <Loader />;
  const daysDone = progress.completedDays ? progress.completedDays.length : 0;
  const weekDone = progress.completed === true;
  const dayNames = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const weekDates = Array(7)
    .fill(0)
    .map((_, i) => {
      let d = new Date(weekId);
      d.setDate(d.getDate() + i);
      return d.toISOString().slice(0,10);
    });

  return (
    <div>
      <h3> Weekly Challenge</h3>
      <div style={{ fontSize: 16, margin: "1em 0 1.5em" }}>{challenge}</div>

      <div style={{
        background: "#f4f7ff", padding: "1em 1.3em", borderRadius: 16,
        boxShadow: "0 2px 12px #A0E7E533", maxWidth: 390, marginBottom: 20
      }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Progress</div>
        <div style={{ display: "flex", gap: 7, marginBottom: 9 }}>
          {weekDates.map((date, idx) => (
            <div key={date}
              title={date}
              style={{
                width: 38, height: 38, borderRadius: "50%", background: progress.completedDays && progress.completedDays.includes(date) ? "#B4F8C8" : "#fff",
                border: `2.3px solid ${progress.completedDays && progress.completedDays.includes(date) ? "#4cd964" : "#A0E7E5"}`,
                display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#7C83FD", fontSize: 15,
              }}>
              {dayNames[idx]}
            </div>
          ))}
        </div>
        <div style={{ fontSize: 16 }}>
          {weekDone
            ? <span>🎉 Challenge completed! <span style={{color:"#7C83FD"}}>Badge unlocked!</span></span>
            : <span>{daysDone}/7 days done</span>
          }
        </div>
        {!weekDone && (
          <button
            style={{
              marginTop: 13, background: "#7C83FD", color: "#fff", fontWeight: 700,
              border: "none", borderRadius: 8, padding: "0.66em 1.4em", fontSize: 15, boxShadow: "0 1px 7px #7C83FD13",
              cursor: "pointer"
            }}
            onClick={markTodayDone}
            disabled={progress.completedDays && progress.completedDays.includes(today)}
          >
            {progress.completedDays && progress.completedDays.includes(today) ? "Done for today" : "Mark today as done"}
          </button>
        )}
      </div>

      {confetti && (
        <div>
          <Confetti />
          <div style={{
            background: "#fffbe0", color: "#e7a700", border: "2px solid #ffe066", borderRadius: 12,
            padding: "0.6em 2em", margin: "1em 0", fontSize: 21, fontWeight: 800, boxShadow: "0 4px 16px #ffd70033",
            textAlign: "center"
          }}>
            🏅 Weekly Challenge Badge Unlocked!
          </div>
        </div>
      )}

      <div style={{ marginTop: 32, maxWidth: 450 }}>
        <h4 style={{marginBottom: 8}}>Previous Challenges</h4>
        <table style={{width: "100%", background:"#f9faff", borderRadius: 10, overflow: "hidden", fontSize:15, boxShadow:"0 1px 8px #A0E7E511"}}>
          <thead>
            <tr style={{background:"#ecebff"}}>
              <th style={{padding:"7px 10px", fontWeight:600}}>Week</th>
              <th style={{padding:"7px 10px", fontWeight:600}}>Challenge</th>
              <th style={{padding:"7px 10px", fontWeight:600}}>Status</th>
            </tr>
          </thead>
          <tbody>
            {history.slice(1).map((c, i) => (
              <tr key={c.weekId}>
                <td style={{padding:"7px 10px", color:"#888", fontWeight:500}}>{c.weekId}</td>
                <td style={{padding:"7px 10px"}}>{c.challenge}</td>
                <td style={{padding:"7px 10px"}}>
                  {c.completed ? <span style={{color:"#4cd964", fontWeight:600}}>✔ Done</span>
                  : <span style={{color:"#ff7b7b", fontWeight:600}}>{c.completedDays.length}/7</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Confetti() {
  return (
    <div style={{
      position: "fixed", left: 0, top: 0, width: "100vw", height: "100vh", pointerEvents: "none", zIndex: 2000,
    }}>
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-60px) rotateZ(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotateZ(360deg); opacity: 0.7; }
        }
      `}</style>
      {Array(24).fill(0).map((_, i) => {
        const left = Math.random() * 95;
        const dur = 2.4 + Math.random() * 1.5;
        const colors = ["#7C83FD", "#A0E7E5", "#B4F8C8", "#FFF5BA", "#FFAEBC"];
        const color = colors[i % colors.length];
        return (
          <div key={i}
            style={{
              position: "absolute",
              left: `${left}vw`,
              width: 14, height: 14,
              background: color,
              borderRadius: 4,
              opacity: 0.89,
              transform: `rotate(${i * 12}deg)`,
              animation: `confetti-fall ${dur}s ease-out forwards`,
              animationDelay: `${Math.random()}s`,
              top: "-40px",
            }}
          />
        );
      })}
    </div>
  );
}
