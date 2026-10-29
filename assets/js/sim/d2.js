/* Mô phỏng chi tiết — Chương 2: Tool Design & MCP Integration */
(function () {
  const { trace, code } = window.SIM;
  const W = window.WIDGETS;
  const J = (o) => JSON.stringify(o);

  /* ───────── 2-1 Claude chọn công cụ dựa vào mô tả ───────── */
  W.toolSelectTrace = {
    title: "Claude chọn công cụ thế nào: mô tả sơ sài và mô tả rõ ràng",
    render: trace({
      intro: "Claude không đọc được code bên trong công cụ của bạn. Nó chỉ biết <b>tên</b>, <b>đoạn mô tả</b> và <b>danh sách tham số</b>. Đổi qua lại giữa hai kiểu mô tả để thấy lựa chọn của Claude thay đổi thế nào.",
      actors: [
        { id: "u", icon: "👤", name: "Khách" },
        { id: "b", icon: "🖥️", name: "Backend" },
        { id: "c", icon: "🧠", name: "Claude" },
        { id: "t", icon: "🗄️", name: "Hệ thống nội bộ" },
      ],
      stateTitle: "Số lượt đã tốn",
      controls: [{ id: "d", type: "select", label: "Kiểu mô tả công cụ:", value: "vague", options: [["vague", "Sơ sài"], ["clear", "Rõ ràng, nêu ranh giới"]] }],
      steps: ({ d }) => {
        const vague = d === "vague";
        const tools = vague
          ? [{ name: "get_customer", description: "Lấy thông tin khách hàng.", input_schema: { type: "object", properties: { query: { type: "string" } } } }, { name: "lookup_order", description: "Lấy thông tin đơn.", input_schema: { type: "object", properties: { query: { type: "string" } } } }]
          : [{ name: "get_customer", description: "Tra HỒ SƠ khách (tên, email, hạng) bằng email hoặc mã khách. Dùng để xác minh danh tính. KHÔNG trả trạng thái đơn hay vận chuyển; việc đó dùng lookup_order.", input_schema: { type: "object", properties: { email: { type: "string", description: "Email đăng ký" }, customer_id: { type: "string", description: "Dạng C-123" } } } }, { name: "lookup_order", description: "Tra MỘT đơn bằng mã đơn (phần số sau dấu #, ví dụ #1234 thì nhập \"1234\"): trạng thái, vị trí vận chuyển, ngày giao dự kiến, số tiền. Dùng khi khách hỏi đơn đang ở đâu, bao giờ giao.", input_schema: { type: "object", properties: { order_id: { type: "string", description: "Chỉ gồm chữ số, bỏ dấu #" } }, required: ["order_id"] } }];
        const s = [];
        s.push({ from: "u", to: "b", kind: "req", label: "câu hỏi", title: "Khách hỏi đơn hàng đang ở đâu", desc: "Đây là câu hỏi về vận chuyển, nên công cụ đúng là <code>lookup_order</code>.", payload: { text: "Đơn #1234 của tôi giờ đang ở đâu vậy?" }, state: [] });
        s.push({ from: "b", to: "c", kind: "req", label: "danh sách công cụ", title: "Backend gửi câu hỏi kèm danh sách công cụ", desc: vague ? "Hai mô tả “Lấy thông tin khách hàng” và “Lấy thông tin đơn” na ná nhau, vì đơn hàng cũng là một phần “thông tin khách”. Tham số đều tên chung chung là <code>query</code>." : "Mỗi mô tả nói rõ công cụ làm gì, dùng khi nào và <b>không</b> dùng khi nào. Tham số có tên cụ thể và có hướng dẫn định dạng.", payload: { tools }, hl: ["description"] });
        s.push({ from: "c", to: "c", kind: "internal", title: "Claude so câu hỏi với từng mô tả", desc: vague ? "Câu hỏi “đơn của tôi” khớp mơ hồ với cả hai mô tả. Lựa chọn trở nên may rủi, lần này có thể chọn đúng, lần sau chọn sai." : "Cụm “đang ở đâu” khớp thẳng với “vị trí vận chuyển” trong mô tả của <code>lookup_order</code>. Mô tả của <code>get_customer</code> còn nói rõ nó không trả trạng thái đơn." });
        if (vague) {
          s.push({ from: "c", to: "b", kind: "err", label: "chọn nhầm", title: "Claude chọn nhầm công cụ", desc: "Claude gọi <code>get_customer</code>, và còn truyền nguyên chuỗi “#1234” vì không có hướng dẫn về định dạng.", payload: { type: "tool_use", name: "get_customer", input: { query: "#1234" } }, push: [{ r: "err", t: "Lượt 1: gọi get_customer (sai công cụ)" }] });
          s.push({ from: "b", to: "t", kind: "req", label: "tra khách", title: "Backend chạy công cụ bị chọn nhầm", desc: "Backend làm theo yêu cầu và tra hồ sơ khách." });
          s.push({ from: "t", to: "b", kind: "res", label: "hồ sơ", title: "Kết quả không có thông tin vận chuyển", desc: "Hồ sơ khách chỉ có tên và hạng thành viên, không giúp gì cho câu hỏi.", payload: { name: "Trần Lan", tier: "gold" } });
          s.push({ from: "c", to: "b", kind: "warn", label: "chọn lại", title: "Phải tốn thêm một lượt để sửa", desc: "Claude nhận ra kết quả không trả lời được câu hỏi và gọi sang <code>lookup_order</code>. Khách phải chờ lâu hơn, chi phí cũng tăng. Ở những lần khác, Claude có thể trả lời luôn bằng thông tin sai.", payload: { type: "tool_use", name: "lookup_order", input: { query: "#1234" } }, push: [{ r: "note", t: "Lượt 2: gọi lookup_order (tham số vẫn còn dấu #)" }] });
        } else {
          s.push({ from: "c", to: "b", kind: "ok", label: "chọn đúng", title: "Claude chọn đúng ngay lần đầu", desc: "Claude gọi <code>lookup_order</code> và truyền “1234”, đã bỏ dấu # theo đúng hướng dẫn trong mô tả tham số.", payload: { type: "tool_use", name: "lookup_order", input: { order_id: "1234" } }, push: [{ r: "ok", t: "Lượt 1: gọi lookup_order(\"1234\"), đúng ngay" }] });
        }
        s.push({ from: "t", to: "c", kind: "ok", label: "thông tin đơn", title: "Có thông tin cần thiết", desc: "Đơn đang ở bưu cục Quận 3, dự kiến giao ngày 30/10.", payload: { status: "in_transit", location: "Bưu cục Quận 3", eta: "2026-10-30" } });
        return s;
      },
    }),
  };

  /* ───────── 2-2 Lỗi có cấu trúc qua MCP ───────── */
  const CATS = {
    transient: {
      label: "Lỗi tạm thời (hết thời gian chờ)", input: { order_id: "1234" },
      server: "Máy chủ gọi kho dữ liệu nhưng chờ quá 5 giây mà không có phản hồi. Đây là lỗi tạm thời, thử lại sau ít giây có thể thành công.",
      body: { errorCategory: "transient", isRetryable: true, retryAfterMs: 2000, message: "Kho dữ liệu đơn hàng không phản hồi sau 5 giây." },
      next: { type: "tool_use", name: "mcp__orders__lookup_order", input: { order_id: "1234" } }, nextDesc: "Claude chờ một chút rồi thử lại, có giới hạn số lần. Nếu vẫn lỗi, nó báo cho khách hoặc cho coordinator, kèm phần kết quả đã có.",
    },
    validation: {
      label: "Dữ liệu đầu vào sai", input: { order_id: "abc" },
      server: "Máy chủ kiểm tra định dạng: mã đơn phải gồm 4 tới 8 chữ số, nhưng nhận được “abc”. Lỗi nằm ở đầu vào, nên gọi lại y nguyên sẽ vẫn lỗi.",
      body: { errorCategory: "validation", isRetryable: true, field: "order_id", expected: "4 tới 8 chữ số, ví dụ 1234", received: "abc", message: "Mã đơn không hợp lệ." },
      next: { type: "text", text: "Mã đơn “abc” có vẻ chưa đúng. Bạn kiểm tra giúp mình mã gồm 4 tới 8 chữ số trong email xác nhận nhé?" }, nextDesc: "Claude hỏi lại khách để có mã đúng, thay vì gọi lại công cụ với đầu vào sai.",
    },
    business: {
      label: "Vi phạm chính sách", input: { order_id: "1234" },
      server: "Đơn đã giao cách đây 97 ngày, trong khi chính sách chỉ cho hoàn tiền trong 90 ngày. Đây không phải lỗi kỹ thuật, nên thử lại bao nhiêu lần cũng vô ích.",
      body: { errorCategory: "business", isRetryable: false, rule: "refund_window_90_days", days_since_delivery: 97, message: "Đơn đã quá hạn hoàn tiền 90 ngày.", customer_facing: "Đơn #1234 đã quá thời hạn hoàn tiền 90 ngày." },
      next: { type: "text", text: "Rất tiếc, đơn #1234 đã quá hạn hoàn tiền 90 ngày (giao cách đây 97 ngày). Mình có thể hỗ trợ bảo hành, hoặc chuyển bạn tới bộ phận chăm sóc đặc biệt." }, nextDesc: "Claude giải thích chính sách một cách nhẹ nhàng và đề xuất hướng khác. Không thử lại.",
    },
    permission: {
      label: "Không đủ quyền", input: { order_id: "B2B-7781" },
      server: "Đây là đơn của khách doanh nghiệp, trong khi agent chỉ có quyền xem đơn của khách lẻ. Agent không thể tự vượt quyền, cần người có thẩm quyền.",
      body: { errorCategory: "permission", isRetryable: false, required_role: "b2b_support", message: "Agent không có quyền xem đơn doanh nghiệp." },
      next: { type: "tool_use", name: "escalate_to_human", input: { queue: "b2b_support", order_id: "B2B-7781", summary: "Khách hỏi trạng thái đơn doanh nghiệp, agent không đủ quyền truy cập." } }, nextDesc: "Claude chuyển vụ việc cho bộ phận hỗ trợ doanh nghiệp, kèm bản tóm tắt.",
    },
    empty: {
      label: "Không có kết quả (hợp lệ)", input: { email: "lan@example.com" },
      server: "Truy vấn chạy thành công, nhưng không có đơn nào gắn với email này. Đây là dữ liệu bình thường, không phải lỗi.",
      ok: { orders: [], searched_by: "email", note: "Tìm kiếm thành công, không có đơn nào khớp." },
      next: { type: "text", text: "Mình không thấy đơn nào gắn với lan@example.com. Có thể bạn đã đặt bằng email khác hoặc bằng số điện thoại?" }, nextDesc: "Claude kết luận đúng là không có đơn. Không thử lại, không chuyển cho người.",
    },
    protocol: {
      label: "Lỗi giao thức (gọi sai tên công cụ)", input: { order_id: "1234" }, tool: "lookup_ordr",
      server: "Máy chủ không có công cụ nào tên “lookup_ordr”. Danh sách công cụ phía client đã cũ sau khi máy chủ đổi tên công cụ. Lỗi này xảy ra ở tầng giao thức, trước khi công cụ kịp chạy.",
      rpcError: { code: -32602, message: "Unknown tool: lookup_ordr" },
      next: { type: "text", text: "(Claude chỉ nhận được một thông báo lỗi chung chung, không biết vì sao, nên có thể thử lại vô ích hoặc bỏ cuộc.)" }, nextDesc: "Lỗi giao thức không mang thông tin để Claude tự xử lý. Phải sửa ở phía hạ tầng: máy chủ báo khi danh sách công cụ thay đổi, client lấy lại danh sách mới.",
    },
  };
  W.errorBuilder = {
    title: "Báo lỗi trong MCP: từ lời gọi công cụ tới quyết định tiếp theo của Claude",
    render: trace({
      intro: "Cùng một lệnh tra đơn hàng, nhưng có sáu kết cục khác nhau. Chọn từng tình huống để xem máy chủ nên trả về gì, và Claude phản ứng ra sao khi được báo lỗi rõ ràng.",
      actors: [
        { id: "c", icon: "🧠", name: "Claude" },
        { id: "h", icon: "🖥️", name: "MCP client", sub: "Claude Code hoặc SDK" },
        { id: "s", icon: "🔌", name: "Máy chủ MCP", sub: "orders" },
        { id: "d", icon: "🗄️", name: "Kho dữ liệu" },
      ],
      controls: [{ id: "k", type: "select", label: "Tình huống:", value: "transient", options: Object.entries(CATS).map(([k, v]) => [k, v.label]) }],
      steps: ({ k }) => {
        const c = CATS[k], tool = c.tool || "lookup_order";
        const s = [];
        s.push({ from: "c", to: "h", kind: "res", label: "xin tra đơn", title: "Claude xin tra cứu đơn hàng", desc: "Claude gọi công cụ tra đơn. Trong Claude Code, công cụ đến từ máy chủ MCP có tên đầy đủ bắt đầu bằng <code>mcp__orders__</code>.", payload: { type: "tool_use", id: "toolu_21", name: "mcp__orders__" + tool, input: c.input }, hl: ["name", "input"] });
        s.push({ from: "h", to: "s", kind: "req", label: "tools/call", title: "Client chuyển yêu cầu sang máy chủ MCP", sub: "JSON-RPC", desc: "Client đóng gói yêu cầu theo chuẩn JSON-RPC rồi gửi cho máy chủ. Lúc này tên công cụ không còn tiền tố <code>mcp__orders__</code>, vì đó chỉ là cách client đặt tên.", payload: { jsonrpc: "2.0", id: 42, method: "tools/call", params: { name: tool, arguments: c.input } }, hl: ["method", "name", "arguments"], fields: [["jsonrpc, id", "Theo chuẩn JSON-RPC 2.0. Mã id dùng để ghép câu trả lời với đúng câu hỏi."], ["method: tools/call", "Yêu cầu chạy một công cụ."], ["params.name", "Tên công cụ theo cách máy chủ đặt."], ["params.arguments", "Chính là tham số Claude đã điền."]] });
        if (!c.rpcError) s.push({ from: "s", to: "d", kind: "req", label: "truy vấn", title: "Máy chủ chạy công cụ", desc: c.server });
        else s.push({ from: "s", to: "s", kind: "err", title: "Máy chủ không tìm thấy công cụ", desc: c.server });
        if (c.rpcError) {
          s.push({ from: "s", to: "h", kind: "err", label: "lỗi giao thức", title: "Máy chủ trả về lỗi giao thức", desc: "Câu trả lời không có kết quả, chỉ có một khối <code>error</code> với mã lỗi chuẩn. Không có thông tin nào như “loại lỗi” hay “có nên thử lại”.", payload: { jsonrpc: "2.0", id: 42, error: c.rpcError }, hl: ["error", "code"] });
        } else if (c.ok) {
          s.push({ from: "d", to: "s", kind: "res", label: "0 dòng", title: "Kho dữ liệu trả về 0 kết quả", desc: "Truy vấn chạy bình thường, chỉ là không có dữ liệu khớp.", payload: { rows: [] } });
          s.push({ from: "s", to: "h", kind: "ok", label: "thành công", title: "Máy chủ trả về: thành công, danh sách rỗng", desc: "Kết quả ghi rõ <code>isError: false</code> và kèm một câu nói rõ tìm kiếm đã chạy thành công. Như vậy Claude không thể nhầm với trường hợp bị lỗi.", payload: { jsonrpc: "2.0", id: 42, result: { content: [{ type: "text", text: J(c.ok) }], isError: false } }, hl: ["isError", "note"], note: "Nếu khi bị lỗi công cụ cũng trả về danh sách rỗng, Claude sẽ không có cách nào phân biệt hai trường hợp." });
        } else {
          s.push({ from: "d", to: "s", kind: "err", label: "lỗi", title: "Phát hiện lỗi", desc: "Máy chủ ghi nhận lỗi và chuẩn bị một thông báo có cấu trúc để gửi lại.", payload: k === "transient" ? "ETIMEDOUT sau 5000ms" : c.body.message });
          s.push({
            from: "s", to: "h", kind: "err", label: "isError", title: "Máy chủ trả về kết quả lỗi, kèm thông tin rõ ràng",
            desc: "Đây là lỗi khi chạy công cụ: kết quả có <code>isError: true</code>, và nội dung bên trong cho biết loại lỗi, có nên thử lại không, kèm một câu mô tả dễ hiểu.",
            payload: { jsonrpc: "2.0", id: 42, result: { content: [{ type: "text", text: J(c.body) }], isError: true } },
            hl: ["isError", "errorCategory", "isRetryable"],
            fields: [["isError", "Công cụ đã chạy nhưng thất bại. Claude sẽ đọc được nội dung lỗi để tự xử lý."], ["errorCategory", "Loại lỗi: tạm thời, đầu vào sai, vi phạm chính sách hay không đủ quyền. Mỗi loại cần một cách xử lý khác."], ["isRetryable", "Có nên thử lại không."], ["message / customer_facing", "Mô tả cho Claude hiểu, và nếu có, một câu thân thiện để Claude nói lại với khách."]],
          });
        }
        s.push({ from: "h", to: "c", kind: c.ok ? "res" : "err", label: "kết quả", title: "Client chuyển kết quả cho Claude", desc: "Client đổi câu trả lời của máy chủ thành một khối <code>tool_result</code> và đưa cho Claude.", payload: { type: "tool_result", tool_use_id: "toolu_21", is_error: !c.ok, content: c.rpcError ? "MCP error -32602: Unknown tool: lookup_ordr" : J(c.ok || c.body) }, hl: ["is_error"] });
        s.push({ from: "c", to: "c", kind: c.ok || k === "business" || k === "validation" ? "ok" : "warn", title: "Claude quyết định bước tiếp theo", desc: c.nextDesc, payload: c.next });
        return s;
      },
    }),
  };

  /* ───────── 2-3 tool_choice ───────── */
  W.toolChoice = {
    title: "tool_choice: cùng một yêu cầu, bốn cách hành xử",
    render(el) {
      const tools = ["extract_invoice", "extract_receipt", "extract_metadata"];
      const inv = { vendor: "Công ty X", invoice_no: "INV-889", total: 1240, currency: "USD", issued: "2026-03-15" };
      const M = {
        auto: { name: "auto", cfg: { type: "auto" }, resp: { content: [{ type: "text", text: "Đây là hóa đơn INV-889 của Công ty X, tổng 1.240 USD, ngày 15/03/2026." }], stop_reason: "end_turn" }, say: "Claude tự quyết. Ở đây nó chọn trả lời bằng một câu văn, nên bạn không nhận được dữ liệu JSON để lưu. Đây là giá trị mặc định khi có gửi kèm công cụ.", ok: false },
        any: { name: "any", cfg: { type: "any" }, resp: { content: [{ type: "tool_use", id: "toolu_31", name: "extract_invoice", input: inv }], stop_reason: "tool_use" }, say: "Claude <b>bắt buộc</b> phải gọi một công cụ, nhưng được tự chọn công cụ nào. Nó chọn extract_invoice vì đây là hóa đơn. Phù hợp khi có nhiều loại tài liệu mà chưa biết trước tài liệu sắp tới thuộc loại nào.", ok: true },
        tool: { name: "chỉ định công cụ", cfg: { type: "tool", name: "extract_metadata" }, resp: { content: [{ type: "tool_use", id: "toolu_32", name: "extract_metadata", input: { doc_type: "invoice", language: "vi", pages: 1 } }], stop_reason: "tool_use" }, say: "Claude <b>bắt buộc</b> gọi đúng công cụ được chỉ định. Dùng khi muốn một bước chắc chắn chạy trước, ví dụ luôn trích thông tin chung của tài liệu đầu tiên.", ok: true },
        none: { name: "none", cfg: { type: "none" }, resp: { content: [{ type: "text", text: "Tài liệu này là một hóa đơn bán hàng..." }], stop_reason: "end_turn" }, say: "Claude <b>không được</b> gọi công cụ, dù danh sách công cụ vẫn được gửi kèm. Dùng cho lượt chỉ cần trả lời bằng chữ, mà vẫn giữ nguyên danh sách công cụ để tận dụng phần đã lưu đệm.", ok: false },
      };
      let cur = "auto";
      const draw = () => {
        const m = M[cur];
        el.innerHTML = `<p class="tr-intro">Ba công cụ trích xuất được gửi kèm, cùng ảnh một hóa đơn. Chỉ thay đổi trường <code>tool_choice</code>, xem câu trả lời của Claude khác nhau thế nào.</p>
          <div class="compare-tabs" style="margin-top:14px">${Object.keys(M).map((k) => `<button class="${k === cur ? "on" : ""}" data-k="${k}">${M[k].name}</button>`).join("")}</div>
          <div class="tr-step" style="margin:6px 0 18px"><p class="tr-desc">${m.say}</p></div>
          <div class="tr-details"><div class="tr-tabs"><button class="on">Yêu cầu gửi đi (trích)</button></div><div class="tr-pane">${code({ tools: tools.map((n) => ({ name: n, description: "...", input_schema: "{...}" })), tool_choice: m.cfg, messages: [{ role: "user", content: [{ type: "image", source: "{...}" }, { type: "text", text: "Trích xuất tài liệu này." }] }] }, ["tool_choice", "type", "name"])}</div></div>
          <div class="tr-details" style="margin-top:14px"><div class="tr-tabs"><button class="on">Câu trả lời của Claude</button></div><div class="tr-pane">${code(m.resp, ["stop_reason", "type"])}</div></div>
          <div class="callout warn" style="margin-top:16px"><b>Lưu ý.</b> Nếu bật chế độ suy nghĩ mở rộng (extended thinking), chỉ dùng được <code>auto</code> hoặc <code>none</code>.</div>`;
        el.querySelectorAll("[data-k]").forEach((b) => (b.onclick = () => { cur = b.dataset.k; draw(); }));
      };
      draw();
    },
  };

  /* ───────── 2-4 Vòng đời máy chủ MCP ───────── */
  W.mcpLifecycle = {
    title: "Từ file .mcp.json tới lúc Claude dùng được công cụ",
    render: trace({
      intro: "Claude Code đóng vai trò client: nó khởi động từng máy chủ MCP, hỏi xem máy chủ có công cụ gì, rồi đưa những công cụ đó cho Claude dùng. Mọi trao đổi giữa client và máy chủ theo chuẩn JSON-RPC.",
      actors: [
        { id: "h", icon: "🧑‍💻", name: "Claude Code", sub: "MCP client" },
        { id: "s", icon: "🔌", name: "Máy chủ MCP", sub: "github" },
        { id: "g", icon: "🐙", name: "GitHub" },
        { id: "c", icon: "🧠", name: "Claude", sub: "model" },
      ],
      stateTitle: "Công cụ Claude đang có",
      controls: [{ id: "tok", type: "toggle", label: "Máy của bạn đã đặt biến môi trường <code>GITHUB_TOKEN</code>", value: true }],
      steps: ({ tok }) => {
        const s = [];
        s.push({
          from: "h", to: "h", kind: "internal", key: true, title: "Claude Code đọc file .mcp.json",
          desc: tok ? "File này nằm trong repo, cả nhóm dùng chung. Thay vì ghi token thật, file ghi <code>${GITHUB_TOKEN}</code>, và Claude Code lấy giá trị thật từ máy của bạn." : "File ghi <code>${GITHUB_TOKEN}</code>, nhưng máy của bạn chưa đặt biến này, nên Claude Code báo lỗi cấu hình.",
          payloads: [{ t: ".mcp.json (được commit trong repo)", d: { mcpServers: { github: { command: "npx", args: ["-y", "@modelcontextprotocol/server-github"], env: { GITHUB_TOKEN: "${GITHUB_TOKEN}" } } } }, hl: ["GITHUB_TOKEN"] }],
          warn: tok ? null : "Lỗi nằm ở máy của bạn, không phải ở repo. Hãy đặt biến GITHUB_TOKEN trên máy mình. Đừng dán token vào file .mcp.json.",
          note: tok ? "Lần đầu gặp máy chủ khai báo trong .mcp.json, Claude Code sẽ hỏi bạn có tin tưởng máy chủ đó không." : null,
          state: [{ r: "sys", t: "Các công cụ có sẵn: Read, Edit, Grep, Glob, Bash…" }],
        });
        if (!tok) {
          s.push({ from: "h", to: "c", kind: "err", label: "thiếu công cụ", title: "Claude không có công cụ GitHub", desc: "Vì máy chủ không khởi động được, Claude chỉ có các công cụ sẵn có. Nếu bạn nhờ tạo issue, Claude sẽ báo là không làm được, hoặc gợi ý cách khác." });
          return s;
        }
        s.push({ from: "h", to: "s", kind: "req", label: "khởi động", key: true, title: "Claude Code khởi động máy chủ MCP", desc: "Máy chủ chạy như một chương trình con trên máy bạn. Hai bên trao đổi qua đường nhập và xuất chuẩn (stdio), mỗi tin nhắn JSON nằm trên một dòng. Token chỉ được truyền cho chương trình con này.", payload: "$ npx -y @modelcontextprotocol/server-github\n  biến môi trường: GITHUB_TOKEN=ghp_•••• (lấy từ máy của bạn)", note: "Với máy chủ ở xa, kết nối qua HTTP thay vì stdio, và thường đăng nhập bằng OAuth." });
        s.push({ from: "h", to: "s", kind: "req", label: "chào hỏi", key: true, title: "Client chào hỏi máy chủ", desc: "Bước đầu tiên luôn là <code>initialize</code>: client cho biết nó dùng phiên bản giao thức nào và hỗ trợ những tính năng gì.", payload: { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: { roots: { listChanged: true } }, clientInfo: { name: "claude-code", version: "2.x" } } }, hl: ["protocolVersion", "capabilities"] });
        s.push({ from: "s", to: "h", kind: "res", label: "giới thiệu", title: "Máy chủ cho biết nó cung cấp những gì", desc: "Máy chủ trả lời rằng nó có công cụ (tools) và nội dung để đọc (resources), và sẽ báo cho client khi danh sách công cụ thay đổi.", payload: { jsonrpc: "2.0", id: 1, result: { protocolVersion: "2025-06-18", capabilities: { tools: { listChanged: true }, resources: { subscribe: false } }, serverInfo: { name: "github", version: "1.4.0" } } }, hl: ["tools", "resources"] });
        s.push({ from: "h", to: "s", kind: "req", label: "sẵn sàng", title: "Client báo đã sẵn sàng", desc: "Đây là một thông báo một chiều, không cần máy chủ trả lời, nên không có mã id.", payload: { jsonrpc: "2.0", method: "notifications/initialized" } });
        s.push({ from: "h", to: "s", kind: "req", label: "hỏi danh sách", title: "Client hỏi danh sách công cụ", desc: "Client gửi <code>tools/list</code> để biết máy chủ có những công cụ nào.", payload: { jsonrpc: "2.0", id: 2, method: "tools/list" } });
        s.push({ from: "s", to: "h", kind: "res", label: "danh sách", key: true, title: "Máy chủ gửi định nghĩa các công cụ", desc: "Mỗi công cụ có tên, đoạn mô tả và danh sách tham số. Đoạn mô tả này chính là thứ Claude dựa vào để chọn công cụ, nên chất lượng của nó rất quan trọng.", payload: { jsonrpc: "2.0", id: 2, result: { tools: [{ name: "create_issue", description: "Tạo issue trong repo. Cần owner, repo, title.", inputSchema: { type: "object", properties: { owner: { type: "string" }, repo: { type: "string" }, title: { type: "string" }, body: { type: "string" } }, required: ["owner", "repo", "title"] } }, { name: "search_issues", description: "Tìm issue theo cú pháp tìm kiếm của GitHub.", inputSchema: "{...}" }] } }, hl: ["name", "description", "inputSchema"] });
        s.push({ from: "h", to: "h", kind: "internal", key: true, title: "Claude Code đặt tên đầy đủ cho từng công cụ", desc: "Để tránh trùng tên giữa các máy chủ, mỗi công cụ được đặt tên theo dạng <code>mcp__&lt;máy chủ&gt;__&lt;công cụ&gt;</code>, ví dụ <code>create_issue</code> thành <code>mcp__github__create_issue</code>. Các công cụ này được thêm vào danh sách gửi cho Claude.", push: [{ r: "ok", t: "<b>mcp__github__create_issue</b>" }, { r: "ok", t: "<b>mcp__github__search_issues</b>" }] });
        s.push({ from: "h", to: "c", kind: "req", label: "yêu cầu", title: "Claude nhận công cụ MCP như mọi công cụ khác", desc: "Với Claude, công cụ MCP không có gì khác biệt. Nó chỉ thấy thêm vài công cụ mới trong danh sách.", payload: { tools: [{ name: "Read", description: "..." }, "...", { name: "mcp__github__create_issue", description: "Tạo issue trong repo. Cần owner, repo, title.", input_schema: "{...}" }], messages: [{ role: "user", content: "Tạo issue: nút Thanh toán bị lệch trên Safari" }] }, hl: ["mcp__github__create_issue"] });
        s.push({ from: "c", to: "h", kind: "res", label: "xin tạo issue", key: true, title: "Claude xin dùng công cụ tạo issue", desc: "Claude điền đủ owner, repo, tiêu đề và nội dung.", payload: { type: "tool_use", id: "toolu_41", name: "mcp__github__create_issue", input: { owner: "acme", repo: "web", title: "Nút Thanh toán bị lệch trên Safari", body: "Cách tái hiện: Safari 18, trang /checkout..." } } });
        s.push({ from: "h", to: "h", kind: "internal", title: "Claude Code kiểm tra quyền", desc: "Nếu công cụ đã được cho phép sẵn trong cài đặt, nó chạy ngay. Nếu chưa, Claude Code hỏi bạn. Nếu có hook PreToolUse, hook cũng chạy ở bước này." });
        s.push({ from: "h", to: "s", kind: "req", label: "tools/call", key: true, title: "Client gọi công cụ trên máy chủ", desc: "Client dùng lại tên gốc <code>create_issue</code> khi nói chuyện với máy chủ.", payload: { jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "create_issue", arguments: { owner: "acme", repo: "web", title: "Nút Thanh toán bị lệch trên Safari", body: "..." } } }, hl: ["name"] });
        s.push({ from: "s", to: "g", kind: "req", label: "gọi GitHub", title: "Máy chủ gọi GitHub bằng token của bạn", sub: "POST /repos/acme/web/issues", desc: "Token chỉ tồn tại bên trong chương trình máy chủ MCP. Claude không bao giờ nhìn thấy nó.", payload: "POST https://api.github.com/repos/acme/web/issues\nAuthorization: Bearer ghp_••••\n{\"title\":\"Nút Thanh toán bị lệch trên Safari\",\"body\":\"...\"}" });
        s.push({ from: "g", to: "s", kind: "res", label: "đã tạo", title: "GitHub tạo issue số 482", desc: "GitHub trả về số issue và đường dẫn.", payload: { number: 482, html_url: "https://github.com/acme/web/issues/482", state: "open" } });
        s.push({ from: "s", to: "h", kind: "res", label: "kết quả", title: "Máy chủ trả kết quả cho client", desc: "Kết quả thành công, có <code>isError: false</code>.", payload: { jsonrpc: "2.0", id: 3, result: { content: [{ type: "text", text: "Đã tạo issue #482: https://github.com/acme/web/issues/482" }], isError: false } } });
        s.push({ from: "h", to: "c", kind: "ok", label: "kết quả", key: true, title: "Claude nhận kết quả và báo cho bạn", desc: "Kết quả được đưa cho Claude, và Claude báo lại cho bạn đường dẫn tới issue vừa tạo.", payload: { type: "tool_result", tool_use_id: "toolu_41", content: "Đã tạo issue #482: https://github.com/acme/web/issues/482" } });
        return s;
      },
    }),
  };

  /* ───────── 2-5 Công cụ có sẵn: tìm hiểu từ từ ───────── */
  W.builtinTrace = {
    title: "Tìm hiểu code từ từ: Grep, Read, rồi Edit",
    render: trace({
      intro: "Nhiệm vụ: “Thêm xử lý lỗi cho mọi chỗ gọi hàm <code>processPayment()</code>”. Xem Claude chọn công cụ nào ở mỗi bước, truyền tham số gì, và nhận lại gì.",
      actors: [
        { id: "c", icon: "🧠", name: "Claude" },
        { id: "h", icon: "🖥️", name: "Claude Code", sub: "chạy công cụ" },
        { id: "f", icon: "📁", name: "Repo", sub: "các file code" },
      ],
      stateTitle: "Những gì Claude đã biết",
      steps: [
        { from: "c", to: "h", kind: "res", label: "Grep", key: true, title: "Bắt đầu bằng tìm theo nội dung", desc: "Claude không đọc cả repo. Nó dùng Grep để tìm những file có chứa chuỗi “processPayment(”, và chỉ yêu cầu danh sách tên file cho gọn.", payload: { name: "Grep", input: { pattern: "processPayment\\(", output_mode: "files_with_matches", type: "ts" } }, fields: [["pattern", "Mẫu cần tìm bên trong file."], ["output_mode", "<code>files_with_matches</code> chỉ trả về danh sách file, rất gọn. <code>content</code> trả về cả những dòng khớp."], ["type", "Chỉ tìm trong file TypeScript, để bớt kết quả thừa."]] },
        { from: "f", to: "c", kind: "res", label: "3 file", title: "Kết quả: ba file", desc: "Chỉ ba đường dẫn, tốn rất ít chỗ trong ngữ cảnh.", payload: "src/checkout/service.ts\nsrc/subscriptions/renew.ts\nsrc/admin/manual-charge.ts", push: [{ r: "tool", t: "Grep: có 3 file gọi processPayment" }] },
        { from: "c", to: "h", kind: "res", label: "Read", key: true, title: "Đọc file đầu tiên", desc: "Claude đọc file service.ts để xem hàm được gọi ở đâu và kết quả được xử lý thế nào.", payload: { name: "Read", input: { file_path: "/repo/src/checkout/service.ts" } } },
        { from: "f", to: "c", kind: "res", label: "nội dung", title: "Nội dung file, có số dòng", desc: "Claude thấy có hai chỗ cùng viết <code>return null;</code>: dòng 20 thuộc phần thanh toán, dòng 43 thuộc phần hoàn tiền.", payload: "  1  import { processPayment } from \"../payments/gateway\";\n 18  const res = await processPayment(order.total, card);\n 19  if (!res.ok) {\n 20    return null;\n 21  }\n 42  if (!refund.ok) {\n 43    return null;\n 44  }", push: [{ r: "tool", t: "Đã đọc service.ts (đọc rồi mới được sửa)" }] },
        { from: "c", to: "h", kind: "res", label: "Read", title: "Lần theo dòng import", desc: "Thay vì đọc cả thư mục, Claude mở đúng file được import. Nhờ vậy nó biết hàm này báo lỗi mạng bằng cách ném ra NetworkError, từ đó quyết định cách xử lý lỗi cho phù hợp.", payload: { name: "Read", input: { file_path: "/repo/src/payments/gateway.ts" } }, push: [{ r: "tool", t: "Đã đọc gateway.ts: lỗi mạng ném ra NetworkError" }] },
        { from: "c", to: "h", kind: "res", label: "Edit", key: true, title: "Thử sửa với đoạn cần thay quá ngắn", desc: "Claude muốn sửa dòng 20 và đưa đoạn cần thay là <code>return null;</code>.", payload: { name: "Edit", input: { file_path: "/repo/src/checkout/service.ts", old_string: "return null;", new_string: "throw new PaymentFailed(res.error);" } }, hl: ["old_string"], fields: [["old_string", "Đoạn văn bản cần thay. Nó phải xuất hiện <b>đúng một lần</b> trong file, trừ khi bật replace_all."], ["new_string", "Nội dung mới."], ["replace_all", "Nếu bật, mọi chỗ khớp đều bị thay. Chỉ dùng khi chắc chắn, ví dụ đổi tên biến."]] },
        { from: "h", to: "c", kind: "err", label: "lỗi", key: true, title: "Edit báo lỗi: đoạn cần thay xuất hiện hai lần", desc: "Edit không biết nên sửa dòng 20 hay dòng 43, nên từ chối và giải thích hai cách xử lý.", payload: "Found 2 matches of the string to replace, but replace_all is false. To replace all occurrences, set replace_all to true. To replace only one occurrence, please provide more context to uniquely identify the instance.", warn: "Gọi lại y nguyên thì sẽ lỗi mãi. Bật replace_all cũng sai ở đây, vì dòng 43 thuộc phần hoàn tiền và không được đổi." },
        { from: "c", to: "h", kind: "res", label: "Edit", key: true, title: "Lấy thêm dòng phía trên cho đoạn cần thay là duy nhất", desc: "Claude ghép thêm dòng <code>if (!res.ok) {</code> vào đoạn cần thay. Đoạn mới chỉ xuất hiện ở đúng một chỗ.", payload: { name: "Edit", input: { file_path: "/repo/src/checkout/service.ts", old_string: "if (!res.ok) {\n    return null;", new_string: "if (!res.ok) {\n    throw new PaymentFailed(res.error);" } }, hl: ["old_string"], note: "Nếu file có nhiều chỗ giống hệt nhau, khó tạo đoạn duy nhất, có thể đọc cả file rồi ghi lại bằng Write." },
        { from: "f", to: "c", kind: "ok", label: "đã sửa", title: "Sửa thành công", desc: "File đã được cập nhật đúng chỗ.", payload: "The file /repo/src/checkout/service.ts has been updated.", push: [{ r: "ok", t: "Đã sửa service.ts, dòng 20" }] },
        { from: "c", to: "h", kind: "res", label: "Bash", key: true, title: "Chạy test để kiểm tra", desc: "Sửa xong, Claude dùng Bash để chạy test của phần thanh toán.", payload: { name: "Bash", input: { command: "npm test -- checkout", description: "Chạy test phần checkout" } } },
        { from: "f", to: "c", kind: "ok", label: "đạt", title: "Tất cả test đều đạt", desc: "12 test của phần checkout đều chạy thành công.", payload: "PASS src/checkout/service.test.ts (12 tests)", push: [{ r: "ok", t: "Chạy test: 12 test đều đạt" }] },
      ],
    }),
  };
})();
