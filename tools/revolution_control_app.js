(function () {
  const data = window.REVOLUTION_CONTROL_DATA;
  const nodes = data.nodes;
  const edges = data.edges;
  const nodesById = Object.fromEntries(nodes.map((node) => [node.id, node]));
  const currentView = document.body.dataset.view || "map";
  const state = {
    search: "",
    owner: "all",
    domain: "all",
    type: "all",
    selected: "bread"
  };

  const ownerOrder = ["players", "shared", "masters"];
  const matrixPositions = {
    debt: [14, 89],
    taxCrisis: [31, 82],
    externalThreat: [35, 94],
    crop: [12, 76],
    privilege: [71, 78],
    representation: [81, 86],
    churchWealth: [77, 67],
    war: [48, 94],
    parisWall: [74, 45],
    bread: [62, 95],
    oath: [66, 62],
    assignats: [54, 72],
    assembly: [90, 93],
    conscription: [56, 60],
    requisitions: [46, 54],
    rumors: [86, 50],
    street: [91, 79],
    suspicion: [63, 83],
    vendee: [39, 70],
    terror: [58, 88],
    thermidor: [27, 34],
    armyOrder: [23, 24]
  };

  function init() {
    renderChrome();
    const app = document.getElementById("app");

    if (currentView === "board") {
      renderBoard(app);
    } else if (currentView === "chains") {
      renderChains(app);
    } else if (currentView === "matrix") {
      renderMatrix(app);
    } else {
      renderMap(app);
    }
  }

  function renderChrome() {
    const view = data.views[currentView] || data.views.map;
    document.getElementById("pageTitle").textContent = view.title;
    document.getElementById("pageLead").textContent = view.lead;

    const switcher = document.getElementById("viewSwitcher");
    switcher.innerHTML = Object.entries(data.views)
      .map(([key, item]) => {
        const className = key === currentView ? "view-link is-active" : "view-link";
        return `<a class="${className}" href="./${item.file}">${escapeHtml(item.nav)}</a>`;
      })
      .join("");
  }

  function renderMap(app) {
    app.innerHTML = `
      <div class="workspace">
        <section class="panel">
          ${panelHead("Карта с владельцем узла", "Фильтруйте по владельцу, теме и слою. Клик по узлу показывает, что играют персонажи и какой регулятор остается у мастеров.", mapStats())}
          ${toolbar({ owners: true, domains: true, types: true })}
          <div class="map-canvas" id="mapCanvas">
            <div class="map-column-label root">Причины</div>
            <div class="map-column-label pressure">Симптомы</div>
            <div class="map-column-label channel">Каналы</div>
            <div class="map-column-label outcome">Последствия</div>
            <svg class="edge-layer" viewBox="0 0 1240 820" preserveAspectRatio="none" aria-hidden="true" id="edgeLayer"></svg>
            <div class="node-layer" id="nodeLayer"></div>
          </div>
        </section>
        <aside class="panel inspector" id="inspector"></aside>
      </div>
    `;

    bindToolbar(() => updateMap());
    updateMap();
  }

  function updateMap() {
    const visibleNodes = filteredNodes();
    const visibleIds = new Set(visibleNodes.map((node) => node.id));
    const selected = ensureSelected(visibleIds);
    const connected = connectedIds(selected);

    const edgeLayer = document.getElementById("edgeLayer");
    edgeLayer.innerHTML = edges
      .filter((edge) => visibleIds.has(edge.from) && visibleIds.has(edge.to))
      .map((edge) => {
        const from = nodesById[edge.from];
        const to = nodesById[edge.to];
        const selectedEdge = edge.from === selected || edge.to === selected;
        return `<path class="edge-path ${selectedEdge ? "is-connected" : ""}" d="${curvePath(from, to)}"></path>`;
      })
      .join("");

    const nodeLayer = document.getElementById("nodeLayer");
    nodeLayer.innerHTML = visibleNodes
      .map((node) => {
        const owner = data.owners[node.owner];
        const faded = selected && !connected.has(node.id) && node.id !== selected;
        const selectedClass = node.id === selected ? "is-selected" : "";
        return `
          <button class="map-node domain-${node.domain} ${selectedClass} ${faded ? "is-faded" : ""}"
            style="--x:${(node.x / 1240) * 100}; --y:${(node.y / 820) * 100}; --owner-color:${owner.color}"
            data-node="${node.id}" type="button">
            <small><span class="ownership-band">${escapeHtml(owner.short)}</span></small>
            <b>${escapeHtml(node.title)}</b>
            <span>${escapeHtml(node.short)}</span>
          </button>
        `;
      })
      .join("");

    nodeLayer.querySelectorAll("[data-node]").forEach((button) => {
      button.addEventListener("click", () => {
        state.selected = button.dataset.node;
        updateMap();
      });
    });

    renderInspector(selected);
  }

  function renderBoard(app) {
    app.innerHTML = `
      <div class="workspace">
        <section class="panel">
          ${panelHead("Двухслойная доска", "Каждая строка переводит исторический узел в рабочий вопрос: что уходит в руки игрокам, а что остается мастерским регулятором.", boardStats())}
          ${toolbar({ owners: true, domains: true, types: false })}
          <div class="board-owner-strip" id="ownerSummaries"></div>
          <div class="board-table-wrap">
            <table class="board-table">
              <thead>
                <tr>
                  <th>Узел</th>
                  <th>Кому принадлежит</th>
                  <th>Игроки внутри играют</th>
                  <th>Мастера двигают</th>
                </tr>
              </thead>
              <tbody id="boardBody"></tbody>
            </table>
          </div>
        </section>
        <aside class="panel inspector" id="inspector"></aside>
      </div>
    `;

    bindToolbar(() => updateBoard());
    updateBoard();
  }

  function updateBoard() {
    const visibleNodes = filteredNodes();
    const visibleIds = new Set(visibleNodes.map((node) => node.id));
    const selected = ensureSelected(visibleIds);

    document.getElementById("ownerSummaries").innerHTML = ownerOrder
      .map((ownerKey) => {
        const owner = data.owners[ownerKey];
        const count = visibleNodes.filter((node) => node.owner === ownerKey).length;
        return `
          <div class="owner-summary owner-${ownerKey}">
            <b>${count} - ${escapeHtml(owner.label)}</b>
            <span>${escapeHtml(owner.description)}</span>
          </div>
        `;
      })
      .join("");

    const rows = visibleNodes
      .map((node) => {
        const owner = data.owners[node.owner];
        const domain = data.domains[node.domain];
        const type = data.types[node.type];
        return `
          <tr class="board-row ${node.id === selected ? "is-selected" : ""}" data-node="${node.id}">
            <td class="node-title-cell">
              <b>${escapeHtml(node.title)}</b>
              <span>${escapeHtml(domain.label)} / ${escapeHtml(type.label)}</span>
            </td>
            <td><span class="owner-chip owner-${node.owner}"><span class="owner-dot"></span>${escapeHtml(owner.label)}</span></td>
            <td>${escapeHtml(node.playerPlay)}</td>
            <td>${escapeHtml(node.masterControl)}</td>
          </tr>
        `;
      })
      .join("");

    document.getElementById("boardBody").innerHTML = rows || `<tr><td colspan="4"><div class="empty-state">Нет узлов под текущий фильтр.</div></td></tr>`;
    document.querySelectorAll(".board-row[data-node]").forEach((row) => {
      row.addEventListener("click", () => {
        state.selected = row.dataset.node;
        updateBoard();
      });
    });

    renderInspector(selected);
  }

  function renderChains(app) {
    app.innerHTML = `
      <div class="workspace">
        <section class="panel">
          ${panelHead("Цепочки передачи хода", "Маркировка на каждом шаге показывает, кому принадлежит следующий ход: игрокам, мастерам или обеим сторонам сразу.", chainStats())}
          ${toolbar({ owners: false, domains: false, types: false })}
          <div class="chain-list" id="chainList"></div>
        </section>
        <aside class="panel inspector" id="inspector"></aside>
      </div>
    `;

    bindToolbar(() => updateChains());
    updateChains();
  }

  function updateChains() {
    const query = normalize(state.search);
    const selected = state.selected;
    const chains = data.chains.filter((chain) => {
      if (!query) return true;
      const haystack = [
        chain.title,
        chain.description,
        chain.note,
        ...chain.nodes.map((id) => nodesById[id].title),
        ...chain.nodes.map((id) => nodesById[id].playerPlay),
        ...chain.nodes.map((id) => nodesById[id].masterControl)
      ].join(" ");
      return normalize(haystack).includes(query);
    });

    document.getElementById("chainList").innerHTML = chains
      .map((chain) => `
        <article class="chain-card">
          <div class="chain-head">
            <div>
              <h2>${escapeHtml(chain.title)}</h2>
              <p>${escapeHtml(chain.description)}</p>
            </div>
            <div class="legend">${chainLegend(chain.nodes)}</div>
          </div>
          <div class="chain-steps">
            ${chain.nodes.map((id, index) => stepButton(id, selected, index, chain.nodes.length)).join("")}
          </div>
          <p class="chain-note">${escapeHtml(chain.note)}</p>
        </article>
      `)
      .join("") || `<div class="empty-state">Нет цепочек под текущий поиск.</div>`;

    document.querySelectorAll(".step-button[data-node]").forEach((button) => {
      button.addEventListener("click", () => {
        state.selected = button.dataset.node;
        updateChains();
      });
    });

    renderInspector(state.selected);
  }

  function renderMatrix(app) {
    app.innerHTML = `
      <div class="workspace">
        <section class="panel">
          ${panelHead("Матрица важности и контроля", "Правый верхний угол - главные игровые площадки. Левый верхний - мастерские моторы. Нижние зоны лучше использовать точечно.", matrixStats())}
          ${toolbar({ owners: true, domains: true, types: false })}
          <div class="matrix-wrap">
            <div class="matrix-guide-grid" aria-label="Объяснение зон матрицы">
              <div class="matrix-guide" style="--guide-color:#1f6f78"><strong>Главные игровые площадки</strong>Высокая важность и много решений игроков.</div>
              <div class="matrix-guide" style="--guide-color:#8f4a2f"><strong>Мастерские моторы</strong>Мир давит, игроки отвечают через соседние узлы.</div>
              <div class="matrix-guide" style="--guide-color:#6c5a9b"><strong>Локальные сцены</strong>Хороши для ролей, но не обязаны двигать всю игру.</div>
              <div class="matrix-guide" style="--guide-color:#5b495e"><strong>Фоновый слой</strong>Держать легким треком или вводной.</div>
            </div>
            <div class="matrix-plot" id="matrixPlot">
              <div class="axis-label x-low">Меньше контроля игроков</div>
              <div class="axis-label x-high">Больше контроля игроков</div>
              <div class="axis-label y-high">Высокая важность</div>
              <div class="axis-label y-low">Ниже важность / локальнее</div>
              <div id="matrixNodes"></div>
            </div>
          </div>
        </section>
        <aside class="panel inspector" id="inspector"></aside>
      </div>
    `;

    bindToolbar(() => updateMatrix());
    updateMatrix();
  }

  function updateMatrix() {
    const visibleNodes = filteredNodes();
    const visibleIds = new Set(visibleNodes.map((node) => node.id));
    const selected = ensureSelected(visibleIds);
    const connected = connectedIds(selected);

    document.getElementById("matrixNodes").innerHTML = visibleNodes
      .map((node) => {
        const owner = data.owners[node.owner];
        const [control, importance] = matrixPositions[node.id] || [node.playerControl, node.importance];
        const faded = selected && !connected.has(node.id) && node.id !== selected;
        return `
          <button class="matrix-node domain-${node.domain} ${node.id === selected ? "is-selected" : ""} ${faded ? "is-faded" : ""}"
            style="--control:${control}; --importance:${importance}; --owner-color:${owner.color}"
            data-node="${node.id}" type="button">
            <span class="owner-dot"></span>${escapeHtml(node.title)}
          </button>
        `;
      })
      .join("");

    document.querySelectorAll(".matrix-node[data-node]").forEach((button) => {
      button.addEventListener("click", () => {
        state.selected = button.dataset.node;
        updateMatrix();
      });
    });

    renderInspector(selected);
  }

  function panelHead(title, subtitle, stats) {
    return `
      <div class="panel-head">
        <div>
          <h2 class="panel-title">${escapeHtml(title)}</h2>
          <p class="panel-subtitle">${escapeHtml(subtitle)}</p>
        </div>
        <div class="stats">
          ${stats.map((stat) => `<div class="stat"><b>${stat.value}</b><span>${escapeHtml(stat.label)}</span></div>`).join("")}
        </div>
      </div>
    `;
  }

  function toolbar(options) {
    return `
      <div class="toolbar">
        <div class="toolbar-grid">
          <div class="control">
            <label for="searchInput">Поиск</label>
            <input class="search-input" id="searchInput" type="search" value="${escapeHtml(state.search)}" placeholder="хлеб, церковь, Террор, реквизиции">
          </div>
          ${options.owners ? `<div class="control"><span class="filter-label">Владелец</span><div class="filter-row" id="ownerFilters"></div></div>` : ""}
          ${options.domains ? `<div class="control"><span class="filter-label">Тема</span><div class="filter-row" id="domainFilters"></div></div>` : ""}
        </div>
        ${options.types ? `<div class="control"><span class="filter-label">Слой</span><div class="filter-row" id="typeFilters"></div></div>` : ""}
        <div class="legend">
          ${ownerOrder.map((key) => {
            const owner = data.owners[key];
            return `<span class="legend-item owner-${key}"><span class="legend-dot"></span>${escapeHtml(owner.short)} - ${escapeHtml(owner.label)}</span>`;
          }).join("")}
        </div>
      </div>
    `;
  }

  function bindToolbar(onChange) {
    const search = document.getElementById("searchInput");
    if (search) {
      search.addEventListener("input", () => {
        state.search = search.value;
        onChange();
      });
    }

    renderFilterButtons("ownerFilters", [
      ["all", "Все"],
      ...ownerOrder.map((key) => [key, data.owners[key].short])
    ], "owner", onChange);

    renderFilterButtons("domainFilters", [
      ["all", "Все"],
      ...Object.entries(data.domains).map(([key, domain]) => [key, domain.label])
    ], "domain", onChange);

    renderFilterButtons("typeFilters", [
      ["all", "Все"],
      ...Object.entries(data.types).map(([key, type]) => [key, type.label])
    ], "type", onChange);
  }

  function renderFilterButtons(id, items, stateKey, onChange) {
    const host = document.getElementById(id);
    if (!host) return;
    host.innerHTML = items
      .map(([key, label]) => `<button class="filter-button ${state[stateKey] === key ? "is-active" : ""}" data-filter="${key}" type="button">${escapeHtml(label)}</button>`)
      .join("");
    host.querySelectorAll("[data-filter]").forEach((button) => {
      button.addEventListener("click", () => {
        state[stateKey] = button.dataset.filter;
        onChange();
      });
    });
  }

  function renderInspector(selectedId) {
    const node = nodesById[selectedId] || nodes[0];
    const owner = data.owners[node.owner];
    const domain = data.domains[node.domain];
    const type = data.types[node.type];
    const incoming = edges.filter((edge) => edge.to === node.id).map((edge) => nodesById[edge.from].title);
    const outgoing = edges.filter((edge) => edge.from === node.id).map((edge) => nodesById[edge.to].title);

    document.getElementById("inspector").innerHTML = `
      <div class="inspector-kicker">${escapeHtml(domain.label)} / ${escapeHtml(type.label)}</div>
      <h2>${escapeHtml(node.title)}</h2>
      <p class="inspector-summary">${escapeHtml(node.summary)}</p>
      <div class="token-row">
        <span class="owner-chip owner-${node.owner}"><span class="owner-dot"></span>${escapeHtml(owner.label)}</span>
        <span class="type-chip">Контроль игроков: ${node.playerControl}/100</span>
        <span class="type-chip">Важность: ${node.importance}/100</span>
      </div>
      <div class="detail-grid">
        ${detailBlock("Игроки внутри играют", node.playerPlay)}
        ${detailBlock("Мастера двигают", node.masterControl)}
        ${tokenBlock("Акторы", node.actors)}
        ${tokenBlock("Рычаги", node.levers)}
        ${tokenBlock("Питает узел", incoming.length ? incoming : ["нет прямых входов"])}
        ${tokenBlock("Узел ведет к", outgoing.length ? outgoing : ["нет прямых выходов"])}
      </div>
    `;
  }

  function detailBlock(title, text) {
    return `
      <div class="detail-block">
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(text)}</p>
      </div>
    `;
  }

  function tokenBlock(title, items) {
    return `
      <div class="detail-block">
        <h3>${escapeHtml(title)}</h3>
        <div class="token-row">
          ${items.map((item) => `<span class="token">${escapeHtml(item)}</span>`).join("")}
        </div>
      </div>
    `;
  }

  function filteredNodes() {
    const query = normalize(state.search);
    return nodes.filter((node) => {
      if (state.owner !== "all" && node.owner !== state.owner) return false;
      if (state.domain !== "all" && node.domain !== state.domain) return false;
      if (state.type !== "all" && node.type !== state.type) return false;
      if (!query) return true;
      const haystack = [
        node.title,
        node.short,
        node.summary,
        node.playerPlay,
        node.masterControl,
        node.chain,
        data.domains[node.domain].label,
        data.owners[node.owner].label,
        ...node.actors,
        ...node.levers
      ].join(" ");
      return normalize(haystack).includes(query);
    });
  }

  function ensureSelected(visibleIds) {
    if (visibleIds.has(state.selected)) return state.selected;
    const first = [...visibleIds][0];
    if (first) {
      state.selected = first;
      return first;
    }
    return nodes[0].id;
  }

  function connectedIds(id) {
    const ids = new Set([id]);
    edges.forEach((edge) => {
      if (edge.from === id) ids.add(edge.to);
      if (edge.to === id) ids.add(edge.from);
    });
    return ids;
  }

  function curvePath(from, to) {
    const dx = Math.max(80, Math.abs(to.x - from.x) * .5);
    const c1x = from.x + dx;
    const c2x = to.x - dx;
    return `M ${from.x} ${from.y} C ${c1x} ${from.y}, ${c2x} ${to.y}, ${to.x} ${to.y}`;
  }

  function stepButton(id, selected, index, length) {
    const node = nodesById[id];
    const owner = data.owners[node.owner];
    const arrow = index < length - 1 ? `<span class="chain-arrow">-></span>` : "";
    return `
      <button class="step-button domain-${node.domain} ${id === selected ? "is-selected" : ""}" data-node="${id}" type="button" style="--owner-color:${owner.color}">
        <span class="step-code">${escapeHtml(owner.short)}</span>
        ${escapeHtml(node.title)}
      </button>
      ${arrow}
    `;
  }

  function chainLegend(ids) {
    const counts = ownerOrder
      .map((ownerKey) => {
        const count = ids.filter((id) => nodesById[id].owner === ownerKey).length;
        return [ownerKey, count];
      })
      .filter(([, count]) => count > 0);

    return counts
      .map(([ownerKey, count]) => {
        const owner = data.owners[ownerKey];
        return `<span class="legend-item owner-${ownerKey}"><span class="legend-dot"></span>${escapeHtml(owner.short)}: ${count}</span>`;
      })
      .join("");
  }

  function mapStats() {
    return [
      { value: nodes.length, label: "узлов" },
      { value: edges.length, label: "связь" },
      { value: ownerOrder.length, label: "типа владельцев" }
    ];
  }

  function boardStats() {
    return ownerOrder.map((key) => ({
      value: nodes.filter((node) => node.owner === key).length,
      label: data.owners[key].short
    }));
  }

  function chainStats() {
    return [
      { value: data.chains.length, label: "цепочек" },
      { value: data.chains.reduce((sum, chain) => sum + chain.nodes.length, 0), label: "шагов" },
      { value: "И/М", label: "маркировка" }
    ];
  }

  function matrixStats() {
    const highControl = nodes.filter((node) => node.playerControl >= 65 && node.importance >= 80).length;
    const masterMotors = nodes.filter((node) => node.playerControl < 50 && node.importance >= 80).length;
    return [
      { value: highControl, label: "игровых площадок" },
      { value: masterMotors, label: "мастерских моторов" },
      { value: nodes.length, label: "узлов" }
    ];
  }

  function normalize(text) {
    return String(text || "").toLowerCase().replace(/\s+/g, " ").trim();
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  document.addEventListener("DOMContentLoaded", init);
})();
