/* =========================================================
   FUELTRACK AI v0.5
   - Fitatu CSV
   - trwała baza
   - migracja/odzyskiwanie starych danych
   - treningi
   - screeny Garmin — maks. 4
   - raport tekstowy
========================================================= */

const FOOD_KEY = "fueltrack_food_v04";
const WORKOUT_KEY = "fueltrack_workouts_v04";
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


/* =========================================================
   STORAGE — ODCZYT
========================================================= */

function safeParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function looksLikeFitatu(array) {
  if (!Array.isArray(array) || !array.length) {
    return false;
  }

  const sample = array[0];

  if (!sample || typeof sample !== "object") {
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

      if (!copy["Data"] && copy.data) {
        copy["Data"] = copy.data;
      }

      return copy;
    });
}


/* =========================================================
   ODZYSKIWANIE STARYCH DANYCH FITATU
========================================================= */

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


/* =========================================================
   STORAGE — ZAPIS
========================================================= */

function saveFood() {

  localStorage.setItem(
    FOOD_KEY,
    JSON.stringify(foodRows)
  );
}

function saveWorkouts() {

  try {

    localStorage.setItem(
      WORKOUT_KEY,
      JSON.stringify(workouts)
    );

  } catch (error) {

    console.error(
      "Błąd zapisu treningów:",
      error
    );

    status(
      "Nie udało się zapisać treningu. Pamięć przeglądarki może być pełna.",
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

  const savedFood =
    safeParse(
      localStorage.getItem(
        FOOD_KEY
      )
    );

  if (looksLikeFitatu(savedFood)) {

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

  /*
     Zabezpieczenie starych treningów.
     Jeżeli wcześniejsza wersja nie miała pola screens,
     dodajemy puste pole bez kasowania pozostałych danych.
  */

  workouts =
    workouts.map(workout => ({
      ...workout,
      screens:
        Array.isArray(workout.screens)
          ? workout.screens
          : []
    }));
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

        quoted =
          !quoted;

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
      h =>
        h.trim()
    );

  return rows
    .slice(1)
    .map(values => {

      const object = {};

      headers.forEach(
        (
          header,
          index
        ) => {

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


/* =========================================================
   DATY
========================================================= */

function getDates() {

  const dates = [

    ...foodRows
      .map(
        row =>
          row["Data"]
      )
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
   BILANS ŻYWIENIA
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
        (
          [meal, products]
        ) => {

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
                        ${fmt(kcal)}
                        kcal
                        · B
                        ${fmt(protein)}
                        g
                        · W
                        ${fmt(carbs)}
                        g
                        · T
                        ${fmt(fat)}
                        g
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
        (
          [
            column,
            label,
            unit
          ]
        ) => {

          const total =
            rows.reduce(
              (
                sum,
                row
              ) =>
                sum +
                num(
                  row[column]
                ),
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
   GARMIN — KOMPRESJA OBRAZU
========================================================= */

/*
   Screen z iPhone'a może mieć kilka MB.
   Przed zapisaniem zmniejszamy go do maks.
   1600 px szerokości/wysokości i JPEG ~70%.
*/

function compressImage(
  file,
  maxSize = 1600,
  quality = 0.70
) {

  return new Promise(
    (
      resolve,
      reject
    ) => {

      const reader =
        new FileReader();

      reader.onload = event => {

        const image =
          new Image();

        image.onload = () => {

          let width =
            image.naturalWidth;

          let height =
            image.naturalHeight;

          if (
            width > maxSize ||
            height > maxSize
          ) {

            const ratio =
              Math.min(
                maxSize / width,
                maxSize / height
              );

            width =
              Math.round(
                width * ratio
              );

            height =
              Math.round(
                height * ratio
              );

          }

          const canvas =
            document.createElement(
              "canvas"
            );

          canvas.width =
            width;

          canvas.height =
            height;

          const ctx =
            canvas.getContext(
              "2d"
            );

          ctx.drawImage(
            image,
            0,
            0,
            width,
            height
          );

          const result =
            canvas.toDataURL(
              "image/jpeg",
              quality
            );

          resolve(result);

        };

        image.onerror =
          () =>
            reject(
              new Error(
                "Nie udało się odczytać obrazu."
              )
            );

        image.src =
          event.target.result;

      };

      reader.onerror =
        () =>
          reject(
            new Error(
              "Nie udało się wczytać pliku."
            )
          );

      reader.readAsDataURL(file);

    }
  );
}


/* =========================================================
   GARMIN — UI
========================================================= */

function renderWorkoutScreens(
  workout
) {

  const box =
    $(
      `workoutScreens-${workout.id}`
    );

  if (!box) return;

  const screens =
    Array.isArray(
      workout.screens
    )
      ? workout.screens
      : [];

  if (!screens.length) {

    box.innerHTML = `
      <div
        style="
          margin-top:12px;
          padding:12px;
          border-radius:14px;
          background:#fff;
          color:#777;
          font-size:14px;
        "
      >
        Brak screenów Garmin.
      </div>
    `;

    return;
  }

  box.innerHTML = `
    <div
      style="
        margin-top:14px;
        padding-top:14px;
        border-top:1px solid #ddd;
      "
    >

      <div
        style="
          font-weight:800;
          margin-bottom:10px;
        "
      >
        📱 Screeny Garmin
      </div>

      <div
        style="
          display:grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap:10px;
        "
      >

        ${screens
          .map(
            (
              screen,
              index
            ) => `
              <div
                style="
                  position:relative;
                  border-radius:14px;
                  overflow:hidden;
                  background:#eee;
                "
              >

                <img
                  src="${screen.data}"
                  alt="Screen Garmin ${index + 1}"
                  style="
                    display:block;
                    width:100%;
                    height:auto;
                    max-height:320px;
                    object-fit:contain;
                  "
                >

                <button
                  data-delete-screen="
                    ${esc(workout.id)}
                  "
                  data-screen-index="
                    ${index}
                  "
                  style="
                    position:absolute;
                    top:7px;
                    right:7px;
                    width:32px;
                    height:32px;
                    border:0;
                    border-radius:50%;
                    background:#b42318;
                    color:white;
                    font-size:18px;
                    font-weight:800;
                  "
                >
                  ×
                </button>

              </div>
            `
          )
          .join("")}

      </div>

    </div>
  `;

  box
    .querySelectorAll(
      "[data-delete-screen]"
    )
    .forEach(button => {

      button.onclick = () => {

        const workoutId =
          button.dataset
            .deleteScreen;

        const index =
          Number(
            button.dataset
              .screenIndex
          );

        const target =
          workouts.find(
            item =>
              String(item.id) ===
              String(workoutId)
          );

        if (!target) return;

        if (
          !confirm(
            "Usunąć ten screen Garmin?"
          )
        ) {
          return;
        }

        target.screens =
          Array.isArray(
            target.screens
          )
            ? target.screens
            : [];

        target.screens.splice(
          index,
          1
        );

        saveWorkouts();

        renderWorkoutScreens(
          target
        );

        status(
          "Screen usunięty."
        );

      };

    });
}


/* =========================================================
   GARMIN — DODAWANIE SCREENÓW
========================================================= */

async function addGarminScreens(
  workoutId
) {

  const workout =
    workouts.find(
      item =>
        String(item.id) ===
        String(workoutId)
    );

  if (!workout) {

    status(
      "Nie znaleziono treningu.",
      true
    );

    return;
  }

  const current =
    Array.isArray(
      workout.screens
    )
      ? workout.screens
      : [];

  if (current.length >= 4) {

    status(
      "Ten trening ma już 4 screeny Garmin.",
      true
    );

    return;
  }

  const input =
    document.createElement(
      "input"
    );

  input.type =
    "file";

  input.accept =
    "image/*";

  /*
     Pozwala na zaznaczenie kilku
     zdjęć jednocześnie na iPhone.
  */

  input.multiple = true;

  input.onchange =
    async event => {

      let files =
        Array.from(
          event.target.files ||
          []
        );

      if (!files.length) {
        return;
      }

      const available =
        4 - current.length;

      if (
        files.length >
        available
      ) {

        status(
          `Możesz dodać jeszcze tylko ${available} ${
            available === 1
              ? "screen"
              : "screeny"
          }.`,
          true
        );

        files =
          files.slice(
            0,
            available
          );

      }

      status(
        `Przygotowuję ${files.length} screen${
          files.length === 1
            ? ""
            : "y"
        }...`
      );

      try {

        for (
          const file of files
        ) {

          if (
            !file.type.startsWith(
              "image/"
            )
          ) {
            continue;
          }

          const compressed =
            await compressImage(
              file
            );

          current.push({
            id:
              Date.now().toString() +
              "-" +
              Math.random()
                .toString(36)
                .slice(2),

            name:
              file.name,

            data:
              compressed,

            addedAt:
              new Date()
                .toISOString()
          });

        }

        workout.screens =
          current;

        saveWorkouts();

        renderWorkouts();

        status(
          `Dodano screeny Garmin. Razem: ${current.length}/4.`
        );

      } catch (error) {

        console.error(
          error
        );

        status(
          "Nie udało się zapisać screenów.",
          true
        );

      }

    };

  /*
     input nie jest częścią index.html.
     Tworzymy go tymczasowo i klikamy programowo.
  */

  document.body.appendChild(
    input
  );

  input.click();

  setTimeout(
    () => {
      input.remove();
    },
    1000
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

      <h3>
        Nowy trening
      </h3>

      <input
        id="wType"
        placeholder="
          Rodzaj, np. Easy Run / Interwały
        "
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
   TRENINGI — OBSŁUGA
========================================================= */

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
          "Najpierw zaimportuj Fitatu albo wybierz dzień.",
          true
        );

        return;
      }

      $("workoutForm")
        .style.display =
        "block";

      $("workoutForm")
        .scrollIntoView({
          behavior:
            "smooth",
          block:
            "center"
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


/* =========================================================
   ZAPIS TRENINGU
========================================================= */

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
      $("wType")
        .value
        .trim(),

    distance:
      num(
        $("wDistance")
          .value
      ),

    time:
      $("wTime")
        .value
        .trim(),

    pace:
      $("wPace")
        .value
        .trim(),

    hr:
      num(
        $("wHr")
          .value
      ),

    maxHr:
      num(
        $("wMaxHr")
          .value
      ),

    calories:
      num(
        $("wCalories")
          .value
      ),

    cadence:
      num(
        $("wCadence")
          .value
      ),

    elevation:
      num(
        $("wElevation")
          .value
      ),

    note:
      $("wNote")
        .value
        .trim(),

    screens: []

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

  status(
    "Trening zapisany."
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
    list
      .map(workout => {

        const screens =
          Array.isArray(
            workout.screens
          )
            ? workout.screens
            : [];

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
              🏃 ${
                esc(
                  workout.type ||
                  "Trening"
                )
              }
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
                      <small>
                        Max HR
                      </small>
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
                flex-wrap:wrap;
                margin-top:14px;
              "
            >

              <button
                data-add-screen-workout="
                  ${esc(workout.id)}
                "
                style="
                  border:0;
                  border-radius:10px;
                  padding:10px 13px;
                  background:#e8efff;
                  color:#2463eb;
                  font-weight:700;
                "
              >
                📷 Dodaj screeny z Garmin
                ${
                  screens.length
                    ? `(${screens.length}/4)`
                    : ""
                }
              </button>

              <button
                data-delete-workout="
                  ${esc(workout.id)}
                "
                style="
                  border:0;
                  border-radius:10px;
                  padding:10px 13px;
                  background:#fee4e2;
                  color:#b42318;
                  font-weight:700;
                "
              >
                Usuń trening
              </button>

            </div>

            <div
              id="
                workoutScreens-${esc(
                  workout.id
                )}
              "
            ></div>

          </div>
        `;

      })
      .join("");

  /*
     Obsługa przycisków dodawania screenów.
  */

  box
    .querySelectorAll(
      "[data-add-screen-workout]"
    )
    .forEach(button => {

      button.onclick = () => {

        addGarminScreens(
          button.dataset
            .addScreenWorkout
        );

      };

    });

  /*
     Obsługa usuwania treningów.
  */

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

        renderWorkouts();

        status(
          "Trening usunięty."
        );

      };

    });

  /*
     Po wyrenderowaniu pokazujemy screeny
     każdego treningu.
  */

  list.forEach(
    workout => {

      renderWorkoutScreens(
        workout
      );

    }
  );
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
      `<p>
        Brak zapisanych dni.
      </p>`;

    return;
  }

  box.innerHTML =
    dates
      .map(date => {

        const result =
          totalsForDate(
            date
          );

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
              justify-content:space-between;
              gap:10px;
              align-items:center;
              padding:12px 0;
              border-bottom:1px solid #eee;
            "
          >

            <button
              data-history-date="
                ${esc(date)}
              "
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

      })
      .join("");

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
    totalsForDate(
      date
    );

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
      (
        [meal, products]
      ) => {

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
              product[
                "ilość (g)"
              ]
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
    )} g\n\n`;

  text +=
    `TRENINGI\n`;

  const dayWorkouts =
    workouts.filter(
      workout =>
        workout.date ===
        date
    );

  if (
    !dayWorkouts.length
  ) {

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
              fmt(
                workout.hr
              )
            }`;

        }

        if (workout.calories) {

          text +=
            ` | ${
              fmt(
                workout.calories
              )
            } kcal`;

        }

        text += "\n";

      }
    );
  }

  text +=
    `\nMIKROELEMENTY\n`;

  MICRO_COLUMNS.forEach(
    (
      [
        column,
        label,
        unit
      ]
    ) => {

      const total =
        rows.reduce(
          (
            sum,
            row
          ) =>
            sum +
            num(
              row[column]
            ),
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
      .writeText(
        text
      );

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

    setupImport();

    setupEvents();

    renderAll();

    if (foodRows.length) {

      console.log(
        "FuelTrack AI: odzyskano rekordów Fitatu:",
        foodRows.length
      );

    } else {

      console.log(
        "FuelTrack AI: brak danych Fitatu."
      );

    }

    console.log(
      "FuelTrack AI: treningów:",
      workouts.length
    );

  }
);
