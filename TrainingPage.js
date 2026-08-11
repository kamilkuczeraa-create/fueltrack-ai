/* =========================================================
   FuelTrack AI — TrainingPage.js
   Dashboard + treningi + cele żywieniowe + bilans
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

let calendarDate = new Date();
let selectedWorkoutScreens = [];


/* =========================================================
   HELPERS
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
    return date;
  }

  return `${parts[2]}.${parts[1]}.${parts[0]}`;
}


function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);

    if (!raw) {
      return fallback;
    }

    return JSON.parse(raw);

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


function saveGoals(goals) {
  localStorage.setItem(
    GOALS_KEY,
    JSON.stringify(goals)
  );
}


function showStatus(
  message,
  duration = 2500
) {
  const status =
    document.getElementById("status");

  if (!status) return;

  status.textContent = message;

  status.classList.remove("hidden");

  clearTimeout(showStatus.timer);

  showStatus.timer =
    setTimeout(() => {
      status.classList.add("hidden");
    }, duration);
}


/* =========================================================
   CELE ŻYWIENIOWE
========================================================= */

function getNutritionGoals() {
  const stored =
    loadJSON(
      GOALS_KEY,
      DEFAULT_GOALS
    );

  return {
    kcal: num(
      stored?.kcal ??
      stored?.calories ??
      stored?.calorieGoal ??
      stored?.dailyCalories ??
      DEFAULT_GOALS.kcal
    ),

    protein: num(
      stored?.protein ??
      stored?.proteinGoal ??
      stored?.dailyProtein ??
      DEFAULT_GOALS.protein
    ),

    carbs: num(
      stored?.carbs ??
      stored?.carbsGoal ??
      stored?.dailyCarbs ??
      DEFAULT_GOALS.carbs
    ),

    fat: num(
      stored?.fat ??
      stored?.fatGoal ??
      stored?.dailyFat ??
      DEFAULT_GOALS.fat
    )
  };
}


function setupNutritionGoals() {

  const goals =
    getNutritionGoals();


  const kcal =
    document.getElementById(
      "goalKcal"
    );

  const protein =
    document.getElementById(
      "goalProtein"
    );

  const carbs =
    document.getElementById(
      "goalCarbs"
    );

  const fat =
    document.getElementById(
      "goalFat"
    );


  if (kcal) {
    kcal.value = goals.kcal;
  }

  if (protein) {
    protein.value = goals.protein;
  }

  if (carbs) {
    carbs.value = goals.carbs;
  }

  if (fat) {
    fat.value = goals.fat;
  }


  const saveBtn =
    document.getElementById(
      "saveNutritionGoalsBtn"
    );


  if (saveBtn) {

    saveBtn.addEventListener(
      "click",
      saveNutritionGoalsFromForm
    );

  }
}


function saveNutritionGoalsFromForm() {

  const kcal =
    num(
      document.getElementById(
        "goalKcal"
      )?.value
    );

  const protein =
    num(
      document.getElementById(
        "goalProtein"
      )?.value
    );

  const carbs =
    num(
      document.getElementById(
        "goalCarbs"
      )?.value
    );

  const fat =
    num(
      document.getElementById(
        "goalFat"
      )?.value
    );


  if (
    kcal <= 0 ||
    protein <= 0 ||
    carbs <= 0 ||
    fat <= 0
  ) {

    alert(
      "Wszystkie cele muszą być większe od 0."
    );

    return;
  }


  const goals = {
    kcal,
    protein,
    carbs,
    fat
  };


  saveGoals(goals);

  renderDashboard();
  renderNutritionGoals();

  showStatus(
    "Cele żywieniowe zostały zapisane."
  );
}


/*
   Jeżeli index.html nie posiada jeszcze panelu
   celów, tworzymy go automatycznie.
*/

function ensureNutritionGoalsPanel() {

  const existing =
    document.getElementById(
      "nutritionGoalsPanel"
    );


  if (existing) {
    return;
  }


  const home =
    document.getElementById(
      "homePage"
    );


  if (!home) {
    return;
  }


  const panel =
    document.createElement("section");


  panel.id =
    "nutritionGoalsPanel";


  panel.style.cssText = `
    margin:20px 0;
    padding:20px;
    border:1px solid #e3e6ec;
    border-radius:18px;
    background:#ffffff;
    box-shadow:0 4px 18px rgba(0,0,0,0.05);
  `;


  panel.innerHTML = `

    <div style="
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:12px;
      margin-bottom:18px;
      flex-wrap:wrap;
    ">

      <div>

        <div style="
          font-size:20px;
          font-weight:800;
          color:#151922;
        ">
          🎯 Cele żywieniowe
        </div>

        <div style="
          margin-top:5px;
          font-size:13px;
          color:#777e8d;
        ">
          Ustaw cele raz. FuelTrack AI wykorzystuje je
          na całej stronie.
        </div>

      </div>

    </div>


    <div style="
      display:grid;
      grid-template-columns:
        repeat(auto-fit,minmax(140px,1fr));
      gap:12px;
    ">

      <label style="
        display:flex;
        flex-direction:column;
        gap:6px;
        font-size:13px;
        font-weight:700;
      ">

        Kalorie

        <input
          id="goalKcal"
          type="number"
          min="1"
          step="1"
          inputmode="numeric"
          style="
            width:100%;
            box-sizing:border-box;
            padding:11px 12px;
            border:1px solid #d9dde5;
            border-radius:10px;
            font-size:16px;
          "
        >

        <span style="
          color:#777e8d;
          font-size:12px;
          font-weight:500;
        ">
          kcal / dzień
        </span>

      </label>


      <label style="
        display:flex;
        flex-direction:column;
        gap:6px;
        font-size:13px;
        font-weight:700;
      ">

        Białko

        <input
          id="goalProtein"
          type="number"
          min="1"
          step="1"
          inputmode="numeric"
          style="
            width:100%;
            box-sizing:border-box;
            padding:11px 12px;
            border:1px solid #d9dde5;
            border-radius:10px;
            font-size:16px;
          "
        >

        <span style="
          color:#777e8d;
          font-size:12px;
          font-weight:500;
        ">
          g / dzień
        </span>

      </label>


      <label style="
        display:flex;
        flex-direction:column;
        gap:6px;
        font-size:13px;
        font-weight:700;
      ">

        Węglowodany

        <input
          id="goalCarbs"
          type="number"
          min="1"
          step="1"
          inputmode="numeric"
          style="
            width:100%;
            box-sizing:border-box;
            padding:11px 12px;
            border:1px solid #d9dde5;
            border-radius:10px;
            font-size:16px;
          "
        >

        <span style="
          color:#777e8d;
          font-size:12px;
          font-weight:500;
        ">
          g / dzień
        </span>

      </label>


      <label style="
        display:flex;
        flex-direction:column;
        gap:6px;
        font-size:13px;
        font-weight:700;
      ">

        Tłuszcz

        <input
          id="goalFat"
          type="number"
          min="1"
          step="1"
          inputmode="numeric"
          style="
            width:100%;
            box-sizing:border-box;
            padding:11px 12px;
            border:1px solid #d9dde5;
            border-radius:10px;
            font-size:16px;
          "
        >

        <span style="
          color:#777e8d;
          font-size:12px;
          font-weight:500;
        ">
          g / dzień
        </span>

      </label>

    </div>


    <button
      id="saveNutritionGoalsBtn"
      type="button"
      style="
        margin-top:16px;
        width:100%;
        border:0;
        border-radius:11px;
        padding:12px 16px;
        background:#3565e8;
        color:#ffffff;
        font-size:15px;
        font-weight:800;
        cursor:pointer;
      "
    >
      Zapisz cele żywieniowe
    </button>

  `;


  /*
     Wstawiamy panel na początku strony głównej,
     żeby był jednym centralnym miejscem ustawiania celów.
  */

  home.insertBefore(
    panel,
    home.firstChild
  );


  setupNutritionGoals();
}


function renderNutritionGoals() {

  const goals =
    getNutritionGoals();


  const kcal =
    document.getElementById(
      "goalKcal"
    );

  const protein =
    document.getElementById(
      "goalProtein"
    );

  const carbs =
    document.getElementById(
      "goalCarbs"
    );

  const fat =
    document.getElementById(
      "goalFat"
    );


  if (kcal) {
    kcal.value = goals.kcal;
  }

  if (protein) {
    protein.value = goals.protein;
  }

  if (carbs) {
    carbs.value = goals.carbs;
  }

  if (fat) {
    fat.value = goals.fat;
  }
}


/* =========================================================
   NAWIGACJA
========================================================= */

function showPage(page) {

  const home =
    document.getElementById(
      "homePage"
    );

  const nutrition =
    document.getElementById(
      "nutritionPage"
    );

  const training =
    document.getElementById(
      "trainingPage"
    );


  if (home) {
    home.classList.add("hidden");
  }

  if (nutrition) {
    nutrition.classList.add("hidden");
  }

  if (training) {
    training.classList.add("hidden");
  }


  if (
    page === "home" &&
    home
  ) {

    home.classList.remove("hidden");

    renderHomeSummary();
    renderNutritionGoals();
    renderDashboard();

  }


  if (
    page === "nutrition" &&
    nutrition
  ) {

    nutrition.classList.remove("hidden");

  }


  if (
    page === "training" &&
    training
  ) {

    training.classList.remove("hidden");

    renderCalendar();
    renderWorkouts();

  }
}


function setupNavigation() {

  const goTraining =
    document.getElementById(
      "goTraining"
    );

  const goNutrition =
    document.getElementById(
      "goNutrition"
    );

  const backHomeTraining =
    document.getElementById(
      "backHomeTraining"
    );

  const backHomeNutrition =
    document.getElementById(
      "backHomeNutrition"
    );


  if (goTraining) {

    goTraining.addEventListener(
      "click",
      () => {
        window.location.hash =
          "#training";
      }
    );

  }


  if (goNutrition) {

    goNutrition.addEventListener(
      "click",
      () => {
        window.location.hash =
          "#nutrition";
      }
    );

  }


  if (backHomeTraining) {

    backHomeTraining.addEventListener(
      "click",
      () => {
        window.location.hash = "";
      }
    );

  }


  if (backHomeNutrition) {

    backHomeNutrition.addEventListener(
      "click",
      () => {
        window.location.hash = "";
      }
    );

  }


  const lastWorkout =
    document.getElementById(
      "dashboardLastWorkout"
    );


  if (lastWorkout) {

    lastWorkout.addEventListener(
      "click",
      () => {
        window.location.hash =
          "#training";
      }
    );

  }


  const nextWorkout =
    document.getElementById(
      "dashboardNextWorkout"
    );


  if (nextWorkout) {

    nextWorkout.addEventListener(
      "click",
      () => {
        window.location.hash =
          "#training";
      }
    );

  }
}


/* =========================================================
   PLANOWANIE
========================================================= */

function setupPlanForm() {

  const planDate =
    document.getElementById(
      "planDate"
    );


  if (planDate) {
    planDate.value =
      getToday();
  }


  const savePlanBtn =
    document.getElementById(
      "savePlanBtn"
    );


  if (savePlanBtn) {

    savePlanBtn.addEventListener(
      "click",
      addPlannedWorkout
    );

  }
}


function addPlannedWorkout() {

  const date =
    document.getElementById(
      "planDate"
    )?.value ||
    getToday();


  const type =
    document.getElementById(
      "planType"
    )?.value ||
    "Easy";


  const name =
    document.getElementById(
      "planName"
    )?.value.trim() ||
    "";


  const calories =
    num(
      document.getElementById(
        "planCalories"
      )?.value
    );


  const distance =
    num(
      document.getElementById(
        "planDistance"
      )?.value
    );


  const note =
    document.getElementById(
      "planNote"
    )?.value.trim() ||
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
    `Dodano trening do planu: ${formatDate(date)}`
  );
}


function clearPlanForm() {

  const fields = [
    "planName",
    "planCalories",
    "planDistance",
    "planNote"
  ];


  fields.forEach(id => {

    const el =
      document.getElementById(id);

    if (el) {
      el.value = "";
    }

  });


  const date =
    document.getElementById(
      "planDate"
    );


  if (date) {
    date.value =
      getToday();
  }


  const type =
    document.getElementById(
      "planType"
    );


  if (type) {
    type.value =
      "Easy";
  }
}


function deletePlannedWorkout(id) {

  plannedWorkouts =
    plannedWorkouts.filter(
      workout =>
        String(workout.id) !==
        String(id)
    );


  saveData();

  renderCalendar();
  renderDashboard();

  showStatus(
    "Usunięto zaplanowany trening."
  );
}


function getPlansForDate(date) {

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
    document.getElementById(
      "prevMonth"
    );

  const next =
    document.getElementById(
      "nextMonth"
    );


  if (prev) {

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


  if (next) {

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
    document.getElementById(
      "calendarTitle"
    );

  const grid =
    document.getElementById(
      "calendarGrid"
    );


  if (!title || !grid) {
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


  grid.innerHTML = "";


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
      (startDay +
        daysInMonth) /
      7
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


    if (index < startDay) {

      dayNumber =
        previousMonthDays -
        startDay +
        index +
        1;


      const d =
        new Date(
          year,
          month - 1,
          dayNumber
        );


      date =
        dateToISO(d);

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


      const d =
        new Date(
          year,
          month + 1,
          dayNumber
        );


      date =
        dateToISO(d);

      isCurrentMonth =
        false;

    } else {

      dayNumber =
        index -
        startDay +
        1;


      const d =
        new Date(
          year,
          month,
          dayNumber
        );


      date =
        dateToISO(d);

    }


    if (!isCurrentMonth) {
      cell.style.opacity = "0.45";
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
          workout.date === date
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
          workout.note || "";


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
          document.getElementById(
            "planDate"
          );


        if (planDate) {
          planDate.value =
            date;
        }


        const workoutDate =
          document.getElementById(
            "wDate"
          );


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
   WYKONANE TRENINGI
========================================================= */

function setupWorkoutForm() {

  const addBtn =
    document.getElementById(
      "addWorkoutBtn"
    );

  const cancelBtn =
    document.getElementById(
      "cancelWorkoutBtn"
    );

  const saveBtn =
    document.getElementById(
      "saveWorkoutBtn"
    );


  if (addBtn) {

    addBtn.addEventListener(
      "click",
      () => {

        const form =
          document.getElementById(
            "workoutForm"
          );


        if (form) {

          form.classList.toggle(
            "hidden"
          );

        }


        const date =
          document.getElementById(
            "wDate"
          );


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


  if (cancelBtn) {

    cancelBtn.addEventListener(
      "click",
      () => {

        clearWorkoutForm();


        const form =
          document.getElementById(
            "workoutForm"
          );


        if (form) {

          form.classList.add(
            "hidden"
          );

        }

      }
    );

  }


  if (saveBtn) {

    saveBtn.addEventListener(
      "click",
      addCompletedWorkout
    );

  }


  setupScreens();
}


function addCompletedWorkout() {

  const date =
    document.getElementById(
      "wDate"
    )?.value ||
    getToday();


  const type =
    document.getElementById(
      "wType"
    )?.value.trim() ||
    "Trening";


  const distance =
    num(
      document.getElementById(
        "wDistance"
      )?.value
    );


  const time =
    document.getElementById(
      "wTime"
    )?.value.trim() ||
    "";


  const pace =
    document.getElementById(
      "wPace"
    )?.value.trim() ||
    "";


  const hr =
    num(
      document.getElementById(
        "wHr"
      )?.value
    );


  const maxHr =
    num(
      document.getElementById(
        "wMaxHr"
      )?.value
    );


  const calories =
    num(
      document.getElementById(
        "wCalories"
      )?.value
    );


  const cadence =
    num(
      document.getElementById(
        "wCadence"
      )?.value
    );


  const elevation =
    num(
      document.getElementById(
        "wElevation"
      )?.value
    );


  const note =
    document.getElementById(
      "wNote"
    )?.value.trim() ||
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
      [...selectedWorkoutScreens]

  };


  completedWorkouts.push(
    workout
  );

  saveData();

  clearWorkoutForm();


  const form =
    document.getElementById(
      "workoutForm"
    );


  if (form) {

    form.classList.add(
      "hidden"
    );

  }


  renderCalendar();
  renderWorkouts();
  renderDashboard();


  showStatus(
    `Zapisano trening: ${formatDate(date)}`
  );
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

    const el =
      document.getElementById(id);

    if (el) {
      el.value = "";
    }

  });


  const date =
    document.getElementById(
      "wDate"
    );


  if (date) {
    date.value =
      getToday();
  }


  const file =
    document.getElementById(
      "wScreens"
    );


  if (file) {
    file.value = "";
  }


  selectedWorkoutScreens = [];

  renderScreensPreview();
}


function deleteCompletedWorkout(id) {

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
        String(workout.id) !==
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
    document.getElementById(
      "wScreens"
    );


  if (!input) {
    return;
  }


  input.addEventListener(
    "change",
    event => {

      const files =
        Array.from(
          event.target.files || []
        );


      if (files.length > 4) {

        alert(
          "Możesz dodać maksymalnie 4 screeny."
        );

        input.value = "";

        selectedWorkoutScreens = [];

        renderScreensPreview();

        return;
      }


      selectedWorkoutScreens = [];


      files.forEach(
        file => {

          const reader =
            new FileReader();


          reader.onload =
            () => {

              selectedWorkoutScreens.push(
                reader.result
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
    document.getElementById(
      "screensPreview"
    );


  if (!preview) {
    return;
  }


  preview.innerHTML = "";


  selectedWorkoutScreens
    .slice(0, 4)
    .forEach(
      src => {

        const img =
          document.createElement(
            "img"
          );


        img.src = src;

        img.alt =
          "Screen z Garmina";


        preview.appendChild(
          img
        );

      }
    );
}


/* =========================================================
   WYSWIETLANIE TRENINGÓW
========================================================= */

function renderWorkouts(
  filterDate = null
) {

  const container =
    document.getElementById(
      "workouts"
    );


  if (!container) {
    return;
  }


  let workouts =
    [...completedWorkouts];


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
    workouts.length === 0
  ) {

    container.innerHTML =
      `
      <div class="empty">
        Brak zapisanych treningów.
      </div>
      `;

    return;
  }


  container.innerHTML =
    workouts
      .map(
        workout =>
          renderWorkoutCard(
            workout
          )
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
          workout.distance > 0
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
          workout.hr > 0
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
          workout.maxHr > 0
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
          workout.calories > 0
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
          workout.cadence > 0
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
          workout.elevation > 0
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
                    `
                    <img
                      src="${esc(src)}"
                      alt="Screen z Garmina"
                    >
                    `
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
        "
      >
        Usuń
      </button>

    </div>

  `;
}


/* =========================================================
   ŻYWIENIE — DANE
========================================================= */

function getStoredFood() {

  return loadJSON(
    FOOD_KEY,
    []
  );
}


function findFoodDay(date) {

  const food =
    getStoredFood();


  if (!food) {
    return null;
  }


  /*
     Wariant 1:
     tablica obiektów:
     [
       {
         date: "2026-08-11",
         kcal: ...
       }
     ]
  */

  if (Array.isArray(food)) {

    const direct =
      food.find(
        item =>
          item &&
          (
            item.date === date ||
            item.day === date ||
            item.data === date
          )
      );


    if (direct) {
      return direct;
    }


    /*
       Możliwe, że import Fitatu zapisuje
       pojedyncze posiłki zamiast sum dnia.
       Wtedy agregujemy je po dacie.
    */

    const sameDay =
      food.filter(
        item =>
          item &&
          (
            item.date === date ||
            item.day === date ||
            item.data === date
          )
      );


    if (sameDay.length > 0) {

      return {
        date,

        kcal:
          sameDay.reduce(
            (sum, item) =>
              sum +
              num(
                item.kcal ??
                item.calories ??
                item.energy
              ),
            0
          ),

        protein:
          sameDay.reduce(
            (sum, item) =>
              sum +
              num(
                item.protein ??
                item.proteins
              ),
            0
          ),

        carbs:
          sameDay.reduce(
            (sum, item) =>
              sum +
              num(
                item.carbs ??
                item.carbohydrates
              ),
            0
          ),

        fat:
          sameDay.reduce(
            (sum, item) =>
              sum +
              num(
                item.fat ??
                item.fats
              ),
            0
          )
      };

    }

  }


  /*
     Wariant 2:
     obiekt:
     {
       "2026-08-11": {...}
     }
  */

  if (
    !Array.isArray(food) &&
    typeof food === "object" &&
    food[date]
  ) {

    return food[date];

  }


  return null;
}


function extractNutrition(date) {

  const day =
    findFoodDay(date);


  if (!day) {

    return {
      kcal: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    };

  }


  return {

    kcal:
      num(
        day.kcal ??
        day.calories ??
        day.energy ??
        day.totalKcal ??
        day.totalCalories ??
        0
      ),

    protein:
      num(
        day.protein ??
        day.proteins ??
        day.totalProtein ??
        0
      ),

    carbs:
      num(
        day.carbs ??
        day.carbohydrates ??
        day.totalCarbs ??
        0
      ),

    fat:
      num(
        day.fat ??
        day.fats ??
        day.totalFat ??
        0
      )

  };
}


/* =========================================================
   INTELIGENTNE KOLORY
========================================================= */

/*
   0–84.99%  = zielony
   85–100%   = pomarańczowy
   >100%     = czerwony

   Dzięki temu użytkownik nie dostaje czerwonego
   koloru dopóki faktycznie nie przekroczy celu.
*/

function getNutritionStatus(
  value,
  goal
) {

  const current =
    num(value);

  const target =
    num(goal);


  if (target <= 0) {

    return {
      className: "low",
      percent: 0,
      label: "brak celu"
    };

  }


  const percent =
    (current / target) * 100;


  if (percent > 100) {

    return {
      className: "danger",
      percent,
      label: "przekroczono cel"
    };

  }


  if (percent >= 85) {

    return {
      className: "warning",
      percent,
      label: "zbliżasz się do celu"
    };

  }


  return {
    className: "good",
    percent,
    label: "dobry zakres"
  };
}


function applyDashboardStatus(
  bar,
  percent,
  remaining,
  value,
  goal,
  unit = ""
) {

  if (
    !bar ||
    !percent ||
    !remaining ||
    !value
  ) {
    return;
  }


  const current =
    num(value);


  const target =
    num(goal);


  value.textContent =
    `${fmt(current)} / ${fmt(target)}${unit}`;


  if (target <= 0) {

    bar.style.width = "0%";

    bar.className =
      "dashboard-progress-bar low";

    percent.textContent = "—";

    remaining.textContent =
      "brak celu";

    return;

  }


  const status =
    getNutritionStatus(
      current,
      target
    );


  const visualPercent =
    Math.min(
      100,
      Math.max(
        0,
        status.percent
      )
    );


  bar.style.width =
    `${visualPercent}%`;


  bar.className =
    `dashboard-progress-bar ${status.className}`;


  percent.textContent =
    `${Math.round(
      status.percent
    )}%`;


  const difference =
    target - current;


  if (difference > 0) {

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
      `przekroczono o ${fmt(
        Math.abs(difference)
      )}${unit}`;

  }
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
    document.getElementById(
      barId
    );


  const percent =
    document.getElementById(
      percentId
    );


  const remaining =
    document.getElementById(
      remainingId
    );


  const valueElement =
    document.getElementById(
      valueId
    );


  applyDashboardStatus(
    bar,
    percent,
    remaining,
    valueElement,
    value,
    goal,
    unit
  );
}


/* =========================================================
   DASHBOARD
========================================================= */

function getActiveNutritionDate() {

  const today =
    getToday();


  const todayNutrition =
    extractNutrition(
      today
    );


  if (
    todayNutrition.kcal > 0 ||
    todayNutrition.protein > 0 ||
    todayNutrition.carbs > 0 ||
    todayNutrition.fat > 0
  ) {

    return today;

  }


  const stored =
    getStoredFood();


  if (
    Array.isArray(stored)
  ) {

    const dates =
      stored
        .map(
          item =>
            item?.date ||
            item?.day
        )
        .filter(Boolean)
        .sort()
        .reverse();


    if (dates.length) {
      return dates[0];
    }

  }


  if (
    stored &&
    typeof stored === "object" &&
    !Array.isArray(stored)
  ) {

    const dates =
      Object.keys(stored)
        .sort()
        .reverse();


    if (dates.length) {
      return dates[0];
    }

  }


  return today;
}


function renderDashboard() {

  const activeDate =
    getActiveNutritionDate();


  const nutrition =
    extractNutrition(
      activeDate
    );


  const goals =
    getNutritionGoals();


  /* =====================================================
     PASKI
  ===================================================== */

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


  /* =====================================================
     TRENINGI
  ===================================================== */

  renderDashboardTraining();


  /* =====================================================
     BILANS ENERGETYCZNY
  ===================================================== */

  renderEnergyBalance(
    activeDate,
    nutrition,
    goals
  );
}


/* =========================================================
   BILANS ENERGETYCZNY
========================================================= */

function renderEnergyBalance(
  date,
  nutrition,
  goals
) {

  const sameDayWorkouts =
    completedWorkouts.filter(
      workout =>
        workout.date === date
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
    num(
      nutrition.kcal
    );


  /*
     Podstawowy bilans:

     zjedzone - spalone treningiem
  */

  const netCalories =
    foodCalories -
    workoutCalories;


  /*
     Bilans względem celu:

     cel - (zjedzone - trening)

     Dodatnia wartość = zostało
     Ujemna wartość = przekroczono
  */

  const remainingToGoal =
    goals.kcal -
    netCalories;


  const balanceEl =
    document.getElementById(
      "dashboardBalance"
    );


  const balanceIcon =
    document.getElementById(
      "dashboardBalanceIcon"
    );


  const foodEl =
    document.getElementById(
      "dashboardBalanceFood"
    );


  const workoutEl =
    document.getElementById(
      "dashboardBalanceWorkout"
    );


  const goalEl =
    document.getElementById(
      "dashboardBalanceGoal"
    );


  const remainingEl =
    document.getElementById(
      "dashboardBalanceRemaining"
    );


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


  if (remainingEl) {

    if (goals.kcal <= 0) {

      remainingEl.textContent =
        "brak celu";

    } else if (
      remainingToGoal > 0
    ) {

      remainingEl.textContent =
        `zostało ${fmt(
          remainingToGoal
        )} kcal`;

    } else if (
      remainingToGoal === 0
    ) {

      remainingEl.textContent =
        "cel osiągnięty";

    } else {

      remainingEl.textContent =
        `przekroczono o ${fmt(
          Math.abs(
            remainingToGoal
          )
        )} kcal`;

    }

  }


  /*
     Kolor bilansu.

     Zielony:
     jesteśmy w rozsądnym zakresie celu.

     Pomarańczowy:
     jesteśmy blisko limitu.

     Czerwony:
     cel został przekroczony.

     Przy bilansie energetycznym liczymy
     procent względem celu.
  */

  const ratio =
    goals.kcal > 0
      ? (netCalories / goals.kcal) * 100
      : 0;


  let status =
    "good";


  if (
    goals.kcal <= 0
  ) {

    status =
      "low";

  } else if (
    ratio > 100
  ) {

    status =
      "danger";

  } else if (
    ratio >= 85
  ) {

    status =
      "warning";

  }


  if (balanceEl) {

    balanceEl.textContent =
      `${fmt(
        netCalories
      )} kcal`;

    balanceEl.classList.remove(
      "good",
      "warning",
      "danger",
      "low"
    );

    balanceEl.classList.add(
      status
    );

  }


  if (balanceIcon) {

    if (status === "danger") {

      balanceIcon.textContent =
        "🔴";

    } else if (
      status === "warning"
    ) {

      balanceIcon.textContent =
        "🟠";

    } else if (
      status === "good"
    ) {

      balanceIcon.textContent =
        "🟢";

    } else {

      balanceIcon.textContent =
        "⚖️";

    }

  }


  /*
     Jeżeli HTML ma dodatkowy element
     na procent bilansu, również go obsługujemy.
  */

  const balancePercent =
    document.getElementById(
      "dashboardBalancePercent"
    );


  if (balancePercent) {

    balancePercent.textContent =
      goals.kcal > 0
        ? `${Math.round(
            ratio
          )}% celu`
        : "brak celu";

  }
}


/* =========================================================
   DASHBOARD — TRENINGI
========================================================= */

function renderDashboardTraining() {

  const lastTitle =
    document.getElementById(
      "dashboardLastWorkoutTitle"
    );


  const lastMain =
    document.getElementById(
      "dashboardLastWorkoutMain"
    );


  const lastDate =
    document.getElementById(
      "dashboardLastWorkoutDate"
    );


  const nextTitle =
    document.getElementById(
      "dashboardNextWorkoutTitle"
    );


  const nextMain =
    document.getElementById(
      "dashboardNextWorkoutMain"
    );


  const nextDate =
    document.getElementById(
      "dashboardNextWorkoutDate"
    );


  /* =====================================================
     OSTATNI TRENING
  ===================================================== */

  const sortedCompleted =
    [...completedWorkouts]
      .filter(
        workout =>
          workout &&
          workout.date
      )
      .sort(
        (a, b) =>
          String(b.date)
            .localeCompare(
              String(a.date)
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
        `
        <div class="dashboard-empty">
          Nie zapisano jeszcze wykonanego treningu.
        </div>
        `;

    }


    if (lastDate) {
      lastDate.textContent = "";
    }

  } else {

    if (lastTitle) {

      lastTitle.textContent =
        lastWorkout.type ||
        "Trening";

    }


    const details = [];


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
          ? details.join(" · ")
          : "Szczegóły treningu zapisane.";

    }


    if (lastDate) {

      lastDate.textContent =
        formatDate(
          lastWorkout.date
        );

    }

  }


  /* =====================================================
     NAJBLIŻSZY PLAN
  ===================================================== */

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
          String(a.date)
            .localeCompare(
              String(b.date)
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
        `
        <div class="dashboard-empty">
          Nie masz jeszcze zaplanowanego treningu.
        </div>
        `;

    }


    if (nextDate) {
      nextDate.textContent = "";
    }


    return;
  }


  if (nextTitle) {

    nextTitle.textContent =
      nextWorkout.name ||
      nextWorkout.type ||
      "Trening";

  }


  const nextDetails = [];


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
        ? nextDetails.join(" · ")
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
   STRONA GŁÓWNA — STARE PODSUMOWANIE
========================================================= */

function renderHomeSummary() {

  const sorted =
    [...completedWorkouts]
      .filter(
        workout =>
          workout &&
          workout.date
      )
      .sort(
        (a, b) =>
          String(b.date)
            .localeCompare(
              String(a.date)
            )
      );


  const lastWorkout =
    sorted[0];


  const burned =
    document.getElementById(
      "homeBurned"
    );


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
   PORZĄDKOWANIE STARYCH CELÓW
========================================================= */

/*
   Jeżeli stary HTML posiada osobne pola celu
   przy poszczególnych kafelkach, nie usuwamy danych.
   Ukrywamy natomiast ich kontenery tylko wtedy,
   gdy są jednoznacznie oznaczone jako stare pola celu.

   Dzięki temu jeden centralny panel jest źródłem prawdy.
*/

function cleanupDuplicateGoalControls() {

  const selectors = [

    ".goal-kcal-control",
    ".goal-protein-control",
    ".goal-carbs-control",
    ".goal-fat-control",

    "[data-goal-control]",
    "[data-duplicate-goal]"

  ];


  selectors.forEach(
    selector => {

      document
        .querySelectorAll(selector)
        .forEach(
          element => {

            /*
               Nie ukrywamy naszego centralnego panelu.
            */

            if (
              element.closest(
                "#nutritionGoalsPanel"
              )
            ) {
              return;
            }


            element.style.display =
              "none";

          }
        );

    }
  );
}


/* =========================================================
   START
========================================================= */

function initTrainingPage() {

  /*
     Najpierw tworzymy / odnajdujemy centralny
     panel celów.
  */

  ensureNutritionGoalsPanel();

  setupNutritionGoals();

  cleanupDuplicateGoalControls();

  setupNavigation();

  setupCalendar();

  setupPlanForm();

  setupWorkoutForm();

  renderNutritionGoals();

  renderCalendar();

  renderWorkouts();

  renderHomeSummary();

  renderDashboard();


  if (
    window.location.hash ===
    "#training"
  ) {

    showPage(
      "training"
    );

  } else if (
    window.location.hash ===
    "#nutrition"
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
   HASH
========================================================= */

window.addEventListener(
  "hash
