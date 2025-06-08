import React, { useEffect, useState } from "react";
import { db, auth } from "../utils/firebase";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc
} from "firebase/firestore";
import Loader from "./Loader";

export default function Notifications({ page }) {
  const [notifications, setNotifications] = useState(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const q = query(
      collection(db, "users", user.uid, "notifications"),
      orderBy("sentAt", "desc"),
      limit(15)
    );
    return onSnapshot(q, (snap) => {
      setNotifications(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user || !notifications) return;
    if (page !== "notifications") return;
    notifications.forEach(n => {
      if (!n.read) {
        updateDoc(doc(db, "users", user.uid, "notifications", n.id), { read: true });
      }
    });
  }, [notifications, page]);

  const handleDismiss = async (notifId) => {
    const user = auth.currentUser;
    if (!user) return;
    await deleteDoc(doc(db, "users", user.uid, "notifications", notifId));
  };

  if (!auth.currentUser) return null;
  if (!notifications) return <Loader />;

  return (
    <div className="card">
      <h3 style={{ marginBottom: 16 }}> Notifications</h3>
      {notifications.length === 0 && <div style={{ color: "#aaa" }}>No notifications yet.</div>}
      <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
        {notifications.map((n) => (
          <li key={n.id} style={{
            marginBottom: 14,
            background: n.type === "reminder" ? "#e8f0ff" : n.type === "followup" ? "#fffbe8" : "#eee",
            padding: "0.7em 1.2em",
            borderRadius: 12,
            boxShadow: n.read ? "none" : "0 2px 12px #A0E7E522",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12
          }}>
            <div>
              <b>
                {n.type === "reminder" && "⏰ "}
                {n.type === "followup" && "🔄 "}
                {n.title}
              </b>: {n.message}
              <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
                {n.sentAt?.toDate?.().toLocaleString?.() || ""}
              </div>
            </div>
            <button
              title="Dismiss"
              aria-label="Dismiss notification"
              onClick={() => handleDismiss(n.id)}
              style={{
                marginLeft: 8,
                background: "#ff7b7b",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "4px 12px",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 14
              }}
            >
               Dismiss
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
