/* Mô phỏng chi tiết — Chương 0: Kiến thức nền */
(function () {
  const { trace, claude } = window.SIM;
  const W = window.WIDGETS;

  /* ───────── 0-0 Một lần gọi Claude API ───────── */
  W.apiBasics = {
    title: "Một lần gọi Claude API, từ lúc gửi tới lúc nhận",
    render: trace({
      intro: "Chương trình của một cửa hàng hỏi Claude một câu. Theo dõi request đi tới Anthropic và response quay về, xem từng trường nghĩa là gì và tiền được tính thế nào. Đổi tình huống để thấy chuyện gì xảy ra khi câu trả lời bị cắt, hoặc khi khách hỏi tiếp.",
      actors: [
        { id: "a", icon: "👩‍💻", name: "Chương trình của bạn", sub: "Python, chạy trên máy chủ của bạn", desc: "Code bạn viết, dùng thư viện <code>anthropic</code>. Nó giữ API key và tự lưu lịch sử trò chuyện." },
        { id: "c", icon: "🧠", name: "Claude API", sub: "api.anthropic.com", desc: "Máy chủ của Anthropic. Nhận request qua Internet, cho model Claude đọc rồi viết câu trả lời, trả về response. Không nhớ gì giữa các lần gọi." },
      ],
      links: { "a>c": "HTTPS · POST api.anthropic.com/v1/messages", "c>a": "HTTPS · response 200 OK" },
      stateTitle: "Lịch sử đang giữ",
      controls: [{ id: "k", type: "select", label: "Tình huống:", value: "ok", options: [["ok", "Một câu hỏi bình thường"], ["cut", "max_tokens đặt quá thấp"], ["turn2", "Khách hỏi tiếp lượt thứ hai"]] }],
      steps: ({ k }) => {
        const s = [];
        const cut = k === "cut";
        const maxT = cut ? 40 : 1024;
        const cv = claude({ model: "claude-opus-5-5", max_tokens: maxT, system: "Bạn là nhân viên chăm sóc khách hàng của cửa hàng ABC. Trả lời ngắn gọn, lịch sự." });
        cv.user("Cửa hàng có cho đổi size giày trong bao lâu?");
        const snippet = "import anthropic\n\nclient = anthropic.Anthropic()  # tự đọc ANTHROPIC_API_KEY từ biến môi trường\nresponse = client.messages.create(\n    model=\"claude-opus-5-5\",\n    max_tokens=" + maxT + ",\n    system=\"Bạn là nhân viên chăm sóc khách hàng của cửa hàng ABC. Trả lời ngắn gọn, lịch sự.\",\n    messages=[{\"role\": \"user\", \"content\": \"Cửa hàng có cho đổi size giày trong bao lâu?\"}],\n)";
        s.push({
          phase: "Chuẩn bị request", from: "a", to: "a", kind: "internal", title: "Chương trình chuẩn bị request",
          via: "chưa gửi gì: thư viện anthropic dựng body JSON từ các tham số bạn truyền vào",
          desc: "Một request gồm bốn phần chính: chọn model nào, cho trả lời dài tối đa bao nhiêu, hướng dẫn chung (system) và nội dung cuộc trò chuyện (messages). Bạn viết chúng bằng code Python; thư viện đổi chúng thành JSON.",
          views: [
            { t: "Code Python", d: snippet, note: "Toàn bộ đoạn code tạo ra request." },
            { t: "Body JSON sẽ gửi", d: { ...cv.base, messages: cv.msgs.slice() }, hl: ["model", "max_tokens", "system", "messages"], note: "Toàn bộ body JSON mà thư viện sẽ gửi ở bước sau." },
          ],
          fields: [
            ["model", "Tên model sẽ trả lời. Model mạnh hơn thì đắt hơn; model nhỏ thì nhanh và rẻ."],
            ["max_tokens", "Độ dài tối đa của <b>câu trả lời</b>, tính bằng token. Không phải giới hạn của phần bạn gửi đi."],
            ["system", "Hướng dẫn chung: vai trò, giọng văn, quy tắc. Áp dụng cho cả cuộc trò chuyện."],
            ["messages", "Danh sách các lượt nói theo thứ tự. <code>role</code> là <code>user</code> (người dùng) hoặc <code>assistant</code> (Claude)."],
          ],
          backend: ["Đọc API key từ biến môi trường <code>ANTHROPIC_API_KEY</code>, không ghi thẳng vào code.", "Lấy câu hỏi của khách, đặt vào <code>messages</code>.", "Chọn <code>max_tokens</code> đủ rộng cho câu trả lời mong muốn."],
          state: [{ r: "user", t: "Khách: “Cửa hàng có cho đổi size giày trong bao lâu?”" }],
        });
        s.push({
          phase: "Gửi đi và xử lý", from: "a", to: "c", kind: "req", label: "POST /v1/messages",
          title: "Gửi request qua Internet tới Anthropic",
          desc: "Request đi qua HTTPS (đã mã hóa). Phần header mang API key để Anthropic biết ai đang gọi và tính tiền cho ai; phần body là JSON ở bước trước. Mở “Gói HTTP đầy đủ” để thấy đúng những gì đi qua mạng.",
          ...cv.req({ hl: ["authorization", "anthropic-version"] }),
          fields: [
            ["POST /v1/messages + host", "Địa chỉ của Messages API. Mọi lần hỏi Claude đều gửi tới đây."],
            ["authorization", "Mang API key. Thư viện Python bản 2.x tự đọc key từ biến môi trường và gửi ở header này. Claude API nhận key ở cả <code>authorization: Bearer</code> lẫn <code>x-api-key</code>; khi tự gọi bằng curl, cách thường thấy là <code>x-api-key</code>."],
            ["anthropic-version", "Phiên bản API. Thư viện tự điền theo phiên bản của nó (Python 2.x gửi <code>2026-10-21</code>); nó cố định cách API hiểu request và trả response."],
            ["user-agent, x-stainless-…", "Thông tin về thư viện đang dùng: ngôn ngữ, phiên bản, hệ điều hành, số lần thử lại. Thư viện tự thêm, không ảnh hưởng câu trả lời."],
            ["content-type, content-length", "Báo cho máy chủ biết body là JSON và dài bao nhiêu byte."],
          ],
          note: "API key giống mật khẩu ngân hàng: ai có nó là gọi được API và bạn trả tiền. Không gửi cho người khác, không đưa lên GitHub, không để trong code chạy trên trình duyệt.",
        });
        s.push({
          from: "c", to: "c", kind: "internal", title: "Phía Anthropic xử lý", via: "bên trong máy chủ Anthropic; bạn không thấy bước này",
          desc: "Máy chủ kiểm tra key và hạn mức, đổi toàn bộ chữ thành token và đếm, rồi Claude viết câu trả lời từng token một cho tới khi viết xong hoặc chạm giới hạn <code>max_tokens</code>.",
          backend: [
            "Kiểm tra API key và hạn mức (rate limit). Sai key thì trả lỗi 401, gọi quá nhiều thì lỗi 429.",
            "Đổi system và messages thành token. Tổng phải nằm trong <b>context window</b> của model, nếu không sẽ bị lỗi.",
            "Claude sinh câu trả lời từng token. Dừng khi viết xong (<code>end_turn</code>) hoặc khi đủ <code>max_tokens</code>.",
            "Đếm số token vào và ra để tính tiền.",
          ],
          note: "Claude không nhớ gì sau lần gọi này. Lần sau muốn nó biết câu hỏi cũ, bạn phải gửi lại.",
        });
        const full = "Dạ, cửa hàng ABC hỗ trợ đổi size giày trong vòng 7 ngày kể từ khi nhận hàng, với điều kiện giày chưa qua sử dụng và còn hộp. Bạn mang giày tới cửa hàng hoặc liên hệ hotline để được hướng dẫn nhé.";
        const text = cut ? "Dạ, cửa hàng ABC hỗ trợ đổi size giày trong vòng 7 ngày kể từ khi" : full;
        s.push({
          phase: "Nhận kết quả", from: "c", to: "a", kind: cut ? "warn" : "res", label: cut ? "bị cắt ngang" : "200 OK",
          title: cut ? "Câu trả lời bị cắt giữa chừng" : "Nhận về câu trả lời",
          desc: cut ? "Claude chưa viết xong thì đã chạm giới hạn 40 token. <code>stop_reason</code> là <code>max_tokens</code>, và câu trả lời dừng lửng giữa câu." : "Câu trả lời nằm trong <code>content</code>, dạng một danh sách các khối. Hai trường còn lại rất quan trọng: <code>stop_reason</code> cho biết vì sao Claude dừng, <code>usage</code> cho biết đã dùng bao nhiêu token.",
          ...cv.res({ content: [{ type: "text", text }], stop_reason: cut ? "max_tokens" : "end_turn", in: 58, out: cut ? 40 : 76 }, { hl: ["content", "stop_reason", "input_tokens", "output_tokens"] }),
          fields: [
            ["id", "Mã của câu trả lời này. Ghi lại khi cần báo lỗi với Anthropic."],
            ["content", "Danh sách các khối nội dung. Ở đây chỉ có một khối chữ (<code>text</code>). Sau này bạn sẽ gặp thêm khối <code>tool_use</code> khi Claude muốn dùng công cụ, và khối <code>thinking</code> khi model suy nghĩ trước khi trả lời."],
            ["stop_reason", "Lý do dừng, có bảy giá trị: <code>end_turn</code> (viết xong), <code>max_tokens</code> (hết độ dài cho phép), <code>tool_use</code> (chờ chạy công cụ), <code>stop_sequence</code> (gặp chuỗi dừng bạn khai báo), <code>pause_turn</code> (lượt dài bị tạm dừng, gửi lại để chạy tiếp), <code>refusal</code> (bộ lọc an toàn từ chối), <code>model_context_window_exceeded</code> (vượt context window)."],
            ["stop_sequence, stop_details", "Thường là <code>null</code>. <code>stop_details</code> chỉ có giá trị khi <code>stop_reason</code> là <code>refusal</code>."],
            ["usage.input_tokens", "Số token bạn gửi đi (system + messages)."],
            ["usage.output_tokens", "Số token Claude viết ra. Thường đắt hơn token đầu vào vài lần."],
            ["usage.cache_*, cache_creation", "Token đọc/ghi từ bộ nhớ đệm (prompt caching, học ở chương sau), chia theo thời hạn 5 phút và 1 giờ. Ở đây bằng 0."],
            ["usage.service_tier, inference_geo", "Mức dịch vụ đã dùng (<code>standard</code>, <code>priority</code> hoặc <code>batch</code>) và khu vực xử lý."],
          ],
          warn: cut ? "Đừng gửi đoạn bị cắt này cho khách. Luôn kiểm tra stop_reason trước khi dùng câu trả lời." : null,
          push: [{ r: cut ? "err" : "assistant", t: cut ? "Claude: “Dạ, cửa hàng ABC hỗ trợ đổi size giày trong vòng 7 ngày kể từ khi…” <i>(bị cắt)</i>" : "Claude: “Dạ, cửa hàng ABC hỗ trợ đổi size giày trong vòng 7 ngày…”" }],
        });
        if (cut) {
          s.push({
            from: "a", to: "a", kind: "internal", title: "Chương trình xử lý trường hợp bị cắt",
            desc: "Cách sửa đơn giản nhất là tăng <code>max_tokens</code> rồi gọi lại. Với câu trả lời rất dài, có thể dùng chế độ streaming để nhận dần từng phần.",
            snippet: "if response.stop_reason == \"max_tokens\":\n    # Chưa xong: không gửi cho khách\n    response = client.messages.create(..., max_tokens=1024)",
            backend: ["Đọc <code>stop_reason</code>.", "Thấy <code>max_tokens</code> thì không coi là xong, không lưu đoạn bị cắt vào lịch sử.", "Gọi lại với giới hạn cao hơn, hoặc báo lỗi để người vận hành chỉnh cấu hình."],
          });
          return s;
        }
        s.push({
          from: "a", to: "a", kind: "internal", title: "Đọc kết quả và tính tiền",
          desc: "Chương trình kiểm tra <code>stop_reason</code> là <code>end_turn</code>, lấy chữ trong khối <code>text</code> gửi cho khách, và ghi lại <code>usage</code> để theo dõi chi phí.",
          snippet: "if response.stop_reason == \"end_turn\":\n    answer = next(b.text for b in response.content if b.type == \"text\")\n    log_usage(response.usage.input_tokens, response.usage.output_tokens)",
          backend: [
            "Ví dụ giá của claude-opus-5-5 (có thể thay đổi, hãy xem bảng giá hiện tại): đầu vào 4 USD cho mỗi 1 triệu token, đầu ra 20 USD cho mỗi 1 triệu token.",
            "Lần gọi này: 58 × 4 / 1.000.000 + 76 × 20 / 1.000.000 ≈ 0,0017 USD.",
            "Nghe rất rẻ, nhưng một chatbot nhận 100.000 câu hỏi mỗi ngày, mỗi câu kèm vài nghìn token tài liệu, thì chi phí trở nên đáng kể. Vì vậy chương 4 và 5 sẽ bàn cách tiết kiệm.",
          ],
        });
        if (k === "turn2") {
          cv.user("Mua online thì đổi thế nào?");
          s.push({
            phase: "Lượt thứ hai", from: "a", to: "a", kind: "internal", title: "Khách hỏi tiếp: ghép cả lịch sử vào request mới",
            via: "chưa gửi gì: chương trình thêm câu trả lời cũ và câu hỏi mới vào messages",
            desc: "Câu “Mua online thì đổi thế nào?” chỉ có nghĩa khi Claude biết câu hỏi trước là về đổi size giày. Vì Claude không nhớ, chương trình phải gửi lại <b>cả</b> lượt hỏi cũ và câu trả lời cũ, rồi mới tới câu hỏi mới.",
            payload: cv.msgs.slice(), payloadTitle: "messages sau khi thêm hai tin nhắn mới", mark: (p) => p.length >= 1 && p[0] >= 1,
            pnote: "Toàn bộ mảng messages mà chương trình đang giữ: 3 tin nhắn, trong đó 2 tin nhắn vừa thêm được tô vàng.",
            push: [{ r: "user", t: "Khách: “Mua online thì đổi thế nào?”" }],
            warn: "Quên gửi lại lịch sử là lỗi rất hay gặp: Claude sẽ hỏi lại “Bạn muốn đổi gì ạ?” vì nó không biết khách đang nói về chuyện gì.",
          });
          s.push({
            from: "a", to: "c", kind: "req", label: "lượt 2", title: "Gửi request lượt hai",
            desc: "Request này dài hơn lượt đầu, vì có thêm lịch sử. Hội thoại càng dài thì mỗi lượt càng tốn nhiều token đầu vào hơn.",
            ...cv.req(),
          });
          s.push({
            from: "c", to: "a", kind: "res", label: "200 OK", title: "Claude trả lời đúng ngữ cảnh",
            desc: "Nhờ có lịch sử, Claude hiểu “đổi” ở đây là đổi size giày, và trả lời đúng ý.",
            ...cv.res({ content: [{ type: "text", text: "Với đơn mua online, bạn vào mục Đơn hàng, chọn “Yêu cầu đổi size” trong 7 ngày kể từ khi nhận. Shipper sẽ tới lấy giày và giao đôi mới, miễn phí vận chuyển." }], stop_reason: "end_turn", in: 151, out: 64 }, { hl: ["input_tokens"] }),
            note: "Input lượt hai là 151 token, gần gấp ba lượt một. Đây là lý do các hội thoại dài ngày càng đắt, và vì sao có kỹ thuật prompt caching ở chương sau.",
            push: [{ r: "assistant", t: "Claude: “Với đơn mua online, bạn vào mục Đơn hàng…”" }],
          });
        }
        return s;
      },
    }),
  };
})();
