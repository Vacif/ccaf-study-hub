/* Mô phỏng chi tiết — Chương 0: Kiến thức nền */
(function () {
  const { trace } = window.SIM;
  const W = window.WIDGETS;

  /* ───────── 0-0 Một lần gọi Claude API ───────── */
  W.apiBasics = {
    title: "Một lần gọi Claude API, từ lúc gửi tới lúc nhận",
    render: trace({
      intro: "Chương trình của một cửa hàng hỏi Claude một câu. Theo dõi request đi tới Anthropic và response quay về, xem từng trường nghĩa là gì và tiền được tính thế nào. Đổi tình huống để thấy chuyện gì xảy ra khi câu trả lời bị cắt, hoặc khi khách hỏi tiếp.",
      actors: [
        { id: "a", icon: "👩‍💻", name: "Chương trình của bạn", sub: "chạy trên máy chủ của bạn" },
        { id: "c", icon: "🧠", name: "Claude API", sub: "máy chủ của Anthropic" },
      ],
      stateTitle: "Lịch sử chương trình đang giữ",
      controls: [{ id: "k", type: "select", label: "Tình huống:", value: "ok", options: [["ok", "Một câu hỏi bình thường"], ["cut", "max_tokens đặt quá thấp"], ["turn2", "Khách hỏi tiếp lượt thứ hai"]] }],
      steps: ({ k }) => {
        const s = [];
        const maxT = k === "cut" ? 40 : 1024;
        const body = {
          model: "claude-opus-5-5",
          max_tokens: maxT,
          system: "Bạn là nhân viên chăm sóc khách hàng của cửa hàng ABC. Trả lời ngắn gọn, lịch sự.",
          messages: [{ role: "user", content: "Cửa hàng có cho đổi size giày trong bao lâu?" }],
        };
        s.push({
          from: "a", to: "a", kind: "internal", title: "Chương trình chuẩn bị request",
          desc: "Một request gồm bốn phần chính: chọn model nào, cho trả lời dài tối đa bao nhiêu, hướng dẫn chung (system) và nội dung cuộc trò chuyện (messages). Tất cả viết dưới dạng JSON.",
          payload: body, hl: ["model", "max_tokens", "system", "messages"],
          fields: [
            ["model", "Tên model sẽ trả lời. Model mạnh hơn thì đắt hơn; model nhỏ thì nhanh và rẻ."],
            ["max_tokens", "Độ dài tối đa của <b>câu trả lời</b>, tính bằng token. Không phải giới hạn của phần bạn gửi đi."],
            ["system", "Hướng dẫn chung: vai trò, giọng văn, quy tắc. Áp dụng cho cả cuộc trò chuyện."],
            ["messages", "Danh sách các lượt nói theo thứ tự. <code>role</code> là <code>user</code> (người dùng) hoặc <code>assistant</code> (Claude)."],
          ],
          backend: ["Đọc API key từ biến môi trường <code>ANTHROPIC_API_KEY</code>, không ghi thẳng vào code.", "Lấy câu hỏi của khách, đặt vào <code>messages</code>.", "Chọn <code>max_tokens</code> đủ rộng cho câu trả lời mong muốn."],
          snippet: "import anthropic\nclient = anthropic.Anthropic()  # tự đọc ANTHROPIC_API_KEY\nresponse = client.messages.create(\n    model=\"claude-opus-5-5\",\n    max_tokens=" + maxT + ",\n    system=\"Bạn là nhân viên chăm sóc khách hàng...\",\n    messages=[{\"role\": \"user\", \"content\": \"Cửa hàng có cho đổi size...\"}],\n)",
          state: [{ r: "user", t: "Khách: “Cửa hàng có cho đổi size giày trong bao lâu?”" }],
        });
        s.push({
          from: "a", to: "c", kind: "req", label: "POST /v1/messages",
          title: "Gửi request qua Internet tới Anthropic",
          desc: "Request đi qua HTTPS (đã mã hóa). Phần đầu (header) mang API key để Anthropic biết ai đang gọi và tính tiền cho ai.",
          payloads: [
            { t: "Header", d: { "x-api-key": "sk-ant-••••••(lấy từ biến môi trường)", "anthropic-version": "2023-06-01", "content-type": "application/json" }, hl: ["x-api-key"] },
            { t: "Body (giống bước trước)", d: body },
          ],
          note: "API key giống mật khẩu ngân hàng: ai có nó là gọi được API và bạn trả tiền. Không gửi cho người khác, không đưa lên GitHub, không để trong code chạy trên trình duyệt.",
        });
        s.push({
          from: "c", to: "c", kind: "internal", title: "Phía Anthropic xử lý",
          desc: "Máy chủ kiểm tra key và hạn mức, đổi toàn bộ chữ thành token và đếm, rồi Claude viết câu trả lời từng token một cho tới khi viết xong hoặc chạm giới hạn <code>max_tokens</code>.",
          backend: [
            "Kiểm tra API key và hạn mức (rate limit). Sai key thì trả lỗi 401, gọi quá nhiều thì lỗi 429.",
            "Đổi system và messages thành token. Tổng phải nằm trong <b>context window</b> của model, nếu không sẽ bị lỗi.",
            "Claude sinh câu trả lời từng token. Dừng khi viết xong (<code>end_turn</code>) hoặc khi đủ <code>max_tokens</code>.",
            "Đếm số token vào và ra để tính tiền.",
          ],
          note: "Claude không nhớ gì sau lần gọi này. Lần sau muốn nó biết câu hỏi cũ, bạn phải gửi lại.",
        });
        const cut = k === "cut";
        const res = {
          id: "msg_01AbC…",
          type: "message",
          role: "assistant",
          model: "claude-opus-5-5",
          content: [{ type: "text", text: cut ? "Dạ, cửa hàng ABC hỗ trợ đổi size giày trong vòng 7 ngày kể từ khi" : "Dạ, cửa hàng ABC hỗ trợ đổi size giày trong vòng 7 ngày kể từ khi nhận hàng, với điều kiện giày chưa qua sử dụng và còn hộp. Bạn mang giày tới cửa hàng hoặc liên hệ hotline để được hướng dẫn nhé." }],
          stop_reason: cut ? "max_tokens" : "end_turn",
          usage: { input_tokens: 58, output_tokens: cut ? 40 : 76 },
        };
        s.push({
          from: "c", to: "a", kind: cut ? "warn" : "res", label: cut ? "bị cắt ngang" : "200 OK",
          title: cut ? "Câu trả lời bị cắt giữa chừng" : "Nhận về câu trả lời",
          desc: cut ? "Claude chưa viết xong thì đã chạm giới hạn 40 token. <code>stop_reason</code> là <code>max_tokens</code>, và câu trả lời dừng lửng giữa câu." : "Câu trả lời nằm trong <code>content</code>, dạng một danh sách các khối. Hai trường còn lại rất quan trọng: <code>stop_reason</code> cho biết vì sao Claude dừng, <code>usage</code> cho biết đã dùng bao nhiêu token.",
          payload: res, hl: ["content", "stop_reason", "usage"],
          fields: [
            ["content", "Danh sách các khối nội dung. Ở đây chỉ có một khối chữ (<code>text</code>). Sau này bạn sẽ gặp thêm khối <code>tool_use</code> khi Claude muốn dùng công cụ."],
            ["stop_reason", "Lý do dừng: <code>end_turn</code> là viết xong, <code>max_tokens</code> là bị cắt vì hết độ dài cho phép, <code>tool_use</code> là đang chờ chạy công cụ."],
            ["usage.input_tokens", "Số token bạn gửi đi (system + messages)."],
            ["usage.output_tokens", "Số token Claude viết ra. Thường đắt hơn token đầu vào vài lần."],
          ],
          warn: cut ? "Đừng gửi đoạn bị cắt này cho khách. Luôn kiểm tra stop_reason trước khi dùng câu trả lời." : null,
          push: [{ r: cut ? "err" : "assistant", t: cut ? "Claude: “Dạ, cửa hàng ABC hỗ trợ đổi size giày trong vòng 7 ngày kể từ khi…” <i>(bị cắt)</i>" : "Claude: “Dạ, cửa hàng ABC hỗ trợ đổi size giày trong vòng 7 ngày…”" }],
        });
        if (cut) {
          s.push({
            from: "a", to: "a", kind: "internal", title: "Chương trình xử lý trường hợp bị cắt",
            desc: "Cách sửa đơn giản nhất là tăng <code>max_tokens</code> rồi gọi lại. Với câu trả lời rất dài, có thể dùng chế độ streaming để nhận dần từng phần.",
            snippet: "if response.stop_reason == \"max_tokens\":\n    # Chưa xong: không gửi cho khách\n    response = client.messages.create(..., max_tokens=1024)",
            backend: ["Đọc <code>stop_reason</code>.", "Thấy <code>max_tokens</code> thì không coi là xong.", "Gọi lại với giới hạn cao hơn, hoặc báo lỗi để người vận hành chỉnh cấu hình."],
          });
          return s;
        }
        s.push({
          from: "a", to: "a", kind: "internal", title: "Đọc kết quả và tính tiền",
          desc: "Chương trình kiểm tra <code>stop_reason</code> là <code>end_turn</code>, lấy chữ trong khối <code>text</code> gửi cho khách, và ghi lại <code>usage</code> để theo dõi chi phí.",
          snippet: "if response.stop_reason == \"end_turn\":\n    answer = next(b.text for b in response.content if b.type == \"text\")\n    log_usage(response.usage.input_tokens, response.usage.output_tokens)",
          backend: [
            "Ví dụ giá (có thể thay đổi, hãy xem bảng giá hiện tại): đầu vào 4 USD cho mỗi 1 triệu token, đầu ra 20 USD cho mỗi 1 triệu token.",
            "Lần gọi này: 58 × 4 / 1.000.000 + 76 × 20 / 1.000.000 ≈ 0,0017 USD.",
            "Nghe rất rẻ, nhưng một chatbot nhận 100.000 câu hỏi mỗi ngày, mỗi câu kèm vài nghìn token tài liệu, thì chi phí trở nên đáng kể. Vì vậy chương 4 và 5 sẽ bàn cách tiết kiệm.",
          ],
        });
        if (k === "turn2") {
          const body2 = {
            model: "claude-opus-5-5",
            max_tokens: 1024,
            system: body.system,
            messages: [
              body.messages[0],
              { role: "assistant", content: res.content[0].text },
              { role: "user", content: "Mua online thì đổi thế nào?" },
            ],
          };
          s.push({
            from: "a", to: "a", kind: "internal", title: "Khách hỏi tiếp: ghép cả lịch sử vào request mới",
            desc: "Câu “Mua online thì đổi thế nào?” chỉ có nghĩa khi Claude biết câu hỏi trước là về đổi size giày. Vì Claude không nhớ, chương trình phải gửi lại <b>cả</b> lượt hỏi cũ và câu trả lời cũ, rồi mới tới câu hỏi mới.",
            payload: body2, hl: ["messages"],
            push: [{ r: "user", t: "Khách: “Mua online thì đổi thế nào?”" }],
            warn: "Quên gửi lại lịch sử là lỗi rất hay gặp: Claude sẽ hỏi lại “Bạn muốn đổi gì ạ?” vì nó không biết khách đang nói về chuyện gì.",
          });
          s.push({
            from: "a", to: "c", kind: "req", label: "lượt 2", title: "Gửi request lượt hai",
            desc: "Request này dài hơn lượt đầu, vì có thêm lịch sử. Hội thoại càng dài thì mỗi lượt càng tốn nhiều token đầu vào hơn.",
            payload: { "...": "giống bước trước", usage_du_kien: { input_tokens: 151 } },
          });
          s.push({
            from: "c", to: "a", kind: "res", label: "200 OK", title: "Claude trả lời đúng ngữ cảnh",
            desc: "Nhờ có lịch sử, Claude hiểu “đổi” ở đây là đổi size giày, và trả lời đúng ý.",
            payload: { content: [{ type: "text", text: "Với đơn mua online, bạn vào mục Đơn hàng, chọn “Yêu cầu đổi size” trong 7 ngày kể từ khi nhận. Shipper sẽ tới lấy giày và giao đôi mới, miễn phí vận chuyển." }], stop_reason: "end_turn", usage: { input_tokens: 151, output_tokens: 64 } },
            hl: ["input_tokens"],
            note: "Input lượt hai là 151 token, gần gấp ba lượt một. Đây là lý do các hội thoại dài ngày càng đắt, và vì sao có kỹ thuật prompt caching ở chương sau.",
            push: [{ r: "assistant", t: "Claude: “Với đơn mua online, bạn vào mục Đơn hàng…”" }],
          });
        }
        return s;
      },
    }),
  };
})();
