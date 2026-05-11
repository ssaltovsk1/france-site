(function () {
  const records = window.FRANCE_HISTORY || [];
  const types = window.FRANCE_HISTORY_TYPES || {};
  const periods = window.FRANCE_HISTORY_PERIODS || [];
  const typeAliases = {
    cause: "причина причины причинные узлы почему",
    event: "событие события дата даты хронология что случилось",
    regime: "тип правления типы правления режим режимы власть государственное устройство",
    faction: "группа группы фракция фракции партия партии",
    explanation: "почему почему случилось объяснение причины логика"
  };

  const grid = document.getElementById("historyGrid");
  const searchInput = document.getElementById("historySearch");
  const typeSelect = document.getElementById("historyType");
  const periodSelect = document.getElementById("historyPeriod");
  const counter = document.getElementById("historyCounter");
  const resetButton = document.getElementById("historyReset");

  if (!grid || !searchInput || !typeSelect || !periodSelect || !counter) {
    return;
  }

  Object.entries(types).forEach(([value, label]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    typeSelect.appendChild(option);
  });

  periods.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.value;
    option.textContent = item.label;
    periodSelect.appendChild(option);
  });

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function normalize(value) {
    return String(value || "").toLowerCase().replace(/ё/g, "е");
  }

  function list(items) {
    if (!items || !items.length) {
      return "";
    }

    return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
  }

  function pills(items, className) {
    if (!items || !items.length) {
      return "";
    }

    return `<div class="${className}">${items.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div>`;
  }

  function sources(items) {
    if (!items || !items.length) {
      return "";
    }

    return `
      <details class="history-sources">
        <summary>Материалы</summary>
        ${items.map((source) => `<code>${escapeHtml(source)}</code>`).join("")}
      </details>
    `;
  }

  function render() {
    const query = normalize(searchInput.value.trim());
    const selectedType = typeSelect.value;
    const selectedPeriod = periodSelect.value;

    const filtered = records.filter((item) => {
      const haystack = normalize([
        item.id,
        item.type,
        types[item.type],
        typeAliases[item.type],
        item.period,
        item.date,
        item.title,
        item.summary,
        item.why,
        item.causes && item.causes.join(" "),
        item.consequences && item.consequences.join(" "),
        item.tags && item.tags.join(" "),
        item.sources && item.sources.join(" ")
      ].join(" "));

      return (
        (selectedType === "all" || item.type === selectedType) &&
        (selectedPeriod === "all" || item.period === selectedPeriod) &&
        (!query || haystack.includes(query))
      );
    });

    counter.textContent = `${filtered.length} из ${records.length}`;

    if (!filtered.length) {
      grid.innerHTML = `
        <article class="empty-state">
          <h2>Ничего не найдено</h2>
          <p>Попробуй убрать период, сменить тип записи или искать проще: например, "хлеб", "церковь", "война", "Вандея", "Наполеон".</p>
        </article>
      `;
      return;
    }

    grid.innerHTML = filtered.map((item) => `
      <article class="history-card history-card-${escapeHtml(item.type)}">
        <div class="history-card-top">
          <span class="history-type">${escapeHtml(types[item.type] || item.type)}</span>
          <span class="history-date">${escapeHtml(item.date)}</span>
        </div>
        <h2>${escapeHtml(item.title)}</h2>
        <p>${escapeHtml(item.summary)}</p>
        <section>
          <h3>Почему это случилось</h3>
          <p>${escapeHtml(item.why)}</p>
        </section>
        <div class="history-columns">
          <section>
            <h3>Причины</h3>
            ${list(item.causes)}
          </section>
          <section>
            <h3>Последствия</h3>
            ${list(item.consequences)}
          </section>
        </div>
        ${pills(item.tags, "history-tags")}
        ${sources(item.sources)}
      </article>
    `).join("");
  }

  searchInput.addEventListener("input", render);
  typeSelect.addEventListener("change", render);
  periodSelect.addEventListener("change", render);

  if (resetButton) {
    resetButton.addEventListener("click", () => {
      searchInput.value = "";
      typeSelect.value = "all";
      periodSelect.value = "all";
      render();
      searchInput.focus();
    });
  }

  document.querySelectorAll("[data-query]").forEach((link) => {
    link.addEventListener("click", () => {
      searchInput.value = link.getAttribute("data-query") || "";
      typeSelect.value = "all";
      periodSelect.value = "all";
      render();
      searchInput.focus();
    });
  });

  render();
}());
