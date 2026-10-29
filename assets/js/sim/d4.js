/* Mô phỏng chi tiết — Chương 4: Prompt Engineering & Structured Output */
(function () {
  const { trace } = window.SIM;
  const W = window.WIDGETS;
  const MODEL = "claude-sonnet-5-5";
  const DOC = "HỢP ĐỒNG DỊCH VỤ số 12/2026. Bên A: Công ty X. Giá trị: 120.000.000đ, gồm: Tư vấn 80.000.000đ; Soạn thảo 40.000.000đ. Hiệu lực 01/03/2026 – 28/02/2027. (Không có điều khoản gia hạn.)";

  /* ───────── 4-3 Trích xuất bằng công cụ có schema ───────── */
  W.extractionTrace = {
    title: "Trích xuất dữ liệu: dùng công cụ làm khuôn cho đầu ra JSON",
    render: trace({
      intro: "Ở đây không có công cụ nào thực sự được chạy. Ta khai báo một công cụ có danh sách tham số đúng bằng mẫu dữ liệu muốn nhận, bắt Claude gọi công cụ đó, rồi lấy phần tham số Claude điền làm kết quả.",
      actors: [
        { id: "p", icon: "🖥️", name: "Pipeline", sub: "chương trình của bạn" },
        { id: "c", icon: "🧠", name: "Claude API" },
        { id: "v", icon: "✅", name: "Bộ kiểm tra", sub: "kiểm tra nội dung" },
        { id: "d", icon: "🗄️", name: "Lưu trữ", sub: "hoặc hàng chờ duyệt" },
      ],
      controls: [{ id: "nul", type: "toggle", label: "Cho phép <code>renewal_date</code> nhận giá trị <code>null</code>", value: true }],
      steps: ({ nul }) => {
        const schema = { type: "object", properties: { party_a: { type: "string" }, total_vnd: { type: "integer" }, line_items: { type: "array", items: { type: "object", properties: { name: { type: "string" }, amount_vnd: { type: "integer" } }, required: ["name", "amount_vnd"] } }, start_date: { type: "string", description: "YYYY-MM-DD" }, renewal_date: { type: nul ? ["string", "null"] : "string", description: nul ? "YYYY-MM-DD; để null nếu hợp đồng không có điều khoản gia hạn" : "YYYY-MM-DD" }, service_type: { enum: ["it", "legal", "marketing", "other"] } }, required: ["party_a", "total_vnd", "line_items", "start_date", "renewal_date", "service_type"] };
        const out = { party_a: "Công ty X", total_vnd: 120000000, line_items: [{ name: "Tư vấn", amount_vnd: 80000000 }, { name: "Soạn thảo", amount_vnd: 40000000 }], start_date: "2026-03-01", renewal_date: nul ? null : "2027-03-01", service_type: "legal" };
        return [
          { from: "p", to: "p", kind: "internal", title: "Khai báo “công cụ” trích xuất, chính là mẫu dữ liệu mong muốn", desc: nul ? "Danh sách tham số mô tả đủ các trường cần lấy. Trường <code>renewal_date</code> được phép nhận <code>null</code>, nghĩa là “hợp đồng không có thông tin này”." : "Danh sách tham số mô tả đủ các trường cần lấy. Nhưng <code>renewal_date</code> là bắt buộc và phải là chuỗi, nên Claude không có cách nào nói “không có”.", payload: { name: "extract_contract", description: "Ghi lại các trường trích từ hợp đồng. Chỉ dùng thông tin có trong văn bản.", input_schema: schema }, hl: ["required", "renewal_date", "enum"], fields: [["required", "Danh sách trường bắt buộc phải có. Trường đã bắt buộc mà lại không cho null thì Claude buộc phải điền một giá trị nào đó."], ["type: [\"string\",\"null\"]", "Cho phép trường nhận giá trị null, để nói “không có thông tin” một cách hợp lệ."], ["enum", "Danh sách giá trị được phép. Có thêm “other” cho những trường hợp nằm ngoài danh sách."], ["description của trường", "Nơi ghi quy ước định dạng, và cách xử lý khi thiếu dữ liệu."]] },
          { from: "p", to: "c", kind: "req", label: "yêu cầu", title: "Gửi hợp đồng và bắt Claude gọi đúng công cụ này", sub: "POST /v1/messages", desc: "Trường <code>tool_choice</code> chỉ định đích danh <code>extract_contract</code>, nên Claude bắt buộc phải trả lời bằng cách gọi công cụ này, tức là trả lời bằng JSON đúng mẫu. Hợp đồng được bọc trong thẻ &lt;document&gt; để tách rõ khỏi lời yêu cầu.", payload: { model: MODEL, max_tokens: 1024, tools: [{ name: "extract_contract", input_schema: "{...như trên...}" }], tool_choice: { type: "tool", name: "extract_contract" }, messages: [{ role: "user", content: `<document>\n${DOC}\n</document>\nTrích xuất hợp đồng trên.` }] }, hl: ["tool_choice", "document"] },
          { from: "c", to: "p", kind: "res", label: "kết quả", title: "Kết quả nằm trong phần tham số Claude điền", desc: nul ? "JSON đúng mẫu. <code>renewal_date</code> là null, đúng với thực tế hợp đồng không có điều khoản gia hạn. Pipeline không chạy công cụ nào và không gửi kết quả lại cho Claude; chỉ cần lấy phần tham số là xong." : "JSON đúng mẫu, nhưng <code>renewal_date</code> là “2027-03-01”, một ngày do Claude <b>tự bịa</b>, vì mẫu bắt buộc phải có một chuỗi.", payload: { content: [{ type: "tool_use", id: "toolu_51", name: "extract_contract", input: out }], stop_reason: "tool_use" }, hl: ["input", "renewal_date"], warn: nul ? null : "Ngày bịa này trông rất hợp lý, đúng định dạng, nên bộ kiểm tra rất khó phát hiện." },
          { from: "p", to: "v", kind: "req", label: "kiểm tra", title: "Kiểm tra nội dung, việc mà schema không làm được", desc: "Schema chỉ đảm bảo dữ liệu đúng hình dạng. Bộ kiểm tra của bạn phải tự kiểm tra xem nội dung có hợp lý không.", backend: ["Tổng các dòng: 80 triệu cộng 40 triệu bằng 120 triệu, khớp tổng ghi trên hợp đồng.", "Ngày bắt đầu đứng trước ngày kết thúc.", "Mọi ngày tháng đều đúng định dạng năm-tháng-ngày.", nul ? "renewal_date là null, và văn bản có câu “Không có điều khoản gia hạn”. Khớp." : "renewal_date có giá trị, nhưng không câu nào trong văn bản chứa ngày này. Chỉ phát hiện được nếu có bước đối chiếu với văn bản gốc."] },
          { from: "v", to: "p", kind: nul ? "ok" : "warn", label: nul ? "đạt" : "nghi vấn", title: nul ? "Mọi kiểm tra đều đạt" : "Có điểm đáng nghi", desc: nul ? "Dữ liệu sẵn sàng để lưu." : "Bộ kiểm tra đánh dấu trường renewal_date vì không tìm thấy trong văn bản gốc.", payload: nul ? { valid: true, checks: 4 } : { valid: true, warnings: ["renewal_date không tìm thấy trong văn bản gốc"] } },
          { from: "p", to: "d", kind: nul ? "ok" : "warn", label: nul ? "lưu" : "chờ duyệt", title: nul ? "Lưu kết quả" : "Chuyển cho người kiểm tra", desc: nul ? "Bản ghi được lưu vào cơ sở dữ liệu." : "Bản ghi được đưa vào hàng chờ để một người kiểm tra lại.", payload: Object.assign({ source_doc: "HD-12-2026", extracted_by: MODEL }, out) },
        ];
      },
    }),
  };

  /* ───────── 4-4 Kiểm tra và thử lại ───────── */
  const CASES = {
    fmt: { label: "Sai định dạng ngày", bad: { invoice_no: "INV-889", invoice_date: "03/15/2026", po_number: "PO-4471", total: 1240, line_sum: 1240 }, err: ["invoice_date phải theo dạng YYYY-MM-DD, nhưng đang là \"03/15/2026\""], fixed: { invoice_no: "INV-889", invoice_date: "2026-03-15", po_number: "PO-4471", total: 1240, line_sum: 1240 }, retry: true },
    sum: { label: "Tổng tiền không khớp", bad: { invoice_no: "INV-889", invoice_date: "2026-03-15", po_number: "PO-4471", total: 1240, line_sum: 1140 }, err: ["Tổng các dòng (1140) khác tổng ghi trên hóa đơn (1240). Kiểm tra xem có dòng nào bị sót không, ví dụ phí vận chuyển."], fixed: { invoice_no: "INV-889", invoice_date: "2026-03-15", po_number: "PO-4471", total: 1240, line_sum: 1240, note: "đã thêm dòng Phí vận chuyển 100" }, retry: true },
    miss: { label: "Thiếu số PO (tài liệu không có)", bad: { invoice_no: "INV-901", invoice_date: "2026-04-02", po_number: null, total: 560, line_sum: 560 }, err: ["po_number là bắt buộc với nhà cung cấp này nhưng đang để trống"], retry: false },
  };
  W.retryLoop = {
    title: "Kiểm tra rồi thử lại: gửi lại những gì, và khi nào nên dừng",
    render: trace({
      intro: "Thử lại có hiệu quả khi bạn gửi kèm <b>tài liệu gốc, kết quả lỗi và mô tả lỗi cụ thể</b>. Nhưng trước khi thử lại, hãy tự hỏi: thông tin đó có thật sự nằm trong tài liệu không?",
      actors: [
        { id: "p", icon: "🖥️", name: "Pipeline" },
        { id: "c", icon: "🧠", name: "Claude API" },
        { id: "v", icon: "✅", name: "Bộ kiểm tra" },
        { id: "q", icon: "👀", name: "Người kiểm tra" },
      ],
      stateTitle: "Cuộc trò chuyện của lần trích xuất",
      controls: [{ id: "k", type: "select", label: "Lỗi gặp phải:", value: "fmt", options: Object.entries(CASES).map(([k, v]) => [k, v.label]) }],
      steps: ({ k }) => {
        const c = CASES[k];
        const s = [];
        s.push({ from: "p", to: "c", kind: "req", label: "lần 1", title: "Gửi yêu cầu trích xuất lần đầu", desc: "Gửi hóa đơn và bắt Claude trả kết quả theo mẫu của công cụ <code>extract_invoice</code>.", payload: { tools: [{ name: "extract_invoice", input_schema: "{...}" }], tool_choice: { type: "tool", name: "extract_invoice" }, messages: [{ role: "user", content: "<document>...hóa đơn...</document>" }] }, state: [{ r: "user", t: "Hóa đơn gốc (trong thẻ &lt;document&gt;)" }] });
        s.push({ from: "c", to: "p", kind: "res", label: "kết quả", title: "Nhận kết quả lần 1", desc: "Kết quả đúng mẫu JSON, nhưng chưa chắc nội dung đã đúng.", payload: { type: "tool_use", id: "toolu_61", name: "extract_invoice", input: c.bad }, push: [{ r: "assistant", t: "Kết quả trích xuất lần 1" }] });
        s.push({ from: "p", to: "v", kind: "req", label: "kiểm tra", title: "Chạy bộ kiểm tra", desc: "Bộ kiểm tra xem định dạng, tổng tiền và các trường bắt buộc.", payload: c.bad });
        s.push({ from: "v", to: "p", kind: "err", label: "có lỗi", title: "Bộ kiểm tra báo lỗi cụ thể", desc: "Lỗi được mô tả rõ ràng: sai ở trường nào, sai thế nào. Thông tin này sẽ dùng cho lần thử lại.", payload: { valid: false, errors: c.err }, hl: ["errors"] });
        if (!c.retry) {
          s.push({ from: "p", to: "p", kind: "internal", title: "Trước khi thử lại: tài liệu có thông tin này không?", desc: "Pipeline quét nhanh văn bản gốc và không thấy chuỗi nào giống số PO. Thử lại chỉ sửa được lỗi do <b>cách trích</b>, không tạo ra được thông tin vốn không có. Thử lại nhiều lần còn khiến Claude dễ bịa một số PO cho xong.", snippet: "if field_missing(\"po_number\") and not re.search(r\"\\bP\\.?O\\.?\\s*[-#:]?\\s*\\d+\", source_text):\n    # tài liệu không có số PO, thử lại cũng vô ích\n    return route_to_review(doc, reason=\"po_number không có trong tài liệu\")", warn: "Tăng số lần thử lại từ 3 lên 10 là phản xạ sai rất hay gặp." });
          s.push({ from: "p", to: "q", kind: "ok", label: "chờ duyệt", title: "Để trống và chuyển cho người kiểm tra", desc: "Số PO được để là null, kèm ghi chú “không có trong tài liệu”. Người kiểm tra sẽ liên hệ nhà cung cấp hoặc tra hệ thống mua hàng.", payload: { doc: "INV-901", po_number: null, flags: ["missing_in_source:po_number"], action: "liên hệ nhà cung cấp hoặc tra hệ thống mua hàng" } });
          return s;
        }
        s.push({
          from: "p", to: "c", kind: "req", label: "lần 2", title: "Thử lại: gửi kèm kết quả cũ và mô tả lỗi",
          desc: "Lần thử lại được viết như một cuộc trò chuyện nối tiếp: tài liệu gốc, kết quả lần trước của Claude, và một khối <code>tool_result</code> có <code>is_error: true</code> chứa mô tả lỗi. Nhìn thấy cả ba, Claude biết chính xác cần sửa chỗ nào.",
          payload: { tool_choice: { type: "tool", name: "extract_invoice" }, messages: [{ role: "user", content: "<document>...hóa đơn...</document>" }, { role: "assistant", content: [{ type: "tool_use", id: "toolu_61", name: "extract_invoice", input: c.bad }] }, { role: "user", content: [{ type: "tool_result", tool_use_id: "toolu_61", is_error: true, content: "Lỗi kiểm tra:\n- " + c.err.join("\n- ") + "\nHãy đọc lại tài liệu và gọi extract_invoice lần nữa." }] }] },
          hl: ["is_error", "tool_result", "document"],
          fields: [["messages[0]", "Tài liệu gốc, để Claude nhìn lại nguồn."], ["messages[1]", "Kết quả lần trước, để Claude biết mình đã trả lời gì."], ["messages[2]", "Mô tả lỗi cụ thể từ bộ kiểm tra, thay vì một câu chung chung “làm lại đi”."]],
          push: [{ r: "err", t: "Mô tả lỗi: " + c.err[0].slice(0, 60) + "..." }],
        });
        s.push({ from: "c", to: "p", kind: "res", label: "đã sửa", title: "Nhận kết quả lần 2", desc: k === "fmt" ? "Ngày đã được đổi sang dạng năm-tháng-ngày." : "Claude tìm ra dòng phí vận chuyển bị sót, và tổng đã khớp.", payload: { type: "tool_use", id: "toolu_62", name: "extract_invoice", input: c.fixed }, push: [{ r: "assistant", t: "Kết quả trích xuất lần 2" }] });
        s.push({ from: "p", to: "v", kind: "ok", label: "đạt", title: "Bộ kiểm tra cho qua", desc: "Mọi kiểm tra đều đạt. Chỉ cần một lần thử lại nhờ có mô tả lỗi rõ ràng.", payload: { valid: true } });
        return s;
      },
    }),
  };

  /* ───────── 4-6 Review nhiều lượt ───────── */
  W.multiPassTrace = {
    title: "Review pull request 30 file: từng file, liên kết, rồi chia việc theo độ tự tin",
    render: trace({
      intro: "Mỗi phiên review là một phiên Claude <b>mới tinh</b>, không biết gì về quá trình viết code. Lượt xem liên kết chỉ đọc bản tóm tắt của từng file, không đọc lại toàn bộ code.",
      actors: [
        { id: "o", icon: "🧑‍💻", name: "Script điều phối", sub: "chạy trong CI" },
        { id: "f", icon: "🔍", name: "Review từng file", sub: "nhiều phiên song song" },
        { id: "i", icon: "🔗", name: "Review liên kết" },
        { id: "h", icon: "👀", name: "Người kiểm tra" },
      ],
      stateTitle: "Các phát hiện",
      steps: [
        { from: "o", to: "o", kind: "internal", title: "Chia pull request theo từng file", desc: "30 file thay đổi được chia thành 30 lần gọi độc lập, chạy song song. Mỗi lần chỉ chứa phần thay đổi của một file, cùng tiêu chí review. Không lần nào chứa lịch sử của phiên đã viết code.", state: [] },
        { from: "o", to: "f", kind: "req", label: "30 lần gọi", title: "Yêu cầu review cho một file", desc: "Tiêu chí ghi rõ cần báo gì và bỏ qua gì. Mỗi phát hiện phải kèm số dòng và đoạn code làm bằng chứng.", payload: { system: "Bạn là người review code. Chỉ báo: lỗi logic, lỗi bảo mật, thiếu xử lý lỗi. Bỏ qua cách viết code cho đẹp. Mỗi phát hiện phải kèm số dòng và trích đoạn code.", messages: [{ role: "user", content: "<criteria>...</criteria>\n<diff file=\"src/api/user.ts\">...</diff>" }], tool_choice: { type: "tool", name: "report_findings" } }, hl: ["system", "diff"] },
        { from: "f", to: "o", kind: "res", label: "phát hiện", title: "Mỗi phiên trả về phát hiện, kèm tóm tắt phần giao tiếp", desc: "Ngoài các lỗi tìm được, mỗi phiên còn tóm tắt những gì file khác cần biết: hàm nào được dùng bên ngoài, và file này đang giả định điều gì. Bản tóm tắt này sẽ dùng cho lượt xem liên kết.", payload: { file: "src/api/user.ts", findings: [{ line: 88, severity: "high", confidence: 0.92, issue: "Nối chuỗi email trực tiếp vào câu SQL", evidence: "`WHERE email = '${email}'`" }], interface_summary: { exports: ["getUser(email): Promise<User|null>"], assumptions: ["email đã được đổi về chữ thường"] } }, hl: ["confidence", "evidence", "interface_summary"], push: [{ r: "ok", t: "user.ts dòng 88: nguy cơ SQL injection (độ tự tin 0,92)" }, { r: "note", t: "billing.ts dòng 40: thiếu kiểm tra rỗng (độ tự tin 0,55)" }] },
        { from: "o", to: "i", kind: "req", label: "30 bản tóm tắt", title: "Lượt xem liên kết đọc 30 bản tóm tắt", desc: "Vì chỉ đọc các bản tóm tắt ngắn, lượt này có đủ chỗ để so sánh giữa các file, thay vì bị chìm trong 30 file code đầy đủ.", payload: { messages: [{ role: "user", content: "<interfaces>\nuser.ts: getUser(email) giả định email đã là chữ thường\nsignup.ts: gọi getUser(req.body.email), không đổi về chữ thường\n...28 file khác...\n</interfaces>\nTìm vấn đề GIỮA các file: chỗ hai file hiểu khác nhau về dữ liệu." }] } },
        { from: "i", to: "o", kind: "res", label: "lỗi giữa file", title: "Tìm ra lỗi mà không lượt review từng file nào thấy", desc: "Hàm getUser giả định email đã là chữ thường, nhưng trang đăng ký gửi email nguyên như người dùng gõ. Người đăng ký bằng email có chữ hoa sẽ không đăng nhập được. Mỗi file riêng lẻ đều trông ổn; lỗi chỉ nằm ở chỗ nối giữa chúng.", payload: { findings: [{ files: ["signup.ts", "user.ts"], severity: "medium", confidence: 0.81, issue: "signup gửi email chưa đổi về chữ thường, trong khi getUser giả định đã đổi" }] }, push: [{ r: "ok", t: "signup.ts và user.ts: hiểu khác nhau về chữ hoa thường (0,81)" }] },
        { from: "o", to: "o", kind: "internal", title: "Chia việc theo độ tự tin, không xóa phát hiện nào", desc: "Phát hiện có độ tự tin cao được đăng thẳng lên pull request. Phát hiện có độ tự tin trung bình được chuyển cho người xem lại. Ngưỡng được đặt dựa trên dữ liệu thực tế đã kiểm chứng (xem mục 5-5), không đặt theo cảm tính." },
        { from: "o", to: "h", kind: "warn", label: "1 phát hiện", title: "Chuyển phát hiện có độ tự tin trung bình cho người kiểm tra", desc: "Phát hiện ở billing.ts chỉ có độ tự tin 0,55, nên một người sẽ xem lại trước khi đăng.", payload: { file: "billing.ts", line: 40, confidence: 0.55, issue: "invoice có thể chưa có giá trị khi đơn bị hủy" }, push: [{ r: "note", t: "billing.ts dòng 40: chờ người kiểm tra" }] },
      ],
    }),
  };

  /* ───────── 4-5 Message Batches API ───────── */
  W.batchTrace = {
    title: "Vòng đời của một batch: gửi, chờ, tải kết quả, gửi lại phần lỗi",
    render: trace({
      intro: "Cần trích xuất 10.000 hợp đồng qua đêm. Không ai phải ngồi chờ kết quả, nên dùng Batch API để giảm khoảng một nửa chi phí.",
      actors: [
        { id: "j", icon: "🌙", name: "Job chạy đêm", sub: "chương trình của bạn" },
        { id: "b", icon: "📮", name: "Batch API" },
        { id: "w", icon: "🏭", name: "Hàng đợi xử lý", sub: "phía Anthropic" },
        { id: "r", icon: "📄", name: "File kết quả" },
      ],
      stateTitle: "Đếm số yêu cầu",
      steps: [
        { from: "j", to: "j", kind: "internal", key: true, title: "Chuẩn bị các yêu cầu, mỗi yêu cầu có một mã riêng", desc: "Mỗi hợp đồng thành một yêu cầu độc lập. Mỗi yêu cầu được gắn một <code>custom_id</code> do bạn đặt, ở đây là mã tài liệu, để sau này ghép kết quả về đúng hợp đồng.", state: [] },
        { from: "j", to: "b", kind: "req", label: "gửi batch", key: true, title: "Gửi một lần cả 10.000 yêu cầu", sub: "POST /v1/messages/batches", desc: "Mỗi yêu cầu bên trong có cấu trúc giống hệt một lần gọi Claude bình thường.", payload: { requests: [{ custom_id: "doc-00017", params: { model: MODEL, max_tokens: 1024, tools: [{ name: "extract_contract", input_schema: "{...}" }], tool_choice: { type: "tool", name: "extract_contract" }, messages: [{ role: "user", content: "<document>...</document>" }] } }, "...9.999 yêu cầu khác..."] }, hl: ["custom_id", "params"], fields: [["custom_id", "Mã để ghép yêu cầu với kết quả. Kết quả trả về <b>không theo thứ tự</b> đã gửi."], ["params", "Nội dung một lần gọi Claude. Mỗi yêu cầu chỉ là một lượt hỏi đáp; không có vòng lặp gọi công cụ bên trong batch."]] },
        { from: "b", to: "j", kind: "res", label: "mã batch", title: "Nhận mã batch, trạng thái “đang xử lý”", desc: "Batch API nhận yêu cầu và trả lại mã batch. Hạn chót xử lý là 24 giờ kể từ lúc gửi.", payload: { id: "msgbatch_01HkcTjaV5uDC8jWR4ZsDV8d", type: "message_batch", processing_status: "in_progress", request_counts: { processing: 10000, succeeded: 0, errored: 0, canceled: 0, expired: 0 }, created_at: "2026-10-28T22:00:00Z", expires_at: "2026-10-29T22:00:00Z", results_url: null }, hl: ["processing_status", "expires_at", "request_counts"], fields: [["processing_status", "“in_progress” là đang xử lý, “ended” là đã xong."], ["expires_at", "Quá thời điểm này, những yêu cầu chưa xử lý sẽ bị hủy (expired)."], ["results_url", "Đường dẫn tải kết quả, chỉ có khi batch đã xong."]], push: [{ r: "note", t: "Đang xử lý: 10.000" }] },
        { from: "b", to: "w", kind: "internal", label: "xếp hàng", key: true, title: "Yêu cầu được xử lý dần, không cam kết thời gian", desc: "Thường xong sớm hơn nhiều, nhưng có thể mất tới 24 giờ. Vì thế không dùng batch cho những việc có người đang chờ, như trả lời chat hay kiểm tra trước khi merge." },
        { from: "j", to: "b", kind: "req", label: "hỏi tiến độ", title: "Thỉnh thoảng hỏi lại trạng thái", sub: "GET /v1/messages/batches/{id}", desc: "Job hỏi vài phút một lần. Lúc này đã xong được hơn hai phần ba.", payload: { processing_status: "in_progress", request_counts: { processing: 3120, succeeded: 6830, errored: 50 } }, state: [{ r: "note", t: "Đang xử lý: 3.120" }, { r: "ok", t: "Thành công: 6.830" }, { r: "err", t: "Lỗi: 50" }] },
        { from: "b", to: "j", kind: "ok", label: "đã xong", key: true, title: "Batch hoàn tất", desc: "Sau gần 4 tiếng, mọi yêu cầu đã được xử lý: 9.900 thành công và 100 lỗi. Đường dẫn tải kết quả giờ đã có.", payload: { processing_status: "ended", ended_at: "2026-10-29T01:47:12Z", request_counts: { processing: 0, succeeded: 9900, errored: 100, canceled: 0, expired: 0 }, results_url: "https://api.anthropic.com/v1/messages/batches/msgbatch_01Hkc.../results" }, hl: ["ended", "errored", "results_url"], state: [{ r: "ok", t: "Thành công: 9.900" }, { r: "err", t: "Lỗi: 100" }] },
        { from: "j", to: "r", kind: "req", label: "tải về", title: "Tải file kết quả", sub: "GET results_url", desc: "File kết quả có mỗi dòng là một đối tượng JSON (định dạng JSONL)." },
        { from: "r", to: "j", kind: "res", label: "kết quả", key: true, title: "Mỗi dòng là kết quả của một yêu cầu, không theo thứ tự", desc: "Dòng thứ hai là một yêu cầu bị lỗi vì hợp đồng quá dài, vượt giới hạn của model. Các yêu cầu khác không bị ảnh hưởng.", payload: '{"custom_id":"doc-04211","result":{"type":"succeeded","message":{"content":[{"type":"tool_use","name":"extract_contract","input":{...}}],"stop_reason":"tool_use"}}}\n{"custom_id":"doc-00017","result":{"type":"errored","error":{"type":"invalid_request_error","message":"prompt is too long: 212043 tokens > 200000 maximum"}}}\n{"custom_id":"doc-00002","result":{"type":"succeeded","message":{...}}}', hl: ["errored", "custom_id"], fields: [["result.type", "succeeded (thành công), errored (lỗi), canceled (bị hủy) hoặc expired (hết hạn)."], ["custom_id", "Dùng để ghép về đúng hợp đồng. Đừng ghép theo số thứ tự dòng."]] },
        { from: "j", to: "j", kind: "internal", title: "Chỉ xử lý lại những yêu cầu bị lỗi", desc: "Job lọc ra 100 mã bị lỗi. Hợp đồng quá dài được chia làm hai nửa. 9.900 yêu cầu đã thành công thì giữ nguyên, không gửi lại." },
        { from: "j", to: "b", kind: "req", label: "batch thứ 2", key: true, title: "Gửi một batch mới chỉ gồm phần bị lỗi", desc: "Batch thứ hai có 230 yêu cầu: những hợp đồng dài đã được chia nhỏ, cùng những yêu cầu bị lỗi tạm thời.", payload: { requests: [{ custom_id: "doc-00017#p1", params: "{...nửa đầu...}" }, { custom_id: "doc-00017#p2", params: "{...nửa sau...}" }, "...228 yêu cầu khác..."] }, note: "Tính giờ gửi: nếu cần kết quả trong 30 giờ, và mỗi batch có thể mất 24 giờ, thì batch đầu phải gửi trong khoảng 6 giờ đầu, và còn phải chừa thời gian cho vòng gửi lại.", push: [{ r: "note", t: "Batch thứ 2: 230 yêu cầu" }] },
      ],
    }),
  };
})();
