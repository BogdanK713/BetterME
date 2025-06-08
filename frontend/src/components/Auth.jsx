import React, { useState } from "react";
import { auth } from "../utils/firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { theme } from "../theme";

export default function Auth({ onAuth }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  auth.onAuthStateChanged((usr) => {
    if (usr && onAuth) onAuth(usr);
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      setEmail("");
      setPassword("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: 370, margin: "2rem auto", boxShadow: "0 4px 18px #0001" }}>
      <h2 style={{ marginBottom: 12 }}>{isRegister ? "Register" : "Login"}</h2>
      <form onSubmit={handleSubmit}>
        <input
          placeholder="Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          disabled={loading}
        /><br /><br />
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          disabled={loading}
        /><br /><br />
        <button type="submit" disabled={loading}>
          {loading ? "Loading..." : (isRegister ? "Register" : "Login")}
        </button>
      </form>
      <br />
      <button
        onClick={() => setIsRegister(!isRegister)}
        type="button"
        style={{
          background: "#F4F7FF",
          color: "#7C83FD",
          fontWeight: 500,
          marginTop: 0,
          fontSize: 14
        }}
        disabled={loading}
      >
        {isRegister ? "Already have an account? Login" : "No account? Register"}
      </button>
      {error && <p style={{ color: "red", marginTop: 12 }}>{error}</p>}
      <div style={{ fontSize: 13, color: "#aaa", marginTop: 20 }}>
        Sign in to save, track, and get reminders for your habits!
      </div>
    </div>
  );
}
