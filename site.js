(function () {
  const characters = window.FRANCE_CHARACTERS || [];
  const grid = document.getElementById("characterGrid");
  const searchInput = document.getElementById("characterSearch");
  const groupSelect = document.getElementById("characterGroup");
  const counter = document.getElementById("characterCounter");

  if (!grid || !searchInput || !groupSelect || !counter) {
    return;
  }

  const groups = Array.from(
    new Map(characters.map((item) => [String(item.group), item.group_label])).entries()
  );

  groups.forEach(([value, label]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    groupSelect.appendChild(option);
  });

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function render() {
    const query = searchInput.value.trim().toLowerCase();
    const group = groupSelect.value;

    const filtered = characters.filter((item) => {
      const haystack = [
        item.name_ru,
        item.name_fr,
        item.group_label,
        item.brief,
        item.id
      ].join(" ").toLowerCase();

      return (group === "all" || String(item.group) === group) && (!query || haystack.includes(query));
    });

    counter.textContent = `${filtered.length} из ${characters.length}`;

    grid.innerHTML = filtered.map((item) => `
      <article class="character-card">
        <div class="pill-row">
          <span class="pill">${escapeHtml(item.group_label)}</span>
          <span class="pill">${escapeHtml(item.id)}</span>
        </div>
        <div>
          <h2>${escapeHtml(item.name_ru)}</h2>
          <div class="fr">${escapeHtml(item.name_fr)}</div>
        </div>
        <p>${escapeHtml(item.brief)}</p>
        <div class="card-actions">
          <a href="./${escapeHtml(item.html_file || item.file)}">Читать HTML</a>
          <a href="./${escapeHtml(item.file)}" download>Скачать MD</a>
        </div>
      </article>
    `).join("");
  }

  searchInput.addEventListener("input", render);
  groupSelect.addEventListener("change", render);
  render();
}());
