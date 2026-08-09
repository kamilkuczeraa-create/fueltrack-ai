/* =========================================================
   FUELTRACK AI v0.6
   ---------------------------------------------------------
   FITATU + TRENINGI + BILANS + BACKUP
========================================================= */

const FOOD_KEY = "fueltrack_food_v06";
const WORKOUT_KEY = "fueltrack_workouts_v06";
const GOALS_KEY = "fueltrack_goals_v06";

const OLD_KEYS = [
  "fueltrack_food_v05",
  "fueltrack_food_v04",
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
let selectedDate = "";


/* =========================================================
   POMOCNICZE
========================================================= */

function $(id) {
  return document.getElementById(id);
}

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

  box._timer = setTimeout(() => {
    box.style.display = "none";
  }, 4000);
}

function safeParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}


/* =========================================================
   STORAGE
========================================================= */

function looksLikeFitatu(array) {
  if (!Array.isArray(array) || !array.length) {
    return false;
  }

  const sample = array[0];

  return (
    sample &&
    typeof sample === "object" &&
    (
      "Data" in sample ||
      "data" in sample
    )
  );
}

function normaliseRows(rows) {
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows
    .filter(row =>
      row &&
      typeof row === "object"
    )
    .map(row => {

      const copy = { ...row };

      if (!copy["Data"] && copy.data) {
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
  try {
    localStorage.setItem(
      FOOD_KEY,
      JSON.stringify(foodRows)
    );
  } catch (error) {
    status(
      "Nie udało się zapisać bazy Fitatu. Pamięć telefonu może być pełna.",
      true
    );
  }
}

function saveWorkouts() {
  try {
    localStorage.setItem(
      WORKOUT_KEY,
      JSON.stringify(workouts)
    );
  } catch {
    status(
      "Nie udało się zapisać treningu.",
      true
    );
  }
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

function loadAll() {

  let savedFood =
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

}


/* =========================================================
   CSV
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
      .map(row =>
        row["Data"]
      )
      .filter(Boolean),

    ...workouts
      .map(workout =>
        workout.date
      )
      .filter(Boolean)
  ];

  return [
    ...new Set(dates)
  ].sort().reverse();
}


/* =========================================================
   JEDZENIE / BILANS
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

function workoutCaloriesForDate(date) {

  return workouts
    .filter(
      workout =>
        workout.date === date
    )
    .reduce(
      (sum, workout) =>
        sum +
        num(workout.calories),
      0
    );
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
      `<p>
        Brak posiłków dla tego dnia.
      </p>`;

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

          ${products.map(
            product => {

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

            }
          ).join("")}

        </div>

      `
      ).join("");

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
   TRENINGI
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
        + Dodaj
      </button>

    </div>

    <div id="workoutSummary"></div>

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

      <h3 id="workoutFormTitle">
        Nowy trening
      </h3>

      <input
        id="wType"
        placeholder="Rodzaj, np. Easy Run / Interwały"
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
        placeholder="Tempo, np. 5:18/km"
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

      <textarea
        id="wNote"
        placeholder="Odczucia / notatka"
        rows="3"
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
          Zapisz
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

let editingWorkoutId = null;

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

      editingWorkoutId = null;

      $("workoutFormTitle")
        .textContent =
        "Nowy trening";

      clearWorkoutForm();

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

      editingWorkoutId = null;

      $("workoutForm")
        .style.display =
        "none";

      clearWorkoutForm();

    };
  }

  if (save) {
    save.onclick =
      saveWorkout;
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

    if ($(id)) {
      $(id).value = "";
    }

  });
}

function saveWorkout() {

  if (!selectedDate) {

    status(
      "Nie wybrano dnia.",
      true
    );

    return;
  }

  const data = {

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
    !data.type &&
    !data.distance &&
    !data.time
  ) {

    status(
      "Wpisz przynajmniej rodzaj, dystans albo czas.",
      true
    );

    return;
  }

  if (editingWorkoutId) {

    const index =
      workouts.findIndex(
        workout =>
          String(workout.id) ===
          String(editingWorkoutId)
      );

    if (index !== -1) {

      workouts[index] = {
        ...workouts[index],
        ...data
      };

    }

    status(
      "Trening został zaktualizowany."
    );

  } else {

    workouts.push({
      id:
        Date.now().toString(),
      ...data
    });

    status(
      "Trening zapisany."
    );
  }

  saveWorkouts();

  editingWorkoutId = null;

  clearWorkoutForm();

  $("workoutForm")
    .style.display =
    "none";

  renderAll();
}

function editWorkout(id) {

  const workout =
    workouts.find(
      item =>
        String(item.id) ===
        String(id)
    );

  if (!workout) return;

  editingWorkoutId =
    workout.id;

  $("workoutFormTitle")
    .textContent =
    "Edytuj trening";

  $("wType").value =
    workout.type || "";

  $("wDistance").value =
    workout.distance || "";

  $("wTime").value =
    workout.time || "";

  $("wPace").value =
    workout.pace || "";

  $("wHr").value =
    workout.hr || "";

  $("wMaxHr").value =
    workout.maxHr || "";

  $("wCalories").value =
    workout.calories || "";

  $("wCadence").value =
    workout.cadence || "";

  $("wElevation").value =
    workout.elevation || "";

  $("wNote").value =
    workout.note || "";

  $("workoutForm")
    .style.display =
    "block";

  $("workoutForm")
    .scrollIntoView({
      behavior:"smooth",
      block:"center"
    });
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

  const workoutCalories =
    list.reduce(
      (sum, workout) =>
        sum +
        num(workout.calories),
      0
    );

  const distance =
    list.reduce(
      (sum, workout) =>
        sum +
        num(workout.distance),
      0
    );

  const summary =
    $("workoutSummary");

  if (summary) {

    summary.innerHTML =
      list.length
        ? `
          <div
            style="
              display:grid;
              grid-template-columns:
                repeat(2,minmax(0,1fr));
              gap:10px;
              margin-bottom:18px;
            "
          >

            <div
              style="
                background:#f5f6fa;
                padding:14px;
                border-radius:16px;
              "
            >
              <small>Treningi</small>
              <br>
              <strong>
                ${list.length}
              </strong>
            </div>

            <div
              style="
                background:#f5f6fa;
                padding:14px;
                border-radius:16px;
              "
            >
                <small>Dystans</small>
                <br>
                <strong>
                  ${fmt(distance)} km
                </strong>
            </div>

            <div
              style="
                background:#f5f6fa;
                padding:14px;
                border-radius:16px;
              "
            >
                <small>Spalone</small>
                <br>
                <strong>
                  ${fmt(workoutCalories)} kcal
                </strong>
            </div>

          </div>
        `
        : "";
  }

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
            🏃
            ${esc(
              workout.type ||
              "Trening"
            )}
          </div>

          <div
            style="
              display:grid;
              grid-template-columns:
                1fr 1fr;
              gap:10px;
            "
          >

            ${
              workout.distance
                ? `
                  <div>
                    <small>Dystans</small>
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
                    <small>Czas</small>
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
                    <small>Tempo</small>
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
                    <small>Śr. HR</small>
                    <br>
                    <b>
                      ${fmt(
                        workout.hr
                      )}
                    </b>
                  </div>
                `
                : ""
            }

            ${
              workout.maxHr
                ? `
                  <div>
                    <small>Max HR</small>
                    <br>
                    <b>
                      ${fmt(
                        workout.maxHr
                      )}
                    </b>
                  </div>
                `
                : ""
            }

            ${
              workout.calories
                ? `
                  <div>
                    <small>Kalorie</small>
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
                    <small>Kadencja</small>
                    <br>
                    <b>
                      ${fmt(
                        workout.cadence
                      )}
                    </b>
                  </div>
                `
                : ""
            }

            ${
              workout.elevation
                ? `
                  <div>
                    <small>Przewyższenie</small>
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

          </div>

          ${
            workout.note
              ? `
                <div
                  style="
                    margin-top:12px;
                    padding-top:12px;
                    border-top:
                      1px solid #ddd;
                  "
                >
                  📝
                  ${esc(
                    workout.note
                  )}
                </div>
              `
              : ""
          }

          <div
            style="
              display:flex;
              gap:8px;
              margin-top:14px;
            "
          >

            <button
              data-edit-workout="${esc(
                workout.id
              )}"
              style="
                flex:1;
                border:0;
                border-radius:10px;
                padding:10px;
                background:#e8eefc;
                color:#2463eb;
                font-weight:700;
              "
            >
              Edytuj
            </button>

            <button
              data-delete-workout="${esc(
                workout.id
              )}"
              style="
                flex:1;
                border:0;
                border-radius:10px;
                padding:10px;
                background:#fee4e2;
                color:#b42318;
                font-weight:700;
              "
            >
              Usuń
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

        workouts =
          workouts.filter(
            workout =>
              String(
                workout.id
              ) !==
              String(
                button.dataset
                  .deleteWorkout
              )
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
   BILANS DNIA
========================================================= */

function createDailyBalance() {

  if ($("dailyBalance")) {
    return;
  }

  const section =
    document.createElement(
      "section"
    );

  section.id =
    "dailyBalance";

  section.style.cssText = `
    background:white;
    border-radius:28px;
    padding:24px;
    margin:22px 0;
    box-shadow:
      0 4px 20px rgba(0,0,0,.06);
  `;

  section.innerHTML = `
    <h2 style="margin-top:0">
      ⚖️ Bilans dnia
    </h2>

    <div id="dailyBalanceContent"></div>
  `;

  const meals =
    $("meals");

  if (
    meals &&
    meals.parentElement
  ) {

    meals.parentElement
      .after(section);

  } else {

    document.body.appendChild(
      section
    );

  }
}

function renderDailyBalance() {

  const box =
    $("dailyBalanceContent");

  if (!box) return;

  if (!selectedDate) {

    box.innerHTML =
      `<p>Brak wybranego dnia.</p>`;

    return;
  }

  const totals =
    totalsForDate(
      selectedDate
    ).totals;

  const workout =
    workoutCaloriesForDate(
      selectedDate
    );

  const net =
    totals.kcal -
    workout;

  const goals =
    loadGoals();

  const kcalPercent =
    Math.min(
      100,
      goals.kcal > 0
        ? (
            totals.kcal /
            goals.kcal
          ) * 100
        : 0
    );

  const proteinPercent =
    Math.min(
      100,
      goals.protein > 0
        ? (
            totals.protein /
            goals.protein
          ) * 100
        : 0
    );

  const carbsPercent =
    Math.min(
      100,
      goals.carbs > 0
        ? (
            totals.carbs /
            goals.carbs
          ) * 100
        : 0
    );

  const fatPercent =
    Math.min(
      100,
      goals.fat > 0
        ? (
            totals.fat /
            goals.fat
          ) * 100
        : 0
    );

  function progress(
    label,
    value,
    goal,
    percent,
    unit
  ) {

    return `
      <div style="margin-bottom:18px">

        <div
          style="
            display:flex;
            justify-content:space-between;
            margin-bottom:7px;
            font-weight:700;
          "
        >

          <span>
            ${label}
          </span>

          <span>
            ${fmt(value)}
            / ${fmt(goal)}
            ${unit}
          </span>

        </div>

        <div
          style="
            width:100%;
            height:14px;
            background:#e9edf2;
            border-radius:999px;
            overflow:hidden;
          "
        >

          <div
            style="
              width:${percent}%;
              height:100%;
              background:linear-gradient(
                90deg,
                #2463eb,
                #55a6ff
              );
              border-radius:999px;
              transition:width .3s ease;
            "
          ></div>

        </div>

      </div>
    `;
  }

  box.innerHTML = `

    ${progress(
      "🔥 Kalorie",
      totals.kcal,
      goals.kcal,
      kcalPercent,
      "kcal"
    )}

    ${progress(
      "🥩 Białko",
      totals.protein,
      goals.protein,
      proteinPercent,
      "g"
    )}

    ${progress(
      "🍚 Węglowodany",
      totals.carbs,
      goals.carbs,
      carbsPercent,
      "g"
    )}

    ${progress(
      "🥑 Tłuszcz",
      totals.fat,
      goals.fat,
      fatPercent,
      "g"
    )}

    <div
      style="
        display:grid;
        grid-template-columns:
          repeat(2,minmax(0,1fr));
        gap:10px;
        margin-top:22px;
      "
    >

      <div
        style="
          background:#f5f6fa;
          padding:15px;
          border-radius:16px;
        "
      >
        <small>Zjedzone</small>
        <br>
        <strong>
          ${fmt(totals.kcal)} kcal
        </strong>
      </div>

      <div
        style="
          background:#f5f6fa;
          padding:15px;
          border-radius:16px;
        "
      >
        <small>Trening</small>
        <br>
        <strong>
          - ${fmt(workout)} kcal
        </strong>
      </div>

      <div
        style="
          background:#f5f6fa;
          padding:15px;
          border-radius:16px;
        "
      >
        <small>Bilans po treningu</small>
        <br>
        <strong>
          ${fmt(net)} kcal
        </strong>
      </div>

    </div>

  `;
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

      return `
        <div
          style="
            display:flex;
            justify-content:space-between;
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
              padding:0;
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
                ? `
                  · 🏃
                  ${workoutCount}
                `
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
   RAPORT TEKSTOWY
========================================================= */

function createReport(date) {

  const result =
    totalsForDate(date);

  const rows =
    result.rows;

  const totals =
    result.totals;

  const workoutRows =
    workouts.filter(
      workout =>
        workout.date === date
    );

  const workoutCalories =
    workoutRows.reduce(
      (sum, workout) =>
        sum +
        num(workout.calories),
      0
    );

  const net =
    totals.kcal -
    workoutCalories;

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
              ] ||
              "Produkt"
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
    `Kalorie: ${fmt(
      totals.kcal
    )} kcal\n` +
    `Białko: ${fmt(
      totals.protein
    )} g\n` +
    `Węglowodany: ${fmt(
      totals.carbs
    )} g\n` +
    `Tłuszcz: ${fmt(
      totals.fat
    )} g\n`;

  text +=
    `Kalorie z treningów: -${fmt(
      workoutCalories
    )} kcal\n`;

  text +=
    `Bilans po treningu: ${fmt(
      net
    )} kcal\n\n`;

  text +=
    `TRENINGI\n`;

  if (!workoutRows.length) {

    text +=
      `Brak zapisanych treningów.\n`;

  } else {

    workoutRows.forEach(
      workout => {

        text +=
          `• ${
            workout.type ||
            "Trening"
          }`;

        if (workout.distance) {
          text +=
            ` | ${fmt(
              workout.distance
            )} km`;
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
            ` | HR ${fmt(
              workout.hr
            )}`;
        }

        if (workout.maxHr) {
          text +=
            ` | Max HR ${fmt(
              workout.maxHr
            )}`;
        }

        if (workout.cadence) {
          text +=
            ` | Kadencja ${fmt(
              workout.cadence
            )}`;
        }

        if (workout.calories) {
          text +=
            ` | ${fmt(
              workout.calories
            )} kcal`;
        }

        if (workout.note) {
          text +=
            ` | ${workout.note}`;
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
          `${label}: ${fmt(
            total
          )} ${unit}\n`;

      }

    }
  );

  return text;
}


/* =========================================================
   KOPIOWANIE
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
            "Nie znaleziono kolumny Data."
          );
        }

        const importedDates =
          [
            ...new Set(
              imported
                .map(row =>
                  row["Data"]
                )
                .filter(Boolean)
            )
          ];

        const existingDates =
          new Set(
            foodRows
              .map(row =>
                row["Data"]
              )
              .filter(Boolean)
          );

        const conflicts =
          importedDates.filter(
            date =>
              existingDates.has(date)
          );

        if (conflicts.length) {

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
              new Set(conflicts);

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
   BACKUP
========================================================= */

function createBackupSection() {

  if ($("backupSection")) {
    return;
  }

  const section =
    document.createElement(
      "section"
    );

  section.id =
    "backupSection";

  section.style.cssText = `
    background:white;
    border-radius:28px;
    padding:24px;
    margin:22px 0;
    box-shadow:
      0 4px 20px rgba(0,0,0,.06);
  `;

  section.innerHTML = `

    <details>

      <summary
        style="
          cursor:pointer;
          font-size:18px;
          font-weight:800;
        "
      >
        💾 Kopia zapasowa
      </summary>

      <div
        style="
          margin-top:18px;
        "
      >

        <p
          style="
            color:#666;
            line-height:1.5;
          "
        >
          Zapisz całą bazę FuelTrack AI
          jako plik. Dzięki temu nawet
          po problemie z przeglądarką
          możesz ją później odtworzyć.
        </p>

        <div
          style="
            display:flex;
            flex-direction:column;
            gap:10px;
          "
        >

          <button
            id="exportBackupBtn"
            style="
              border:0;
              border-radius:14px;
              padding:14px;
              background:#2463eb;
              color:white;
              font-weight:700;
            "
          >
            ⬇️ Zapisz kopię bazy
          </button>

          <button
            id="importBackupBtn"
            style="
              border:0;
              border-radius:14px;
              padding:14px;
              background:#eee;
              font-weight:700;
            "
          >
            ♻️ Odtwórz bazę z kopii
          </button>

          <input
            id="backupFileInput"
            type="file"
            accept=".json,application/json"
            style="display:none"
          >

        </div>

      </div>

    </details>

  `;

  document.body.appendChild(
    section
  );

  $("exportBackupBtn").onclick =
    exportBackup;

  $("importBackupBtn").onclick =
    () => {

      $("backupFileInput").click();

    };

  $("backupFileInput").onchange =
    importBackup;
}

function exportBackup() {

  const backup = {

    app:
      "FuelTrack AI",

    version:
      "0.6",

    createdAt:
      new Date().toISOString(),

    foodRows,

    workouts,

    goals:
      loadGoals()

  };

  const blob =
    new Blob(
      [
        JSON.stringify(
          backup,
          null,
          2
        )
      ],
      {
        type:
          "application/json"
      }
    );

  const url =
    URL.createObjectURL(
      blob
    );

  const link =
    document.createElement(
      "a"
    );

  link.href = url;

  link.download =
    `fueltrack-backup-${
      new Date()
        .toISOString()
        .slice(0,10)
    }.json`;

  document.body.appendChild(
    link
  );

  link.click();

  link.remove();

  URL.revokeObjectURL(
    url
  );

  status(
    "Kopia bazy została przygotowana."
  );
}

async function importBackup(event) {

  const file =
    event.target.files[0];

  if (!file) return;

  try {

    const text =
      await file.text();

    const backup =
      JSON.parse(text);

    if (
      backup.app !==
      "FuelTrack AI"
    ) {

      throw new Error(
        "To nie jest poprawna kopia FuelTrack AI."
      );
    }

    if (
      !Array.isArray(
        backup.foodRows
      ) ||
      !Array.isArray(
        backup.workouts
      )
    ) {

      throw new Error(
        "Kopia jest uszkodzona."
      );
    }

    const confirmRestore =
      confirm(
        `Odtworzyć bazę?\n\n` +
        `Jedzenie: ${
          backup.foodRows.length
        } rekordów\n` +
        `Treningi: ${
          backup.workouts.length
        }\n\n` +
        `Obecne dane zostaną zastąpione.`
      );

    if (!confirmRestore) {
      return;
    }

    foodRows =
      normaliseRows(
        backup.foodRows
      );

    workouts =
      backup.workouts;

    saveFood();

    saveWorkouts();

    if (backup.goals) {

      localStorage.setItem(
        GOALS_KEY,
        JSON.stringify(
          backup.goals
        )
      );

    }

    selectedDate = "";

    renderAll();

    status(
      "Baza została odtworzona."
    );

  } catch (error) {

    status(
      error.message ||
      "Nie udało się odtworzyć kopii.",
      true
    );

  }

  event.target.value = "";
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

  renderDailyBalance();

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

    createDailyBalance();

    createBackupSection();

    setupImport();

    setupEvents();

    renderAll();

    console.log(
      "FuelTrack AI:",
      "Fitatu:",
      foodRows.length,
      "Treningi:",
      workouts.length
    );

  }
);
