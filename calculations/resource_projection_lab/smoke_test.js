global.window = global;

require("./data/scenarios.js");
require("./src/model.js");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

for (const scenario of RESOURCE_SCENARIOS) {
  const result = ResourceModel.simulate(scenario, {});
  const final = result.summary.final;

  assert(result.history.length === scenario.policy.turns + 1, `${scenario.id}: wrong history length`);
  assert(Number.isFinite(final.marketBread), `${scenario.id}: marketBread is not finite`);
  assert(Number.isFinite(final.totalDebt), `${scenario.id}: totalDebt is not finite`);
  assert(Number.isFinite(final.treasuryCoin), `${scenario.id}: treasuryCoin is not finite`);
  assert(result.summary.richest && result.summary.poorest, `${scenario.id}: missing group summary`);

  console.log(
    `${scenario.id}: turns=${result.history.length - 1}, ` +
    `hungry=${final.totalHungry}, bread=${final.marketBread}, ` +
    `debt=${final.totalDebt}, treasury=${final.treasuryCoin}`
  );
}

console.log("OK");
