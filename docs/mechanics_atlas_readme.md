# Mechanics Atlas

This folder is a working layer above the raw design archive. It is not another dump of sources. It is a picker: a compact map of mechanics that can be selected, adapted, and turned into prototypes for `Revolution_France`.

## How To Use

For a new design request, ask four questions:

1. What player fantasy or role is being designed?
2. What pressure should the mechanic create?
3. What resource or state changes?
4. What can go wrong if the player overuses it?

Then search `index.jsonl` by tags:

- `economy`
- `scarcity`
- `bread`
- `treasury`
- `assignats`
- `war`
- `faction`
- `city`
- `province`
- `legitimacy`
- `crowd`
- `spreadsheet`

Open the matching adaptation file and only then jump to the source material.

## Files

- `TASK.md` - current task, scope, and future Codex prompt.
- `index.jsonl` - compact machine-readable index of mechanics.
- `templates/mechanic_card.md` - reusable card format.
- `adaptations/Revolution_France/economy.md` - first economic adaptation set for the French Revolution project.

## Source Policy

Use `Docs` as the raw library and `Docs_ai` as project work-in-progress. Do not rewrite either archive while building the atlas. The atlas should cite source paths and extract design patterns, not copy entire articles.

## Good Output Shape

When choosing mechanics for a game, return:

- short list of recommended mechanics;
- why each fits this game's fantasy and format;
- variables and sources/sinks;
- player decisions;
- likely balance risks;
- simplest prototype test.

