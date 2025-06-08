import React from "react";
import { auth } from "../utils/firebase";
import { theme } from "../theme";

export default function Profile({ user }) {
  if (!user) return null;
  return (
    <div className="card" style={{ maxWidth: 420, margin: "0 auto", textAlign: "center" }}>
      <h2> Profile</h2>
      <div style={{ margin: "1.5em 0" }}>
        <div><b>Email:</b> {user.email}</div>
        <div style={{ marginTop: 10, color: "#777" }}><b>User ID:</b> {user.uid}</div>
      </div>
      <button style={{
        background: theme.warning,
        color: "#232946"
      }} onClick={() => { auth.signOut(); window.location.reload(); }}>Sign Out</button>
      <div style={{ marginTop: 30, fontSize: 14, color: "#7C83FD" }}>
        All your data is private and stored securely in Firestore.
      </div>
    </div>
  );
}
