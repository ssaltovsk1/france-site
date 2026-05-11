# Money Model v1

Status: playable draft.

Goal: make money necessary, emotional, and easy to track. Money is not only a price counter. It is a visible form of trust, dependence, pressure, and betrayal.

## Core Pieces

Use only three money objects in the first test:

| Object | Physical form | Meaning |
|---|---|---|
| Coin | heavy token | trusted value, accepted by everyone |
| Assignat | paper bill with series mark | state promise, useful while trusted |
| Debt note | yellow signed card | personal dependence between named people |

Do not track every private transaction in a ledger. Track only:

- treasury coin;
- printed assignats;
- assignat trust;
- debt notes;
- bread price;
- unpaid wages or taxes.

## Public Tracks

### Assignat Trust

| Trust | Exchange | Market behavior |
|---:|---:|---|
| 3 | 1 coin = 1 assignat | paper accepted normally |
| 2 | 1 coin = 2 assignats | traders complain, coin preferred |
| 1 | 1 coin = 4 assignats | bread sellers demand coin or overprice |
| 0 | paper refused | assignats work only by force or at black-market rate |

Rule: if a player pays in assignats, multiply the coin price by the exchange multiplier.

```text
assignat_price = coin_price * assignat_multiplier
```

### Bread Coin Price

Set once per turn from visible bread supply.

| Bread supply against need | Bread price in coin |
|---:|---:|
| 100%+ | 1 |
| 80-99% | 2 |
| 60-79% | 3 |
| 45-59% | 4 |
| 30-44% | 5 |
| below 30% | 6 |

For a first 50-player test:

```text
bread_need = 50 bread
```

If 38 bread are available:

```text
supply_ratio = 38 / 50 = 76%
bread_coin_price = 3
```

If assignat trust is 2:

```text
bread_assignat_price = 3 * 2 = 6 assignats
```

## Personal Survival Formula

Use this only for calibration. At the table, players should mostly count physical tokens.

```text
real_income = coin_income + assignat_income / assignat_multiplier
net = real_income + own_bread_value - mouths * bread_coin_price - obligations
```

Interpretation:

| Net | State | Player pressure |
|---:|---|---|
| +2 or more | surplus | can lend, invest, patronize |
| 0 to +1 | survives | little freedom, but stable |
| -1 to -2 | deficit | debt, help, sale, petition |
| -3 or less | crisis | hunger, illegal action, riot, emigration, betrayal |

## Starter Role Numbers

These are not historical salaries. They are playable calibration values for one turn.

| Role archetype | Coin income | Assignat income | Own bread | Mouths | Obligations | Notes |
|---|---:|---:|---:|---:|---:|---|
| Urban worker | 0 | 3 | 0 | 1 | 0 | salary is fragile paper |
| Craft master | 1 | 4 | 0 | 2 | 1 | workshop, rent, dependents |
| Shopkeeper | 2 | 3 | 0 | 2 | 1 | coin exists, but suspicion risk |
| Peasant owner | 1 | 0 | 2 | 2 | 1 | stable unless grain is requisitioned |
| Parish cure | 0 | 3 | 0 | 1 | 1 | state salary plus charity pressure |
| Noble rentier | 3 | 2 | 0 | 2 | 3 | status obligations eat income |
| Big bourgeois | 4 | 4 | 0 | 2 | 2 | resilient, can exploit crisis |

## Scenario Calculation

Three sample states:

| Scenario | Bread coin price | Assignat trust | Multiplier |
|---|---:|---:|---:|
| A. Hungry but stable | 2 | 3 | 1 |
| B. War shortage | 3 | 2 | 2 |
| C. Inflation crisis | 4 | 1 | 4 |

Net result by role:

| Role | A | B | C |
|---|---:|---:|---:|
| Urban worker | +1.00 | -1.50 | -3.25 |
| Craft master | 0.00 | -4.00 | -7.00 |
| Shopkeeper | 0.00 | -3.50 | -6.25 |
| Peasant owner, no requisition | 0.00 | 0.00 | 0.00 |
| Peasant owner, 1 bread requisitioned | -2.00 | -3.00 | -4.00 |
| Parish cure | 0.00 | -2.50 | -4.25 |
| Noble rentier | -2.00 | -5.00 | -7.50 |
| Big bourgeois | +2.00 | -2.00 | -5.00 |

Design reading:

- urban workers collapse as soon as paper loses trust;
- craft masters and shopkeepers look stable at first, then break hard because they have dependents and rent;
- peasants can survive outside the cash economy until requisition hits them;
- cure becomes morally squeezed: he cannot both live and support the poor;
- noble rentier loses to status costs before he literally starves;
- big bourgeois survives longest, but without contracts or asset purchases even he feels the crisis.

## Government Turn Budget

For a first 50-player test, use value units equal to coin units.

Starting treasury:

```text
15 coin
20 assignats
assignat_trust = 3
```

Base state obligations per turn:

| Obligation | Cost |
|---|---:|
| Army and guard | 8 |
| Administration | 4 |
| Clergy salaries | 4 |
| Debt service | 6 |
| Minimum bread subsidy | 4 |
| Total | 26 |

State income per normal turn:

| Source | Income |
|---|---:|
| Direct taxes | 6 coin |
| Market and gate fees | 3 coin |
| Patents, fines, small fees | 2 assignats |
| Total | 9 coin + 2 assignats |

Base result:

```text
obligations = 26
income = 9 coin + 2 assignats
gap = 15 value
```

The state must choose at least one:

| Action | Immediate effect | Side effect |
|---|---|---|
| Print 20 assignats | treasury +20 assignats | assignat trust -1 unless backed |
| Forced loan | treasury +8 coin | 2 rich players receive debt notes and anger |
| Raise direct taxes | treasury +6 coin | rural unrest +1, tax-due notes if unpaid |
| Requisition grain | bread supply +8 | rural unrest +2, peasant deficits |
| Sell national property | treasury +10 coin or assignats | creates winners and resentment |
| Delay wages | cost -6 now | 6 players receive unpaid-wage debt notes |

## Worked Turn Example

Starting state:

```text
players = 50
bread_need = 50
bread_available = 38
assignat_trust = 2
assignat_multiplier = 2
treasury = 15 coin + 20 assignats
```

Bread price:

```text
supply_ratio = 38 / 50 = 76%
bread_coin_price = 3
bread_assignat_price = 3 * 2 = 6 assignats
```

Urban worker:

```text
income = 3 assignats
mouths = 1
needs bread = 6 assignats
result = -3 assignats
```

The worker must choose: debt note, charity, illegal work, petition, theft, joining a section, or hunger.

Shopkeeper:

```text
income = 2 coin + 3 assignats
mouths = 2
obligations = 1 coin
real_income = 2 + 3/2 = 3.5 coin
cost = 2 * 3 + 1 = 7 coin
net = -3.5 coin
```

The shopkeeper can survive only by raising prices, hiding stock, taking debt, refusing assignats, or denouncing someone else as a speculator.

Peasant owner with 2 own bread:

```text
income = 1 coin
own_bread = 2 bread
mouths = 2
obligations = 1 coin
net = 1 - 1 = 0
```

If the state requisitions 1 bread:

```text
own_bread_left = 1
must buy 1 bread = 3 coin
net = 1 - 1 - 3 = -3
```

This is the core political split: the city calls requisition justice; the peasant experiences it as being pushed into crisis.

Government:

```text
obligations = 26
income = 9 coin + 2 assignats
starting liquid value at trust 2 = 15 coin + 20/2 = 25 coin value
after obligations and income, without new action:
25 + 10 - 26 = 9 coin-value left
```

But if most obligations must be paid in coin and only 15 coin exist, the state cannot simply use paper. It must print, borrow, requisition, delay, or confiscate.

If the state prints 20 assignats:

```text
treasury +20 assignats
assignat_trust: 2 -> 1
next multiplier: 4
```

Next turn, if bread remains at coin price 3:

```text
bread_assignat_price = 3 * 4 = 12 assignats
urban worker salary = 3 assignats
deficit = 9 assignats
```

So printing solves the state turn and destroys paper-wage survival.

## Table Procedure

Each turn:

1. Count bread need and bread available.
2. Set bread coin price from the supply table.
3. Set assignat multiplier from trust.
4. Announce both prices: coin price and assignat price.
5. Players buy bread, pay obligations, or take debt/hunger.
6. State pays obligations.
7. If the state lacks coin, it chooses print, loan, tax, requisition, delay, or sale.
8. Apply side effects publicly.

## Emotional Targets

The numbers are tuned so that:

- workers are not irrational when they radicalize;
- traders are not cartoon villains when they refuse paper;
- peasants are not selfish when they hide grain;
- clergy are not abstractly reactionary when the parish splits;
- nobles are not safe just because they are rich;
- big bourgeois players are tempted to profit from collapse.

