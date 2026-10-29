/* Thực hành dự án: mỗi chương một bài làm thật, kèm danh sách việc cần kiểm tra trước khi giao cho khách.
   Code mẫu nằm trong thư mục examples/ (đã chạy thử) và được tải vào trang qua trường file. */
window.PRACTICE = {
  checklist: {
    title: "Checklist trước khi giao hệ thống dùng Claude cho khách hàng",
    goal: "Rà soát những việc hay bị bỏ sót khi đưa một ứng dụng dùng Claude từ bản chạy thử lên chạy thật cho khách.",
    scenario: "Bản demo chạy tốt trên máy bạn chưa có nghĩa là sẵn sàng cho khách. Danh sách dưới đây gom các bài học của cả khóa thành việc cụ thể cần làm. Đánh dấu từng mục khi dự án của bạn đã đáp ứng; trang sẽ nhớ những mục bạn đã đánh dấu trên trình duyệt này.",
    groups: [
      {
        title: "1. Bảo mật và dữ liệu",
        items: [
          "API key nằm trong biến môi trường hoặc kho bí mật. Không có trong code, repo, log, hay ứng dụng chạy trên trình duyệt và điện thoại.",
          "Mỗi môi trường (thử nghiệm, chạy thật) và mỗi khách hàng dùng key riêng, để thu hồi một key mà không ảnh hưởng chỗ khác.",
          "Chỉ gửi cho Claude dữ liệu cần thiết. Thông tin nhạy cảm (số thẻ, số giấy tờ) được che bằng code trước khi đưa vào hội thoại, ví dụ bằng hook PostToolUse.",
          "Đã thống nhất với khách: log hội thoại lưu ở đâu, lưu bao lâu, ai được xem.",
          "Nội dung từ bên ngoài (email, tài liệu, pull request) được coi là không đáng tin; công cụ chỉ có quyền tối thiểu cần thiết.",
        ],
      },
      {
        title: "2. Chi phí",
        items: [
          "Đã ước tính số token cho một yêu cầu điển hình, nhân với lưu lượng dự kiến, và thống nhất ngân sách với khách.",
          "Phần cố định (hướng dẫn, tài liệu, danh sách công cụ) đặt ở đầu và bật prompt caching; đã kiểm tra <code>cache_read_input_tokens</code> lớn hơn 0.",
          "Việc không cần trả lời ngay (báo cáo, xử lý hàng loạt) chạy bằng Message Batches API.",
          "Đã đặt cảnh báo và giới hạn chi tiêu trong Claude Console.",
          "Kết quả công cụ được cắt gọn; hội thoại dài được tóm tắt có kiểm soát, giữ nguyên case facts.",
        ],
      },
      {
        title: "3. Độ tin cậy khi gọi API",
        items: [
          "Mọi chỗ gọi API đều kiểm tra <code>stop_reason</code> trước khi dùng nội dung: <code>end_turn</code>, <code>tool_use</code>, <code>max_tokens</code>, <code>refusal</code>.",
          "Có thử lại với thời gian chờ tăng dần cho lỗi 429 và lỗi 5xx (thư viện chính thức tự thử lại 2 lần), và có timeout hợp lý.",
          "Thao tác ghi (hoàn tiền, tạo đơn) có khóa chống trùng để thử lại không làm hai lần.",
          "Đã bật cơ chế dự phòng khi model từ chối (fallback), và có câu trả lời lịch sự cho người dùng khi bị từ chối.",
          "Vòng lặp agent có giới hạn số vòng và dừng có kiểm soát khi chạm giới hạn.",
          "Mã model nằm trong cấu hình; có kế hoạch nâng cấp khi model cũ ngừng hỗ trợ, và chạy lại bộ đánh giá trước khi đổi model.",
        ],
      },
      {
        title: "4. An toàn của agent và công cụ",
        items: [
          "Quy tắc liên quan tới tiền, pháp lý, bảo mật được chặn bằng code, không chỉ dặn trong prompt.",
          "Mỗi agent và subagent chỉ có những công cụ đúng vai trò của nó.",
          "Công cụ trả lỗi có cấu trúc (loại lỗi, có nên thử lại không); không công cụ nào biến lỗi thành kết quả rỗng.",
          "Trong CI, Claude Code chạy với <code>--allowedTools</code> tối thiểu và token có quyền hẹp.",
        ],
      },
      {
        title: "5. Chất lượng: đo trước khi tin",
        items: [
          "Có bộ đánh giá lấy từ tình huống thật của khách, gồm cả trường hợp khó và trường hợp agent nên từ chối hoặc chuyển người.",
          "Đo độ chính xác theo từng nhóm (loại yêu cầu, loại tài liệu, trường dữ liệu), không chỉ một con số tổng.",
          "Chạy lại bộ đánh giá mỗi khi đổi prompt, công cụ hay model.",
          "Nếu dùng độ tự tin để quyết định, ngưỡng đã được hiệu chỉnh trên dữ liệu có người kiểm tra.",
        ],
      },
      {
        title: "6. Con người trong vòng lặp",
        items: [
          "Có đường chuyển cho nhân viên: khi khách yêu cầu, khi chính sách chưa quy định, khi agent không tiến triển được.",
          "Bản bàn giao có cấu trúc, nhân viên không phải hỏi lại khách từ đầu.",
          "Có người kiểm tra mẫu định kỳ bằng cách lấy mẫu phân tầng, kể cả những kết quả có độ tự tin cao.",
        ],
      },
      {
        title: "7. Vận hành và bàn giao",
        items: [
          "Mỗi lần gọi được ghi log: request id, model, số token, thời gian, stop_reason; không ghi dữ liệu nhạy cảm.",
          "Có bảng theo dõi chi phí, tỷ lệ lỗi, tỷ lệ chuyển cho nhân viên và thời gian phản hồi.",
          "Prompt và định nghĩa công cụ được quản lý phiên bản trong git như code.",
          "Triển khai dần (một nhóm người dùng nhỏ trước) và có cách quay lại phiên bản cũ.",
          "Đã bàn giao cho khách tài liệu vận hành: cách đổi key, xem log, xử lý sự cố thường gặp, liên hệ hỗ trợ.",
        ],
      },
    ],
    links: ["0-0", "1-4", "2-2", "4-5", "5-2", "5-5"],
  },

  d0: {
    title: "Gọi Claude API lần đầu",
    time: 30,
    level: "Người mới",
    goal: "Cài đặt thư viện, gọi Claude API, đọc stop_reason và usage, rồi giữ được một cuộc trò chuyện nhiều lượt.",
    scenario: "Trước khi xây agent cho khách, bạn cần tự tay gọi API vài lần để thấy request và response trông như thế nào ngoài đời thật, giống như trong mô phỏng của mục 0-0.",
    prepare: [
      "Python 3.10 trở lên và một cửa sổ terminal.",
      "Một API key tạo trong Claude Console. Key này tính tiền theo token, nên giữ bí mật như mật khẩu.",
      "Tải thư mục <code>examples/</code> của repo này về máy (hoặc chép code từ trang này).",
    ],
    steps: [
      {
        title: "Cài thư viện và đặt API key",
        html: "<p>Tạo một môi trường Python riêng cho dự án, cài thư viện chính thức của Anthropic, và đặt key vào biến môi trường. Thư viện sẽ tự đọc key từ biến <code>ANTHROPIC_API_KEY</code>, nên bạn không cần ghi key vào code.</p>",
        code: "python -m venv .venv\nsource .venv/bin/activate          # Windows: .venv\\Scripts\\activate\npip install anthropic\nexport ANTHROPIC_API_KEY=\"sk-ant-...\"   # Windows (PowerShell): $env:ANTHROPIC_API_KEY=\"sk-ant-...\"",
      },
      {
        title: "Gửi câu hỏi đầu tiên",
        html: "<p>File dưới đây gửi một câu hỏi và in ra ba thứ: lý do dừng, câu trả lời và số token. Chạy bằng <code>python first_call.py</code>.</p>",
        file: "examples/ch0/first_call.py",
        after: "<p>Để ý vòng lặp <code>for block in response.content</code>: câu trả lời là một <b>danh sách các khối</b>. Với các model mới, trước khối chữ có thể có khối <code>thinking</code> (phần suy nghĩ, thường để trống), nên đừng lấy thẳng <code>content[0].text</code>.</p>",
      },
      {
        title: "Tính thử chi phí",
        html: "<p>Lấy hai con số <code>input_tokens</code> và <code>output_tokens</code> vừa in ra, nhân với giá hiện tại trong bảng giá của Anthropic (giá tính theo mỗi 1 triệu token, đầu ra đắt hơn đầu vào). Sau đó ước lượng: nếu khách có 10.000 câu hỏi mỗi ngày, mỗi tháng tốn khoảng bao nhiêu? Đây là con số đầu tiên khách sẽ hỏi bạn.</p>",
      },
      {
        title: "Trò chuyện nhiều lượt",
        html: "<p>Claude không nhớ gì giữa các lần gọi, nên chương trình tự giữ lịch sử trong biến <code>history</code> và gửi lại toàn bộ mỗi lần. Chạy <code>python chat.py</code> và để ý số token đầu vào tăng lên ở câu thứ hai.</p>",
        file: "examples/ch0/chat.py",
      },
      {
        title: "Cố tình làm sai để hiểu rõ hơn",
        html: "<ul><li>Đổi <code>max_tokens</code> thành 20 rồi chạy lại: bạn sẽ thấy <code>stop_reason</code> là <code>max_tokens</code> và câu trả lời bị cắt.</li><li>Trong <code>chat.py</code>, sửa để chỉ gửi câu hỏi mới (không gửi <code>history</code>): ở câu thứ hai, Claude sẽ không biết “đổi” là đổi cái gì.</li></ul>",
      },
    ],
    verify: [
      "Chạy được <code>first_call.py</code> và thấy câu trả lời bằng tiếng Việt.",
      "Thấy <code>stop_reason</code> là <code>end_turn</code> và in được số token vào, ra.",
      "Với <code>max_tokens</code> bằng 20, thấy <code>stop_reason</code> là <code>max_tokens</code>.",
      "Ở <code>chat.py</code>, câu hỏi thứ hai được trả lời đúng ngữ cảnh, và số token đầu vào lớn hơn câu thứ nhất.",
    ],
    pitfalls: [
      "Ghi thẳng API key vào code rồi đẩy lên GitHub. Nếu lỡ làm vậy, hãy thu hồi key đó ngay trong Console.",
      "Chỉ gửi câu hỏi mới mà quên lịch sử.",
      "Lấy <code>response.content[0].text</code> mà không kiểm tra loại khối.",
    ],
    links: ["0-0", "1-1"],
  },

  d1: {
    title: "Agent chăm sóc khách hàng có cổng kiểm tra hoàn tiền",
    time: 90,
    level: "Trung bình",
    goal: "Viết một vòng lặp agent hoàn chỉnh: tự xử lý câu hỏi đơn hàng, chỉ hoàn tiền khi đã xác minh khách và trong hạn mức, còn lại chuyển cho nhân viên.",
    scenario: "Một cửa hàng online muốn agent tự xử lý câu hỏi về đơn hàng và các khoản hoàn tiền nhỏ. Hai quy tắc không được phép sai: phải xác minh khách trước khi hoàn tiền, và khoản hoàn trên 2 triệu đồng phải có người duyệt.",
    prepare: [
      "Đã làm bài thực hành chương 0.",
      "Đã đọc mục 1-1 (vòng lặp agent), 1-4 (ép buộc quy trình) và 5-2 (khi nào chuyển cho nhân viên).",
    ],
    steps: [
      {
        title: "Hiểu thiết kế trước khi đọc code",
        html: "<p>Chia việc rõ ràng giữa hai bên:</p><ul><li><b>Claude quyết định</b> nên hỏi gì, gọi công cụ nào, nói gì với khách.</li><li><b>Backend (code của bạn) bảo đảm</b> các quy tắc bắt buộc. Trạng thái “khách đã xác minh” chỉ được ghi khi công cụ <code>get_customer</code> thật sự khớp email, và <code>process_refund</code> tự kiểm tra trạng thái đó cùng hạn mức trước khi chạy.</li></ul><p>Nhờ vậy, dù khách thúc ép hay Claude quên quy trình, tiền cũng không thể đi sai.</p>",
      },
      {
        title: "Tạo file agent.py",
        html: "<p>File gồm bốn phần: khai báo công cụ (<code>TOOLS</code>), dữ liệu giả lập, hàm chạy công cụ có cổng kiểm tra (<code>run_tool</code>), và vòng lặp (<code>chat</code>).</p>",
        file: "examples/ch1/agent.py",
      },
      {
        title: "Đọc kỹ ba chỗ quan trọng",
        html: "<ol><li><b>Cổng kiểm tra trong <code>run_tool</code>:</b> <code>process_refund</code> trả lỗi loại <code>permission</code> nếu chưa xác minh, loại <code>business</code> nếu vượt hạn mức. Lỗi được gửi lại cho Claude với <code>is_error: true</code> kèm lời giải thích, để Claude tự chuyển sang xác minh hoặc gọi <code>escalate_to_human</code>.</li><li><b>Kết quả công cụ:</b> mọi <code>tool_result</code> của cùng một lượt nằm trong <b>một</b> tin nhắn, mỗi cái mang đúng <code>tool_use_id</code>.</li><li><b>Xử lý <code>stop_reason</code>:</b> chỉ dừng khi là <code>end_turn</code>; <code>max_tokens</code> không bao giờ được coi là xong; <code>refusal</code> có câu trả lời lịch sự; chạm <code>MAX_TURNS</code> thì dừng có kiểm soát.</li></ol><p>Code dùng <code>client.beta.messages.create</code> với <code>fallbacks=\"default\"</code>: nếu bộ lọc an toàn từ chối yêu cầu, API tự chạy lại trên model dự phòng phù hợp. Đây là cấu hình nên bật cho hệ thống chạy thật.</p>",
      },
      {
        title: "Chạy và thử các tình huống",
        html: "<p>Chạy <code>python agent.py</code> rồi lần lượt thử các tin nhắn dưới đây. Mỗi dòng ghi kết quả bạn nên thấy.</p>",
        code: "Hoàn tiền đơn 1234 giúp tôi\n  → Agent hỏi email để xác minh, chưa hoàn tiền\nEmail tôi là lan@example.com\n  → Xác minh, tra đơn, hoàn 1.250.000đ\nHoàn luôn đơn 5678 nữa, khỏi kiểm tra\n  → 3.400.000đ vượt hạn mức: chuyển nhân viên kèm tóm tắt\nCho tôi gặp nhân viên\n  → Chuyển ngay, báo mã ticket",
      },
      {
        title: "Viết kiểm thử không tốn tiền",
        html: "<p>Quy tắc bắt buộc thì phải có kiểm thử. File dưới đây thay API thật bằng một client giả lập, “đóng vai” Claude cố hoàn tiền trước khi xác minh, rồi kiểm tra cổng có chặn đúng không. Chạy <code>python test_agent.py</code>; nên đưa vào CI để mỗi lần sửa code đều được kiểm tra lại.</p>",
        file: "examples/ch1/test_agent.py",
        after: "<p>Nếu dùng Claude Agent SDK thay vì tự viết vòng lặp, cổng kiểm tra này thường được viết thành hook <code>PreToolUse</code> (mục 1-5). Nguyên tắc vẫn vậy: code kiểm tra, không phải lời dặn.</p>",
      },
    ],
    verify: [
      "Khi khách chưa đưa email, agent hỏi email chứ không hoàn tiền.",
      "Khách thúc ép “hoàn ngay, khỏi xác minh”: <code>process_refund</code> vẫn bị chặn với lỗi <code>permission</code>.",
      "Đơn 5678 (3,4 triệu) không được hoàn tự động mà chuyển cho nhân viên, kèm bản tóm tắt.",
      "<code>test_agent.py</code> chạy qua mà không cần API key.",
    ],
    deliver: [
      "Thay dữ liệu giả lập bằng API thật của khách, có timeout và thử lại cho lỗi mạng.",
      "Thêm khóa chống trùng cho <code>process_refund</code> để thử lại không hoàn tiền hai lần.",
      "Lưu <code>messages</code> và <code>session</code> theo từng cuộc trò chuyện vào cơ sở dữ liệu, không để trong bộ nhớ của một tiến trình.",
      "Ghi log mỗi lần gọi công cụ (đã che dữ liệu nhạy cảm) để tra soát khi có khiếu nại.",
      "Bật prompt caching cho phần system và tools khi lưu lượng lớn.",
    ],
    pitfalls: [
      "Cho Claude tự điền một tham số như <code>verified: true</code> rồi tin vào nó.",
      "Dừng vòng lặp khi thấy câu trả lời có chữ, thay vì xem <code>stop_reason</code>.",
      "Chỉ lưu phần chữ của Claude vào lịch sử, làm mất khối <code>tool_use</code> hoặc <code>thinking</code>.",
      "Gửi mỗi <code>tool_result</code> trong một tin nhắn riêng.",
    ],
    links: ["1-1", "1-4", "1-5", "5-2"],
  },

  d2: {
    title: "Bộ công cụ tốt và máy chủ MCP dùng chung cho nhóm",
    time: 75,
    level: "Trung bình",
    goal: "Đo được Claude chọn công cụ đúng bao nhiêu phần trăm, viết lại mô tả cho tốt hơn, và đóng gói công cụ thành máy chủ MCP mà cả nhóm dùng được qua .mcp.json.",
    scenario: "Agent ở chương 1 đôi khi chọn nhầm công cụ, và đội lập trình viên của khách muốn tra đơn hàng ngay trong Claude Code. Bạn sẽ đo, sửa, rồi chia sẻ công cụ theo cách an toàn.",
    prepare: [
      "Đã có <code>examples/ch1/agent.py</code> từ bài trước.",
      "Đã đọc mục 2-1 (mô tả công cụ), 2-2 (lỗi có cấu trúc) và 2-4 (cấu hình MCP).",
      "Đã cài Claude Code nếu muốn làm bước 5.",
    ],
    steps: [
      {
        title: "Đo trước khi sửa",
        html: "<p>Đừng sửa mô tả theo cảm giác. Hãy viết một bộ câu hỏi thật của khách kèm công cụ đúng, rồi đo. Chạy <code>python tool_eval.py</code> và ghi lại tỷ lệ chọn đúng.</p>",
        file: "examples/ch2/tool_eval.py",
      },
      {
        title: "Sửa mô tả công cụ rồi đo lại",
        html: "<p>Mỗi mô tả nên trả lời bốn câu: công cụ làm gì, đầu vào trông thế nào (có ví dụ), khi nào dùng, và <b>khi nào không dùng</b> (chỉ sang công cụ khác). Sửa trong <code>TOOLS</code> của <code>agent.py</code>, chạy lại <code>tool_eval.py</code>, và chỉ giữ thay đổi nào làm tỷ lệ tăng. Thêm vào bộ câu hỏi mỗi khi gặp một lần chọn nhầm ngoài thực tế.</p><div class=\"callout warn\"><b>Lưu ý khi làm thật.</b> Đề thi dạy dùng <code>tool_choice</code> kiểu <code>any</code> hoặc chỉ định đích danh để ép gọi công cụ. Các model mới nhất (ví dụ Claude Opus 5.5, Sonnet 5.5) từ chối hai kiểu ép này. Hãy dùng <code>auto</code> kèm lời dặn rõ ràng, đặt <code>strict: true</code> trên công cụ để tham số luôn đúng schema, hoặc dùng structured outputs khi chỉ cần lấy JSON (bài chương 4).</div>",
      },
      {
        title: "Viết một máy chủ MCP nhỏ",
        html: "<p>Máy chủ dưới đây cung cấp công cụ <code>lookup_order</code>. Docstring của hàm chính là mô tả Claude đọc được. Hai cách trả về khác nhau có chủ đích: mã đơn sai định dạng là <b>lỗi</b> (ném <code>ToolError</code>, client nhận <code>isError: true</code>), còn không tìm thấy đơn là <b>kết quả hợp lệ</b> <code>found: false</code>.</p><p>Cài thư viện bằng <code>pip install mcp</code>. Từ bản 2.x, lớp tạo máy chủ tên là <code>MCPServer</code> (trước đây là <code>FastMCP</code>).</p>",
        file: "examples/ch2/orders_server.py",
      },
      {
        title: "Chia sẻ cho cả nhóm bằng .mcp.json",
        html: "<p>Đặt file <code>.mcp.json</code> ở gốc repo và commit. Khóa bí mật không nằm trong file: Claude Code thay <code>${ORDERS_API_KEY}</code> bằng giá trị biến môi trường trên máy của từng người.</p>",
        file: "examples/ch2/.mcp.json",
        after: "<p>Thành viên mới clone repo chỉ cần đặt biến <code>ORDERS_API_KEY</code> trên máy mình. Lần đầu mở Claude Code, họ sẽ được hỏi có tin tưởng máy chủ trong <code>.mcp.json</code> hay không.</p>",
      },
      {
        title: "Thử trong Claude Code",
        html: "<p>Trong thư mục chứa <code>.mcp.json</code>, đặt biến môi trường, mở Claude Code, gõ <code>/mcp</code> để xem máy chủ đã kết nối chưa, rồi hỏi thử.</p>",
        code: "export ORDERS_API_KEY=\"dev-key\"\nclaude\n> /mcp\n> Đơn 1234 giao chưa?\n> Tra giúp đơn abc",
      },
    ],
    verify: [
      "Có con số tỷ lệ chọn đúng trước và sau khi sửa mô tả.",
      "<code>/mcp</code> trong Claude Code hiện máy chủ <code>orders</code> đã kết nối.",
      "Hỏi đơn 1234 thì Claude gọi <code>mcp__orders__lookup_order</code> và trả lời đúng.",
      "Mã đơn “abc” trả về lỗi có cấu trúc; mã đơn không tồn tại trả về <code>found: false</code>.",
    ],
    deliver: [
      "Không commit khóa bí mật; README của repo hướng dẫn thành viên mới đặt biến môi trường.",
      "Mô tả công cụ và bộ câu hỏi đánh giá được quản lý phiên bản trong git.",
      "Chạy lại bộ đánh giá mỗi khi thêm hoặc sửa công cụ.",
      "Máy chủ MCP gọi API thật có timeout, và phân biệt lỗi tạm thời (cho thử lại) với lỗi quyền (không thử lại).",
    ],
    pitfalls: [
      "Mô tả chung chung kiểu “công cụ tra cứu mạnh mẽ”.",
      "Trả danh sách rỗng khi API bị lỗi, khiến Claude kết luận “không có dữ liệu”.",
      "Ghi token thật vào <code>.mcp.json</code> “vì repo là private”.",
      "Nhồi hàng chục công cụ cho một agent thay vì tách theo vai trò.",
    ],
    links: ["2-1", "2-2", "2-3", "2-4"],
  },

  d3: {
    title: "Thiết lập Claude Code cho repo của khách và bot review trong CI",
    time: 60,
    level: "Trung bình",
    goal: "Tạo bộ cấu hình Claude Code dùng chung cho đội lập trình viên của khách: CLAUDE.md gọn, rule cho file test, lệnh /review, một skill, và bot review pull request chạy trong GitHub Actions.",
    scenario: "Đội lập trình viên của khách bắt đầu dùng Claude Code. Mỗi người cấu hình một kiểu nên kết quả không đồng đều. Bạn đưa toàn bộ cấu hình vào repo để ai clone về cũng dùng giống nhau.",
    prepare: [
      "Một repo thử nghiệm trên GitHub mà bạn có quyền thêm secret và workflow.",
      "Đã cài Claude Code trên máy.",
      "Đã đọc mục 3-1, 3-2, 3-3 và 3-6.",
    ],
    steps: [
      {
        title: "CLAUDE.md gọn cho dự án",
        html: "<p>Chỉ để những gì cần ở mọi phiên: lệnh build và test, quy ước chung. Tài liệu dài để ở file riêng và nhập bằng <code>@đường/dẫn</code> khi cần. Đây là mẫu, hãy sửa theo dự án thật.</p>",
        file: "examples/ch3/CLAUDE.md",
      },
      {
        title: "Rule chỉ áp dụng cho file test",
        html: "<p>Đặt ở <code>.claude/rules/testing.md</code>. Phần <code>paths</code> ở đầu file khiến rule chỉ được nạp khi Claude làm việc với file khớp mẫu, ở bất kỳ thư mục nào.</p>",
        file: "examples/ch3/.claude/rules/testing.md",
      },
      {
        title: "Lệnh /review dùng chung",
        html: "<p>Đặt ở <code>.claude/commands/review.md</code>. Tiêu chí được viết cụ thể: báo gì, không báo gì. Đây cũng là tiêu chí bot CI dùng ở bước 5.</p>",
        file: "examples/ch3/.claude/commands/review.md",
      },
      {
        title: "Skill cho việc hiếm khi làm",
        html: "<p>Viết release notes chỉ cần vài lần mỗi tháng, nên đóng gói thành skill thay vì nhồi vào CLAUDE.md. <code>description</code> nói rõ khi nào dùng; <code>context: fork</code> để kết quả dài không làm đầy phiên chính; <code>allowed-tools</code> giới hạn công cụ.</p>",
        file: "examples/ch3/.claude/skills/release-notes/SKILL.md",
      },
      {
        title: "Bot review trong GitHub Actions",
        html: "<p>Thêm secret <code>ANTHROPIC_API_KEY</code> vào repo, rồi đặt file dưới đây ở <code>.github/workflows/</code>. Ba điểm an toàn: cờ <code>-p</code> để không treo chờ người gõ, <code>--allowedTools</code> chỉ cho đọc và xem diff, và quyền của workflow chỉ đủ để đọc code và viết bình luận.</p>",
        file: "examples/ch3/.github/workflows/claude-review.yml",
        after: "<p>Với pull request từ fork, GitHub mặc định không cấp secret cho sự kiện <code>pull_request</code>, nên bot sẽ không chạy. Đừng vội đổi sang <code>pull_request_target</code> để lấy secret: nó chạy với quyền của repo gốc trên code từ người ngoài. Anthropic cũng có GitHub Action chính thức cho Claude Code; xem tài liệu Claude Code mục GitHub Actions nếu muốn dùng thay cho cách tự viết ở trên.</p>",
      },
    ],
    verify: [
      "Gõ <code>/memory</code> trong Claude Code thấy CLAUDE.md của dự án được nạp.",
      "Khi nhờ sửa một file <code>.test.ts</code>, Claude làm theo quy ước trong rule (hỏi thử “quy ước test ở đây là gì?”).",
      "<code>/review</code> chạy được và chỉ báo các nhóm vấn đề đã định nghĩa.",
      "Nhờ “viết release notes cho bản mới” thì Claude dùng skill <code>release-notes</code>.",
      "Mở một pull request thử: workflow chạy xong (không treo) và có bình luận review.",
    ],
    deliver: [
      "Chỉ định người chịu trách nhiệm cập nhật CLAUDE.md và các rule, giống như với tài liệu dự án.",
      "Ước tính chi phí mỗi lần review một pull request và thống nhất với khách.",
      "Theo dõi tỷ lệ bình luận bị lập trình viên bỏ qua; quá cao thì siết lại tiêu chí trong review.md.",
      "Không cấp Bash đầy đủ hay token có quyền ghi cho bot review.",
    ],
    pitfalls: [
      "CLAUDE.md dài hàng trăm dòng, chứa cả những quy trình hiếm khi dùng.",
      "Quy ước quan trọng nằm trong <code>~/.claude/CLAUDE.md</code> của một người nên người khác không có.",
      "Quên cờ <code>-p</code> nên job CI treo tới hết thời gian chờ.",
      "Mẫu <code>src/*.ts</code> tưởng khớp cả thư mục con (phải dùng <code>**</code>).",
    ],
    links: ["3-1", "3-2", "3-3", "3-6"],
  },

  d4: {
    title: "Trích xuất hóa đơn đáng tin: schema, kiểm tra, thử lại và chạy đêm",
    time: 90,
    level: "Trung bình",
    goal: "Trích xuất hóa đơn ra JSON đúng cấu trúc, tự kiểm tra ý nghĩa của dữ liệu, thử lại kèm lỗi cụ thể, chuyển người khi không tự sửa được, và chạy hàng loạt bằng Batch API.",
    scenario: "Phòng kế toán của khách nhận vài nghìn hóa đơn mỗi tháng và muốn tự động nhập vào hệ thống. Sai một con số là sai sổ sách, nên mọi kết quả phải được kiểm tra, và những gì không chắc phải đến tay người.",
    prepare: [
      "Đã làm bài thực hành chương 0.",
      "Đã đọc mục 4-3 (structured output), 4-4 (kiểm tra và thử lại) và 4-5 (Batch API).",
      "Vài hóa đơn mẫu (có thể tự gõ dạng văn bản để thử).",
    ],
    steps: [
      {
        title: "Thiết kế schema để model không phải bịa",
        html: "<ul><li>Trường có thể vắng mặt (mã số thuế, ngày) cho phép <code>null</code>.</li><li>Trường có tập giá trị cố định dùng <code>enum</code>, kèm lối thoát <code>\"other\"</code>.</li><li>Lấy cả các dòng hàng lẫn tổng in trên giấy (<code>stated_total</code>) để tự đối chiếu.</li></ul><p>Schema này được gửi qua <code>output_config.format</code> (structured outputs), nên câu trả lời luôn là JSON đúng cấu trúc.</p>",
      },
      {
        title: "Trích xuất, kiểm tra và thử lại",
        html: "<p>Hàm <code>validate</code> lo phần schema không lo được: ngày có thật không, tổng các dòng có khớp tổng in trên giấy không. Có lỗi thì gửi lại kèm mô tả lỗi cụ thể; thử tối đa hai lần rồi chuyển người kiểm tra.</p>",
        file: "examples/ch4/extract.py",
        after: "<div class=\"callout warn\"><b>Lưu ý khi làm thật.</b> Đề thi mô tả cách lấy JSON bằng công cụ kèm <code>tool_choice</code> ép gọi. Với các model mới nhất, cách ép này bị từ chối; structured outputs như trong file trên là cách nên dùng. Ý tưởng của đề (schema, trường nullable, kiểm tra sau khi trích xuất) vẫn giữ nguyên.</div>",
      },
      {
        title: "Biết khi nào không thử lại",
        html: "<p>Thử lại chỉ có ích khi lỗi nằm ở cách đọc (ngày sai, cộng sai). Nếu tài liệu <b>không có</b> thông tin, trường đó phải là <code>null</code>, và thử lại chỉ khiến model bịa ra cho đủ. Vì vậy <code>validate</code> không báo lỗi cho trường null, và kết quả <code>needs_review</code> luôn kèm danh sách lỗi để người kiểm tra biết cần xem chỗ nào.</p>",
      },
      {
        title: "Chạy hàng loạt mỗi đêm bằng Batch API",
        html: "<p>Hóa đơn nhập trong ngày không cần kết quả ngay, nên gửi một batch vào buổi tối: rẻ hơn khoảng 50%, xong trong tối đa 24 giờ. Mã tài liệu được dùng làm <code>custom_id</code>, vì kết quả trả về không theo thứ tự gửi.</p>",
        file: "examples/ch4/batch.py",
      },
    ],
    verify: [
      "Với hóa đơn mẫu, kết quả là JSON có đủ các trường, trường không có trên giấy là <code>null</code>.",
      "Sửa hóa đơn mẫu cho tổng in trên giấy sai lệch: kết quả là <code>needs_review</code> kèm lỗi về tổng.",
      "Chạy batch với ít nhất 3 tài liệu và ghép đúng kết quả theo <code>custom_id</code>.",
    ],
    deliver: [
      "Đo độ chính xác trên vài trăm hóa đơn đã có người nhập tay, tách theo loại hóa đơn và theo trường (xem bài chương 5).",
      "Hàng đợi <code>needs_review</code> có giao diện cho kế toán sửa nhanh; lưu lại bản sửa để làm dữ liệu đánh giá.",
      "Tính giờ gửi batch sao cho kể cả khi mất đủ 24 giờ vẫn kịp hạn chót của khách.",
      "Không lưu ảnh hoặc nội dung hóa đơn lâu hơn mức khách cho phép.",
    ],
    pitfalls: [
      "Đặt mọi trường là bắt buộc, khiến model phải bịa khi tài liệu thiếu.",
      "Tin rằng JSON đúng schema nghĩa là số liệu đúng.",
      "Thử lại mà không kèm lỗi cụ thể, hoặc thử lại với thông tin vốn không có trong tài liệu.",
      "Ghép kết quả batch theo thứ tự dòng thay vì theo <code>custom_id</code>.",
    ],
    links: ["4-3", "4-4", "4-5"],
  },

  d5: {
    title: "Đo chất lượng trước khi giảm người kiểm tra",
    time: 60,
    level: "Trung bình",
    goal: "Dựng báo cáo chất lượng theo từng nhóm, kiểm tra độ tự tin có đáng tin không, chọn mẫu kiểm tra hằng tuần bằng lấy mẫu phân tầng, và giữ đúng dữ kiện cũng như nguồn gốc thông tin.",
    scenario: "Sau ba tháng, hệ thống trích xuất của khách đạt 98% độ chính xác tổng. Quản lý muốn bỏ hẳn bước người kiểm tra để tiết kiệm. Bạn cần số liệu để trả lời: bỏ được ở đâu, và chưa được bỏ ở đâu.",
    prepare: [
      "Dữ liệu kết quả đã được người kiểm tra (ở bài này dùng dữ liệu giả lập có sẵn trong script).",
      "Đã đọc mục 5-1, 5-5 và 5-6.",
    ],
    steps: [
      {
        title: "Chuẩn bị dữ liệu đã kiểm tra",
        html: "<p>Mỗi dòng là một trường đã được người kiểm tra, gồm: loại tài liệu, tên trường, độ tự tin model báo, và đúng hay sai. Đây là nguyên liệu cho mọi quyết định ở các bước sau.</p>",
      },
      {
        title: "Đo theo nhóm, hiệu chỉnh độ tự tin, chọn mẫu kiểm tra",
        html: "<p>Chạy <code>python quality.py</code>. Script in độ chính xác theo từng loại tài liệu, bảng đối chiếu độ tự tin với tỷ lệ đúng thật, và một mẫu 300 tài liệu chia theo loại.</p>",
        file: "examples/ch5/quality.py",
        after: "<p>Với dữ liệu giả lập, con số tổng khoảng 98% nhưng hợp đồng nước ngoài chỉ khoảng 60%. Nếu lấy ngẫu nhiên 300 tài liệu, bạn chỉ có khoảng 6 hợp đồng nước ngoài, quá ít để thấy vấn đề; lấy mẫu phân tầng bảo đảm mỗi nhóm có ít nhất 30 mẫu.</p>",
      },
      {
        title: "Giữ dữ kiện và nguồn gốc thông tin",
        html: "<p>Hai mẫu nhỏ cho những lỗi hay gặp nhất ở chương 5: case facts luôn nằm ở đầu và không bao giờ bị tóm tắt, và mỗi nhận định đi kèm nguồn, ngày, loại số liệu từ đầu tới cuối.</p>",
        file: "examples/ch5/context.py",
      },
      {
        title: "Viết báo cáo cho khách",
        html: "<p>Một trang là đủ, gồm: độ chính xác theo từng nhóm kèm số mẫu, nhóm nào đủ tốt để giảm kiểm tra (và giảm tới mức nào), nhóm nào phải giữ nguyên, kế hoạch lấy mẫu hằng tuần, và điều kiện để xem xét lại (ví dụ khi đổi model hoặc khách thêm loại tài liệu mới).</p>",
      },
    ],
    verify: [
      "Chỉ ra được nhóm có độ chính xác thấp mà con số tổng đã che mất.",
      "Bảng hiệu chỉnh cho biết độ tự tin 0,95 tương ứng với tỷ lệ đúng thật là bao nhiêu.",
      "Mẫu kiểm tra hằng tuần có đủ tài liệu của nhóm hiếm.",
    ],
    deliver: [
      "Chỉ giảm kiểm tra cho những nhóm đã chứng minh tốt, có số mẫu đủ lớn.",
      "Luôn giữ một tỷ lệ kiểm tra ngẫu nhiên ở cả nhóm tự tin cao.",
      "Đo lại toàn bộ khi đổi model, đổi prompt, hoặc khách thêm loại tài liệu mới.",
    ],
    pitfalls: [
      "Quyết định dựa trên một con số độ chính xác tổng.",
      "Chỉ kiểm tra những kết quả có độ tự tin thấp, bỏ sót lỗi “tự tin nhưng sai”.",
      "Tóm tắt hội thoại làm mất số tiền, ngày tháng mà khách đã cung cấp.",
      "Gộp hai số liệu mâu thuẫn thành một con số trung bình.",
    ],
    links: ["5-1", "5-5", "5-6"],
  },
};
