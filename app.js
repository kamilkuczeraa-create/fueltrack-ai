/* =========================================================
   FUELTRACK AI v0.6
   TRENINGI — ROZBUDOWANA WERSJA

   Zachowane:
   - Fitatu CSV
   - trwały zapis danych
   - odzyskiwanie starej bazy
   - bilans dnia
   - posiłki
   - makro / mikro
   - historia
   - raport dnia

   Nowe:
   - pełny formularz treningu
   - typ treningu
   - automatyczne tempo
   - edycja treningu
   - usuwanie treningu
   - RPE
   - raport treningu
   - kopiowanie treningu
========================================================= */


/* =========================================================
   STORAGE
========================================================= */

const FOOD_KEY = "fueltrack_food_v04";
const WORKOUT_KEY = "fueltrack_workouts_v06";
const GOALS_KEY = "fueltrack_goals_v04";

const OLD_WORKOUT_KEYS = [
  "fueltrack_workouts_v05",
  "fueltrack_workouts_v04",
  "fueltrack_workouts_v03",
  "fueltrack_workouts_v02",
  "fueltrack_workouts"
];

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


/* =========================================================
   MIKRO
========================================================= */

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


/* =========================================================
   ZMIENNE
========================================================= */

let foodRows = [];
let workouts = [];
let selectedDate = "";
let editingWorkoutId = null;


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

  box._timer = setTimeout(
    () => {
      box.style.display = "none";
    },
    4000
  );

}


/* =========================================================
   STORAGE
========================================================= */

function safeParse(value) {

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }

}


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


function loadGoals() {

  const saved =
    safeParse(
      localStorage.getItem(
        GOALS_KEY
      )
    );

  return {
    ...DEFAULT_GOALS,
    ...(saved || {})
  };

}


function loadWorkouts() {

  let saved =
    safeParse(
      localStorage.getItem(
        WORKOUT_KEY
      )
    );

  if (Array.isArray(saved)) {
    return saved;
  }


  for (
    const key of OLD_WORKOUT_KEYS
  ) {

    const old =
      safeParse(
        localStorage.getItem(key)
      );

    if (Array.isArray(old)) {

      return old;

    }

  }

  return [];

}


function loadAll() {

  const savedFood =
    safeParse(
      localStorage.getItem(
        FOOD_KEY
      )
    );

  if (
    looksLikeFitatu(savedFood)
  ) {

    foodRows =
      normaliseRows(
        savedFood
      );

  } else {

    foodRows =
      recoverOldFoodData();

    if (foodRows.length) {
      saveFood();
    }

  }


  workouts =
    loadWorkouts();

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

    const char =
      text[i];

    const next =
      text[i + 1];


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
    .filter(
      object =>
        Object.values(object)
          .some(
            value =>
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
      .map(row => row["Data"])
      .filter(Boolean),

    ...workouts
      .map(
        workout =>
          workout.date
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
        row[
          "kalorie (kcal)"
        ]
      );

    totals.protein +=
      num(
        row[
          "Białka (g)"
        ]
      );

    totals.carbs +=
      num(
        row[
          "Węglowodany (g)"
        ]
      );

    totals.fat +=
      num(
        row[
          "Tłuszcze (g)"
        ]
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
    !dates.includes(
      selectedDate
    )
  ) {

    selectedDate =
      dates[0];

  }


  select.innerHTML =
    dates
      .map(
        date =>
          `<option value="${esc(date)}">
            ${esc(date)}
          </option>`
      )
      .join("");


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
        ([meal, products]) =>
          `

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
                      border-bottom:
                        1px solid #eee;
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

        `
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
                justify-content:
                  space-between;
                padding:7px 0;
                border-bottom:
                  1px solid #eee;
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
   TRENINGI — POMOCNICZE
========================================================= */

function calculatePace(distance, time) {

  distance =
    num(distance);

  if (
    !distance ||
    !time
  ) {
    return "";
  }


  const parts =
    String(time)
      .trim()
      .split(":")
      .map(Number);


  let seconds = 0;


  if (parts.length === 2) {

    seconds =
      parts[0] * 60 +
      parts[1];

  } else if (
    parts.length === 3
  ) {

    seconds =
      parts[0] * 3600 +
      parts[1] * 60 +
      parts[2];

  } else {

    return "";

  }


  if (!seconds) {
    return "";
  }


  const pace =
    seconds /
    distance;


  const minutes =
    Math.floor(
      pace / 60
    );


  const secs =
    Math.round(
      pace % 60
    );


  const fixedSeconds =
    secs
      .toString()
      .padStart(2, "0");


  return `${minutes}:${fixedSeconds}/km`;

}


function workoutTypeLabel(type) {

  const labels = {

    easy:
      "Easy Run",

    intervals:
      "Interwały",

    hills:
      "Podbiegi",

    tempo:
      "Tempo",

    long:
      "Long Run",

    race:
      "Zawody",

    recovery:
      "Regeneracyjny",

    other:
      "Inny"

  };


  return (
    labels[type] ||
    type ||
    "Trening"
  );

}


/* =========================================================
   TRENINGI — UI
========================================================= */

function createWorkoutSection() {

  if ($("workoutSection")) {
    return;
  }


  const section =
    document.createElement(
      "section"
    );


  section.id =
    "workoutSection";


  section.style.cssText = `
    background:white;
    border-radius:28px;
    padding:24px;
    margin:22px 0;
    box-shadow:
      0 4px 20px rgba(0,0,0,.06);
  `;


  section.innerHTML = `

    <div
      style="
        display:flex;
        justify-content:
          space-between;
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

      <h3
        id="workoutFormTitle"
      >
        Nowy trening
      </h3>


      <label>
        Rodzaj treningu
      </label>

      <select
        id="wType"
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

        <option value="easy">
          Easy Run
        </option>

        <option value="intervals">
          Interwały
        </option>

        <option value="hills">
          Podbiegi
        </option>

        <option value="tempo">
          Tempo
        </option>

        <option value="long">
          Long Run
        </option>

        <option value="race">
          Zawody
        </option>

        <option value="recovery">
          Regeneracyjny
        </option>

        <option value="other">
          Inny
        </option>

      </select>


      <input
        id="wDistance"
        type="number"
        step="0.01"
        placeholder="Dystans km"
        style="
          width:100%;
          box-sizing:border-box;
          padding:13px;
          margin:5px 0;
          border-radius:12px;
          border:1px solid #ddd
        "
      >


      <input
        id="wTime"
        placeholder="Czas, np. 52:34"
        style="
          width:100%;
          box-sizing:border-box;
          padding:13px;
          margin:5px 0;
          border-radius:12px;
          border:1px solid #ddd
        "
      >


      <input
        id="wPace"
        placeholder="Tempo — zostaw puste, aby wyliczyć automatycznie"
        style="
          width:100%;
          box-sizing:border-box;
          padding:13px;
          margin:5px 0;
          border-radius:12px;
          border:1px solid #ddd
        "
      >


      <input
        id="wHr"
        type="number"
        placeholder="Średnie tętno"
        style="
          width:100%;
          box-sizing:border-box;
          padding:13px;
          margin:5px 0;
          border-radius:12px;
          border:1px solid #ddd
        "
      >


      <input
        id="wMaxHr"
        type="number"
        placeholder="Maksymalne tętno"
        style="
          width:100%;
          box-sizing:border-box;
          padding:13px;
          margin:5px 0;
          border-radius:12px;
          border:1px solid #ddd
        "
      >


      <input
        id="wCalories"
        type="number"
        placeholder="Kalorie treningu"
        style="
          width:100%;
          box-sizing:border-box;
          padding:13px;
          margin:5px 0;
          border-radius:12px;
          border:1px solid #ddd
        "
      >


      <input
        id="wCadence"
        type="number"
        placeholder="Kadencja"
        style="
          width:100%;
          box-sizing:border-box;
          padding:13px;
          margin:5px 0;
          border-radius:12px;
          border:1px solid #ddd
        "
      >


      <input
        id="wElevation"
        type="number"
        placeholder="Przewyższenie m"
        style="
          width:100%;
          box-sizing:border-box;
          padding:13px;
          margin:5px 0;
          border-radius:12px;
          border:1px solid #ddd
        "
      >


      <label
        style="
          display:block;
          margin-top:8px;
          font-weight:600;
        "
      >
        RPE / odczuwalna trudność
      </label>


      <input
        id="wRpe"
        type="range"
        min="1"
        max="10"
        value="5"
        style="
          width:100%;
          margin:10px 0;
        "
      >


      <div
        id="wRpeValue"
        style="
          text-align:center;
          font-weight:700;
          margin-bottom:8px;
        "
      >
        RPE 5/10
      </div>


      <textarea
        id="wNote"
        placeholder="Odczucia / notatka"
        rows="4"
        style="
          width:100%;
          box-sizing:border-box;
          padding:13px;
          margin:5px 0;
          border-radius:12px;
          border:1px solid #ddd
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

    document.body.appendChild(
      section
    );

  }


  setupWorkoutEvents();

}


/* =========================================================
   TRENINGI — EVENTY
========================================================= */

function setupWorkoutEvents() {

  const add =
    $("addWorkoutBtn");

  const save =
    $("saveWorkoutBtn");

  const cancel =
    $("cancelWorkoutBtn");

  const rpe =
    $("wRpe");


  if (add) {

    add.onclick = () => {

      if (!selectedDate) {

        status(
          "Najpierw wybierz dzień.",
          true
        );

        return;

      }


      editingWorkoutId =
        null;


      clearWorkoutForm();


      if ($("workoutFormTitle")) {

        $("workoutFormTitle")
          .textContent =
          "Nowy trening";

      }


      if ($("saveWorkoutBtn")) {

        $("saveWorkoutBtn")
          .textContent =
          "Zapisz trening";

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

      editingWorkoutId =
        null;

      $("workoutForm")
        .style.display =
        "none";

    };

  }


  if (save) {

    save.onclick =
      saveWorkout;

  }


  if (rpe) {

    rpe.oninput = () => {

      if ($("wRpeValue")) {

        $("wRpeValue")
          .textContent =
          `RPE ${rpe.value}/10`;

      }

    };

  }


  const distance =
    $("wDistance");

  const time =
    $("wTime");

  const pace =
    $("wPace");


  function autoPace() {

    if (
      !pace.value.trim()
    ) {

      const calculated =
        calculatePace(
          distance.value,
          time.value
        );

      if (calculated) {

        pace.value =
          calculated;

      }

    }

  }


  if (distance) {

    distance.addEventListener(
      "blur",
      autoPace
    );

  }


  if (time) {

    time.addEventListener(
      "blur",
      autoPace
    );

  }

}


function clearWorkoutForm() {

  const fields = [
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
  ];


  fields.forEach(id => {

    if ($(id)) {

      if (
        id === "wType"
      ) {

        $(id).value =
          "easy";

      } else {

        $(id).value =
          "";

      }

    }

  });


  if ($("wRpe")) {

    $("wRpe").value =
      "5";

  }


  if ($("wRpeValue")) {

    $("wRpeValue")
      .textContent =
      "RPE 5/10";

  }

}


/* =========================================================
   ZAPIS / EDYCJA
========================================================= */

function saveWorkout() {

  if (!selectedDate) {

    status(
      "Nie wybrano dnia.",
      true
    );

    return;

  }


  const type =
    $("wType").value;


  const distance =
    num(
      $("wDistance").value
    );


  const time =
    $("wTime").value.trim();


  let pace =
    $("wPace").value.trim();


  if (
    !pace &&
    distance &&
    time
  ) {

    pace =
      calculatePace(
        distance,
        time
      );

  }


  const workout = {

    id:
      editingWorkoutId ||
      Date.now().toString(),

    date:
      selectedDate,

    type,

    typeLabel:
      workoutTypeLabel(type),

    distance,

    time,

    pace,

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

    rpe:
      num(
        $("wRpe").value
      ),

    note:
      $("wNote").value.trim(),

    updatedAt:
      new Date().toISOString()

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


  if (editingWorkoutId) {

    workouts =
      workouts.map(
        existing =>
          String(existing.id) ===
          String(editingWorkoutId)
            ? workout
            : existing
      );


    status(
      "Trening został zaktualizowany."
    );

  } else {

    workouts.push(
      workout
    );


    status(
      "Trening zapisany."
    );

  }


  saveWorkouts();


  editingWorkoutId =
    null;


  $("workoutForm")
    .style.display =
    "none";


  clearWorkoutForm();


  renderAll();

}


/* =========================================================
   EDYCJA TRENINGU
========================================================= */

function editWorkout(id) {

  const workout =
    workouts.find(
      item =>
        String(item.id) ===
        String(id)
    );


  if (!workout) {

    status(
      "Nie znaleziono treningu.",
      true
    );

    return;

  }


  editingWorkoutId =
    workout.id;


  if ($("wType")) {

    $("wType").value =
      workout.type ||
      "other";

  }


  if ($("wDistance")) {

    $("wDistance").value =
      workout.distance ||
      "";

  }


  if ($("wTime")) {

    $("wTime").value =
      workout.time ||
      "";

  }


  if ($("wPace")) {

    $("wPace").value =
      workout.pace ||
      "";

  }


  if ($("wHr")) {

    $("wHr").value =
      workout.hr ||
      "";

  }


  if ($("wMaxHr")) {

    $("wMaxHr").value =
      workout.maxHr ||
      "";

  }


  if ($("wCalories")) {

    $("wCalories").value =
      workout.calories ||
      "";

  }


  if ($("wCadence")) {

    $("wCadence").value =
      workout.cadence ||
      "";

  }


  if ($("wElevation")) {

    $("wElevation").value =
      workout.elevation ||
      "";

  }


  if ($("wRpe")) {

    $("wRpe").value =
      workout.rpe ||
      5;

  }


  if ($("wRpeValue")) {

    $("wRpeValue")
      .textContent =
      `RPE ${
        workout.rpe || 5
      }/10`;

  }


  if ($("wNote")) {

    $("wNote").value =
      workout.note ||
      "";

  }


  if ($("workoutFormTitle")) {

    $("workoutFormTitle")
      .textContent =
      "Edytuj trening";

  }


  if ($("saveWorkoutBtn")) {

    $("saveWorkoutBtn")
      .textContent =
      "Zapisz zmiany";

  }


  $("workoutForm")
    .style.display =
    "block";


  $("workoutForm")
    .scrollIntoView({
      behavior:"smooth",
      block:"center"
    });

}


/* =========================================================
   RAPORT TRENINGU
========================================================= */

function createWorkoutReport(
  workout
) {

  let text =
    `FUELTRACK AI\n` +
    `RAPORT TRENINGU\n\n`;


  text +=
    `Data: ${
      workout.date || "-"
    }\n`;


  text +=
    `Rodzaj: ${
      workout.typeLabel ||
      workoutTypeLabel(
        workout.type
      )
    }\n`;


  if (workout.distance) {

    text +=
      `Dystans: ${
        fmt(workout.distance)
      } km\n`;

  }


  if (workout.time) {

    text +=
      `Czas: ${
        workout.time
      }\n`;

  }


  if (workout.pace) {

    text +=
      `Tempo: ${
        workout.pace
      }\n`;

  }


  if (workout.hr) {

    text +=
      `Średnie HR: ${
        fmt(workout.hr)
      }\n`;

  }


  if (workout.maxHr) {

    text +=
      `Maksymalne HR: ${
        fmt(workout.maxHr)
      }\n`;

  }


  if (workout.cadence) {

    text +=
      `Kadencja: ${
        fmt(workout.cadence)
      } spm\n`;

  }


  if (workout.elevation) {

    text +=
      `Przewyższenie: ${
        fmt(workout.elevation)
      } m\n`;

  }


  if (workout.calories) {

    text +=
      `Kalorie: ${
        fmt(workout.calories)
      } kcal\n`;

  }


  if (workout.rpe) {

    text +=
      `RPE: ${
        fmt(workout.rpe)
      }/10\n`;

  }


  if (workout.note) {

    text +=
      `\nODCZUCIA / NOTATKA\n` +
      `${workout.note}\n`;

  }


  return text;

}


async function copyWorkout(
  id
) {

  const workout =
    workouts.find(
      item =>
        String(item.id) ===
        String(id)
    );


  if (!workout) {

    status(
      "Nie znaleziono treningu.",
      true
    );

    return;

  }


  const text =
    createWorkoutReport(
      workout
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
    "Raport treningu skopiowany."
  );

}


/* =========================================================
   WYŚWIETLANIE TRENINGÓW
========================================================= */

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

      const label =
        workout.typeLabel ||
        workoutTypeLabel(
          workout.type
        );


      return `

        <div
          style="
            padding:18px;
            margin-bottom:14px;
            border-radius:20px;
            background:#f5f6fa;
          "
        >

          <div
            style="
              display:flex;
              justify-content:
                space-between;
              align-items:flex-start;
              gap:10px;
              margin-bottom:14px;
            "
          >

            <div>

              <div
                style="
                  font-size:19px;
                  font-weight:800;
                "
              >
                🏃 ${esc(label)}
              </div>

              ${
                workout.date
                  ? `
                    <small
                      style="
                        color:#777;
                      "
                    >
                      ${esc(
                        workout.date
                      )}
                    </small>
                  `
                  : ""
              }

            </div>

          </div>


          <div
            style="
              display:grid;
              grid-template-columns:
                1fr 1fr;
              gap:13px;
            "
          >

            ${
              workout.distance
                ? `
                  <div>
                    <small>
                      Dystans
                    </small>
                    <br>
                    <b>
                      ${fmt(
                        workout.distance
                      )} km
                    </b>
                  </div>
                `
                : ""
            }


            ${
              workout.time
                ? `
                  <div>
                    <small>
                      Czas
                    </small>
                    <br>
                    <b>
                      ${esc(
                        workout.time
                      )}
                    </b>
                  </div>
                `
                : ""
            }


            ${
              workout.pace
                ? `
                  <div>
                    <small>
                      Tempo
                    </small>
                    <br>
                    <b>
                      ${esc(
                        workout.pace
                      )}
                    </b>
                  </div>
                `
                : ""
            }


            ${
              workout.hr
                ? `
                  <div>
                    <small>
                      Śr. HR
                    </small>
                    <br>
                    <b>
                      ${fmt(
                        workout.hr
                      )} bpm
                    </b>
                  </div>
                `
                : ""
            }


            ${
              workout.maxHr
                ? `
                  <div>
                    <small>
                      Max HR
                    </small>
                    <br>
                    <b>
                      ${fmt(
                        workout.maxHr
                      )} bpm
                    </b>
                  </div>
                `
                : ""
            }


            ${
              workout.calories
                ? `
                  <div>
                    <small>
                      Kalorie
                    </small>
                    <br>
                    <b>
                      ${fmt(
                        workout.calories
                      )} kcal
                    </b>
                  </div>
                `
                : ""
            }


            ${
              workout.cadence
                ? `
                  <div>
                    <small>
                      Kadencja
                    </small>
                    <br>
                    <b>
                      ${fmt(
                        workout.cadence
                      )} spm
                    </b>
                  </div>
                `
                : ""
            }


            ${
              workout.elevation
                ? `
                  <div>
                    <small>
                      Przewyższenie
                    </small>
                    <br>
                    <b>
                      ${fmt(
                        workout.elevation
                      )} m
                    </b>
                  </div>
                `
                : ""
            }


            ${
              workout.rpe
                ? `
                  <div>
                    <small>
                      RPE
                    </small>
                    <br>
                    <b>
                      ${fmt(
                        workout.rpe
                      )}/10
                    </b>
                  </div>
                `
                : ""
            }

          </div>


          ${
            workout.note
              ? `

                <div
                  style="
                    margin-top:15px;
                    padding-top:13px;
                    border-top:
                      1px solid #ddd;
                  "
                >

                  <strong>
                    📝 Odczucia
                  </strong>

                  <div
                    style="
                      margin-top:5px;
                    "
                  >
                    ${esc(
                      workout.note
                    )}
                  </div>

                </div>

              `
              : ""
          }


          <div
            style="
              display:flex;
              flex-wrap:wrap;
              gap:8px;
              margin-top:16px;
            "
          >

            <button
              data-edit-workout="${esc(
                workout.id
              )}"
              style="
                border:0;
                border-radius:11px;
                padding:10px 14px;
                background:#e7efff;
                color:#2463eb;
                font-weight:700;
              "
            >
              ✏️ Edytuj
            </button>


            <button
              data-copy-workout="${esc(
                workout.id
              )}"
              style="
                border:0;
                border-radius:11px;
                padding:10px 14px;
                background:#e7f7ef;
                color:#16794b;
                font-weight:700;
              "
            >
              📋 Kopiuj
            </button>


            <button
              data-delete-workout="${esc(
                workout.id
              )}"
              style="
                border:0;
                border-radius:11px;
                padding:10px 14px;
                background:#fee4e2;
                color:#b42318;
                font-weight:700;
              "
            >
              🗑️ Usuń
            </button>

          </div>

        </div>

      `;

    }).join("");


  box
    .querySelectorAll(
      "[data-edit-workout]"
    )
    .forEach(button => {

      button.onclick = () => {

        editWorkout(
          button.dataset
            .editWorkout
        );

      };

    });


  box
    .querySelectorAll(
      "[data-copy-workout]"
    )
    .forEach(button => {

      button.onclick = () => {

        copyWorkout(
          button.dataset
            .copyWorkout
        );

      };

    });


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
              String(
                workout.id
              ) !==
              String(id)
          );


        saveWorkouts();

        renderAll();

        status(
          "Trening usunięty."
        );

      };

    });

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
            workout.date ===
            date
        ).length;


      return `

        <div
          style="
            display:flex;
            justify-content:
              space-between;
            gap:10px;
            align-items:center;
            padding:12px 0;
            border-bottom:
              1px solid #eee;
          "
        >

          <button
            data-history-date="${esc(
              date
            )}"
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
            ${fmt(
              result.totals.kcal
            )}
            kcal

            ${
              workoutCount
                ? ` · 🏃 ${workoutCount}`
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
   RAPORT DNIA
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


        products.forEach(
          product => {

            text +=
              `• ${
                product[
                  "Produkty i potrawy"
                ] ||
                "Produkt"
              }`;


            if (
              product["ilość (g)"]
            ) {

              text +=
                ` — ${
                  product[
                    "ilość (g)"
                  ]
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

          }
        );


        text += "\n";

      }
    );


  text +=
    `PODSUMOWANIE\n` +
    `Kalorie: ${
      fmt(totals.kcal)
    } kcal\n` +
    `Białko: ${
      fmt(totals.protein)
    } g\n` +
    `Węglowodany: ${
      fmt(totals.carbs)
    } g\n` +
    `Tłuszcz: ${
      fmt(totals.fat)
    } g\n\n`;


  text +=
    `TRENINGI\n`;


  const dayWorkouts =
    workouts.filter(
      workout =>
        workout.date ===
        date
    );


  if (!dayWorkouts.length) {

    text +=
      `Brak zapisanych treningów.\n`;

  } else {

    dayWorkouts.forEach(
      workout => {

        text +=
          `• ${
            workout.typeLabel ||
            workoutTypeLabel(
              workout.type
            )
          }`;


        if (workout.distance) {

          text +=
            ` | ${
              fmt(
                workout.distance
              )
            } km`;

        }


        if (workout.time) {

          text +=
            ` | ${
              workout.time
            }`;

        }


        if (workout.pace) {

          text +=
            ` | ${
              workout.pace
            }`;

        }


        if (workout.hr) {

          text +=
            ` | HR ${
              fmt(workout.hr)
            }`;

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
          `${label}: ${
            fmt(total)
          } ${unit}\n`;

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


  if (
    !button ||
    !input
  ) {
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


        if (
          conflicts.length
        ) {

          const replace =
            confirm(
              `Import zawiera ${
                importedDates.length
              } dni.\n\n` +

              `Dni już zapisane: ${
                conflicts.length
              }\n` +

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
          `Zaimportowano ${
            imported.length
          } rekordów Fitatu.`
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
   EVENTY GŁÓWNE
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


    setupImport();


    setupEvents();


    renderAll();


    console.log(
      "FuelTrack AI v0.6"
    );


    console.log(
      "Fitatu rekordów:",
      foodRows.length
    );


    console.log(
      "Treningów:",
      workouts.length
    );

  }
);
