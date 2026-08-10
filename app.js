/* =========================================================
   FUELTRACK AI
   v0.6 — uporządkowana aplikacja
   - Strona główna
   - Żywienie
   - Treningi
   - Fitatu CSV
   - trwałe dane
   - historia
   - makro / mikro
   - kalendarz treningów
   - planer
   - wykonane treningi
   - screeny Garmin
========================================================= */


/* =========================================================
   STORAGE
========================================================= */

const FOOD_KEY = "fueltrack_food_v04";
const WORKOUT_KEY = "fueltrack_workouts_v04";
const PLAN_KEY = "fueltrack_training_plans_v01";
const GOALS_KEY = "fueltrack_goals_v04";

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
calendarDate.setDate(1);


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

function safeParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function todayISO() {
  const d = new Date();

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function status(text, error = false) {
  const box = $("status");

  if (!box) return;

  box.textContent = text;

  box.style.background =
    error
      ? "#b42318"
      : "#16794b";

  box.classList.remove("hidden");

  clearTimeout(box._timer);

  box._timer = setTimeout(() => {
    box.classList.add("hidden");
  }, 3500);
}


/* =========================================================
   STORAGE
========================================================= */

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

      if (
        !copy["Data"] &&
        copy.data
      ) {
        copy["Data"] = copy.data;
      }

      return copy;
    });
}

function looksLikeFitatu(value) {

  if (!Array.isArray(value)) {
    return false;
  }

  if (!value.length) {
    return false;
  }

  const sample = value[0];

  return (
    sample &&
    typeof sample === "object" &&
    (
      "Data" in sample ||
      "data" in sample
    )
  );
}

function recoverFoodData() {

  const current =
    safeParse(
      localStorage.getItem(
        FOOD_KEY
      )
    );

  if (looksLikeFitatu(current)) {
    return normaliseRows(current);
  }

  const oldKeys = [
    "fueltrack_fitatu_v03",
    "fueltrack_fitatu_v02",
    "fueltrack_fitatu",
    "fitatuData",
    "fitatu_data",
    "fueltrack_data",
    "fueltrack_rows"
  ];

  for (const key of oldKeys) {

    const parsed =
      safeParse(
        localStorage.getItem(key)
      );

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

  return [];
}

function loadAll() {

  foodRows =
    recoverFoodData();

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

function savePlans() {
  localStorage.setItem(
    PLAN_KEY,
    JSON.stringify(trainingPlans)
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


/* =========================================================
   NAWIGACJA
========================================================= */

function showPage(page) {

  $("homePage").classList.add("hidden");
  $("nutritionPage").classList.add("hidden");
  $("trainingPage").classList.add("hidden");

  if (page === "home") {
    $("homePage").classList.remove("hidden");
    renderHome();
  }

  if (page === "nutrition") {
    $("nutritionPage").classList.remove("hidden");
    renderNutrition();
  }

  if (page === "training") {
    $("trainingPage").classList.remove("hidden");
    renderTrainingPage();
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


/* =========================================================
   DATY ŻYWIENIA / TRENINGÓW
========================================================= */

function getFoodDates() {

  return [
    ...new Set(
      foodRows
        .map(row => row["Data"])
        .filter(Boolean)
    )
  ].sort().reverse();
}

function getAllReportedDates() {

  const dates = [
    ...foodRows
      .map(row => row["Data"])
      .filter(Boolean),

    ...workouts
      .map(w => w.date)
      .filter(Boolean)
  ];

  return [
    ...new Set(dates)
  ].sort().reverse();
}

function latestReportedDate() {

  const dates =
    getAllReportedDates();

  return dates.length
    ? dates[0]
    : "";
}


/* =========================================================
   BILANS DNIA
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
      num(row["kalorie (kcal)"]);

    totals.protein +=
      num(row["Białka (g)"]);

    totals.carbs +=
      num(row["Węglowodany (g)"]);

    totals.fat +=
      num(row["Tłuszcze (g)"]);

  });

  return {
    rows,
    totals
  };
}

function burnedForDate(date) {

  return workouts
    .filter(
      workout =>
        workout.date === date
    )
    .reduce(
      (sum, workout) =>
        sum + num(workout.calories),
      0
    );
}


/* =========================================================
   STRONA GŁÓWNA
========================================================= */

function renderHome() {

  const date =
    latestReportedDate();

  if (!date) {

    $("homeDate").textContent =
      "Brak danych";

    $("homeCalories").textContent =
      "0 kcal";

    $("homeBurned").textContent =
      "0 kcal";

    $("homeProtein").textContent =
      "0 g";

    $("homeCarbs").textContent =
      "0 g";

    $("homeFat").textContent =
      "0 g";

    $("homeBalance").textContent =
      "0 kcal";

    return;
  }

  const result =
    totalsForDate(date);

  const totals =
    result.totals;

  const burned =
    burnedForDate(date);

  const goals =
    loadGoals();

  /*
     Różnica względem celu:
     cel + kalorie treningu - kalorie zjedzone.

     Przykład:
     cel 2200
     jedzenie 2200
     trening 500

     wynik +500 — zostało 500 kcal "zapasu".
  */

  const balance =
    goals.kcal +
    burned -
    totals.kcal;

  $("homeDate").textContent =
    date;

  $("homeCalories").textContent =
    `${fmt(totals.kcal)} kcal`;

  $("homeBurned").textContent =
    `${fmt(burned)} kcal`;

  $("homeProtein").textContent =
    `${fmt(totals.protein)} g`;

  $("homeCarbs").textContent =
    `${fmt(totals.carbs)} g`;

  $("homeFat").textContent =
    `${fmt(totals.fat)} g`;

  $("homeBalance").textContent =
    `${balance >= 0 ? "+" : ""}${fmt(balance)} kcal`;
}


/* =========================================================
   FITATU CSV
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
    .filter(object =>
      Object.values(object)
        .some(
          value =>
            value !== ""
        )
    );
}

function setupImport() {

  const button =
    $("importBtn");

  const input =
    $("fileInput");

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
          !("Data" in imported[0])
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
              `Import zawiera ${importedDates.length} dni.\n\n` +
              `Dni już zapisane: ${conflicts.length}\n` +
              `Nowe dni: ${
                importedDates.length -
                conflicts.length
              }\n\n` +
              `OK — zastąp istniejące dni.\n` +
              `Anuluj — zachowaj istniejące dane.`
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

        renderNutrition();
        renderHome();

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
   ŻYWIENIE
========================================================= */

function renderNutrition() {

  const dates =
    getFoodDates();

  if (!dates.length) {

    selectedDate = "";

    $("dateSelect").innerHTML =
      `<option value="">Brak danych</option>`;

    $("selectedDateLabel").textContent =
      "Brak danych";

    $("dayCount").textContent =
      "0 dni";

  } else {

    if (
      !selectedDate ||
      !dates.includes(selectedDate)
    ) {
      selectedDate =
        dates[0];
    }

    $("dateSelect").innerHTML =
      dates.map(date =>
        `<option value="${esc(date)}">${esc(date)}</option>`
      ).join("");

    $("dateSelect").value =
      selectedDate;

    $("selectedDateLabel").textContent =
      selectedDate;

    $("dayCount").textContent =
      `${dates.length} ${
        dates.length === 1
          ? "dzień"
          : "dni"
      }`;
  }

  renderNutritionBalance();
  renderMeals();
  renderMacroDetails();
  renderMicros();
  renderHistory();
}

function renderNutritionBalance() {

  const result =
    totalsForDate(selectedDate);

  const totals =
    result.totals;

  const goals =
    loadGoals();

  $("kcal").textContent =
    `${fmt(totals.kcal)} kcal`;

  $("protein").textContent =
    `${fmt(totals.protein)} g`;

  $("carbs").textContent =
    `${fmt(totals.carbs)} g`;

  $("fat").textContent =
    `${fmt(totals.fat)} g`;

  setProgress(
    "kcalBar",
    totals.kcal,
    goals.kcal
  );

  setProgress(
    "proteinBar",
    totals.protein,
    goals.protein
  );

  setProgress(
    "carbsBar",
    totals.carbs,
    goals.carbs
  );

  setProgress(
    "fatBar",
    totals.fat,
    goals.fat
  );
}

function setProgress(
  id,
  value,
  goal
) {

  const bar =
    $(id);

  if (!bar) return;

  if (!goal) {
    bar.style.width = "0%";
    return;
  }

  const percentage =
    Math.min(
      100,
      Math.max(
        0,
        value / goal * 100
      )
    );

  bar.style.width =
    `${percentage}%`;
}


/* =========================================================
   POSIŁKI
========================================================= */

function renderMeals() {

  const box =
    $("meals");

  if (!selectedDate) {

    box.innerHTML =
      `<div class="empty">Brak danych.</div>`;

    return;
  }

  const rows =
    foodRows.filter(
      row =>
        row["Data"] === selectedDate
    );

  if (!rows.length) {

    box.innerHTML =
      `<div class="empty">Brak posiłków dla tego dnia.</div>`;

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
              <h3>${esc(meal)}</h3>

              ${products.map(product => {

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
                  <div class="product">

                    <div class="product-name">
                      ${esc(name)}
                    </div>

                    <div class="product-info">
                      ${fmt(kcal)} kcal
                      · B ${fmt(protein)} g
                      · W ${fmt(carbs)} g
                      · T ${fmt(fat)} g
                    </div>

                  </div>
                `;

              }).join("")}

            </div>
          `;
        }
      )
      .join("");
}


/* =========================================================
   SZCZEGÓŁOWE MAKRO
========================================================= */

function renderMacroDetails() {

  const box =
    $("macroDetails");

  if (!selectedDate) {

    box.innerHTML =
      `<div class="empty">Brak danych.</div>`;

    return;
  }

  const result =
    totalsForDate(selectedDate);

  const totals =
    result.totals;

  const goals =
    loadGoals();

  const data = [
    [
      "Kalorie",
      fmt(totals.kcal),
      fmt(goals.kcal),
      "kcal"
    ],
    [
      "Białko",
      fmt(totals.protein),
      fmt(goals.protein),
      "g"
    ],
    [
      "Węglowodany",
      fmt(totals.carbs),
      fmt(goals.carbs),
      "g"
    ],
    [
      "Tłuszcz",
      fmt(totals.fat),
      fmt(goals.fat),
      "g"
    ]
  ];

  box.innerHTML =
    data.map(
      item => `
        <div class="micro-row">
          <span>${esc(item[0])}</span>
          <strong>
            ${item[1]} ${item[3]}
            /
            ${item[2]} ${item[3]}
          </strong>
        </div>
      `
    ).join("");
}


/* =========================================================
   MIKRO
========================================================= */

function renderMicros() {

  const box =
    $("micros");

  if (!selectedDate) {

    box.innerHTML =
      `<div class="empty">Brak danych.</div>`;

    return;
  }

  const rows =
    foodRows.filter(
      row =>
        row["Data"] === selectedDate
    );

  if (!rows.length) {

    box.innerHTML =
      `<div class="empty">Brak danych.</div>`;

    return;
  }

  const output = [];

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

        output.push(`
          <div class="micro-row">
            <span>${esc(label)}</span>
            <strong>
              ${fmt(total)} ${unit}
            </strong>
          </div>
        `);

      }
    }
  );

  box.innerHTML =
    output.length
      ? output.join("")
      : `<div class="empty">Brak danych o mikroelementach.</div>`;
}


/* =========================================================
   HISTORIA
========================================================= */

function renderHistory() {

  const box =
    $("history");

  const dates =
    getFoodDates();

  if (!dates.length) {

    box.innerHTML =
      `<div class="empty">Brak zapisanych dni.</div>`;

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

      const burned =
        burnedForDate(date);

      return `
        <div class="history-row">

          <button
            class="history-date"
            data-history-date="${esc(date)}"
          >
            ${esc(date)}
          </button>

          <span>
            ${fmt(result.totals.kcal)} kcal
            ${
              burned
                ? ` · 🏃 ${fmt(burned)} kcal`
                : ""
            }
            ${
              workoutCount
                ? ` · ${workoutCount} trening`
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
          button.dataset.historyDate;

        renderNutrition();

        window.scrollTo({
          top: 0,
          behavior: "smooth"
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

  return text;
}

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
   ZWIJANIE SEKCJI
========================================================= */

function setupCollapsibles() {

  document
    .querySelectorAll(
      ".collapse-header"
    )
    .forEach(button => {

      button.onclick = () => {

        const target =
          $(button.dataset.target);

        if (!target) return;

        const open =
          target.classList.toggle(
            "open"
          );

        const arrow =
          button.querySelector(
            ".collapse-arrow"
          );

        if (arrow) {

          arrow.style.transform =
            open
              ? "rotate(180deg)"
              : "rotate(0deg)";
        }
      };
    });
}


/* =========================================================
   TRENINGI — FORMULARZ
========================================================= */

function setupWorkoutForm() {

  $("addWorkoutBtn").onclick =
    () => {

      $("workoutForm")
        .classList.remove(
          "hidden"
        );

      if (!$("wDate").value) {
        $("wDate").value =
          selectedDate ||
          todayISO();
      }

      $("workoutForm")
        .scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
    };

  $("cancelWorkoutBtn").onclick =
    () => {

      $("workoutForm")
        .classList.add(
          "hidden"
        );
    };

  $("wScreens").onchange =
    previewScreens;

  $("saveWorkoutBtn").onclick =
    saveWorkout;
}

function previewScreens() {

  const input =
    $("wScreens");

  const preview =
    $("screensPreview");

  preview.innerHTML = "";

  const files =
    Array.from(
      input.files || []
    ).slice(0, 4);

  if (input.files.length > 4) {

    status(
      "Możesz dodać maksymalnie 4 screeny.",
      true
    );
  }

  files.forEach(file => {

    const reader =
      new FileReader();

    reader.onload =
      event => {

        const img =
          document.createElement(
            "img"
          );

        img.src =
          event.target.result;

        preview.appendChild(
          img
        );
      };

    reader.readAsDataURL(file);
  });
}

async function readScreens() {

  const files =
    Array.from(
      $("wScreens").files || []
    ).slice(0, 4);

  const result = [];

  for (const file of files) {

    const data =
      await new Promise(resolve => {

        const reader =
          new FileReader();

        reader.onload =
          () =>
            resolve(
              reader.result
            );

        reader.onerror =
          () =>
            resolve(null);

        reader.readAsDataURL(file);
      });

    if (data) {
      result.push(data);
    }
  }

  return result;
}

async function saveWorkout() {

  const date =
    $("wDate").value ||
    todayISO();

  const workout = {

    id:
      Date.now().toString(),

    date,

    type:
      $("wType").value.trim(),

    distance:
      num($("wDistance").value),

    time:
      $("wTime").value.trim(),

    pace:
      $("wPace").value.trim(),

    hr:
      num($("wHr").value),

    maxHr:
      num($("wMaxHr").value),

    calories:
      num($("wCalories").value),

    cadence:
      num($("wCadence").value),

    elevation:
      num($("wElevation").value),

    note:
      $("wNote").value.trim(),

    screens:
      await readScreens()

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

  workouts.push(
    workout
  );

  saveWorkouts();

  clearWorkoutForm();

  $("workoutForm")
    .classList.add(
      "hidden"
    );

  renderTrainingPage();
  renderHome();

  status(
    "Trening zapisany."
  );
}

function clearWorkoutForm() {

  [
    "wDate",
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

  $("wScreens").value =
    "";

  $("screensPreview").innerHTML =
    "";
}


/* =========================================================
   WYŚWIETLANIE WYKONANYCH TRENINGÓW
========================================================= */

function renderWorkouts() {

  const box =
    $("workouts");

  const list =
    workouts
      .slice()
      .sort(
        (a, b) =>
          String(b.date)
            .localeCompare(
              String(a.date)
            )
      );

  if (!list.length) {

    box.innerHTML =
      `<div class="empty">Brak zapisanych treningów.</div>`;

    return;
  }

  box.innerHTML =
    list.map(
      workout => {

        return `
          <article class="workout-card">

            <div class="workout-title">
              🏃 ${esc(
                workout.type ||
                "Trening"
              )}
            </div>

            <div
              style="
                color:#777e8d;
                margin-bottom:12px;
                font-size:14px;
              "
            >
              ${esc(workout.date)}
            </div>

            <div class="workout-data">

              ${
                workout.distance
                  ? `
                    <div>
                      <small>Dystans</small><br>
                      <b>${fmt(workout.distance)} km</b>
                    </div>
                  `
                  : ""
              }

              ${
                workout.time
                  ? `
                    <div>
                      <small>Czas</small><br>
                      <b>${esc(workout.time)}</b>
                    </div>
                  `
                  : ""
              }

              ${
                workout.pace
                  ? `
                    <div>
                      <small>Tempo</small><br>
                      <b>${esc(workout.pace)}</b>
                    </div>
                  `
                  : ""
              }

              ${
                workout.hr
                  ? `
                    <div>
                      <small>Śr. HR</small><br>
                      <b>${fmt(workout.hr)}</b>
                    </div>
                  `
                  : ""
              }

              ${
                workout.maxHr
                  ? `
                    <div>
                      <small>Max HR</small><br>
                      <b>${fmt(workout.maxHr)}</b>
                    </div>
                  `
                  : ""
              }

              ${
                workout.calories
                  ? `
                    <div>
                      <small>Spalone</small><br>
                      <b>${fmt(workout.calories)} kcal</b>
                    </div>
                  `
                  : ""
              }

              ${
                workout.cadence
                  ? `
                    <div>
                      <small>Kadencja</small><br>
                      <b>${fmt(workout.cadence)}</b>
                    </div>
                  `
                  : ""
              }

              ${
                workout.elevation
                  ? `
                    <div>
                      <small>Przewyższenie</small><br>
                      <b>${fmt(workout.elevation)} m</b>
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
                      margin-top:14px;
                      padding-top:14px;
                      border-top:1px solid #ddd;
                    "
                  >
                    📝 ${esc(workout.note)}
                  </div>
                `
                : ""
            }

            ${
              workout.screens &&
              workout.screens.length
                ? `
                  <div class="screens-preview" style="margin-top:14px;">
                    ${workout.screens.map(
                      screen =>
                        `<img src="${screen}" alt="Screen Garmin">`
                    ).join("")}
                  </div>
                `
                : ""
            }

            <button
              data-delete-workout="${esc(workout.id)}"
              class="secondary-btn"
              style="
                margin-top:14px;
                background:#fee4e2;
                color:#b42318;
              "
            >
              Usuń
            </button>

          </article>
        `;
      }
    ).join("");

  box
    .querySelectorAll(
      "[data-delete-workout]"
    )
    .forEach(button => {

      button.onclick =
        () => {

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

          renderTrainingPage();
          renderHome();

          status(
            "Trening usunięty."
          );
        };
    });
}


/* =========================================================
   PLANER — KALENDARZ
========================================================= */

function renderCalendar() {

  const year =
    calendarDate.getFullYear();

  const month =
    calendarDate.getMonth();

  const monthName =
    new Intl.DateTimeFormat(
      "pl-PL",
      {
        month: "long",
        year: "numeric"
      }
    ).format(calendarDate);

  $("calendarTitle").textContent =
    monthName.charAt(0).toUpperCase() +
    monthName.slice(1);

  const firstDay =
    new Date(
      year,
      month,
      1
    );

  let start =
    firstDay.getDay();

  /*
     JS:
     niedziela = 0

     Nasz kalendarz:
     poniedziałek = 0
  */

  start =
    start === 0
      ? 6
      : start - 1;

  const daysInMonth =
    new Date(
      year,
      month + 1,
      0
    ).getDate();

  let html = "";

  for (
    let i = 0;
    i < start;
    i++
  ) {
    html +=
      `<div class="calendar-day"></div>`;
  }

  for (
    let day = 1;
    day <= daysInMonth;
    day++
  ) {

    const date =
      `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    const plans =
      trainingPlans.filter(
        plan =>
          plan.date === date
      );

    const done =
      workouts.filter(
        workout =>
          workout.date === date
      );

    html += `
      <div class="calendar-day">

        <div class="calendar-number">
          ${day}
        </div>

        ${plans.map(
          plan => `
            <div class="calendar-event">
              📅 ${esc(
                plan.name ||
                plan.type
              )}
              ${
                plan.calories
                  ? `<br>${fmt(plan.calories)} kcal`
                  : ""
              }
            </div>
          `
        ).join("")}

        ${done.map(
          workout => `
            <div
              class="calendar-event"
              style="
                background:#e5f6ed;
                color:#17643e;
              "
            >
              ✓ ${esc(
                workout.type ||
                "Trening"
              )}
            </div>
          `
        ).join("")}

      </div>
    `;
  }

  $("calendarGrid").innerHTML =
    html;
}


/* =========================================================
   PLANER — ZAPIS
========================================================= */

function savePlan() {

  const date =
    $("planDate").value;

  if (!date) {

    status(
      "Wybierz datę treningu.",
      true
    );

    return;
  }

  const plan = {

    id:
      Date.now().toString(),

    date,

    type:
      $("planType").value,

    name:
      $("planName").value.trim(),

    calories:
      num(
        $("planCalories").value
      ),

    distance:
      num(
        $("planDistance").value
      ),

    note:
      $("planNote").value.trim()

  };

  if (!plan.name) {

    plan.name =
      plan.type;
  }

  trainingPlans.push(
    plan
  );

  savePlans();

  $("planName").value =
    "";

  $("planCalories").value =
    "";

  $("planDistance").value =
    "";

  $("planNote").value =
    "";

  calendarDate =
    new Date(
      `${date}T00:00:00`
    );

  renderCalendar();

  status(
    "Trening dodany do kalendarza."
  );
}


/* =========================================================
   STRONA TRENINGÓW
========================================================= */

function renderTrainingPage() {

  renderCalendar();
  renderWorkouts();
}


/* =========================================================
   EVENTY
========================================================= */

function setupEvents() {

  $("goNutrition").onclick =
    () => showPage("nutrition");

  $("goTraining").onclick =
    () => showPage("training");

  $("backHomeNutrition").onclick =
    () => showPage("home");

  $("backHomeTraining").onclick =
    () => showPage("home");

  $("dateSelect").onchange =
    event => {

      selectedDate =
        event.target.value;

      renderNutrition();
    };

  $("copyBtn").onclick =
    copyReport;

  $("prevMonth").onclick =
    () => {

      calendarDate.setMonth(
        calendarDate.getMonth() - 1
      );

      renderCalendar();
    };

  $("nextMonth").onclick =
    () => {

      calendarDate.setMonth(
        calendarDate.getMonth() + 1
      );

      renderCalendar();
    };

  $("savePlanBtn").onclick =
    savePlan;

  setupWorkoutForm();

  setupCollapsibles();
}


/* =========================================================
   START
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    loadAll();

    setupEvents();
    setupImport();

    renderHome();

    /*
       Domyślna data planera.
    */

    $("planDate").value =
      todayISO();

    $("wDate").value =
      todayISO();

    /*
       Jeżeli istnieją dane Fitatu,
       wybieramy najnowszy dzień.
    */

    const dates =
      getFoodDates();

    if (dates.length) {
      selectedDate =
        dates[0];
    }

    console.log(
      "FuelTrack AI:",
      {
        fitatu: foodRows.length,
        workouts: workouts.length,
        plans: trainingPlans.length
      }
    );
  }
);
