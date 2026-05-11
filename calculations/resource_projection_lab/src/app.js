(function () {
  const scenarioSelect = document.querySelector("#scenarioSelect");
  const resetButton = document.querySelector("#resetButton");
  const controlsRoot = document.querySelector("#controlsRoot");
  const kpiRoot = document.querySelector("#kpiRoot");
  const notesRoot = document.querySelector("#notesRoot");
  const tableBody = document.querySelector("#historyTable tbody");
  const scenarioTitle = document.querySelector("#scenarioTitle");
  const scenarioDescription = document.querySelector("#scenarioDescription");

  const controlDefs = [
    { id: "players", label: "Игроки", group: "Состав", min: 20, max: 90, step: 1, source: "players" },
    { id: "turns", label: "Ходы", group: "Состав", min: 3, max: 14, step: 1, source: "policy.turns" },
    { id: "marketBread", label: "Хлеб на рынке", group: "Старт", min: 0, max: 90, step: 1, source: "initial.marketBread" },
    { id: "churchBread", label: "Хлеб церкви", group: "Старт", min: 0, max: 30, step: 1, source: "initial.churchBread" },
    { id: "roadGrain", label: "Зерно в дороге", group: "Старт", min: 0, max: 50, step: 1, source: "initial.roadGrain" },
    { id: "treasuryCoin", label: "Казна", group: "Старт", min: 0, max: 80, step: 1, source: "initial.treasuryCoin" },
    { id: "incomingGrainPerTurn", label: "Подвоз зерна", group: "Поставка", min: 0, max: 20, step: 1, source: "policy.incomingGrainPerTurn" },
    { id: "deliveryRate", label: "Доходит до города", group: "Поставка", min: 0, max: 100, step: 5, source: "policy.deliveryRate", percent: true },
    { id: "hiddenShare", label: "Прячут зерно", group: "Поставка", min: 0, max: 60, step: 5, source: "policy.hiddenShare", percent: true },
    { id: "requisitionShare", label: "Реквизиция", group: "Поставка", min: 0, max: 60, step: 5, source: "policy.requisitionShare", percent: true },
    { id: "churchAidShare", label: "Помощь церкви", group: "Действия", min: 0, max: 100, step: 5, source: "policy.churchAidShare", percent: true },
    { id: "stateJobs", label: "Госработы", group: "Действия", min: 0, max: 14, step: 1, source: "policy.stateJobs" },
    { id: "privateJobs", label: "Частный найм", group: "Действия", min: 0, max: 14, step: 1, source: "policy.privateJobs" },
    { id: "assignatPaymentShare", label: "Оплата бумагой", group: "Деньги", min: 0, max: 100, step: 5, source: "policy.assignatPaymentShare", percent: true },
    { id: "warCost", label: "Расход войны", group: "Деньги", min: 0, max: 25, step: 1, source: "policy.warCost" }
  ];

  function getByPath(source, path) {
    if (path === "players") {
      return source.groups.reduce((acc, group) => acc + group.count, 0);
    }
    return path.split(".").reduce((acc, key) => acc[key], source);
  }

  function setByPath(target, path, value) {
    const [root, key] = path.split(".");
    if (!target[root]) {
      target[root] = {};
    }
    target[root][key] = value;
  }

  function formatValue(value, def) {
    return def.percent ? `${value}%` : value.toString();
  }

  function readControl(def) {
    const input = document.querySelector(`#${def.id}`);
    const raw = Number(input.value);
    return def.percent ? raw / 100 : raw;
  }

  function currentScenario() {
    return window.RESOURCE_SCENARIOS.find((item) => item.id === scenarioSelect.value)
      || window.RESOURCE_SCENARIOS[0];
  }

  function buildScenarioSelect() {
    scenarioSelect.innerHTML = window.RESOURCE_SCENARIOS
      .map((scenario) => `<option value="${scenario.id}">${scenario.name}</option>`)
      .join("");
  }

  function buildControls() {
    const groups = new Map();
    controlDefs.forEach((def) => {
      if (!groups.has(def.group)) {
        groups.set(def.group, []);
      }
      groups.get(def.group).push(def);
    });

    controlsRoot.innerHTML = [...groups.entries()].map(([name, defs]) => `
      <section class="control-group">
        <h2>${name}</h2>
        <div class="control-grid">
          ${defs.map((def) => `
            <label class="control">
              <span>${def.label}</span>
              <output id="${def.id}Value"></output>
              <input id="${def.id}" type="range" min="${def.min}" max="${def.max}" step="${def.step}">
            </label>
          `).join("")}
        </div>
      </section>
    `).join("");

    controlDefs.forEach((def) => {
      const input = document.querySelector(`#${def.id}`);
      input.addEventListener("input", () => {
        document.querySelector(`#${def.id}Value`).textContent = formatValue(input.value, def);
        render();
      });
    });
  }

  function resetControls() {
    const scenario = currentScenario();
    controlDefs.forEach((def) => {
      const input = document.querySelector(`#${def.id}`);
      const value = getByPath(scenario, def.source);
      input.value = def.percent ? Math.round(value * 100) : value;
      document.querySelector(`#${def.id}Value`).textContent = formatValue(input.value, def);
    });
  }

  function collectOverrides() {
    const overrides = { policy: {}, initial: {} };
    controlDefs.forEach((def) => {
      const value = readControl(def);
      if (def.source === "players") {
        overrides.players = value;
      } else {
        setByPath(overrides, def.source, value);
      }
    });

    const maximumToggle = document.querySelector("#maximumToggle");
    const hoardingToggle = document.querySelector("#hoardingToggle");
    overrides.policy.maximum = maximumToggle.checked;
    overrides.policy.earlyHoarding = hoardingToggle.checked;
    return overrides;
  }

  function renderKpi(result) {
    const { summary } = result;
    const final = summary.final;
    const hungerText = summary.firstHungerTurn === null ? "нет" : `ход ${summary.firstHungerTurn}`;
    const marketText = summary.firstMarketEmptyTurn === null ? "нет" : `ход ${summary.firstMarketEmptyTurn}`;
    const treasuryText = summary.firstTreasuryEmptyTurn === null ? "нет" : `ход ${summary.firstTreasuryEmptyTurn}`;

    const items = [
      ["Массовый голод", hungerText],
      ["Рынок пустеет", marketText],
      ["Казна пустеет", treasuryText],
      ["Голод за период", final.totalHungry],
      ["Долги", final.totalDebt],
      ["Черный рынок", final.blackMarket],
      ["Богаче всех", `${summary.richest.name}: ${summary.richest.wealthPerPlayer}`],
      ["Беднее всех", `${summary.poorest.name}: ${summary.poorest.wealthPerPlayer}`]
    ];

    kpiRoot.innerHTML = items.map(([label, value]) => `
      <div class="kpi">
        <span>${label}</span>
        <strong>${value}</strong>
      </div>
    `).join("");
  }

  function renderNotes(result) {
    notesRoot.innerHTML = result.scenario.notes.map((note) => `<li>${note}</li>`).join("");
  }

  function renderTable(history) {
    tableBody.innerHTML = history.slice(1).map((snap) => `
      <tr>
        <td>${snap.turn}</td>
        <td>${snap.marketBread}</td>
        <td>${snap.roadGrain}</td>
        <td>${snap.hiddenGrain}</td>
        <td>${snap.stats.hungry}</td>
        <td>${snap.totalDebt}</td>
        <td>${snap.treasuryCoin}</td>
        <td>${snap.legalPrice}</td>
        <td>${snap.blackMarket}</td>
        <td>${snap.assignatTrust}</td>
      </tr>
    `).join("");
  }

  function renderCharts(result) {
    const labels = result.history.map((snap) => snap.turn.toString());
    const history = result.history;
    const chart = window.ResourceCharts;

    chart.drawLineChart(document.querySelector("#breadChart"), {
      title: "Хлеб, голод и цена",
      labels,
      series: [
        { name: "рынок", color: chart.palette.bread, values: history.map((snap) => snap.marketBread) },
        { name: "черн. хлеб", color: chart.palette.purple, values: history.map((snap) => snap.blackBread) },
        { name: "голод за ход", color: chart.palette.hunger, values: history.map((snap) => snap.stats.hungry || 0) },
        { name: "цена", color: chart.palette.warning, values: history.map((snap) => snap.legalPrice) }
      ]
    });

    chart.drawLineChart(document.querySelector("#resourceChart"), {
      title: "Зерно по местам",
      labels,
      series: [
        { name: "дорога", color: chart.palette.warning, values: history.map((snap) => snap.roadGrain) },
        { name: "булочник", color: chart.palette.bread, values: history.map((snap) => snap.bakerGrain) },
        { name: "спрятано", color: chart.palette.dark, values: history.map((snap) => snap.hiddenGrain) },
        { name: "реквиз.", color: chart.palette.hunger, values: history.map((snap) => snap.stateGrain) }
      ]
    });

    chart.drawLineChart(document.querySelector("#moneyChart"), {
      title: "Казна, долги и невыплаты",
      labels,
      series: [
        { name: "казна", color: chart.palette.money, values: history.map((snap) => snap.treasuryCoin) },
        { name: "долги", color: chart.palette.hunger, values: history.map((snap) => snap.totalDebt) },
        { name: "невыплаты", color: chart.palette.warning, values: history.map((snap) => snap.wageDue) },
        { name: "ассигнаты", color: chart.palette.purple, values: history.map((snap) => snap.assignats) }
      ]
    });

    chart.drawLineChart(document.querySelector("#tensionChart"), {
      title: "Напряжение, черный рынок, доверие",
      labels,
      minY: 0,
      maxY: 100,
      series: [
        { name: "город", color: chart.palette.hunger, values: history.map((snap) => snap.cityUnrest) },
        { name: "деревня", color: chart.palette.warning, values: history.map((snap) => snap.ruralUnrest) },
        { name: "черный рынок", color: chart.palette.dark, values: history.map((snap) => snap.blackMarket) },
        { name: "ассигнат", color: chart.palette.money, values: history.map((snap) => snap.assignatTrust) }
      ]
    });

    chart.drawGroupBars(document.querySelector("#groupsChart"), result.summary.final.groups);
  }

  function render() {
    const scenario = currentScenario();
    const result = window.ResourceModel.simulate(scenario, collectOverrides());

    scenarioTitle.textContent = result.scenario.name;
    scenarioDescription.textContent = result.scenario.description;
    renderKpi(result);
    renderNotes(result);
    renderTable(result.history);
    renderCharts(result);
  }

  function syncTogglesToScenario() {
    const scenario = currentScenario();
    document.querySelector("#maximumToggle").checked = scenario.policy.maximum;
    document.querySelector("#hoardingToggle").checked = scenario.policy.earlyHoarding;
  }

  window.addEventListener("resize", () => render());
  resetButton.addEventListener("click", () => {
    syncTogglesToScenario();
    resetControls();
    render();
  });
  scenarioSelect.addEventListener("change", () => {
    syncTogglesToScenario();
    resetControls();
    render();
  });
  document.querySelector("#maximumToggle").addEventListener("change", render);
  document.querySelector("#hoardingToggle").addEventListener("change", render);

  buildScenarioSelect();
  buildControls();
  syncTogglesToScenario();
  resetControls();
  render();
})();
