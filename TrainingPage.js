/* =========================================================
   FuelTrack AI — TrainingPage.js
   Vanilla JS
   Wersja: v0.5
========================================================= */

const WORKOUT_KEY = "fueltrack_workouts_v04";
const PLAN_KEY = "fueltrack_training_plan_v01";
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

  if (parts.length !== 3) return date;

  return `${parts[2]}.${parts[1]}.${parts[0]}`;
}

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);

    if (!raw) return fallback;

    const parsed = JSON.parse(raw);

    return parsed;
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
      status.classList.add("hidden");
    }, duration);
}

/* =========================================================
   NAWIGACJA
========================================================= */

function showPage(page) {
  const home =
    document.getElementById("homePage");

  const nutrition =
    document.getElementById("nutritionPage");

  const training =
    document.getElementById("trainingPage");

  if (home) {
    home.classList.add("hidden");
  }

  if (nutrition) {
    nutrition.classList.add("hidden");
  }

  if (training) {
    training.classList.add("hidden");
  }

  if (page === "home" && home) {
    home.classList.remove("hidden");

    renderHomeSummary();
  }

  if (page === "nutrition" && nutrition) {
    nutrition.classList.remove("hidden");
  }

  if (page === "training" && training) {
    training.classList.remove("hidden");

    renderCalendar();
    renderWorkouts();
  }
}

function setupNavigation() {
  const goTraining =
    document.getElementById("goTraining");

  const goNutrition =
    document.getElementById("goNutrition");

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
          "training";

        showPage("training");
      }
    );
  }

  if (goNutrition) {
    goNutrition.addEventListener(
      "click",
      () => {
        window.location.hash =
          "nutrition";

        showPage("nutrition");
      }
    );
  }

  if (backHomeTraining) {
    backHomeTraining.addEventListener(
      "click",
      () => {
        window.location.hash = "";

        showPage("home");
        renderHomeSummary();
      }
    );
  }

  if (backHomeNutrition) {
    backHomeNutrition.addEventListener(
      "click",
      () => {
        window.location.hash = "";

        showPage("home");
        renderHomeSummary();
      }
    );
  }
}

/* =========================================================
   PLANOWANIE TRENINGÓW
========================================================= */

function setupPlanForm() {
  const planDate =
    document.getElementById("planDate");

  if (planDate) {
    planDate.value = getToday();
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

  showStatus(
    `Dodano trening do planu: ${formatDate(
      date
    )}`
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
    date.value = getToday();
  }

  const type =
    document.getElementById(
      "planType"
    );

  if (type) {
    type.value = "Easy";
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

  if (!title || !grid) return;

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
      (startDay + daysInMonth) /
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

    cell.appendChild(number);

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
          "calendar-event planned";

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
          "calendar-event completed";

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
      date === getToday()
    ) {
      cell.classList.add(
        "calendar-today"
      );
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

    grid.appendChild(cell);
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

  renderHomeSummary();

  showStatus(
    `Zapisano trening: ${formatDate(
      date
    )}`
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
      document.getElementById(
        id
      );

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

  if (!confirmed) return;

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
  renderHomeSummary();

  showStatus(
    "Usunięto wykonany trening."
  );
}

/* =========================================================
   SCREENY Z GARMINA
========================================================= */

function setupScreens() {
  const input =
    document.getElementById(
      "wScreens"
    );

  if (!input) return;

  input.addEventListener(
    "change",
    event => {
      const files =
        Array.from(
          event.target.files ||
            []
        );

      if (files.length > 4) {
        alert(
          "Możesz dodać maksymalnie 4 screeny."
        );

        input.value = "";

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

          reader.onload = () => {
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

  if (!preview) return;

  preview.innerHTML = "";

  selectedWorkoutScreens
    .slice(0, 4)
    .forEach(src => {
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
    });
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

  if (!container) return;

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
      String(b.date).localeCompare(
        String(a.date)
      )
  );

  if (workouts.length === 0) {
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

        <div class="workout-date">
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
          workout.hr > 0
            ? `
              <div>
                <small>Śr. HR</small>
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
          workout.maxHr > 0
            ? `
              <div>
                <small>Max HR</small>
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
          workout.calories > 0
            ? `
              <div>
                <small>Spalone</small>
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
          workout.cadence > 0
            ? `
              <div>
                <small>Kadencja</small>
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
          workout.elevation > 0
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
            <div class="workout-note">
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
        class="delete-workout-btn"
      >
        Usuń
      </button>

    </div>
  `;
}

/* =========================================================
   KALENDARZ — PLAN + WYKONANE
========================================================= */

function renderPlannedListForDate(
  date
) {
  return getPlansForDate(
    date
  );
}

/* =========================================================
   STRONA GŁÓWNA
========================================================= */

/*
   Domyślne cele.

   Jeżeli aplikacja ma już zapisane cele
   w fueltrack_goals_v04, zostaną użyte
   automatycznie.
*/

function getNutritionGoals() {
  const saved =
    loadJSON(
      GOALS_KEY,
      {}
    );

  return {
    kcal:
      num(
        saved.kcal ??
        saved.calories ??
        saved.energy ??
        2200
      ) || 2200,

    protein:
      num(
        saved.protein ??
        saved.proteinGoal ??
        160
      ) || 160,

    carbs:
      num(
        saved.carbs ??
        saved.carbsGoal ??
        220
      ) || 220,

    fat:
      num(
        saved.fat ??
        saved.fatGoal ??
        70
      ) || 70
  };
}

/*
   Pobiera aktualną wartość z kafelka.

   Dzięki temu działa również wtedy,
   gdy główna logika żywieniowa wcześniej
   wstawiła wartość do homeCalories,
   homeProtein itd.
*/

function getHomeNumericValue(
  elementId
) {
  const element =
    document.getElementById(
      elementId
    );

  if (!element) return 0;

  return num(
    element.textContent
  );
}

function getProgressPercent(
  value,
  goal
) {
  if (
    !goal ||
    goal <= 0
  ) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(
      100,
      (value / goal) * 100
    )
  );
}

/*
   Kolor paska:

   0–49%  → niebieski
   50–79% → zielony
   80–99% → zielony
   100%+  → pomarańczowy

   Dla makro oznacza to:
   im bliżej celu, tym bardziej
   kafelek jest "pełny".
*/

function getProgressState(
  percent
) {
  if (percent >= 100) {
    return "over";
  }

  if (percent >= 80) {
    return "good";
  }

  if (percent >= 50) {
    return "medium";
  }

  return "low";
}

function updateHomeProgress(
  cardId,
  barId,
  percentId,
  value,
  goal
) {
  const card =
    document.getElementById(
      cardId
    );

  const bar =
    document.getElementById(
      barId
    );

  const percentLabel =
    document.getElementById(
      percentId
    );

  if (!card || !bar) return;

  const percent =
    getProgressPercent(
      value,
      goal
    );

  const state =
    getProgressState(
      percent
    );

  card.classList.remove(
    "progress-low",
    "progress-medium",
    "progress-good",
    "progress-over"
  );

  card.classList.add(
    `progress-${state}`
  );

  bar.style.width =
    `${percent}%`;

  if (percentLabel) {
    percentLabel.textContent =
      `${Math.round(
        percent
      )}%`;
  }
}

function updateHomeBalance(
  balance
) {
  const card =
    document.getElementById(
      "homeBalanceCard"
    );

  const bar =
    document.getElementById(
      "homeBalanceBar"
    );

  const label =
    document.getElementById(
      "homeBalancePercent"
    );

  if (!card || !bar) return;

  card.classList.remove(
    "balance-good",
    "balance-warning",
    "balance-danger"
  );

  /*
     Bilans:

     okolice 0 → zielony
     umiarkowane odchylenie → żółty
     duże odchylenie → czerwony
  */

  const absolute =
    Math.abs(
      num(balance)
    );

  let width =
    100 -
    Math.min(
      100,
      (absolute / 1000) *
        100
    );

  if (
    !Number.isFinite(width)
  ) {
    width = 0;
  }

  bar.style.width =
    `${Math.max(
      0,
      width
    )}%`;

  if (
    absolute <= 200
  ) {
    card.classList.add(
      "balance-good"
    );
  } else if (
    absolute <= 500
  ) {
    card.classList.add(
      "balance-warning"
    );
  } else {
    card.classList.add(
      "balance-danger"
    );
  }

  if (label) {
    label.textContent =
      balance > 0
        ? `+${fmt(balance)}`
        : fmt(balance);
  }
}

function renderHomeSummary() {
  /*
    Treningi dostarczają sumę spalonych kcal.
  */

  const lastWorkout =
    [...completedWorkouts]
      .sort(
        (a, b) =>
          String(
            b.date
          ).localeCompare(
            String(a.date)
          )
      )[0];

  const burned =
    document.getElementById(
      "homeBurned"
    );

  if (!lastWorkout) {
    if (burned) {
      burned.textContent =
        "0 kcal";
    }
  } else {
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

    if (burned) {
      burned.textContent =
        `${fmt(
          calories
        )} kcal`;
    }
  }

  /*
     Odczytujemy wartości,
     które są aktualnie pokazane
     na stronie głównej.
  */

  const kcal =
    getHomeNumericValue(
      "homeCalories"
    );

  const protein =
    getHomeNumericValue(
      "homeProtein"
    );

  const carbs =
    getHomeNumericValue(
      "homeCarbs"
    );

  const fat =
    getHomeNumericValue(
      "homeFat"
    );

  const balance =
    getHomeNumericValue(
      "homeBalance"
    );

  const goals =
    getNutritionGoals();

  /*
     Paski makro.
  */

  updateHomeProgress(
    "homeCaloriesCard",
    "homeCaloriesBar",
    "homeCaloriesPercent",
    kcal,
    goals.kcal
  );

  updateHomeProgress(
    "homeProteinCard",
    "homeProteinBar",
    "homeProteinPercent",
    protein,
    goals.protein
  );

  updateHomeProgress(
    "homeCarbsCard",
    "homeCarbsBar",
    "homeCarbsPercent",
    carbs,
    goals.carbs
  );

  updateHomeProgress(
    "homeFatCard",
    "homeFatBar",
    "homeFatPercent",
    fat,
    goals.fat
  );

  updateHomeBalance(
    balance
  );
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

  if (
    window.location.hash ===
    "#training"
  ) {
    showPage("training");
  } else if (
    window.location.hash ===
    "#nutrition"
  ) {
    showPage("nutrition");
  } else {
    showPage("home");
  }
}

window.addEventListener(
  "hashchange",
  () => {
    if (
      window.location.hash ===
      "#training"
    ) {
      showPage("training");
    }

    if (
      window.location.hash ===
      "#nutrition"
    ) {
      showPage("nutrition");
    }

    if (
      window.location.hash === ""
    ) {
      showPage("home");
    }
  }
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
