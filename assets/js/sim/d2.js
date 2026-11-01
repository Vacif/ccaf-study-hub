/* Mô phỏng chi tiết — Chương 2: Tool Design & MCP Integration */
(function () {
  const { trace, code, claude, http, net } = window.SIM;
  const { chatIn, chatOut, call, callV, ret } = net;
  const W = window.WIDGETS;
  const J = (o) => JSON.stringify(o);

  const { ccConv } = window.SIM.cc;
  const SHOP = {
    u: { id: "u", icon: "👤", name: "Khách", sub: "app chat", desc: "Chỉ nói chuyện với backend qua khung chat." },
    b: { id: "b", icon: "🖥️", name: "Backend", sub: "chương trình của bạn", desc: "Gửi request tới Claude API, chạy công cụ bằng cách gọi API nội bộ, giữ lịch sử trò chuyện." },
    c: { id: "c", icon: "🧠", name: "Claude API", sub: "Messages API", desc: "Model chọn công cụ chỉ dựa trên tên, mô tả và tham số trong request. Không đọc được code của công cụ." },
    t: { id: "t", icon: "🗄️", name: "Hệ thống nội bộ", sub: "CRM, đơn hàng", desc: "API nội bộ mà backend gọi khi chạy công cụ." },
  };
  const SHOP_LINKS = { "u>b": "HTTPS · POST /api/chat", "b>u": "HTTPS · response của /api/chat", "b>c": "HTTPS · POST api.anthropic.com/v1/messages", "c>b": "HTTPS · response 200 OK", "b>t": "HTTP trong mạng nội bộ", "t>b": "HTTP trong mạng nội bộ · response" };

  /* ───────── 2-1 Claude chọn công cụ dựa vào mô tả ───────── */
  W.toolSelectTrace = {
    title: "Claude chọn công cụ thế nào: mô tả sơ sài và mô tả rõ ràng",
    render: trace({
      intro: "Claude không đọc được code bên trong công cụ của bạn. Nó chỉ biết <b>tên</b>, <b>đoạn mô tả</b> và <b>danh sách tham số</b> được gửi trong request. Đổi qua lại giữa hai kiểu mô tả để thấy lựa chọn của Claude thay đổi thế nào.",
      actors: [SHOP.u, SHOP.b, SHOP.c, SHOP.t],
      links: SHOP_LINKS,
      stateTitle: "Số lượt đã tốn",
      controls: [{ id: "d", type: "select", label: "Kiểu mô tả công cụ:", value: "vague", options: [["vague", "Sơ sài"], ["clear", "Rõ ràng, nêu ranh giới"]] }],
      steps: ({ d }) => {
        const vague = d === "vague";
        const tools = vague
          ? [{ name: "get_customer", description: "Lấy thông tin khách hàng.", input_schema: { type: "object", properties: { query: { type: "string" } } } }, { name: "lookup_order", description: "Lấy thông tin đơn.", input_schema: { type: "object", properties: { query: { type: "string" } } } }]
          : [{ name: "get_customer", description: "Tra HỒ SƠ khách (tên, email, hạng) bằng email hoặc mã khách. Dùng để xác minh danh tính. KHÔNG trả trạng thái đơn hay vận chuyển; việc đó dùng lookup_order.", input_schema: { type: "object", properties: { email: { type: "string", description: "Email đăng ký" }, customer_id: { type: "string", description: "Dạng C-123" } } } }, { name: "lookup_order", description: "Tra MỘT đơn bằng mã đơn (phần số sau dấu #, ví dụ #1234 thì nhập \"1234\"): trạng thái, vị trí vận chuyển, ngày giao dự kiến, số tiền. Dùng khi khách hỏi đơn đang ở đâu, bao giờ giao.", input_schema: { type: "object", properties: { order_id: { type: "string", description: "Chỉ gồm chữ số, bỏ dấu #" } }, required: ["order_id"] } }];
        const cv = claude({ model: "claude-haiku-5-5", max_tokens: 1024, system: "Bạn là trợ lý chăm sóc khách hàng của ShopX.", tools }, { tag: "T" });
        const q = "Đơn #1234 của tôi giờ đang ở đâu vậy?";
        const ship = { order_id: "1234", status: "in_transit", location: "Bưu cục Quận 3", eta: "2026-10-30" };
        const s = [];
        s.push({ phase: "Khách hỏi", from: "u", to: "b", kind: "req", label: "câu hỏi", title: "Khách hỏi đơn hàng đang ở đâu", desc: "Đây là câu hỏi về vận chuyển, nên công cụ đúng là <code>lookup_order</code>.", ...chatIn(q), state: [] });
        cv.user(q);
        s.push({ phase: "Claude chọn công cụ", from: "b", to: "c", kind: "req", label: "kèm danh sách công cụ", key: true, title: "Backend gửi câu hỏi kèm danh sách công cụ", desc: vague ? "Hai mô tả “Lấy thông tin khách hàng” và “Lấy thông tin đơn” na ná nhau, vì đơn hàng cũng là một phần “thông tin khách”. Tham số đều tên chung chung là <code>query</code>." : "Mỗi mô tả nói rõ công cụ làm gì, dùng khi nào và <b>không</b> dùng khi nào. Tham số có tên cụ thể và có hướng dẫn định dạng.", ...cv.req({ hl: ["description"] }) });
        s.push({ from: "c", to: "c", kind: "internal", via: "bên trong Claude API, trước khi trả response", title: "Claude so câu hỏi với từng mô tả", desc: vague ? "Câu hỏi “đơn của tôi” khớp mơ hồ với cả hai mô tả. Lựa chọn trở nên may rủi, lần này có thể chọn đúng, lần sau chọn sai." : "Cụm “đang ở đâu” khớp thẳng với “vị trí vận chuyển” trong mô tả của <code>lookup_order</code>. Mô tả của <code>get_customer</code> còn nói rõ nó không trả trạng thái đơn." });
        if (vague) {
          s.push({ from: "c", to: "b", kind: "err", label: "chọn nhầm", key: true, title: "Claude chọn nhầm công cụ", desc: "Claude xin chạy <code>get_customer</code>, và còn truyền nguyên chuỗi “#1234” vì không có hướng dẫn về định dạng.", ...cv.res({ content: [{ type: "tool_use", id: "toolu_51", name: "get_customer", input: { query: "#1234" } }], stop_reason: "tool_use", in: 412, out: 40 }, { hl: ["name", "query"] }), push: [{ r: "err", t: "Lượt 1: gọi get_customer (sai công cụ)" }] });
          s.push({ phase: "Chạy nhầm công cụ", from: "b", to: "t", kind: "req", label: "tra khách", title: "Backend chạy công cụ bị chọn nhầm", desc: "Backend làm theo yêu cầu và tra hồ sơ khách bằng chuỗi “#1234” (ký tự # được mã hóa thành %23 trên đường dẫn).", ...callV("GET", "http://crm.internal/customers/search?query=%231234") });
          const prof = { customer_id: "C-88", name: "Trần Lan", tier: "gold" };
          s.push({ from: "t", to: "b", kind: "res", label: "hồ sơ", title: "Kết quả không có thông tin vận chuyển", desc: "Hồ sơ khách chỉ có tên và hạng thành viên, không giúp gì cho câu hỏi.", ...ret(prof) });
          cv.push({ role: "user", content: [{ type: "tool_result", tool_use_id: "toolu_51", content: J(prof) }] });
          s.push({ from: "b", to: "c", kind: "req", label: "kết quả", title: "Backend gửi kết quả cho Claude", desc: "Toàn bộ cuộc trò chuyện, thêm kết quả vô ích ở cuối.", ...cv.req({ hl: ["toolu_51"] }) });
          s.push({ phase: "Tốn thêm một lượt", from: "c", to: "b", kind: "warn", label: "chọn lại", key: true, title: "Phải tốn thêm một lượt để sửa", desc: "Claude nhận ra kết quả không trả lời được câu hỏi và xin chạy <code>lookup_order</code>. Khách phải chờ lâu hơn, chi phí cũng tăng. Ở những lần khác, Claude có thể trả lời luôn bằng thông tin sai.", ...cv.res({ content: [{ type: "tool_use", id: "toolu_52", name: "lookup_order", input: { query: "#1234" } }], stop_reason: "tool_use", in: 498, out: 41 }, { hl: ["name", "query"] }), push: [{ r: "note", t: "Lượt 2: gọi lookup_order (tham số vẫn còn dấu #)" }] });
          s.push({ from: "b", to: "t", kind: "req", label: "tra đơn", title: "Backend tra đơn", desc: "Lần này đúng công cụ. Backend phải tự bỏ dấu # trước khi gọi API đơn hàng.", ...callV("GET", "http://orders.internal/orders/1234") });
          s.push({ from: "t", to: "b", kind: "res", label: "thông tin đơn", title: "Có thông tin vận chuyển", desc: "Đơn đang ở bưu cục Quận 3, dự kiến giao ngày 30/10.", ...ret(ship) });
          cv.push({ role: "user", content: [{ type: "tool_result", tool_use_id: "toolu_52", content: J(ship) }] });
          s.push({ from: "b", to: "c", kind: "req", label: "kết quả", title: "Backend gửi kết quả cho Claude", desc: "Lịch sử giờ có hai lần gọi công cụ thay vì một.", ...cv.req({ hl: ["toolu_52"] }) });
        } else {
          s.push({ from: "c", to: "b", kind: "ok", label: "chọn đúng", key: true, title: "Claude chọn đúng ngay lần đầu", desc: "Claude xin chạy <code>lookup_order</code> và truyền “1234”, đã bỏ dấu # theo đúng hướng dẫn trong mô tả tham số.", ...cv.res({ content: [{ type: "tool_use", id: "toolu_51", name: "lookup_order", input: { order_id: "1234" } }], stop_reason: "tool_use", in: 520, out: 38 }, { hl: ["name", "order_id"] }), push: [{ r: "ok", t: "Lượt 1: gọi lookup_order(\"1234\"), đúng ngay" }] });
          s.push({ phase: "Chạy công cụ", from: "b", to: "t", kind: "req", label: "tra đơn", title: "Backend tra đơn", desc: "Backend gọi API đơn hàng với mã đơn Claude đã điền.", ...callV("GET", "http://orders.internal/orders/1234") });
          s.push({ from: "t", to: "b", kind: "res", label: "thông tin đơn", title: "Có thông tin vận chuyển", desc: "Đơn đang ở bưu cục Quận 3, dự kiến giao ngày 30/10.", ...ret(ship) });
          cv.push({ role: "user", content: [{ type: "tool_result", tool_use_id: "toolu_51", content: J(ship) }] });
          s.push({ from: "b", to: "c", kind: "req", label: "kết quả", title: "Backend gửi kết quả cho Claude", desc: "Toàn bộ cuộc trò chuyện, thêm kết quả tra đơn ở cuối.", ...cv.req({ hl: ["toolu_51"] }) });
        }
        const ans = "Đơn #1234 đang ở Bưu cục Quận 3 và dự kiến giao ngày 30/10.";
        s.push({ phase: "Trả lời khách", from: "c", to: "b", kind: "ok", label: "end_turn", title: "Claude viết câu trả lời", desc: "Chỉ có chữ, <code>stop_reason: end_turn</code>.", ...cv.res({ content: [{ type: "text", text: ans }], stop_reason: "end_turn", in: vague ? 590 : 600, out: 28 }) });
        s.push({ from: "b", to: "u", kind: "ok", label: "trả lời", key: true, title: "Khách nhận câu trả lời", desc: vague ? "Đúng thông tin, nhưng tốn hai lượt gọi công cụ thay vì một." : "Đúng thông tin, chỉ với một lượt gọi công cụ.", ...chatOut(ans) });
        return s;
      },
    }),
  };

  /* ───────── 2-2 Lỗi có cấu trúc qua MCP ───────── */
  const CATS = {
    transient: {
      label: "Lỗi tạm thời (hết thời gian chờ)", input: { order_id: "1234" },
      db: { q: "SELECT order_id, status, amount, delivered_at FROM orders WHERE order_id = $1;   -- $1 = '1234'", err: "ERROR: canceling statement due to statement timeout (sau 5000 ms)" },
      server: "Máy chủ gửi truy vấn tới cơ sở dữ liệu nhưng chờ quá 5 giây mà không có kết quả. Đây là lỗi tạm thời, thử lại sau ít giây có thể thành công.",
      body: { errorCategory: "transient", isRetryable: true, retryAfterMs: 2000, message: "Kho dữ liệu đơn hàng không phản hồi sau 5 giây." },
      next: { type: "tool_use", id: "toolu_22", name: "mcp__orders__lookup_order", input: { order_id: "1234" } }, nextDesc: "Claude chờ một chút rồi thử lại, có giới hạn số lần. Nếu vẫn lỗi, nó báo cho người dùng, kèm phần kết quả đã có.",
    },
    validation: {
      label: "Dữ liệu đầu vào sai", input: { order_id: "abc" },
      check: "Máy chủ kiểm tra định dạng trước khi truy vấn: mã đơn phải gồm 4 tới 8 chữ số, nhưng nhận được “abc”. Lỗi nằm ở đầu vào, nên không cần hỏi cơ sở dữ liệu, và gọi lại y nguyên sẽ vẫn lỗi.",
      body: { errorCategory: "validation", isRetryable: true, field: "order_id", expected: "4 tới 8 chữ số, ví dụ 1234", received: "abc", message: "Mã đơn không hợp lệ." },
      next: { type: "text", text: "Mã đơn “abc” có vẻ chưa đúng. Bạn kiểm tra giúp mình mã gồm 4 tới 8 chữ số trong email xác nhận nhé?" }, nextDesc: "Claude hỏi lại người dùng để có mã đúng, thay vì gọi lại công cụ với đầu vào sai.",
    },
    business: {
      label: "Vi phạm chính sách", input: { order_id: "1234" },
      db: { q: "SELECT order_id, status, amount, delivered_at FROM orders WHERE order_id = $1;   -- $1 = '1234'", rows: [{ order_id: "1234", status: "delivered", amount: 89, delivered_at: "2026-07-27" }] },
      server: "Đơn đã giao cách đây 97 ngày, trong khi chính sách chỉ cho hoàn tiền trong 90 ngày. Đây không phải lỗi kỹ thuật, nên thử lại bao nhiêu lần cũng vô ích.",
      body: { errorCategory: "business", isRetryable: false, rule: "refund_window_90_days", days_since_delivery: 97, message: "Đơn đã quá hạn hoàn tiền 90 ngày.", customer_facing: "Đơn #1234 đã quá thời hạn hoàn tiền 90 ngày." },
      next: { type: "text", text: "Rất tiếc, đơn #1234 đã quá hạn hoàn tiền 90 ngày (giao cách đây 97 ngày). Mình có thể hỗ trợ bảo hành, hoặc chuyển bạn tới bộ phận chăm sóc đặc biệt." }, nextDesc: "Claude giải thích chính sách một cách nhẹ nhàng và đề xuất hướng khác. Không thử lại.",
    },
    permission: {
      label: "Không đủ quyền", input: { order_id: "B2B-7781" },
      check: "Đây là đơn của khách doanh nghiệp, trong khi tài khoản máy chủ đang dùng chỉ có quyền xem đơn của khách lẻ. Máy chủ từ chối ngay, không truy vấn. Agent không thể tự vượt quyền, cần người có thẩm quyền.",
      body: { errorCategory: "permission", isRetryable: false, required_role: "b2b_support", message: "Agent không có quyền xem đơn doanh nghiệp." },
      next: { type: "tool_use", id: "toolu_22", name: "escalate_to_human", input: { queue: "b2b_support", order_id: "B2B-7781", summary: "Khách hỏi trạng thái đơn doanh nghiệp, agent không đủ quyền truy cập." } }, nextDesc: "Claude chuyển vụ việc cho bộ phận hỗ trợ doanh nghiệp, kèm bản tóm tắt.",
    },
    empty: {
      label: "Không có kết quả (hợp lệ)", input: { email: "lan@example.com" },
      db: { q: "SELECT order_id, status, amount FROM orders WHERE customer_email = $1;   -- $1 = 'lan@example.com'", rows: [] },
      server: "Truy vấn chạy thành công, nhưng không có đơn nào gắn với email này. Đây là dữ liệu bình thường, không phải lỗi.",
      ok: { orders: [], searched_by: "email", note: "Tìm kiếm thành công, không có đơn nào khớp." },
      next: { type: "text", text: "Mình không thấy đơn nào gắn với lan@example.com. Có thể bạn đã đặt bằng email khác hoặc bằng số điện thoại?" }, nextDesc: "Claude kết luận đúng là không có đơn. Không thử lại, không chuyển cho người.",
    },
    protocol: {
      label: "Lỗi giao thức (gọi sai tên công cụ)", input: { order_id: "1234" }, tool: "lookup_ordr",
      check: "Máy chủ không có công cụ nào tên “lookup_ordr”. Danh sách công cụ phía client đã cũ sau khi máy chủ đổi tên công cụ. Lỗi này xảy ra ở tầng giao thức, trước khi công cụ kịp chạy.",
      rpcError: { code: -32602, message: "Unknown tool: lookup_ordr" },
      next: { type: "text", text: "Mình gặp lỗi khi tra đơn và chưa rõ nguyên nhân. Bạn thử lại sau ít phút giúp mình nhé." }, nextDesc: "Lỗi giao thức không mang thông tin để Claude tự xử lý: nó chỉ biết “có lỗi”, nên thường thử lại vô ích hoặc bỏ cuộc. Phải sửa ở phía hạ tầng: máy chủ báo khi danh sách công cụ thay đổi, client lấy lại danh sách mới.",
    },
  };
  W.errorBuilder = {
    title: "Báo lỗi trong MCP: từ lời gọi công cụ tới quyết định tiếp theo của Claude",
    render: trace({
      intro: "Cùng một lệnh tra đơn hàng, nhưng có sáu kết cục khác nhau. Chọn từng tình huống để xem máy chủ MCP nên trả về gì, và Claude phản ứng ra sao khi được báo lỗi rõ ràng.",
      actors: [
        { id: "c", icon: "🧠", name: "Claude API", sub: "model", desc: "Trả về yêu cầu dùng công cụ, rồi đọc kết quả (hoặc lỗi) trong request tiếp theo để quyết định làm gì." },
        { id: "h", icon: "🖥️", name: "MCP client", sub: "Claude Code (hoặc Agent SDK)", desc: "Nhận response từ Claude API, chuyển lời gọi công cụ sang máy chủ MCP, rồi gửi kết quả về Claude API." },
        { id: "s", icon: "🔌", name: "Máy chủ MCP orders", sub: "tiến trình riêng, nói chuyện qua stdio", desc: "Chương trình của bạn, cung cấp công cụ <code>lookup_order</code>. Tự kiểm tra đầu vào, quyền, và truy vấn cơ sở dữ liệu." },
        { id: "d", icon: "🗄️", name: "Cơ sở dữ liệu", sub: "PostgreSQL đơn hàng", desc: "Nơi lưu đơn hàng. Chỉ máy chủ MCP kết nối tới." },
      ],
      links: { "c>h": "HTTPS · response 200 OK (có khối tool_use)", "h>s": "stdio · JSON-RPC 2.0 (tools/call)", "s>h": "stdio · JSON-RPC 2.0 (kết quả)", "s>d": "kết nối cơ sở dữ liệu · câu lệnh SQL", "d>s": "kết nối cơ sở dữ liệu · kết quả", "h>c": "HTTPS · POST /v1/messages (gửi tool_result)" },
      controls: [{ id: "k", type: "select", label: "Tình huống:", value: "transient", options: Object.entries(CATS).map(([k, v]) => [k, v.label]) }],
      steps: ({ k }) => {
        const c = CATS[k], tool = c.tool || "lookup_order";
        const cv = ccConv([{ name: "mcp__orders__lookup_order" }, { name: "escalate_to_human" }], "E");
        cv.user(k === "empty" ? "Kiểm tra giúp mình các đơn của lan@example.com" : `Đơn ${c.input.order_id} của khách đang thế nào rồi?`);
        cv.req(); // request đầu tiên (không vẽ thành bước riêng)
        const s = [];
        s.push({ phase: "Claude xin gọi công cụ", from: "c", to: "h", kind: "res", label: "xin tra đơn", key: true, title: "Claude xin tra cứu đơn hàng", desc: "Response của Claude API chứa một khối <code>tool_use</code>. Công cụ đến từ máy chủ MCP nên có tên đầy đủ bắt đầu bằng <code>mcp__orders__</code>.", ...cv.res({ content: [{ type: "tool_use", id: "toolu_21", name: "mcp__orders__" + tool, input: c.input }], stop_reason: "tool_use", in: 9820, out: 46 }, { hl: ["name", "input"] }) });
        s.push({ phase: "Máy chủ MCP xử lý", from: "h", to: "s", kind: "req", label: "tools/call", key: true, title: "Client chuyển yêu cầu sang máy chủ MCP", desc: "Client đóng gói yêu cầu theo chuẩn JSON-RPC rồi ghi vào stdin của máy chủ. Lúc này tên công cụ không còn tiền tố <code>mcp__orders__</code>, vì đó chỉ là cách client đặt tên.", payload: { jsonrpc: "2.0", id: 42, method: "tools/call", params: { name: tool, arguments: c.input } }, pnote: "Toàn bộ thông điệp JSON-RPC (gửi trên một dòng).", hl: ["method", "name", "arguments"], fields: [["jsonrpc, id", "Theo chuẩn JSON-RPC 2.0. Mã id dùng để ghép câu trả lời với đúng câu hỏi."], ["method: tools/call", "Yêu cầu chạy một công cụ."], ["params.name", "Tên công cụ theo cách máy chủ đặt."], ["params.arguments", "Chính là tham số Claude đã điền."]] });
        if (c.db) {
          s.push({ from: "s", to: "d", kind: "req", label: "SQL", title: "Máy chủ truy vấn cơ sở dữ liệu", desc: "Công cụ <code>lookup_order</code> chạy một câu SQL có tham số.", payload: c.db.q, pnote: "Toàn bộ câu lệnh gửi tới cơ sở dữ liệu; giá trị tham số ghi ở chú thích." });
          if (c.db.err) s.push({ from: "d", to: "s", kind: "err", label: "hết giờ", title: "Cơ sở dữ liệu báo hết thời gian chờ", desc: c.server, payload: c.db.err, pnote: "Toàn bộ thông báo lỗi trình điều khiển cơ sở dữ liệu trả về." });
          else s.push({ from: "d", to: "s", kind: c.ok ? "res" : "warn", label: `${c.db.rows.length} dòng`, title: c.ok ? "Cơ sở dữ liệu trả về 0 dòng" : "Cơ sở dữ liệu trả về đơn hàng", desc: c.server, payload: { rows: c.db.rows, rowCount: c.db.rows.length }, pnote: "Toàn bộ kết quả truy vấn." });
        } else {
          s.push({ from: "s", to: "s", kind: "err", via: "bên trong máy chủ MCP, chưa truy vấn gì", title: c.rpcError ? "Máy chủ không tìm thấy công cụ" : "Máy chủ từ chối ngay ở bước kiểm tra", desc: c.check });
        }
        let toolText;
        if (c.rpcError) {
          s.push({ from: "s", to: "h", kind: "err", label: "lỗi giao thức", key: true, title: "Máy chủ trả về lỗi giao thức", desc: "Câu trả lời không có <code>result</code>, chỉ có một khối <code>error</code> với mã lỗi chuẩn. Không có thông tin nào như “loại lỗi” hay “có nên thử lại”.", payload: { jsonrpc: "2.0", id: 42, error: c.rpcError }, pnote: "Toàn bộ thông điệp JSON-RPC.", hl: ["error", "code"] });
          toolText = "MCP error -32602: Unknown tool: lookup_ordr";
        } else if (c.ok) {
          s.push({ from: "s", to: "h", kind: "ok", label: "thành công", key: true, title: "Máy chủ trả về: thành công, danh sách rỗng", desc: "Kết quả ghi rõ <code>isError: false</code> và kèm một câu nói rõ tìm kiếm đã chạy thành công. Như vậy Claude không thể nhầm với trường hợp bị lỗi.", payload: { jsonrpc: "2.0", id: 42, result: { content: [{ type: "text", text: J(c.ok) }], isError: false } }, pnote: "Toàn bộ thông điệp JSON-RPC.", hl: ["isError", "note"], note: "Nếu khi bị lỗi công cụ cũng trả về danh sách rỗng, Claude sẽ không có cách nào phân biệt hai trường hợp." });
          toolText = J(c.ok);
        } else {
          s.push({
            from: "s", to: "h", kind: "err", label: "isError", key: true, title: "Máy chủ trả về kết quả lỗi, kèm thông tin rõ ràng",
            desc: "Đây là lỗi khi chạy công cụ: kết quả có <code>isError: true</code>, và nội dung bên trong cho biết loại lỗi, có nên thử lại không, kèm một câu mô tả dễ hiểu.",
            payload: { jsonrpc: "2.0", id: 42, result: { content: [{ type: "text", text: J(c.body) }], isError: true } }, pnote: "Toàn bộ thông điệp JSON-RPC.",
            hl: ["isError", "errorCategory", "isRetryable"],
            fields: [["isError", "Công cụ đã chạy nhưng thất bại. Claude sẽ đọc được nội dung lỗi để tự xử lý."], ["errorCategory", "Loại lỗi: tạm thời, đầu vào sai, vi phạm chính sách hay không đủ quyền. Mỗi loại cần một cách xử lý khác."], ["isRetryable", "Có nên thử lại không."], ["message / customer_facing", "Mô tả cho Claude hiểu, và nếu có, một câu thân thiện để Claude nói lại với người dùng."]],
          });
          toolText = J(c.body);
        }
        cv.push({ role: "user", content: [{ type: "tool_result", tool_use_id: "toolu_21", ...(c.ok ? {} : { is_error: true }), content: toolText }] });
        s.push({ phase: "Claude quyết định", from: "h", to: "c", kind: c.ok ? "res" : "err", label: "tool_result", title: "Client chuyển kết quả cho Claude", desc: "Client đổi câu trả lời của máy chủ thành một khối <code>tool_result</code> rồi gửi trong request tiếp theo." + (c.rpcError ? " Với lỗi giao thức, nội dung chỉ là một dòng thông báo chung." : ""), ...cv.req({ hl: ["is_error", "tool_result"] }) });
        s.push({ from: "c", to: "h", kind: c.ok || k === "business" || k === "validation" ? "ok" : "warn", label: "bước tiếp", key: true, title: "Claude quyết định bước tiếp theo", desc: c.nextDesc, ...cv.res({ content: [c.next], stop_reason: c.next.type === "tool_use" ? "tool_use" : "end_turn", in: 9940, out: 60 }) });
        return s;
      },
    }),
  };

  /* ───────── 2-3 tool_choice ───────── */
  W.toolChoice = {
    title: "tool_choice: cùng một yêu cầu, bốn cách hành xử",
    render(el) {
      const schema = (props, req) => ({ type: "object", properties: props, required: req });
      const tools = [
        { name: "extract_invoice", description: "Ghi lại các trường của một HÓA ĐƠN.", input_schema: schema({ vendor: { type: "string" }, invoice_no: { type: "string" }, total: { type: "number" }, currency: { type: "string" }, issued: { type: "string", format: "date" } }, ["vendor", "invoice_no", "total"]) },
        { name: "extract_receipt", description: "Ghi lại các trường của một BIÊN LAI bán lẻ.", input_schema: schema({ store: { type: "string" }, total: { type: "number" }, paid_at: { type: "string" } }, ["store", "total"]) },
        { name: "extract_metadata", description: "Ghi lại thông tin chung của MỌI loại tài liệu: loại, ngôn ngữ, số trang.", input_schema: schema({ doc_type: { type: "string" }, language: { type: "string" }, pages: { type: "integer" } }, ["doc_type"]) },
      ];
      const inv = { vendor: "Công ty X", invoice_no: "INV-889", total: 1240, currency: "USD", issued: "2026-03-15" };
      const M = {
        auto: { name: "auto", cfg: { type: "auto" }, content: [{ type: "text", text: "Đây là hóa đơn INV-889 của Công ty X, tổng 1.240 USD, ngày 15/03/2026." }], stop: "end_turn", say: "Claude tự quyết. Ở đây nó chọn trả lời bằng một câu văn, nên bạn không nhận được dữ liệu JSON để lưu. Đây là giá trị mặc định khi có gửi kèm công cụ." },
        any: { name: "any", cfg: { type: "any" }, content: [{ type: "tool_use", id: "toolu_31", name: "extract_invoice", input: inv }], stop: "tool_use", say: "Claude <b>bắt buộc</b> phải gọi một công cụ, nhưng được tự chọn công cụ nào. Nó chọn extract_invoice vì đây là hóa đơn. Phù hợp khi có nhiều loại tài liệu mà chưa biết trước tài liệu sắp tới thuộc loại nào." },
        tool: { name: "chỉ định công cụ", cfg: { type: "tool", name: "extract_metadata" }, content: [{ type: "tool_use", id: "toolu_32", name: "extract_metadata", input: { doc_type: "invoice", language: "vi", pages: 1 } }], stop: "tool_use", say: "Claude <b>bắt buộc</b> gọi đúng công cụ được chỉ định. Dùng khi muốn một bước chắc chắn chạy trước, ví dụ luôn trích thông tin chung của tài liệu đầu tiên." },
        none: { name: "none", cfg: { type: "none" }, content: [{ type: "text", text: "Tài liệu này là một hóa đơn bán hàng của Công ty X, số INV-889." }], stop: "end_turn", say: "Claude <b>không được</b> gọi công cụ, dù danh sách công cụ vẫn được gửi kèm. Dùng cho lượt chỉ cần trả lời bằng chữ, mà vẫn giữ nguyên danh sách công cụ để tận dụng phần đã lưu đệm." },
      };
      let cur = "auto";
      const draw = () => {
        const m = M[cur];
        const req = { model: "claude-haiku-5-5", max_tokens: 1024, tools, tool_choice: m.cfg, messages: [{ role: "user", content: [{ type: "image", source: { type: "base64", media_type: "image/png", data: "<ảnh hóa đơn mã hóa base64, khoảng 180.000 ký tự>" } }, { type: "text", text: "Trích xuất tài liệu này." }] }] };
        const res = { id: "msg_01" + cur.toUpperCase(), type: "message", role: "assistant", model: "claude-haiku-5-5", content: m.content, stop_reason: m.stop, stop_sequence: null, stop_details: null, usage: { input_tokens: 1630, cache_creation_input_tokens: 0, cache_read_input_tokens: 0, output_tokens: m.stop === "tool_use" ? 92 : 40, service_tier: "standard" } };
        el.innerHTML = `<p class="tr-intro">Ba công cụ trích xuất được gửi kèm, cùng ảnh một hóa đơn. Chỉ thay đổi trường <code>tool_choice</code>, xem câu trả lời của Claude khác nhau thế nào.</p>
          <div class="compare-tabs" style="margin-top:14px">${Object.keys(M).map((k) => `<button class="${k === cur ? "on" : ""}" data-k="${k}">${M[k].name}</button>`).join("")}</div>
          <div class="tr-step" style="margin:6px 0 18px"><p class="tr-desc">${m.say}</p></div>
          <div class="tr-details"><div class="tr-tabs"><button class="on">Request: chương trình của bạn → Claude API</button></div><div class="tr-pane"><div class="tr-pmeta">HTTPS · <span>POST https://api.anthropic.com/v1/messages</span></div><div class="tr-badge full"><b>✅ Đầy đủ.</b> Toàn bộ body gửi đi; riêng dữ liệu ảnh (một chuỗi base64 rất dài) được thay bằng một dòng mô tả.</div>${code(req, ["tool_choice"])}</div></div>
          <div class="tr-details" style="margin-top:14px"><div class="tr-tabs"><button class="on">Response: Claude API → chương trình của bạn</button></div><div class="tr-pane"><div class="tr-badge full"><b>✅ Đầy đủ.</b> Toàn bộ body của response.</div>${code(res, ["stop_reason", "content"])}</div></div>
          <div class="callout warn" style="margin-top:16px"><b>Lưu ý khi dùng model mới nhất.</b> Claude Opus 5.5 và Claude Sonnet 5.5 trả lỗi 400 với <code>any</code> và chỉ định công cụ; chỉ nhận <code>auto</code> và <code>none</code>. Ví dụ này dùng Claude Haiku 5.5, model vẫn nhận cả bốn kiểu (khi bị ép gọi công cụ, response không có khối <code>thinking</code>). Đề thi vẫn hỏi theo bốn kiểu như trên.</div>`;
        el.querySelectorAll("[data-k]").forEach((b) => (b.onclick = () => { cur = b.dataset.k; draw(); }));
      };
      draw();
    },
  };

  /* ───────── 2-4 Vòng đời máy chủ MCP ───────── */
  W.mcpLifecycle = {
    title: "Từ file .mcp.json tới lúc Claude dùng được công cụ",
    render: trace({
      intro: "Claude Code đóng vai trò MCP client: nó khởi động từng máy chủ MCP, hỏi xem máy chủ có công cụ gì, rồi đưa những công cụ đó vào request gửi Claude API. Claude và máy chủ MCP không bao giờ nói chuyện trực tiếp với nhau.",
      actors: [
        { id: "h", icon: "🧑‍💻", name: "Claude Code", sub: "MCP client, chạy trên máy bạn", desc: "Đọc cấu hình, khởi động máy chủ MCP, gửi request tới Claude API và chuyển lời gọi công cụ sang máy chủ." },
        { id: "s", icon: "🔌", name: "Máy chủ MCP github", sub: "tiến trình con, nói chuyện qua stdio", desc: "Chương trình <code>@modelcontextprotocol/server-github</code> chạy trên máy bạn. Giữ token GitHub và gọi API của GitHub." },
        { id: "g", icon: "🐙", name: "GitHub API", sub: "api.github.com", desc: "Dịch vụ thật trên Internet. Chỉ máy chủ MCP gọi tới, bằng token của bạn." },
        { id: "c", icon: "🧠", name: "Claude API", sub: "model", desc: "Chỉ thấy danh sách công cụ trong request và trả về yêu cầu dùng công cụ. Không biết công cụ đến từ MCP." },
      ],
      links: { "h>s": "stdio · JSON-RPC 2.0 (mỗi thông điệp một dòng)", "s>h": "stdio · JSON-RPC 2.0", "s>g": "HTTPS · REST API của GitHub", "g>s": "HTTPS · response", "h>c": "HTTPS · POST api.anthropic.com/v1/messages", "c>h": "HTTPS · response 200 OK" },
      stateTitle: "Công cụ Claude đang có",
      controls: [{ id: "tok", type: "toggle", label: "Máy của bạn đã đặt biến môi trường <code>GITHUB_TOKEN</code>", value: true }],
      steps: ({ tok }) => {
        const s = [];
        const ask = "Tạo issue: nút Thanh toán bị lệch trên Safari";
        s.push({
          phase: "Đọc cấu hình", from: "h", to: "h", kind: "internal", key: true, title: "Claude Code đọc file .mcp.json", via: "đọc file .mcp.json ở thư mục gốc của repo",
          desc: tok ? "File này nằm trong repo, cả nhóm dùng chung. Thay vì ghi token thật, file ghi <code>${GITHUB_TOKEN}</code>, và Claude Code lấy giá trị thật từ biến môi trường trên máy của bạn." : "File ghi <code>${GITHUB_TOKEN}</code>, nhưng máy của bạn chưa đặt biến này, nên Claude Code báo lỗi cấu hình và không khởi động máy chủ.",
          payload: { mcpServers: { github: { command: "npx", args: ["-y", "@modelcontextprotocol/server-github"], env: { GITHUB_TOKEN: "${GITHUB_TOKEN}" } } } }, payloadTitle: ".mcp.json (được commit trong repo)", pnote: "Toàn bộ nội dung file.", hl: ["GITHUB_TOKEN"],
          warn: tok ? null : "Lỗi nằm ở máy của bạn, không phải ở repo. Hãy đặt biến GITHUB_TOKEN trên máy mình. Đừng dán token vào file .mcp.json.",
          note: tok ? "Lần đầu gặp máy chủ khai báo trong .mcp.json, Claude Code sẽ hỏi bạn có tin tưởng máy chủ đó không." : null,
          state: [{ r: "sys", t: "Các công cụ có sẵn: Read, Edit, Grep, Glob, Bash…" }],
        });
        const mcpTools = [
          { name: "create_issue", description: "Tạo issue trong repo. Cần owner, repo, title.", inputSchema: { type: "object", properties: { owner: { type: "string" }, repo: { type: "string" }, title: { type: "string" }, body: { type: "string" }, labels: { type: "array", items: { type: "string" } } }, required: ["owner", "repo", "title"] } },
          { name: "search_issues", description: "Tìm issue theo cú pháp tìm kiếm của GitHub.", inputSchema: { type: "object", properties: { q: { type: "string" }, page: { type: "integer" }, per_page: { type: "integer" } }, required: ["q"] } },
        ];
        const asApi = (t) => ({ name: "mcp__github__" + t.name, description: t.description, input_schema: t.inputSchema });
        if (!tok) {
          const cv0 = ccConv([], "M");
          cv0.user(ask);
          s.push({ phase: "Gửi yêu cầu cho Claude", from: "h", to: "c", kind: "err", label: "thiếu công cụ", key: true, title: "Request tới Claude không có công cụ GitHub", desc: "Vì máy chủ không khởi động được, danh sách <code>tools</code> chỉ có các công cụ có sẵn của Claude Code.", ...cv0.req({ hl: ["tools"] }) });
          s.push({ from: "c", to: "h", kind: "err", label: "không làm được", title: "Claude báo không tạo được issue", desc: "Claude không có công cụ nào để tạo issue, nên nó giải thích và gợi ý cách khác.", ...cv0.res({ content: [{ type: "text", text: "Mình chưa có công cụ GitHub trong phiên này nên không tạo issue được. Bạn kiểm tra cấu hình máy chủ MCP github (biến GITHUB_TOKEN), hoặc mình soạn sẵn nội dung issue để bạn tự tạo nhé." }], stop_reason: "end_turn", in: 10240, out: 70 }) });
          return s;
        }
        s.push({ phase: "Khởi động và bắt tay", from: "h", to: "s", kind: "req", label: "khởi động", key: true, title: "Claude Code khởi động máy chủ MCP", via: "tạo tiến trình con (spawn) và nối stdin/stdout của nó", desc: "Máy chủ chạy như một chương trình con trên máy bạn. Hai bên trao đổi qua đường nhập và xuất chuẩn (stdio), mỗi thông điệp JSON nằm trên một dòng. Token chỉ được truyền cho chương trình con này.", payload: "$ npx -y @modelcontextprotocol/server-github\n# biến môi trường truyền cho tiến trình con:\nGITHUB_TOKEN=ghp_••••••••   # giá trị thật lấy từ máy bạn, được che ở đây", pnote: "Toàn bộ lệnh khởi động và biến môi trường; giá trị token được che.", note: "Với máy chủ ở xa, kết nối qua HTTP thay vì stdio, và thường đăng nhập bằng OAuth." });
        s.push({ from: "h", to: "s", kind: "req", label: "initialize", key: true, title: "Client chào hỏi máy chủ", desc: "Bước đầu tiên luôn là <code>initialize</code>: client cho biết nó dùng phiên bản giao thức nào và hỗ trợ những tính năng gì.", payload: { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2026-07-28", capabilities: { roots: { listChanged: true } }, clientInfo: { name: "claude-code", version: "2.1.316" } } }, pnote: "Toàn bộ thông điệp JSON-RPC.", hl: ["protocolVersion", "capabilities"] });
        s.push({ from: "s", to: "h", kind: "res", label: "giới thiệu", title: "Máy chủ cho biết nó cung cấp những gì", desc: "Máy chủ trả lời rằng nó có công cụ (tools) và nội dung để đọc (resources), và sẽ báo cho client khi danh sách công cụ thay đổi.", payload: { jsonrpc: "2.0", id: 1, result: { protocolVersion: "2026-07-28", capabilities: { tools: { listChanged: true }, resources: { subscribe: false } }, serverInfo: { name: "github", version: "1.4.0" } } }, pnote: "Toàn bộ thông điệp JSON-RPC.", hl: ["tools", "resources"] });
        s.push({ from: "h", to: "s", kind: "req", label: "initialized", title: "Client báo đã sẵn sàng", desc: "Đây là một thông báo một chiều, không cần máy chủ trả lời, nên không có mã id.", payload: { jsonrpc: "2.0", method: "notifications/initialized" }, pnote: "Toàn bộ thông điệp JSON-RPC." });
        s.push({ phase: "Lấy danh sách công cụ", from: "h", to: "s", kind: "req", label: "tools/list", title: "Client hỏi danh sách công cụ", desc: "Client gửi <code>tools/list</code> để biết máy chủ có những công cụ nào.", payload: { jsonrpc: "2.0", id: 2, method: "tools/list" }, pnote: "Toàn bộ thông điệp JSON-RPC." });
        s.push({ from: "s", to: "h", kind: "res", label: "danh sách", key: true, title: "Máy chủ gửi định nghĩa các công cụ", desc: "Mỗi công cụ có tên, đoạn mô tả và danh sách tham số (<code>inputSchema</code>). Đoạn mô tả này chính là thứ Claude dựa vào để chọn công cụ, nên chất lượng của nó rất quan trọng.", payload: { jsonrpc: "2.0", id: 2, result: { tools: mcpTools } }, part: "Máy chủ GitHub thật trả về vài chục công cụ (ví dụ get_issue, create_pull_request, list_commits); mỗi công cụ có đúng ba trường như hai công cụ hiện ở đây. Ví dụ chỉ giữ hai công cụ cho dễ đọc.", hl: ["name", "description", "inputSchema"] });
        s.push({ from: "h", to: "h", kind: "internal", key: true, title: "Claude Code đặt tên đầy đủ cho từng công cụ", via: "bên trong Claude Code: đổi tên rồi thêm vào danh sách công cụ của phiên", desc: "Để tránh trùng tên giữa các máy chủ, mỗi công cụ được đặt tên theo dạng <code>mcp__&lt;máy chủ&gt;__&lt;công cụ&gt;</code>. Trường <code>inputSchema</code> của MCP được đổi thành <code>input_schema</code> theo định dạng của Claude API.", payload: mcpTools.map(asApi), payloadTitle: "Hai công cụ sau khi đổi tên, theo định dạng Claude API", pnote: "Toàn bộ định nghĩa sẽ được thêm vào trường <code>tools</code> của request.", hl: ["name"], push: [{ r: "ok", t: "<b>mcp__github__create_issue</b>" }, { r: "ok", t: "<b>mcp__github__search_issues</b>" }] });
        const cv = ccConv(mcpTools.map(asApi), "M");
        cv.user(ask);
        s.push({ phase: "Claude dùng công cụ", from: "h", to: "c", kind: "req", label: "request", title: "Claude nhận công cụ MCP như mọi công cụ khác", desc: "Với Claude, công cụ MCP không có gì khác biệt. Nó chỉ thấy thêm vài công cụ mới trong danh sách <code>tools</code>.", ...cv.req({ hl: ["mcp__github__create_issue"] }) });
        const input = { owner: "acme", repo: "web", title: "Nút Thanh toán bị lệch trên Safari", body: "Cách tái hiện: mở /checkout bằng Safari 18 trên macOS. Nút Thanh toán bị đẩy lệch 12px sang phải." };
        s.push({ from: "c", to: "h", kind: "res", label: "xin tạo issue", key: true, title: "Claude xin dùng công cụ tạo issue", desc: "Claude điền đủ owner, repo, tiêu đề và nội dung.", ...cv.res({ content: [{ type: "tool_use", id: "toolu_41", name: "mcp__github__create_issue", input }], stop_reason: "tool_use", in: 11380, out: 96 }, { hl: ["name", "input"] }) });
        s.push({ from: "h", to: "h", kind: "internal", title: "Claude Code kiểm tra quyền", via: "bên trong Claude Code, trước khi gọi máy chủ", desc: "Nếu công cụ đã được cho phép sẵn trong cài đặt, nó chạy ngay. Nếu chưa, Claude Code hỏi bạn. Nếu có hook PreToolUse, hook cũng chạy ở bước này." });
        s.push({ from: "h", to: "s", kind: "req", label: "tools/call", key: true, title: "Client gọi công cụ trên máy chủ", desc: "Client dùng lại tên gốc <code>create_issue</code> khi nói chuyện với máy chủ.", payload: { jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "create_issue", arguments: input } }, pnote: "Toàn bộ thông điệp JSON-RPC.", hl: ["name"] });
        s.push({ from: "s", to: "g", kind: "req", label: "gọi GitHub", title: "Máy chủ gọi GitHub bằng token của bạn", desc: "Token chỉ tồn tại bên trong chương trình máy chủ MCP. Claude không bao giờ nhìn thấy nó.", views: [{ t: "Gói HTTP đầy đủ", d: http.req("POST", "https://api.github.com/repos/acme/web/issues", { authorization: "Bearer ghp_••••••••   # token của bạn, được che ở đây", accept: "application/vnd.github+json", "x-github-api-version": "2022-11-28", "user-agent": "github-mcp-server/1.4.0" }, { title: input.title, body: input.body }), note: "Toàn bộ request; giá trị token được che." }] });
        s.push({ from: "g", to: "s", kind: "res", label: "201 Created", title: "GitHub tạo issue số 482", desc: "GitHub trả về số issue và đường dẫn.", views: [{ t: "Gói HTTP", d: http.res("201 Created", { location: "https://api.github.com/repos/acme/web/issues/482" }, { number: 482, html_url: "https://github.com/acme/web/issues/482", state: "open", title: input.title, user: { login: "lan-dev" }, created_at: "2026-11-01T09:12:44Z" }), part: "GitHub trả về khoảng 50 trường (nhãn, người được giao, đường dẫn API…); ở đây chỉ hiện các trường thường dùng." }] });
        const resultText = "Đã tạo issue #482: https://github.com/acme/web/issues/482";
        s.push({ from: "s", to: "h", kind: "res", label: "kết quả", title: "Máy chủ trả kết quả cho client", desc: "Kết quả thành công, có <code>isError: false</code>.", payload: { jsonrpc: "2.0", id: 3, result: { content: [{ type: "text", text: resultText }], isError: false } }, pnote: "Toàn bộ thông điệp JSON-RPC." });
        cv.push({ role: "user", content: [{ type: "tool_result", tool_use_id: "toolu_41", content: resultText }] });
        s.push({ phase: "Báo kết quả", from: "h", to: "c", kind: "ok", label: "tool_result", key: true, title: "Claude Code gửi kết quả cho Claude", desc: "Kết quả của máy chủ đi vào request tiếp theo dưới dạng <code>tool_result</code>.", ...cv.req({ hl: ["toolu_41"] }) });
        s.push({ from: "c", to: "h", kind: "ok", label: "end_turn", title: "Claude báo lại cho bạn", desc: "Claude trả lời bằng chữ kèm đường dẫn issue; Claude Code hiển thị câu này trong terminal.", ...cv.res({ content: [{ type: "text", text: "Đã tạo issue #482 “Nút Thanh toán bị lệch trên Safari”: https://github.com/acme/web/issues/482" }], stop_reason: "end_turn", in: 11520, out: 38 }) });
        return s;
      },
    }),
  };

  /* ───────── 2-5 Công cụ có sẵn: tìm hiểu từ từ ───────── */
  const num = (src) => src.split("\n").map((l, i) => String(i + 1).padStart(6) + "\t" + l).join("\n");
  const SERVICE = `import { processPayment } from "../payments/gateway";
import { issueRefund } from "../payments/refunds";
import { markPaid } from "./orders";
import type { Order, Card } from "../types";

export async function checkout(order: Order, card: Card) {
  if (order.items.length === 0) {
    throw new Error("Giỏ hàng trống");
  }
  const res = await processPayment(order.total, card);
  if (!res.ok) {
    return null;
  }
  await markPaid(order.id, res.transactionId);
  return res.transactionId;
}

export async function cancel(order: Order) {
  const refund = await issueRefund(order.id);
  if (!refund.ok) {
    return null;
  }
  return refund.id;
}`;
  const GATEWAY = `export class NetworkError extends Error {}

export async function processPayment(amount: number, card: Card) {
  const r = await fetch(PAY_URL, { method: "POST", body: JSON.stringify({ amount, card }) });
  if (r.status >= 500) {
    throw new NetworkError("Cổng thanh toán lỗi " + r.status);
  }
  const data = await r.json();
  return { ok: data.status === "approved", transactionId: data.id, error: data.reason };
}`;
  const FIXED = SERVICE.replace("  if (!res.ok) {\n    return null;", "  if (!res.ok) {\n    throw new PaymentFailed(res.error);");
  W.builtinTrace = {
    title: "Tìm hiểu code từ từ: Grep, Read, rồi Edit",
    render: trace({
      intro: "Nhiệm vụ: “Thêm xử lý lỗi cho mọi chỗ gọi hàm <code>processPayment()</code>”. Mỗi lần dùng công cụ là một vòng ba bước: Claude API trả về yêu cầu, Claude Code chạy công cụ trên máy bạn, rồi Claude Code gửi kết quả về Claude API.",
      actors: [
        { id: "c", icon: "🧠", name: "Claude API", sub: "model", desc: "Quyết định dùng công cụ nào với tham số gì. Không tự đọc được file trên máy bạn." },
        { id: "h", icon: "🖥️", name: "Claude Code", sub: "chạy trên máy bạn", desc: "Nhận yêu cầu từ Claude API, chạy công cụ (đọc file, tìm kiếm, sửa file, chạy lệnh) rồi gửi kết quả về." },
        { id: "f", icon: "📁", name: "Repo", sub: "file trên ổ đĩa của bạn", desc: "Mã nguồn của dự án. Chỉ Claude Code chạm vào được." },
      ],
      links: { "c>h": "HTTPS · response 200 OK (có khối tool_use)", "h>c": "HTTPS · POST /v1/messages (gửi tool_result)", "h>f": "Claude Code thao tác trực tiếp trên ổ đĩa", "f>h": "dữ liệu đọc từ ổ đĩa / kết quả lệnh" },
      stateTitle: "Những gì Claude đã biết",
      steps: () => {
        const cv = ccConv([], "B");
        cv.user("Thêm xử lý lỗi cho mọi chỗ gọi hàm processPayment()");
        cv.req();
        const s = [];
        const round = (res, hl) => cv.res({ content: res, stop_reason: "tool_use", in: 10400, out: 60 }, { hl });
        const back = (id, text, err) => { cv.push({ role: "user", content: [{ type: "tool_result", tool_use_id: id, ...(err ? { is_error: true } : {}), content: text }] }); return cv.req({ hl: [id] }); };
        s.push({ phase: "Tìm file liên quan", from: "c", to: "h", kind: "res", label: "Grep", key: true, title: "Bắt đầu bằng tìm theo nội dung", desc: "Claude không đọc cả repo. Nó xin dùng Grep để tìm những file có chứa chuỗi “processPayment(”, và chỉ lấy danh sách tên file cho gọn.", ...round([{ type: "tool_use", id: "toolu_61", name: "Grep", input: { pattern: "processPayment\\(", output_mode: "files_with_matches", type: "ts" } }], ["input"]), fields: [["pattern", "Mẫu cần tìm bên trong file."], ["output_mode", "<code>files_with_matches</code> chỉ trả về danh sách file, rất gọn. <code>content</code> trả về cả những dòng khớp."], ["type", "Chỉ tìm trong file TypeScript, để bớt kết quả thừa."]] });
        const grep = "src/checkout/service.ts\nsrc/subscriptions/renew.ts\nsrc/admin/manual-charge.ts";
        s.push({ from: "f", to: "h", kind: "res", label: "3 file", title: "Claude Code tìm trong repo: ba file khớp", via: "Claude Code chạy ripgrep trên thư mục repo, đọc kết quả", desc: "Claude Code chạy công cụ tìm kiếm ripgrep đi kèm với nó. Kết quả chỉ là ba đường dẫn.", payload: grep, pnote: "Toàn bộ kết quả tìm kiếm." });
        s.push({ from: "h", to: "c", kind: "req", label: "tool_result", title: "Gửi danh sách file cho Claude", desc: "Ba đường dẫn tốn rất ít token trong ngữ cảnh.", ...back("toolu_61", grep), push: [{ r: "tool", t: "Grep: có 3 file gọi processPayment" }] });
        s.push({ phase: "Đọc code", from: "c", to: "h", kind: "res", label: "Read", key: true, title: "Đọc file đầu tiên", desc: "Claude xin đọc file service.ts để xem hàm được gọi ở đâu và kết quả được xử lý thế nào.", ...round([{ type: "tool_use", id: "toolu_62", name: "Read", input: { file_path: "/repo/src/checkout/service.ts" } }], ["file_path"]) });
        s.push({ from: "f", to: "h", kind: "res", label: "nội dung", title: "Claude Code đọc file, đánh số dòng", via: "đọc file trên ổ đĩa", desc: "Claude Code đọc file và thêm số dòng ở đầu mỗi dòng. Có hai chỗ cùng viết <code>return null;</code>: dòng 12 thuộc phần thanh toán, dòng 21 thuộc phần hoàn tiền.", payload: num(SERVICE), pnote: "Toàn bộ nội dung file, kèm số dòng do Claude Code thêm.", hl: ["return null;"] });
        s.push({ from: "h", to: "c", kind: "req", label: "tool_result", title: "Gửi nội dung file cho Claude", desc: "Nội dung file (có số dòng) đi vào <code>tool_result</code>.", ...back("toolu_62", num(SERVICE)), push: [{ r: "tool", t: "Đã đọc service.ts (đọc rồi mới được sửa)" }] });
        s.push({ from: "c", to: "h", kind: "res", label: "Read", title: "Lần theo dòng import", desc: "Thay vì đọc cả thư mục, Claude xin mở đúng file được import ở dòng 1.", ...round([{ type: "tool_use", id: "toolu_63", name: "Read", input: { file_path: "/repo/src/payments/gateway.ts" } }], ["file_path"]) });
        s.push({ from: "f", to: "h", kind: "res", label: "nội dung", title: "Nội dung gateway.ts", via: "đọc file trên ổ đĩa", desc: "Hàm này ném ra NetworkError khi cổng thanh toán lỗi, còn khi bị từ chối thì trả về <code>ok: false</code>. Từ đó Claude quyết định cách xử lý lỗi cho phù hợp.", payload: num(GATEWAY), pnote: "Toàn bộ nội dung file." });
        s.push({ from: "h", to: "c", kind: "req", label: "tool_result", title: "Gửi nội dung file cho Claude", desc: "Lịch sử giờ có hai file đã đọc.", ...back("toolu_63", num(GATEWAY)), push: [{ r: "tool", t: "Đã đọc gateway.ts: lỗi mạng ném ra NetworkError" }] });
        s.push({ phase: "Sửa code", from: "c", to: "h", kind: "res", label: "Edit", key: true, title: "Thử sửa với đoạn cần thay quá ngắn", desc: "Claude muốn sửa dòng 12 và đưa đoạn cần thay là <code>return null;</code>.", ...round([{ type: "tool_use", id: "toolu_64", name: "Edit", input: { file_path: "/repo/src/checkout/service.ts", old_string: "return null;", new_string: "throw new PaymentFailed(res.error);" } }], ["old_string"]), fields: [["old_string", "Đoạn văn bản cần thay. Nó phải xuất hiện <b>đúng một lần</b> trong file, trừ khi bật replace_all."], ["new_string", "Nội dung mới."], ["replace_all", "Nếu bật, mọi chỗ khớp đều bị thay. Chỉ dùng khi chắc chắn, ví dụ đổi tên biến."]] });
        s.push({ from: "h", to: "h", kind: "err", key: true, via: "bên trong Claude Code: đọc lại file, đếm số chỗ khớp, không ghi gì", title: "Claude Code thấy đoạn cần thay xuất hiện hai lần", desc: "Edit không biết nên sửa dòng 12 hay dòng 21, nên không ghi gì vào file.", payload: "src/checkout/service.ts:12:    return null;\nsrc/checkout/service.ts:21:    return null;", pnote: "Hai chỗ khớp Claude Code tìm thấy." });
        const err = "Found 2 matches of the string to replace, but replace_all is false. To replace all occurrences, set replace_all to true. To replace only one occurrence, please provide more context to uniquely identify the instance.\nString: return null;";
        s.push({ from: "h", to: "c", kind: "err", label: "lỗi", key: true, title: "Edit báo lỗi cho Claude", desc: "Kết quả là một <code>tool_result</code> có <code>is_error: true</code>, giải thích hai cách xử lý.", ...back("toolu_64", err, true), warn: "Gọi lại y nguyên thì sẽ lỗi mãi. Bật replace_all cũng sai ở đây, vì dòng 21 thuộc phần hoàn tiền và không được đổi." });
        s.push({ from: "c", to: "h", kind: "res", label: "Edit", key: true, title: "Lấy thêm dòng phía trên cho đoạn cần thay là duy nhất", desc: "Claude ghép thêm dòng <code>if (!res.ok) {</code> vào đoạn cần thay. Đoạn mới chỉ xuất hiện ở đúng một chỗ.", ...round([{ type: "tool_use", id: "toolu_65", name: "Edit", input: { file_path: "/repo/src/checkout/service.ts", old_string: "  if (!res.ok) {\n    return null;", new_string: "  if (!res.ok) {\n    throw new PaymentFailed(res.error);" } }], ["old_string"]), note: "Nếu file có nhiều chỗ giống hệt nhau, khó tạo đoạn duy nhất, có thể đọc cả file rồi ghi lại bằng Write." });
        s.push({ from: "h", to: "f", kind: "ok", label: "ghi file", title: "Claude Code ghi file đã sửa", via: "ghi file xuống ổ đĩa", desc: "Claude Code thay đúng một chỗ rồi ghi lại cả file.", views: [{ t: "Phần thay đổi", d: "--- a/src/checkout/service.ts\n+++ b/src/checkout/service.ts\n@@ -10,4 +10,4 @@\n   const res = await processPayment(order.total, card);\n   if (!res.ok) {\n-    return null;\n+    throw new PaymentFailed(res.error);\n   }", part: "Chỉ hiện phần thay đổi (dạng diff); Claude Code ghi lại cả file." }, { t: "Toàn bộ file sau khi ghi", d: FIXED, hl: ["PaymentFailed"] }] });
        const okMsg = "The file /repo/src/checkout/service.ts has been updated. Here's the result of running `cat -n` on a snippet of the edited file:\n" + num(FIXED).split("\n").slice(9, 13).join("\n");
        s.push({ from: "h", to: "c", kind: "ok", label: "tool_result", title: "Báo sửa thành công cho Claude", desc: "Kết quả kèm vài dòng quanh chỗ vừa sửa, để Claude kiểm tra lại.", ...back("toolu_65", okMsg), push: [{ r: "ok", t: "Đã sửa service.ts, dòng 12" }] });
        s.push({ phase: "Kiểm tra", from: "c", to: "h", kind: "res", label: "Bash", key: true, title: "Chạy test để kiểm tra", desc: "Sửa xong, Claude xin dùng Bash để chạy test của phần thanh toán.", ...round([{ type: "tool_use", id: "toolu_66", name: "Bash", input: { command: "npm test -- checkout", description: "Chạy test phần checkout" } }], ["command"]) });
        const testOut = "> shop@1.0.0 test\n> jest checkout\n\nPASS src/checkout/service.test.ts\n  checkout\n    ✓ trả về mã giao dịch khi thanh toán thành công (12 ms)\n    ✓ ném PaymentFailed khi thanh toán bị từ chối (4 ms)\n    ✓ báo lỗi khi giỏ hàng trống (2 ms)\n  cancel\n    ✓ trả về mã hoàn tiền (3 ms)\n    ✓ trả về null khi hoàn tiền thất bại (2 ms)\n\nTests:       5 passed, 5 total\nTime:        1.84 s";
        s.push({ from: "f", to: "h", kind: "ok", label: "5 đạt", title: "Kết quả chạy lệnh trong repo", via: "Claude Code chạy lệnh trong thư mục repo, đọc stdout/stderr", desc: "Cả 5 test đều đạt, kể cả test mới cho trường hợp thanh toán bị từ chối.", payload: testOut, pnote: "Toàn bộ những gì lệnh in ra." });
        s.push({ from: "h", to: "c", kind: "ok", label: "tool_result", title: "Gửi kết quả test cho Claude", desc: "Kết quả lệnh đi vào <code>tool_result</code>.", ...back("toolu_66", testOut), push: [{ r: "ok", t: "Chạy test: 5 test đều đạt" }] });
        s.push({ from: "c", to: "h", kind: "ok", label: "end_turn", key: true, title: "Claude báo cáo kết quả", desc: "Claude trả lời bằng chữ, <code>stop_reason: end_turn</code>. Claude Code hiển thị câu này cho bạn. Hai file còn lại (renew.ts, manual-charge.ts) sẽ được xử lý tương tự ở các vòng tiếp theo.", ...cv.res({ content: [{ type: "text", text: "Đã sửa service.ts: khi thanh toán bị từ chối giờ ném PaymentFailed thay vì trả null; phần hoàn tiền giữ nguyên. Test checkout đạt 5/5. Tiếp theo mình xử lý renew.ts và manual-charge.ts." }], stop_reason: "end_turn", in: 12900, out: 70 }) });
        return s;
      },
    }),
  };
})();
