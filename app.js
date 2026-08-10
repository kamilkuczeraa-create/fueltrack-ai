import React, { useEffect, useState } from "react";
import TrainingPage from "./TrainingPage";

const FOOD_KEY = "fueltrack_food_v04";
const WORKOUT_KEY = "fueltrack_workouts_v04";

const OLD_KEYS = [
  "fueltrack_fitatu_v03",
  "fueltrack_fitatu_v02",
  "fueltrack_fitatu",
  "fitatuData",
  "fitatu_data",
  "fueltrack_data",
  "fueltrack_rows"
];

const MICRO_COLUMNS = [
  ["Błonnik (g)", "Błonnik", "g"],
  ["Cukry (g)", "Cukry", "g"],
  ["Kwas omega 3 (g)", "Omega-3", "g"],
  ["Kwas omega 6 (g)", "Omega-6", "g"],
  ["Kofeina (mg)", "Kofeina", "mg"],
  ["Kwas foliowy (ug)", "Kwas foliowy", "µg"],
  ["Witamina A (ug)", "Witamina A", "µg"],
  ["Witamina B1 (mg)", "Witamina B1", "mg"],
  ["Witamina B2 (mg)", "Witamina B2", "mg"],
  ["Witamina B6 (mg)", "Witamina B6", "mg"],
  ["Witamina B12 (ug)", "Witamina B12", "µg"],
  ["Witamina C (mg)", "Witamina C", "mg"],
  ["Witamina D (ug)", "Witamina D", "µg"],
  ["Witamina E (mg)", "Witamina E", "mg"],
  ["Witamina PP (mg)", "Witamina PP", "mg"],
  ["Witamina K (ug)", "Witamina K", "µg"],
  ["Cynk (mg)", "Cynk", "mg"],
  ["Fosfor (mg)", "Fosfor", "mg"],
  ["Jod (ug)", "Jod", "µg"],
  ["Magnez (mg)", "Magnez", "mg"],
  ["Potas (mg)", "Potas", "mg"],
  ["Selen (ug)", "Selen", "µg"],
  ["Sód (mg)", "Sód", "mg"],
  ["Wapń (mg)", "Wapń", "mg"],
  ["Żelazo (mg)", "Żelazo", "mg"],
  ["Sól (g)", "Sól", "g"],
  ["Cholesterol (mg)", "Cholesterol", "mg"],
  ["Nasycone (g)", "Kwasy nasycone", "g"]
];

const GOALS = {
  kcal: 2200,
  protein: 180,
  carbs: 200,
  fat: 70
};

function num(value) {
  if (value === null || value === undefined || value === "") {
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

function safeParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function normaliseRows(rows) {
  if (!Array.isArray(rows)) return [];

  return rows
    .filter(row => row && typeof row === "object")
    .map(row => {
      const copy = { ...row };

      if (!copy["Data"] && copy.data) {
        copy["Data"] = copy.data;
      }

      return copy;
    });
}

function looksLikeFitatu(array) {
  if (!Array.isArray(array) || !array.length) {
    return false;
  }

  const sample = array[0];

  return (
    sample &&
    typeof sample === "object" &&
    ("Data" in sample || "data" in sample)
  );
}

function recoverOldFoodData() {
  for (const key of OLD_KEYS) {
    const raw = localStorage.getItem(key);

    if (!raw) continue;

    const parsed = safeParse(raw);

    if (looksLikeFitatu(parsed)) {
      return normaliseRows(parsed);
    }

    if (
      parsed &&
      Array.isArray(parsed.rows) &&
      looksLikeFitatu(parsed.rows)
    ) {
      return normaliseRows(parsed.rows);
    }
  }

  const candidates = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);

    if (!key) continue;

    const raw = localStorage.getItem(key);

    if (!raw) continue;

    const parsed = safeParse(raw);

    if (looksLikeFitatu(parsed)) {
      candidates.push(normaliseRows(parsed));
    }

    if (
      parsed &&
      Array.isArray(parsed.rows) &&
      looksLikeFitatu(parsed.rows)
    ) {
      candidates.push(normaliseRows(parsed.rows));
    }
  }

  candidates.sort(
    (a, b) => b.length - a.length
  );

  return candidates[0] || [];
}

function parseCSV(text) {
  text = text.replace(/^\uFEFF/, "");

  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (quoted && next === '"') {
        cell += '"';
        i++;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if (
      (char === "\n" || char === "\r") &&
      !quoted
    ) {
      if (char === "\r" && next === "\n") {
        i++;
      }

      row.push(cell);
      cell = "";

      if (
        row.some(
          value => value.trim() !== ""
        )
      ) {
        rows.push(row);
      }

      row = [];
    } else {
      cell += char;
    }
  }

  if (cell !== "" || row.length) {
    row.push(cell);

    if (
      row.some(
        value => value.trim() !== ""
      )
    ) {
      rows.push(row);
    }
  }

  if (!rows.length) return [];

  const headers = rows[0].map(h => h.trim());

  return rows
    .slice(1)
    .map(values => {
      const object = {};

      headers.forEach((header, index) => {
        object[header] = (
          values[index] ?? ""
        ).trim();
      });

      return object;
    })
    .filter(object =>
      Object.values(object).some(
        value => value !== ""
      )
    );
}

function getDates(foodRows, workouts) {
  const dates = [
    ...foodRows
      .map(row => row["Data"])
      .filter(Boolean),

    ...workouts
      .map(workout => workout.date)
      .filter(Boolean)
  ];

  return [
    ...new Set(dates)
  ].sort().reverse();
}

function totalsForDate(foodRows, date) {
  const rows = foodRows.filter(
    row => row["Data"] === date
  );

  const totals = {
    kcal: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  };

  rows.forEach(row => {
    totals.kcal += num(
      row["kalorie (kcal)"]
    );

    totals.protein += num(
      row["Białka (g)"]
    );

    totals.carbs += num(
      row["Węglowodany (g)"]
    );

    totals.fat += num(
      row["Tłuszcze (g)"]
    );
  });

  return {
    rows,
    totals
  };
}

function ProgressBar({
  label,
  value,
  goal,
  unit
}) {
  const percent = Math.min(
    100,
    Math.max(
      0,
      (value / goal) * 100
    )
  );

  return (
    <div style={{ marginBottom: 15 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 6,
          fontWeight: 700
        }}
      >
        <span>{label}</span>

        <span>
          {fmt(value)} / {fmt(goal)} {unit}
        </span>
      </div>

      <div
        style={{
          height: 13,
          background: "#e9ebef",
          borderRadius: 20,
          overflow: "hidden"
        }}
      >
        <div
          style={{
            width: `${percent}%`,
            height: "100%",
            background: "#2463eb",
            borderRadius: 20
          }}
        />
      </div>
    </div>
  );
}

export default function App() {
  const [foodRows, setFoodRows] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");

  const [showMacroMicro, setShowMacroMicro] =
    useState(false);

  const [showHistory, setShowHistory] =
    useState(false);

  const [report, setReport] = useState("");

  const [isTrainingPage, setIsTrainingPage] =
    useState(
      window.location.hash === "#/training"
    );

  useEffect(() => {
    const onHashChange = () => {
      setIsTrainingPage(
        window.location.hash === "#/training"
      );
    };

    window.addEventListener(
      "hashchange",
      onHashChange
    );

    return () =>
      window.removeEventListener(
        "hashchange",
        onHashChange
      );
  }, []);

  useEffect(() => {
    const savedFood = safeParse(
      localStorage.getItem(FOOD_KEY)
    );

    if (looksLikeFitatu(savedFood)) {
      setFoodRows(
        normaliseRows(savedFood)
      );
    } else {
      const recovered =
        recoverOldFoodData();

      setFoodRows(recovered);

      if (recovered.length) {
        localStorage.setItem(
          FOOD_KEY,
          JSON.stringify(recovered)
        );
      }
    }

    const savedWorkouts = safeParse(
      localStorage.getItem(WORKOUT_KEY)
    );

    if (Array.isArray(savedWorkouts)) {
      setWorkouts(savedWorkouts);
    }
  }, []);

  useEffect(() => {
    if (
      selectedDate ||
      foodRows.length ||
      workouts.length
    ) {
      localStorage.setItem(
        FOOD_KEY,
        JSON.stringify(foodRows)
      );
    }
  }, [foodRows]);

  useEffect(() => {
    localStorage.setItem(
      WORKOUT_KEY,
      JSON.stringify(workouts)
    );
  }, [workouts]);

  const dates = getDates(
    foodRows,
    workouts
  );

  useEffect(() => {
    if (!selectedDate && dates.length) {
      setSelectedDate(dates[0]);
    }
  }, [dates.join("|")]);

  if (isTrainingPage) {
    return <TrainingPage />;
  }

  const result = totalsForDate(
    foodRows,
    selectedDate
  );

  const rows = result.rows;
  const totals = result.totals;

  const meals = {};

  rows.forEach(row => {
    const meal =
      row["Posiłek"] || "Inne";

    if (!meals[meal]) {
      meals[meal] = [];
    }

    meals[meal].push(row);
  });

  const dayWorkouts =
    workouts.filter(
      workout =>
        workout.date === selectedDate
    );

  function importCSV(event) {
    const file =
      event.target.files[0];

    if (!file) return;

    file.text().then(text => {
      try {
        const imported =
          parseCSV(text);

        if (!imported.length) {
          throw new Error(
            "CSV jest pusty."
          );
        }

        if (!("Data" in imported[0])) {
          throw new Error(
            "Nie znaleziono kolumny Data."
          );
        }

        const importedDates = [
          ...new Set(
            imported
              .map(row => row["Data"])
              .filter(Boolean)
          )
        ];

        const existingDates =
          new Set(
            foodRows
              .map(row => row["Data"])
              .filter(Boolean)
          );

        const conflicts =
          importedDates.filter(
            date =>
              existingDates.has(date)
          );

        if (conflicts.length) {
          const replace =
            window.confirm(
              `Import zawiera ${importedDates.length} dni.\n\n` +
              `Dni już zapisane: ${conflicts.length}\n\n` +
              `OK — zastąp istniejące dni.\n` +
              `Anuluj — zachowaj istniejące dane i dodaj tylko nowe dni.`
            );

          if (replace) {
            const conflictSet =
              new Set(conflicts);

            setFoodRows(prev => [
              ...prev.filter(
                row =>
                  !conflictSet.has(
                    row["Data"]
                  )
              ),
              ...imported
            ]);
          } else {
            setFoodRows(prev => [
              ...prev,
              ...imported.filter(
                row =>
                  !existingDates.has(
                    row["Data"]
                  )
              )
            ]);
          }
        } else {
          setFoodRows(prev => [
            ...prev,
            ...imported
          ]);
        }

        setSelectedDate(
          importedDates[0] ||
            selectedDate
        );

        alert(
          `Zaimportowano ${imported.length} rekordów Fitatu.`
        );
      } catch (error) {
        alert(
          error.message ||
            "Błąd importu."
        );
      }
    });

    event.target.value = "";
  }

  function createReport() {
    if (!selectedDate) return;

    let text =
      `FUELTRACK AI\n` +
      `RAPORT DNIA: ${selectedDate}\n\n`;

    Object.entries(meals).forEach(
      ([meal, products]) => {
        text +=
          `${meal.toUpperCase()}\n`;

        products.forEach(product => {
          text +=
            `• ${
              product[
                "Produkty i potrawy"
              ] || "Produkt"
            }`;

          if (product["ilość (g)"]) {
            text +=
              ` — ${product["ilość (g)"]} g`;
          }

          text +=
            ` — ${fmt(
              num(
                product[
                  "kalorie (kcal)"
                ]
              )
            )} kcal`;

          text +=
            ` | B ${fmt(
              num(
                product["Białka (g)"]
              )
            )} g`;

          text +=
            ` | W ${fmt(
              num(
                product[
                  "Węglowodany (g)"
                ]
              )
            )} g`;

          text +=
            ` | T ${fmt(
              num(
                product["Tłuszcze (g)"]
              )
            )} g\n`;
        });

        text += "\n";
      }
    );

    text +=
      `PODSUMOWANIE\n` +
      `Kalorie: ${fmt(totals.kcal)} kcal\n` +
      `Białko: ${fmt(totals.protein)} g\n` +
      `Węglowodany: ${fmt(totals.carbs)} g\n` +
      `Tłuszcz: ${fmt(totals.fat)} g\n\n`;

    text += "TRENINGI\n";

    if (!dayWorkouts.length) {
      text +=
        "Brak zapisanych treningów.\n";
    } else {
      dayWorkouts.forEach(workout => {
        text +=
          `• ${workout.type || "Trening"}`;

        if (workout.distance) {
          text +=
            ` | ${fmt(workout.distance)} km`;
        }

        if (workout.time) {
          text +=
            ` | ${workout.time}`;
        }

        if (workout.pace) {
          text +=
            ` | ${workout.pace}`;
        }

        if (workout.hr) {
          text +=
            ` | HR ${fmt(workout.hr)}`;
        }

        if (workout.calories) {
          text +=
            ` | ${fmt(workout.calories)} kcal`;
        }

        text += "\n";
      });
    }

    text += "\nMIKROELEMENTY\n";

    MICRO_COLUMNS.forEach(
      ([column, label, unit]) => {
        const total =
          rows.reduce(
            (sum, row) =>
              sum + num(row[column]),
            0
          );

        if (total) {
          text +=
            `${label}: ${fmt(total)} ${unit}\n`;
        }
      }
    );

    setReport(text);
  }

  async function copyReport() {
    if (!report) return;

    try {
      await navigator.clipboard.writeText(
        report
      );

      alert("Raport skopiowany.");
    } catch {
      alert(
        "Nie udało się skopiować raportu."
      );
    }
  }

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: 18,
        fontFamily:
          "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"
      }}
    >
      <h1>
        🍽️ FuelTrack AI
      </h1>

      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          marginBottom: 20
        }}
      >
        <label
          style={{
            display: "inline-block",
            background: "#2463eb",
            color: "white",
            padding: "13px 17px",
            borderRadius: 14,
            fontWeight: 700
          }}
        >
          Importuj Fitatu CSV
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={importCSV}
            style={{ display: "none" }}
          />
        </label>

        <button
          onClick={() => {
            window.location.hash =
              "#/training";
          }}
          style={{
            border: 0,
            borderRadius: 14,
            padding: "13px 17px",
            background: "#16794b",
            color: "white",
            fontWeight: 700
          }}
        >
          🏃 Planowanie treningów
        </button>
      </div>

      <div
        style={{
          background: "white",
          borderRadius: 25,
          padding: 20,
          boxShadow:
            "0 4px 20px rgba(0,0,0,.06)",
          marginBottom: 18
        }}
      >
        <h2 style={{ marginTop: 0 }}>
          Dzień
        </h2>

        {dates.length ? (
          <select
            value={selectedDate}
            onChange={e =>
              setSelectedDate(
                e.target.value
              )
            }
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: 14,
              borderRadius: 13,
              border: "1px solid #ddd",
              fontSize: 16
            }}
          >
            {dates.map(date => (
              <option
                key={date}
                value={date}
              >
                {date}
              </option>
            ))}
          </select>
        ) : (
          <p>
            Brak zaimportowanych danych.
          </p>
        )}
      </div>

      {selectedDate && (
        <>
          <div
            style={{
              background: "white",
              borderRadius: 25,
              padding: 20,
              boxShadow:
                "0 4px 20px rgba(0,0,0,.06)",
              marginBottom: 18
            }}
          >
            <h2 style={{ marginTop: 0 }}>
              📊 Bilans dnia
            </h2>

            <ProgressBar
              label="Kalorie"
              value={totals.kcal}
              goal={GOALS.kcal}
              unit="kcal"
            />

            <ProgressBar
              label="Białko"
              value={totals.protein}
              goal={GOALS.protein}
              unit="g"
            />

            <ProgressBar
              label="Węglowodany"
              value={totals.carbs}
              goal={GOALS.carbs}
              unit="g"
            />

            <ProgressBar
              label="Tłuszcz"
              value={totals.fat}
              goal={GOALS.fat}
              unit="g"
            />
          </div>

          <div
            style={{
              background: "white",
              borderRadius: 25,
              padding: 20,
              boxShadow:
                "0 4px 20px rgba(0,0,0,.06)",
              marginBottom: 18
            }}
          >
            <h2 style={{ marginTop: 0 }}>
              🍴 Posiłki
            </h2>

            {Object.keys(meals).length === 0 ? (
              <p>
                Brak posiłków dla tego dnia.
              </p>
            ) : (
              Object.entries(meals).map(
                ([meal, products]) => (
                  <div
                    key={meal}
                    style={{
                      marginBottom: 20
                    }}
                  >
                    <h3>{meal}</h3>

                    {products.map(
                      (product, index) => (
                        <div
                          key={index}
                          style={{
                            padding:
                              "10px 0",
                            borderBottom:
                              "1px solid #eee"
                          }}
                        >
                          <strong>
                            {
                              product[
                                "Produkty i potrawy"
                              ] ||
                              "Produkt"
                            }
                          </strong>

                          <div
                            style={{
                              color: "#666",
                              marginTop: 4
                            }}
                          >
                            {fmt(
                              num(
                                product[
                                  "kalorie (kcal)"
                                ]
                              )
                            )}{" "}
                            kcal · B{" "}
                            {fmt(
                              num(
                                product[
                                  "Białka (g)"
                                ]
                              )
                            )}{" "}
                            g · W{" "}
                            {fmt(
                              num(
                                product[
                                  "Węglowodany (g)"
                                ]
                              )
                            )}{" "}
                            g · T{" "}
                            {fmt(
                              num(
                                product[
                                  "Tłuszcze (g)"
                                ]
                              )
                            )}{" "}
                            g
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )
              )
            )}
          </div>

          <div
            style={{
              background: "white",
              borderRadius: 25,
              padding: 20,
              boxShadow:
                "0 4px 20px rgba(0,0,0,.06)",
              marginBottom: 18
            }}
          >
            <button
              onClick={() =>
                setShowMacroMicro(
                  !showMacroMicro
                )
              }
              style={{
                width: "100%",
                border: 0,
                background: "none",
                padding: 0,
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                fontSize: 20,
                fontWeight: 800
              }}
            >
              <span>
                🧬 Makro i mikro
              </span>

              <span>
                {showMacroMicro
                  ? "▲"
                  : "▼"}
              </span>
            </button>

            {showMacroMicro && (
              <div
                style={{
                  marginTop: 20
                }}
              >
                <h3>
                  Makro
                </h3>

                <p>
                  Kalorie:{" "}
                  <b>
                    {fmt(totals.kcal)} kcal
                  </b>
                </p>

                <p>
                  Białko:{" "}
                  <b>
                    {fmt(totals.protein)} g
                  </b>
                </p>

                <p>
                  Węglowodany:{" "}
                  <b>
                    {fmt(totals.carbs)} g
                  </b>
                </p>

                <p>
                  Tłuszcz:{" "}
                  <b>
                    {fmt(totals.fat)} g
                  </b>
                </p>

                <h3>
                  Mikroelementy
                </h3>

                {MICRO_COLUMNS.map(
                  ([column, label, unit]) => {
                    const total =
                      rows.reduce(
                        (sum, row) =>
                          sum +
                          num(row[column]),
                        0
                      );

                    if (!total) {
                      return null;
                    }

                    return (
                      <div
                        key={column}
                        style={{
                          display: "flex",
                          justifyContent:
                            "space-between",
                          padding:
                            "7px 0",
                          borderBottom:
                            "1px solid #eee"
                        }}
                      >
                        <span>
                          {label}
                        </span>

                        <strong>
                          {fmt(total)}{" "}
                          {unit}
                        </strong>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </div>

          <div
            style={{
              background: "white",
              borderRadius: 25,
              padding: 20,
              boxShadow:
                "0 4px 20px rgba(0,0,0,.06)",
              marginBottom: 18
            }}
          >
            <button
              onClick={() =>
                setShowHistory(
                  !showHistory
                )
              }
              style={{
                width: "100%",
                border: 0,
                background: "none",
                padding: 0,
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                fontSize: 20,
                fontWeight: 800
              }}
            >
              <span>
                📚 Historia
              </span>

              <span>
                {showHistory
                  ? "▲"
                  : "▼"}
              </span>
            </button>

            {showHistory && (
              <div
                style={{
                  marginTop: 18
                }}
              >
                {dates.map(date => {
                  const day =
                    totalsForDate(
                      foodRows,
                      date
                    );

                  const count =
                    workouts.filter(
                      workout =>
                        workout.date ===
                        date
                    ).length;

                  return (
                    <button
                      key={date}
                      onClick={() =>
                        setSelectedDate(
                          date
                        )
                      }
                      style={{
                        width: "100%",
                        display:
                          "flex",
                        justifyContent:
                          "space-between",
                        alignItems:
                          "center",
                        border: 0,
                        borderBottom:
                          "1px solid #eee",
                        background:
                          "white",
                        padding:
                          "13px 0",
                        fontSize: 15
                      }}
                    >
                      <strong>
                        {date}
                      </strong>

                      <span>
                        {fmt(
                          day.totals
                            .kcal
                        )}{" "}
                        kcal
                        {count
                          ? ` · 🏃 ${count}`
                          : ""}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div
            style={{
              background: "white",
              borderRadius: 25,
              padding: 20,
              boxShadow:
                "0 4px 20px rgba(0,0,0,.06)",
              marginBottom: 18
            }}
          >
            <h2 style={{ marginTop: 0 }}>
              🏃 Trening — {selectedDate}
            </h2>

            {dayWorkouts.length === 0 ? (
              <p
                style={{
                  color: "#777"
                }}
              >
                Brak treningu zapisanego
                dla tego dnia.
              </p>
            ) : (
              dayWorkouts.map(
                workout => (
                  <div
                    key={workout.id}
                    style={{
                      background:
                        "#f5f6fa",
                      borderRadius: 16,
                      padding: 14,
                      marginBottom: 10
                    }}
                  >
                    <strong>
                      {workout.type ||
                        "Trening"}
                    </strong>

                    <div
                      style={{
                        marginTop: 6,
                        color: "#555"
                      }}
                    >
                      {workout.distance
                        ? `${fmt(
                            workout.distance
                          )} km`
                        : ""}
                      {workout.time
                        ? ` · ${workout.time}`
                        : ""}
                      {workout.pace
                        ? ` · ${workout.pace}`
                        : ""}
                      {workout.calories
                        ? ` · ${fmt(
                            workout.calories
                          )} kcal`
                        : ""}
                    </div>
                  </div>
                )
              )
            )}

            <button
              onClick={() => {
                window.location.hash =
                  "#/training";
              }}
              style={{
                width: "100%",
                border: 0,
                borderRadius: 14,
                padding: 13,
                background: "#16794b",
                color: "white",
                fontWeight: 700
              }}
            >
              Otwórz planowanie treningów
            </button>
          </div>

          <div
            style={{
              background: "white",
              borderRadius: 25,
              padding: 20,
              boxShadow:
                "0 4px 20px rgba(0,0,0,.06)"
            }}
          >
            <h2 style={{ marginTop: 0 }}>
              📋 Raport dnia
            </h2>

            <button
              onClick={createReport}
              style={{
                width: "100%",
                border: 0,
                borderRadius: 14,
                padding: 13,
                background: "#2463eb",
                color: "white",
                fontWeight: 700,
                marginBottom: 10
              }}
            >
              Generuj raport tekstowy
            </button>

            {report && (
              <>
                <textarea
                  value={report}
                  readOnly
                  rows={16}
                  style={{
                    width: "100%",
                    boxSizing:
                      "border-box",
                    padding: 13,
                    borderRadius: 13,
                    border:
                      "1px solid #ddd",
                    fontFamily:
                      "monospace",
                    fontSize: 13
                  }}
                />

                <button
                  onClick={copyReport}
                  style={{
                    width: "100%",
                    marginTop: 10,
                    border: 0,
                    borderRadius: 14,
                    padding: 13,
                    background:
                      "#16794b",
                    color: "white",
                    fontWeight: 700
                  }}
                >
                  📋 Kopiuj cały raport
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
