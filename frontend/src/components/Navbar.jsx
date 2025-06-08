import React, { useEffect, useState } from "react";
import { theme } from "../theme";
import { db } from "../utils/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";

function useUnreadNotifications(user) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) return setCount(0);
    const q = query(
      collection(db, "users", user.uid, "notifications"),
      where("read", "==", false)
    );
    return onSnapshot(q, (snap) => setCount(snap.size));
  }, [user]); 

  return count;
}

export default function Navbar({ page, setPage, user, onLogout }) {
  const unread = useUnreadNotifications(user);

  return (
    <nav style={{
      background: theme.primary,
      color: "#fff",
      padding: "1.1rem 2.5rem",
      borderRadius: "0 0 20px 20px",
      marginBottom: "2.5rem",
      boxShadow: "0 4px 18px #0001",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    }}>
      <div style={{ fontWeight: 800, fontSize: "1.35rem", letterSpacing: 1 }}>
        BetterME
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
        <NavItem label="Dashboard" page="dashboard" active={page} setPage={setPage} />
        <NavItem label="Habits" page="habits" active={page} setPage={setPage} />
        <NavItem
          label={
            <>
              Notifications
              {unread > 0 && (
                <span style={{
                  marginLeft: 6,
                  background: "#ff7b7b",
                  color: "#fff",
                  borderRadius: "999px",
                  fontSize: 11,
                  padding: "2px 7px",
                  fontWeight: 700
                }}>{unread}</span>
              )}
            </>
          }
          page="notifications"
          active={page}
          setPage={setPage}
        />
        <NavItem label="Profile" page="profile" active={page} setPage={setPage} />
        {user &&
          <div style={{ display: "flex", alignItems: "center", gap: "1.1rem", marginLeft: "2rem" }}>
            <span style={{ fontWeight: 500 }}>{user.email}</span>
            <button onClick={onLogout} style={{
              background: theme.accent, color: "#222", borderRadius: 10, padding: "0.35rem 1rem", marginLeft: "0.5rem"
            }}>Logout</button>
          </div>
        }
      </div>
    </nav>
  );
}

function NavItem({ label, page, active, setPage }) {
  return (
    <a href="#"
      className={active === page ? "active" : ""}
      style={{
        color: "#fff",
        textDecoration: "none",
        fontWeight: active === page ? 700 : 400,
        borderBottom: active === page ? "2px solid #A0E7E5" : "none",
        paddingBottom: 3,
        marginRight: 10,
        letterSpacing: 0.5
      }}
      onClick={e => { e.preventDefault(); setPage(page); }}>
      {label}
    </a>
  );
}
