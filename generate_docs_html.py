from __future__ import annotations

import html
import os
import re
from dataclasses import dataclass
from pathlib import Path


SITE_ROOT = Path(__file__).resolve().parent
WORKSPACE_ROOT = SITE_ROOT.parent

ECONOMY_SOURCE_FILES = [
    "private_income.md",
    "private_entities.md",
    "people_rashodi.md",
    "clergy_rashodi.md",
    "noblesse_rashodi.md",
    "gos_taxes_and_revenue.md",
    "gos_rashodi_detailed.md",
    "gos_entities.md",
    "money.md",
    "groups.md",
    "estates.md",
    "historical_audit_and_model.md",
    "characters_estates_economy_model.md",
    "player_assets_income_by_character.md",
]

SYNC_IF_MISSING = {
    WORKSPACE_ROOT / "Docs_ai" / "Economics" / filename: SITE_ROOT / "docs" / "economy" / filename
    for filename in ECONOMY_SOURCE_FILES
}

EXTRA_DOCS = [
    SITE_ROOT / "README.md",
    SITE_ROOT / "calculations" / "sim" / "README.md",
    SITE_ROOT / "metadata" / "characters_estates_audit.md",
]

PUBLIC_PAGES = [
    SITE_ROOT / "index.html",
    SITE_ROOT / "docs.html",
    SITE_ROOT / "history.html",
    SITE_ROOT / "tools.html",
]


@dataclass
class Heading:
    level: int
    title: str
    anchor: str


class MarkdownRenderer:
    fence_re = re.compile(r"^(```+|~~~+)\s*([A-Za-z0-9_-]+)?\s*$")
    heading_re = re.compile(r"^(#{1,6})\s+(.*?)\s*$")
    ul_re = re.compile(r"^\s*[-*+]\s+(.*)$")
    ol_re = re.compile(r"^\s*\d+\.\s+(.*)$")
    table_divider_re = re.compile(r"^\s*\|?(?:\s*:?-{3,}:?\s*\|)+\s*:?-{3,}:?\s*\|?\s*$")
    hr_re = re.compile(r"^\s*(?:---+|\*\*\*+|___+)\s*$")

    def __init__(self) -> None:
        self.headings: list[Heading] = []
        self.anchor_index = 0

    def render(self, text: str) -> tuple[str, str, str, list[Heading]]:
        lines = text.replace("\r\n", "\n").replace("\r", "\n").split("\n")
        title, intro, body_lines = self._extract_title_and_intro(lines)
        content = self._render_blocks(body_lines)
        return title, intro, content, self.headings

    def _extract_title_and_intro(self, lines: list[str]) -> tuple[str, str, list[str]]:
        index = 0
        while index < len(lines) and not lines[index].strip():
            index += 1

        title = "Документ"
        title_match = None
        if index < len(lines):
            title_match = self.heading_re.match(lines[index].strip())
        if title_match and len(title_match.group(1)) == 1:
            title = title_match.group(2).strip()
            index += 1

        while index < len(lines) and not lines[index].strip():
            index += 1

        intro_lines: list[str] = []
        while index < len(lines) and lines[index].strip():
            stripped = lines[index].strip()
            if (
                self.heading_re.match(stripped)
                or self.ul_re.match(stripped)
                or self.ol_re.match(stripped)
                or self.fence_re.match(stripped)
                or stripped.startswith(">")
                or self.hr_re.match(stripped)
            ):
                break
            intro_lines.append(lines[index])
            index += 1

        intro = " ".join(part.strip() for part in intro_lines).strip()
        if len(intro) > 320:
            intro = intro[:317].rstrip() + "..."
        if not intro_lines:
            intro = ""

        while index < len(lines) and not lines[index].strip():
            index += 1

        return title, intro, lines[index:]
    def _next_anchor(self) -> str:
        self.anchor_index += 1
        return f"section-{self.anchor_index}"

    def _render_blocks(self, lines: list[str]) -> str:
        blocks: list[str] = []
        index = 0
        while index < len(lines):
            line = lines[index]
            stripped = line.strip()
            if not stripped:
                index += 1
                continue

            fence_match = self.fence_re.match(stripped)
            if fence_match:
                fence = fence_match.group(1)
                language = fence_match.group(2) or ""
                index += 1
                code_lines: list[str] = []
                while index < len(lines) and lines[index].strip() != fence:
                    code_lines.append(lines[index])
                    index += 1
                if index < len(lines):
                    index += 1
                lang_attr = f' class="language-{html.escape(language)}"' if language else ""
                code_html = html.escape("\n".join(code_lines))
                blocks.append(f"<pre><code{lang_attr}>{code_html}</code></pre>")
                continue

            heading_match = self.heading_re.match(stripped)
            if heading_match:
                level = len(heading_match.group(1))
                heading_text = heading_match.group(2).strip()
                anchor = self._next_anchor()
                if level >= 2:
                    self.headings.append(Heading(level=level, title=heading_text, anchor=anchor))
                blocks.append(
                    f'<h{level} id="{anchor}">{self._render_inline(heading_text)}</h{level}>'
                )
                index += 1
                continue

            if self._is_table_start(lines, index):
                table_html, index = self._consume_table(lines, index)
                blocks.append(table_html)
                continue

            if self.hr_re.match(stripped):
                blocks.append("<hr>")
                index += 1
                continue

            if stripped.startswith(">"):
                quote_html, index = self._consume_blockquote(lines, index)
                blocks.append(quote_html)
                continue

            if self.ul_re.match(stripped) or self.ol_re.match(stripped):
                list_html, index = self._consume_list(lines, index)
                blocks.append(list_html)
                continue

            paragraph_html, index = self._consume_paragraph(lines, index)
            blocks.append(paragraph_html)

        return "\n".join(blocks)

    def _is_table_start(self, lines: list[str], index: int) -> bool:
        if index + 1 >= len(lines):
            return False
        if "|" not in lines[index]:
            return False
        return bool(self.table_divider_re.match(lines[index + 1].strip()))

    def _consume_table(self, lines: list[str], index: int) -> tuple[str, int]:
        header_cells = self._split_table_row(lines[index])
        divider_cells = self._split_table_row(lines[index + 1])
        alignments = [self._table_alignment(cell) for cell in divider_cells]
        body_rows: list[list[str]] = []
        index += 2
        while index < len(lines):
            stripped = lines[index].strip()
            if not stripped or "|" not in stripped:
                break
            body_rows.append(self._split_table_row(lines[index]))
            index += 1

        def render_cells(cells: list[str], tag: str) -> str:
            rendered = []
            for cell_index, cell in enumerate(cells):
                align = alignments[cell_index] if cell_index < len(alignments) else "left"
                align_attr = f' style="text-align: {align}"' if align != "left" else ""
                rendered.append(f"<{tag}{align_attr}>{self._render_inline(cell.strip())}</{tag}>")
            return "".join(rendered)

        thead = f"<thead><tr>{render_cells(header_cells, 'th')}</tr></thead>"
        tbody = "".join(f"<tr>{render_cells(row, 'td')}</tr>" for row in body_rows)
        return f'<div class="table-wrap"><table>{thead}<tbody>{tbody}</tbody></table></div>', index

    def _split_table_row(self, row: str) -> list[str]:
        row = row.strip()
        if row.startswith("|"):
            row = row[1:]
        if row.endswith("|"):
            row = row[:-1]
        return [cell.strip() for cell in row.split("|")]

    def _table_alignment(self, cell: str) -> str:
        cell = cell.strip()
        if cell.startswith(":") and cell.endswith(":"):
            return "center"
        if cell.endswith(":"):
            return "right"
        return "left"

    def _consume_blockquote(self, lines: list[str], index: int) -> tuple[str, int]:
        quote_lines: list[str] = []
        while index < len(lines):
            stripped = lines[index].strip()
            if not stripped:
                quote_lines.append("")
                index += 1
                continue
            if not stripped.startswith(">"):
                break
            quote_lines.append(re.sub(r"^\s*>\s?", "", lines[index]))
            index += 1
        inner = self._render_blocks(quote_lines)
        return f"<blockquote>{inner}</blockquote>", index

    def _consume_list(self, lines: list[str], index: int) -> tuple[str, int]:
        ordered = bool(self.ol_re.match(lines[index].strip()))
        tag = "ol" if ordered else "ul"
        pattern = self.ol_re if ordered else self.ul_re
        items: list[str] = []
        while index < len(lines):
            stripped = lines[index].strip()
            match = pattern.match(stripped)
            if not match:
                break
            items.append(f"<li>{self._render_inline(match.group(1).strip())}</li>")
            index += 1
            if index < len(lines) and not lines[index].strip():
                lookahead = index
                while lookahead < len(lines) and not lines[lookahead].strip():
                    lookahead += 1
                if lookahead >= len(lines) or not pattern.match(lines[lookahead].strip()):
                    break
                index = lookahead
        return f"<{tag}>{''.join(items)}</{tag}>", index

    def _consume_paragraph(self, lines: list[str], index: int) -> tuple[str, int]:
        parts: list[str] = []
        while index < len(lines):
            stripped = lines[index].strip()
            if not stripped:
                break
            if (
                self.fence_re.match(stripped)
                or self.heading_re.match(stripped)
                or self.hr_re.match(stripped)
                or stripped.startswith(">")
                or self.ul_re.match(stripped)
                or self.ol_re.match(stripped)
                or self._is_table_start(lines, index)
            ):
                break
            parts.append(stripped)
            index += 1
        return f"<p>{self._render_inline(' '.join(parts))}</p>", index

    def _render_inline(self, text: str) -> str:
        placeholders: list[str] = []

        def keep(fragment: str) -> str:
            placeholders.append(fragment)
            return f"@@PLACEHOLDER{len(placeholders) - 1}@@"

        text = re.sub(
            r"`([^`]+)`",
            lambda match: keep(f"<code>{html.escape(match.group(1))}</code>"),
            text,
        )
        escaped = html.escape(text)

        def replace_link(match: re.Match[str]) -> str:
            label = match.group(1)
            href = self._rewrite_doc_href(html.unescape(match.group(2)))
            return keep(f'<a href="{html.escape(href, quote=True)}">{label}</a>')

        escaped = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", replace_link, escaped)
        escaped = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", escaped)
        escaped = re.sub(r"__(.+?)__", r"<strong>\1</strong>", escaped)
        escaped = re.sub(r"(?<!\*)\*(?!\s)(.+?)(?<!\s)\*(?!\*)", r"<em>\1</em>", escaped)
        escaped = re.sub(r"(?<!_)_(?!\s)(.+?)(?<!\s)_(?!_)", r"<em>\1</em>", escaped)

        for placeholder_index, fragment in enumerate(placeholders):
            escaped = escaped.replace(f"@@PLACEHOLDER{placeholder_index}@@", fragment)
        return escaped

    def _rewrite_doc_href(self, href: str) -> str:
        if re.match(r"^[A-Za-z][A-Za-z0-9+.-]*://", href):
            return href
        if href.startswith("#"):
            return href
        match = re.match(r"^(.*?)([#?].*)?$", href)
        if not match:
            return href
        path_part = match.group(1)
        suffix = match.group(2) or ""
        if path_part.endswith(".md"):
            path_part = f"{path_part[:-3]}.html"
        return f"{path_part}{suffix}"


def section_meta(md_path: Path) -> tuple[str, str, str]:
    relative = md_path.relative_to(SITE_ROOT).as_posix()
    if relative == "README.md":
        return "Сайт", "Назад на главную", "index.html"
    if relative.startswith("calculations/"):
        return "Расчеты", "Назад к расчетам", "tools.html"
    if relative.startswith("metadata/"):
        return "Метаданные", "Назад к правилам и докам", "docs.html"
    if relative.startswith("docs/economy/decrees/"):
        return "Декреты", "Назад к правилам и докам", "docs.html"
    if relative.startswith("docs/economy/"):
        return "Экономика", "Назад к правилам и докам", "docs.html"
    return "Правила и доки", "Назад к правилам и докам", "docs.html"


def relative_link(from_path: Path, to_path: Path) -> str:
    return Path(os.path.relpath(to_path, start=from_path.parent)).as_posix()


def render_page(md_path: Path, renderer: MarkdownRenderer) -> str:
    text = md_path.read_text(encoding="utf-8")
    title, intro, content_html, headings = renderer.render(text)

    section_label, back_label, back_target = section_meta(md_path)
    html_path = md_path.with_suffix(".html")
    site_css = relative_link(html_path, SITE_ROOT / "site.css")
    index_href = relative_link(html_path, SITE_ROOT / "index.html")
    tools_href = relative_link(html_path, SITE_ROOT / "tools.html")
    characters_href = relative_link(html_path, SITE_ROOT / "characters.html")
    history_href = relative_link(html_path, SITE_ROOT / "history.html")
    finance_href = relative_link(html_path, SITE_ROOT / "finance.html")
    docs_href = relative_link(html_path, SITE_ROOT / "docs.html")
    back_href = relative_link(html_path, SITE_ROOT / back_target)
    active_class = {
        "docs": "is-active" if section_label in {"Правила и доки", "Экономика", "Декреты", "Метаданные", "Сайт"} else "",
        "tools": "is-active" if section_label == "Расчеты" else "",
    }

    toc_links = []
    for heading in headings:
        if heading.level > 3:
            continue
        toc_links.append(f'<a href="#{heading.anchor}">{html.escape(heading.title)}</a>')
    toc_html = (
        f'<nav class="reader-toc" aria-label="Оглавление">{"".join(toc_links)}</nav>'
        if toc_links
        else ""
    )
    intro_html = f"        <p>{renderer._render_inline(intro)}</p>\n" if intro else ""

    return (
        "<!doctype html>\n"
        '<html lang="ru">\n'
        "<head>\n"
        '  <meta charset="utf-8">\n'
        '  <meta name="viewport" content="width=device-width, initial-scale=1">\n'
        f"  <title>{html.escape(title)} - Revolution France</title>\n"
        f'  <link rel="stylesheet" href="{site_css}">\n'
        "</head>\n"
        '<body class="reader-body">\n'
        '  <header class="site-header">\n'
        f'    <a class="brand" href="{index_href}">Revolution France</a>\n'
        '    <nav class="site-nav" aria-label="Главная навигация">\n'
        f'      <a class="{active_class["tools"]}" href="{tools_href}">Расчеты</a>\n'
        f'      <a href="{characters_href}">Персонажи</a>\n'
        f'      <a href="{history_href}">История</a>\n'
        f'      <a href="{finance_href}">Финансы</a>\n'
        f'      <a class="{active_class["docs"]}" href="{docs_href}">Правила и доки</a>\n'
        "    </nav>\n"
        "  </header>\n\n"
        '  <main class="reader-shell">\n'
        '    <aside class="reader-side" aria-label="Навигация документа">\n'
        f'      <a class="back-link" href="{back_href}">{back_label}</a>\n'
        '      <div class="reader-meta-card reader-doc-meta">\n'
        f'        <span class="pill">{section_label}</span>\n'
        f'        <span class="pill">{html.escape(html_path.relative_to(SITE_ROOT).as_posix())}</span>\n'
        '        <p>HTML-версия документа для чтения на сайте.</p>\n'
        "      </div>\n"
        f"      {toc_html}\n"
        "    </aside>\n\n"
        '    <article class="reader-article">\n'
        '      <header class="reader-title">\n'
        f'        <p class="section-label">{section_label}</p>\n'
        f'        <h1>{html.escape(title)}</h1>\n'
        f"{intro_html}"
        "      </header>\n"
        f'      <div class="reader-content">\n{content_html}\n      </div>\n'
        "    </article>\n"
        "  </main>\n"
        "</body>\n"
        "</html>\n"
    )


def collect_markdown_docs() -> list[Path]:
    docs = sorted((SITE_ROOT / "docs").rglob("*.md"))
    return sorted({*docs, *EXTRA_DOCS})


def sync_missing_sources() -> None:
    for source, destination in SYNC_IF_MISSING.items():
        if destination.exists():
            continue
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_text(source.read_text(encoding="utf-8"), encoding="utf-8")


def rewrite_public_page_links() -> None:
    href_re = re.compile(r'href="([^"]+\.md)"')
    for page in PUBLIC_PAGES:
        text = page.read_text(encoding="utf-8")

        def replace_href(match: re.Match[str]) -> str:
            href = match.group(1)
            return f'href="{href[:-3]}.html"'

        updated = href_re.sub(replace_href, text)
        if updated != text:
            page.write_text(updated, encoding="utf-8")


def main() -> None:
    sync_missing_sources()
    rewrite_public_page_links()
    for md_path in collect_markdown_docs():
        renderer = MarkdownRenderer()
        html_path = md_path.with_suffix(".html")
        html_path.write_text(render_page(md_path, renderer), encoding="utf-8")


if __name__ == "__main__":
    main()

