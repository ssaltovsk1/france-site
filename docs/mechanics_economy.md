# Revolution_France Economy Mechanics

Status: first atlas pass.

Purpose: keep a shortlist of economy mechanics that are already adapted to the French Revolution project. Each item is a candidate that can be turned into rules, cards, simulation variables, UI panels, or spreadsheet tabs.

## Design Lens

The economy should not be a shop screen. It should be a pressure system where bread, money, war, status, legitimacy, and fear push people into political action.

Core pressures:

- bread and grain scarcity;
- treasury, debt, payments, and assignats;
- war and requisitions;
- public trust and legitimacy;
- estate and role asymmetry;
- city/province split;
- legal economy versus black market;
- fatigue from emergency politics.

## 1. Bread Crisis As Pressure Engine

Source pattern: RTS resource economy, city-builder production curves, project notes on bread and live action flow.

Use when: the game needs an economic problem that becomes political without a scripted event.

Variables:

- `grain_supply`
- `bread_price`
- `market_bread`
- `hunger`
- `urban_tension`
- `black_market`

Sources:

- harvest;
- provincial supply;
- requisitions;
- imports;
- hidden stocks revealed by force or negotiation.

Sinks:

- daily consumption;
- army supply;
- spoilage and logistics;
- hoarding;
- black-market diversion.

Player decisions:

- subsidize bread;
- set a maximum price;
- requisition grain;
- escort convoys;
- open stores;
- tolerate or suppress black-market sellers;
- blame a faction or institution.

Balance risk: if bread is too easy to buy, it becomes bookkeeping. If it is too punishing, every path collapses into crisis management.

Prototype test: run 6 turns with 40-60% of needed bread available and check whether players negotiate, trade, hide, accuse, and organize instead of only waiting for admin resolution.

## 2. Treasury, Debt, And Assignats Loop

Source pattern: game economy sources/sinks, virtual economy flow, project money notes.

Use when: state action needs an economic price beyond a flat action cost.

Variables:

- `treasury_coin`
- `public_debt`
- `assignat_supply`
- `assignat_value`
- `state_payments_due`
- `trust`

Sources:

- taxes;
- loans;
- nationalized property;
- forced contributions;
- assignat printing.

Sinks:

- army pay;
- bread subsidies;
- debt service;
- administration;
- compensation;
- emergency policing.

Player decisions:

- pay in coin or assignats;
- delay wages;
- issue a new series;
- nationalize property;
- tax estates;
- borrow from financiers;
- default quietly or publicly.

Balance risk: printing must solve a real short-term problem while creating visible long-term distrust. Otherwise it is either useless or dominant.

Prototype test: make the government face three simultaneous payments and only enough coin for one. Check whether different political coalitions prefer different funding methods.

## 3. Maximum Price Law And Black Market

Source pattern: price caps, scarcity displacement, action mechanics for bread, suspicion, and enforcement.

Use when: the player should feel that law can redirect pressure instead of deleting it.

Variables:

- `legal_price`
- `black_price`
- `market_supply`
- `enforcement`
- `suspicion`
- `crowd_anger`

Player decisions:

- cap the legal price;
- inspect shops;
- punish hoarders;
- protect traders;
- move goods through legal or illegal channels;
- denounce enemies as speculators.

Main loop:

1. Price cap lowers immediate visible pain.
2. Sellers hide or reroute supply if enforcement and trust are poor.
3. Black-market price rises.
4. Repression or negotiation becomes attractive.

Balance risk: if enforcement has no cost, Maximum becomes a free stabilizer. If it always backfires, players learn never to try it.

Prototype test: compare two tables, with and without Maximum, over 4 turns. The capped table should have lower visible price but higher hidden friction.

## 4. Shared Survival Loop Plus Role Resource

Source pattern: one common economy plus one special resource per estate or role.

Use when: multiple social roles must feel economically different without maintaining 17 separate economies.

Common variables:

- money;
- bread;
- debt;
- hunger;
- obligations.

Role resources:

- clergy: parish trust or church fund;
- nobility: rights, land, prestige;
- urban workers: work, section influence;
- craftsmen: workshop orders and materials;
- traders: stock and suspicion;
- bourgeoisie: capital, credit, biens nationaux;
- peasants: grain, land, recruits.

Player decisions:

- spend the common resource to survive;
- spend the role resource to keep identity and leverage;
- sacrifice status for liquidity;
- radicalize when the survival loop breaks.

Balance risk: too many role resources turn the game into accounting. Keep one special resource per role for the first prototype.

Prototype test: give each role the same bread crisis and one unique escape route. Check whether each role negotiates differently.

## 5. Province-To-Paris Supply Routes

Source pattern: RTS build orders, logistics, supply cards, province pressure.

Use when: Paris should depend on things happening off-screen or outside the central board.

Variables:

- `province_stability`
- `route_risk`
- `grain_in_transit`
- `war_pressure`
- `arrival_rate`

Player decisions:

- escort convoy;
- requisition grain;
- pay tolls;
- suppress local resistance;
- negotiate with province actors;
- redirect grain to army or city.

Main loop:

1. A province offers supply.
2. A route creates delay and risk.
3. War, revolt, taxes, or requisitions threaten arrival.
4. Arrival changes bread price and political mood.

Balance risk: if routes are invisible, players blame randomness. If routes are too detailed, economy becomes a logistics minigame.

Prototype test: use 2-4 supply cards per turn with visible blockers. Players should be able to save at least one by coordinated action.

## 6. Work As Physical Contracts

Source pattern: workshop and job-card project notes.

Use when: urban economy should create interaction between employers, workers, workshops, and institutions.

Variables:

- `job_cards`
- `materials`
- `labor`
- `wages`
- `unpaid_debt`
- `orders`

Player decisions:

- hire workers;
- accept wage in coin, bread, or assignats;
- print pamphlets;
- produce uniforms or weapons;
- guard a warehouse;
- refuse work and join a section.

Balance risk: passive income makes workers invisible. Every paid job should leave a card, token, signature, or debt.

Prototype test: create 10 jobs and 14 workers. The shortage should force bargaining, underpayment, or political mobilization.

## 7. Church Nationalization As Fiscal Gain And Legitimacy Wound

Source pattern: decree effects, church economy, assignats, legitimacy and province risk.

Use when: a fiscal solution should open a religious and provincial conflict.

Variables:

- `church_land`
- `treasury`
- `assignat_backing`
- `clergy_trust`
- `parish_split`
- `vendee_risk`

Player decisions:

- nationalize land;
- auction property;
- require oath;
- fund priests;
- tolerate refractory clergy;
- turn church assets into assignat backing.

Balance risk: nationalization cannot be just a money button. It must create local winners, losers, and legitimacy consequences.

Prototype test: one decree should improve treasury and assignat credibility while splitting clergy and increasing province resistance.

## 8. Payoff Matrix For Political-Economic Strategies

Source pattern: RTS payoff matrices and balanced viable options.

Use when: different paths like moderation, terror, army stabilization, and royalist rollback need to be viable but costly.

Variables:

- `moderation_payoff`
- `terror_payoff`
- `army_payoff`
- `royalist_payoff`
- `counterpressure`

Player decisions:

- stabilize through concessions;
- escalate through coercion;
- hand power to armed institutions;
- restore old privileges;
- combine partial strategies.

Balance risk: a historical outcome should not become the only correct path. The matrix should expose tradeoffs, not force a script.

Prototype test: list 4 strategies against 4 crisis types. No strategy should dominate all crises.

## 9. Public Tracks With Threshold Events

Source pattern: curves, thresholds, pressure axes, crisis pacing.

Use when: the world needs readable pressure without simulating every person.

Tracks:

- hunger;
- fear;
- war;
- fatigue;
- legitimacy;
- radicalization;
- province resistance.

Player decisions:

- accept one pressure rising to lower another;
- cool down a track before it crosses a threshold;
- deliberately push a track to unlock emergency action.

Balance risk: tracks become abstract if no one can point to what caused movement. Every track change should cite a law, shortage, battle, rumor, or payment.

Prototype test: run 8 turns and check whether players can predict which threshold they are approaching.

## 10. Weighted Scoring For Decrees, Events, And Character Actions

Source pattern: spreadsheet balancing, weighted factors, event scoring.

Use when: the project has many laws, cards, characters, and events with mixed effects.

Variables:

- `benefit_score`
- `cost_score`
- `risk_score`
- `rarity`
- `act`
- `cooldown`

Player decisions:

- draft a decree;
- choose an event;
- compare a character action against a public policy;
- tune card strength by act and rarity.

Balance risk: scoring is a design tool, not the final rule. Do not let one formula erase flavor or situational power.

Prototype test: score 20 events, then manually inspect the top and bottom 5. If the list feels absurd, adjust weights before adding more content.

## First Shortlist

For a first playable economic prototype, use only these:

1. Bread Crisis As Pressure Engine.
2. Treasury, Debt, And Assignats Loop.
3. Maximum Price Law And Black Market.
4. Shared Survival Loop Plus Role Resource.
5. Province-To-Paris Supply Routes.

These five are enough to create a live system: people need bread, the state needs money, law can move pressure into the shadows, social roles break differently, and Paris depends on provinces.

