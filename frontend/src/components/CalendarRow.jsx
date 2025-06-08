import React, { useState, useEffect, useRef } from "react";
import { db, auth } from "../utils/firebase";
import { collection, getDocs } from "firebase/firestore";
import useScrollFade from "../hooks/useScrollFade";

const CheckIcon = ({ checked }) => (
  <svg height="24" width="24" viewBox="0 0 24 24">
    <circle
      cx="12"
      cy="12"
      r="11"
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

function getDaysArray(start, end) {
  const arr = [];
  for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
    arr.push(new Date(dt));
  }
  return arr;
}

function getTodayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function CalendarRow({ habits }) {
  const today = new Date();
  const days = getDaysArray(
    new Date(today.getFullYear(), today.getMonth(), today.getDate() - 13),
    today
  );

  const [selected, setSelected] = useState(getTodayISO());
  const [habitChecks, setHabitChecks] = useState({});
  const dateStripRef = useRef(null);
  const gridRef = useRef(null);

  useEffect(() => {
    if (!habits?.length || !auth.currentUser) return;
    let mounted = true;
    (async () => {
      const result = {};
      for (const h of habits) {
        const snap = await getDocs(collection(db, "habits", h.id, "checkins"));
        snap.forEach((c) => {
          const date = c.id;
          result[date] = result[date] || {};
          result[date][h.id] = true;
        });
      }
      if (mounted) setHabitChecks(result);
    })();
    return () => { mounted = false; };
  }, [habits]);

  useEffect(() => {
    if (!dateStripRef.current) return;
    const btn = dateStripRef.current.querySelector(".calendar-date-selected");
    if (btn) btn.scrollIntoView({ behavior: "smooth", inline: "center" });
  }, [selected]);

  useScrollFade(gridRef);

  const getHabitStatus = (date) =>
    habits.map((h) => ({
      ...h,
      checked: Boolean(habitChecks[date]?.[h.id]),
    }));

  return (
    <div>
      <div className="calendar-days-row" ref={dateStripRef}>
        {days.map((d) => {
          const iso = d.toISOString().slice(0, 10);
          return (
            <button
              key={iso}
              className={
                "calendar-date-btn" +
                (selected === iso ? " calendar-date-selected" : "")
              }
              onClick={() => setSelected(iso)}
            >
              <div style={{ fontWeight: 600 }}>{d.getDate()}</div>
              <div style={{ fontSize: 13 }}>
                {d.toLocaleString("en", { month: "short" })}
              </div>
              <div style={{ fontSize: 11, color: "#aaa" }}>
                {d.toLocaleString("en", { weekday: "short" })}
              </div>
            </button>
          );
        })}
      </div>

            <div
        style={{
          fontWeight: 600,
          fontSize: 18.72,
          margin: "18px 0 27px",
          textAlign: "center",
          width: "100%",     
        }}
      >
        Habits on {selected}
      </div>


      <div className="calendar-scroll">
        <div className="scroll-container" style={{ height: "120px" }}>
          <div
            ref={gridRef}
            className="scroll-fade-list"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "8px",
              height: "100%",
              overflowY: "auto",
              position: "relative",
            }}
          >
            {habits.length === 0 ? (
              <div style={{ gridColumn: "1 / -1" }}>No habits yet.</div>
            ) : (
              getHabitStatus(selected).map((h) => (
                <div key={h.id} className="calendar-habit-row">
                  <CheckIcon checked={h.checked} />
                  <span
                    className="calendar-habit-text"
                    style={{ color: h.checked ? "#28A745" : "#1AB2C7" }}
                  >
                    {h.name}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
