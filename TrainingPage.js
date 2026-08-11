import React, { useEffect, useState } from "react";

/* =========================================================
   FUELTRACK AI
   TRAINING PAGE
   Wersja poprawiona

   WSPÓLNE KLUCZE Z app.js:
   - WORKOUT_KEY = fueltrack_workouts_v04
   - PLAN_KEY    = fueltrack_training_plans_v01

   Dodatkowo obsługa starego klucza:
   fueltrack_training_plan_v01
========================================================= */

const WORKOUT_KEY = "fueltrack_workouts_v04";
const PLAN_KEY = "fueltrack_training_plans_v01";
const OLD_PLAN_KEY = "fueltrack_training_plan_v01";


/* =========================================================
   POMOCNICZE
========================================================= */

function num(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return 0;
  }

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

  const month = String(
    d.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    d.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


function formatDate(date) {
  if (!date) return "";

  const parts = date.split("-");

  if (parts.length !== 3) {
    return date;
  }

  return `${parts[2]}.${parts[1]}.${parts[0]}`;
}


function loadJSON(key, fallback) {
  try {
    const raw =
      localStorage.getItem(key);

    if (!raw) {
      return fallback;
    }

    const parsed =
      JSON.parse(raw);

    return parsed;
  } catch {
    return fallback;
  }
}


/* =========================================================
   MIGRACJA PLANÓW
========================================================= */

function loadPlans() {

  /*
     Najpierw prawidłowy, wspólny klucz.
  */

  const current =
    loadJSON(
      PLAN_KEY,
      null
    );

  if (
    Array.isArray(current)
  ) {
    return current;
  }


  /*
     Jeżeli nie ma danych pod nowym kluczem,
     sprawdzamy stary klucz.
  */

  const old =
    loadJSON(
      OLD_PLAN_KEY,
      null
    );

  if (
    Array.isArray(old)
  ) {

    /*
       Od razu przenosimy dane
       do prawidłowego klucza.
    */

    localStorage.setItem(
      PLAN_KEY,
      JSON.stringify(old)
    );

    return old;
  }


  return [];
}


/* =========================================================
   KOMPONENT
========================================================= */

export default function TrainingPage() {

  /* =======================================================
     DATA
  ======================================================= */

  const [
    selectedDate,
    setSelectedDate
  ] = useState(
    getToday()
  );


  /* =======================================================
     DANE
  ======================================================= */

  const [
    plannedWorkouts,
    setPlannedWorkouts
  ] = useState(
    () => loadPlans()
  );


  const [
    completedWorkouts,
    setCompletedWorkouts
  ] = useState(
    () =>
      loadJSON(
        WORKOUT_KEY,
        []
      )
  );


  /* =======================================================
     WIDOCZNOŚĆ FORMULARZY
  ======================================================= */

  const [
    showPlanForm,
    setShowPlanForm
  ] = useState(false);


  const [
    showCompletedForm,
    setShowCompletedForm
  ] = useState(false);


  /* =======================================================
     PLANOWANY TRENING
  ======================================================= */

  const [
    planType,
    setPlanType
  ] = useState("Easy");


  const [
    planCalories,
    setPlanCalories
  ] = useState("");


  const [
    planDistance,
    setPlanDistance
  ] = useState("");


  const [
    planNote,
    setPlanNote
  ] = useState("");


  /* =======================================================
     WYKONANY TRENING
  ======================================================= */

  const [
    wType,
    setWType
  ] = useState("");


  const [
    wDistance,
    setWDistance
  ] = useState("");


  const [
    wTime,
    setWTime
  ] = useState("");


  const [
    wPace,
    setWPace
  ] = useState("");


  const [
    wHr,
    setWHr
  ] = useState("");


  const [
    wMaxHr,
    setWMaxHr
  ] = useState("");


  const [
    wCalories,
    setWCalories
  ] = useState("");


  const [
    wCadence,
    setWCadence
  ] = useState("");


  const [
    wElevation,
    setWElevation
  ] = useState("");


  const [
    wNote,
    setWNote
  ] = useState("");


  /* =======================================================
     ZAPIS PLANÓW
  ======================================================= */

  useEffect(() => {

    localStorage.setItem(
      PLAN_KEY,
      JSON.stringify(
        plannedWorkouts
      )
    );

  }, [plannedWorkouts]);


  /* =======================================================
     ZAPIS WYKONANYCH TRENINGÓW
  ======================================================= */

  useEffect(() => {

    localStorage.setItem(
      WORKOUT_KEY,
      JSON.stringify(
        completedWorkouts
      )
    );

  }, [completedWorkouts]);


  /* =======================================================
     POWRÓT
  ======================================================= */

  function goHome() {

    window.location.hash = "";

  }


  /* =======================================================
     DODANIE PLANOWANEGO TRENINGU
  ======================================================= */

  function addPlannedWorkout() {

    if (!selectedDate) {

      alert(
        "Wybierz datę treningu."
      );

      return;
    }


    const workout = {

      id:
        Date.now().toString(),

      date:
        selectedDate,

      type:
        planType,

      calories:
        num(planCalories),

      distance:
        num(planDistance),

      note:
        planNote.trim()

    };


    setPlannedWorkouts(
      prev => [
        ...prev,
        workout
      ]
    );


    setPlanCalories("");

    setPlanDistance("");

    setPlanNote("");

    setShowPlanForm(false);
  }


  /* =======================================================
     USUNIĘCIE PLANOWANEGO TRENINGU
  ======================================================= */

  function deletePlannedWorkout(id) {

    setPlannedWorkouts(
      prev =>
        prev.filter(
          workout =>
            String(workout.id) !==
            String(id)
        )
    );
  }


  /* =======================================================
     DODANIE WYKONANEGO TRENINGU
  ======================================================= */

  function addCompletedWorkout() {

    if (
      !wType &&
      !wDistance &&
      !wTime
    ) {

      alert(
        "Wpisz przynajmniej rodzaj, dystans albo czas treningu."
      );

      return;
    }


    const workout = {

      id:
        Date.now().toString(),

      date:
        selectedDate,

      type:
        wType.trim() ||
        "Trening",

      distance:
        num(wDistance),

      time:
        wTime.trim(),

      pace:
        wPace.trim(),

      hr:
        num(wHr),

      maxHr:
        num(wMaxHr),

      calories:
        num(wCalories),

      cadence:
        num(wCadence),

      elevation:
        num(wElevation),

      note:
        wNote.trim()

    };


    setCompletedWorkouts(
      prev => [
        ...prev,
        workout
      ]
    );


    /*
       Czyszczenie formularza.
    */

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


  /* =======================================================
     USUNIĘCIE WYKONANEGO TRENINGU
  ======================================================= */

  function deleteCompletedWorkout(id) {

    setCompletedWorkouts(
      prev =>
        prev.filter(
          workout =>
            String(workout.id) !==
            String(id)
        )
    );
  }


  /* =======================================================
     DANE WYBRANEGO DNIA
  ======================================================= */

  const plannedForDay =
    plannedWorkouts.filter(
      workout =>
        workout.date ===
        selectedDate
    );


  const completedForDay =
    completedWorkouts.filter(
      workout =>
        workout.date ===
        selectedDate
    );


  /* =======================================================
     SUMA PLANOWANYCH KCAL
  ======================================================= */

  const plannedCalories =
    plannedForDay.reduce(
      (sum, workout) =>
        sum +
        num(workout.calories),
      0
    );


  /* =======================================================
     SUMA WYKONANYCH KCAL
  ======================================================= */

  const completedCalories =
    completedForDay.reduce(
      (sum, workout) =>
        sum +
        num(workout.calories),
      0
    );


  /* =======================================================
     RENDER
  ======================================================= */

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

      {/* ===================================================
          POWRÓT
      =================================================== */}

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


      {/* ===================================================
          GŁÓWNY KONTENER
      =================================================== */}

      <div
        style={{
          background: "white",
          borderRadius: 26,
          padding: 22,
          boxShadow:
            "0 4px 20px rgba(0,0,0,.06)"
        }}
      >

        <h1
          style={{
            marginTop: 0
          }}
        >
          📅 Planowanie treningów
        </h1>


        <p
          style={{
            color: "#666",
            marginTop: -8
          }}
        >
          Planowane oraz wykonane treningi.
        </p>


        {/* =================================================
            WYBRANY DZIEŃ
        ================================================= */}

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
          onChange={e =>
            setSelectedDate(
              e.target.value
            )
          }
          className="training-page-input"
        />


        <div
          style={{
            fontSize: 14,
            color: "#777",
            marginTop: -12,
            marginBottom: 18
          }}
        >
          {formatDate(selectedDate)}
        </div>


        {/* =================================================
            SZYBKI WYBÓR DATY
        ================================================= */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(7, 1fr)",
            gap: 6,
            marginBottom: 25
          }}
        >

          {Array
            .from({
              length: 7
            })
            .map(
              (_, index) => {

                const date =
                  new Date();

                date.setDate(
                  date.getDate() -
                  3 +
                  index
                );


                const year =
                  date.getFullYear();


                const month =
                  String(
                    date.getMonth() + 1
                  ).padStart(
                    2,
                    "0"
                  );


                const day =
                  String(
                    date.getDate()
                  ).padStart(
                    2,
                    "0"
                  );


                const value =
                  `${year}-${month}-${day}`;


                return (

                  <button
                    key={value}
                    onClick={() =>
                      setSelectedDate(
                        value
                      )
                    }
                    style={{
                      border: 0,
                      borderRadius: 12,
                      padding:
                        "9px 3px",
                      background:
                        selectedDate ===
                        value
                          ? "#2463eb"
                          : "#f1f2f5",
                      color:
                        selectedDate ===
                        value
                          ? "white"
                          : "#222",
                      fontWeight: 700,
                      fontSize: 12
                    }}
                  >

                    {date.toLocaleDateString(
                      "pl-PL",
                      {
                        weekday:
                          "short"
                      }
                    )}

                    <br />

                    {date.getDate()}

                  </button>

                );
              }
            )}

        </div>


        {/* =================================================
            PLAN DNIA
        ================================================= */}

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
              justifyContent:
                "space-between",
              alignItems: "center",
              gap: 10
            }}
          >

            <div>

              <h2
                style={{
                  margin: 0
                }}
              >
                🎯 Plan dnia
              </h2>

              {plannedCalories > 0 && (

                <div
                  style={{
                    marginTop: 5,
                    fontSize: 13,
                    color: "#666"
                  }}
                >
                  🔥 Planowane:
                  {" "}
                  {fmt(
                    plannedCalories
                  )}
                  {" "}
                  kcal
                </div>

              )}

            </div>


            <button
              onClick={() =>
                setShowPlanForm(
                  !showPlanForm
                )
              }
              style={{
                border: 0,
                borderRadius: 13,
                padding:
                  "11px 14px",
                background: "#2463eb",
                color: "white",
                fontWeight: 700
              }}
            >
              + Dodaj
            </button>

          </div>


          {/* -----------------------------------------------
              BRAK PLANÓW
          ----------------------------------------------- */}

          {plannedForDay.length === 0 && (

            <p
              style={{
                color: "#777"
              }}
            >
              Brak zaplanowanych treningów.
            </p>

          )}


          {/* -----------------------------------------------
              LISTA PLANÓW
          ----------------------------------------------- */}

          {plannedForDay.map(
            workout => (

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
                  {esc(
                    workout.type
                  )}
                </strong>


                {workout.distance > 0 && (

                  <div
                    style={{
                      marginTop: 5
                    }}
                  >
                    📏
                    {" "}
                    {fmt(
                      workout.distance
                    )}
                    {" "}
                    km
                  </div>

                )}


                {workout.calories > 0 && (

                  <div
                    style={{
                      marginTop: 5
                    }}
                  >
                    🔥 około
                    {" "}
                    {fmt(
                      workout.calories
                    )}
                    {" "}
                    kcal
                  </div>

                )}


                {workout.note && (

                  <div
                    style={{
                      marginTop: 7,
                      color: "#666"
                    }}
                  >
                    {esc(
                      workout.note
                    )}
                  </div>

                )}


                <button
                  onClick={() =>
                    deletePlannedWorkout(
                      workout.id
                    )
                  }
                  style={{
                    marginTop: 10,
                    border: 0,
                    borderRadius: 9,
                    padding:
                      "7px 10px",
                    background:
                      "#fee4e2",
                    color:
                      "#b42318",
                    fontWeight: 700
                  }}
                >
                  Usuń
                </button>

              </div>

            )
          )}


          {/* =================================================
              FORMULARZ PLANU
          ================================================= */}

          {showPlanForm && (

            <div
              style={{
                marginTop: 15,
                background: "white",
                borderRadius: 17,
                padding: 16
              }}
            >

              <h3>
                Nowy trening w planie
              </h3>


              <select
                value={planType}
                onChange={e =>
                  setPlanType(
                    e.target.value
                  )
                }
                className="training-page-input"
              >

                <option>
                  Easy
                </option>

                <option>
                  Long
                </option>

                <option>
                  Interwały
                </option>

                <option>
                  Podbiegi
                </option>

                <option>
                  Tempo
                </option>

                <option>
                  Siłownia
                </option>

                <option>
                  Regeneracja
                </option>

                <option>
                  Inny
                </option>

              </select>


              <input
                type="number"
                step="0.01"
                placeholder="Dystans km"
                value={planDistance}
                onChange={e =>
                  setPlanDistance(
                    e.target.value
                  )
                }
                className="training-page-input"
              />


              <input
                type="number"
                placeholder="Przypuszczalne kcal"
                value={planCalories}
                onChange={e =>
                  setPlanCalories(
                    e.target.value
                  )
                }
                className="training-page-input"
              />


              <textarea
                placeholder="Notatka / szczegóły treningu"
                rows="4"
                value={planNote}
                onChange={e =>
                  setPlanNote(
                    e.target.value
                  )
                }
                className="training-page-input"
              />


              <button
                onClick={
                  addPlannedWorkout
                }
                style={{
                  width: "100%",
                  marginTop: 4,
                  border: 0,
                  borderRadius: 13,
                  padding: 14,
                  background:
                    "#16794b",
                  color: "white",
                  fontWeight: 700
                }}
              >
                Zapisz w planie
              </button>

            </div>

          )}

        </div>


        {/* =================================================
            WYKONANE TRENINGI
        ================================================= */}

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
              justifyContent:
                "space-between",
              alignItems: "center",
              gap: 10
            }}
          >

            <div>

              <h2
                style={{
                  margin: 0
                }}
              >
                🏃 Wykonane treningi
              </h2>


              {completedCalories > 0 && (

                <div
                  style={{
                    marginTop: 5,
                    fontSize: 13,
                    color: "#666"
                  }}
                >
                  🔥 Spalone:
                  {" "}
                  {fmt(
                    completedCalories
                  )}
                  {" "}
                  kcal
                </div>

              )}

            </div>


            <button
              onClick={() =>
                setShowCompletedForm(
                  !showCompletedForm
                )
              }
              style={{
                border: 0,
                borderRadius: 13,
                padding:
                  "11px 14px",
                background:
                  "#16794b",
                color: "white",
                fontWeight: 700
              }}
            >
              + Dodaj
            </button>

          </div>


          {/* -----------------------------------------------
              BRAK TRENINGÓW
          ----------------------------------------------- */}

          {completedForDay.length === 0 && (

            <p
              style={{
                color: "#777"
              }}
            >
              Brak zapisanych treningów.
            </p>

          )}


          {/* -----------------------------------------------
              LISTA WYKONANYCH
          ----------------------------------------------- */}

          {completedForDay.map(
            workout => (

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
                  🏃
                  {" "}
                  {esc(
                    workout.type
                  )}
                </strong>


                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "1fr 1fr",
                    gap: 10,
                    marginTop: 12
                  }}
                >

                  {workout.distance > 0 && (

                    <div>
                      <small>
                        Dystans
                      </small>
                      <br />
                      <b>
                        {fmt(
                          workout.distance
                        )}
                        {" "}
                        km
                      </b>
                    </div>

                  )}


                  {workout.time && (

                    <div>
                      <small>
                        Czas
                      </small>
                      <br />
                      <b>
                        {esc(
                          workout.time
                        )}
                      </b>
                    </div>

                  )}


                  {workout.pace && (

                    <div>
                      <small>
                        Tempo
                      </small>
                      <br />
                      <b>
                        {esc(
                          workout.pace
                        )}
                      </b>
                    </div>

                  )}


                  {workout.hr > 0 && (

                    <div>
                      <small>
                        Śr. HR
                      </small>
                      <br />
                      <b>
                        {fmt(
                          workout.hr
                        )}
                        {" "}
                        bpm
                      </b>
                    </div>

                  )}


                  {workout.maxHr > 0 && (

                    <div>
                      <small>
                        Max HR
                      </small>
                      <br />
                      <b>
                        {fmt(
                          workout.maxHr
                        )}
                        {" "}
                        bpm
                      </b>
                    </div>

                  )}


                  {workout.calories > 0 && (

                    <div>
                      <small>
                        Kalorie
                      </small>
                      <br />
                      <b>
                        {fmt(
                          workout.calories
                        )}
                        {" "}
                        kcal
                      </b>
                    </div>

                  )}


                  {workout.cadence > 0 && (

                    <div>
                      <small>
                        Kadencja
                      </small>
                      <br />
                      <b>
                        {fmt(
                          workout.cadence
                        )}
                        {" "}
                        spm
                      </b>
                    </div>

                  )}


                  {workout.elevation > 0 && (

                    <div>
                      <small>
                        Przewyższenie
                      </small>
                      <br />
                      <b>
                        {fmt(
                          workout.elevation
                        )}
                        {" "}
                        m
                      </b>
                    </div>

                  )}

                </div>


                {workout.note && (

                  <div
                    style={{
                      marginTop: 12,
                      borderTop:
                        "1px solid #eee",
                      paddingTop: 10,
                      color: "#555"
                    }}
                  >
                    📝
                    {" "}
                    {esc(
                      workout.note
                    )}
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
                    padding:
                      "7px 10px",
                    background:
                      "#fee4e2",
                    color:
                      "#b42318",
                    fontWeight: 700
                  }}
                >
                  Usuń
                </button>

              </div>

            )
          )}


          {/* =================================================
              FORMULARZ WYKONANEGO TRENINGU
          ================================================= */}

          {showCompletedForm && (

            <div
              style={{
                marginTop: 15,
                background: "white",
                borderRadius: 17,
                padding: 16
              }}
            >

              <h3>
                Dodaj wykonany trening
              </h3>


              <input
                placeholder="Rodzaj, np. Easy / Long / Interwały"
                value={wType}
                onChange={e =>
                  setWType(
                    e.target.value
                  )
                }
                className="training-page-input"
              />


              <input
                type="number"
                step="0.01"
                placeholder="Dystans km"
                value={wDistance}
                onChange={e =>
                  setWDistance(
                    e.target.value
                  )
                }
                className="training-page-input"
              />


              <input
                placeholder="Czas, np. 52:34"
                value={wTime}
                onChange={e =>
                  setWTime(
                    e.target.value
                  )
                }
                className="training-page-input"
              />


              <input
                placeholder="Tempo, np. 5:18/km"
                value={wPace}
                onChange={e =>
                  setWPace(
                    e.target.value
                  )
                }
                className="training-page-input"
              />


              <input
                type="number"
                placeholder="Średnie tętno"
                value={wHr}
                onChange={e =>
                  setWHr(
                    e.target.value
                  )
                }
                className="training-page-input"
              />


              <input
                type="number"
                placeholder="Maksymalne tętno"
                value={wMaxHr}
                onChange={e =>
                  setWMaxHr(
                    e.target.value
                  )
                }
                className="training-page-input"
              />


              <input
                type="number"
                placeholder="Kalorie treningu"
                value={wCalories}
                onChange={e =>
                  setWCalories(
                    e.target.value
                  )
                }
                className="training-page-input"
              />


              <input
                type="number"
                placeholder="Kadencja"
                value={wCadence}
                onChange={e =>
                  setWCadence(
                    e.target.value
                  )
                }
                className="training-page-input"
              />


              <input
                type="number"
                placeholder="Przewyższenie m"
                value={wElevation}
                onChange={e =>
                  setWElevation(
                    e.target.value
                  )
                }
                className="training-page-input"
              />


              <textarea
                rows="4"
                placeholder="Odczucia / notatka"
                value={wNote}
                onChange={e =>
                  setWNote(
                    e.target.value
                  )
                }
                className="training-page-input"
              />


              <button
                onClick={
                  addCompletedWorkout
                }
                style={{
                  width: "100%",
                  marginTop: 4,
                  border: 0,
                  borderRadius: 13,
                  padding: 14,
                  background:
                    "#16794b",
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


      {/* ===================================================
          STYLE
      =================================================== */}

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
          background: white;
        }

        button {
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }

        @media (max-width: 600px) {

          .training-page-input {
            font-size: 16px;
          }

        }

      `}</style>

    </div>
  );
}
