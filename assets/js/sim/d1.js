/* Mô phỏng chi tiết — Chương 1: Agentic Architecture & Orchestration */
(function () {
  const { trace, claude, http, mcp } = window.SIM;
  const W = window.WIDGETS;
  const MODEL = "claude-haiku-5-5";
  const J = (o) => JSON.stringify(o);

  const { chatIn, chatOut, call, callV, ret } = window.SIM.net;

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
  const SYS = "Bạn là agent chăm sóc khách hàng của ShopX. Luôn xác minh khách trước khi làm gì liên quan tới tiền. Trả lời ngắn gọn bằng tiếng Việt.";
  const CAST = {
    u: { id: "u", icon: "👤", name: "Khách hàng", sub: "app chat trên điện thoại", desc: "Chỉ nói chuyện với backend của bạn qua khung chat. Khách không bao giờ gọi thẳng Claude hay hệ thống nội bộ." },
    b: { id: "b", icon: "🖥️", name: "Backend", sub: "chương trình Python của bạn", desc: "Giữ API key, lịch sử trò chuyện và trạng thái phiên. Gọi Claude API, tự chạy công cụ, kiểm tra quy tắc bằng code. Mọi dữ liệu đều đi qua đây." },
    c: { id: "c", icon: "🧠", name: "Claude API", sub: "Messages API của Anthropic", desc: "Model đọc request rồi trả về câu trả lời hoặc yêu cầu chạy công cụ. Không truy cập được hệ thống nội bộ, không nhớ gì giữa các lần gọi." },
    t: { id: "t", icon: "🗄️", name: "Hệ thống nội bộ", sub: "CRM, đơn hàng, thanh toán", desc: "Các API nội bộ của công ty. Chỉ backend gọi được, bằng khóa nội bộ của riêng nó." },
  };
  const LINKS = {
    "u>b": "HTTPS · POST /api/chat (app chat gọi backend)",
    "b>u": "HTTPS · response của /api/chat",
    "b>c": "HTTPS · POST api.anthropic.com/v1/messages",
    "c>b": "HTTPS · response 200 OK",
    "b>t": "HTTP trong mạng nội bộ công ty",
    "t>b": "HTTP trong mạng nội bộ · response",
  };
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
      intro: "Khách nhắn tin xin hoàn tiền. Theo dõi tin nhắn đó đi qua bốn bên: khách, chương trình của bạn (backend), Claude và hệ thống nội bộ của công ty. Điểm quan trọng nhất: Claude không tự chạy công cụ, nó chỉ <b>xin</b> backend chạy giúp; mọi mũi tên đều đi qua backend.",
      actors: [CAST.u, CAST.b, CAST.c, CAST.t],
      links: LINKS,
      stateTitle: "Lịch sử backend giữ",
      code: { title: "Vòng lặp agent viết bằng Python", src: LOOP_CODE },
      controls: [{ id: "v", type: "select", label: "Tình huống:", value: "ok", options: [["ok", "Mọi thứ suôn sẻ"], ["err", "Một công cụ bị lỗi tạm thời"], ["mt", "Câu trả lời bị cắt ngang (max_tokens)"]] }],
      steps: ({ v }) => {
        const s = [];
        const cv = claude({ model: MODEL, max_tokens: 1024, system: SYS, tools: TOOLS });
        const ask = "Tôi muốn hoàn tiền đơn #1234";
        s.push({
          phase: "Khách gửi yêu cầu", from: "u", to: "b", kind: "req", label: "tin nhắn", title: "Khách gửi tin nhắn",
          desc: "Khách gõ “Tôi muốn hoàn tiền đơn #1234”. App chat gửi tin nhắn tới backend của bạn, không đi thẳng tới Claude. Backend là nơi điều phối mọi thứ.",
          ...chatIn(ask),
          fields: [["session_id", "Mã phiên trò chuyện. Backend dùng nó để lấy lại lịch sử và trạng thái của phiên, ví dụ khách đã được xác minh chưa."], ["text", "Nội dung khách gõ. Nó sẽ được thêm vào lịch sử dưới dạng một tin nhắn của người dùng."], ["authorization", "Token đăng nhập của khách với app của bạn. Không liên quan tới API key của Anthropic."]],
          backend: ["Kiểm tra người dùng đã đăng nhập và không gửi quá nhiều tin.", "Lấy lịch sử của phiên; đây là phiên mới nên lịch sử đang trống.", "Thêm tin nhắn của khách vào lịch sử."],
          lines: [1, 3], push: [{ r: "user", t: "“Tôi muốn hoàn tiền đơn #1234”" }],
        });
        cv.user(ask);
        s.push({
          phase: "Lượt 1: hỏi Claude", from: "b", to: "b", kind: "internal", title: "Backend chuẩn bị yêu cầu gửi cho Claude",
          desc: "Mỗi lần hỏi Claude, backend phải gửi đủ bốn thứ: chọn model nào, hướng dẫn chung, danh sách công cụ Claude được dùng, và toàn bộ cuộc trò chuyện tính tới lúc này.",
          backend: ["Chọn model và giới hạn độ dài câu trả lời (<code>max_tokens</code>).", "Gắn hướng dẫn chung (<code>system</code>): vai trò của agent và các quy tắc.", "Gắn danh sách công cụ (<code>tools</code>). Claude chỉ biết về công cụ qua tên, mô tả và danh sách tham số.", "Gắn toàn bộ lịch sử (<code>messages</code>), vì API không nhớ gì giữa các lần gọi."],
          lines: [5, 12],
        });
        s.push({
          from: "b", to: "c", kind: "req", label: "yêu cầu #1", title: "Gửi yêu cầu đầu tiên tới Claude",
          desc: "Đây là nội dung thật được gửi đi qua HTTPS. “Body JSON” là phần dữ liệu; “Gói HTTP đầy đủ” thêm dòng lệnh và các header (trong đó có API key).",
          ...cv.req({ hl: ["tools", "system", "max_tokens"] }),
          fields: [
            ["model", "Model sẽ xử lý yêu cầu. Ở đây dùng Haiku: nhanh, rẻ, đủ tốt cho chăm sóc khách hàng."],
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
          from: "c", to: "c", kind: "internal", title: "Claude suy nghĩ", via: "bên trong Claude API, trước khi trả response",
          desc: "Claude đọc hướng dẫn, danh sách công cụ và tin nhắn của khách. Nó thấy đây là việc liên quan tới tiền, mà hướng dẫn yêu cầu xác minh khách trước, nên nó quyết định cần gọi <code>get_customer</code>. Không có dòng if/else nào viết sẵn quyết định này; Claude tự suy ra.",
          note: "Claude không có quyền truy cập hệ thống khách hàng của bạn. Nó chỉ có thể trả về một yêu cầu kiểu “hãy chạy get_customer với mã đơn 1234 giúp tôi”.",
        });
        if (v === "mt") {
          s.push({
            from: "c", to: "b", kind: "err", label: "bị cắt", title: "Câu trả lời bị cắt ngang",
            desc: "Lần này Claude viết dài quá giới hạn 1024 token và bị cắt giữa chừng. Trường <code>stop_reason</code> là <code>max_tokens</code>. Điều đó có nghĩa là Claude <b>chưa nói xong</b>, không phải đã làm xong.",
            ...cv.res({ content: [{ type: "text", text: "Mình rất tiếc về trải nghiệm của bạn với đơn #1234. Để hỗ trợ hoàn tiền, mình sẽ lần lượt kiểm tra các thông tin sau: trước tiên là xác minh danh tính của bạn, sau đó là tình trạng đơn hàng, ngày giao, phương thức thanh toán, và cuối cùng là đối chiếu với chính sách hoàn tiền hiện hành, trong đó có các quy định về thời hạn, điều kiện sản phẩm và" }], stop_reason: "max_tokens", in: 1187, out: 1024 }, { hl: ["stop_reason"] }),
            warn: "Nếu chương trình dừng lại mỗi khi câu trả lời có chữ, khách sẽ nhận được câu trả lời cụt lủn này.",
          });
          cv.set({ max_tokens: 4096 });
          s.push({
            from: "b", to: "c", kind: "req", label: "gọi lại", title: "Backend tăng giới hạn và hỏi lại",
            desc: "Backend nhận ra câu trả lời bị cắt, nên không lưu nó vào lịch sử. Thay vào đó, backend tăng giới hạn độ dài lên gấp bốn rồi gửi lại đúng cuộc trò chuyện cũ. So với yêu cầu #1, chỉ có <code>max_tokens</code> thay đổi.",
            backend: ["Không thêm câu trả lời bị cắt vào lịch sử.", "Tăng <code>max_tokens</code> từ 1024 lên 4096.", "Ghi nhật ký để sau này chỉnh lại giới hạn cho phù hợp, vì giới hạn quá thấp là lỗi cấu hình."],
            ...cv.req({ hl: ["max_tokens"], since: 1 }),
            lines: [13, 14],
          });
        }
        s.push({
          from: "c", to: "b", kind: "res", label: "xin chạy công cụ", title: "Claude trả lời: vừa có chữ, vừa xin chạy công cụ",
          desc: "Câu trả lời gồm hai khối. Khối đầu là một câu nói với khách. Khối sau là <code>tool_use</code>: yêu cầu chạy công cụ <code>get_customer</code> với mã đơn 1234. Trường <code>stop_reason</code> là <code>tool_use</code>, nghĩa là Claude đang chờ kết quả công cụ để làm tiếp.",
          ...cv.res({ content: [{ type: "text", text: "Mình kiểm tra thông tin của bạn trước nhé." }, { type: "tool_use", id: "toolu_01A", name: "get_customer", input: { order_id: "1234" } }], stop_reason: "tool_use", in: 1187, out: 64 }, { hl: ["stop_reason", "tool_use", "input"] }),
          fields: [
            ["content", "Danh sách các khối trong câu trả lời. Một câu trả lời có thể chứa cả chữ lẫn yêu cầu chạy công cụ. Vì khối đầu có thể là <code>thinking</code>, luôn lọc theo <code>type</code>, đừng lấy phần tử đầu tiên."],
            ["thinking, signature", "Model mới bật suy nghĩ thích ứng theo mặc định. Nội dung suy nghĩ không được trả về (<code>thinking</code> rỗng), chỉ có chữ ký <code>signature</code>. Khi gửi kết quả công cụ, phải gửi lại nguyên khối này, không sửa, không xóa."],
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
          phase: "Chạy công cụ get_customer", from: "b", to: "b", kind: "internal", title: "Backend đọc stop_reason và chuẩn bị chạy công cụ",
          desc: "Vì <code>stop_reason</code> là <code>tool_use</code>, backend biết phải chạy công cụ. Trước khi chạy, nó lưu nguyên văn câu trả lời của Claude vào lịch sử, rồi kiểm tra yêu cầu có hợp lệ không.",
          backend: ["Lưu nguyên văn câu trả lời của Claude vào lịch sử, kể cả khối thinking và tool_use.", "Tìm hàm xử lý tương ứng với tên công cụ. Nếu không có công cụ nào tên như vậy, trả về lỗi thay vì làm sập chương trình.", "Kiểm tra tham số: mã đơn có đúng định dạng không, phiên này có được phép tra cứu không.", "Đổi lời gọi công cụ thành request tới hệ thống thật: <code>get_customer</code> ứng với API của CRM."],
          lines: [15, 26], push: [{ r: "assistant", t: "Câu nói + yêu cầu chạy <b>get_customer</b> (mã toolu_01A)" }],
        });
        s.push({ from: "b", to: "t", kind: "req", label: "tra khách", title: "Backend gọi hệ thống khách hàng thật", desc: "Đây mới là lúc công cụ thực sự chạy. Backend gọi API của CRM bằng địa chỉ và khóa nội bộ của riêng nó. Claude không hề biết những thông tin này.", ...callV("GET", "http://crm.internal/customers?order_id=1234"), lines: [26, 26] });
        const raw = { customer_id: "C-88", name: "Trần Lan", email: "lan@example.com", phone: "0901234567", tier: "gold", email_verified: true, internal_notes: "Từng khiếu nại giao chậm (03/2026)", marketing_flags: ["newsletter", "sms_opt_in"], created_at: 1704067200 };
        s.push({ from: "t", to: "b", kind: "res", label: "hồ sơ khách", title: "Hệ thống khách hàng trả về hồ sơ", desc: "Kết quả thô có nhiều trường không cần cho việc hoàn tiền, như ghi chú nội bộ hay cờ tiếp thị. Nên lọc bớt trước khi đưa cho Claude, để tiết kiệm token, tránh gây nhiễu và không lộ dữ liệu không cần thiết.", ...ret(raw), hl: [] });
        const r1 = { role: "user", content: [{ type: "tool_result", tool_use_id: "toolu_01A", content: J({ customer_id: "C-88", name: "Trần Lan", tier: "gold" }) }] };
        cv.push(r1);
        s.push({
          from: "b", to: "b", kind: "internal", title: "Đóng gói kết quả và thêm vào lịch sử", via: "chưa gửi gì: backend thêm một tin nhắn vào cuối lịch sử",
          desc: "Backend chỉ giữ ba trường cần thiết, đặt vào một khối <code>tool_result</code> mang đúng mã <code>toolu_01A</code>, rồi thêm vào lịch sử. Khối này được gửi dưới vai trò người dùng (<code>user</code>), ngay sau câu trả lời có yêu cầu của Claude.",
          payload: r1, payloadTitle: "Tin nhắn vừa thêm vào cuối lịch sử", hl: ["tool_use_id"], pnote: "Toàn bộ tin nhắn mới. Nó sẽ được gửi ở bước sau, cùng với cả lịch sử trước đó.",
          backend: ["Lọc lại, chỉ giữ mã khách, tên và hạng thành viên.", "Ghi nhận ở phía server rằng khách C-88 đã được xác minh, để bước hoàn tiền sau đó kiểm tra.", "Tạo khối <code>tool_result</code> với <code>tool_use_id</code> trùng mã yêu cầu.", "Thêm khối đó vào lịch sử."],
          lines: [27, 33], push: [{ r: "tool", t: "Kết quả cho toolu_01A: C-88, Trần Lan, hạng gold" }],
        });
        s.push({
          phase: "Lượt 2: gửi kết quả cho Claude", from: "b", to: "c", kind: "req", label: "yêu cầu #2", title: "Gửi lại toàn bộ cuộc trò chuyện",
          desc: "Lần gọi thứ hai không chỉ gửi kết quả mới. Backend gửi lại tất cả: tin nhắn của khách, câu trả lời trước của Claude và kết quả công cụ, cùng system và tools như lần đầu. Claude cần thấy đủ để biết bước tiếp theo.",
          ...cv.req({ hl: ["tool_result", "tool_use_id"] }),
          note: "Vì phải gửi lại mọi thứ ở mỗi lượt, cuộc trò chuyện càng dài thì mỗi lần gọi càng tốn. Đó là lý do nên lọc gọn kết quả công cụ và dùng prompt caching.",
          lines: [6, 12],
        });
        s.push({
          from: "c", to: "b", kind: "res", label: "xin chạy 2 công cụ", title: "Claude xin chạy hai công cụ cùng lúc",
          desc: "Tra đơn hàng và tra chính sách hoàn tiền là hai việc độc lập, nên Claude xin chạy cả hai trong cùng một câu trả lời. Mỗi yêu cầu có mã riêng: <code>toolu_02B</code> và <code>toolu_02C</code>.",
          ...cv.res({ content: [{ type: "tool_use", id: "toolu_02B", name: "lookup_order", input: { order_id: "1234" } }, { type: "tool_use", id: "toolu_02C", name: "get_refund_policy", input: {} }], stop_reason: "tool_use", in: 1342, out: 71 }, { hl: ["toolu_02B", "toolu_02C", "stop_reason"] }),
          lines: [21, 25], push: [{ r: "assistant", t: "Xin chạy 2 công cụ: <b>lookup_order</b> và <b>get_refund_policy</b>" }],
        });
        s.push({
          phase: "Chạy hai công cụ", from: "b", to: "t", kind: "req", label: "2 request cùng lúc", title: "Backend chạy hai công cụ",
          desc: "Mỗi công cụ ứng với một API nội bộ, nên backend gửi hai request HTTP riêng. Chạy lần lượt hay song song đều được, miễn là cuối cùng có kết quả cho <b>cả hai</b> yêu cầu.",
          views: [{ t: "2 request HTTP", parts: [call("GET", "http://orders.internal/orders/1234"), call("GET", "http://policy.internal/refund-policy")], note: "Toàn bộ hai request, gửi song song. Lệnh GET không có body." }],
          lines: [23, 26],
        });
        const order = { order_id: "1234", amount: 89, currency: "USD", status: "delivered", days_since_delivery: 12 };
        const policy = { max_days: 30, auto_limit_usd: 500 };
        if (v === "err") {
          s.push({
            from: "t", to: "b", kind: "err", label: "1 lỗi", title: "Tra đơn thành công, nhưng dịch vụ chính sách bị quá tải",
            desc: "Dịch vụ chính sách không phản hồi sau 5 giây, nên cổng mạng nội bộ trả lỗi 503. Đây là lỗi tạm thời: thử lại sau một chút có thể sẽ được.",
            views: [{ t: "2 response HTTP", parts: [{ t: "Trả lời cho GET /orders/1234", d: http.res("200 OK", {}, order) }, { t: "Trả lời cho GET /refund-policy", d: http.res("503 Service Unavailable", { "retry-after": "2" }, { error: "upstream_timeout", detail: "policy-service không phản hồi sau 5 giây" }) }], note: "Toàn bộ hai response." }],
          });
          cv.push({ role: "user", content: [{ type: "tool_result", tool_use_id: "toolu_02B", content: J(order) }, { type: "tool_result", tool_use_id: "toolu_02C", is_error: true, content: J({ errorCategory: "transient", isRetryable: true, message: "Dịch vụ chính sách không phản hồi sau 5 giây" }) }] });
          s.push({
            phase: "Lượt 3: báo lỗi và thử lại", from: "b", to: "c", kind: "req", label: "yêu cầu #3", title: "Báo lỗi cho Claude một cách rõ ràng",
            desc: "Backend vẫn gửi kết quả cho cả hai yêu cầu, trong cùng một tin nhắn. Kết quả của công cụ bị lỗi được đánh dấu <code>is_error: true</code>, kèm mô tả: đây là lỗi tạm thời và có thể thử lại.",
            ...cv.req({ hl: ["is_error"] }),
            fields: [["is_error", "Báo cho Claude biết công cụ này đã thất bại. Claude sẽ tự quyết thử lại, đổi cách khác, hay báo cho khách."], ["errorCategory", "Loại lỗi. Lỗi tạm thời (transient) thì thử lại có thể được."], ["isRetryable", "Gợi ý có nên thử lại hay không."]],
            warn: "Nếu bỏ qua kết quả của toolu_02C, API sẽ từ chối yêu cầu vì có một yêu cầu chạy công cụ chưa được trả lời.",
            push: [{ r: "tool", t: "toolu_02B: đơn $89, giao cách đây 12 ngày" }, { r: "err", t: "toolu_02C: lỗi tạm thời, có thể thử lại" }],
          });
          s.push({ from: "c", to: "b", kind: "res", label: "thử lại", title: "Claude tự thử lại công cụ bị lỗi", desc: "Nhờ biết đây là lỗi tạm thời, Claude gọi lại <code>get_refund_policy</code>. Nếu đó là lỗi vi phạm chính sách, Claude sẽ giải thích cho khách thay vì thử lại.", ...cv.res({ content: [{ type: "tool_use", id: "toolu_03R", name: "get_refund_policy", input: {} }], stop_reason: "tool_use", in: 1475, out: 38 }, { hl: ["toolu_03R"] }), push: [{ r: "assistant", t: "Xin chạy lại <b>get_refund_policy</b>" }] });
          s.push({ from: "b", to: "t", kind: "req", label: "gọi lại", title: "Backend gọi lại dịch vụ chính sách", desc: "Cùng một request như lần trước, gửi lại sau khi chờ 2 giây theo gợi ý <code>retry-after</code>.", ...callV("GET", "http://policy.internal/refund-policy") });
          s.push({ from: "t", to: "b", kind: "res", label: "chính sách", title: "Lần này dịch vụ chính sách trả lời bình thường", desc: "Chính sách cho phép hoàn tiền trong 30 ngày, và tự động duyệt nếu số tiền không quá $500.", ...ret(policy) });
          cv.push({ role: "user", content: [{ type: "tool_result", tool_use_id: "toolu_03R", content: J(policy) }] });
          s.push({ from: "b", to: "c", kind: "req", label: "yêu cầu #4", title: "Gửi kết quả mới cho Claude", desc: "Lại gửi toàn bộ cuộc trò chuyện, thêm kết quả của lần thử lại ở cuối.", ...cv.req({ hl: ["toolu_03R"] }), push: [{ r: "tool", t: "toolu_03R: hạn 30 ngày, hạn mức $500" }] });
        } else {
          s.push({
            from: "t", to: "b", kind: "res", label: "2 kết quả", title: "Cả hai công cụ trả kết quả",
            desc: "Đơn #1234 trị giá $89, đã giao cách đây 12 ngày. Chính sách cho phép hoàn trong 30 ngày, tự động duyệt nếu không quá $500.",
            views: [{ t: "2 response HTTP", parts: [{ t: "Trả lời cho GET /orders/1234", d: http.res("200 OK", {}, order) }, { t: "Trả lời cho GET /refund-policy", d: http.res("200 OK", {}, policy) }], note: "Toàn bộ hai response." }],
          });
          cv.push({ role: "user", content: [{ type: "tool_result", tool_use_id: "toolu_02B", content: J(order) }, { type: "tool_result", tool_use_id: "toolu_02C", content: J(policy) }] });
          s.push({
            phase: "Lượt 3: gửi hai kết quả", from: "b", to: "c", kind: "req", label: "yêu cầu #3", title: "Hai kết quả gửi chung một tin nhắn",
            desc: "Hai kết quả được gói chung trong <b>một</b> tin nhắn, mỗi kết quả mang đúng mã yêu cầu của nó. Phần còn lại của yêu cầu giống lần trước, chỉ dài thêm.",
            ...cv.req({ hl: ["tool_use_id"] }),
            warn: "Tách thành hai tin nhắn riêng là lỗi hay gặp. Mọi kết quả của cùng một lượt phải nằm chung một tin nhắn.",
            lines: [33, 33], push: [{ r: "tool", t: "toolu_02B: đơn $89 · toolu_02C: hạn 30 ngày" }],
          });
        }
        s.push({ from: "c", to: "b", kind: "res", label: "xin hoàn tiền", title: "Claude xin hoàn tiền", desc: "Khách đã được xác minh, đơn còn trong hạn và số tiền nằm dưới hạn mức. Claude xin chạy <code>process_refund</code> với số tiền $89.", ...cv.res({ content: [{ type: "tool_use", id: "toolu_04D", name: "process_refund", input: { order_id: "1234", amount: 89 } }], stop_reason: "tool_use", in: v === "err" ? 1540 : 1468, out: 52 }, { hl: ["process_refund", "amount"] }), push: [{ r: "assistant", t: "Xin chạy <b>process_refund</b> với $89" }] });
        s.push({
          phase: "Hoàn tiền", from: "b", to: "t", kind: "req", label: "hoàn tiền", title: "Backend tự kiểm tra lần cuối rồi mới hoàn tiền",
          desc: "Backend không làm theo Claude một cách mù quáng. Trước khi gọi hệ thống thanh toán, nó tự kiểm tra lại các điều kiện bằng code (tab “Bên nhận xử lý ra sao”). Đạt hết, nó mới gửi request này.",
          ...callV("POST", "http://billing.internal/refunds", { order_id: "1234", customer_id: "C-88", amount: 89, currency: "USD", reason: "customer_request" }, { "idempotency-key": "refund-sess_42-toolu_04D" }),
          fields: [["idempotency-key", "Khóa chống trùng. Nếu mạng lỗi và backend phải gửi lại, hệ thống thanh toán nhận ra request cũ và không hoàn tiền lần hai."], ["customer_id", "Lấy từ trạng thái phiên mà backend tự ghi khi xác minh, không lấy từ lời Claude."]],
          backend: ["Khách đã được xác minh chưa? Có, vì chính backend đã ghi nhận C-88 ở bước trước, không dựa vào lời Claude.", "Số tiền $89 có dưới hạn mức $500 không? Có.", "Đơn có còn trong hạn 30 ngày không? Còn, mới 12 ngày.", "Gọi hệ thống thanh toán kèm một khóa chống trùng, để nếu phải gửi lại thì khách cũng không bị hoàn tiền hai lần."],
          snippet: "def run_tool(sid, name, inp):\n    if name == \"process_refund\":\n        if not session[sid].verified_customer_id:\n            return Err(\"permission\", \"Chưa xác minh khách\")\n        if inp[\"amount\"] > POLICY.auto_limit:\n            return Err(\"business\", \"Vượt hạn mức, cần người duyệt\")\n    return HANDLERS[name](**inp)",
          lines: [26, 26],
        });
        const done = { refund_id: "R-551", status: "ok", eta_days: "3-5" };
        s.push({ from: "t", to: "b", kind: "res", label: "đã hoàn", title: "Hệ thống thanh toán xác nhận", desc: "Hoàn tiền thành công với mã R-551. Tiền sẽ về tài khoản của khách trong 3 đến 5 ngày.", ...ret(done, "201 Created") });
        cv.push({ role: "user", content: [{ type: "tool_result", tool_use_id: "toolu_04D", content: J(done) }] });
        s.push({ phase: "Trả lời khách", from: "b", to: "c", kind: "req", label: "yêu cầu cuối", title: "Gửi kết quả hoàn tiền cho Claude", desc: "Backend lại gửi cả cuộc trò chuyện, lần này có thêm kết quả hoàn tiền ở cuối.", ...cv.req({ hl: ["toolu_04D"] }), push: [{ r: "tool", t: "toolu_04D: hoàn tiền thành công, mã R-551" }] });
        const final = "Đã hoàn $89 cho đơn #1234 (mã R-551). Tiền sẽ về thẻ của bạn trong 3 đến 5 ngày làm việc.";
        s.push({
          from: "c", to: "b", kind: "ok", label: "xong", title: "Claude trả lời: stop_reason = \"end_turn\"",
          desc: "Lần này câu trả lời chỉ có chữ, và <code>stop_reason</code> là <code>end_turn</code>. Đây là tín hiệu Claude đã làm xong. Backend thoát khỏi vòng lặp.",
          ...cv.res({ content: [{ type: "text", text: final }], stop_reason: "end_turn", in: v === "err" ? 1633 : 1561, out: 41 }, { hl: ["end_turn"] }),
          lines: [17, 19], push: [{ r: "assistant", t: "“Đã hoàn $89… mã R-551” <b>(end_turn)</b>" }],
        });
        s.push({ from: "b", to: "u", kind: "ok", label: "trả lời", title: "Backend gửi câu trả lời cho khách", desc: "Khách chỉ thấy câu trả lời bằng chữ. Những khối yêu cầu và kết quả công cụ là chuyện nội bộ giữa backend và Claude.", ...chatOut(final), backend: ["Lưu lịch sử để lần sau khách nhắn tiếp thì vẫn nối được.", "Chỉ gửi phần chữ cho khách.", "Ghi nhật ký kiểm toán: ai được hoàn, bao nhiêu, mã giao dịch nào."], lines: [18, 19] });
        return s;
      },
    }),
  };

  /* ───────── 1-3 Coordinator giao việc qua công cụ Agent (tên cũ: Task) ───────── */
  const { sdkConv, handback, result: resultMsg, RESULT_NOTE, tools: ccTools, tool: defTool } = window.SIM.cc;
  W.subagentTrace = {
    title: "Coordinator giao việc cho agent con: ai nhìn thấy gì?",
    render: trace({
      intro: "Hãy để ý tab “Coordinator đang biết gì”. Mỗi agent là một <b>cuộc hội thoại riêng</b> với Claude API; Agent SDK chạy trong ứng dụng của bạn và chuyển dữ liệu giữa chúng. Coordinator chỉ nhận lại <b>kết quả cuối</b> của từng agent con, không thấy các bước trung gian. Ví dụ dùng hai khía cạnh để hiện trọn mọi request và response. Công cụ giao việc tên là <code>Agent</code>; tên cũ <code>Task</code> vẫn xuất hiện trong đề thi.",
      actors: [
        { id: "a", icon: "🖥️", name: "Ứng dụng của bạn", sub: "gọi query() một lần", desc: "Chương trình của bạn. Gọi hàm <code>query()</code> của Agent SDK rồi chờ kết quả cuối." },
        { id: "s", icon: "⚙️", name: "Agent SDK", sub: "thư viện trong ứng dụng", desc: "Chạy vòng lặp agent thay bạn: gửi request tới Claude API, chạy công cụ (kể cả Agent), và mở một cuộc hội thoại mới cho mỗi agent con. Mọi mũi tên đều đi qua đây." },
        { id: "c", icon: "🧭", name: "Coordinator", sub: "Claude · hội thoại chính", desc: "Cuộc hội thoại chính với Claude API. Nó thấy đề tài, mô tả các agent con và kết quả cuối của chúng, không thấy gì khác." },
        { id: "r", icon: "🔎", name: "Agent tìm kiếm", sub: "Claude · hội thoại riêng", desc: "Một cuộc hội thoại riêng với Claude API. Chỉ có hướng dẫn của nó, công cụ tìm kiếm và phiếu giao việc." },
        { id: "y", icon: "📝", name: "Agent tổng hợp", sub: "Claude · hội thoại riêng", desc: "Một cuộc hội thoại riêng khác. Không có công cụ tìm kiếm, chỉ làm việc với dữ liệu được dán vào phiếu giao việc." },
      ],
      links: {
        "a>s": "gọi hàm query() trong cùng chương trình",
        "s>a": "query() trả về message cuối (type: result)",
        "s>c": "HTTPS · POST /v1/messages (hội thoại của coordinator)",
        "c>s": "HTTPS · luồng SSE của response",
        "s>r": "HTTPS · POST /v1/messages (hội thoại riêng của agent tìm kiếm)",
        "r>s": "HTTPS · luồng SSE của response",
        "s>y": "HTTPS · POST /v1/messages (hội thoại riêng của agent tổng hợp)",
        "y>s": "HTTPS · luồng SSE của response",
      },
      stateTitle: "Coordinator đang biết gì",
      controls: [
        { id: "par", type: "toggle", label: "Giao cả 2 việc trong <b>cùng một</b> lượt", value: true },
        { id: "full", type: "toggle", label: "Phiếu giao việc ghi đầy đủ thông tin", value: true },
      ],
      steps: ({ par, full }) => {
        const s = [];
        const TOPIC = "Nghiên cứu tác động của AI tới âm nhạc và văn học. Báo cáo có trích nguồn.";
        const COORD = "Bạn là coordinator nghiên cứu. Chia đề tài bao quát đủ các khía cạnh, giao cho agent con, tổng hợp và ghi chú độ bao phủ.";
        const SEARCH = "Bạn chuyên tìm kiếm. Trả về JSON {findings:[{claim, quote, url, date}]}.";
        const SYNTH = "Viết báo cáo, giữ nguyên trích dẫn, nêu rõ chỗ mâu thuẫn.";
        const DESC_S = "Tìm và đọc nguồn trên web cho MỘT khía cạnh của đề tài.";
        const DESC_Y = "Tổng hợp các phát hiện đã có thành báo cáo. Không tìm kiếm thêm.";
        const AGENT_LINES = `- search: ${DESC_S} (Tools: WebFetch, WebSearch)\n- synth: ${DESC_Y} (Tools: không có)\n- general-purpose: Việc nhiều bước, tìm kiếm và thực thi. (Tools: *)\n- Explore: Agent chỉ đọc, chuyên khảo sát codebase. (Tools: mọi công cụ trừ Agent, ExitPlanMode, Edit, Write, NotebookEdit)\n- Plan: Thiết kế kế hoạch triển khai. (Tools: mọi công cụ trừ Agent, ExitPlanMode, Edit, Write, NotebookEdit)`;
        const cv = sdkConv(COORD, { tools: ccTools("Agent", "WebFetch", "WebSearch"), tag: "C", agents: AGENT_LINES });
        s.push({
          phase: "Khởi động", from: "a", to: "s", kind: "req", label: "query()", title: "Ứng dụng gọi query(): giao đề tài và khai báo các agent con",
          desc: "Ứng dụng giao đề tài, đồng thời khai báo hai loại agent con có thể dùng: <b>search</b> để tìm kiếm và <b>synth</b> để tổng hợp.",
          payload: { prompt: TOPIC, options: { model: "claude-opus-5-5", systemPrompt: COORD, tools: ["Agent", "WebFetch", "WebSearch"], allowedTools: ["Agent", "WebFetch", "WebSearch"], agents: { search: { description: DESC_S, prompt: SEARCH, tools: ["WebSearch", "WebFetch"], model: "haiku" }, synth: { description: DESC_Y, prompt: SYNTH, tools: [] } } } },
          pnote: "Toàn bộ tham số truyền vào <code>query()</code> (viết theo thư viện TypeScript; bản Python dùng tên <code>system_prompt</code>, <code>allowed_tools</code>).",
          hl: ["allowedTools", "agents", "description", "tools"],
          fields: [["tools", "Danh sách công cụ có trong phiên. Chỉ công cụ nằm ở đây mới được gửi cho Claude; agent con cũng chỉ lấy được từ danh sách này."], ["allowedTools: [\"Agent\"]", "Danh sách công cụ được tự duyệt, không phải xin phép. Đề thi (viết theo tên cũ) yêu cầu <code>allowedTools</code> phải có <code>\"Task\"</code> thì coordinator mới giao được việc. Trên bản hiện tại, công cụ Agent vốn không cần xin phép; muốn cấm thật sự, hãy bỏ nó khỏi <code>tools</code> hoặc thêm vào <code>disallowedTools</code>."], ["agents.*.description", "Mô tả từng agent con. Coordinator đọc mô tả này để quyết định giao việc cho ai."], ["agents.*.tools", "Công cụ của từng agent con. Agent tổng hợp không có công cụ tìm kiếm, nên không thể tự đi tìm thêm."], ["agents.*.model", "Có thể dùng model nhỏ, rẻ hơn cho agent con làm việc đơn giản. Bỏ trống thì Claude Code tự chọn theo thứ tự ưu tiên của nó, thường là model của phiên chính."]],
        });
        cv.user(TOPIC);
        s.push({
          from: "s", to: "c", kind: "req", label: "request #1", title: "Agent SDK gửi request đầu tiên của coordinator",
          desc: "SDK biến tham số thành một request Claude API. Danh sách các agent con nằm trong tin nhắn <code>system</code> ngay sau đề tài; đó là cách coordinator biết có những ai để giao việc.",
          ...cv.req({ hl: ["Available agent types", "name\": \"Agent"] }),
          push: [{ r: "sys", t: "Hướng dẫn coordinator + danh sách agent con (search, synth)" }, { r: "user", t: "Đề tài: tác động của AI tới âm nhạc và văn học" }],
        });
        s.push({ from: "c", to: "c", kind: "internal", via: "bên trong Claude API, trước khi trả response", title: "Coordinator chia đề tài thành các phần", desc: "Coordinator chia thành hai khía cạnh: âm nhạc và văn học. Đây là bước dễ sai nhất: nếu chia thiếu khía cạnh nào, báo cáo cuối sẽ thiếu phần đó, dù các agent con làm tốt tới đâu.", note: "Kiểm tra xem danh sách khía cạnh đã đủ chưa ở ngay bước này rẻ hơn nhiều so với phát hiện thiếu ở báo cáo cuối." });
        const AREAS = [["âm nhạc", "toolu_T1", "a5c2067e8771c187f"], ["văn học", "toolu_T2", "b71d03c9e2f4a1680"]];
        const brief = (topic) => (full ? `Mục tiêu: thu thập bằng chứng về tác động của AI tới ${topic} (2023–2026). Cần bao quát: việc làm, bản quyền, các công cụ phổ biến. Trả về JSON {findings:[{claim, quote, url, date}]}, tối đa 8 phát hiện, ưu tiên nguồn gốc.` : "Hãy làm phần việc của bạn.");
        const task = ([topic, id]) => ({ type: "tool_use", id, name: "Agent", input: { description: "Tìm: AI và " + topic, prompt: brief(topic), subagent_type: "search", run_in_background: false } });
        const FIND = {
          "âm nhạc": [{ claim: "Doanh thu nhạc tạo bởi AI tăng mạnh trên các nền tảng nghe nhạc", quote: "Số bài hát có dùng AI tăng gấp ba trong năm 2025", url: "https://example.org/music-report-2025", date: "2025-09" }, { claim: "Tranh chấp bản quyền giọng hát do AI tạo ra", quote: "Tòa yêu cầu gỡ bài hát giả giọng ca sĩ", url: "https://example.org/voice-case", date: "2026-02" }],
          "văn học": [{ claim: "Nhà xuất bản yêu cầu tác giả khai báo việc dùng AI", quote: "Hợp đồng mới có điều khoản công bố AI", url: "https://example.org/publishing-policy", date: "2026-01" }],
        };
        const LINKS_ = { "âm nhạc": [{ title: "Báo cáo thị trường nhạc 2025", url: "https://example.org/music-report-2025" }, { title: "Vụ kiện giọng hát AI", url: "https://example.org/voice-case" }], "văn học": [{ title: "Chính sách xuất bản mới", url: "https://example.org/publishing-policy" }] };
        const first = par ? AREAS : AREAS.slice(0, 1);
        s.push({
          phase: "Giao việc tìm kiếm", from: "c", to: "s", kind: par ? "res" : "warn", label: par ? "2 lệnh Agent" : "1 lệnh Agent",
          title: par ? "Coordinator giao 2 việc trong cùng một lượt" : "Coordinator chỉ giao một việc mỗi lượt",
          desc: par ? "Trong một câu trả lời, coordinator đưa ra hai yêu cầu dùng công cụ Agent, mỗi yêu cầu cho một khía cạnh. Vì nằm chung một lượt, SDK chạy cả hai agent con cùng lúc." : "Coordinator giao việc đầu tiên, chờ xong rồi mới giao việc thứ hai.",
          ...cv.res({ content: first.map(task), stop_reason: "tool_use", in: 1260, out: par ? 310 : 160 }, { hl: ["Agent", "subagent_type", "prompt"] }),
          fields: [["name: \"Agent\"", "Giao việc cho agent con cũng chỉ là một lần dùng công cụ. Agent SDK đóng vai backend, chạy công cụ này. Trước Claude Code v2.1.63 công cụ này tên là <code>Task</code>."], ["input.subagent_type", "Chọn loại agent con nào."], ["input.prompt", "Phiếu giao việc. Đây là <b>tất cả</b> những gì agent con nhận từ coordinator."], ["input.run_in_background", "Đặt <code>false</code> để chờ agent con xong rồi nhận kết quả ngay trong <code>tool_result</code>. Mặc định agent con chạy nền: <code>tool_result</code> chỉ báo đã khởi chạy (<code>status: \"async_launched\"</code>), báo cáo về ở lượt sau."]],
          warn: par ? null : "Hai việc độc lập mà phải làm lần lượt, nên tổng thời gian bằng tổng của cả hai, thay vì chỉ bằng việc lâu nhất.",
          push: [{ r: "assistant", t: par ? "Giao 2 việc (T1, T2) trong cùng một lượt" : "Giao việc T1 (T2 sẽ giao ở lượt sau)" }],
        });
        s.push({
          from: "s", to: "s", kind: "internal", title: "Agent SDK mở một cuộc hội thoại mới tinh cho mỗi agent con", via: "bên trong ứng dụng: SDK dựng request mới, không chép lịch sử của coordinator",
          desc: "Mỗi agent con bắt đầu như một người mới: có hướng dẫn riêng, bộ công cụ riêng, và phiếu giao việc. Nó không nhìn thấy cuộc trò chuyện của coordinator, cũng không biết các agent con khác đang làm gì.",
          backend: ["Hướng dẫn chung lấy từ khai báo agent <b>search</b>, không phải từ coordinator.", "Công cụ chỉ có tìm kiếm web và đọc trang.", "Tin nhắn của người dùng chỉ có đúng một nội dung: phiếu giao việc.", "Model là <code>haiku</code> như đã khai báo. Nếu dự án có CLAUDE.md, agent con vẫn nạp file đó."],
        });
        // Toàn bộ vòng làm việc của một agent con: request, xin tìm kiếm, kết quả tìm kiếm, request, trả lời
        const runSearch = ([topic, id, agentId], label) => {
          const rc = sdkConv(SEARCH, { model: "claude-haiku-5-5", tools: ccTools("WebFetch", "WebSearch"), tag: "R" + label, agents: "- general-purpose: Việc nhiều bước, tìm kiếm và thực thi. (Tools: *)" });
          rc.user(brief(topic));
          s.push({
            from: "s", to: "r", kind: "req", label: "phiếu giao việc", title: `Agent ${label}: đây là tất cả những gì agent con nhận từ coordinator`,
            desc: (full ? "Phiếu ghi rõ mục tiêu, phạm vi, mẫu kết quả và giới hạn. Agent con có thể làm việc ngay, không cần đoán." : "Phiếu chỉ có một câu “Hãy làm phần việc của bạn”. Agent con không biết đề tài là gì, phạm vi tới đâu, hay phải trả kết quả theo mẫu nào."),
            ...rc.req({ hl: ["content"] }),
            warn: full ? null : "Với phiếu giao việc như thế này, kết quả sẽ lan man hoặc sai khía cạnh.",
          });
          const q = `AI ${topic} impact 2023..2026`;
          s.push({ from: "r", to: "s", kind: "res", label: "WebSearch", title: `Agent ${label} xin tìm kiếm trên web`, desc: "Agent con xin dùng WebSearch. Đây là vòng lặp agent của riêng nó, y hệt vòng lặp ở mục 1-1.", ...rc.res({ content: [{ type: "tool_use", id: "toolu_S" + label, name: "WebSearch", input: { query: q } }], stop_reason: "tool_use", in: 980, out: 42 }, { hl: ["WebSearch"] }) });
          const found = `Web search results for query: "${q}"\n\nLinks: ${J(LINKS_[topic])}\n\n${FIND[topic].map((f) => `${f.quote} (${f.url}, ${f.date})`).join("\n")}`;
          s.push({ from: "s", to: "s", kind: "internal", via: "Agent SDK chạy công cụ WebSearch", title: "Agent SDK chạy tìm kiếm và nhận kết quả", desc: "Kết quả tìm kiếm chỉ đi vào hội thoại của agent con. Hội thoại của coordinator không dài thêm chút nào.", payload: found, pnote: "Toàn bộ kết quả công cụ trả về." });
          rc.push({ role: "user", content: [{ tool_use_id: "toolu_S" + label, type: "tool_result", content: found }] });
          s.push({ from: "s", to: "r", kind: "req", label: "tool_result", title: `Gửi kết quả tìm kiếm cho agent ${label}`, desc: "Request thứ hai của agent con, thêm kết quả tìm kiếm ở cuối.", ...rc.req({ hl: ["tool_result"] }) });
          const text = J({ findings: FIND[topic] });
          s.push({ from: "r", to: "s", kind: "res", label: "kết quả", title: `Agent ${label} trả kết quả cuối, kèm thông tin nguồn`, desc: "Response cuối có <code>stop_reason: end_turn</code>. Khối chữ của nó chứa JSON các phát hiện; mỗi phát hiện có đường dẫn và ngày, để bước tổng hợp sau này trích dẫn được.", ...rc.res({ content: [{ type: "text", text }], stop_reason: "end_turn", in: 1320, out: 212 }, { hl: ["text", "end_turn"] }) });
          return { type: "tool_result", tool_use_id: id, content: handback(text, agentId, 1320, 1, 8400) };
        };
        const results = first.map((a, i) => runSearch(a, "T" + (i + 1)));
        cv.push({ role: "user", content: results });
        s.push({
          from: "s", to: "c", kind: "req", label: par ? "2 kết quả" : "kết quả T1", title: par ? "Coordinator nhận về hai kết quả cuối" : "Coordinator nhận kết quả của T1",
          desc: "SDK lấy phần chữ cuối của từng agent con, đặt vào khối <code>tool_result</code>, rồi gửi request tiếp theo của coordinator. Claude Code bọc báo cáo trong một lời dẫn cho biết đây là lời của agent con, không phải của người dùng. Coordinator không thấy lệnh WebSearch nào.",
          ...cv.req({ hl: ["tool_use_id"] }),
          push: [{ r: "tool", t: par ? "Kết quả T1, T2: các phát hiện kèm đường dẫn và ngày" : "Kết quả T1 (âm nhạc)" }],
        });
        if (!par) {
          s.push({ from: "c", to: "s", kind: "warn", label: "lệnh Agent thứ 2", title: "Coordinator mới giao việc thứ hai", desc: "Việc thứ hai phải chờ việc đầu xong, nên tổng thời gian dài gấp đôi.", ...cv.res({ content: [task(AREAS[1])], stop_reason: "tool_use", in: 1980, out: 160 }, { hl: ["Agent"] }), push: [{ r: "assistant", t: "Giao việc T2 ở lượt riêng" }] });
          const r2 = runSearch(AREAS[1], "T2");
          cv.push({ role: "user", content: [r2] });
          s.push({ from: "s", to: "c", kind: "req", label: "kết quả T2", title: "Coordinator nhận kết quả của T2", desc: "Lại một request nữa của coordinator.", ...cv.req({ hl: ["toolu_T2"] }), push: [{ r: "tool", t: "Kết quả T2 (văn học)" }] });
        }
        const synthPrompt = "Mục tiêu: báo cáo tác động của AI tới âm nhạc và văn học.\nDữ liệu (giữ nguyên đường dẫn và ngày khi trích dẫn):\n" + AREAS.map(([t]) => `<findings area="${t}">${J(FIND[t])}</findings>`).join("\n") + "\nYêu cầu: mỗi nhận định có nguồn; nêu rõ chỗ mâu thuẫn; ghi chú khía cạnh nào thiếu dữ liệu.";
        s.push({
          phase: "Tổng hợp", from: "c", to: "s", kind: "res", label: "giao tổng hợp", title: "Coordinator giao việc tổng hợp, kèm toàn bộ dữ liệu",
          desc: "Agent tổng hợp không thấy kết quả của agent tìm kiếm. Vì vậy coordinator phải dán thẳng các phát hiện vào phiếu giao việc, kèm yêu cầu rõ ràng về cách trình bày.",
          ...cv.res({ content: [{ type: "tool_use", id: "toolu_S1", name: "Agent", input: { description: "Tổng hợp báo cáo", prompt: synthPrompt, subagent_type: "synth", run_in_background: false } }], stop_reason: "tool_use", in: par ? 2480 : 2610, out: 620 }, { hl: ["prompt"] }),
          warn: "Nếu phiếu chỉ ghi “tổng hợp các phát hiện ở trên”, agent tổng hợp sẽ không có dữ liệu nào, vì nó không thấy “ở trên” là gì.",
          push: [{ r: "assistant", t: "Giao việc tổng hợp, phiếu chứa toàn bộ phát hiện" }],
        });
        const yc = sdkConv(SYNTH, { tools: [], tag: "Y", agents: "- general-purpose: Việc nhiều bước, tìm kiếm và thực thi. (Tools: *)" });
        yc.user(synthPrompt);
        s.push({ from: "s", to: "y", kind: "req", label: "phiếu giao việc", title: "Agent tổng hợp bắt đầu với hội thoại mới", desc: "Request không có trường <code>tools</code>: agent tổng hợp không có công cụ tìm kiếm, nên nó chỉ có thể làm việc với dữ liệu được giao. Nhờ đó nó làm đúng vai trò của mình.", ...yc.req() });
        const report = "## Âm nhạc\n- Nhạc có dùng AI tăng mạnh [nguồn: example.org/music-report-2025, 2025-09]\n- Tranh chấp giọng hát giả [nguồn: example.org/voice-case, 2026-02]\n## Văn học\n- Nhà xuất bản yêu cầu khai báo việc dùng AI [nguồn: example.org/publishing-policy, 2026-01]\n## Ghi chú độ bao phủ\n- Văn học: mới có 1 nguồn, cần bổ sung.";
        s.push({ from: "y", to: "s", kind: "res", label: "báo cáo", title: "Agent tổng hợp trả về báo cáo", desc: "Báo cáo có trích dẫn cho từng nhận định, và một mục ghi chú cho biết khía cạnh nào còn thiếu dữ liệu.", ...yc.res({ content: [{ type: "text", text: report }], stop_reason: "end_turn", in: 1180, out: 340 }) });
        cv.push({ role: "user", content: [{ type: "tool_result", tool_use_id: "toolu_S1", content: handback(report, "c93e1a07d5b24f618", 1520, 0, 6100) }] });
        s.push({ from: "s", to: "c", kind: "req", label: "báo cáo", title: "SDK gửi báo cáo về cho coordinator", desc: "Báo cáo đi vào hội thoại của coordinator dưới dạng <code>tool_result</code> của lệnh Agent S1.", ...cv.req({ hl: ["toolu_S1"] }), push: [{ r: "tool", t: "Kết quả S1: báo cáo và ghi chú độ bao phủ" }] });
        const summary = "Báo cáo đã hoàn tất: 2 lĩnh vực, mọi nhận định có nguồn. Văn học còn ít dữ liệu, xem mục Ghi chú độ bao phủ.";
        s.push({ from: "c", to: "s", kind: "ok", label: "end_turn", title: "Coordinator kiểm tra báo cáo và kết thúc", desc: "Coordinator so báo cáo với yêu cầu ban đầu. Thấy đã đạt, nó trả lời bằng chữ với <code>stop_reason: end_turn</code>, và SDK dừng vòng lặp.", ...cv.res({ content: [{ type: "text", text: summary }], stop_reason: "end_turn", in: par ? 3120 : 3260, out: 96 }, { hl: ["end_turn"] }), push: [{ r: "assistant", t: "Tóm tắt cuối <b>(end_turn)</b>" }] });
        const opus = (i, o, c) => ({ inputTokens: i, outputTokens: o, cacheReadInputTokens: 0, cacheCreationInputTokens: 0, webSearchRequests: 0, costUSD: c, contextWindow: 1000000, maxOutputTokens: 128000, thinkingTokens: 0, canonicalModel: "claude-opus-5-5", provider: "firstParty", costBasis: "list" });
        const haiku = { inputTokens: 4600, outputTokens: 508, cacheReadInputTokens: 0, cacheCreationInputTokens: 0, webSearchRequests: 2, costUSD: 0.0007, contextWindow: 1000000, maxOutputTokens: 128000, thinkingTokens: 0, canonicalModel: "claude-haiku-5-5", provider: "firstParty", costBasis: "list" };
        s.push({
          phase: "Trả kết quả cho ứng dụng", from: "s", to: "a", kind: "ok", label: "kết quả", title: "Ứng dụng nhận kết quả cuối cùng",
          desc: par ? "Giao việc song song giúp toàn bộ quá trình chỉ mất khoảng 24 giây và 3 lượt của coordinator." : "Giao việc lần lượt khiến toàn bộ quá trình mất khoảng 36 giây và 4 lượt của coordinator.",
          payload: resultMsg({ ms: par ? 24210 : 35930, apiMs: par ? 21870 : 33020, turns: par ? 3 : 4, result: summary, cost: par ? 0.05 : 0.07, in: par ? 12440 : 14090, out: par ? 1578 : 1684, searches: 2, models: { "claude-opus-5-5": opus(par ? 7840 : 9490, par ? 1070 : 1176, par ? 0.05 : 0.06), "claude-haiku-5-5": haiku } }),
          pnote: RESULT_NOTE + " Trước message này, ứng dụng còn nhận lần lượt các message trung gian (system, assistant, user) nếu muốn theo dõi tiến trình.",
          hl: ["num_turns", "duration_ms"],
        });
        return s;
      },
    }),
  };

  /* ───────── 1-4 Cổng kiểm tra bằng code ───────── */
  W.refundGate = {
    title: "Chặn hoàn tiền trước khi xác minh: dặn trong prompt và kiểm tra bằng code",
    render: trace({
      intro: "Dù đã được dặn “luôn xác minh trước”, đôi khi Claude vẫn đi tắt và gọi lệnh hoàn tiền ngay. Chọn một trong hai cách bảo vệ bên dưới để xem hệ thống phản ứng thế nào. Chú ý: khách và Claude không bao giờ nói chuyện trực tiếp; mọi thứ đi qua backend.",
      actors: [CAST.u, CAST.b, CAST.c, { ...CAST.t, sub: "CRM, thanh toán" }],
      links: LINKS,
      stateTitle: "Trạng thái phiên",
      controls: [{ id: "m", type: "select", label: "Cách bảo vệ:", value: "gate", options: [["gate", "Kiểm tra bằng code trong backend"], ["prompt", "Chỉ dặn trong system prompt"]] }],
      steps: ({ m }) => {
        const s = [];
        const cv = claude({ model: MODEL, max_tokens: 1024, system: SYS, tools: TOOLS }, { tag: "G" });
        const ask = "Hoàn tiền đơn #1234 cho tôi ngay, gấp lắm!";
        s.push({ phase: "Khách hối thúc", from: "u", to: "b", kind: "req", label: "tin nhắn", title: "Khách hối thúc", desc: "Khách viết rất gấp và chưa cung cấp thông tin xác minh nào.", ...chatIn(ask), state: [{ r: "note", t: "Khách đã được xác minh: <b>chưa</b>" }] });
        cv.user(ask);
        s.push({ from: "b", to: "c", kind: "req", label: "yêu cầu #1", title: "Backend chuyển tin nhắn cho Claude", desc: "Request có system dặn “luôn xác minh khách trước khi làm gì liên quan tới tiền”, và có cả công cụ <code>process_refund</code>.", ...cv.req({ hl: ["system"] }) });
        s.push({ from: "c", to: "b", kind: "warn", label: "xin hoàn tiền", title: "Claude bỏ qua bước xác minh", desc: "Bị khách hối thúc, Claude xin gọi thẳng lệnh hoàn tiền. Điều này hiếm khi xảy ra, nhưng không bao giờ là không thể.", ...cv.res({ content: [{ type: "tool_use", id: "toolu_09", name: "process_refund", input: { order_id: "1234", amount: 89 } }], stop_reason: "tool_use", in: 1190, out: 45 }, { hl: ["process_refund"] }) });
        const refund = (id) => callV("POST", "http://billing.internal/refunds", { order_id: "1234", amount: 89, currency: "USD", reason: "customer_request" }, { "idempotency-key": "refund-sess_42-" + id });
        if (m === "prompt") {
          s.push({ phase: "Không có kiểm tra", from: "b", to: "t", kind: "err", label: "hoàn tiền", title: "Không có gì chặn lại", desc: "Backend thấy yêu cầu đúng định dạng nên chạy luôn. Lời dặn trong prompt không có tác dụng ở bước này, vì backend không kiểm tra gì.", ...refund("toolu_09"), warn: "Tiền được hoàn cho một người chưa xác minh. Đó có thể là kẻ mạo danh, chỉ biết mỗi mã đơn." });
          s.push({ from: "t", to: "b", kind: "err", label: "đã chuyển tiền", title: "Tiền đã đi, không lấy lại được", desc: "Giao dịch đã hoàn tất, và kiểm toán sẽ phát hiện một lần hoàn tiền không qua bước xác minh.", ...ret({ refund_id: "R-777", status: "ok" }, "201 Created"), push: [{ r: "err", t: "Kiểm toán: R-777 hoàn tiền mà không xác minh" }] });
          s.push({ from: "b", to: "b", kind: "err", title: "Bài học", desc: "Dặn trong prompt giúp Claude làm đúng trong <b>phần lớn</b> trường hợp. Với hành động không thể đảo ngược như chuyển tiền hay xóa dữ liệu, “phần lớn” là chưa đủ; cần một bước kiểm tra bằng code trong backend." });
          return s;
        }
        s.push({ phase: "Backend chặn lại", from: "b", to: "b", kind: "internal", title: "Backend kiểm tra trạng thái của phiên", desc: "Trước khi chạy lệnh hoàn tiền, backend xem trong bộ nhớ của phiên đã có ghi nhận “khách đã được xác minh” hay chưa. Ghi nhận này do backend tự ghi sau khi tra cứu, không phải do Claude khai báo. Chưa có, nên backend không gọi hệ thống thanh toán.", snippet: "if session.verified_customer_id is None:\n    return tool_error(\"precondition_failed\",\n        \"Chưa xác minh khách. Hỏi email đặt hàng rồi gọi get_customer.\")" });
        cv.push({ role: "user", content: [{ type: "tool_result", tool_use_id: "toolu_09", is_error: true, content: J({ error: "precondition_failed", message: "Chưa xác minh khách. Hỏi email đặt hàng rồi gọi get_customer." }) }] });
        s.push({ from: "b", to: "c", kind: "err", label: "bị chặn", title: "Lệnh bị chặn, kèm hướng dẫn cần làm gì", desc: "Backend trả về cho Claude một kết quả lỗi nói rõ vì sao bị chặn và bước tiếp theo cần làm.", ...cv.req({ hl: ["is_error"] }), note: "Vì thông báo lỗi nói rõ cần làm gì, Claude tự sửa hướng đi, thay vì gọi lại lệnh hoàn tiền một cách vô ích." });
        const askMail = "Để bảo vệ tài khoản của bạn, bạn cho mình email đã dùng khi đặt đơn #1234 nhé.";
        s.push({ from: "c", to: "b", kind: "res", label: "hỏi email", title: "Claude chuyển sang xác minh", desc: "Claude trả lời bằng chữ, hỏi khách email đã dùng khi đặt hàng. <code>stop_reason</code> là <code>end_turn</code>: lượt này xong, chờ khách trả lời.", ...cv.res({ content: [{ type: "text", text: askMail }], stop_reason: "end_turn", in: 1290, out: 38 }) });
        s.push({ from: "b", to: "u", kind: "res", label: "hỏi email", title: "Backend chuyển câu hỏi cho khách", desc: "Khách chỉ thấy câu hỏi bằng chữ.", ...chatOut(askMail) });
        s.push({ phase: "Xác minh khách", from: "u", to: "b", kind: "req", label: "email", title: "Khách cung cấp email", desc: "Khách gửi email.", ...chatIn("lan@example.com") });
        cv.user("lan@example.com");
        s.push({ from: "b", to: "c", kind: "req", label: "yêu cầu #3", title: "Backend gửi tiếp cho Claude", desc: "Toàn bộ cuộc trò chuyện, thêm email của khách ở cuối.", ...cv.req() });
        s.push({ from: "c", to: "b", kind: "res", label: "xin tra khách", title: "Claude xin tra cứu để xác minh", desc: "Claude xin chạy <code>get_customer</code> với mã đơn và email khách vừa cung cấp.", ...cv.res({ content: [{ type: "tool_use", id: "toolu_10", name: "get_customer", input: { order_id: "1234", email: "lan@example.com" } }], stop_reason: "tool_use", in: 1345, out: 52 }, { hl: ["get_customer"] }) });
        s.push({ from: "b", to: "t", kind: "req", label: "đối chiếu", title: "Backend đối chiếu với hệ thống khách hàng", desc: "Kiểm tra email này có đúng là của người đặt đơn #1234 không.", ...callV("POST", "http://crm.internal/verify", { order_id: "1234", email: "lan@example.com" }) });
        s.push({ from: "t", to: "b", kind: "res", label: "khớp", title: "Thông tin khớp", desc: "Email khớp với chủ đơn hàng. Khách là C-88.", ...ret({ match: true, customer_id: "C-88" }) });
        s.push({ from: "b", to: "b", kind: "internal", title: "Backend ghi nhận khách đã được xác minh", desc: "Backend tự ghi vào bộ nhớ của phiên rằng khách C-88 đã được xác minh, dựa trên kết quả từ hệ thống khách hàng. Thông tin này nằm ngoài tầm với của Claude, nên một câu như “tôi đã xác minh rồi” không thể làm giả được.", snippet: "session.verified_customer_id = \"C-88\"\nsession.verified_at = now()", push: [{ r: "ok", t: "Khách đã được xác minh: <b>C-88</b> (theo hệ thống khách hàng)" }] });
        cv.push({ role: "user", content: [{ type: "tool_result", tool_use_id: "toolu_10", content: J({ match: true, customer_id: "C-88" }) }] });
        s.push({ phase: "Hoàn tiền", from: "b", to: "c", kind: "req", label: "kết quả", title: "Gửi kết quả xác minh cho Claude", desc: "Kết quả tra cứu đi vào lịch sử dưới dạng <code>tool_result</code>.", ...cv.req({ hl: ["toolu_10"] }) });
        s.push({ from: "c", to: "b", kind: "res", label: "xin hoàn tiền", title: "Claude gọi lại lệnh hoàn tiền", desc: "Lần này điều kiện đã đủ.", ...cv.res({ content: [{ type: "tool_use", id: "toolu_11", name: "process_refund", input: { order_id: "1234", amount: 89 } }], stop_reason: "tool_use", in: 1420, out: 45 }, { hl: ["process_refund"] }) });
        s.push({ from: "b", to: "t", kind: "ok", label: "hoàn tiền", title: "Kiểm tra đạt, backend cho chạy", desc: "Khách đã được xác minh, số tiền dưới hạn mức, và đơn hàng đúng là của khách C-88. Backend gọi hệ thống thanh toán.", ...refund("toolu_11") });
        s.push({ from: "t", to: "b", kind: "ok", label: "đã hoàn", title: "Hoàn tiền thành công", desc: "Mã giao dịch R-552, có ghi nhận đầy đủ thời điểm xác minh.", ...ret({ refund_id: "R-552", status: "ok" }, "201 Created"), push: [{ r: "ok", t: "Kiểm toán: R-552, xác minh C-88 lúc 10:02" }] });
        cv.push({ role: "user", content: [{ type: "tool_result", tool_use_id: "toolu_11", content: J({ refund_id: "R-552", status: "ok" }) }] });
        s.push({ from: "b", to: "c", kind: "req", label: "kết quả", title: "Gửi kết quả hoàn tiền cho Claude", desc: "Lại toàn bộ cuộc trò chuyện, thêm kết quả hoàn tiền.", ...cv.req({ hl: ["toolu_11"] }) });
        const doneTxt = "Đã xác minh và hoàn $89 cho đơn #1234 (mã R-552).";
        s.push({ from: "c", to: "b", kind: "ok", label: "end_turn", title: "Claude viết câu trả lời cuối", desc: "Chỉ có chữ, <code>stop_reason: end_turn</code>.", ...cv.res({ content: [{ type: "text", text: doneTxt }], stop_reason: "end_turn", in: 1480, out: 30 }) });
        s.push({ from: "b", to: "u", kind: "ok", label: "trả lời", title: "Khách nhận câu trả lời", desc: "Khách được hoàn tiền, và quy trình xác minh đã được tuân thủ.", ...chatOut(doneTxt) });
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
      permissionDecisionReason: "Hoàn trên $500 cần người duyệt. Gọi mcp__support__escalate_to_human.",
    } };
  }
  return {};   // không can thiệp, để công cụ chạy bình thường
}`;
  W.hookPipeline = {
    title: "Hook trong Agent SDK: dữ liệu vào và ra của mỗi hook",
    render: trace({
      intro: "Hook là hàm của bạn, được Agent SDK tự động gọi trước và sau khi một công cụ chạy. Claude không biết hook tồn tại và không thể bỏ qua nó. Thử thay đổi số tiền, định dạng ngày và bật tắt từng hook để xem kết quả khác nhau thế nào.",
      actors: [
        { id: "c", icon: "🧠", name: "Claude API", sub: "trả về yêu cầu dùng công cụ", desc: "Model trả về khối <code>tool_use</code> trong response. Nó không chạy công cụ và không biết có hook." },
        { id: "s", icon: "⚙️", name: "Agent SDK", sub: "thư viện trong ứng dụng", desc: "Nhận response, gọi hook, gọi công cụ, rồi gửi kết quả về Claude API trong request tiếp theo." },
        { id: "h", icon: "🪝", name: "Hook của bạn", sub: "hàm trong cùng chương trình", desc: "Hàm bạn đăng ký trong <code>options.hooks</code>. SDK gọi nó trước (PreToolUse) và sau (PostToolUse) khi công cụ chạy." },
        { id: "t", icon: "💳", name: "Máy chủ MCP billing", sub: "tiến trình riêng, nói chuyện qua stdio", desc: "Máy chủ MCP cung cấp công cụ <code>process_refund</code>. SDK khởi động nó và gửi lệnh qua stdin/stdout theo chuẩn JSON-RPC." },
      ],
      links: {
        "c>s": "HTTPS · luồng SSE của response",
        "s>h": "gọi hàm hook (callback) trong cùng chương trình",
        "h>s": "hàm hook trả về (return)",
        "s>t": "stdio · JSON-RPC 2.0 (tools/call)",
        "t>s": "stdio · JSON-RPC 2.0 (kết quả)",
        "s>c": "HTTPS · POST /v1/messages",
      },
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
        const BILLING = defTool("mcp__billing__process_refund", "Hoàn tiền cho một đơn hàng.", { order_id: { type: "string", description: "Mã đơn" }, amount: { type: "number", description: "Số tiền, tính bằng USD" } }, ["order_id", "amount"]);
        const ESC = defTool("mcp__support__escalate_to_human", "Chuyển vụ việc cho nhân viên duyệt, kèm đủ thông tin.", { customer_id: { type: "string" }, order_id: { type: "string" }, amount: { type: "number" }, reason: { type: "string" }, recommended_action: { type: "string" } }, ["customer_id", "order_id", "reason"]);
        const cv = sdkConv("Bạn là agent hoàn tiền của ShopX.", { model: MODEL, tools: [BILLING, ESC], tag: "H", agents: "- general-purpose: Việc nhiều bước, tìm kiếm và thực thi. (Tools: *)" });
        cv.user(`Khách C-88 (đã xác minh) yêu cầu hoàn đơn #1234, số tiền $${a}.`);
        s.push({ phase: "Claude xin chạy công cụ", from: "s", to: "c", kind: "req", label: "request #1", title: "SDK gửi yêu cầu cho Claude", desc: "Request kèm hai công cụ MCP. Công cụ hoàn tiền đến từ máy chủ MCP tên billing, nên tên đầy đủ của nó là <code>mcp__billing__process_refund</code>.", ...cv.req({ hl: ["mcp__billing__process_refund"] }), state: [] });
        const tu = { type: "tool_use", id: "toolu_07", name: "mcp__billing__process_refund", input: { order_id: "1234", amount: a } };
        s.push({ from: "c", to: "s", kind: "res", label: "xin hoàn tiền", title: `Claude xin hoàn $${a}`, desc: "Hook phải ghi đúng tên đầy đủ của công cụ thì mới được gọi.", ...cv.res({ content: [tu], stop_reason: "tool_use", in: 640, out: 48 }, { hl: ["name", "amount"] }) });
        s.push({ phase: "Hook trước khi chạy", from: "s", to: "s", kind: "internal", title: "Agent SDK tìm hook phù hợp với công cụ này", desc: pre ? "SDK so tên công cụ với cấu hình hook. Tên khớp với hook <code>refundLimit</code>, nên SDK sẽ gọi hook này trước khi chạy công cụ." : "Hook trước đang bị tắt, nên không có gì kiểm tra trước khi công cụ chạy.", snippet: HOOK_CFG });
        const hookIn = { session_id: "5f1c2a90-7d3e-4b8a-9c61-2e4f8a0b7d15", transcript_path: "/home/app/.claude/projects/-app/5f1c2a90-7d3e-4b8a-9c61-2e4f8a0b7d15.jsonl", cwd: "/app", permission_mode: "default", hook_event_name: "PreToolUse", tool_name: "mcp__billing__process_refund", tool_input: { order_id: "1234", amount: a }, tool_use_id: "toolu_07" };
        if (pre) {
          s.push({ from: "s", to: "h", kind: "req", label: "dữ liệu cho hook", title: "SDK gọi hook, truyền vào thông tin của lệnh", desc: "Đối tượng này là tham số đầu tiên của hàm hook. Hook nhận được tên công cụ và các tham số Claude định truyền vào, nên có đủ thông tin để quyết định cho chạy hay chặn lại.", payload: hookIn, pnote: "Toàn bộ đối tượng <code>input</code> SDK truyền vào hàm hook. Hàm còn nhận thêm <code>toolUseID</code> và một <code>signal</code> để hủy.", hl: ["hook_event_name", "tool_name", "tool_input"], fields: [["hook_event_name", "Thời điểm hook được gọi; ở đây là trước khi chạy công cụ."], ["tool_name", "Tên đầy đủ của công cụ."], ["tool_input", "Tham số Claude định truyền vào. Hook đọc được, có thể chặn, thậm chí sửa lại."], ["transcript_path", "Đường dẫn tới file lịch sử phiên, dùng khi hook cần xem lại cuộc trò chuyện."], ["permission_mode", "Chế độ cấp quyền hiện tại của phiên."]] });
          if (a > 500) {
            s.push({ from: "h", to: "s", kind: "err", label: "chặn", title: "Hook quyết định chặn", desc: `Số tiền $${a} lớn hơn hạn mức $500, nên hook trả về quyết định “deny” (chặn), kèm lý do.`, payload: { hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: "Hoàn trên $500 cần người duyệt. Gọi mcp__support__escalate_to_human." } }, pnote: "Toàn bộ giá trị hàm hook trả về.", hl: ["permissionDecision", "permissionDecisionReason"], fields: [["permissionDecision", "Có bốn lựa chọn: <code>allow</code> (cho chạy), <code>deny</code> (chặn), <code>ask</code> (hỏi người dùng) và <code>defer</code> (dừng lượt, để xử lý lệnh này sau). Nhiều hook cùng trả lời thì <code>deny</code> thắng."], ["permissionDecisionReason", "Khi chặn, lý do này được chuyển cho Claude để nó đổi hướng."]], push: [{ r: "err", t: `Hook trước đã chặn lệnh hoàn $${a}` }] });
            cv.push({ role: "user", content: [{ type: "tool_result", tool_use_id: "toolu_07", is_error: true, content: "Hoàn trên $500 cần người duyệt. Gọi mcp__support__escalate_to_human." }] });
            s.push({ phase: "Claude đổi hướng", from: "s", to: "c", kind: "err", label: "bị chặn", title: "Công cụ không chạy; Claude nhận lý do bị chặn", desc: "Lệnh hoàn tiền không hề được gửi tới máy chủ thanh toán. SDK gửi request tiếp theo, trong đó kết quả của toolu_07 là lỗi chứa lý do từ hook.", ...cv.req({ hl: ["is_error"] }) });
            s.push({ from: "c", to: "s", kind: "ok", label: "chuyển duyệt", title: "Claude chuyển sang quy trình duyệt", desc: "Đọc lý do, Claude xin gọi công cụ chuyển vụ việc cho nhân viên duyệt, kèm đầy đủ thông tin. Chính sách được tuân thủ.", ...cv.res({ content: [{ type: "tool_use", id: "toolu_08", name: "mcp__support__escalate_to_human", input: { customer_id: "C-88", order_id: "1234", amount: a, reason: "Vượt hạn mức tự động $500", recommended_action: "Duyệt hoàn tiền toàn phần" } }], stop_reason: "tool_use", in: 760, out: 90 }, { hl: ["escalate_to_human"] }), push: [{ r: "ok", t: "Đã tạo yêu cầu duyệt tay" }] });
            return s;
          }
          s.push({ from: "h", to: "s", kind: "ok", label: "cho qua", title: "Hook không phản đối", desc: `$${a} nằm trong hạn mức. Hook trả về một đối tượng rỗng, nghĩa là không can thiệp, và công cụ chạy bình thường.`, payload: {}, pnote: "Toàn bộ giá trị hàm hook trả về: một đối tượng rỗng.", push: [{ r: "ok", t: `Hook trước: $${a} trong hạn mức, cho qua` }] });
        } else if (a > 500) {
          s.push({ from: "s", to: "s", kind: "err", title: "Không có hook nào chặn", desc: "Vì hook trước đang tắt, không có bước kiểm tra nào trước khi công cụ chạy.", warn: `Lệnh hoàn $${a} sẽ được thực hiện, dù chính sách yêu cầu phải có người duyệt.`, push: [{ r: "err", t: `Vi phạm: hoàn $${a} không qua duyệt` }] });
        }
        s.push({ phase: "Chạy công cụ", from: "s", to: "t", kind: "req", label: "tools/call", title: "SDK gọi công cụ hoàn tiền trên máy chủ MCP", desc: "SDK ghi một dòng JSON-RPC vào stdin của máy chủ MCP. Chú ý: tên công cụ ở đây là <code>process_refund</code>, không có tiền tố <code>mcp__billing__</code>; tiền tố chỉ dùng phía Claude để phân biệt các máy chủ.", payload: mcp.call(31, "process_refund", { order_id: "1234", amount: a }, "toolu_07"), pnote: "Toàn bộ thông điệp JSON-RPC (gửi trên một dòng).", hl: ["name"] });
        const toolText = JSON.stringify({ refund_id: "R-9", processed_at: raw });
        s.push({ from: "t", to: "s", kind: "res", label: "kết quả", title: "Công cụ trả kết quả với định dạng ngày riêng", desc: fmt === "iso" ? "Ngày đã ở dạng chuẩn ISO 8601, giống các công cụ khác." : `Ngày được trả về dạng “${raw}”, khác với các công cụ khác (đang dùng chuẩn ISO). Claude dễ so sánh nhầm ngày nếu nhận nguyên như vậy.`, payload: mcp.result(31, "billing", toolText), pnote: "Toàn bộ thông điệp JSON-RPC máy chủ ghi ra stdout.", hl: ["text"] });
        let out = raw;
        if (post) {
          s.push({ phase: "Hook sau khi chạy", from: "s", to: "h", kind: "req", label: "dữ liệu cho hook", title: "SDK gọi hook sau, kèm kết quả của công cụ", desc: "Hook sau nhận thêm kết quả công cụ (<code>tool_response</code>), nên có thể sửa lại kết quả trước khi Claude đọc.", payload: { ...hookIn, hook_event_name: "PostToolUse", tool_response: { content: [{ type: "text", text: toolText }] } }, pnote: "Toàn bộ đối tượng <code>input</code> của hook sau.", hl: ["hook_event_name", "tool_response"] });
          if (fmt !== "iso") out = "2026-01-01T00:00:00Z";
          s.push({ from: "h", to: "s", kind: "ok", label: "chuẩn hóa", title: fmt === "iso" ? "Ngày đã chuẩn, không cần sửa" : "Hook đổi ngày về dạng chuẩn", desc: fmt === "iso" ? "Hook không phải làm gì, trả về đối tượng rỗng." : `Hook đổi “${raw}” thành “2026-01-01T00:00:00Z” rồi trả kết quả mới cho SDK.`, payload: fmt === "iso" ? {} : { hookSpecificOutput: { hookEventName: "PostToolUse", updatedToolOutput: { content: [{ type: "text", text: JSON.stringify({ refund_id: "R-9", processed_at: out }) }] } } }, pnote: "Toàn bộ giá trị hàm hook trả về.", hl: ["updatedToolOutput"], note: "<code>updatedToolOutput</code> thay kết quả của mọi loại công cụ. Tên cũ <code>updatedMCPToolOutput</code> chỉ dùng cho công cụ MCP.", push: [{ r: "ok", t: `Hook sau: đổi "${raw}" sang ISO 8601` }] });
        }
        cv.push({ role: "user", content: [{ type: "tool_result", tool_use_id: "toolu_07", content: [{ type: "text", text: JSON.stringify({ refund_id: "R-9", processed_at: out }) }] }] });
        s.push({ phase: "Claude nhận kết quả", from: "s", to: "c", kind: "res", label: "tool_result", title: "Claude nhận kết quả", desc: out === raw && fmt !== "iso" ? "Claude nhận ngày ở định dạng lạ, và phải tự đoán ý nghĩa của nó." : "Claude nhận ngày ở định dạng chuẩn, giống mọi công cụ khác.", ...cv.req({ hl: ["processed_at"] }), warn: !post && fmt !== "iso" ? "Không có hook chuẩn hóa thì chỉ còn cách dặn Claude “cẩn thận với ngày tháng”, và cách đó chỉ đúng theo xác suất." : null });
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
