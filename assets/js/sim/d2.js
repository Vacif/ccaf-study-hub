/* Mô phỏng chi tiết — Chương 2: Tool Design & MCP Integration */
(function () {
  const { trace, code, esc } = window.SIM;
  const W = window.WIDGETS;
  const J = (o) => JSON.stringify(o);

  /* ───────── 2-1 Claude chọn công cụ dựa vào description ───────── */
  W.toolSelectTrace = {
    title: "Claude chọn công cụ thế nào? Mô tả mơ hồ vs rõ ràng",
    render: trace({
      intro: "Claude không đọc code công cụ của bạn. Thứ duy nhất nó biết là <code>name</code>, <code>description</code> và <code>input_schema</code> trong request.",
      actors: [
        { id: "u", icon: "👤", name: "Khách" },
        { id: "b", icon: "🖥️", name: "Backend" },
        { id: "c", icon: "🧠", name: "Claude" },
        { id: "t", icon: "🗄️", name: "CRM / Orders" },
      ],
      stateTitle: "⏱️ Chi phí của lựa chọn",
      controls: [{ id: "d", type: "select", label: "Description:", value: "vague", options: [["vague", "😶 Tối giản"], ["clear", "📝 Rõ ràng, có ranh giới"]] }],
      steps: ({ d }) => {
        const vague = d === "vague";
        const tools = vague
          ? [{ name: "get_customer", description: "Lấy thông tin khách hàng.", input_schema: { type: "object", properties: { query: { type: "string" } } } }, { name: "lookup_order", description: "Lấy thông tin đơn.", input_schema: { type: "object", properties: { query: { type: "string" } } } }]
          : [{ name: "get_customer", description: "Tra HỒ SƠ khách (tên, email, hạng) bằng email hoặc customer_id. Dùng để xác minh danh tính. KHÔNG trả trạng thái đơn/vận chuyển — dùng lookup_order cho việc đó.", input_schema: { type: "object", properties: { email: { type: "string", description: "Email đăng ký" }, customer_id: { type: "string", description: "Dạng C-123" } } } }, { name: "lookup_order", description: "Tra MỘT đơn bằng order_id (số sau dấu #, ví dụ #1234 → \"1234\"): trạng thái, vị trí vận chuyển, ngày giao dự kiến, số tiền. Dùng cho câu hỏi “đơn của tôi đâu”, “bao giờ giao”.", input_schema: { type: "object", properties: { order_id: { type: "string", description: "Chỉ chữ số, bỏ dấu #" } }, required: ["order_id"] } }];
        const s = [];
        s.push({ from: "u", to: "b", kind: "req", label: "💬", title: "Câu hỏi của khách", payload: { text: "Đơn #1234 của tôi giờ đang ở đâu vậy?" }, state: [] });
        s.push({ from: "b", to: "c", kind: "req", label: "📤 tools", title: "Định nghĩa công cụ gửi kèm request", payload: { tools }, hl: ["description"], fields: [["description", vague ? "“Lấy thông tin khách hàng” vs “Lấy thông tin đơn” — đơn cũng là một phần “thông tin khách”, ranh giới mờ." : "Nêu rõ dùng khi nào, KHÔNG dùng khi nào, định dạng đầu vào."], ["input_schema", vague ? "Tham số chung chung <code>query</code> — không gợi ý dạng dữ liệu." : "Tham số có tên và mô tả riêng — Claude biết bỏ dấu #."]] });
        s.push({ from: "c", to: "c", kind: "internal", title: "Claude so khớp câu hỏi với mô tả", desc: vague ? "“đơn của tôi” liên quan tới khách hàng… cả hai mô tả đều khớp mơ hồ. Lựa chọn trở nên ngẫu nhiên giữa các lần chạy." : "“đang ở đâu” khớp trực tiếp với “vị trí vận chuyển” của lookup_order; get_customer nói rõ không trả trạng thái đơn." });
        if (vague) {
          s.push({ from: "c", to: "b", kind: "err", label: "📥 get_customer", title: "Chọn nhầm công cụ", payload: { type: "tool_use", name: "get_customer", input: { query: "#1234" } }, push: [{ r: "err", t: "Lượt 1: get_customer — sai công cụ" }] });
          s.push({ from: "b", to: "t", kind: "req", label: "🔎", title: "Backend chạy get_customer", payload: { query: "#1234" } });
          s.push({ from: "t", to: "b", kind: "res", label: "👤 hồ sơ", title: "Trả hồ sơ khách — không có vị trí đơn", payload: { name: "Trần Lan", tier: "gold" } });
          s.push({ from: "c", to: "b", kind: "warn", label: "📥 lookup_order", title: "Mất thêm một lượt để sửa sai", payload: { type: "tool_use", name: "lookup_order", input: { query: "#1234" } }, push: [{ r: "note", t: "Lượt 2: lookup_order (đầu vào còn dấu #)" }], warn: "Thêm độ trễ + token; ở ca khác Claude có thể trả lời luôn bằng dữ liệu sai." });
        } else {
          s.push({ from: "c", to: "b", kind: "ok", label: "📥 lookup_order", title: "Chọn đúng ngay lượt đầu, đầu vào đúng định dạng", payload: { type: "tool_use", name: "lookup_order", input: { order_id: "1234" } }, push: [{ r: "ok", t: "Lượt 1: lookup_order(\"1234\") — đúng" }] });
        }
        s.push({ from: "t", to: "c", kind: "ok", label: "📦 đơn", title: "Có dữ liệu cần thiết", payload: { status: "in_transit", location: "Bưu cục Q.3", eta: "2026-10-30" } });
        return s;
      },
    }),
  };

  /* ───────── 2-2 Lỗi có cấu trúc qua MCP ───────── */
  const CATS = {
    transient: {
      label: "⏱️ Transient (timeout)", input: { order_id: "1234" },
      server: ["Gọi DB kho với timeout 5s → hết giờ.", "Đây là lỗi <b>tạm thời</b>: gọi lại sau ít giây có thể thành công."],
      body: { errorCategory: "transient", isRetryable: true, retryAfterMs: 2000, message: "Kho dữ liệu đơn hàng không phản hồi sau 5s." },
      next: { type: "tool_use", name: "mcp__orders__lookup_order", input: { order_id: "1234" } }, nextDesc: "Claude thử lại (có giới hạn số lần). Nếu vẫn lỗi: báo coordinator/khách kèm kết quả một phần.",
    },
    validation: {
      label: "🧾 Validation (đầu vào sai)", input: { order_id: "abc" },
      server: ["Kiểm tra định dạng: order_id phải là 4–8 chữ số.", "Lỗi do <b>đầu vào</b> → gọi lại y nguyên sẽ lỗi tiếp; phải sửa tham số."],
      body: { errorCategory: "validation", isRetryable: true, field: "order_id", expected: "4–8 chữ số, ví dụ 1234", received: "abc", message: "order_id không hợp lệ." },
      next: { type: "text", text: "Mã đơn “abc” có vẻ chưa đúng. Bạn kiểm tra lại giúp mình mã gồm 4–8 chữ số trong email xác nhận nhé?" }, nextDesc: "Claude hỏi lại người dùng để sửa đầu vào thay vì lặp lại lệnh lỗi.",
    },
    business: {
      label: "📜 Business (vi phạm chính sách)", input: { order_id: "1234" },
      server: ["Đơn giao cách đây 97 ngày; chính sách hoàn tiền 90 ngày.", "Không phải lỗi kỹ thuật — <b>thử lại vô ích</b>."],
      body: { errorCategory: "business", isRetryable: false, rule: "refund_window_90_days", days_since_delivery: 97, message: "Đơn đã quá hạn hoàn tiền 90 ngày.", customer_facing: "Đơn #1234 đã quá thời hạn hoàn tiền 90 ngày." },
      next: { type: "text", text: "Rất tiếc, đơn #1234 đã quá hạn hoàn tiền 90 ngày (giao 97 ngày trước). Mình có thể hỗ trợ bảo hành hoặc chuyển bạn tới bộ phận chăm sóc đặc biệt." }, nextDesc: "Claude giải thích chính sách bằng thông điệp thân thiện, đề xuất phương án khác. Không retry.",
    },
    permission: {
      label: "🔒 Permission (không đủ quyền)", input: { order_id: "B2B-7781" },
      server: ["Đơn thuộc tài khoản doanh nghiệp; token của agent chỉ có quyền khách lẻ.", "Agent không tự vượt quyền được → cần người có thẩm quyền."],
      body: { errorCategory: "permission", isRetryable: false, required_role: "b2b_support", message: "Agent không có quyền xem đơn doanh nghiệp." },
      next: { type: "tool_use", name: "escalate_to_human", input: { queue: "b2b_support", order_id: "B2B-7781", summary: "Khách hỏi trạng thái đơn B2B, agent không đủ quyền truy cập." } }, nextDesc: "Claude escalate tới đúng hàng đợi kèm tóm tắt.",
    },
    empty: {
      label: "∅ Không có kết quả (hợp lệ)", input: { email: "lan@example.com" },
      server: ["Truy vấn chạy thành công.", "Không có đơn nào khớp email này — đây là <b>dữ liệu</b>, không phải lỗi."],
      ok: { orders: [], searched_by: "email", note: "Truy vấn thành công, không có đơn khớp." },
      next: { type: "text", text: "Mình không thấy đơn nào gắn với lan@example.com. Có thể bạn đặt bằng email khác hoặc số điện thoại?" }, nextDesc: "Claude kết luận đúng “không có đơn” — không thử lại, không escalate.",
    },
    protocol: {
      label: "🧨 Lỗi giao thức (JSON-RPC)", input: { order_id: "1234" }, tool: "lookup_ordr",
      server: ["Server không có công cụ tên <code>lookup_ordr</code> (danh sách công cụ của client đã cũ sau khi server đổi tên).", "Lỗi ở tầng <b>giao thức</b>, xảy ra trước khi chạy logic công cụ."],
      rpcError: { code: -32602, message: "Unknown tool: lookup_ordr" },
      next: { type: "text", text: "(Claude nhận tool_result lỗi chung chung, không phân loại được → có thể lặp lại hoặc bỏ cuộc.)" }, nextDesc: "Client chuyển lỗi giao thức thành tool_result lỗi. Cách sửa thực sự nằm ở hạ tầng: server gửi <code>notifications/tools/list_changed</code>, client gọi lại <code>tools/list</code>.",
    },
  };
  W.errorBuilder = {
    title: "Phản hồi lỗi MCP — từ tools/call tới quyết định tiếp theo của Claude",
    render: trace({
      intro: "Cùng một lệnh <code>lookup_order</code>, sáu kết cục khác nhau. Chú ý cách <b>lỗi thực thi công cụ</b> (<code>result.isError</code>) khác <b>lỗi giao thức</b> (<code>error</code> của JSON-RPC), và Claude phản ứng ra sao với từng loại.",
      actors: [
        { id: "c", icon: "🧠", name: "Claude" },
        { id: "h", icon: "🖥️", name: "MCP client", sub: "Claude Code / SDK" },
        { id: "s", icon: "🔌", name: "MCP server", sub: "orders" },
        { id: "d", icon: "🗄️", name: "Kho dữ liệu" },
      ],
      controls: [{ id: "k", type: "select", label: "Tình huống:", value: "transient", options: Object.entries(CATS).map(([k, v]) => [k, v.label]) }],
      steps: ({ k }) => {
        const c = CATS[k], tool = c.tool || "lookup_order";
        const s = [];
        s.push({ from: "c", to: "h", kind: "res", label: "📥 tool_use", title: "Claude yêu cầu tra đơn", payload: { type: "tool_use", id: "toolu_21", name: "mcp__orders__" + tool, input: c.input }, hl: ["name", "input"] });
        s.push({ from: "h", to: "s", kind: "req", label: "📤 tools/call", title: "Client chuyển thành JSON-RPC tools/call", sub: "stdio / HTTP", payload: { jsonrpc: "2.0", id: 42, method: "tools/call", params: { name: tool, arguments: c.input } }, hl: ["method", "name", "arguments"], fields: [["jsonrpc / id", "Chuẩn JSON-RPC 2.0; <code>id</code> để ghép response."], ["method: tools/call", "Gọi công cụ. (tools/list để liệt kê, resources/read để đọc tài nguyên.)"], ["params.name", "Tên gốc trên server — tiền tố <code>mcp__orders__</code> chỉ có ở phía client."], ["params.arguments", "Đúng là <code>tool_use.input</code> của Claude."]] });
        if (!c.rpcError) s.push({ from: "s", to: "d", kind: "req", label: "🔎 truy vấn", title: "Server chạy logic công cụ", backend: c.server });
        else s.push({ from: "s", to: "s", kind: "err", title: "Server không tìm thấy công cụ", backend: c.server });
        if (c.rpcError) {
          s.push({ from: "s", to: "h", kind: "err", label: "🧨 error", title: "Response là JSON-RPC error (không có result)", payload: { jsonrpc: "2.0", id: 42, error: c.rpcError }, hl: ["error", "code"], fields: [["error.code -32602", "Invalid params / công cụ không tồn tại — lỗi tầng giao thức."], ["(không có isError)", "Không mang errorCategory/isRetryable → model khó tự phục hồi."]] });
        } else if (c.ok) {
          s.push({ from: "d", to: "s", kind: "res", label: "∅ 0 dòng", title: "Kho trả 0 bản ghi", payload: { rows: [] } });
          s.push({ from: "s", to: "h", kind: "ok", label: "✅ result", title: "Thành công với danh sách rỗng — isError: false", payload: { jsonrpc: "2.0", id: 42, result: { content: [{ type: "text", text: J(c.ok) }], isError: false } }, hl: ["isError", "note"], note: "Rỗng hợp lệ phải nói rõ “truy vấn thành công”. Đừng dùng cùng một hình dạng cho timeout và cho rỗng." });
        } else {
          s.push({ from: "d", to: "s", kind: "err", label: "⚠️", title: "Phát hiện lỗi", payload: k === "transient" ? "ETIMEDOUT after 5000ms" : c.body.message });
          s.push({
            from: "s", to: "h", kind: "err", label: "📥 isError", title: "Lỗi thực thi công cụ: result.isError = true + metadata",
            payload: { jsonrpc: "2.0", id: 42, result: { content: [{ type: "text", text: J(c.body) }], isError: true } },
            hl: ["isError", "errorCategory", "isRetryable"],
            fields: [["result.isError", "Công cụ chạy nhưng thất bại — <b>model nhìn thấy</b> nội dung lỗi để tự xử lý."], ["errorCategory", "transient / validation / business / permission — quyết định chiến lược phục hồi."], ["isRetryable", "Gợi ý có nên gọi lại không."], ["message / customer_facing", "Mô tả cho model và (nếu có) câu thân thiện để nói với khách."]],
          });
        }
        s.push({
          from: "h", to: "c", kind: c.ok ? "res" : "err", label: "📤 tool_result", title: "Client chuyển kết quả thành tool_result cho Claude",
          payload: { type: "tool_result", tool_use_id: "toolu_21", is_error: !c.ok, content: c.rpcError ? "MCP error -32602: Unknown tool: lookup_ordr" : J(c.ok || c.body) },
          hl: ["is_error"],
        });
        s.push({ from: "c", to: "c", kind: c.ok || k === "business" || k === "validation" ? "ok" : "warn", title: "Claude quyết định bước tiếp theo", desc: c.nextDesc, payload: c.next });
        return s;
      },
    }),
  };

  /* ───────── 2-3 tool_choice: request & response thật ───────── */
  W.toolChoice = {
    title: "tool_choice — cùng một request, bốn hành vi",
    render(el) {
      const tools = ["extract_invoice", "extract_receipt", "extract_metadata"];
      const inv = { vendor: "Công ty X", invoice_no: "INV-889", total: 1240, currency: "USD", issued: "2026-03-15" };
      const M = {
        auto: { cfg: { type: "auto" }, resp: { content: [{ type: "text", text: "Đây là hóa đơn INV-889 của Công ty X, tổng 1.240 USD, ngày 15/03/2026." }], stop_reason: "end_turn" }, notes: ["Mặc định khi có tools.", "Claude <b>có thể</b> gọi công cụ hoặc trả lời text → không đảm bảo có JSON.", "Có thể kèm text giải thích trước khối tool_use."], ok: false },
        any: { cfg: { type: "any" }, resp: { content: [{ type: "tool_use", id: "toolu_31", name: "extract_invoice", input: inv }], stop_reason: "tool_use" }, notes: ["<b>Bắt buộc</b> gọi một công cụ; Claude tự chọn công cụ hợp loại tài liệu.", "Không có text đứng trước tool_use (API ép phần mở đầu của câu trả lời là tool_use).", "Dùng khi có nhiều schema và chưa biết trước loại tài liệu."], ok: true },
        tool: { cfg: { type: "tool", name: "extract_metadata" }, resp: { content: [{ type: "tool_use", id: "toolu_32", name: "extract_metadata", input: { doc_type: "invoice", language: "vi", pages: 1 } }], stop_reason: "tool_use" }, notes: ["<b>Bắt buộc</b> gọi đúng công cụ đã nêu.", "Dùng để ép thứ tự: luôn trích metadata trước rồi mới tới bước khác.", "Hoặc khi chỉ có một schema đầu ra."], ok: true },
        none: { cfg: { type: "none" }, resp: { content: [{ type: "text", text: "Tài liệu là một hóa đơn bán hàng…" }], stop_reason: "end_turn" }, notes: ["Cấm gọi công cụ dù tools vẫn được gửi (giữ nguyên prompt cache).", "Dùng cho lượt chỉ cần tóm tắt/giải thích."], ok: false },
      };
      let cur = "auto", par = false;
      const draw = () => {
        const m = M[cur];
        const cfg = Object.assign({}, m.cfg, par && cur !== "none" ? { disable_parallel_tool_use: true } : {});
        el.innerHTML = `<p class="small muted" style="margin-top:0">Công cụ: ${tools.map((t) => `<code>${t}</code>`).join(", ")} · Input: ảnh một hóa đơn.</p>
          <div class="compare-tabs">${Object.keys(M).map((k) => `<button class="${k === cur ? "on" : ""}" data-k="${k}">${k}</button>`).join("")}</div>
          <label class="toggle"><input type="checkbox" id="par" ${par ? "checked" : ""}> disable_parallel_tool_use</label>
          <div class="grid grid-2" style="margin-top:8px"><div><div class="tr-ptitle">📤 Request (trích)</div>${code({ model: "claude-sonnet-5-5", max_tokens: 1024, tools: tools.map((n) => ({ name: n, description: "…", input_schema: "{…}" })), tool_choice: cfg, messages: [{ role: "user", content: [{ type: "image", source: "{…}" }, { type: "text", text: "Trích xuất tài liệu này." }] }] }, ["tool_choice", "type", "name", "disable_parallel_tool_use"])}</div>
          <div><div class="tr-ptitle">📥 Response</div>${code(m.resp, ["stop_reason", "type"])}</div></div>
          <div class="msg ${m.ok ? "tool" : "system"}"><span class="who">Hành vi</span><ul style="margin:4px 0 0;padding-left:18px">${m.notes.map((n) => `<li>${n}</li>`).join("")}</ul></div>
          <div class="callout warn">⚠️ Với extended thinking chỉ dùng được <code>auto</code> hoặc <code>none</code>; <code>any</code>/<code>tool</code> sẽ bị từ chối.</div>`;
        el.querySelectorAll("[data-k]").forEach((b) => (b.onclick = () => { cur = b.dataset.k; draw(); }));
        el.querySelector("#par").onchange = (e) => { par = e.target.checked; draw(); };
      };
      draw();
    },
  };

  /* ───────── 2-4 Vòng đời MCP server ───────── */
  W.mcpLifecycle = {
    title: "Vòng đời MCP: từ .mcp.json tới tool_result",
    render: trace({
      intro: "Claude Code là <b>MCP host/client</b>; mỗi server là một tiến trình (stdio) hoặc endpoint HTTP. Mọi trao đổi là <b>JSON-RPC 2.0</b>.",
      actors: [
        { id: "h", icon: "🧑‍💻", name: "Claude Code", sub: "MCP client" },
        { id: "s", icon: "🔌", name: "MCP server", sub: "github (stdio)" },
        { id: "g", icon: "🐙", name: "GitHub API" },
        { id: "c", icon: "🧠", name: "Claude", sub: "model" },
      ],
      stateTitle: "🧰 Công cụ model nhìn thấy",
      controls: [{ id: "tok", type: "toggle", label: "Biến môi trường <code>GITHUB_TOKEN</code> đã được đặt", value: true }],
      steps: ({ tok }) => {
        const s = [];
        s.push({
          from: "h", to: "h", kind: "internal", title: "Đọc .mcp.json và mở rộng biến môi trường",
          payloads: [{ t: ".mcp.json (commit trong repo)", d: { mcpServers: { github: { command: "npx", args: ["-y", "@modelcontextprotocol/server-github"], env: { GITHUB_TOKEN: "${GITHUB_TOKEN}" } } } }, hl: ["GITHUB_TOKEN"] }],
          backend: ["Gộp cấu hình theo phạm vi: local / project (.mcp.json) / user (~/.claude.json).", "Server project-scope lần đầu → hỏi người dùng có tin cậy không.", tok ? "<code>${GITHUB_TOKEN}</code> → giá trị trong shell của từng dev. Có thể đặt mặc định: <code>${VAR:-default}</code>." : "<b>Không có GITHUB_TOKEN</b> → cấu hình báo thiếu biến môi trường."],
          warn: tok ? null : "Lỗi nằm ở môi trường của dev, không phải ở repo. Sửa: export GITHUB_TOKEN (hoặc dùng trình quản lý secret), KHÔNG dán token vào .mcp.json.",
          state: [{ r: "sys", t: "Read, Edit, Grep, Glob, Bash… (tích hợp sẵn)" }],
        });
        if (!tok) {
          s.push({ from: "h", to: "c", kind: "err", label: "⚠️ thiếu tool", title: "Model không có công cụ GitHub", desc: "Server không khởi động → model chỉ thấy công cụ tích hợp sẵn. Nếu người dùng yêu cầu tạo issue, Claude sẽ báo không có công cụ hoặc thử đường vòng (ví dụ gợi ý lệnh gh)." });
          return s;
        }
        s.push({ from: "h", to: "s", kind: "req", label: "🚀 spawn", title: "Khởi chạy tiến trình server (transport stdio)", payload: "$ npx -y @modelcontextprotocol/server-github\n  env: GITHUB_TOKEN=ghp_•••• (từ shell của dev)\n  stdin/stdout: các message JSON-RPC, mỗi message một dòng", note: "Với server từ xa: transport HTTP (Streamable HTTP) và xác thực OAuth thay cho biến môi trường." });
        s.push({ from: "h", to: "s", kind: "req", label: "🤝 initialize", title: "Bắt tay: client gửi initialize", payload: { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: { roots: { listChanged: true } }, clientInfo: { name: "claude-code", version: "2.x" } } }, hl: ["protocolVersion", "capabilities"], fields: [["protocolVersion", "Phiên bản giao thức client hỗ trợ; hai bên thương lượng."], ["capabilities", "Client khai báo khả năng của mình (roots, sampling, elicitation…)."]] });
        s.push({ from: "s", to: "h", kind: "res", label: "🤝 capabilities", title: "Server khai báo khả năng", payload: { jsonrpc: "2.0", id: 1, result: { protocolVersion: "2025-06-18", capabilities: { tools: { listChanged: true }, resources: { subscribe: false } }, serverInfo: { name: "github", version: "1.4.0" } } }, hl: ["tools", "resources"], fields: [["capabilities.tools", "Server có công cụ (hành động)."], ["capabilities.resources", "Server có tài nguyên (nội dung đọc được: file, schema, danh mục)."], ["listChanged", "Server sẽ báo khi danh sách công cụ thay đổi."]] });
        s.push({ from: "h", to: "s", kind: "req", label: "📣 initialized", title: "Client xác nhận sẵn sàng (notification, không có id)", payload: { jsonrpc: "2.0", method: "notifications/initialized" } });
        s.push({ from: "h", to: "s", kind: "req", label: "📋 tools/list", title: "Hỏi danh sách công cụ", payload: { jsonrpc: "2.0", id: 2, method: "tools/list" } });
        s.push({ from: "s", to: "h", kind: "res", label: "📋 tools", title: "Server trả định nghĩa công cụ", payload: { jsonrpc: "2.0", id: 2, result: { tools: [{ name: "create_issue", description: "Tạo issue trong repo. Cần owner, repo, title.", inputSchema: { type: "object", properties: { owner: { type: "string" }, repo: { type: "string" }, title: { type: "string" }, body: { type: "string" } }, required: ["owner", "repo", "title"] } }, { name: "search_issues", description: "Tìm issue theo truy vấn GitHub search.", inputSchema: "{…}" }] } }, hl: ["name", "description", "inputSchema"], note: "Đây là lúc chất lượng <b>description</b> của server quyết định Claude có chọn đúng công cụ hay không." });
        s.push({ from: "h", to: "h", kind: "internal", title: "Đăng ký công cụ với tên có tiền tố", backend: ["<code>create_issue</code> → <code>mcp__github__create_issue</code> (tránh trùng tên giữa các server).", "Gộp vào danh sách công cụ gửi cho model cùng các công cụ tích hợp sẵn.", "Có thể gọi thêm <code>resources/list</code> để biết danh mục tài nguyên mà không cần công cụ khám phá."], push: [{ r: "ok", t: "<b>mcp__github__create_issue</b>" }, { r: "ok", t: "<b>mcp__github__search_issues</b>" }] });
        s.push({ from: "h", to: "c", kind: "req", label: "📤 request", title: "Model nhận công cụ MCP như mọi công cụ khác", payload: { tools: [{ name: "Read", description: "…" }, "…", { name: "mcp__github__create_issue", description: "Tạo issue trong repo. Cần owner, repo, title.", input_schema: "{…}" }], messages: [{ role: "user", content: "Tạo issue: nút Thanh toán bị lệch trên Safari" }] }, hl: ["mcp__github__create_issue"] });
        s.push({ from: "c", to: "h", kind: "res", label: "📥 tool_use", title: "Claude gọi công cụ MCP", payload: { type: "tool_use", id: "toolu_41", name: "mcp__github__create_issue", input: { owner: "acme", repo: "web", title: "Nút Thanh toán bị lệch trên Safari", body: "Tái hiện: Safari 18, trang /checkout…" } } });
        s.push({ from: "h", to: "h", kind: "internal", title: "Kiểm tra quyền", backend: ["Công cụ có trong allow-list (<code>permissions.allow: [\"mcp__github__create_issue\"]</code>)? → chạy luôn.", "Không có → hỏi người dùng (hoặc bị chặn trong chế độ không tương tác).", "Hook PreToolUse (nếu có) chạy ở đây."] });
        s.push({ from: "h", to: "s", kind: "req", label: "📤 tools/call", title: "Gửi tools/call", payload: { jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "create_issue", arguments: { owner: "acme", repo: "web", title: "Nút Thanh toán bị lệch trên Safari", body: "…" } } }, hl: ["name"] });
        s.push({ from: "s", to: "g", kind: "req", label: "🌐 REST", title: "Server gọi GitHub bằng token của dev", sub: "POST /repos/acme/web/issues", payload: "POST https://api.github.com/repos/acme/web/issues\nAuthorization: Bearer ghp_••••\n{\"title\":\"Nút Thanh toán bị lệch trên Safari\",\"body\":\"…\"}", note: "Token chỉ tồn tại trong tiến trình server — model không bao giờ nhìn thấy nó." });
        s.push({ from: "g", to: "s", kind: "res", label: "✅ 201", title: "GitHub tạo issue", payload: { number: 482, html_url: "https://github.com/acme/web/issues/482", state: "open" } });
        s.push({ from: "s", to: "h", kind: "res", label: "📥 result", title: "Server trả result", payload: { jsonrpc: "2.0", id: 3, result: { content: [{ type: "text", text: "Đã tạo issue #482: https://github.com/acme/web/issues/482" }], isError: false } } });
        s.push({ from: "h", to: "c", kind: "ok", label: "📤 tool_result", title: "Claude nhận tool_result và trả lời", payload: { type: "tool_result", tool_use_id: "toolu_41", content: "Đã tạo issue #482: https://github.com/acme/web/issues/482" } });
        return s;
      },
    }),
  };

  /* ───────── 2-5 Công cụ tích hợp sẵn: khám phá tăng dần ───────── */
  W.builtinTrace = {
    title: "Khám phá tăng dần: Grep → Read → Edit (kèm lỗi neo không duy nhất)",
    render: trace({
      intro: "Nhiệm vụ: “Thêm retry cho mọi nơi gọi <code>processPayment()</code>”. Xem Claude dùng công cụ nào, tham số gì, và nhận lại gì.",
      actors: [
        { id: "c", icon: "🧠", name: "Claude" },
        { id: "h", icon: "🖥️", name: "Claude Code", sub: "chạy công cụ" },
        { id: "f", icon: "📁", name: "Repo", sub: "file system" },
      ],
      stateTitle: "🗂️ Ngữ cảnh đã nạp",
      steps: [
        { from: "c", to: "h", kind: "res", label: "🔍 Grep", title: "Tìm theo NỘI DUNG — Grep", payload: { name: "Grep", input: { pattern: "processPayment\\(", output_mode: "files_with_matches", type: "ts" } }, fields: [["pattern", "Regex (ripgrep) tìm bên trong file."], ["output_mode", "<code>files_with_matches</code> chỉ trả đường dẫn — rẻ ngữ cảnh; <code>content</code> trả dòng khớp."], ["type / glob", "Lọc loại file để giảm nhiễu."]], note: "Không đọc cả repo trước. Bắt đầu từ điểm vào hẹp nhất." },
        { from: "f", to: "c", kind: "res", label: "📄 3 file", title: "Kết quả gọn: 3 đường dẫn", payload: "src/checkout/service.ts\nsrc/subscriptions/renew.ts\nsrc/admin/manual-charge.ts", push: [{ r: "tool", t: "Grep → 3 file gọi processPayment" }] },
        { from: "c", to: "h", kind: "res", label: "📖 Read", title: "Đọc file đầu tiên", payload: { name: "Read", input: { file_path: "/repo/src/checkout/service.ts" } }, fields: [["file_path", "Đường dẫn tuyệt đối."], ["offset / limit", "Đọc một phần file lớn."]] },
        { from: "f", to: "c", kind: "res", label: "📄 nội dung", title: "Nội dung có số dòng", payload: "  1  import { processPayment } from \"../payments/gateway\";\n 18  const res = await processPayment(order.total, card);\n 19  if (!res.ok) {\n 20    return null;\n 21  }\n 42  if (!refund.ok) {\n 43    return null;\n 44  }", push: [{ r: "tool", t: "Read service.ts (đã đọc → được phép Edit)" }] },
        { from: "c", to: "h", kind: "res", label: "📖 Read", title: "Lần theo import tới định nghĩa", payload: { name: "Read", input: { file_path: "/repo/src/payments/gateway.ts" } }, desc: "Theo dấu import thay vì Glob cả thư mục: biết processPayment có ném lỗi mạng hay trả <code>{ok:false}</code> — quyết định cách viết retry.", push: [{ r: "tool", t: "Read gateway.ts → lỗi mạng ném NetworkError" }] },
        { from: "c", to: "h", kind: "res", label: "✏️ Edit", title: "Edit với neo quá ngắn", payload: { name: "Edit", input: { file_path: "/repo/src/checkout/service.ts", old_string: "return null;", new_string: "throw new PaymentFailed(res.error);" } }, hl: ["old_string"], fields: [["old_string", "Đoạn văn bản neo — phải xuất hiện <b>đúng một lần</b> (trừ khi replace_all)."], ["new_string", "Nội dung thay thế."], ["replace_all", "true → thay mọi chỗ khớp (dùng cho đổi tên)."]] },
        { from: "h", to: "c", kind: "err", label: "❌ lỗi", title: "Edit thất bại: neo xuất hiện nhiều lần", payload: "Found 2 matches of the string to replace, but replace_all is false. To replace all occurrences, set replace_all to true. To replace only one occurrence, please provide more context to uniquely identify the instance.", warn: "Gọi lại Edit y nguyên sẽ lỗi mãi. Cũng đừng bật replace_all ở đây — dòng 43 thuộc nhánh refund, không được đổi." },
        { from: "c", to: "h", kind: "res", label: "✏️ Edit", title: "Mở rộng neo cho duy nhất", payload: { name: "Edit", input: { file_path: "/repo/src/checkout/service.ts", old_string: "if (!res.ok) {\n    return null;", new_string: "if (!res.ok) {\n    throw new PaymentFailed(res.error);" } }, hl: ["old_string"], note: "Neo kèm dòng ngữ cảnh phía trên → chỉ khớp một chỗ. Nếu file nhiều chỗ giống hệt nhau khó phân biệt: Read toàn bộ rồi Write lại." },
        { from: "f", to: "c", kind: "ok", label: "✅ đã sửa", title: "Edit thành công", payload: "The file /repo/src/checkout/service.ts has been updated.", push: [{ r: "ok", t: "Edit service.ts (dòng 20)" }] },
        { from: "c", to: "h", kind: "res", label: "▶️ Bash", title: "Chạy test để kiểm chứng", payload: { name: "Bash", input: { command: "npm test -- checkout", description: "Chạy test module checkout" } } },
        { from: "f", to: "c", kind: "ok", label: "✅ pass", title: "Test pass", payload: "PASS src/checkout/service.test.ts (12 tests)", push: [{ r: "ok", t: "Bash npm test → 12 pass" }] },
      ],
    }),
  };
})();
