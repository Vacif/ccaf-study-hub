/* Mô phỏng chi tiết — Chương 5: Context Management & Reliability */
(function () {
  const { trace } = window.SIM;
  const W = window.WIDGETS;

  /* ───────── 5-1 Lắp ráp ngữ cảnh ───────── */
  W.contextAssembly = {
    title: "Backend sắp xếp ngữ cảnh cho một cuộc trò chuyện dài",
    render: trace({
      intro: "Một cuộc trò chuyện hỗ trợ kéo dài 40 lượt. Mở tab “Ngữ cảnh gồm những gì” để xem nội dung gửi cho Claude thay đổi qua từng bước, và để ý xem câu trả lời cuối có giữ đúng con số không.",
      actors: [
        { id: "u", icon: "👤", name: "Khách" },
        { id: "b", icon: "🖥️", name: "Backend", sub: "sắp xếp ngữ cảnh" },
        { id: "o", icon: "🗄️", name: "Hệ thống đơn hàng" },
        { id: "c", icon: "🧠", name: "Claude" },
      ],
      stateTitle: "Ngữ cảnh gồm những gì",
      controls: [
        { id: "facts", type: "toggle", label: "Giữ khối <b>case facts</b> nguyên văn", value: true },
        { id: "trim", type: "toggle", label: "Cắt gọn kết quả công cụ", value: true },
      ],
      steps: ({ facts, trim }) => {
        const s = [];
        s.push({ from: "u", to: "b", kind: "req", label: "lượt 1", title: "Khách nêu những con số quan trọng", desc: "Ngay tin nhắn đầu, khách đưa ra mã đơn, số tiền, số lần bị trừ và ngày giao dịch. Đây là những dữ kiện mà về sau không được phép sai.", payload: { text: "Đơn #8812 của tôi bị trừ tiền 2 lần, mỗi lần 1.250.000đ, vào ngày 03/10." }, state: [{ r: "sys", t: "Hướng dẫn chung" }, { r: "user", t: "Lượt 1: đơn #8812, bị trừ 2 lần, mỗi lần 1.250.000đ, ngày 03/10" }] });
        if (facts) s.push({ from: "b", to: "b", kind: "internal", title: "Backend chép các con số vào khối case facts", desc: "Backend ghi riêng các dữ kiện quan trọng vào một khối gọi là case facts. Khối này nằm ngoài phần lịch sử trò chuyện, được đặt ở đầu mỗi lần gọi, và <b>không bao giờ</b> bị tóm tắt.", payload: { case_facts: { order_id: "8812", issue: "double_charge", amount_each_vnd: 1250000, charge_count: 2, charge_date: "2026-10-03", customer_id: "C-301" } }, state: [{ r: "sys", t: "Hướng dẫn chung" }, { r: "ok", t: "<b>case facts</b>: đơn #8812, 2 lần × 1.250.000đ, ngày 03/10" }, { r: "user", t: "Lượt 1" }] });
        s.push({ from: "b", to: "o", kind: "req", label: "tra đơn", title: "Tra cứu đơn hàng", desc: "Backend gọi hệ thống đơn hàng để kiểm tra.", payload: { order_id: "8812" } });
        s.push({ from: "o", to: "b", kind: "res", label: "47 trường", title: "Kết quả thô có tới 47 trường", desc: "Chỉ khoảng 5 trường là cần cho việc này (trạng thái, các lần trừ tiền…). Những trường còn lại như mã kho, mã nhân viên đóng gói hay nguồn quảng cáo hoàn toàn không liên quan.", payload: { order_id: "8812", status: "delivered", charges: [{ id: "ch_1", amount: 1250000, at: "2026-10-03T09:12:00Z" }, { id: "ch_2", amount: 1250000, at: "2026-10-03T09:12:41Z" }], warehouse_code: "HCM-03", picker_id: "P-77", sla_tier: "std", utm_source: "fb", gift_wrap: false, "...": "38 trường khác không liên quan" } });
        if (trim) s.push({ from: "b", to: "b", kind: "internal", title: "Backend chỉ giữ những trường cần thiết", desc: "Từ khoảng 1.100 token, kết quả chỉ còn khoảng 120 token. Lần tra cứu nào cũng được cắt gọn như vậy.", snippet: "KEEP = [\"order_id\", \"status\", \"charges\", \"refunds\", \"payment_method\"]\nslim = {k: raw[k] for k in KEEP if k in raw}", push: [{ r: "tool", t: "Kết quả tra đơn (đã cắt gọn), <b>khoảng 120 token</b>" }] });
        else s.push({ from: "b", to: "b", kind: "warn", title: "Đưa nguyên 47 trường vào lịch sử", desc: "Kết quả thô được đưa nguyên vào lịch sử trò chuyện.", push: [{ r: "err", t: "Kết quả tra đơn thô, <b>khoảng 1.100 token</b> mỗi lần tra" }], warn: "Sau 10 lần tra cứu, khoảng 11.000 token thông tin thừa chiếm chỗ trong ngữ cảnh, đẩy những dữ kiện quan trọng vào phần giữa, nơi dễ bị bỏ sót." });
        s.push({ from: "u", to: "b", kind: "req", label: "lượt 38", title: "Cuộc trò chuyện kéo dài", desc: "Khách hỏi thêm nhiều chuyện khác: đổi địa chỉ, hỏi về voucher… Lịch sử dài vượt ngưỡng, nên backend bắt đầu tóm tắt các lượt cũ cho đỡ tốn chỗ." });
        s.push({ from: "b", to: "b", kind: "internal", title: "Tóm tắt các lượt cũ", desc: "Bản tóm tắt giữ được ý chính, nhưng các con số cụ thể đã biến mất: “nhiều lần” thay vì “2 lần”, và không còn số tiền hay ngày giao dịch.", payload: { summary: "Khách phàn nàn bị trừ tiền nhiều lần cho một đơn hàng và muốn được hoàn tiền. Đã đổi địa chỉ giao hàng. Đã hỏi về voucher." }, warn: "Đây chính là cách thông tin quan trọng bị mất dần trong những cuộc trò chuyện dài." });
        const layout = (facts ? [{ r: "ok", t: "<b>case facts</b>: đơn #8812, 2 lần × 1.250.000đ, ngày 03/10 <i>(đặt ở đầu)</i>" }] : []).concat([{ r: "note", t: "Bản tóm tắt lượt 1 tới 30 (đã nén)" }], trim ? [{ r: "tool", t: "Các kết quả công cụ đã cắt gọn" }] : [{ r: "err", t: "Các kết quả công cụ thô, khoảng 11.000 token" }], [{ r: "user", t: "Lượt 31 tới 38 (giữ nguyên văn)" }]);
        s.push({ from: "b", to: "c", kind: "req", label: "lượt 39", title: "Nội dung gửi cho Claude ở lượt 39", desc: facts ? "Khối case facts nằm ngay đầu, có thẻ đánh dấu rõ ràng, nên Claude dễ dàng tìm thấy các con số chính xác." : "Không có khối case facts. Các con số chính xác chỉ còn nằm trong lượt 1, mà lượt 1 đã bị tóm tắt mất.", payload: { system: "Bạn là agent chăm sóc khách hàng... Luôn dựa vào <case_facts> khi nhắc tới số liệu.", messages: [{ role: "user", content: (facts ? "<case_facts>{\"order_id\":\"8812\",\"amount_each_vnd\":1250000,\"charge_count\":2,\"charge_date\":\"2026-10-03\"}</case_facts>\n" : "") + "<summary>Khách phàn nàn bị trừ tiền nhiều lần...</summary>" }, "...lượt 31 tới 38...", { role: "user", content: "Vậy tôi sẽ được hoàn bao nhiêu?" }] }, hl: ["case_facts"], state: [{ r: "sys", t: "Hướng dẫn chung" }].concat(layout) });
        s.push({ from: "c", to: "u", kind: facts ? "ok" : "err", label: facts ? "trả lời đúng" : "trả lời mơ hồ", title: facts ? "Claude trả lời đúng con số" : "Claude trả lời mơ hồ, có thể sai", desc: facts ? "Khách bị trừ trùng một lần, nên được hoàn 1.250.000đ cho giao dịch ngày 03/10." : "Không còn con số chính xác, Claude chỉ có thể trả lời chung chung.", payload: { text: facts ? "Bạn bị trừ trùng 1 lần, nên sẽ được hoàn 1.250.000đ cho giao dịch ngày 03/10." : "Bạn sẽ được hoàn lại khoản bị trừ thừa, khoảng hơn 1 triệu đồng." }, warn: facts ? null : "Đổi sang model có ngữ cảnh lớn hơn không sửa được lỗi này, vì vấn đề nằm ở chỗ bản tóm tắt đã làm mất dữ kiện." });
        return s;
      },
    }),
  };

  /* ───────── 5-2 Chuyển cho nhân viên ───────── */
  W.handoffTrace = {
    title: "Khi nào chuyển cho nhân viên, và chuyển kèm những gì",
    render: trace({
      intro: "Ba tình huống khác nhau dẫn tới ba cách xử lý khác nhau. Khi agent chuyển cho nhân viên, hãy để ý xem nhân viên nhận được những thông tin gì.",
      actors: [
        { id: "u", icon: "👤", name: "Khách" },
        { id: "c", icon: "🧠", name: "Claude", sub: "agent hỗ trợ" },
        { id: "b", icon: "🖥️", name: "Backend", sub: "hệ thống ticket" },
        { id: "h", icon: "🧑‍💼", name: "Nhân viên" },
      ],
      controls: [{ id: "k", type: "select", label: "Khách nói:", value: "ask", options: [["ask", "“Cho tôi gặp nhân viên.”"], ["gap", "“Bên kia bán rẻ hơn, giảm giá cho tôi đi.”"], ["angry", "“Giao trễ 2 ngày, bực quá!” (việc đơn giản)"]] }],
      steps: ({ k }) => {
        const s = [];
        const msg = { ask: "Tôi đã nói 3 lần rồi, cho tôi gặp nhân viên.", gap: "Shop Y bán rẻ hơn 300.000đ, giảm cho tôi bằng giá đó đi.", angry: "Giao trễ 2 ngày rồi, bực quá! Đơn #5521 đâu rồi?" }[k];
        s.push({ from: "u", to: "c", kind: "req", label: "tin nhắn", title: "Khách nhắn tin", desc: { ask: "Khách yêu cầu rõ ràng được nói chuyện với người thật.", gap: "Khách lịch sự, nhưng đưa ra một yêu cầu mà chính sách chưa quy định.", angry: "Khách rất bực, nhưng vấn đề thì đơn giản." }[k], payload: { text: msg } });
        if (k === "angry") {
          s.push({ from: "c", to: "c", kind: "internal", title: "Claude đánh giá: việc này tự xử lý được", desc: "Khách không yêu cầu gặp người. Chính sách có quy định rõ: giao trễ thì tặng voucher 50.000đ. Khách bực không có nghĩa là vụ việc khó, nên không cần chuyển." });
          s.push({ from: "c", to: "b", kind: "res", label: "tra đơn", title: "Tra đơn và áp dụng chính sách", desc: "Claude tra vị trí đơn hàng để trả lời khách.", payload: { type: "tool_use", name: "lookup_order", input: { order_id: "5521" } } });
          s.push({ from: "c", to: "u", kind: "ok", label: "trả lời", title: "Ghi nhận cảm xúc và giải quyết luôn", desc: "Claude xin lỗi, báo vị trí đơn hàng, tặng voucher theo chính sách, và vẫn sẵn sàng chuyển cho nhân viên nếu khách muốn.", payload: { text: "Mình rất tiếc vì đơn #5521 bị trễ 2 ngày. Đơn đang ở bưu cục Quận 3, dự kiến giao chiều nay. Mình đã tặng bạn voucher 50.000đ vì sự chậm trễ này. Nếu bạn vẫn muốn trao đổi với nhân viên, mình chuyển ngay nhé." } });
          return s;
        }
        if (k === "ask") s.push({ from: "c", to: "c", kind: "internal", title: "Khách yêu cầu rõ ràng, chuyển ngay", desc: "Claude không cố “giải quyết thêm một chút”, và cũng không hỏi vì sao khách muốn gặp người. Tôn trọng yêu cầu của khách là ưu tiên." });
        else s.push({ from: "c", to: "c", kind: "internal", title: "Chính sách chưa quy định, cần người có thẩm quyền", desc: "Chính sách chỉ nói về điều chỉnh giá nội bộ, không nói gì về giảm giá theo giá đối thủ. Agent không được tự đặt ra chính sách mới." });
        const handoff = { customer_id: "C-301", verified: true, channel: "chat", issue_type: k === "ask" ? "customer_requested_human" : "policy_gap_price_match", summary: k === "ask" ? "Khách yêu cầu gặp nhân viên sau 3 lần nhắc. Vấn đề gốc: bị trừ tiền 2 lần cho đơn #8812." : "Khách muốn được giảm bằng giá của Shop Y (rẻ hơn 300.000đ) cho đơn #9034. Chính sách chưa quy định việc giảm theo giá đối thủ.", facts: k === "ask" ? { order_id: "8812", amount_each_vnd: 1250000, charge_count: 2, charge_date: "2026-10-03" } : { order_id: "9034", our_price_vnd: 2490000, competitor: "Shop Y", competitor_price_vnd: 2190000, evidence_url: "https://shop-y.example/p/123" }, actions_taken: k === "ask" ? ["Đã xác minh khách qua email", "Đã xác nhận có 2 giao dịch trùng"] : ["Đã xác minh khách", "Đã kiểm tra chính sách điều chỉnh giá"], recommended_action: k === "ask" ? "Hoàn 1.250.000đ cho giao dịch thứ hai" : "Quyết định có áp dụng ngoại lệ hay không", priority: "normal" };
        s.push({ from: "c", to: "b", kind: "res", label: "chuyển cho người", title: "Claude gọi công cụ chuyển kèm bản tóm tắt có cấu trúc", desc: "Bản bàn giao gồm: khách là ai, chuyện gì xảy ra, các con số chính xác, agent đã làm gì, và đề xuất cách xử lý. Nhân viên đọc là có thể làm ngay.", payload: { type: "tool_use", name: "escalate_to_human", input: handoff }, hl: ["summary", "facts", "actions_taken", "recommended_action"], fields: [["summary", "Một đoạn ngắn kể lại chuyện gì đã xảy ra."], ["facts", "Các con số chính xác, để nhân viên không phải đọc lại đoạn chat."], ["actions_taken", "Những việc agent đã làm, để nhân viên không phải hỏi lại khách."], ["recommended_action", "Đề xuất của agent, giúp nhân viên quyết định nhanh hơn."]] });
        s.push({ from: "b", to: "b", kind: "internal", title: "Backend kiểm tra và tạo ticket", desc: "Backend kiểm tra bản bàn giao có đủ các trường bắt buộc, đính kèm đường dẫn tới toàn bộ đoạn chat (để tra khi cần, không bắt phải đọc), rồi chuyển vào đúng hàng đợi.", payload: { endpoint: "POST /helpdesk/tickets", queue: k === "ask" ? "billing" : "policy-exception", transcript_url: "https://.../sess_88" } });
        s.push({ from: "b", to: "h", kind: "ok", label: "ticket", title: "Nhân viên nhận được thẻ vụ việc", desc: "Nhân viên thấy ngay toàn bộ thông tin cần thiết, không phải đọc 140 tin nhắn, và khách cũng không phải kể lại từ đầu.", payload: { ticket: "T-20931", queue: k === "ask" ? "billing" : "policy-exception", card: handoff } });
        s.push({ from: "b", to: "c", kind: "res", label: "mã ticket", title: "Backend trả mã ticket cho Claude", desc: "Kèm thời gian chờ dự kiến.", payload: { type: "tool_result", content: "{\"ticket\":\"T-20931\",\"eta_minutes\":8}" } });
        s.push({ from: "c", to: "u", kind: "ok", label: "báo khách", title: "Claude báo rõ ràng cho khách", desc: "Khách biết đã được chuyển, mã ticket là gì, phải chờ bao lâu, và không cần kể lại.", payload: { text: "Mình đã chuyển bạn tới nhân viên (mã T-20931), thời gian chờ khoảng 8 phút. Nhân viên đã có đầy đủ thông tin, bạn không cần kể lại từ đầu." } });
        return s;
      },
    }),
  };

  /* ───────── 5-3 Lan truyền lỗi ───────── */
  W.errorPropTrace = {
    title: "Một trong năm nguồn bị lỗi: agent con nên báo lên thế nào?",
    render: trace({
      intro: "Agent tìm kiếm truy vấn năm nguồn, và nguồn <code>journal-db</code> bị quá thời gian chờ. Chọn cách agent con xử lý lỗi để xem hậu quả ở báo cáo cuối.",
      actors: [
        { id: "c", icon: "🧭", name: "Coordinator" },
        { id: "s", icon: "🔎", name: "Agent tìm kiếm" },
        { id: "n", icon: "🌐", name: "5 nguồn dữ liệu" },
        { id: "r", icon: "📝", name: "Báo cáo cuối" },
      ],
      stateTitle: "Coordinator biết gì về độ bao phủ",
      controls: [{ id: "m", type: "select", label: "Agent con xử lý lỗi bằng cách:", value: "good", options: [["good", "Báo lỗi rõ ràng, kèm phần kết quả đã có"], ["swallow", "Giấu lỗi, báo là thành công"], ["crash", "Dừng hẳn, bỏ hết kết quả"]] }],
      steps: ({ m }) => {
        const s = [];
        s.push({ from: "c", to: "s", kind: "req", label: "giao việc", title: "Coordinator giao việc tìm kiếm", desc: "Phiếu giao việc yêu cầu tìm ở năm nguồn, và trả kết quả kèm danh sách lỗi cùng độ bao phủ.", payload: { name: "Task", input: { subagent_type: "search", prompt: "Thu thập số liệu áp dụng AI trong âm nhạc 2024–2026 từ: news, arxiv, industry-db, survey-hub, journal-db. Trả về {results, errors, coverage}." } }, state: [] });
        s.push({ from: "s", to: "n", kind: "req", label: "5 truy vấn", title: "Truy vấn cùng lúc năm nguồn", desc: "Agent con gửi truy vấn tới cả năm nguồn một lượt." });
        s.push({ from: "n", to: "s", kind: "err", label: "4 được, 1 lỗi", title: "Bốn nguồn trả dữ liệu, journal-db bị quá thời gian chờ", desc: "Có 27 kết quả từ bốn nguồn. Riêng journal-db không phản hồi sau 10 giây.", payload: { news: "12 kết quả", arxiv: "7 kết quả", "industry-db": "5 kết quả", "survey-hub": "3 kết quả", "journal-db": "ETIMEDOUT sau 10 giây" } });
        s.push({ from: "s", to: "s", kind: "internal", title: "Agent con tự thử lại trước", desc: "Đây là lỗi tạm thời, nên agent con thử lại hai lần, lần sau chờ lâu hơn lần trước (2 giây rồi 4 giây). Vẫn lỗi, nên nó dừng thử, không thử mãi. Đổi sang nguồn khác là quyết định của coordinator, không phải của agent con." });
        if (m === "good") {
          s.push({ from: "s", to: "c", kind: "warn", label: "một phần", title: "Trả về kết quả một phần, kèm mô tả lỗi rõ ràng", desc: "Trạng thái là <code>partial</code> (một phần). Agent con gửi kèm 27 kết quả đã có, mô tả lỗi của journal-db (đã thử gì, thử mấy lần), và gợi ý các phương án thay thế.", payload: { status: "partial", results: "[...27 phát hiện từ 4 nguồn...]", errors: [{ source: "journal-db", type: "transient", detail: "quá thời gian chờ 10 giây, đã thử lại 2 lần", attempted_query: "AI music adoption 2024..2026", alternatives: ["thử lại sau 15 phút", "dùng scholar-api cho nghiên cứu học thuật"] }], coverage: { news: "ok", arxiv: "ok", "industry-db": "ok", "survey-hub": "ok", "journal-db": "missing" } }, hl: ["status", "errors", "alternatives", "coverage"], push: [{ r: "ok", t: "4 trên 5 nguồn có dữ liệu" }, { r: "err", t: "journal-db: thiếu (lỗi tạm thời)" }] });
          s.push({ from: "c", to: "c", kind: "internal", title: "Coordinator quyết định cách xử lý", desc: "Nghiên cứu học thuật quan trọng với đề tài này, nên coordinator thử phương án thay thế: giao một việc mới, tìm ở scholar-api. Nếu vẫn thiếu, báo cáo sẽ ghi rõ." });
          s.push({ from: "c", to: "s", kind: "req", label: "giao thêm", title: "Giao thêm việc với nguồn thay thế", desc: "Chỉ tìm ở scholar-api.", payload: { name: "Task", input: { subagent_type: "search", prompt: "Chỉ truy vấn scholar-api: nghiên cứu học thuật về áp dụng AI trong âm nhạc 2024–2026..." } } });
          s.push({ from: "s", to: "c", kind: "ok", label: "có dữ liệu", title: "Có dữ liệu học thuật bù vào", desc: "scholar-api trả về 4 bài báo.", payload: { status: "ok", results: "[...4 bài báo...]" }, push: [{ r: "ok", t: "Học thuật: đã bù bằng scholar-api" }] });
          s.push({ from: "c", to: "r", kind: "ok", label: "báo cáo", title: "Báo cáo có ghi chú độ bao phủ", desc: "Người đọc biết rõ dữ liệu học thuật lấy từ đâu, và nguồn nào đã không truy cập được.", payload: "## Ghi chú độ bao phủ\n- journal-db không truy cập được (quá thời gian chờ); dữ liệu học thuật lấy từ scholar-api (4 bài).\n- Các nguồn còn lại có đủ dữ liệu." });
        } else if (m === "swallow") {
          s.push({ from: "s", to: "c", kind: "err", label: "thành công (sai)", title: "Báo thành công, giấu lỗi", desc: "Agent con trả về 27 kết quả và ghi trạng thái là thành công, không nhắc gì tới journal-db.", payload: { status: "success", results: "[...27 phát hiện...]" }, warn: "Coordinator tưởng đã tìm đủ cả năm nguồn, nên không có lý do gì để thử nguồn khác.", push: [{ r: "err", t: "Tưởng cả 5 nguồn đều ổn (thực ra không phải)" }] });
          s.push({ from: "c", to: "r", kind: "err", label: "báo cáo", title: "Báo cáo nhận là “toàn diện” nhưng thiếu cả mảng học thuật", desc: "Người đọc tin rằng báo cáo đã xét đủ mọi nguồn, trong khi không có nghiên cứu học thuật nào.", payload: "## Kết luận\nDựa trên khảo sát toàn diện các nguồn...  (không có nghiên cứu học thuật nào)" });
        } else {
          s.push({ from: "s", to: "c", kind: "err", label: "dừng hẳn", title: "Dừng hẳn và bỏ luôn 27 kết quả", desc: "Agent con báo lỗi chung chung rồi dừng. Kết quả của bốn nguồn tốt cũng bị bỏ đi, và thông báo lỗi không nói đã thử những gì hay có thể làm gì khác.", payload: { type: "tool_result", is_error: true, content: "RuntimeError: journal-db timeout" }, push: [{ r: "err", t: "Không có dữ liệu nào" }] });
          s.push({ from: "c", to: "r", kind: "err", label: "thất bại", title: "Cả quy trình thất bại hoặc phải chạy lại từ đầu", desc: "Chỉ vì một nguồn bị lỗi, toàn bộ công việc đổ bể.", payload: "Nghiên cứu thất bại: lỗi tìm kiếm." });
        }
        return s;
      },
    }),
  };
})();
