/* =========================================================
   FuelTrack AI — TrainingPage.js
   WERSJA NAPRAWIONA
   - jeden wspólny system Celów żywieniowych
   - cele kcal / białko / węgle / tłuszcz
   - cele zapisywane w localStorage
   - paski postępu korzystają z tych samych celów
   - Bilans energetyczny korzysta z tych samych celów
   - agregowanie danych Fitatu z FOOD_KEY
   - odporna na brak pojedynczych elementów HTML
   - naprawiona nawigacja Home / Żywienie / Trening
   - kalendarz + plan + wykonane treningi
   - do 4 screenów treningu
========================================================= */

const WORKOUT_KEY = "fueltrack_workouts_v04";
const PLAN_KEY = "fueltrack_training_plan_v01";
const FOOD_KEY = "fueltrack_food_v04";
const GOALS_KEY = "fueltrack_goals_v04";

const DEFAULT_GOALS = {
  kcal: 2200,
  protein: 180,
  carbs: 200,
  fat: 70
};

let plannedWorkouts = loadJSON(PLAN_KEY, []);
let completedWorkouts = loadJSON(WORKOUT_KEY, []);

if (!Array.isArray(plannedWorkouts)) plannedWorkouts = [];
if (!Array.isArray(completedWorkouts)) completedWorkouts = [];

let calendarDate = new Date();
let selectedWorkoutScreens = [];


/* =========================================================
   HELPERS
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


function getToday() {
  const d = new Date();

  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0")
  ].join("-");
}


function formatDate(date) {
  if (!date) return "";

  const parts = String(date).split("-");

  if (parts.length !== 3) {
    return String(date);
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

    return parsed ?? fallback;

  } catch (error) {
    console.error(
      "Błąd odczytu localStorage:",
      error
    );

    return fallback;
  }
}


function saveData() {
  localStorage.setItem(
    PLAN_KEY,
    JSON.stringify(plannedWorkouts)
  );

  localStorage.setItem(
    WORKOUT_KEY,
    JSON.stringify(completedWorkouts)
  );
}


function showStatus(
  message,
  duration = 2500
) {
  let status =
    $("status");

  if (!status) {
    status =
      document.createElement("div");

    status.id =
      "status";

    status.style.cssText = `
      position:fixed;
      left:16px;
      right:16px;
      bottom:16px;
      z-index:99999;
      padding:14px 16px;
      border-radius:14px;
      background:#222;
      color:#fff;
      font-weight:700;
      text-align:center;
      box-shadow:0 8px 30px rgba(0,0,0,.25);
    `;

    document.body.appendChild(
      status
    );
  }

  status.textContent =
    message;

  status.classList.remove(
    "hidden"
  );

  status.style.display =
    "block";

  clearTimeout(
    showStatus.timer
  );

  showStatus.timer =
    setTimeout(() => {
      status.classList.add(
        "hidden"
      );

      status.style.display =
        "none";
    }, duration);
}


function dateToISO(date) {
  return [
    date.getFullYear(),
    String(
      date.getMonth() + 1
    ).padStart(2, "0"),
    String(
      date.getDate()
    ).padStart(2, "0")
  ].join("-");
}


/* =========================================================
   NAWIGACJA
   Nie polegamy wyłącznie na addEventListener na konkretnym
   przycisku. Delegacja kliknięć obsługuje też elementy
   utworzone później przez HTML/JS.
========================================================= */

function getPageElement(page) {

  if (page === "home") {
    return $("homePage");
  }

  if (page === "nutrition") {
    return $("nutritionPage");
  }

  if (page === "training") {
    return $("trainingPage");
  }

  return null;
}


function showPage(page) {

  const pages = [
    $("homePage"),
    $("nutritionPage"),
    $("trainingPage")
  ].filter(Boolean);


  pages.forEach(el => {
    el.classList.add(
      "hidden"
    );

    el.style.display =
      "none";
  });


  const target =
    getPageElement(page);


  if (!target) {
    console.warn(
      `Nie znaleziono strony: ${page}`
    );

    return;
  }


  target.classList.remove(
    "hidden"
  );

  target.style.display =
    "";


  if (page === "home") {
    renderHomeSummary();
    renderDashboard();
    renderGoalsPanel();
  }


  if (page === "training") {
    renderCalendar();
    renderWorkouts();
  }
}


function navigate(page) {

  const hash =
    page === "training"
      ? "#training"
      : page === "nutrition"
        ? "#nutrition"
        : "";


  if (
    window.location.hash ===
    hash
  ) {
    showPage(page);
    return;
  }


  window.location.hash =
    hash;
}


function setupNavigation() {

  document.addEventListener(
    "click",
    event => {

      const target =
        event.target.closest(
          "#goTraining, #goNutrition, #backHomeTraining, #backHomeNutrition, #dashboardLastWorkout, #dashboardNextWorkout, [data-page]"
        );


      if (!target) {
        return;
      }


      event.preventDefault();


      if (
        target.id === "goTraining" ||
        target.id === "dashboardLastWorkout" ||
        target.id === "dashboardNextWorkout" ||
        target.dataset.page === "training"
      ) {

        navigate("training");

        return;
      }


      if (
        target.id === "goNutrition" ||
        target.dataset.page === "nutrition"
      ) {

        navigate("nutrition");

        return;
      }


      navigate("home");
    }
  );
}


function handleHashRoute() {

  const hash =
    window.location.hash;


  if (
    hash === "#training"
  ) {

    showPage(
      "training"
    );

  } else if (
    hash === "#nutrition"
  ) {

    showPage(
      "nutrition"
    );

  } else {

    showPage(
      "home"
    );
  }
}


/* =========================================================
   CELE ŻYWIENIOWE
========================================================= */

function getNutritionGoals() {

  const saved =
    loadJSON(
      GOALS_KEY,
      {}
    );


  return {

    kcal: num(
      saved.kcal ??
      saved.calories ??
      saved.calorieGoal ??
      saved.dailyCalories ??
      DEFAULT_GOALS.kcal
    ),

    protein: num(
      saved.protein ??
      saved.proteinGoal ??
      saved.dailyProtein ??
      DEFAULT_GOALS.protein
    ),

    carbs: num(
      saved.carbs ??
      saved.carbsGoal ??
      saved.dailyCarbs ??
      DEFAULT_GOALS.carbs
    ),

    fat: num(
      saved.fat ??
      saved.fatGoal ??
      saved.dailyFat ??
      DEFAULT_GOALS.fat
    )
  };
}


function saveNutritionGoals(
  goals
) {

  const clean = {

    kcal:
      Math.max(
        0,
        num(goals.kcal)
      ),

    protein:
      Math.max(
        0,
        num(goals.protein)
      ),

    carbs:
      Math.max(
        0,
        num(goals.carbs)
      ),

    fat:
      Math.max(
        0,
        num(goals.fat)
      )
  };


  localStorage.setItem(
    GOALS_KEY,
    JSON.stringify(clean)
  );


  return clean;
}


function ensureGoalsPanelStyles() {

  if (
    $("fueltrackGoalsPanelStyles")
  ) {
    return;
  }


  const style =
    document.createElement(
      "style"
    );


  style.id =
    "fueltrackGoalsPanelStyles";


  style.textContent = `
    .fueltrack-goals-panel {
      margin-top:16px;
      padding:18px;
      border:1px solid #e4e7ec;
      border-radius:18px;
      background:var(--card-bg,#fff);
      box-shadow:0 4px 18px rgba(16,24,40,.05);
    }

    .fueltrack-goals-head {
      display:flex;
      align-items:flex-start;
      justify-content:space-between;
      gap:12px;
      margin-bottom:14px;
    }

    .fueltrack-goals-head h3 {
      margin:0;
      font-size:19px;
    }

    .fueltrack-goals-head p {
      margin:4px 0 0;
      color:#777e8d;
      font-size:13px;
      line-height:1.4;
    }

    .fueltrack-goals-grid {
      display:grid;
      grid-template-columns:repeat(4,minmax(0,1fr));
      gap:10px;
    }

    .fueltrack-goal-field label {
      display:block;
      font-size:12px;
      font-weight:700;
      color:#667085;
      margin-bottom:5px;
    }

    .fueltrack-goal-field input {
      width:100%;
      box-sizing:border-box;
      min-height:44px;
      padding:9px 10px;
      border:1px solid #d0d5dd;
      border-radius:10px;
      background:#fff;
      color:#101828;
      font-size:15px;
    }

    .fueltrack-goals-actions {
      display:flex;
      justify-content:flex-end;
      margin-top:12px;
    }

    .fueltrack-goals-save {
      border:0;
      border-radius:11px;
      padding:10px 15px;
      background:#3565e8;
      color:#fff;
      font-weight:800;
      cursor:pointer;
    }

    .fueltrack-goal-summary {
      display:grid;
      grid-template-columns:repeat(4,minmax(0,1fr));
      gap:10px;
      margin-top:12px;
    }

    .fueltrack-goal-summary-item {
      padding:11px;
      border-radius:12px;
      background:#f7f8fa;
    }

    .fueltrack-goal-summary-item small {
      display:block;
      color:#667085;
      margin-bottom:3px;
    }

    .fueltrack-goal-summary-item b {
      font-size:16px;
    }

    @media (max-width:700px) {
      .fueltrack-goals-grid,
      .fueltrack-goal-summary {
        grid-template-columns:repeat(2,minmax(0,1fr));
      }
    }
  `;


  document.head.appendChild(
    style
  );
}


function findGoalsMount() {

  return (
    $("goalsNutrition") ||
    $("nutritionGoals") ||
    $("goalsPanel") ||
    $("dashboardGoals") ||
    $("homePage")
  );
}


function renderGoalsPanel() {

  const home =
    $("homePage");


  if (!home) {
    return;
  }


  ensureGoalsPanelStyles();


  let panel =
    $("fueltrackGoalsPanel");


  if (!panel) {

    panel =
      document.createElement(
        "section"
      );

    panel.id =
      "fueltrackGoalsPanel";

    panel.className =
      "fueltrack-goals-panel";


    const mount =
      findGoalsMount();


    if (!mount) {
      return;
    }


    mount.appendChild(
      panel
    );
  }


  const goals =
    getNutritionGoals();


  panel.innerHTML = `

    <div class="fueltrack-goals-head">

      <div>

        <h3>
          🎯 Cele żywieniowe
        </h3>

        <p>
          Ustawiasz cele raz.
          FuelTrack AI wykorzystuje
          je na całej stronie.
        </p>

      </div>

    </div>


    <div class="fueltrack-goals-grid">

      <div class="fueltrack-goal-field">

        <label for="fuelGoalKcal">
          Kalorie (kcal)
        </label>

        <input
          id="fuelGoalKcal"
          type="number"
          min="0"
          step="1"
          value="${esc(
            goals.kcal
          )}"
        >

      </div>


      <div class="fueltrack-goal-field">

        <label for="fuelGoalProtein">
          Białko (g)
        </label>

        <input
          id="fuelGoalProtein"
          type="number"
          min="0"
          step="1"
          value="${esc(
            goals.protein
          )}"
        >

      </div>


      <div class="fueltrack-goal-field">

        <label for="fuelGoalCarbs">
          Węglowodany (g)
        </label>

        <input
          id="fuelGoalCarbs"
          type="number"
          min="0"
          step="1"
          value="${esc(
            goals.carbs
          )}"
        >

      </div>


      <div class="fueltrack-goal-field">

        <label for="fuelGoalFat">
          Tłuszcz (g)
        </label>

        <input
          id="fuelGoalFat"
          type="number"
          min="0"
          step="1"
          value="${esc(
            goals.fat
          )}"
        >

      </div>

    </div>


    <div class="fueltrack-goals-actions">

      <button
        type="button"
        id="saveNutritionGoalsBtn"
        class="fueltrack-goals-save"
      >
        Zapisz cele
      </button>

    </div>


    <div class="fueltrack-goal-summary">

      <div class="fueltrack-goal-summary-item">

        <small>
          Kalorie
        </small>

        <b>
          ${fmt(
            goals.kcal
          )} kcal
        </b>

      </div>


      <div class="fueltrack-goal-summary-item">

        <small>
          Białko
        </small>

        <b>
          ${fmt(
            goals.protein
          )} g
        </b>

      </div>


      <div class="fueltrack-goal-summary-item">

        <small>
          Węglowodany
        </small>

        <b>
          ${fmt(
            goals.carbs
          )} g
        </b>

      </div>


      <div class="fueltrack-goal-summary-item">

        <small>
          Tłuszcz
        </small>

        <b>
          ${fmt(
            goals.fat
          )} g
        </b>

      </div>

    </div>

  `;


  const saveButton =
    $("saveNutritionGoalsBtn");


  if (saveButton) {

    saveButton.addEventListener(
      "click",
      () => {

        const saved =
          saveNutritionGoals({

            kcal:
              $("fuelGoalKcal")
                ?.value,

            protein:
              $("fuelGoalProtein")
                ?.value,

            carbs:
              $("fuelGoalCarbs")
                ?.value,

            fat:
              $("fuelGoalFat")
                ?.value

          });


        renderGoalsPanel();

        renderDashboard();


        showStatus(
          `Zapisano cele: ${fmt(
            saved.kcal
          )} kcal · ${fmt(
            saved.protein
          )} g białka · ${fmt(
            saved.carbs
          )} g węgli · ${fmt(
            saved.fat
          )} g tłuszczu`
        );

      }
    );
  }
}


/* =========================================================
   FOOD / FITATU
========================================================= */

function getStoredFood() {

  const food =
    loadJSON(
      FOOD_KEY,
      []
    );


  return food;
}


function extractDateFromFoodRow(
  row
) {

  if (
    !row ||
    typeof row !== "object"
  ) {
    return "";
  }


  const raw =
    row.date ??
    row.day ??
    row.data ??
    row["Data"] ??
    row["data"] ??
    "";


  if (!raw) {
    return "";
  }


  const text =
    String(raw).trim();


  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      text
    )
  ) {
    return text;
  }


  const match =
    text.match(
      /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/
    );


  if (match) {

    return `${match[3]}-${String(
      match[2]
    ).padStart(
      2,
      "0"
    )}-${String(
      match[1]
    ).padStart(
      2,
      "0"
    )}`;
  }


  const parsed =
    new Date(text);


  if (
    !Number.isNaN(
      parsed.getTime()
    )
  ) {

    return dateToISO(
      parsed
    );
  }


  return "";
}


function getFoodNumber(
  row,
  names
) {

  if (
    !row ||
    typeof row !== "object"
  ) {
    return 0;
  }


  for (
    const name of names
  ) {

    if (
      row[name] !== undefined &&
      row[name] !== null &&
      row[name] !== ""
    ) {

      return num(
        row[name]
      );
    }
  }


  return 0;
}


function extractNutrition(
  date
) {

  const food =
    getStoredFood();


  if (!food) {

    return {
      kcal: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    };
  }


  /* -----------------------------------------------
     Wariant 1: obiekt z datą jako kluczem
  ------------------------------------------------ */

  if (
    !Array.isArray(food) &&
    typeof food === "object" &&
    food[date]
  ) {

    const day =
      food[date];


    return {

      kcal:
        getFoodNumber(
          day,
          [
            "kcal",
            "calories",
            "energy",
            "totalKcal",
            "Kalorie",
            "Energia"
          ]
        ),

      protein:
        getFoodNumber(
          day,
          [
            "protein",
            "proteins",
            "totalProtein",
            "Białko",
            "Bialko"
          ]
        ),

      carbs:
        getFoodNumber(
          day,
          [
            "carbs",
            "carbohydrates",
            "totalCarbs",
            "Węglowodany",
            "Weglowodany"
          ]
        ),

      fat:
        getFoodNumber(
          day,
          [
            "fat",
            "fats",
            "totalFat",
            "Tłuszcz",
            "Tluszcz"
          ]
        )

    };
  }


  if (
    !Array.isArray(food)
  ) {

    return {
      kcal: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    };
  }


  /* -----------------------------------------------
     Wariant 2: Fitatu = wiele wierszy na dany dzień.
     Sumujemy wszystkie produkty.
  ------------------------------------------------ */

  const rows =
    food.filter(
      row => {

        return (
          extractDateFromFoodRow(
            row
          ) === date
        );

      }
    );


  if (!rows.length) {

    return {
      kcal: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    };
  }


  const totals = {

    kcal: 0,
    protein: 0,
    carbs: 0,
    fat: 0

  };


  rows.forEach(
    row => {

      totals.kcal +=
        getFoodNumber(
          row,
          [
            "kcal",
            "Kcal",
            "calories",
            "Calories",
            "Kalorie",
            "Energia (kcal)",
            "Energia"
          ]
        );


      totals.protein +=
        getFoodNumber(
          row,
          [
            "protein",
            "Protein",
            "proteins",
            "Białko",
            "Bialko",
            "Białko (g)"
          ]
        );


      totals.carbs +=
        getFoodNumber(
          row,
          [
            "carbs",
            "Carbs",
            "carbohydrates",
            "Węglowodany",
            "Weglowodany",
            "Węglowodany (g)"
          ]
        );


      totals.fat +=
        getFoodNumber(
          row,
          [
            "fat",
            "Fat",
            "fats",
            "Tłuszcz",
            "Tluszcz",
            "Tłuszcz (g)"
          ]
        );

    }
  );


  return totals;
}


function getFoodDates() {

  const food =
    getStoredFood();


  if (
    !Array.isArray(food)
  ) {

    return Object.keys(
      food || {}
    )
      .filter(
        key =>
          /^\d{4}-\d{2}-\d{2}$/.test(
            key
          )
      )
      .sort();
  }


  return [
    ...new Set(
      food
        .map(
          extractDateFromFoodRow
        )
        .filter(Boolean)
    )
  ].sort();
}


function findLatestFoodDate() {

  const dates =
    getFoodDates();


  return dates.length
    ? dates[dates.length - 1]
    : "";
}


/* =========================================================
   PROGRESS
========================================================= */

function getProgressState(
  current,
  goal
) {

  const value =
    num(current);

  const target =
    num(goal);


  if (
    target <= 0
  ) {

    return {
      percent: 0,
      rawPercent: 0,
      state: "low"
    };
  }


  const rawPercent =
    (value / target) * 100;


  /*
    Zielone: 80–100%
    Pomarańczowe: >100–110%
    Czerwone: >110%
    Poniżej 80%: niski stan
  */

  let state =
    "low";


  if (
    rawPercent >= 80 &&
    rawPercent <= 100
  ) {

    state =
      "good";

  } else if (
    rawPercent > 100 &&
    rawPercent <= 110
  ) {

    state =
      "warning";

  } else if (
    rawPercent > 110
  ) {

    state =
      "danger";
  }


  return {

    percent:
      Math.min(
        100,
        Math.max(
          0,
          rawPercent
        )
      ),

    rawPercent,

    state
  };
}


function setDashboardProgress(
  barId,
  percentId,
  remainingId,
  valueId,
  value,
  goal,
  unit = ""
) {

  const bar =
    $(barId);

  const percent =
    $(percentId);

  const remaining =
    $(remainingId);

  const valueElement =
    $(valueId);


  if (
    !bar ||
    !percent ||
    !remaining ||
    !valueElement
  ) {
    return;
  }


  const current =
    num(value);

  const target =
    num(goal);


  valueElement.textContent =
    `${fmt(
      current
    )} / ${fmt(
      target
    )}${unit}`;


  const state =
    getProgressState(
      current,
      target
    );


  bar.style.width =
    `${state.percent}%`;


  bar.classList.remove(
    "low",
    "good",
    "warning",
    "danger"
  );


  bar.classList.add(
    state.state
  );


  if (
    target <= 0
  ) {

    percent.textContent =
      "—";

    remaining.textContent =
      "brak celu";

    return;
  }


  percent.textContent =
    `${Math.round(
      state.rawPercent
    )}%`;


  const difference =
    target -
    current;


  if (
    difference > 0
  ) {

    remaining.textContent =
      `zostało ${fmt(
        difference
      )}${unit}`;

  } else if (
    difference === 0
  ) {

    remaining.textContent =
      "cel osiągnięty";

  } else {

    remaining.textContent =
      `+${fmt(
        Math.abs(
          difference
        )
      )}${unit}`;
  }
}


/* =========================================================
   PLANOWANIE
========================================================= */

function setupPlanForm() {

  const planDate =
    $("planDate");


  if (
    planDate &&
    !planDate.value
  ) {

    planDate.value =
      getToday();
  }


  const savePlanBtn =
    $("savePlanBtn");


  if (
    savePlanBtn &&
    !savePlanBtn.dataset.bound
  ) {

    savePlanBtn.dataset.bound =
      "1";


    savePlanBtn.addEventListener(
      "click",
      addPlannedWorkout
    );
  }
}


function addPlannedWorkout() {

  const date =
    $("planDate")?.value ||
    getToday();


  const type =
    $("planType")?.value ||
    "Easy";


  const name =
    $("planName")?.value.trim() ||
    "";


  const calories =
    num(
      $("planCalories")?.value
    );


  const distance =
    num(
      $("planDistance")?.value
    );


  const note =
    $("planNote")?.value.trim() ||
    "";


  if (!date) {

    alert(
      "Wybierz datę treningu."
    );

    return;
  }


  if (
    !name &&
    !distance &&
    !note
  ) {

    alert(
      "Wpisz nazwę, dystans albo opis treningu."
    );

    return;
  }


  const workout = {

    id:
      Date.now().toString() +
      Math.random()
        .toString(36)
        .slice(2),

    date,
    type,
    name,
    calories,
    distance,
    note
  };


  plannedWorkouts.push(
    workout
  );


  saveData();

  clearPlanForm();

  renderCalendar();
  renderDashboard();


  showStatus(
    `Dodano trening do planu: ${formatDate(
      date
    )}`
  );
}


function clearPlanForm() {

  [
    "planName",
    "planCalories",
    "planDistance",
    "planNote"
  ].forEach(
    id => {

      const el =
        $(id);

      if (el) {
        el.value =
          "";
      }
    }
  );


  const date =
    $("planDate");


  if (date) {
    date.value =
      getToday();
  }


  const type =
    $("planType");


  if (type) {
    type.value =
      "Easy";
  }
}


function deletePlannedWorkout(
  id
) {

  plannedWorkouts =
    plannedWorkouts.filter(
      workout =>
        String(
          workout.id
        ) !==
        String(id)
    );


  saveData();

  renderCalendar();
  renderDashboard();


  showStatus(
    "Usunięto zaplanowany trening."
  );
}


function getPlansForDate(
  date
) {

  return plannedWorkouts.filter(
    workout =>
      workout.date === date
  );
}


/* =========================================================
   KALENDARZ
========================================================= */

function setupCalendar() {

  const prev =
    $("prevMonth");

  const next =
    $("nextMonth");


  if (
    prev &&
    !prev.dataset.bound
  ) {

    prev.dataset.bound =
      "1";


    prev.addEventListener(
      "click",
      () => {

        calendarDate.setMonth(
          calendarDate.getMonth() - 1
        );

        renderCalendar();
      }
    );
  }


  if (
    next &&
    !next.dataset.bound
  ) {

    next.dataset.bound =
      "1";


    next.addEventListener(
      "click",
      () => {

        calendarDate.setMonth(
          calendarDate.getMonth() + 1
        );

        renderCalendar();
      }
    );
  }
}


function renderCalendar() {

  const title =
    $("calendarTitle");

  const grid =
    $("calendarGrid");


  if (
    !title ||
    !grid
  ) {
    return;
  }


  const year =
    calendarDate.getFullYear();

  const month =
    calendarDate.getMonth();


  title.textContent =
    calendarDate.toLocaleDateString(
      "pl-PL",
      {
        month: "long",
        year: "numeric"
      }
    );


  grid.innerHTML =
    "";


  const firstDay =
    new Date(
      year,
      month,
      1
    );


  let startDay =
    firstDay.getDay();


  startDay =
    startDay === 0
      ? 6
      : startDay - 1;


  const daysInMonth =
    new Date(
      year,
      month + 1,
      0
    ).getDate();


  const previousMonthDays =
    new Date(
      year,
      month,
      0
    ).getDate();


  const totalCells =
    Math.ceil(
      (
        startDay +
        daysInMonth
      ) / 7
    ) * 7;


  for (
    let index = 0;
    index < totalCells;
    index++
  ) {

    const cell =
      document.createElement(
        "div"
      );


    cell.className =
      "calendar-day";


    let dayNumber;
    let date;
    let isCurrentMonth =
      true;


    if (
      index <
      startDay
    ) {

      dayNumber =
        previousMonthDays -
        startDay +
        index +
        1;


      date =
        dateToISO(
          new Date(
            year,
            month - 1,
            dayNumber
          )
        );


      isCurrentMonth =
        false;

    } else if (
      index >=
      startDay +
      daysInMonth
    ) {

      dayNumber =
        index -
        startDay -
        daysInMonth +
        1;


      date =
        dateToISO(
          new Date(
            year,
            month + 1,
            dayNumber
          )
        );


      isCurrentMonth =
        false;

    } else {

      dayNumber =
        index -
        startDay +
        1;


      date =
        dateToISO(
          new Date(
            year,
            month,
            dayNumber
          )
        );
    }


    if (
      !isCurrentMonth
    ) {

      cell.style.opacity =
        "0.45";
    }


    const number =
      document.createElement(
        "div"
      );


    number.className =
      "calendar-number";


    number.textContent =
      dayNumber;


    cell.appendChild(
      number
    );


    const plans =
      getPlansForDate(
        date
      );


    const workouts =
      completedWorkouts.filter(
        workout =>
          workout.date ===
          date
      );


    plans.forEach(
      workout => {

        const event =
          document.createElement(
            "div"
          );


        event.className =
          "calendar-event";


        event.style.background =
          "#e8edff";


        event.style.color =
          "#294da9";


        event.innerHTML =
          `🎯 ${esc(
            workout.name ||
            workout.type ||
            "Trening"
          )}`;


        event.title =
          workout.note ||
          "";


        cell.appendChild(
          event
        );
      }
    );


    workouts.forEach(
      workout => {

        const event =
          document.createElement(
            "div"
          );


        event.className =
          "calendar-event";


        event.style.background =
          "#e4f6ed";


        event.style.color =
          "#17613d";


        event.innerHTML =
          `✓ ${esc(
            workout.type ||
            "Trening"
          )}`;


        cell.appendChild(
          event
        );
      }
    );


    if (
      date ===
      getToday()
    ) {

      cell.style.border =
        "2px solid #3565e8";
    }


    cell.addEventListener(
      "click",
      () => {

        const planDate =
          $("planDate");


        if (planDate) {
          planDate.value =
            date;
        }


        const workoutDate =
          $("wDate");


        if (workoutDate) {
          workoutDate.value =
            date;
        }


        renderWorkouts(
          date
        );
      }
    );


    grid.appendChild(
      cell
    );
  }
}


/* =========================================================
   WYKONANE TRENINGI
========================================================= */

function setupWorkoutForm() {

  const addBtn =
    $("addWorkoutBtn");

  const cancelBtn =
    $("cancelWorkoutBtn");

  const saveBtn =
    $("saveWorkoutBtn");


  if (
    addBtn &&
    !addBtn.dataset.bound
  ) {

    addBtn.dataset.bound =
      "1";


    addBtn.addEventListener(
      "click",
      () => {

        const form =
          $("workoutForm");


        if (form) {

          form.classList.toggle(
            "hidden"
          );


          form.style.display =
            form.classList.contains(
              "hidden"
            )
              ? "none"
              : "";
        }


        const date =
          $("wDate");


        if (
          date &&
          !date.value
        ) {

          date.value =
            getToday();
        }
      }
    );
  }


  if (
    cancelBtn &&
    !cancelBtn.dataset.bound
  ) {

    cancelBtn.dataset.bound =
      "1";


    cancelBtn.addEventListener(
      "click",
      () => {

        clearWorkoutForm();


        const form =
          $("workoutForm");


        if (form) {

          form.classList.add(
            "hidden"
          );

          form.style.display =
            "none";
        }
      }
    );
  }


  if (
    saveBtn &&
    !saveBtn.dataset.bound
  ) {

    saveBtn.dataset.bound =
      "1";


    saveBtn.addEventListener(
      "click",
      addCompletedWorkout
    );
  }


  setupScreens();
}


function addCompletedWorkout() {

  const date =
    $("wDate")?.value ||
    getToday();


  const type =
    $("wType")?.value.trim() ||
    "Trening";


  const distance =
    num(
      $("wDistance")?.value
    );


  const time =
    $("wTime")?.value.trim() ||
    "";


  const pace =
    $("wPace")?.value.trim() ||
    "";


  const hr =
    num(
      $("wHr")?.value
    );


  const maxHr =
    num(
      $("wMaxHr")?.value
    );


  const calories =
    num(
      $("wCalories")?.value
    );


  const cadence =
    num(
      $("wCadence")?.value
    );


  const elevation =
    num(
      $("wElevation")?.value
    );


  const note =
    $("wNote")?.value.trim() ||
    "";


  if (
    !type &&
    !distance &&
    !time
  ) {

    alert(
      "Wpisz przynajmniej rodzaj, dystans albo czas treningu."
    );

    return;
  }


  const workout = {

    id:
      Date.now().toString() +
      Math.random()
        .toString(36)
        .slice(2),

    date,
    type,
    distance,
    time,
    pace,
    hr,
    maxHr,
    calories,
    cadence,
    elevation,
    note,

    screens:
      [
        ...selectedWorkoutScreens
      ]

  };


  completedWorkouts.push(
    workout
  );


  saveData();

  clearWorkoutForm();


  const form =
    $("workoutForm");


  if (form) {

    form.classList.add(
      "hidden"
    );

    form.style.display =
      "none";
  }


  renderCalendar();
  renderWorkouts();
  renderDashboard();


  showStatus(
    `Zapisano trening: ${formatDate(
      date
    )}`
  );
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
  ].forEach(
    id => {

      const el =
        $(id);

      if (el) {
        el.value =
          "";
      }
    }
  );


  const date =
    $("wDate");


  if (date) {
    date.value =
      getToday();
  }


  const file =
    $("wScreens");


  if (file) {
    file.value =
      "";
  }


  selectedWorkoutScreens =
    [];


  renderScreensPreview();
}


function deleteCompletedWorkout(
  id
) {

  const confirmed =
    confirm(
      "Usunąć ten wykonany trening?"
    );


  if (!confirmed) {
    return;
  }


  completedWorkouts =
    completedWorkouts.filter(
      workout =>
        String(
          workout.id
        ) !==
        String(id)
    );


  saveData();

  renderCalendar();
  renderWorkouts();
  renderDashboard();


  showStatus(
    "Usunięto wykonany trening."
  );
}


/* =========================================================
   SCREENY
========================================================= */

function setupScreens() {

  const input =
    $("wScreens");


  if (
    !input ||
    input.dataset.bound
  ) {
    return;
  }


  input.dataset.bound =
    "1";


  input.addEventListener(
    "change",
    event => {

      const files =
        Array.from(
          event.target.files || []
        );


      if (
        files.length >
        4
      ) {

        alert(
          "Możesz dodać maksymalnie 4 screeny."
        );


        input.value =
          "";


        selectedWorkoutScreens =
          [];


        renderScreensPreview();


        return;
      }


      selectedWorkoutScreens =
        [];


      files.forEach(
        file => {

          const reader =
            new FileReader();


          reader.onload =
            () => {

              selectedWorkoutScreens.push(
                reader.result
              );


              selectedWorkoutScreens =
                selectedWorkoutScreens.slice(
                  0,
                  4
                );


              renderScreensPreview();

            };


          reader.readAsDataURL(
            file
          );

        }
      );
    }
  );
}


function renderScreensPreview() {

  const preview =
    $("screensPreview");


  if (!preview) {
    return;
  }


  preview.innerHTML =
    "";


  selectedWorkoutScreens
    .slice(0, 4)
    .forEach(
      src => {

        const img =
          document.createElement(
            "img"
          );


        img.src =
          src;


        img.alt =
          "Screen z Garmina";


        preview.appendChild(
          img
        );
      }
    );
}


/* =========================================================
   WYŚWIETLANIE TRENINGÓW
========================================================= */

function renderWorkouts(
  filterDate = null
) {

  const container =
    $("workouts");


  if (!container) {
    return;
  }


  let workouts =
    [
      ...completedWorkouts
    ];


  if (filterDate) {

    workouts =
      workouts.filter(
        workout =>
          workout.date ===
          filterDate
      );
  }


  workouts.sort(
    (a, b) =>
      String(b.date)
        .localeCompare(
          String(a.date)
        )
  );


  if (
    !workouts.length
  ) {

    container.innerHTML =
      `<div class="empty">
        Brak zapisanych treningów.
      </div>`;


    return;
  }


  container.innerHTML =
    workouts
      .map(
        renderWorkoutCard
      )
      .join("");
}


function renderWorkoutCard(
  workout
) {

  const screens =
    Array.isArray(
      workout.screens
    )
      ? workout.screens
      : [];


  return `

    <div class="workout-card">

      <div class="workout-title">

        🏃 ${esc(
          workout.type ||
          "Trening"
        )}

        <div style="
          font-size:13px;
          color:#777e8d;
          font-weight:600;
          margin-top:4px;
        ">

          ${formatDate(
            workout.date
          )}

        </div>

      </div>


      <div class="workout-data">

        ${
          num(
            workout.distance
          ) > 0
            ? `
              <div>
                <small>Dystans</small><br>
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
                <small>Czas</small><br>
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
                <small>Tempo</small><br>
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
          num(
            workout.hr
          ) > 0
            ? `
              <div>
                <small>Śr. HR</small><br>
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
          num(
            workout.maxHr
          ) > 0
            ? `
              <div>
                <small>Max HR</small><br>
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
          num(
            workout.calories
          ) > 0
            ? `
              <div>
                <small>Spalone</small><br>
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
          num(
            workout.cadence
          ) > 0
            ? `
              <div>
                <small>Kadencja</small><br>
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
          num(
            workout.elevation
          ) > 0
            ? `
              <div>
                <small>Przewyższenie</small><br>
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
            <div style="
              margin-top:14px;
              border-top:1px solid #e4e6eb;
              padding-top:12px;
              color:#555;
              line-height:1.4;
            ">
              📝 ${esc(
                workout.note
              )}
            </div>
          `
          : ""
      }


      ${
        screens.length
          ? `
            <div class="screens-preview">

              ${screens
                .slice(0, 4)
                .map(
                  src =>
                    `<img
                      src="${esc(src)}"
                      alt="Screen z Garmina"
                    >`
                )
                .join("")}

            </div>
          `
          : ""
      }


      <button
        type="button"
        onclick="deleteCompletedWorkout('${esc(
          workout.id
        )}')"
        style="
          margin-top:14px;
          border:0;
          border-radius:10px;
          padding:8px 11px;
          background:#fee4e2;
          color:#b42318;
          font-weight:700;
          cursor:pointer;
        "
      >
        Usuń
      </button>

    </div>

  `;
}


/* =========================================================
   DASHBOARD
========================================================= */

function getDashboardNutritionDate() {

  const today =
    getToday();


  const todayNutrition =
    extractNutrition(
      today
    );


  const hasTodayData =
    todayNutrition.kcal > 0 ||
    todayNutrition.protein > 0 ||
    todayNutrition.carbs > 0 ||
    todayNutrition.fat > 0;


  if (hasTodayData) {
    return today;
  }


  return (
    findLatestFoodDate() ||
    today
  );
}


function renderDashboard() {

  const activeDate =
    getDashboardNutritionDate();


  const nutrition =
    extractNutrition(
      activeDate
    );


  const goals =
    getNutritionGoals();


  setDashboardProgress(
    "dashKcalBar",
    "dashKcalPercent",
    "dashKcalRemaining",
    "dashKcalValue",
    nutrition.kcal,
    goals.kcal,
    ""
  );


  setDashboardProgress(
    "dashProteinBar",
    "dashProteinPercent",
    "dashProteinRemaining",
    "dashProteinValue",
    nutrition.protein,
    goals.protein,
    " g"
  );


  setDashboardProgress(
    "dashCarbsBar",
    "dashCarbsPercent",
    "dashCarbsRemaining",
    "dashCarbsValue",
    nutrition.carbs,
    goals.carbs,
    " g"
  );


  setDashboardProgress(
    "dashFatBar",
    "dashFatPercent",
    "dashFatRemaining",
    "dashFatValue",
    nutrition.fat,
    goals.fat,
    " g"
  );


  renderDashboardTraining();


  const sameDayWorkouts =
    completedWorkouts.filter(
      workout =>
        workout.date ===
        activeDate
    );


  const workoutCalories =
    sameDayWorkouts.reduce(
      (sum, workout) =>
        sum +
        num(
          workout.calories
        ),
      0
    );


  const foodCalories =
    nutrition.kcal;


  /*
    Bilans:
    - dodatni = zjedzone kcal ponad spalone kcal
    - ujemny = więcej spalono niż zjedzono
    - cel kcal jest pokazany osobno jako limit/target
  */

  const balance =
    foodCalories -
    workoutCalories;


  const balanceEl =
    $("dashboardBalance");


  const balanceIcon =
    $("dashboardBalanceIcon");


  if (balanceEl) {

    if (
      balance > 0
    ) {

      balanceEl.textContent =
        `+${fmt(
          balance
        )} kcal`;

    } else if (
      balance < 0
    ) {

      balanceEl.textContent =
        `${fmt(
          balance
        )} kcal`;

    } else {

      balanceEl.textContent =
        "0 kcal";
    }
  }


  if (balanceIcon) {

    if (
      foodCalories >
        goals.kcal &&
      goals.kcal > 0
    ) {

      balanceIcon.textContent =
        "🔴";

    } else if (
      foodCalories >=
        goals.kcal * 0.9 &&
      goals.kcal > 0
    ) {

      balanceIcon.textContent =
        "🟠";

    } else if (
      goals.kcal > 0 &&
      foodCalories <
        goals.kcal
    ) {

      balanceIcon.textContent =
        "🟢";

    } else {

      balanceIcon.textContent =
        "⚖️";
    }
  }


  const foodEl =
    $("dashboardBalanceFood");


  const workoutEl =
    $("dashboardBalanceWorkout");


  const goalEl =
    $("dashboardBalanceGoal");


  if (foodEl) {

    foodEl.textContent =
      `${fmt(
        foodCalories
      )} kcal`;
  }


  if (workoutEl) {

    workoutEl.textContent =
      `${fmt(
        workoutCalories
      )} kcal`;
  }


  if (goalEl) {

    goalEl.textContent =
      goals.kcal > 0
        ? `${fmt(
            goals.kcal
          )} kcal`
        : "brak celu";
  }
}


/* =========================================================
   DASHBOARD — TRENINGI
========================================================= */

function renderDashboardTraining() {

  const lastTitle =
    $("dashboardLastWorkoutTitle");


  const lastMain =
    $("dashboardLastWorkoutMain");


  const lastDate =
    $("dashboardLastWorkoutDate");


  const nextTitle =
    $("dashboardNextWorkoutTitle");


  const nextMain =
    $("dashboardNextWorkoutMain");


  const nextDate =
    $("dashboardNextWorkoutDate");


  const sortedCompleted =
    [
      ...completedWorkouts
    ]
      .filter(
        workout =>
          workout &&
          workout.date
      )
      .sort(
        (a, b) =>
          String(
            b.date
          ).localeCompare(
            String(
              a.date
            )
          )
      );


  const lastWorkout =
    sortedCompleted[0];


  if (!lastWorkout) {

    if (lastTitle) {

      lastTitle.textContent =
        "Brak treningów";
    }


    if (lastMain) {

      lastMain.innerHTML =
        `<div class="dashboard-empty">
          Nie zapisano jeszcze wykonanego treningu.
        </div>`;
    }


    if (lastDate) {

      lastDate.textContent =
        "";
    }

  } else {

    if (lastTitle) {

      lastTitle.textContent =
        lastWorkout.type ||
        "Trening";
    }


    const details =
      [];


    if (
      num(
        lastWorkout.distance
      ) > 0
    ) {

      details.push(
        `${fmt(
          lastWorkout.distance
        )} km`
      );
    }


    if (
      lastWorkout.time
    ) {

      details.push(
        lastWorkout.time
      );
    }


    if (
      lastWorkout.pace
    ) {

      details.push(
        lastWorkout.pace
      );
    }


    if (
      num(
        lastWorkout.hr
      ) > 0
    ) {

      details.push(
        `${fmt(
          lastWorkout.hr
        )} bpm`
      );
    }


    if (lastMain) {

      lastMain.textContent =
        details.length
          ? details.join(
              " · "
            )
          : "Szczegóły treningu zapisane.";
    }


    if (lastDate) {

      lastDate.textContent =
        formatDate(
          lastWorkout.date
        );
    }
  }


  const today =
    getToday();


  const futurePlans =
    plannedWorkouts
      .filter(
        workout =>
          workout &&
          workout.date &&
          workout.date >= today
      )
      .sort(
        (a, b) =>
          String(
            a.date
          ).localeCompare(
            String(
              b.date
            )
          )
      );


  const nextWorkout =
    futurePlans[0];


  if (!nextWorkout) {

    if (nextTitle) {

      nextTitle.textContent =
        "Brak planu";
    }


    if (nextMain) {

      nextMain.innerHTML =
        `<div class="dashboard-empty">
          Nie masz jeszcze zaplanowanego treningu.
        </div>`;
    }


    if (nextDate) {

      nextDate.textContent =
        "";
    }


    return;
  }


  if (nextTitle) {

    nextTitle.textContent =
      nextWorkout.name ||
      nextWorkout.type ||
      "Trening";
  }


  const nextDetails =
    [];


  if (
    nextWorkout.type &&
    nextWorkout.name
  ) {

    nextDetails.push(
      nextWorkout.type
    );
  }


  if (
    num(
      nextWorkout.distance
    ) > 0
  ) {

    nextDetails.push(
      `${fmt(
        nextWorkout.distance
      )} km`
    );
  }


  if (
    nextWorkout.note
  ) {

    const shortNote =
      String(
        nextWorkout.note
      );


    nextDetails.push(
      shortNote.length > 80
        ? `${shortNote.slice(
            0,
            80
          )}…`
        : shortNote
    );
  }


  if (nextMain) {

    nextMain.textContent =
      nextDetails.length
        ? nextDetails.join(
            " · "
          )
        : "Zaplanowany trening";
  }


  if (nextDate) {

    nextDate.textContent =
      nextWorkout.date === today
        ? "Dzisiaj"
        : formatDate(
            nextWorkout.date
          );
  }
}


/* =========================================================
   HOME — STARE PODSUMOWANIE
========================================================= */

function renderHomeSummary() {

  const sorted =
    [
      ...completedWorkouts
    ]
      .filter(
        workout =>
          workout &&
          workout.date
      )
      .sort(
        (a, b) =>
          String(
            b.date
          ).localeCompare(
            String(
              a.date
            )
          )
      );


  const lastWorkout =
    sorted[0];


  const burned =
    $("homeBurned");


  if (!burned) {
    return;
  }


  if (!lastWorkout) {

    burned.textContent =
      "0 kcal";

    return;
  }


  const sameDay =
    completedWorkouts.filter(
      workout =>
        workout.date ===
        lastWorkout.date
    );


  const calories =
    sameDay.reduce(
      (sum, workout) =>
        sum +
        num(
          workout.calories
        ),
      0
    );


  burned.textContent =
    `${fmt(
      calories
    )} kcal`;
}


/* =========================================================
   START
========================================================= */

function initTrainingPage() {

  /*
    Ustawienia i elementy mogą być ładowane razem z app.js,
    dlatego inicjalizacja jest bezpieczna i idempotentna.
  */

  setupNavigation();

  setupCalendar();

  setupPlanForm();

  setupWorkoutForm();


  renderGoalsPanel();

  renderCalendar();

  renderWorkouts();

  renderHomeSummary();

  renderDashboard();


  handleHashRoute();
}


window.addEventListener(
  "hashchange",
  handleHashRoute
);


document.addEventListener(
  "DOMContentLoaded",
  initTrainingPage
);


/* =========================================================
   PUBLIC FUNCTIONS
========================================================= */

window.deletePlannedWorkout =
  deletePlannedWorkout;


window.deleteCompletedWorkout =
  deleteCompletedWorkout;


window.showPage =
  showPage;


window.navigateFuelTrack =
  navigate;
