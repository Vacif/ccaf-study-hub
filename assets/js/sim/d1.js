/* Mô phỏng chi tiết — Chương 1: Agentic Architecture & Orchestration */
(function () {
  const { trace } = window.SIM;
  const W = window.WIDGETS;
  const MODEL = "claude-sonnet-5-5";
  const J = (o) => JSON.stringify(o);

  /* ───────── 1-1 Vòng lặp agent ───────── */
  const TOOLS = [
    {
      name: "get_customer",
      description: "Tra hồ sơ khách theo email hoặc mã đơn. Dùng để XÁC MINH danh tính trước mọi thao tác liên quan tới tiền.",
      input_schema: { type: "object", properties: { order_id: { type: "string" }, email: { type: "string" } } },
    },
    { name: "lookup_order", description: "Tra đơn theo mã đơn: trạng thái, số tiền, số ngày từ khi giao.", input_schema: { type: "object", properties: { order_id: { type: "string" } }, required: ["order_id"] } },
    { name: "get_refund_policy", description: "Lấy chính sách hoàn tiền hiện hành (thời hạn, hạn mức).", input_schema: { type: "object", properties: {} } },
    { name: "process_refund", description: "Hoàn tiền cho đơn ĐÃ xác minh. Chỉ gọi sau get_customer.", input_schema: { type: "object", properties: { order_id: { type: "string" }, amount: { type: "number" } }, required: ["order_id", "amount"] } },
  ];
  const HTTP = "POST https://api.anthropic.com/v1/messages\nx-api-key: $ANTHROPIC_API_KEY\nanthropic-version: 2023-06-01\ncontent-type: application/json";
  const LOOP_CODE = `def run_agent(session_id: str, user_text: str) -> str:
    messages = store.load(session_id)          # API không nhớ gì, backend tự giữ lịch sử
    messages.append({"role": "user", "content": user_text})
    max_tok = 1024

    for turn in range(MAX_TURNS):              # lưới an toàn, không phải tín hiệu dừng
        resp = client.messages.create(
            model=MODEL,
            max_tokens=max_tok,
            system=SYSTEM_PROMPT,
            tools=TOOLS,                       # tên + mô tả + tham số của từng công cụ
            messages=messages,                 # gửi lại toàn bộ lịch sử mỗi lượt
        )
        if resp.stop_reason == "max_tokens":  # bị cắt ngang giữa chừng
            max_tok *= 4; continue             # gọi lại với giới hạn lớn hơn
        messages.append({"role": "assistant", "content": resp.content})

        if resp.stop_reason == "end_turn":    # Claude đã làm xong
            store.save(session_id, messages)
            return "".join(b.text for b in resp.content if b.type == "text")

        if resp.stop_reason == "tool_use":
            results = []
            for block in resp.content:         # có thể có nhiều yêu cầu cùng lúc
                if block.type != "tool_use":
                    continue
                out = run_tool(session_id, block.name, block.input)  # kiểm tra rồi mới chạy
                results.append({
                    "type": "tool_result",
                    "tool_use_id": block.id,   # phải trùng mã của yêu cầu
                    "content": json.dumps(out.data),
                    "is_error": out.is_error,
                })
            messages.append({"role": "user", "content": results})  # mọi kết quả trong một tin nhắn

    return escalate_to_human(session_id, reason="max_turns")`;

  W.agentLoop = {
    title: "Vòng lặp agent hoàn tiền, xem từng bước",
    render: trace({
      intro: "Khách nhắn tin xin hoàn tiền. Theo dõi tin nhắn đó đi qua bốn bên: khách, chương trình của bạn (backend), Claude và hệ thống nội bộ của công ty. Điểm quan trọng nhất: Claude không tự chạy công cụ, nó chỉ <b>xin</b> backend chạy giúp.",
      actors: [
        { id: "u", icon: "👤", name: "Khách hàng", sub: "khung chat" },
        { id: "b", icon: "🖥️", name: "Backend", sub: "chương trình của bạn" },
        { id: "c", icon: "🧠", name: "Claude API", sub: "Messages API" },
        { id: "t", icon: "🗄️", name: "Hệ thống nội bộ", sub: "khách hàng, đơn, thanh toán" },
      ],
      stateTitle: "Lịch sử hội thoại backend đang giữ",
      code: { title: "Vòng lặp agent viết bằng Python", src: LOOP_CODE },
      controls: [{ id: "v", type: "select", label: "Tình huống:", value: "ok", options: [["ok", "Mọi thứ suôn sẻ"], ["err", "Một công cụ bị lỗi tạm thời"], ["mt", "Câu trả lời bị cắt ngang (max_tokens)"]] }],
      steps: ({ v }) => {
        const s = [];
        s.push({
          from: "u", to: "b", kind: "req", label: "tin nhắn", key: true, title: "Khách gửi tin nhắn", sub: "POST /chat",
          desc: "Khách gõ “Tôi muốn hoàn tiền đơn #1234”. Tin nhắn đi tới backend của bạn, không đi thẳng tới Claude. Backend là nơi điều phối mọi thứ.",
          payload: { session_id: "sess_42", text: "Tôi muốn hoàn tiền đơn #1234" },
          fields: [["session_id", "Mã phiên trò chuyện. Backend dùng nó để lấy lại lịch sử và trạng thái của phiên, ví dụ khách đã được xác minh chưa."], ["text", "Nội dung khách gõ. Nó sẽ được thêm vào lịch sử dưới dạng một tin nhắn của người dùng."]],
          backend: ["Kiểm tra người dùng đã đăng nhập và không gửi quá nhiều tin.", "Lấy lịch sử của phiên; đây là phiên mới nên lịch sử đang trống.", "Thêm tin nhắn của khách vào lịch sử."],
          lines: [1, 3], push: [{ r: "user", t: "“Tôi muốn hoàn tiền đơn #1234”" }],
        });
        s.push({
          from: "b", to: "b", kind: "internal", title: "Backend chuẩn bị yêu cầu gửi cho Claude",
          desc: "Mỗi lần hỏi Claude, backend phải gửi đủ bốn thứ: chọn model nào, hướng dẫn chung, danh sách công cụ Claude được dùng, và toàn bộ cuộc trò chuyện tính tới lúc này.",
          backend: ["Chọn model và giới hạn độ dài câu trả lời (<code>max_tokens</code>).", "Gắn hướng dẫn chung (<code>system</code>): vai trò của agent và các quy tắc.", "Gắn danh sách công cụ (<code>tools</code>). Claude chỉ biết về công cụ qua tên, mô tả và danh sách tham số.", "Gắn toàn bộ lịch sử (<code>messages</code>), vì API không nhớ gì giữa các lần gọi."],
          lines: [5, 12],
        });
        s.push({
          from: "b", to: "c", kind: "req", label: "yêu cầu #1", key: true, title: "Gửi yêu cầu đầu tiên tới Claude", sub: "POST /v1/messages",
          desc: "Đây là nội dung thật được gửi đi qua HTTP. Phần đầu là thông tin xác thực, phần sau là dữ liệu dạng JSON. Mở tab “Dữ liệu được gửi” để xem đầy đủ.",
          payloads: [{ t: "Phần đầu HTTP", d: HTTP }, { t: "Dữ liệu JSON", d: { model: MODEL, max_tokens: 1024, system: "Bạn là agent chăm sóc khách hàng của ShopX. Luôn xác minh khách trước khi làm gì liên quan tới tiền. Trả lời ngắn gọn bằng tiếng Việt.", tools: TOOLS, messages: [{ role: "user", content: "Tôi muốn hoàn tiền đơn #1234" }] }, hl: ["tools", "messages", "system", "max_tokens"] }],
          fields: [
            ["model", "Model sẽ xử lý yêu cầu."],
            ["max_tokens", "Giới hạn độ dài câu trả lời. Nếu Claude viết chạm giới hạn này, nó bị cắt ngang và stop_reason sẽ là \"max_tokens\"."],
            ["system", "Hướng dẫn chung cho cả cuộc trò chuyện, tách riêng khỏi lời của khách."],
            ["tools[].description", "Đoạn mô tả công cụ. Đây là căn cứ chính để Claude chọn công cụ nào."],
            ["tools[].input_schema", "Danh sách tham số của công cụ. Claude điền tham số theo đúng mẫu này."],
            ["messages", "Toàn bộ cuộc trò chuyện. Lượt đầu chỉ có một tin nhắn của khách."],
            ["tool_choice", "Không gửi trường này nghĩa là để Claude tự quyết: gọi công cụ hoặc trả lời bằng chữ."],
          ],
          lines: [6, 12],
        });
        s.push({
          from: "c", to: "c", kind: "internal", title: "Claude suy nghĩ",
          desc: "Claude đọc hướng dẫn, danh sách công cụ và tin nhắn của khách. Nó thấy đây là việc liên quan tới tiền, mà hướng dẫn yêu cầu xác minh khách trước, nên nó quyết định cần gọi <code>get_customer</code>. Không có dòng if/else nào viết sẵn quyết định này; Claude tự suy ra.",
          note: "Claude không có quyền truy cập hệ thống khách hàng của bạn. Nó chỉ có thể trả về một yêu cầu kiểu “hãy chạy get_customer với mã đơn 1234 giúp tôi”.",
        });
        if (v === "mt") {
          s.push({
            from: "c", to: "b", kind: "err", label: "bị cắt", key: true, title: "Câu trả lời bị cắt ngang",
            desc: "Lần này Claude viết dài quá giới hạn 1024 token và bị cắt giữa chừng. Trường <code>stop_reason</code> là <code>max_tokens</code>. Điều đó có nghĩa là Claude <b>chưa nói xong</b>, không phải đã làm xong.",
            payload: { id: "msg_01Trunc", type: "message", role: "assistant", content: [{ type: "text", text: "Mình sẽ kiểm tra thông tin đơn hàng và hồ sơ của bạn. Trước tiên mình cần xác minh danh tính, sau đó tra cứu chính sách hoàn tiền hiện hành để…" }], stop_reason: "max_tokens", usage: { input_tokens: 1187, output_tokens: 40 } },
            hl: ["stop_reason"],
            warn: "Nếu chương trình dừng lại mỗi khi câu trả lời có chữ, khách sẽ nhận được câu trả lời cụt lủn này.",
          });
          s.push({
            from: "b", to: "c", kind: "req", label: "gọi lại", key: true, title: "Backend tăng giới hạn và hỏi lại", sub: "POST /v1/messages",
            desc: "Backend nhận ra câu trả lời bị cắt, nên không lưu nó vào lịch sử. Thay vào đó, backend tăng giới hạn độ dài lên gấp bốn rồi gửi lại đúng cuộc trò chuyện cũ.",
            backend: ["Không thêm câu trả lời bị cắt vào lịch sử.", "Tăng <code>max_tokens</code> từ 1024 lên 4096.", "Ghi nhật ký để sau này chỉnh lại giới hạn cho phù hợp, vì giới hạn quá thấp là lỗi cấu hình."],
            payload: { model: MODEL, max_tokens: 4096, system: "(như yêu cầu #1)", tools: "(4 công cụ như yêu cầu #1)", messages: [{ role: "user", content: "Tôi muốn hoàn tiền đơn #1234" }] }, hl: ["max_tokens"],
            lines: [13, 14],
          });
        }
        s.push({
          from: "c", to: "b", kind: "res", label: "xin chạy công cụ", key: true, title: "Claude trả lời: vừa có chữ, vừa xin chạy công cụ", sub: "200 OK",
          desc: "Câu trả lời gồm hai khối. Khối đầu là một câu nói với khách. Khối sau là <code>tool_use</code>: yêu cầu chạy công cụ <code>get_customer</code> với mã đơn 1234. Trường <code>stop_reason</code> là <code>tool_use</code>, nghĩa là Claude đang chờ kết quả công cụ để làm tiếp.",
          payload: { id: "msg_01XFDUD", type: "message", role: "assistant", model: MODEL, content: [{ type: "text", text: "Mình kiểm tra thông tin của bạn trước nhé." }, { type: "tool_use", id: "toolu_01A", name: "get_customer", input: { order_id: "1234" } }], stop_reason: "tool_use", stop_sequence: null, usage: { input_tokens: 1187, output_tokens: 64 } },
          hl: ["stop_reason", "tool_use", "id", "input"],
          fields: [
            ["content", "Danh sách các khối trong câu trả lời. Một câu trả lời có thể chứa cả chữ lẫn yêu cầu chạy công cụ."],
            ["tool_use.id", "Mã riêng của yêu cầu này. Khi gửi kết quả về, backend phải ghi đúng mã này."],
            ["tool_use.name", "Tên công cụ Claude muốn chạy."],
            ["tool_use.input", "Tham số Claude điền vào. Backend vẫn phải kiểm tra lại trước khi chạy."],
            ["stop_reason", "Lý do Claude dừng ở lượt này. <code>tool_use</code> nghĩa là cần chạy công cụ rồi gửi kết quả lại."],
            ["usage", "Số token đã dùng, để tính chi phí."],
          ],
          warn: "Câu trả lời có chữ “Mình kiểm tra thông tin của bạn trước nhé”, nhưng Claude chưa làm xong. Nếu chương trình thấy có chữ là dừng, khách sẽ không bao giờ được hoàn tiền.",
          lines: [17, 21],
        });
        s.push({
          from: "b", to: "b", kind: "internal", title: "Backend đọc stop_reason và chuẩn bị chạy công cụ",
          desc: "Vì <code>stop_reason</code> là <code>tool_use</code>, backend biết phải chạy công cụ. Trước khi chạy, nó lưu nguyên văn câu trả lời của Claude vào lịch sử, rồi kiểm tra yêu cầu có hợp lệ không.",
          backend: ["Lưu nguyên văn câu trả lời của Claude vào lịch sử, kể cả khối tool_use.", "Tìm hàm xử lý tương ứng với tên công cụ. Nếu không có công cụ nào tên như vậy, trả về lỗi thay vì làm sập chương trình.", "Kiểm tra tham số: mã đơn có đúng định dạng không, phiên này có được phép tra cứu không."],
          lines: [15, 26], push: [{ r: "assistant", t: "Câu nói + yêu cầu chạy <b>get_customer</b> (mã toolu_01A)" }],
        });
        s.push({ from: "b", to: "t", kind: "req", label: "tra khách", key: true, title: "Backend gọi hệ thống khách hàng thật", sub: "GET /crm/customers?order=1234", desc: "Đây mới là lúc công cụ thực sự chạy. Backend gọi hệ thống nội bộ bằng địa chỉ và quyền truy cập của riêng nó. Claude không hề biết những thông tin này.", payload: { order_id: "1234" }, lines: [26, 26] });
        s.push({ from: "t", to: "b", kind: "res", label: "hồ sơ khách", title: "Hệ thống khách hàng trả về hồ sơ", desc: "Kết quả thô thường có nhiều trường không cần thiết như ghi chú nội bộ hay thông tin tiếp thị. Nên lọc bớt trước khi đưa cho Claude, để tiết kiệm chỗ và tránh gây nhiễu.", payload: { customer_id: "C-88", name: "Trần Lan", tier: "gold", email_verified: true, internal_notes: "...", marketing_flags: ["..."], created_at: 1704067200 } });
        s.push({
          from: "b", to: "b", kind: "internal", title: "Đóng gói kết quả và thêm vào lịch sử",
          desc: "Backend chỉ giữ ba trường cần thiết, đặt vào một khối <code>tool_result</code> mang đúng mã <code>toolu_01A</code>, rồi thêm vào lịch sử. Khối này được gửi dưới vai trò người dùng (<code>user</code>), ngay sau câu trả lời có yêu cầu của Claude.",
          backend: ["Lọc lại, chỉ giữ mã khách, tên và hạng thành viên.", "Ghi nhận ở phía server rằng khách C-88 đã được xác minh, để bước hoàn tiền sau đó kiểm tra.", "Tạo khối <code>tool_result</code> với <code>tool_use_id</code> trùng mã yêu cầu.", "Thêm khối đó vào lịch sử."],
          snippet: J({ role: "user", content: [{ type: "tool_result", tool_use_id: "toolu_01A", content: J({ customer_id: "C-88", name: "Trần Lan", tier: "gold" }) }] }),
          lines: [27, 33], push: [{ r: "tool", t: "Kết quả cho toolu_01A: C-88, Trần Lan, hạng gold" }],
        });
        s.push({
          from: "b", to: "c", kind: "req", label: "yêu cầu #2", key: true, title: "Gửi lại toàn bộ cuộc trò chuyện", sub: "POST /v1/messages",
          desc: "Lần gọi thứ hai không chỉ gửi kết quả mới. Backend gửi lại tất cả: tin nhắn của khách, câu trả lời trước của Claude và kết quả công cụ. Claude cần thấy cả ba để biết bước tiếp theo.",
          payload: { model: MODEL, max_tokens: v === "mt" ? 4096 : 1024, system: "(như trước)", tools: "(4 công cụ)", messages: [{ role: "user", content: "Tôi muốn hoàn tiền đơn #1234" }, { role: "assistant", content: [{ type: "text", text: "Mình kiểm tra thông tin của bạn trước nhé." }, { type: "tool_use", id: "toolu_01A", name: "get_customer", input: { order_id: "1234" } }] }, { role: "user", content: [{ type: "tool_result", tool_use_id: "toolu_01A", content: "{\"customer_id\":\"C-88\",\"name\":\"Trần Lan\",\"tier\":\"gold\"}" }] }] },
          hl: ["tool_result", "tool_use_id", "messages"],
          note: "Vì phải gửi lại mọi thứ ở mỗi lượt, cuộc trò chuyện càng dài thì mỗi lần gọi càng tốn. Đó là lý do nên lọc gọn kết quả công cụ và dùng prompt caching.",
          lines: [6, 12],
        });
        s.push({
          from: "c", to: "b", kind: "res", label: "xin chạy 2 công cụ", title: "Claude xin chạy hai công cụ cùng lúc",
          desc: "Tra đơn hàng và tra chính sách hoàn tiền là hai việc độc lập, nên Claude xin chạy cả hai trong cùng một câu trả lời. Mỗi yêu cầu có mã riêng: <code>toolu_02B</code> và <code>toolu_02C</code>.",
          payload: { id: "msg_02", role: "assistant", content: [{ type: "tool_use", id: "toolu_02B", name: "lookup_order", input: { order_id: "1234" } }, { type: "tool_use", id: "toolu_02C", name: "get_refund_policy", input: {} }], stop_reason: "tool_use", usage: { input_tokens: 1342, output_tokens: 71 } },
          hl: ["toolu_02B", "toolu_02C", "stop_reason"],
          lines: [21, 25], push: [{ r: "assistant", t: "Xin chạy 2 công cụ: <b>lookup_order</b> và <b>get_refund_policy</b>" }],
        });
        s.push({ from: "b", to: "t", kind: "req", label: "2 lệnh cùng lúc", title: "Backend chạy hai công cụ", desc: "Backend có thể chạy lần lượt hoặc song song cho nhanh. Chạy kiểu nào cũng được, miễn là cuối cùng có kết quả cho <b>cả hai</b> yêu cầu.", lines: [23, 26] });
        if (v === "err") {
          s.push({ from: "t", to: "b", kind: "err", label: "1 lỗi", title: "Tra đơn thành công, nhưng dịch vụ chính sách bị quá tải", desc: "Dịch vụ chính sách không phản hồi sau 5 giây. Đây là lỗi tạm thời: thử lại sau một chút có thể sẽ được.", payloads: [{ t: "lookup_order", d: { amount: 89, status: "delivered", days_since_delivery: 12 } }, { t: "get_refund_policy", d: "HTTP 503 Service Unavailable (quá 5 giây)" }] });
          s.push({
            from: "b", to: "c", kind: "req", label: "yêu cầu #3", key: true, title: "Báo lỗi cho Claude một cách rõ ràng",
            desc: "Backend vẫn gửi kết quả cho cả hai yêu cầu. Kết quả của công cụ bị lỗi được đánh dấu <code>is_error: true</code>, kèm mô tả: đây là lỗi tạm thời và có thể thử lại.",
            payload: { role: "user", content: [{ type: "tool_result", tool_use_id: "toolu_02B", content: "{\"amount\":89,\"status\":\"delivered\",\"days_since_delivery\":12}" }, { type: "tool_result", tool_use_id: "toolu_02C", is_error: true, content: "{\"errorCategory\":\"transient\",\"isRetryable\":true,\"message\":\"Dịch vụ chính sách không phản hồi sau 5 giây\"}" }] },
            hl: ["is_error", "isRetryable", "errorCategory"],
            fields: [["is_error", "Báo cho Claude biết công cụ này đã thất bại. Claude sẽ tự quyết thử lại, đổi cách khác, hay báo cho khách."], ["errorCategory", "Loại lỗi. Lỗi tạm thời (transient) thì thử lại có thể được."], ["isRetryable", "Gợi ý có nên thử lại hay không."]],
            warn: "Nếu bỏ qua kết quả của toolu_02C, API sẽ từ chối yêu cầu vì có một yêu cầu chạy công cụ chưa được trả lời.",
            push: [{ r: "tool", t: "toolu_02B: đơn $89, giao cách đây 12 ngày" }, { r: "err", t: "toolu_02C: lỗi tạm thời, có thể thử lại" }],
          });
          s.push({ from: "c", to: "b", kind: "res", label: "thử lại", title: "Claude tự thử lại công cụ bị lỗi", desc: "Nhờ biết đây là lỗi tạm thời, Claude gọi lại <code>get_refund_policy</code>. Nếu đó là lỗi vi phạm chính sách, Claude sẽ giải thích cho khách thay vì thử lại.", payload: { content: [{ type: "tool_use", id: "toolu_03R", name: "get_refund_policy", input: {} }], stop_reason: "tool_use" }, push: [{ r: "assistant", t: "Xin chạy lại <b>get_refund_policy</b>" }] });
          s.push({ from: "b", to: "c", kind: "req", label: "kết quả", title: "Lần này dịch vụ chính sách trả lời bình thường", desc: "Chính sách cho phép hoàn tiền trong 30 ngày, và tự động duyệt nếu số tiền không quá $500.", payload: { role: "user", content: [{ type: "tool_result", tool_use_id: "toolu_03R", content: "{\"max_days\":30,\"auto_limit_usd\":500}" }] }, push: [{ r: "tool", t: "toolu_03R: hạn 30 ngày, hạn mức $500" }] });
        } else {
          s.push({ from: "t", to: "b", kind: "res", label: "2 kết quả", title: "Cả hai công cụ trả kết quả", desc: "Đơn #1234 trị giá $89, đã giao cách đây 12 ngày. Chính sách cho phép hoàn trong 30 ngày, tự động duyệt nếu không quá $500.", payloads: [{ t: "lookup_order", d: { amount: 89, status: "delivered", days_since_delivery: 12 } }, { t: "get_refund_policy", d: { max_days: 30, auto_limit_usd: 500 } }] });
          s.push({
            from: "b", to: "c", kind: "req", label: "yêu cầu #3", title: "Hai kết quả gửi chung một tin nhắn", sub: "POST /v1/messages",
            desc: "Hai kết quả được gói chung trong <b>một</b> tin nhắn, mỗi kết quả mang đúng mã yêu cầu của nó. Phần còn lại của yêu cầu giống lần trước.",
            payload: { role: "user", content: [{ type: "tool_result", tool_use_id: "toolu_02B", content: "{\"amount\":89,\"status\":\"delivered\",\"days_since_delivery\":12}" }, { type: "tool_result", tool_use_id: "toolu_02C", content: "{\"max_days\":30,\"auto_limit_usd\":500}" }] },
            hl: ["tool_use_id"], payloadTitle: "Tin nhắn mới được thêm vào lịch sử",
            warn: "Tách thành hai tin nhắn riêng là lỗi hay gặp. Mọi kết quả của cùng một lượt phải nằm chung một tin nhắn.",
            lines: [33, 33], push: [{ r: "tool", t: "toolu_02B: đơn $89 · toolu_02C: hạn 30 ngày" }],
          });
        }
        s.push({ from: "c", to: "b", kind: "res", label: "xin hoàn tiền", title: "Claude xin hoàn tiền", desc: "Khách đã được xác minh, đơn còn trong hạn và số tiền nằm dưới hạn mức. Claude xin chạy <code>process_refund</code> với số tiền $89.", payload: { content: [{ type: "tool_use", id: "toolu_04D", name: "process_refund", input: { order_id: "1234", amount: 89 } }], stop_reason: "tool_use" }, hl: ["process_refund", "amount"], push: [{ r: "assistant", t: "Xin chạy <b>process_refund</b> với $89" }] });
        s.push({
          from: "b", to: "t", kind: "req", label: "hoàn tiền", key: true, title: "Backend tự kiểm tra lần cuối rồi mới hoàn tiền", sub: "POST /billing/refunds",
          desc: "Backend không làm theo Claude một cách mù quáng. Trước khi gọi hệ thống thanh toán, nó tự kiểm tra lại các điều kiện bằng code. Nếu một điều kiện không đạt, lệnh bị chặn và Claude nhận được thông báo lỗi.",
          backend: ["Khách đã được xác minh chưa? Có, vì chính backend đã ghi nhận C-88 ở bước trước, không dựa vào lời Claude.", "Số tiền $89 có dưới hạn mức $500 không? Có.", "Đơn có còn trong hạn 30 ngày không? Còn, mới 12 ngày.", "Gọi hệ thống thanh toán kèm một khóa chống trùng, để nếu phải gửi lại thì khách cũng không bị hoàn tiền hai lần."],
          snippet: "def run_tool(sid, name, inp):\n    if name == \"process_refund\":\n        if not session[sid].verified_customer_id:\n            return Err(\"permission\", \"Chưa xác minh khách\")\n        if inp[\"amount\"] > POLICY.auto_limit:\n            return Err(\"business\", \"Vượt hạn mức, cần người duyệt\")\n    return HANDLERS[name](**inp)",
          lines: [26, 26],
        });
        s.push({ from: "t", to: "b", kind: "res", label: "đã hoàn", title: "Hệ thống thanh toán xác nhận", desc: "Hoàn tiền thành công với mã R-551. Tiền sẽ về tài khoản của khách trong 3 đến 5 ngày.", payload: { refund_id: "R-551", status: "ok", eta_days: "3-5" } });
        s.push({ from: "b", to: "c", kind: "req", label: "yêu cầu cuối", title: "Gửi kết quả hoàn tiền cho Claude", desc: "Backend lại gửi cả cuộc trò chuyện, lần này có thêm kết quả hoàn tiền.", payload: { role: "user", content: [{ type: "tool_result", tool_use_id: "toolu_04D", content: "{\"refund_id\":\"R-551\",\"status\":\"ok\",\"eta_days\":\"3-5\"}" }] }, push: [{ r: "tool", t: "toolu_04D: hoàn tiền thành công, mã R-551" }] });
        s.push({
          from: "c", to: "b", kind: "ok", label: "xong", key: true, title: "Claude trả lời: stop_reason = \"end_turn\"",
          desc: "Lần này câu trả lời chỉ có chữ, và <code>stop_reason</code> là <code>end_turn</code>. Đây là tín hiệu Claude đã làm xong. Backend thoát khỏi vòng lặp.",
          payload: { content: [{ type: "text", text: "Đã hoàn $89 cho đơn #1234 (mã R-551). Tiền sẽ về thẻ của bạn trong 3 đến 5 ngày làm việc." }], stop_reason: "end_turn", usage: { input_tokens: 1702, output_tokens: 41 } },
          hl: ["end_turn"],
          lines: [17, 19], push: [{ r: "assistant", t: "“Đã hoàn $89… mã R-551” <b>(end_turn)</b>" }],
        });
        s.push({ from: "b", to: "u", kind: "ok", label: "trả lời", key: true, title: "Backend gửi câu trả lời cho khách", desc: "Khách chỉ thấy câu trả lời bằng chữ. Những khối yêu cầu và kết quả công cụ là chuyện nội bộ giữa backend và Claude.", payload: { reply: "Đã hoàn $89 cho đơn #1234 (mã R-551). Tiền sẽ về thẻ của bạn trong 3 đến 5 ngày làm việc." }, backend: ["Lưu lịch sử để lần sau khách nhắn tiếp thì vẫn nối được.", "Chỉ gửi phần chữ cho khách.", "Ghi nhật ký kiểm toán: ai được hoàn, bao nhiêu, mã giao dịch nào."], lines: [18, 19] });
        return s;
      },
    }),
  };

  /* ───────── 1-3 Coordinator giao việc qua Task ───────── */
  W.subagentTrace = {
    title: "Coordinator giao việc cho agent con: ai nhìn thấy gì?",
    render: trace({
      intro: "Hãy để ý tab “Coordinator đang biết gì”. Agent con làm việc trong ngữ cảnh riêng, và coordinator chỉ nhận lại <b>kết quả cuối</b> của từng agent con, không thấy các bước trung gian.",
      actors: [
        { id: "a", icon: "🖥️", name: "Ứng dụng", sub: "khởi động hệ thống" },
        { id: "c", icon: "🧭", name: "Coordinator", sub: "agent điều phối" },
        { id: "s", icon: "⚙️", name: "Agent SDK", sub: "chạy công cụ Task" },
        { id: "r", icon: "🔎", name: "Agent tìm kiếm", sub: "ngữ cảnh riêng" },
        { id: "y", icon: "📝", name: "Agent tổng hợp", sub: "ngữ cảnh riêng" },
      ],
      stateTitle: "Coordinator đang biết gì",
      controls: [
        { id: "par", type: "toggle", label: "Giao cả 4 việc trong <b>cùng một</b> lượt", value: true },
        { id: "full", type: "toggle", label: "Phiếu giao việc ghi đầy đủ thông tin", value: true },
      ],
      steps: ({ par, full }) => {
        const s = [];
        s.push({
          from: "a", to: "c", kind: "req", label: "khởi động", title: "Ứng dụng khởi động coordinator và khai báo các agent con",
          desc: "Ứng dụng giao đề tài cho coordinator, đồng thời khai báo hai loại agent con có thể dùng: <b>search</b> để tìm kiếm và <b>synth</b> để tổng hợp. Coordinator được phép dùng công cụ Task để giao việc.",
          payload: { prompt: "Nghiên cứu tác động của AI tới các ngành sáng tạo. Báo cáo có trích nguồn.", options: { systemPrompt: "Bạn là coordinator nghiên cứu. Chia đề tài bao quát đủ các khía cạnh, giao cho agent con, tổng hợp và ghi chú độ bao phủ.", allowedTools: ["Task"], agents: { search: { description: "Tìm và đọc nguồn trên web cho MỘT khía cạnh của đề tài.", prompt: "Bạn chuyên tìm kiếm. Trả về JSON {findings:[{claim, quote, url, date}]}.", tools: ["WebSearch", "WebFetch"], model: "haiku" }, synth: { description: "Tổng hợp các phát hiện đã có thành báo cáo. Không tìm kiếm thêm.", prompt: "Viết báo cáo, giữ nguyên trích dẫn, nêu rõ chỗ mâu thuẫn.", tools: [] } } } },
          hl: ["allowedTools", "agents", "description", "tools"],
          fields: [["allowedTools: [\"Task\"]", "Coordinator được phép dùng công cụ Task. Thiếu dòng này thì không giao được việc cho ai."], ["agents.*.description", "Mô tả từng agent con. Coordinator đọc mô tả này để quyết định giao việc cho ai."], ["agents.*.tools", "Công cụ của từng agent con. Agent tổng hợp không có công cụ tìm kiếm, nên không thể tự đi tìm thêm."], ["agents.*.model", "Có thể dùng model nhỏ, rẻ hơn cho agent con làm việc đơn giản."]],
          push: [{ r: "sys", t: "Hướng dẫn coordinator + mô tả công cụ Task (search, synth)" }, { r: "user", t: "Đề tài: tác động của AI tới các ngành sáng tạo" }],
        });
        s.push({ from: "c", to: "c", kind: "internal", key: true, title: "Coordinator chia đề tài thành các phần", desc: "Coordinator chia thành bốn khía cạnh: nghệ thuật thị giác, âm nhạc, văn học và điện ảnh. Đây là bước dễ sai nhất: nếu chia thiếu khía cạnh nào, báo cáo cuối sẽ thiếu phần đó, dù các agent con làm tốt tới đâu.", note: "Kiểm tra xem danh sách khía cạnh đã đủ chưa ở ngay bước này rẻ hơn nhiều so với phát hiện thiếu ở báo cáo cuối." });
        const task = (topic, id) => ({ type: "tool_use", id, name: "Task", input: { description: "Tìm: AI và " + topic, subagent_type: "search", prompt: full ? `Mục tiêu: thu thập bằng chứng về tác động của AI tới ${topic} (2023–2026). Cần bao quát: việc làm, bản quyền, các công cụ phổ biến. Trả về JSON {findings:[{claim, quote, url, date}]}, tối đa 8 phát hiện, ưu tiên nguồn gốc.` : "Hãy làm phần việc của bạn." } });
        if (par) {
          s.push({
            from: "c", to: "s", kind: "res", label: "4 lệnh Task", key: true, title: "Coordinator giao 4 việc trong cùng một lượt",
            desc: "Trong một câu trả lời, coordinator đưa ra bốn yêu cầu dùng công cụ Task, mỗi yêu cầu cho một khía cạnh. Vì nằm chung một lượt, cả bốn agent con sẽ chạy cùng lúc.",
            payload: { content: [task("nghệ thuật thị giác", "toolu_T1"), task("âm nhạc", "toolu_T2"), task("văn học", "toolu_T3"), task("điện ảnh", "toolu_T4")], stop_reason: "tool_use" },
            hl: ["Task", "subagent_type", "prompt"],
            fields: [["name: \"Task\"", "Giao việc cho agent con cũng chỉ là một lần dùng công cụ. Agent SDK đóng vai backend, chạy công cụ này."], ["input.subagent_type", "Chọn loại agent con nào."], ["input.prompt", "Phiếu giao việc. Đây là <b>tất cả</b> những gì agent con biết khi bắt đầu."]],
            push: [{ r: "assistant", t: "Giao 4 việc (T1 tới T4) trong cùng một lượt" }],
          });
        } else {
          s.push({ from: "c", to: "s", kind: "warn", label: "1 lệnh Task", title: "Coordinator chỉ giao một việc mỗi lượt", desc: "Coordinator giao việc đầu tiên, chờ xong rồi mới giao việc thứ hai, cứ thế tới việc thứ tư.", payload: { content: [task("nghệ thuật thị giác", "toolu_T1")], stop_reason: "tool_use" }, warn: "Bốn việc độc lập mà phải làm lần lượt, nên tổng thời gian bằng tổng của cả bốn, thay vì chỉ bằng việc lâu nhất.", push: [{ r: "assistant", t: "Giao việc T1 (T2, T3, T4 sẽ giao ở các lượt sau)" }] });
        }
        s.push({
          from: "s", to: "s", kind: "internal", title: "Agent SDK tạo một ngữ cảnh mới tinh cho mỗi agent con",
          desc: "Mỗi agent con bắt đầu như một người mới: chỉ có hướng dẫn riêng của nó, bộ công cụ riêng, và phiếu giao việc. Nó không nhìn thấy cuộc trò chuyện của coordinator, cũng không biết các agent con khác đang làm gì.",
          backend: ["Hướng dẫn chung lấy từ mô tả agent search, không phải từ coordinator.", "Công cụ chỉ có tìm kiếm web và đọc trang.", "Cuộc trò chuyện chỉ có đúng một tin nhắn: nội dung phiếu giao việc."],
        });
        s.push({
          from: "s", to: "r", kind: "req", label: "phiếu giao việc", key: true, title: "Đây là tất cả những gì agent con nhìn thấy",
          desc: full ? "Phiếu ghi rõ mục tiêu, phạm vi, mẫu kết quả và giới hạn. Agent con có thể làm việc ngay, không cần đoán." : "Phiếu chỉ có một câu “Hãy làm phần việc của bạn”. Agent con không biết đề tài là gì, phạm vi tới đâu, hay phải trả kết quả theo mẫu nào.",
          payload: { system: "Bạn chuyên tìm kiếm. Trả về JSON {findings:[{claim, quote, url, date}]}.", tools: ["WebSearch", "WebFetch"], messages: [{ role: "user", content: task("âm nhạc", "x").input.prompt }] },
          hl: ["messages"],
          warn: full ? null : "Với phiếu giao việc như thế này, kết quả sẽ lan man hoặc sai khía cạnh.",
        });
        s.push({ from: "r", to: "r", kind: "internal", title: "Agent con tự chạy vòng lặp của riêng nó", desc: "Agent tìm kiếm tự tìm, đọc năm trang, rồi chọn lọc. Quá trình này tạo ra khoảng 30.000 token dữ liệu trung gian, nhưng tất cả chỉ nằm trong ngữ cảnh của agent con. Ngữ cảnh của coordinator không bị đầy thêm." });
        s.push({ from: "r", to: "s", kind: "res", label: "kết quả", key: true, title: "Agent con trả kết quả cuối, kèm thông tin nguồn", desc: "Mỗi phát hiện đều có đường dẫn và ngày, để bước tổng hợp sau này trích dẫn được.", payload: { findings: [{ claim: "Doanh thu nhạc tạo bởi AI tăng mạnh trên các nền tảng nghe nhạc", quote: "...", url: "https://example.org/music-report-2025", date: "2025-09" }, { claim: "Tranh chấp bản quyền giọng hát do AI tạo ra", quote: "...", url: "https://example.org/voice-case", date: "2026-02" }] }, hl: ["url", "date"] });
        s.push({
          from: "s", to: "c", kind: "res", label: "4 kết quả", title: "Coordinator nhận về bốn kết quả cuối",
          desc: "Agent SDK gửi kết quả của từng agent con về cho coordinator, giống như kết quả của một công cụ bình thường. Coordinator chỉ nhận khoảng 2.000 token kết quả gọn, thay vì khoảng 120.000 token dữ liệu trung gian của bốn agent con.",
          payload: { role: "user", content: [{ type: "tool_result", tool_use_id: "toolu_T1", content: "{findings:[...thị giác...]}" }, { type: "tool_result", tool_use_id: "toolu_T2", content: "{findings:[...âm nhạc...]}" }, "...T3, T4..."] },
          push: [{ r: "tool", t: "Kết quả T1 tới T4: các phát hiện kèm đường dẫn và ngày" }],
        });
        s.push({
          from: "c", to: "s", kind: "res", label: "giao tổng hợp", key: true, title: "Coordinator giao việc tổng hợp, kèm toàn bộ dữ liệu",
          desc: "Agent tổng hợp không thấy kết quả của agent tìm kiếm. Vì vậy coordinator phải dán thẳng các phát hiện vào phiếu giao việc, kèm yêu cầu rõ ràng về cách trình bày.",
          payload: { content: [{ type: "tool_use", id: "toolu_S1", name: "Task", input: { subagent_type: "synth", description: "Tổng hợp báo cáo", prompt: "Mục tiêu: báo cáo tác động của AI tới 4 ngành sáng tạo.\nDữ liệu (giữ nguyên đường dẫn và ngày khi trích dẫn):\n<findings area=\"âm nhạc\">[...]</findings>\n<findings area=\"văn học\">[...]</findings>...\nYêu cầu: mỗi nhận định có nguồn; nêu rõ chỗ mâu thuẫn; ghi chú khía cạnh nào thiếu dữ liệu." } }], stop_reason: "tool_use" },
          hl: ["prompt"], warn: "Nếu phiếu chỉ ghi “tổng hợp các phát hiện ở trên”, agent tổng hợp sẽ không có dữ liệu nào, vì nó không thấy “ở trên” là gì.",
          push: [{ r: "assistant", t: "Giao việc tổng hợp, phiếu chứa toàn bộ phát hiện" }],
        });
        s.push({ from: "s", to: "y", kind: "req", label: "phiếu giao việc", title: "Agent tổng hợp bắt đầu với ngữ cảnh mới", desc: "Agent tổng hợp không có công cụ tìm kiếm, nên nó chỉ có thể làm việc với dữ liệu được giao. Nhờ đó nó làm đúng vai trò của mình." });
        s.push({ from: "y", to: "s", kind: "res", label: "báo cáo", title: "Agent tổng hợp trả về báo cáo", desc: "Báo cáo có trích dẫn cho từng nhận định, và một mục ghi chú cho biết khía cạnh nào còn thiếu dữ liệu.", payload: { report_md: "## Âm nhạc\n- ... [nguồn: example.org/music-report-2025, 2025-09]\n## Ghi chú độ bao phủ\n- Điện ảnh: mới có 2 nguồn, cần bổ sung." } });
        s.push({ from: "s", to: "c", kind: "res", label: "báo cáo", title: "Coordinator nhận báo cáo và kết thúc", desc: "Coordinator kiểm tra báo cáo so với yêu cầu ban đầu. Thấy đã đạt, nó kết thúc lượt làm việc.", push: [{ r: "tool", t: "Kết quả S1: báo cáo và ghi chú độ bao phủ" }, { r: "assistant", t: "Tóm tắt cuối <b>(end_turn)</b>" }] });
        s.push({ from: "c", to: "a", kind: "ok", label: "kết quả", key: true, title: "Ứng dụng nhận kết quả cuối cùng", desc: par ? "Giao việc song song giúp toàn bộ quá trình chỉ mất khoảng 48 giây và 4 lượt của coordinator." : "Giao việc lần lượt khiến toàn bộ quá trình mất khoảng 152 giây và 7 lượt của coordinator, gấp ba lần so với giao song song.", payload: { type: "result", subtype: "success", is_error: false, num_turns: par ? 4 : 7, duration_ms: par ? 48210 : 151930, total_cost_usd: 0.41, result: "## Báo cáo..." }, hl: ["num_turns", "duration_ms"] });
        return s;
      },
    }),
  };

  /* ───────── 1-4 Cổng kiểm tra bằng code ───────── */
  W.refundGate = {
    title: "Chặn hoàn tiền trước khi xác minh: dặn trong prompt và kiểm tra bằng code",
    render: trace({
      intro: "Dù đã được dặn “luôn xác minh trước”, đôi khi Claude vẫn đi tắt và gọi lệnh hoàn tiền ngay. Chọn một trong hai cách bảo vệ bên dưới để xem hệ thống phản ứng thế nào.",
      actors: [
        { id: "u", icon: "👤", name: "Khách" },
        { id: "c", icon: "🧠", name: "Claude" },
        { id: "b", icon: "🖥️", name: "Backend", sub: "chạy công cụ" },
        { id: "d", icon: "🗄️", name: "Hệ thống nội bộ" },
      ],
      stateTitle: "Trạng thái phiên do backend ghi nhận",
      controls: [{ id: "m", type: "select", label: "Cách bảo vệ:", value: "gate", options: [["gate", "Kiểm tra bằng code trong backend"], ["prompt", "Chỉ dặn trong system prompt"]] }],
      steps: ({ m }) => {
        const s = [];
        s.push({ from: "u", to: "c", kind: "req", label: "tin nhắn", title: "Khách hối thúc", desc: "Khách viết rất gấp và chưa cung cấp thông tin xác minh nào.", payload: { text: "Hoàn tiền đơn #1234 cho tôi ngay, gấp lắm!" }, state: [{ r: "note", t: "Khách đã được xác minh: <b>chưa</b>" }] });
        s.push({ from: "c", to: "b", kind: "warn", label: "xin hoàn tiền", key: true, title: "Claude bỏ qua bước xác minh", desc: "Bị khách hối thúc, Claude gọi thẳng lệnh hoàn tiền. Điều này hiếm khi xảy ra, nhưng không bao giờ là không thể.", payload: { type: "tool_use", id: "toolu_09", name: "process_refund", input: { order_id: "1234", amount: 89 } } });
        if (m === "prompt") {
          s.push({ from: "b", to: "d", kind: "err", label: "hoàn tiền", title: "Không có gì chặn lại", desc: "Backend thấy yêu cầu đúng định dạng nên chạy luôn. Lời dặn trong prompt không có tác dụng ở bước này.", warn: "Tiền được hoàn cho một người chưa xác minh. Đó có thể là kẻ mạo danh, chỉ biết mỗi mã đơn." });
          s.push({ from: "d", to: "b", kind: "err", label: "đã chuyển tiền", title: "Tiền đã đi, không lấy lại được", desc: "Giao dịch đã hoàn tất, và kiểm toán sẽ phát hiện một lần hoàn tiền không qua bước xác minh.", payload: { refund_id: "R-777", status: "ok" }, push: [{ r: "err", t: "Kiểm toán: R-777 hoàn tiền mà không xác minh" }] });
          s.push({ from: "b", to: "c", kind: "err", label: "kết quả", title: "Bài học", desc: "Dặn trong prompt giúp Claude làm đúng trong <b>phần lớn</b> trường hợp. Với hành động không thể đảo ngược như chuyển tiền hay xóa dữ liệu, “phần lớn” là chưa đủ; cần một bước kiểm tra bằng code." });
          return s;
        }
        s.push({ from: "b", to: "b", kind: "internal", key: true, title: "Backend kiểm tra trạng thái của phiên", desc: "Trước khi chạy lệnh hoàn tiền, backend xem trong bộ nhớ của phiên đã có ghi nhận “khách đã được xác minh” hay chưa. Ghi nhận này do backend tự ghi sau khi tra cứu, không phải do Claude khai báo.", snippet: "if session.verified_customer_id is None:\n    return tool_error(\"precondition_failed\",\n        \"Chưa xác minh khách. Hỏi email đặt hàng rồi gọi get_customer.\")" });
        s.push({ from: "b", to: "c", kind: "err", label: "bị chặn", key: true, title: "Lệnh bị chặn, kèm hướng dẫn cần làm gì", desc: "Backend không gọi hệ thống thanh toán. Nó trả về cho Claude một thông báo lỗi nói rõ vì sao bị chặn và bước tiếp theo cần làm.", payload: { type: "tool_result", tool_use_id: "toolu_09", is_error: true, content: "{\"error\":\"precondition_failed\",\"message\":\"Chưa xác minh khách. Hỏi email đặt hàng rồi gọi get_customer.\"}" }, hl: ["is_error", "message"], note: "Vì thông báo lỗi nói rõ cần làm gì, Claude tự sửa hướng đi, thay vì gọi lại lệnh hoàn tiền một cách vô ích." });
        s.push({ from: "c", to: "u", kind: "res", label: "hỏi email", title: "Claude chuyển sang xác minh", desc: "Claude hỏi khách email đã dùng khi đặt hàng.", payload: { text: "Để bảo vệ tài khoản của bạn, bạn cho mình email đã dùng khi đặt đơn #1234 nhé." } });
        s.push({ from: "u", to: "c", kind: "req", label: "email", title: "Khách cung cấp email", desc: "Khách gửi email.", payload: { text: "lan@example.com" } });
        s.push({ from: "c", to: "b", kind: "res", label: "xin tra khách", key: true, title: "Claude xin tra cứu để xác minh", desc: "Claude gọi công cụ <code>get_customer</code> với mã đơn và email khách vừa cung cấp.", payload: { type: "tool_use", id: "toolu_10", name: "get_customer", input: { order_id: "1234", email: "lan@example.com" } } });
        s.push({ from: "b", to: "d", kind: "req", label: "đối chiếu", title: "Backend đối chiếu với hệ thống khách hàng", desc: "Kiểm tra email này có đúng là của người đặt đơn #1234 không.", payload: { order_id: "1234", email: "lan@example.com" } });
        s.push({ from: "d", to: "b", kind: "res", label: "khớp", title: "Thông tin khớp", desc: "Email khớp với chủ đơn hàng. Khách là C-88.", payload: { match: true, customer_id: "C-88" } });
        s.push({ from: "b", to: "b", kind: "internal", key: true, title: "Backend ghi nhận khách đã được xác minh", desc: "Backend tự ghi vào bộ nhớ của phiên rằng khách C-88 đã được xác minh, dựa trên kết quả từ hệ thống khách hàng. Thông tin này nằm ngoài tầm với của Claude, nên một câu như “tôi đã xác minh rồi” không thể làm giả được.", push: [{ r: "ok", t: "Khách đã được xác minh: <b>C-88</b> (theo hệ thống khách hàng)" }] });
        s.push({ from: "c", to: "b", kind: "res", label: "xin hoàn tiền", title: "Claude gọi lại lệnh hoàn tiền", desc: "Lần này điều kiện đã đủ.", payload: { type: "tool_use", id: "toolu_11", name: "process_refund", input: { order_id: "1234", amount: 89 } } });
        s.push({ from: "b", to: "d", kind: "ok", label: "hoàn tiền", key: true, title: "Kiểm tra đạt, backend cho chạy", desc: "Khách đã được xác minh, số tiền dưới hạn mức, và đơn hàng đúng là của khách C-88. Backend gọi hệ thống thanh toán." });
        s.push({ from: "d", to: "b", kind: "ok", label: "đã hoàn", title: "Hoàn tiền thành công", desc: "Mã giao dịch R-552, có ghi nhận đầy đủ thời điểm xác minh.", payload: { refund_id: "R-552", status: "ok" }, push: [{ r: "ok", t: "Kiểm toán: R-552, xác minh C-88 lúc 10:02" }] });
        s.push({ from: "c", to: "u", kind: "ok", label: "trả lời", title: "Claude báo cho khách", desc: "Khách nhận được câu trả lời, và quy trình xác minh đã được tuân thủ.", payload: { text: "Đã xác minh và hoàn $89 cho đơn #1234 (mã R-552)." } });
        return s;
      },
    }),
  };

  /* ───────── 1-5 Hook PreToolUse / PostToolUse ───────── */
  const HOOK_CFG = `const options = {
  hooks: {
    PreToolUse:  [{ matcher: "mcp__billing__process_refund", hooks: [refundLimit] }],
    PostToolUse: [{ matcher: "mcp__billing__.*",            hooks: [normalizeDates] }],
  },
};

async function refundLimit(input, toolUseID, { signal }) {
  if (input.tool_input.amount > 500) {
    return { hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: "Hoàn trên $500 cần người duyệt. Gọi escalate_to_human.",
    } };
  }
  return {};   // không can thiệp, để công cụ chạy bình thường
}`;
  W.hookPipeline = {
    title: "Hook trong Agent SDK: dữ liệu vào và ra của mỗi hook",
    render: trace({
      intro: "Hook là hàm của bạn, được Agent SDK tự động gọi trước và sau khi một công cụ chạy. Claude không biết hook tồn tại và không thể bỏ qua nó. Thử thay đổi số tiền, định dạng ngày và bật tắt từng hook để xem kết quả khác nhau thế nào.",
      actors: [
        { id: "c", icon: "🧠", name: "Claude", sub: "xin chạy công cụ" },
        { id: "s", icon: "⚙️", name: "Agent SDK", sub: "điều phối" },
        { id: "h", icon: "🪝", name: "Hook của bạn", sub: "trước / sau" },
        { id: "t", icon: "💳", name: "Công cụ hoàn tiền", sub: "máy chủ MCP billing" },
      ],
      stateTitle: "Nhật ký kiểm soát",
      controls: [
        { id: "amt", type: "select", label: "Số tiền:", value: "800", options: [["200", "$200"], ["450", "$450"], ["800", "$800 (vượt hạn mức $500)"]] },
        { id: "fmt", type: "select", label: "Công cụ trả ngày dạng:", value: "unix", options: [["unix", "số giây (Unix)"], ["vn", "ngày/tháng/năm"], ["iso", "chuẩn ISO 8601"]] },
        { id: "pre", type: "toggle", label: "Bật hook trước (PreToolUse)", value: true },
        { id: "post", type: "toggle", label: "Bật hook sau (PostToolUse)", value: true },
      ],
      steps: ({ amt, fmt, pre, post }) => {
        const a = +amt, raw = { unix: 1767225600, vn: "01/01/2026", iso: "2026-01-01T00:00:00Z" }[fmt];
        const s = [];
        const tu = { type: "tool_use", id: "toolu_07", name: "mcp__billing__process_refund", input: { order_id: "1234", amount: a } };
        s.push({ from: "c", to: "s", kind: "res", label: "xin hoàn tiền", title: `Claude xin hoàn $${a}`, desc: "Công cụ hoàn tiền đến từ máy chủ MCP tên billing, nên tên đầy đủ của nó là <code>mcp__billing__process_refund</code>. Hook phải ghi đúng tên này thì mới được gọi.", payload: tu, hl: ["name", "amount"], state: [] });
        s.push({ from: "s", to: "s", kind: "internal", title: "Agent SDK tìm hook phù hợp với công cụ này", desc: pre ? "SDK so tên công cụ với cấu hình hook. Tên khớp với hook <code>refundLimit</code>, nên SDK sẽ gọi hook này trước khi chạy công cụ." : "Hook trước đang bị tắt, nên không có gì kiểm tra trước khi công cụ chạy.", snippet: HOOK_CFG });
        if (pre) {
          s.push({ from: "s", to: "h", kind: "req", label: "dữ liệu cho hook", title: "SDK gửi thông tin cho hook kiểm tra", desc: "Hook nhận được tên công cụ và các tham số Claude định truyền vào, nên có đủ thông tin để quyết định cho chạy hay chặn lại.", payload: { session_id: "sess_42", transcript_path: "/.../sess_42.jsonl", cwd: "/app", hook_event_name: "PreToolUse", tool_name: "mcp__billing__process_refund", tool_input: { order_id: "1234", amount: a } }, hl: ["hook_event_name", "tool_name", "tool_input"], fields: [["hook_event_name", "Thời điểm hook được gọi; ở đây là trước khi chạy công cụ."], ["tool_name", "Tên đầy đủ của công cụ."], ["tool_input", "Tham số Claude định truyền vào. Hook đọc được, có thể chặn, thậm chí sửa lại."], ["transcript_path", "Đường dẫn tới lịch sử phiên, dùng khi hook cần xem lại cuộc trò chuyện."]] });
          if (a > 500) {
            s.push({ from: "h", to: "s", kind: "err", label: "chặn", title: "Hook quyết định chặn", desc: `Số tiền $${a} lớn hơn hạn mức $500, nên hook trả về quyết định “deny” (chặn), kèm lý do.`, payload: { hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: "Hoàn trên $500 cần người duyệt. Gọi escalate_to_human." } }, hl: ["permissionDecision", "permissionDecisionReason"], fields: [["permissionDecision", "Có ba lựa chọn: <code>allow</code> (cho chạy), <code>deny</code> (chặn) và <code>ask</code> (hỏi người dùng)."], ["permissionDecisionReason", "Khi chặn, lý do này được chuyển cho Claude để nó đổi hướng."]], push: [{ r: "err", t: `Hook trước đã chặn lệnh hoàn $${a}` }] });
            s.push({ from: "s", to: "c", kind: "err", label: "bị chặn", title: "Công cụ không chạy; Claude nhận lý do bị chặn", desc: "Lệnh hoàn tiền không hề được gửi tới máy chủ thanh toán. Claude nhận được một kết quả lỗi chứa lý do từ hook.", payload: { type: "tool_result", tool_use_id: "toolu_07", is_error: true, content: "Hoàn trên $500 cần người duyệt. Gọi escalate_to_human." }, hl: ["is_error"] });
            s.push({ from: "c", to: "s", kind: "ok", label: "chuyển duyệt", title: "Claude chuyển sang quy trình duyệt", desc: "Đọc lý do, Claude gọi công cụ chuyển vụ việc cho nhân viên duyệt, kèm đầy đủ thông tin. Chính sách được tuân thủ.", payload: { type: "tool_use", id: "toolu_08", name: "escalate_to_human", input: { customer_id: "C-88", order_id: "1234", amount: a, reason: "Vượt hạn mức tự động $500", recommended_action: "Duyệt hoàn tiền toàn phần" } }, push: [{ r: "ok", t: "Đã tạo yêu cầu duyệt tay" }] });
            return s;
          }
          s.push({ from: "h", to: "s", kind: "ok", label: "cho qua", title: "Hook không phản đối", desc: `$${a} nằm trong hạn mức. Hook trả về một đối tượng rỗng, nghĩa là không can thiệp, và công cụ chạy bình thường.`, payload: {}, push: [{ r: "ok", t: `Hook trước: $${a} trong hạn mức, cho qua` }] });
        } else if (a > 500) {
          s.push({ from: "s", to: "s", kind: "err", title: "Không có hook nào chặn", desc: "Vì hook trước đang tắt, không có bước kiểm tra nào trước khi công cụ chạy.", warn: `Lệnh hoàn $${a} sẽ được thực hiện, dù chính sách yêu cầu phải có người duyệt.`, push: [{ r: "err", t: `Vi phạm: hoàn $${a} không qua duyệt` }] });
        }
        s.push({ from: "s", to: "t", kind: "req", label: "gọi công cụ", title: "SDK gọi công cụ hoàn tiền", desc: "SDK gửi lời gọi tới máy chủ MCP theo chuẩn JSON-RPC.", payload: { jsonrpc: "2.0", id: 31, method: "tools/call", params: { name: "process_refund", arguments: { order_id: "1234", amount: a } } } });
        s.push({ from: "t", to: "s", kind: "res", label: "kết quả", title: "Công cụ trả kết quả với định dạng ngày riêng", desc: fmt === "iso" ? "Ngày đã ở dạng chuẩn ISO 8601, giống các công cụ khác." : `Ngày được trả về dạng “${raw}”, khác với các công cụ khác (đang dùng chuẩn ISO). Claude dễ so sánh nhầm ngày nếu nhận nguyên như vậy.`, payload: { content: [{ type: "text", text: JSON.stringify({ refund_id: "R-9", processed_at: raw }) }] }, hl: ["text"] });
        if (post) {
          s.push({ from: "s", to: "h", kind: "req", label: "dữ liệu cho hook", title: "SDK gọi hook sau, kèm kết quả của công cụ", desc: "Hook sau nhận thêm kết quả công cụ (<code>tool_response</code>), nên có thể sửa lại kết quả trước khi Claude đọc.", payload: { hook_event_name: "PostToolUse", tool_name: "mcp__billing__process_refund", tool_input: { order_id: "1234", amount: a }, tool_response: { refund_id: "R-9", processed_at: raw } }, hl: ["tool_response"] });
          s.push({ from: "h", to: "s", kind: "ok", label: "chuẩn hóa", title: fmt === "iso" ? "Ngày đã chuẩn, không cần sửa" : "Hook đổi ngày về dạng chuẩn", desc: fmt === "iso" ? "Hook không phải làm gì." : `Hook đổi “${raw}” thành “2026-01-01T00:00:00Z” rồi trả kết quả mới cho SDK.`, payload: fmt === "iso" ? {} : { hookSpecificOutput: { hookEventName: "PostToolUse", updatedMCPToolOutput: { refund_id: "R-9", processed_at: "2026-01-01T00:00:00Z" } } }, hl: ["updatedMCPToolOutput"], note: "Trường thay kết quả này chỉ dùng được cho công cụ MCP (hãy đối chiếu với phiên bản SDK bạn dùng). Với công cụ thường, nên chuẩn hóa ngay trong code của công cụ.", push: [{ r: "ok", t: `Hook sau: đổi "${raw}" sang ISO 8601` }] });
        }
        const out = post || fmt === "iso" ? "2026-01-01T00:00:00Z" : raw;
        s.push({ from: "s", to: "c", kind: "res", label: "kết quả", title: "Claude nhận kết quả", desc: out === raw && fmt !== "iso" ? "Claude nhận ngày ở định dạng lạ, và phải tự đoán ý nghĩa của nó." : "Claude nhận ngày ở định dạng chuẩn, giống mọi công cụ khác.", payload: { type: "tool_result", tool_use_id: "toolu_07", content: JSON.stringify({ refund_id: "R-9", processed_at: out }) }, warn: !post && fmt !== "iso" ? "Không có hook chuẩn hóa thì chỉ còn cách dặn Claude “cẩn thận với ngày tháng”, và cách đó chỉ đúng theo xác suất." : null });
        return s;
      },
    }),
  };

  /* ───────── 1-6 Quản lý phiên ───────── */
  W.sessionBranches = {
    title: "Mở lại phiên cũ, tách nhánh, hay mở phiên mới?",
    render(el) {
      const modes = {
        resume: { cmd: "claude --resume auth-investigation", desc: "Tiếp tục đúng cuộc trò chuyện cũ. Phù hợp khi code <b>chưa thay đổi</b> kể từ lần trước.", risk: "Những gì Claude đọc được trước đây vẫn nằm trong ngữ cảnh. Nếu file đã bị sửa nhiều, Claude sẽ suy luận dựa trên phiên bản cũ." },
        fork: { cmd: "query(prompt, { resume: sessionId, forkSession: true })", desc: "Tách thành hai nhánh từ cùng một điểm xuất phát, để thử hai hướng độc lập, ví dụ hướng A dùng Redis, hướng B dùng bộ nhớ trong. Hai nhánh không ảnh hưởng nhau.", risk: "Cả hai nhánh vẫn mang theo những gì phiên gốc đã đọc. Nếu code đã thay đổi thì tách nhánh cũng không giải quyết được chuyện thông tin cũ." },
        fresh: { cmd: "claude    # phiên mới, dán nội dung summary.md", desc: "Bắt đầu sạch, chỉ mang theo bản tóm tắt các phát hiện và danh sách file đã thay đổi. Phù hợp khi code đã đổi nhiều, hoặc phiên cũ đã quá dài.", risk: "Bản tóm tắt cần viết cẩn thận. Thiếu dữ kiện quan trọng thì phải điều tra lại phần đó." },
      };
      let cur = "resume";
      const dot = (x, y, c, t) => `<g><circle cx="${x}" cy="${y}" r="9" fill="${c}"/>${t ? `<text x="${x}" y="${y + 26}" text-anchor="middle" style="font-size:11px">${t}</text>` : ""}</g>`;
      const draw = () => {
        const m = modes[cur];
        const base = [60, 120, 180, 240].map((x, k) => dot(x, 60, "var(--c-violet)", k === 0 ? "phiên gốc" : "")).join("");
        let extra = "";
        if (cur === "resume") extra = `<line x1="240" y1="60" x2="480" y2="60" stroke="var(--c-violet)" stroke-width="3" stroke-dasharray="6 4"><animate attributeName="stroke-dashoffset" from="20" to="0" dur="1s" repeatCount="indefinite"/></line>${dot(320, 60, "var(--warn)", "thông tin cũ")}${dot(400, 60, "var(--c-violet)", "")}${dot(480, 60, "var(--c-violet)", "làm tiếp")}<text x="360" y="22" text-anchor="middle" style="font-size:11.5px;fill:var(--muted)">vẫn là cuộc trò chuyện cũ</text>`;
        if (cur === "fork") extra = `<path d="M240 60 C 290 60, 290 20, 340 20 L 480 20" fill="none" stroke="var(--c-teal)" stroke-width="3"/><path d="M240 60 C 290 60, 290 100, 340 100 L 480 100" fill="none" stroke="var(--c-orange)" stroke-width="3"/>${dot(400, 20, "var(--c-teal)", "")}${dot(480, 20, "var(--c-teal)", "")}<text x="492" y="24" style="font-size:11.5px">A: Redis</text>${dot(400, 100, "var(--c-orange)", "")}${dot(480, 100, "var(--c-orange)", "")}<text x="492" y="104" style="font-size:11.5px">B: bộ nhớ trong</text>`;
        if (cur === "fresh") extra = `<line x1="240" y1="60" x2="290" y2="60" stroke="var(--border)" stroke-width="2"/><text x="268" y="44" text-anchor="middle" style="font-size:15px">✂️</text><rect x="300" y="44" width="96" height="32" rx="8" fill="var(--accent-soft)" stroke="var(--accent)"/><text x="348" y="64" text-anchor="middle" style="font-size:11.5px;font-weight:700">bản tóm tắt</text><line x1="396" y1="60" x2="480" y2="60" stroke="var(--ok)" stroke-width="3"/>${dot(436, 60, "var(--ok)", "")}${dot(480, 60, "var(--ok)", "phiên mới")}`;
        el.innerHTML = `<div class="compare-tabs">${[["resume", "Mở lại phiên cũ"], ["fork", "Tách nhánh"], ["fresh", "Phiên mới + tóm tắt"]].map(([k, l]) => `<button class="${k === cur ? "on" : ""}" data-k="${k}">${l}</button>`).join("")}</div>
          <svg viewBox="0 0 600 130" style="width:100%;max-height:170px;margin:8px 0 14px"><line x1="60" y1="60" x2="240" y2="60" stroke="var(--c-violet)" stroke-width="3"/>${base}${extra}</svg>
          <pre><code>${window.SIM.esc(m.cmd)}</code></pre>
          <div class="callout info" style="margin-top:14px"><b>Khi nào dùng.</b> ${m.desc}</div><div class="callout danger"><b>Cần lưu ý.</b> ${m.risk}</div>`;
        el.querySelectorAll("[data-k]").forEach((b) => (b.onclick = () => { cur = b.dataset.k; draw(); }));
      };
      draw();
    },
  };
})();
