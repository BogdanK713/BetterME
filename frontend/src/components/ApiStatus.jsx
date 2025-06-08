import React, { useState } from "react";
import { theme } from "../theme";

export default function ApiStatus() {
  const [msg, setMsg] = useState("");
  const fetchStatus = async () => {
    try {
      const res = await fetch("https://us-central1-better-me-faas.cloudfunctions.net/helloWorld");
      const text = await res.text();
      setMsg(text);
    } catch (err) {
      setMsg("Error: " + err.message);
    }
  };
  return (
    <div className="" style={{ maxWidth: 480, margin: "2rem auto", textAlign:'center' }}>
      <h3>API Status</h3>
      <button onClick={fetchStatus}>Check API Status</button>
      {msg && <div style={{ marginTop: 10, color: theme.primary }}>{msg}</div>}
      <div style={{ fontSize: 12, color: "#999", marginTop: 8 }}>Checks deployed HTTP FaaS endpoint.</div>
    </div>
  );
}
