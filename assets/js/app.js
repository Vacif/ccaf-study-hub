/* CCA-F Study Hub — router, trang, quiz, flashcard, thi thử, thuật ngữ, thực hành, tiến độ */
(function () {
  const C = window.COURSE;
  const $ = (s, r = document) => r.querySelector(s);
  const app = $("#app");
  const LETTERS = "ABCD";
  const COLORS = { slate: "--c-slate", violet: "--c-violet", teal: "--c-teal", orange: "--c-orange", blue: "--c-blue", rose: "--c-rose" };
  const colorOf = (ch) => `var(${COLORS[ch.color]})`;
  const REPO = "https://github.com/Vacif/ccaf-study-hub";
  const viTitle = (ch) => ch.vi || ch.title;
  const enTitle = (ch) => (ch.vi ? ch.title : "");

  /* ── Lưu trữ cục bộ (an toàn khi bị chặn) ── */
  const KEY = "ccaf-study-v1";
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) {}
  const state = Object.assign({ done: {}, quiz: {}, exams: [], plan: {}, theme: null, missed: {}, qlang: "vi", known: {}, check: {} }, saved);
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} };
  window.STUDY = { state, save };

  /* ── Chỉ mục ── */
  const allSections = [];
  C.chapters.forEach((ch) => ch.sections.forEach((s) => allSections.push({ ...s, chapter: ch })));
  const findSection = (id) => allSections.find((s) => s.id === id);
  const findChapter = (id) => C.chapters.find((c) => c.id === id);
  // Ngân hàng đề: câu hỏi trong các mục + câu chỉ dùng cho thi thử (window.BANK)
  const examPool = [];
  C.chapters.filter((c) => c.weight > 0).forEach((ch) =>
    ch.sections.forEach((s) => {
      (s.quiz || []).forEach((q, i) => examPool.push({ ...q, id: `${s.id}-q${i}`, chapter: ch, section: s }));
      ((window.BANK || {})[s.id] || []).forEach((q, i) => examPool.push({ ...q, id: `${s.id}-b${i}`, chapter: ch, section: s }));
    })
  );
  if (!saved.missed) examPool.forEach((q) => { if (state.quiz[q.id] !== undefined && state.quiz[q.id] !== q.answer) state.missed[q.id] = 1; });
  const setMissed = (id, wrong) => { if (wrong) state.missed[id] = 1; else delete state.missed[id]; };
  const missedPool = () => examPool.filter((q) => state.missed[q.id]);

  const pct = () => Math.round((allSections.filter((s) => state.done[s.id]).length / allSections.length) * 100);
  const chapterPct = (ch) => Math.round((ch.sections.filter((s) => state.done[s.id]).length / ch.sections.length) * 100);
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const plain = (h) => String(h || "").replace(/<[^>]+>/g, " ");

  // Thời gian học ước tính: đọc kỹ ~120 chữ/phút, mỗi mô phỏng ~5 phút, mỗi câu hỏi ~1,5 phút, mỗi tình huống ~2 phút suy nghĩ
  function minutesOf(s) {
    const traps = s.traps || [];
    const txt = [s.body, s.advanced, (s.keyPoints || []).join(" "), s.tip, ...traps.map((t) => [t.scenario, t.bait, t.why, ...(t.fix || [])].join(" "))].map(plain).join(" ");
    const words = txt.split(/\s+/).filter(Boolean).length;
    const widgets = (s.widgets || [s.widget]).filter(Boolean).length;
    return Math.max(5, Math.round((words / 120 + widgets * 5 + (s.quiz || []).length * 1.5 + traps.length * 2) / 5) * 5);
  }

  /* ── Trộn thứ tự phương án: cố định trong một lần mở trang, đổi khi tải lại ── */
  const SEED = (Math.random() * 4294967296) >>> 0;
  function perm(id, n) {
    let h = 2166136261 ^ SEED;
    for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
    const rnd = () => {
      h = (h + 0x6d2b79f5) | 0;
      let t = Math.imul(h ^ (h >>> 15), 1 | h);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const a = [...Array(n).keys()];
    for (let i = n - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  /* ── Ngôn ngữ câu hỏi ── */
  const EN = () => state.qlang === "en";
  const qText = (q) => (EN() && q.en ? q.en.q : q.q);
  const qOpts = (q) => (EN() && q.en ? q.en.options : q.options);
  const langHTML = () => `<div class="seg qlang" role="group" aria-label="Ngôn ngữ câu hỏi"><span>Câu hỏi bằng:</span><button data-lang="vi" class="${EN() ? "" : "on"}">Tiếng Việt</button><button data-lang="en" class="${EN() ? "on" : ""}">English</button></div>`;
  const bindLang = (root, redraw) => root.querySelectorAll("[data-lang]").forEach((b) => (b.onclick = () => { state.qlang = b.dataset.lang; save(); redraw(); }));

  /* ── Theme ── */
  const isDark = () => (state.theme ? state.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches);
  function applyTheme() {
    if (state.theme) document.documentElement.setAttribute("data-theme", state.theme);
    else document.documentElement.removeAttribute("data-theme");
    const b = $("#themeBtn");
    b.textContent = isDark() ? "☀️" : "🌙";
    b.setAttribute("aria-label", isDark() ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối");
    b.title = b.getAttribute("aria-label");
  }
  $("#themeBtn").onclick = () => { state.theme = isDark() ? "light" : "dark"; save(); applyTheme(); };
  applyTheme();
  $("#menuBtn").onclick = () => document.body.classList.toggle("nav-open");
  $("#overlay").onclick = () => document.body.classList.remove("nav-open");

  /* ── Thông báo nhỏ ── */
  function toast(msg) {
    let t = $("#toast");
    if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast.h);
    toast.h = setTimeout(() => t.classList.remove("show"), 3800);
  }

  /* ── Sidebar ── */
  let filter = "";
  const navOpen = {};
  function renderSidebar(route) {
    const sb = $("#sidebar");
    const f = filter.trim().toLowerCase();
    const match = (s) => !f || (s.title + " " + s.body + " " + (s.advanced || "") + " " + (s.keyPoints || []).join(" ")).toLowerCase().includes(f);
    const [, a, b] = route.split("/");
    const cur = a === "section" ? (findSection(b) || {}).chapter : a === "chapter" ? findChapter(b) : null;
    let html = `<input class="search" id="searchBox" placeholder="🔍 Tìm kiếm mục..." value="${esc(filter)}" aria-label="Tìm kiếm mục">`;
    if (!f) {
      html += `<a class="nav-link ${route === "/" ? "active" : ""}" href="#/">🏠 Trang chủ</a>
      <a class="nav-link ${route.startsWith("/exam") ? "active" : ""}" href="#/exam">📝 Thi thử</a>
      <a class="nav-link ${route.startsWith("/flash") ? "active" : ""}" href="#/flashcards/all">🃏 Flashcard</a>
      <a class="nav-link ${route.startsWith("/glossary") ? "active" : ""}" href="#/glossary">📖 Thuật ngữ</a>
      <a class="nav-link ${route.startsWith("/practice") ? "active" : ""}" href="#/practice">🛠️ Thực hành dự án</a>
      <div class="nav-divider"></div>`;
    }
    C.chapters.forEach((ch) => {
      const secs = ch.sections.filter(match);
      if (!secs.length) return;
      const open = !!f || (navOpen[ch.id] ?? ch === cur);
      const doneN = ch.sections.filter((s) => state.done[s.id]).length;
      html += `<div class="nav-chapter ${open ? "open" : ""}">
        <div class="nav-chapter-head">
          <button class="nav-caret" data-toggle="${ch.id}" aria-expanded="${open}" aria-label="${open ? "Thu gọn" : "Mở"} chương ${ch.num}">▸</button>
          <a href="#/chapter/${ch.id}"><span class="chip-num" style="background:${colorOf(ch)}">${ch.num}</span><span class="nm">${esc(ch.short)}</span></a>
          <span class="w">${doneN}/${ch.sections.length}</span>
        </div>
        ${open ? `<div class="nav-sections">${secs
          .map((s) => `<a class="nav-link ${route === "/section/" + s.id ? "active" : ""}" href="#/section/${s.id}"><span class="dot ${state.done[s.id] ? "done" : ""}"></span>${s.id} ${esc(s.title)}</a>`)
          .join("")}</div>` : ""}</div>`;
    });
    if (f && !allSections.some(match)) html += `<p class="muted small" style="padding:8px">Không tìm thấy mục phù hợp.</p>`;
    sb.innerHTML = html;
    const box = $("#searchBox");
    box.oninput = (e) => { filter = e.target.value; renderSidebar(route); const b = $("#searchBox"); b.focus(); b.setSelectionRange(b.value.length, b.value.length); };
    sb.querySelectorAll("[data-toggle]").forEach((btn) => (btn.onclick = () => {
      const id = btn.dataset.toggle;
      navOpen[id] = btn.getAttribute("aria-expanded") !== "true";
      renderSidebar(route);
    }));
  }

  function updateTopProgress() {
    const p = pct();
    $("#topBar").style.width = p + "%";
    $("#topPct").textContent = p + "%";
  }

  /* ── Thuật ngữ: gạch chân chấm + chú giải khi rê chuột hoặc chạm ── */
  const GL = window.GLOSSARY || [];
  const glById = {};
  const glKeys = [];
  GL.forEach((g) => { glById[g.id] = g; [g.term, ...(g.aka || [])].forEach((k) => glKeys.push([k, g.id])); });
  glKeys.sort((x, y) => y[0].length - x[0].length);
  const glEsc = (k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const glRe = glKeys.length ? new RegExp(`(?<![\\p{L}\\p{N}_.])(${glKeys.map(([k]) => glEsc(k)).join("|")})(?![\\p{L}\\p{N}_])`, "giu") : null;
  const glFind = (word) => { const w = word.toLowerCase(); const hit = glKeys.find(([k]) => k.toLowerCase() === w); return hit && hit[1]; };
  const SKIP = "a,button,pre,h1,h2,h3,h4,.gl,select,label,.lesson-toc,.quiz-q,.tr,.widget";
  function glossify(root) {
    if (!glRe) return;
    const seen = new Set();
    root.querySelectorAll(".gl-scope").forEach((scope) => {
      // <code> chứa đúng một thuật ngữ thì gắn chú giải lên chính nó
      scope.querySelectorAll("code").forEach((c) => {
        if (c.closest("pre") || c.closest(SKIP)) return;
        const id = glFind(c.textContent.trim());
        if (id && !seen.has(id)) { seen.add(id); c.classList.add("gl"); c.dataset.g = id; c.tabIndex = 0; }
      });
      const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, {
        acceptNode: (n) => (n.parentElement.closest(SKIP) || n.parentElement.closest("code") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
      });
      const nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach((node) => {
        const text = node.nodeValue;
        glRe.lastIndex = 0;
        let m, last = 0, frag = null;
        while ((m = glRe.exec(text))) {
          const id = glFind(m[1]);
          if (!id || seen.has(id)) continue;
          seen.add(id);
          frag = frag || document.createDocumentFragment();
          frag.appendChild(document.createTextNode(text.slice(last, m.index)));
          const span = document.createElement("span");
          span.className = "gl"; span.dataset.g = id; span.tabIndex = 0; span.textContent = m[1];
          frag.appendChild(span);
          last = m.index + m[1].length;
        }
        if (frag) { frag.appendChild(document.createTextNode(text.slice(last))); node.parentNode.replaceChild(frag, node); }
      });
    });
  }
  const pop = document.createElement("div");
  pop.id = "glpop"; pop.className = "glpop"; pop.setAttribute("role", "tooltip"); pop.hidden = true;
  document.body.appendChild(pop);
  let popFor = null, popHide = null, popAt = 0;
  function showPop(el) {
    const g = glById[el.dataset.g];
    if (!g) return;
    clearTimeout(popHide);
    if (popFor !== el || pop.hidden) popAt = Date.now();
    popFor = el;
    pop.innerHTML = `<b>${esc(g.term)}</b>${g.en ? ` <span class="muted small">· ${esc(g.en)}</span>` : ""}<p>${g.short}</p><a href="#/glossary/${g.id}">Xem trong bảng thuật ngữ →</a>`;
    pop.hidden = false;
    const r = el.getBoundingClientRect(), W = document.documentElement.clientWidth;
    const w = Math.min(320, W - 24);
    pop.style.width = w + "px";
    pop.style.left = Math.max(12, Math.min(W - w - 12, r.left + r.width / 2 - w / 2)) + "px";
    const below = r.bottom + 8 + pop.offsetHeight < window.innerHeight;
    pop.style.top = (below ? r.bottom + 8 : r.top - pop.offsetHeight - 8) + window.scrollY + "px";
  }
  const hidePop = (now) => { clearTimeout(popHide); popHide = setTimeout(() => { pop.hidden = true; popFor = null; }, now ? 0 : 180); };
  document.addEventListener("mouseover", (e) => { const t = e.target.closest(".gl"); if (t) showPop(t); else if (e.target.closest("#glpop")) clearTimeout(popHide); });
  document.addEventListener("mouseout", (e) => { if (e.target.closest(".gl") || e.target.closest("#glpop")) hidePop(); });
  document.addEventListener("focusin", (e) => { const t = e.target.closest(".gl"); if (t) showPop(t); });
  document.addEventListener("focusout", (e) => { if (e.target.closest(".gl")) hidePop(); });
  document.addEventListener("click", (e) => {
    const t = e.target.closest(".gl");
    // Trên màn hình cảm ứng, chạm sẽ phát cả mouseover lẫn click: chỉ đóng khi chạm lần hai
    if (t) { if (popFor === t && !pop.hidden && Date.now() - popAt > 400) hidePop(true); else showPop(t); }
    else if (!e.target.closest("#glpop")) hidePop(true);
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") hidePop(true); });

  /* ── Trang chủ ── */
  function renderHome() {
    const e = C.exam;
    const best = state.exams.length ? Math.max(...state.exams.map((x) => x.score)) : null;
    const missed = missedPool().length;
    app.innerHTML = `
      <section class="hero">
        <span class="tag">Tài liệu ôn tập độc lập</span>
        <h1>Claude Certified Architect – Foundations</h1>
        <p class="muted" style="margin:0">Học theo từng chương: đọc phần cơ bản, xem mô phỏng từng bước, giải tình huống khó, làm câu hỏi có giải thích, rồi thực hành như một dự án thật.</p>
        <div class="stats">
          <div class="stat"><b>${e.questions}</b><span>câu hỏi</span></div>
          <div class="stat"><b>${e.minutes}′</b><span>thời gian</span></div>
          <div class="stat"><b>${e.passScore}</b><span>điểm đạt / ${e.maxScore}</span></div>
          <div class="stat"><b>${pct()}%</b><span>bạn đã học</span></div>
          <div class="stat"><b>${best ?? "—"}</b><span>điểm thi thử cao nhất</span></div>
        </div>
        <div class="btn-row">
          <a class="btn primary" href="#/section/${nextUnread().id}">${pct() ? "Học tiếp" : "Bắt đầu học"} →</a>
          <a class="btn" href="#/exam">📝 Thi thử</a>
          <a class="btn" href="#/flashcards/all">🃏 Flashcard</a>
        </div>
      </section>
      <h2>Bắt đầu từ đâu?</h2>
      <div class="grid grid-2 paths">
        <a class="card path" href="#/section/0-0"><b>🌱 Bạn mới hoàn toàn</b><span>Chưa từng gọi API hay dùng Claude Code. Đọc <u>Kiến thức nền</u> trước (khoảng 20 phút), rồi học lần lượt từ chương 0.</span></a>
        <a class="card path" href="#/section/0-1"><b>🧭 Bạn đã biết lập trình</b><span>Xem nhanh cấu trúc đề thi ở mục 0-1, rồi học từ chương 1. Gặp từ lạ thì rê chuột vào từ có gạch chấm để xem nghĩa.</span></a>
        <a class="card path" href="#/exam"><b>🎯 Bạn sắp thi</b><span>Làm đề 60 câu trong 120 phút giống đề thật, rồi ôn lại những câu làm sai${missed ? ` (hiện có ${missed} câu)` : ""}.</span></a>
        <a class="card path" href="#/practice"><b>🛠️ Bạn cần triển khai cho khách hàng</b><span>Mỗi chương có một bài thực hành chạy được và danh sách việc cần kiểm tra trước khi giao cho khách.</span></a>
      </div>
      <h2>Các chương</h2>
      <div class="grid grid-2">${C.chapters
        .map(
          (ch) => `<a class="card chapter-card" style="--cc:${colorOf(ch)}" href="#/chapter/${ch.id}">
          <div style="display:flex;align-items:center;gap:8px"><span class="chip-num" style="background:${colorOf(ch)}">${ch.num}</span><span class="tag">${ch.weight ? "Trọng số " + ch.weight + "%" : "Nhập môn"}</span></div>
          <h3>${esc(viTitle(ch))}</h3>
          ${enTitle(ch) ? `<div class="en-sub">${esc(enTitle(ch))}</div>` : ""}
          <p class="muted small" style="margin:0 0 10px">${esc(ch.summary)}</p>
          <div class="bar"><span style="width:${chapterPct(ch)}%;background:${colorOf(ch)}"></span></div>
          <div class="small muted" style="margin-top:6px">${ch.sections.filter((s) => state.done[s.id]).length}/${ch.sections.length} mục · ${chapterPct(ch)}%</div>
        </a>`
        )
        .join("")}</div>
      ${state.exams.length ? `<h2>Lịch sử thi thử</h2><div class="card"><table class="t"><tr><th>Thời gian</th><th>Số câu</th><th>Điểm</th><th>Kết quả</th></tr>${state.exams
        .slice(-8).reverse()
        .map((x) => `<tr><td>${new Date(x.date).toLocaleString("vi-VN")}</td><td>${x.total}</td><td><b>${x.score}</b></td><td>${x.score >= e.passScore ? '<span class="verdict good">ĐẠT</span>' : '<span class="verdict bad">CHƯA ĐẠT</span>'}</td></tr>`)
        .join("")}</table><div style="margin-top:10px"><button class="btn" id="resetBtn">Xóa toàn bộ tiến độ</button></div></div>` : `<p class="small muted" style="margin-top:24px"><button class="btn" id="resetBtn">Xóa toàn bộ tiến độ</button></p>`}
      <p class="footer">Không liên kết hay được xác nhận bởi Anthropic. Hãy đối chiếu với Exam Guide chính thức của Anthropic trước khi thi.</p>`;
    $("#resetBtn").onclick = () => {
      if (!confirm("Xóa toàn bộ tiến độ học, quiz, flashcard và lịch sử thi thử?")) return;
      Object.assign(state, { done: {}, quiz: {}, exams: [], plan: {}, missed: {}, known: {}, check: {} });
      save(); route();
    };
  }
  function nextUnread() { return allSections.find((s) => !state.done[s.id]) || allSections[0]; }

  /* ── Trang chương ── */
  function renderChapter(id) {
    const ch = findChapter(id);
    if (!ch) return renderHome();
    const pr = (window.PRACTICE || {})[ch.id];
    app.innerHTML = `
      <div class="breadcrumb"><a href="#/">Trang chủ</a> / Chương ${ch.num}</div>
      <div class="section-head"><span class="chip-num" style="background:${colorOf(ch)};width:34px;height:34px;font-size:16px">${ch.num}</span><h1 style="margin:0">${esc(viTitle(ch))}</h1></div>
      ${enTitle(ch) ? `<div class="en-sub" style="margin:4px 0 0">Tên trong đề thi: ${esc(enTitle(ch))}</div>` : ""}
      <p class="muted">${esc(ch.summary)} ${ch.weight ? `<span class="tag">~${Math.round((C.exam.questions * ch.weight) / 100)} câu trong đề</span>` : ""}</p>
      <div class="btn-row" style="margin:14px 0 22px">
        <a class="btn primary" href="#/section/${(ch.sections.find((s) => !state.done[s.id]) || ch.sections[0]).id}">Học chương này →</a>
        <a class="btn" href="#/flashcards/${ch.id}">🃏 Flashcard chương</a>
        ${ch.weight ? `<a class="btn" href="#/exam/${ch.id}">📝 Luyện đề chương</a>` : ""}
        ${pr ? `<a class="btn" href="#/practice/${ch.id}">🛠️ Thực hành</a>` : ""}
      </div>
      <div class="grid">${ch.sections
        .map(
          (s) => `<a class="card sec-card" href="#/section/${s.id}">
          <span class="dot ${state.done[s.id] ? "done" : ""}" style="width:14px;height:14px"></span>
          <div style="flex:1;min-width:0"><div style="font-weight:700">${s.id} · ${esc(s.title)}</div><div class="small muted">${esc((s.goals || s.keyPoints || [])[0] || "")}</div></div>
          <span class="tag">~${minutesOf(s)} phút</span></a>`
        )
        .join("")}</div>
      ${pr ? `<a class="card practice-teaser" href="#/practice/${ch.id}"><b>🛠️ Thực hành sau chương: ${esc(pr.title)}</b><span class="muted small">${esc(pr.goal)}</span></a>` : ""}`;
  }

  /* ── Quiz ── */
  const qBadges = (q) => (q.level === "hard" ? '<span class="q-badge hard">Câu khó</span>' : "") + (q.trap ? '<span class="q-badge trap">Có bẫy</span>' : "");
  // Giải thích sau khi trả lời: lời giải chung, từng phương án (theo thứ tự đang hiển thị) và cái bẫy của câu hỏi
  function explainHTML(q, j, order) {
    const L = (k) => LETTERS[order.indexOf(k)];
    const notes = q.notes
      ? `<ul class="notes">${order.map((k) => `<li class="${k === q.answer ? "ok" : ""}"><b class="l">${k === q.answer ? "✅" : k === j ? "❌" : "▫️"}</b><b>${L(k)}.</b> ${esc(q.notes[k])}</li>`).join("")}</ul>`
      : "";
    return `${esc(q.explain)}${notes}${q.trap ? `<div class="trapline"><b>Bẫy của câu này:</b> ${esc(q.trap)}</div>` : ""}`;
  }
  function quizHTML(questions, prefix) {
    return questions
      .map((q, i) => {
        const qid = `${prefix}-q${i}`;
        const order = perm(qid, q.options.length);
        return `<div class="quiz-q" data-qid="${qid}" data-answer="${q.answer}" data-i="${i}">
          <div class="q">${i + 1}. ${qBadges(q)}${esc(qText(q))}</div>
          ${order.map((j, pos) => `<button class="opt" data-j="${j}"><span class="letter">${LETTERS[pos]}</span>${esc(qOpts(q)[j])}</button>`).join("")}
          <div class="explain" hidden><b></b> <span class="ex-body"></span></div></div>`;
      })
      .join("");
  }
  function bindQuiz(root, questions, onAnswer) {
    root.querySelectorAll(".quiz-q").forEach((box) => {
      const qid = box.dataset.qid, ans = +box.dataset.answer, q = questions[+box.dataset.i];
      const order = perm(qid, q.options.length);
      const show = (j) => {
        box.querySelectorAll(".opt").forEach((b) => {
          const k = +b.dataset.j;
          b.disabled = true;
          if (k === ans) b.classList.add("correct");
          else if (k === j) b.classList.add("wrong");
        });
        const ex = box.querySelector(".explain");
        ex.hidden = false;
        ex.querySelector("b").textContent = j === ans ? "✅ Chính xác." : `❌ Chưa đúng — đáp án ${LETTERS[order.indexOf(ans)]}.`;
        ex.querySelector(".ex-body").innerHTML = explainHTML(q, j, order);
      };
      if (state.quiz[qid] !== undefined) show(state.quiz[qid]);
      box.querySelectorAll(".opt").forEach((b) => (b.onclick = () => {
        const j = +b.dataset.j;
        state.quiz[qid] = j;
        setMissed(qid, j !== ans);
        save(); show(j);
        if (onAnswer) onAnswer();
      }));
    });
  }

  /* ── Tình huống khó & bẫy ── */
  function trapsHTML(traps) {
    return traps
      .map((t, i) => `<div class="trap-card">
        <div class="th"><small>Tình huống ${i + 1}${t.level === "hard" ? " · khó" : ""}</small>${esc(t.title)}</div>
        <div class="tb"><p class="scen gl-scope">${t.scenario}</p>
          <p class="ask">Bạn sẽ xử lý thế nào? Hãy tự nghĩ câu trả lời trước khi mở lời giải.</p>
          <button class="btn" data-trap="${i}" aria-expanded="false">Xem lời giải</button>
          <div class="trap-reveal" hidden>
            <div class="bait"><span class="lbl">Cách làm dễ sai</span>${t.bait}</div>
            <div class="why"><span class="lbl">Vì sao không ổn</span>${t.why}</div>
            <div class="fix"><span class="lbl">Nên làm thế nào</span><ol>${t.fix.map((f) => `<li>${f}</li>`).join("")}</ol>${t.code ? `<pre><code>${esc(t.code)}</code></pre>` : ""}</div>
          </div></div></div>`)
      .join("");
  }
  function bindTraps(root) {
    root.querySelectorAll("[data-trap]").forEach((b) => (b.onclick = () => {
      const r = b.closest(".tb").querySelector(".trap-reveal");
      r.hidden = !r.hidden;
      b.textContent = r.hidden ? "Xem lời giải" : "Ẩn lời giải";
      b.setAttribute("aria-expanded", String(!r.hidden));
    }));
  }

  /* ── Trang mục ── */
  let spy = null;
  function renderSection(id) {
    const s = findSection(id);
    if (!s) return renderHome();
    const ch = s.chapter;
    const idx = allSections.indexOf(s);
    const prev = allSections[idx - 1], next = allSections[idx + 1];
    const widgets = (s.widgets || [s.widget]).map((w) => window.WIDGETS && window.WIDGETS[w]).filter(Boolean);
    const quiz = s.quiz || [];
    const hard = quiz.filter((q) => q.level === "hard").length;
    const toc = [
      ["basic", "Cơ bản"],
      widgets.length && ["sim", "Mô phỏng"],
      s.advanced && ["adv", "Hiểu sâu"],
      (s.traps || []).length && ["trap", "Tình huống khó"],
      quiz.length && ["quiz", `Kiểm tra (${quiz.length} câu${hard ? `, ${hard} khó` : ""})`],
    ].filter(Boolean);
    const head = (key, title, sub, first) => `<div class="lvl-head${first ? " first" : ""}" id="sec-${key}"><h2>${title}</h2>${sub ? `<p>${sub}</p>` : ""}</div>`;
    const doneBtn = () => `<button class="btn ${state.done[s.id] ? "ok" : "primary"}" id="doneBtn">${state.done[s.id] ? "✓ Đã hoàn thành" : "Đánh dấu hoàn thành"}</button>`;
    app.innerHTML = `
      <div class="breadcrumb"><a href="#/">Trang chủ</a> / <a href="#/chapter/${ch.id}">Chương ${ch.num}: ${esc(ch.short)}</a> / Mục ${s.id}</div>
      <div class="section-head"><span class="chip-num" style="background:${colorOf(ch)}">${ch.num}</span><span class="tag">Mục ${s.id}</span><span class="tag" title="Thời gian ước tính, gồm cả mô phỏng và câu hỏi">⏱ ~${minutesOf(s)} phút</span><span class="tag ok-tag" id="doneTag" ${state.done[s.id] ? "" : "hidden"}>✓ Đã hoàn thành</span></div>
      <h1>${esc(s.title)}</h1>
      ${s.goals ? `<div class="goals"><h4>Học xong mục này, bạn sẽ:</h4><ul>${s.goals.map((g) => `<li>${esc(g)}</li>`).join("")}</ul></div>` : ""}
      <nav class="lesson-toc" aria-label="Các phần của bài">${toc.map(([k, l]) => `<button data-go="${k}">${l}</button>`).join("")}</nav>
      ${head("basic", "Kiến thức cơ bản", "", true)}
      <div class="body gl-scope">${s.body}</div>
      <div class="keypoints gl-scope"><h4>Tóm lại, cần nhớ</h4><ul>${(s.keyPoints || []).map((k) => `<li>${esc(k)}</li>`).join("")}</ul></div>
      ${s.tip ? `<div class="tip gl-scope"><b>Mẹo khi đi thi:</b> ${esc(s.tip)}</div>` : ""}
      ${widgets.length ? head("sim", "Mô phỏng", "Xem dữ liệu đi qua hệ thống từng bước. Có thể đổi tình huống để thấy kết quả khác nhau.") : ""}
      ${widgets.map((w, k) => `<div class="widget"><div class="widget-head">${esc(w.title)}</div><div class="widget-body" data-w="${k}"></div></div>`).join("")}
      ${s.advanced ? `${head("adv", "Hiểu sâu hơn", "Đọc khi đã nắm phần cơ bản. Phần này giải thích cơ chế bên dưới và các chi tiết hay bị hỏi xoáy.")}<div class="body gl-scope">${s.advanced}</div>` : ""}
      ${(s.traps || []).length ? `${head("trap", "Tình huống khó", "Những tình huống thực tế dễ làm sai. Hãy tự nghĩ cách xử lý trước, rồi mới mở lời giải.")}<div id="traps">${trapsHTML(s.traps)}</div>` : ""}
      ${quiz.length ? `${head("quiz", "Kiểm tra nhanh", "Chọn một đáp án để xem giải thích cho từng phương án. Làm hết các câu thì mục này tự được đánh dấu hoàn thành.")}${langHTML()}<div id="quiz">${quizHTML(quiz, s.id)}</div>` : ""}
      <div style="margin-top:20px" id="doneWrap">${doneBtn()}</div>
      <div class="pager">
        ${prev ? `<a class="btn" href="#/section/${prev.id}">← ${prev.id} ${esc(prev.title)}</a>` : "<span></span>"}
        ${next ? `<a class="btn" href="#/section/${next.id}">${next.id} ${esc(next.title)} →</a>` : `<a class="btn primary" href="#/exam">Đi thi thử →</a>`}
      </div>`;
    widgets.forEach((w, k) => {
      const mount = app.querySelector(`[data-w="${k}"]`);
      try { w.render(mount); } catch (e) { mount.textContent = "Không tải được mô phỏng."; console.error(e); }
    });
    glossify(app);

    // Mục lục dính: bấm để cuộn, tự sáng phần đang đọc
    app.querySelectorAll("[data-go]").forEach((b) => (b.onclick = () => $("#sec-" + b.dataset.go)?.scrollIntoView({ behavior: "smooth", block: "start" })));
    const heads = toc.map(([k]) => $("#sec-" + k)).filter(Boolean);
    const mark = () => {
      const y = 140;
      let cur = heads[0];
      heads.forEach((h) => { if (h.getBoundingClientRect().top < y) cur = h; });
      app.querySelectorAll("[data-go]").forEach((b) => b.classList.toggle("on", cur && "sec-" + b.dataset.go === cur.id));
    };
    spy = () => requestAnimationFrame(mark);
    window.addEventListener("scroll", spy, { passive: true });
    mark();

    const markDone = (v) => {
      state.done[s.id] = v;
      save();
      $("#doneWrap").innerHTML = doneBtn();
      $("#doneTag").hidden = !v;
      bindDone();
      renderSidebar(location.hash.replace(/^#/, "") || "/");
      updateTopProgress();
    };
    const allAnswered = () => quiz.every((q, i) => state.quiz[`${s.id}-q${i}`] !== undefined);
    const onAnswer = () => {
      if (!state.done[s.id] && allAnswered()) {
        markDone(true);
        toast(`Đã làm hết câu hỏi. Mục ${s.id} được đánh dấu hoàn thành.`);
      }
    };
    const drawQuiz = () => {
      const qz = $("#quiz");
      if (!qz) return;
      qz.innerHTML = quizHTML(quiz, s.id);
      bindQuiz(qz, quiz, onAnswer);
      app.querySelectorAll(".qlang [data-lang]").forEach((b) => b.classList.toggle("on", b.dataset.lang === state.qlang));
    };
    if ($("#quiz")) { bindQuiz($("#quiz"), quiz, onAnswer); bindLang(app, drawQuiz); }
    const tr = $("#traps");
    if (tr) bindTraps(tr);
    const bindDone = () => ($("#doneBtn").onclick = () => {
      const v = !state.done[s.id];
      if (v && next) { state.done[s.id] = true; save(); location.hash = "#/section/" + next.id; }
      else markDone(v);
    });
    bindDone();
  }

  /* ── Flashcard ── */
  function renderFlash(id) {
    const cards = [];
    C.chapters.forEach((ch) => {
      if (id !== "all" && ch.id !== id) return;
      (ch.flashcards || []).forEach((f, i) => cards.push({ ...f, ch, key: `${ch.id}-c${i}` }));
      ch.sections.forEach((s) => ((window.FLASH || {})[s.id] || []).forEach((f, i) => cards.push({ ...f, ch, sec: s.id, key: `${s.id}-f${i}` })));
    });
    const total = C.chapters.reduce((n, c) => n + (c.flashcards || []).length + c.sections.reduce((m, s) => m + ((window.FLASH || {})[s.id] || []).length, 0), 0);
    let onlyNew = false, order = cards.map((_, i) => i), i = 0;
    const deck = () => order.filter((k) => !onlyNew || !state.known[cards[k].key]);
    const draw = () => {
      const d = deck();
      if (i >= d.length) i = 0;
      const c = cards[d[i]];
      const knownN = cards.filter((x) => state.known[x.key]).length;
      app.innerHTML = `
        <div class="breadcrumb"><a href="#/">Trang chủ</a> / Flashcard</div>
        <h1>🃏 Flashcard</h1>
        <p class="muted">Đọc mặt trước, tự trả lời trong đầu, rồi lật thẻ để kiểm tra. Đánh dấu thẻ đã nhớ để lần sau chỉ ôn những thẻ còn quên.</p>
        <div class="btn-row"><select id="deck" aria-label="Chọn bộ thẻ"><option value="all">Tất cả chương (${total} thẻ)</option>${C.chapters
          .map((ch) => `<option value="${ch.id}" ${ch.id === id ? "selected" : ""}>Chương ${ch.num}: ${esc(ch.short)}</option>`)
          .join("")}</select><button class="btn" id="shuffle">🔀 Trộn thẻ</button>
          <label class="toggle"><input type="checkbox" id="onlyNew" ${onlyNew ? "checked" : ""}> Chỉ thẻ chưa nhớ</label></div>
        <p class="small muted">Đã nhớ ${knownN}/${cards.length} thẻ trong bộ này.</p>
        ${c ? `<div class="flash-wrap">
          <div class="flash" id="card" tabindex="0" role="button" aria-label="Lật thẻ"><div class="face front"><small>Chương ${c.ch.num}${c.sec ? " · Mục " + c.sec : ""} · bấm để lật</small>${esc(c.front)}</div><div class="face back"><small>Đáp án</small>${esc(c.back)}</div></div>
        </div>
        <div class="btn-row" style="justify-content:center"><button class="btn" id="prev">← Trước</button><span class="tag" style="align-self:center">${i + 1} / ${d.length}</span><button class="btn primary" id="next">Tiếp →</button></div>
        <div class="btn-row" style="justify-content:center;margin-top:10px"><button class="btn ${state.known[c.key] ? "ok" : ""}" id="known">${state.known[c.key] ? "✓ Đã nhớ" : "Đánh dấu đã nhớ"}</button></div>
        <p class="small muted" style="text-align:center">Phím tắt: Space để lật · ← → để chuyển thẻ · K để đánh dấu đã nhớ</p>`
        : `<div class="card" style="text-align:center;margin-top:20px">🎉 Bạn đã nhớ hết thẻ trong bộ này. Bỏ chọn “Chỉ thẻ chưa nhớ” để ôn lại toàn bộ.</div>`}`;
      $("#deck").onchange = (e) => (location.hash = "#/flashcards/" + e.target.value);
      $("#shuffle").onclick = () => { order.sort(() => Math.random() - 0.5); i = 0; draw(); };
      $("#onlyNew").onchange = (e) => { onlyNew = e.target.checked; i = 0; draw(); };
      if (!c) return;
      $("#card").onclick = () => $("#card").classList.toggle("flipped");
      $("#prev").onclick = () => { i = (i - 1 + d.length) % d.length; draw(); };
      $("#next").onclick = () => { i = (i + 1) % d.length; draw(); };
      $("#known").onclick = () => {
        if (state.known[c.key]) delete state.known[c.key]; else state.known[c.key] = 1;
        save();
        if (onlyNew && state.known[c.key]) { draw(); return; }
        draw();
      };
    };
    document.onkeydown = (e) => {
      if (!location.hash.startsWith("#/flashcards") || e.target.matches("input, select, textarea")) return;
      if (e.key === " ") { e.preventDefault(); $("#card")?.classList.toggle("flipped"); }
      if (e.key === "ArrowRight") $("#next")?.click();
      if (e.key === "ArrowLeft") $("#prev")?.click();
      if (e.key === "k" || e.key === "K") $("#known")?.click();
    };
    draw();
  }

  /* ── Thi thử ── */
  let timerId = null;
  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function pickWeighted(n) {
    const out = [];
    const domains = C.chapters.filter((c) => c.weight > 0);
    domains.forEach((ch) => {
      const pool = shuffle(examPool.filter((q) => q.chapter === ch));
      out.push(...pool.slice(0, Math.max(1, Math.round((n * ch.weight) / 100))));
    });
    return shuffle(out).slice(0, n);
  }
  function renderExamStart(chId) {
    clearInterval(timerId);
    const ch = chId && findChapter(chId);
    const hardN = examPool.filter((q) => q.level === "hard").length;
    const missed = missedPool().length;
    const draw = () => {
      app.innerHTML = `
      <div class="breadcrumb"><a href="#/">Trang chủ</a> / Thi thử</div>
      <h1>📝 ${ch ? "Luyện đề chương " + ch.num + ": " + esc(ch.short) : "Thi thử CCA-F"}</h1>
      <p class="muted">${ch ? "Làm toàn bộ câu hỏi của chương, không tính vào lịch sử thi thử." : `Ngân hàng hiện có ${examPool.length} câu (${hardN} câu khó), lấy theo trọng số từng lĩnh vực. Có đồng hồ đếm ngược 2 phút/câu như đề thật; điểm quy đổi về thang ${C.exam.maxScore}, đạt từ ${C.exam.passScore}.`} Thứ tự câu hỏi và phương án được trộn lại mỗi lần làm.</p>
      ${langHTML()}
      <div class="grid grid-3">
        ${ch
          ? `<div class="card"><h3 style="margin-top:0">Toàn bộ chương</h3><p class="muted small">${examPool.filter((q) => q.chapter === ch).length} câu của chương ${ch.num}.</p><button class="btn primary" data-mode="chapter">Bắt đầu</button></div>`
          : `<div class="card"><h3 style="margin-top:0">Giống đề thật</h3><p class="muted small">${C.exam.questions} câu · ${C.exam.minutes} phút · chia theo trọng số từng lĩnh vực.</p><button class="btn primary" data-mode="${C.exam.questions}">Bắt đầu</button></div>
             <div class="card"><h3 style="margin-top:0">Nhanh</h3><p class="muted small">20 câu · 40 phút. Hợp để làm trong giờ nghỉ.</p><button class="btn" data-mode="20">Bắt đầu</button></div>
             <div class="card"><h3 style="margin-top:0">Ôn câu sai</h3><p class="muted small">${missed} câu bạn từng làm sai (trong bài học hoặc thi thử). Làm đúng thì câu đó được gỡ khỏi danh sách.</p><button class="btn" data-mode="wrong" ${missed ? "" : "disabled"}>Bắt đầu</button></div>`}
      </div>
      ${ch ? "" : `<h2>Luyện theo chương</h2><div class="btn-row">${C.chapters.filter((c) => c.weight > 0).map((c) => `<a class="btn" href="#/exam/${c.id}"><span class="chip-num" style="background:${colorOf(c)}">${c.num}</span>${esc(c.short)} · ${examPool.filter((q) => q.chapter === c).length} câu</a>`).join("")}</div>`}`;
      bindLang(app, draw);
      app.querySelectorAll("[data-mode]").forEach((b) => (b.onclick = () => {
        const m = b.dataset.mode;
        let qs;
        if (m === "chapter") qs = shuffle(examPool.filter((q) => q.chapter === ch));
        else if (m === "wrong") qs = shuffle(missedPool());
        else qs = pickWeighted(+m);
        if (!qs.length) return alert("Chưa có câu nào trong nhóm này.");
        runExam(qs, m === "chapter" || m === "wrong");
      }));
    };
    draw();
  }
  function runExam(qs, practice) {
    const answers = new Array(qs.length).fill(null);
    let cur = 0, finished = false;
    let remain = qs.length * 120;
    const draw = () => {
      const q = qs[cur];
      const order = perm(q.id, q.options.length);
      app.innerHTML = `
        <div class="exam-top"><b>Câu ${cur + 1}/${qs.length}</b><span class="tag" style="background:${colorOf(q.chapter)};color:#fff">${esc(q.chapter.short)}</span><div class="spacer" style="flex:1"></div>
          ${finished ? "" : `<span class="timer" id="timer"></span><button class="btn primary" id="submit">Nộp bài</button>`}</div>
        <div class="qnav">${qs.map((qq, k) => {
          let cls = k === cur ? "current " : "";
          if (finished) cls += answers[k] === qq.answer ? "correct" : "wrong";
          else if (answers[k] !== null) cls += "answered";
          return `<button class="${cls}" data-k="${k}" aria-label="Câu ${k + 1}">${k + 1}</button>`;
        }).join("")}</div>
        ${langHTML()}
        <div class="card"><div class="quiz-q"><div class="q">${qBadges(q)}${esc(qText(q))}</div>
          ${order.map((j, pos) => {
            let cls = "";
            if (finished) cls = j === q.answer ? "correct" : j === answers[cur] ? "wrong" : "";
            else if (answers[cur] === j) cls = "selected";
            return `<button class="opt ${cls}" data-j="${j}" ${finished ? "disabled" : ""}><span class="letter">${LETTERS[pos]}</span>${esc(qOpts(q)[j])}</button>`;
          }).join("")}
          ${finished ? `<div class="explain"><b>${answers[cur] === q.answer ? "✅ Đúng." : answers[cur] === null ? `⏭ Bỏ trống — đáp án ${LETTERS[order.indexOf(q.answer)]}.` : `❌ Sai — đáp án ${LETTERS[order.indexOf(q.answer)]}.`}</b> ${explainHTML(q, answers[cur], order)} <a href="#/section/${q.section.id}">Xem lại mục ${q.section.id} →</a></div>` : ""}
        </div></div>
        <div class="pager"><button class="btn" id="prevQ" ${cur === 0 ? "disabled" : ""}>← Câu trước</button>
          ${finished ? `<button class="btn" id="back">Xem kết quả</button>` : ""}
          <button class="btn primary" id="nextQ" ${cur === qs.length - 1 ? "disabled" : ""}>Câu sau →</button></div>`;
      bindLang(app, draw);
      app.querySelectorAll(".qnav button").forEach((b) => (b.onclick = () => { cur = +b.dataset.k; draw(); }));
      app.querySelectorAll(".opt").forEach((b) => (b.onclick = () => { answers[cur] = +b.dataset.j; if (cur < qs.length - 1) cur++; draw(); }));
      $("#prevQ").onclick = () => { cur--; draw(); };
      $("#nextQ").onclick = () => { cur++; draw(); };
      if (finished) $("#back").onclick = result;
      else { $("#submit").onclick = () => { const left = answers.filter((a) => a === null).length; if (!left || confirm(`Còn ${left} câu chưa trả lời. Nộp bài?`)) finish(); }; tick(); }
    };
    const tick = () => {
      const t = $("#timer");
      if (t) t.textContent = `⏱ ${String(Math.floor(remain / 60)).padStart(2, "0")}:${String(remain % 60).padStart(2, "0")}`;
    };
    clearInterval(timerId);
    timerId = setInterval(() => { remain--; tick(); if (remain <= 0) finish(); }, 1000);
    const finish = () => {
      clearInterval(timerId);
      finished = true;
      const correct = qs.filter((q, k) => answers[k] === q.answer).length;
      const score = Math.round(100 + (900 * correct) / qs.length);
      qs.forEach((q, k) => setMissed(q.id, answers[k] !== q.answer));
      if (!practice) state.exams.push({ date: Date.now(), total: qs.length, correct, score });
      save();
      result();
    };
    const result = () => {
      const correct = qs.filter((q, k) => answers[k] === q.answer).length;
      const score = Math.round(100 + (900 * correct) / qs.length);
      const pass = score >= C.exam.passScore;
      const doms = C.chapters.filter((c) => qs.some((q) => q.chapter === c));
      const weak = allSections.filter((s) => qs.some((q, k) => q.section.id === s.id && answers[k] !== q.answer));
      app.innerHTML = `
        <div class="breadcrumb"><a href="#/">Trang chủ</a> / <a href="#/exam">Thi thử</a> / Kết quả</div>
        <div class="card" style="text-align:center">
          <div class="score-big" style="color:${pass ? "var(--ok)" : "var(--bad)"}">${score}</div>
          <div class="muted">${correct}/${qs.length} câu đúng · cần ${C.exam.passScore} để đạt</div>
          <div class="verdict ${pass ? "good" : "bad"}" style="font-size:15px">${pass ? "🎉 ĐẠT" : "CHƯA ĐẠT — tiếp tục ôn nhé"}</div>
        </div>
        <h2>Theo lĩnh vực</h2>
        <div class="card">${doms.map((ch) => {
          const qd = qs.map((q, k) => [q, k]).filter(([q]) => q.chapter === ch);
          const ok = qd.filter(([q, k]) => answers[k] === q.answer).length;
          const p = Math.round((ok / qd.length) * 100);
          return `<div style="margin:10px 0"><div style="display:flex;justify-content:space-between;gap:10px;font-size:14px"><a href="#/chapter/${ch.id}"><b>${ch.num}. ${esc(viTitle(ch))}</b></a><span>${ok}/${qd.length} · ${p}%</span></div><div class="bar"><span style="width:${p}%;background:${p >= 72 ? "var(--ok)" : colorOf(ch)}"></span></div></div>`;
        }).join("")}</div>
        ${weak.length ? `<h2>Nên đọc lại</h2><div class="btn-row">${weak.map((s) => `<a class="btn" href="#/section/${s.id}">${s.id} ${esc(s.title)}</a>`).join("")}</div>` : ""}
        <div class="btn-row" style="margin-top:18px"><button class="btn primary" id="review">Xem lại từng câu</button><a class="btn" href="#/exam">Làm đề khác</a></div>`;
      $("#review").onclick = () => { cur = 0; draw(); };
    };
    draw();
  }

  /* ── Bảng thuật ngữ ── */
  function renderGlossary(focus) {
    let q = "";
    const draw = () => {
      const f = q.trim().toLowerCase();
      const list = GL.slice()
        .sort((a, b) => a.term.localeCompare(b.term, "vi"))
        .filter((g) => !f || [g.term, g.en || "", ...(g.aka || []), plain(g.short), plain(g.long || "")].join(" ").toLowerCase().includes(f));
      const groups = {};
      list.forEach((g) => { const L = g.term[0].toUpperCase(); (groups[L] = groups[L] || []).push(g); });
      $("#glList").innerHTML = list.length
        ? Object.entries(groups).map(([L, gs]) => `<h3 class="gl-letter">${esc(L)}</h3>${gs.map((g) => `<div class="gl-item${g.id === focus ? " focus" : ""}" id="g-${g.id}">
            <div class="gl-term">${esc(g.term)}${g.en ? ` <span class="muted small">· ${esc(g.en)}</span>` : ""}${(g.aka || []).length ? ` <span class="muted small">· còn gọi: ${g.aka.map(esc).join(", ")}</span>` : ""}</div>
            <p>${g.short}</p>${g.long ? `<p class="muted">${g.long}</p>` : ""}
            ${(g.see || []).length ? `<div class="small">Học ở: ${g.see.map((id) => { const s = findSection(id); return s ? `<a href="#/section/${id}">${id} ${esc(s.title)}</a>` : ""; }).join(" · ")}</div>` : ""}
          </div>`).join("")}`).join("")
        : `<p class="muted">Không tìm thấy thuật ngữ phù hợp.</p>`;
    };
    app.innerHTML = `
      <div class="breadcrumb"><a href="#/">Trang chủ</a> / Thuật ngữ</div>
      <h1>📖 Bảng thuật ngữ</h1>
      <p class="muted">${GL.length} từ hay gặp khi học và khi đọc đề, giải thích bằng lời đơn giản. Trong bài học, những từ có gạch chân chấm đều có ở đây: rê chuột hoặc chạm vào để xem nhanh.</p>
      <input class="search" id="glSearch" placeholder="Tìm thuật ngữ, ví dụ: token, hook, MCP..." aria-label="Tìm thuật ngữ">
      <div id="glList"></div>`;
    $("#glSearch").oninput = (e) => { q = e.target.value; draw(); };
    draw();
    if (focus) setTimeout(() => $("#g-" + focus)?.scrollIntoView({ block: "center" }), 50);
  }

  /* ── Thực hành dự án ── */
  function renderPracticeIndex() {
    const P = window.PRACTICE || {};
    app.innerHTML = `
      <div class="breadcrumb"><a href="#/">Trang chủ</a> / Thực hành dự án</div>
      <h1>🛠️ Thực hành dự án</h1>
      <p class="muted">Thi đỗ mới là một nửa. Phần này giúp bạn làm thật: mỗi chương có một bài thực hành nhỏ chạy được, đi kèm danh sách việc cần kiểm tra trước khi giao cho khách hàng. Nên làm sau khi học xong chương tương ứng.</p>
      <p class="small">Toàn bộ code mẫu (Python, đã chạy thử) nằm trong thư mục <a href="${REPO}/tree/main/examples" target="_blank" rel="noopener">examples/ trên GitHub</a>. Tải cả repo về, làm theo <code>examples/README.md</code> để cài đặt.</p>
      ${P.checklist ? `<a class="card practice-teaser" href="#/practice/checklist"><b>✅ ${esc(P.checklist.title)}</b><span class="muted small">${esc(P.checklist.goal)}</span></a>` : ""}
      <div class="grid">${C.chapters.filter((c) => P[c.id]).map((c) => {
        const p = P[c.id];
        return `<a class="card sec-card" href="#/practice/${c.id}"><span class="chip-num" style="background:${colorOf(c)}">${c.num}</span>
          <div style="flex:1;min-width:0"><div style="font-weight:700">${esc(p.title)}</div><div class="small muted">${esc(p.goal)}</div></div><span class="tag">~${p.time} phút</span></a>`;
      }).join("")}</div>`;
  }
  function renderPractice(id) {
    const P = window.PRACTICE || {};
    const p = P[id];
    if (!p) return renderPracticeIndex();
    const ch = findChapter(id);
    const ck = (k) => `${id}-${k}`;
    const checks = (items, base) => `<ul class="checklist">${items.map((t, k) => `<li><label><input type="checkbox" data-ck="${ck(base + k)}" ${state.check[ck(base + k)] ? "checked" : ""}> <span>${t}</span></label></li>`).join("")}</ul>`;
    app.innerHTML = `
      <div class="breadcrumb"><a href="#/">Trang chủ</a> / <a href="#/practice">Thực hành dự án</a> / ${ch ? "Chương " + ch.num : esc(p.title)}</div>
      <h1>${esc(p.title)}</h1>
      <div class="section-head" style="margin-bottom:14px">${ch ? `<span class="chip-num" style="background:${colorOf(ch)}">${ch.num}</span><span class="tag">${esc(ch.short)}</span>` : ""}${p.time ? `<span class="tag">⏱ ~${p.time} phút</span>` : ""}${p.level ? `<span class="tag">${esc(p.level)}</span>` : ""}</div>
      <div class="goals"><h4>Mục tiêu</h4><p style="margin:0">${p.goal}</p></div>
      <div class="body gl-scope">
        ${p.scenario ? `<h4>Bối cảnh</h4><p>${p.scenario}</p>` : ""}
        ${(p.prepare || []).length ? `<h4>Chuẩn bị</h4><ul>${p.prepare.map((x) => `<li>${x}</li>`).join("")}</ul>` : ""}
      </div>
      ${(p.steps || []).map((st, k) => `<section class="pr-step"><div class="pr-num">${k + 1}</div><div class="pr-body"><h3>${st.title}</h3><div class="body gl-scope">${st.html || ""}</div>${st.code ? `<pre><code>${esc(st.code)}</code></pre>` : ""}${st.file ? `<div class="pr-file"><div class="pr-file-head"><code>${esc(st.file.replace(/^examples\//, ""))}</code><a href="${st.file}" download>Tải file</a></div><pre><code data-src="${st.file}">Đang tải code…</code></pre></div>` : ""}${st.after ? `<div class="body gl-scope">${st.after}</div>` : ""}</div></section>`).join("")}
      ${(p.verify || []).length ? `<div class="lvl-head"><h2>Tự kiểm tra kết quả</h2><p>Đánh dấu từng mục khi bạn đã thấy nó chạy đúng.</p></div>${checks(p.verify, 0)}` : ""}
      ${(p.groups || []).map((g, gi) => `<div class="lvl-head"><h2>${g.title}</h2>${g.sub ? `<p>${g.sub}</p>` : ""}</div>${checks(g.items, 100 * (gi + 1))}`).join("")}
      ${(p.deliver || []).length ? `<div class="lvl-head"><h2>Trước khi giao cho khách hàng</h2><p>Những việc nên làm khi đưa phần này vào hệ thống thật.</p></div>${checks(p.deliver, 50)}` : ""}
      ${(p.pitfalls || []).length ? `<div class="lvl-head"><h2>Lỗi hay gặp</h2></div><div class="body gl-scope"><ul>${p.pitfalls.map((x) => `<li>${x}</li>`).join("")}</ul></div>` : ""}
      ${(p.links || []).length ? `<p class="small muted" style="margin-top:24px">Ôn lại lý thuyết: ${p.links.map((sid) => { const s = findSection(sid); return s ? `<a href="#/section/${sid}">${sid} ${esc(s.title)}</a>` : ""; }).join(" · ")}</p>` : ""}
      <div class="pager"><a class="btn" href="#/practice">← Tất cả bài thực hành</a>${ch ? `<a class="btn" href="#/chapter/${ch.id}">Về chương ${ch.num} →</a>` : ""}</div>`;
    app.querySelectorAll("[data-ck]").forEach((c) => (c.onchange = () => { if (c.checked) state.check[c.dataset.ck] = 1; else delete state.check[c.dataset.ck]; save(); }));
    // Code mẫu lấy thẳng từ thư mục examples/ để trang và file tải về luôn giống nhau
    app.querySelectorAll("[data-src]").forEach((c) =>
      fetch(c.dataset.src)
        .then((r) => (r.ok ? r.text() : Promise.reject(r.status)))
        .then((t) => (c.textContent = t))
        .catch(() => (c.textContent = `Không tải được file. Xem ${c.dataset.src} trong repo trên GitHub.`))
    );
    glossify(app);
  }

  /* ── Router ── */
  function route() {
    clearInterval(timerId);
    if (spy) { window.removeEventListener("scroll", spy); spy = null; }
    hidePop(true);
    document.body.classList.remove("nav-open");
    const h = location.hash.replace(/^#/, "") || "/";
    const [, a, b] = h.split("/");
    renderSidebar(h);
    updateTopProgress();
    if (a === "chapter") renderChapter(b);
    else if (a === "section") renderSection(b);
    else if (a === "flashcards") renderFlash(b || "all");
    else if (a === "exam") renderExamStart(b);
    else if (a === "glossary") renderGlossary(b);
    else if (a === "practice") (b ? renderPractice(b) : renderPracticeIndex());
    else renderHome();
    if (!(a === "glossary" && b)) window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", route);
  route();
})();
