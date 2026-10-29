/* Mô phỏng chi tiết — Chương 4: Prompt Engineering & Structured Output */
(function () {
  const { trace } = window.SIM;
  const W = window.WIDGETS;
  const MODEL = "claude-sonnet-5-5";
  const DOC = "HỢP ĐỒNG DỊCH VỤ số 12/2026. Bên A: Công ty X. Giá trị: 120.000.000đ gồm: Tư vấn 80.000.000đ; Soạn thảo 40.000.000đ. Hiệu lực 01/03/2026 – 28/02/2027. (Không có điều khoản gia hạn.)";

  /* ───────── 4-3 Trích xuất có cấu trúc bằng tool_use ───────── */
  W.extractionTrace = {
    title: "Trích xuất bằng tool_use: “công cụ” chỉ là cái khuôn JSON",
    render: trace({
      intro: "Ở đây không có công cụ nào thực sự chạy: ta định nghĩa một tool với <code>input_schema</code> chính là schema đầu ra mong muốn, ép Claude gọi nó, rồi lấy <code>tool_use.input</code> làm kết quả.",
      actors: [
        { id: "p", icon: "🖥️", name: "Pipeline" },
        { id: "c", icon: "🧠", name: "Claude API" },
        { id: "v", icon: "✅", name: "Validator", sub: "kiểm tra ngữ nghĩa" },
        { id: "d", icon: "🗄️", name: "DB / hàng đợi duyệt" },
      ],
      controls: [{ id: "nul", type: "toggle", label: "<code>renewal_date</code> cho phép <code>null</code>", value: true }],
      steps: ({ nul }) => {
        const schema = { type: "object", properties: { party_a: { type: "string" }, total_vnd: { type: "integer" }, line_items: { type: "array", items: { type: "object", properties: { name: { type: "string" }, amount_vnd: { type: "integer" } }, required: ["name", "amount_vnd"] } }, start_date: { type: "string", description: "YYYY-MM-DD" }, renewal_date: { type: nul ? ["string", "null"] : "string", description: nul ? "YYYY-MM-DD; null nếu hợp đồng không có điều khoản gia hạn" : "YYYY-MM-DD" }, service_type: { enum: ["it", "legal", "marketing", "other"] } }, required: ["party_a", "total_vnd", "line_items", "start_date", "renewal_date", "service_type"] };
        const out = { party_a: "Công ty X", total_vnd: 120000000, line_items: [{ name: "Tư vấn", amount_vnd: 80000000 }, { name: "Soạn thảo", amount_vnd: 40000000 }], start_date: "2026-03-01", renewal_date: nul ? null : "2027-03-01", service_type: "legal" };
        return [
          { from: "p", to: "p", kind: "internal", title: "Định nghĩa “tool” trích xuất = schema đầu ra", payload: { name: "extract_contract", description: "Ghi lại các trường trích từ hợp đồng. Chỉ dùng thông tin có trong văn bản.", input_schema: schema }, hl: ["required", "renewal_date", "enum"], fields: [["required", "Trường bắt buộc phải xuất hiện. Bắt buộc + không cho null = buộc model phải điền <i>một thứ gì đó</i>."], ["type: [\"string\",\"null\"]", "Cho phép nói “không có thông tin” một cách hợp lệ."], ["enum", "Giới hạn giá trị; thêm \"other\" cho danh mục mở."], ["description của trường", "Nơi đặt quy ước định dạng (YYYY-MM-DD) và quy tắc khi thiếu dữ liệu."]] },
          { from: "p", to: "c", kind: "req", label: "📤 request", title: "Ép gọi đúng tool bằng tool_choice", sub: "POST /v1/messages", payload: { model: MODEL, max_tokens: 1024, tools: [{ name: "extract_contract", input_schema: "{…như trên…}" }], tool_choice: { type: "tool", name: "extract_contract" }, messages: [{ role: "user", content: `<document>\n${DOC}\n</document>\nTrích xuất hợp đồng trên.` }] }, hl: ["tool_choice", "document"], note: "Bọc tài liệu trong thẻ XML (&lt;document&gt;) tách rõ dữ liệu khỏi chỉ dẫn." },
          { from: "c", to: "p", kind: "res", label: "📥 tool_use", title: "Response: kết quả nằm trong tool_use.input", payload: { content: [{ type: "tool_use", id: "toolu_51", name: "extract_contract", input: out }], stop_reason: "tool_use" }, hl: ["input", "renewal_date"], warn: nul ? null : "renewal_date = \"2027-03-01\" là <b>bịa</b>: hợp đồng không có điều khoản gia hạn, nhưng schema bắt buộc một chuỗi. Trông hợp lý nên validator khó bắt.", note: nul ? "renewal_date = null — trung thực. Schema đảm bảo cấu trúc; nullable cho phép thể hiện sự vắng mặt." : null, fields: [["stop_reason: tool_use", "Ở pipeline trích xuất, ta <b>không</b> chạy tool và không gửi tool_result — lấy input là xong."], ["input", "JSON đúng cú pháp và đúng cấu trúc schema."]] },
          { from: "p", to: "v", kind: "req", label: "🔎 kiểm tra", title: "Validator kiểm tra ngữ nghĩa (schema không làm được)", backend: ["Tổng dòng: 80tr + 40tr = 120tr = total_vnd ✓", "start_date &lt; ngày kết thúc ✓", "Mọi ngày đúng định dạng ISO ✓", nul ? "renewal_date null và văn bản có “Không có điều khoản gia hạn” ✓" : "renewal_date có giá trị — nhưng không có câu nào trong văn bản chứa ngày này ✗ (chỉ bắt được nếu có kiểm tra đối chiếu nguồn)"] },
          { from: "v", to: "p", kind: nul ? "ok" : "warn", label: nul ? "✅ hợp lệ" : "⚠️ nghi vấn", title: nul ? "Đạt" : "Gắn cờ nghi vấn", payload: nul ? { valid: true, checks: 4 } : { valid: true, warnings: ["renewal_date không tìm thấy trong nguồn"] } },
          { from: "p", to: "d", kind: nul ? "ok" : "warn", label: nul ? "💾 lưu" : "👀 duyệt tay", title: nul ? "Lưu bản ghi" : "Đưa vào hàng đợi người duyệt", payload: Object.assign({ source_doc: "HD-12-2026", extracted_by: MODEL }, out) },
        ];
      },
    }),
  };

  /* ───────── 4-4 Vòng kiểm tra & thử lại ───────── */
  const CASES = {
    fmt: { label: "🗓️ Sai định dạng ngày", bad: { invoice_no: "INV-889", invoice_date: "03/15/2026", po_number: "PO-4471", total: 1240, line_sum: 1240 }, err: ["invoice_date phải theo YYYY-MM-DD, nhận \"03/15/2026\""], fixed: { invoice_no: "INV-889", invoice_date: "2026-03-15", po_number: "PO-4471", total: 1240, line_sum: 1240 }, retry: true },
    sum: { label: "➕ Tổng không khớp", bad: { invoice_no: "INV-889", invoice_date: "2026-03-15", po_number: "PO-4471", total: 1240, line_sum: 1140 }, err: ["Tổng các dòng (1140) ≠ tổng ghi trên hóa đơn (1240). Kiểm tra dòng bị sót, ví dụ phí vận chuyển."], fixed: { invoice_no: "INV-889", invoice_date: "2026-03-15", po_number: "PO-4471", total: 1240, line_sum: 1240, note: "đã thêm dòng Phí vận chuyển 100" }, retry: true },
    miss: { label: "∅ Thiếu PO (nguồn không có)", bad: { invoice_no: "INV-901", invoice_date: "2026-04-02", po_number: null, total: 560, line_sum: 560 }, err: ["po_number bắt buộc cho nhà cung cấp này nhưng đang null"], retry: false },
  };
  W.retryLoop = {
    title: "Vòng kiểm tra – thử lại: gửi lại cái gì, khi nào dừng",
    render: trace({
      intro: "Retry hiệu quả = gửi lại <b>tài liệu gốc + output lỗi + lỗi cụ thể</b>. Nhưng trước khi retry phải hỏi: thông tin đó có trong tài liệu không?",
      actors: [
        { id: "p", icon: "🖥️", name: "Pipeline" },
        { id: "c", icon: "🧠", name: "Claude API" },
        { id: "v", icon: "✅", name: "Validator" },
        { id: "q", icon: "👀", name: "Người duyệt" },
      ],
      stateTitle: "🧾 messages[] của lần trích",
      controls: [{ id: "k", type: "select", label: "Lỗi gặp phải:", value: "fmt", options: Object.entries(CASES).map(([k, v]) => [k, v.label]) }],
      steps: ({ k }) => {
        const c = CASES[k];
        const s = [];
        s.push({ from: "p", to: "c", kind: "req", label: "📤 lần 1", title: "Request trích xuất lần 1", payload: { tools: [{ name: "extract_invoice", input_schema: "{…}" }], tool_choice: { type: "tool", name: "extract_invoice" }, messages: [{ role: "user", content: "<document>…hóa đơn…</document>" }] }, state: [{ r: "user", t: "&lt;document&gt; hóa đơn &lt;/document&gt;" }] });
        s.push({ from: "c", to: "p", kind: "res", label: "📥 tool_use", title: "Kết quả lần 1", payload: { type: "tool_use", id: "toolu_61", name: "extract_invoice", input: c.bad }, push: [{ r: "assistant", t: "tool_use extract_invoice (lần 1)" }] });
        s.push({ from: "p", to: "v", kind: "req", label: "🔎", title: "Chạy validator", payload: c.bad });
        s.push({ from: "v", to: "p", kind: "err", label: "❌ lỗi", title: "Validator trả lỗi CỤ THỂ", payload: { valid: false, errors: c.err }, hl: ["errors"] });
        if (!c.retry) {
          s.push({ from: "p", to: "p", kind: "internal", title: "Trước khi retry: thông tin có trong nguồn không?", snippet: "if field_missing(\"po_number\") and not re.search(r\"\\bP\\.?O\\.?\\s*[-#:]?\\s*\\d+\", source_text):\n    # nguồn không có → retry vô ích\n    return route_to_review(doc, reason=\"po_number vắng mặt trong nguồn\")", backend: ["Quét văn bản gốc: không có chuỗi nào giống số PO.", "Retry chỉ sửa được lỗi <i>cách trích</i>, không tạo ra dữ liệu không tồn tại.", "Retry nhiều lần còn tăng nguy cơ model <b>bịa</b> cho xong."], warn: "Tăng số lần retry từ 3 lên 10 là phản xạ sai phổ biến." });
          s.push({ from: "p", to: "q", kind: "ok", label: "👀 hàng đợi", title: "Giữ null + gắn cờ cho người duyệt", payload: { doc: "INV-901", po_number: null, flags: ["missing_in_source:po_number"], action: "liên hệ nhà cung cấp hoặc tra hệ thống mua hàng" } });
          return s;
        }
        s.push({
          from: "p", to: "c", kind: "req", label: "🔁 lần 2", title: "Retry: nối output cũ + tool_result lỗi vào hội thoại",
          payload: { tool_choice: { type: "tool", name: "extract_invoice" }, messages: [{ role: "user", content: "<document>…hóa đơn…</document>" }, { role: "assistant", content: [{ type: "tool_use", id: "toolu_61", name: "extract_invoice", input: c.bad }] }, { role: "user", content: [{ type: "tool_result", tool_use_id: "toolu_61", is_error: true, content: "Lỗi kiểm tra:\n- " + c.err.join("\n- ") + "\nHãy trích lại từ tài liệu và gọi extract_invoice." }] }] },
          hl: ["is_error", "tool_result", "document"],
          fields: [["messages[0]", "Tài liệu gốc — model cần nhìn lại nguồn để sửa."], ["messages[1]", "Output lỗi trước đó — biết mình đã sai ở đâu."], ["messages[2] (is_error)", "Lỗi cụ thể từ validator — không phải “thử lại đi”."]],
          push: [{ r: "err", t: "tool_result is_error: " + c.err[0].slice(0, 60) + "…" }],
        });
        s.push({ from: "c", to: "p", kind: "res", label: "📥 đã sửa", title: "Kết quả lần 2", payload: { type: "tool_use", id: "toolu_62", name: "extract_invoice", input: c.fixed }, push: [{ r: "assistant", t: "tool_use extract_invoice (lần 2)" }] });
        s.push({ from: "p", to: "v", kind: "ok", label: "✅", title: "Validator đạt", payload: { valid: true } });
        return s;
      },
    }),
  };

  /* ───────── 4-6 Review nhiều instance & nhiều lượt ───────── */
  W.multiPassTrace = {
    title: "Review PR 30 file: per-file → tích hợp → định tuyến theo độ tin cậy",
    render: trace({
      intro: "Mỗi reviewer là một <b>instance mới</b> (ngữ cảnh sạch, không có lịch sử sinh code). Lượt tích hợp chỉ nhận tóm tắt giao diện, không nhận lại toàn bộ code.",
      actors: [
        { id: "o", icon: "🧑‍💻", name: "Orchestrator", sub: "script CI" },
        { id: "f", icon: "🔍", name: "Reviewer per-file", sub: "N instance song song" },
        { id: "i", icon: "🔗", name: "Reviewer tích hợp" },
        { id: "h", icon: "👀", name: "Người duyệt" },
      ],
      stateTitle: "📋 Phát hiện",
      steps: [
        { from: "o", to: "o", kind: "internal", title: "Chia PR theo file", backend: ["30 file đổi → 30 request độc lập (chạy song song).", "Mỗi request: diff của 1 file + file liên quan trực tiếp (nếu cần) + tiêu chí review.", "Không đưa lịch sử phiên đã sinh code."], state: [] },
        { from: "o", to: "f", kind: "req", label: "📤 ×30", title: "Request cho một file", payload: { system: "Bạn là reviewer. Chỉ báo: lỗi logic, bảo mật, xử lý lỗi thiếu. Bỏ qua style. Mỗi phát hiện kèm dòng và trích đoạn code.", messages: [{ role: "user", content: "<criteria>…</criteria>\n<diff file=\"src/api/user.ts\">…</diff>" }], tool_choice: { type: "tool", name: "report_findings" } }, hl: ["system", "diff"] },
        { from: "f", to: "o", kind: "res", label: "📥 findings", title: "Mỗi reviewer trả phát hiện + tóm tắt giao diện", payload: { file: "src/api/user.ts", findings: [{ line: 88, severity: "high", confidence: 0.92, issue: "SQL nối chuỗi email", evidence: "`WHERE email = '${email}'`" }], interface_summary: { exports: ["getUser(email): Promise<User|null>"], assumptions: ["email đã được chuẩn hóa lowercase"] } }, hl: ["confidence", "evidence", "interface_summary"], push: [{ r: "ok", t: "user.ts:88 SQL injection (0.92)" }, { r: "note", t: "billing.ts:40 null-check (0.55)" }] },
        { from: "o", to: "i", kind: "req", label: "📤 tóm tắt", title: "Lượt tích hợp nhận 30 tóm tắt giao diện", payload: { messages: [{ role: "user", content: "<interfaces>\nuser.ts: getUser(email) giả định email lowercase\nsignup.ts: gọi getUser(req.body.email) (không chuẩn hóa)\n…28 file…\n</interfaces>\nTìm vấn đề XUYÊN file: hợp đồng giữa module, luồng dữ liệu." }] }, note: "Tóm tắt nhỏ gọn → lượt tích hợp có đủ chỗ để lập luận xuyên file thay vì bị loãng bởi 30 file code đầy đủ." },
        { from: "i", to: "o", kind: "res", label: "📥 cross-file", title: "Phát hiện lỗi mà không lượt per-file nào thấy", payload: { findings: [{ files: ["signup.ts", "user.ts"], severity: "medium", confidence: 0.81, issue: "signup gửi email chưa lowercase trong khi getUser giả định đã lowercase → không tìm thấy user có email viết hoa" }] }, push: [{ r: "ok", t: "signup.ts↔user.ts: giả định lowercase (0.81)" }] },
        { from: "o", to: "o", kind: "internal", title: "Định tuyến theo độ tin cậy (không xóa phát hiện)", backend: ["confidence ≥ 0.8 → đăng comment trực tiếp.", "0.5–0.8 → hàng đợi người duyệt xác nhận.", "Ngưỡng được hiệu chỉnh bằng tập PR có nhãn (xem 5-5), không đặt cảm tính."] },
        { from: "o", to: "h", kind: "warn", label: "👀 1 ca", title: "Ca tin cậy trung bình sang người duyệt", payload: { file: "billing.ts", line: 40, confidence: 0.55, issue: "invoice có thể undefined khi hủy đơn" }, push: [{ r: "note", t: "billing.ts:40 → chờ người duyệt" }] },
      ],
    }),
  };

  /* ───────── 4-5 Message Batches API ───────── */
  W.batchTrace = {
    title: "Vòng đời Message Batch: tạo → poll → tải kết quả → gửi lại phần lỗi",
    render: trace({
      intro: "10.000 hợp đồng cần trích xuất qua đêm. Không ai đang chờ → Batch giảm ~50% chi phí.",
      actors: [
        { id: "j", icon: "🌙", name: "Job đêm", sub: "code của bạn" },
        { id: "b", icon: "📮", name: "Batches API" },
        { id: "w", icon: "🏭", name: "Hàng đợi xử lý", sub: "phía Anthropic" },
        { id: "r", icon: "📄", name: "results.jsonl" },
      ],
      stateTitle: "📊 request_counts",
      steps: [
        { from: "j", to: "j", kind: "internal", title: "Dựng request với custom_id", backend: ["Mỗi tài liệu → một request độc lập.", "<code>custom_id</code> = mã tài liệu (duy nhất trong batch) để ghép kết quả.", "params giống hệt body của /v1/messages (có thể kèm tools, tool_choice, system)."], state: [] },
        { from: "j", to: "b", kind: "req", label: "📤 tạo batch", title: "Tạo batch", sub: "POST /v1/messages/batches", payload: { requests: [{ custom_id: "doc-00017", params: { model: MODEL, max_tokens: 1024, tools: [{ name: "extract_contract", input_schema: "{…}" }], tool_choice: { type: "tool", name: "extract_contract" }, messages: [{ role: "user", content: "<document>…</document>" }] } }, "…9.999 request khác…"] }, hl: ["custom_id", "params"], fields: [["requests[].custom_id", "Khóa ghép request ↔ kết quả. Kết quả <b>không</b> trả theo thứ tự gửi."], ["requests[].params", "Một request Messages API đầy đủ — nhưng chỉ <b>một lượt</b>: không có vòng lặp gọi công cụ trong batch."]] },
        { from: "b", to: "j", kind: "res", label: "🆔 msgbatch", title: "Nhận ID batch, trạng thái in_progress", payload: { id: "msgbatch_01HkcTjaV5uDC8jWR4ZsDV8d", type: "message_batch", processing_status: "in_progress", request_counts: { processing: 10000, succeeded: 0, errored: 0, canceled: 0, expired: 0 }, created_at: "2026-10-28T22:00:00Z", expires_at: "2026-10-29T22:00:00Z", results_url: null }, hl: ["processing_status", "expires_at", "request_counts"], fields: [["processing_status", "<code>in_progress</code> → <code>ended</code> (hoặc canceling)."], ["expires_at", "Sau 24 giờ, request chưa xử lý thành <code>expired</code>."], ["results_url", "Có giá trị khi batch kết thúc."]], push: [{ r: "note", t: "processing: 10.000" }] },
        { from: "b", to: "w", kind: "internal", label: "⏳", title: "Xử lý bất đồng bộ — không có SLA độ trễ", desc: "Thường xong sớm hơn nhiều, nhưng có thể tới 24 giờ. Vì vậy không dùng cho việc có người đang chờ (pre-merge check, chat)." },
        { from: "j", to: "b", kind: "req", label: "🔄 poll", title: "Kiểm tra định kỳ (vài phút một lần)", sub: "GET /v1/messages/batches/{id}", payload: { processing_status: "in_progress", request_counts: { processing: 3120, succeeded: 6830, errored: 50 } }, state: [{ r: "note", t: "processing: 3.120" }, { r: "ok", t: "succeeded: 6.830" }, { r: "err", t: "errored: 50" }] },
        { from: "b", to: "j", kind: "ok", label: "🏁 ended", title: "Batch kết thúc", payload: { processing_status: "ended", ended_at: "2026-10-29T01:47:12Z", request_counts: { processing: 0, succeeded: 9900, errored: 100, canceled: 0, expired: 0 }, results_url: "https://api.anthropic.com/v1/messages/batches/msgbatch_01Hkc…/results" }, hl: ["ended", "errored", "results_url"], state: [{ r: "ok", t: "succeeded: 9.900" }, { r: "err", t: "errored: 100" }] },
        { from: "j", to: "r", kind: "req", label: "⬇️ tải", title: "Tải kết quả JSONL (stream từng dòng)", sub: "GET results_url" },
        { from: "r", to: "j", kind: "res", label: "📄 JSONL", title: "Mỗi dòng một kết quả — thứ tự bất kỳ", payload: '{"custom_id":"doc-04211","result":{"type":"succeeded","message":{"content":[{"type":"tool_use","name":"extract_contract","input":{…}}],"stop_reason":"tool_use"}}}\n{"custom_id":"doc-00017","result":{"type":"errored","error":{"type":"invalid_request_error","message":"prompt is too long: 212043 tokens > 200000 maximum"}}}\n{"custom_id":"doc-00002","result":{"type":"succeeded","message":{…}}}', hl: ["errored", "custom_id"], fields: [["result.type", "<code>succeeded</code> · <code>errored</code> · <code>canceled</code> · <code>expired</code>."], ["custom_id", "Ghép về tài liệu gốc — không dựa vào số dòng."], ["error", "Lỗi theo từng request; các request khác không bị ảnh hưởng."]] },
        { from: "j", to: "j", kind: "internal", title: "Phân loại lỗi và chỉ xử lý lại phần hỏng", backend: ["Lọc 100 <code>custom_id</code> errored.", "Lỗi “prompt is too long” → chia tài liệu thành nhiều phần (doc-00017#p1, #p2…).", "Lỗi tạm thời (overloaded) → gửi lại nguyên trạng.", "<b>Không</b> gửi lại 9.900 request đã thành công."] },
        { from: "j", to: "b", kind: "req", label: "📤 batch #2", title: "Batch mới chỉ gồm phần lỗi (đã chia nhỏ)", payload: { requests: [{ custom_id: "doc-00017#p1", params: "{…nửa đầu…}" }, { custom_id: "doc-00017#p2", params: "{…nửa sau…}" }, "…228 request khác…"] }, note: "Tính hạn chót: nếu SLA nội bộ là 30 giờ và batch có thể mất 24 giờ, batch đầu phải gửi trong 6 giờ đầu — và chừa thời gian cho vòng gửi lại.", push: [{ r: "note", t: "batch #2: 230 request" }] },
      ],
    }),
  };
})();
