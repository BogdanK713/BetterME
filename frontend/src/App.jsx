import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Auth from "./components/Auth";
import Dashboard from "./components/Dashboard";
import Habits from "./components/Habits";
import WeeklyChallenge from "./components/WeeklyChallenge";
import Notifications from "./components/Notifications";
import ProgressAlbum from "./components/ProgressAlbum";
import ApiStatus from "./components/ApiStatus";
import Profile from "./components/Profile";
import Loader from "./components/Loader";
import { db, auth } from "./utils/firebase";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import "./App.css";

function NotificationToast({ user }) {
  const [latest, setLatest] = useState(null);
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "users", user.uid, "notifications"),
      orderBy("sentAt", "desc"),
      limit(1)
    );
    let prevId = null;
    return onSnapshot(q, (snap) => {
      const d = snap.docs[0];
      if (!d) return;
      const n = { ...d.data(), id: d.id };
      if (!n.read && d.id !== prevId) {
        setLatest(n);
        prevId = d.id;
        setTimeout(() => setLatest(null), 4000);
      }
    });
  }, [user]);
  if (!latest) return null;
  return (
    <div style={{
      position: "fixed", left: "50%", bottom: 38, transform: "translateX(-50%)",
      background: "#fff", color: "#7C83FD", border: "2px solid #A0E7E5",
      borderRadius: 16, boxShadow: "0 2px 18px #0003", padding: "1em 2em", fontWeight: 700, zIndex: 2000,
      animation: "notif-fade-in 0.2s"
    }}>
      <span role="img" aria-label="bell">🔔</span> {latest.title}: {latest.message}
      <style>{`
        @keyframes notif-fade-in { from { opacity: 0; transform: translateY(30px) scale(0.98) } to { opacity: 1; } }
      `}</style>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(undefined);
  const [page, setPage] = useState("dashboard");

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(u => setUser(u || null));
    return unsub;
  }, []);

  if (user === undefined) return <Loader />;

  return (
    <div style={{ minHeight: "100vh", background: "rgba(183, 250, 247, 0.17)", width: "100vw" }}>
      <Navbar page={page} setPage={setPage} user={user} onLogout={() => { setUser(null); auth.signOut(); window.location.reload(); }} />
      <NotificationToast user={user} />
      <main className="main-app-content">
        {!user ? (
          <Auth onAuth={setUser} />
        ) : (
          <div>
            {page === "dashboard" && <Dashboard user={user} />}
            {page === "habits" && <Habits />}
            {page === "challenges" && <WeeklyChallenge />}
            {page === "notifications" && <Notifications page={page} />}
            {page === "photo" && <ProgressAlbum />}
            {page === "api" && <ApiStatus />}
            {page === "profile" && <Profile user={user} />}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
