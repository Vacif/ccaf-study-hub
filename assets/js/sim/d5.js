/* Mô phỏng chi tiết — Chương 5: Context Management & Reliability */
(function () {
  const { trace } = window.SIM;
  const W = window.WIDGETS;

  /* ───────── 5-1 Lắp ráp ngữ cảnh cho mỗi request ───────── */
  W.contextAssembly = {
    title: "Backend lắp ráp ngữ cảnh: case facts, cắt gọn kết quả công cụ, tóm tắt",
    render: trace({
      intro: "Hội thoại hỗ trợ kéo dài 40 lượt. Theo dõi <b>bố cục ngữ cảnh</b> (bên phải) qua từng bước và xem câu trả lời cuối có giữ đúng số liệu không.",
      actors: [
        { id: "u", icon: "👤", name: "Khách" },
        { id: "b", icon: "🖥️", name: "Backend", sub: "context builder" },
        { id: "o", icon: "🗄️", name: "Orders API" },
        { id: "c", icon: "🧠", name: "Claude" },
      ],
      stateTitle: "🧱 Bố cục ngữ cảnh",
      controls: [
        { id: "facts", type: "toggle", label: "Khối <b>case facts</b> giữ nguyên văn", value: true },
        { id: "trim", type: "toggle", label: "Cắt gọn output công cụ", value: true },
      ],
      steps: ({ facts, trim }) => {
        const s = [];
        s.push({ from: "u", to: "b", kind: "req", label: "💬 lượt 1", title: "Khách nêu dữ kiện quan trọng", payload: { text: "Đơn #8812 của tôi bị trừ tiền 2 lần, mỗi lần 1.250.000đ, vào ngày 03/10." }, state: [{ r: "sys", t: "system prompt" }, { r: "user", t: "lượt 1: #8812, 2 × 1.250.000đ, 03/10" }] });
        if (facts) s.push({ from: "b", to: "b", kind: "internal", title: "Trích dữ kiện vào khối case facts", payload: { case_facts: { order_id: "8812", issue: "double_charge", amount_each_vnd: 1250000, charge_count: 2, charge_date: "2026-10-03", customer_id: "C-301" } }, backend: ["Trích bằng một lời gọi nhỏ (tool_use + schema) hoặc từ kết quả công cụ.", "Lưu ngoài lịch sử hội thoại; cập nhật khi có dữ kiện mới.", "Khối này <b>không bao giờ</b> bị tóm tắt."], state: [{ r: "sys", t: "system prompt" }, { r: "ok", t: "&lt;case_facts&gt; #8812 · 2 × 1.250.000đ · 03/10 &lt;/case_facts&gt;" }, { r: "user", t: "lượt 1" }] });
        s.push({ from: "b", to: "o", kind: "req", label: "🔎 lookup", title: "Gọi Orders API", payload: { order_id: "8812" } });
        s.push({ from: "o", to: "b", kind: "res", label: "📦 47 trường", title: "Kết quả thô: 47 trường (~1.100 token)", payload: { order_id: "8812", status: "delivered", charges: [{ id: "ch_1", amount: 1250000, at: "2026-10-03T09:12:00Z" }, { id: "ch_2", amount: 1250000, at: "2026-10-03T09:12:41Z" }], warehouse_code: "HCM-03", picker_id: "P-77", sla_tier: "std", utm_source: "fb", gift_wrap: false, "…": "38 trường khác không liên quan" } });
        if (trim) s.push({ from: "b", to: "b", kind: "internal", title: "Cắt gọn về trường liên quan", snippet: "KEEP = [\"order_id\", \"status\", \"charges\", \"refunds\", \"payment_method\"]\nslim = {k: raw[k] for k in KEEP if k in raw}", push: [{ r: "tool", t: "tool_result (gọn): status, 2 charges <b>~120 token</b>" }] });
        else s.push({ from: "b", to: "b", kind: "warn", title: "Đưa nguyên 47 trường vào lịch sử", push: [{ r: "err", t: "tool_result thô <b>~1.100 token</b> (×mỗi lần tra)" }], warn: "Sau 10 lần tra cứu, ~11.000 token rác chiếm ngữ cảnh và đẩy dữ kiện quan trọng vào “vùng giữa”." });
        s.push({ from: "u", to: "b", kind: "req", label: "💬 … lượt 38", title: "Hội thoại kéo dài (đổi địa chỉ, hỏi voucher, …)", desc: "Lịch sử vượt ngưỡng → backend tóm tắt các lượt cũ để tiết kiệm ngữ cảnh." });
        s.push({ from: "b", to: "b", kind: "internal", title: "Tóm tắt lũy tiến các lượt cũ", payload: { summary: "Khách phàn nàn bị trừ tiền nhiều lần cho một đơn, muốn hoàn tiền. Đã đổi địa chỉ giao hàng. Đã hỏi về voucher." }, warn: "Bản tóm tắt làm mất số liệu: “nhiều lần”, không còn 1.250.000đ, không còn ngày 03/10." });
        const layout = (facts ? [{ r: "ok", t: "&lt;case_facts&gt; #8812 · 2 × 1.250.000đ · 03/10 &lt;/case_facts&gt; <i>(đầu ngữ cảnh)</i>" }] : []).concat([{ r: "note", t: "&lt;summary&gt; lượt 1–30 (đã nén) &lt;/summary&gt;" }], trim ? [{ r: "tool", t: "kết quả công cụ gọn" }] : [{ r: "err", t: "kết quả công cụ thô ~11.000 token" }], [{ r: "user", t: "lượt 31–38 (nguyên văn)" }]);
        s.push({ from: "b", to: "c", kind: "req", label: "📤 lượt 39", title: "Request lượt 39: thứ tự các khối", payload: { system: "Bạn là agent CSKH… Luôn dựa vào <case_facts> cho số liệu.", messages: [{ role: "user", content: (facts ? "<case_facts>{\"order_id\":\"8812\",\"amount_each_vnd\":1250000,\"charge_count\":2,\"charge_date\":\"2026-10-03\"}</case_facts>\n" : "") + "<summary>Khách phàn nàn bị trừ tiền nhiều lần…</summary>" }, "…lượt 31–38…", { role: "user", content: "Vậy tôi sẽ được hoàn bao nhiêu?" }] }, hl: ["case_facts"], note: "Thông tin quan trọng đặt <b>đầu</b> ngữ cảnh, có thẻ rõ ràng → tránh “lost in the middle”.", state: [{ r: "sys", t: "system prompt" }].concat(layout) });
        const ok = facts;
        s.push({ from: "c", to: "u", kind: ok ? "ok" : "err", label: ok ? "💬 đúng" : "💬 sai", title: ok ? "Trả lời chính xác số liệu" : "Trả lời mơ hồ / sai số liệu", payload: { text: ok ? "Bạn bị trừ trùng 1 lần, nên sẽ được hoàn 1.250.000đ cho giao dịch ngày 03/10." : "Bạn sẽ được hoàn lại khoản bị trừ thừa, khoảng hơn 1 triệu đồng." }, warn: ok ? null : "Dữ kiện chính xác chỉ còn trong lượt 1 — đã bị nén mất. Tăng context window không sửa được: vấn đề là tóm tắt làm mất chi tiết." });
        return s;
      },
    }),
  };

  /* ───────── 5-2 Escalation & bàn giao ───────── */
  W.handoffTrace = {
    title: "Escalate & bàn giao có cấu trúc cho nhân viên",
    render: trace({
      intro: "Ba tình huống khác nhau, ba quyết định khác nhau. Chú ý <b>dữ liệu bàn giao</b> mà nhân viên nhận được.",
      actors: [
        { id: "u", icon: "👤", name: "Khách" },
        { id: "c", icon: "🧠", name: "Claude", sub: "agent CSKH" },
        { id: "b", icon: "🖥️", name: "Backend", sub: "helpdesk API" },
        { id: "h", icon: "🧑‍💼", name: "Nhân viên" },
      ],
      controls: [{ id: "k", type: "select", label: "Khách nói:", value: "ask", options: [["ask", "“Cho tôi gặp nhân viên.”"], ["gap", "“Bên kia bán rẻ hơn, khớp giá đi.”"], ["angry", "“Giao trễ 2 ngày, bực quá!” (việc đơn giản)"]] }],
      steps: ({ k }) => {
        const s = [];
        const msg = { ask: "Tôi đã nói 3 lần rồi, cho tôi gặp nhân viên.", gap: "Shop Y bán rẻ hơn 300.000đ, khớp giá cho tôi đi.", angry: "Giao trễ 2 ngày rồi, bực quá! Đơn #5521 đâu?" }[k];
        s.push({ from: "u", to: "c", kind: "req", label: "💬", title: "Tin nhắn của khách", payload: { text: msg } });
        if (k === "angry") {
          s.push({ from: "c", to: "c", kind: "internal", title: "Đánh giá: việc nằm trong khả năng xử lý", backend: ["Không có yêu cầu gặp người.", "Chính sách có quy định rõ (giao trễ → voucher 50.000đ).", "Cảm xúc tiêu cực ≠ ca phức tạp. Sentiment không phải tín hiệu escalate."] });
          s.push({ from: "c", to: "b", kind: "res", label: "📥 tool_use", title: "Tra đơn và áp chính sách", payload: { type: "tool_use", name: "lookup_order", input: { order_id: "5521" } } });
          s.push({ from: "c", to: "u", kind: "ok", label: "💬", title: "Ghi nhận cảm xúc + giải quyết", payload: { text: "Mình rất tiếc vì đơn #5521 trễ 2 ngày. Đơn đang ở bưu cục Q.3, dự kiến giao chiều nay. Mình đã tặng bạn voucher 50.000đ vì sự chậm trễ. Nếu bạn vẫn muốn trao đổi với nhân viên, mình chuyển ngay." } });
          return s;
        }
        if (k === "ask") s.push({ from: "c", to: "c", kind: "internal", title: "Yêu cầu rõ ràng → chuyển ngay", backend: ["Không cố “giải quyết thêm một chút”.", "Không hỏi khách vì sao muốn gặp người."] });
        else s.push({ from: "c", to: "c", kind: "internal", title: "Khoảng trống chính sách → escalate", backend: ["Chính sách chỉ nói về điều chỉnh giá <i>nội bộ</i>, không nói về khớp giá đối thủ.", "Agent không được tự sáng tạo chính sách."] });
        const handoff = { customer_id: "C-301", verified: true, channel: "chat", issue_type: k === "ask" ? "customer_requested_human" : "policy_gap_price_match", summary: k === "ask" ? "Khách yêu cầu gặp nhân viên sau 3 lần nhắc; vấn đề gốc: bị trừ tiền 2 lần cho đơn #8812." : "Khách yêu cầu khớp giá với Shop Y (rẻ hơn 300.000đ) cho đơn #9034. Chính sách chưa quy định khớp giá đối thủ.", facts: k === "ask" ? { order_id: "8812", amount_each_vnd: 1250000, charge_count: 2, charge_date: "2026-10-03" } : { order_id: "9034", our_price_vnd: 2490000, competitor: "Shop Y", competitor_price_vnd: 2190000, evidence_url: "https://shop-y.example/p/123" }, actions_taken: k === "ask" ? ["Xác minh khách qua email", "Xác nhận 2 giao dịch trùng"] : ["Xác minh khách", "Kiểm tra chính sách điều chỉnh giá"], recommended_action: k === "ask" ? "Hoàn 1.250.000đ giao dịch trùng (ch_2)" : "Quyết định có ngoại lệ khớp giá hay không", priority: "normal" };
        s.push({ from: "c", to: "b", kind: "res", label: "📥 escalate", title: "Claude gọi escalate_to_human với tóm tắt có cấu trúc", payload: { type: "tool_use", name: "escalate_to_human", input: handoff }, hl: ["summary", "facts", "actions_taken", "recommended_action"], fields: [["summary", "Một đoạn ngắn: chuyện gì xảy ra."], ["facts", "Số liệu chính xác — nhân viên không phải đọc transcript."], ["actions_taken", "Tránh làm lại việc agent đã làm (xác minh lại, hỏi lại)."], ["recommended_action", "Đề xuất để nhân viên quyết nhanh."]] });
        s.push({ from: "b", to: "b", kind: "internal", title: "Backend validate và tạo ticket", backend: ["Kiểm tra schema bàn giao đủ trường bắt buộc.", "Đính kèm link transcript đầy đủ (để tra cứu khi cần, không bắt đọc).", "Định tuyến theo issue_type: billing / policy-exception."], payload: { endpoint: "POST /helpdesk/tickets", queue: k === "ask" ? "billing" : "policy-exception", transcript_url: "https://…/sess_88" } });
        s.push({ from: "b", to: "h", kind: "ok", label: "🎫 ticket", title: "Nhân viên nhận thẻ ca đã tóm tắt", payload: { ticket: "T-20931", queue: k === "ask" ? "billing" : "policy-exception", card: handoff } });
        s.push({ from: "b", to: "c", kind: "res", label: "📤 tool_result", title: "Backend trả mã ticket", payload: { type: "tool_result", content: "{\"ticket\":\"T-20931\",\"eta_minutes\":8}" } });
        s.push({ from: "c", to: "u", kind: "ok", label: "💬", title: "Báo khách rõ ràng", payload: { text: "Mình đã chuyển bạn tới nhân viên (mã T-20931), thời gian chờ khoảng 8 phút. Nhân viên đã có đầy đủ thông tin, bạn không cần kể lại." } });
        return s;
      },
    }),
  };

  /* ───────── 5-3 Lan truyền lỗi trong hệ đa agent ───────── */
  W.errorPropTrace = {
    title: "1 trong 5 nguồn lỗi: subagent báo lên coordinator thế nào?",
    render: trace({
      intro: "Subagent search truy vấn 5 nguồn; <code>journal-db</code> timeout. Chọn cách subagent xử lý để thấy hậu quả ở báo cáo cuối.",
      actors: [
        { id: "c", icon: "🧭", name: "Coordinator" },
        { id: "s", icon: "🔎", name: "Subagent search" },
        { id: "n", icon: "🌐", name: "5 nguồn dữ liệu" },
        { id: "r", icon: "📝", name: "Báo cáo cuối" },
      ],
      stateTitle: "🗺️ Độ bao phủ coordinator biết",
      controls: [{ id: "m", type: "select", label: "Subagent xử lý lỗi:", value: "good", options: [["good", "✅ Lỗi có cấu trúc + kết quả một phần"], ["swallow", "🙈 Nuốt lỗi (trả success)"], ["crash", "💥 Ném exception, dừng hết"]] }],
      steps: ({ m }) => {
        const s = [];
        s.push({ from: "c", to: "s", kind: "req", label: "📤 Task", title: "Coordinator giao việc", payload: { name: "Task", input: { subagent_type: "search", prompt: "Thu thập số liệu áp dụng AI trong âm nhạc 2024–2026 từ: news, arxiv, industry-db, survey-hub, journal-db. Trả {results, errors, coverage}." } }, state: [] });
        s.push({ from: "s", to: "n", kind: "req", label: "⚡ 5 truy vấn", title: "Truy vấn song song 5 nguồn" });
        s.push({ from: "n", to: "s", kind: "err", label: "4 ✅ · 1 ⏱️", title: "4 nguồn trả dữ liệu, journal-db timeout", payload: { news: "12 kết quả", arxiv: "7 kết quả", "industry-db": "5 kết quả", "survey-hub": "3 kết quả", "journal-db": "ETIMEDOUT 10s" } });
        s.push({ from: "s", to: "s", kind: "internal", title: "Tự phục hồi lỗi tạm thời tại chỗ", backend: ["Lỗi transient → retry với backoff: 2s, 4s.", "Vẫn timeout sau 2 lần → dừng thử, không retry vô hạn.", "Quyết định báo lên trên — subagent không có quyền đổi phạm vi nghiên cứu."] });
        if (m === "good") {
          s.push({ from: "s", to: "c", kind: "warn", label: "📦 partial", title: "Trả kết quả một phần + lỗi có cấu trúc", payload: { status: "partial", results: "[…27 phát hiện từ 4 nguồn…]", errors: [{ source: "journal-db", type: "transient", detail: "timeout 10s sau 2 lần retry", attempted_query: "AI music adoption 2024..2026", alternatives: ["thử lại sau 15 phút", "dùng scholar-api cho nghiên cứu học thuật"] }], coverage: { news: "ok", arxiv: "ok", "industry-db": "ok", "survey-hub": "ok", "journal-db": "missing" } }, hl: ["status", "errors", "alternatives", "coverage"], push: [{ r: "ok", t: "4/5 nguồn có dữ liệu" }, { r: "err", t: "journal-db: thiếu (transient)" }] });
          s.push({ from: "c", to: "c", kind: "internal", title: "Coordinator quyết định phục hồi", backend: ["Nguồn học thuật quan trọng cho câu hỏi này → thử phương án thay thế: Task mới với scholar-api.", "Đồng thời ghi nhận: nếu vẫn thiếu, báo cáo phải có ghi chú độ bao phủ."] });
          s.push({ from: "c", to: "s", kind: "req", label: "📤 Task", title: "Task bổ sung với nguồn thay thế", payload: { name: "Task", input: { subagent_type: "search", prompt: "Chỉ truy vấn scholar-api: nghiên cứu học thuật về áp dụng AI trong âm nhạc 2024–2026…" } } });
          s.push({ from: "s", to: "c", kind: "ok", label: "📦 ok", title: "Có dữ liệu học thuật thay thế", payload: { status: "ok", results: "[…4 bài báo…]" }, push: [{ r: "ok", t: "học thuật: bù bằng scholar-api" }] });
          s.push({ from: "c", to: "r", kind: "ok", label: "📝", title: "Báo cáo kèm ghi chú độ bao phủ", payload: "## Ghi chú độ bao phủ\n- journal-db không khả dụng (timeout); dữ liệu học thuật lấy từ scholar-api (4 bài).\n- Các nguồn còn lại đầy đủ." });
        } else if (m === "swallow") {
          s.push({ from: "s", to: "c", kind: "err", label: "🙈 success", title: "Báo thành công, giấu lỗi", payload: { status: "success", results: "[…27 phát hiện…]" }, warn: "Coordinator tin rằng đã quét đủ 5 nguồn. Không có cơ hội thử nguồn thay thế.", push: [{ r: "err", t: "Tưởng 5/5 nguồn ok (sai)" }] });
          s.push({ from: "c", to: "r", kind: "err", label: "📝", title: "Báo cáo tự nhận “toàn diện” nhưng thiếu mảng học thuật", payload: "## Kết luận\nDựa trên khảo sát toàn diện các nguồn…  (không có nghiên cứu học thuật nào)" });
        } else {
          s.push({ from: "s", to: "c", kind: "err", label: "💥 exception", title: "Ném lỗi, bỏ 27 kết quả đã có", payload: { type: "tool_result", is_error: true, content: "RuntimeError: journal-db timeout" }, warn: "Kết quả của 4 nguồn tốt bị vứt bỏ; thông báo lỗi không nói đã thử gì, có phương án nào.", push: [{ r: "err", t: "Không có dữ liệu nào" }] });
          s.push({ from: "c", to: "r", kind: "err", label: "🛑", title: "Toàn bộ workflow dừng hoặc phải chạy lại từ đầu", payload: "Nghiên cứu thất bại: search error." });
        }
        return s;
      },
    }),
  };
})();
