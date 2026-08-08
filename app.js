const STORE_KEY = "fueltrack_fitatu_v02";

const state = {
  rows: [],
  selectedDate: ""
};

const MICROS = [
  ["Błonnik (g)", "Błonnik", "g"],
  ["Cukry (g)", "Cukry", "g"],
  ["Kwas omega 3 (g)", "Omega-3", "g"],
  ["Kwas omega 6 (g)", "Omega-6", "g"],
  ["Kofeina (mg)", "Kofeina", "mg"],
  ["Kwas foliowy (ug)", "Kwas foliowy", "µg"],
  ["Witamina A (ug)", "Witamina A", "µg"],
  ["Witamina B1 (mg)", "Witamina B1", "mg"],
  ["Witamina B2 (mg)", "Witamina B2", "mg"],
  ["Witamina B5 (mg)", "Witamina B5", "mg"],
  ["Witamina B6 (mg)", "Witamina B6", "mg"],
  ["Biotyna (ug)", "Biotyna", "µg"],
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
  ["Miedź (mg)", "Miedź", "mg"],
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

function numberValue(value) {
  const parsed = parseFloat(
    String(value ?? "").replace(",", ".")
  );

  return Number.isFinite(parsed) ? parsed : 0;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("pl-PL", {
    maximumFractionDigits: 2
  });
}

function escapeHTML(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[character]
  );
}

function showStatus(message, error = false) {
  const status = $("status");

  status.textContent = message;
  status.classList.remove("hidden", "error");

  if (error) {
    status.classList.add("error");
  }

  setTimeout(() => {
    status.classList.add("hidden");
  }, 5000);
}

/*
 * Prosty parser CSV.
 * Obsługuje przecinki znajdujące się wewnątrz cudzysłowów.
 */
function parseCSV(text) {
  text = text.replace(/^\uFEFF/, "");

  const rows = [];
  let row = [];
  let cell = "";
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const character = text[i];
    const nextCharacter = text[i + 1];

    if (character === '"') {
      if (insideQuotes && nextCharacter === '"') {
        cell += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }

      continue;
    }

    if (character === "," && !insideQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if (
      (character === "\n" || character === "\r") &&
      !insideQuotes
    ) {
      if (
        character === "\r" &&
        nextCharacter === "\n"
      ) {
        i++;
      }

      row.push(cell);
      cell = "";

      if (row.some(value => value.trim() !== "")) {
        rows.push(row);
      }

      row = [];
      continue;
    }

    cell += character;
  }

  if (cell.length || row.length) {
    row.push(cell);

    if (row.some(value => value.trim() !== "")) {
      rows.push(row);
    }
  }

  if (!rows.length) {
    return [];
  }

  const headers = rows[0].map(header => header.trim());

  return rows
    .slice(1)
    .map(values => {
      const object = {};

      headers.forEach((header, index) => {
        object[header] = (values[index] ?? "").trim();
      });

      return object;
    })
    .filter(object =>
      Object.values(object).some(Boolean)
    );
}

function loadData() {
  try {
    state.rows = JSON.parse(
      localStorage.getItem(STORE_KEY) || "[]"
    );
  } catch {
    state.rows = [];
  }
}

function saveData() {
  localStorage.setItem(
    STORE_KEY,
    JSON.stringify(state.rows)
  );
}

function getDates() {
  return [
    ...new Set(
      state.rows
        .map(row => row["Data"])
        .filter(Boolean)
    )
  ].sort().reverse();
}

function getDayTotal(date) {
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
    totals["kalorie (kcal)"] += numberValue(
      row["kalorie (kcal)"]
    );

    totals["Białka (g)"] += numberValue(
      row["Białka (g)"]
    );

    totals["Węglowodany (g)"] += numberValue(
      row["Węglowodany (g)"]
    );

    totals["Tłuszcze (g)"] += numberValue(
      row["Tłuszcze (g)"]
    );
  });

  MICROS.forEach(([key]) => {
    totals[key] = rows.reduce(
      (sum, row) =>
        sum + numberValue(row[key]),
      0
    );
  });

  return totals;
}

function renderDateSelector() {
  const dates = getDates();

  if (!dates.length) {
    state.selectedDate = "";

    $("selectedDateLabel").textContent =
      "Brak danych";

    $("dateSelect").innerHTML = "";

    $("dayCount").textContent = "0 dni";

    return;
  }

  if (
    !state.selectedDate ||
    !dates.includes(state.selectedDate)
  ) {
    state.selectedDate = dates[0];
  }

  $("dateSelect").innerHTML = dates
    .map(
      date =>
        `<option value="${escapeHTML(date)}">
          ${escapeHTML(date)}
        </option>`
    )
    .join("");

  $("dateSelect").value =
    state.selectedDate;

  $("selectedDateLabel").textContent =
    state.selectedDate;

  $("dayCount").textContent =
    `${dates.length} ${
      dates.length === 1 ? "dzień" : "dni"
    }`;
}

function renderDay() {
  if (!state.selectedDate) {
    return;
  }

  const rows = state.rows.filter(
    row => row["Data"] === state.selectedDate
  );

  const totals = getDayTotal(
    state.selectedDate
  );

  $("kcal").textContent =
    formatNumber(
      totals["kalorie (kcal)"]
    );

  $("protein").textContent =
    formatNumber(
      totals["Białka (g)"]
    );

  $("carbs").textContent =
    formatNumber(
      totals["Węglowodany (g)"]
    );

  $("fat").textContent =
    formatNumber(
      totals["Tłuszcze (g)"]
    );

  const meals = {};

  rows.forEach(row => {
    const meal =
      row["Posiłek"] || "Inne";

    if (!meals[meal]) {
      meals[meal] = [];
    }

    meals[meal].push(row);
  });

  $("meals").innerHTML =
    Object.entries(meals)
      .map(
        ([meal, mealRows]) => `
          <div class="meal">

            <div class="meal-title">
              ${escapeHTML(meal)}
            </div>

            ${mealRows
              .map(
                row => `
                  <div class="product">

                    <b>
                      ${escapeHTML(
                        row["Produkty i potrawy"] ||
                        "Produkt"
                      )}
                    </b>

                    <div class="product-meta">

                      ${escapeHTML(
                        row["Miara użyteczna"] || ""
                      )}

                      ·

                      ${formatNumber(
                        numberValue(
                          row["ilość (g)"]
                        )
                      )}
                      g

                      ·

                      ${formatNumber(
                        numberValue(
                          row["kalorie (kcal)"]
                        )
                      )}
                      kcal

                      · B
                      ${formatNumber(
                        numberValue(
                          row["Białka (g)"]
                        )
                      )}

                      · W
                      ${formatNumber(
                        numberValue(
                          row["Węglowodany (g)"]
                        )
                      )}

                      · T
                      ${formatNumber(
                        numberValue(
                          row["Tłuszcze (g)"]
                        )
                      )}

                    </div>

                  </div>
                `
              )
              .join("")}

          </div>
        `
      )
      .join("");

  $("micros").innerHTML =
    MICROS.map(
      ([key, label, unit]) => `
        <div class="micro">

          <b>
            ${formatNumber(
              totals[key]
            )}
            ${unit}
          </b>

          <span>
            ${label}
          </span>

        </div>
      `
    ).join("");
}

function renderHistory() {
  const dates = getDates();

  $("history").innerHTML =
    dates
      .map(date => {
        const totals =
          getDayTotal(date);

        return `
          <div class="history-row">

            <button
              data-date="${escapeHTML(date)}"
            >
              ${escapeHTML(date)}
            </button>

            <span>
              ${formatNumber(
                totals["kalorie (kcal)"]
              )}
              kcal
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

function createTextReport(date) {
  const rows = state.rows.filter(
    row => row["Data"] === date
  );

  const totals =
    getDayTotal(date);

  const meals = {};

  rows.forEach(row => {

    const meal =
      row["Posiłek"] || "Inne";

    if (!meals[meal]) {
      meals[meal] = [];
    }

    meals[meal].push(row);

  });

  let report =
    `FUELTRACK AI — RAPORT ŻYWIENIA\n`;

  report += `DATA: ${date}\n\n`;

  Object.entries(meals).forEach(
    ([meal, mealRows]) => {

      report +=
        `${meal.toUpperCase()}\n`;

      mealRows.forEach(row => {

        report +=
          `• ${
            row["Produkty i potrawy"] ||
            "Produkt"
          } — ${
            row["ilość (g)"] || "?"
          } g — ${
            formatNumber(
              numberValue(
                row["kalorie (kcal)"]
              )
            )
          } kcal | B ${
            formatNumber(
              numberValue(
                row["Białka (g)"]
              )
            )
          } g | W ${
            formatNumber(
              numberValue(
                row["Węglowodany (g)"]
              )
            )
          } g | T ${
            formatNumber(
              numberValue(
                row["Tłuszcze (g)"]
              )
            )
          } g\n`;

      });

      report += "\n";
    }
  );

  report +=
    "PODSUMOWANIE\n";

  report +=
    `Kalorie: ${
      formatNumber(
        totals["kalorie (kcal)"]
      )
    } kcal\n`;

  report +=
    `Białko: ${
      formatNumber(
        totals["Białka (g)"]
      )
    } g\n`;

  report +=
    `Węglowodany: ${
      formatNumber(
        totals["Węglowodany (g)"]
      )
    } g\n`;

  report +=
    `Tłuszcz: ${
      formatNumber(
        totals["Tłuszcze (g)"]
      )
    } g\n\n`;

  report +=
    "MIKRO I POZOSTAŁE SKŁADNIKI\n";

  MICROS.forEach(
    ([key, label, unit]) => {

      if (totals[key] !== 0) {

        report +=
          `${label}: ${
            formatNumber(
              totals[key]
            )
          } ${unit}\n`;

      }

    }
  );

  return report;
}

async function copyReport() {

  if (!state.selectedDate) {
    showStatus(
      "Najpierw zaimportuj dane z Fitatu.",
      true
    );

    return;
  }

  const text =
    createTextReport(
      state.selectedDate
    );

  try {

    await navigator.clipboard.writeText(
      text
    );

    showStatus(
      "Raport skopiowany do schowka."
    );

  } catch {

    const textarea =
      document.createElement("textarea");

    textarea.value = text;

    document.body.appendChild(
      textarea
    );

    textarea.select();

    document.execCommand("copy");

    textarea.remove();

    showStatus(
      "Raport skopiowany do schowka."
    );
  }
}

$("importBtn").onclick = () => {
  $("fileInput").click();
};

$("fileInput").onchange =
  async event => {

    const file =
      event.target.files[0];

    if (!file) {
      return;
    }

    try {

      const text =
        await file.text();

      const rows =
        parseCSV(text);

      if (!rows.length) {
        throw new Error(
          "Nie udało się odczytać pliku CSV."
        );
      }

      const requiredColumns = [
        "Data",
        "Posiłek",
        "Produkty i potrawy",
        "kalorie (kcal)",
        "Białka (g)"
      ];

      const missing =
        requiredColumns.filter(
          column =>
            !(column in rows[0])
        );

      if (missing.length) {

        throw new Error(
          "To nie wygląda na eksport Fitatu. Brakuje kolumn: " +
          missing.join(", ")
        );

      }

      state.rows = rows;

      saveData();

      state.selectedDate =
        getDates()[0];

      renderAll();

      showStatus(
        `Import zakończony: ${
          rows.length
        } pozycji, ${
          getDates().length
        } dni.`
      );

    } catch (error) {

      showStatus(
        error.message ||
        "Wystąpił błąd podczas importu.",
        true
      );

    }

    event.target.value = "";
  };

$("dateSelect").onchange =
  event => {

    state.selectedDate =
      event.target.value;

    renderAll();
  };

$("copyBtn").onclick =
  copyReport;

function renderAll() {
  renderDateSelector();
  renderDay();
  renderHistory();
}

loadData();
renderAll();
