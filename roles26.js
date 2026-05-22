(function () {
  const roles = window.FRANCE_ROLES_26 || [];
  const issueRepo = "ssaltovsk1/france-site";
  const list = document.getElementById("roleList");
  const detail = document.getElementById("roleDetail");
  const searchInput = document.getElementById("roleSearch");
  const typeSelect = document.getElementById("roleType");
  const statusSelect = document.getElementById("roleStatus");
  const counter = document.getElementById("roleCounter");
  const commentKey = "revolution-france-role-comments-v1";
  let selectedId = roles[0] ? roles[0].id : "";

  if (!list || !detail || !searchInput || !typeSelect || !statusSelect || !counter) {
    return;
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function slugText(value) {
    return String(value || "").trim().toLowerCase();
  }

  function commentStore() {
    try {
      return JSON.parse(localStorage.getItem(commentKey) || "{}");
    } catch (error) {
      return {};
    }
  }

  function saveCommentStore(store) {
    localStorage.setItem(commentKey, JSON.stringify(store));
  }

  function commentsFor(roleId) {
    return commentStore()[roleId] || [];
  }

  function markdownToHtml(markdown) {
    const lines = String(markdown || "").replace(/\r\n/g, "\n").split("\n");
    const html = [];
    let inList = false;

    function closeList() {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
    }

    lines.forEach((line) => {
      const value = line.trim();
      if (!value) {
        closeList();
        return;
      }

      if (value === "---") {
        closeList();
        html.push("<hr>");
        return;
      }

      const heading = value.match(/^(#{1,4})\s+(.+)$/);
      if (heading) {
        closeList();
        const level = Math.min(heading[1].length + 1, 5);
        html.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
        return;
      }

      if (value.startsWith("- ")) {
        if (!inList) {
          html.push("<ul>");
          inList = true;
        }
        html.push(`<li>${inlineMarkdown(value.slice(2))}</li>`);
        return;
      }

      closeList();
      html.push(`<p>${inlineMarkdown(value)}</p>`);
    });

    closeList();
    return html.join("");
  }

  function inlineMarkdown(value) {
    return escapeHtml(value)
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/`([^`]+)`/g, "<code>$1</code>");
  }

  function roleHaystack(role) {
    return [
      role.number,
      role.player,
      role.character,
      role.classLevel,
      role.status,
      role.type,
      role.axes,
      role.income,
      role.source,
      role.summary,
      (role.tags || []).join(" ")
    ].join(" ").toLowerCase();
  }

  const types = Array.from(new Set(roles.map((role) => role.type))).sort((a, b) => a.localeCompare(b, "ru"));
  types.forEach((type) => {
    const option = document.createElement("option");
    option.value = type;
    option.textContent = type;
    typeSelect.appendChild(option);
  });

  function filteredRoles() {
    const query = slugText(searchInput.value);
    const type = typeSelect.value;
    const status = statusSelect.value;

    return roles.filter((role) => {
      const typeMatches = type === "all" || role.type === type;
      const statusMatches = status === "all" || role.status === status;
      const queryMatches = !query || roleHaystack(role).includes(query);
      return typeMatches && statusMatches && queryMatches;
    });
  }

  function renderList() {
    const filtered = filteredRoles();
    counter.textContent = `${filtered.length} из ${roles.length}`;

    if (!filtered.some((role) => role.id === selectedId) && filtered[0]) {
      selectedId = filtered[0].id;
    }

    list.innerHTML = filtered.map((role) => {
      const commentCount = commentsFor(role.id).length;
      return `
        <button class="role-list-item ${role.id === selectedId ? "is-selected" : ""}" type="button" data-role-id="${escapeHtml(role.id)}">
          <span class="role-list-number">${escapeHtml(role.number)}</span>
          <span>
            <strong>${escapeHtml(role.character)}</strong>
            <small>${escapeHtml(role.player)} · ${escapeHtml(role.type)} · ${escapeHtml(role.status)}</small>
          </span>
          <em>${commentCount ? escapeHtml(commentCount) : ""}</em>
        </button>
      `;
    }).join("") || `<div class="empty-state">По этому поиску ролей нет.</div>`;
  }

  function renderCommentPanel(role) {
    const comments = commentsFor(role.id);
    const issueTitle = `Комментарий по загрузу: ${role.character} (${role.player})`;
    const issueBody = [
      `Загруз: ${role.character}`,
      `Игрок: ${role.player}`,
      "",
      "Комментарий:",
      ""
    ].join("\n");
    const issueUrl = `https://github.com/${issueRepo}/issues/new?${new URLSearchParams({ title: issueTitle, body: issueBody }).toString()}`;

    return `
      <section class="role-comments" aria-label="Комментарии к роли">
        <div class="role-comments-head">
          <div>
            <h2>Комментарии</h2>
            <p>Локальные комментарии сохраняются в этом браузере. Для общего обсуждения открой GitHub Issue.</p>
          </div>
          <a class="button" href="${escapeHtml(issueUrl)}" target="_blank" rel="noopener">Комментарий в GitHub</a>
        </div>
        <form class="comment-form" id="commentForm">
          <label>
            Имя
            <input id="commentAuthor" type="text" maxlength="80" placeholder="Кто комментирует">
          </label>
          <label>
            Комментарий
            <textarea id="commentText" rows="4" maxlength="1200" placeholder="Что поправить, уточнить или обсудить"></textarea>
          </label>
          <div class="comment-actions">
            <button class="button primary" type="submit">Сохранить локально</button>
            <button class="button" id="exportComments" type="button">Экспорт JSON</button>
          </div>
        </form>
        <div class="comment-list" id="commentList">
          ${comments.length ? comments.map((comment, index) => `
            <article class="comment-item">
              <header>
                <strong>${escapeHtml(comment.author || "Без имени")}</strong>
                <time>${escapeHtml(comment.date || "")}</time>
              </header>
              <p>${escapeHtml(comment.text)}</p>
              <button type="button" data-delete-comment="${index}">Удалить</button>
            </article>
          `).join("") : `<p class="empty-state">Пока нет локальных комментариев.</p>`}
        </div>
      </section>
    `;
  }

  function fallbackRoleHtml(role) {
    return `
      <h2>Загруз роли</h2>
      <p>${escapeHtml(role.summary)}</p>
      <ul>
        <li><strong>Игрок:</strong> ${escapeHtml(role.player)}</li>
        <li><strong>Оси:</strong> ${escapeHtml(role.axes)}</li>
        <li><strong>Источник дохода:</strong> ${escapeHtml(role.income)}</li>
        <li><strong>Источник/основа:</strong> ${escapeHtml(role.source)}</li>
      </ul>
      <p>Файл загрузки не открылся. Проверь путь в <code>roles26-data.js</code> или открой Markdown напрямую из списка файлов.</p>
    `;
  }

  async function renderDetail() {
    const role = roles.find((item) => item.id === selectedId) || roles[0];
    if (!role) {
      detail.innerHTML = `<div class="empty-state">Нет ролей для отображения.</div>`;
      return;
    }

    const roleMeta = `
      <div class="role-detail-head">
        <div>
          <p class="section-label">Роль ${escapeHtml(role.number)}</p>
          <h1>${escapeHtml(role.character)}</h1>
          <p>${escapeHtml(role.summary)}</p>
        </div>
        <div class="role-meta-panel">
          <span class="pill">${escapeHtml(role.status)}</span>
          <span class="pill">${escapeHtml(role.type)}</span>
          <span class="pill">Игрок: ${escapeHtml(role.player)}</span>
          <span class="pill">Класс: ${escapeHtml(role.classLevel)}</span>
        </div>
      </div>
      <dl class="role-facts">
        <div><dt>Оси игрока</dt><dd>${escapeHtml(role.axes)}</dd></div>
        <div><dt>Источник дохода</dt><dd>${escapeHtml(role.income)}</dd></div>
        <div><dt>Источник/основа</dt><dd>${escapeHtml(role.source)}</dd></div>
      </dl>
    `;

    let bodyHtml = fallbackRoleHtml(role);
    if (role.file) {
      try {
        const response = await fetch(role.file);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        bodyHtml = markdownToHtml(await response.text());
      } catch (error) {
        bodyHtml = `
          <p class="empty-state">Не удалось загрузить Markdown-файл. На GitHub Pages это должно работать; при открытии локального файла браузер может блокировать чтение.</p>
          ${fallbackRoleHtml(role)}
        `;
      }
    }

    detail.innerHTML = `
      ${roleMeta}
      <section class="role-markdown">${bodyHtml}</section>
      ${renderCommentPanel(role)}
    `;

    wireCommentForm(role);
  }

  function wireCommentForm(role) {
    const form = document.getElementById("commentForm");
    const authorInput = document.getElementById("commentAuthor");
    const textInput = document.getElementById("commentText");
    const exportButton = document.getElementById("exportComments");
    const commentList = document.getElementById("commentList");

    if (!form || !authorInput || !textInput || !exportButton || !commentList) {
      return;
    }

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const text = textInput.value.trim();
      if (!text) {
        textInput.focus();
        return;
      }

      const store = commentStore();
      const next = store[role.id] || [];
      next.push({
        author: authorInput.value.trim(),
        text,
        date: new Date().toLocaleString("ru-RU")
      });
      store[role.id] = next;
      saveCommentStore(store);
      textInput.value = "";
      renderList();
      renderDetail();
    });

    exportButton.addEventListener("click", () => {
      const payload = {
        role: role.id,
        character: role.character,
        player: role.player,
        comments: commentsFor(role.id)
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${role.id}_comments.json`;
      anchor.click();
      URL.revokeObjectURL(url);
    });

    commentList.addEventListener("click", (event) => {
      const target = event.target.closest("[data-delete-comment]");
      if (!target) {
        return;
      }
      const index = Number(target.getAttribute("data-delete-comment"));
      const store = commentStore();
      const next = store[role.id] || [];
      next.splice(index, 1);
      store[role.id] = next;
      saveCommentStore(store);
      renderList();
      renderDetail();
    });
  }

  list.addEventListener("click", (event) => {
    const button = event.target.closest("[data-role-id]");
    if (!button) {
      return;
    }
    selectedId = button.getAttribute("data-role-id");
    renderList();
    renderDetail();
  });

  [searchInput, typeSelect, statusSelect].forEach((control) => {
    control.addEventListener("input", () => {
      renderList();
      renderDetail();
    });
    control.addEventListener("change", () => {
      renderList();
      renderDetail();
    });
  });

  renderList();
  renderDetail();
}());
