/* =========================================================
   FuelTrack AI — TrainingPage.js
   Dashboard + treningi
========================================================= */

const WORKOUT_KEY = "fueltrack_workouts_v04";
const PLAN_KEY = "fueltrack_training_plan_v01";
const FOOD_KEY = "fueltrack_food_v04";
const GOALS_KEY = "fueltrack_goals_v04";

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

    const raw =
      localStorage.getItem(key);

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

      status.classList.add(
        "hidden"
      );

    }, duration);
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
    home.classList.add(
      "hidden"
    );
  }

  if (nutrition) {
    nutrition.classList.add(
      "hidden"
    );
  }

  if (training) {
    training.classList.add(
      "hidden"
    );
  }


  if (
    page === "home" &&
    home
  ) {

    home.classList.remove(
      "hidden"
    );

    renderHomeSummary();
    renderDashboard();

  }


  if (
    page === "nutrition" &&
    nutrition
  ) {

    nutrition.classList.remove(
      "hidden"
    );

  }


  if (
    page === "training" &&
    training
  ) {

    training.classList.remove(
      "hidden"
    );

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

        window.location.hash =
          "";

      }
    );

  }


  if (backHomeNutrition) {

    backHomeNutrition.addEventListener(
      "click",
      () => {

        window.location.hash =
          "";

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
      selectedWorkoutScreens
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
      `<div class="empty">
        Brak zapisanych treningów.
      </div>`;

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
                      src="${src}"
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
   DASHBOARD — POMOCNICZE
========================================================= */

function getNutritionGoals() {

  const goals =
    loadJSON(
      GOALS_KEY,
      {}
    );


  /*
    Obsługujemy kilka możliwych nazw,
    żeby nie rozwalić wcześniejszych
    danych aplikacji.
  */

  const kcal =
    num(
      goals.kcal ??
      goals.calories ??
      goals.calorieGoal ??
      goals.dailyCalories ??
      0
    );


  const protein =
    num(
      goals.protein ??
      goals.proteinGoal ??
      goals.dailyProtein ??
      0
    );


  const carbs =
    num(
      goals.carbs ??
      goals.carbsGoal ??
      goals.dailyCarbs ??
      0
    );


  const fat =
    num(
      goals.fat ??
      goals.fatGoal ??
      goals.dailyFat ??
      0
    );


  return {
    kcal,
    protein,
    carbs,
    fat
  };
}


function getStoredFood() {

  return loadJSON(
    FOOD_KEY,
    []
  );
}


function findFoodDay(
  date
) {

  const food =
    getStoredFood();


  if (
    !Array.isArray(food)
  ) {
    return null;
  }


  /*
    Najczęstszy wariant:
    tablica obiektów posiadających date.
  */

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
    Drugi wariant:
    obiekt:
    {
      "2026-08-11": {...}
    }
  */

  if (
    !Array.isArray(food) &&
    food &&
    food[date]
  ) {

    return food[date];

  }


  return null;
}


function extractNutrition(
  date
) {

  const day =
    findFoodDay(
      date
    );


  if (!day) {

    return {
      kcal: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    };

  }


  /*
    Obsługa różnych nazw pól.
  */

  const kcal =
    num(
      day.kcal ??
      day.calories ??
      day.energy ??
      day.totalKcal ??
      0
    );


  const protein =
    num(
      day.protein ??
      day.proteins ??
      day.totalProtein ??
      0
    );


  const carbs =
    num(
      day.carbs ??
      day.carbohydrates ??
      day.totalCarbs ??
      0
    );


  const fat =
    num(
      day.fat ??
      day.fats ??
      day.totalFat ??
      0
    );


  return {
    kcal,
    protein,
    carbs,
    fat
  };
}


/* =========================================================
   DASHBOARD — PASEK
========================================================= */

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
    `${fmt(current)} / ${fmt(target)}${unit}`;


  if (
    target <= 0
  ) {

    bar.style.width =
      "0%";

    bar.className =
      "dashboard-progress-bar low";

    percent.textContent =
      "—";

    remaining.textContent =
      "brak celu";

    return;
  }


  const rawPercent =
    (current / target) * 100;


  const visualPercent =
    Math.min(
      100,
      Math.max(
        0,
        rawPercent
      )
    );


  bar.style.width =
    `${visualPercent}%`;


  bar.className =
    "dashboard-progress-bar";


  if (
    rawPercent < 80
  ) {

    bar.classList.add(
      "low"
    );

  } else if (
    rawPercent <= 100
  ) {

    bar.classList.add(
      "good"
    );

  } else if (
    rawPercent <= 110
  ) {

    bar.classList.add(
      "warning"
    );

  } else {

    bar.classList.add(
      "danger"
    );

  }


  percent.textContent =
    `${Math.round(
      rawPercent
    )}%`;


  const difference =
    target - current;


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
        Math.abs(difference)
      )}${unit}`;

  }
}


/* =========================================================
   DASHBOARD
========================================================= */

function renderDashboard() {

  const today =
    getToday();


  const nutrition =
    extractNutrition(
      today
    );


  const goals =
    getNutritionGoals();


  /*
    Jeżeli bieżący dzień nie ma danych,
    szukamy ostatniego dnia żywieniowego.
  */

  let activeDate =
    today;


  if (
    nutrition.kcal === 0 &&
    nutrition.protein === 0 &&
    nutrition.carbs === 0 &&
    nutrition.fat === 0
  ) {

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


      if (
        dates.length
      ) {

        activeDate =
          dates[0];

      }

    }

  }


  const activeNutrition =
    extractNutrition(
      activeDate
    );


  /*
    KAFELKI
  */

  setDashboardProgress(
    "dashKcalBar",
    "dashKcalPercent",
    "dashKcalRemaining",
    "dashKcalValue",
    activeNutrition.kcal,
    goals.kcal,
    ""
  );


  setDashboardProgress(
    "dashProteinBar",
    "dashProteinPercent",
    "dashProteinRemaining",
    "dashProteinValue",
    activeNutrition.protein,
    goals.protein,
    " g"
  );


  setDashboardProgress(
    "dashCarbsBar",
    "dashCarbsPercent",
    "dashCarbsRemaining",
    "dashCarbsValue",
    activeNutrition.carbs,
    goals.carbs,
    " g"
  );


  setDashboardProgress(
    "dashFatBar",
    "dashFatPercent",
    "dashFatRemaining",
    "dashFatValue",
    activeNutrition.fat,
    goals.fat,
    " g"
  );


  /*
    TRENINGI
  */

  renderDashboardTraining();


  /*
    BILANS
  */

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
    activeNutrition.kcal;


  const balance =
    foodCalories -
    workoutCalories;


  const balanceEl =
    document.getElementById(
      "dashboardBalance"
    );


  const balanceIcon =
    document.getElementById(
      "dashboardBalanceIcon"
    );


  if (balanceEl) {

    if (
      balance > 0
    ) {

      balanceEl.textContent =
        `+${fmt(balance)} kcal`;

    } else if (
      balance < 0
    ) {

      balanceEl.textContent =
        `${fmt(balance)} kcal`;

    } else {

      balanceEl.textContent =
        "0 kcal";

    }

  }


  if (balanceIcon) {

    if (
      balance > 500
    ) {

      balanceIcon.textContent =
        "🔴";

    } else if (
      balance > 0
    ) {

      balanceIcon.textContent =
        "🟠";

    } else if (
      balance < 0
    ) {

      balanceIcon.textContent =
        "🟢";

    } else {

      balanceIcon.textContent =
        "⚖️";

    }

  }


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


  /*
    OSTATNI TRENING
  */

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


  /*
    NAJBLIŻSZY PLAN
  */

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


  if (!lastWorkout) {

    const burned =
      document.getElementById(
        "homeBurned"
      );


    if (burned) {

      burned.textContent =
        "0 kcal";

    }


  } else {

    const burned =
      document.getElementById(
        "homeBurned"
      );


    if (burned) {

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

  }
}


/* =========================================================
   START
========================================================= */

function initTrainingPage() {

  setupNavigation();

  setupCalendar();

  setupPlanForm();

  setupWorkoutForm();

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
  "hashchange",
  () => {

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
);


/* =========================================================
   START DOM
========================================================= */

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
