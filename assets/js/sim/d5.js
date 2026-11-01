/* Mô phỏng chi tiết — Chương 5: Context Management & Reliability */
(function () {
  const { trace, claude, http, net } = window.SIM;
  const { chatIn, chatOut, call, callV, ret } = net;
  const W = window.WIDGETS;
  const J = (o) => JSON.stringify(o);
  const MODEL = "claude-haiku-5-5";
  const U = { id: "u", icon: "👤", name: "Khách", sub: "app chat", desc: "Chỉ nói chuyện với backend qua khung chat; không gọi thẳng Claude." };
  const C = { id: "c", icon: "🧠", name: "Claude API", sub: "Messages API", desc: "Chỉ biết những gì có trong request backend gửi lên. Không nhớ gì giữa các lần gọi." };
  const SHOP_LINKS = { "u>b": "HTTPS · POST /api/chat", "b>u": "HTTPS · response của /api/chat", "b>c": "HTTPS · POST api.anthropic.com/v1/messages", "c>b": "HTTPS · response 200 OK" };

  /* ───────── 5-1 Lắp ráp ngữ cảnh ───────── */
  const RAW = {
    order_id: "8812", status: "delivered", customer_id: "C-301", created_at: "2026-10-03T09:10:22Z", updated_at: "2026-10-06T15:40:01Z",
    charges: [{ id: "ch_1", amount: 1250000, at: "2026-10-03T09:12:00Z" }, { id: "ch_2", amount: 1250000, at: "2026-10-03T09:12:41Z" }],
    refunds: [], payment_method: "card_visa_4242", currency: "VND", subtotal: 1180000, shipping_fee: 70000, discount: 0, tax: 0, total: 1250000,
    items_count: 1, sku_list: ["SHOE-AIR-42"], warehouse_code: "HCM-03", picker_id: "P-77", packer_id: "K-12", package_weight_g: 920, package_dims_cm: "35x22x13",
    carrier: "GHN", tracking_no: "GHN8812VN", shipped_at: "2026-10-04T07:30:00Z", delivered_at: "2026-10-06T15:39:50Z", delivery_attempts: 1, sla_tier: "std",
    address_id: "A-5521", address_changed: true, gift_wrap: false, gift_message: null, invoice_requested: false, loyalty_points_earned: 125, coupon_code: null,
    utm_source: "fb", utm_campaign: "oct-sale", device: "ios", app_version: "5.12.0", ab_bucket: "B", risk_score: 0.07, fraud_review: false,
    support_tickets: 0, nps_sent: false, return_window_days: 30, warranty_months: 6, internal_notes: "", last_synced_at: "2026-10-06T15:41:00Z",
  };
  const KEEP = ["order_id", "status", "charges", "refunds", "payment_method"];
  const SLIM = Object.fromEntries(KEEP.map((k) => [k, RAW[k]]));
  const TURNS = [
    ["user", "Lượt 31: À, tôi đổi địa chỉ nhận hàng rồi, bạn ghi lại giúp số 12 Nguyễn Trãi nhé."],
    ["assistant", "Lượt 32: Mình đã cập nhật địa chỉ giao hàng mới: 12 Nguyễn Trãi, Quận 1."],
    ["user", "Lượt 33: Voucher hôm trước bạn hứa đã vào tài khoản chưa?"],
    ["assistant", "Lượt 34: Voucher 50.000đ đã có trong mục Ưu đãi, hạn dùng tới 30/11."],
    ["user", "Lượt 35: Dùng chung với mã freeship được không?"],
    ["assistant", "Lượt 36: Được bạn nhé, voucher và mã freeship dùng chung được."],
    ["user", "Lượt 37: Ok. Còn chuyện bị trừ tiền thì sao rồi?"],
    ["assistant", "Lượt 38: Mình đang kiểm tra lại giao dịch, bạn chờ mình chút."],
  ];
  W.contextAssembly = {
    title: "Backend sắp xếp ngữ cảnh cho một cuộc trò chuyện dài",
    render: trace({
      intro: "Một cuộc trò chuyện hỗ trợ kéo dài 40 lượt. Mở tab “Ngữ cảnh gồm những gì” để xem nội dung gửi cho Claude thay đổi qua từng bước, và để ý xem câu trả lời cuối có giữ đúng con số không.",
      actors: [U, { id: "b", icon: "🖥️", name: "Backend", sub: "sắp xếp ngữ cảnh", desc: "Giữ lịch sử, quyết định đưa gì vào request: case facts, bản tóm tắt, kết quả công cụ đã cắt gọn, các lượt gần nhất." }, { id: "o", icon: "🗄️", name: "Hệ thống đơn hàng", sub: "API nội bộ", desc: "Trả về bản ghi đơn hàng đầy đủ (47 trường)." }, C],
      links: { ...SHOP_LINKS, "b>o": "HTTP trong mạng nội bộ", "o>b": "HTTP trong mạng nội bộ · response" },
      stateTitle: "Ngữ cảnh gồm những gì",
      controls: [
        { id: "facts", type: "toggle", label: "Giữ khối <b>case facts</b> nguyên văn", value: true },
        { id: "trim", type: "toggle", label: "Cắt gọn kết quả công cụ", value: true },
      ],
      steps: ({ facts, trim }) => {
        const s = [];
        const first = "Đơn #8812 của tôi bị trừ tiền 2 lần, mỗi lần 1.250.000đ, vào ngày 03/10.";
        const CF = { order_id: "8812", issue: "double_charge", amount_each_vnd: 1250000, charge_count: 2, charge_date: "2026-10-03", customer_id: "C-301" };
        s.push({ phase: "Lượt 1: ghi nhận dữ kiện", from: "u", to: "b", kind: "req", label: "lượt 1", title: "Khách nêu những con số quan trọng", desc: "Ngay tin nhắn đầu, khách đưa ra mã đơn, số tiền, số lần bị trừ và ngày giao dịch. Đây là những dữ kiện mà về sau không được phép sai.", ...chatIn(first, "sess_88"), state: [{ r: "sys", t: "Hướng dẫn chung" }, { r: "user", t: "Lượt 1: đơn #8812, bị trừ 2 lần, mỗi lần 1.250.000đ, ngày 03/10" }] });
        if (facts) s.push({ from: "b", to: "b", kind: "internal", key: true, via: "trong backend: lưu vào bản ghi của phiên", title: "Backend chép các con số vào khối case facts", desc: "Backend ghi riêng các dữ kiện quan trọng vào một khối gọi là case facts. Khối này nằm ngoài phần lịch sử trò chuyện, được đặt ở đầu mỗi lần gọi, và <b>không bao giờ</b> bị tóm tắt.", payload: { case_facts: CF }, pnote: "Toàn bộ khối case facts.", state: [{ r: "sys", t: "Hướng dẫn chung" }, { r: "ok", t: "<b>case facts</b>: đơn #8812, 2 lần × 1.250.000đ, ngày 03/10" }, { r: "user", t: "Lượt 1" }] });
        s.push({ from: "b", to: "o", kind: "req", label: "tra đơn", title: "Tra cứu đơn hàng", desc: "Backend gọi hệ thống đơn hàng để kiểm tra (trong thực tế là khi Claude xin chạy công cụ tra đơn).", ...callV("GET", "http://orders.internal/orders/8812") });
        s.push({ from: "o", to: "b", kind: "res", label: "47 trường", title: "Kết quả thô có tới 47 trường", desc: "Chỉ 5 trường là cần cho việc này (trạng thái, các lần trừ tiền, hoàn tiền, phương thức thanh toán). Những trường còn lại như mã kho, mã nhân viên đóng gói hay nguồn quảng cáo hoàn toàn không liên quan.", ...ret(RAW) });
        if (trim) s.push({ from: "b", to: "b", kind: "internal", via: "trong backend: lọc trường trước khi đưa vào lịch sử", title: "Backend chỉ giữ những trường cần thiết", desc: "Từ khoảng 1.100 token, kết quả chỉ còn khoảng 120 token. Lần tra cứu nào cũng được cắt gọn như vậy.", payload: SLIM, payloadTitle: "Kết quả sau khi cắt gọn", pnote: "Toàn bộ phần được giữ lại.", snippet: "KEEP = [\"order_id\", \"status\", \"charges\", \"refunds\", \"payment_method\"]\nslim = {k: raw[k] for k in KEEP if k in raw}", push: [{ r: "tool", t: "Kết quả tra đơn (đã cắt gọn), <b>khoảng 120 token</b>" }] });
        else s.push({ from: "b", to: "b", kind: "warn", via: "trong backend", title: "Đưa nguyên 47 trường vào lịch sử", desc: "Kết quả thô được đưa nguyên vào lịch sử trò chuyện.", push: [{ r: "err", t: "Kết quả tra đơn thô, <b>khoảng 1.100 token</b> mỗi lần tra" }], warn: "Sau 10 lần tra cứu, khoảng 11.000 token thông tin thừa chiếm chỗ trong ngữ cảnh, đẩy những dữ kiện quan trọng vào phần giữa, nơi dễ bị bỏ sót." });
        s.push({ phase: "Cuộc trò chuyện kéo dài", from: "u", to: "b", kind: "req", label: "lượt 37", title: "Cuộc trò chuyện kéo dài", desc: "Khách hỏi thêm nhiều chuyện khác: đổi địa chỉ, hỏi về voucher… Lịch sử dài vượt ngưỡng, nên backend bắt đầu tóm tắt các lượt cũ cho đỡ tốn chỗ.", ...chatIn("Ok. Còn chuyện bị trừ tiền thì sao rồi?", "sess_88") });
        const sv = claude({ model: MODEL, max_tokens: 1024, system: "Tóm tắt đoạn hội thoại hỗ trợ khách hàng dưới đây trong 3 câu." }, { tag: "Z" });
        sv.user("<transcript>\nLượt 1 (khách): " + first + "\nLượt 2 (agent): Mình rất tiếc, để mình kiểm tra đơn #8812 nhé.\nLượt 3 (khách): Nhanh giúp tôi, tôi cần tiền gấp.\n</transcript>");
        s.push({ from: "b", to: "c", kind: "req", label: "nhờ tóm tắt", title: "Backend nhờ Claude tóm tắt lượt 1 tới 30", desc: "Tóm tắt là một request riêng, không thuộc cuộc trò chuyện với khách.", views: sv.req().views.map((v) => ({ ...v, part: "Bản thật chứa nguyên văn 30 lượt (khoảng 6.000 token) trong thẻ &lt;transcript&gt;; ở đây hiện 3 lượt đầu. Mọi phần khác của request là đầy đủ." })) });
        const sum = "Khách phàn nàn bị trừ tiền nhiều lần cho một đơn hàng và muốn được hoàn tiền. Đã đổi địa chỉ giao hàng. Đã hỏi về voucher.";
        s.push({ from: "c", to: "b", kind: "warn", label: "bản tóm tắt", key: true, title: "Bản tóm tắt làm mất các con số", desc: "Bản tóm tắt giữ được ý chính, nhưng các con số cụ thể đã biến mất: “nhiều lần” thay vì “2 lần”, và không còn số tiền hay ngày giao dịch.", ...sv.res({ content: [{ type: "text", text: sum }], stop_reason: "end_turn", in: 6120, out: 58 }, { hl: ["text"] }), warn: "Đây chính là cách thông tin quan trọng bị mất dần trong những cuộc trò chuyện dài." });
        const layout = (facts ? [{ r: "ok", t: "<b>case facts</b>: đơn #8812, 2 lần × 1.250.000đ, ngày 03/10 <i>(đặt ở đầu)</i>" }] : []).concat([{ r: "note", t: "Bản tóm tắt lượt 1 tới 30 (đã nén)" }], trim ? [{ r: "tool", t: "Kết quả tra đơn đã cắt gọn" }] : [{ r: "err", t: "Kết quả tra đơn thô, khoảng 11.000 token" }], [{ r: "user", t: "Lượt 31 tới 38 (giữ nguyên văn)" }]);
        const ask = "Vậy tôi sẽ được hoàn bao nhiêu?";
        s.push({ phase: "Lượt 39: câu hỏi quyết định", from: "u", to: "b", kind: "req", label: "lượt 39", title: "Khách hỏi số tiền được hoàn", desc: "Câu trả lời đúng cần cả ba con số: số lần bị trừ, số tiền mỗi lần, và ngày giao dịch.", ...chatIn(ask, "sess_88") });
        const cv = claude({ model: MODEL, max_tokens: 1024, system: "Bạn là agent chăm sóc khách hàng của ShopX. Luôn dựa vào <case_facts> khi nhắc tới số liệu." });
        const head = (facts ? `<case_facts>${J(CF)}</case_facts>\n` : "") + `<summary lượt="1-30">${sum}</summary>\n<order_lookup>${J(trim ? SLIM : RAW)}</order_lookup>\n` + TURNS[0][1];
        cv.user(head);
        TURNS.slice(1).forEach(([r, t]) => cv.push({ role: r, content: t }));
        cv.user(ask);
        s.push({ from: "b", to: "c", kind: "req", label: "lượt 39", key: true, title: "Nội dung gửi cho Claude ở lượt 39", desc: facts ? "Khối case facts nằm ngay đầu, có thẻ đánh dấu rõ ràng, nên Claude dễ dàng tìm thấy các con số chính xác." : "Không có khối case facts. Các con số chính xác chỉ còn nằm trong lượt 1, mà lượt 1 đã bị thay bằng bản tóm tắt.", ...cv.req({ hl: ["case_facts", "summary"], since: cv.msgs.length - 1 }), state: [{ r: "sys", t: "Hướng dẫn chung" }].concat(layout) });
        const ans = facts ? "Bạn bị trừ trùng 1 lần, nên sẽ được hoàn 1.250.000đ cho giao dịch ngày 03/10." : "Bạn sẽ được hoàn lại khoản bị trừ thừa, khoảng hơn 1 triệu đồng.";
        s.push({ from: "c", to: "b", kind: facts ? "ok" : "err", label: facts ? "đúng" : "mơ hồ", title: facts ? "Claude trả lời đúng con số" : "Claude trả lời mơ hồ, có thể sai", desc: facts ? "Khách bị trừ trùng một lần, nên được hoàn 1.250.000đ cho giao dịch ngày 03/10." : "Không còn con số chính xác, Claude chỉ có thể trả lời chung chung.", ...cv.res({ content: [{ type: "text", text: ans }], stop_reason: "end_turn", in: trim ? 1480 : 12400, out: 36 }), warn: facts ? null : "Đổi sang model có ngữ cảnh lớn hơn không sửa được lỗi này, vì vấn đề nằm ở chỗ bản tóm tắt đã làm mất dữ kiện." });
        s.push({ from: "b", to: "u", kind: facts ? "ok" : "err", label: "trả lời", title: "Khách nhận câu trả lời", desc: "Backend chuyển phần chữ cho khách.", ...chatOut(ans) });
        return s;
      },
    }),
  };

  /* ───────── 5-2 Chuyển cho nhân viên ───────── */
  W.handoffTrace = {
    title: "Khi nào chuyển cho nhân viên, và chuyển kèm những gì",
    render: trace({
      intro: "Ba tình huống khác nhau dẫn tới ba cách xử lý khác nhau. Khi agent chuyển cho nhân viên, hãy để ý xem nhân viên nhận được những thông tin gì.",
      actors: [U, { id: "b", icon: "🖥️", name: "Backend", sub: "app chat + chạy công cụ", desc: "Nhận tin nhắn, gửi request tới Claude API, chạy công cụ (tra đơn, tạo ticket)." }, C, { id: "h", icon: "🧑‍💼", name: "Helpdesk", sub: "hệ thống ticket + nhân viên", desc: "Hệ thống ticket nội bộ; nhân viên xem thẻ vụ việc trên màn hình của nó." }],
      links: { ...SHOP_LINKS, "b>h": "HTTPS · API của hệ thống helpdesk", "h>b": "HTTPS · response của helpdesk" },
      controls: [{ id: "k", type: "select", label: "Khách nói:", value: "ask", options: [["ask", "“Cho tôi gặp nhân viên.”"], ["gap", "“Bên kia bán rẻ hơn, giảm giá cho tôi đi.”"], ["angry", "“Giao trễ 2 ngày, bực quá!” (việc đơn giản)"]] }],
      steps: ({ k }) => {
        const s = [];
        const msg = { ask: "Tôi đã nói 3 lần rồi, cho tôi gặp nhân viên.", gap: "Shop Y bán rẻ hơn 300.000đ, giảm cho tôi bằng giá đó đi.", angry: "Giao trễ 2 ngày rồi, bực quá! Đơn #5521 đâu rồi?" }[k];
        const tools = [
          { name: "lookup_order", description: "Tra trạng thái và vị trí của một đơn hàng.", input_schema: { type: "object", properties: { order_id: { type: "string" } }, required: ["order_id"] } },
          { name: "escalate_to_human", description: "Chuyển vụ việc cho nhân viên. Dùng khi khách yêu cầu gặp người, hoặc khi chính sách không quy định trường hợp này. Phải kèm bản tóm tắt đầy đủ.", input_schema: { type: "object", properties: { customer_id: { type: "string" }, verified: { type: "boolean" }, channel: { type: "string" }, issue_type: { type: "string" }, summary: { type: "string" }, facts: { type: "object" }, actions_taken: { type: "array", items: { type: "string" } }, recommended_action: { type: "string" }, priority: { enum: ["low", "normal", "high"] } }, required: ["customer_id", "issue_type", "summary", "facts", "actions_taken", "recommended_action"] } },
        ];
        const cv = claude({ model: MODEL, max_tokens: 1024, system: "Bạn là agent hỗ trợ của ShopX. Khách C-301 đã được xác minh. Chính sách: giao trễ thì tặng voucher 50.000đ; điều chỉnh giá chỉ theo giá của chính ShopX. Khách yêu cầu gặp người thì chuyển ngay.", tools }, { tag: "Q" });
        if (k === "ask") { cv.user("Tôi bị trừ tiền 2 lần cho đơn #8812, cho tôi gặp nhân viên."); cv.push({ role: "assistant", content: "Mình rất tiếc. Mình đã thấy 2 giao dịch trùng ngày 03/10, để mình kiểm tra thêm nhé." }); cv.user("Cho tôi gặp người thật."); cv.push({ role: "assistant", content: "Mình hiểu. Bạn cho mình thêm một phút để kiểm tra hoàn tiền tự động được không?" }); cv.req(); }
        s.push({ phase: "Khách nhắn tin", from: "u", to: "b", kind: "req", label: "tin nhắn", title: "Khách nhắn tin", desc: { ask: "Khách yêu cầu rõ ràng được nói chuyện với người thật, lần thứ ba.", gap: "Khách lịch sự, nhưng đưa ra một yêu cầu mà chính sách chưa quy định.", angry: "Khách rất bực, nhưng vấn đề thì đơn giản." }[k], ...chatIn(msg, "sess_88") });
        cv.user(msg);
        s.push({ from: "b", to: "c", kind: "req", label: "request", title: "Backend gửi cho Claude", desc: "System ghi rõ chính sách và khi nào phải chuyển cho người; có hai công cụ: tra đơn và chuyển cho nhân viên.", ...cv.req({ hl: ["system", "escalate_to_human"] }) });
        if (k === "angry") {
          s.push({ phase: "Claude tự xử lý", from: "c", to: "c", kind: "internal", via: "bên trong Claude API, trước khi trả response", title: "Claude đánh giá: việc này tự xử lý được", desc: "Khách không yêu cầu gặp người. Chính sách có quy định rõ: giao trễ thì tặng voucher 50.000đ. Khách bực không có nghĩa là vụ việc khó, nên không cần chuyển." });
          s.push({ from: "c", to: "b", kind: "res", label: "lookup_order", title: "Claude xin tra đơn", desc: "Claude xin tra vị trí đơn hàng để trả lời khách.", ...cv.res({ content: [{ type: "tool_use", id: "toolu_91", name: "lookup_order", input: { order_id: "5521" } }], stop_reason: "tool_use", in: 860, out: 40 }) });
          const o = { order_id: "5521", status: "in_transit", location: "Bưu cục Quận 3", eta: "2026-11-01T17:00:00+07:00", days_late: 2 };
          s.push({ from: "b", to: "b", kind: "internal", via: "backend gọi API đơn hàng nội bộ (http://orders.internal)", title: "Backend chạy công cụ tra đơn", desc: "Backend gọi hệ thống đơn hàng và nhận kết quả.", views: [{ t: "Request và response", parts: [call("GET", "http://orders.internal/orders/5521"), { t: "Response", d: http.res("200 OK", {}, o) }], note: "Toàn bộ request và response nội bộ." }] });
          cv.push({ role: "user", content: [{ type: "tool_result", tool_use_id: "toolu_91", content: J(o) }] });
          s.push({ from: "b", to: "c", kind: "req", label: "tool_result", title: "Gửi kết quả cho Claude", desc: "Lại toàn bộ cuộc trò chuyện, thêm kết quả tra đơn.", ...cv.req({ hl: ["toolu_91"] }) });
          const txt = "Mình rất tiếc vì đơn #5521 bị trễ 2 ngày. Đơn đang ở bưu cục Quận 3, dự kiến giao chiều nay. Mình đã tặng bạn voucher 50.000đ vì sự chậm trễ này. Nếu bạn vẫn muốn trao đổi với nhân viên, mình chuyển ngay nhé.";
          s.push({ from: "c", to: "b", kind: "ok", label: "end_turn", title: "Ghi nhận cảm xúc và giải quyết luôn", desc: "Claude xin lỗi, báo vị trí đơn hàng, tặng voucher theo chính sách, và vẫn sẵn sàng chuyển cho nhân viên nếu khách muốn.", ...cv.res({ content: [{ type: "text", text: txt }], stop_reason: "end_turn", in: 960, out: 90 }) });
          s.push({ from: "b", to: "u", kind: "ok", label: "trả lời", key: true, title: "Khách nhận câu trả lời", desc: "Vấn đề được giải quyết ngay, không cần nhân viên.", ...chatOut(txt) });
          return s;
        }
        s.push({ phase: "Claude quyết định chuyển", from: "c", to: "c", kind: "internal", via: "bên trong Claude API, trước khi trả response", title: k === "ask" ? "Khách yêu cầu rõ ràng, chuyển ngay" : "Chính sách chưa quy định, cần người có thẩm quyền", desc: k === "ask" ? "Claude không cố “giải quyết thêm một chút”, và cũng không hỏi vì sao khách muốn gặp người. Tôn trọng yêu cầu của khách là ưu tiên." : "Chính sách chỉ nói về điều chỉnh giá nội bộ, không nói gì về giảm giá theo giá đối thủ. Agent không được tự đặt ra chính sách mới." });
        const handoff = { customer_id: "C-301", verified: true, channel: "chat", issue_type: k === "ask" ? "customer_requested_human" : "policy_gap_price_match", summary: k === "ask" ? "Khách yêu cầu gặp nhân viên sau 3 lần nhắc. Vấn đề gốc: bị trừ tiền 2 lần cho đơn #8812." : "Khách muốn được giảm bằng giá của Shop Y (rẻ hơn 300.000đ) cho đơn #9034. Chính sách chưa quy định việc giảm theo giá đối thủ.", facts: k === "ask" ? { order_id: "8812", amount_each_vnd: 1250000, charge_count: 2, charge_date: "2026-10-03" } : { order_id: "9034", our_price_vnd: 2490000, competitor: "Shop Y", competitor_price_vnd: 2190000, evidence_url: "https://shop-y.example/p/123" }, actions_taken: k === "ask" ? ["Đã xác minh khách qua email", "Đã xác nhận có 2 giao dịch trùng"] : ["Đã xác minh khách", "Đã kiểm tra chính sách điều chỉnh giá"], recommended_action: k === "ask" ? "Hoàn 1.250.000đ cho giao dịch thứ hai" : "Quyết định có áp dụng ngoại lệ hay không", priority: "normal" };
        s.push({ from: "c", to: "b", kind: "res", label: "escalate_to_human", key: true, title: "Claude xin chuyển cho người, kèm bản tóm tắt có cấu trúc", desc: "Bản bàn giao gồm: khách là ai, chuyện gì xảy ra, các con số chính xác, agent đã làm gì, và đề xuất cách xử lý. Nhân viên đọc là có thể làm ngay.", ...cv.res({ content: [{ type: "tool_use", id: "toolu_92", name: "escalate_to_human", input: handoff }], stop_reason: "tool_use", in: k === "ask" ? 1020 : 880, out: 210 }, { hl: ["summary", "facts", "actions_taken", "recommended_action"] }), fields: [["summary", "Một đoạn ngắn kể lại chuyện gì đã xảy ra."], ["facts", "Các con số chính xác, để nhân viên không phải đọc lại đoạn chat."], ["actions_taken", "Những việc agent đã làm, để nhân viên không phải hỏi lại khách."], ["recommended_action", "Đề xuất của agent, giúp nhân viên quyết định nhanh hơn."]] });
        const queue = k === "ask" ? "billing" : "policy-exception";
        s.push({ phase: "Tạo ticket", from: "b", to: "h", kind: "req", label: "tạo ticket", key: true, title: "Backend kiểm tra rồi tạo ticket", desc: "Backend kiểm tra bản bàn giao có đủ các trường bắt buộc, đính kèm đường dẫn tới toàn bộ đoạn chat (để tra khi cần, không bắt phải đọc), rồi gửi vào đúng hàng đợi.", ...callV("POST", "https://helpdesk.example.vn/api/tickets", { queue, transcript_url: "https://admin.shop.example.vn/chats/sess_88", card: handoff }) });
        s.push({ from: "h", to: "b", kind: "ok", label: "T-20931", title: "Helpdesk tạo ticket và hiện thẻ cho nhân viên", desc: "Nhân viên thấy ngay toàn bộ thông tin cần thiết, không phải đọc 140 tin nhắn, và khách cũng không phải kể lại từ đầu.", ...ret({ ticket: "T-20931", queue, status: "open", eta_minutes: 8 }, "201 Created") });
        cv.push({ role: "user", content: [{ type: "tool_result", tool_use_id: "toolu_92", content: J({ ticket: "T-20931", eta_minutes: 8 }) }] });
        s.push({ phase: "Báo cho khách", from: "b", to: "c", kind: "req", label: "tool_result", title: "Backend trả mã ticket cho Claude", desc: "Kèm thời gian chờ dự kiến.", ...cv.req({ hl: ["toolu_92"] }) });
        const txt = "Mình đã chuyển bạn tới nhân viên (mã T-20931), thời gian chờ khoảng 8 phút. Nhân viên đã có đầy đủ thông tin, bạn không cần kể lại từ đầu.";
        s.push({ from: "c", to: "b", kind: "ok", label: "end_turn", title: "Claude viết câu báo cho khách", desc: "Chỉ có chữ, <code>stop_reason: end_turn</code>.", ...cv.res({ content: [{ type: "text", text: txt }], stop_reason: "end_turn", in: 1300, out: 60 }) });
        s.push({ from: "b", to: "u", kind: "ok", label: "báo khách", key: true, title: "Khách biết rõ chuyện gì đang xảy ra", desc: "Khách biết đã được chuyển, mã ticket là gì, phải chờ bao lâu, và không cần kể lại.", ...chatOut(txt) });
        return s;
      },
    }),
  };

  /* ───────── 5-3 Lan truyền lỗi ───────── */
  const SRC = ["news", "arxiv", "industry-db", "survey-hub", "journal-db"];
  const HITS = {
    news: [{ title: "Nền tảng nhạc gắn nhãn bài hát tạo bởi AI", url: "https://news.example/ai-label", date: "2026-03-02" }, { title: "Hãng thu âm ký thỏa thuận cấp phép dữ liệu cho AI", url: "https://news.example/label-deal", date: "2025-11-20" }, { title: "Ca sĩ kiện ứng dụng giả giọng", url: "https://news.example/voice-suit", date: "2026-02-14" }],
    arxiv: [{ title: "Measuring AI adoption among independent musicians", url: "https://arxiv.example/2504.01234", date: "2025-04-03" }, { title: "Detecting AI-generated vocals at scale", url: "https://arxiv.example/2601.04567", date: "2026-01-12" }],
    "industry-db": [{ title: "Tỷ lệ bài phát hành có dùng AI: 18% (2025)", url: "https://industry.example/stat/ai-share", date: "2026-01-05" }, { title: "Doanh thu công cụ AI cho nhạc sĩ", url: "https://industry.example/stat/tools", date: "2025-12-18" }],
    "survey-hub": [{ title: "Khảo sát 2.000 nhạc sĩ về dùng AI", url: "https://survey.example/musicians-2025", date: "2025-09-30" }, { title: "Người nghe có phân biệt được nhạc AI?", url: "https://survey.example/listeners", date: "2026-02-01" }],
  };
  const ALL9 = Object.entries(HITS).flatMap(([src, xs]) => xs.map((x) => ({ source: src, ...x })));
  W.errorPropTrace = {
    title: "Một trong năm nguồn bị lỗi: agent con nên báo lên thế nào?",
    render: trace({
      intro: "Agent tìm kiếm truy vấn năm nguồn, và nguồn <code>journal-db</code> bị quá thời gian chờ. Chọn cách agent con xử lý lỗi để xem hậu quả ở báo cáo cuối. Coordinator và agent con là hai hội thoại riêng với Claude API; Agent SDK đứng giữa, chạy công cụ và chuyển kết quả.",
      actors: [
        { id: "a", icon: "🖥️", name: "Ứng dụng", sub: "nhận báo cáo cuối", desc: "Chương trình của bạn, gọi <code>query()</code> và nhận kết quả cuối." },
        { id: "k", icon: "⚙️", name: "Agent SDK", sub: "trong ứng dụng", desc: "Gửi request cho từng hội thoại, chạy công cụ (gọi 5 nguồn), chuyển kết quả của agent con về coordinator." },
        { id: "c", icon: "🧭", name: "Coordinator", sub: "Claude · hội thoại chính", desc: "Giao việc và viết báo cáo. Chỉ biết những gì agent con báo lên." },
        { id: "s", icon: "🔎", name: "Agent tìm kiếm", sub: "Claude · hội thoại riêng", desc: "Quyết định truy vấn nguồn nào, xử lý lỗi ra sao, và báo kết quả gì lên." },
        { id: "n", icon: "🌐", name: "5 nguồn dữ liệu", sub: "API bên ngoài", desc: "news, arxiv, industry-db, survey-hub, journal-db." },
      ],
      links: { "c>k": "HTTPS · response 200 OK (hội thoại coordinator)", "k>c": "HTTPS · POST /v1/messages (hội thoại coordinator)", "k>s": "HTTPS · POST /v1/messages (hội thoại agent con)", "s>k": "HTTPS · response 200 OK (hội thoại agent con)", "k>n": "HTTPS · 5 request song song tới 5 API", "n>k": "HTTPS · response (hoặc hết giờ chờ)", "k>a": "query() trả về message cuối (type: result)" },
      stateTitle: "Coordinator biết gì về độ bao phủ",
      controls: [{ id: "m", type: "select", label: "Agent con xử lý lỗi bằng cách:", value: "good", options: [["good", "Báo lỗi rõ ràng, kèm phần kết quả đã có"], ["swallow", "Giấu lỗi, báo là thành công"], ["crash", "Dừng hẳn, bỏ hết kết quả"]] }],
      steps: ({ m }) => {
        const s = [];
        const PART = "Agent SDK tự dựng request này. <code>messages</code> hiện đầy đủ; <code>system</code> và <code>tools</code> chỉ hiện phần quyết định hành vi.";
        const cv = claude({ model: "claude-opus-5-5", max_tokens: 32000, system: "Bạn là coordinator nghiên cứu. Ghi rõ độ bao phủ nguồn trong báo cáo.", tools: [{ name: "Task" }] }, { part: PART, tag: "C" });
        cv.user("Viết báo cáo về áp dụng AI trong âm nhạc 2024–2026.");
        cv.req();
        const brief = "Thu thập số liệu áp dụng AI trong âm nhạc 2024–2026 từ: news, arxiv, industry-db, survey-hub, journal-db. Trả về JSON {status, results, errors, coverage}.";
        s.push({ phase: "Giao việc", from: "c", to: "k", kind: "res", label: "Task", title: "Coordinator giao việc tìm kiếm", desc: "Response của coordinator chứa lệnh Task. Phiếu giao việc yêu cầu tìm ở năm nguồn, và trả kết quả kèm danh sách lỗi cùng độ bao phủ.", ...cv.res({ content: [{ type: "tool_use", id: "toolu_T1", name: "Task", input: { description: "Tìm số liệu AI trong âm nhạc", prompt: brief, subagent_type: "search" } }], stop_reason: "tool_use", in: 2100, out: 120 }, { hl: ["prompt"] }), state: [] });
        const sv = claude({ model: "claude-haiku-5-5", max_tokens: 8192, system: "Bạn chuyên tìm kiếm. Báo lỗi rõ ràng: nguồn nào lỗi, loại lỗi, đã thử gì.", tools: [{ name: "search_source", description: "Truy vấn một nguồn dữ liệu.", input_schema: { type: "object", properties: { source: { enum: SRC.concat("scholar-api") }, query: { type: "string" } }, required: ["source", "query"] } }] }, { part: PART, tag: "S" });
        sv.user(brief);
        s.push({ from: "k", to: "s", kind: "req", label: "phiếu giao việc", title: "Agent SDK mở hội thoại cho agent con", desc: "Request đầu tiên của agent tìm kiếm chỉ có phiếu giao việc.", ...sv.req() });
        const q = "AI music adoption 2024..2026";
        s.push({ phase: "Truy vấn 5 nguồn", from: "s", to: "k", kind: "res", label: "5 tool_use", title: "Agent con xin truy vấn cùng lúc năm nguồn", desc: "Năm lệnh <code>search_source</code> trong cùng một response, để SDK chạy song song.", ...sv.res({ content: SRC.map((src, i) => ({ type: "tool_use", id: "toolu_Q" + (i + 1), name: "search_source", input: { source: src, query: q } })), stop_reason: "tool_use", in: 640, out: 180 }) });
        s.push({ from: "k", to: "n", kind: "req", label: "5 request", title: "Agent SDK gọi năm API", desc: "Mỗi lệnh thành một request HTTP tới đúng nguồn.", views: [{ t: "5 request HTTP", parts: SRC.map((src) => ({ t: src, d: http.req("GET", `https://${src}.example/api/search?q=AI+music+adoption&from=2024&to=2026`, { authorization: "Bearer $" + src.toUpperCase().replace("-", "_") + "_KEY" }) })), note: "Toàn bộ năm request. Lệnh GET không có body." }] });
        s.push({ from: "n", to: "k", kind: "err", label: "4 được, 1 lỗi", title: "Bốn nguồn trả dữ liệu, journal-db bị quá thời gian chờ", desc: "Có 9 kết quả từ bốn nguồn. Riêng journal-db không phản hồi sau 10 giây, nên SDK tự ngắt kết nối.", views: [{ t: "5 response", parts: Object.entries(HITS).map(([src, xs]) => ({ t: src, d: http.res("200 OK", {}, { results: xs }) })).concat([{ t: "journal-db", d: "(không có response: kết nối bị ngắt sau 10 giây chờ, lỗi ETIMEDOUT)" }]), note: "Toàn bộ bốn response, và mô tả lỗi của nguồn thứ năm." }] });
        sv.push({ role: "user", content: SRC.map((src, i) => (src === "journal-db" ? { type: "tool_result", tool_use_id: "toolu_Q5", is_error: true, content: "ETIMEDOUT: journal-db không phản hồi sau 10 giây" } : { type: "tool_result", tool_use_id: "toolu_Q" + (i + 1), content: J({ results: HITS[src] }) })) });
        s.push({ from: "k", to: "s", kind: "req", label: "5 kết quả", title: "SDK gửi năm kết quả cho agent con", desc: "Bốn kết quả bình thường và một kết quả <code>is_error: true</code>, chung một tin nhắn.", ...sv.req({ hl: ["is_error"] }) });
        s.push({ from: "s", to: "s", kind: "internal", via: "2 vòng request/response nữa (thử lại journal-db), gộp lại thành một bước", title: "Agent con tự thử lại trước (gộp 2 vòng)", desc: "Đây là lỗi tạm thời, nên agent con thử lại hai lần, lần sau chờ lâu hơn lần trước (2 giây rồi 4 giây). Vẫn lỗi, nên nó dừng thử, không thử mãi. Đổi sang nguồn khác là quyết định của coordinator, không phải của agent con.", payload: [{ attempt: 2, tool_use: { name: "search_source", input: { source: "journal-db", query: q } }, result: "ETIMEDOUT sau 10 giây" }, { attempt: 3, tool_use: { name: "search_source", input: { source: "journal-db", query: q } }, result: "ETIMEDOUT sau 10 giây" }], pnote: "Toàn bộ hai lần thử lại: lệnh agent con xin chạy và kết quả SDK trả về." });
        const cover = { news: "ok", arxiv: "ok", "industry-db": "ok", "survey-hub": "ok", "journal-db": "missing" };
        let final, isErr = false;
        if (m === "good") final = { status: "partial", results: ALL9, errors: [{ source: "journal-db", type: "transient", detail: "quá thời gian chờ 10 giây, đã thử lại 2 lần", attempted_query: q, alternatives: ["thử lại sau 15 phút", "dùng scholar-api cho nghiên cứu học thuật"] }], coverage: cover };
        else if (m === "swallow") final = { status: "success", results: ALL9 };
        else { final = "RuntimeError: journal-db timeout"; isErr = true; }
        const finalText = typeof final === "string" ? final : J(final);
        s.push({ phase: "Báo kết quả lên", from: "s", to: "k", kind: m === "good" ? "warn" : "err", label: m === "good" ? "một phần" : m === "swallow" ? "thành công (sai)" : "dừng hẳn", key: true,
          title: { good: "Trả về kết quả một phần, kèm mô tả lỗi rõ ràng", swallow: "Báo thành công, giấu lỗi", crash: "Dừng hẳn và bỏ luôn 9 kết quả" }[m],
          desc: { good: "Trạng thái là <code>partial</code> (một phần). Agent con gửi kèm 9 kết quả đã có, mô tả lỗi của journal-db (đã thử gì, thử mấy lần), và gợi ý các phương án thay thế.", swallow: "Agent con trả về 9 kết quả và ghi trạng thái là thành công, không nhắc gì tới journal-db.", crash: "Agent con báo lỗi chung chung rồi dừng. Kết quả của bốn nguồn tốt cũng bị bỏ đi, và thông báo lỗi không nói đã thử những gì hay có thể làm gì khác." }[m],
          ...sv.res({ content: [{ type: "text", text: finalText }], stop_reason: "end_turn", in: 2400, out: m === "crash" ? 12 : 640 }, { hl: ["text"] }),
          warn: m === "swallow" ? "Coordinator sẽ tưởng đã tìm đủ cả năm nguồn, nên không có lý do gì để thử nguồn khác." : null });
        cv.push({ role: "user", content: [{ type: "tool_result", tool_use_id: "toolu_T1", ...(isErr ? { is_error: true } : {}), content: finalText }] });
        s.push({ from: "k", to: "c", kind: m === "good" ? "warn" : "err", label: "tool_result", key: true, title: "Coordinator nhận đúng những gì agent con báo", desc: "SDK đặt câu trả lời cuối của agent con vào <code>tool_result</code> của lệnh Task. Coordinator không thấy gì khác: không thấy các lần thử lại, không thấy response của từng nguồn.", ...cv.req({ hl: ["toolu_T1"] }), push: { good: [{ r: "ok", t: "4 trên 5 nguồn có dữ liệu" }, { r: "err", t: "journal-db: thiếu (lỗi tạm thời)" }], swallow: [{ r: "err", t: "Tưởng cả 5 nguồn đều ổn (thực ra không phải)" }], crash: [{ r: "err", t: "Không có dữ liệu nào" }] }[m] });
        let report;
        if (m === "good") {
          s.push({ phase: "Coordinator xử lý", from: "c", to: "k", kind: "res", label: "Task mới", title: "Coordinator giao thêm việc với nguồn thay thế", desc: "Nghiên cứu học thuật quan trọng với đề tài này, nên coordinator thử phương án thay thế: giao một việc mới, chỉ tìm ở scholar-api. Nếu vẫn thiếu, báo cáo sẽ ghi rõ.", ...cv.res({ content: [{ type: "tool_use", id: "toolu_T2", name: "Task", input: { description: "Bù dữ liệu học thuật", prompt: "Chỉ truy vấn scholar-api: nghiên cứu học thuật về áp dụng AI trong âm nhạc 2024–2026. Trả về JSON {status, results}.", subagent_type: "search" } }], stop_reason: "tool_use", in: 3300, out: 110 }, { hl: ["scholar-api"] }) });
          const papers = [{ source: "scholar-api", title: "AI tools in music production: a 2025 survey", url: "https://scholar.example/p/88213", date: "2025-06-10" }, { source: "scholar-api", title: "Copyright and generative music models", url: "https://scholar.example/p/90417", date: "2026-01-28" }];
          s.push({ from: "k", to: "s", kind: "req", label: "agent con mới", via: "HTTPS · POST /v1/messages (hội thoại mới), rồi 2 vòng gọi scholar-api, gộp lại", title: "Một agent tìm kiếm mới chạy với nguồn thay thế (gộp)", desc: "SDK mở một hội thoại mới cho agent con, agent con gọi scholar-api qua SDK như các bước trước.", payload: { subagent_prompt: "Chỉ truy vấn scholar-api: nghiên cứu học thuật về áp dụng AI trong âm nhạc 2024–2026. Trả về JSON {status, results}.", tool_calls: [{ name: "search_source", input: { source: "scholar-api", query: q } }] }, pnote: "Phiếu giao việc và lệnh công cụ của lượt này." });
          s.push({ from: "s", to: "k", kind: "ok", label: "có dữ liệu", title: "Có dữ liệu học thuật bù vào", desc: "scholar-api trả về 2 bài báo.", payload: { status: "ok", results: papers }, pnote: "Toàn bộ câu trả lời cuối của agent con (nằm trong khối text của response).", push: [{ r: "ok", t: "Học thuật: đã bù bằng scholar-api" }] });
          cv.push({ role: "user", content: [{ type: "tool_result", tool_use_id: "toolu_T2", content: J({ status: "ok", results: papers }) }] });
          s.push({ from: "k", to: "c", kind: "req", label: "tool_result", title: "SDK gửi kết quả bù cho coordinator", desc: "Kết quả của Task thứ hai đi vào hội thoại của coordinator.", ...cv.req({ hl: ["toolu_T2"] }) });
          report = "## Áp dụng AI trong âm nhạc 2024–2026\n- 18% bài phát hành năm 2025 có dùng AI [industry-db]\n- Khảo sát 2.000 nhạc sĩ: phần lớn dùng AI cho khâu phối khí [survey-hub]\n- Nghiên cứu học thuật: AI tools in music production (2025) [scholar-api]\n\n## Ghi chú độ bao phủ\n- journal-db không truy cập được (quá thời gian chờ, đã thử 3 lần); dữ liệu học thuật lấy từ scholar-api (2 bài).\n- Các nguồn còn lại có đủ dữ liệu.";
        } else if (m === "swallow") {
          report = "## Áp dụng AI trong âm nhạc 2024–2026\nDựa trên khảo sát toàn diện các nguồn tin tức, học thuật và ngành:\n- 18% bài phát hành năm 2025 có dùng AI [industry-db]\n- Khảo sát 2.000 nhạc sĩ: phần lớn dùng AI cho khâu phối khí [survey-hub]";
        } else {
          report = "Nghiên cứu thất bại: lỗi tìm kiếm (RuntimeError: journal-db timeout).";
        }
        s.push({ phase: "Báo cáo cuối", from: "c", to: "k", kind: m === "good" ? "ok" : "err", label: "end_turn", title: { good: "Coordinator viết báo cáo, có ghi chú độ bao phủ", swallow: "Báo cáo nhận là “toàn diện” nhưng thiếu cả mảng học thuật", crash: "Coordinator không có dữ liệu để viết" }[m], desc: { good: "Người đọc biết rõ dữ liệu học thuật lấy từ đâu, và nguồn nào đã không truy cập được.", swallow: "Người đọc tin rằng báo cáo đã xét đủ mọi nguồn, trong khi không có nghiên cứu học thuật nào.", crash: "Chỉ vì một nguồn bị lỗi, toàn bộ công việc đổ bể hoặc phải chạy lại từ đầu." }[m], ...cv.res({ content: [{ type: "text", text: report }], stop_reason: "end_turn", in: m === "good" ? 3900 : 3200, out: 260 }, { hl: m === "good" ? ["Ghi chú độ bao phủ"] : ["toàn diện", "thất bại"] }) });
        s.push({ from: "k", to: "a", kind: m === "good" ? "ok" : "err", label: "kết quả", key: true, title: "Ứng dụng nhận báo cáo", desc: m === "good" ? "Báo cáo đầy đủ nhất có thể, và trung thực về phần còn thiếu." : m === "swallow" ? "Báo cáo trông hoàn chỉnh, nhưng sai về độ bao phủ; không ai biết để kiểm tra lại." : "Không có báo cáo dùng được.", payload: { type: "result", subtype: "success", is_error: false, duration_ms: m === "good" ? 71200 : 39800, duration_api_ms: m === "good" ? 66300 : 36100, num_turns: m === "good" ? 3 : 2, result: report, session_id: "9d2b7e10-4c5a-4f8e-a1b3-6e0d2c9f7a44", total_cost_usd: m === "good" ? 0.29 : 0.18, usage: { input_tokens: m === "good" ? 9300 : 5300, output_tokens: m === "good" ? 600 : 380, cache_read_input_tokens: 0 } }, pnote: "Toàn bộ message cuối <code>query()</code> trả về.", hl: ["result"] });
        return s;
      },
    }),
  };
})();
