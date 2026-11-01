/* Mô phỏng chi tiết — Chương 4: Prompt Engineering & Structured Output */
(function () {
  const { trace, claude, http, net } = window.SIM;
  const W = window.WIDGETS;
  const J = (o) => JSON.stringify(o);
  // Haiku 5.5 vẫn nhận tool_choice ép buộc; Opus 5.5 và Sonnet 5.5 trả lỗi 400 với kiểu này.
  const MODEL = "claude-haiku-5-5";
  const FORCE_NOTE = "Ví dụ dùng claude-haiku-5-5 vì model này vẫn nhận <code>tool_choice</code> kiểu chỉ định công cụ. Với claude-opus-5-5 và claude-sonnet-5-5, kiểu này bị trả lỗi 400; khi làm thật với hai model đó, dùng <code>output_config.format</code> (structured outputs) như mục 4-3 có nhắc.";
  const DOC = "HỢP ĐỒNG DỊCH VỤ số 12/2026. Bên A: Công ty X. Giá trị: 120.000.000đ, gồm: Tư vấn 80.000.000đ; Soạn thảo 40.000.000đ. Hiệu lực 01/03/2026 – 28/02/2027. (Không có điều khoản gia hạn.)";
  const PIPE = {
    p: { id: "p", icon: "🖥️", name: "Pipeline", sub: "chương trình Python của bạn", desc: "Đọc tài liệu, gửi request tới Claude API, gọi bộ kiểm tra, rồi lưu hoặc chuyển cho người duyệt." },
    c: { id: "c", icon: "🧠", name: "Claude API", sub: "Messages API", desc: "Đọc tài liệu và trả dữ liệu theo đúng mẫu được yêu cầu." },
    v: { id: "v", icon: "✅", name: "Bộ kiểm tra", sub: "hàm Python trong pipeline", desc: "Code của bạn, kiểm tra nội dung (tổng tiền, ngày tháng, đối chiếu văn bản gốc). Không gọi Claude." },
  };
  const PIPE_LINKS = { "p>c": "HTTPS · POST api.anthropic.com/v1/messages", "c>p": "HTTPS · response 200 OK", "p>v": "gọi hàm kiểm tra trong cùng chương trình", "v>p": "hàm kiểm tra trả về" };

  /* ───────── 4-3 Trích xuất bằng công cụ có schema ───────── */
  W.extractionTrace = {
    title: "Trích xuất dữ liệu: dùng công cụ làm khuôn cho đầu ra JSON",
    render: trace({
      intro: "Ở đây không có công cụ nào thực sự được chạy. Ta khai báo một công cụ có danh sách tham số đúng bằng mẫu dữ liệu muốn nhận, bắt Claude gọi công cụ đó, rồi lấy phần tham số Claude điền làm kết quả.",
      actors: [PIPE.p, PIPE.c, PIPE.v, { id: "d", icon: "🗄️", name: "Cơ sở dữ liệu", sub: "bảng contracts / hàng chờ duyệt", desc: "Nơi lưu kết quả đạt, hoặc hàng chờ để người kiểm tra xem lại." }],
      links: { ...PIPE_LINKS, "p>d": "kết nối cơ sở dữ liệu · câu lệnh SQL" },
      controls: [{ id: "nul", type: "toggle", label: "Cho phép <code>renewal_date</code> nhận giá trị <code>null</code>", value: true }],
      steps: ({ nul }) => {
        const schema = { type: "object", properties: { party_a: { type: "string" }, total_vnd: { type: "integer" }, line_items: { type: "array", items: { type: "object", properties: { name: { type: "string" }, amount_vnd: { type: "integer" } }, required: ["name", "amount_vnd"] } }, start_date: { type: "string", description: "YYYY-MM-DD" }, renewal_date: { type: nul ? ["string", "null"] : "string", description: nul ? "YYYY-MM-DD; để null nếu hợp đồng không có điều khoản gia hạn" : "YYYY-MM-DD" }, service_type: { enum: ["it", "legal", "marketing", "other"] } }, required: ["party_a", "total_vnd", "line_items", "start_date", "renewal_date", "service_type"] };
        const tool = { name: "extract_contract", description: "Ghi lại các trường trích từ hợp đồng. Chỉ dùng thông tin có trong văn bản.", input_schema: schema };
        const out = { party_a: "Công ty X", total_vnd: 120000000, line_items: [{ name: "Tư vấn", amount_vnd: 80000000 }, { name: "Soạn thảo", amount_vnd: 40000000 }], start_date: "2026-03-01", renewal_date: nul ? null : "2027-03-01", service_type: "legal" };
        const cv = claude({ model: MODEL, max_tokens: 1024, tools: [tool], tool_choice: { type: "tool", name: "extract_contract" } }, { tag: "X" });
        cv.user(`<document>\n${DOC}\n</document>\nTrích xuất hợp đồng trên.`);
        const s = [];
        s.push({ phase: "Chuẩn bị", from: "p", to: "p", kind: "internal", via: "trong code của pipeline, chưa gửi gì", title: "Khai báo “công cụ” trích xuất, chính là mẫu dữ liệu mong muốn", desc: nul ? "Danh sách tham số mô tả đủ các trường cần lấy. Trường <code>renewal_date</code> được phép nhận <code>null</code>, nghĩa là “hợp đồng không có thông tin này”." : "Danh sách tham số mô tả đủ các trường cần lấy. Nhưng <code>renewal_date</code> là bắt buộc và phải là chuỗi, nên Claude không có cách nào nói “không có”.", payload: tool, pnote: "Toàn bộ định nghĩa công cụ.", hl: ["required", "renewal_date", "enum"], fields: [["required", "Danh sách trường bắt buộc phải có. Trường đã bắt buộc mà lại không cho null thì Claude buộc phải điền một giá trị nào đó."], ["type: [\"string\",\"null\"]", "Cho phép trường nhận giá trị null, để nói “không có thông tin” một cách hợp lệ."], ["enum", "Danh sách giá trị được phép. Có thêm “other” cho những trường hợp nằm ngoài danh sách."], ["description của trường", "Nơi ghi quy ước định dạng, và cách xử lý khi thiếu dữ liệu."]] });
        s.push({ phase: "Gọi Claude", from: "p", to: "c", kind: "req", label: "request", key: true, title: "Gửi hợp đồng và bắt Claude gọi đúng công cụ này", desc: "Trường <code>tool_choice</code> chỉ định đích danh <code>extract_contract</code>, nên Claude bắt buộc phải trả lời bằng cách gọi công cụ này, tức là trả lời bằng JSON đúng mẫu. Hợp đồng được bọc trong thẻ &lt;document&gt; để tách rõ khỏi lời yêu cầu.", ...cv.req({ hl: ["tool_choice", "document"] }), note: FORCE_NOTE });
        s.push({ from: "c", to: "p", kind: "res", label: "kết quả", key: true, title: "Kết quả nằm trong phần tham số Claude điền", desc: nul ? "JSON đúng mẫu. <code>renewal_date</code> là null, đúng với thực tế hợp đồng không có điều khoản gia hạn. Pipeline không chạy công cụ nào và không gửi kết quả lại cho Claude; chỉ cần lấy phần <code>input</code> là xong." : "JSON đúng mẫu, nhưng <code>renewal_date</code> là “2027-03-01”, một ngày do Claude <b>tự bịa</b>, vì mẫu bắt buộc phải có một chuỗi.", ...cv.res({ content: [{ type: "tool_use", id: "toolu_51", name: "extract_contract", input: out }], stop_reason: "tool_use", in: 712, out: 118 }, { hl: ["input", "renewal_date"] }), warn: nul ? null : "Ngày bịa này trông rất hợp lý, đúng định dạng, nên bộ kiểm tra rất khó phát hiện." });
        s.push({ phase: "Kiểm tra và lưu", from: "p", to: "v", kind: "req", label: "validate()", title: "Kiểm tra nội dung, việc mà schema không làm được", desc: "Schema chỉ đảm bảo dữ liệu đúng hình dạng. Bộ kiểm tra của bạn phải tự kiểm tra xem nội dung có hợp lý không, kể cả đối chiếu với văn bản gốc.", payload: { record: out, source_text: DOC }, payloadTitle: "Tham số truyền vào validate(record, source_text)", pnote: "Toàn bộ dữ liệu truyền vào hàm kiểm tra.", backend: ["Tổng các dòng: 80 triệu cộng 40 triệu bằng 120 triệu, khớp tổng ghi trên hợp đồng.", "Ngày bắt đầu đứng trước ngày kết thúc.", "Mọi ngày tháng đều đúng định dạng năm-tháng-ngày.", nul ? "renewal_date là null, và văn bản có câu “Không có điều khoản gia hạn”. Khớp." : "renewal_date có giá trị, nhưng không câu nào trong văn bản chứa ngày này. Chỉ phát hiện được nhờ bước đối chiếu với văn bản gốc."] });
        s.push({ from: "v", to: "p", kind: nul ? "ok" : "warn", label: nul ? "đạt" : "nghi vấn", title: nul ? "Mọi kiểm tra đều đạt" : "Có điểm đáng nghi", desc: nul ? "Dữ liệu sẵn sàng để lưu." : "Bộ kiểm tra đánh dấu trường renewal_date vì không tìm thấy trong văn bản gốc.", payload: nul ? { valid: true, checks: 4, warnings: [] } : { valid: true, checks: 4, warnings: ["renewal_date không tìm thấy trong văn bản gốc"] }, pnote: "Toàn bộ giá trị hàm kiểm tra trả về." });
        const sql = nul
          ? `INSERT INTO contracts (source_doc, extracted_by, party_a, total_vnd, line_items, start_date, renewal_date, service_type)\nVALUES ('HD-12-2026', '${MODEL}', 'Công ty X', 120000000,\n        '${J(out.line_items)}'::jsonb,\n        '2026-03-01', NULL, 'legal');`
          : `INSERT INTO review_queue (source_doc, reason, record)\nVALUES ('HD-12-2026', 'renewal_date không tìm thấy trong văn bản gốc',\n        '${J(out)}'::jsonb);`;
        s.push({ from: "p", to: "d", kind: nul ? "ok" : "warn", label: nul ? "lưu" : "chờ duyệt", title: nul ? "Lưu kết quả" : "Chuyển cho người kiểm tra", desc: nul ? "Bản ghi được lưu vào cơ sở dữ liệu, kèm mã tài liệu nguồn và model đã trích." : "Bản ghi không được lưu thẳng; nó được đưa vào hàng chờ để một người kiểm tra lại.", payload: sql, pnote: "Toàn bộ câu lệnh SQL gửi tới cơ sở dữ liệu." });
        return s;
      },
    }),
  };

  /* ───────── 4-4 Kiểm tra và thử lại ───────── */
  const INV_SCHEMA = { type: "object", properties: { invoice_no: { type: "string" }, invoice_date: { type: "string", description: "YYYY-MM-DD" }, vendor: { type: "string" }, po_number: { type: ["string", "null"], description: "Số đơn đặt hàng; null nếu tài liệu không ghi" }, total: { type: "number" }, line_items: { type: "array", items: { type: "object", properties: { desc: { type: "string" }, amount: { type: "number" } }, required: ["desc", "amount"] } } }, required: ["invoice_no", "invoice_date", "vendor", "po_number", "total", "line_items"] };
  const DOC_A = "HÓA ĐƠN THƯƠNG MẠI\nSố: INV-889        Ngày: 03/15/2026\nNhà cung cấp: Northwind Supplies Inc.\nĐơn đặt hàng (PO): PO-4471\n1. Bàn phím cơ, 10 chiếc: 600 USD\n2. Chuột không dây, 20 chiếc: 540 USD\nPhí vận chuyển: 100 USD\nTỔNG CỘNG: 1.240 USD";
  const DOC_B = "HÓA ĐƠN THƯƠNG MẠI\nSố: INV-901        Ngày: 2026-04-02\nNhà cung cấp: Northwind Supplies Inc.\n1. Tai nghe, 8 chiếc: 560 USD\nTỔNG CỘNG: 560 USD";
  const L3 = [{ desc: "Bàn phím cơ, 10 chiếc", amount: 600 }, { desc: "Chuột không dây, 20 chiếc", amount: 540 }, { desc: "Phí vận chuyển", amount: 100 }];
  const base = { invoice_no: "INV-889", invoice_date: "2026-03-15", vendor: "Northwind Supplies Inc.", po_number: "PO-4471", total: 1240, line_items: L3 };
  const CASES = {
    fmt: { label: "Sai định dạng ngày", doc: DOC_A, bad: { ...base, invoice_date: "03/15/2026" }, err: ["invoice_date phải theo dạng YYYY-MM-DD, nhưng đang là \"03/15/2026\""], fixed: base, retry: true },
    sum: { label: "Tổng tiền không khớp", doc: DOC_A, bad: { ...base, line_items: L3.slice(0, 2) }, err: ["Tổng các dòng (1140) khác tổng ghi trên hóa đơn (1240). Kiểm tra xem có dòng nào bị sót không, ví dụ phí vận chuyển."], fixed: base, retry: true },
    miss: { label: "Thiếu số PO (tài liệu không có)", doc: DOC_B, bad: { invoice_no: "INV-901", invoice_date: "2026-04-02", vendor: "Northwind Supplies Inc.", po_number: null, total: 560, line_items: [{ desc: "Tai nghe, 8 chiếc", amount: 560 }] }, err: ["po_number là bắt buộc với nhà cung cấp này nhưng đang để trống"], retry: false },
  };
  W.retryLoop = {
    title: "Kiểm tra rồi thử lại: gửi lại những gì, và khi nào nên dừng",
    render: trace({
      intro: "Thử lại có hiệu quả khi bạn gửi kèm <b>tài liệu gốc, kết quả lỗi và mô tả lỗi cụ thể</b>. Nhưng trước khi thử lại, hãy tự hỏi: thông tin đó có thật sự nằm trong tài liệu không?",
      actors: [PIPE.p, PIPE.c, PIPE.v, { id: "q", icon: "👀", name: "Người kiểm tra", sub: "xem hàng chờ duyệt", desc: "Nhân viên xử lý các tài liệu máy không tự quyết được." }],
      links: { ...PIPE_LINKS, "p>q": "ghi vào hàng chờ duyệt (bảng review_queue)" },
      stateTitle: "Cuộc trò chuyện của lần trích xuất",
      controls: [{ id: "k", type: "select", label: "Lỗi gặp phải:", value: "fmt", options: Object.entries(CASES).map(([k, v]) => [k, v.label]) }],
      steps: ({ k }) => {
        const c = CASES[k];
        const cv = claude({ model: MODEL, max_tokens: 1024, tools: [{ name: "extract_invoice", description: "Ghi lại các trường của một hóa đơn. Chỉ dùng thông tin có trong tài liệu.", input_schema: INV_SCHEMA }], tool_choice: { type: "tool", name: "extract_invoice" } }, { tag: "V" });
        cv.user(`<document>\n${c.doc}\n</document>\nTrích xuất hóa đơn trên.`);
        const s = [];
        s.push({ phase: "Lần 1", from: "p", to: "c", kind: "req", label: "lần 1", key: true, title: "Gửi yêu cầu trích xuất lần đầu", desc: "Gửi hóa đơn và bắt Claude trả kết quả theo mẫu của công cụ <code>extract_invoice</code>.", ...cv.req({ hl: ["tool_choice"] }), note: FORCE_NOTE, state: [{ r: "user", t: "Hóa đơn gốc (trong thẻ &lt;document&gt;)" }] });
        s.push({ from: "c", to: "p", kind: "res", label: "kết quả", title: "Nhận kết quả lần 1", desc: "Kết quả đúng mẫu JSON, nhưng chưa chắc nội dung đã đúng.", ...cv.res({ content: [{ type: "tool_use", id: "toolu_61", name: "extract_invoice", input: c.bad }], stop_reason: "tool_use", in: 905, out: 140 }, { hl: ["input"] }), push: [{ r: "assistant", t: "Kết quả trích xuất lần 1" }] });
        s.push({ from: "p", to: "v", kind: "req", label: "validate()", title: "Chạy bộ kiểm tra", desc: "Bộ kiểm tra xem định dạng ngày, tổng tiền và các trường bắt buộc.", payload: c.bad, payloadTitle: "record truyền vào validate()", pnote: "Toàn bộ bản ghi đưa vào hàm kiểm tra." });
        s.push({ from: "v", to: "p", kind: "err", label: "có lỗi", key: true, title: "Bộ kiểm tra báo lỗi cụ thể", desc: "Lỗi được mô tả rõ ràng: sai ở trường nào, sai thế nào. Thông tin này sẽ dùng cho lần thử lại.", payload: { valid: false, errors: c.err }, pnote: "Toàn bộ giá trị hàm kiểm tra trả về.", hl: ["errors"] });
        if (!c.retry) {
          s.push({ phase: "Không thử lại", from: "p", to: "p", kind: "internal", key: true, via: "trong code của pipeline: tìm số PO trong văn bản gốc", title: "Trước khi thử lại: tài liệu có thông tin này không?", desc: "Pipeline quét nhanh văn bản gốc và không thấy chuỗi nào giống số PO. Thử lại chỉ sửa được lỗi do <b>cách trích</b>, không tạo ra được thông tin vốn không có. Thử lại nhiều lần còn khiến Claude dễ bịa một số PO cho xong.", snippet: "if field_missing(\"po_number\") and not re.search(r\"\\bP\\.?O\\.?\\s*[-#:]?\\s*\\d+\", source_text):\n    # tài liệu không có số PO, thử lại cũng vô ích\n    return route_to_review(doc, reason=\"po_number không có trong tài liệu\")", warn: "Tăng số lần thử lại từ 3 lên 10 là phản xạ sai rất hay gặp." });
          s.push({ from: "p", to: "q", kind: "ok", label: "chờ duyệt", title: "Để trống và chuyển cho người kiểm tra", desc: "Số PO được để là null, kèm ghi chú “không có trong tài liệu”. Người kiểm tra sẽ liên hệ nhà cung cấp hoặc tra hệ thống mua hàng.", payload: { doc: "INV-901", record: c.bad, flags: ["missing_in_source:po_number"], action: "liên hệ nhà cung cấp hoặc tra hệ thống mua hàng" }, payloadTitle: "Bản ghi đưa vào hàng chờ duyệt", pnote: "Toàn bộ bản ghi." });
          return s;
        }
        cv.push({ role: "user", content: [{ type: "tool_result", tool_use_id: "toolu_61", is_error: true, content: "Lỗi kiểm tra:\n- " + c.err.join("\n- ") + "\nHãy đọc lại tài liệu và gọi extract_invoice lần nữa." }] });
        s.push({
          phase: "Thử lại có mô tả lỗi", from: "p", to: "c", kind: "req", label: "lần 2", key: true, title: "Thử lại: gửi kèm kết quả cũ và mô tả lỗi",
          desc: "Lần thử lại được viết như một cuộc trò chuyện nối tiếp: tài liệu gốc, kết quả lần trước của Claude, và một khối <code>tool_result</code> có <code>is_error: true</code> chứa mô tả lỗi. Nhìn thấy cả ba, Claude biết chính xác cần sửa chỗ nào.",
          ...cv.req({ hl: ["is_error"] }),
          fields: [["messages[0]", "Tài liệu gốc, để Claude nhìn lại nguồn."], ["messages[1]", "Kết quả lần trước, để Claude biết mình đã trả lời gì."], ["messages[2]", "Mô tả lỗi cụ thể từ bộ kiểm tra, thay vì một câu chung chung “làm lại đi”."]],
          push: [{ r: "err", t: "Mô tả lỗi: " + c.err[0] }],
        });
        s.push({ from: "c", to: "p", kind: "res", label: "đã sửa", title: "Nhận kết quả lần 2", desc: k === "fmt" ? "Ngày đã được đổi sang dạng năm-tháng-ngày." : "Claude tìm ra dòng phí vận chuyển bị sót, và tổng đã khớp.", ...cv.res({ content: [{ type: "tool_use", id: "toolu_62", name: "extract_invoice", input: c.fixed }], stop_reason: "tool_use", in: 1120, out: 152 }, { hl: [k === "fmt" ? "invoice_date" : "Phí vận chuyển"] }), push: [{ r: "assistant", t: "Kết quả trích xuất lần 2" }] });
        s.push({ from: "p", to: "v", kind: "req", label: "validate()", title: "Kiểm tra lại", desc: "Chạy lại đúng bộ kiểm tra như lần đầu.", payload: c.fixed, payloadTitle: "record truyền vào validate()", pnote: "Toàn bộ bản ghi đưa vào hàm kiểm tra." });
        s.push({ from: "v", to: "p", kind: "ok", label: "đạt", key: true, title: "Bộ kiểm tra cho qua", desc: "Mọi kiểm tra đều đạt. Chỉ cần một lần thử lại nhờ có mô tả lỗi rõ ràng.", payload: { valid: true, errors: [] }, pnote: "Toàn bộ giá trị hàm kiểm tra trả về." });
        return s;
      },
    }),
  };

  /* ───────── 4-6 Review nhiều lượt ───────── */
  const FILES30 = ["src/api/user.ts", "src/api/signup.ts", "src/api/orders.ts", "src/api/billing.ts", "src/api/auth.ts", "src/api/profile.ts", "src/api/admin.ts", "src/services/email.ts", "src/services/payment.ts", "src/services/cart.ts", "src/services/inventory.ts", "src/services/coupon.ts", "src/db/query.ts", "src/db/migrations/0042_lowercase_email.sql", "src/db/user-repo.ts", "src/db/order-repo.ts", "src/ui/pages/Signup.tsx", "src/ui/pages/Login.tsx", "src/ui/pages/Checkout.tsx", "src/ui/pages/Orders.tsx", "src/ui/components/EmailInput.tsx", "src/ui/components/PriceTag.tsx", "src/ui/components/CouponBox.tsx", "src/lib/date.ts", "src/lib/money.ts", "src/lib/validate.ts", "test/api/user.test.ts", "test/api/signup.test.ts", "test/services/payment.test.ts", "package.json"];
  const IFACE = { "src/api/user.ts": "xuất getUser(email): Promise<User|null>; giả định email đã là chữ thường", "src/api/signup.ts": "gọi getUser(req.body.email) để kiểm tra trùng, không đổi email về chữ thường", "src/api/billing.ts": "xuất createInvoice(order); giả định order.invoice đã có", "src/services/payment.ts": "xuất charge(amount, card) trả về { ok, id }", "src/db/migrations/0042_lowercase_email.sql": "đổi email cũ trong bảng users về chữ thường" };
  const DIFF = "--- a/src/api/user.ts\n+++ b/src/api/user.ts\n@@ -80,9 +80,13 @@\n export async function getUser(email: string) {\n-  return db.users.findOne({ email });\n+  const rows = await db.query(\n+    `SELECT * FROM users WHERE email = '${email}'`\n+  );\n+  return rows[0] ?? null;\n }\n@@ -118,4 +122,4 @@\n-  const name = profile?.name ?? \"\";\n+  const name = profile.name;";
  W.multiPassTrace = {
    title: "Review pull request 30 file: từng file, liên kết, rồi chia việc theo độ tự tin",
    render: trace({
      intro: "Mỗi phiên review là một cuộc hội thoại <b>mới tinh</b> với Claude API, không biết gì về quá trình viết code. Lượt xem liên kết chỉ đọc bản tóm tắt của từng file, không đọc lại toàn bộ code.",
      actors: [
        { id: "o", icon: "🧑‍💻", name: "Script điều phối", sub: "chạy trong CI", desc: "Chương trình của bạn: chia việc, gửi request tới Claude API, gom kết quả, chia theo độ tự tin." },
        { id: "f", icon: "🔍", name: "Review từng file", sub: "Claude · 30 hội thoại song song", desc: "30 request độc lập tới Claude API, mỗi request chỉ chứa phần thay đổi của một file." },
        { id: "i", icon: "🔗", name: "Review liên kết", sub: "Claude · một hội thoại riêng", desc: "Một request nữa tới Claude API, chỉ chứa 30 bản tóm tắt phần giao tiếp giữa các file." },
        { id: "h", icon: "👀", name: "Người kiểm tra", sub: "hàng chờ trong công cụ review", desc: "Kỹ sư xem lại các phát hiện có độ tự tin trung bình trước khi đăng." },
      ],
      links: { "o>f": "HTTPS · POST /v1/messages (30 request song song, mỗi file một request)", "f>o": "HTTPS · response 200 OK", "o>i": "HTTPS · POST /v1/messages", "i>o": "HTTPS · response 200 OK", "o>h": "HTTPS · API của công cụ review nội bộ" },
      stateTitle: "Các phát hiện",
      steps: () => {
        const FIND = { type: "object", properties: { file: { type: "string" }, findings: { type: "array", items: { type: "object", properties: { line: { type: "integer" }, severity: { enum: ["high", "medium", "low"] }, confidence: { type: "number" }, issue: { type: "string" }, evidence: { type: "string" } }, required: ["line", "severity", "confidence", "issue", "evidence"], additionalProperties: false } }, interface_summary: { type: "string" } }, required: ["file", "findings", "interface_summary"], additionalProperties: false };
        const SYS = "Bạn là người review code. Chỉ báo: lỗi logic, lỗi bảo mật, thiếu xử lý lỗi. Bỏ qua cách viết code cho đẹp. Mỗi phát hiện phải kèm số dòng và trích đoạn code. Cuối cùng tóm tắt phần giao tiếp: file này xuất hàm gì cho file khác, và đang giả định điều gì.";
        const fv = claude({ model: "claude-sonnet-5-5", max_tokens: 4096, system: SYS, output_config: { format: { type: "json_schema", schema: FIND } } }, { tag: "F" });
        fv.user(`<diff file="src/api/user.ts">\n${DIFF}\n</diff>`);
        const s = [];
        s.push({ phase: "Review từng file", from: "o", to: "o", kind: "internal", via: "trong script: lấy danh sách file thay đổi bằng git diff", title: "Chia pull request theo từng file", desc: "30 file thay đổi được chia thành 30 request độc lập, chạy song song. Mỗi request chỉ chứa phần thay đổi của một file, cùng tiêu chí review. Không request nào chứa lịch sử của phiên đã viết code.", payload: FILES30.join("\n"), payloadTitle: "30 file thay đổi", pnote: "Toàn bộ danh sách.", state: [] });
        s.push({ from: "o", to: "f", kind: "req", label: "30 request", key: true, title: "Request review cho một file", desc: "Tiêu chí ghi rõ cần báo gì và bỏ qua gì. Kết quả được ép theo một JSON schema bằng <code>output_config.format</code>. Đây là request cho user.ts; 29 request còn lại giống hệt, chỉ khác phần <code>diff</code>.", ...fv.req({ hl: ["system", "output_config", "diff"] }) });
        const userOut = { file: "src/api/user.ts", findings: [{ line: 85, severity: "high", confidence: 0.92, issue: "Nối chuỗi email trực tiếp vào câu SQL", evidence: "`SELECT * FROM users WHERE email = '${email}'`" }], interface_summary: IFACE["src/api/user.ts"] };
        s.push({ from: "f", to: "o", kind: "res", label: "phát hiện", title: "Mỗi phiên trả về phát hiện, kèm tóm tắt phần giao tiếp", desc: "Câu trả lời là một khối chữ chứa JSON đúng schema. Ngoài các lỗi tìm được, mỗi phiên còn tóm tắt những gì file khác cần biết. Bản tóm tắt này dùng cho lượt xem liên kết. (Phiên của billing.ts trả về một phát hiện độ tự tin 0,55.)", ...fv.res({ content: [{ type: "text", text: J(userOut) }], stop_reason: "end_turn", in: 1260, out: 190 }, { hl: ["text"] }), push: [{ r: "ok", t: "user.ts dòng 85: nguy cơ SQL injection (độ tự tin 0,92)" }, { r: "note", t: "billing.ts dòng 40: thiếu kiểm tra rỗng (độ tự tin 0,55)" }] });
        const lines = FILES30.map((f) => `${f}: ${IFACE[f] || "chỉ thay đổi bên trong, không đổi hàm xuất ra"}`).join("\n");
        const iv = claude({ model: "claude-sonnet-5-5", max_tokens: 4096, system: "Bạn tìm lỗi GIỮA các file: chỗ hai file hiểu khác nhau về dữ liệu hoặc giả định." }, { tag: "I" });
        iv.user(`<interfaces>\n${lines}\n</interfaces>\nTìm vấn đề GIỮA các file. Trả về JSON {findings:[{files, severity, confidence, issue}]}.`);
        s.push({ phase: "Review liên kết", from: "o", to: "i", kind: "req", label: "30 bản tóm tắt", key: true, title: "Lượt xem liên kết đọc 30 bản tóm tắt", desc: "Vì chỉ đọc các bản tóm tắt ngắn, lượt này có đủ chỗ để so sánh giữa các file, thay vì bị chìm trong 30 file code đầy đủ.", ...iv.req({ hl: ["interfaces"] }) });
        const cross = { findings: [{ files: ["src/api/signup.ts", "src/api/user.ts"], severity: "medium", confidence: 0.81, issue: "signup gửi email chưa đổi về chữ thường, trong khi getUser giả định đã đổi" }] };
        s.push({ from: "i", to: "o", kind: "res", label: "lỗi giữa file", key: true, title: "Tìm ra lỗi mà không lượt review từng file nào thấy", desc: "Hàm getUser giả định email đã là chữ thường, nhưng trang đăng ký gửi email nguyên như người dùng gõ. Người đăng ký bằng email có chữ hoa sẽ không đăng nhập được. Mỗi file riêng lẻ đều trông ổn; lỗi chỉ nằm ở chỗ nối giữa chúng.", ...iv.res({ content: [{ type: "text", text: J(cross) }], stop_reason: "end_turn", in: 1480, out: 96 }), push: [{ r: "ok", t: "signup.ts và user.ts: hiểu khác nhau về chữ hoa thường (0,81)" }] });
        s.push({ phase: "Chia việc", from: "o", to: "o", kind: "internal", via: "trong script: so độ tự tin với ngưỡng", title: "Chia việc theo độ tự tin, không xóa phát hiện nào", desc: "Phát hiện có độ tự tin cao được đăng thẳng lên pull request. Phát hiện có độ tự tin trung bình được chuyển cho người xem lại. Ngưỡng được đặt dựa trên dữ liệu thực tế đã kiểm chứng (xem mục 5-5), không đặt theo cảm tính.", payload: { post_to_pr: ["user.ts:85 (0.92)", "signup.ts + user.ts (0.81)"], human_review: ["billing.ts:40 (0.55)"], dropped: [] }, pnote: "Toàn bộ kết quả chia việc.", hl: ["human_review"] });
        s.push({ from: "o", to: "h", kind: "warn", label: "1 phát hiện", title: "Chuyển phát hiện có độ tự tin trung bình cho người kiểm tra", desc: "Phát hiện ở billing.ts chỉ có độ tự tin 0,55, nên một người sẽ xem lại trước khi đăng.", ...net.callV("POST", "http://review-tool.internal/queue", { pr: 77, file: "src/api/billing.ts", line: 40, confidence: 0.55, issue: "invoice có thể chưa có giá trị khi đơn bị hủy" }), push: [{ r: "note", t: "billing.ts dòng 40: chờ người kiểm tra" }] });
        return s;
      },
    }),
  };

  /* ───────── 4-5 Message Batches API ───────── */
  const BATCH = "msgbatch_01HkcTjaV5uDC8jWR4ZsDV8d";
  const BURL = "https://api.anthropic.com/v1/messages/batches";
  const AH = { authorization: "Bearer $ANTHROPIC_API_KEY", "anthropic-version": "2026-10-21" };
  const C_TOOL = { name: "extract_contract", description: "Ghi lại các trường trích từ hợp đồng.", input_schema: { type: "object", properties: { party_a: { type: "string" }, total_vnd: { type: "integer" }, start_date: { type: "string" } }, required: ["party_a", "total_vnd", "start_date"] } };
  const params = (doc) => ({ model: MODEL, max_tokens: 1024, tools: [C_TOOL], tool_choice: { type: "tool", name: "extract_contract" }, messages: [{ role: "user", content: `<document>\n${doc}\n</document>\nTrích xuất hợp đồng trên.` }] });
  const batchObj = (o) => ({ id: BATCH, type: "message_batch", processing_status: "in_progress", request_counts: { processing: 10000, succeeded: 0, errored: 0, canceled: 0, expired: 0 }, ended_at: null, created_at: "2026-10-28T22:00:00Z", expires_at: "2026-10-29T22:00:00Z", archived_at: null, cancel_initiated_at: null, results_url: null, ...o });
  W.batchTrace = {
    title: "Vòng đời của một batch: gửi, chờ, tải kết quả, gửi lại phần lỗi",
    render: trace({
      intro: "Cần trích xuất 10.000 hợp đồng qua đêm. Không ai phải ngồi chờ kết quả, nên dùng Batch API để giảm khoảng một nửa chi phí.",
      actors: [
        { id: "j", icon: "🌙", name: "Job chạy đêm", sub: "chương trình Python của bạn", desc: "Chuẩn bị yêu cầu, gửi batch, hỏi tiến độ, tải và ghép kết quả." },
        { id: "b", icon: "📮", name: "Batch API", sub: "api.anthropic.com", desc: "Nhận cả lô yêu cầu, trả mã batch và trạng thái." },
        { id: "w", icon: "🏭", name: "Hàng đợi xử lý", sub: "bên trong Anthropic", desc: "Chạy từng yêu cầu khi có tài nguyên rảnh. Bạn không thấy và không điều khiển được." },
        { id: "r", icon: "📄", name: "File kết quả", sub: "JSONL, tải qua results_url", desc: "Mỗi dòng là kết quả của một yêu cầu, không theo thứ tự đã gửi." },
      ],
      links: { "j>b": "HTTPS · POST /v1/messages/batches", "b>j": "HTTPS · response 200 OK", "b>w": "bên trong hệ thống Anthropic", "j>r": "HTTPS · GET results_url", "r>j": "HTTPS · response (JSONL)" },
      stateTitle: "Đếm số yêu cầu",
      steps: () => {
        const s = [];
        const d17 = "HỢP ĐỒNG KHUNG số 17/2025 (bản đầy đủ 214 trang, gồm 38 phụ lục)";
        const d18 = "HỢP ĐỒNG DỊCH VỤ số 18/2025. Bên A: Công ty Y. Giá trị: 45.000.000đ. Hiệu lực 15/01/2026.";
        const reqs = [{ custom_id: "doc-00017", params: params(d17) }, { custom_id: "doc-00018", params: params(d18) }];
        s.push({ phase: "Gửi batch", from: "j", to: "j", kind: "internal", key: true, via: "trong code của job, chưa gửi gì", title: "Chuẩn bị các yêu cầu, mỗi yêu cầu có một mã riêng", desc: "Mỗi hợp đồng thành một yêu cầu độc lập. Mỗi yêu cầu được gắn một <code>custom_id</code> do bạn đặt, ở đây là mã tài liệu, để sau này ghép kết quả về đúng hợp đồng.", payload: reqs[1], payloadTitle: "Một phần tử của mảng requests", pnote: "Toàn bộ một yêu cầu. 9.999 yêu cầu còn lại có cùng cấu trúc, chỉ khác custom_id và nội dung hợp đồng.", hl: ["custom_id"], state: [] });
        s.push({ from: "j", to: "b", kind: "req", label: "gửi batch", key: true, title: "Gửi một lần cả 10.000 yêu cầu", desc: "Mỗi yêu cầu bên trong có cấu trúc giống hệt body của một lần gọi Claude bình thường.", views: [{ t: "Gói HTTP", d: http.req("POST", BURL, AH, { requests: reqs }), hl: ["custom_id"], part: "Mảng <code>requests</code> thật có 10.000 phần tử cùng cấu trúc; ở đây hiện 2 phần tử đầu, và nội dung hợp đồng 17 (214 trang) được thay bằng một dòng mô tả. Mọi phần khác của request là đầy đủ." }], note: FORCE_NOTE, fields: [["custom_id", "Mã để ghép yêu cầu với kết quả. Kết quả trả về <b>không theo thứ tự</b> đã gửi."], ["params", "Body của một lần gọi Claude. Mỗi yêu cầu chỉ là một lượt hỏi đáp; không có vòng lặp gọi công cụ bên trong batch."]] });
        s.push({ from: "b", to: "j", kind: "res", label: "mã batch", title: "Nhận mã batch, trạng thái “đang xử lý”", desc: "Batch API nhận yêu cầu và trả lại mã batch. Hạn chót xử lý là 24 giờ kể từ lúc gửi.", ...net.ret(batchObj({})), hl: ["processing_status", "expires_at", "request_counts"], fields: [["processing_status", "“in_progress” là đang xử lý, “ended” là đã xong."], ["expires_at", "Quá thời điểm này, những yêu cầu chưa xử lý sẽ bị hủy (expired)."], ["results_url", "Đường dẫn tải kết quả, chỉ có khi batch đã xong."]], push: [{ r: "note", t: "Đang xử lý: 10.000" }] });
        s.push({ phase: "Chờ xử lý", from: "b", to: "w", kind: "internal", label: "xếp hàng", key: true, title: "Yêu cầu được xử lý dần, không cam kết thời gian", nodata: "Bước này diễn ra bên trong Anthropic: Batch API chuyển từng yêu cầu vào hàng đợi. Bạn không gửi hay nhận dữ liệu gì; chỉ biết tiến độ bằng cách hỏi lại trạng thái ở các bước sau.", desc: "Thường xong sớm hơn nhiều, nhưng có thể mất tới 24 giờ. Vì thế không dùng batch cho những việc có người đang chờ, như trả lời chat hay kiểm tra trước khi merge." });
        const getB = { views: [{ t: "Gói HTTP", d: http.req("GET", `${BURL}/${BATCH}`, AH), note: "Toàn bộ request. Lệnh GET không có body." }] };
        s.push({ from: "j", to: "b", kind: "req", label: "hỏi tiến độ", title: "Thỉnh thoảng hỏi lại trạng thái", desc: "Job hỏi vài phút một lần bằng mã batch.", ...getB });
        s.push({ from: "b", to: "j", kind: "res", label: "đang xử lý", title: "Đã xong hơn hai phần ba", desc: "Vẫn <code>in_progress</code>; một số yêu cầu đã lỗi nhưng không ảnh hưởng các yêu cầu khác.", ...net.ret(batchObj({ request_counts: { processing: 3120, succeeded: 6830, errored: 50, canceled: 0, expired: 0 } })), hl: ["request_counts"], state: [{ r: "note", t: "Đang xử lý: 3.120" }, { r: "ok", t: "Thành công: 6.830" }, { r: "err", t: "Lỗi: 50" }] });
        s.push({ from: "j", to: "b", kind: "req", label: "hỏi lại", title: "Hỏi lại lần nữa", desc: "Cùng request như trên, gửi lại sau vài phút.", ...getB });
        const RURL = `${BURL}/${BATCH}/results`;
        s.push({ from: "b", to: "j", kind: "ok", label: "đã xong", key: true, title: "Batch hoàn tất", desc: "Sau gần 4 tiếng, mọi yêu cầu đã được xử lý: 9.900 thành công và 100 lỗi. Đường dẫn tải kết quả giờ đã có.", ...net.ret(batchObj({ processing_status: "ended", ended_at: "2026-10-29T01:47:12Z", request_counts: { processing: 0, succeeded: 9900, errored: 100, canceled: 0, expired: 0 }, results_url: RURL })), hl: ["processing_status", "errored", "results_url"], state: [{ r: "ok", t: "Thành công: 9.900" }, { r: "err", t: "Lỗi: 100" }] });
        s.push({ phase: "Tải kết quả", from: "j", to: "r", kind: "req", label: "tải về", title: "Tải file kết quả", desc: "Gọi đúng đường dẫn <code>results_url</code> vừa nhận.", views: [{ t: "Gói HTTP", d: http.req("GET", RURL, AH), note: "Toàn bộ request. Lệnh GET không có body." }] });
        const line = (id, result) => J({ custom_id: id, result });
        const okMsg = (id, input) => ({ type: "succeeded", message: { id, type: "message", role: "assistant", model: MODEL, content: [{ type: "tool_use", id: "toolu_" + id.slice(-3), name: "extract_contract", input }], stop_reason: "tool_use", stop_sequence: null, stop_details: null, usage: { input_tokens: 1840, cache_creation_input_tokens: 0, cache_read_input_tokens: 0, output_tokens: 64, service_tier: "batch" } } });
        const jsonl = [line("doc-04211", okMsg("msg_04211", { party_a: "Công ty Z", total_vnd: 300000000, start_date: "2026-02-01" })), line("doc-00017", { type: "errored", error: { type: "error", error: { type: "invalid_request_error", message: "prompt is too long: 1243871 tokens > 1000000 maximum" } } }), line("doc-00018", okMsg("msg_00018", { party_a: "Công ty Y", total_vnd: 45000000, start_date: "2026-01-15" }))].join("\n");
        s.push({ from: "r", to: "j", kind: "res", label: "JSONL", key: true, title: "Mỗi dòng là kết quả của một yêu cầu, không theo thứ tự", desc: "Dòng thứ hai là một yêu cầu bị lỗi vì hợp đồng 214 trang quá dài, vượt giới hạn ngữ cảnh của model. Các yêu cầu khác không bị ảnh hưởng.", views: [{ t: "Body (JSONL)", d: jsonl, hl: ["errored", "custom_id"], part: "File thật có 10.000 dòng; ở đây hiện 3 dòng. Mỗi dòng là đầy đủ." }], fields: [["result.type", "succeeded (thành công), errored (lỗi), canceled (bị hủy) hoặc expired (hết hạn)."], ["custom_id", "Dùng để ghép về đúng hợp đồng. Đừng ghép theo số thứ tự dòng."]] });
        s.push({ phase: "Gửi lại phần lỗi", from: "j", to: "j", kind: "internal", via: "trong code của job", title: "Chỉ xử lý lại những yêu cầu bị lỗi", desc: "Job lọc ra 100 mã bị lỗi. Hợp đồng quá dài được chia làm hai nửa. 9.900 yêu cầu đã thành công thì giữ nguyên, không gửi lại.", payload: { errored: 100, too_long_split: 65, retry_as_is: 35, new_requests: 230 }, pnote: "Toàn bộ thống kê job tính ra." });
        const reqs2 = [{ custom_id: "doc-00017#p1", params: params("HỢP ĐỒNG KHUNG số 17/2025, phần 1: trang 1 tới 107") }, { custom_id: "doc-00017#p2", params: params("HỢP ĐỒNG KHUNG số 17/2025, phần 2: trang 108 tới 214") }];
        s.push({ from: "j", to: "b", kind: "req", label: "batch thứ 2", key: true, title: "Gửi một batch mới chỉ gồm phần bị lỗi", desc: "Batch thứ hai có 230 yêu cầu: những hợp đồng dài đã được chia nhỏ (mỗi phần một custom_id riêng), cùng những yêu cầu bị lỗi tạm thời.", views: [{ t: "Gói HTTP", d: http.req("POST", BURL, AH, { requests: reqs2 }), hl: ["custom_id"], part: "Mảng <code>requests</code> thật có 230 phần tử; ở đây hiện 2 phần tử đầu. Nội dung hợp đồng được thay bằng một dòng mô tả." }], note: "Tính giờ gửi: nếu cần kết quả trong 30 giờ, và mỗi batch có thể mất 24 giờ, thì batch đầu phải gửi trong khoảng 6 giờ đầu, và còn phải chừa thời gian cho vòng gửi lại.", push: [{ r: "note", t: "Batch thứ 2: 230 yêu cầu" }] });
        return s;
      },
    }),
  };
})();
