/* Mô phỏng chi tiết — Chương 1: Agentic Architecture & Orchestration */
(function () {
  const { trace } = window.SIM;
  const W = window.WIDGETS;
  const MODEL = "claude-sonnet-5-5";
  const J = (o) => JSON.stringify(o);

  /* ───────── 1-1 Vòng lặp agent: request/response thật, backend làm gì ───────── */
  const TOOLS = [
    {
      name: "get_customer",
      description: "Tra hồ sơ khách theo email hoặc order_id. Dùng để XÁC MINH danh tính trước mọi thao tác liên quan tới tiền.",
      input_schema: { type: "object", properties: { order_id: { type: "string" }, email: { type: "string" } } },
    },
    { name: "lookup_order", description: "Tra đơn theo order_id: trạng thái, số tiền, số ngày từ khi giao.", input_schema: { type: "object", properties: { order_id: { type: "string" } }, required: ["order_id"] } },
    { name: "get_refund_policy", description: "Lấy chính sách hoàn tiền hiện hành (hạn ngày, hạn mức).", input_schema: { type: "object", properties: {} } },
    { name: "process_refund", description: "Hoàn tiền cho đơn ĐÃ xác minh. Chỉ gọi sau get_customer.", input_schema: { type: "object", properties: { order_id: { type: "string" }, amount: { type: "number" } }, required: ["order_id", "amount"] } },
  ];
  const HTTP = "POST https://api.anthropic.com/v1/messages\nx-api-key: $ANTHROPIC_API_KEY\nanthropic-version: 2023-06-01\ncontent-type: application/json";
  const LOOP_CODE = `def run_agent(session_id: str, user_text: str) -> str:
    messages = store.load(session_id)          # API stateless: backend tự giữ lịch sử
    messages.append({"role": "user", "content": user_text})
    max_tok = 1024

    for turn in range(MAX_TURNS):              # lưới an toàn, KHÔNG phải tín hiệu dừng
        resp = client.messages.create(
            model=MODEL,
            max_tokens=max_tok,
            system=SYSTEM_PROMPT,
            tools=TOOLS,                       # name + description + input_schema
            messages=messages,                 # gửi LẠI toàn bộ lịch sử mỗi lượt
        )
        if resp.stop_reason == "max_tokens":  # bị cắt → tool_use có thể dở dang
            max_tok *= 4; continue             # gọi lại, KHÔNG nối response bị cắt
        messages.append({"role": "assistant", "content": resp.content})

        if resp.stop_reason == "end_turn":    # Claude đã xong
            store.save(session_id, messages)
            return "".join(b.text for b in resp.content if b.type == "text")

        if resp.stop_reason == "tool_use":
            results = []
            for block in resp.content:         # có thể có NHIỀU tool_use song song
                if block.type != "tool_use":
                    continue
                out = run_tool(session_id, block.name, block.input)  # validate + gate + gọi hệ thống
                results.append({
                    "type": "tool_result",
                    "tool_use_id": block.id,   # phải khớp id của tool_use
                    "content": json.dumps(out.data),
                    "is_error": out.is_error,
                })
            messages.append({"role": "user", "content": results})  # 1 message chứa MỌI tool_result

    return escalate_to_human(session_id, reason="max_turns")`;

  W.agentLoop = {
    title: "Vòng lặp agent hoàn tiền — soi từng request/response",
    render: trace({
      intro: "Bốn tác nhân: khách chat với <b>backend của bạn</b>; backend gọi <b>Claude API</b> (Messages API) và tự chạy <b>công cụ</b>. Claude <u>không</u> tự chạy công cụ — nó chỉ “xin” chạy bằng khối <code>tool_use</code>.",
      actors: [
        { id: "u", icon: "👤", name: "Khách hàng", sub: "giao diện chat" },
        { id: "b", icon: "🖥️", name: "Backend", sub: "code agent loop của bạn" },
        { id: "c", icon: "🧠", name: "Claude API", sub: "POST /v1/messages" },
        { id: "t", icon: "🗄️", name: "Hệ thống nội bộ", sub: "CRM · Orders · Billing" },
      ],
      stateTitle: "🧾 messages[] backend đang giữ",
      code: { title: "agent.py — vòng lặp tối giản (Python SDK)", src: LOOP_CODE },
      controls: [{ id: "v", type: "select", label: "Kịch bản:", value: "ok", options: [["ok", "✅ Bình thường (có gọi song song)"], ["err", "⚠️ Một công cụ lỗi tạm thời (is_error)"], ["mt", "✂️ Response bị cắt vì max_tokens"]] }],
      steps: ({ v }) => {
        const s = [];
        s.push({
          from: "u", to: "b", kind: "req", label: "💬 tin nhắn", title: "Khách gửi tin nhắn tới backend", sub: "POST /chat",
          desc: "Frontend chỉ gửi văn bản và mã phiên. Khách không bao giờ nói chuyện trực tiếp với Claude API — mọi thứ đi qua backend.",
          payload: { session_id: "sess_42", text: "Tôi muốn hoàn tiền đơn #1234" },
          fields: [["session_id", "Khóa để backend nạp lịch sử hội thoại và trạng thái phiên (đã xác minh chưa…)."], ["text", "Nội dung người dùng — sẽ thành một message <code>role: \"user\"</code>."]],
          backend: ["Xác thực người dùng / rate limit.", "<code>store.load(session_id)</code> → lịch sử trống (phiên mới).", "Nối <code>{role:\"user\", content:text}</code> vào <code>messages</code>."],
          lines: [1, 3], push: [{ r: "user", t: "“Tôi muốn hoàn tiền đơn #1234”" }],
        });
        s.push({
          from: "b", to: "b", kind: "internal", title: "Backend dựng request #1", desc: "Mỗi request gồm 4 phần chính: <b>model</b> + <b>system</b> (vai trò, quy tắc) + <b>tools</b> (định nghĩa công cụ) + <b>messages</b> (toàn bộ lịch sử).",
          backend: ["Chọn <code>model</code> và <code>max_tokens</code> (giới hạn token <i>đầu ra</i>, không phải ngữ cảnh).", "Gắn <code>system</code> — không nằm trong messages.", "Gắn <code>tools</code>: Claude chỉ biết công cụ qua <b>name + description + input_schema</b>.", "Gắn toàn bộ <code>messages</code> — API không nhớ gì giữa các lần gọi."],
          lines: [5, 12],
        });
        s.push({
          from: "b", to: "c", kind: "req", label: "📤 request #1", title: "Gửi request #1 tới Messages API", sub: "POST /v1/messages",
          payloads: [{ t: "HTTP", d: HTTP }, { t: "Body (JSON)", d: { model: MODEL, max_tokens: 1024, system: "Bạn là agent CSKH của ShopX. Luôn xác minh khách trước khi thao tác tiền. Trả lời tiếng Việt, ngắn gọn.", tools: TOOLS, messages: [{ role: "user", content: "Tôi muốn hoàn tiền đơn #1234" }] }, hl: ["tools", "messages", "system", "max_tokens"] }],
          fields: [
            ["model", "Model xử lý request."], ["max_tokens", "Trần token Claude được sinh ở lượt này. Hết trần → <code>stop_reason: \"max_tokens\"</code>."],
            ["system", "Hướng dẫn cấp hệ thống, tách khỏi hội thoại."], ["tools[].description", "Tín hiệu chính để Claude chọn công cụ nào."], ["tools[].input_schema", "JSON Schema cho tham số — Claude sinh <code>input</code> theo schema này."],
            ["messages", "Mảng xen kẽ user/assistant. Lượt đầu chỉ có 1 message user."], ["tool_choice", "Không gửi → mặc định <code>auto</code>: Claude tự quyết gọi công cụ hay trả lời."],
          ],
          lines: [6, 12],
        });
        s.push({
          from: "c", to: "c", kind: "internal", title: "Claude suy luận (phía Anthropic)",
          desc: "Model đọc system + định nghĩa tools + messages. Thấy yêu cầu dính tới tiền và system yêu cầu xác minh → quyết định gọi <code>get_customer</code>. Đây là <b>model-driven</b>: không có cây if/else nào quyết định bước kế tiếp.",
          note: "Claude không truy cập CRM. Nó chỉ trả về ý định gọi công cụ kèm tham số; việc thực thi là của backend.",
        });
        if (v === "mt") {
          s.push({
            from: "c", to: "b", kind: "err", label: "✂️ bị cắt", title: "Response bị cắt: stop_reason = \"max_tokens\"",
            payload: { id: "msg_01Trunc", type: "message", role: "assistant", content: [{ type: "text", text: "Mình sẽ kiểm tra thông tin đơn hàng và hồ sơ của bạn. Trước tiên mình cần xác minh danh tính, sau đó tra cứu chính sách hoàn tiền hiện hành để…" }], stop_reason: "max_tokens", usage: { input_tokens: 1187, output_tokens: 40 } },
            hl: ["stop_reason"], fields: [["stop_reason", "<code>max_tokens</code>: Claude chưa nói xong — <b>không</b> phải hoàn thành, cũng không phải yêu cầu công cụ."], ["content", "Văn bản dở dang; nếu đang sinh tool_use thì khối đó có thể không đầy đủ."]],
            warn: "Code chỉ kiểm tra “có text không” sẽ coi đây là câu trả lời cuối và gửi câu cụt cho khách.",
          });
          s.push({
            from: "b", to: "c", kind: "req", label: "🔁 gọi lại", title: "Backend xử lý max_tokens: tăng trần và gọi lại", sub: "POST /v1/messages",
            backend: ["Không nối response bị cắt vào lịch sử.", "Tăng <code>max_tokens</code> (ở đây ×4) rồi gửi lại cùng messages.", "Ghi log để chỉnh cấu hình — max_tokens quá thấp là lỗi cấu hình, không phải lỗi model."],
            payload: { model: MODEL, max_tokens: 4096, system: "…như request #1…", tools: "[…4 công cụ như request #1…]", messages: [{ role: "user", content: "Tôi muốn hoàn tiền đơn #1234" }] }, hl: ["max_tokens"],
            lines: [13, 14],
          });
        }
        s.push({
          from: "c", to: "b", kind: "res", label: "📥 tool_use", title: "Response #1: vừa có text, vừa có tool_use", sub: "200 OK",
          payload: { id: "msg_01XFDUD", type: "message", role: "assistant", model: MODEL, content: [{ type: "text", text: "Mình kiểm tra thông tin của bạn trước nhé." }, { type: "tool_use", id: "toolu_01A", name: "get_customer", input: { order_id: "1234" } }], stop_reason: "tool_use", stop_sequence: null, usage: { input_tokens: 1187, output_tokens: 64 } },
          hl: ["stop_reason", "tool_use", "id", "input"],
          fields: [
            ["content[]", "Danh sách khối. Một response có thể chứa <b>cả</b> text lẫn tool_use."], ["tool_use.id", "Mã duy nhất (<code>toolu_…</code>). Backend phải trả lại đúng mã này trong <code>tool_result.tool_use_id</code>."],
            ["tool_use.name", "Công cụ Claude muốn chạy — khớp một <code>tools[].name</code>."], ["tool_use.input", "Tham số theo input_schema. Vẫn phải validate: schema không chặn được giá trị sai nghiệp vụ."],
            ["stop_reason", "<code>tool_use</code> → tiếp tục vòng lặp. Đây là tín hiệu điều khiển duy nhất đáng tin."], ["usage", "Token vào/ra để tính chi phí và theo dõi độ dài ngữ cảnh."],
          ],
          warn: "Response có text “Mình kiểm tra…” nhưng chưa xong. Dừng vòng lặp vì “có text” là anti-pattern kinh điển.",
          lines: [17, 21],
        });
        s.push({
          from: "b", to: "b", kind: "internal", title: "Backend đọc stop_reason và điều phối công cụ",
          backend: ["Nối <b>nguyên văn</b> <code>resp.content</code> vào messages với role assistant (giữ cả khối tool_use).", "<code>stop_reason == \"tool_use\"</code> → duyệt các khối tool_use.", "Tra bảng handler theo <code>name</code>; công cụ lạ → trả tool_result lỗi thay vì crash.", "Validate <code>input</code> (kiểu, định dạng order_id) và kiểm tra quyền của phiên."],
          lines: [15, 26], push: [{ r: "assistant", t: "text + tool_use <b>get_customer</b> (toolu_01A)" }],
        });
        s.push({ from: "b", to: "t", kind: "req", label: "🔎 CRM", title: "Backend gọi CRM thật", sub: "GET /crm/customers?order=1234", payload: { order_id: "1234" }, desc: "Đây là API nội bộ của bạn. Claude không biết URL, khóa hay cách xác thực của CRM.", lines: [26, 26] });
        s.push({ from: "t", to: "b", kind: "res", label: "✅ hồ sơ", title: "CRM trả hồ sơ khách", payload: { customer_id: "C-88", name: "Trần Lan", tier: "gold", email_verified: true, internal_notes: "…", marketing_flags: ["…"], created_at: 1704067200 }, desc: "Kết quả thô thường thừa trường. Nên lọc bớt trước khi đưa vào ngữ cảnh." });
        s.push({
          from: "b", to: "b", kind: "internal", title: "Đóng gói tool_result và nối vào messages",
          backend: ["Giữ lại trường cần thiết (customer_id, name, tier).", "Lưu <code>verified_customer_id = \"C-88\"</code> vào <b>trạng thái phiên phía server</b> — để cổng kiểm tra dùng sau.", "Tạo khối <code>tool_result</code> với <code>tool_use_id: \"toolu_01A\"</code>.", "Nối message <code>role: \"user\"</code> chứa tool_result (tool_result luôn nằm trong message user, ngay sau message assistant có tool_use)."],
          snippet: J({ role: "user", content: [{ type: "tool_result", tool_use_id: "toolu_01A", content: J({ customer_id: "C-88", name: "Trần Lan", tier: "gold" }) }] }),
          lines: [27, 33], push: [{ r: "tool", t: "toolu_01A → C-88, Trần Lan, gold" }],
        });
        s.push({
          from: "b", to: "c", kind: "req", label: "📤 request #2", title: "Request #2 — gửi lại TOÀN BỘ lịch sử", sub: "POST /v1/messages",
          payload: { model: MODEL, max_tokens: v === "mt" ? 4096 : 1024, system: "…như trước…", tools: "[…4 công cụ…]", messages: [{ role: "user", content: "Tôi muốn hoàn tiền đơn #1234" }, { role: "assistant", content: [{ type: "text", text: "Mình kiểm tra thông tin của bạn trước nhé." }, { type: "tool_use", id: "toolu_01A", name: "get_customer", input: { order_id: "1234" } }] }, { role: "user", content: [{ type: "tool_result", tool_use_id: "toolu_01A", content: "{\"customer_id\":\"C-88\",\"name\":\"Trần Lan\",\"tier\":\"gold\"}" }] }] },
          hl: ["tool_result", "tool_use_id", "messages"],
          note: "Messages API là <b>stateless</b>: mỗi lượt gửi lại system + tools + toàn bộ messages. Ngữ cảnh (và chi phí input) tăng dần theo số lượt — lý do cần prompt caching và cắt gọn kết quả công cụ.",
          lines: [6, 12],
        });
        s.push({
          from: "c", to: "b", kind: "res", label: "📥 2× tool_use", title: "Response #2: hai tool_use song song",
          payload: { id: "msg_02", role: "assistant", content: [{ type: "tool_use", id: "toolu_02B", name: "lookup_order", input: { order_id: "1234" } }, { type: "tool_use", id: "toolu_02C", name: "get_refund_policy", input: {} }], stop_reason: "tool_use", usage: { input_tokens: 1342, output_tokens: 71 } },
          hl: ["toolu_02B", "toolu_02C", "stop_reason"],
          fields: [["content[0], content[1]", "Hai việc độc lập → Claude xin chạy cùng lúc trong <b>một</b> response."], ["tool_choice.disable_parallel_tool_use", "Đặt <code>true</code> nếu muốn tối đa một tool_use mỗi lượt."]],
          lines: [21, 25], push: [{ r: "assistant", t: "tool_use ×2: <b>lookup_order</b>, <b>get_refund_policy</b>" }],
        });
        s.push({ from: "b", to: "t", kind: "req", label: "⚡ 2 lệnh song song", title: "Backend chạy hai công cụ đồng thời", backend: ["Có thể chạy tuần tự hoặc song song (asyncio.gather / Promise.all) — tùy bạn.", "Dù chạy kiểu nào, phải trả kết quả cho <b>mọi</b> tool_use."], lines: [23, 26] });
        if (v === "err") {
          s.push({ from: "t", to: "b", kind: "err", label: "⚠️ 503", title: "Order OK, nhưng Policy service timeout", payloads: [{ t: "lookup_order", d: { amount: 89, status: "delivered", days_since_delivery: 12 } }, { t: "get_refund_policy", d: "HTTP 503 Service Unavailable (timeout 5s)" }] });
          s.push({
            from: "b", to: "c", kind: "req", label: "📤 request #3", title: "Trả lỗi có cấu trúc qua tool_result.is_error",
            payload: { role: "user", content: [{ type: "tool_result", tool_use_id: "toolu_02B", content: "{\"amount\":89,\"status\":\"delivered\",\"days_since_delivery\":12}" }, { type: "tool_result", tool_use_id: "toolu_02C", is_error: true, content: "{\"errorCategory\":\"transient\",\"isRetryable\":true,\"message\":\"Policy service timeout sau 5s\"}" }] },
            hl: ["is_error", "isRetryable", "errorCategory"],
            fields: [["is_error", "Báo cho Claude đây là lỗi thực thi — Claude sẽ tự quyết thử lại, đổi cách hay báo người dùng."], ["content (lỗi)", "Mô tả cụ thể + phân loại giúp Claude phục hồi đúng. Đừng throw exception làm sập vòng lặp."]],
            warn: "Trả <code>[]</code> hoặc bỏ qua tool_result của toolu_02C → API báo lỗi (thiếu kết quả cho tool_use) hoặc Claude hiểu nhầm là không có chính sách.",
            push: [{ r: "tool", t: "toolu_02B → $89, giao 12 ngày" }, { r: "err", t: "toolu_02C → is_error: transient timeout" }],
          });
          s.push({ from: "c", to: "b", kind: "res", label: "📥 thử lại", title: "Claude tự thử lại công cụ lỗi tạm thời", payload: { content: [{ type: "tool_use", id: "toolu_03R", name: "get_refund_policy", input: {} }], stop_reason: "tool_use" }, desc: "Nhờ <code>isRetryable: true</code>, Claude chọn gọi lại. Nếu là lỗi nghiệp vụ, nó sẽ giải thích cho khách thay vì thử lại.", push: [{ r: "assistant", t: "tool_use <b>get_refund_policy</b> (thử lại)" }] });
          s.push({ from: "b", to: "c", kind: "req", label: "📤 kết quả", title: "Lần này policy trả về thành công", payload: { role: "user", content: [{ type: "tool_result", tool_use_id: "toolu_03R", content: "{\"max_days\":30,\"auto_limit_usd\":500}" }] }, push: [{ r: "tool", t: "toolu_03R → hạn 30 ngày, hạn mức $500" }] });
        } else {
          s.push({ from: "t", to: "b", kind: "res", label: "✅ 2 kết quả", title: "Cả hai công cụ trả về", payloads: [{ t: "lookup_order", d: { amount: 89, status: "delivered", days_since_delivery: 12 } }, { t: "get_refund_policy", d: { max_days: 30, auto_limit_usd: 500 } }] });
          s.push({
            from: "b", to: "c", kind: "req", label: "📤 request #3", title: "MỘT message user chứa CẢ HAI tool_result", sub: "POST /v1/messages",
            payload: { role: "user", content: [{ type: "tool_result", tool_use_id: "toolu_02B", content: "{\"amount\":89,\"status\":\"delivered\",\"days_since_delivery\":12}" }, { type: "tool_result", tool_use_id: "toolu_02C", content: "{\"max_days\":30,\"auto_limit_usd\":500}" }] },
            hl: ["tool_use_id"], payloadTitle: "Message mới được nối (phần còn lại của request như trước)",
            warn: "Tách thành hai message user riêng biệt là lỗi hay gặp: các tool_result của cùng một lượt phải nằm chung một message, đặt đầu tiên trong content.",
            lines: [33, 33], push: [{ r: "tool", t: "toolu_02B → $89 · toolu_02C → hạn 30 ngày" }],
          });
        }
        s.push({ from: "c", to: "b", kind: "res", label: "📥 process_refund", title: "Response: xin hoàn tiền", payload: { content: [{ type: "tool_use", id: "toolu_04D", name: "process_refund", input: { order_id: "1234", amount: 89 } }], stop_reason: "tool_use" }, hl: ["process_refund", "amount"], push: [{ r: "assistant", t: "tool_use <b>process_refund</b>($89)" }] });
        s.push({
          from: "b", to: "t", kind: "req", label: "💳 refund", title: "Cổng kiểm tra bằng code rồi mới gọi Billing", sub: "POST /billing/refunds",
          backend: ["<b>Gate 1</b>: phiên có <code>verified_customer_id</code>? ✓ (do backend lưu từ CRM, không tin tham số model gửi).", "<b>Gate 2</b>: amount ($89) ≤ hạn mức $500? ✓", "<b>Gate 3</b>: 12 ngày ≤ 30 ngày? ✓", "Gọi Billing với idempotency key = <code>toolu_04D</code> để retry không hoàn tiền hai lần."],
          snippet: "def run_tool(sid, name, inp):\n    if name == \"process_refund\":\n        if not session[sid].verified_customer_id:\n            return Err(\"permission\", \"Chưa xác minh khách\")\n        if inp[\"amount\"] > POLICY.auto_limit:\n            return Err(\"business\", \"Vượt hạn mức → escalate\")\n    return HANDLERS[name](**inp)",
          lines: [26, 26],
        });
        s.push({ from: "t", to: "b", kind: "res", label: "✅ R-551", title: "Billing xác nhận", payload: { refund_id: "R-551", status: "ok", eta_days: "3-5" } });
        s.push({ from: "b", to: "c", kind: "req", label: "📤 request cuối", title: "Gửi tool_result của process_refund", payload: { role: "user", content: [{ type: "tool_result", tool_use_id: "toolu_04D", content: "{\"refund_id\":\"R-551\",\"status\":\"ok\",\"eta_days\":\"3-5\"}" }] }, push: [{ r: "tool", t: "toolu_04D → R-551 ok" }] });
        s.push({
          from: "c", to: "b", kind: "ok", label: "🏁 end_turn", title: "Response cuối: stop_reason = \"end_turn\"",
          payload: { content: [{ type: "text", text: "Đã hoàn $89 cho đơn #1234 (mã R-551). Tiền về thẻ trong 3–5 ngày làm việc." }], stop_reason: "end_turn", usage: { input_tokens: 1702, output_tokens: 41 } },
          hl: ["end_turn"], fields: [["stop_reason: end_turn", "Claude tự kết thúc lượt — tín hiệu thoát vòng lặp."], ["usage.input_tokens", "Tăng dần qua từng lượt vì lịch sử ngày càng dài."]],
          lines: [17, 19], push: [{ r: "assistant", t: "“Đã hoàn $89… mã R-551” <b>(end_turn)</b>" }],
        });
        s.push({ from: "b", to: "u", kind: "ok", label: "💬 trả lời", title: "Backend lưu lịch sử và trả lời khách", payload: { reply: "Đã hoàn $89 cho đơn #1234 (mã R-551). Tiền về thẻ trong 3–5 ngày làm việc." }, backend: ["<code>store.save(session_id, messages)</code> để lượt chat sau tiếp tục được.", "Chỉ gửi phần text cho khách — không lộ khối tool_use/tool_result.", "Ghi audit log: ai, hoàn bao nhiêu, mã nào."], lines: [18, 19] });
        return s;
      },
    }),
  };

  /* ───────── 1-3 Coordinator gọi subagent qua Task ───────── */
  W.subagentTrace = {
    title: "Coordinator → Task → subagent: ai nhìn thấy gì?",
    render: trace({
      intro: "Theo dõi <b>ngữ cảnh</b> của coordinator (khung bên phải). Subagent chạy trong ngữ cảnh riêng: coordinator chỉ nhận lại <b>kết quả cuối</b> của subagent, không nhận các bước trung gian.",
      actors: [
        { id: "a", icon: "🖥️", name: "Ứng dụng", sub: "gọi query()" },
        { id: "c", icon: "🧭", name: "Coordinator", sub: "Claude + allowedTools" },
        { id: "s", icon: "⚙️", name: "Agent SDK", sub: "runtime công cụ Task" },
        { id: "r", icon: "🔎", name: "Subagent search", sub: "ngữ cảnh riêng" },
        { id: "y", icon: "📝", name: "Subagent synth", sub: "ngữ cảnh riêng" },
      ],
      stateTitle: "🧭 Ngữ cảnh của coordinator",
      controls: [
        { id: "par", type: "toggle", label: "Phát 4 lệnh Task trong <b>cùng một</b> response", value: true },
        { id: "full", type: "toggle", label: "Prompt cho subagent tự đầy đủ", value: true },
      ],
      steps: ({ par, full }) => {
        const s = [];
        s.push({
          from: "a", to: "c", kind: "req", label: "🚀 query()", title: "Ứng dụng khởi động coordinator với định nghĩa subagent",
          payload: { prompt: "Nghiên cứu tác động của AI tới các ngành sáng tạo. Báo cáo có trích nguồn.", options: { systemPrompt: "Bạn là coordinator nghiên cứu. Phân rã chủ đề bao phủ ĐỦ các mảng, ủy thác cho subagent, tổng hợp và ghi chú độ bao phủ.", allowedTools: ["Task"], agents: { search: { description: "Tìm & đọc nguồn web cho MỘT mảng chủ đề.", prompt: "Bạn là chuyên gia tìm kiếm. Trả JSON {findings:[{claim, quote, url, date}]}.", tools: ["WebSearch", "WebFetch"], model: "haiku" }, synth: { description: "Tổng hợp phát hiện đã có thành báo cáo. KHÔNG tìm kiếm thêm.", prompt: "Viết báo cáo, giữ nguyên trích dẫn, nêu mâu thuẫn.", tools: [] } } } },
          hl: ["allowedTools", "agents", "description", "tools"],
          fields: [["allowedTools: [\"Task\"]", "Thiếu \"Task\" → coordinator không thể tạo subagent nào."], ["agents.*.description", "Coordinator đọc mô tả này để chọn subagent — giống description của công cụ."], ["agents.*.tools", "Giới hạn công cụ theo vai trò: synth không có WebSearch nên không “đi lạc” đi tìm thêm."], ["agents.*.model", "Có thể dùng model nhỏ/rẻ cho subagent đơn giản."]],
          push: [{ r: "sys", t: "system + mô tả công cụ Task (liệt kê search, synth)" }, { r: "user", t: "Nghiên cứu tác động của AI tới các ngành sáng tạo…" }],
        });
        s.push({ from: "c", to: "c", kind: "internal", title: "Coordinator phân rã chủ đề", desc: "Chia thành 4 mảng: nghệ thuật thị giác, âm nhạc, văn học, điện ảnh. Đây là điểm dễ hỏng nhất: phân rã thiếu mảng → báo cáo thiếu dù mọi subagent làm đúng.", note: "Kiểm tra độ bao phủ ở bước phân rã (danh sách mảng có đủ không) rẻ hơn nhiều so với sửa báo cáo cuối." });
        const task = (topic, id) => ({ type: "tool_use", id, name: "Task", input: { description: "Tìm: AI & " + topic, subagent_type: "search", prompt: full ? `Mục tiêu: thu thập bằng chứng về tác động của AI tới ${topic} (2023–2026). Bao phủ: việc làm, bản quyền, công cụ phổ biến. Trả JSON {findings:[{claim, quote, url, date}]}, tối đa 8 phát hiện, ưu tiên nguồn gốc.` : "Hãy làm phần việc của bạn." } });
        if (par) {
          s.push({
            from: "c", to: "s", kind: "res", label: "📥 4× Task", title: "Một response chứa 4 lệnh Task → chạy song song",
            payload: { content: [task("nghệ thuật thị giác", "toolu_T1"), task("âm nhạc", "toolu_T2"), task("văn học", "toolu_T3"), task("điện ảnh", "toolu_T4")], stop_reason: "tool_use" },
            hl: ["Task", "subagent_type", "prompt"],
            fields: [["name: \"Task\"", "Gọi subagent cũng chỉ là một tool_use — SDK là “backend” chạy nó."], ["input.subagent_type", "Chọn AgentDefinition nào."], ["input.prompt", "<b>Toàn bộ</b> thông tin subagent sẽ có. Không có gì khác được kế thừa."]],
            push: [{ r: "assistant", t: "tool_use Task ×4 (T1–T4) — cùng một lượt" }],
          });
        } else {
          s.push({ from: "c", to: "s", kind: "warn", label: "📥 1× Task", title: "Chỉ một lệnh Task mỗi lượt → tuần tự", payload: { content: [task("nghệ thuật thị giác", "toolu_T1")], stop_reason: "tool_use" }, warn: "4 mảng độc lập nhưng phải chờ 4 lượt nối tiếp: độ trễ ≈ tổng thời gian 4 subagent thay vì bằng subagent chậm nhất.", push: [{ r: "assistant", t: "tool_use Task T1 (rồi T2, T3, T4 ở các lượt sau…)" }] });
        }
        s.push({
          from: "s", to: "s", kind: "internal", title: "SDK tạo ngữ cảnh MỚI cho mỗi subagent",
          backend: ["system = <code>agents.search.prompt</code> (không phải system của coordinator).", "tools = chỉ <code>WebSearch, WebFetch</code>.", "messages = <code>[{role:\"user\", content: Task.input.prompt}]</code> — <b>một</b> message duy nhất.", "Không sao chép lịch sử coordinator, không chia sẻ bộ nhớ giữa các subagent."],
        });
        s.push({
          from: "s", to: "r", kind: "req", label: "📤 prompt", title: "Thứ duy nhất subagent nhìn thấy",
          payload: { system: "Bạn là chuyên gia tìm kiếm. Trả JSON {findings:[{claim, quote, url, date}]}.", tools: ["WebSearch", "WebFetch"], messages: [{ role: "user", content: task("âm nhạc", "x").input.prompt }] },
          hl: ["messages"],
          warn: full ? null : "Prompt “Hãy làm phần việc của bạn.” — subagent không biết chủ đề, phạm vi, định dạng. Kết quả: lan man hoặc sai mảng.",
          note: full ? "Prompt tự đầy đủ: mục tiêu, phạm vi, định dạng đầu ra, giới hạn — subagent làm được việc mà không cần hỏi lại." : null,
        });
        s.push({ from: "r", to: "r", kind: "internal", title: "Subagent chạy vòng lặp agent của riêng nó", desc: "WebSearch → WebFetch ×5 → … khoảng 30.000 token kết quả trung gian. Tất cả nằm trong ngữ cảnh của subagent, <b>không</b> làm phình ngữ cảnh coordinator." });
        s.push({ from: "r", to: "s", kind: "res", label: "📦 findings", title: "Subagent trả kết quả cuối (có metadata nguồn)", payload: { findings: [{ claim: "Doanh thu nhạc tạo bởi AI tăng mạnh trên nền tảng streaming", quote: "…", url: "https://example.org/music-report-2025", date: "2025-09" }, { claim: "Tranh chấp bản quyền giọng hát AI", quote: "…", url: "https://example.org/voice-case", date: "2026-02" }] }, hl: ["url", "date"] });
        s.push({
          from: "s", to: "c", kind: "res", label: "📥 tool_result ×4", title: "SDK trả kết quả về coordinator dưới dạng tool_result",
          payload: { role: "user", content: [{ type: "tool_result", tool_use_id: "toolu_T1", content: "{findings:[…thị giác…]}" }, { type: "tool_result", tool_use_id: "toolu_T2", content: "{findings:[…âm nhạc…]}" }, "…T3, T4…"] },
          note: "Coordinator nhận ~2.000 token kết quả gọn thay vì ~120.000 token trung gian của 4 subagent.",
          push: [{ r: "tool", t: "T1–T4 → findings (url, date) — chỉ kết quả cuối" }],
        });
        s.push({
          from: "c", to: "s", kind: "res", label: "📥 Task synth", title: "Coordinator ủy thác tổng hợp — phải chuyển dữ liệu tường minh",
          payload: { content: [{ type: "tool_use", id: "toolu_S1", name: "Task", input: { subagent_type: "synth", description: "Tổng hợp báo cáo", prompt: "Mục tiêu: báo cáo tác động của AI tới 4 ngành sáng tạo.\nDữ liệu (giữ nguyên url/date khi trích):\n<findings area=\"âm nhạc\">[…]</findings>\n<findings area=\"văn học\">[…]</findings>…\nYêu cầu: mỗi nhận định kèm nguồn; nêu rõ mâu thuẫn; ghi chú mảng thiếu dữ liệu." } }], stop_reason: "tool_use" },
          hl: ["prompt"], warn: "Synth KHÔNG thấy kết quả của search nếu coordinator không dán chúng vào prompt — không có “bộ nhớ dùng chung”.",
          push: [{ r: "assistant", t: "tool_use Task synth (prompt chứa toàn bộ findings)" }],
        });
        s.push({ from: "s", to: "y", kind: "req", label: "📤 prompt", title: "SDK khởi tạo subagent synth (ngữ cảnh mới)", desc: "Không có WebSearch trong tools → synth không thể tự đi tìm thêm, buộc làm đúng vai trò." });
        s.push({ from: "y", to: "s", kind: "res", label: "📄 báo cáo", title: "Synth trả báo cáo", payload: { report_md: "## Âm nhạc\n- … [nguồn: example.org/music-report-2025, 2025-09]\n## Ghi chú độ bao phủ\n- Điện ảnh: chỉ 2 nguồn, cần bổ sung." } });
        s.push({ from: "s", to: "c", kind: "res", label: "📥 tool_result", title: "Coordinator nhận báo cáo, kết thúc lượt", push: [{ r: "tool", t: "S1 → báo cáo + ghi chú độ bao phủ" }, { r: "assistant", t: "Tóm tắt cuối <b>(end_turn)</b>" }] });
        s.push({ from: "c", to: "a", kind: "ok", label: "🏁 result", title: "SDK phát message kết quả cho ứng dụng", payload: { type: "result", subtype: "success", is_error: false, num_turns: par ? 4 : 7, duration_ms: par ? 48210 : 151930, total_cost_usd: 0.41, result: "## Báo cáo…" }, hl: ["num_turns", "duration_ms"], fields: [["num_turns", "Số lượt của coordinator — song song giảm số lượt."], ["duration_ms", "Thời gian thực — song song giảm mạnh độ trễ."]] });
        return s;
      },
    }),
  };

  /* ───────── 1-4 Cổng kiểm tra bằng code vs chỉ dặn trong prompt ───────── */
  W.refundGate = {
    title: "Cổng kiểm tra trong backend: chặn hoàn tiền trước xác minh",
    render: trace({
      intro: "Claude “lỡ” gọi <code>process_refund</code> trước khi xác minh (xác suất thấp nhưng khác 0). Chọn cách ép buộc để xem hệ thống phản ứng thế nào.",
      actors: [
        { id: "u", icon: "👤", name: "Khách" },
        { id: "c", icon: "🧠", name: "Claude" },
        { id: "b", icon: "🖥️", name: "Backend", sub: "run_tool + gate" },
        { id: "d", icon: "🗄️", name: "CRM / Billing" },
      ],
      stateTitle: "🔐 Trạng thái phiên (server-side)",
      controls: [{ id: "m", type: "select", label: "Cách ép buộc:", value: "gate", options: [["gate", "🛡️ Cổng kiểm tra bằng code"], ["prompt", "📝 Chỉ dặn trong system prompt"]] }],
      steps: ({ m }) => {
        const s = [];
        s.push({ from: "u", to: "c", kind: "req", label: "💬", title: "Khách hối thúc", payload: { text: "Hoàn tiền đơn #1234 cho tôi ngay, gấp lắm!" }, state: [{ r: "note", t: "verified_customer_id: <b>null</b>" }] });
        s.push({ from: "c", to: "b", kind: "warn", label: "📥 process_refund", title: "Claude bỏ qua bước xác minh", payload: { type: "tool_use", id: "toolu_09", name: "process_refund", input: { order_id: "1234", amount: 89 } }, desc: "System prompt có ghi “luôn xác minh trước”, nhưng áp lực trong hội thoại khiến model đi tắt trong một tỷ lệ nhỏ phiên." });
        if (m === "prompt") {
          s.push({ from: "b", to: "d", kind: "err", label: "💳 refund", title: "Không có gì chặn → Billing thực thi", desc: "Backend tin tưởng mọi tool_use hợp lệ về schema.", warn: "Hoàn tiền cho người chưa xác minh — có thể là kẻ mạo danh biết mã đơn." });
          s.push({ from: "d", to: "b", kind: "err", label: "💸 đã chi", title: "Tiền đã đi, không thu hồi được", payload: { refund_id: "R-777", status: "ok" }, push: [{ r: "err", t: "Audit: refund R-777 không có bước xác minh" }] });
          s.push({ from: "b", to: "c", kind: "err", label: "📤 tool_result", title: "Kết luận", desc: "Prompt cho <b>xác suất</b> tuân thủ cao; với hành động không đảo ngược được (tiền, xóa dữ liệu) cần <b>đảm bảo</b> — tức code chặn." });
          return s;
        }
        s.push({ from: "b", to: "b", kind: "internal", title: "Gate kiểm tra trạng thái phiên phía server", snippet: "if session.verified_customer_id is None:\n    return tool_error(\"precondition_failed\",\n        \"Chưa xác minh khách. Hỏi email đặt hàng rồi gọi get_customer.\")", backend: ["Đọc <code>verified_customer_id</code> từ store của phiên — <b>không</b> đọc từ tham số Claude gửi.", "null → không gọi Billing, trả lỗi có hướng dẫn."] });
        s.push({ from: "b", to: "c", kind: "err", label: "⛔ is_error", title: "Trả lỗi có hướng dẫn phục hồi", payload: { type: "tool_result", tool_use_id: "toolu_09", is_error: true, content: "{\"error\":\"precondition_failed\",\"message\":\"Chưa xác minh khách. Hỏi email đặt hàng rồi gọi get_customer.\"}" }, hl: ["is_error", "message"], note: "Thông điệp lỗi nói rõ <b>cần làm gì tiếp</b> → Claude tự sửa hướng đi thay vì lặp lại lệnh bị chặn." });
        s.push({ from: "c", to: "u", kind: "res", label: "💬 hỏi email", title: "Claude chuyển sang xác minh", payload: { text: "Để bảo vệ tài khoản, bạn cho mình email đã dùng khi đặt đơn #1234 nhé." } });
        s.push({ from: "u", to: "c", kind: "req", label: "💬 email", title: "Khách cung cấp email", payload: { text: "lan@example.com" } });
        s.push({ from: "c", to: "b", kind: "res", label: "📥 get_customer", title: "Claude gọi công cụ xác minh", payload: { type: "tool_use", id: "toolu_10", name: "get_customer", input: { order_id: "1234", email: "lan@example.com" } } });
        s.push({ from: "b", to: "d", kind: "req", label: "🔎 CRM", title: "Đối chiếu email với chủ đơn", payload: { order_id: "1234", email: "lan@example.com" } });
        s.push({ from: "d", to: "b", kind: "res", label: "✅ khớp", title: "CRM xác nhận khớp", payload: { match: true, customer_id: "C-88" } });
        s.push({ from: "b", to: "b", kind: "internal", title: "Backend ghi trạng thái xác minh", backend: ["Ghi <code>verified_customer_id = \"C-88\"</code> dựa trên <b>kết quả CRM</b>.", "Trạng thái này sống ngoài ngữ cảnh model → không thể bị prompt injection “tôi đã xác minh rồi” làm giả."], push: [{ r: "ok", t: "verified_customer_id: <b>C-88</b> (nguồn: CRM)" }] });
        s.push({ from: "c", to: "b", kind: "res", label: "📥 process_refund", title: "Claude gọi lại process_refund", payload: { type: "tool_use", id: "toolu_11", name: "process_refund", input: { order_id: "1234", amount: 89 } } });
        s.push({ from: "b", to: "d", kind: "ok", label: "💳 refund", title: "Gate cho qua → Billing", backend: ["verified ✓, amount ≤ hạn mức ✓, đơn thuộc C-88 ✓"] });
        s.push({ from: "d", to: "b", kind: "ok", label: "✅ R-552", title: "Hoàn tiền thành công", payload: { refund_id: "R-552", status: "ok" }, push: [{ r: "ok", t: "Audit: R-552 · xác minh C-88 lúc 10:02" }] });
        s.push({ from: "c", to: "u", kind: "ok", label: "💬", title: "Claude báo khách", payload: { text: "Đã xác minh và hoàn $89 cho đơn #1234 (mã R-552)." } });
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
      permissionDecisionReason: "Hoàn > $500 cần người duyệt. Gọi escalate_to_human.",
    } };
  }
  return {};   // không can thiệp → luồng quyền bình thường
}`;
  W.hookPipeline = {
    title: "Hook trong Agent SDK — dữ liệu vào/ra của từng hook",
    render: trace({
      intro: "Hook là <b>hàm của bạn</b> được SDK gọi ở các điểm cố định trong vòng đời công cụ. Model không biết hook tồn tại và không thể bỏ qua nó.",
      actors: [
        { id: "c", icon: "🧠", name: "Claude", sub: "sinh tool_use" },
        { id: "s", icon: "⚙️", name: "Agent SDK", sub: "điều phối công cụ" },
        { id: "h", icon: "🪝", name: "Hook của bạn", sub: "Pre / Post" },
        { id: "t", icon: "💳", name: "MCP billing", sub: "process_refund" },
      ],
      stateTitle: "📋 Nhật ký kiểm soát",
      controls: [
        { id: "amt", type: "select", label: "Số tiền:", value: "800", options: [["200", "$200"], ["450", "$450"], ["800", "$800 (vượt $500)"]] },
        { id: "fmt", type: "select", label: "Công cụ trả ngày dạng:", value: "unix", options: [["unix", "Unix timestamp"], ["vn", "dd/mm/yyyy"], ["iso", "ISO 8601"]] },
        { id: "pre", type: "toggle", label: "Bật PreToolUse", value: true },
        { id: "post", type: "toggle", label: "Bật PostToolUse", value: true },
      ],
      steps: ({ amt, fmt, pre, post }) => {
        const a = +amt, raw = { unix: 1767225600, vn: "01/01/2026", iso: "2026-01-01T00:00:00Z" }[fmt];
        const s = [];
        const tu = { type: "tool_use", id: "toolu_07", name: "mcp__billing__process_refund", input: { order_id: "1234", amount: a } };
        s.push({ from: "c", to: "s", kind: "res", label: "📥 tool_use", title: "Claude xin chạy process_refund", payload: tu, hl: ["name", "amount"], fields: [["name", "Công cụ MCP có tên dạng <code>mcp__&lt;server&gt;__&lt;tool&gt;</code> — matcher của hook so khớp tên này (hỗ trợ regex)."]], state: [] });
        s.push({ from: "s", to: "s", kind: "internal", title: "SDK tìm hook khớp matcher", snippet: HOOK_CFG, backend: ["Duyệt <code>hooks.PreToolUse</code>, so <code>matcher</code> với tên công cụ.", pre ? "Khớp <code>refundLimit</code> → gọi trước khi thực thi." : "PreToolUse đang tắt → không có gì kiểm tra."] });
        if (pre) {
          s.push({ from: "s", to: "h", kind: "req", label: "📤 hook input", title: "SDK gửi dữ liệu cho PreToolUse", payload: { session_id: "sess_42", transcript_path: "/…/sess_42.jsonl", cwd: "/app", hook_event_name: "PreToolUse", tool_name: "mcp__billing__process_refund", tool_input: { order_id: "1234", amount: a } }, hl: ["hook_event_name", "tool_name", "tool_input"], fields: [["hook_event_name", "Sự kiện nào kích hoạt hook."], ["tool_name", "Tên đầy đủ của công cụ."], ["tool_input", "Tham số Claude định truyền — hook đọc được, có thể chặn hoặc sửa (<code>updatedInput</code>)."], ["transcript_path", "Đường dẫn transcript nếu hook cần xem lịch sử."]] });
          if (a > 500) {
            s.push({ from: "h", to: "s", kind: "err", label: "⛔ deny", title: "Hook trả quyết định deny", payload: { hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: "Hoàn > $500 cần người duyệt. Gọi escalate_to_human." } }, hl: ["permissionDecision", "permissionDecisionReason"], fields: [["permissionDecision", "<code>allow</code> (cho qua, bỏ hỏi quyền) · <code>deny</code> (chặn) · <code>ask</code> (hỏi người dùng)."], ["permissionDecisionReason", "Với deny: lý do được chuyển cho Claude để nó đổi hướng."]], push: [{ r: "err", t: `PreToolUse chặn hoàn $${a} (> $500)` }] });
            s.push({ from: "s", to: "c", kind: "err", label: "📤 tool_result lỗi", title: "Công cụ KHÔNG chạy; Claude nhận lý do", payload: { type: "tool_result", tool_use_id: "toolu_07", is_error: true, content: "Hoàn > $500 cần người duyệt. Gọi escalate_to_human." }, hl: ["is_error"] });
            s.push({ from: "c", to: "s", kind: "ok", label: "📥 escalate", title: "Claude chuyển sang quy trình escalate", payload: { type: "tool_use", id: "toolu_08", name: "escalate_to_human", input: { customer_id: "C-88", order_id: "1234", amount: a, reason: "Vượt hạn mức tự động $500", recommended_action: "Duyệt hoàn tiền toàn phần" } }, push: [{ r: "ok", t: "Ticket duyệt tay được tạo — chính sách được giữ" }] });
            return s;
          }
          s.push({ from: "h", to: "s", kind: "ok", label: "✅ {}", title: "Hook không phản đối", payload: {}, desc: "Trả object rỗng = không can thiệp, công cụ chạy tiếp.", push: [{ r: "ok", t: `PreToolUse: $${a} ≤ $500, cho qua` }] });
        } else if (a > 500) {
          s.push({ from: "s", to: "s", kind: "err", title: "Không có hook → không ai chặn", warn: `Hoàn $${a} sẽ được thực thi dù chính sách yêu cầu người duyệt.`, push: [{ r: "err", t: `Vi phạm: hoàn $${a} không qua duyệt` }] });
        }
        s.push({ from: "s", to: "t", kind: "req", label: "📤 tools/call", title: "SDK gọi công cụ MCP", payload: { jsonrpc: "2.0", id: 31, method: "tools/call", params: { name: "process_refund", arguments: { order_id: "1234", amount: a } } } });
        s.push({ from: "t", to: "s", kind: "res", label: "📥 kết quả", title: "Công cụ trả ngày theo định dạng riêng", payload: { content: [{ type: "text", text: JSON.stringify({ refund_id: "R-9", processed_at: raw }) }] }, hl: ["text"], desc: fmt === "iso" ? "Đã là ISO 8601." : "Định dạng khác các công cụ khác (đơn hàng dùng ISO) → model dễ so sánh ngày sai." });
        if (post) {
          s.push({ from: "s", to: "h", kind: "req", label: "📤 hook input", title: "SDK gọi PostToolUse kèm tool_response", payload: { hook_event_name: "PostToolUse", tool_name: "mcp__billing__process_refund", tool_input: { order_id: "1234", amount: a }, tool_response: { refund_id: "R-9", processed_at: raw } }, hl: ["tool_response"] });
          s.push({ from: "h", to: "s", kind: "ok", label: "🧹 chuẩn hóa", title: fmt === "iso" ? "Không cần đổi" : "Hook thay output bằng bản đã chuẩn hóa", payload: fmt === "iso" ? {} : { hookSpecificOutput: { hookEventName: "PostToolUse", updatedMCPToolOutput: { refund_id: "R-9", processed_at: "2026-01-01T00:00:00Z" } } }, hl: ["updatedMCPToolOutput"], note: "Trường thay output chỉ áp dụng cho công cụ MCP (đối chiếu phiên bản SDK). Với công cụ thường: chuẩn hóa ngay trong wrapper của công cụ, hoặc trả <code>additionalContext</code> để bổ sung thông tin cho Claude.", push: [{ r: "ok", t: `PostToolUse: "${raw}" → ISO 8601` }] });
        }
        const out = post || fmt === "iso" ? "2026-01-01T00:00:00Z" : raw;
        s.push({ from: "s", to: "c", kind: "res", label: "📤 tool_result", title: "Claude nhận kết quả", payload: { type: "tool_result", tool_use_id: "toolu_07", content: JSON.stringify({ refund_id: "R-9", processed_at: out }) }, warn: !post && fmt !== "iso" ? "Không chuẩn hóa: Claude phải tự đoán định dạng — dặn trong prompt chỉ cho tuân thủ xác suất." : null });
        return s;
      },
    }),
  };

  /* ───────── 1-6 Quản lý phiên: resume, fork, phiên mới ───────── */
  W.sessionBranches = {
    title: "Resume, fork hay phiên mới? (sơ đồ nhánh phiên)",
    render(el) {
      const modes = {
        resume: { cmd: "claude --resume auth-investigation", desc: "Tiếp tục đúng lịch sử cũ. Hợp khi codebase <b>chưa đổi</b> từ lần trước.", risk: "Kết quả Read/Grep cũ vẫn nằm trong ngữ cảnh — nếu file đã bị refactor, Claude lập luận trên dữ liệu lỗi thời." },
        fork: { cmd: "query(prompt, { resume: sessionId, forkSession: true })", desc: "Tách nhánh từ một baseline chung để thử 2 hướng độc lập (A: Redis cache, B: in-memory). Nhánh này không làm bẩn nhánh kia.", risk: "Fork vẫn kế thừa mọi kết quả cũ của baseline — không giải quyết vấn đề dữ liệu lỗi thời." },
        fresh: { cmd: "claude  # phiên mới + dán summary.md", desc: "Bắt đầu sạch với bản tóm tắt phát hiện + danh sách file đã thay đổi. Hợp khi code đổi nhiều hoặc ngữ cảnh cũ đã phình to.", risk: "Phải viết tóm tắt tốt: thiếu dữ kiện quan trọng thì phải điều tra lại." },
      };
      let cur = "resume";
      const dot = (x, y, c, t) => `<g><circle cx="${x}" cy="${y}" r="9" fill="${c}"/>${t ? `<text x="${x}" y="${y + 26}" text-anchor="middle" style="font-size:10.5px">${t}</text>` : ""}</g>`;
      const draw = () => {
        const m = modes[cur];
        const base = [60, 120, 180, 240].map((x, k) => dot(x, 60, "var(--c-violet)", k === 0 ? "baseline" : "")).join("");
        let extra = "";
        if (cur === "resume") extra = `<line x1="240" y1="60" x2="480" y2="60" stroke="var(--c-violet)" stroke-width="3" stroke-dasharray="6 4"><animate attributeName="stroke-dashoffset" from="20" to="0" dur="1s" repeatCount="indefinite"/></line>${dot(320, 60, "var(--warn)", "Read cũ ⚠️")}${dot(400, 60, "var(--c-violet)", "")}${dot(480, 60, "var(--c-violet)", "tiếp tục")}<text x="360" y="22" text-anchor="middle" style="font-size:11px;fill:var(--muted)">cùng một lịch sử</text>`;
        if (cur === "fork") extra = `<path d="M240 60 C 290 60, 290 20, 340 20 L 480 20" fill="none" stroke="var(--c-teal)" stroke-width="3"/><path d="M240 60 C 290 60, 290 100, 340 100 L 480 100" fill="none" stroke="var(--c-orange)" stroke-width="3"/>${dot(400, 20, "var(--c-teal)", "")}${dot(480, 20, "var(--c-teal)", "")}<text x="490" y="24" style="font-size:11px">A: Redis</text>${dot(400, 100, "var(--c-orange)", "")}${dot(480, 100, "var(--c-orange)", "")}<text x="490" y="104" style="font-size:11px">B: in-memory</text>`;
        if (cur === "fresh") extra = `<line x1="240" y1="60" x2="290" y2="60" stroke="var(--border)" stroke-width="2"/><text x="268" y="44" text-anchor="middle" style="font-size:16px">✂️</text><rect x="300" y="44" width="90" height="32" rx="8" fill="var(--accent-soft)" stroke="var(--accent)"/><text x="345" y="64" text-anchor="middle" style="font-size:11px;font-weight:700">📝 summary.md</text><line x1="390" y1="60" x2="480" y2="60" stroke="var(--ok)" stroke-width="3"/>${dot(430, 60, "var(--ok)", "")}${dot(480, 60, "var(--ok)", "phiên mới")}`;
        el.innerHTML = `<div class="compare-tabs">${[["resume", "🔁 --resume"], ["fork", "🌿 fork_session"], ["fresh", "🆕 Phiên mới + tóm tắt"]].map(([k, l]) => `<button class="${k === cur ? "on" : ""}" data-k="${k}">${l}</button>`).join("")}</div>
          <svg viewBox="0 0 580 130" style="width:100%;max-height:170px"><line x1="60" y1="60" x2="240" y2="60" stroke="var(--c-violet)" stroke-width="3"/>${base}${extra}</svg>
          <pre><code>${window.SIM.esc(m.cmd)}</code></pre>
          <div class="msg tool"><span class="who">Khi nào dùng</span>${m.desc}</div><div class="msg err" style="margin-top:6px"><span class="who">Rủi ro</span>${m.risk}</div>`;
        el.querySelectorAll("[data-k]").forEach((b) => (b.onclick = () => { cur = b.dataset.k; draw(); }));
      };
      draw();
    },
  };
})();
