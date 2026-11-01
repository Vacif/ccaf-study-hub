/* Bộ máy mô phỏng luồng dữ liệu (trace).
   Mỗi bước nói rõ: ai gửi, ai nhận, qua kênh nào, và dữ liệu đang xem là bản đầy đủ hay rút gọn.
   Toàn bộ quy trình được chia giai đoạn và liệt kê ở cuối mô phỏng. */
(function () {
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const strip = (h) => String(h).replace(/<[^>]+>/g, "");

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
  // Vị trí bắt đầu chú thích (# hoặc //) nằm ngoài chuỗi, đứng sau khoảng trắng; -1 nếu không có
  function commentAt(line) {
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (q && ch === "\\") { i++; continue; }
      if (ch === '"') { q = !q; continue; }
      if (q) continue;
      const len = ch === "#" ? 1 : ch === "/" && line[i + 1] === "/" ? 2 : 0;
      if (len && (i === 0 || /\s/.test(line[i - 1])) && /\s/.test(line[i + len] || "")) return i;
    }
    return -1;
  }
  function hiCode(line) {
    const i = commentAt(line);
    return i < 0 ? hiJSON(line) : hiJSON(line.slice(0, i)) + `<span class="j-c">${esc(line.slice(i))}</span>`;
  }

  /* ── JSON gọn: object/mảng ngắn viết trên một dòng ── */
  const inl = (x) =>
    x === null || typeof x !== "object"
      ? JSON.stringify(x)
      : Array.isArray(x)
        ? "[" + x.map(inl).join(", ") + "]"
        : "{" + Object.keys(x).filter((k) => x[k] !== undefined).map((k) => JSON.stringify(k) + ": " + inl(x[k])).join(", ") + "}";
  // Trả về các dòng {t, m}; m = true nếu dòng thuộc một nút được đánh dấu (mark(path))
  function pretty(v, mark, W = 78) {
    const out = [];
    const walk = (x, ind, pre, path, post, hot) => {
      hot = hot || (mark ? !!mark(path) : false);
      const one = pre + inl(x) + post;
      if (x === null || typeof x !== "object" || !Object.keys(x).length || ind.length + one.length <= W) { out.push({ t: ind + one, m: hot, j: 1 }); return; }
      const arr = Array.isArray(x);
      const ks = arr ? x.map((_, i) => i) : Object.keys(x).filter((k) => x[k] !== undefined);
      out.push({ t: ind + pre + (arr ? "[" : "{"), m: hot, j: 1 });
      ks.forEach((k, i) => walk(x[k], ind + "  ", arr ? "" : JSON.stringify(k) + ": ", path.concat(k), i < ks.length - 1 ? "," : "", hot));
      out.push({ t: ind + (arr ? "]" : "}") + post, m: hot, j: 1 });
    };
    walk(v, "", "", [], "", false);
    return out;
  }
  // d: object → JSON; string → code; {__rows} → các dòng dựng sẵn (ví dụ gói HTTP)
  function rowsOf(d, hl = [], mark) {
    const hit = (r) => hl.some((h) => r.t.includes(r.j ? `"${h}"` : h));
    const rows = d && d.__rows ? d.__rows : typeof d === "string" ? d.split("\n").map((t) => ({ t })) : pretty(d, mark);
    return rows.map((r) => ({ t: r.t, m: !!r.m || hit(r) }));
  }
  function code(d, hl = [], range, mark) {
    return `<pre class="code">${rowsOf(d, hl || [], mark)
      .map((r, k) => {
        const on = r.m || (range && k + 1 >= range[0] && k + 1 <= range[1]);
        return `<span class="ln${on ? " hl" : ""}">${range ? `<i class="lnum">${k + 1}</i>` : ""}${hiCode(r.t) || " "}</span>`;
      })
      .join("")}</pre>`;
  }

  /* ── Gói HTTP đầy đủ: dòng lệnh, header, dòng trống, body ── */
  function httpRows(head, body, mark) {
    const rows = head.map((t) => ({ t }));
    if (body !== undefined) {
      rows.push({ t: "" });
      (typeof body === "string" ? body.split("\n").map((t) => ({ t })) : pretty(body, mark)).forEach((r) => rows.push(r));
    }
    return { __rows: rows };
  }
  const hdr = (h) => Object.entries(h).filter(([, v]) => v != null).map(([k, v]) => `${k}: ${v}`);
  const http = {
    req(method, url, headers = {}, body, mark) {
      const m = String(url).match(/^\w+:\/\/([^/]+)(.*)$/) || [0, "", url];
      const head = [`${method} ${m[2] || "/"} HTTP/1.1`, `host: ${m[1]}`, ...hdr(headers)];
      if (body !== undefined && typeof body === "object" && !("content-type" in headers)) head.push("content-type: application/json");
      return httpRows(head, body, mark);
    },
    res(status, headers = {}, body, mark) {
      const head = [`HTTP/1.1 ${status}`, ...hdr(headers)];
      if (body !== undefined && typeof body === "object" && !("content-type" in headers)) head.push("content-type: application/json");
      return httpRows(head, body, mark);
    },
  };

  /* ── Hội thoại với Claude API: giữ đủ lịch sử để mỗi request/response hiện được trọn vẹn ── */
  const API = "https://api.anthropic.com/v1/messages";
  const API_HEAD = {
    authorization: "Bearer $ANTHROPIC_API_KEY   # SDK Python 2.x tự đọc biến môi trường; gọi bằng curl thì dùng header x-api-key",
    "anthropic-version": "2026-10-21",
  };
  const ID_NOTE = "Các mã như <code>msg_…</code>, <code>toolu_…</code> được viết ngắn cho dễ theo dõi; mã thật dài khoảng 30 ký tự.";
  function claude(base, o = {}) {
    const msgs = [];
    let sent = 0, seq = 0;
    const url = o.url || API;
    const head = { ...API_HEAD, ...(o.headers || {}) };
    const c = {
      msgs,
      base,
      set(patch) { Object.assign(base, patch); return c; },
      user(content) { msgs.push({ role: "user", content }); return c; },
      push(m) { msgs.push(m); return c; },
      // Request đầy đủ gồm mọi tin nhắn tính tới lúc này; tin nhắn mới so với lần gửi trước được tô vàng
      req(opt = {}) {
        const body = { ...base, ...(opt.extra || {}), messages: msgs.slice() };
        const from = opt.since != null ? opt.since : sent;
        sent = msgs.length;
        const mark = (p) => p[0] === "messages" && p.length >= 2 && p[1] >= from;
        const fresh = msgs.length - from;
        const note = `Đây là toàn bộ body gửi đi: ${msgs.length} tin nhắn trong <code>messages</code>${fresh > 0 && fresh < msgs.length ? `, trong đó ${fresh} tin nhắn mới so với lần gửi trước (tô vàng). Các tin nhắn cũ phải gửi lại vì API không nhớ gì giữa các lần gọi` : ""}.${o.note ? " " + o.note : ""}`;
        return {
          via: o.via || "HTTPS · POST " + url.replace(/^https?:\/\//, ""),
          views: [
            { t: "Body JSON", d: body, hl: opt.hl, mark, part: o.part, note },
            { t: "Gói HTTP đầy đủ", d: http.req("POST", url, head, body, mark), hl: opt.hl, part: o.part, note: "Đúng thứ tự gửi qua mạng: dòng lệnh, các header, một dòng trống, rồi body JSON. SDK còn tự thêm vài header kỹ thuật (user-agent, x-stainless-…) không ảnh hưởng kết quả." },
          ],
        };
      },
      // Response đầy đủ; tự thêm câu trả lời vào lịch sử (trừ khi bị cắt hoặc keep: false)
      res(r, opt = {}) {
        seq++;
        const msg = {
          id: r.id || `msg_0${seq}${o.tag || "A"}`,
          type: "message",
          role: "assistant",
          model: base.model,
          content: r.content,
          stop_reason: r.stop_reason,
          stop_sequence: null,
          stop_details: null,
          usage: { input_tokens: r.in, cache_creation_input_tokens: 0, cache_read_input_tokens: r.cached || 0, output_tokens: r.out, service_tier: "standard" },
        };
        if (opt.keep !== false && r.stop_reason !== "max_tokens") msgs.push({ role: "assistant", content: r.content });
        return {
          via: o.viaRes || "HTTPS · response 200 OK",
          views: [
            { t: "Body JSON", d: msg, hl: opt.hl, note: "Đây là toàn bộ body của response. " + ID_NOTE },
            { t: "Gói HTTP đầy đủ", d: http.res("200 OK", { "request-id": `req_0${seq}${o.tag || "A"}` }, msg), hl: opt.hl, note: "Dòng trạng thái, header, rồi body JSON." },
          ],
        };
      },
    };
    return c;
  }

  /* ── Kênh dùng chung: app chat ↔ backend, backend ↔ hệ thống nội bộ ── */
  const CHAT = "https://shop.example.vn/api/chat";
  const NET = "Bearer $INTERNAL_TOKEN   # khóa nội bộ của backend; Claude không bao giờ thấy khóa này";
  const net = {
    chatIn(text, sid = "sess_42") {
      const body = { session_id: sid, text };
      return { views: [{ t: "Body JSON", d: body }, { t: "Gói HTTP đầy đủ", d: http.req("POST", CHAT, { authorization: "Bearer <token đăng nhập của khách>" }, body), note: "Toàn bộ request mà app chat gửi lên backend." }] };
    },
    chatOut(reply, extra = {}) {
      const body = { reply, ...extra };
      return { views: [{ t: "Body JSON", d: body }, { t: "Gói HTTP đầy đủ", d: http.res("200 OK", {}, body), note: "Toàn bộ response backend trả cho app chat." }] };
    },
    // Một request nội bộ, dùng làm phần tử trong views/parts
    call(method, url, body, extra = {}) {
      return { t: `${method} ${url.replace(/^https?:\/\/[^/]+/, "")}`, d: http.req(method, url, { authorization: NET, ...extra }, body) };
    },
    callV(method, url, body, extra) {
      return { views: [{ ...net.call(method, url, body, extra), t: "Gói HTTP đầy đủ", note: body === undefined ? "Toàn bộ request. Lệnh GET không có body, mọi tham số nằm trên đường dẫn." : "Toàn bộ request: dòng lệnh, header và body." }] };
    },
    ret(body, status = "200 OK") {
      return { views: [{ t: "Body JSON", d: body }, { t: "Gói HTTP đầy đủ", d: http.res(status, {}, body) }] };
    },
  };

  /* ── Claude Code / Agent SDK là client: request rất dài, một phần chỉ hiện tên ── */
  const CC_PART = "Claude Code tự dựng request này. <code>messages</code> hiện đầy đủ. <code>system</code> thật là system prompt có sẵn của Claude Code (vài nghìn token); <code>tools</code> thật chứa định nghĩa đầy đủ (mô tả, tham số) của từng công cụ có sẵn như Read, Edit, Grep, Bash. Hai phần đó rất dài nên chỉ hiện tên.";
  const CC_SYS = "<system prompt có sẵn của Claude Code>";
  const BUILTIN = ["Bash", "Edit", "Glob", "Grep", "Read", "Task", "TodoWrite", "WebFetch", "WebSearch", "Write"].map((name) => ({ name }));
  const cc = {
    PART: CC_PART, SYS: CC_SYS, BUILTIN,
    ccConv(extraTools = [], tag = "K", o = {}) {
      return claude({ model: "claude-opus-5-5", max_tokens: 32000, system: o.system || CC_SYS, tools: (o.tools || BUILTIN).concat(extraTools) }, { part: o.part || CC_PART, tag, via: "HTTPS · POST api.anthropic.com/v1/messages (Claude Code gửi)" });
    },
  };

  const ROLE = { user: "user", assistant: "assistant", tool: "user · tool_result", sys: "system", note: "ghi chú", err: "có vấn đề", ok: "ổn" };

  /* trace(spec)
     spec  = { intro, start, actors:[{id,icon,name,sub,desc}], links:{"a>b": "kênh"}, steps: [] | (opts)=>[],
               controls:[...], stateTitle, code:{title, src} }
     step  = { phase, from, to, kind, label, title, desc, note, warn, key, via,
               views:[{t, d, hl, mark, part, note}]            // nhiều cách xem cùng một dữ liệu
               | payload | payloads:[{t,d,hl}], hl, part, pnote, full, fullHl,   // cách viết ngắn
               fields:[[k,v]], backend:[html], snippet, lines:[a,b], push:[{r,t}], state:[{r,t}] }
     - phase: tên giai đoạn bắt đầu từ bước này (các bước sau dùng tiếp tới khi gặp phase mới).
     - via: kênh truyền (HTTPS…, stdio JSON-RPC, gọi hàm…); mặc định lấy từ spec.links["from>to"].
     - part: ghi rõ phần nào bị lược. Không có part nghĩa là dữ liệu đầy đủ. full: bản đầy đủ để đối chiếu.
     - key: true giữ bước ở chế độ "Tóm tắt". */
  let brief = true;
  try { brief = localStorage.getItem("ccaf-sim-mode") !== "full"; } catch (e) {}
  function trace(spec) {
    return (el) => {
      const A = spec.actors;
      const opts = {};
      (spec.controls || []).forEach((c) => (opts[c.id] = c.value));
      let all = [], steps = [], phases = [], n = 0, timer = null, tab = null, picked = null, pickedView = null, speed = 1;
      const actor = (id) => A.find((x) => x.id === id) || { icon: "", name: id };
      const dest = (s) => s.to || s.from;
      const viaOf = (s) => s.via || (spec.links || {})[`${s.from}>${dest(s)}`] || "";
      const getSteps = () => {
        all = typeof spec.steps === "function" ? spec.steps(opts) : spec.steps;
        phases = [];
        let cur = -1;
        all.forEach((s, i) => {
          if (s.phase && (cur < 0 || phases[cur] !== s.phase)) { phases.push(s.phase); cur = phases.length - 1; }
          if (cur < 0) { phases.push("Bắt đầu"); cur = 0; }
          s._ph = cur; s._i = i;
        });
        const keys = all.filter((s) => s.key);
        const hasBrief = keys.length > 0 && keys.length < all.length;
        const mode = el.querySelector(".tr-mode");
        if (mode) {
          mode.style.display = hasBrief ? "" : "none";
          mode.querySelector('[data-m="brief"]').innerHTML = `Tóm tắt <small>${keys.length} bước chính</small>`;
          mode.querySelector('[data-m="full"]').innerHTML = `Đầy đủ <small>${all.length} bước</small>`;
          mode.querySelectorAll("[data-m]").forEach((b) => b.classList.toggle("on", (b.dataset.m === "brief") === brief));
        }
        return hasBrief && brief ? keys : all;
      };

      const ctrlHTML = (spec.controls || [])
        .map((c) => {
          if (c.type === "toggle") return `<label class="toggle"><input type="checkbox" data-c="${c.id}" ${c.value ? "checked" : ""}> <span>${c.label}</span></label>`;
          return `<label class="tr-sel"><span>${c.label}</span><select data-c="${c.id}">${c.options.map(([v, l]) => `<option value="${esc(v)}" ${v === c.value ? "selected" : ""}>${esc(l)}</option>`).join("")}</select></label>`;
        })
        .join("");
      const castHTML = A.map((a) => `<li><span class="ic">${a.icon}</span><div><b>${esc(a.name)}</b>${a.sub ? ` <small>${esc(a.sub)}</small>` : ""}${a.desc ? `<p>${a.desc}</p>` : ""}</div></li>`).join("");

      el.innerHTML = `<div class="tr">
        ${spec.intro ? `<p class="tr-intro">${spec.intro}</p>` : ""}
        <details class="tr-cast"><summary>Các bên tham gia: là gì, chạy ở đâu</summary><ul>${castHTML}</ul></details>
        ${ctrlHTML ? `<div class="tr-ctrl"><div class="tr-ctrl-h">Thử thay đổi tình huống</div><div class="tr-ctrl-b">${ctrlHTML}</div></div>` : ""}
        <div class="tr-mode" role="group" aria-label="Mức chi tiết"><span>Xem:</span><button data-m="brief"></button><button data-m="full"></button></div>
        <ol class="tr-phases" aria-label="Các giai đoạn"></ol>
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
        </div>
        <details class="tr-flow" open><summary></summary><div class="tr-flow-b"></div></details></div>`;

      const $ = (s) => el.querySelector(s);
      const stage = $(".tr-stage"), pk = $(".tr-packet"), wire = $(".tr-wire");
      const actorEl = (id) => el.querySelector(`.tr-actor[data-a="${id}"]`);

      const move = (s, animate) => {
        el.querySelectorAll(".tr-actor").forEach((a) => a.classList.remove("src", "dst", "busy"));
        if (!s) { pk.style.opacity = 0; wire.style.opacity = 0; return; }
        const to = dest(s);
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

      // Lịch sử luôn tính trên danh sách đầy đủ, kể cả khi đang xem tóm tắt
      const stateAt = (k) => {
        const end = k ? all.indexOf(steps[k - 1]) + 1 : 0;
        const from = k > 1 ? all.indexOf(steps[k - 2]) + 1 : 0;
        let cur = [], fresh = [];
        for (let i = 0; i < end; i++) {
          const s = all[i];
          if (s.state) { cur = s.state.slice(); if (i >= from) fresh = s.state.slice(); }
          if (s.push) { cur = cur.concat(s.push); if (i >= from) fresh = fresh.concat(s.push); }
        }
        return { cur, fresh };
      };

      const who = (a) => `<span class="ic">${a.icon}</span><span><b>${esc(a.name)}</b>${a.sub ? `<small>${esc(a.sub)}</small>` : ""}</span>`;
      const routeHTML = (s) => {
        const a = actor(s.from), b = actor(dest(s)), via = viaOf(s);
        if (s.from === dest(s)) return `<div class="tr-route self"><div class="tr-end">${who(a)}</div><div class="tr-via"><span>${via ? esc(via) : "tự xử lý bên trong, không gửi gì ra ngoài"}</span></div></div>`;
        return `<div class="tr-route"><div class="tr-end">${who(a)}</div><div class="tr-via"><span>${esc(via || "gửi cho")}</span></div><div class="tr-end">${who(b)}</div></div>`;
      };
      const short = (s) => {
        const a = actor(s.from), b = actor(dest(s));
        return s.from === dest(s) ? `${a.icon} ${esc(a.name)} tự xử lý` : `${a.icon} ${esc(a.name)} → ${b.icon} ${esc(b.name)}`;
      };

      // Các cách xem dữ liệu của một bước
      const viewsOf = (s) => {
        if (s.views) return s.views;
        if (s.payload === undefined && !s.payloads) return [];
        const main = { t: s.full ? "Phần chính" : "Dữ liệu", d: s.payload, parts: s.payloads, hl: s.hl, mark: s.mark, part: s.part, note: s.pnote, ttl: s.payloadTitle };
        return s.full ? [main, { t: "Bản đầy đủ", d: s.full, hl: s.fullHl || s.hl, note: s.fullNote }] : [main];
      };
      const dataHTML = (s) => {
        const vs = viewsOf(s);
        const self = s.from === dest(s);
        if (!vs.length) return `<div class="tr-pmeta">${short(s)}${viaOf(s) ? ` · <span>${esc(viaOf(s))}</span>` : ""}</div><p class="tr-hint">${s.nodata || "Bước này không có dữ liệu riêng."}</p>`;
        const i = Math.max(0, vs.findIndex((v) => v.t === pickedView));
        const v = vs[i];
        const blocks = v.parts ? v.parts.map((p) => `${p.t ? `<div class="tr-ptitle">${p.t}</div>` : ""}${code(p.d, p.hl || [], null, p.mark)}`).join("") : `${v.ttl ? `<div class="tr-ptitle">${v.ttl}</div>` : ""}${code(v.d, v.hl || s.hl || [], null, v.mark)}`;
        const fullAlt = vs.find((x, k) => k !== i && !x.part);
        const badge = v.part
          ? `<div class="tr-badge part"><b>✂️ Rút gọn.</b> ${v.part}${fullAlt ? ` Bấm “${esc(fullAlt.t)}” để xem bản đầy đủ.` : ""}</div>`
          : `<div class="tr-badge full"><b>✅ Đầy đủ.</b> ${v.note || (self ? "Đây là toàn bộ dữ liệu bên này đang xử lý ở bước này." : "Đây là toàn bộ dữ liệu được gửi ở bước này, không lược bớt.")}</div>`;
        const notePart = v.part && v.note ? `<p class="tr-hint">${v.note}</p>` : "";
        const sw = vs.length > 1 ? `<div class="tr-views" role="group" aria-label="Cách xem">${vs.map((x, k) => `<button data-v="${esc(x.t)}" class="${k === i ? "on" : ""}">${esc(x.t)}${x.part ? " <small>rút gọn</small>" : ""}</button>`).join("")}</div>` : "";
        const via = viaOf(s);
        return `<div class="tr-phead"><div class="tr-pmeta">${short(s)}${via ? ` · <span>${esc(via)}</span>` : ""}</div>${sw}${badge}</div>${notePart}${blocks}${/class="ln hl"/.test(blocks) ? `<p class="tr-hint tr-hl-hint">Dòng tô vàng là phần cần chú ý ở bước này.</p>` : ""}`;
      };

      const paneHTML = (s, t) => {
        if (t === "payload") return dataHTML(s);
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

      const flowHTML = () => {
        let out = "", ph = -1, hidden = 0;
        const flush = () => { if (hidden) out += `<li class="tr-gap">… ${hidden} bước phụ, xem ở chế độ Đầy đủ</li>`; hidden = 0; };
        all.forEach((s) => {
          if (s._ph !== ph) { flush(); if (ph >= 0) out += "</ol>"; ph = s._ph; out += `<div class="tr-flow-ph">Giai đoạn ${ph + 1} · ${esc(phases[ph])}</div><ol>`; }
          const k = steps.indexOf(s);
          if (k < 0) { hidden++; return; }
          flush();
          const via = viaOf(s);
          out += `<li data-k="${k + 1}" class="${k + 1 === n ? "on" : ""}"><span class="n">${k + 1}</span><span class="b"><span class="t">${strip(s.title)}</span><small>${short(s)}${via ? ` · ${esc(via)}` : ""}</small></span></li>`;
        });
        flush();
        return out + "</ol>";
      };

      const draw = (animate) => {
        const s = steps[n - 1];
        move(s, animate);
        // Thanh giai đoạn
        const cp = s ? s._ph : -1;
        $(".tr-phases").innerHTML = phases.length > 1 ? phases.map((p, k) => `<li class="${k === cp ? "on" : k < cp ? "done" : ""}" data-p="${k}"><span>${k + 1}</span>${esc(p)}</li>`).join("") : "";
        // Thẻ giải thích của bước
        if (s) {
          $(".tr-step").innerHTML = `<div class="tr-meta"><span class="tr-num">Bước ${n} / ${steps.length}</span>${phases.length > 1 ? `<span class="tr-phn">Giai đoạn ${cp + 1}: ${esc(phases[cp])}</span>` : ""}</div>
            ${routeHTML(s)}
            <h4 class="tr-title">${s.title}</h4>${s.desc ? `<p class="tr-desc">${s.desc}</p>` : ""}
            ${s.note ? `<div class="callout info"><b>Lưu ý.</b> ${s.note}</div>` : ""}${s.warn ? `<div class="callout danger"><b>Chỗ dễ sai.</b> ${s.warn}</div>` : ""}`;
        } else {
          $(".tr-step").innerHTML = `<h4 class="tr-title">${spec.start || "Bấm “Bước tiếp” để đi từng bước, hoặc “Tự chạy” để xem liền một mạch."}</h4>
            <p class="tr-desc">Mỗi bước ghi rõ <b>bên gửi → bên nhận</b> và <b>kênh truyền</b>. Tab “Dữ liệu” cho biết đó là bản <b>đầy đủ</b> hay <b>rút gọn</b>; bản rút gọn luôn có nút xem bản đầy đủ. Danh sách tất cả các bước nằm ở cuối mô phỏng.</p>`;
        }
        // Tab chi tiết
        const tabs = [];
        if (s && (viewsOf(s).length || s.nodata)) tabs.push(["payload", s.from === dest(s) ? "Dữ liệu đang xử lý" : "Dữ liệu gửi đi"]);
        if (s && s.fields) tabs.push(["fields", "Ý nghĩa các trường"]);
        if (s && s.backend) tabs.push(["backend", s.from === dest(s) ? "Đang làm gì" : "Bên nhận xử lý ra sao"]);
        if (s && spec.code && s.lines) tabs.push(["code", "Đoạn code tương ứng"]);
        if (s && spec.stateTitle) tabs.push(["state", spec.stateTitle]);
        tab = tabs.some(([k]) => k === picked) ? picked : tabs.length ? tabs[0][0] : null;
        $(".tr-details").style.display = tabs.length ? "" : "none";
        $(".tr-tabs").innerHTML = tabs.map(([k, l]) => `<button role="tab" class="${k === tab ? "on" : ""}" data-t="${k}">${l}</button>`).join("");
        const pane = $(".tr-pane");
        pane.innerHTML = s && tab ? paneHTML(s, tab) : "";
        pane.scrollTop = 0;
        el.querySelectorAll("[data-t]").forEach((b) => (b.onclick = () => { picked = b.dataset.t; draw(false); }));
        el.querySelectorAll("[data-v]").forEach((b) => (b.onclick = () => { pickedView = b.dataset.v; draw(false); }));
        const hl = pane.querySelector(".ln.hl");
        const head = pane.querySelector(".tr-phead");
        const off = head && getComputedStyle(head).position === "sticky" ? head.offsetHeight : 0;
        if (hl && (tab === "code" || (tab === "payload" && off)) && hl.offsetTop > pane.clientHeight - 60) pane.scrollTop = Math.max(0, hl.offsetTop - off - 70);
        // Danh sách quy trình
        $(".tr-flow summary").innerHTML = `Toàn bộ quy trình: ${steps.length} bước${phases.length > 1 ? `, ${phases.length} giai đoạn` : ""} <small>(bấm một bước để nhảy tới)</small>`;
        $(".tr-flow-b").innerHTML = flowHTML();
        el.querySelectorAll(".tr-flow [data-k]").forEach((li) => (li.onclick = () => { stop(); n = +li.dataset.k; draw(true); el.querySelector(".tr-step").scrollIntoView({ block: "nearest", behavior: "smooth" }); }));
        el.querySelectorAll(".tr-phases [data-p]").forEach((li) => (li.onclick = () => { stop(); const k = steps.findIndex((x) => x._ph >= +li.dataset.p); n = k < 0 ? steps.length : k + 1; draw(true); }));
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
      el.querySelectorAll("[data-m]").forEach((b) => (b.onclick = () => {
        brief = b.dataset.m === "brief";
        try { localStorage.setItem("ccaf-sim-mode", brief ? "brief" : "full"); } catch (e) {}
        stop(); steps = getSteps(); n = 0; draw(false);
      }));
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

  window.SIM = { trace, code, esc, http, claude, pretty, net, cc };
})();
