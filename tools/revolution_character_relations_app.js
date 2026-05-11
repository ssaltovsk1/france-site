(function () {
  const data = window.REVOLUTION_CHARACTER_RELATIONS;
  const app = document.getElementById("characterRelationsApp");
  const charactersById = Object.fromEntries(data.characters.map((character) => [character.id, character]));
  const relationsById = Object.fromEntries(data.relations.map((relation) => [relation.id, relation]));
  const state = {
    view: "network",
    search: "",
    domain: "all",
    group: "all",
    selectedRelation: "bread_flow",
    selectedCharacter: "",
    breadPrice: 3,
    hunger: 4,
    assignatRate: 75,
    refusals: 1,
    requisitions: 1,
    war: false,
    terror: false
  };

  function init() {
    render();
  }

  function render() {
    app.innerHTML = `
      <div class="relation-shell">
        <section class="panel">
          ${panelHead()}
          ${tabs()}
          <div id="relationView"></div>
        </section>
      </div>
    `;
    bindTabs();
    renderView();
  }

  function panelHead() {
    const edgeCount = data.relations.reduce((sum, relation) => sum + relation.participants.length + relation.npc.length, 0);
    return `
      <div class="panel-head">
        <div>
          <h2 class="panel-title">Связи через действия и ресурсы</h2>
          <p class="panel-subtitle">Клик по узлу или персонажу показывает, что он получает, отдает, кого втягивает и какие треки должны считать мастера.</p>
        </div>
        <div class="stats">
          <div class="stat"><b>${data.characters.length}</b><span>персонажей</span></div>
          <div class="stat"><b>${data.relations.length}</b><span>типов связей</span></div>
          <div class="stat"><b>${edgeCount}</b><span>вхождений</span></div>
        </div>
      </div>
    `;
  }

  function tabs() {
    const items = [
      ["network", "Сеть"],
      ["turn", "Ход"],
      ["resources", "Ресурсы"],
      ["income", "Доходы"],
      ["characters", "Персонажи"],
      ["matrix", "Матрица"],
      ["calculator", "Просчёт"]
    ];
    return `
      <div class="relation-tabs">
        ${items.map(([id, label]) => `<button class="relation-tab ${state.view === id ? "is-active" : ""}" data-view="${id}" type="button">${escapeHtml(label)}</button>`).join("")}
      </div>
    `;
  }

  function bindTabs() {
    app.querySelectorAll("[data-view]").forEach((button) => {
      button.addEventListener("click", () => {
        state.view = button.dataset.view;
        render();
      });
    });
  }

  function renderView() {
    const host = document.getElementById("relationView");
    if (state.view === "turn") renderTurn(host);
    else if (state.view === "resources") renderResources(host);
    else if (state.view === "income") renderIncome(host);
    else if (state.view === "characters") renderCharacters(host);
    else if (state.view === "matrix") renderMatrix(host);
    else if (state.view === "calculator") renderCalculator(host);
    else renderNetwork(host);
  }

  function renderResources(host) {
    const model = data.resourceModel;
    host.innerHTML = `
      <div class="relation-workspace">
        <section>
          <div class="relation-toolbar">
            <div>
              <h2 class="panel-title">${safe(model.title)}</h2>
              <p class="panel-subtitle">${safe(model.context)}</p>
            </div>
            <div class="legend">
              ${model.principles.map((item) => `<span class="legend-item">${safe(item)}</span>`).join("")}
            </div>
          </div>

          <div class="resource-grid">
            ${model.wallets.map((wallet) => `
              <article class="resource-card">
                <h3>${safe(wallet.kind)}</h3>
                <p><b>Владелец:</b> ${safe(wallet.owner)}</p>
                <p><b>Примеры:</b> ${safe(wallet.examples)}</p>
                <p><b>Тратит:</b> ${safe(wallet.canSpend)}</p>
                <p><b>Ограничение:</b> ${safe(wallet.cannotDo)}</p>
              </article>
            `).join("")}
          </div>

          <div class="matrix-relations">
            <table class="relation-table">
              <thead>
                <tr>
                  <th>Источник</th>
                  <th>Кто получает</th>
                  <th>Что дает</th>
                  <th>Ограничение</th>
                </tr>
              </thead>
              <tbody>
                ${model.sources.map((source) => `
                  <tr>
                    <td><b>${safe(source.source)}</b></td>
                    <td>${safe(source.who)}</td>
                    <td>${safe(source.gives)}</td>
                    <td>${safe(source.limit)}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>

          <div class="matrix-relations">
            <table class="relation-table">
              <thead>
                <tr>
                  <th>Откуда</th>
                  <th>Куда</th>
                  <th>Как переводится</th>
                  <th>Пример</th>
                </tr>
              </thead>
              <tbody>
                ${model.transfers.map((transfer) => `
                  <tr>
                    <td>${safe(transfer.from)}</td>
                    <td>${safe(transfer.to)}</td>
                    <td>${safe(transfer.action)}</td>
                    <td>${safe(transfer.example)}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </section>
        <aside class="panel inspector" id="relationInspector"></aside>
      </div>
    `;
    renderResourceInspector();
  }

  function renderIncome(host) {
    const model = data.incomeModel;
    host.innerHTML = `
      <div class="relation-workspace">
        <section>
          <div class="relation-toolbar">
            <div>
              <h2 class="panel-title">${safe(model.title)}</h2>
              <p class="panel-subtitle">${safe(model.context)}</p>
            </div>
            <div class="legend">
              ${model.rules.map((rule) => `<span class="legend-item">${safe(rule)}</span>`).join("")}
            </div>
          </div>
          ${toolbar({ domains: false, groups: true })}
          <div class="matrix-relations">
            <table class="relation-table">
              <thead>
                <tr>
                  <th>Персонаж</th>
                  <th>Старт</th>
                  <th>Доход за ход</th>
                  <th>Источник</th>
                  <th>Тип</th>
                  <th>Условие</th>
                </tr>
              </thead>
              <tbody id="incomeTableBody"></tbody>
            </table>
          </div>
        </section>
        <aside class="panel inspector" id="relationInspector"></aside>
      </div>
    `;
    bindToolbar(updateIncome);
    updateIncome();
  }

  function updateIncome() {
    const rows = filteredIncomeRows();
    document.getElementById("incomeTableBody").innerHTML = rows.map(({ income, character }) => `
      <tr data-character="${character.id}">
        <td><b>${safe(character.name)}</b><br><span class="mini-chip is-domain">${safe(data.groups[character.group].label)}</span></td>
        <td>${safe(income.start)}</td>
        <td>${safe(income.income)}</td>
        <td>${safe(income.source)}</td>
        <td>${safe(income.kind)}</td>
        <td>${safe(income.condition)}</td>
      </tr>
    `).join("") || `<tr><td colspan="6"><div class="empty-state">Нет доходов под текущий фильтр.</div></td></tr>`;

    document.querySelectorAll("[data-character]").forEach((row) => {
      row.addEventListener("click", () => {
        state.selectedCharacter = row.dataset.character;
        renderIncomeInspector(state.selectedCharacter);
      });
    });

    if (!rows.some(({ character }) => character.id === state.selectedCharacter)) {
      state.selectedCharacter = rows[0] ? rows[0].character.id : "";
    }
    renderIncomeInspector(state.selectedCharacter);
  }

  function renderIncomeInspector(characterId) {
    const model = data.incomeModel;
    const income = model.rows.find((row) => row.characterId === characterId);
    const character = charactersById[characterId];
    const group = character ? data.groups[character.group] : null;
    if (!income || !character) {
      document.getElementById("relationInspector").innerHTML = `<div class="empty-state">Выберите персонажа.</div>`;
      return;
    }

    document.getElementById("relationInspector").innerHTML = `
      <div class="inspector-kicker">${safe(group.label)}</div>
      <h2>${safe(character.name)}</h2>
      <p class="inspector-summary">Доход показывает регулярный приток за ход. Крупная собственность, казна, фонд или склад считаются отдельно и требуют действия, чтобы превратиться в личные деньги или хлеб.</p>
      <div class="detail-grid">
        ${detailBlock("Старт", income.start)}
        ${detailBlock("Доход за ход", income.income)}
        ${detailBlock("Источник", income.source)}
        ${detailBlock("Тип ресурса", income.kind)}
        ${detailBlock("Условие", income.condition)}
        ${tokenBlock("Ресурсы персонажа", character.resources)}
        ${tokenBlock("Риски", character.risks)}
      </div>
    `;
  }

  function renderResourceInspector() {
    const model = data.resourceModel;
    document.getElementById("relationInspector").innerHTML = `
      <div class="inspector-kicker">Правило собственности</div>
      <h2>Три вопроса мастера</h2>
      <p class="inspector-summary">Когда игрок хочет получить ресурс, мастер не спрашивает "есть ли деньги вообще". Он проверяет, где ресурс лежит, кто имеет право его двигать и какой след оставляет перевод.</p>
      <div class="detail-grid">
        ${tokenBlock("Проверка", [
          "Где физически лежит ресурс?",
          "Кому он принадлежит?",
          "Какой ход переводит его в другой кошелек?",
          "Какая цена остается после сделки?"
        ])}
        ${tokenBlock("Нельзя напрямую", [
          "личные монеты -> сытость Парижа",
          "королевский двор -> казна без займа",
          "церковный фонд -> личный кошелек кюре",
          "рынок -> личный склад без слуха"
        ])}
        ${tokenBlock("Можно через ход", model.transfers.map((transfer) => `${transfer.from} -> ${transfer.to}: ${transfer.action}`))}
      </div>
    `;
  }

  function renderTurn(host) {
    const turn = data.concreteTurn;
    host.innerHTML = `
      <div class="relation-workspace">
        <section>
          <div class="relation-toolbar">
            <div>
              <h2 class="panel-title">${escapeHtml(turn.title)}</h2>
              <p class="panel-subtitle">${escapeHtml(turn.context)}</p>
            </div>
            <div class="legend">
              ${turn.rules.map((rule) => `<span class="legend-item">${safe(rule)}</span>`).join("")}
            </div>
          </div>
          ${turn.distribution ? `
            <div class="matrix-relations">
              <table class="relation-table">
                <thead>
                  <tr>
                    <th>Кому</th>
                    <th>Что раздается</th>
                    <th>Зачем в механике</th>
                  </tr>
                </thead>
                <tbody>
                  ${turn.distribution.map((item) => `
                    <tr>
                      <td>${safe(item.who)}</td>
                      <td>${safe(item.gets)}</td>
                      <td>${safe(item.note)}</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
          ` : ""}
          <div class="summary-strip">
            ${turn.poolsStart.map((pool) => {
              const end = pool.value + turn.transactions.reduce((sum, transaction) => sum + (transaction.poolDelta[pool.id] || 0), 0);
              return `
                <div class="summary-card" style="--card-color:${poolColor(pool.id)}">
                  <b>${pool.value} -> ${end}</b>
                  <span>${safe(pool.label)} · ${safe(pool.unit)}</span>
                </div>
              `;
            }).join("")}
          </div>
          <div class="matrix-relations">
            <table class="relation-table">
              <thead>
                <tr>
                  <th>Шаг</th>
                  <th>Игрок X</th>
                  <th>Получает Y</th>
                  <th>За что / отдает</th>
                  <th>От кого</th>
                  <th>Последствие</th>
                </tr>
              </thead>
              <tbody>
                ${turn.transactions.map((transaction) => `
                  <tr data-relation="${transaction.relation}">
                    <td><b>${escapeHtml(transaction.id)}</b><br>${escapeHtml(transaction.phase)}</td>
                    <td>${safe(transaction.actor)}</td>
                    <td>${safe(transaction.receives)}</td>
                    <td>${safe(transaction.pays)}</td>
                    <td>${safe(transaction.counterparty)}</td>
                    <td>${safe(transaction.result)}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </section>
        <aside class="panel inspector" id="relationInspector"></aside>
      </div>
    `;

    document.querySelectorAll("[data-relation]").forEach((row) => {
      row.addEventListener("click", () => {
        state.selectedRelation = row.dataset.relation;
        renderRelationInspector(state.selectedRelation);
      });
    });
    renderTurnInspector();
  }

  function renderTurnInspector() {
    const turn = data.concreteTurn;
    const deltas = turn.poolsStart.map((pool) => ({
      ...pool,
      end: pool.value + turn.transactions.reduce((sum, transaction) => sum + (transaction.poolDelta[pool.id] || 0), 0)
    }));
    document.getElementById("relationInspector").innerHTML = `
      <div class="inspector-kicker">Конкретный журнал</div>
      <h2>${escapeHtml(turn.title)}</h2>
      <p class="inspector-summary">Это не единственный правильный ход, а калибровочный пример: числа можно менять и смотреть, где появляется голод, долг, отказ от бумаги или подозрение.</p>
      <div class="detail-grid">
        ${tokenBlock("Итог пулов", deltas.map((pool) => `${pool.label}: ${pool.value} -> ${pool.end} ${pool.unit}`))}
        ${tokenBlock("Проверка еды в конце", turn.closingChecks.map((check) => `${check.actor}: ${check.result}`))}
      </div>
    `;
  }

  function toolbar({ domains = true, groups = false } = {}) {
    return `
      <div class="relation-toolbar">
        <div class="relation-toolbar-grid">
          <div class="control">
            <label for="relationSearch">Поиск</label>
            <input class="search-input" id="relationSearch" type="search" value="${escapeHtml(state.search)}" placeholder="хлеб, Дантон, присяга, черный рынок">
          </div>
          ${domains ? `<div class="control"><span class="filter-label">Тема</span><div class="filter-row" id="domainFilters"></div></div>` : ""}
          ${groups ? `<div class="control"><span class="filter-label">Группа</span><div class="filter-row" id="groupFilters"></div></div>` : ""}
        </div>
      </div>
    `;
  }

  function bindToolbar(onChange) {
    const search = document.getElementById("relationSearch");
    if (search) {
      search.addEventListener("input", () => {
        state.search = search.value;
        onChange();
      });
    }

    renderFilter("domainFilters", [["all", "Все"], ...Object.entries(data.domains).map(([id, item]) => [id, item.label])], "domain", onChange);
    renderFilter("groupFilters", [["all", "Все"], ...Object.entries(data.groups).map(([id, item]) => [id, item.label])], "group", onChange);
  }

  function renderFilter(id, items, key, onChange) {
    const host = document.getElementById(id);
    if (!host) return;
    host.innerHTML = items.map(([value, label]) => `
      <button class="filter-button ${state[key] === value ? "is-active" : ""}" data-filter="${value}" type="button">${escapeHtml(label)}</button>
    `).join("");
    host.querySelectorAll("[data-filter]").forEach((button) => {
      button.addEventListener("click", () => {
        state[key] = button.dataset.filter;
        onChange();
      });
    });
  }

  function renderNetwork(host) {
    host.innerHTML = `
      <div class="relation-workspace">
        <section>
          ${toolbar({ domains: true, groups: false })}
          <div class="relation-map">
            <div class="relation-stage-label source">Ресурс</div>
            <div class="relation-stage-label exchange">Обмен</div>
            <div class="relation-stage-label pressure">Давление</div>
            <div class="relation-stage-label outcome">Последствие</div>
            <svg class="relation-edge-layer" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" id="relationEdges"></svg>
            <div class="relation-node-layer" id="relationNodes"></div>
          </div>
        </section>
        <aside class="panel inspector" id="relationInspector"></aside>
      </div>
    `;
    bindToolbar(updateNetwork);
    updateNetwork();
  }

  function updateNetwork() {
    const visible = filteredRelations();
    const visibleIds = new Set(visible.map((relation) => relation.id));
    ensureSelectedRelation(visibleIds);
    const connected = connectedRelationIds(state.selectedRelation);

    document.getElementById("relationEdges").innerHTML = data.links
      .filter(([from, to]) => visibleIds.has(from) && visibleIds.has(to))
      .map(([from, to]) => {
        const active = from === state.selectedRelation || to === state.selectedRelation;
        return `<path class="relation-edge ${active ? "is-active" : ""}" d="${relationPath(relationsById[from], relationsById[to])}"></path>`;
      })
      .join("");

    document.getElementById("relationNodes").innerHTML = visible.map((relation) => {
      const faded = state.selectedRelation && !connected.has(relation.id) && relation.id !== state.selectedRelation;
      return `
        <button class="relation-node domain-${relation.domain} ${relation.id === state.selectedRelation ? "is-selected" : ""} ${faded ? "is-faded" : ""}"
          style="--x:${relation.x}; --y:${relation.y}" data-relation="${relation.id}" type="button">
          <small>${escapeHtml(data.domains[relation.domain].label)}</small>
          <b>${escapeHtml(relation.title)}</b>
          <span>${relation.participants.length} персонажей, ${relation.npc.length} мастерских/NPC узлов</span>
        </button>
      `;
    }).join("");

    document.querySelectorAll("[data-relation]").forEach((button) => {
      button.addEventListener("click", () => {
        state.selectedRelation = button.dataset.relation;
        updateNetwork();
      });
    });

    renderRelationInspector(state.selectedRelation);
  }

  function renderCharacters(host) {
    host.innerHTML = `
      <div class="relation-workspace">
        <section>
          ${toolbar({ domains: false, groups: true })}
          <div class="character-grid" id="characterGrid"></div>
        </section>
        <aside class="panel inspector" id="relationInspector"></aside>
      </div>
    `;
    bindToolbar(updateCharacters);
    updateCharacters();
  }

  function updateCharacters() {
    const visible = filteredCharacters();
    if (!state.selectedCharacter || !visible.some((character) => character.id === state.selectedCharacter)) {
      state.selectedCharacter = visible[0] ? visible[0].id : "";
    }

    document.getElementById("characterGrid").innerHTML = visible.map((character) => {
      const group = data.groups[character.group];
      const relations = relationsForCharacter(character.id);
      return `
        <article class="character-card ${character.id === state.selectedCharacter ? "is-selected" : ""}" data-character="${character.id}" style="--char-color:${group.color}">
          <h3>${escapeHtml(character.name)}</h3>
          <p>${escapeHtml(group.label)} · ${relations.length} связей</p>
          <div class="chip-line">
            ${character.resources.slice(0, 4).map((item) => `<span class="mini-chip is-resource">${safe(item)}</span>`).join("")}
          </div>
        </article>
      `;
    }).join("") || `<div class="empty-state">Нет персонажей под текущий фильтр.</div>`;

    document.querySelectorAll("[data-character]").forEach((card) => {
      card.addEventListener("click", () => {
        state.selectedCharacter = card.dataset.character;
        updateCharacters();
      });
    });

    renderCharacterInspector(state.selectedCharacter);
  }

  function renderMatrix(host) {
    host.innerHTML = `
      <div class="relation-workspace">
        <section>
          ${toolbar({ domains: true, groups: false })}
          <div class="matrix-relations">
            <table class="relation-table">
              <thead>
                <tr>
                  <th>Связь</th>
                  <th>Получает / отдает</th>
                  <th>Игроки могут</th>
                  <th>Мастера считают</th>
                  <th>Открывает</th>
                </tr>
              </thead>
              <tbody id="relationMatrixBody"></tbody>
            </table>
          </div>
        </section>
        <aside class="panel inspector" id="relationInspector"></aside>
      </div>
    `;
    bindToolbar(updateMatrix);
    updateMatrix();
  }

  function updateMatrix() {
    const visible = filteredRelations();
    const visibleIds = new Set(visible.map((relation) => relation.id));
    ensureSelectedRelation(visibleIds);
    document.getElementById("relationMatrixBody").innerHTML = visible.map((relation) => `
      <tr class="${relation.id === state.selectedRelation ? "is-selected" : ""}" data-relation="${relation.id}">
        <td><b>${safe(relation.title)}</b><br><span class="mini-chip is-domain">${safe(data.domains[relation.domain].label)}</span></td>
        <td><b>Получает:</b> ${safe(relation.gives)}<br><b>Отдает:</b> ${safe(relation.takes)}</td>
        <td>${relation.playerLevers.map(safe).join(", ")}</td>
        <td>${relation.masterLevers.map(safe).join(", ")}</td>
        <td>${relation.opens.map(safe).join(", ")}</td>
      </tr>
    `).join("") || `<tr><td colspan="5"><div class="empty-state">Нет связей под текущий фильтр.</div></td></tr>`;

    document.querySelectorAll("[data-relation]").forEach((row) => {
      row.addEventListener("click", () => {
        state.selectedRelation = row.dataset.relation;
        updateMatrix();
      });
    });

    renderRelationInspector(state.selectedRelation);
  }

  function renderCalculator(host) {
    host.innerHTML = `
      <div class="calc-layout">
        <div class="calc-controls">
          ${rangeControl("breadPrice", "Цена хлеба", 1, 6, state.breadPrice)}
          ${rangeControl("hunger", "Голодных", 0, 20, state.hunger)}
          ${rangeControl("assignatRate", "Курс ассигната", 5, 100, state.assignatRate)}
          ${rangeControl("refusals", "Отказов от бумаги", 0, 10, state.refusals)}
          ${rangeControl("requisitions", "Реквизиций/наборов", 0, 10, state.requisitions)}
          <div class="calc-control">
            <label for="calcCharacter">Персонаж <span>${selectedCharacterLabel()}</span></label>
            <select id="calcCharacter">
              <option value="">Все роли</option>
              ${data.characters.map((character) => `<option value="${character.id}" ${state.selectedCharacter === character.id ? "selected" : ""}>${escapeHtml(character.name)}</option>`).join("")}
            </select>
          </div>
          <div class="calc-control">
            <label><span>Флаги</span><span>${state.war ? "война" : ""} ${state.terror ? "террор" : ""}</span></label>
            <div class="chip-line">
              <button class="filter-button ${state.war ? "is-active" : ""}" id="warToggle" type="button">Война</button>
              <button class="filter-button ${state.terror ? "is-active" : ""}" id="terrorToggle" type="button">Террор</button>
            </div>
          </div>
        </div>
        <section class="calc-results" id="calcResults"></section>
      </div>
    `;
    bindCalculator();
    updateCalculator();
  }

  function rangeControl(key, label, min, max, value) {
    return `
      <div class="calc-control">
        <label for="${key}">${escapeHtml(label)} <span id="${key}Value">${value}</span></label>
        <input id="${key}" type="range" min="${min}" max="${max}" value="${value}">
      </div>
    `;
  }

  function bindCalculator() {
    ["breadPrice", "hunger", "assignatRate", "refusals", "requisitions"].forEach((key) => {
      const input = document.getElementById(key);
      input.addEventListener("input", () => {
        state[key] = Number(input.value);
        document.getElementById(`${key}Value`).textContent = input.value;
        updateCalculator();
      });
    });

    document.getElementById("calcCharacter").addEventListener("change", (event) => {
      state.selectedCharacter = event.target.value;
      updateCalculator();
    });

    document.getElementById("warToggle").addEventListener("click", () => {
      state.war = !state.war;
      renderCalculator(document.getElementById("relationView"));
    });

    document.getElementById("terrorToggle").addEventListener("click", () => {
      state.terror = !state.terror;
      renderCalculator(document.getElementById("relationView"));
    });
  }

  function updateCalculator() {
    const activeTags = new Set();
    if (state.breadPrice >= 3 || state.hunger > 0) activeTags.add("bread");
    if (state.breadPrice >= 4 || state.hunger >= 5) activeTags.add("street");
    if (state.assignatRate <= 50 || state.refusals >= 3) {
      activeTags.add("money");
      activeTags.add("black");
    }
    if (state.war || state.requisitions >= 2) activeTags.add("war");
    if (state.requisitions >= 3) activeTags.add("province");
    if (state.terror) activeTags.add("repression");
    if (state.breadPrice >= 4) activeTags.add("aid");

    const characterRelations = state.selectedCharacter ? relationsForCharacter(state.selectedCharacter) : [];
    const characterDomains = new Set(characterRelations.map((relation) => relation.domain));
    const possibleMoves = data.moves.filter((move) => {
      const tagHit = move.tags.some((tag) => activeTags.has(tag) || tagToDomain(tag) && characterDomains.has(tagToDomain(tag)));
      if (!state.selectedCharacter) return tagHit;
      const relationHit = characterRelations.some((relation) => move.tags.some((tag) => relationTagMatch(relation, tag)));
      return tagHit && relationHit;
    });

    const triggerCards = scenarioTriggers();
    document.getElementById("calcResults").innerHTML = `
      ${triggerCards.map(resultCard).join("")}
      <div class="result-card" style="--result-color:#1f6f78">
        <h3>Что можно играть сейчас</h3>
        <p>${state.selectedCharacter ? `${selectedCharacterLabel()} получает персональный список действий по своим связям.` : "Показаны действия, открытые текущими условиями."}</p>
      </div>
      ${possibleMoves.map((move) => `
        <article class="result-card" style="--result-color:${moveColor(move)}">
          <h3>${safe(move.title)}</h3>
          <p>${safe(move.condition)}</p>
          <div class="result-meta">
            <span><b>Нужно:</b> ${safe(move.needs)}</span>
            <span><b>Дает:</b> ${safe(move.gives)}</span>
            <span><b>Цена:</b> ${safe(move.cost)}</span>
          </div>
        </article>
      `).join("") || `<div class="empty-state">При таких условиях у выбранного персонажа нет сильного механического хода. Это сигнал дать ему работу, долг, угрозу или адресата для переговоров.</div>`}
    `;
  }

  function scenarioTriggers() {
    const cards = [];
    if (state.breadPrice >= 4 || state.hunger >= 5) {
      cards.push({ title: "Хлебный кризис открыт", text: "Можно запускать очередь, помощь, обвинение спекулянта, хлебный марш или требование Максимума.", color: data.domains.food.color });
    }
    if (state.assignatRate <= 50 || state.refusals >= 3) {
      cards.push({ title: "Кризис бумажных денег", text: "Отказ от ассигнатов становится легальным игровым конфликтом; черный рынок и обмен на монету растут.", color: data.domains.economy.color });
    }
    if (state.war) {
      cards.push({ title: "Война ускоряет все", text: "Открыты рекрутчина, армейские заказы, реквизиции, подозрение в измене и карьера военных.", color: data.domains.war.color });
    }
    if (state.requisitions >= 3) {
      cards.push({ title: "Порог деревенской злости", text: "Можно собирать сельское сопротивление, отказ от поставок, укрытие рекрутов или Вандею.", color: data.domains.provinces.color });
    }
    if (state.terror) {
      cards.push({ title: "Подозрение стало процедурой", text: "Донос, ордер, обыск и конфискация становятся быстрыми действиями, но копят усталость и страх элит.", color: data.domains.repression.color });
    }
    return cards.length ? cards : [{ title: "Система еще держится", text: "Лучшие ходы сейчас: работа, долг, переговоры, частная помощь, подготовка декрета.", color: data.domains.work.color }];
  }

  function resultCard(card) {
    return `
      <article class="result-card" style="--result-color:${card.color}">
        <h3>${escapeHtml(card.title)}</h3>
        <p>${escapeHtml(card.text)}</p>
      </article>
    `;
  }

  function renderRelationInspector(id) {
    const relation = relationsById[id] || data.relations[0];
    const domain = data.domains[relation.domain];
    const participants = relation.participants.map((characterId) => charactersById[characterId]).filter(Boolean);
    const incoming = data.links.filter(([, to]) => to === relation.id).map(([from]) => relationsById[from].title);
    const outgoing = data.links.filter(([from]) => from === relation.id).map(([, to]) => relationsById[to].title);

    document.getElementById("relationInspector").innerHTML = `
      <div class="inspector-kicker">${escapeHtml(domain.label)} / ${escapeHtml(stageLabel(relation.stage))}</div>
      <h2>${escapeHtml(relation.title)}</h2>
      <p class="inspector-summary">${escapeHtml(relation.summary)}</p>
      <div class="detail-grid">
        ${detailBlock("Получает", relation.gives)}
        ${detailBlock("Отдает / цена", relation.takes)}
        ${tokenBlock("Персонажи", participants.map((character) => character.name))}
        ${tokenBlock("Мастерские/NPC узлы", relation.npc)}
        ${tokenBlock("Игроки могут", relation.playerLevers)}
        ${tokenBlock("Мастера считают", relation.masterLevers)}
        ${tokenBlock("Открывает", relation.opens)}
        ${tokenBlock("Входит из", incoming.length ? incoming : ["нет прямого входа"])}
        ${tokenBlock("Ведет к", outgoing.length ? outgoing : ["нет прямого выхода"])}
      </div>
    `;
  }

  function renderCharacterInspector(id) {
    const character = charactersById[id];
    if (!character) {
      document.getElementById("relationInspector").innerHTML = `<div class="empty-state">Выберите персонажа.</div>`;
      return;
    }
    const group = data.groups[character.group];
    const relations = relationsForCharacter(id);
    const moves = movesForCharacter(id);
    document.getElementById("relationInspector").innerHTML = `
      <div class="inspector-kicker">${escapeHtml(group.label)}</div>
      <h2>${escapeHtml(character.name)}</h2>
      <p class="inspector-summary">Механически связан через ${relations.length} типов взаимодействий. Его ресурсы важны только если проходят через сделку, печать, долг, статус, хлеб или подозрение.</p>
      <div class="detail-grid">
        ${tokenBlock("Ресурсы на руках", character.resources)}
        ${tokenBlock("Риски", character.risks)}
        ${tokenBlock("Связи", relations.map((relation) => relation.title))}
      </div>
      <div class="inspector-actions">
        ${moves.map((move) => `
          <div class="action-row">
            <b>${safe(move.title)}</b>
            <span>${safe(move.needs)} -> ${safe(move.gives)}</span>
          </div>
        `).join("")}
      </div>
    `;
  }

  function detailBlock(title, text) {
    return `
      <div class="detail-block">
        <h3>${escapeHtml(title)}</h3>
        <p>${safe(text)}</p>
      </div>
    `;
  }

  function tokenBlock(title, items) {
    return `
      <div class="detail-block">
        <h3>${escapeHtml(title)}</h3>
        <div class="token-row">
          ${items.map((item) => `<span class="token">${safe(item)}</span>`).join("")}
        </div>
      </div>
    `;
  }

  function filteredRelations() {
    const query = normalize(state.search);
    return data.relations.filter((relation) => {
      if (state.domain !== "all" && relation.domain !== state.domain) return false;
      if (!query) return true;
      const participantNames = relation.participants.map((id) => charactersById[id] ? charactersById[id].name : id);
      const haystack = [
        relation.title,
        relation.summary,
        relation.gives,
        relation.takes,
        ...relation.playerLevers,
        ...relation.masterLevers,
        ...relation.opens,
        ...relation.npc,
        ...participantNames
      ].join(" ");
      return normalize(haystack).includes(query);
    });
  }

  function filteredCharacters() {
    const query = normalize(state.search);
    return data.characters.filter((character) => {
      if (state.group !== "all" && character.group !== state.group) return false;
      if (!query) return true;
      const relations = relationsForCharacter(character.id).map((relation) => relation.title);
      const haystack = [
        character.name,
        data.groups[character.group].label,
        ...character.resources,
        ...character.risks,
        ...relations
      ].join(" ");
      return normalize(haystack).includes(query);
    });
  }

  function filteredIncomeRows() {
    const query = normalize(state.search);
    const rowsById = new Map(data.incomeModel.rows.map((income) => [income.characterId, income]));
    return data.characters
      .filter((character) => rowsById.has(character.id))
      .filter((character) => state.group === "all" || character.group === state.group)
      .map((character) => ({ character, income: rowsById.get(character.id) }))
      .filter(({ character, income }) => {
        if (!query) return true;
        const haystack = [
          character.name,
          data.groups[character.group].label,
          income.start,
          income.income,
          income.source,
          income.kind,
          income.condition
        ].join(" ");
        return normalize(displayText(haystack)).includes(query);
      });
  }

  function ensureSelectedRelation(visibleIds) {
    if (visibleIds.has(state.selectedRelation)) return;
    const first = [...visibleIds][0];
    state.selectedRelation = first || data.relations[0].id;
  }

  function connectedRelationIds(id) {
    const ids = new Set([id]);
    data.links.forEach(([from, to]) => {
      if (from === id) ids.add(to);
      if (to === id) ids.add(from);
    });
    return ids;
  }

  function relationPath(from, to) {
    const dx = Math.max(8, Math.abs(to.x - from.x) * .48);
    const c1x = from.x + dx;
    const c2x = to.x - dx;
    return `M ${from.x} ${from.y} C ${c1x} ${from.y}, ${c2x} ${to.y}, ${to.x} ${to.y}`;
  }

  function relationsForCharacter(characterId) {
    return data.relations.filter((relation) => relation.participants.includes(characterId));
  }

  function movesForCharacter(characterId) {
    const relations = relationsForCharacter(characterId);
    return data.moves.filter((move) => relations.some((relation) => move.tags.some((tag) => relationTagMatch(relation, tag)))).slice(0, 7);
  }

  function relationTagMatch(relation, tag) {
    if (tag === "bread") return relation.domain === "food";
    if (tag === "money" || tag === "property") return relation.domain === "economy";
    if (tag === "black") return relation.id === "black_market";
    if (tag === "work" || tag === "aid") return relation.domain === "work";
    if (tag === "politics") return relation.domain === "politics";
    if (tag === "religion") return relation.domain === "religion";
    if (tag === "war") return relation.domain === "war";
    if (tag === "street") return relation.domain === "street";
    if (tag === "repression") return relation.domain === "repression";
    if (tag === "province") return relation.domain === "provinces";
    return false;
  }

  function tagToDomain(tag) {
    const map = {
      bread: "food",
      money: "economy",
      property: "economy",
      work: "work",
      aid: "work",
      politics: "politics",
      religion: "religion",
      war: "war",
      street: "street",
      repression: "repression",
      province: "provinces"
    };
    return map[tag] || "";
  }

  function selectedCharacterLabel() {
    return state.selectedCharacter && charactersById[state.selectedCharacter] ? charactersById[state.selectedCharacter].name : "все";
  }

  function poolColor(id) {
    if (id.toLowerCase().includes("bread")) return data.domains.food.color;
    if (id.toLowerCase().includes("grain")) return data.domains.food.color;
    if (id.toLowerCase().includes("hunger")) return data.domains.food.color;
    if (id.toLowerCase().includes("coin") || id.toLowerCase().includes("assignat")) return data.domains.economy.color;
    if (id.toLowerCase().includes("debt") || id.toLowerCase().includes("tax")) return data.domains.economy.color;
    if (id.toLowerCase().includes("suspicion")) return data.domains.repression.color;
    if (id.toLowerCase().includes("rural")) return data.domains.provinces.color;
    if (id.toLowerCase().includes("street")) return data.domains.street.color;
    return data.domains.work.color;
  }

  function moveColor(move) {
    if (move.tags.includes("bread")) return data.domains.food.color;
    if (move.tags.includes("war")) return data.domains.war.color;
    if (move.tags.includes("repression")) return data.domains.repression.color;
    if (move.tags.includes("religion")) return data.domains.religion.color;
    if (move.tags.includes("politics")) return data.domains.politics.color;
    if (move.tags.includes("province")) return data.domains.provinces.color;
    if (move.tags.includes("money") || move.tags.includes("property") || move.tags.includes("black")) return data.domains.economy.color;
    return data.domains.work.color;
  }

  function stageLabel(stage) {
    return {
      source: "ресурс",
      exchange: "обмен",
      pressure: "давление",
      outcome: "последствие"
    }[stage] || stage;
  }

  function normalize(text) {
    return String(text || "").toLowerCase().replace(/\s+/g, " ").trim();
  }

  function safe(value) {
    return escapeHtml(displayText(value));
  }

  function displayText(value) {
    let text = String(value || "");
    const labels = {
      ASSIGNAT: "ассигнаты",
      BREAD_NEED: "потребность в хлебе",
      BREAD: "хлеб",
      COIN: "монеты",
      DEBT: "госдолг",
      DUE: "расписка",
      GRAIN: "зерно",
      HIDDEN: "скрытый запас",
      HUNGER: "голод",
      LEAFLET: "листовки",
      MEDICINE: "лекарство",
      OATH: "присяга",
      ORDER: "поручение",
      PAPER: "бумага",
      PROPERTY: "собственность",
      PROTECTION: "защита",
      RIGHT: "право",
      SICK: "болезнь",
      SOLDIER: "военный статус",
      STATE: "государственный",
      SUSPICION: "подозрение",
      TAX_DUE: "налоговый долг",
      WORK: "работа"
    };

    Object.entries(labels)
      .sort((a, b) => b[0].length - a[0].length)
      .forEach(([token, label]) => {
        text = text.replace(new RegExp(`\\b${escapeRegExp(token)}\\b`, "g"), label);
      });
    return text;
  }

  function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
