/* CCA-F Study Hub — router, trang, quiz, flashcard, thi thử, tiến độ */
(function () {
  const C = window.COURSE;
  const $ = (s, r = document) => r.querySelector(s);
  const app = $("#app");
  const LETTERS = "ABCD";
  const COLORS = { slate: "--c-slate", violet: "--c-violet", teal: "--c-teal", orange: "--c-orange", blue: "--c-blue", rose: "--c-rose" };
  const colorOf = (ch) => `var(${COLORS[ch.color]})`;

  /* ── Lưu trữ cục bộ (an toàn khi bị chặn) ── */
  const KEY = "ccaf-study-v1";
  let state = { done: {}, quiz: {}, exams: [], plan: {}, theme: null };
  try { state = Object.assign(state, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} };
  window.STUDY = { state, save };

  /* ── Chỉ mục ── */
  const allSections = [];
  C.chapters.forEach((ch) => ch.sections.forEach((s) => allSections.push({ ...s, chapter: ch })));
  const findSection = (id) => allSections.find((s) => s.id === id);
  const findChapter = (id) => C.chapters.find((c) => c.id === id);
  const examPool = [];
  C.chapters.filter((c) => c.weight > 0).forEach((ch) =>
    ch.sections.forEach((s) => (s.quiz || []).forEach((q, i) => examPool.push({ ...q, id: `${s.id}-q${i}`, chapter: ch, section: s })))
  );

  const pct = () => Math.round((Object.keys(state.done).filter((k) => state.done[k]).length / allSections.length) * 100);
  const chapterPct = (ch) => Math.round((ch.sections.filter((s) => state.done[s.id]).length / ch.sections.length) * 100);
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* ── Theme ── */
  function applyTheme() {
    if (state.theme) document.documentElement.setAttribute("data-theme", state.theme);
    else document.documentElement.removeAttribute("data-theme");
  }
  $("#themeBtn").onclick = () => {
    const dark = state.theme ? state.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    state.theme = dark ? "light" : "dark";
    save(); applyTheme();
  };
  applyTheme();
  $("#menuBtn").onclick = () => document.body.classList.toggle("nav-open");
  $("#overlay").onclick = () => document.body.classList.remove("nav-open");

  /* ── Sidebar ── */
  let filter = "";
  function renderSidebar(route) {
    const sb = $("#sidebar");
    const f = filter.trim().toLowerCase();
    const match = (s) => !f || (s.title + " " + s.body + " " + (s.keyPoints || []).join(" ")).toLowerCase().includes(f);
    let html = `<input class="search" id="searchBox" placeholder="🔍 Tìm kiếm mục..." value="${esc(filter)}">`;
    if (!f) {
      html += `<a class="nav-link ${route === "/" ? "active" : ""}" href="#/">🏠 Trang chủ</a>
      <a class="nav-link ${route.startsWith("/exam") ? "active" : ""}" href="#/exam">📝 Thi thử</a>
      <a class="nav-link ${route.startsWith("/flash") ? "active" : ""}" href="#/flashcards/all">🃏 Flashcard</a>
      <div class="nav-divider"></div>`;
    }
    C.chapters.forEach((ch) => {
      const secs = ch.sections.filter(match);
      if (!secs.length) return;
      html += `<div class="nav-chapter">
        <a class="nav-chapter-head" href="#/chapter/${ch.id}"><span class="chip-num" style="background:${colorOf(ch)}">${ch.num}</span>${esc(ch.short)}<span class="w">${ch.weight ? ch.weight + "%" : ""}</span></a>
        <div class="nav-sections">${secs
          .map((s) => `<a class="nav-link ${route === "/section/" + s.id ? "active" : ""}" href="#/section/${s.id}"><span class="dot ${state.done[s.id] ? "done" : ""}"></span>${s.id} ${esc(s.title)}</a>`)
          .join("")}</div></div>`;
    });
    if (f && !allSections.some(match)) html += `<p class="muted small" style="padding:8px">Không tìm thấy mục phù hợp.</p>`;
    sb.innerHTML = html;
    const box = $("#searchBox");
    box.oninput = (e) => { filter = e.target.value; renderSidebar(route); const b = $("#searchBox"); b.focus(); b.setSelectionRange(b.value.length, b.value.length); };
  }

  function updateTopProgress() {
    const p = pct();
    $("#topBar").style.width = p + "%";
    $("#topPct").textContent = p + "%";
  }

  /* ── Trang chủ ── */
  function renderHome() {
    const e = C.exam;
    const best = state.exams.length ? Math.max(...state.exams.map((x) => x.score)) : null;
    app.innerHTML = `
      <section class="hero">
        <span class="tag">Tài liệu ôn tập độc lập</span>
        <h1>Claude Certified Architect – Foundations</h1>
        <p class="muted" style="margin:0">Học theo từng chương và từng mục, với mô phỏng tương tác, quiz có giải thích, flashcard và đề thi thử theo trọng số.</p>
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
      <h2>Các chương</h2>
      <div class="grid grid-2">${C.chapters
        .map(
          (ch) => `<a class="card chapter-card" style="--cc:${colorOf(ch)}" href="#/chapter/${ch.id}">
          <div style="display:flex;align-items:center;gap:8px"><span class="chip-num" style="background:${colorOf(ch)}">${ch.num}</span><span class="tag">${ch.weight ? "Trọng số " + ch.weight + "%" : "Nhập môn"}</span></div>
          <h3>${esc(ch.title)}</h3>
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
      if (!confirm("Xóa toàn bộ tiến độ học, quiz và lịch sử thi thử?")) return;
      state.done = {}; state.quiz = {}; state.exams = []; state.plan = {};
      save(); route();
    };
  }
  function nextUnread() { return allSections.find((s) => !state.done[s.id]) || allSections[0]; }

  /* ── Trang chương ── */
  function renderChapter(id) {
    const ch = findChapter(id);
    if (!ch) return renderHome();
    app.innerHTML = `
      <div class="breadcrumb"><a href="#/">Trang chủ</a> / Chương ${ch.num}</div>
      <div class="section-head"><span class="chip-num" style="background:${colorOf(ch)};width:34px;height:34px;font-size:16px">${ch.num}</span><h1 style="margin:0">${esc(ch.title)}</h1></div>
      <p class="muted">${esc(ch.summary)} ${ch.weight ? `<span class="tag">~${Math.round((C.exam.questions * ch.weight) / 100)} câu trong đề</span>` : ""}</p>
      <div class="btn-row" style="margin:14px 0 22px">
        <a class="btn primary" href="#/section/${(ch.sections.find((s) => !state.done[s.id]) || ch.sections[0]).id}">Học chương này →</a>
        <a class="btn" href="#/flashcards/${ch.id}">🃏 Flashcard chương</a>
        ${ch.weight ? `<a class="btn" href="#/exam/${ch.id}">📝 Quiz cả chương</a>` : ""}
      </div>
      <div class="grid">${ch.sections
        .map(
          (s) => `<a class="card" style="display:flex;gap:14px;align-items:center;color:var(--text)" href="#/section/${s.id}">
          <span class="dot ${state.done[s.id] ? "done" : ""}" style="width:14px;height:14px"></span>
          <div style="flex:1"><div style="font-weight:700">${s.id} · ${esc(s.title)}</div><div class="small muted">${(s.keyPoints || [])[0] || ""}</div></div>
          <span class="tag">${(s.quiz || []).length} câu hỏi</span></a>`
        )
        .join("")}</div>`;
  }

  /* ── Quiz ── */
  function quizHTML(questions, prefix) {
    return questions
      .map((q, i) => {
        const qid = `${prefix}-q${i}`;
        return `<div class="quiz-q" data-qid="${qid}" data-answer="${q.answer}">
          <div class="q">${i + 1}. ${esc(q.q)}</div>
          ${q.options.map((o, j) => `<button class="opt" data-j="${j}"><span class="letter">${LETTERS[j]}</span>${esc(o)}</button>`).join("")}
          <div class="explain" hidden><b></b> ${esc(q.explain)}</div></div>`;
      })
      .join("");
  }
  function bindQuiz(root) {
    root.querySelectorAll(".quiz-q").forEach((box) => {
      const qid = box.dataset.qid, ans = +box.dataset.answer;
      const show = (j) => {
        box.querySelectorAll(".opt").forEach((b, k) => {
          b.disabled = true;
          if (k === ans) b.classList.add("correct");
          else if (k === j) b.classList.add("wrong");
        });
        const ex = box.querySelector(".explain");
        ex.hidden = false;
        ex.querySelector("b").textContent = j === ans ? "✅ Chính xác." : `❌ Chưa đúng — đáp án ${LETTERS[ans]}.`;
      };
      if (state.quiz[qid] !== undefined) show(state.quiz[qid]);
      box.querySelectorAll(".opt").forEach((b) => (b.onclick = () => { const j = +b.dataset.j; state.quiz[qid] = j; save(); show(j); }));
    });
  }

  /* ── Trang mục ── */
  function renderSection(id) {
    const s = findSection(id);
    if (!s) return renderHome();
    const ch = s.chapter;
    const idx = allSections.indexOf(s);
    const prev = allSections[idx - 1], next = allSections[idx + 1];
    const widget = window.WIDGETS && window.WIDGETS[s.widget];
    app.innerHTML = `
      <div class="breadcrumb"><a href="#/">Trang chủ</a> / <a href="#/chapter/${ch.id}">Chương ${ch.num}: ${esc(ch.short)}</a> / Mục ${s.id}</div>
      <div class="section-head"><span class="chip-num" style="background:${colorOf(ch)}">${ch.num}</span><span class="tag">Mục ${s.id}</span></div>
      <h1>${esc(s.title)}</h1>
      <div class="body">${s.body}</div>
      ${widget ? `<div class="widget"><div class="widget-head">🧪 ${esc(widget.title)}</div><div class="widget-body" id="widgetMount"></div></div>` : ""}
      <div class="keypoints"><h4>📌 Ghi nhớ</h4><ul>${(s.keyPoints || []).map((k) => `<li>${esc(k)}</li>`).join("")}</ul></div>
      ${s.tip ? `<div class="tip"><b>💡 Mẹo thi:</b> ${esc(s.tip)}</div>` : ""}
      ${(s.quiz || []).length ? `<h2>✍️ Kiểm tra nhanh</h2><div id="quiz">${quizHTML(s.quiz, s.id)}</div>` : ""}
      <div style="margin-top:20px"><button class="btn ${state.done[s.id] ? "ok" : "primary"}" id="doneBtn">${state.done[s.id] ? "✓ Đã hoàn thành" : "Đánh dấu hoàn thành"}</button></div>
      <div class="pager">
        ${prev ? `<a class="btn" href="#/section/${prev.id}">← ${prev.id} ${esc(prev.title)}</a>` : "<span></span>"}
        ${next ? `<a class="btn" href="#/section/${next.id}">${next.id} ${esc(next.title)} →</a>` : `<a class="btn primary" href="#/exam">Đi thi thử →</a>`}
      </div>`;
    if (widget) {
      try { widget.render($("#widgetMount")); } catch (e) { $("#widgetMount").textContent = "Không tải được mô phỏng."; console.error(e); }
    }
    const qz = $("#quiz");
    if (qz) bindQuiz(qz);
    $("#doneBtn").onclick = () => {
      state.done[s.id] = !state.done[s.id];
      save();
      if (state.done[s.id] && next) location.hash = "#/section/" + next.id;
      else route();
    };
  }

  /* ── Flashcard ── */
  function renderFlash(id) {
    const cards = [];
    C.chapters.forEach((ch) => { if (id === "all" || ch.id === id) (ch.flashcards || []).forEach((f) => cards.push({ ...f, ch })); });
    let order = cards.map((_, i) => i), i = 0;
    const draw = () => {
      const c = cards[order[i]];
      app.innerHTML = `
        <div class="breadcrumb"><a href="#/">Trang chủ</a> / Flashcard</div>
        <h1>🃏 Flashcard</h1>
        <div class="btn-row"><select id="deck"><option value="all">Tất cả chương (${C.chapters.reduce((n, c) => n + (c.flashcards || []).length, 0)} thẻ)</option>${C.chapters
          .map((ch) => `<option value="${ch.id}" ${ch.id === id ? "selected" : ""}>Chương ${ch.num}: ${esc(ch.short)}</option>`)
          .join("")}</select><button class="btn" id="shuffle">🔀 Trộn thẻ</button></div>
        <div class="flash-wrap">
          <div class="flash" id="card"><div class="face front"><small>Chương ${c.ch.num} · bấm để lật</small>${esc(c.front)}</div><div class="face back"><small>Đáp án</small>${esc(c.back)}</div></div>
        </div>
        <div class="btn-row" style="justify-content:center"><button class="btn" id="prev">← Trước</button><span class="tag" style="align-self:center">${i + 1} / ${cards.length}</span><button class="btn primary" id="next">Tiếp →</button></div>
        <p class="small muted" style="text-align:center">Phím tắt: Space để lật · ← → để chuyển thẻ</p>`;
      $("#card").onclick = () => $("#card").classList.toggle("flipped");
      $("#prev").onclick = () => { i = (i - 1 + cards.length) % cards.length; draw(); };
      $("#next").onclick = () => { i = (i + 1) % cards.length; draw(); };
      $("#shuffle").onclick = () => { order.sort(() => Math.random() - 0.5); i = 0; draw(); };
      $("#deck").onchange = (e) => (location.hash = "#/flashcards/" + e.target.value);
    };
    document.onkeydown = (e) => {
      if (!location.hash.startsWith("#/flashcards")) return;
      if (e.key === " ") { e.preventDefault(); $("#card")?.classList.toggle("flipped"); }
      if (e.key === "ArrowRight") $("#next")?.click();
      if (e.key === "ArrowLeft") $("#prev")?.click();
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
    app.innerHTML = `
      <div class="breadcrumb"><a href="#/">Trang chủ</a> / Thi thử</div>
      <h1>📝 ${ch ? "Quiz chương " + ch.num + ": " + esc(ch.short) : "Thi thử CCA-F"}</h1>
      <p class="muted">Câu hỏi được chọn theo trọng số lĩnh vực, có đồng hồ đếm ngược (2 phút/câu như đề thật). Điểm quy đổi về thang ${C.exam.maxScore}, đạt từ ${C.exam.passScore}.</p>
      <div class="grid grid-3">
        ${ch
          ? `<div class="card"><h3 style="margin-top:0">Toàn bộ chương</h3><p class="muted small">${examPool.filter((q) => q.chapter === ch).length} câu của chương ${ch.num}.</p><button class="btn primary" data-mode="chapter">Bắt đầu</button></div>`
          : `<div class="card"><h3 style="margin-top:0">Nhanh</h3><p class="muted small">20 câu · 40 phút</p><button class="btn primary" data-mode="20">Bắt đầu</button></div>
             <div class="card"><h3 style="margin-top:0">Đầy đủ</h3><p class="muted small">Toàn bộ ${examPool.length} câu trong ngân hàng · ${examPool.length * 2} phút</p><button class="btn primary" data-mode="all">Bắt đầu</button></div>
             <div class="card"><h3 style="margin-top:0">Ôn câu sai</h3><p class="muted small">${examPool.filter((q) => state.quiz[q.id] !== undefined && state.quiz[q.id] !== q.answer).length} câu bạn từng trả lời sai trong các mục.</p><button class="btn" data-mode="wrong">Bắt đầu</button></div>`}
      </div>`;
    app.querySelectorAll("[data-mode]").forEach((b) => (b.onclick = () => {
      const m = b.dataset.mode;
      let qs;
      if (m === "chapter") qs = shuffle(examPool.filter((q) => q.chapter === ch));
      else if (m === "all") qs = shuffle(examPool.slice());
      else if (m === "wrong") qs = shuffle(examPool.filter((q) => state.quiz[q.id] !== undefined && state.quiz[q.id] !== q.answer));
      else qs = pickWeighted(+m);
      if (!qs.length) return alert("Chưa có câu nào trong nhóm này. Hãy làm quiz trong các mục trước.");
      runExam(qs, m === "chapter" || m === "wrong");
    }));
  }
  function runExam(qs, practice) {
    const answers = new Array(qs.length).fill(null);
    let cur = 0, finished = false;
    let remain = qs.length * 120;
    const draw = () => {
      const q = qs[cur];
      app.innerHTML = `
        <div class="exam-top"><b>Câu ${cur + 1}/${qs.length}</b><span class="tag" style="background:${colorOf(q.chapter)};color:#fff">${esc(q.chapter.short)}</span><div class="spacer" style="flex:1"></div>
          ${finished ? "" : `<span class="timer" id="timer"></span><button class="btn primary" id="submit">Nộp bài</button>`}</div>
        <div class="qnav">${qs.map((qq, k) => {
          let cls = k === cur ? "current " : "";
          if (finished) cls += answers[k] === qq.answer ? "correct" : "wrong";
          else if (answers[k] !== null) cls += "answered";
          return `<button class="${cls}" data-k="${k}">${k + 1}</button>`;
        }).join("")}</div>
        <div class="card"><div class="quiz-q"><div class="q">${esc(q.q)}</div>
          ${q.options.map((o, j) => {
            let cls = "";
            if (finished) cls = j === q.answer ? "correct" : j === answers[cur] ? "wrong" : "";
            else if (answers[cur] === j) cls = "selected";
            return `<button class="opt ${cls}" data-j="${j}" ${finished ? "disabled" : ""}><span class="letter">${LETTERS[j]}</span>${esc(o)}</button>`;
          }).join("")}
          ${finished ? `<div class="explain"><b>${answers[cur] === q.answer ? "✅ Đúng." : "❌ Sai — đáp án " + LETTERS[q.answer] + "."}</b> ${esc(q.explain)} <a href="#/section/${q.section.id}">Xem lại mục ${q.section.id} →</a></div>` : ""}
        </div></div>
        <div class="pager"><button class="btn" id="prevQ" ${cur === 0 ? "disabled" : ""}>← Câu trước</button>
          ${finished ? `<button class="btn" id="back">Xem kết quả</button>` : ""}
          <button class="btn primary" id="nextQ" ${cur === qs.length - 1 ? "disabled" : ""}>Câu sau →</button></div>`;
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
      if (!practice) { state.exams.push({ date: Date.now(), total: qs.length, correct, score }); save(); }
      result();
    };
    const result = () => {
      const correct = qs.filter((q, k) => answers[k] === q.answer).length;
      const score = Math.round(100 + (900 * correct) / qs.length);
      const pass = score >= C.exam.passScore;
      const doms = C.chapters.filter((c) => qs.some((q) => q.chapter === c));
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
          return `<div style="margin:10px 0"><div style="display:flex;justify-content:space-between;font-size:14px"><a href="#/chapter/${ch.id}"><b>${ch.num}. ${esc(ch.title)}</b></a><span>${ok}/${qd.length} · ${p}%</span></div><div class="bar"><span style="width:${p}%;background:${p >= 72 ? "var(--ok)" : colorOf(ch)}"></span></div></div>`;
        }).join("")}</div>
        <div class="btn-row" style="margin-top:18px"><button class="btn primary" id="review">Xem lại từng câu</button><a class="btn" href="#/exam">Làm đề khác</a></div>`;
      $("#review").onclick = () => { cur = 0; draw(); };
    };
    draw();
  }

  /* ── Router ── */
  function route() {
    clearInterval(timerId);
    document.body.classList.remove("nav-open");
    const h = location.hash.replace(/^#/, "") || "/";
    const [, a, b] = h.split("/");
    renderSidebar(h);
    updateTopProgress();
    if (a === "chapter") renderChapter(b);
    else if (a === "section") renderSection(b);
    else if (a === "flashcards") renderFlash(b || "all");
    else if (a === "exam") renderExamStart(b);
    else renderHome();
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", route);
  route();
})();
