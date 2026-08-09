/* =========================================================
   FUELTRACK AI
   APP.JS
   - Fitatu CSV
   - trwała baza Fitatu
   - treningi wykonane
   - kalendarz planowanych treningów
   - trwały zapis kalendarza
   - raport tekstowy
========================================================= */

const FOOD_KEY = "fueltrack_food_v04";
const WORKOUT_KEY = "fueltrack_workouts_v04";
const PLAN_KEY = "fueltrack_training_plans_v01";
const GOALS_KEY = "fueltrack_goals_v04";

const OLD_KEYS = [
  "fueltrack_fitatu_v03",
  "fueltrack_fitatu_v02",
  "fueltrack_fitatu",
  "fitatuData",
  "fitatu_data",
  "fueltrack_data",
  "fueltrack_rows"
];

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

let foodRows = [];
let workouts = [];
let trainingPlans = [];
let selectedDate = "";

let calendarDate = new Date();


/* =========================================================
   POMOCNICZE
========================================================= */

function $(id) {
  return document.getElementById(id);
}

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

  return Number(value || 0).toLocaleString(
    "pl-PL",
    {
      maximumFractionDigits: 2
    }
  );

}

function esc(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}

function safeParse(value) {

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }

}

function status(text, error = false) {

  let box = $("status");

  if (!box) {

    box = document.createElement("div");

    box.id = "status";

    box.style.cssText = `
      position:fixed;
      left:20px;
      right:20px;
      bottom:20px;
      z-index:99999;
      padding:15px 18px;
      border-radius:15px;
      background:#222;
      color:white;
      font-weight:600;
      text-align:center;
      box-shadow:0 8px 30px rgba(0,0,0,.2);
    `;

    document.body.appendChild(box);

  }

  box.style.background =
    error ? "#b42318" : "#16794b";

  box.textContent = text;
  box.style.display = "block";

  clearTimeout(box._timer);

  box._timer = setTimeout(() => {
    box.style.display = "none";
  }, 3500);

}


/* =========================================================
   STORAGE
========================================================= */

function looksLikeFitatu(array) {

  if (
    !Array.isArray(array) ||
    !array.length
  ) {
    return false;
  }

  const sample = array[0];

  if (
    !sample ||
    typeof sample !== "object"
  ) {
    return false;
  }

  return (
    "Data" in sample ||
    "data" in sample
  );

}

function normaliseRows(rows) {

  if (!Array.isArray(rows)) {
    return [];
  }

  return rows
    .filter(
      row =>
        row &&
        typeof row === "object"
    )
    .map(row => {

      const copy = { ...row };

      if (
        !copy["Data"] &&
        copy.data
      ) {
        copy["Data"] = copy.data;
      }

      return copy;

    });

}

function recoverOldFoodData() {

  const candidates = [];

  for (
    let i = 0;
    i < localStorage.length;
    i++
  ) {

    const key =
      localStorage.key(i);

    if (!key) continue;

    const raw =
      localStorage.getItem(key);

    if (!raw) continue;

    const parsed =
      safeParse(raw);

    if (looksLikeFitatu(parsed)) {

      candidates.push({
        key,
        rows:
          normaliseRows(parsed)
      });

    }

    if (
      parsed &&
      typeof parsed === "object" &&
      Array.isArray(parsed.rows) &&
      looksLikeFitatu(parsed.rows)
    ) {

      candidates.push({
        key,
        rows:
          normaliseRows(parsed.rows)
      });

    }

  }

  for (const key of OLD_KEYS) {

    const raw =
      localStorage.getItem(key);

    if (!raw) continue;

    const parsed =
      safeParse(raw);

    if (looksLikeFitatu(parsed)) {
      return normaliseRows(parsed);
    }

    if (
      parsed &&
      Array.isArray(parsed.rows) &&
      looksLikeFitatu(parsed.rows)
    ) {

      return normaliseRows(
        parsed.rows
      );

    }

  }

  if (candidates.length) {

    candidates.sort(
      (a, b) =>
        b.rows.length -
        a.rows.length
    );

    return candidates[0].rows;

  }

  return [];

}

function saveFood() {

  localStorage.setItem(
    FOOD_KEY,
    JSON.stringify(foodRows)
  );

}

function saveWorkouts() {

  localStorage.setItem(
    WORKOUT_KEY,
    JSON.stringify(workouts)
  );

}

function saveTrainingPlans() {

  localStorage.setItem(
    PLAN_KEY,
    JSON.stringify(trainingPlans)
  );

}

function loadAll() {

  const savedFood =
    safeParse(
      localStorage.getItem(
        FOOD_KEY
      )
    );

  if (looksLikeFitatu(savedFood)) {

    foodRows =
      normaliseRows(savedFood);

  } else {

    foodRows =
      recoverOldFoodData();

    if (foodRows.length) {
      saveFood();
    }

  }

  const savedWorkouts =
    safeParse(
      localStorage.getItem(
        WORKOUT_KEY
      )
    );

  workouts =
    Array.isArray(savedWorkouts)
      ? savedWorkouts
      : [];

  const savedPlans =
    safeParse(
      localStorage.getItem(
        PLAN_KEY
      )
    );

  trainingPlans =
    Array.isArray(savedPlans)
      ? savedPlans
      : [];

}


/* =========================================================
   CSV FITATU
========================================================= */

function parseCSV(text) {

  text =
    text.replace(/^\uFEFF/, "");

  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (
    let i = 0;
    i < text.length;
    i++
  ) {

    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {

      if (
        quoted &&
        next === '"'
      ) {

        cell += '"';
        i++;

      } else {

        quoted = !quoted;

      }

    } else if (
      char === "," &&
      !quoted
    ) {

      row.push(cell);
      cell = "";

    } else if (
      (
        char === "\n" ||
        char === "\r"
      ) &&
      !quoted
    ) {

      if (
        char === "\r" &&
        next === "\n"
      ) {
        i++;
      }

      row.push(cell);
      cell = "";

      if (
        row.some(
          value =>
            value.trim() !== ""
        )
      ) {
        rows.push(row);
      }

      row = [];

    } else {

      cell += char;

    }

  }

  if (
    cell !== "" ||
    row.length
  ) {

    row.push(cell);

    if (
      row.some(
        value =>
          value.trim() !== ""
      )
    ) {
      rows.push(row);
    }

  }

  if (!rows.length) {
    return [];
  }

  const headers =
    rows[0].map(
      h => h.trim()
    );

  return rows
    .slice(1)
    .map(values => {

      const object = {};

      headers.forEach(
        (header, index) => {

          object[header] =
            (
              values[index] ??
              ""
            ).trim();

        }
      );

      return object;

    })
    .filter(object =>
      Object.values(object)
        .some(value =>
          value !== ""
        )
    );

}


/* =========================================================
   DATY
========================================================= */

function getDates() {

  const dates = [

    ...foodRows
      .map(
        row => row["Data"]
      )
      .filter(Boolean),

    ...workouts
      .map(
        workout =>
          workout.date
      )
      .filter(Boolean),

    ...trainingPlans
      .map(
        plan =>
          plan.date
      )
      .filter(Boolean)

  ];

  return [
    ...new Set(dates)
  ].sort().reverse();

}


/* =========================================================
   BILANS
========================================================= */

function totalsForDate(date) {

  const rows =
    foodRows.filter(
      row =>
        row["Data"] === date
    );

  const totals = {
    kcal: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  };

  rows.forEach(row => {

    totals.kcal +=
      num(
        row["kalorie (kcal)"]
      );

    totals.protein +=
      num(
        row["Białka (g)"]
      );

    totals.carbs +=
      num(
        row["Węglowodany (g)"]
      );

    totals.fat +=
      num(
        row["Tłuszcze (g)"]
      );

  });

  return {
    rows,
    totals
  };

}


/* =========================================================
   WYBÓR DNIA
========================================================= */

function renderDateSelector() {

  const select =
    $("dateSelect");

  if (!select) return;

  const dates =
    getDates();

  if (!dates.length) {

    selectedDate = "";

    select.innerHTML =
      `<option value="">
        Brak danych
      </option>`;

    if ($("selectedDateLabel")) {
      $("selectedDateLabel")
        .textContent =
        "Brak danych";
    }

    if ($("dayCount")) {
      $("dayCount")
        .textContent =
        "0 dni";
    }

    return;

  }

  if (
    !selectedDate ||
    !dates.includes(selectedDate)
  ) {

    selectedDate =
      dates[0];

  }

  select.innerHTML =
    dates.map(date =>
      `<option value="${esc(date)}">
        ${esc(date)}
      </option>`
    ).join("");

  select.value =
    selectedDate;

  if ($("selectedDateLabel")) {

    $("selectedDateLabel")
      .textContent =
      selectedDate;

  }

  if ($("dayCount")) {

    $("dayCount")
      .textContent =
      `${dates.length} ${
        dates.length === 1
          ? "dzień"
          : "dni"
      }`;

  }

}


/* =========================================================
   POSIŁKI
========================================================= */

function renderMeals() {

  const box =
    $("meals");

  if (!box) return;

  if (!selectedDate) {

    box.innerHTML =
      `<p>Brak danych.</p>`;

    return;

  }

  const rows =
    foodRows.filter(
      row =>
        row["Data"] ===
        selectedDate
    );

  if (!rows.length) {

    box.innerHTML =
      `<p>Brak posiłków dla tego dnia.</p>`;

    return;

  }

  const groups = {};

  rows.forEach(row => {

    const meal =
      row["Posiłek"] ||
      "Inne";

    if (!groups[meal]) {
      groups[meal] = [];
    }

    groups[meal].push(row);

  });

  box.innerHTML =
    Object.entries(groups)
      .map(
        ([meal, products]) => {

          return `
            <div class="meal">

              <h3>
                ${esc(meal)}
              </h3>

              ${products
                .map(product => {

                  const name =
                    product[
                      "Produkty i potrawy"
                    ] ||
                    "Produkt";

                  const kcal =
                    num(
                      product[
                        "kalorie (kcal)"
                      ]
                    );

                  const protein =
                    num(
                      product[
                        "Białka (g)"
                      ]
                    );

                  const carbs =
                    num(
                      product[
                        "Węglowodany (g)"
                      ]
                    );

                  const fat =
                    num(
                      product[
                        "Tłuszcze (g)"
                      ]
                    );

                  return `
                    <div
                      class="product"
                      style="
                        padding:10px 0;
                        border-bottom:1px solid #eee;
                      "
                    >

                      <strong>
                        ${esc(name)}
                      </strong>

                      <div>
                        ${fmt(kcal)} kcal
                        · B ${fmt(protein)} g
                        · W ${fmt(carbs)} g
                        · T ${fmt(fat)} g
                      </div>

                    </div>
                  `;

                })
                .join("")}

            </div>
          `;

        }
      )
      .join("");

}


/* =========================================================
   MAKRO
========================================================= */

function renderMacro() {

  const result =
    totalsForDate(
      selectedDate
    );

  const totals =
    result.totals;

  if ($("kcal")) {
    $("kcal").textContent =
      fmt(totals.kcal);
  }

  if ($("protein")) {
    $("protein").textContent =
      fmt(totals.protein);
  }

  if ($("carbs")) {
    $("carbs").textContent =
      fmt(totals.carbs);
  }

  if ($("fat")) {
    $("fat").textContent =
      fmt(totals.fat);
  }

}


/* =========================================================
   MIKRO
========================================================= */

function renderMicro() {

  const box =
    $("micros");

  if (!box) return;

  const rows =
    foodRows.filter(
      row =>
        row["Data"] ===
        selectedDate
    );

  if (!rows.length) {

    box.innerHTML =
      `<p>Brak danych.</p>`;

    return;

  }

  box.innerHTML =
    MICRO_COLUMNS
      .map(
        ([column, label, unit]) => {

          const total =
            rows.reduce(
              (sum, row) =>
                sum +
                num(row[column]),
              0
            );

          if (!total) {
            return "";
          }

          return `
            <div
              style="
                display:flex;
                justify-content:space-between;
                padding:7px 0;
                border-bottom:1px solid #eee;
              "
            >

              <span>
                ${esc(label)}
              </span>

              <strong>
                ${fmt(total)}
                ${unit}
              </strong>

            </div>
          `;

        }
      )
      .join("");

}


/* =========================================================
   TRENINGI WYKONANE
========================================================= */

function createWorkoutSection() {

  if ($("workoutSection")) {
    return;
  }

  const section =
    document.createElement("section");

  section.id =
    "workoutSection";

  section.style.cssText = `
    background:white;
    border-radius:28px;
    padding:24px;
    margin:22px 0;
    box-shadow:0 4px 20px rgba(0,0,0,.06);
  `;

  section.innerHTML = `

    <div
      style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        gap:12px;
        margin-bottom:18px;
      "
    >

      <h2 style="margin:0">
        🏃 Trening
      </h2>

      <button
        id="addWorkoutBtn"
        style="
          border:0;
          border-radius:14px;
          padding:12px 16px;
          background:#2463eb;
          color:white;
          font-weight:700;
          font-size:15px;
        "
      >
        + Dodaj trening
      </button>

    </div>

    <div id="workouts"></div>

    <div
      id="workoutForm"
      style="
        display:none;
        margin-top:20px;
        padding:18px;
        border-radius:20px;
        background:#f5f6fa;
      "
    >

      <h3>Nowy trening</h3>

      <input
        id="wType"
        placeholder="Rodzaj, np. Easy Run / Interwały"
        style="width:100%;box-sizing:border-box;padding:13px;margin:5px 0;border-radius:12px;border:1px solid #ddd"
      >

      <input
        id="wDistance"
        type="number"
        step="0.01"
        placeholder="Dystans km"
        style="width:100%;box-sizing:border-box;padding:13px;margin:5px 0;border-radius:12px;border:1px solid #ddd"
      >

      <input
        id="wTime"
        placeholder="Czas, np. 52:34"
        style="width:100%;box-sizing:border-box;padding:13px;margin:5px 0;border-radius:12px;border:1px solid #ddd"
      >

      <input
        id="wPace"
        placeholder="Tempo, np. 5:18/km"
        style="width:100%;box-sizing:border-box;padding:13px;margin:5px 0;border-radius:12px;border:1px solid #ddd"
      >

      <input
        id="wHr"
        type="number"
        placeholder="Średnie tętno"
        style="width:100%;box-sizing:border-box;padding:13px;margin:5px 0;border-radius:12px;border:1px solid #ddd"
      >

      <input
        id="wMaxHr"
        type="number"
        placeholder="Maksymalne tętno"
        style="width:100%;box-sizing:border-box;padding:13px;margin:5px 0;border-radius:12px;border:1px solid #ddd"
      >

      <input
        id="wCalories"
        type="number"
        placeholder="Kalorie treningu"
        style="width:100%;box-sizing:border-box;padding:13px;margin:5px 0;border-radius:12px;border:1px solid #ddd"
      >

      <input
        id="wCadence"
        type="number"
        placeholder="Kadencja"
        style="width:100%;box-sizing:border-box;padding:13px;margin:5px 0;border-radius:12px;border:1px solid #ddd"
      >

      <input
        id="wElevation"
        type="number"
        placeholder="Przewyższenie m"
        style="width:100%;box-sizing:border-box;padding:13px;margin:5px 0;border-radius:12px;border:1px solid #ddd"
      >

      <textarea
        id="wNote"
        placeholder="Odczucia / notatka"
        rows="3"
        style="width:100%;box-sizing:border-box;padding:13px;margin:5px 0;border-radius:12px;border:1px solid #ddd"
      ></textarea>

      <div
        style="
          display:flex;
          gap:10px;
          margin-top:10px;
        "
      >

        <button
          id="saveWorkoutBtn"
          style="
            flex:1;
            border:0;
            border-radius:14px;
            padding:14px;
            background:#16794b;
            color:white;
            font-weight:700;
          "
        >
          Zapisz trening
        </button>

        <button
          id="cancelWorkoutBtn"
          style="
            flex:1;
            border:0;
            border-radius:14px;
            padding:14px;
            background:#ddd;
            font-weight:700;
          "
        >
          Anuluj
        </button>

      </div>

    </div>
  `;

  const history =
    $("history");

  if (
    history &&
    history.parentElement
  ) {

    history.parentElement
      .before(section);

  } else {

    document.body.appendChild(section);

  }

  setupWorkoutEvents();

}

function setupWorkoutEvents() {

  const add =
    $("addWorkoutBtn");

  const save =
    $("saveWorkoutBtn");

  const cancel =
    $("cancelWorkoutBtn");

  if (add) {

    add.onclick = () => {

      if (!selectedDate) {

        status(
          "Najpierw wybierz dzień.",
          true
        );

        return;

      }

      $("workoutForm")
        .style.display =
        "block";

      $("workoutForm")
        .scrollIntoView({
          behavior:"smooth",
          block:"center"
        });

    };

  }

  if (cancel) {

    cancel.onclick = () => {

      $("workoutForm")
        .style.display =
        "none";

    };

  }

  if (save) {
    save.onclick =
      saveWorkout;
  }

}

function saveWorkout() {

  if (!selectedDate) {

    status(
      "Nie wybrano dnia.",
      true
    );

    return;

  }

  const workout = {

    id:
      Date.now().toString(),

    date:
      selectedDate,

    type:
      $("wType").value.trim(),

    distance:
      num(
        $("wDistance").value
      ),

    time:
      $("wTime").value.trim(),

    pace:
      $("wPace").value.trim(),

    hr:
      num(
        $("wHr").value
      ),

    maxHr:
      num(
        $("wMaxHr").value
      ),

    calories:
      num(
        $("wCalories").value
      ),

    cadence:
      num(
        $("wCadence").value
      ),

    elevation:
      num(
        $("wElevation").value
      ),

    note:
      $("wNote").value.trim()

  };

  if (
    !workout.type &&
    !workout.distance &&
    !workout.time
  ) {

    status(
      "Wpisz przynajmniej rodzaj, dystans albo czas.",
      true
    );

    return;

  }

  workouts.push(workout);

  saveWorkouts();

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

    if ($(id)) {
      $(id).value = "";
    }

  });

  $("workoutForm")
    .style.display =
    "none";

  renderWorkouts();
  renderHistory();

  status(
    "Trening zapisany."
  );

}

function renderWorkouts() {

  const box =
    $("workouts");

  if (!box) return;

  const list =
    workouts.filter(
      workout =>
        workout.date ===
        selectedDate
    );

  if (!list.length) {

    box.innerHTML = `
      <div
        style="
          color:#777;
          padding:10px 0;
        "
      >
        Brak treningów dla tego dnia.
      </div>
    `;

    return;

  }

  box.innerHTML =
    list.map(workout => {

      return `
        <div
          style="
            padding:17px;
            margin-bottom:12px;
            border-radius:18px;
            background:#f5f6fa;
          "
        >

          <div
            style="
              font-size:18px;
              font-weight:800;
              margin-bottom:12px;
            "
          >
            🏃 ${esc(
              workout.type ||
              "Trening"
            )}
          </div>

          <div
            style="
              display:grid;
              grid-template-columns:1fr 1fr;
              gap:10px;
            "
          >

            ${
              workout.distance
                ? `<div>
                    <small>Dystans</small>
                    <br>
                    <b>${fmt(workout.distance)} km</b>
                  </div>`
                : ""
            }

            ${
              workout.time
                ? `<div>
                    <small>Czas</small>
                    <br>
                    <b>${esc(workout.time)}</b>
                  </div>`
                : ""
            }

            ${
              workout.pace
                ? `<div>
                    <small>Tempo</small>
                    <br>
                    <b>${esc(workout.pace)}</b>
                  </div>`
                : ""
            }

            ${
              workout.hr
                ? `<div>
                    <small>Śr. HR</small>
                    <br>
                    <b>${fmt(workout.hr)}</b>
                  </div>`
                : ""
            }

            ${
              workout.maxHr
                ? `<div>
                    <small>Max HR</small>
                    <br>
                    <b>${fmt(workout.maxHr)}</b>
                  </div>`
                : ""
            }

            ${
              workout.calories
                ? `<div>
                    <small>Kalorie</small>
                    <br>
                    <b>${fmt(workout.calories)} kcal</b>
                  </div>`
                : ""
            }

            ${
              workout.cadence
                ? `<div>
                    <small>Kadencja</small>
                    <br>
                    <b>${fmt(workout.cadence)}</b>
                  </div>`
                : ""
            }

            ${
              workout.elevation
                ? `<div>
                    <small>Przewyższenie</small>
                    <br>
                    <b>${fmt(workout.elevation)} m</b>
                  </div>`
                : ""
            }

          </div>

          ${
            workout.note
              ? `
                <div
                  style="
                    margin-top:12px;
                    padding-top:12px;
                    border-top:1px solid #ddd;
                  "
                >
                  📝 ${esc(workout.note)}
                </div>
              `
              : ""
          }

          <button
            data-delete-workout="${esc(workout.id)}"
            style="
              margin-top:14px;
              border:0;
              border-radius:10px;
              padding:9px 13px;
              background:#fee4e2;
              color:#b42318;
              font-weight:700;
            "
          >
            Usuń trening
          </button>

        </div>
      `;

    }).join("");

  box
    .querySelectorAll(
      "[data-delete-workout]"
    )
    .forEach(button => {

      button.onclick = () => {

        if (
          !confirm(
            "Usunąć ten trening?"
          )
        ) {
          return;
        }

        const id =
          button.dataset
            .deleteWorkout;

        workouts =
          workouts.filter(
            workout =>
              String(workout.id) !==
              String(id)
          );

        saveWorkouts();

        renderWorkouts();
        renderHistory();

        status(
          "Trening usunięty."
        );

      };

    });

}


/* =========================================================
   KALENDARZ — STYLE
========================================================= */

function calendarStyles() {

  if ($("calendarStyles")) {
    return;
  }

  const style =
    document.createElement("style");

  style.id =
    "calendarStyles";

  style.textContent = `

    .ft-calendar-grid {
      display:grid;
      grid-template-columns:repeat(7,1fr);
      gap:5px;
    }

    .ft-calendar-weekday {
      text-align:center;
      font-size:12px;
      font-weight:800;
      color:#777;
      padding:6px 0;
    }

    .ft-calendar-day {
      min-height:72px;
      border:1px solid #e5e7eb;
      border-radius:12px;
      background:#fff;
      padding:7px;
      box-sizing:border-box;
      cursor:pointer;
      text-align:left;
    }

    .ft-calendar-day:hover {
      background:#f5f7fb;
    }

    .ft-calendar-empty {
      min-height:72px;
    }

    .ft-calendar-number {
      font-weight:800;
      font-size:14px;
    }

    .ft-calendar-today {
      border:2px solid #2463eb;
    }

    .ft-plan-dot {
      margin-top:6px;
      font-size:11px;
      font-weight:700;
      overflow:hidden;
      white-space:nowrap;
      text-overflow:ellipsis;
    }

    .ft-calendar-back {
      display:none;
    }

    @media (max-width:600px) {

      .ft-calendar-day {
        min-height:64px;
        padding:5px;
      }

      .ft-plan-dot {
        font-size:10px;
      }

    }

  `;

  document.head.appendChild(style);

}


/* =========================================================
   KALENDARZ — OKNO
========================================================= */

function createCalendarSection() {

  if ($("calendarSection")) {
    return;
  }

  calendarStyles();

  const section =
    document.createElement("section");

  section.id =
    "calendarSection";

  section.style.cssText = `
    background:white;
    border-radius:28px;
    padding:24px;
    margin:22px 0;
    box-shadow:0 4px 20px rgba(0,0,0,.06);
  `;

  section.innerHTML = `

    <div
      style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        gap:10px;
        margin-bottom:18px;
      "
    >

      <h2 style="margin:0">
        📅 Kalendarz treningów
      </h2>

      <button
        id="closeCalendarBtn"
        style="
          border:0;
          border-radius:12px;
          padding:10px 14px;
          background:#eee;
          font-weight:700;
        "
      >
        Zamknij
      </button>

    </div>

    <div
      id="calendarMonthHeader"
      style="
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:10px;
        margin-bottom:14px;
      "
    >

      <button
        id="calendarPrev"
        style="
          border:0;
          border-radius:12px;
          padding:10px 14px;
          background:#f0f2f5;
          font-size:20px;
        "
      >
        ‹
      </button>

      <strong
        id="calendarMonthTitle"
        style="
          font-size:18px;
          text-align:center;
        "
      ></strong>

      <button
        id="calendarNext"
        style="
          border:0;
          border-radius:12px;
          padding:10px 14px;
          background:#f0f2f5;
          font-size:20px;
        "
      >
        ›
      </button>

    </div>

    <div
      id="calendarGrid"
      class="ft-calendar-grid"
    ></div>

    <div
      id="calendarPlanEditor"
      style="
        display:none;
        margin-top:20px;
        padding:18px;
        border-radius:20px;
        background:#f5f6fa;
      "
    >

      <h3
        id="calendarEditorTitle"
        style="margin-top:0"
      >
        Zaplanuj trening
      </h3>

      <input
        id="planName"
        placeholder="Nazwa, np. 10 km Easy"
        style="
          width:100%;
          box-sizing:border-box;
          padding:13px;
          margin:5px 0;
          border-radius:12px;
          border:1px solid #ddd;
        "
      >

      <select
        id="planType"
        style="
          width:100%;
          box-sizing:border-box;
          padding:13px;
          margin:5px 0;
          border-radius:12px;
          border:1px solid #ddd;
          background:white;
        "
      >

        <option value="Easy">
          Easy
        </option>

        <option value="Long">
          Long
        </option>

        <option value="Interwały">
          Interwały
        </option>

        <option value="Podbiegi">
          Podbiegi
        </option>

        <option value="Siłownia">
          Siłownia
        </option>

        <option value="Regeneracja">
          Regeneracja
        </option>

        <option value="Inne">
          Inne
        </option>

      </select>

      <input
        id="planDistance"
        type="number"
        step="0.01"
        placeholder="Planowany dystans km"
        style="
          width:100%;
          box-sizing:border-box;
          padding:13px;
          margin:5px 0;
          border-radius:12px;
          border:1px solid #ddd;
        "
      >

      <input
        id="planPace"
        placeholder="Planowane tempo, np. 5:40–6:00/km"
        style="
          width:100%;
          box-sizing:border-box;
          padding:13px;
          margin:5px 0;
          border-radius:12px;
          border:1px solid #ddd;
        "
      >

      <input
        id="planTime"
        placeholder="Planowany czas, np. 55 min"
        style="
          width:100%;
          box-sizing:border-box;
          padding:13px;
          margin:5px 0;
          border-radius:12px;
          border:1px solid #ddd;
        "
      >

      <input
        id="planCalories"
        type="number"
        placeholder="Przypuszczalne kcal"
        style="
          width:100%;
          box-sizing:border-box;
          padding:13px;
          margin:5px 0;
          border-radius:12px;
          border:1px solid #ddd;
        "
      >

      <textarea
        id="planNote"
        rows="3"
        placeholder="Notatka / szczegóły treningu"
        style="
          width:100%;
          box-sizing:border-box;
          padding:13px;
          margin:5px 0;
          border-radius:12px;
          border:1px solid #ddd;
        "
      ></textarea>

      <div
        style="
          display:flex;
          gap:10px;
          margin-top:10px;
        "
      >

        <button
          id="savePlanBtn"
          style="
            flex:1;
            border:0;
            border-radius:14px;
            padding:14px;
            background:#16794b;
            color:white;
            font-weight:700;
          "
        >
          Zapisz plan
        </button>

        <button
          id="cancelPlanBtn"
          style="
            flex:1;
            border:0;
            border-radius:14px;
            padding:14px;
            background:#ddd;
            font-weight:700;
          "
        >
          Anuluj
        </button>

      </div>

    </div>

    <div
      id="calendarPlansList"
      style="
        margin-top:20px;
      "
    ></div>

  `;

  const history =
    $("history");

  if (
    history &&
    history.parentElement
  ) {

    history.parentElement
      .before(section);

  } else {

    document.body.appendChild(
      section
    );

  }

  setupCalendarEvents();
  renderCalendar();

}


/* =========================================================
   KALENDARZ — EVENTY
========================================================= */

function setupCalendarEvents() {

  const close =
    $("closeCalendarBtn");

  const prev =
    $("calendarPrev");

  const next =
    $("calendarNext");

  const save =
    $("savePlanBtn");

  const cancel =
    $("cancelPlanBtn");

  if (close) {

    close.onclick = () => {

      $("calendarSection")
        .style.display =
        "none";

      window.scrollTo({
        top:0,
        behavior:"smooth"
      });

    };

  }

  if (prev) {

    prev.onclick = () => {

      calendarDate =
        new Date(
          calendarDate.getFullYear(),
          calendarDate.getMonth() - 1,
          1
        );

      renderCalendar();

    };

  }

  if (next) {

    next.onclick = () => {

      calendarDate =
        new Date(
          calendarDate.getFullYear(),
          calendarDate.getMonth() + 1,
          1
        );

      renderCalendar();

    };

  }

  if (cancel) {

    cancel.onclick = () => {

      closePlanEditor();

    };

  }

  if (save) {

    save.onclick =
      saveTrainingPlan;

  }

}


/* =========================================================
   KALENDARZ — RENDER
========================================================= */

function renderCalendar() {

  const grid =
    $("calendarGrid");

  if (!grid) return;

  const year =
    calendarDate.getFullYear();

  const month =
    calendarDate.getMonth();

  const monthNames = [
    "Styczeń",
    "Luty",
    "Marzec",
    "Kwiecień",
    "Maj",
    "Czerwiec",
    "Lipiec",
    "Sierpień",
    "Wrzesień",
    "Październik",
    "Listopad",
    "Grudzień"
  ];

  if ($("calendarMonthTitle")) {

    $("calendarMonthTitle")
      .textContent =
      `${monthNames[month]} ${year}`;

  }

  const weekdays = [
    "Pn",
    "Wt",
    "Śr",
    "Cz",
    "Pt",
    "Sb",
    "Nd"
  ];

  let html =
    weekdays.map(day =>
      `
        <div class="ft-calendar-weekday">
          ${day}
        </div>
      `
    ).join("");

  const firstDay =
    new Date(
      year,
      month,
      1
    ).getDay();

  const mondayIndex =
    firstDay === 0
      ? 6
      : firstDay - 1;

  const daysInMonth =
    new Date(
      year,
      month + 1,
      0
    ).getDate();

  for (
    let i = 0;
    i < mondayIndex;
    i++
  ) {

    html +=
      `<div class="ft-calendar-empty"></div>`;

  }

  const today =
    new Date();

  for (
    let day = 1;
    day <= daysInMonth;
    day++
  ) {

    const date =
      `${year}-${String(month + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;

    const plans =
      trainingPlans.filter(
        plan =>
          plan.date === date
      );

    const isToday =
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === day;

    html += `

      <button
        class="
          ft-calendar-day
          ${isToday ? "ft-calendar-today" : ""}
        "
        data-calendar-date="${date}"
      >

        <div class="ft-calendar-number">
          ${day}
        </div>

        ${
          plans
            .map(plan =>
              `
                <div
                  class="ft-plan-dot"
                  title="${esc(plan.name)}"
                >
                  ${esc(
                    plan.type ||
                    plan.name ||
                    "Trening"
                  )}
                </div>
              `
            )
            .join("")
        }

      </button>

    `;

  }

  grid.innerHTML =
    html;

  grid
    .querySelectorAll(
      "[data-calendar-date]"
    )
    .forEach(button => {

      button.onclick = () => {

        openPlanEditor(
          button.dataset
            .calendarDate
        );

      };

    });

  renderCalendarPlansList();

}


/* =========================================================
   KALENDARZ — EDYTOR
========================================================= */

let editingPlanId = null;
let editingPlanDate = null;

function openPlanEditor(date, planId = null) {

  const editor =
    $("calendarPlanEditor");

  if (!editor) return;

  editingPlanId =
    planId;

  editingPlanDate =
    date;

  let plan = null;

  if (planId) {

    plan =
      trainingPlans.find(
        item =>
          String(item.id) ===
          String(planId)
      );

  }

  if ($("calendarEditorTitle")) {

    $("calendarEditorTitle")
      .textContent =
      plan
        ? "Edytuj trening"
        : `Zaplanuj trening — ${date}`;

  }

  $("planName").value =
    plan?.name || "";

  $("planType").value =
    plan?.type || "Easy";

  $("planDistance").value =
    plan?.distance || "";

  $("planPace").value =
    plan?.pace || "";

  $("planTime").value =
    plan?.time || "";

  $("planCalories").value =
    plan?.calories || "";

  $("planNote").value =
    plan?.note || "";

  editor.style.display =
    "block";

  editor.scrollIntoView({
    behavior:"smooth",
    block:"center"
  });

}

function closePlanEditor() {

  editingPlanId =
    null;

  editingPlanDate =
    null;

  if ($("calendarPlanEditor")) {

    $("calendarPlanEditor")
      .style.display =
      "none";

  }

}


/* =========================================================
   ZAPIS PLANU
========================================================= */

function saveTrainingPlan() {

  if (!editingPlanDate) {

    status(
      "Nie wybrano dnia.",
      true
    );

    return;

  }

  const plan = {

    id:
      editingPlanId ||
      Date.now().toString(),

    date:
      editingPlanDate,

    name:
      $("planName").value.trim(),

    type:
      $("planType").value,

    distance:
      num(
        $("planDistance").value
      ),

    pace:
      $("planPace").value.trim(),

    time:
      $("planTime").value.trim(),

    calories:
      num(
        $("planCalories").value
      ),

    note:
      $("planNote").value.trim()

  };

  if (
    !plan.name &&
    !plan.type &&
    !plan.distance
  ) {

    status(
      "Wpisz nazwę, rodzaj albo dystans treningu.",
      true
    );

    return;

  }

  if (editingPlanId) {

    const index =
      trainingPlans.findIndex(
        item =>
          String(item.id) ===
          String(editingPlanId)
      );

    if (index !== -1) {

      trainingPlans[index] =
        plan;

    }

  } else {

    trainingPlans.push(
      plan
    );

  }

  saveTrainingPlans();

  closePlanEditor();

  renderCalendar();

  renderDateSelector();
  renderHistory();

  status(
    "Plan treningowy zapisany."
  );

}


/* =========================================================
   LISTA PLANÓW POD KALENDARZEM
========================================================= */

function renderCalendarPlansList() {

  const box =
    $("calendarPlansList");

  if (!box) return;

  const year =
    calendarDate.getFullYear();

  const month =
    calendarDate.getMonth();

  const prefix =
    `${year}-${String(month + 1).padStart(2,"0")}`;

  const plans =
    trainingPlans
      .filter(
        plan =>
          plan.date.startsWith(prefix)
      )
      .sort(
        (a,b) =>
          a.date.localeCompare(
            b.date
          )
      );

  if (!plans.length) {

    box.innerHTML = `
      <div
        style="
          color:#777;
          padding:10px 0;
        "
      >
        Brak zaplanowanych treningów w tym miesiącu.
      </div>
    `;

    return;

  }

  box.innerHTML = `

    <h3>
      Zaplanowane treningi
    </h3>

    ${plans.map(plan => {

      return `
        <div
          style="
            padding:15px;
            margin-bottom:10px;
            border-radius:17px;
            background:#f5f6fa;
          "
        >

          <div
            style="
              display:flex;
              justify-content:space-between;
              gap:10px;
              align-items:flex-start;
            "
          >

            <div>

              <div
                style="
                  font-size:17px;
                  font-weight:800;
                "
              >
                ${esc(
                  plan.name ||
                  plan.type ||
                  "Trening"
                )}
              </div>

              <div
                style="
                  color:#666;
                  margin-top:4px;
                "
              >
                ${esc(plan.date)}
                ·
                ${esc(plan.type || "Inne")}
              </div>

            </div>

            <button
              data-edit-plan="${esc(plan.id)}"
              style="
                border:0;
                border-radius:10px;
                padding:8px 11px;
                background:#e8eefc;
                color:#2463eb;
                font-weight:700;
              "
            >
              Edytuj
            </button>

          </div>

          <div
            style="
              display:grid;
              grid-template-columns:1fr 1fr;
              gap:8px;
              margin-top:12px;
            "
          >

            ${
              plan.distance
                ? `
                  <div>
                    <small>Dystans</small>
                    <br>
                    <b>
                      ${fmt(plan.distance)} km
                    </b>
                  </div>
                `
                : ""
            }

            ${
              plan.pace
                ? `
                  <div>
                    <small>Tempo</small>
                    <br>
                    <b>
                      ${esc(plan.pace)}
                    </b>
                  </div>
                `
                : ""
            }

            ${
              plan.time
                ? `
                  <div>
                    <small>Czas</small>
                    <br>
                    <b>
                      ${esc(plan.time)}
                    </b>
                  </div>
                `
                : ""
            }

            ${
              plan.calories
                ? `
                  <div>
                    <small>Planowane kcal</small>
                    <br>
                    <b>
                      ${fmt(plan.calories)} kcal
                    </b>
                  </div>
                `
                : ""
            }

          </div>

          ${
            plan.note
              ? `
                <div
                  style="
                    margin-top:12px;
                    padding-top:10px;
                    border-top:1px solid #ddd;
                  "
                >
                  📝 ${esc(plan.note)}
                </div>
              `
              : ""
          }

          <button
            data-delete-plan="${esc(plan.id)}"
            style="
              margin-top:13px;
              border:0;
              border-radius:10px;
              padding:9px 13px;
              background:#fee4e2;
              color:#b42318;
              font-weight:700;
            "
          >
            Usuń plan
          </button>

        </div>
      `;

    }).join("")}

  `;

  box
    .querySelectorAll(
      "[data-edit-plan]"
    )
    .forEach(button => {

      button.onclick = () => {

        const plan =
          trainingPlans.find(
            item =>
              String(item.id) ===
              String(
                button.dataset
                  .editPlan
              )
          );

        if (!plan) return;

        openPlanEditor(
          plan.date,
          plan.id
        );

      };

    });

  box
    .querySelectorAll(
      "[data-delete-plan]"
    )
    .forEach(button => {

      button.onclick = () => {

        if (
          !confirm(
            "Usunąć zaplanowany trening?"
          )
        ) {
          return;
        }

        trainingPlans =
          trainingPlans.filter(
            plan =>
              String(plan.id) !==
              String(
                button.dataset
                  .deletePlan
              )
          );

        saveTrainingPlans();

        renderCalendar();
        renderDateSelector();
        renderHistory();

        status(
          "Plan treningowy usunięty."
        );

      };

    });

}


/* =========================================================
   PRZYCISK KALENDARZA
========================================================= */

function createCalendarButton() {

  if ($("openCalendarBtn")) {
    return;
  }

  const button =
    document.createElement("button");

  button.id =
    "openCalendarBtn";

  button.textContent =
    "📅 Kalendarz treningów";

  button.style.cssText = `
    border:0;
    border-radius:14px;
    padding:12px 16px;
    background:#2463eb;
    color:white;
    font-weight:700;
    font-size:15px;
    margin:10px 0;
  `;

  button.onclick = () => {

    const section =
      $("calendarSection");

    if (!section) return;

    section.style.display =
      "block";

    renderCalendar();

    section.scrollIntoView({
      behavior:"smooth",
      block:"start"
    });

  };

  const workout =
    $("workoutSection");

  if (
    workout &&
    workout.parentElement
  ) {

    workout.parentElement
      .insertBefore(
        button,
        workout
      );

  } else {

    document.body.appendChild(
      button
    );

  }

}


/* =========================================================
   HISTORIA
========================================================= */

function renderHistory() {

  const box =
    $("history");

  if (!box) return;

  const dates =
    getDates();

  if (!dates.length) {

    box.innerHTML =
      `<p>Brak zapisanych dni.</p>`;

    return;

  }

  box.innerHTML =
    dates.map(date => {

      const result =
        totalsForDate(date);

      const workoutCount =
        workouts.filter(
          workout =>
            workout.date === date
        ).length;

      const planCount =
        trainingPlans.filter(
          plan =>
            plan.date === date
        ).length;

      return `
        <div
          style="
            display:flex;
            justify-content:space-between;
            gap:10px;
            align-items:center;
            padding:12px 0;
            border-bottom:1px solid #eee;
          "
        >

          <button
            data-history-date="${esc(date)}"
            style="
              border:0;
              background:none;
              font-weight:700;
              font-size:16px;
            "
          >
            ${esc(date)}
          </button>

          <span>

            ${
              result.totals.kcal
                ? `${fmt(result.totals.kcal)} kcal`
                : ""
            }

            ${
              workoutCount
                ? ` · 🏃 ${workoutCount}`
                : ""
            }

            ${
              planCount
                ? ` · 📅 ${planCount}`
                : ""
            }

          </span>

        </div>
      `;

    }).join("");

  box
    .querySelectorAll(
      "[data-history-date]"
    )
    .forEach(button => {

      button.onclick = () => {

        selectedDate =
          button.dataset
            .historyDate;

        renderAll();

        window.scrollTo({
          top:0,
          behavior:"smooth"
        });

      };

    });

}


/* =========================================================
   RAPORT
========================================================= */

function createReport(date) {

  const result =
    totalsForDate(date);

  const rows =
    result.rows;

  const totals =
    result.totals;

  let text =
    `FUELTRACK AI\n` +
    `RAPORT DNIA: ${date}\n\n`;

  const meals = {};

  rows.forEach(row => {

    const meal =
      row["Posiłek"] ||
      "Inne";

    if (!meals[meal]) {
      meals[meal] = [];
    }

    meals[meal].push(row);

  });

  Object.entries(meals)
    .forEach(
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

          if (
            product["ilość (g)"]
          ) {

            text +=
              ` — ${
                product["ilość (g)"]
              } g`;

          }

          text +=
            ` — ${
              fmt(
                num(
                  product[
                    "kalorie (kcal)"
                  ]
                )
              )
            } kcal`;

          text +=
            ` | B ${
              fmt(
                num(
                  product[
                    "Białka (g)"
                  ]
                )
              )
            } g`;

          text +=
            ` | W ${
              fmt(
                num(
                  product[
                    "Węglowodany (g)"
                  ]
                )
              )
            } g`;

          text +=
            ` | T ${
              fmt(
                num(
                  product[
                    "Tłuszcze (g)"
                  ]
                )
              )
            } g\n`;

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

  text +=
    `TRENINGI\n`;

  const dayWorkouts =
    workouts.filter(
      workout =>
        workout.date === date
    );

  if (!dayWorkouts.length) {

    text +=
      `Brak zapisanych treningów.\n`;

  } else {

    dayWorkouts.forEach(
      workout => {

        text +=
          `• ${
            workout.type ||
            "Trening"
          }`;

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

      }
    );

  }

  text +=
    `\nMIKROELEMENTY\n`;

  MICRO_COLUMNS.forEach(
    ([column, label, unit]) => {

      const total =
        rows.reduce(
          (sum, row) =>
            sum +
            num(row[column]),
          0
        );

      if (total) {

        text +=
          `${label}: ${fmt(total)} ${unit}\n`;

      }

    }
  );

  return text;

}


/* =========================================================
   KOPIOWANIE RAPORTU
========================================================= */

async function copyReport() {

  if (!selectedDate) {

    status(
      "Brak wybranego dnia.",
      true
    );

    return;

  }

  const text =
    createReport(
      selectedDate
    );

  try {

    await navigator.clipboard
      .writeText(text);

  } catch {

    const textarea =
      document.createElement(
        "textarea"
      );

    textarea.value =
      text;

    document.body.appendChild(
      textarea
    );

    textarea.select();

    document.execCommand(
      "copy"
    );

    textarea.remove();

  }

  status(
    "Raport skopiowany."
  );

}


/* =========================================================
   IMPORT FITATU
========================================================= */

function setupImport() {

  const button =
    $("importBtn");

  const input =
    $("fileInput");

  if (!button || !input) {
    return;
  }

  button.onclick = () => {
    input.click();
  };

  input.onchange =
    async event => {

      const file =
        event.target.files[0];

      if (!file) return;

      try {

        const imported =
          parseCSV(
            await file.text()
          );

        if (!imported.length) {

          throw new Error(
            "CSV jest pusty."
          );

        }

        if (
          !(
            "Data" in
            imported[0]
          )
        ) {

          throw new Error(
            "Nie znaleziono kolumny Data. To nie wygląda na poprawny eksport Fitatu."
          );

        }

        const importedDates =
          [
            ...new Set(
              imported
                .map(
                  row =>
                    row["Data"]
                )
                .filter(Boolean)
            )
          ];

        const existingDates =
          new Set(
            foodRows
              .map(
                row =>
                  row["Data"]
              )
              .filter(Boolean)
          );

        const conflicts =
          importedDates.filter(
            date =>
              existingDates.has(
                date
              )
          );

        if (conflicts.length) {

          const replace =
            confirm(
              `Import zawiera ${importedDates.length} dni.\n\n` +
              `Dni już zapisane: ${conflicts.length}\n` +
              `Nowe dni: ${
                importedDates.length -
                conflicts.length
              }\n\n` +
              `OK — zastąp istniejące dni.\n` +
              `Anuluj — zachowaj istniejące dni.`
            );

          if (replace) {

            const conflictSet =
              new Set(
                conflicts
              );

            foodRows =
              foodRows.filter(
                row =>
                  !conflictSet.has(
                    row["Data"]
                  )
              );

            foodRows.push(
              ...imported
            );

          } else {

            foodRows.push(
              ...imported.filter(
                row =>
                  !existingDates.has(
                    row["Data"]
                  )
              )
            );

          }

        } else {

          foodRows.push(
            ...imported
          );

        }

        saveFood();

        selectedDate =
          importedDates[0] ||
          selectedDate;

        renderAll();

        status(
          `Zaimportowano ${imported.length} rekordów Fitatu.`
        );

      } catch (error) {

        status(
          error.message ||
          "Błąd importu.",
          true
        );

      }

      input.value = "";

    };

}


/* =========================================================
   EVENTY
========================================================= */

function setupEvents() {

  const select =
    $("dateSelect");

  if (select) {

    select.onchange =
      event => {

        selectedDate =
          event.target.value;

        renderAll();

      };

  }

  const copy =
    $("copyBtn");

  if (copy) {
    copy.onclick =
      copyReport;
  }

}


/* =========================================================
   RENDER
========================================================= */

function renderAll() {

  renderDateSelector();

  renderMacro();

  renderMeals();

  renderMicro();

  renderWorkouts();

  renderHistory();

}


/* =========================================================
   START
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    loadAll();

    createWorkoutSection();

    createCalendarSection();

    createCalendarButton();

    setupImport();

    setupEvents();

    renderAll();

    console.log(
      "FuelTrack AI: Fitatu:",
      foodRows.length
    );

    console.log(
      "FuelTrack AI: treningów:",
      workouts.length
    );

    console.log(
      "FuelTrack AI: planów treningowych:",
      trainingPlans.length
    );

  }
);
