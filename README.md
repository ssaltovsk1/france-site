# Revolution France site

Статическая сборка для GitHub Pages.

## Что внутри

- `index.html` - стартовая страница.
- `tools.html` - каталог HTML-инструментов, карт и расчетных выгрузок.
- `characters.html` - архив 60 персонажей с читаемыми HTML-загрузами и исходными Markdown-файлами.
- `roles26.html` - новая раздача 26 активных + 15 второстепенных ролей с поиском и локальными комментариями.
- `history.html` - историческая база революции с поиском по причинам, событиям, типам правления, группам и объяснениям.
- `docs.html` - основные правила и рабочие документы.
- `docs/k_igre_polny_spisok_i_pravila.md` - полный чеклист подготовки к ближайшей игре и проверенные правила.
- `tools/` - готовые HTML/JS/CSS-инструменты из рабочей папки.
- `kventas/` - актуальные загрузки персонажей.
- `kventas-html/` - HTML-версии загрузов для чтения на сайте.
- `roles_26_14/` - ТЗ и готовые Markdown-роли новой раздачи.
- `downloads/kventas_all.zip` - архив всех загрузов.
- `docs/` - отобранные документы для публикации.
- `.nojekyll` - GitHub Pages должен отдавать файлы как статические.

## Как опубликовать через GitHub web

1. Открыть `https://github.com/ssaltovsk1/france-site/upload/main`.
2. Перетащить содержимое этой папки `france-site`, не саму папку.
3. Нажать `Commit changes`.
4. Открыть `Settings` -> `Pages`.
5. Выбрать `Deploy from a branch`, ветка `main`, папка `/root`.

После сборки адрес будет таким:

`https://ssaltovsk1.github.io/france-site/`

## Как опубликовать через git

```powershell
cd D:\_projects\_Mars\Games\Revolution_France\france-site
git init
git branch -M main
git add .
git commit -m "Initial site"
git remote add origin https://github.com/ssaltovsk1/france-site.git
git push -u origin main
```
