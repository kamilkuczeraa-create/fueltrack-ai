const STORE = "fueltrack_fitatu_v03";
const GOALS = "fueltrack_goals_v03";
const WORKOUTS = "fueltrack_workouts_v04";

const state = {
  rows: [],
  workouts: [],
  selectedDate: ""
};

const DEFAULT_GOALS = {
  kcal: 2200,
  protein: 180,
  carbs: 200,
  fat: 70
};

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

const $ = id => document.getElementById(id);

function number(value) {
  const n = parseFloat(String(value ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function format(value) {
  return Number(value || 0).toLocaleString("pl-PL", {
    maximumFractionDigits: 2
  });
}

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function showStatus(message, error = false) {
  const box = $("status");
  if (!box) return;

  box.textContent = message;
  box.classList.remove("hidden", "error");

  if (error) box.classList.add("error");

  setTimeout(() => {
    box.classList.add("hidden");
  }, 5000);
}

/* =========================
   CSV FITATU
========================= */

function parseCSV(text) {
  text = text.replace(/^\uFEFF/, "");

  const result = [];
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
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i++;

      row.push(cell);
      cell = "";

      if (row.some(v => v.trim() !== "")) {
        result.push(row);
      }

      row = [];
    } else {
      cell += char;
    }
  }

  if (cell || row.length) {
    row.push(cell);

    if (row.some(v => v.trim() !== "")) {
      result.push(row);
    }
  }

  if (!result.length) return [];

  const headers = result[0].map(v => v.trim());

  return result.slice(1).map(values => {
    const object = {};

    headers.forEach((header, index) => {
      object[header] = (values[index] ?? "").trim();
    });

    return object;
  }).filter(object =>
    Object.values(object).some(value => value !== "")
  );
}

/* =========================
   STORAGE
========================= */

function loadData() {
  try {
    state.rows = JSON.parse(
      localStorage.getItem(STORE) || "[]"
    );
  } catch {
    state.rows = [];
  }

  try {
    state.workouts = JSON.parse(
      localStorage.getItem(WORKOUTS) || "[]"
    );
  } catch {
    state.workouts = [];
  }
}

function saveFood() {
  localStorage.setItem(
    STORE,
    JSON.stringify(state.rows)
  );
}

function saveWorkouts() {
  localStorage.setItem(
    WORKOUTS,
    JSON.stringify(state.workouts)
  );
}

function getGoals() {
  try {
    return {
      ...DEFAULT_GOALS,
      ...JSON.parse(
        localStorage.getItem(GOALS) || "{}"
      )
    };
  } catch {
    return { ...DEFAULT_GOALS };
  }
}

/* =========================
   DATES
========================= */

function getDates() {
  const foodDates = state.rows
    .map(row => row["Data"])
    .filter(Boolean);

  const workoutDates = state.workouts
    .map(workout => workout.date)
    .filter(Boolean);

  return [...new Set([
    ...foodDates,
    ...workoutDates
  ])].sort().reverse();
}

/* =========================
   NUTRITION
========================= */

function getTotals(date) {
  const rows = state.rows.filter(
    row => row["Data"] === date
  );

  const totals = {
    "kalorie (kcal)": 0,
    "Białka (g)": 0,
    "Węglowodany (g)": 0,
    "Tłuszcze (g)": 0
  };

  rows.forEach(row => {
    totals["kalorie (kcal)"] += number(row["kalorie (kcal)"]);
    totals["Białka (g)"] += number(row["Białka (g)"]);
    totals["Węglowodany (g)"] += number(row["Węglowodany (g)"]);
    totals["Tłuszcze (g)"] += number(row["Tłuszcze (g)"]);
  });

  MICRO_COLUMNS.forEach(([column]) => {
    totals[column] = rows.reduce(
      (sum, row) => sum + number(row[column]),
      0
    );
  });

  return totals;
}

/* =========================
   DATES UI
========================= */

function renderDates() {
  const dates = getDates();

  if (!dates.length) {
    state.selectedDate = "";

    $("selectedDateLabel").textContent = "Brak danych";
    $("dateSelect").innerHTML = "";
    $("dayCount").textContent = "0 dni";

    return;
  }

  if (!dates.includes(state.selectedDate)) {
    state.selectedDate = dates[0];
  }

  $("dateSelect").innerHTML = dates
    .map(date =>
      `<option value="${escapeHTML(date)}">
        ${escapeHTML(date)}
      </option>`
    )
    .join("");

  $("dateSelect").value = state.selectedDate;
  $("selectedDateLabel").textContent = state.selectedDate;

  $("dayCount").textContent =
    `${dates.length} ${dates.length === 1 ? "dzień" : "dni"}`;
}

/* =========================
   FOOD
========================= */

function renderFood() {
  if (!state.selectedDate) return;

  const rows = state.rows.filter(
    row => row["Data"] === state.selectedDate
  );

  const totals = getTotals(state.selectedDate);

  $("kcal").textContent =
    format(totals["kalorie (kcal)"]);

  $("protein").textContent =
    format(totals["Białka (g)"]);

  $("carbs").textContent =
    format(totals["Węglowodany (g)"]);

  $("fat").textContent =
    format(totals["Tłuszcze (g)"]);

  const meals = {};

  rows.forEach(row => {
    const meal = row["Posiłek"] || "Inne";

    if (!meals[meal]) {
      meals[meal] = [];
    }

    meals[meal].push(row);
  });

  $("meals").innerHTML = Object.entries(meals)
    .map(([meal, products]) => `
      <div class="meal">

        <div class="meal-title">
          ${escapeHTML(meal)}
        </div>

        ${products.map(product => `
          <div class="product">

            <b>
              ${escapeHTML(
                product["Produkty i potrawy"] || "Produkt"
              )}
            </b>

            <div class="product-meta">
              ${escapeHTML(product["Miara użyteczna"] || "")}
              ·
              ${format(number(product["ilość (g)"]))} g
              ·
              ${format(number(product["kalorie (kcal)"]))} kcal
              · B ${format(number(product["Białka (g)"]))}
              · W ${format(number(product["Węglowodany (g)"]))}
              · T ${format(number(product["Tłuszcze (g)"]))}
            </div>

          </div>
        `).join("")}

      </div>
    `)
    .join("");

  $("micros").innerHTML = MICRO_COLUMNS
    .map(([column, label, unit]) => `
      <div class="micro">

        <b>
          ${format(totals[column])} ${unit}
        </b>

        <span>
          ${label}
        </span>

      </div>
    `)
    .join("");
}

/* =========================
   WORKOUTS
========================= */

function renderWorkouts() {
  const container = $("workouts");

  if (!state.selectedDate) {
    container.innerHTML =
      `<div class="muted">
        Wybierz dzień.
      </div>`;
    return;
  }

  const workouts = state.workouts.filter(
    workout => workout.date === state.selectedDate
  );

  if (!workouts.length) {
    container.innerHTML =
      `<div class="muted">
        Brak treningów przypisanych do tego dnia.
      </div>`;
    return;
  }

  container.innerHTML = workouts
    .map(workout => `
      <div class="workout">

        <div class="workout-title">
          🏃 ${escapeHTML(
            workout.type || "Trening"
          )}
        </div>

        <div class="workout-grid">

          ${workout.distance ?
            `<div>
              <span>Dystans</span>
              <br>
              <b>${format(workout.distance)} km</b>
            </div>` : ""}

          ${workout.time ?
            `<div>
              <span>Czas</span>
              <br>
              <b>${escapeHTML(workout.time)}</b>
            </div>` : ""}

          ${workout.pace ?
            `<div>
              <span>Tempo</span>
              <br>
              <b>${escapeHTML(workout.pace)}</b>
            </div>` : ""}

          ${workout.hr ?
            `<div>
              <span>Śr. HR</span>
              <br>
              <b>${format(workout.hr)}</b>
            </div>` : ""}

          ${workout.maxHr ?
            `<div>
              <span>Max HR</span>
              <br>
              <b>${format(workout.maxHr)}</b>
            </div>` : ""}

          ${workout.calories ?
            `<div>
              <span>Kalorie</span>
              <br>
              <b>${format(workout.calories)} kcal</b>
            </div>` : ""}

          ${workout.cadence ?
            `<div>
              <span>Kadencja</span>
              <br>
              <b>${format(workout.cadence)}</b>
            </div>` : ""}

          ${workout.elevation ?
            `<div>
              <span>Przewyższenie</span>
              <br>
              <b>${format(workout.elevation)} m</b>
            </div>` : ""}

        </div>

        ${workout.note ?
          `<div class="product-meta"
                style="margin-top:9px">
            📝 ${escapeHTML(workout.note)}
          </div>` : ""}

        <div class="workout-actions">

          <button
            class="danger"
            data-delete-workout="${escapeHTML(workout.id)}">
            Usuń
          </button>

        </div>

      </div>
    `)
    .join("");

  document
    .querySelectorAll("[data-delete-workout]")
    .forEach(button => {

      button.onclick = () => {

        if (!confirm("Usunąć ten trening?")) {
          return;
        }

        state.workouts =
          state.workouts.filter(
            workout =>
              workout.id !== button.dataset.deleteWorkout
          );

        saveWorkouts();
        renderAll();

        showStatus("Trening usunięty.");
      };

    });
}

/* =========================
   WORKOUT FORM
========================= */

function showWorkoutForm(show) {
  $("workoutForm")
    .classList.toggle("hidden", !show);

  if (show) {
    setTimeout(() => {
      $("workoutForm").scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }, 50);
  }
}

function clearWorkoutForm() {
  [
    "wType",
    "wDistance",
    "wTime",
    "wPace",
    "wHr",
    "wMaxHr",
    "wCalories",
    "wCadence",
    "wElevation",
    "wNote"
  ].forEach(id => {
    if ($(id)) $(id).value = "";
  });
}

/* =========================
   GOALS
========================= */

function renderGoals() {
  const goals = getGoals();

  $("goalKcal").value = goals.kcal;
  $("goalProtein").value = goals.protein;
  $("goalCarbs").value = goals.carbs;
  $("goalFat").value = goals.fat;

  if (!state.selectedDate) {
    $("goalSummary").innerHTML = "";
    return;
  }

  const totals = getTotals(state.selectedDate);

  const workouts = state.workouts.filter(
    workout => workout.date === state.selectedDate
  );

  const workoutCalories = workouts.reduce(
    (sum, workout) =>
      sum + number(workout.calories),
    0
  );

  $("goalSummary").innerHTML = `

    <div class="micro">

      <b>
        ${format(totals["kalorie (kcal)"])}
        /
        ${format(goals.kcal)}
        kcal
      </b>

      <span>
        Bilans względem celu:
        ${format(
          totals["kalorie (kcal)"] - goals.kcal
        )} kcal
      </span>

    </div>

    <div
      class="micro"
      style="margin-top:8px"
    >

      <b>
        Białko
        ${format(totals["Białka (g)"])}
        /
        ${format(goals.protein)}
        g
      </b>

      <span>
        Bilans:
        ${format(
          totals["Białka (g)"] - goals.protein
        )} g
      </span>

    </div>

    <div
      class="micro"
      style="margin-top:8px"
    >

      <b>
        🏃 Treningi: ${workouts.length}
      </b>

      <span>
        Zapisane kalorie treningowe:
        ${format(workoutCalories)} kcal
      </span>

    </div>
  `;
}

/* =========================
   HISTORY
========================= */

function renderHistory() {
  const dates = getDates();

  $("history").innerHTML = dates
    .map(date => {

      const totals = getTotals(date);

      const workouts = state.workouts.filter(
        workout => workout.date === date
      ).length;

      return `
        <div class="history-row">

          <button data-date="${escapeHTML(date)}">
            ${escapeHTML(date)}
          </button>

          <span>
            ${format(totals["kalorie (kcal)"])}
            kcal
            ${workouts ?
              ` · 🏃 ${workouts}` : ""}
          </span>

        </div>
      `;

    })
    .join("");

  document
    .querySelectorAll("[data-date]")
    .forEach(button => {

      button.onclick = () => {

        state.selectedDate =
          button.dataset.date;

        renderAll();

        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });

      };

    });
}

/* =========================
   REPORT
========================= */

function createReport(date) {

  const rows = state.rows.filter(
    row => row["Data"] === date
  );

  const totals = getTotals(date);

  let report =
    `FUELTRACK AI — RAPORT\n` +
    `DATA: ${date}\n\n`;

  const meals = {};

  rows.forEach(row => {

    const meal =
      row["Posiłek"] || "Inne";

    if (!meals[meal]) {
      meals[meal] = [];
    }

    meals[meal].push(row);

  });

  Object.entries(meals).forEach(
    ([meal, products]) => {

      report +=
        `${meal.toUpperCase()}\n`;

      products.forEach(product => {

        report +=
          `• ${
            product["Produkty i potrawy"] ||
            "Produkt"
          } — ${
            product["ilość (g)"] || "?"
          } g — ${
            format(
              number(
                product["kalorie (kcal)"]
              )
            )
          } kcal | B ${
            format(
              number(product["Białka (g)"])
            )
          } g | W ${
            format(
              number(product["Węglowodany (g)"])
            )
          } g | T ${
            format(
              number(product["Tłuszcze (g)"])
            )
          } g\n`;

      });

      report += "\n";
    }
  );

  report +=
    `PODSUMOWANIE ŻYWIENIA\n` +
    `Kalorie: ${format(
      totals["kalorie (kcal)"]
    )} kcal\n` +
    `Białko: ${format(
      totals["Białka (g)"]
    )} g\n` +
    `Węglowodany: ${format(
      totals["Węglowodany (g)"]
    )} g\n` +
    `Tłuszcz: ${format(
      totals["Tłuszcze (g)"]
    )} g\n\n`;

  report += "TRENINGI\n";

  const workouts = state.workouts.filter(
    workout => workout.date === date
  );

  if (!workouts.length) {
    report += "Brak zapisanych treningów.\n";
  }

  workouts.forEach(workout => {

    report +=
      `• ${workout.type || "Trening"}`;

    if (workout.distance) {
      report +=
        ` — ${format(workout.distance)} km`;
    }

    if (workout.time) {
      report +=
        ` — ${workout.time}`;
    }

    if (workout.pace) {
      report +=
        ` — ${workout.pace}`;
    }

    if (workout.hr) {
      report +=
        ` — HR ${format(workout.hr)}`;
    }

    if (workout.calories) {
      report +=
        ` — ${format(workout.calories)} kcal`;
    }

    report += "\n";
  });

  report += "\nMIKROELEMENTY\n";

  MICRO_COLUMNS.forEach(
    ([column, label, unit]) => {

      if (totals[column]) {

        report +=
          `${label}: ${
            format(totals[column])
          } ${unit}\n`;

      }

    }
  );

  return report;
}

async function copyReport() {

  if (!state.selectedDate) {
    showStatus(
      "Najpierw wybierz dzień.",
      true
    );
    return;
  }

  const text =
    createReport(state.selectedDate);

  try {

    await navigator.clipboard.writeText(text);

  } catch {

    const textarea =
      document.createElement("textarea");

    textarea.value = text;

    document.body.appendChild(textarea);

    textarea.select();

    document.execCommand("copy");

    textarea.remove();

  }

  showStatus(
    "Raport skopiowany do schowka."
  );
}

/* =========================
   IMPORT FITATU
========================= */

$("importBtn").onclick = () => {
  $("fileInput").click();
};

$("fileInput").onchange = async event => {

  const file = event.target.files[0];

  if (!file) return;

  try {

    const rows =
      parseCSV(await file.text());

    if (!rows.length) {
      throw new Error(
        "Nie udało się odczytać CSV."
      );
    }

    const required = [
      "Data",
      "Posiłek",
      "Produkty i potrawy",
      "kalorie (kcal)",
      "Białka (g)"
    ];

    const missing =
      required.filter(
        column => !(column in rows[0])
      );

    if (missing.length) {
      throw new Error(
        "Brakuje kolumn Fitatu: " +
        missing.join(", ")
      );
    }

    const importedDates =
      [...new Set(
        rows
          .map(row => row["Data"])
          .filter(Boolean)
      )];

    const existingDates =
      new Set(
        state.rows
          .map(row => row["Data"])
          .filter(Boolean)
      );

    const conflicts =
      importedDates.filter(
        date => existingDates.has(date)
      );

    const newDates =
      importedDates.filter(
        date => !existingDates.has(date)
      );

    if (conflicts.length) {

      const replace = confirm(
        `Import obejmuje ${importedDates.length} dni.\n\n` +
        `Nowe dni: ${newDates.length}\n` +
        `Już istniejące: ${conflicts.length}\n\n` +
        `OK = ZASTĄP istniejące dane\n` +
        `Anuluj = POMIŃ istniejące dane`
      );

      if (replace) {

        const conflictSet =
          new Set(conflicts);

        state.rows =
          state.rows.filter(
            row =>
              !conflictSet.has(row["Data"])
          );

        state.rows.push(...rows);

      } else {

        const existingSet =
          new Set(existingDates);

        state.rows.push(
          ...rows.filter(
            row =>
              !existingSet.has(row["Data"])
          )
        );

      }

    } else {

      state.rows.push(...rows);

    }

    saveFood();

    state.selectedDate =
      getDates()[0] || "";

    renderAll();

    showStatus(
      `Import zakończony. Baza zawiera ${getDates().length} dni.`
    );

  } catch (error) {

    showStatus(
      error.message ||
      "Błąd importu CSV.",
      true
    );

  }

  event.target.value = "";
};

/* =========================
   WORKOUT EVENTS
========================= */

$("addWorkoutBtn").onclick = () => {

  if (!state.selectedDate) {

    showStatus(
      "Najpierw wybierz dzień.",
      true
    );

    return;
  }

  showWorkoutForm(true);
};

$("cancelWorkoutBtn").onclick = () => {
  showWorkoutForm(false);
};

$("saveWorkoutBtn").onclick = () => {

  if (!state.selectedDate) {

    showStatus(
      "Najpierw wybierz dzień.",
      true
    );

    return;
  }

  const workout = {

    id: Date.now().toString(36),

    date:
      state.selectedDate,

    type:
      $("wType").value.trim(),

    distance:
      number($("wDistance").value),

    time:
      $("wTime").value.trim(),

    pace:
      $("wPace").value.trim(),

    hr:
      number($("wHr").value),

    maxHr:
      number($("wMaxHr").value),

    calories:
      number($("wCalories").value),

    cadence:
      number($("wCadence").value),

    elevation:
      number($("wElevation").value),

    note:
      $("wNote").value.trim()

  };

  if (
    !workout.type &&
    !workout.distance &&
    !workout.time
  ) {

    showStatus(
      "Wpisz przynajmniej rodzaj, dystans albo czas treningu.",
      true
    );

    return;
  }

  state.workouts.push(workout);

  saveWorkouts();

  clearWorkoutForm();

  showWorkoutForm(false);

  renderAll();

  showStatus(
    "Trening zapisany."
  );
};

/* =========================
   DATE SELECT
========================= */

$("dateSelect").onchange = event => {

  state.selectedDate =
    event.target.value;

  renderAll();
};

/* =========================
   GOALS
========================= */

$("saveGoals").onclick = () => {

  const goals = {

    kcal:
      number($("goalKcal").value),

    protein:
      number($("goalProtein").value),

    carbs:
      number($("goalCarbs").value),

    fat:
      number($("goalFat").value)

  };

  localStorage.setItem(
    GOALS,
    JSON.stringify(goals)
  );

  renderGoals();

  showStatus(
    "Cele zapisane."
  );
};

/* =========================
   COPY
========================= */

$("copyBtn").onclick =
  copyReport;

/* =========================
   RENDER
========================= */

function renderAll() {

  renderDates();
  renderFood();
  renderWorkouts();
  renderGoals();
  renderHistory();

}

/* =========================
   START
========================= */

loadData();
renderAll();
