# Экономика

Справочник по экономике игры «Французская революция»: кто получает деньги, кто их теряет, почему казна рушится, как хлеб и ассигнаты превращают частные кошельки в политический кризис.

Этот раздел собирает рабочие заметки из `Docs_ai/Economics/` в одну читательскую структуру. Исходные документы не удалены; опубликованные HTML-версии сохранены и дополнены новыми страницами.

## Навигация

| Подраздел | Что открыть | Что внутри |
|---|---|---|
| Инвентаризация | [inventory.md](inventory.md) | какие источники покрывают доходы, расходы, деньги, долг, хлеб, откуп, венальность и баланс |
| Доходы | [income.md](income.md) | частные лица, государство, кто выигрывает и кто теряет после 1789 |
| Доходы персонажей | [player_assets_income_by_character.md](player_assets_income_by_character.md) | стартовая наличность, годовые потолки, источники дохода и быстрые ссылки на визуализации по 60 персонажам |
| Расходы | [expenses.md](expenses.md) | частные лица, государство, обязательные платежи, хлеб, статус, армия и долг |
| Финансовая система | [financial-system.md](financial-system.md) | монета, ливр, су, ассигнаты, долг, инфляция, банкротство, рантье, откупщики, покупные должности |

## Короткое резюме

Экономика игры держится на трёх уровнях.

| Уровень | Главный вопрос | Где читать |
|---|---|---|
| Частные лица | чем живут сословия, семьи, ремесленники, кюре, дворяне, рантье, крестьяне и городские низы | [income.md](income.md), [expenses.md](expenses.md), [estates.md](estates.md), [groups.md](groups.md), [player_assets_income_by_character.md](player_assets_income_by_character.md) |
| Государство | почему доходы не покрывают расходы, как долг, война и слабый сбор налогов толкают к эмиссии | [income.md](income.md), [expenses.md](expenses.md), [gos_taxes_and_revenue.md](gos_taxes_and_revenue.md), [gos_rashodi_detailed.md](gos_rashodi_detailed.md) |
| Финансовая система | почему «напечатать деньги» временно спасает казну и одновременно разрушает доверие | [financial-system.md](financial-system.md), [money.md](money.md), [gos_entities.md](gos_entities.md) |

До 1789 года система несправедлива, но привычна: третье сословие несёт основную налоговую и хлебную нагрузку, привилегированные получают доходы от земли, десятины, прав и должностей, государство обслуживает огромный долг. После 1789 года старые доходы отменяются быстрее, чем собираются новые налоги. Казна закрывает дыру ассигнатами, война взрывает расходы, а инфляция переносит удар на тех, кто получает фиксированный доход.

## Что считать в игре

Для игрового баланса не нужно вести полную бухгалтерию Франции. Нужно считать то, что меняет решения игроков.

| Параметр | Зачем нужен | Источники |
|---|---|---|
| `treasury_debt` | давление долга, дефицит, цена банкротства | [gos_rashodi_detailed.md](gos_rashodi_detailed.md), [gos_entities.md](gos_entities.md) |
| `bread_price` | главный индикатор городского кризиса | [people_rashodi.md](people_rashodi.md), [private_entities.md](private_entities.md), [historical_audit_and_model.md](historical_audit_and_model.md) |
| `assignat_rate` | реальная сила бумажных денег | [money.md](money.md), [financial-system.md](financial-system.md) |
| `tax_collection` | разрыв между декретом о налоге и фактическим сбором | [gos_taxes_and_revenue.md](gos_taxes_and_revenue.md), [gos_entities.md](gos_entities.md) |
| `war_pressure` | армия как расход, работодатель, реквизитор и будущий источник контрибуций | [gos_rashodi_detailed.md](gos_rashodi_detailed.md), [characters_estates_economy_model.md](characters_estates_economy_model.md) |
| `city_unrest` | связь хлеба, безработицы, слухов и уличной политики | [people_rashodi.md](people_rashodi.md), [characters_estates_economy_model.md](characters_estates_economy_model.md) |
| `province_loyalty` | ответ деревни и регионов на налоги, реквизиции, присягу и призыв | [historical_audit_and_model.md](historical_audit_and_model.md), [estates.md](estates.md) |
| `property_pool` | церковные земли, эмигрантские имущества, биены, аукционы | [private_income.md](private_income.md), [private_entities.md](private_entities.md), [financial-system.md](financial-system.md) |

## Минимальный маршрут чтения

1. [Инвентаризация](inventory.md) — понять, какие документы за что отвечают.
2. [Доходы](income.md) — увидеть денежные потоки частных лиц и государства.
3. [Расходы](expenses.md) — увидеть, куда деньги уходят и почему расходы давят каждый такт.
4. [Финансовая система](financial-system.md) — связать деньги, долг, ассигнаты, инфляцию и банкротство.
5. [characters_estates_economy_model.md](characters_estates_economy_model.md) — привязать это к 60 персонажам.
6. [player_assets_income_by_character.md](player_assets_income_by_character.md) — выдать стартовую наличность и годовые потолки доходов по конкретным игрокам.

## Исходные документы

Опубликованные копии обязательных источников лежат рядом с этим разделом:

| Источник | Роль |
|---|---|
| [private_income.md](private_income.md) | частные доходы по сословиям и особым группам |
| [private_entities.md](private_entities.md) | частные контрагенты: рынок, сеньор, приход, откуп, наниматель, биены, ренты |
| [people_rashodi.md](people_rashodi.md) | расходы третьего сословия; полезная черновая заметка |
| [clergy_rashodi.md](clergy_rashodi.md) | расходы духовенства |
| [noblesse_rashodi.md](noblesse_rashodi.md) | расходы дворянства |
| [gos_taxes_and_revenue.md](gos_taxes_and_revenue.md) | государственные доходы |
| [gos_rashodi_detailed.md](gos_rashodi_detailed.md) | государственные расходы |
| [gos_entities.md](gos_entities.md) | государственные контрагенты |
| [money.md](money.md) | принципы денег, налогов, инфляции и конфискаций |
| [groups.md](groups.md) | игровые профили, кассы, ритмы доходов и расходов |
| [estates.md](estates.md) | сословия и экономические траектории |
| [historical_audit_and_model.md](historical_audit_and_model.md) | аудит историчности и модель давления |
| [characters_estates_economy_model.md](characters_estates_economy_model.md) | персонажи, ресурсы, статусы и экономические цепочки |
| [player_assets_income_by_character.md](player_assets_income_by_character.md) | персональные активы, стартовая наличность, потолки доходов и ссылки на визуализации |
