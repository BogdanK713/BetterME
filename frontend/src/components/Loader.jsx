import React from "react";
export default function Loader() {
  return (
    <div style={{ textAlign: "center", padding: "2.5em 0", color: "#7C83FD" }}>
      <div style={{
        width: 36, height: 36, border: "4px solid #A0E7E5",
        borderTop: "4px solid #7C83FD", borderRadius: "50%",
        animation: "spin 1.1s linear infinite", margin: "0 auto"
      }} />
      <style>
        {`@keyframes spin {100%{transform:rotate(360deg)}}`}
      </style>
      <div>Loading...</div>
    </div>
  );
}
