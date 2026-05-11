(function () {
  const data = window.REVOLUTION_ECONOMY_DATA;
  const rolesById = Object.fromEntries(data.roles.map((role) => [role.id, role]));
  const scenarioSelect = document.getElementById("scenarioSelect");
  const policySelect = document.getElementById("policySelect");
  const runsInput = document.getElementById("runsInput");
  const runBtn = document.getElementById("runBtn");
  const app = document.getElementById("app");
  const topStats = document.getElementById("topStats");

  const state = {
    scenario: "baseline_1789",
    policy: "none",
    tab: readInitialTab(),
    runs: 1000
  };
  const FOOD_UNIT = 0.75;

  function init() {
    fillSelects();
    bindUi();
    syncActiveTab();
    render();
  }

  function fillSelects() {
    scenarioSelect.innerHTML = Object.entries(data.scenarios)
      .map(([id, scenario]) => `<option value="${id}">${escapeHtml(scenario.label)}</option>`)
      .join("");
    policySelect.innerHTML = Object.entries(data.policies)
      .map(([id, policy]) => `<option value="${id}">${escapeHtml(policy.label)}</option>`)
      .join("");
    scenarioSelect.value = state.scenario;
    policySelect.value = state.policy;
  }

  function bindUi() {
    scenarioSelect.addEventListener("change", () => {
      state.scenario = scenarioSelect.value;
      render();
    });
    policySelect.addEventListener("change", () => {
      state.policy = policySelect.value;
      render();
    });
    runsInput.addEventListener("change", () => {
      state.runs = clamp(Number(runsInput.value) || 1000, 100, 5000);
      runsInput.value = state.runs;
    });
    runBtn.addEventListener("click", () => render());
    document.querySelectorAll(".tab-button").forEach((button) => {
      button.addEventListener("click", () => {
        state.tab = button.dataset.tab;
        window.location.hash = state.tab;
        syncActiveTab();
        render();
      });
    });
    window.addEventListener("hashchange", () => {
      state.tab = readInitialTab();
      syncActiveTab();
      render();
    });
  }

  function readInitialTab() {
    const allowed = new Set(["deterministic", "scenarios", "montecarlo", "sensitivity", "roles"]);
    const hash = window.location.hash.replace("#", "");
    return allowed.has(hash) ? hash : "deterministic";
  }

  function syncActiveTab() {
    document.querySelectorAll(".tab-button").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.tab === state.tab);
    });
  }

  function render() {
    state.runs = clamp(Number(runsInput.value) || state.runs, 100, 5000);
    const result = runScenario(state.scenario, state.policy);
    renderTopStats(result);

    if (state.tab === "scenarios") {
      renderScenarioMatrix();
    } else if (state.tab === "montecarlo") {
      renderMonteCarlo();
    } else if (state.tab === "sensitivity") {
      renderSensitivity();
    } else if (state.tab === "roles") {
      renderRoles();
    } else {
      renderDeterministic(result);
    }
  }

  function runScenario(scenarioId, policyId, options = {}) {
    const scenario = clone(data.scenarios[scenarioId]);
    const policy = data.policies[policyId] || data.policies.none;
    const roles = data.roles.map((role) => applyRolePatch(role, options.patch || {}));
    const states = Object.fromEntries(roles.map((role) => [role.id, { cash: role.startCash, debt: 0, crisisCount: 0 }]));
    const rows = [];
    const turnSummaries = [];
    const finalTracks = emptyTracks();

    scenario.turns = scenario.turns.map((turn, index) => applyTurnPatch(turn, options.patch || {}, index));

    scenario.turns.forEach((turn, index) => {
      const activePolicy = index === scenario.turns.length - 1 ? policy : data.policies.none;
      const policyEffects = activePolicy.effects || {};
      const effectiveTurn = applyPolicyToTurn(turn, policyEffects);
      const tracks = {
        street: effectiveTurn.street || 0,
        suspicion: effectiveTurn.suspicion || 0,
        politicization: effectiveTurn.politicization || 0,
        blackMarket: 0,
        debtDependency: 0,
        unemployment: 0,
        eliteFear: 0,
        eliteConfidence: 0,
        provinceAnger: 0,
        municipalFund: 0
      };

      addTrackPatch(tracks, policyEffects);

      roles.forEach((role) => {
        const result = calculateRoleTurn(role, states[role.id], effectiveTurn, activePolicy, options.rng);
        states[role.id] = result.nextState;
        addTrackPatch(tracks, result.impact);
        rows.push({
          turnIndex: index,
          turn: turn.label,
          policy: activePolicy.label,
          role,
          ...result
        });
      });

      const turnRows = rows.filter((row) => row.turnIndex === index);
      Object.keys(finalTracks).forEach((key) => {
        finalTracks[key] += tracks[key] || 0;
      });
      turnSummaries.push({
        label: turn.label,
        bread: effectiveTurn.bread,
        work: effectiveTurn.work,
        supply: effectiveTurn.supply,
        assignatRate: effectiveTurn.assignatRate,
        tracks,
        crisis: turnRows.filter((row) => row.statusKey === "crisis").length,
        stress: turnRows.filter((row) => row.statusKey === "stress").length,
        surplus: turnRows.filter((row) => row.statusKey === "surplus").length,
        avgNet: average(turnRows.map((row) => row.rawNet))
      });
    });

    const finalRows = rows.filter((row) => row.turnIndex === scenario.turns.length - 1);
    const roleSummaries = roles.map((role) => {
      const roleRows = rows.filter((row) => row.role.id === role.id);
      const final = roleRows[roleRows.length - 1];
      return {
        role,
        totalRawNet: sum(roleRows.map((row) => row.rawNet)),
        worstNet: Math.min(...roleRows.map((row) => row.rawNet)),
        crisisTurns: roleRows.filter((row) => row.statusKey === "crisis").length,
        stressTurns: roleRows.filter((row) => row.statusKey === "stress").length,
        finalCash: final.nextState.cash,
        finalDebt: final.nextState.debt,
        lastStatus: final.statusKey,
        moves: roleRows.filter((row) => row.requiredMove).map((row) => `${row.turn}: ${row.requiredMove}`)
      };
    });

    return {
      scenario,
      scenarioId,
      policy,
      policyId,
      rows,
      finalRows,
      turnSummaries,
      roleSummaries,
      finalTracks,
      totals: summarize(rows, roleSummaries, finalTracks)
    };
  }

  function calculateRoleTurn(role, prevState, turn, policy, rng) {
    const policyEffects = policy.effects || {};
    const randomIncome = rng ? rngBetween(rng, -role.baseIncome * 0.12, role.baseIncome * 0.12) : 0;
    const workFactor = 1 + role.workSensitivity * (turn.work - 1);
    const demandFactor = 1 + role.demandSensitivity * (turn.demand - 1);
    const supplyFactor = 1 + role.supplySensitivity * (turn.supply - 1);
    const assignatLoss = (1 - turn.assignatRate) * role.assignatExposure * role.baseIncome;
    const traderModifier = isTrader(role)
      ? (policyEffects.traderIncomeBonus || 0) + (policyEffects.traderIncomePenalty || 0)
      : 0;
    const income = Math.max(0, role.baseIncome * workFactor * demandFactor * supplyFactor - assignatLoss + (policyEffects.incomeBonus || 0) + traderModifier + randomIncome);

    const breadRelief = (policyEffects.consumerBreadRelief || 0) + role.foodRelief;
    const breadPrice = Math.max(0.5, turn.bread - breadRelief);
    const foodCost = role.mouths * breadPrice * FOOD_UNIT;
    const debtPayment = Math.min(prevState.debt, prevState.debt * 0.25);
    const expenses = foodCost + role.fixedCost + role.professionCost + role.statusCost + debtPayment;
    const rawNet = income - expenses;
    const status = classify(rawNet);
    const impact = {};
    let requiredMove = "";
    let nextCash = prevState.cash + rawNet;
    let nextDebt = prevState.debt - debtPayment;

    if (status.key === "surplus") {
      requiredMove = role.surplusMove;
      addTrackPatch(impact, role.surplusImpact || {});
    } else if (status.key === "stress") {
      requiredMove = role.stressMove;
      addTrackPatch(impact, role.stressImpact || {});
    } else if (status.key === "crisis") {
      requiredMove = role.crisisMove;
      addTrackPatch(impact, role.crisisImpact || {});
    }

    if (nextCash < 0) {
      const need = Math.abs(nextCash);
      const room = Math.max(0, role.creditLimit - nextDebt);
      const borrowed = Math.min(need, room);
      nextDebt += borrowed;
      nextCash += borrowed;
      if (borrowed > 0) {
        impact.debtDependency = (impact.debtDependency || 0) + borrowed;
      }
      if (nextCash < 0) {
        impact.street = (impact.street || 0) + 1;
        nextCash = 0;
      }
    }

    return {
      income,
      foodCost,
      expenses,
      rawNet,
      statusKey: status.key,
      statusLabel: status.label,
      requiredMove,
      impact,
      nextState: {
        cash: round(nextCash),
        debt: round(Math.max(0, nextDebt)),
        crisisCount: prevState.crisisCount + (status.key === "crisis" ? 1 : 0)
      }
    };
  }

  function renderTopStats(result) {
    topStats.innerHTML = [
      { value: data.roles.length, label: "ролей" },
      { value: result.scenario.turns.length, label: "такта" },
      { value: result.totals.crisisRoleTurns, label: "кризис-ходов" },
      { value: format(result.totals.streetRisk), label: "улица" }
    ].map((stat) => `<div class="stat"><b>${stat.value}</b><span>${escapeHtml(stat.label)}</span></div>`).join("");
  }

  function renderDeterministic(result) {
    app.innerHTML = `
      <div class="economy-grid">
        <section class="panel">
          ${summaryStrip(result)}
          <div class="table-wrap">
            <table class="sim-table">
              <thead>
                <tr>
                  <th>Такт</th>
                  <th>Роль</th>
                  <th>Доход</th>
                  <th>Хлеб</th>
                  <th>Расходы</th>
                  <th>Итог</th>
                  <th>Состояние</th>
                  <th>Обязательный ход</th>
                  <th>Долг после</th>
                </tr>
              </thead>
              <tbody>
                ${result.rows.map(rowDeterministic).join("")}
              </tbody>
            </table>
          </div>
          <p class="scenario-note">${escapeHtml(result.scenario.note)} Решение в 4 такте: ${escapeHtml(result.policy.description)}</p>
        </section>
        <aside class="panel inspector">
          ${renderTrackPanel(result)}
        </aside>
      </div>
    `;
  }

  function rowDeterministic(row) {
    return `
      <tr>
        <td>${escapeHtml(row.turn)}</td>
        <td><b>${escapeHtml(row.role.title)}</b><br><span class="muted">${escapeHtml(row.role.incomeName)}</span></td>
        <td class="num">${format(row.income)}</td>
        <td class="num">${format(row.foodCost)}</td>
        <td class="num">${format(row.expenses)}</td>
        <td class="num">${formatSigned(row.rawNet)}</td>
        <td>${statusPill(row.statusKey, row.statusLabel)}</td>
        <td>${escapeHtml(row.requiredMove || "может действовать свободно")}</td>
        <td class="num">${format(row.nextState.debt)}</td>
      </tr>
    `;
  }

  function renderScenarioMatrix() {
    const rows = data.scenarioMatrix.map((item) => {
      const result = runScenario(item.scenario, item.policy);
      const winners = result.roleSummaries
        .filter((summary) => summary.totalRawNet > 2)
        .sort((a, b) => b.totalRawNet - a.totalRawNet)
        .slice(0, 2)
        .map((summary) => summary.role.title);
      const targets = result.roleSummaries
        .filter((summary) => summary.crisisTurns || summary.stressTurns >= 2)
        .sort((a, b) => b.crisisTurns - a.crisisTurns || a.worstNet - b.worstNet)
        .slice(0, 3)
        .map((summary) => summary.role.title);
      return { item, result, winners, targets };
    });

    app.innerHTML = `
      <section class="panel">
        <div class="panel-head">
          <div>
            <h2 class="panel-title">Сценарная матрица</h2>
            <p class="panel-subtitle">Каждая строка - полный четырехтактный прогон. Так видно, какие решения смягчают город, а какие сдвигают кризис в черный рынок, подозрение или долг.</p>
          </div>
        </div>
        <div class="table-wrap">
          <table class="sim-table">
            <thead>
              <tr>
                <th>Сценарий</th>
                <th>Решение</th>
                <th>Кризис-ходы</th>
                <th>Стресс-ходы</th>
                <th>Улица</th>
                <th>Подозрение</th>
                <th>Черный рынок</th>
                <th>Долговая зависимость</th>
                <th>Кто выигрывает</th>
                <th>Кто мишень</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map(({ item, result, winners, targets }) => `
                <tr>
                  <td>${escapeHtml(data.scenarios[item.scenario].label)}</td>
                  <td>${escapeHtml(data.policies[item.policy].label)}</td>
                  <td class="num">${result.totals.crisisRoleTurns}</td>
                  <td class="num">${result.totals.stressRoleTurns}</td>
                  <td class="num">${format(result.totals.streetRisk)}</td>
                  <td class="num">${format(result.totals.suspicionRisk)}</td>
                  <td class="num">${format(result.totals.blackMarketRisk)}</td>
                  <td class="num">${format(result.totals.debtDependency)}</td>
                  <td>${escapeHtml(winners.join(", ") || "нет явных")}</td>
                  <td>${escapeHtml(targets.join(", ") || "нет явных")}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </section>
    `;
  }

  function renderMonteCarlo() {
    const runs = state.runs;
    const accum = {
      streetThreshold: 0,
      blackMarketThreshold: 0,
      suspicionThreshold: 0,
      totalCrisisRoleTurns: 0,
      totalStressRoleTurns: 0,
      byRole: Object.fromEntries(data.roles.map((role) => [role.id, { crisis: 0, stress: 0, avgNet: 0, maxDebt: 0 }]))
    };

    for (let i = 0; i < runs; i += 1) {
      const rng = seededRandom(1000 + i * 17);
      const patch = randomPatch(rng);
      const result = runScenario(state.scenario, state.policy, { patch, rng });
      if (result.totals.streetRisk >= 40) accum.streetThreshold += 1;
      if (result.totals.blackMarketRisk >= 10) accum.blackMarketThreshold += 1;
      if (result.totals.suspicionRisk >= 30) accum.suspicionThreshold += 1;
      accum.totalCrisisRoleTurns += result.totals.crisisRoleTurns;
      accum.totalStressRoleTurns += result.totals.stressRoleTurns;
      result.roleSummaries.forEach((summary) => {
        const bucket = accum.byRole[summary.role.id];
        if (summary.crisisTurns > 0) bucket.crisis += 1;
        if (summary.stressTurns > 0) bucket.stress += 1;
        bucket.avgNet += summary.totalRawNet;
        bucket.maxDebt += summary.finalDebt;
      });
    }

    const roleRows = data.roles.map((role) => {
      const bucket = accum.byRole[role.id];
      return {
        role,
        crisisPct: bucket.crisis / runs,
        stressPct: bucket.stress / runs,
        avgNet: bucket.avgNet / runs,
        avgDebt: bucket.maxDebt / runs
      };
    }).sort((a, b) => b.crisisPct - a.crisisPct || b.stressPct - a.stressPct);

    app.innerHTML = `
      <div class="economy-grid">
        <section class="panel">
          <div class="summary-strip">
            ${summaryCard(pct(accum.streetThreshold / runs), "вероятность уличного порога", "#a84d6f")}
            ${summaryCard(pct(accum.suspicionThreshold / runs), "вероятность высокого подозрения", "#a33d2e")}
            ${summaryCard(pct(accum.blackMarketThreshold / runs), "вероятность черного рынка", "#9b6a1a")}
            ${summaryCard(format(accum.totalCrisisRoleTurns / runs), "кризис-ходов в среднем", "#8f4a2f")}
            ${summaryCard(format(accum.totalStressRoleTurns / runs), "стресс-ходов в среднем", "#6c5a9b")}
          </div>
          <div class="table-wrap">
            <table class="sim-table">
              <thead>
                <tr>
                  <th>Роль</th>
                  <th>Вероятность кризиса</th>
                  <th>Вероятность стресса</th>
                  <th>Средний итог за 4 такта</th>
                  <th>Средний долг к финалу</th>
                  <th>Чтение</th>
                </tr>
              </thead>
              <tbody>
                ${roleRows.map((row) => `
                  <tr>
                    <td><b>${escapeHtml(row.role.title)}</b><br>${escapeHtml(row.role.group)}</td>
                    <td class="num">${pct(row.crisisPct)}</td>
                    <td class="num">${pct(row.stressPct)}</td>
                    <td class="num">${formatSigned(row.avgNet)}</td>
                    <td class="num">${format(row.avgDebt)}</td>
                    <td>${escapeHtml(readProbability(row))}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </section>
        <aside class="panel inspector">
          <div class="inspector-kicker">Monte Carlo</div>
          <h2>${runs} прогонов</h2>
          <p class="inspector-summary">В каждом прогоне немного плавают хлеб, работа, снабжение, курс ассигната и доход роли. Это показывает устойчивость модели, а не единственный сюжет.</p>
          <div class="detail-grid">
            ${detailBlock("Сценарий", data.scenarios[state.scenario].label)}
            ${detailBlock("Решение", data.policies[state.policy].label)}
            ${detailBlock("Пороги риска", "Улица считается высокой при 40+, подозрение при 30+, черный рынок при 10+. Это не автоматическое событие, а сигнал мастерам готовить соответствующую сцену.")}
          </div>
        </aside>
      </div>
    `;
  }

  function renderSensitivity() {
    const base = runScenario(state.scenario, state.policy);
    const baseScore = pressureScore(base);
    const rows = data.sensitivity.map((test) => {
      const result = runScenario(state.scenario, state.policy, { patch: test.patch });
      const score = pressureScore(result);
      return { test, result, score, delta: score - baseScore };
    }).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

    app.innerHTML = `
      <section class="panel">
        <div class="panel-head">
          <div>
            <h2 class="panel-title">Чувствительность баланса</h2>
            <p class="panel-subtitle">Показывает, какие ручки сильнее всего меняют давление. Счет давления = кризис-ходы * 3 + стресс-ходы + улица + подозрение + черный рынок.</p>
          </div>
          <div class="stats">
            <div class="stat"><b>${format(baseScore)}</b><span>база</span></div>
          </div>
        </div>
        <div class="table-wrap">
          <table class="sim-table">
            <thead>
              <tr>
                <th>Проверка</th>
                <th>Счет давления</th>
                <th>Изменение</th>
                <th>Кризис-ходы</th>
                <th>Улица</th>
                <th>Подозрение</th>
                <th>Вывод</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map(({ test, result, score, delta }) => `
                <tr>
                  <td>${escapeHtml(test.label)}</td>
                  <td class="num">${format(score)}</td>
                  <td class="num">${formatSigned(delta)}</td>
                  <td class="num">${result.totals.crisisRoleTurns}</td>
                  <td class="num">${format(result.totals.streetRisk)}</td>
                  <td class="num">${format(result.totals.suspicionRisk)}</td>
                  <td>${escapeHtml(readSensitivity(delta))}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </section>
    `;
  }

  function renderRoles() {
    app.innerHTML = `
      <section class="panel">
        <div class="panel-head">
          <div>
            <h2 class="panel-title">Карточки 10 парижан</h2>
            <p class="panel-subtitle">Это тестовый срез, на котором проверяется экономика. Числа заданы в игровых токенах за такт и специально вынесены в отдельный файл данных.</p>
          </div>
        </div>
        <div class="role-cards">
          ${data.roles.map((role) => `
            <article class="role-card" style="--role-color:${role.color}">
              <h3>${escapeHtml(role.title)}</h3>
              <p>${escapeHtml(role.why)}</p>
              <div class="role-meta">
                <span class="mini-chip">доход: ${format(role.baseIncome)}</span>
                <span class="mini-chip">рты: ${format(role.mouths)}</span>
                <span class="mini-chip">быт: ${format(role.fixedCost)}</span>
                <span class="mini-chip">проф.: ${format(role.professionCost)}</span>
                <span class="mini-chip">кредит: ${format(role.creditLimit)}</span>
              </div>
              <p><b>При стрессе:</b> ${escapeHtml(role.stressMove)}</p>
              <p><b>При кризисе:</b> ${escapeHtml(role.crisisMove)}</p>
            </article>
          `).join("")}
        </div>
      </section>
    `;
  }

  function summaryStrip(result) {
    return `
      <div class="summary-strip">
        ${summaryCard(result.totals.crisisRoleTurns, "кризис-ходов за прогон", "#a33d2e")}
        ${summaryCard(result.totals.stressRoleTurns, "стресс-ходов за прогон", "#9b6a1a")}
        ${summaryCard(format(result.totals.streetRisk), "улица", "#a84d6f")}
        ${summaryCard(format(result.totals.suspicionRisk), "подозрение", "#3f424a")}
        ${summaryCard(format(result.totals.blackMarketRisk), "черный рынок", "#517648")}
      </div>
    `;
  }

  function summaryCard(value, label, color) {
    return `<div class="summary-card" style="--card-color:${color}"><b>${value}</b><span>${escapeHtml(label)}</span></div>`;
  }

  function renderTrackPanel(result) {
    return `
      <div class="inspector-kicker">Публичные треки</div>
      <h2>Итог прогона</h2>
      <p class="inspector-summary">Треки растут от состояния мира, выбранного решения и автоматических ходов ролей, которые ушли в стресс или кризис.</p>
      <div class="detail-grid">
        <div class="track-card">
          <h3>По тактам</h3>
          ${result.turnSummaries.map((turn) => trackRow(turn.label, `хлеб ${format(turn.bread)}, работа ${pct(turn.work)}`, (turn.bread / 6) * 100, "#a33d2e")).join("")}
        </div>
        <div class="track-card">
          <h3>Накопленные риски</h3>
          ${trackRow("Улица", format(result.totals.streetRisk), result.totals.streetRisk * 7, "#a84d6f")}
          ${trackRow("Подозрение", format(result.totals.suspicionRisk), result.totals.suspicionRisk * 7, "#3f424a")}
          ${trackRow("Черный рынок", format(result.totals.blackMarketRisk), result.totals.blackMarketRisk * 12, "#517648")}
          ${trackRow("Долг", format(result.totals.debtDependency), result.totals.debtDependency * 7, "#6c5a9b")}
        </div>
        ${detailBlock("Самые уязвимые", result.roleSummaries
          .filter((summary) => summary.crisisTurns || summary.stressTurns)
          .sort((a, b) => b.crisisTurns - a.crisisTurns || a.worstNet - b.worstNet)
          .slice(0, 4)
          .map((summary) => summary.role.title)
          .join(", ") || "нет явных")}
      </div>
    `;
  }

  function trackRow(label, value, width, color) {
    return `
      <div class="track-row">
        <span>${escapeHtml(label)}</span>
        <div class="bar" style="--bar-color:${color}"><span style="--value:${clamp(width, 0, 100)}"></span></div>
        <b>${escapeHtml(value)}</b>
      </div>
    `;
  }

  function detailBlock(title, text) {
    return `<div class="detail-block"><h3>${escapeHtml(title)}</h3><p>${escapeHtml(text)}</p></div>`;
  }

  function applyPolicyToTurn(turn, effects) {
    const next = { ...turn };
    if (effects.breadCap) next.bread = Math.min(next.bread, effects.breadCap);
    next.bread = Math.max(0.5, next.bread + (effects.breadShift || 0));
    next.supply = clamp((next.supply || 1) + (effects.supply || 0), 0.25, 1.4);
    next.assignatRate = clamp((next.assignatRate || 1) + (effects.assignatRateShift || 0), 0.4, 1.1);
    return next;
  }

  function applyTurnPatch(turn, patch, index) {
    return {
      ...turn,
      bread: Math.max(0.5, turn.bread + (patch.breadShiftAll || 0) + (patch.breadJitter?.[index] || 0)),
      work: clamp(turn.work + (patch.workShiftAll || 0) + (patch.workJitter?.[index] || 0), 0.3, 1.2),
      demand: clamp(turn.demand + (patch.demandShiftAll || 0) + (patch.demandJitter?.[index] || 0), 0.3, 1.2),
      supply: clamp(turn.supply + (patch.supplyShiftAll || 0) + (patch.supplyJitter?.[index] || 0), 0.25, 1.2),
      assignatRate: clamp(turn.assignatRate + (patch.assignatRateShiftAll || 0) + (patch.assignatJitter?.[index] || 0), 0.4, 1.1)
    };
  }

  function applyRolePatch(role, patch) {
    const next = { ...role };
    if (patch.fixedCostShift) next.fixedCost += patch.fixedCostShift;
    if (patch.mouthsShift) next.mouths += patch.mouthsShift;
    if (patch.creditMultiplier) next.creditLimit *= patch.creditMultiplier;
    return next;
  }

  function randomPatch(rng) {
    return {
      breadJitter: [0, 1, 2, 3].map(() => rngBetween(rng, -0.35, 0.55)),
      workJitter: [0, 1, 2, 3].map(() => rngBetween(rng, -0.08, 0.06)),
      demandJitter: [0, 1, 2, 3].map(() => rngBetween(rng, -0.08, 0.08)),
      supplyJitter: [0, 1, 2, 3].map(() => rngBetween(rng, -0.08, 0.08)),
      assignatJitter: [0, 1, 2, 3].map(() => rngBetween(rng, -0.04, 0.02))
    };
  }

  function classify(net) {
    if (net >= 2) return { key: "surplus", label: "запас" };
    if (net >= 0) return { key: "ok", label: "держится" };
    if (net > -3) return { key: "stress", label: "дефицит" };
    return { key: "crisis", label: "кризис" };
  }

  function statusPill(key, label) {
    return `<span class="status-pill status-${key}">${escapeHtml(label)}</span>`;
  }

  function summarize(rows, roleSummaries, tracks) {
    return {
      crisisRoleTurns: rows.filter((row) => row.statusKey === "crisis").length,
      stressRoleTurns: rows.filter((row) => row.statusKey === "stress").length,
      surplusRoleTurns: rows.filter((row) => row.statusKey === "surplus").length,
      totalDebt: sum(roleSummaries.map((summary) => summary.finalDebt)),
      streetRisk: tracks.street || 0,
      suspicionRisk: tracks.suspicion || 0,
      blackMarketRisk: tracks.blackMarket || 0,
      debtDependency: tracks.debtDependency || 0,
      politicization: tracks.politicization || 0
    };
  }

  function pressureScore(result) {
    return result.totals.crisisRoleTurns * 3
      + result.totals.stressRoleTurns
      + result.totals.streetRisk
      + result.totals.suspicionRisk
      + result.totals.blackMarketRisk;
  }

  function readProbability(row) {
    if (row.crisisPct >= 0.7) return "почти гарантированно требует отдельной кризисной сцены";
    if (row.crisisPct >= 0.35) return "часто ломается, нужна понятная дорожка действий";
    if (row.stressPct >= 0.6) return "редко падает сразу, но постоянно просит сделки";
    if (row.avgNet > 4) return "скорее выигрывает от кризиса или имеет запас";
    return "держится, но зависит от соседних решений";
  }

  function readSensitivity(delta) {
    if (delta > 10) return "очень сильный усилитель кризиса";
    if (delta > 4) return "заметно поднимает давление";
    if (delta < -8) return "сильно смягчает кризис";
    if (delta < -3) return "заметно смягчает давление";
    return "влияет слабо, можно не усложнять правилами";
  }

  function isTrader(role) {
    return ["market_woman", "baker", "shopkeeper"].includes(role.id);
  }

  function emptyTracks() {
    return {
      street: 0,
      suspicion: 0,
      politicization: 0,
      blackMarket: 0,
      debtDependency: 0,
      unemployment: 0,
      eliteFear: 0,
      eliteConfidence: 0,
      provinceAnger: 0,
      municipalFund: 0
    };
  }

  function addTrackPatch(target, patch = {}) {
    Object.entries(patch).forEach(([key, value]) => {
      target[key] = (target[key] || 0) + value;
    });
  }

  function seededRandom(seed) {
    let value = seed >>> 0;
    return function next() {
      value = (value * 1664525 + 1013904223) >>> 0;
      return value / 4294967296;
    };
  }

  function rngBetween(rng, min, max) {
    return min + (max - min) * rng();
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function sum(values) {
    return values.reduce((acc, value) => acc + value, 0);
  }

  function average(values) {
    return values.length ? sum(values) / values.length : 0;
  }

  function round(value) {
    return Math.round(value * 10) / 10;
  }

  function format(value) {
    return Number(value).toLocaleString("ru-RU", { maximumFractionDigits: 1 });
  }

  function formatSigned(value) {
    const rounded = round(value);
    return `${rounded > 0 ? "+" : ""}${format(rounded)}`;
  }

  function pct(value) {
    return `${Math.round(value * 100)}%`;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
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
