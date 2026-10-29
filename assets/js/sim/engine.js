/* Bộ máy mô phỏng luồng dữ liệu (trace).
   Mỗi bước hiện một thẻ giải thích bằng lời; chi tiết kỹ thuật (dữ liệu, ý nghĩa trường,
   cách bên nhận xử lý, code, lịch sử) nằm trong các tab bên dưới, mỗi lần chỉ hiện một tab. */
(function () {
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* ── Tô màu JSON / code ── */
  const TOK = /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|(-?\b\d+(?:\.\d+)?\b)/g;
  function hiJSON(line) {
    let out = "", last = 0;
    line.replace(TOK, (m, str, colon, kw, num, i) => {
      out += esc(line.slice(last, i));
      if (str) out += colon ? `<span class="j-k">${esc(str)}</span>${colon}` : `<span class="j-s">${esc(str)}</span>`;
      else if (kw) out += `<span class="j-b">${kw}</span>`;
      else out += `<span class="j-n">${num}</span>`;
      last = i + m.length;
      return m;
    });
    return out + esc(line.slice(last));
  }
  function hiCode(line) {
    const i = line.search(/(#|\/\/)\s/);
    const body = i >= 0 ? line.slice(0, i) : line;
    const cm = i >= 0 ? `<span class="j-c">${esc(line.slice(i))}</span>` : "";
    return hiJSON(body) + cm;
  }
  // payload: object → JSON; string → code. hl: khóa (JSON) hoặc chuỗi con (code) cần tô sáng.
  function code(payload, hl = [], range) {
    const isStr = typeof payload === "string";
    const src = isStr ? payload : JSON.stringify(payload, null, 2);
    return `<pre class="code">${src
      .split("\n")
      .map((ln, k) => {
        const inRange = range && k + 1 >= range[0] && k + 1 <= range[1];
        const hit = inRange || hl.some((h) => (isStr ? ln.includes(h) : ln.includes(`"${h}"`)));
        return `<span class="ln${hit ? " hl" : ""}">${range ? `<i class="lnum">${k + 1}</i>` : ""}${(isStr ? hiCode(ln) : hiJSON(ln)) || " "}</span>`;
      })
      .join("")}</pre>`;
  }

  const ROLE = { user: "user", assistant: "assistant", tool: "user · tool_result", sys: "system", note: "ghi chú", err: "có vấn đề", ok: "ổn" };

  /* trace(spec)
     spec = { intro, start, actors:[{id,icon,name,sub}], steps: [] | (opts)=>[], controls:[...], stateTitle, code:{title, src} }
     step = { from, to, kind, label, title, sub, desc, note, warn,
              payload | payloads:[{t,d,hl}], payloadTitle, hl, fields:[[k,v]], backend:[html], snippet, lines:[a,b],
              push:[{r,t}], state:[{r,t}] } */
  function trace(spec) {
    return (el) => {
      const A = spec.actors;
      const opts = {};
      (spec.controls || []).forEach((c) => (opts[c.id] = c.value));
      let steps = [], n = 0, timer = null, tab = null, picked = null, speed = 1;
      const getSteps = () => (typeof spec.steps === "function" ? spec.steps(opts) : spec.steps);
      const actor = (id) => A.find((x) => x.id === id) || { icon: "", name: id };

      const ctrlHTML = (spec.controls || [])
        .map((c) => {
          if (c.type === "toggle") return `<label class="toggle"><input type="checkbox" data-c="${c.id}" ${c.value ? "checked" : ""}> <span>${c.label}</span></label>`;
          return `<label class="tr-sel"><span>${c.label}</span><select data-c="${c.id}">${c.options.map(([v, l]) => `<option value="${esc(v)}" ${v === c.value ? "selected" : ""}>${esc(l)}</option>`).join("")}</select></label>`;
        })
        .join("");

      el.innerHTML = `<div class="tr">
        ${spec.intro ? `<p class="tr-intro">${spec.intro}</p>` : ""}
        ${ctrlHTML ? `<div class="tr-ctrl"><div class="tr-ctrl-h">Thử thay đổi tình huống</div><div class="tr-ctrl-b">${ctrlHTML}</div></div>` : ""}
        <div class="tr-stage">
          <div class="tr-actors" style="--n:${A.length}">${A.map((a) => `<div class="tr-actor" data-a="${a.id}"><div class="ic">${a.icon}</div><b>${esc(a.name)}</b>${a.sub ? `<small>${esc(a.sub)}</small>` : ""}</div>`).join("")}</div>
          <div class="tr-track"></div><div class="tr-wire"></div><div class="tr-packet"></div>
        </div>
        <div class="tr-step"></div>
        <div class="tr-details"><div class="tr-tabs" role="tablist"></div><div class="tr-pane"></div></div>
        <div class="tr-nav">
          <div class="tr-progress"><span></span></div>
          <div class="tr-btns">
            <button class="btn" data-b="prev">← Bước trước</button>
            <button class="btn primary" data-b="next">Bước tiếp →</button>
            <button class="btn" data-b="auto">▶ Tự chạy</button>
            <button class="btn ghost" data-b="reset">Làm lại</button>
            <label class="tr-sel tr-speed"><span>Tốc độ</span><select data-b="speed"><option value="0.6">chậm</option><option value="1" selected>vừa</option><option value="1.8">nhanh</option></select></label>
          </div>
        </div></div>`;

      const $ = (s) => el.querySelector(s);
      const stage = $(".tr-stage"), pk = $(".tr-packet"), wire = $(".tr-wire");
      const actorEl = (id) => el.querySelector(`.tr-actor[data-a="${id}"]`);

      const move = (s, animate) => {
        el.querySelectorAll(".tr-actor").forEach((a) => a.classList.remove("src", "dst", "busy"));
        if (!s) { pk.style.opacity = 0; wire.style.opacity = 0; return; }
        const to = s.to || s.from;
        const fa = actorEl(s.from), ta = actorEl(to);
        if (!fa || !ta) return;
        if (s.from === to) { ta.classList.add("busy"); pk.style.opacity = 0; wire.style.opacity = 0; return; }
        fa.classList.add("src"); ta.classList.add("dst");
        const cx = (a) => a.offsetLeft + a.offsetWidth / 2;
        const x1 = cx(fa), x2 = cx(ta);
        const kind = s.kind || "req";
        wire.className = "tr-wire k-" + kind;
        wire.style.opacity = 1;
        wire.style.left = Math.min(x1, x2) + "px";
        wire.style.width = Math.abs(x2 - x1) + "px";
        pk.className = "tr-packet k-" + kind;
        pk.textContent = `${x2 < x1 ? "← " : ""}${s.label || "dữ liệu"}${x2 >= x1 ? " →" : ""}`;
        const half = pk.offsetWidth / 2, W = stage.clientWidth;
        const clamp = (x) => Math.max(half, Math.min(W - half, x));
        pk.style.transition = "none";
        pk.style.left = clamp(x1) + "px";
        pk.style.opacity = 1;
        void pk.offsetWidth;
        pk.style.transition = animate ? "" : "none";
        pk.style.left = clamp(x2) + "px";
      };

      const stateAt = (k) => {
        let cur = [], fresh = [];
        for (let i = 0; i < k; i++) {
          const s = steps[i];
          if (s.state) cur = s.state.slice();
          if (s.push) cur = cur.concat(s.push);
          if (i === k - 1) fresh = s.push || (s.state ? s.state : []);
        }
        return { cur, fresh };
      };

      const paneHTML = (s, t) => {
        if (t === "payload") {
          const list = s.payloads || [{ t: s.payloadTitle, d: s.payload, hl: s.hl }];
          return `<p class="tr-hint">Dòng tô vàng là phần đáng chú ý ở bước này.</p>` + list.map((p) => `${p.t ? `<div class="tr-ptitle">${p.t}</div>` : ""}${code(p.d, p.hl || [])}`).join("");
        }
        if (t === "fields") return `<dl class="tr-fields">${s.fields.map(([k, v]) => `<dt><code>${esc(k)}</code></dt><dd>${v}</dd>`).join("")}</dl>`;
        if (t === "backend") return `<ol class="tr-backend">${s.backend.map((b) => `<li>${b}</li>`).join("")}</ol>${s.snippet ? `<div class="tr-ptitle">Code minh họa</div>${code(s.snippet)}` : ""}`;
        if (t === "code") return `${spec.code.title ? `<p class="tr-hint">${spec.code.title}. Các dòng tô vàng đang chạy ở bước này.</p>` : ""}${code(spec.code.src, [], s.lines)}`;
        if (t === "state") {
          const { cur, fresh } = stateAt(n);
          return cur.length
            ? `<div class="tr-statelist">${cur.map((x) => `<div class="tr-chip r-${x.r} ${fresh.includes(x) ? "new" : ""}"><span>${ROLE[x.r] || x.r}${fresh.includes(x) ? " · vừa thêm" : ""}</span>${x.t}</div>`).join("")}</div>`
            : `<p class="tr-hint">Chưa có gì.</p>`;
        }
        return "";
      };

      const draw = (animate) => {
        const s = steps[n - 1];
        move(s, animate);
        // Thẻ giải thích của bước
        if (s) {
          const to = s.to || s.from, a = actor(s.from), b = actor(to);
          const route = s.from === to ? `${a.icon} <b>${esc(a.name)}</b> đang xử lý` : `${a.icon} <b>${esc(a.name)}</b> gửi cho ${b.icon} <b>${esc(b.name)}</b>`;
          $(".tr-step").innerHTML = `<div class="tr-meta"><span class="tr-num">Bước ${n} / ${steps.length}</span><span class="tr-route">${route}</span>${s.sub ? `<code class="tr-sub">${esc(s.sub)}</code>` : ""}</div>
            <h4 class="tr-title">${s.title}</h4>${s.desc ? `<p class="tr-desc">${s.desc}</p>` : ""}
            ${s.note ? `<div class="callout info"><b>Lưu ý.</b> ${s.note}</div>` : ""}${s.warn ? `<div class="callout danger"><b>Chỗ dễ sai.</b> ${s.warn}</div>` : ""}`;
        } else {
          $(".tr-step").innerHTML = `<h4 class="tr-title">${spec.start || "Bấm “Bước tiếp” để đi từng bước, hoặc “Tự chạy” để xem liền một mạch."}</h4>
            <p class="tr-desc">Mỗi bước cho biết ai gửi cho ai và vì sao. Muốn xem chi tiết kỹ thuật, mở các tab ngay bên dưới thẻ giải thích.</p>`;
        }
        // Tab chi tiết
        const tabs = [];
        if (s && (s.payload !== undefined || s.payloads)) tabs.push(["payload", "Dữ liệu được gửi"]);
        if (s && s.fields) tabs.push(["fields", "Ý nghĩa các trường"]);
        if (s && s.backend) tabs.push(["backend", s.from === (s.to || s.from) ? "Đang làm gì" : "Bên nhận xử lý ra sao"]);
        if (s && spec.code && s.lines) tabs.push(["code", "Đoạn code tương ứng"]);
        if (s && spec.stateTitle) tabs.push(["state", spec.stateTitle]);
        tab = tabs.some(([k]) => k === picked) ? picked : tabs.length ? tabs[0][0] : null;
        $(".tr-details").style.display = tabs.length ? "" : "none";
        $(".tr-tabs").innerHTML = tabs.map(([k, l]) => `<button role="tab" class="${k === tab ? "on" : ""}" data-t="${k}">${l}</button>`).join("");
        $(".tr-pane").innerHTML = s && tab ? paneHTML(s, tab) : "";
        el.querySelectorAll("[data-t]").forEach((b) => (b.onclick = () => { picked = b.dataset.t; draw(false); }));
        const hl = $(".tr-pane .ln.hl");
        if (hl && tab === "code") { const p = $(".tr-pane"); p.scrollTop = Math.max(0, hl.offsetTop - 80); }
        // Thanh tiến độ và nút
        $(".tr-progress span").style.width = (steps.length ? (n / steps.length) * 100 : 0) + "%";
        $('[data-b="prev"]').disabled = n <= 0;
        $('[data-b="next"]').disabled = n >= steps.length;
        $('[data-b="auto"]').textContent = timer ? "❚❚ Dừng" : n >= steps.length ? "▶ Chạy lại" : "▶ Tự chạy";
      };

      const stop = () => { clearInterval(timer); timer = null; };
      const play = () => {
        stop();
        if (n >= steps.length) n = 0;
        timer = setInterval(() => {
          if (!el.isConnected) return stop();
          if (n >= steps.length) { stop(); return draw(false); }
          n++; draw(true);
        }, 3600 / speed);
        n++; draw(true);
      };

      $('[data-b="prev"]').onclick = () => { stop(); n = Math.max(0, n - 1); draw(true); };
      $('[data-b="next"]').onclick = () => { stop(); n = Math.min(steps.length, n + 1); draw(true); };
      $('[data-b="reset"]').onclick = () => { stop(); n = 0; draw(false); };
      $('[data-b="auto"]').onclick = () => (timer ? (stop(), draw(false)) : play());
      $('[data-b="speed"]').onchange = (e) => { speed = +e.target.value; if (timer) play(); };
      el.querySelectorAll("[data-c]").forEach((i) => (i.onchange = () => {
        opts[i.dataset.c] = i.type === "checkbox" ? i.checked : i.value;
        stop(); steps = getSteps(); n = 0; draw(false);
      }));
      const onResize = () => { if (!el.isConnected) return window.removeEventListener("resize", onResize); move(steps[n - 1], false); };
      window.addEventListener("resize", onResize);

      steps = getSteps();
      draw(false);
    };
  }

  window.SIM = { trace, code, esc };
})();
