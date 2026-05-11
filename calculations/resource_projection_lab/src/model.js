(function () {
  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function round1(value) {
    return Math.round(value * 10) / 10;
  }

  function sum(items, getter) {
    return items.reduce((acc, item) => acc + getter(item), 0);
  }

  function copyScenario(scenario) {
    return {
      ...scenario,
      initial: { ...scenario.initial },
      policy: { ...scenario.policy },
      groups: scenario.groups.map((group) => ({ ...group })),
      notes: [...(scenario.notes || [])]
    };
  }

  function applyOverrides(scenario, overrides) {
    const copy = copyScenario(scenario);
    copy.policy = { ...copy.policy, ...(overrides.policy || {}) };
    copy.initial = { ...copy.initial, ...(overrides.initial || {}) };

    if (typeof overrides.players === "number") {
      const current = sum(copy.groups, (group) => group.count);
      const ratio = overrides.players / current;
      let remaining = overrides.players;
      copy.groups = copy.groups.map((group, index) => {
        const count = index === copy.groups.length - 1
          ? remaining
          : Math.max(1, Math.round(group.count * ratio));
        remaining -= count;
        return { ...group, count };
      });
    }

    return copy;
  }

  function createGroupState(group) {
    return {
      ...group,
      cashTotal: group.cash * group.count,
      debt: 0,
      hungerMarks: 0,
      lastHungry: 0,
      breadBought: 0,
      breadAided: 0,
      breadBlack: 0,
      breadHoarded: 0,
      incomeTotal: 0
    };
  }

  function createState(scenario) {
    return {
      turn: 0,
      marketBread: scenario.initial.marketBread,
      churchBread: scenario.initial.churchBread,
      blackBread: scenario.initial.blackBread,
      bakerGrain: scenario.initial.bakerGrain,
      roadGrain: scenario.initial.roadGrain,
      hiddenGrain: scenario.initial.hiddenGrain,
      stateGrain: scenario.initial.stateGrain,
      treasuryCoin: scenario.initial.treasuryCoin,
      assignats: scenario.initial.assignats,
      legalPrice: scenario.initial.legalPrice,
      blackPrice: scenario.initial.blackPrice,
      assignatTrust: scenario.initial.assignatTrust,
      cityUnrest: scenario.initial.cityUnrest,
      ruralUnrest: scenario.initial.ruralUnrest,
      blackMarket: scenario.initial.blackMarket,
      wageDue: scenario.initial.wageDue,
      totalHungry: 0,
      totalDebt: 0,
      events: []
    };
  }

  function distributeIncome(groups, amount, weights, stats) {
    const totalWeight = Object.values(weights).reduce((acc, value) => acc + value, 0);
    if (amount <= 0 || totalWeight <= 0) {
      return;
    }

    groups.forEach((group) => {
      const weight = weights[group.id] || 0;
      if (weight <= 0) {
        return;
      }
      const income = amount * weight / totalWeight;
      group.cashTotal += income;
      group.incomeTotal += income;
      stats.wagesPaid += income;
    });
  }

  function findGroup(groups, id) {
    return groups.find((group) => group.id === id);
  }

  function payIncome(state, groups, policy, stats) {
    groups.forEach((group) => {
      const hungerPenalty = clamp(1 - (group.lastHungry / Math.max(1, group.count)) * 0.45, 0.55, 1);
      const income = group.count * group.baseIncome * hungerPenalty;
      group.cashTotal += income;
      group.incomeTotal += income;
    });

    const bourgeois = findGroup(groups, "bourgeois");
    const privateCost = policy.privateJobs * policy.privateWage;
    const privatePaid = Math.min(privateCost, bourgeois ? bourgeois.cashTotal : 0);
    if (bourgeois) {
      bourgeois.cashTotal -= privatePaid;
    }
    distributeIncome(groups, privatePaid, { poor: 4, workers: 4, artisans: 2 }, stats);

    const stateCost = policy.stateJobs * policy.stateWage;
    const assignatNominal = stateCost * policy.assignatPaymentShare;
    const coinNeeded = stateCost - assignatNominal;
    const coinPaid = Math.min(coinNeeded, Math.max(0, state.treasuryCoin));
    state.treasuryCoin -= coinPaid;

    const coinShortage = coinNeeded - coinPaid;
    const trustFactor = clamp(state.assignatTrust / 100, 0.05, 1);
    const assignatReal = assignatNominal * trustFactor;
    state.assignats += assignatNominal;

    if (assignatNominal > 0) {
      state.assignatTrust = clamp(state.assignatTrust - assignatNominal * 0.45, 0, 100);
      state.blackMarket = clamp(state.blackMarket + assignatNominal * 0.12, 0, 100);
      stats.assignatIssued += assignatNominal;
    }

    if (coinShortage > 0) {
      state.wageDue += coinShortage;
      stats.wageDueNew += coinShortage;
      state.cityUnrest += coinShortage * 0.4;
    }

    distributeIncome(groups, coinPaid + assignatReal, { poor: 4, workers: 3, officials: 3 }, stats);
  }

  function advanceSupply(state, policy, stats) {
    state.roadGrain += policy.incomingGrainPerTurn;

    const roadPool = Math.max(0, state.roadGrain);
    const arrived = Math.floor(roadPool * policy.deliveryRate);
    const hidden = Math.floor(roadPool * policy.hiddenShare);
    const requisitioned = Math.floor(roadPool * policy.requisitionShare);
    const lost = Math.floor(roadPool * policy.spoilageShare);
    const consumed = Math.min(roadPool, arrived + hidden + requisitioned + lost);

    state.roadGrain = roadPool - consumed;
    state.bakerGrain += arrived;
    state.hiddenGrain += hidden;
    state.stateGrain += requisitioned;

    const workerBonus = Math.min(5, policy.stateJobs + policy.privateJobs);
    const grainCapacity = Math.max(0, Math.floor(policy.bakerCapacity + workerBonus * 0.6));
    const grainToBake = Math.min(state.bakerGrain, grainCapacity);
    const breadMade = grainToBake * policy.bakerConversion;

    state.bakerGrain -= grainToBake;
    state.marketBread += breadMade;

    stats.grainArrived = arrived;
    stats.grainHidden = hidden;
    stats.grainRequisitioned = requisitioned;
    stats.grainLost = lost;
    stats.breadMade = breadMade;

    if (policy.maximum) {
      const leak = Math.floor(state.marketBread * policy.maximumLeakShare);
      state.marketBread -= leak;
      state.blackBread += leak;
      state.blackMarket = clamp(state.blackMarket + leak * 0.6, 0, 100);
      state.ruralUnrest += leak * 0.15;
      stats.maximumLeak = leak;
    }
  }

  function createNeeds(groups) {
    const needs = new Map();
    groups.forEach((group) => {
      needs.set(group.id, {
        group,
        need: Math.ceil(group.count * group.breadNeed),
        unmet: Math.ceil(group.count * group.breadNeed)
      });
    });
    return needs;
  }

  function buyUnits(group, stock, wanted, price, stats, options) {
    const available = Math.max(0, stock.value);
    let units = Math.min(wanted, available, Math.floor(group.cashTotal / price));
    let spend = units * price;

    group.cashTotal -= spend;
    stock.value -= units;

    if (units < wanted && stock.value > 0 && group.creditAccess > 0 && !options.noDebt) {
      const remainingWanted = Math.min(wanted - units, stock.value);
      const creditUnits = Math.min(
        remainingWanted,
        Math.floor(group.count * group.creditAccess)
      );
      const borrow = creditUnits * price;
      if (borrow > 0) {
        group.cashTotal += borrow;
        group.debt += borrow;
        stats.debtNew += borrow;
        const extraUnits = Math.min(creditUnits, Math.floor(group.cashTotal / price), stock.value);
        const extraSpend = extraUnits * price;
        group.cashTotal -= extraSpend;
        stock.value -= extraUnits;
        units += extraUnits;
        spend += extraSpend;
      }
    }

    return { units, spend };
  }

  function performPurchases(state, groups, policy, stats) {
    const needs = createNeeds(groups);
    const legalPrice = policy.maximum
      ? Math.min(state.legalPrice, policy.maximumPrice)
      : state.legalPrice;

    const marketStock = { value: state.marketBread };
    const blackStock = { value: state.blackBread };

    if (policy.earlyHoarding) {
      const rich = findGroup(groups, "bourgeois");
      if (rich) {
        const wanted = Math.max(0, Math.floor(rich.count * (rich.hoardRate || 0)));
        const bought = buyUnits(rich, marketStock, wanted, legalPrice, stats, { noDebt: true });
        rich.breadHoarded += bought.units;
        stats.hoarded += bought.units;
        stats.legalRevenue += bought.spend;
      }
    }

    [...groups]
      .sort((a, b) => a.legalPriority - b.legalPriority)
      .forEach((group) => {
        const need = needs.get(group.id);
        const bought = buyUnits(group, marketStock, need.unmet, legalPrice, stats, { noDebt: false });
        need.unmet -= bought.units;
        group.breadBought += bought.units;
        stats.legalBought += bought.units;
        stats.legalRevenue += bought.spend;
      });

    [...groups]
      .sort((a, b) => b.count - a.count)
      .forEach((group) => {
        const need = needs.get(group.id);
        if (need.unmet <= 0 || state.churchBread <= 0) {
          return;
        }
        const aidWanted = Math.ceil(need.unmet * policy.churchAidShare);
        const aid = Math.min(need.unmet, aidWanted, state.churchBread);
        state.churchBread -= aid;
        need.unmet -= aid;
        group.breadAided += aid;
        stats.churchAid += aid;
      });

    [...groups]
      .sort((a, b) => a.blackPriority - b.blackPriority)
      .forEach((group) => {
        const need = needs.get(group.id);
        if (need.unmet <= 0) {
          return;
        }
        const wanted = Math.ceil(need.unmet * group.blackAccess);
        const bought = buyUnits(group, blackStock, wanted, state.blackPrice, stats, { noDebt: false });
        need.unmet -= bought.units;
        group.breadBlack += bought.units;
        stats.blackBought += bought.units;
        stats.blackRevenue += bought.spend;
      });

    state.marketBread = marketStock.value;
    state.blackBread = blackStock.value;

    needs.forEach((need) => {
      const hungry = Math.max(0, need.unmet);
      need.group.lastHungry = hungry;
      need.group.hungerMarks += hungry;
      stats.hungry += hungry;
    });

    if (state.assignatTrust < policy.assignatRefusalThreshold && stats.assignatIssued > 0) {
      stats.assignatRefusals = Math.max(1, Math.floor(stats.assignatIssued / 3));
      state.assignatTrust = clamp(state.assignatTrust - stats.assignatRefusals * 1.5, 0, 100);
      state.blackMarket = clamp(state.blackMarket + stats.assignatRefusals * 1.2, 0, 100);
      state.cityUnrest += stats.assignatRefusals * 0.35;
    }
  }

  function allocateRevenue(state, groups, policy, stats) {
    const artisans = findGroup(groups, "artisans");
    const bourgeois = findGroup(groups, "bourgeois");
    const officials = findGroup(groups, "officials");
    const legalTax = stats.legalRevenue * policy.legalTaxRate;

    state.treasuryCoin += legalTax;
    const legalNet = stats.legalRevenue - legalTax;

    if (artisans) {
      artisans.cashTotal += legalNet * 0.55 + stats.blackRevenue * 0.2;
    }
    if (bourgeois) {
      bourgeois.cashTotal += legalNet * 0.35 + stats.blackRevenue * 0.75;
    }
    if (officials) {
      officials.cashTotal += legalNet * 0.1;
    }
  }

  function updateTracks(state, policy, stats) {
    let priceDelta = 0;
    if (stats.hungry >= 5 || stats.legalBought > 0 && state.marketBread <= 0) {
      priceDelta += 1;
    }
    if (stats.grainArrived >= policy.largeDeliveryThreshold && state.marketBread > 0 && stats.hungry < 5) {
      priceDelta -= 1;
    }

    if (policy.maximum && priceDelta > 0) {
      state.blackMarket = clamp(state.blackMarket + priceDelta * 4, 0, 100);
      state.legalPrice = Math.min(policy.maximumPrice, state.legalPrice);
    } else {
      state.legalPrice = clamp(state.legalPrice + clamp(priceDelta, -2, 2), 1, 12);
    }

    if (stats.grainHidden >= 3 || stats.maximumLeak >= 3 || stats.blackBought >= 3) {
      state.blackMarket = clamp(state.blackMarket + 2, 0, 100);
    }
    if (stats.grainRequisitioned >= 2) {
      state.ruralUnrest += 3;
    }
    if (stats.hungry >= 5) {
      state.cityUnrest += 6;
    } else if (stats.hungry > 0) {
      state.cityUnrest += stats.hungry * 0.6;
    }
    if (stats.churchAid >= 5) {
      state.cityUnrest -= 2;
    }
    if (stats.wageDueNew > 0) {
      state.cityUnrest += 3;
    }

    state.treasuryCoin -= policy.warCost;
    if (state.treasuryCoin < 0) {
      state.wageDue += Math.abs(state.treasuryCoin);
      state.treasuryCoin = 0;
      state.cityUnrest += 2;
    }

    state.blackPrice = clamp(
      Math.max(state.legalPrice + 1, state.blackPrice + (state.blackMarket > 45 ? 0.5 : 0) + (stats.hungry >= 5 ? 0.5 : 0)),
      2,
      18
    );
    state.cityUnrest = clamp(state.cityUnrest, 0, 100);
    state.ruralUnrest = clamp(state.ruralUnrest, 0, 100);
    state.assignatTrust = clamp(state.assignatTrust, 0, 100);
  }

  function makeStats() {
    return {
      grainArrived: 0,
      grainHidden: 0,
      grainRequisitioned: 0,
      grainLost: 0,
      breadMade: 0,
      maximumLeak: 0,
      legalBought: 0,
      blackBought: 0,
      churchAid: 0,
      hungry: 0,
      debtNew: 0,
      wageDueNew: 0,
      wagesPaid: 0,
      assignatIssued: 0,
      assignatRefusals: 0,
      legalRevenue: 0,
      blackRevenue: 0,
      hoarded: 0
    };
  }

  function snapshot(state, groups, stats) {
    const groupSnapshots = groups.map((group) => ({
      id: group.id,
      name: group.name,
      count: group.count,
      cashTotal: round1(group.cashTotal),
      cashPerPlayer: round1(group.cashTotal / Math.max(1, group.count)),
      debt: round1(group.debt),
      debtPerPlayer: round1(group.debt / Math.max(1, group.count)),
      hungerMarks: group.hungerMarks,
      lastHungry: group.lastHungry,
      wealthPerPlayer: round1((group.cashTotal - group.debt) / Math.max(1, group.count)),
      breadBought: group.breadBought,
      breadAided: group.breadAided,
      breadBlack: group.breadBlack,
      breadHoarded: group.breadHoarded,
      color: group.color
    }));

    return {
      turn: state.turn,
      marketBread: round1(state.marketBread),
      churchBread: round1(state.churchBread),
      blackBread: round1(state.blackBread),
      bakerGrain: round1(state.bakerGrain),
      roadGrain: round1(state.roadGrain),
      hiddenGrain: round1(state.hiddenGrain),
      stateGrain: round1(state.stateGrain),
      treasuryCoin: round1(state.treasuryCoin),
      assignats: round1(state.assignats),
      legalPrice: round1(state.legalPrice),
      blackPrice: round1(state.blackPrice),
      assignatTrust: round1(state.assignatTrust),
      cityUnrest: round1(state.cityUnrest),
      ruralUnrest: round1(state.ruralUnrest),
      blackMarket: round1(state.blackMarket),
      wageDue: round1(state.wageDue),
      totalDebt: round1(sum(groups, (group) => group.debt)),
      totalHungry: sum(groups, (group) => group.hungerMarks),
      groups: groupSnapshots,
      stats: { ...stats }
    };
  }

  function buildSummary(history) {
    const firstHunger = history.find((snap) => snap.stats && snap.stats.hungry >= 5);
    const firstMarketEmpty = history.find((snap) => snap.turn > 0 && snap.marketBread <= 0);
    const firstTreasuryEmpty = history.find((snap) => snap.turn > 0 && snap.treasuryCoin <= 0);
    const last = history[history.length - 1];
    const richest = [...last.groups].sort((a, b) => b.wealthPerPlayer - a.wealthPerPlayer)[0];
    const poorest = [...last.groups].sort((a, b) => a.wealthPerPlayer - b.wealthPerPlayer)[0];

    return {
      firstHungerTurn: firstHunger ? firstHunger.turn : null,
      firstMarketEmptyTurn: firstMarketEmpty ? firstMarketEmpty.turn : null,
      firstTreasuryEmptyTurn: firstTreasuryEmpty ? firstTreasuryEmpty.turn : null,
      richest,
      poorest,
      final: last
    };
  }

  function simulate(scenario, overrides) {
    const prepared = applyOverrides(scenario, overrides || {});
    const state = createState(prepared);
    const groups = prepared.groups.map(createGroupState);
    const history = [snapshot(state, groups, makeStats())];

    for (let turn = 1; turn <= prepared.policy.turns; turn += 1) {
      state.turn = turn;
      const stats = makeStats();
      advanceSupply(state, prepared.policy, stats);
      payIncome(state, groups, prepared.policy, stats);
      performPurchases(state, groups, prepared.policy, stats);
      allocateRevenue(state, groups, prepared.policy, stats);
      updateTracks(state, prepared.policy, stats);
      history.push(snapshot(state, groups, stats));
    }

    return {
      scenario: prepared,
      history,
      summary: buildSummary(history)
    };
  }

  window.ResourceModel = {
    simulate,
    clamp
  };
})();
