(function () {
  const baseGroups = [
    {
      id: "poor",
      name: "Городские бедные",
      count: 24,
      cash: 2,
      baseIncome: 0.7,
      breadNeed: 1,
      creditAccess: 0.2,
      blackAccess: 0.12,
      legalPriority: 4,
      blackPriority: 5,
      color: "#c94c4c"
    },
    {
      id: "workers",
      name: "Рабочие мастерских",
      count: 10,
      cash: 4,
      baseIncome: 1.1,
      breadNeed: 1,
      creditAccess: 0.35,
      blackAccess: 0.22,
      legalPriority: 3,
      blackPriority: 4,
      color: "#d89a35"
    },
    {
      id: "artisans",
      name: "Ремесленники и лавочники",
      count: 8,
      cash: 7,
      baseIncome: 1.6,
      breadNeed: 1,
      creditAccess: 0.5,
      blackAccess: 0.45,
      legalPriority: 2,
      blackPriority: 2,
      color: "#3f8f73"
    },
    {
      id: "officials",
      name: "Служащие и солдаты",
      count: 4,
      cash: 5,
      baseIncome: 0.8,
      breadNeed: 1,
      creditAccess: 0.3,
      blackAccess: 0.3,
      legalPriority: 2,
      blackPriority: 3,
      color: "#4c74b9"
    },
    {
      id: "bourgeois",
      name: "Буржуа и собственники",
      count: 4,
      cash: 14,
      baseIncome: 2.5,
      breadNeed: 1,
      creditAccess: 0.8,
      blackAccess: 0.8,
      legalPriority: 1,
      blackPriority: 1,
      hoardRate: 0.25,
      color: "#8a5fb4"
    }
  ];

  const baseInitial = {
    marketBread: 40,
    churchBread: 5,
    blackBread: 5,
    bakerGrain: 5,
    roadGrain: 12,
    hiddenGrain: 0,
    stateGrain: 0,
    treasuryCoin: 35,
    assignats: 0,
    legalPrice: 2,
    blackPrice: 4,
    assignatTrust: 100,
    cityUnrest: 10,
    ruralUnrest: 10,
    blackMarket: 15,
    wageDue: 0
  };

  const basePolicy = {
    turns: 8,
    incomingGrainPerTurn: 20,
    deliveryRate: 0.75,
    hiddenShare: 0.05,
    requisitionShare: 0,
    bakerCapacity: 18,
    bakerConversion: 2,
    legalTaxRate: 0.1,
    stateJobs: 4,
    stateWage: 2,
    privateJobs: 4,
    privateWage: 2,
    churchAidShare: 0.8,
    maximum: false,
    maximumPrice: 3,
    maximumLeakShare: 0.12,
    earlyHoarding: false,
    assignatPaymentShare: 0,
    assignatRefusalThreshold: 45,
    warCost: 0,
    spoilageShare: 0,
    largeDeliveryThreshold: 12
  };

  function makeScenario(id, name, description, overrides) {
    return {
      id,
      name,
      description,
      groups: baseGroups.map((group) => ({ ...group })),
      initial: { ...baseInitial, ...(overrides.initial || {}) },
      policy: { ...basePolicy, ...(overrides.policy || {}) },
      notes: overrides.notes || []
    };
  }

  window.RESOURCE_SCENARIOS = [
    makeScenario("baseline", "Базовая поставка", "Зерно доходит, булочник печет, церковь помогает. Дефицит есть, но он не обязан сразу стать катастрофой.", {
      notes: [
        "Проверяет, хватает ли стартового набора на 50 игроков при нормальной кооперации.",
        "Главная опасность: бедные все равно могут уйти в долг, если хлеб дорожает быстрее доходов."
      ]
    }),
    makeScenario("blocked_delivery", "Поставки застряли", "Дорога плохо работает: часть зерна не доходит, часть прячут, черный рынок растет.", {
      policy: {
        incomingGrainPerTurn: 10,
        deliveryRate: 0.3,
        hiddenShare: 0.18,
        churchAidShare: 0.65,
        privateJobs: 1
      },
      notes: [
        "Показывает ход, на котором рынок физически пустеет.",
        "Полезно для проверки, сколько хлеба нужно добавить в стартовую экономику."
      ]
    }),
    makeScenario("maximum_no_supply", "Максимум без подвоза", "Цена ограничена, но поставки слабые. Легальный хлеб уходит в тень.", {
      initial: {
        legalPrice: 3,
        blackPrice: 5,
        blackMarket: 25
      },
      policy: {
        incomingGrainPerTurn: 12,
        deliveryRate: 0.42,
        hiddenShare: 0.16,
        maximum: true,
        maximumLeakShare: 0.35,
        churchAidShare: 0.75
      },
      notes: [
        "Проверяет, помогает ли Максимум бедным или просто двигает хлеб на черный рынок.",
        "Если график черного рынка растет быстрее голода, значит закон создает скрытую экономику."
      ]
    }),
    makeScenario("assignat_wages", "Жалованье ассигнатами", "Казна бедна, государственные работы оплачиваются бумагой, доверие к ассигнату падает.", {
      initial: {
        treasuryCoin: 8,
        assignatTrust: 75,
        blackMarket: 20
      },
      policy: {
        incomingGrainPerTurn: 16,
        deliveryRate: 0.58,
        stateJobs: 8,
        stateWage: 2,
        assignatPaymentShare: 0.75,
        privateJobs: 1,
        churchAidShare: 0.7
      },
      notes: [
        "Проверяет, когда бумажные выплаты перестают спасать бедных.",
        "Хорошо видно накопление невыплат и отказов принимать ассигнаты."
      ]
    }),
    makeScenario("rich_hoarding", "Скупка богатыми", "Собственники покупают хлеб раньше остальных и держат запас. Бедные быстрее уходят в голод и долг.", {
      initial: {
        blackBread: 10,
        blackPrice: 4,
        blackMarket: 22
      },
      policy: {
        incomingGrainPerTurn: 16,
        deliveryRate: 0.5,
        hiddenShare: 0.22,
        earlyHoarding: true,
        privateJobs: 3,
        churchAidShare: 0.55
      },
      notes: [
        "Проверяет, может ли часть игроков разбогатеть на дефиците.",
        "Если богатые богатеют при росте голода, нужен политический риск: обыск, Максимум, донос или реквизиция."
      ]
    }),
    makeScenario("war_requisition", "Война и реквизиции", "Армия забирает часть зерна и денег. В городе меньше хлеба, деревня злится.", {
      initial: {
        treasuryCoin: 25,
        cityUnrest: 15,
        ruralUnrest: 20
      },
      policy: {
        incomingGrainPerTurn: 14,
        deliveryRate: 0.48,
        hiddenShare: 0.1,
        requisitionShare: 0.25,
        stateJobs: 6,
        assignatPaymentShare: 0.35,
        warCost: 8,
        churchAidShare: 0.65
      },
      notes: [
        "Проверяет цену войны в хлебе, казне и деревенском напряжении.",
        "Если реквизиция кормит армию, но ломает Париж, нужен выбор: фронт или город."
      ]
    })
  ];
})();
