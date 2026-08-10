import React, { useEffect, useState } from "react";

const WORKOUT_KEY = "fueltrack_workouts_v04";
const PLAN_KEY = "fueltrack_training_plan_v01";

function num(value) {
  if (value === null || value === undefined || value === "") return 0;

  const n = parseFloat(
    String(value)
      .replace(",", ".")
      .replace(/[^\d.-]/g, "")
  );

  return Number.isFinite(n) ? n : 0;
}

function fmt(value) {
  return Number(value || 0).toLocaleString("pl-PL", {
    maximumFractionDigits: 2
  });
}

function esc(value) {
  return String(value ?? "");
}

function getToday() {
  const d = new Date();

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(date) {
  if (!date) return "";

  const parts = date.split("-");

  if (parts.length !== 3) return date;

  return `${parts[2]}.${parts[1]}.${parts[0]}`;
}

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);

    if (!raw) return fallback;

    const parsed = JSON.parse(raw);

    return parsed;
  } catch {
    return fallback;
  }
}

export default function TrainingPage() {
  const [selectedDate, setSelectedDate] = useState(getToday());

  const [plannedWorkouts, setPlannedWorkouts] = useState(() =>
    loadJSON(PLAN_KEY, [])
  );

  const [completedWorkouts, setCompletedWorkouts] = useState(() =>
    loadJSON(WORKOUT_KEY, [])
  );

  const [showPlanForm, setShowPlanForm] = useState(false);
  const [showCompletedForm, setShowCompletedForm] = useState(false);

  const [planType, setPlanType] = useState("Easy");
  const [planCalories, setPlanCalories] = useState("");
  const [planNote, setPlanNote] = useState("");

  const [wType, setWType] = useState("");
  const [wDistance, setWDistance] = useState("");
  const [wTime, setWTime] = useState("");
  const [wPace, setWPace] = useState("");
  const [wHr, setWHr] = useState("");
  const [wMaxHr, setWMaxHr] = useState("");
  const [wCalories, setWCalories] = useState("");
  const [wCadence, setWCadence] = useState("");
  const [wElevation, setWElevation] = useState("");
  const [wNote, setWNote] = useState("");

  useEffect(() => {
    localStorage.setItem(
      PLAN_KEY,
      JSON.stringify(plannedWorkouts)
    );
  }, [plannedWorkouts]);

  useEffect(() => {
    localStorage.setItem(
      WORKOUT_KEY,
      JSON.stringify(completedWorkouts)
    );
  }, [completedWorkouts]);

  function goHome() {
    window.location.hash = "";
  }

  function addPlannedWorkout() {
    const workout = {
      id: Date.now().toString(),
      date: selectedDate,
      type: planType,
      calories: num(planCalories),
      note: planNote.trim()
    };

    setPlannedWorkouts(prev => [...prev, workout]);

    setPlanCalories("");
    setPlanNote("");
    setShowPlanForm(false);
  }

  function deletePlannedWorkout(id) {
    setPlannedWorkouts(prev =>
      prev.filter(workout => String(workout.id) !== String(id))
    );
  }

  function addCompletedWorkout() {
    if (!wType && !wDistance && !wTime) {
      alert("Wpisz przynajmniej rodzaj, dystans albo czas treningu.");
      return;
    }

    const workout = {
      id: Date.now().toString(),
      date: selectedDate,
      type: wType.trim() || "Trening",
      distance: num(wDistance),
      time: wTime.trim(),
      pace: wPace.trim(),
      hr: num(wHr),
      maxHr: num(wMaxHr),
      calories: num(wCalories),
      cadence: num(wCadence),
      elevation: num(wElevation),
      note: wNote.trim()
    };

    setCompletedWorkouts(prev => [...prev, workout]);

    setWType("");
    setWDistance("");
    setWTime("");
    setWPace("");
    setWHr("");
    setWMaxHr("");
    setWCalories("");
    setWCadence("");
    setWElevation("");
    setWNote("");

    setShowCompletedForm(false);
  }

  function deleteCompletedWorkout(id) {
    setCompletedWorkouts(prev =>
      prev.filter(workout => String(workout.id) !== String(id))
    );
  }

  const plannedForDay = plannedWorkouts.filter(
    workout => workout.date === selectedDate
  );

  const completedForDay = completedWorkouts.filter(
    workout => workout.date === selectedDate
  );

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: "18px",
        fontFamily:
          "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
        color: "#171717"
      }}
    >
      <button
        onClick={goHome}
        style={{
          border: 0,
          borderRadius: 14,
          padding: "11px 15px",
          background: "#eeeeee",
          fontWeight: 700,
          marginBottom: 18
        }}
      >
        ← Żywienie
      </button>

      <div
        style={{
          background: "white",
          borderRadius: 26,
          padding: 22,
          boxShadow: "0 4px 20px rgba(0,0,0,.06)"
        }}
      >
        <h1 style={{ marginTop: 0 }}>
          📅 Planowanie treningów
        </h1>

        <p style={{ color: "#666", marginTop: -8 }}>
          Planowane oraz wykonane treningi.
        </p>

        <label
          style={{
            display: "block",
            fontWeight: 700,
            marginBottom: 7
          }}
        >
          Wybrany dzień
        </label>

        <input
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: 14,
            borderRadius: 13,
            border: "1px solid #ddd",
            fontSize: 16,
            marginBottom: 22
          }}
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 6,
            marginBottom: 25
          }}
        >
          {Array.from({ length: 7 }).map((_, index) => {
            const date = new Date();

            date.setDate(
              date.getDate() - 3 + index
            );

            const year = date.getFullYear();
            const month = String(
              date.getMonth() + 1
            ).padStart(2, "0");
            const day = String(
              date.getDate()
            ).padStart(2, "0");

            const value = `${year}-${month}-${day}`;

            return (
              <button
                key={value}
                onClick={() => setSelectedDate(value)}
                style={{
                  border: 0,
                  borderRadius: 12,
                  padding: "9px 3px",
                  background:
                    selectedDate === value
                      ? "#2463eb"
                      : "#f1f2f5",
                  color:
                    selectedDate === value
                      ? "white"
                      : "#222",
                  fontWeight: 700,
                  fontSize: 12
                }}
              >
                {date.toLocaleDateString("pl-PL", {
                  weekday: "short"
                })}
                <br />
                {date.getDate()}
              </button>
            );
          })}
        </div>

        <div
          style={{
            background: "#f5f6fa",
            borderRadius: 20,
            padding: 18,
            marginBottom: 18
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 10
            }}
          >
            <h2 style={{ margin: 0 }}>
              🎯 Plan dnia
            </h2>

            <button
              onClick={() =>
                setShowPlanForm(!showPlanForm)
              }
              style={{
                border: 0,
                borderRadius: 13,
                padding: "11px 14px",
                background: "#2463eb",
                color: "white",
                fontWeight: 700
              }}
            >
              + Dodaj
            </button>
          </div>

          {plannedForDay.length === 0 && (
            <p style={{ color: "#777" }}>
              Brak zaplanowanych treningów.
            </p>
          )}

          {plannedForDay.map(workout => (
            <div
              key={workout.id}
              style={{
                background: "white",
                borderRadius: 15,
                padding: 15,
                marginTop: 12
              }}
            >
              <strong>{esc(workout.type)}</strong>

              {workout.calories > 0 && (
                <div style={{ marginTop: 5 }}>
                  🔥 około {fmt(workout.calories)} kcal
                </div>
              )}

              {workout.note && (
                <div
                  style={{
                    marginTop: 7,
                    color: "#666"
                  }}
                >
                  {esc(workout.note)}
                </div>
              )}

              <button
                onClick={() =>
                  deletePlannedWorkout(workout.id)
                }
                style={{
                  marginTop: 10,
                  border: 0,
                  borderRadius: 9,
                  padding: "7px 10px",
                  background: "#fee4e2",
                  color: "#b42318",
                  fontWeight: 700
                }}
              >
                Usuń
              </button>
            </div>
          ))}

          {showPlanForm && (
            <div
              style={{
                marginTop: 15,
                background: "white",
                borderRadius: 17,
                padding: 16
              }}
            >
              <h3>Nowy trening w planie</h3>

              <select
                value={planType}
                onChange={e =>
                  setPlanType(e.target.value)
                }
                style={{
                  width: "100%",
                  padding: 13,
                  borderRadius: 12,
                  border: "1px solid #ddd",
                  marginBottom: 8
                }}
              >
                <option>Easy</option>
                <option>Long</option>
                <option>Interwały</option>
                <option>Podbiegi</option>
                <option>Tempo</option>
                <option>Siłownia</option>
                <option>Regeneracja</option>
                <option>Inny</option>
              </select>

              <input
                type="number"
                placeholder="Przypuszczalne kcal"
                value={planCalories}
                onChange={e =>
                  setPlanCalories(e.target.value)
                }
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: 13,
                  borderRadius: 12,
                  border: "1px solid #ddd",
                  marginBottom: 8
                }}
              />

              <textarea
                placeholder="Notatka / szczegóły treningu"
                rows="3"
                value={planNote}
                onChange={e =>
                  setPlanNote(e.target.value)
                }
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: 13,
                  borderRadius: 12,
                  border: "1px solid #ddd"
                }}
              />

              <button
                onClick={addPlannedWorkout}
                style={{
                  width: "100%",
                  marginTop: 10,
                  border: 0,
                  borderRadius: 13,
                  padding: 14,
                  background: "#16794b",
                  color: "white",
                  fontWeight: 700
                }}
              >
                Zapisz w planie
              </button>
            </div>
          )}
        </div>

        <div
          style={{
            background: "#f5f6fa",
            borderRadius: 20,
            padding: 18
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 10
            }}
          >
            <h2 style={{ margin: 0 }}>
              🏃 Wykonane treningi
            </h2>

            <button
              onClick={() =>
                setShowCompletedForm(
                  !showCompletedForm
                )
              }
              style={{
                border: 0,
                borderRadius: 13,
                padding: "11px 14px",
                background: "#16794b",
                color: "white",
                fontWeight: 700
              }}
            >
              + Dodaj
            </button>
          </div>

          {completedForDay.length === 0 && (
            <p style={{ color: "#777" }}>
              Brak zapisanych treningów.
            </p>
          )}

          {completedForDay.map(workout => (
            <div
              key={workout.id}
              style={{
                background: "white",
                borderRadius: 15,
                padding: 15,
                marginTop: 12
              }}
            >
              <strong>
                🏃 {esc(workout.type)}
              </strong>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                  marginTop: 12
                }}
              >
                {workout.distance > 0 && (
                  <div>
                    <small>Dystans</small>
                    <br />
                    <b>{fmt(workout.distance)} km</b>
                  </div>
                )}

                {workout.time && (
                  <div>
                    <small>Czas</small>
                    <br />
                    <b>{esc(workout.time)}</b>
                  </div>
                )}

                {workout.pace && (
                  <div>
                    <small>Tempo</small>
                    <br />
                    <b>{esc(workout.pace)}</b>
                  </div>
                )}

                {workout.hr > 0 && (
                  <div>
                    <small>Śr. HR</small>
                    <br />
                    <b>{fmt(workout.hr)}</b>
                  </div>
                )}

                {workout.maxHr > 0 && (
                  <div>
                    <small>Max HR</small>
                    <br />
                    <b>{fmt(workout.maxHr)}</b>
                  </div>
                )}

                {workout.calories > 0 && (
                  <div>
                    <small>Kalorie</small>
                    <br />
                    <b>
                      {fmt(workout.calories)} kcal
                    </b>
                  </div>
                )}

                {workout.cadence > 0 && (
                  <div>
                    <small>Kadencja</small>
                    <br />
                    <b>{fmt(workout.cadence)}</b>
                  </div>
                )}

                {workout.elevation > 0 && (
                  <div>
                    <small>Przewyższenie</small>
                    <br />
                    <b>{fmt(workout.elevation)} m</b>
                  </div>
                )}
              </div>

              {workout.note && (
                <div
                  style={{
                    marginTop: 12,
                    borderTop: "1px solid #eee",
                    paddingTop: 10,
                    color: "#555"
                  }}
                >
                  📝 {esc(workout.note)}
                </div>
              )}

              <button
                onClick={() =>
                  deleteCompletedWorkout(
                    workout.id
                  )
                }
                style={{
                  marginTop: 12,
                  border: 0,
                  borderRadius: 9,
                  padding: "7px 10px",
                  background: "#fee4e2",
                  color: "#b42318",
                  fontWeight: 700
                }}
              >
                Usuń
              </button>
            </div>
          ))}

          {showCompletedForm && (
            <div
              style={{
                marginTop: 15,
                background: "white",
                borderRadius: 17,
                padding: 16
              }}
            >
              <h3>Dodaj wykonany trening</h3>

              <input
                placeholder="Rodzaj, np. Easy / Long / Interwały"
                value={wType}
                onChange={e =>
                  setWType(e.target.value)
                }
              />

              <input
                type="number"
                step="0.01"
                placeholder="Dystans km"
                value={wDistance}
                onChange={e =>
                  setWDistance(e.target.value)
                }
              />

              <input
                placeholder="Czas, np. 52:34"
                value={wTime}
                onChange={e =>
                  setWTime(e.target.value)
                }
              />

              <input
                placeholder="Tempo, np. 5:18/km"
                value={wPace}
                onChange={e =>
                  setWPace(e.target.value)
                }
              />

              <input
                type="number"
                placeholder="Średnie tętno"
                value={wHr}
                onChange={e =>
                  setWHr(e.target.value)
                }
              />

              <input
                type="number"
                placeholder="Maksymalne tętno"
                value={wMaxHr}
                onChange={e =>
                  setWMaxHr(e.target.value)
                }
              />

              <input
                type="number"
                placeholder="Kalorie treningu"
                value={wCalories}
                onChange={e =>
                  setWCalories(e.target.value)
                }
              />

              <input
                type="number"
                placeholder="Kadencja"
                value={wCadence}
                onChange={e =>
                  setWCadence(e.target.value)
                }
              />

              <input
                type="number"
                placeholder="Przewyższenie m"
                value={wElevation}
                onChange={e =>
                  setWElevation(e.target.value)
                }
              />

              <textarea
                rows="3"
                placeholder="Odczucia / notatka"
                value={wNote}
                onChange={e =>
                  setWNote(e.target.value)
                }
              />

              <button
                onClick={addCompletedWorkout}
                style={{
                  width: "100%",
                  marginTop: 10,
                  border: 0,
                  borderRadius: 13,
                  padding: 14,
                  background: "#16794b",
                  color: "white",
                  fontWeight: 700
                }}
              >
                Zapisz trening
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        input,
        textarea,
        select {
          font-family: inherit;
          font-size: 16px;
        }

        .training-page-input {
          width: 100%;
          box-sizing: border-box;
          padding: 13px;
          border-radius: 12px;
          border: 1px solid #ddd;
          margin-bottom: 8px;
        }
      `}</style>
    </div>
  );
}
