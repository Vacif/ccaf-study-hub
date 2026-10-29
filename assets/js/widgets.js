/* Mô phỏng tương tác cho từng mục. Mỗi widget: { title, render(el) }.
   Các mô phỏng luồng dữ liệu chi tiết nằm ở assets/js/sim/*.js. */
(function () {
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const json = (o) => `<pre><code>${esc(JSON.stringify(o, null, 2))}</code></pre>`;
  const W = {};

  /* ── Bộ dựng dùng chung ── */

  // Trò chơi phân loại: mỗi tình huống chọn một nhóm đúng
  function sorter(intro, buckets, items) {
    return (el) => {
      let i = 0, score = 0;
      const order = items.slice().sort(() => Math.random() - 0.5);
      const draw = (fb) => {
        if (i >= order.length) {
          el.innerHTML = `<p><b>Hoàn thành!</b> Bạn đúng <span class="score-pill">${score}/${order.length}</span> tình huống.</p><button class="btn primary">Chơi lại</button>`;
          el.querySelector("button").onclick = () => { i = 0; score = 0; order.sort(() => Math.random() - 0.5); draw(); };
          return;
        }
        const it = order[i];
        el.innerHTML = `<p class="small muted" style="margin-top:0">${intro} <span class="score-pill">Điểm: ${score}/${order.length}</span> · Tình huống ${i + 1}/${order.length}</p>
          <div class="sorter-item">${esc(it.text)}</div>
          <div class="sorter-buckets">${buckets.map((b, k) => `<button class="btn" data-k="${k}" ${fb ? "disabled" : ""}>${esc(b)}</button>`).join("")}</div>
          ${fb ? `<div class="feedback ${fb.ok ? "ok" : "bad"}"><b>${fb.ok ? "✅ Đúng" : "❌ Chưa đúng — đáp án: " + esc(buckets[it.a])}.</b> ${esc(it.why)}</div><div style="margin-top:10px"><button class="btn primary" id="nx">Tiếp →</button></div>` : ""}`;
        el.querySelectorAll("[data-k]").forEach((b) => (b.onclick = () => { const ok = +b.dataset.k === it.a; if (ok) score++; draw({ ok }); }));
        const nx = el.querySelector("#nx");
        if (nx) nx.onclick = () => { i++; draw(); };
      };
      draw();
    };
  }

  // So sánh các phương án qua tab
  function compare(tabs) {
    return (el) => {
      let cur = 0;
      const draw = () => {
        const t = tabs[cur];
        el.innerHTML = `<div class="compare-tabs">${tabs.map((x, k) => `<button class="${k === cur ? "on" : ""}" data-k="${k}">${esc(x.label)}</button>`).join("")}</div>
          <div>${t.html}</div>
          ${t.verdict ? `<div class="verdict ${t.verdict}">${t.verdict === "good" ? "✓ " : "✗ "}${esc(t.note)}</div>` : ""}`;
        el.querySelectorAll("[data-k]").forEach((b) => (b.onclick = () => { cur = +b.dataset.k; draw(); }));
      };
      draw();
    };
  }

  // Mô phỏng từng bước: mỗi bước thêm một thông điệp và sáng các nút trong sơ đồ
  function stepper(steps, nodes) {
    return (el) => {
      let n = 0, timer = null;
      const draw = () => {
        const last = steps[n - 1];
        el.innerHTML = `${nodes ? `<div class="flow">${nodes.map((x, k) => `${k ? '<span class="arrow">→</span>' : ""}<span class="node ${last && (last.on || []).includes(k) ? (last.state || "on") : ""}">${esc(x)}</span>`).join("")}</div>` : ""}
          <div class="stepper-log">${steps.slice(0, n).map((s) => `<div class="msg ${s.role}"><span class="who">${esc(s.who || s.role)}</span>${s.html || esc(s.text)}</div>`).join("") || '<p class="muted small">Bấm “Bước tiếp” để bắt đầu mô phỏng.</p>'}</div>
          <div class="btn-row" style="margin-top:12px">
            <button class="btn primary" id="st-next" ${n >= steps.length ? "disabled" : ""}>Bước tiếp ▶</button>
            <button class="btn" id="st-auto" ${n >= steps.length ? "disabled" : ""}>${timer ? "⏸ Dừng" : "⏩ Tự chạy"}</button>
            <button class="btn" id="st-reset">↺ Làm lại</button>
            <span class="tag" style="align-self:center">${n}/${steps.length}</span></div>`;
        el.querySelector("#st-next").onclick = () => { n++; draw(); };
        el.querySelector("#st-reset").onclick = () => { clearInterval(timer); timer = null; n = 0; draw(); };
        el.querySelector("#st-auto").onclick = () => {
          if (timer) { clearInterval(timer); timer = null; return draw(); }
          timer = setInterval(() => { if (!el.isConnected || n >= steps.length) { clearInterval(timer); timer = null; } else n++; if (el.isConnected) draw(); }, 1100);
          draw();
        };
      };
      draw();
    };
  }

  /* ── Chương 0 ── */
  W.examOverview = {
    title: "Phân bổ 60 câu theo lĩnh vực",
    render(el) {
      const ds = window.COURSE.chapters.filter((c) => c.weight);
      const COLORS = { violet: "--c-violet", teal: "--c-teal", orange: "--c-orange", blue: "--c-blue", rose: "--c-rose" };
      el.innerHTML = ds.map((d) => `<div style="margin:10px 0;cursor:pointer" data-id="${d.id}">
          <div style="display:flex;justify-content:space-between;font-size:14px"><b>${d.num}. ${esc(d.title)}</b><span>${d.weight}% · ~${Math.round((60 * d.weight) / 100)} câu</span></div>
          <div class="bar" style="height:14px"><span style="width:0;background:var(${COLORS[d.color]})" data-w="${(d.weight / 27) * 100}"></span></div></div>`).join("") +
        `<p class="small muted">Bấm vào một lĩnh vực để mở chương tương ứng.</p>`;
      requestAnimationFrame(() => el.querySelectorAll("[data-w]").forEach((s) => (s.style.width = s.dataset.w + "%")));
      el.querySelectorAll("[data-id]").forEach((r) => (r.onclick = () => (location.hash = "#/chapter/" + r.dataset.id)));
    },
  };

  W.studyPlan = {
    title: "Lộ trình ôn 4 tuần (bấm để đánh dấu)",
    render(el) {
      const S = window.STUDY;
      const weeks = [
        ["Tuần 1", "Chương 1 — Agentic Architecture (27%): vòng lặp agent, coordinator–subagent, hook. Tự viết một agent loop nhỏ."],
        ["Tuần 2", "Chương 3 — Claude Code (20%) + Chương 2 — Tool & MCP (18%): CLAUDE.md, rules, .mcp.json, lỗi có cấu trúc."],
        ["Tuần 3", "Chương 4 — Prompt & Structured Output (20%): few-shot, JSON schema, Batch API, review nhiều lượt."],
        ["Tuần 4", "Chương 5 — Context & Reliability (15%) + 2–3 đề thi thử, ôn lại câu sai và flashcard."],
      ];
      const draw = () => {
        el.innerHTML = weeks.map(([w, t], k) => `<label class="toggle" style="display:flex;align-items:flex-start;margin:8px 0"><input type="checkbox" data-k="${k}" ${S.state.plan[k] ? "checked" : ""}><span><b>${w}:</b> ${esc(t)}</span></label>`).join("") +
          `<div class="bar" style="margin-top:10px"><span style="width:${(weeks.filter((_, k) => S.state.plan[k]).length / weeks.length) * 100}%"></span></div>`;
        el.querySelectorAll("input").forEach((c) => (c.onchange = () => { S.state.plan[c.dataset.k] = c.checked; S.save(); draw(); }));
      };
      draw();
    },
  };

  /* ── Chương 1 ── */
  W.hubSpoke = {
    title: "Sơ đồ coordinator – subagent (bấm vào subagent)",
    render(el) {
      const subs = [
        { name: "Tìm kiếm web", x: 90, y: 60, need: "Chủ đề + các mảng cần bao phủ" },
        { name: "Phân tích tài liệu", x: 470, y: 60, need: "Danh sách nguồn từ subagent tìm kiếm" },
        { name: "Kiểm chứng", x: 90, y: 230, need: "Các claim cần xác minh + nguồn" },
        { name: "Tổng hợp", x: 470, y: 230, need: "Phát hiện đã phân tích + metadata nguồn" },
      ];
      let sel = 1, pass = true;
      const draw = () => {
        const s = subs[sel];
        el.innerHTML = `<label class="toggle"><input type="checkbox" id="pass" ${pass ? "checked" : ""}> Coordinator truyền ngữ cảnh tường minh vào prompt subagent</label>
        <svg viewBox="0 0 600 300" style="width:100%;max-height:300px">
          ${subs.map((x, k) => `<line x1="300" y1="150" x2="${x.x + 40}" y2="${x.y + 20}" stroke="${k === sel ? "var(--accent)" : "var(--border)"}" stroke-width="${k === sel ? 3 : 2}" ${k === sel ? 'stroke-dasharray="6 4"' : ""}>${k === sel ? '<animate attributeName="stroke-dashoffset" from="20" to="0" dur=".8s" repeatCount="indefinite"/>' : ""}</line>`).join("")}
          <rect x="220" y="120" width="160" height="60" rx="12" fill="var(--accent)"/><text x="300" y="146" text-anchor="middle" style="fill:#fff;font-weight:700;font-size:15px">Coordinator</text><text x="300" y="165" text-anchor="middle" style="fill:#fff;font-size:11px">phân rã · ủy thác · tổng hợp</text>
          ${subs.map((x, k) => `<g data-k="${k}" style="cursor:pointer"><rect x="${x.x - 50}" y="${x.y}" width="180" height="44" rx="10" fill="${k === sel ? "var(--accent-soft)" : "var(--surface-2)"}" stroke="${k === sel ? "var(--accent)" : "var(--border)"}" stroke-width="2"/><text x="${x.x + 40}" y="${x.y + 27}" text-anchor="middle" style="font-size:13px;font-weight:600">${x.name}</text></g>`).join("")}
        </svg>
        <div class="msg ${pass ? "tool" : "err"}"><span class="who">Ngữ cảnh mà “${s.name}” nhìn thấy</span>
          ${pass ? `✓ Prompt chứa: <b>${s.need}</b>, mục tiêu và tiêu chí chất lượng.` : `✗ Chỉ có câu lệnh ngắn “Hãy làm phần việc của bạn”. Subagent <b>không</b> thấy lịch sử của coordinator nên thiếu: ${s.need}.`}</div>`;
        el.querySelector("#pass").onchange = (e) => { pass = e.target.checked; draw(); };
        el.querySelectorAll("g[data-k]").forEach((g) => (g.onclick = () => { sel = +g.dataset.k; draw(); }));
      };
      draw();
    },
  };

  W.contextPassing = {
    title: "So sánh prompt gửi cho subagent",
    render: compare([
      { label: "Prompt thiếu", verdict: "bad", note: "Subagent không biết nguồn nào, tiêu chí gì", html: `<pre><code>Task(agent="analyzer",
  prompt="Phân tích các nguồn đã tìm được.")</code></pre>` },
      { label: "Prompt tự đầy đủ", verdict: "good", note: "Có dữ liệu, metadata nguồn, mục tiêu, tiêu chí", html: `<pre><code>Task(agent="analyzer", prompt="""
Mục tiêu: đánh giá tác động của AI tới ngành âm nhạc.
Nguồn (giữ nguyên metadata khi trích dẫn):
- {url: "...report-2025", title: "...", date: "2025-03"}
  trích đoạn: "..."
- {url: "...survey", title: "...", date: "2024-11"}
Tiêu chí: mỗi phát hiện kèm nguồn; nêu rõ chỗ mâu thuẫn.
""")</code></pre>` },
      { label: "Song song", verdict: "good", note: "Nhiều Task call trong một response = chạy song song", html: `<pre><code>// Một response của coordinator:
tool_use Task(agent="search", prompt="...âm nhạc...")
tool_use Task(agent="search", prompt="...văn học...")
tool_use Task(agent="search", prompt="...điện ảnh...")
// → 3 subagent chạy đồng thời, không cần 3 lượt</code></pre>` },
    ]),
  };

  W.enforcement = {
    title: "Prompt vs cổng kiểm tra bằng code (mô phỏng minh họa)",
    render(el) {
      let rate = 3;
      const run = () => {
        const N = 200;
        const pr = Array.from({ length: N }, () => Math.random() * 100 < rate);
        const grid = (fails) => `<div style="display:grid;grid-template-columns:repeat(25,1fr);gap:3px;margin:8px 0">${fails.map((f) => `<span style="aspect-ratio:1;border-radius:3px;background:${f ? "var(--bad)" : "var(--ok)"}"></span>`).join("")}</div>`;
        el.querySelector("#out").innerHTML = `<div class="grid grid-2">
          <div><b>Chỉ dặn trong prompt</b>${grid(pr)}<span class="small">${pr.filter(Boolean).length} / ${N} phiên hoàn tiền <b>trước</b> khi xác minh</span></div>
          <div><b>Cổng kiểm tra bằng code</b>${grid(new Array(N).fill(false))}<span class="small">0 / ${N} — process_refund bị chặn cho tới khi có ID đã xác minh</span></div></div>`;
      };
      el.innerHTML = `<p class="small muted" style="margin-top:0">Mỗi ô là một phiên hội thoại. Đỏ = vi phạm quy trình. Tỷ lệ chỉ để minh họa — điểm mấu chốt là prompt cho xác suất, code cho đảm bảo.</p>
        <label class="small">Tỷ lệ model bỏ qua chỉ dẫn: <b id="rv">${rate}%</b></label><input type="range" min="0" max="15" value="${rate}" id="rate">
        <div class="btn-row"><button class="btn primary" id="go">▶ Chạy 200 phiên</button></div><div id="out"></div>
        <pre><code>def process_refund(order_id, amount, session):
    if not session.verified_customer_id:      # cổng kiểm tra
        return {"isError": True, "errorCategory": "permission",
                "message": "Cần xác minh danh tính trước"}
    ...</code></pre>`;
      el.querySelector("#rate").oninput = (e) => { rate = +e.target.value; el.querySelector("#rv").textContent = rate + "%"; };
      el.querySelector("#go").onclick = run;
      run();
    },
  };

  W.decomposition = {
    title: "Phân loại: chuỗi cố định hay phân rã động?",
    render: sorter("Chọn chiến lược phân rã phù hợp.", ["Prompt chaining (cố định)", "Phân rã động (adaptive)"], [
      { text: "Review mỗi PR theo đúng 3 bước: bảo mật → hiệu năng → style.", a: 0, why: "Các bước đã biết trước và ổn định." },
      { text: "Thêm test cho một codebase cũ chưa có tài liệu.", a: 1, why: "Cần lập bản đồ cấu trúc trước rồi ưu tiên vùng rủi ro — tác vụ con phụ thuộc vào phát hiện." },
      { text: "Trích xuất hóa đơn: OCR → trích trường → kiểm tra tổng.", a: 0, why: "Pipeline tuần tự, cố định." },
      { text: "Điều tra nguyên nhân lỗi production hiếm gặp.", a: 1, why: "Hướng điều tra thay đổi theo những gì tìm được ở mỗi bước." },
      { text: "Nghiên cứu mở về một chủ đề mới, chưa rõ các mảng con.", a: 1, why: "Phạm vi được khám phá dần." },
    ]),
  };

  /* ── Chương 2 ── */
  W.toolDescription = {
    title: "So sánh mô tả công cụ",
    render: compare([
      { label: "Tối giản", verdict: "bad", note: "Hai công cụ khó phân biệt → chọn nhầm", html: json([{ name: "get_customer", description: "Lấy thông tin khách hàng" }, { name: "lookup_order", description: "Lấy thông tin đơn" }]) + `<div class="msg err"><span class="who">Truy vấn: “Đơn của tôi đang ở đâu?”</span>Claude gọi get_customer ✗</div>` },
      { label: "Rõ ràng", verdict: "good", note: "Có đầu vào, ví dụ, ranh giới", html: json([
        { name: "get_customer", description: "Tra hồ sơ khách hàng (tên, email, hạng thành viên) bằng email hoặc customer_id. Dùng để XÁC MINH DANH TÍNH. Không trả thông tin đơn hàng — dùng lookup_order cho trạng thái/vận chuyển." },
        { name: "lookup_order", description: "Tra một đơn hàng bằng order_id (dạng #1234): trạng thái, vận chuyển, số tiền. Dùng cho câu hỏi 'đơn ở đâu', 'đã giao chưa'. Ví dụ: lookup_order({order_id:'1234'})." },
      ]) + `<div class="msg tool"><span class="who">Truy vấn: “Đơn của tôi đang ở đâu?”</span>Claude gọi lookup_order ✓</div>` },
    ]),
  };

  W.mcpConfig = {
    title: "Project scope vs User scope",
    render: compare([
      { label: ".mcp.json (project)", verdict: "good", note: "Commit vào git — cả team dùng chung", html: `<p class="small"><b>Vị trí:</b> gốc repo · <b>Chia sẻ:</b> có (version control)</p><pre><code>{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_TOKEN": "\${GITHUB_TOKEN}" }
    }
  }
}</code></pre><p class="small muted">Token đọc từ biến môi trường của từng developer — không nằm trong repo.</p>` },
      { label: "~/.claude.json (user)", verdict: "good", note: "Cá nhân / thử nghiệm", html: `<p class="small"><b>Vị trí:</b> thư mục home · <b>Chia sẻ:</b> không</p><p>Phù hợp để thử một MCP server mới trước khi đề xuất cho team, hoặc công cụ chỉ bạn dùng.</p>` },
      { label: "Hardcode token", verdict: "bad", note: "Lộ secret trong lịch sử git", html: `<pre><code>"env": { "GITHUB_TOKEN": "ghp_xxxxxxxxxxxx" }</code></pre>` },
    ]),
  };

  W.builtinTools = {
    title: "Chọn công cụ tích hợp sẵn phù hợp",
    render: sorter("Chọn công cụ đúng cho mỗi nhu cầu.", ["Grep", "Glob", "Edit", "Read + Write"], [
      { text: "Tìm mọi file *.test.tsx trong repo.", a: 1, why: "Tìm theo mẫu tên/đường dẫn → Glob." },
      { text: "Tìm mọi nơi gọi hàm processPayment().", a: 0, why: "Tìm theo nội dung → Grep." },
      { text: "Đổi một dòng cấu hình có chuỗi duy nhất 'timeout: 30'.", a: 2, why: "Sửa có mục tiêu với neo duy nhất → Edit." },
      { text: "Sửa đoạn code mà chuỗi neo xuất hiện 4 lần trong file.", a: 3, why: "Neo không duy nhất → Edit thất bại, dùng Read + Write." },
      { text: "Tìm nơi thông báo lỗi 'Invalid token' được sinh ra.", a: 0, why: "Tìm nội dung chuỗi → Grep." },
      { text: "Liệt kê mọi file cấu hình **/config/*.yaml.", a: 1, why: "Mẫu đường dẫn → Glob." },
    ]),
  };

  /* ── Chương 3 ── */
  W.claudeMdTree = {
    title: "Khám phá cấu trúc cấu hình Claude Code",
    render(el) {
      const files = [
        { p: "~/.claude/CLAUDE.md", ind: "", scope: "User", shared: false, when: "Luôn nạp, mọi project trên máy bạn." },
        { p: "~/.claude/commands/notes.md", ind: "", scope: "User", shared: false, when: "Slash command /notes cá nhân." },
        { p: "repo/", ind: "", dir: true },
        { p: "CLAUDE.md", ind: "  ", scope: "Project", shared: true, when: "Luôn nạp khi làm việc trong repo.", full: "repo/CLAUDE.md" },
        { p: ".mcp.json", ind: "  ", scope: "Project", shared: true, when: "MCP server dùng chung của team.", full: "repo/.mcp.json" },
        { p: ".claude/rules/testing.md", ind: "  ", scope: "Project · paths: **/*.test.ts", shared: true, when: "Chỉ nạp khi chỉnh file khớp **/*.test.ts.", glob: /\.test\.ts$/, full: "repo/.claude/rules/testing.md" },
        { p: ".claude/commands/review.md", ind: "  ", scope: "Project", shared: true, when: "Slash command /review cho cả team.", full: "repo/.claude/commands/review.md" },
        { p: ".claude/skills/audit/SKILL.md", ind: "  ", scope: "Project · context: fork", shared: true, when: "Gọi theo yêu cầu, chạy trong subagent riêng.", full: "repo/.claude/skills/audit/SKILL.md" },
        { p: "packages/api/CLAUDE.md", ind: "  ", scope: "Thư mục con", shared: true, when: "Nạp khi làm việc trong packages/api/.", dirMatch: "packages/api/", full: "repo/packages/api/CLAUDE.md" },
      ];
      const targets = ["packages/web/src/App.tsx", "packages/api/src/user.ts", "packages/api/src/user.test.ts", "scripts/build.ts"];
      let sel = 0, target = targets[0];
      const loaded = (f) => f.p === "~/.claude/CLAUDE.md" || f.p === "CLAUDE.md" || (f.glob && f.glob.test(target)) || (f.dirMatch && target.startsWith(f.dirMatch));
      const draw = () => {
        const f = files[sel];
        el.innerHTML = `<label class="small">Giả sử Claude đang chỉnh file: <select id="tg">${targets.map((t) => `<option ${t === target ? "selected" : ""}>${t}</option>`).join("")}</select></label>
          <div class="grid grid-2" style="margin-top:12px"><div class="tree">${files.map((x, k) => `<div class="tree-row ${k === sel ? "on" : ""} ${x.dir ? "dim" : ""}" data-k="${k}"><span class="ind">${x.ind}</span>${x.dir ? "📁" : loaded(x) ? "🟢" : "📄"} <span class="file">${x.p}</span></div>`).join("")}
          <p class="small muted">🟢 = đang được nạp vào ngữ cảnh cho file đã chọn (CLAUDE.md & rules)</p></div>
          <div class="card" style="box-shadow:none">${f.dir ? "Chọn một file" : `<b>${f.full || f.p}</b><table class="t" style="margin-top:8px"><tr><th>Phạm vi</th><td>${f.scope}</td></tr><tr><th>Chia sẻ qua git</th><td>${f.shared ? "✅ Có" : "❌ Không"}</td></tr><tr><th>Khi nào có hiệu lực</th><td>${f.when}</td></tr></table>`}</div></div>`;
        el.querySelector("#tg").onchange = (e) => { target = e.target.value; draw(); };
        el.querySelectorAll(".tree-row").forEach((r) => (r.onclick = () => { if (!files[+r.dataset.k].dir) { sel = +r.dataset.k; draw(); } }));
      };
      draw();
    },
  };

  W.commandsSkills = {
    title: "Đặt cấu hình vào đâu?",
    render: sorter("Chọn vị trí phù hợp nhất.", ["CLAUDE.md (project)", ".claude/commands hoặc skills", ".claude/rules (glob)", "~/.claude (cá nhân)"], [
      { text: "Quy ước đặt tên biến mà mọi thành viên phải tuân theo ở mọi lúc.", a: 0, why: "Chuẩn mực luôn áp dụng, chia sẻ cho team → CLAUDE.md project." },
      { text: "Quy trình /release mà cả team gọi khi cần phát hành.", a: 1, why: "Gọi theo yêu cầu, chia sẻ → .claude/commands/ hoặc skill." },
      { text: "Quy tắc chỉ cho file migration SQL nằm rải rác **/migrations/*.sql.", a: 2, why: "Áp dụng theo loại file → rule với paths glob." },
      { text: "Bạn thích Claude trả lời ngắn gọn bằng tiếng Việt.", a: 3, why: "Sở thích cá nhân, không áp lên team → ~/.claude/CLAUDE.md." },
      { text: "Skill audit sinh output rất dài, cần cô lập khỏi phiên chính.", a: 1, why: "Skill với context: fork." },
    ]),
  };

  W.rulesMatcher = {
    title: "Kiểm tra glob của path-specific rules",
    render(el) {
      const rules = [
        { file: "testing.md", paths: ["**/*.test.ts", "**/*.test.tsx"] },
        { file: "api-conventions.md", paths: ["src/api/**/*.ts"] },
        { file: "migrations.md", paths: ["**/migrations/*.sql"] },
        { file: "styles.md", paths: ["**/*.css", "**/*.scss"] },
      ];
      const toRe = (g) => new RegExp("^" + g.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*\*\//g, "§").replace(/\*\*/g, ".*").replace(/\*/g, "[^/]*").replace(/\?/g, "[^/]").replace(/§/g, "(?:.*/)?") + "$");
      el.innerHTML = `<label class="small">Đường dẫn file đang chỉnh:</label><br><input type="text" id="p" value="src/api/users/user.test.ts" style="width:100%">
        <div class="btn-row" style="margin:8px 0">${["src/api/users/user.test.ts", "db/migrations/001_init.sql", "web/components/Button.scss", "README.md"].map((x) => `<button class="btn" data-x="${x}" style="font-size:12.5px">${x}</button>`).join("")}</div><div id="o"></div>`;
      const run = () => {
        const p = el.querySelector("#p").value.trim();
        el.querySelector("#o").innerHTML = `<table class="t"><tr><th>Rule</th><th>paths</th><th>Nạp?</th></tr>${rules.map((r) => { const hit = r.paths.some((g) => toRe(g).test(p)); return `<tr><td><code>.claude/rules/${r.file}</code></td><td class="small">${r.paths.join(", ")}</td><td>${hit ? '<span class="verdict good">✓ Nạp</span>' : '<span class="muted small">bỏ qua</span>'}</td></tr>`; }).join("")}</table>`;
      };
      el.querySelector("#p").oninput = run;
      el.querySelectorAll("[data-x]").forEach((b) => (b.onclick = () => { el.querySelector("#p").value = b.dataset.x; run(); }));
      run();
    },
  };

  W.planOrDirect = {
    title: "Plan mode hay thực thi trực tiếp?",
    render: sorter("Chọn chế độ phù hợp.", ["Plan mode", "Thực thi trực tiếp"], [
      { text: "Migrate từ Moment.js sang date-fns, ảnh hưởng ~45 file.", a: 0, why: "Quy mô lớn, nhiều file." },
      { text: "Sửa NullPointerException ở một hàm, stack trace rõ ràng.", a: 1, why: "Phạm vi nhỏ, rõ ràng." },
      { text: "Chọn kiến trúc tích hợp hệ thống thanh toán mới (webhook hay polling).", a: 0, why: "Nhiều phương án hợp lệ, quyết định kiến trúc." },
      { text: "Thêm kiểm tra email rỗng vào form đăng ký.", a: 1, why: "Thay đổi đơn giản, một chỗ." },
      { text: "Tái cấu trúc module auth dùng chung bởi 6 service.", a: 0, why: "Ảnh hưởng rộng, cần khám phá trước." },
    ]),
  };

  W.refinement = {
    title: "Mô phỏng tinh chỉnh lặp",
    render: stepper([
      { role: "user", who: "Bạn", text: "Chuẩn hóa địa chỉ về định dạng chuẩn của công ty." },
      { role: "err", who: "Claude (lần 1)", text: "“12 nguyen trai q1” → “12 Nguyen Trai Street, District 1” ✗ (sai định dạng mong muốn)" },
      { role: "user", who: "Bạn — thêm ví dụ cụ thể", html: "<code>12 nguyen trai q1</code> → <code>12 Nguyễn Trãi, P. Bến Thành, Q.1, TP.HCM</code><br><code>5 le loi, quan 1</code> → <code>5 Lê Lợi, P. Bến Nghé, Q.1, TP.HCM</code>" },
      { role: "assistant", who: "Claude (lần 2)", text: "Đã hiểu mẫu: viết hoa có dấu, viết tắt P./Q., thêm TP. Áp dụng cho 200 địa chỉ còn lại." },
      { role: "user", who: "Bạn — chạy test", text: "3/50 test thất bại: địa chỉ không có số nhà." },
      { role: "tool", who: "Claude (lần 3)", text: "Bổ sung xử lý thiếu số nhà → 50/50 test pass ✓" },
    ]),
  };

  /* ── Chương 4 ── */
  W.criteriaRewrite = {
    title: "Viết lại chỉ dẫn mơ hồ thành tiêu chí",
    render: compare([
      { label: "Mơ hồ", verdict: "bad", note: "Không định nghĩa báo gì / bỏ gì", html: `<pre><code>Hãy review code cẩn thận. Chỉ báo các vấn đề
có độ tin cậy cao. Hãy thận trọng.</code></pre><div class="msg err"><span class="who">Kết quả</span>23 comment, 17 là góp ý style → developer bỏ qua toàn bộ, kể cả lỗi SQL injection.</div>` },
      { label: "Tiêu chí cụ thể", verdict: "good", note: "Báo gì, bỏ gì, mức độ kèm ví dụ", html: `<pre><code>BÁO khi:
- Input người dùng đi vào câu SQL/shell không qua tham số hóa
- Comment mô tả sai hành vi thực tế của code
- Thiếu kiểm tra null trên giá trị từ API bên ngoài
BỎ QUA: đặt tên, định dạng, sở thích style.
Mức độ: CRITICAL = khai thác được từ xa (ví dụ: ...)</code></pre><div class="msg tool"><span class="who">Kết quả</span>4 comment, đều có giá trị → developer xử lý cả 4.</div>` },
    ]),
  };

  W.fewShot = {
    title: "Zero-shot vs few-shot",
    render: compare([
      { label: "Zero-shot", verdict: "bad", note: "Định dạng & quyết định không nhất quán", html: `<div class="msg user"><span class="who">Ticket</span>“Bị trừ tiền 2 lần sau khi app báo lỗi thanh toán”</div><div class="msg err"><span class="who">Lần chạy 1 / 2 / 3</span>billing · BUG · “Billing issue (possibly bug)”</div>` },
      { label: "Few-shot có lý do", verdict: "good", note: "Nhất quán, khái quát được ca mới", html: `<pre><code>Ví dụ 1: "App crash khi mở giỏ hàng" → bug
  (lý do: lỗi phần mềm, không liên quan tiền)
Ví dụ 2: "Bị trừ tiền 2 lần do lỗi app" → billing
  (lý do: khách bị ảnh hưởng tài chính → ưu tiên billing,
   gắn cờ phụ bug)
Ví dụ 3: "Muốn đổi gói cước" → billing</code></pre><div class="msg tool"><span class="who">Lần chạy 1 / 2 / 3</span>billing (+bug) · billing (+bug) · billing (+bug)</div>` },
    ]),
  };

  W.schemaDemo = {
    title: "Schema ảnh hưởng thế nào tới trích xuất?",
    render(el) {
      el.innerHTML = `<div class="msg user"><span class="who">Tài liệu</span>HỢP ĐỒNG DỊCH VỤ — Bên A: Công ty X. Giá trị: 120.000.000đ. Hiệu lực từ 01/03/2026. <i>(Không có điều khoản gia hạn. Loại dịch vụ: tư vấn pháp lý)</i></div>
        <label class="toggle"><input type="checkbox" id="n"> renewal_date cho phép <code>null</code></label>
        <label class="toggle"><input type="checkbox" id="o"> enum service_type có <code>"other"</code> + <code>service_detail</code></label>
        <div class="grid grid-2"><div id="s"></div><div id="r"></div></div>`;
      const run = () => {
        const n = el.querySelector("#n").checked, o = el.querySelector("#o").checked;
        const schema = { type: "object", required: ["party", "value", "renewal_date", "service_type"], properties: { renewal_date: { type: n ? ["string", "null"] : "string" }, service_type: { enum: o ? ["it", "marketing", "other"] : ["it", "marketing"] } } };
        if (o) schema.properties.service_detail = { type: ["string", "null"] };
        const res = { party: "Công ty X", value: 120000000, renewal_date: n ? null : "2027-03-01", service_type: o ? "other" : "it" };
        if (o) res.service_detail = "tư vấn pháp lý";
        el.querySelector("#s").innerHTML = `<b class="small">Schema</b>` + json(schema);
        el.querySelector("#r").innerHTML = `<b class="small">Kết quả</b>` + json(res) +
          (!n ? `<div class="msg err">renewal_date bị <b>bịa</b> vì trường bắt buộc kiểu string.</div>` : `<div class="msg tool">renewal_date = null: trung thực.</div>`) +
          (!o ? `<div class="msg err">service_type bị ép vào “it” dù không đúng.</div>` : `<div class="msg tool">“other” + chi tiết giữ đúng ngữ nghĩa.</div>`);
      };
      el.querySelectorAll("input").forEach((i) => (i.onchange = run));
      run();
    },
  };

  W.batchDecider = {
    title: "Có nên dùng Message Batches API?",
    render(el) {
      el.innerHTML = `<div class="grid grid-2">
        <label class="small">Số request: <input type="number" id="n" value="10000" min="1"></label>
        <label class="small">Cần kết quả trong (giờ): <input type="number" id="d" value="30" min="1"></label></div>
        <label class="toggle"><input type="checkbox" id="w"> Có người đang chờ kết quả (ví dụ chặn merge)</label>
        <label class="toggle"><input type="checkbox" id="m"> Mỗi request cần nhiều lượt gọi công cụ</label>
        <div id="o"></div>`;
      const run = () => {
        const n = +el.querySelector("#n").value || 0, d = +el.querySelector("#d").value || 0;
        const w = el.querySelector("#w").checked, m = el.querySelector("#m").checked;
        let verdict, cls;
        if (w) { verdict = "Không dùng Batch — có người đang chờ, Batch có thể mất tới 24 giờ."; cls = "err"; }
        else if (m) { verdict = "Không dùng Batch — không hỗ trợ gọi công cụ nhiều lượt trong một request."; cls = "err"; }
        else if (d < 24) { verdict = `Rủi ro — hạn ${d} giờ ngắn hơn cửa sổ xử lý tối đa 24 giờ.`; cls = "system"; }
        else { verdict = `Dùng Batch ✓ — phải gửi trong vòng ${d - 24} giờ đầu để chắc chắn kịp hạn.`; cls = "tool"; }
        el.querySelector("#o").innerHTML = `<div style="margin:12px 0"><div class="small">Chi phí tương đối cho ${n.toLocaleString("vi-VN")} request</div>
          <div class="small">Đồng bộ</div><div class="bar" style="height:14px"><span style="width:100%;background:var(--muted)"></span></div>
          <div class="small" style="margin-top:4px">Batch (~50%)</div><div class="bar" style="height:14px"><span style="width:50%;background:var(--ok)"></span></div></div>
          <div class="msg ${cls}"><span class="who">Khuyến nghị</span>${verdict}</div>`;
      };
      el.querySelectorAll("input").forEach((i) => (i.oninput = run));
      run();
    },
  };

  W.multiPass = {
    title: "Một lượt vs nhiều lượt vs reviewer độc lập",
    render: compare([
      { label: "Một lượt, 30 file", verdict: "bad", note: "Chú ý bị loãng", html: `<div class="msg err"><span class="who">Kết quả</span>Phát hiện 3/11 lỗi. File 1–5 được nhận xét chi tiết, file 20–30 gần như bỏ qua.</div>` },
      { label: "Per-file + tích hợp", verdict: "good", note: "Sâu theo file + bắt lỗi xuyên file", html: `<div class="flow"><span class="node pass">file 1</span><span class="node pass">file 2</span><span class="node pass">…</span><span class="node pass">file 30</span><span class="arrow">→</span><span class="node on">Lượt tích hợp xuyên file</span></div><div class="msg tool"><span class="who">Kết quả</span>Phát hiện 9/11 lỗi, gồm 2 lỗi luồng dữ liệu giữa api/ và web/.</div>` },
      { label: "Tự review", verdict: "bad", note: "Bị neo vào lập luận của chính mình", html: `<div class="msg err"><span class="who">Cùng phiên vừa sinh code</span>“Code trông ổn, đã xử lý các trường hợp biên.” — bỏ sót race condition.</div>` },
      { label: "Reviewer độc lập", verdict: "good", note: "Không mang ngữ cảnh sinh code", html: `<div class="msg tool"><span class="who">Instance mới</span>Phát hiện race condition khi 2 request cập nhật cùng số dư.</div>` },
    ]),
  };

  /* ── Chương 5 ── */
  W.contextWindow = {
    title: "Mô phỏng cửa sổ ngữ cảnh",
    render(el) {
      el.innerHTML = `<label class="toggle"><input type="checkbox" id="t"> Cắt gọn output công cụ</label>
        <label class="toggle"><input type="checkbox" id="f"> Khối case facts</label>
        <label class="small" style="display:block;margin-top:6px">Vị trí phát hiện quan trọng: <select id="pos"><option value="0.08">Đầu input</option><option value="0.5" selected>Giữa input</option><option value="0.92">Cuối input</option></select></label>
        <div id="o" style="margin-top:12px"></div>`;
      const run = () => {
        const t = el.querySelector("#t").checked, f = el.querySelector("#f").checked, pos = +el.querySelector("#pos").value;
        const seg = [["System", 6, "#64748b"], ...(f ? [["Case facts", 4, "#d0702f"]] : []), ["Lịch sử hội thoại", 30, "#3b73d9"], ["Output công cụ", t ? 12 : 52, "#13958a"]];
        const total = seg.reduce((a, s) => a + s[1], 0);
        const att = 1 - 0.65 * Math.sin(Math.PI * pos);
        const pts = Array.from({ length: 41 }, (_, k) => { const x = k / 40; return `${20 + x * 520},${20 + (0.65 * Math.sin(Math.PI * x)) * 90}`; }).join(" ");
        el.querySelector("#o").innerHTML = `<div class="ctx-bar">${seg.map((s) => `<div style="flex:${s[1]};background:${s[2]}">${s[0]}</div>`).join("")}<div style="flex:${Math.max(0, 110 - total)};background:var(--surface-2);color:var(--muted)">trống</div></div>
          <div class="small muted" style="margin-top:4px">Đã dùng ~${Math.round((total / 110) * 100)}% ngữ cảnh</div>
          <svg viewBox="0 0 560 140" style="width:100%;margin-top:10px"><polyline points="${pts}" fill="none" stroke="var(--accent)" stroke-width="3"/>
            <circle cx="${20 + pos * 520}" cy="${20 + 0.65 * Math.sin(Math.PI * pos) * 90}" r="8" fill="${att > 0.7 ? "var(--ok)" : "var(--bad)"}"/>
            <text x="20" y="135" style="font-size:12px">Đầu</text><text x="280" y="135" text-anchor="middle" style="font-size:12px">Giữa (dễ bị bỏ sót)</text><text x="540" y="135" text-anchor="end" style="font-size:12px">Cuối</text>
            <text x="20" y="14" style="font-size:11px;fill:var(--muted)">↑ mức chú ý cao</text></svg>
          <div class="msg ${f && att > 0.7 ? "tool" : "system"}"><span class="who">Đánh giá</span>${f ? "✓ Số tiền, ngày, mã đơn được giữ nguyên văn trong case facts." : "✗ Dữ kiện giao dịch có thể bị tóm tắt làm mất."} ${att > 0.7 ? "✓ Phát hiện quan trọng ở vị trí được chú ý tốt." : "✗ Phát hiện nằm giữa input — rủi ro “lost in the middle”."} ${t ? "✓ Output công cụ chỉ giữ trường liên quan." : "✗ Output công cụ 40+ trường chiếm phần lớn ngữ cảnh."}</div>`;
      };
      el.querySelectorAll("input,select").forEach((i) => (i.onchange = run));
      run();
    },
  };

  W.escalation = {
    title: "Escalate, tự xử lý hay hỏi thêm?",
    render: sorter("Chọn hành động đúng cho agent hỗ trợ.", ["Escalate cho người thật", "Tự xử lý", "Hỏi thêm thông tin"], [
      { text: "Khách: “Cho tôi nói chuyện với nhân viên.”", a: 0, why: "Yêu cầu rõ ràng → chuyển ngay." },
      { text: "Khách bực bội vì đơn giao trễ 2 ngày, chính sách cho phép tặng voucher.", a: 1, why: "Vấn đề nằm trong khả năng xử lý; ghi nhận cảm xúc và giải quyết." },
      { text: "Khách yêu cầu khớp giá với đối thủ; chính sách chỉ nói về điều chỉnh giá nội bộ.", a: 0, why: "Khoảng trống chính sách → escalate." },
      { text: "get_customer trả về 2 tài khoản cùng tên “Nguyễn Văn A”.", a: 2, why: "Hỏi email hoặc mã đơn, không đoán." },
      { text: "Sentiment score của khách xuống 0.2 nhưng yêu cầu chỉ là đổi địa chỉ giao hàng.", a: 1, why: "Sentiment không phải tín hiệu độ phức tạp; việc đơn giản → tự xử lý." },
      { text: "Agent đã thử 3 cách nhưng không thể truy cập hệ thống hoàn tiền.", a: 0, why: "Không thể tiến triển → escalate kèm tóm tắt." },
    ]),
  };

  W.errorPropagation = {
    title: "Ba cách xử lý khi 1/5 nguồn lỗi",
    render: compare([
      { label: "Nuốt lỗi", verdict: "bad", note: "Coordinator tưởng là không có dữ liệu", html: json({ status: "success", results: [] }) },
      { label: "Dừng toàn bộ", verdict: "bad", note: "Mất kết quả của 4 nguồn còn lại", html: `<div class="msg err"><span class="who">Coordinator</span>RuntimeError: search failed → hủy toàn bộ nghiên cứu.</div>` },
      { label: "Lỗi có cấu trúc", verdict: "good", note: "Coordinator tự quyết cách phục hồi", html: json({ status: "partial", results: ["…4 nguồn…"], errors: [{ source: "journal-db", type: "transient/timeout", attempted_query: "AI music adoption 2025", alternatives: ["thử lại sau 30s", "dùng nguồn arxiv"] }], coverage_note: "Thiếu dữ liệu học thuật từ journal-db" }) },
    ]),
  };

  W.longSession = {
    title: "Phiên khám phá dài & suy giảm ngữ cảnh",
    render(el) {
      el.innerHTML = `<label class="small">Thời lượng phiên: <b id="hv">60</b> phút</label><input type="range" id="h" min="10" max="240" step="10" value="60">
        <label class="toggle"><input type="checkbox" id="s"> File scratchpad</label>
        <label class="toggle"><input type="checkbox" id="a"> Ủy thác cho subagent Explore</label>
        <label class="toggle"><input type="checkbox" id="c"> /compact định kỳ</label><div id="o"></div>`;
      const run = () => {
        const h = +el.querySelector("#h").value, s = el.querySelector("#s").checked, a = el.querySelector("#a").checked, c = el.querySelector("#c").checked;
        el.querySelector("#hv").textContent = h;
        let fill = h * 0.55 * (a ? 0.45 : 1) * (c ? 0.6 : 1);
        fill = Math.min(100, fill);
        const quality = Math.max(10, Math.round(100 - Math.max(0, fill - 45) * 1.4 + (s ? 12 : 0)));
        el.querySelector("#o").innerHTML = `<div style="margin-top:10px" class="small">Ngữ cảnh đã dùng: ${Math.round(fill)}%</div><div class="bar" style="height:12px"><span style="width:${fill}%;background:${fill > 80 ? "var(--bad)" : "var(--accent)"}"></span></div>
          <div style="margin-top:8px" class="small">Độ cụ thể của câu trả lời: ${Math.min(100, quality)}%</div><div class="bar" style="height:12px"><span style="width:${Math.min(100, quality)}%;background:${quality < 60 ? "var(--bad)" : "var(--ok)"}"></span></div>
          <div class="msg ${quality < 60 ? "err" : "tool"}" style="margin-top:10px"><span class="who">Claude trả lời</span>${quality < 60 ? "“Codebase dùng các pattern phổ biến cho xử lý thanh toán…” (chung chung, quên class cụ thể)" : "“PaymentService.refund() gọi LedgerClient.reverse() ở dòng 142, xem ghi chú trong scratchpad.md” (cụ thể)"}</div>
          <p class="small muted">Mô hình minh họa định tính, không phải số đo thực.</p>`;
      };
      el.querySelectorAll("input").forEach((i) => (i.oninput = run));
      run();
    },
  };

  W.stratified = {
    title: "Accuracy tổng có thể đánh lừa",
    render(el) {
      const rows = [["Hóa đơn chuẩn", 8200, 0.99], ["Biên lai", 1200, 0.97], ["Hợp đồng", 450, 0.93], ["Hóa đơn viết tay", 150, 0.61]];
      const total = rows.reduce((a, r) => a + r[1], 0);
      const acc = rows.reduce((a, r) => a + r[1] * r[2], 0) / total;
      let open = false;
      const draw = () => {
        el.innerHTML = `<div style="text-align:center"><div class="small muted">Độ chính xác tổng (${total.toLocaleString("vi-VN")} tài liệu)</div><div class="score-big" style="color:var(--ok)">${(acc * 100).toFixed(1)}%</div></div>
          <div class="btn-row" style="justify-content:center"><button class="btn primary" id="b">${open ? "Ẩn" : "Xem"} theo loại tài liệu</button></div>
          ${open ? `<table class="t" style="margin-top:12px"><tr><th>Loại</th><th>Số lượng</th><th>Độ chính xác</th></tr>${rows.map((r) => `<tr><td>${r[0]}</td><td>${r[1].toLocaleString("vi-VN")}</td><td><div class="bar"><span style="width:${r[2] * 100}%;background:${r[2] < 0.9 ? "var(--bad)" : "var(--ok)"}"></span></div><b style="color:${r[2] < 0.9 ? "var(--bad)" : "inherit"}">${Math.round(r[2] * 100)}%</b></td></tr>`).join("")}</table>
          <div class="msg err" style="margin-top:10px"><span class="who">Phát hiện</span>Hóa đơn viết tay chỉ đạt 61% nhưng bị con số tổng che giấu. Giữ người duyệt cho nhóm này; lấy mẫu phân tầng để theo dõi các nhóm khác.</div>` : ""}`;
        el.querySelector("#b").onclick = () => { open = !open; draw(); };
      };
      draw();
    },
  };

  W.provenance = {
    title: "Giữ nguồn gốc khi tổng hợp",
    render: compare([
      { label: "Mất nguồn", verdict: "bad", note: "Không kiểm chứng được, che mâu thuẫn", html: `<div class="msg err"><span class="who">Báo cáo</span>“Khoảng 43% doanh nghiệp đã áp dụng AI.”</div>` },
      { label: "Claim–source mapping", verdict: "good", note: "Minh bạch, giữ cả hai số liệu", html: json([
        { claim: "Tỷ lệ doanh nghiệp áp dụng AI", value: "34%", source: "Khảo sát A", url: "https://example.org/a", published: "2024-06", method: "mẫu 1.000 DN nhỏ" },
        { claim: "Tỷ lệ doanh nghiệp áp dụng AI", value: "52%", source: "Báo cáo B", url: "https://example.org/b", published: "2025-09", method: "DN > 500 nhân sự" },
      ]) + `<div class="msg tool"><span class="who">Báo cáo</span>Hai nguồn khác nhau (34% vs 52%) — khác thời điểm và quy mô doanh nghiệp khảo sát.</div>` },
    ]),
  };

  window.WIDGETS = W;
  window.WKIT = { sorter, compare, stepper, json, esc };
})();
