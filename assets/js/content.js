/* Nội dung khóa học CCA-F — chia theo chương (domain) và mục (task statement).
   Tài liệu ôn tập độc lập, không phải tài liệu chính thức của Anthropic. */
window.COURSE = {
  exam: {
    name: "Claude Certified Architect – Foundations (CCA-F)",
    questions: 60,
    minutes: 120,
    passScore: 720,
    maxScore: 1000,
  },
  chapters: [
    /* ───────────────────────── CHƯƠNG 0 ───────────────────────── */
    {
      id: "d0",
      num: 0,
      title: "Nhập môn & tổng quan kỳ thi",
      short: "Nhập môn",
      weight: 0,
      color: "slate",
      summary: "Kiến thức nền cho người mới, cấu trúc đề, cách tính điểm, các kịch bản thực tế và lộ trình ôn tập.",
      sections: [
        {
          id: "0-0",
          title: "Kiến thức nền: Claude, API, token và công cụ",
          goals: ["Hiểu một lần gọi Claude API gửi đi gì và nhận về gì", "Biết token, context window và max_tokens ảnh hưởng tới chi phí và giới hạn ra sao", "Phân biệt Claude API, Agent SDK, Claude Code và MCP để biết mỗi chương nói về cái gì"],
          widget: "apiBasics",
          body: `
<p class="lead"><b>Nói ngắn gọn:</b> trước khi học về agent, bạn cần nắm sáu khái niệm: model, API, token, cuộc hội thoại, công cụ, và ba cách dùng Claude. Bài này giải thích từng khái niệm bằng ví dụ đời thường. Nếu bạn đã từng gọi API của một mô hình ngôn ngữ, có thể đọc lướt.</p>
<h4>1. Claude và “model”</h4>
<p>Claude là một mô hình ngôn ngữ lớn (LLM): bạn đưa vào một đoạn chữ, nó viết ra một đoạn chữ. Anthropic cung cấp nhiều phiên bản gọi là <b>model</b>, mỗi model có một mã riêng. Dòng Opus mạnh nhất, Sonnet cân bằng giữa chất lượng và tốc độ, Haiku nhanh và rẻ nhất. Khi gọi Claude, bạn phải chọn model, ví dụ <code>claude-opus-5-5</code>.</p>
<h4>2. Gọi Claude qua API</h4>
<p>API giống một quầy giao dịch. Chương trình của bạn gửi một <b>request</b> (yêu cầu) tới địa chỉ của Anthropic, và nhận về một <b>response</b> (phản hồi). Cả hai viết dưới dạng JSON. Một request tối thiểu trông như sau:</p>
<pre><code>{
  "model": "claude-opus-5-5",
  "max_tokens": 1024,
  "system": "Bạn là nhân viên chăm sóc khách hàng của cửa hàng ABC.",
  "messages": [
    { "role": "user", "content": "Cửa hàng cho đổi size giày trong bao lâu?" }
  ]
}</code></pre>
<p>Response trả về có ba phần bạn sẽ gặp suốt khóa học: <code>content</code> (nội dung trả lời), <code>stop_reason</code> (vì sao Claude dừng) và <code>usage</code> (đã dùng bao nhiêu token). Để gọi được API, bạn cần một <b>API key</b>. Key giống mật khẩu ngân hàng: ai có nó là gọi được và bạn trả tiền, nên luôn để trong biến môi trường hoặc kho bí mật, không bao giờ ghi vào code hay đưa lên GitHub.</p>
<h4>3. Token: đơn vị tính chữ và tính tiền</h4>
<p>Claude không đọc theo chữ cái mà theo <b>token</b>, là những mẩu chữ ngắn (một từ tiếng Anh thường là một token, tiếng Việt thường tốn nhiều token hơn). Token quan trọng vì ba lý do:</p>
<ul>
  <li><b>Tiền:</b> bạn trả tiền theo số token gửi vào (input) và số token Claude viết ra (output). Token đầu ra thường đắt hơn đầu vào vài lần.</li>
  <li><b>Context window:</b> tổng số token model đọc được trong một lần gọi. Mọi thứ bạn gửi (hướng dẫn, tài liệu, lịch sử trò chuyện) phải nằm vừa trong giới hạn này.</li>
  <li><b>max_tokens:</b> giới hạn độ dài <i>câu trả lời</i> do bạn đặt. Đặt thấp quá thì câu trả lời bị cắt giữa chừng.</li>
</ul>
<h4>4. Claude không có trí nhớ giữa các lần gọi</h4>
<p>Mỗi lần gọi API là độc lập. Claude không nhớ bạn đã hỏi gì ở lần trước. Muốn trò chuyện nhiều lượt, chương trình của bạn phải tự giữ lịch sử và gửi lại <b>toàn bộ</b> mỗi lần, trong mảng <code>messages</code> với các lượt <code>user</code> và <code>assistant</code> xen kẽ. Phần <code>system</code> là hướng dẫn chung áp dụng cho cả cuộc trò chuyện. Hệ quả: hội thoại càng dài thì mỗi lượt càng tốn nhiều token. Đây là gốc rễ của nhiều câu hỏi về chi phí và về việc “quên” thông tin ở chương 5.</p>
<h4>5. Công cụ: cách Claude làm việc với hệ thống của bạn</h4>
<p>Claude không tự truy cập được cơ sở dữ liệu hay gọi hệ thống của bạn. Bạn mô tả cho nó các <b>công cụ</b> (tool): tên, mô tả, và dữ liệu đầu vào cần có. Khi cần, Claude trả về một yêu cầu <code>tool_use</code> kiểu “hãy chạy tra_cuu_don_hang với mã 1234”. Chương trình của bạn chạy thật, rồi gửi kết quả lại dưới dạng <code>tool_result</code>. Lặp lại việc này nhiều lần chính là một <b>agent</b>, chủ đề của chương 1.</p>
<h4>6. Đọc JSON trong một phút</h4>
<p>Các mô phỏng trong khóa học hiển thị dữ liệu dạng JSON. Bạn chỉ cần nhận ra: <code>{ }</code> là một đối tượng gồm các cặp <code>"tên": giá trị</code>; <code>[ ]</code> là một danh sách; chữ nằm trong dấu ngoặc kép; ngoài ra có số, <code>true</code>/<code>false</code> (đúng/sai) và <code>null</code> (không có giá trị).</p>
<h4>7. Ba cách dùng Claude, và MCP</h4>
<table class="t">
  <tr><th>Cách dùng</th><th>Là gì</th><th>Khi nào dùng</th></tr>
  <tr><td><b>Claude API</b></td><td>Gọi trực tiếp như ví dụ ở trên. Bạn tự viết vòng lặp, tự chạy công cụ.</td><td>Xây sản phẩm riêng: chatbot, hệ thống trích xuất dữ liệu, agent chăm sóc khách hàng.</td></tr>
  <tr><td><b>Claude Agent SDK</b></td><td>Thư viện có sẵn vòng lặp agent, công cụ đọc và sửa file, hook, subagent.</td><td>Xây agent phức tạp mà không phải tự viết phần khung.</td></tr>
  <tr><td><b>Claude Code</b></td><td>Trợ lý lập trình chạy trong terminal, cấu hình bằng file như CLAUDE.md, .mcp.json.</td><td>Lập trình viên làm việc hằng ngày, hoặc chạy tự động trong CI/CD.</td></tr>
</table>
<p><b>MCP</b> (Model Context Protocol) là một chuẩn chung để “cắm” công cụ và dữ liệu bên ngoài vào Claude, giống cổng USB: ai cũng viết được một máy chủ MCP, và Claude Code hay Agent SDK đều dùng được nó.</p>
<h4>Bản đồ khóa học</h4>
<ul>
  <li><b>Chương 1:</b> vòng lặp agent, nhiều agent phối hợp, hook. Tức là cách xây một agent chạy ổn định.</li>
  <li><b>Chương 2:</b> thiết kế công cụ và kết nối MCP sao cho Claude chọn đúng và xử lý lỗi tốt.</li>
  <li><b>Chương 3:</b> cấu hình Claude Code cho một nhóm lập trình viên và cho CI/CD.</li>
  <li><b>Chương 4:</b> viết prompt rõ ràng và lấy đầu ra có cấu trúc (JSON) đáng tin cậy.</li>
  <li><b>Chương 5:</b> giữ thông tin quan trọng trong hội thoại dài, xử lý lỗi, và biết khi nào cần con người.</li>
</ul>`,
          keyPoints: [
            "Mỗi lần gọi API là độc lập: Claude không nhớ gì, chương trình phải gửi lại cả hội thoại.",
            "Token là đơn vị tính tiền và giới hạn: context window cho phần đọc vào, max_tokens cho phần trả lời.",
            "Claude không tự chạy công cụ: nó chỉ yêu cầu, chương trình của bạn mới là bên chạy thật.",
            "API key là bí mật: để trong biến môi trường hoặc kho bí mật, không ghi vào code.",
          ],
          tip: "Nhiều đáp án sai trong đề dựa trên hiểu nhầm cơ bản như “model tự nhớ hội thoại” hay “Claude tự gọi được hệ thống”. Nắm chắc bài này giúp bạn loại nhanh những đáp án đó.",
          quiz: [
            {
              q: "Khách nhắn ba tin liên tiếp với chatbot. Ở lần gọi API thứ ba, chương trình cần gửi gì để Claude hiểu đúng ngữ cảnh?",
              options: ["Chỉ tin nhắn thứ ba, vì Claude đã lưu hai tin trước trên máy chủ", "Cả ba tin của khách cùng hai câu trả lời trước đó, theo đúng thứ tự", "Chỉ tin nhắn thứ ba kèm mã phiên để Claude tự tìm lại lịch sử", "Một câu tóm tắt cả cuộc trò chuyện thay cho các tin nhắn cũ"],
              en: { q: "A customer sends three messages in a row to a chatbot. On the third API call, what must the program send so Claude understands the context?", options: ["Only the third message, since Claude stored the first two on its servers", "All three customer messages plus the two previous replies, in order", "Only the third message with a session ID so Claude can look up the history", "A one-line summary of the conversation instead of the old messages"] },
              answer: 1,
              explain: "API không lưu trạng thái giữa các lần gọi. Mỗi lần, chương trình gửi lại toàn bộ hội thoại (tin của người dùng và các câu trả lời trước của Claude) theo đúng thứ tự.",
            },
            {
              q: "Câu trả lời của Claude thường bị cắt ngang giữa câu, và stop_reason là \"max_tokens\". Thứ gì nhiều khả năng đang đặt quá thấp?",
              options: ["Kích thước context window của model đang dùng", "Tham số temperature trong request", "Tham số max_tokens trong request", "Số lượng công cụ khai báo trong request"],
              en: { q: "Claude's replies are often cut off mid-sentence, and stop_reason is \"max_tokens\". What is most likely set too low?", options: ["The context window size of the model in use", "The temperature parameter in the request", "The max_tokens parameter in the request", "The number of tools declared in the request"] },
              answer: 2,
              explain: "max_tokens giới hạn độ dài phần trả lời. Khi chạm giới hạn, Claude dừng giữa chừng và stop_reason là \"max_tokens\". Context window là giới hạn tổng cho phần đọc vào, khác với giới hạn độ dài câu trả lời.",
            },
            {
              q: "Nhóm lập trình viên của khách muốn một trợ lý đọc và sửa code ngay trong terminal, với quy ước chung đặt trong repo. Nên dùng gì?",
              options: ["Claude Code, với CLAUDE.md và .mcp.json đặt trong repo", "Tự viết vòng lặp gọi Claude API và công cụ đọc file từ đầu", "Message Batches API để xử lý code mỗi đêm một lần", "Một máy chủ MCP riêng, không cần công cụ nào khác"],
              en: { q: "A customer's developer team wants an assistant that reads and edits code right in the terminal, with shared conventions stored in the repo. What should they use?", options: ["Claude Code, with CLAUDE.md and .mcp.json in the repo", "Write their own loop around the Claude API plus file tools from scratch", "The Message Batches API to process code once a night", "A standalone MCP server with no other tooling"] },
              answer: 0,
              explain: "Claude Code chính là trợ lý lập trình chạy trong terminal, cấu hình chung qua các file đặt trong repo. Tự viết từ đầu là làm lại thứ đã có sẵn; Batch API không dùng cho làm việc tương tác; MCP chỉ là cách cắm thêm công cụ.",
            },
          ],
        },
        {
          id: "0-1",
          title: "Định dạng kỳ thi & cách tính điểm",
          goals: ["Biết đề thi có bao nhiêu câu, bao nhiêu phút và cần bao nhiêu điểm để đạt", "Biết năm lĩnh vực và lĩnh vực nào chiếm nhiều câu nhất", "Hiểu vì sao đáp án đúng thường là cách sửa đúng nguyên nhân, đơn giản nhất"],
          widget: "examOverview",
          body: `
<p class="lead"><b>Nói ngắn gọn:</b> CCA-F kiểm tra xem bạn có biết cách thiết kế một ứng dụng dùng Claude chạy ổn định ngoài đời thật hay không, chứ không kiểm tra bạn thuộc bao nhiêu tên lệnh.</p>
<p>CCA-F (Claude Certified Architect – Foundations) là chứng chỉ dành cho người thiết kế hệ thống dùng Claude: gọi Claude qua API, xây agent bằng Claude Agent SDK, làm việc với Claude Code và kết nối công cụ qua MCP (Model Context Protocol).</p>
<h4>Đề thi trông như thế nào</h4>
<ul>
  <li>60 câu trắc nghiệm, mỗi câu có đúng một đáp án.</li>
  <li>Thời gian làm bài là 120 phút, trung bình 2 phút cho mỗi câu.</li>
  <li>Điểm được quy đổi về thang 100–1000. Bạn cần ít nhất 720 điểm để đạt.</li>
  <li>Trả lời sai không bị trừ điểm, nên đừng bỏ trống câu nào.</li>
</ul>
<h4>Điểm khác biệt: câu hỏi dạng tình huống</h4>
<p>Phần lớn câu hỏi mô tả một hệ thống đang chạy và gặp sự cố, ví dụ “agent thỉnh thoảng hoàn tiền khi chưa xác minh khách hàng”. Đề hỏi bạn nên sửa thế nào. Thường sẽ có hai hoặc ba phương án nghe đều hợp lý. Phương án đúng là phương án sửa đúng nguyên nhân gốc, đủ tin cậy cho môi trường thật, và không phức tạp hơn mức cần thiết.</p>
<p>Đề chia thành 5 lĩnh vực với trọng số khác nhau. Biểu đồ bên dưới cho biết mỗi lĩnh vực chiếm khoảng bao nhiêu câu, giúp bạn biết nên dành nhiều thời gian ôn phần nào.</p>`,
          keyPoints: [
            "60 câu, 120 phút, cần từ 720/1000 điểm để đạt.",
            "Năm lĩnh vực: Kiến trúc agent 27%, Claude Code 20%, Prompt & đầu ra có cấu trúc 20%, Công cụ & MCP 18%, Ngữ cảnh & độ tin cậy 15%.",
            "Câu hỏi là tình huống thực tế. Đáp án đúng thường là cách sửa đúng nguyên nhân, đáng tin cậy và gọn nhất.",
          ],
          tip: "Khi hai đáp án đều “chạy được”, hãy chọn cách đáng tin cậy hơn khi chạy thật. Ví dụ: chặn bằng code luôn chắc chắn hơn chỉ dặn dò trong prompt.",
          quiz: [
            {
              q: "Lĩnh vực nào có trọng số lớn nhất trong đề CCA-F?",
              options: ["Prompt Engineering & Structured Output", "Agentic Architecture & Orchestration", "Tool Design & MCP Integration", "Context Management & Reliability"],
              en: { q: "Which domain carries the largest weight on the CCA-F exam?", options: ["Prompt Engineering & Structured Output", "Agentic Architecture & Orchestration", "Tool Design & MCP Integration", "Context Management & Reliability"] },
              answer: 1,
              explain: "Agentic Architecture & Orchestration chiếm khoảng 27% — tương đương ~16 câu trong 60 câu.",
            },
          ],
        },
        {
          id: "0-2",
          title: "Các kịch bản thi & lộ trình ôn tập",
          goals: ["Nhận ra sáu kịch bản thực tế mà các câu hỏi thường dựa vào", "Đọc một câu hỏi theo thứ tự: hệ thống gì, ràng buộc gì, rồi mới tới đáp án", "Lập được lịch ôn theo trọng số của từng chương"],
          widget: "studyPlan",
          body: `
<p class="lead"><b>Nói ngắn gọn:</b> mọi câu hỏi đều xoay quanh sáu loại hệ thống quen thuộc. Nhận ra câu hỏi đang nói về loại nào giúp bạn đoán được đề muốn kiểm tra kiến thức gì.</p>
<h4>Sáu kịch bản hay gặp</h4>
<ul>
  <li><b>Agent chăm sóc khách hàng:</b> xử lý hoàn tiền, xác minh danh tính, biết khi nào cần chuyển cho nhân viên thật.</li>
  <li><b>Viết code với Claude Code:</b> cấu hình CLAUDE.md, tạo lệnh tắt (slash command), dùng chế độ lập kế hoạch (plan mode).</li>
  <li><b>Hệ thống nghiên cứu nhiều agent:</b> một agent điều phối chia việc cho các agent con tìm kiếm, phân tích, tổng hợp.</li>
  <li><b>Công cụ cho lập trình viên:</b> kết nối máy chủ MCP, dùng các công cụ có sẵn như Grep, Read, Edit.</li>
  <li><b>Claude Code trong CI/CD:</b> chạy tự động trên máy chủ build để review pull request.</li>
  <li><b>Trích xuất dữ liệu:</b> đọc hóa đơn, hợp đồng và xuất ra dữ liệu có cấu trúc (JSON).</li>
</ul>
<h4>Cách đọc một câu hỏi</h4>
<p>Đọc theo ba bước. Đầu tiên, xác định hệ thống đang nói tới là loại nào. Tiếp theo, tìm ràng buộc chính: cần chắc chắn tuyệt đối, cần rẻ, cần nhanh, hay cần an toàn? Có ai đang ngồi chờ kết quả không? Cuối cùng mới đọc các đáp án và loại dần những cách vi phạm ràng buộc đó.</p>
<p>Lộ trình bên dưới chia thời gian ôn theo trọng số của từng chương. Bấm vào từng tuần để đánh dấu khi bạn hoàn thành.</p>`,
          keyPoints: [
            "Đọc câu hỏi theo thứ tự: hệ thống gì, ràng buộc gì, rồi mới tới đáp án.",
            "Chương nào nặng điểm thì dành nhiều thời gian hơn.",
            "Tự tay làm thử: viết một vòng lặp agent nhỏ, viết CLAUDE.md, cấu hình .mcp.json.",
          ],
          tip: "Loại nhanh những đáp án “làm quá tay” như dựng thêm hạ tầng hoặc fine-tune model, khi vấn đề có thể giải quyết bằng cấu hình hay prompt tốt hơn.",
          quiz: [
            {
              q: "Khi đọc một câu hỏi dạng kịch bản, bước nào nên làm trước tiên?",
              options: ["Đọc lướt bốn đáp án để đoán xem đề đang hỏi về công cụ nào", "Xác định đây là hệ thống gì và ràng buộc chính (tin cậy, chi phí, độ trễ)", "Tìm trong đáp án từ khóa trùng với tên công cụ được nhắc trong đề", "Loại ngay những đáp án có nhắc tới hook hoặc subagent vì thường phức tạp"],
              en: { q: "When reading a scenario-based question, what should you do first?", options: ["Skim the four options to guess which tool the question is about", "Identify what kind of system it is and the key constraint (reliability, cost, latency)", "Look for options containing keywords that match a tool named in the question", "Eliminate any option that mentions hooks or subagents, since they are usually overkill"] },
              answer: 1,
              explain: "Ràng buộc của kịch bản quyết định đáp án: ví dụ cần kết quả ngay thì Batch API bị loại, cần tuân thủ tuyệt đối thì prompt đơn thuần bị loại.",
            },
          ],
        },
      ],
      flashcards: [
        { front: "Số câu, thời gian, điểm đạt CCA-F?", back: "60 câu, 120 phút, đạt từ 720/1000." },
        { front: "5 lĩnh vực và trọng số?", back: "Agentic 27% · Claude Code 20% · Prompt & Structured Output 20% · Tool & MCP 18% · Context & Reliability 15%." },
      ],
    },

    /* ───────────────────────── CHƯƠNG 1 ───────────────────────── */
    {
      id: "d1",
      num: 1,
      title: "Agentic Architecture & Orchestration",
      vi: "Kiến trúc agent & điều phối",
      short: "Kiến trúc Agent",
      weight: 27,
      color: "violet",
      summary: "Vòng lặp agent, hệ thống đa agent, subagent, hook, phân rã tác vụ và quản lý phiên.",
      sections: [
        {
          id: "1-1",
          title: "Vòng lặp agent (agentic loop)",
          goals: ["Mô tả được một lượt của vòng lặp agent: gửi, nhận, chạy công cụ, gửi lại", "Dùng stop_reason để quyết định chạy tiếp hay dừng, kể cả trường hợp max_tokens", "Ghép đúng tool_use với tool_result, kể cả khi một công cụ bị lỗi"],
          widget: "agentLoop",
          body: `
<p class="lead"><b>Hình dung:</b> Claude giống một chuyên viên tư vấn ngồi trong phòng kín. Họ không tự cầm máy gọi xuống kho được. Khi cần tra đơn hàng, họ viết một tờ giấy “nhờ tra giúp đơn #1234” rồi đưa ra ngoài. Bạn (chương trình của bạn) cầm tờ giấy đi tra thật, rồi mang kết quả vào. Việc này lặp lại cho tới khi chuyên viên nói “tôi xong rồi”. Vòng lặp qua lại đó chính là vòng lặp agent.</p>
<h4>Vòng lặp diễn ra thế nào</h4>
<p>Chương trình của bạn gửi cho Claude toàn bộ cuộc hội thoại cùng danh sách công cụ Claude được phép dùng. Claude trả lời, kèm theo một trường tên là <code>stop_reason</code>, nghĩa là “lý do Claude dừng lại ở lượt này”. Chương trình chỉ cần nhìn vào trường này để biết bước tiếp theo:</p>
<ul>
  <li><code>stop_reason: "tool_use"</code>: Claude đang nhờ chạy một công cụ. Chương trình chạy công cụ đó, thêm kết quả vào cuộc hội thoại dưới dạng <code>tool_result</code>, rồi gửi lại cho Claude.</li>
  <li><code>stop_reason: "end_turn"</code>: Claude đã làm xong. Chương trình thoát vòng lặp và gửi câu trả lời cho người dùng.</li>
</ul>
<p>Kết quả của công cụ bắt buộc phải được đưa trở lại cuộc hội thoại. Claude không có trí nhớ giữa các lần gọi, nên nếu không thấy kết quả thì nó không biết bước tiếp theo nên làm gì. Bước tiếp theo do chính Claude quyết định dựa trên những gì nó thấy, không phải do một chuỗi if/else viết sẵn.</p>
<h4>Những cách làm sai hay gặp</h4>
<ul>
  <li>Đọc nội dung câu trả lời (ví dụ thấy chữ “xong rồi”) để quyết định dừng. Claude có thể vừa nói “mình đang xử lý” vừa xin chạy công cụ trong cùng một câu trả lời.</li>
  <li>Dừng vòng lặp chỉ vì câu trả lời có chữ. Có chữ không có nghĩa là đã xong.</li>
  <li>Dùng giới hạn số vòng (ví dụ tối đa 10 vòng) làm cách dừng chính. Giới hạn này chỉ nên là lưới an toàn, phòng khi có gì đó bất thường.</li>
</ul>`,
          keyPoints: [
            "Quyết định dừng hay chạy tiếp dựa vào stop_reason, không dựa vào nội dung chữ.",
            "tool_use: chạy công cụ, thêm tool_result vào hội thoại, gửi lại. end_turn: dừng.",
            "Giới hạn số vòng chỉ là lưới an toàn, không phải tín hiệu hoàn thành.",
          ],
          tip: "Đáp án nhắc tới việc kiểm tra stop_reason gần như luôn tốt hơn đáp án đọc nội dung câu trả lời của model.",
          quiz: [
            {
              q: "Agent của bạn đôi khi dừng sớm vì code kiểm tra 'response có chứa text không' để kết thúc vòng lặp. Cách sửa đúng là gì?",
              options: [
                "Thêm vào system prompt: 'chỉ trả lời bằng chữ khi đã làm xong mọi việc'",
                "Dừng khi stop_reason là \"end_turn\", tiếp tục khi là \"tool_use\"",
                "Bỏ kiểm tra chữ, chạy cố định 10 vòng lặp rồi mới dừng",
                "Chỉ dừng khi câu trả lời có các cụm như 'hoàn thành' hoặc 'đã xong'",
              ],
              en: { q: "Your agent sometimes stops early because the code checks 'does the response contain text?' to end the loop. What is the correct fix?", options: ["Add to the system prompt: 'only reply with text once everything is done'", "Stop when stop_reason is \"end_turn\" and continue when it is \"tool_use\"", "Drop the text check and always run exactly 10 iterations before stopping", "Only stop when the reply contains phrases like 'completed' or 'all done'"] },
              answer: 1,
              explain: "stop_reason là tín hiệu có cấu trúc, đáng tin cậy. Response có thể vừa chứa text vừa chứa tool_use, nên kiểm tra text là sai.",
            },
            {
              q: "Sau khi thực thi công cụ, kết quả cần được xử lý thế nào?",
              options: [
                "Lưu kết quả vào database để Claude tự tra cứu ở lượt sau",
                "Thêm vào messages dưới dạng tool_result rồi gọi Claude lần nữa",
                "Ghép kết quả vào system prompt để Claude luôn nhìn thấy",
                "Chỉ gửi lại cho Claude khi công cụ báo lỗi, còn lại trả thẳng cho khách",
              ],
              en: { q: "After a tool has been executed, what should happen to its result?", options: ["Store it in a database so Claude can look it up on the next turn", "Append it to messages as a tool_result and call Claude again", "Merge it into the system prompt so Claude always sees it", "Send it back to Claude only if the tool failed; otherwise return it to the user"] },
              answer: 1,
              explain: "Claude cần thấy tool_result trong lịch sử hội thoại để suy luận bước tiếp theo.",
            },
          ],
        },
        {
          id: "1-2",
          title: "Hệ thống đa agent: coordinator – subagent",
          goals: ["Hiểu vai trò của coordinator và subagent trong mô hình trục và nan hoa", "Biết subagent không tự thấy lịch sử của coordinator", "Tìm đúng nguyên nhân khi báo cáo cuối thiếu nội dung"],
          widget: "hubSpoke",
          body: `
<p class="lead"><b>Hình dung:</b> một trưởng nhóm nhận dự án lớn, chia thành phần nhỏ và giao cho từng thành viên qua phiếu giao việc. Thành viên chỉ biết những gì ghi trên phiếu, không nghe được các cuộc họp trước đó. Mọi kết quả đều nộp lại cho trưởng nhóm để ghép thành báo cáo chung. Trong hệ thống nhiều agent, trưởng nhóm là <b>coordinator</b> (agent điều phối), còn các thành viên là <b>subagent</b> (agent con).</p>
<h4>Mô hình “trục và nan hoa”</h4>
<p>Mô hình này còn gọi là hub-and-spoke: coordinator đứng ở giữa như trục bánh xe, các subagent là nan hoa. Subagent không nói chuyện trực tiếp với nhau. Mọi thông tin đều đi qua coordinator. Nhờ vậy bạn có một chỗ duy nhất để theo dõi hệ thống đang làm gì, xử lý lỗi theo cùng một cách, và áp dụng chính sách chung.</p>
<h4>Coordinator chịu trách nhiệm gì</h4>
<ul>
  <li>Chia nhiệm vụ lớn thành các phần nhỏ, bao quát đủ mọi khía cạnh.</li>
  <li>Chọn subagent phù hợp cho từng phần. Câu hỏi đơn giản thì không cần huy động tất cả.</li>
  <li>Ghi rõ trên “phiếu giao việc” mọi thông tin subagent cần, vì subagent không tự biết lịch sử trò chuyện của coordinator.</li>
  <li>Nhận kết quả, kiểm tra chỗ còn thiếu và ghép lại.</li>
</ul>
<h4>Rủi ro hay gặp nhất</h4>
<p>Coordinator chia việc quá hẹp. Ví dụ đề tài là “AI trong các ngành sáng tạo” nhưng coordinator chỉ giao ba phần đều thuộc nghệ thuật thị giác, bỏ quên âm nhạc, văn học, điện ảnh. Từng subagent đều làm tốt phần của mình, vậy mà báo cáo cuối vẫn thiếu. Lỗi nằm ở bước chia việc, không nằm ở subagent.</p>`,
          keyPoints: [
            "Subagent không tự biết lịch sử của coordinator. Mọi thứ cần biết phải được ghi rõ khi giao việc.",
            "Coordinator chia việc, chọn người, truyền thông tin, ghép kết quả và xử lý lỗi.",
            "Báo cáo thiếu nội dung dù mọi subagent làm tốt: kiểm tra bước chia việc trước.",
          ],
          tip: "Khi báo cáo tổng hợp thiếu nội dung, hãy xem lại cách coordinator chia việc trước khi đổ lỗi cho subagent.",
          quiz: [
            {
              q: "Hệ thống nghiên cứu đa agent cho ra báo cáo bỏ sót nhiều khía cạnh, dù log cho thấy mỗi subagent đều hoàn thành tốt phần được giao. Nguyên nhân gốc khả dĩ nhất?",
              options: [
                "Subagent tìm kiếm dùng truy vấn quá ngắn nên trả về ít nguồn",
                "Coordinator chia chủ đề thành các tác vụ con quá hẹp",
                "Subagent tổng hợp bị giới hạn token nên phải cắt bớt nội dung",
                "Thiếu một subagent kiểm tra lại chính tả và trình bày báo cáo",
              ],
              en: { q: "A multi-agent research system produces reports that miss many aspects, even though logs show every subagent completed its assigned part well. What is the most likely root cause?", options: ["The search subagent uses queries that are too short, so it finds few sources", "The coordinator decomposed the topic into subtasks that are too narrow", "The synthesis subagent hits its token limit and has to cut content", "There is no subagent to proofread and format the final report"] },
              answer: 1,
              explain: "Subagent chỉ làm những gì được giao. Nếu tất cả đều làm đúng mà vẫn thiếu, lỗi nằm ở bước phân rã.",
            },
            {
              q: "Subagent phân tích không biết các nguồn mà subagent tìm kiếm đã thu thập. Cách khắc phục?",
              options: [
                "Bật tùy chọn chia sẻ bộ nhớ chung để mọi subagent cùng thấy dữ liệu",
                "Coordinator đưa kết quả tìm kiếm vào prompt của subagent phân tích",
                "Cho subagent phân tích tự gọi lại subagent tìm kiếm khi cần",
                "Tăng max_tokens để subagent phân tích nhớ được nhiều hơn",
              ],
              en: { q: "The analysis subagent does not know which sources the search subagent collected. How do you fix this?", options: ["Turn on a shared-memory option so every subagent sees the same data", "Have the coordinator pass the search results into the analysis subagent's prompt", "Let the analysis subagent call the search subagent itself when needed", "Raise max_tokens so the analysis subagent can remember more"] },
              answer: 1,
              explain: "Ngữ cảnh subagent là cô lập; coordinator phải truyền thông tin cần thiết một cách tường minh.",
            },
          ],
        },
        {
          id: "1-3",
          title: "Gọi subagent & truyền ngữ cảnh",
          goals: ["Gọi subagent bằng công cụ Task và biết cần khai báo gì trong allowedTools", "Viết phiếu giao việc đủ thông tin, kèm nguồn gốc dữ liệu", "Cho nhiều subagent chạy song song trong cùng một lượt"],
          widget: "contextPassing",
          body: `
<p class="lead"><b>Hình dung:</b> giao việc cho một cộng tác viên làm từ xa, người chưa từng dự cuộc họp nào của nhóm. Phiếu giao việc phải tự đủ: mục tiêu là gì, dữ liệu đầu vào đâu, làm xong thì nộp theo mẫu nào. Thiếu một trong các thứ đó là họ phải đoán.</p>
<h4>Gọi subagent bằng công cụ Task</h4>
<p>Trong Claude Agent SDK, coordinator gọi subagent bằng một công cụ tên là <b>Task</b>. Đây cũng là một công cụ bình thường, nên coordinator phải được phép dùng nó: danh sách <code>allowedTools</code> (các công cụ được phép) của coordinator phải có <code>"Task"</code>. Nếu thiếu, coordinator không có cách nào giao việc.</p>
<p>Mỗi loại subagent được khai báo bằng một <code>AgentDefinition</code> gồm: mô tả ngắn (để coordinator biết khi nào nên gọi), hướng dẫn riêng cho subagent đó, và danh sách công cụ nó được dùng.</p>
<h4>Viết phiếu giao việc cho tốt</h4>
<ul>
  <li>Đưa thẳng vào phần nhiệm vụ (prompt) những dữ liệu subagent cần, chẳng hạn kết quả tìm kiếm của bước trước.</li>
  <li>Nêu mục tiêu và tiêu chí “thế nào là làm tốt”.</li>
  <li>Giữ thông tin nguồn đi kèm dữ liệu (đường dẫn, tên tài liệu, ngày) theo định dạng rõ ràng, để bước sau còn trích dẫn được.</li>
</ul>
<h4>Chạy song song</h4>
<p>Khi các phần việc độc lập với nhau, coordinator có thể giao tất cả trong <b>cùng một lượt trả lời</b>, bằng cách đưa ra nhiều lệnh Task một lúc. Các subagent sẽ chạy cùng lúc. Nếu giao từng việc qua từng lượt, tổng thời gian sẽ bằng thời gian các việc cộng lại.</p>
<p>Với chính coordinator, nên mô tả mục tiêu và tiêu chí thay vì viết kịch bản từng bước cứng nhắc. Như vậy hệ thống còn tự điều chỉnh được khi phát hiện điều mới.</p>`,
          keyPoints: [
            "allowedTools của coordinator phải có \"Task\" thì mới giao việc được.",
            "Nhiều lệnh Task trong cùng một lượt trả lời sẽ chạy song song.",
            "Truyền dữ liệu kèm thông tin nguồn, theo định dạng rõ ràng.",
          ],
          tip: "Câu hỏi về giảm thời gian chờ của hệ thống nhiều agent: tìm đáp án “gọi nhiều subagent song song trong cùng một lượt”.",
          quiz: [
            {
              q: "Coordinator gọi lần lượt 4 subagent tìm kiếm độc lập, mỗi lượt một subagent, khiến độ trễ cao. Cải thiện tốt nhất?",
              options: [
                "Gộp 4 subagent thành một subagent lớn tìm lần lượt cả 4 nguồn trong một lượt",
                "Phát 4 lệnh gọi Task trong cùng một response để chạy song song",
                "Chuyển 4 lượt tìm kiếm sang Message Batches API",
                "Giảm còn 1 nguồn tìm kiếm có chất lượng tốt nhất",
              ],
              en: { q: "A coordinator calls 4 independent search subagents one at a time, one per turn, causing high latency. What is the best improvement?", options: ["Merge the 4 subagents into one large subagent that searches all 4 sources in one turn", "Emit 4 Task calls in a single response so they run in parallel", "Move the 4 searches to the Message Batches API", "Cut down to the single highest-quality search source"] },
              answer: 1,
              explain: "Các tác vụ độc lập nên được gọi song song trong một lượt. Batch API không phù hợp vì có độ trễ tới 24 giờ.",
            },
            {
              q: "Coordinator không thể tạo subagent nào. Kiểm tra điều gì đầu tiên?",
              options: ["allowedTools có chứa \"Task\" không", "Model đang dùng có hỗ trợ subagent không", "Biến môi trường ANTHROPIC_LOG đã bật chưa", "System prompt của coordinator có quá dài không"],
              en: { q: "The coordinator cannot spawn any subagent. What should you check first?", options: ["Whether allowedTools includes \"Task\"", "Whether the current model supports subagents", "Whether the ANTHROPIC_LOG environment variable is set", "Whether the coordinator's system prompt is too long"] },
              answer: 0,
              explain: "Subagent được gọi qua công cụ Task; thiếu nó trong allowedTools thì coordinator không thể ủy thác.",
            },
          ],
        },
        {
          id: "1-4",
          title: "Ép buộc quy trình & bàn giao (handoff)",
          goals: ["Phân biệt lời dặn trong prompt (xác suất) với kiểm tra bằng code (chắc chắn)", "Chặn một thao tác quan trọng bằng code cho tới khi đủ điều kiện", "Viết bản bàn giao có cấu trúc khi chuyển cho nhân viên"],
          widget: "enforcement",
          body: `
<p class="lead"><b>Hình dung:</b> dán tờ giấy “nhớ kiểm tra CMND trước khi rút tiền” lên quầy giao dịch thì hầu hết nhân viên sẽ làm theo, nhưng thỉnh thoảng vẫn có người quên. Còn nếu máy rút tiền không chạy được khi chưa quét thẻ, thì không ai quên được. Dặn trong prompt giống tờ giấy dán quầy; kiểm tra bằng code giống chiếc máy.</p>
<h4>Hai cách bắt agent làm đúng quy trình</h4>
<p><b>Dặn trong prompt</b> cho kết quả theo xác suất: phần lớn các lần sẽ đúng, nhưng tỷ lệ sai không bao giờ bằng 0. Cách này phù hợp với những việc mềm như giọng văn hay cách trình bày.</p>
<p><b>Kiểm tra bằng code</b> cho kết quả chắc chắn. Ví dụ: công cụ hoàn tiền từ chối chạy cho tới khi hệ thống ghi nhận khách đã được xác minh. Khi quy tắc có hậu quả về tiền bạc, pháp lý hay bảo mật, hãy dùng cách này.</p>
<h4>Chuyển cho nhân viên thật</h4>
<p>Khi agent cần chuyển cuộc trò chuyện cho người thật (escalate), nhân viên không có thời gian đọc lại toàn bộ đoạn chat dài. Hãy gửi kèm một bản tóm tắt có cấu trúc: khách là ai, vấn đề gốc là gì, số tiền liên quan, agent đã làm những gì, đề xuất xử lý ra sao.</p>
<h4>Một tin nhắn có nhiều yêu cầu</h4>
<p>Khách có thể viết “đổi địa chỉ giao hàng, kiểm tra hoàn tiền đơn cũ và báo lỗi app” trong cùng một tin nhắn. Agent nên tách thành từng yêu cầu, xử lý từng cái (có thể song song nếu độc lập), rồi trả lời gộp lại sao cho không bỏ sót yêu cầu nào.</p>`,
          keyPoints: [
            "Việc liên quan tới tiền, pháp lý, bảo mật: chặn bằng code, đừng chỉ dặn trong prompt.",
            "Dặn trong prompt cho kết quả theo xác suất. Kiểm tra bằng code cho kết quả chắc chắn.",
            "Khi chuyển cho người thật, gửi bản tóm tắt có cấu trúc, đầy đủ thông tin.",
          ],
          tip: "Thấy các từ “luôn luôn”, “bắt buộc”, “không bao giờ được” trong đề thì đó là gợi ý nên chọn cách kiểm tra bằng code.",
          quiz: [
            {
              q: "Agent hỗ trợ đôi khi hoàn tiền trước khi xác minh danh tính khách hàng, dù system prompt đã yêu cầu xác minh trước. Giải pháp phù hợp nhất?",
              options: [
                "Viết hoa và nhắc lại yêu cầu xác minh ở đầu và cuối system prompt",
                "Thêm vài ví dụ few-shot cho thấy luôn xác minh trước khi hoàn tiền",
                "Chặn process_refund bằng code cho tới khi có ID khách đã xác minh",
                "Đổi sang model lớn hơn, vốn tuân thủ hướng dẫn tốt hơn",
              ],
              en: { q: "A support agent sometimes issues refunds before verifying the customer's identity, even though the system prompt says to verify first. What is the best fix?", options: ["Write the verification rule in capitals and repeat it at the start and end of the system prompt", "Add a few few-shot examples that always verify before refunding", "Block process_refund in code until a verified customer ID exists", "Switch to a larger model that follows instructions better"] },
              answer: 2,
              explain: "Với yêu cầu tuân thủ tuyệt đối có hệ quả tài chính, cần đảm bảo mang tính quyết định — prompt chỉ cho xác suất.",
            },
            {
              q: "Khi chuyển cuộc hội thoại cho nhân viên, thông tin nào hữu ích nhất?",
              options: [
                "Toàn bộ transcript thô để nhân viên tự đọc lại từ đầu",
                "Bản tóm tắt có cấu trúc: ID khách, nguyên nhân, số tiền, đề xuất xử lý",
                "Câu hỏi cuối cùng của khách, vì đó là điều khách cần nhất",
                "Điểm cảm xúc (sentiment) của khách qua từng lượt để nhân viên biết khách đang bực cỡ nào",
              ],
              en: { q: "When handing a conversation over to a human agent, what information is most useful?", options: ["The full raw transcript so the human can read it from the start", "A structured summary: customer ID, root cause, amount, recommended action", "The customer's last question, since that is what they need most", "The customer's sentiment score per turn so the human knows how upset they are"] },
              answer: 1,
              explain: "Nhân viên cần nắm vấn đề nhanh mà không phải đọc lại toàn bộ hội thoại.",
            },
          ],
        },
        {
          id: "1-5",
          title: "Hook trong Agent SDK",
          goals: ["Biết hook là gì và vì sao nó luôn chạy, không phụ thuộc model", "Chọn đúng PreToolUse để chặn và PostToolUse để chỉnh kết quả", "Viết được matcher đúng tên công cụ, kể cả công cụ MCP"],
          widget: "hookPipeline",
          body: `
<p class="lead"><b>Hình dung:</b> ở cửa kho hàng có hai người. Người gác cửa vào xem phiếu xuất kho và có quyền chặn lại nếu sai quy định. Người ở cửa ra kiểm tra và dán nhãn lại hàng cho đúng chuẩn trước khi giao đi. Hook chính là hai người này, đứng hai đầu mỗi lần agent dùng công cụ.</p>
<h4>Hook là gì</h4>
<p>Hook là một đoạn code của bạn được Agent SDK tự động gọi ở những thời điểm cố định trong quá trình agent dùng công cụ. Model không biết hook tồn tại và không thể bỏ qua nó. Vì vậy hook dùng để thực thi những quy tắc bắt buộc.</p>
<ul>
  <li><b>PreToolUse</b> chạy <em>trước</em> khi công cụ được thực thi. Dùng để chặn hành động vi phạm chính sách, ví dụ hoàn tiền trên $500 thì chặn lại và chuyển sang quy trình duyệt.</li>
  <li><b>PostToolUse</b> chạy <em>sau</em> khi công cụ trả kết quả, trước khi model nhìn thấy kết quả đó. Dùng để chuẩn hóa dữ liệu, ví dụ đổi mọi kiểu ngày tháng về cùng một định dạng.</li>
</ul>
<h4>Chọn đúng loại hook</h4>
<p>Muốn ngăn một việc xảy ra thì phải dùng PreToolUse. Khi PostToolUse chạy, công cụ đã thực thi xong rồi: nếu đó là lệnh hoàn tiền thì tiền đã đi mất. Còn muốn sửa hay làm sạch kết quả trước khi model đọc thì dùng PostToolUse.</p>`,
          keyPoints: [
            "PreToolUse: kiểm tra và có thể chặn trước khi công cụ chạy.",
            "PostToolUse: chỉnh sửa, chuẩn hóa kết quả trước khi model đọc.",
            "Hook do code thực thi nên luôn chạy, không phụ thuộc model có nhớ lời dặn hay không.",
          ],
          tip: "Dữ liệu từ nhiều nguồn có kiểu ngày tháng khác nhau: đáp án là hook PostToolUse để chuẩn hóa, không phải dặn model “hãy cẩn thận với ngày tháng”.",
          quiz: [
            {
              q: "Ba công cụ trả về ngày theo 3 định dạng khác nhau khiến agent so sánh sai. Cách xử lý tốt nhất?",
              options: [
                "Thêm hướng dẫn quy đổi định dạng ngày vào system prompt",
                "Dùng hook PostToolUse đổi mọi ngày về ISO 8601 trước khi model nhận",
                "Yêu cầu người dùng luôn nhập ngày theo một định dạng thống nhất",
                "Dùng hook PreToolUse chặn những công cụ trả ngày sai định dạng và yêu cầu gọi lại",
              ],
              en: { q: "Three tools return dates in three different formats, causing the agent to compare them wrongly. What is the best approach?", options: ["Add date-conversion instructions to the system prompt", "Use a PostToolUse hook to convert every date to ISO 8601 before the model sees it", "Ask users to always enter dates in one consistent format", "Use a PreToolUse hook to block tools that return badly formatted dates and ask for a retry"] },
              answer: 1,
              explain: "PostToolUse biến đổi kết quả công cụ một cách nhất quán, không phụ thuộc vào việc model có làm theo hướng dẫn hay không.",
            },
            {
              q: "Chính sách: hoàn tiền trên $500 phải do người duyệt. Hook nào phù hợp?",
              options: ["Hook PostToolUse trên process_refund để kiểm tra số tiền đã hoàn và báo quản lý nếu vượt 500", "Hook PreToolUse chặn process_refund khi số tiền > 500, chuyển người duyệt", "Hook chạy khi kết thúc phiên để rà lại các khoản hoàn tiền", "Không cần hook, chỉ cần ghi rõ chính sách vào system prompt"],
              en: { q: "Policy: refunds over $500 must be approved by a human. Which hook fits?", options: ["A PostToolUse hook on process_refund that checks the refunded amount and alerts a manager if it exceeds 500", "A PreToolUse hook that blocks process_refund when amount > 500 and routes to a human", "A hook that runs at session end to review all refunds", "No hook needed; just state the policy clearly in the system prompt"] },
              answer: 1,
              explain: "Phải chặn trước khi hành động xảy ra — PostToolUse thì đã muộn.",
            },
          ],
        },
        {
          id: "1-6",
          title: "Phân rã tác vụ & quản lý phiên",
          goals: ["Chọn giữa chuỗi bước cố định và chia việc linh hoạt", "Chia việc review nhiều file thành từng file và một lượt xem liên kết", "Biết khi nào nên mở lại phiên cũ, tách nhánh, hay mở phiên mới kèm tóm tắt"],
          widget: "decomposition",
          body: `
<p class="lead"><b>Hình dung:</b> nấu một món quen thì làm theo công thức từng bước. Còn khi sửa một cái máy lạ bị hỏng, bạn phải mở ra xem trước rồi mới biết bước tiếp theo. Chia nhỏ công việc cho agent cũng có hai kiểu như vậy.</p>
<h4>Hai cách chia nhỏ công việc</h4>
<p><b>Chuỗi bước cố định (prompt chaining):</b> các bước đã biết trước và luôn giống nhau, ví dụ “đọc hóa đơn, trích các trường, kiểm tra tổng tiền”. Kết quả bước trước là đầu vào của bước sau. Cách này dễ đoán và dễ kiểm thử.</p>
<p><b>Chia việc linh hoạt (adaptive):</b> bước tiếp theo phụ thuộc vào điều vừa phát hiện. Ví dụ “thêm test cho một codebase cũ”: phải xem cấu trúc trước, rồi mới quyết định ưu tiên phần nào rủi ro cao.</p>
<p>Khi review nhiều file cùng lúc, nên xem kỹ từng file riêng, rồi thêm một lượt riêng để xem các file kết nối với nhau thế nào. Nhồi tất cả vào một lượt khiến sự chú ý bị dàn mỏng: các file đầu được xem kỹ, các file sau gần như bị bỏ qua.</p>
<h4>Quản lý phiên làm việc</h4>
<ul>
  <li><code>--resume &lt;tên-phiên&gt;</code>: mở lại một phiên cũ để làm tiếp.</li>
  <li><code>fork_session</code>: tách một phiên thành hai nhánh từ cùng điểm xuất phát, để thử hai hướng khác nhau mà không ảnh hưởng nhau.</li>
  <li>Nếu code đã thay đổi nhiều kể từ phiên trước, những gì phiên cũ đã đọc giờ đã lỗi thời. Lúc đó nên mở phiên mới, đưa vào bản tóm tắt các phát hiện cũ và cho biết file nào đã thay đổi.</li>
</ul>`,
          keyPoints: [
            "Các bước biết trước: dùng chuỗi cố định. Việc điều tra chưa rõ hướng: chia việc linh hoạt.",
            "Review nhiều file: xem từng file riêng, sau đó thêm một lượt xem liên kết giữa các file.",
            "Code đã đổi nhiều thì mở phiên mới kèm bản tóm tắt, thay vì mở lại phiên cũ.",
          ],
          tip: "Một lượt review nhồi 40 file thường bỏ sót lỗi. Đáp án đúng là chia thành nhiều lượt nhỏ, mỗi lượt tập trung.",
          quiz: [
            {
              q: "Review một PR 30 file trong một prompt cho kết quả nông và mâu thuẫn. Cải thiện tốt nhất?",
              options: [
                "Dùng model có context window lớn hơn để đọc hết 30 file một lần",
                "Review từng file riêng, rồi thêm một lượt tìm vấn đề xuyên file",
                "Thêm vào prompt yêu cầu model đọc kỹ từng file trước khi kết luận",
                "Chỉ review 5 file thay đổi nhiều nhất, bỏ qua phần còn lại",
              ],
              en: { q: "Reviewing a 30-file PR in a single prompt gives shallow and contradictory results. What is the best improvement?", options: ["Use a model with a bigger context window so it reads all 30 files at once", "Review each file separately, then add one pass that looks for cross-file issues", "Add an instruction asking the model to read every file carefully before concluding", "Only review the 5 most-changed files and skip the rest"] },
              answer: 1,
              explain: "Chia nhỏ giúp mỗi lượt có chú ý tập trung; lượt tích hợp bắt các vấn đề luồng dữ liệu giữa file.",
            },
            {
              q: "Bạn quay lại một phiên điều tra sau khi đồng nghiệp refactor lớn. Cách tiếp cận đáng tin cậy nhất?",
              options: [
                "Resume phiên cũ và tiếp tục như bình thường vì ngữ cảnh vẫn còn",
                "Mở phiên mới kèm tóm tắt phát hiện cũ và danh sách file đã đổi",
                "Xóa hết ghi chú cũ và điều tra lại từ đầu cho chắc",
                "Fork phiên cũ thành ba nhánh để thử song song",
              ],
              en: { q: "You return to an investigation session after a colleague did a large refactor. What is the most reliable approach?", options: ["Resume the old session and carry on, since the context is still there", "Start a new session with a summary of earlier findings and the list of changed files", "Delete all previous notes and investigate from scratch to be safe", "Fork the old session into three branches and try them in parallel"] },
              answer: 1,
              explain: "Kết quả công cụ cũ trong phiên có thể đã sai; tóm tắt + thông tin thay đổi cho ngữ cảnh sạch và chính xác.",
            },
          ],
        },
      ],
      flashcards: [
        { front: "stop_reason nào báo agent cần chạy công cụ?", back: "\"tool_use\" — chạy công cụ, nối tool_result, gọi lại Claude." },
        { front: "Subagent có thấy lịch sử của coordinator không?", back: "Không. Ngữ cảnh cô lập — coordinator phải truyền tường minh trong prompt." },
        { front: "Chạy subagent song song bằng cách nào?", back: "Phát nhiều lệnh gọi Task trong cùng một response của coordinator." },
        { front: "Khi nào chọn ép buộc bằng code thay vì prompt?", back: "Khi cần tuân thủ tuyệt đối (tài chính, bảo mật, pháp lý) — prompt chỉ cho xác suất." },
        { front: "PreToolUse vs PostToolUse?", back: "Pre: chặn/chỉnh trước khi công cụ chạy. Post: chuẩn hóa kết quả trước khi model nhận." },
        { front: "fork_session dùng để làm gì?", back: "Tách nhánh từ baseline chung để khám phá nhiều hướng tiếp cận độc lập." },
      ],
    },

    /* ───────────────────────── CHƯƠNG 2 ───────────────────────── */
    {
      id: "d2",
      num: 2,
      title: "Tool Design & MCP Integration",
      vi: "Thiết kế công cụ & tích hợp MCP",
      short: "Công cụ & MCP",
      weight: 18,
      color: "teal",
      summary: "Mô tả công cụ, lỗi có cấu trúc, phân phối công cụ, cấu hình MCP server và công cụ tích hợp sẵn.",
      sections: [
        {
          id: "2-1",
          title: "Thiết kế mô tả công cụ",
          goals: ["Hiểu vì sao đoạn mô tả là căn cứ chính để Claude chọn công cụ", "Viết mô tả công cụ có đầu vào, ví dụ, và khi nào không nên dùng", "Xử lý hai công cụ hay bị nhầm bằng cách đổi tên hoặc tách nhỏ"],
          widget: "toolDescription",
          body: `
<p class="lead"><b>Hình dung:</b> thực đơn nhà hàng ghi hai món “Cơm 1” và “Cơm 2” mà không mô tả gì thêm, khách sẽ gọi nhầm. Ghi rõ “Cơm gà nướng, không cay” và “Cơm sườn, có trứng” thì không ai nhầm. Claude chọn công cụ cũng giống khách đọc thực đơn.</p>
<h4>Claude chọn công cụ dựa vào đâu</h4>
<p>Claude không đọc được code bên trong công cụ của bạn. Thứ duy nhất nó biết về mỗi công cụ là <b>tên</b>, <b>đoạn mô tả</b> (description) và <b>danh sách tham số</b>. Vì thế đoạn mô tả là yếu tố quan trọng nhất quyết định Claude chọn công cụ nào. Mô tả quá ngắn sẽ dẫn tới chọn nhầm, nhất là khi có hai công cụ na ná nhau.</p>
<h4>Một đoạn mô tả tốt nên có</h4>
<ul>
  <li>Công cụ làm gì, và nên dùng trong trường hợp nào.</li>
  <li>Trường hợp nào <em>không</em> nên dùng, và khi đó nên dùng công cụ nào khác.</li>
  <li>Dữ liệu đầu vào trông ra sao, kèm một ví dụ.</li>
</ul>
<h4>Khi hai công cụ vẫn bị nhầm</h4>
<p>Nếu đã viết mô tả rõ mà vẫn nhầm, cân nhắc đổi tên cho dễ phân biệt, hoặc tách một công cụ “làm đủ thứ” thành nhiều công cụ chuyên biệt. Ví dụ <code>analyze_document</code> có thể tách thành <code>extract_data_points</code>, <code>summarize_content</code> và <code>verify_claim_against_source</code>. Cũng nên đọc lại system prompt: đôi khi một câu như “luôn kiểm tra thông tin khách trước” vô tình kéo Claude về một công cụ sai.</p>`,
          keyPoints: [
            "Đoạn mô tả là căn cứ chính để Claude chọn công cụ.",
            "Mô tả nên nói rõ khi nào dùng và khi nào không dùng, để phân biệt với công cụ tương tự.",
            "Hai công cụ chồng chéo: đổi tên hoặc tách nhỏ cho rõ ràng.",
          ],
          tip: "Khi Claude chọn nhầm công cụ, bước sửa đầu tiên và rẻ nhất thường là viết lại mô tả, chứ không phải thêm bộ định tuyến hay fine-tune model.",
          quiz: [
            {
              q: "Agent liên tục gọi get_customer khi người dùng hỏi về đơn hàng (lẽ ra là lookup_order). Hai công cụ có mô tả gần giống nhau. Bước đầu tiên hiệu quả nhất?",
              options: [
                "Thêm một bộ phân loại định tuyến đứng trước agent",
                "Viết lại mô tả hai công cụ: đầu vào, ví dụ, khi nào dùng cái nào",
                "Gộp hai công cụ thành một công cụ tra cứu chung",
                "Fine-tune model trên log hội thoại để chọn công cụ đúng hơn",
              ],
              en: { q: "The agent keeps calling get_customer when users ask about orders (it should call lookup_order). The two tools have nearly identical descriptions. What is the most effective first step?", options: ["Add a routing classifier in front of the agent", "Rewrite both tool descriptions: inputs, examples, and when to use which", "Merge the two tools into one general lookup tool", "Fine-tune the model on conversation logs so it picks tools better"] },
              answer: 1,
              explain: "Mô tả rõ ràng, phân biệt là cách khắc phục trực tiếp và rẻ nhất cho lỗi chọn công cụ.",
            },
          ],
        },
        {
          id: "2-2",
          title: "Phản hồi lỗi có cấu trúc trong MCP",
          goals: ["Trả lỗi có cấu trúc: isError, loại lỗi, có nên thử lại không", "Phân biệt lỗi tạm thời, lỗi dữ liệu đầu vào, lỗi nghiệp vụ và lỗi quyền", "Không nhầm “không có kết quả” với “bị lỗi khi truy cập”"],
          widget: "errorBuilder",
          body: `
<p class="lead"><b>Hình dung:</b> bạn gọi tổng đài, nhân viên chỉ nói “có lỗi” rồi cúp máy. Bạn không biết nên gọi lại sau, đổi cách khác, hay bỏ cuộc. Nếu họ nói “hệ thống đang bảo trì, 10 phút nữa gọi lại”, bạn biết ngay phải làm gì. Agent cũng cần được báo lỗi rõ ràng như thế.</p>
<h4>Báo lỗi trong MCP</h4>
<p>MCP là giao thức chuẩn để kết nối công cụ với Claude. Khi một công cụ gặp lỗi, nó đánh dấu kết quả bằng <code>isError: true</code>. Nhưng chỉ ghi “Operation failed” (thao tác thất bại) thì agent không biết làm gì tiếp. Hãy cho biết đó là loại lỗi nào:</p>
<ul>
  <li><b>Lỗi tạm thời (transient):</b> hết thời gian chờ, dịch vụ quá tải. Thử lại sau một lúc có thể được.</li>
  <li><b>Lỗi dữ liệu đầu vào (validation):</b> mã đơn sai định dạng. Cần sửa đầu vào rồi mới gọi lại.</li>
  <li><b>Lỗi nghiệp vụ (business):</b> vi phạm quy định, ví dụ đơn đã quá hạn hoàn tiền. Thử lại bao nhiêu lần cũng vô ích, cần giải thích cho khách.</li>
  <li><b>Lỗi quyền (permission):</b> agent không đủ quyền. Cần chuyển cho người có thẩm quyền.</li>
</ul>
<p>Nên trả kèm loại lỗi (<code>errorCategory</code>), có nên thử lại không (<code>isRetryable</code>) và một câu mô tả dễ hiểu. Subagent nên tự thử lại các lỗi tạm thời, và chỉ báo lên coordinator những lỗi không tự xử lý được, kèm theo những gì đã thử và kết quả thu được tới lúc đó.</p>
<h4>Đừng nhầm “không có kết quả” với “bị lỗi”</h4>
<p>Tìm kiếm thành công nhưng không có đơn nào khớp là một kết quả hợp lệ. Còn không kết nối được tới kho dữ liệu là lỗi. Nếu cả hai trường hợp đều trả về danh sách rỗng, agent sẽ nói nhầm với khách rằng “bạn chưa có đơn nào”.</p>`,
          keyPoints: [
            "Lỗi nên có isError, loại lỗi, có nên thử lại không, và một câu mô tả dễ hiểu.",
            "Lỗi nghiệp vụ không nên thử lại. Lỗi tạm thời thì có thể.",
            "Không có kết quả là chuyện bình thường, khác với bị lỗi khi truy cập.",
          ],
          tip: "Trả về danh sách rỗng khi bị lỗi kết nối là “nuốt lỗi”. Đây là lựa chọn sai rất hay xuất hiện trong đề.",
          quiz: [
            {
              q: "Công cụ tìm kiếm trả về [] khi API timeout. Agent kết luận 'không có kết quả'. Vấn đề là gì?",
              options: [
                "Timeout đặt quá dài nên agent chờ lâu rồi bỏ cuộc",
                "Lỗi bị giấu thành kết quả rỗng; cần trả isError loại transient",
                "Prompt của agent chưa dặn rằng kết quả rỗng có thể là lỗi, cần kiểm tra lại trước khi kết luận",
                "Nên chuyển công cụ tìm kiếm sang Batch API cho ổn định",
              ],
              en: { q: "A search tool returns [] when the API times out. The agent concludes 'no results found'. What is the problem?", options: ["The timeout is too long, so the agent waits and gives up", "An error is disguised as an empty result; return isError with a transient category", "The agent's prompt never says an empty result might be an error that needs double-checking", "The search tool should move to the Batch API for stability"] },
              answer: 1,
              explain: "Agent không thể phân biệt 'không có dữ liệu' với 'không truy cập được' nếu công cụ che lỗi.",
            },
            {
              q: "Khách yêu cầu hoàn tiền cho đơn đã quá hạn 90 ngày. Công cụ nên trả về gì?",
              options: [
                "isError, loại business, isRetryable false, kèm lý do dễ hiểu",
                "isError, loại transient, isRetryable true để agent thử lại sau",
                "Trả thành công với số tiền hoàn bằng 0 để không làm gián đoạn",
                "Ném exception để agent tự hiểu là không được hoàn tiền",
              ],
              en: { q: "A customer asks for a refund on an order that is past the 90-day window. What should the tool return?", options: ["isError, category business, isRetryable false, with a clear reason", "isError, category transient, isRetryable true so the agent retries later", "Success with a refund amount of 0 to avoid interrupting the flow", "Throw an exception so the agent figures out the refund is not allowed"] },
              answer: 0,
              explain: "Đây là vi phạm quy tắc nghiệp vụ — thử lại cũng vô ích, agent cần giải thích cho khách.",
            },
          ],
        },
        {
          id: "2-3",
          title: "Phân phối công cụ & tool_choice",
          goals: ["Giới hạn mỗi agent chỉ có những công cụ đúng vai trò", "Biết auto, any, none và chỉ định đích danh trong tool_choice khác nhau thế nào", "Ép một bước chạy trước rồi mới để Claude tự chọn"],
          widget: "toolChoice",
          body: `
<p class="lead"><b>Hình dung:</b> đưa cho thợ điện một hộp 18 dụng cụ, trong đó có cả cưa gỗ và máy khoan bê tông, thì họ dễ cầm nhầm và làm những việc không thuộc phần mình. Đưa đúng 4–5 dụng cụ cần thiết thì họ làm nhanh và chính xác hơn.</p>
<h4>Mỗi agent chỉ nên có công cụ đúng vai trò</h4>
<p>Cho một agent quá nhiều công cụ làm nó chọn kém chính xác hơn. Agent còn dễ dùng công cụ vượt vai trò: subagent tổng hợp có công cụ tìm kiếm web thì sẽ tự đi tìm thêm thay vì dùng tài liệu đã được giao.</p>
<ul>
  <li>Giới hạn mỗi subagent vào bộ công cụ hợp với vai trò của nó.</li>
  <li>Có thể thay công cụ quá rộng bằng phiên bản hẹp hơn. Ví dụ thay <code>fetch_url</code> (mở bất kỳ địa chỉ nào) bằng <code>load_document</code> (chỉ mở tài liệu trong danh sách cho phép).</li>
  <li>Nếu một vai trò thường xuyên cần một việc ngoài chuyên môn, hãy cấp một công cụ hẹp cho riêng việc đó, ví dụ subagent tổng hợp có <code>verify_fact</code> để kiểm chứng nhanh.</li>
</ul>
<h4>Điều khiển việc gọi công cụ bằng tool_choice</h4>
<p><code>tool_choice</code> là một tùy chọn trong request, cho biết Claude có bắt buộc phải gọi công cụ hay không:</p>
<ul>
  <li><code>"auto"</code>: Claude tự quyết. Có thể gọi công cụ, cũng có thể chỉ trả lời bằng chữ.</li>
  <li><code>"any"</code>: Claude bắt buộc phải gọi một công cụ, nhưng tự chọn công cụ nào.</li>
  <li><code>{"type":"tool","name":"..."}</code>: Claude bắt buộc gọi đúng công cụ được chỉ định. Dùng khi muốn một bước chắc chắn chạy trước, ví dụ luôn trích thông tin chung của tài liệu trước tiên.</li>
</ul>`,
          keyPoints: [
            "Ít công cụ, đúng vai trò thì Claude chọn chính xác hơn.",
            "\"any\" đảm bảo luôn có lệnh gọi công cụ thay vì câu trả lời bằng chữ.",
            "Chỉ định đích danh công cụ khi cần ép một bước chạy trước.",
          ],
          tip: "Cần chắc chắn có đầu ra JSON khi có nhiều mẫu (schema) để chọn: dùng \"any\". Cần đúng một mẫu cụ thể: chỉ định đích danh công cụ.",
          quiz: [
            {
              q: "Pipeline trích xuất có 3 schema cho 3 loại tài liệu. Đôi khi model trả lời bằng text thay vì gọi công cụ. Cấu hình nào phù hợp?",
              options: ["tool_choice: \"auto\"", "tool_choice: \"any\"", "Bỏ hết công cụ, dùng prompt yêu cầu JSON", "temperature = 0"],
              en: { q: "An extraction pipeline has 3 schemas for 3 document types. Sometimes the model replies with text instead of calling a tool. Which setting fits?", options: ["tool_choice: \"auto\"", "tool_choice: \"any\"", "Remove all tools and ask for JSON in the prompt", "temperature = 0"] },
              answer: 1,
              explain: "\"any\" bắt buộc model gọi một công cụ, đồng thời vẫn để model chọn schema phù hợp với loại tài liệu.",
            },
            {
              q: "Subagent tổng hợp thường tự đi tìm kiếm web thay vì dùng tài liệu được cung cấp. Nguyên nhân khả dĩ?",
              options: [
                "Model quá nhỏ nên không hiểu tài liệu được cung cấp",
                "Subagent được cấp công cụ tìm kiếm không thuộc vai trò của nó",
                "Coordinator chạy các subagent song song nên các subagent bị lẫn việc của nhau",
                "Thiếu hook PostToolUse để lọc kết quả tìm kiếm web",
              ],
              en: { q: "The synthesis subagent often searches the web itself instead of using the documents it was given. What is the likely cause?", options: ["The model is too small to understand the provided documents", "The subagent was given a search tool that is outside its role", "The coordinator runs subagents in parallel, so they mix up each other's tasks", "There is no PostToolUse hook filtering the web search results"] },
              answer: 1,
              explain: "Công cụ ngoài vai trò tạo cơ hội dùng sai. Giới hạn công cụ theo vai trò.",
            },
          ],
        },
        {
          id: "2-4",
          title: "Cấu hình MCP server",
          goals: ["Biết khi nào khai báo MCP trong .mcp.json và khi nào trong ~/.claude.json", "Đưa khóa bí mật vào qua biến môi trường, không ghi thẳng vào file", "Phân biệt tools và resources của một máy chủ MCP"],
          widget: "mcpConfig",
          body: `
<p class="lead"><b>Hình dung:</b> MCP giống cổng USB. Thiết bị nào làm theo chuẩn USB cũng cắm vào máy tính được, không cần dây riêng cho từng hãng. Tương tự, công cụ nào viết theo chuẩn MCP cũng cắm được vào Claude Code. Phần này nói về việc khai báo “cắm những gì, ở đâu”.</p>
<h4>Hai nơi khai báo máy chủ MCP</h4>
<ul>
  <li><b>Cho cả nhóm (project):</b> file <code>.mcp.json</code> ở thư mục gốc của repo. File này được commit vào git, nên ai clone repo về cũng có cùng cấu hình.</li>
  <li><b>Cho riêng bạn (user):</b> file <code>~/.claude.json</code> trong thư mục cá nhân. Dùng để thử nghiệm hoặc cho công cụ chỉ mình bạn cần. Người khác không thấy file này.</li>
</ul>
<h4>Không bao giờ ghi khóa bí mật vào file</h4>
<p>Token và mật khẩu không được nằm trong <code>.mcp.json</code>, kể cả khi repo là riêng tư. Thay vào đó, ghi tên biến môi trường, ví dụ <code>"\${GITHUB_TOKEN}"</code>. Khi chạy, Claude Code lấy giá trị thật từ máy của từng người.</p>
<h4>Sau khi kết nối</h4>
<p>Khi Claude Code khởi động, nó hỏi từng máy chủ MCP xem có những công cụ gì. Công cụ của mọi máy chủ đều có sẵn cùng lúc. Ngoài công cụ (dùng để làm việc), MCP còn có <b>resources</b>: danh mục nội dung mà agent có thể đọc, chẳng hạn danh sách issue hay cấu trúc database, nhờ đó agent biết có gì mà không phải gọi công cụ dò tìm nhiều lần.</p>
<p>Với các dịch vụ phổ biến như GitHub hay Jira, nên dùng máy chủ MCP có sẵn. Chỉ tự viết khi quy trình của nhóm thật sự đặc thù.</p>`,
          keyPoints: [
            ".mcp.json để chia sẻ cho cả nhóm. ~/.claude.json để dùng riêng.",
            "Khóa bí mật đưa vào qua biến môi trường như ${TOKEN}, không ghi thẳng vào file.",
            "Tools dùng để làm việc. Resources là danh mục nội dung để đọc.",
          ],
          tip: "Đề nói “cả nhóm cần dùng chung một máy chủ MCP”: đáp án là .mcp.json trong repo, với token lấy từ biến môi trường.",
          quiz: [
            {
              q: "Team muốn mọi developer có cùng MCP server GitHub mà không lộ token. Cách đúng?",
              options: [
                "Mỗi người tự thêm máy chủ vào ~/.claude.json của mình",
                "Commit .mcp.json dùng \"${GITHUB_TOKEN}\", mỗi người tự đặt biến",
                "Commit .mcp.json chứa token thật vì repo đang để private",
                "Gửi file cấu hình có sẵn token cho cả nhóm qua chat nội bộ",
              ],
              en: { q: "A team wants every developer to have the same GitHub MCP server without exposing tokens. What is the right way?", options: ["Each person adds the server to their own ~/.claude.json", "Commit .mcp.json using \"${GITHUB_TOKEN}\" and have each person set the variable", "Commit .mcp.json with the real token, since the repo is private", "Share a config file with the token already in it over internal chat"] },
              answer: 1,
              explain: ".mcp.json ở project scope được chia sẻ qua git; biến môi trường giữ secret ngoài repo.",
            },
          ],
        },
        {
          id: "2-5",
          title: "Công cụ tích hợp sẵn: Read, Write, Edit, Grep, Glob, Bash",
          goals: ["Chọn đúng công cụ: Grep để tìm nội dung, Glob để tìm theo tên file", "Xử lý khi Edit báo lỗi vì đoạn cần thay bị trùng hoặc không còn đúng", "Tìm hiểu một codebase lạ từ từ, không đọc hết ngay từ đầu"],
          widget: "builtinTools",
          body: `
<p class="lead"><b>Hình dung:</b> tìm một cuốn sách trong thư viện có hai cách. Tra theo tên sách trên kệ, hoặc tìm theo một câu nằm bên trong sách. Glob là cách thứ nhất, Grep là cách thứ hai.</p>
<h4>Các công cụ có sẵn trong Claude Code</h4>
<ul>
  <li><b>Grep</b>: tìm theo <em>nội dung bên trong file</em>, ví dụ tên hàm, câu thông báo lỗi, dòng import.</li>
  <li><b>Glob</b>: tìm theo <em>tên file hoặc đường dẫn</em>, ví dụ mọi file có đuôi <code>.test.tsx</code> ở bất kỳ thư mục nào (<code>**/*.test.tsx</code>).</li>
  <li><b>Read</b>: đọc nội dung một file.</li>
  <li><b>Write</b>: ghi đè toàn bộ một file.</li>
  <li><b>Edit</b>: sửa một đoạn cụ thể. Bạn đưa đoạn văn bản cần thay, Edit tìm đoạn đó và thay bằng nội dung mới. Đoạn cần thay phải xuất hiện <em>đúng một lần</em> trong file. Nếu xuất hiện nhiều lần, Edit không biết sửa chỗ nào nên sẽ báo lỗi.</li>
  <li><b>Bash</b>: chạy lệnh trên terminal, ví dụ chạy test, build, git.</li>
</ul>
<h4>Khi Edit báo lỗi vì đoạn cần thay bị trùng</h4>
<p>Cách đầu tiên là chọn đoạn dài hơn, kèm vài dòng xung quanh, để nó chỉ xuất hiện một lần. Nếu vẫn khó, có thể đọc cả file bằng Read rồi ghi lại bản đã sửa bằng Write.</p>
<h4>Tìm hiểu codebase từ từ</h4>
<p>Đừng đọc hết mọi file ngay từ đầu. Hãy dùng Grep tìm điểm bắt đầu (chẳng hạn chỗ định nghĩa hàm cần sửa), đọc file đó, rồi lần theo các dòng import và lời gọi hàm để mở rộng dần.</p>`,
          keyPoints: [
            "Grep tìm theo nội dung. Glob tìm theo tên hoặc đường dẫn file.",
            "Edit cần đoạn văn bản xuất hiện đúng một lần. Nếu không được, dùng Read rồi Write.",
            "Tìm hiểu codebase từ từ, không đọc toàn bộ ngay từ đầu.",
          ],
          tip: "Câu hỏi “tìm tất cả file test”: dùng Glob. “Tìm mọi nơi gọi hàm X”: dùng Grep.",
          quiz: [
            {
              q: "Cần tìm mọi nơi gọi hàm processPayment() trong codebase. Công cụ phù hợp?",
              options: ["Glob, với mẫu **/*payment*", "Grep, tìm chuỗi processPayment(", "Read, đọc lần lượt từng file", "Edit, đổi tên hàm để xem chỗ nào lỗi"],
              en: { q: "You need to find every place that calls processPayment() in the codebase. Which tool fits?", options: ["Glob, with the pattern **/*payment*", "Grep, searching for processPayment(", "Read, opening every file one by one", "Edit, renaming the function to see what breaks"] },
              answer: 1,
              explain: "Grep tìm theo nội dung bên trong file.",
            },
            {
              q: "Edit thất bại vì đoạn văn bản neo xuất hiện 3 lần trong file. Phương án dự phòng hợp lý?",
              options: ["Gọi lại Edit với cùng đoạn neo cho tới khi thành công", "Read cả file rồi Write lại phiên bản đã sửa", "Dùng Glob để tìm đúng vị trí của đoạn neo", "Xóa file rồi tạo lại thủ công bằng Bash"],
              en: { q: "Edit fails because the anchor text appears 3 times in the file. What is a reasonable fallback?", options: ["Call Edit again with the same anchor until it succeeds", "Read the whole file, then Write the corrected version", "Use Glob to find the exact position of the anchor", "Delete the file and recreate it manually with Bash"] },
              answer: 1,
              explain: "Khi không có neo duy nhất, Read + Write cho phép kiểm soát nội dung đầy đủ.",
            },
          ],
        },
      ],
      flashcards: [
        { front: "Cơ chế chính để Claude chọn công cụ?", back: "Mô tả (description) của công cụ." },
        { front: "4 loại lỗi công cụ nên phân biệt?", back: "Transient, Validation, Business, Permission." },
        { front: "tool_choice: \"any\" nghĩa là gì?", back: "Bắt buộc gọi một công cụ, model tự chọn công cụ nào." },
        { front: "Cấu hình MCP chia sẻ cho cả team nằm ở đâu?", back: ".mcp.json ở gốc project, secret qua ${ENV_VAR}." },
        { front: "Grep vs Glob?", back: "Grep tìm nội dung file; Glob tìm theo mẫu tên/đường dẫn." },
      ],
    },

    /* ───────────────────────── CHƯƠNG 3 ───────────────────────── */
    {
      id: "d3",
      num: 3,
      title: "Claude Code Configuration & Workflows",
      vi: "Cấu hình & quy trình Claude Code",
      short: "Claude Code",
      weight: 20,
      color: "orange",
      summary: "Phân cấp CLAUDE.md, slash command & skill, rule theo đường dẫn, plan mode, tinh chỉnh lặp và CI/CD.",
      sections: [
        {
          id: "3-1",
          title: "Phân cấp CLAUDE.md",
          goals: ["Biết CLAUDE.md nằm ở đâu thì ai thấy và khi nào được nạp", "Giữ CLAUDE.md gọn bằng @đường/dẫn và thư mục .claude/rules/", "Dùng /memory để kiểm tra file hướng dẫn nào đang có hiệu lực"],
          widget: "claudeMdTree",
          body: `
<p class="lead"><b>Hình dung:</b> ở công ty có nội quy chung, mỗi phòng có quy định riêng, và bạn có sổ tay ghi chú cá nhân. Nhân viên mới chỉ được phát nội quy chung và quy định của phòng, không có sổ tay của bạn. CLAUDE.md hoạt động theo đúng ba tầng như vậy.</p>
<h4>CLAUDE.md là gì</h4>
<p>CLAUDE.md là file hướng dẫn mà Claude Code tự động đọc mỗi khi làm việc, ví dụ “dùng pnpm, không dùng npm” hay “viết test bằng Vitest”. Có ba cấp:</p>
<ul>
  <li><b>Cá nhân:</b> <code>~/.claude/CLAUDE.md</code> trong thư mục home. Chỉ áp dụng trên máy của bạn và <b>không</b> được chia sẻ qua git.</li>
  <li><b>Dự án:</b> <code>CLAUDE.md</code> (hoặc <code>.claude/CLAUDE.md</code>) ở gốc repo. Được commit vào git nên cả nhóm cùng dùng.</li>
  <li><b>Thư mục con:</b> một <code>CLAUDE.md</code> đặt trong thư mục con. Có hiệu lực khi Claude làm việc với các file trong thư mục đó.</li>
</ul>
<h4>Giữ CLAUDE.md gọn gàng</h4>
<p>Có thể dùng cú pháp <code>@đường/dẫn</code> trong CLAUDE.md để nạp nội dung từ file khác. Cũng có thể tách theo chủ đề vào thư mục <code>.claude/rules/</code>, ví dụ <code>testing.md</code> hay <code>api-conventions.md</code>.</p>
<h4>Lỗi kinh điển</h4>
<p>Trưởng nhóm ghi quy ước của nhóm vào file cá nhân <code>~/.claude/CLAUDE.md</code>. Trên máy trưởng nhóm mọi thứ chạy đúng, nhưng thành viên mới clone repo về thì Claude không theo quy ước, vì file cá nhân không nằm trong repo. Gõ lệnh <code>/memory</code> trong Claude Code để xem những file hướng dẫn nào đang được nạp.</p>`,
          keyPoints: [
            "File cá nhân (~/.claude/CLAUDE.md) không được chia sẻ. File trong repo thì được chia sẻ.",
            "Dùng @đường/dẫn và thư mục .claude/rules/ để tách nhỏ cho gọn.",
            "Dùng lệnh /memory để xem file hướng dẫn nào đang được nạp.",
          ],
          tip: "Đề nói “chỉ trên máy một người thì Claude làm đúng”: quy ước đang nằm ở file cá nhân, cần chuyển vào CLAUDE.md của dự án.",
          quiz: [
            {
              q: "Một dev mới clone repo nhưng Claude Code không tuân theo quy ước code của team, trong khi máy của trưởng nhóm thì có. Nguyên nhân khả dĩ nhất?",
              options: [
                "Dev mới đang dùng phiên bản Claude Code cũ hơn",
                "Quy ước nằm trong ~/.claude/CLAUDE.md của trưởng nhóm, không ở repo",
                "Máy dev mới thiếu file .mcp.json nên Claude Code không nạp được quy ước của team",
                "Dev mới chưa bật plan mode nên Claude bỏ qua quy ước",
              ],
              en: { q: "A new developer clones the repo, but Claude Code does not follow the team's coding conventions, while it does on the team lead's machine. What is the most likely cause?", options: ["The new developer is running an older Claude Code version", "The conventions live in the lead's ~/.claude/CLAUDE.md, not in the repo", "The new developer's machine lacks .mcp.json, so Claude Code cannot load the team's conventions", "The new developer has not turned on plan mode, so Claude ignores conventions"] },
              answer: 1,
              explain: "User-level CLAUDE.md không được chia sẻ qua git. Chuyển quy ước vào CLAUDE.md của project.",
            },
          ],
        },
        {
          id: "3-2",
          title: "Slash command & Skill",
          goals: ["Tạo slash command dùng chung cho nhóm hoặc dùng riêng", "Đóng gói một quy trình thành skill và biết khi nào dùng context: fork", "Phân biệt skill (nạp khi cần) với CLAUDE.md (luôn nạp)"],
          widget: "commandsSkills",
          body: `
<p class="lead"><b>Hình dung:</b> CLAUDE.md giống nội quy dán trên tường, ai bước vào cũng đọc. Slash command và skill giống những quy trình in sẵn cất trong tủ, chỉ lấy ra khi cần làm đúng việc đó.</p>
<h4>Slash command: lệnh tắt tự tạo</h4>
<p>Slash command là một file Markdown chứa lời nhắc soạn sẵn. Gõ <code>/tên-lệnh</code> trong Claude Code là nó chạy.</p>
<ul>
  <li>Đặt ở <code>.claude/commands/</code> trong repo: commit vào git, cả nhóm cùng có.</li>
  <li>Đặt ở <code>~/.claude/commands/</code>: chỉ bạn dùng.</li>
</ul>
<h4>Skill: quy trình đóng gói sẵn</h4>
<p>Skill nằm trong <code>.claude/skills/&lt;tên&gt;/SKILL.md</code>. Ngoài phần hướng dẫn, đầu file có vài dòng cấu hình (gọi là frontmatter):</p>
<ul>
  <li><code>context: fork</code>: chạy skill trong một agent con riêng. Những kết quả dài dòng phát sinh khi chạy sẽ không làm đầy cuộc trò chuyện chính; chỉ bản kết quả gọn được trả về.</li>
  <li><code>allowed-tools</code>: giới hạn những công cụ skill được dùng.</li>
  <li><code>argument-hint</code>: gợi ý người dùng cần nhập tham số gì.</li>
</ul>
<h4>Khác nhau giữa skill và CLAUDE.md</h4>
<p>CLAUDE.md luôn được nạp, nên chỉ nên chứa những quy tắc lúc nào cũng đúng. Skill chỉ được nạp khi cần cho một việc cụ thể, nên phù hợp với các quy trình dài nhưng ít khi dùng.</p>`,
          keyPoints: [
            ".claude/commands/ dùng chung cho nhóm. ~/.claude/commands/ dùng riêng.",
            "context: fork giữ cho kết quả dài của skill không làm đầy cuộc trò chuyện chính.",
            "Skill chỉ nạp khi cần. CLAUDE.md thì luôn được nạp.",
          ],
          tip: "Skill phân tích codebase sinh ra rất nhiều kết quả: thêm context: fork để không chiếm chỗ trong phiên chính.",
          quiz: [
            {
              q: "Muốn cả team có lệnh /review dùng chung, tự có khi clone repo. Đặt ở đâu?",
              options: ["~/.claude/commands/review.md trên máy mỗi người", ".claude/commands/review.md trong repo", "Một mục /review trong CLAUDE.md ở gốc repo", "Khai báo lệnh review trong .mcp.json"],
              en: { q: "You want the whole team to share a /review command that is available automatically after cloning the repo. Where should it go?", options: ["~/.claude/commands/review.md on each person's machine", ".claude/commands/review.md inside the repo", "A /review section in the root CLAUDE.md", "A review command declared in .mcp.json"] },
              answer: 1,
              explain: "Command trong .claude/commands/ của project được version control và chia sẻ.",
            },
            {
              q: "Skill khám phá codebase tạo output rất dài làm phiên chính bị đầy ngữ cảnh. Giải pháp?",
              options: ["Thêm context: fork vào frontmatter của SKILL.md", "Chuyển nội dung skill vào CLAUDE.md cho gọn", "Chạy /compact sau mỗi lần dùng skill", "Tách skill thành 5 slash command nhỏ hơn"],
              en: { q: "A codebase-exploration skill produces very long output that fills up the main session's context. What is the fix?", options: ["Add context: fork to the SKILL.md frontmatter", "Move the skill's content into CLAUDE.md to keep it compact", "Run /compact after every use of the skill", "Split the skill into 5 smaller slash commands"] },
              answer: 0,
              explain: "context: fork chạy skill trong subagent riêng, chỉ trả kết quả gọn về phiên chính.",
            },
          ],
        },
        {
          id: "3-3",
          title: "Rule theo đường dẫn (path-specific rules)",
          goals: ["Viết rule có paths để chỉ nạp khi đụng tới file khớp mẫu", "Viết mẫu glob đúng, biết * và ** khác nhau thế nào", "Chọn giữa rule có paths và CLAUDE.md đặt trong thư mục con"],
          widget: "rulesMatcher",
          body: `
<p class="lead"><b>Hình dung:</b> quy định “đội mũ bảo hộ” chỉ cần nhắc khi ai đó bước vào công trường, không cần đọc to trong mọi cuộc họp. Rule theo đường dẫn cũng vậy: chỉ được nạp khi Claude đụng tới đúng loại file liên quan.</p>
<h4>Cách khai báo</h4>
<p>Mỗi file trong <code>.claude/rules/</code> có thể khai báo ở đầu file một danh sách <code>paths</code> gồm các mẫu đường dẫn (gọi là glob). Rule chỉ được nạp khi Claude làm việc với file khớp mẫu. Nhờ vậy ngữ cảnh không bị lấp đầy bởi những hướng dẫn không liên quan.</p>
<pre><code>---
paths: ["**/*.test.tsx", "**/*.test.ts"]
---
Dùng React Testing Library, không dùng Enzyme.
Mỗi test mô tả một hành vi của người dùng.</code></pre>
<p>Cách đọc mẫu: <code>*</code> khớp với một phần tên bất kỳ nhưng không đi qua dấu <code>/</code>; <code>**/</code> nghĩa là “ở bất kỳ thư mục nào”. Vì vậy <code>**/*.test.ts</code> khớp với mọi file test ở mọi cấp thư mục.</p>
<h4>Khi nào dùng rule, khi nào dùng CLAUDE.md thư mục con</h4>
<p>Nếu quy ước áp dụng cho một <em>loại file</em> nằm rải rác khắp repo, ví dụ file test đặt cạnh từng file code, hãy dùng rule có <code>paths</code>. Nếu quy ước gắn với một <em>thư mục</em>, ví dụ mọi thứ trong <code>packages/api</code>, hãy đặt CLAUDE.md trong thư mục đó.</p>`,
          keyPoints: [
            "Khai báo paths để rule chỉ được nạp khi đụng tới file khớp mẫu.",
            "Quy ước cho một loại file rải rác khắp repo: dùng rule có paths.",
            "Quy ước cho một thư mục: dùng CLAUDE.md đặt trong thư mục đó.",
          ],
          tip: "Đề nhắc “file test nằm rải rác cạnh code”: đáp án là .claude/rules/ với paths dạng glob.",
          quiz: [
            {
              q: "File test (*.test.ts) nằm rải rác trong 40 thư mục. Cần quy ước viết test chỉ áp dụng cho chúng. Cách tốt nhất?",
              options: [
                "Tạo CLAUDE.md riêng trong từng thư mục trong 40 thư mục",
                ".claude/rules/testing.md với paths: [\"**/*.test.ts\"]",
                "Ghi quy ước vào ~/.claude/CLAUDE.md của mỗi người",
                "Thêm quy ước vào CLAUDE.md gốc để luôn được nạp",
              ],
              en: { q: "Test files (*.test.ts) are scattered across 40 directories. You need testing conventions that apply only to them. What is the best approach?", options: ["Create a separate CLAUDE.md in each of the 40 directories", ".claude/rules/testing.md with paths: [\"**/*.test.ts\"]", "Write the conventions into each person's ~/.claude/CLAUDE.md", "Add the conventions to the root CLAUDE.md so they always load"] },
              answer: 1,
              explain: "Rule theo glob tự nạp khi chỉnh file khớp mẫu ở bất kỳ đâu.",
            },
          ],
        },
        {
          id: "3-4",
          title: "Plan mode vs thực thi trực tiếp",
          goals: ["Biết plan mode làm gì và không làm gì", "Quyết định khi nào lập kế hoạch trước, khi nào làm luôn", "Dùng Explore subagent để khảo sát mà không làm đầy ngữ cảnh chính"],
          widget: "planOrDirect",
          body: `
<p class="lead"><b>Hình dung:</b> sửa một bóng đèn thì cứ làm luôn. Còn sửa lại toàn bộ hệ thống điện trong nhà thì nên đi xem hết các phòng, vẽ sơ đồ, thống nhất kế hoạch rồi mới cắt điện. Plan mode chính là giai đoạn “đi xem và vẽ sơ đồ”.</p>
<h4>Plan mode là gì</h4>
<p>Plan mode (chế độ lập kế hoạch) là chế độ mà Claude Code chỉ được đọc và tìm hiểu, chưa được sửa file. Claude khảo sát code, đưa ra kế hoạch, và bạn duyệt kế hoạch xong thì nó mới bắt đầu sửa.</p>
<h4>Khi nào nên dùng plan mode</h4>
<ul>
  <li>Thay đổi lớn, ảnh hưởng nhiều file, ví dụ chuyển thư viện ngày tháng trong hơn 45 file.</li>
  <li>Có nhiều cách làm đều hợp lý và cần chọn một hướng kiến trúc.</li>
  <li>Cần tìm hiểu kỹ trước khi đụng vào bất kỳ thứ gì.</li>
</ul>
<h4>Khi nào làm luôn</h4>
<p>Với thay đổi nhỏ, phạm vi rõ ràng, như sửa một lỗi đã có thông báo lỗi chỉ đúng dòng, hay thêm một điều kiện kiểm tra, thì cứ để Claude làm luôn. Lập kế hoạch cho việc nhỏ chỉ tốn thêm thời gian.</p>
<p>Có thể kết hợp: dùng plan mode để tìm hiểu, sau đó chuyển sang làm thật. Khi việc tìm hiểu cần đọc rất nhiều file, hãy giao cho <b>Explore subagent</b> (agent con chuyên khảo sát). Nó đọc trong ngữ cảnh riêng và chỉ trả về bản tóm tắt, nhờ đó phiên chính còn chỗ cho việc sửa code.</p>`,
          keyPoints: [
            "Việc lớn, nhiều hướng, ảnh hưởng kiến trúc: dùng plan mode.",
            "Việc nhỏ, rõ ràng: làm luôn.",
            "Explore subagent giúp cuộc trò chuyện chính không bị đầy bởi kết quả khảo sát.",
          ],
          tip: "Sửa lỗi một dòng đã có thông báo lỗi rõ ràng mà lại chọn plan mode là làm quá tay.",
          quiz: [
            {
              q: "Cần tách một monolith thành microservice, có nhiều phương án chia ranh giới service. Cách làm?",
              options: ["Thực thi trực tiếp, sửa dần từng service và xem kết quả", "Dùng plan mode để khám phá và chốt phương án trước khi sửa", "Tạo một slash command chuyên tách service rồi chạy", "Gửi toàn bộ codebase qua Batch API để phân tích"],
              en: { q: "You need to split a monolith into microservices, with several possible ways to draw service boundaries. How should you proceed?", options: ["Execute directly, changing one service at a time and checking results", "Use plan mode to explore and settle on an approach before editing", "Create a slash command dedicated to splitting services and run it", "Send the whole codebase through the Batch API for analysis"] },
              answer: 1,
              explain: "Quyết định kiến trúc, nhiều phương án hợp lệ, ảnh hưởng rộng → plan mode.",
            },
          ],
        },
        {
          id: "3-5",
          title: "Tinh chỉnh lặp (iterative refinement)",
          goals: ["Dùng ví dụ input và output cụ thể khi mô tả bằng lời không hiệu quả", "Dùng thông báo lỗi của test làm phản hồi cho Claude", "Quyết định gửi các vấn đề gộp chung hay tách riêng"],
          widget: "refinement",
          body: `
<p class="lead"><b>Hình dung:</b> nhờ thợ cắt tóc “cắt gọn gọn một chút” thì mỗi lần ra một kiểu. Đưa cho họ hai tấm ảnh mẫu thì kết quả giống ý hơn nhiều. Làm việc với Claude cũng vậy: ví dụ cụ thể truyền đạt tốt hơn lời mô tả.</p>
<h4>Khi mô tả bằng lời không ra kết quả đúng ý</h4>
<ul>
  <li><b>Đưa ví dụ đầu vào và đầu ra.</b> Hai đến ba cặp “trước khi sửa, sau khi sửa” thường rõ hơn cả đoạn mô tả dài.</li>
  <li><b>Làm theo test.</b> Viết test trước, chạy cho thấy test đang hỏng, rồi gửi nguyên văn thông báo lỗi cho Claude sửa. Test hỏng là phản hồi chính xác nhất bạn có thể đưa.</li>
  <li><b>Để Claude hỏi lại.</b> Khi bạn chưa rành lĩnh vực đó, hãy yêu cầu Claude đặt vài câu hỏi trước khi viết code. Những câu hỏi đó thường làm lộ ra các quyết định bạn chưa nghĩ tới, như chính sách bộ nhớ đệm hay cách xử lý lỗi.</li>
</ul>
<h4>Gửi phản hồi gộp hay tách</h4>
<p>Những vấn đề <b>liên quan tới nhau</b>, chẳng hạn cùng sinh ra từ một hàm, nên gửi chung một lần để Claude sửa ở gốc. Những vấn đề <b>độc lập</b> nên sửa lần lượt, mỗi lần kiểm tra lại, để dễ biết thay đổi nào gây ra lỗi gì.</p>`,
          keyPoints: [
            "Ví dụ cụ thể hiệu quả hơn mô tả trừu tượng.",
            "Thông báo lỗi của test là phản hồi chính xác nhất.",
            "Cho Claude đặt câu hỏi trước giúp lộ ra những điều bạn chưa tính tới.",
          ],
          tip: "Claude hiểu sai cách biến đổi dữ liệu dù bạn đã mô tả kỹ: hãy thêm 2–3 ví dụ đầu vào và đầu ra.",
          quiz: [
            {
              q: "Claude liên tục hiểu sai cách định dạng lại địa chỉ dù bạn đã mô tả chi tiết. Bước tiếp theo hiệu quả nhất?",
              options: ["Viết mô tả dài và chi tiết hơn nữa", "Đưa 2–3 ví dụ input → output cụ thể", "Chuyển sang plan mode để Claude suy nghĩ kỹ", "Viết hoa những chỗ Claude hay làm sai"],
              en: { q: "Claude keeps misunderstanding how to reformat addresses, even though you described it in detail. What is the most effective next step?", options: ["Write an even longer, more detailed description", "Provide 2–3 concrete input → output examples", "Switch to plan mode so Claude thinks harder", "Put the parts Claude gets wrong in capitals"] },
              answer: 1,
              explain: "Ví dụ cụ thể truyền đạt phép biến đổi rõ ràng hơn văn mô tả.",
            },
          ],
        },
        {
          id: "3-6",
          title: "Claude Code trong CI/CD",
          goals: ["Chạy Claude Code không cần người tương tác bằng cờ -p", "Lấy kết quả có cấu trúc bằng --output-format json và --json-schema", "Cấu hình bot review an toàn: ít quyền, không lặp lại comment cũ"],
          widget: "ciPipeline",
          body: `
<p class="lead"><b>Hình dung:</b> CI là một máy tự chạy mỗi khi có code mới, không có ai ngồi trước màn hình. Nếu chương trình dừng lại hỏi “bạn có muốn tiếp tục không?”, nó sẽ đứng chờ mãi. Chạy Claude Code trong CI vì thế cần cấu hình để không bao giờ phải chờ người trả lời.</p>
<h4>Những điểm cần nắm</h4>
<ul>
  <li><b>Cờ <code>-p</code></b> (viết đầy đủ là <code>--print</code>): Claude Code nhận yêu cầu, làm xong, in kết quả và tự thoát. Thiếu cờ này, nó mở giao diện trò chuyện và đứng chờ người gõ phím, khiến job CI bị treo.</li>
  <li><b><code>--output-format json</code> kết hợp <code>--json-schema</code></b>: kết quả trả ra dưới dạng JSON theo mẫu bạn định sẵn. Nhờ đó script trong CI đọc được chính xác từng phát hiện (file nào, dòng nào) để đăng thành bình luận trên pull request.</li>
  <li><b>CLAUDE.md</b> cung cấp bối cảnh cho lần chạy trong CI: tiêu chuẩn test, dữ liệu mẫu có sẵn, tiêu chí review.</li>
</ul>
<h4>Review lại sau mỗi lần có commit mới</h4>
<p>Hãy đưa danh sách những vấn đề đã báo ở lần trước vào yêu cầu, và dặn Claude chỉ báo vấn đề mới hoặc vấn đề cũ chưa sửa. Nếu không, mỗi lần chạy bot lại đăng lặp những bình luận cũ.</p>
<h4>Không để code tự review chính nó</h4>
<p>Phiên làm việc đã viết ra đoạn code thường khó thấy lỗi của chính mình, vì nó vẫn mang theo cách nghĩ lúc viết. Hãy dùng một phiên Claude riêng, không biết gì về quá trình viết, để review.</p>`,
          keyPoints: [
            "Cờ -p để chạy không cần người tương tác.",
            "--output-format json và --json-schema cho kết quả có cấu trúc mà script đọc được.",
            "Một phiên review độc lập tìm lỗi tốt hơn để phiên viết code tự review.",
          ],
          tip: "Job CI “bị treo không kết thúc”: nhiều khả năng thiếu cờ -p.",
          quiz: [
            {
              q: "Job CI gọi Claude Code bị treo vô thời hạn. Nguyên nhân khả dĩ nhất?",
              options: ["Thiếu cờ -p nên Claude Code chờ nhập liệu", "Thiếu file .mcp.json nên Claude Code chờ kết nối", "CLAUDE.md quá dài nên Claude Code nạp mãi không xong", "Model đang quá tải nên request bị xếp hàng"],
              en: { q: "A CI job that calls Claude Code hangs forever. What is the most likely cause?", options: ["The -p flag is missing, so Claude Code waits for interactive input", ".mcp.json is missing, so Claude Code waits for a connection", "CLAUDE.md is so long that loading never finishes", "The model is overloaded, so the request is queued"] },
              answer: 0,
              explain: "-p (--print) chạy một lần và thoát, phù hợp với pipeline.",
            },
            {
              q: "Bot review trên PR lặp lại các comment cũ mỗi lần có commit mới. Cách khắc phục?",
              options: ["Chỉ chạy bot ở commit đầu tiên của mỗi PR", "Đưa phát hiện cũ vào ngữ cảnh, chỉ báo vấn đề mới hoặc chưa sửa", "Đổi sang model nhỏ hơn để bot bớt nói nhiều", "Xóa toàn bộ comment cũ của bot trước mỗi lần chạy để PR luôn chỉ có comment mới nhất"],
              en: { q: "A PR review bot repeats its old comments every time a new commit is pushed. How do you fix it?", options: ["Only run the bot on the first commit of each PR", "Include earlier findings in context and report only new or unfixed issues", "Switch to a smaller model so the bot says less", "Delete all the bot's old comments before each run so the PR only shows the latest ones"] },
              answer: 1,
              explain: "Cho reviewer biết những gì đã báo để nó tập trung vào thay đổi mới.",
            },
          ],
        },
      ],
      flashcards: [
        { front: "CLAUDE.md nào không được chia sẻ qua git?", back: "~/.claude/CLAUDE.md (user-level)." },
        { front: "Lệnh kiểm tra file memory đang nạp?", back: "/memory" },
        { front: "context: fork trong SKILL.md để làm gì?", back: "Chạy skill trong subagent riêng, cô lập output dài." },
        { front: "Rule chỉ áp dụng cho file test rải rác?", back: ".claude/rules/*.md với frontmatter paths: [\"**/*.test.*\"]." },
        { front: "Cờ chạy Claude Code không tương tác?", back: "-p / --print (kèm --output-format json, --json-schema khi cần)." },
        { front: "Vì sao không để phiên sinh code tự review?", back: "Nó giữ ngữ cảnh suy luận của chính mình nên khó thấy lỗi — dùng instance độc lập." },
      ],
    },

    /* ───────────────────────── CHƯƠNG 4 ───────────────────────── */
    {
      id: "d4",
      num: 4,
      title: "Prompt Engineering & Structured Output",
      vi: "Viết prompt & đầu ra có cấu trúc",
      short: "Prompt & Output",
      weight: 20,
      color: "blue",
      summary: "Tiêu chí rõ ràng, few-shot, tool_use + JSON schema, vòng kiểm tra–thử lại, Batch API và review nhiều lượt.",
      sections: [
        {
          id: "4-1",
          title: "Tiêu chí rõ ràng thay vì chỉ dẫn mơ hồ",
          goals: ["Viết tiêu chí cụ thể thay cho tính từ chung chung như “quan trọng”", "Hiểu vì sao báo sai quá nhiều làm người dùng bỏ qua cả phát hiện đúng", "Tạm tắt nhóm phát hiện gây nhiễu trong lúc tinh chỉnh"],
          widget: "criteriaRewrite",
          body: `
<p class="lead"><b>Hình dung:</b> dặn nhân viên mới “làm cẩn thận vào nhé” thì họ vẫn không biết cẩn thận ở chỗ nào. Đưa họ một danh sách “kiểm tra ba điều này, bỏ qua hai điều kia” thì kết quả khác hẳn.</p>
<h4>Vì sao chỉ dẫn chung chung không hiệu quả</h4>
<p>Những câu như “hãy cẩn thận” hay “chỉ báo những vấn đề quan trọng” nghe có vẻ hữu ích nhưng không làm kết quả chính xác hơn. Model không biết với bạn thế nào là “quan trọng”. Thay vào đó, hãy nêu tiêu chí cụ thể: báo những gì, bỏ qua những gì.</p>
<ul>
  <li>Ví dụ: thay vì “kiểm tra xem comment có đúng không”, hãy viết “chỉ báo khi comment mô tả sai hành vi thật của đoạn code”.</li>
  <li>Định nghĩa từng mức độ nghiêm trọng, mỗi mức kèm một ví dụ code cụ thể.</li>
</ul>
<h4>Báo sai quá nhiều làm hỏng niềm tin</h4>
<p>Khi bot review báo quá nhiều vấn đề vụn vặt (gọi là “báo sai” hay false positive), lập trình viên quen dần với việc bỏ qua bot, rồi bỏ qua luôn cả những lỗi thật sự nguy hiểm. Nếu một loại vấn đề đang bị báo sai nhiều, có thể tạm tắt loại đó trong lúc chỉnh lại tiêu chí, rồi bật lại khi đã ổn.</p>`,
          keyPoints: [
            "Tiêu chí cụ thể hiệu quả hơn tính từ chung chung.",
            "Báo sai nhiều khiến người dùng bỏ qua cả những phát hiện đúng.",
            "Mỗi mức độ nghiêm trọng nên có ví dụ cụ thể.",
          ],
          tip: "Đáp án kiểu “thêm câu: hãy cẩn thận / chỉ báo khi chắc chắn” gần như luôn là đáp án sai.",
          quiz: [
            {
              q: "Bot review báo quá nhiều 'vấn đề style' không quan trọng, developer bắt đầu phớt lờ cả lỗi bảo mật. Cách tốt nhất?",
              options: [
                "Thêm 'chỉ báo vấn đề quan trọng' vào prompt của bot",
                "Định nghĩa tiêu chí cụ thể cho từng loại cần báo, tạm tắt mục style",
                "Tăng số comment để chắc chắn không bỏ sót lỗi bảo mật",
                "Chuyển hẳn sang review thủ công cho tới khi có model mới tốt hơn rồi mới bật lại bot",
              ],
              en: { q: "A review bot reports too many unimportant 'style issues', and developers start ignoring even the security findings. What is the best fix?", options: ["Add 'only report important issues' to the bot's prompt", "Define concrete criteria for each category to report and pause the style category", "Increase the number of comments so no security issue is missed", "Switch entirely to manual review until a better model comes out, then turn the bot back on"] },
              answer: 1,
              explain: "Tiêu chí tường minh giảm false positive; tạm tắt hạng mục nhiễu giúp khôi phục niềm tin.",
            },
          ],
        },
        {
          id: "4-2",
          title: "Few-shot prompting",
          goals: ["Biết few-shot là gì và khi nào nên dùng", "Chọn ví dụ nhắm vào những trường hợp khó, ở ranh giới", "Kèm lý do trong ví dụ để model hiểu cách quyết định"],
          widget: "fewShot",
          body: `
<p class="lead"><b>Hình dung:</b> dạy người mới phân loại thư khiếu nại, đưa họ xem ba lá thư khó đã được phân loại sẵn, kèm giải thích vì sao xếp vào nhóm đó, thì hiệu quả hơn nhiều so với đọc bản hướng dẫn mười trang.</p>
<h4>Few-shot là gì</h4>
<p>Few-shot nghĩa là đưa cho model vài ví dụ mẫu (thường 2–4 ví dụ) ngay trong prompt. Đây là cách hiệu quả nhất để có kết quả nhất quán, đặc biệt khi bạn đã viết hướng dẫn chi tiết mà kết quả vẫn lúc thế này lúc thế khác.</p>
<h4>Chọn ví dụ thế nào</h4>
<ul>
  <li>Chọn những trường hợp <b>khó, nằm ở ranh giới</b> giữa các lựa chọn. Model thường đã làm tốt các trường hợp dễ.</li>
  <li>Kèm <b>lý do</b> vì sao chọn như vậy. Model sẽ học được cách suy nghĩ, từ đó áp dụng cho trường hợp mới, thay vì chỉ bắt chước đúng ví dụ.</li>
  <li>Với việc trích xuất dữ liệu, đưa ví dụ cho các kiểu tài liệu khác nhau (trích dẫn ngay trong bài, hoặc danh mục tham khảo ở cuối) để model không bịa thông tin khi gặp cấu trúc lạ.</li>
  <li>Có cả ví dụ “nên báo” và ví dụ “không cần báo”, để model không báo quá tay.</li>
</ul>`,
          keyPoints: [
            "Dùng 2–4 ví dụ nhắm vào các trường hợp khó, dễ nhầm.",
            "Kèm lý do để model hiểu cách quyết định, không chỉ nhớ đáp án.",
            "Ví dụ đa dạng về hình thức giúp giảm bịa thông tin.",
          ],
          tip: "Kết quả không nhất quán dù đã có hướng dẫn chi tiết: thêm vài ví dụ mẫu (few-shot).",
          quiz: [
            {
              q: "Agent phân loại ticket xử lý tốt ca rõ ràng nhưng không nhất quán với ca mơ hồ (vừa là billing vừa là bug). Cải thiện tốt nhất?",
              options: [
                "Thêm 3 ví dụ ca mơ hồ kèm lý do chọn nhãn",
                "Thêm 50 ví dụ ca rõ ràng cho mỗi nhãn",
                "Tăng temperature để model linh hoạt hơn",
                "Viết hoa hướng dẫn phân loại cho model chú ý",
              ],
              en: { q: "A ticket-classification agent handles clear cases well but is inconsistent on ambiguous ones (both billing and bug). What is the best improvement?", options: ["Add 3 ambiguous examples with the reasoning for the chosen label", "Add 50 clear-cut examples for each label", "Raise temperature so the model is more flexible", "Write the classification instructions in capitals"] },
              answer: 0,
              explain: "Ví dụ có mục tiêu cho ca mơ hồ, có lý do, giúp model khái quát quyết định.",
            },
          ],
        },
        {
          id: "4-3",
          title: "Structured output với tool_use & JSON schema",
          goals: ["Dùng JSON schema để có đầu ra đúng cấu trúc", "Biết schema chống được lỗi cú pháp nhưng không chống được lỗi về nghĩa", "Thiết kế trường nullable và giá trị “other” để model không phải bịa"],
          widget: "schemaDemo",
          body: `
<p class="lead"><b>Hình dung:</b> cho người khác điền một tờ đơn có sẵn các ô thì dữ liệu nhận về gọn gàng hơn nhiều so với bảo họ “viết ra giấy”. JSON schema chính là tờ đơn có sẵn ô. Nhưng tờ đơn chỉ đảm bảo mọi ô được điền đúng chỗ, chứ không đảm bảo nội dung điền vào là đúng sự thật.</p>
<h4>Dùng công cụ làm “khuôn” cho đầu ra</h4>
<p>Cách đáng tin cậy nhất để nhận đầu ra theo đúng mẫu là định nghĩa một công cụ có <b>JSON schema</b> (bản mô tả cấu trúc dữ liệu: có những trường nào, kiểu gì, trường nào bắt buộc), rồi yêu cầu Claude “gọi” công cụ đó. Dữ liệu Claude điền vào tham số chính là kết quả bạn cần. Cách này loại bỏ được lỗi cú pháp JSON, ví dụ thiếu dấu ngoặc.</p>
<p>Tuy nhiên schema <b>không</b> chặn được lỗi về nghĩa. Tổng các dòng có thể không bằng tổng tiền, hoặc ngày giao hàng bị điền vào ô ngày hóa đơn. Những lỗi này cần code của bạn kiểm tra thêm.</p>
<h4>Thiết kế schema để model không phải bịa</h4>
<ul>
  <li>Nếu một trường bắt buộc mà tài liệu không có thông tin đó, model sẽ có xu hướng <b>bịa ra</b> một giá trị. Hãy cho phép trường đó nhận giá trị <code>null</code> (nghĩa là “không có”).</li>
  <li>Với danh sách lựa chọn cố định (enum), thêm lựa chọn <code>"other"</code> kèm một trường mô tả chi tiết, cho những trường hợp nằm ngoài danh sách.</li>
  <li>Thêm giá trị <code>"unclear"</code> cho những chỗ tài liệu mơ hồ.</li>
  <li>Ghi rõ định dạng mong muốn, ví dụ ngày theo dạng năm-tháng-ngày.</li>
</ul>`,
          keyPoints: [
            "Công cụ có JSON schema loại bỏ lỗi cú pháp, nhưng không loại bỏ lỗi về nghĩa.",
            "Trường có thể không có trong tài liệu thì cho phép null, để model không phải bịa.",
            "Danh sách lựa chọn nên có \"other\" kèm trường mô tả chi tiết.",
          ],
          tip: "Model “bịa” ngày tháng khi tài liệu không có: trường đó đang bị đặt là bắt buộc. Sửa thành cho phép null.",
          quiz: [
            {
              q: "Pipeline trích xuất hợp đồng thường điền ngày gia hạn giả khi hợp đồng không có điều khoản gia hạn. Nguyên nhân và cách sửa?",
              options: [
                "Model quá sáng tạo; giảm temperature xuống 0",
                "renewal_date đang bắt buộc; cho phép null khi không có",
                "Chất lượng OCR kém; cần công cụ OCR tốt hơn",
                "Cần thêm ví dụ hợp đồng có ngày gia hạn vào prompt",
              ],
              en: { q: "A contract-extraction pipeline often fills in a fake renewal date when the contract has no renewal clause. What is the cause and fix?", options: ["The model is too creative; set temperature to 0", "renewal_date is required; make it nullable for when it is absent", "OCR quality is poor; use a better OCR tool", "Add more example contracts that have renewal dates to the prompt"] },
              answer: 1,
              explain: "Trường bắt buộc ép model phải điền gì đó; nullable cho phép thể hiện 'không có thông tin'.",
            },
            {
              q: "Dùng tool_use với JSON schema đảm bảo điều gì?",
              options: ["Giá trị trong từng trường luôn đúng ý nghĩa", "Output đúng cú pháp và đúng cấu trúc schema", "Model không bao giờ bịa ra thông tin", "Các con số cộng lại luôn khớp với tổng"],
              en: { q: "What does using tool_use with a JSON schema guarantee?", options: ["Every field's value is semantically correct", "The output is syntactically valid and matches the schema structure", "The model never makes up information", "Line items always add up to the total"] },
              answer: 1,
              explain: "Schema đảm bảo cấu trúc, còn tính đúng của giá trị cần kiểm tra thêm.",
            },
          ],
        },
        {
          id: "4-4",
          title: "Vòng kiểm tra hợp lệ & thử lại",
          goals: ["Thử lại kèm mô tả lỗi cụ thể để model tự sửa", "Nhận ra khi nào thử lại là vô ích vì thông tin không tồn tại", "Cho model tự kiểm tra, ví dụ so tổng tự cộng với tổng ghi trên giấy"],
          widget: "retryLoop",
          body: `
<p class="lead"><b>Hình dung:</b> trả bài cho học sinh và chỉ nói “làm lại đi” thì em đó không biết sai ở đâu. Gạch chân chỗ sai và ghi “ngày phải viết theo dạng năm-tháng-ngày” thì lần sau em sửa được ngay. Nhưng nếu đề bài vốn không có dữ kiện đó, bắt làm lại bao nhiêu lần cũng vô ích.</p>
<h4>Thử lại kèm thông báo lỗi cụ thể</h4>
<p>Khi kết quả trích xuất không vượt qua bước kiểm tra, hãy gửi lại cho Claude ba thứ: tài liệu gốc, kết quả bị lỗi lần trước, và <b>mô tả cụ thể lỗi gì</b>. Với đầy đủ thông tin đó, Claude thường tự sửa được.</p>
<h4>Khi nào thử lại là vô ích</h4>
<p>Nếu thông tin cần tìm <b>không hề có trong tài liệu</b>, thử lại không tạo ra nó được. Thử lại nhiều lần còn khiến model dễ bịa một giá trị cho xong. Đây là khác biệt quan trọng so với lỗi định dạng hay điền sai ô, vốn sửa được khi thử lại. Trong trường hợp này, hãy để trống (null) và đánh dấu cho người kiểm tra.</p>
<h4>Để model tự phát hiện sai sót</h4>
<ul>
  <li>Yêu cầu trích cả tổng tiền tự cộng từ các dòng (<code>calculated_total</code>) lẫn tổng tiền ghi trên giấy (<code>stated_total</code>). Hai số lệch nhau nghĩa là có dòng bị sót hoặc đọc sai.</li>
  <li>Thêm một trường ghi kiểu tài liệu (<code>detected_pattern</code>), để sau này thống kê xem loại tài liệu nào hay bị lỗi nhất.</li>
</ul>`,
          keyPoints: [
            "Thử lại phải kèm mô tả lỗi cụ thể.",
            "Thông tin không có trong tài liệu thì thử lại cũng vô ích.",
            "So sánh tổng tự cộng với tổng ghi trên giấy để tự phát hiện sai.",
          ],
          tip: "Đề nói “thử lại 5 lần vẫn thiếu trường X”: kiểm tra xem tài liệu có thật sự chứa X không, trước khi tăng số lần thử.",
          quiz: [
            {
              q: "Pipeline retry nhiều lần nhưng vẫn không trích được số PO từ một số hóa đơn. Kiểm tra cho thấy các hóa đơn đó không ghi số PO. Hướng xử lý?",
              options: [
                "Tăng số lần retry lên 10, kèm thông báo lỗi chi tiết hơn",
                "Cho trường PO nhận null và gắn cờ để người duyệt",
                "Đổi sang model lớn hơn để đọc hóa đơn kỹ hơn",
                "Tạo số PO tạm theo định dạng chuẩn để không thiếu trường",
              ],
              en: { q: "A pipeline retries many times but still cannot extract the PO number from some invoices. Inspection shows those invoices have no PO number at all. What should you do?", options: ["Raise retries to 10 with more detailed error messages", "Make the PO field nullable and flag the document for human review", "Switch to a larger model so it reads invoices more carefully", "Generate a placeholder PO number in the standard format so the field is never empty"] },
              answer: 1,
              explain: "Retry chỉ hữu ích khi lỗi nằm ở cách model trích xuất, không phải khi dữ liệu vắng mặt.",
            },
          ],
        },
        {
          id: "4-5",
          title: "Message Batches API",
          goals: ["Biết Message Batches API rẻ hơn bao nhiêu và chậm tới mức nào", "Chọn đúng việc nên chạy batch và việc phải gọi trực tiếp", "Dùng custom_id để ghép kết quả và gửi lại phần bị lỗi"],
          widget: "batchDecider",
          body: `
<p class="lead"><b>Hình dung:</b> gửi thư nhanh thì đắt nhưng tới ngay. Gửi thư thường thì rẻ một nửa nhưng có thể mất cả ngày. Báo cáo cần nộp sáng mai thì gửi thường cũng được; tài liệu người ta đang đứng chờ thì phải gửi nhanh.</p>
<h4>Message Batches API là gì</h4>
<p>Đây là cách gửi một lúc rất nhiều yêu cầu cho Claude và nhận kết quả sau. Đổi lại:</p>
<ul>
  <li>Chi phí rẻ hơn khoảng <b>50%</b>.</li>
  <li>Thời gian xử lý có thể <b>lên tới 24 giờ</b>, và không cam kết sẽ xong nhanh.</li>
  <li>Mỗi yêu cầu chỉ là <b>một lượt</b> hỏi và đáp. Không thể chạy vòng lặp gọi công cụ nhiều lượt trong cùng một yêu cầu.</li>
  <li>Mỗi yêu cầu có một mã riêng (<code>custom_id</code>) do bạn đặt, để ghép kết quả trả về với đúng yêu cầu ban đầu.</li>
</ul>
<h4>Khi nào nên dùng</h4>
<p>Những việc <b>không có ai đang chờ</b>: báo cáo chạy ban đêm, kiểm tra định kỳ hằng tuần, tạo dữ liệu test hàng loạt. Không dùng cho việc lập trình viên đang ngồi chờ kết quả, như kiểm tra trước khi merge code.</p>
<h4>Tính giờ gửi</h4>
<p>Nếu cần kết quả trong 30 giờ mà batch có thể mất tới 24 giờ, bạn phải gửi trong vòng 6 giờ đầu. Khi một số yêu cầu thất bại, chỉ gửi lại đúng những yêu cầu đó (tìm theo <code>custom_id</code>). Tài liệu quá dài thì chia nhỏ trước khi gửi lại.</p>`,
          keyPoints: [
            "Rẻ hơn khoảng 50%, có thể mất tới 24 giờ, không cam kết thời gian.",
            "Chỉ dùng cho việc không có ai đang chờ.",
            "Dùng custom_id để ghép kết quả và gửi lại phần bị lỗi.",
          ],
          tip: "Đề nói “lập trình viên chờ kết quả rồi mới merge”: loại ngay Batch API.",
          quiz: [
            {
              q: "Team muốn giảm chi phí cho (A) check pre-merge mà dev chờ và (B) audit bảo mật chạy hằng đêm. Phương án đúng?",
              options: ["Dùng Batch cho cả hai để tiết kiệm tối đa", "Batch cho B, giữ gọi đồng bộ cho A", "Batch cho A, giữ gọi đồng bộ cho B", "Không dùng Batch cho việc nào cả"],
              en: { q: "A team wants to cut costs for (A) a pre-merge check developers wait on and (B) a nightly security audit. Which plan is right?", options: ["Use Batch for both to save the most", "Batch for B, keep synchronous calls for A", "Batch for A, keep synchronous calls for B", "Use Batch for neither"] },
              answer: 1,
              explain: "Batch có thể mất tới 24 giờ — chỉ hợp với tác vụ không ai đang chờ.",
            },
            {
              q: "100 trong 10.000 request batch thất bại do tài liệu quá dài. Cách xử lý hiệu quả?",
              options: ["Gửi lại toàn bộ 10.000 request trong một batch mới để kết quả đồng bộ, dễ đối chiếu", "Dùng custom_id tìm 100 request lỗi, chia nhỏ tài liệu rồi gửi lại", "Bỏ qua 100 tài liệu vì chỉ chiếm 1%", "Chuyển cả pipeline sang gọi đồng bộ cho chắc"],
              en: { q: "100 of 10,000 batch requests failed because the documents were too long. What is the efficient way to handle this?", options: ["Resubmit all 10,000 requests in a new batch so results are consistent and easy to reconcile", "Use custom_id to find the 100 failures, chunk those documents and resubmit them", "Skip the 100 documents since they are only 1%", "Move the whole pipeline to synchronous calls to be safe"] },
              answer: 1,
              explain: "custom_id cho phép xử lý lại chính xác phần thất bại.",
            },
          ],
        },
        {
          id: "4-6",
          title: "Review nhiều instance & nhiều lượt",
          goals: ["Hiểu vì sao để phiên viết code tự review thì ít tìm ra lỗi", "Chia review thành từng file và một lượt xem liên kết giữa các file", "Dùng mức độ tự tin để quyết định ai xử lý tiếp"],
          widget: "multiPass",
          body: `
<p class="lead"><b>Hình dung:</b> tự đọc lại bài văn mình vừa viết, bạn thường không thấy lỗi vì đầu vẫn nghĩ đúng điều mình định viết. Nhờ một người khác đọc thì họ thấy ngay. Claude cũng vậy.</p>
<h4>Vì sao tự review có giới hạn</h4>
<p>Phiên làm việc đã tạo ra kết quả vẫn mang theo toàn bộ cách lập luận lúc tạo ra nó. Khi tự review, nó có xu hướng xác nhận lại các quyết định của chính mình. Một <b>phiên Claude độc lập</b>, không biết gì về quá trình tạo ra code, tìm được lỗi tinh vi tốt hơn so với tự review, kể cả khi cho phiên cũ “suy nghĩ kỹ hơn”.</p>
<h4>Chia thành nhiều lượt review</h4>
<p>Với thay đổi lớn, hãy review từng file riêng để mỗi lượt được tập trung, rồi thêm một lượt riêng để xem các file liên kết với nhau thế nào. Lượt thứ hai này bắt được những lỗi nằm ở chỗ nối giữa các module, mà không lượt xem từng file nào thấy được.</p>
<h4>Dùng mức độ tự tin để chia việc</h4>
<p>Có thể yêu cầu model ghi kèm mức độ tự tin cho từng phát hiện. Những phát hiện có độ tự tin thấp được chuyển cho người kiểm tra, thay vì đăng thẳng hoặc xóa bỏ.</p>`,
          keyPoints: [
            "Một phiên review độc lập tốt hơn tự review.",
            "Xem từng file riêng, sau đó thêm một lượt xem liên kết giữa các file.",
            "Mức độ tự tin của từng phát hiện dùng để quyết định ai xử lý tiếp.",
          ],
          tip: "Cùng một phiên vừa viết vừa review: đáp án đúng thường là tách ra một phiên riêng để review.",
          quiz: [
            {
              q: "Code do Claude sinh ra được chính phiên đó review và hầu như không phát hiện lỗi, nhưng QA tìm ra nhiều bug. Cải thiện tốt nhất?",
              options: ["Yêu cầu chính phiên đó review lại kỹ hơn lần nữa", "Dùng một phiên Claude riêng, không có ngữ cảnh sinh code, để review", "Bật extended thinking trong cùng phiên rồi yêu cầu review lại từng hàm một cách kỹ lưỡng", "Bỏ bước review, để QA kiểm tra là đủ"],
              en: { q: "Code generated by Claude is reviewed by the same session and almost no bugs are found, yet QA finds many. What is the best improvement?", options: ["Ask the same session to review again more carefully", "Use a separate Claude instance, without the generation context, to review", "Enable extended thinking in the same session and ask it to re-review every function carefully", "Drop the review step and let QA handle it"] },
              answer: 1,
              explain: "Reviewer độc lập không bị neo vào lập luận đã dùng khi sinh code.",
            },
          ],
        },
      ],
      flashcards: [
        { front: "Vì sao 'hãy thận trọng' không hiệu quả?", back: "Không định nghĩa tiêu chí cụ thể; model không biết báo gì, bỏ gì." },
        { front: "Kỹ thuật hiệu quả nhất cho output nhất quán?", back: "Few-shot (2–4 ví dụ có mục tiêu, kèm lý do)." },
        { front: "tool_use + JSON schema KHÔNG ngăn được gì?", back: "Lỗi ngữ nghĩa (tổng sai, giá trị sai trường)." },
        { front: "Tránh model bịa trường không có trong tài liệu?", back: "Đặt trường đó nullable thay vì required." },
        { front: "Batch API: chi phí & độ trễ?", back: "~50% chi phí, tối đa 24 giờ, không SLA." },
        { front: "Khi nào retry vô ích?", back: "Khi thông tin không có trong tài liệu nguồn." },
      ],
    },

    /* ───────────────────────── CHƯƠNG 5 ───────────────────────── */
    {
      id: "d5",
      num: 5,
      title: "Context Management & Reliability",
      vi: "Quản lý ngữ cảnh & độ tin cậy",
      short: "Ngữ cảnh & Tin cậy",
      weight: 15,
      color: "rose",
      summary: "Giữ thông tin quan trọng, escalate đúng lúc, lan truyền lỗi, codebase lớn, người duyệt và nguồn gốc thông tin.",
      sections: [
        {
          id: "5-1",
          title: "Giữ thông tin quan trọng trong ngữ cảnh dài",
          goals: ["Nhận ra ba cách thông tin quan trọng bị mất trong hội thoại dài", "Giữ khối case facts nguyên văn ở đầu ngữ cảnh", "Cắt gọn kết quả công cụ trước khi đưa vào hội thoại"],
          widget: "contextWindow",
          body: `
<p class="lead"><b>Hình dung:</b> ghi biên bản một cuộc họp dài bằng cách tóm tắt dần, cuối cùng bạn có “khách muốn được hoàn tiền” nhưng mất con số 1.250.000 đồng và ngày giao dịch. Giải pháp là ghi các con số quan trọng vào một tờ riêng, không bao giờ tóm tắt tờ đó.</p>
<p>Ngữ cảnh (context) là toàn bộ nội dung Claude nhìn thấy trong một lần gọi: hướng dẫn, lịch sử trò chuyện, kết quả công cụ. Ngữ cảnh có giới hạn, và càng dài thì thông tin quan trọng càng dễ bị lu mờ.</p>
<h4>Ba cách thông tin bị mất và cách xử lý</h4>
<ul>
  <li><b>Tóm tắt làm mất chi tiết.</b> Khi hội thoại dài, hệ thống thường tóm tắt các đoạn cũ, và số tiền, ngày tháng, mã đơn bị rút gọn thành câu chung chung. Cách xử lý: giữ một khối <b>“case facts”</b> (dữ kiện của vụ việc) ghi nguyên văn các thông tin quan trọng, đưa vào mỗi lần gọi và không bao giờ tóm tắt khối này.</li>
  <li><b>Thông tin ở giữa bị bỏ sót.</b> Model chú ý tốt phần đầu và phần cuối của nội dung dài, nhưng dễ bỏ sót phần ở giữa (hiện tượng “lost in the middle”). Cách xử lý: đặt những điều quan trọng nhất ở đầu, chia mục có tiêu đề rõ ràng.</li>
  <li><b>Kết quả công cụ quá dài.</b> Một lần tra đơn có thể trả về hơn 40 trường thông tin trong khi chỉ cần 5. Cách xử lý: cắt gọn, chỉ giữ các trường cần thiết trước khi đưa vào lịch sử.</li>
</ul>
<p>Với subagent cũng vậy: yêu cầu chúng trả về dữ liệu có cấu trúc kèm thông tin nguồn và ngày, thay vì những đoạn văn dài.</p>`,
          keyPoints: [
            "Giữ khối case facts riêng để không mất chi tiết khi tóm tắt.",
            "Thông tin quan trọng đặt ở đầu, vì phần giữa dễ bị bỏ sót.",
            "Cắt gọn kết quả công cụ, chỉ giữ những trường cần thiết.",
          ],
          tip: "Agent “quên” số tiền khách nói từ đầu cuộc trò chuyện dài: đáp án là khối case facts, không phải tăng kích thước ngữ cảnh.",
          quiz: [
            {
              q: "Sau hội thoại dài, agent hỗ trợ nhắc sai số tiền và ngày giao dịch khách cung cấp ban đầu. Hệ thống dùng tóm tắt lũy tiến. Cách sửa tốt nhất?",
              options: [
                "Tóm tắt thường xuyên hơn để bản tóm tắt luôn mới",
                "Đưa dữ kiện giao dịch vào khối 'case facts' có trong mọi prompt",
                "Yêu cầu khách nhắc lại thông tin mỗi khi cần",
                "Đổi sang model có context lớn hơn để giữ được nhiều lượt hơn, giữ nguyên cách tóm tắt",
              ],
              en: { q: "After a long conversation, a support agent misstates the amount and transaction date the customer gave at the start. The system uses progressive summarization. What is the best fix?", options: ["Summarize more often so the summary stays fresh", "Extract the transaction facts into a 'case facts' block included in every prompt", "Ask the customer to repeat the information whenever needed", "Switch to a model with a larger context to keep more turns, with the same summarization"] },
              answer: 1,
              explain: "Dữ kiện chính xác được giữ nguyên văn, không bị tóm tắt làm mờ.",
            },
          ],
        },
        {
          id: "5-2",
          title: "Escalation & xử lý mơ hồ",
          goals: ["Biết những tín hiệu đáng tin để chuyển cho nhân viên thật", "Không dựa vào điểm cảm xúc hay độ tự tin model tự báo", "Xử lý khi tìm ra nhiều khách hàng trùng tên"],
          widget: "escalation",
          body: `
<p class="lead"><b>Hình dung:</b> nhân viên tổng đài giỏi biết lúc nào nên tự giải quyết, lúc nào nên hỏi thêm khách, và lúc nào nên chuyển máy cho cấp trên. Khách nói to không có nghĩa là vấn đề khó; khách hỏi lịch sự vẫn có thể là ca vượt quá thẩm quyền.</p>
<h4>Khi nào nên chuyển cho nhân viên thật</h4>
<ul>
  <li><b>Khách yêu cầu rõ ràng</b> được nói chuyện với người. Chuyển ngay, đừng cố giải quyết thêm.</li>
  <li><b>Chính sách có khoảng trống.</b> Ví dụ khách đòi giảm giá bằng giá của cửa hàng khác, trong khi chính sách chỉ nói về điều chỉnh giá nội bộ. Agent không nên tự đặt ra chính sách mới.</li>
  <li><b>Agent không thể tiến triển</b>, ví dụ đã thử nhiều cách mà công cụ vẫn lỗi.</li>
</ul>
<h4>Những tín hiệu không đáng tin</h4>
<p>Đừng dựa vào điểm cảm xúc của khách (sentiment) hay mức độ tự tin do model tự báo để quyết định có chuyển hay không. Hai con số này không phản ánh ca đó khó tới đâu.</p>
<p>Nếu khách bực bội nhưng vấn đề đơn giản và nằm trong khả năng xử lý, agent nên ghi nhận cảm xúc của khách, đề nghị cách giải quyết, và chỉ chuyển nếu khách vẫn muốn.</p>
<h4>Khi tìm ra nhiều khách hàng trùng khớp</h4>
<p>Nếu tra cứu trả về nhiều tài khoản trùng tên, hãy hỏi thêm thông tin định danh như email hoặc mã đơn. Đừng tự đoán, vì đoán sai có thể dẫn tới thao tác nhầm vào tài khoản của người khác.</p>`,
          keyPoints: [
            "Khách yêu cầu gặp người thật: chuyển ngay.",
            "Chính sách không quy định rõ trường hợp này: chuyển cho người có thẩm quyền.",
            "Điểm cảm xúc và độ tự tin tự báo của model không phải căn cứ tốt.",
          ],
          tip: "Đáp án kiểu “chuyển cho người khi điểm cảm xúc thấp hơn ngưỡng” thường là đáp án sai.",
          quiz: [
            {
              q: "Khách viết: 'Tôi muốn nói chuyện với nhân viên.' Vấn đề có vẻ agent tự giải quyết được. Agent nên?",
              options: ["Cố giải quyết trước, nếu không được mới chuyển", "Chuyển cho nhân viên ngay như khách yêu cầu", "Hỏi khách vì sao muốn gặp nhân viên", "Giải thích rằng agent cũng xử lý được"],
              en: { q: "A customer writes: 'I want to talk to a human.' The issue looks like something the agent could solve. What should the agent do?", options: ["Try to solve it first, and only hand over if that fails", "Hand over to a human right away, as requested", "Ask the customer why they want a human", "Explain that the agent can handle it too"] },
              answer: 1,
              explain: "Yêu cầu rõ ràng gặp người thật cần được tôn trọng ngay.",
            },
            {
              q: "get_customer trả về 3 khách cùng tên. Agent nên?",
              options: ["Chọn khách có đơn hàng gần đây nhất", "Hỏi thêm thông tin định danh như email, mã đơn", "Chọn khách đầu tiên trong danh sách trả về", "Chuyển ngay cho nhân viên vì dữ liệu không rõ"],
              en: { q: "get_customer returns 3 customers with the same name. What should the agent do?", options: ["Pick the customer with the most recent order", "Ask for more identifying details such as email or order ID", "Pick the first customer in the returned list", "Escalate to a human immediately because the data is unclear"] },
              answer: 1,
              explain: "Đoán bằng heuristic có thể thao tác nhầm tài khoản.",
            },
          ],
        },
        {
          id: "5-3",
          title: "Lan truyền lỗi trong hệ thống đa agent",
          goals: ["Báo lỗi có cấu trúc kèm phần kết quả đã thu được", "Tránh hai cách làm sai: nuốt lỗi và dừng cả hệ thống", "Ghi rõ trong báo cáo cuối phần nào đang thiếu dữ liệu"],
          widget: "errorPropagation",
          body: `
<p class="lead"><b>Hình dung:</b> giao năm người đi khảo sát năm cửa hàng, một người không vào được vì cửa hàng đóng cửa. Người đó nên báo “cửa hàng số 5 đóng cửa, tôi đã thử hai lần, có thể qua chi nhánh gần đó”, chứ không phải im lặng nộp tờ giấy trắng, cũng không phải hủy luôn cả cuộc khảo sát.</p>
<h4>Subagent nên báo lỗi thế nào</h4>
<p>Khi subagent gặp lỗi mà không tự khắc phục được, nó nên gửi về cho coordinator một báo cáo lỗi có cấu trúc, gồm:</p>
<ul>
  <li>Loại lỗi, và đã thử truy vấn hay thao tác gì.</li>
  <li><b>Phần kết quả đã thu được</b> trước khi gặp lỗi.</li>
  <li>Các phương án thay thế có thể thử.</li>
</ul>
<h4>Hai cách làm sai</h4>
<ul>
  <li><b>Nuốt lỗi:</b> trả về danh sách rỗng và báo “thành công”. Coordinator tưởng là không có dữ liệu, trong khi thật ra là không lấy được.</li>
  <li><b>Dừng cả hệ thống</b> chỉ vì một lỗi đơn lẻ, làm mất luôn kết quả tốt của các phần khác.</li>
</ul>
<p>Báo cáo cuối cùng nên có phần <b>ghi chú độ bao phủ</b>: phần nào có đủ dữ liệu, phần nào thiếu vì nguồn không truy cập được. Người đọc nhờ đó biết mức độ tin cậy của từng kết luận.</p>`,
          keyPoints: [
            "Báo lỗi có cấu trúc, kèm phần kết quả đã thu được.",
            "Không nuốt lỗi, cũng không dừng cả hệ thống vì một lỗi.",
            "Báo cáo cuối nên ghi rõ phần nào thiếu dữ liệu.",
          ],
          tip: "Phương án tốt cho phép coordinator tự quyết định: thử lại, dùng nguồn khác, hay tiếp tục và ghi chú phần còn thiếu.",
          quiz: [
            {
              q: "Subagent tìm kiếm timeout với 1 trong 5 nguồn. Hành vi tốt nhất?",
              options: [
                "Trả về danh sách rỗng và đánh dấu thành công",
                "Hủy toàn bộ tác vụ nghiên cứu và báo lỗi",
                "Trả kết quả 4 nguồn kèm lỗi có cấu trúc cho nguồn thứ 5",
                "Thử lại nguồn thứ 5 nhiều lần cho tới khi thành công rồi mới trả kết quả",
              ],
              en: { q: "A search subagent times out on 1 of 5 sources. What is the best behavior?", options: ["Return an empty list and mark it as success", "Cancel the whole research task and report an error", "Return results from 4 sources plus a structured error for the 5th", "Retry the 5th source repeatedly until it succeeds, then return results"] },
              answer: 2,
              explain: "Coordinator có đủ thông tin để quyết định phục hồi, báo cáo cuối ghi chú được phần thiếu.",
            },
          ],
        },
        {
          id: "5-4",
          title: "Khám phá codebase lớn",
          goals: ["Nhận ra dấu hiệu ngữ cảnh đang quá tải trong phiên dài", "Ghi phát hiện ra file và giao việc khảo sát cho subagent", "Dùng /compact và file trạng thái để tiếp tục khi bị gián đoạn"],
          widget: "longSession",
          body: `
<p class="lead"><b>Hình dung:</b> đọc liền hai trăm trang tài liệu mà không ghi chép, tới trang cuối bạn chỉ còn nhớ mang máng “có mấy class xử lý thanh toán”. Người làm việc hiệu quả sẽ ghi chép trong lúc đọc và nhờ người khác tra cứu giúp những phần phụ.</p>
<h4>Dấu hiệu ngữ cảnh đang quá tải</h4>
<p>Sau một phiên làm việc dài, ngữ cảnh đầy dần và chất lượng trả lời giảm. Claude bắt đầu nói chung chung kiểu “codebase dùng các pattern phổ biến”, thay vì nêu tên class hay hàm cụ thể mà nó đã đọc trước đó.</p>
<h4>Cách giữ phiên làm việc dài vẫn sắc bén</h4>
<ul>
  <li><b>Ghi chép ra file</b> (scratchpad): lưu các phát hiện quan trọng vào một file như <code>NOTES.md</code>, khi cần thì đọc lại.</li>
  <li><b>Giao việc cho subagent:</b> những câu hỏi cụ thể như “tìm mọi file test” hay “lần theo luồng hoàn tiền” nên giao cho subagent. Kết quả dài nằm ở phía subagent, phiên chính chỉ nhận bản tóm tắt.</li>
  <li><b>Tóm tắt sau mỗi giai đoạn</b> trước khi chuyển sang giai đoạn tiếp theo.</li>
  <li><b>Dùng lệnh <code>/compact</code></b> để nén cuộc trò chuyện khi ngữ cảnh đã đầy kết quả khảo sát.</li>
  <li>Với hệ thống nhiều giai đoạn, mỗi agent nên ghi lại <b>trạng thái công việc</b> ra file (đã xong gì, còn gì), để nếu bị gián đoạn thì có thể tiếp tục mà không làm lại từ đầu.</li>
</ul>`,
          keyPoints: [
            "Ghi chép ra file và giao việc cho subagent để chống quá tải ngữ cảnh.",
            "Tóm tắt lại sau mỗi giai đoạn.",
            "Dùng /compact khi ngữ cảnh đã đầy.",
          ],
          tip: "Dấu hiệu “Claude bắt đầu nói chung chung thay vì nêu class cụ thể” nghĩa là ngữ cảnh đang quá tải.",
          quiz: [
            {
              q: "Sau 2 giờ khám phá codebase lớn, Claude bắt đầu trả lời chung chung, không nhắc các class đã phân tích. Giải pháp hợp lý?",
              options: [
                "Tiếp tục hỏi lại từng chi tiết cho tới khi Claude nhớ ra",
                "Ghi phát hiện ra file, /compact hoặc mở phiên mới, giao việc cho subagent",
                "Cho Claude đọc lại toàn bộ codebase từ đầu để nạp lại những class đã phân tích trước đó",
                "Tăng max_tokens để Claude trả lời chi tiết hơn",
              ],
              en: { q: "After 2 hours exploring a large codebase, Claude starts giving generic answers and no longer mentions classes it analyzed. What is a sensible fix?", options: ["Keep asking about each detail until Claude remembers", "Write findings to a file, /compact or start fresh, and delegate to subagents", "Have Claude re-read the entire codebase to reload the classes it analyzed earlier", "Raise max_tokens so Claude answers in more detail"] },
              answer: 1,
              explain: "Giữ phát hiện ngoài ngữ cảnh và cô lập output khám phá là cách chống suy giảm ngữ cảnh.",
            },
          ],
        },
        {
          id: "5-5",
          title: "Người duyệt & hiệu chỉnh độ tin cậy",
          goals: ["Hiểu vì sao độ chính xác tổng có thể che giấu chỗ yếu", "Đo riêng theo loại tài liệu và theo từng trường", "Lấy mẫu phân tầng trước khi giảm bớt người kiểm tra"],
          widget: "stratified",
          body: `
<p class="lead"><b>Hình dung:</b> một lớp học có điểm trung bình 9, nghe rất tốt. Nhưng nếu xem từng môn thì môn Hóa chỉ được 4. Con số trung bình đẹp đã che mất chỗ yếu.</p>
<h4>Độ chính xác tổng có thể đánh lừa</h4>
<p>Một hệ thống trích xuất đạt 97% chính xác nghe rất tốt. Nhưng con số đó có thể che giấu việc một loại tài liệu ít gặp (ví dụ hóa đơn viết tay) chỉ đạt 60%, hoặc một trường cụ thể (ví dụ mã số thuế) thường xuyên sai.</p>
<h4>Trước khi giảm bớt người kiểm tra</h4>
<ul>
  <li>Đo độ chính xác riêng cho <b>từng loại tài liệu</b> và <b>từng trường</b>, không chỉ con số tổng.</li>
  <li>Dùng <b>lấy mẫu phân tầng</b>: chia tài liệu theo nhóm rồi lấy mẫu đủ nhiều từ mỗi nhóm, kể cả nhóm hiếm. Lấy mẫu ngẫu nhiên đơn giản có thể gần như không bốc trúng nhóm hiếm nào.</li>
  <li>Lấy mẫu kiểm tra cả những kết quả model báo là “rất tự tin”, để phát hiện kiểu lỗi “tự tin nhưng sai”.</li>
</ul>
<h4>Làm cho con số độ tự tin đáng tin hơn</h4>
<p>Mức độ tự tin model đưa ra cần được <b>đối chiếu với kết quả đúng sai thực tế</b> trên một tập dữ liệu đã được kiểm tra, việc này gọi là hiệu chỉnh (calibration). Sau đó mới dùng con số này để quyết định: kết quả nào tự động chấp nhận, kết quả nào chuyển cho người kiểm tra.</p>`,
          keyPoints: [
            "Độ chính xác tổng có thể che giấu chỗ yếu ở từng nhóm.",
            "Đo riêng theo loại tài liệu và theo từng trường.",
            "Lấy mẫu phân tầng và hiệu chỉnh mức độ tự tin trên dữ liệu đã kiểm tra.",
          ],
          tip: "Đề đưa ra con số chính xác tổng rất cao và hỏi có nên bỏ người kiểm tra không: hãy kiểm tra theo từng nhóm trước.",
          quiz: [
            {
              q: "Pipeline trích xuất đạt 97% chính xác tổng. Quản lý muốn bỏ hoàn toàn bước người duyệt. Nên làm gì trước?",
              options: [
                "Bỏ ngay, vì 97% đã cao hơn độ chính xác của người duyệt",
                "Đo độ chính xác theo từng loại tài liệu và trường bằng mẫu phân tầng trước",
                "Tăng gấp đôi người duyệt để chắc chắn hơn",
                "Thử model khác và chỉ bỏ bước người duyệt khi độ chính xác tổng vượt 99% trong một tháng",
              ],
              en: { q: "An extraction pipeline reaches 97% overall accuracy. A manager wants to remove the human review step entirely. What should you do first?", options: ["Remove it now, since 97% beats the reviewers' own accuracy", "Measure accuracy per document type and field with stratified sampling first", "Double the number of reviewers to be safer", "Try another model and only drop human review once overall accuracy exceeds 99% for a month"] },
              answer: 1,
              explain: "Một loại tài liệu hiếm có thể chỉ đạt 60% nhưng bị che bởi con số tổng.",
            },
          ],
        },
        {
          id: "5-6",
          title: "Nguồn gốc thông tin (provenance)",
          goals: ["Giữ liên kết giữa mỗi nhận định và nguồn của nó qua mọi bước", "Trình bày số liệu mâu thuẫn thay vì tự chọn một", "Ghi ngày tháng để giải thích khác biệt do thời điểm"],
          widget: "provenance",
          body: `
<p class="lead"><b>Hình dung:</b> bài báo viết “theo một nghiên cứu, 43% doanh nghiệp đã dùng AI” mà không ghi nghiên cứu nào, năm nào. Bạn không có cách nào kiểm tra lại. Trong hệ thống nhiều agent, mỗi lần tóm tắt là một lần thông tin nguồn có nguy cơ bị rơi mất.</p>
<h4>Giữ liên kết giữa nhận định và nguồn</h4>
<p>Khi dữ liệu đi qua nhiều bước (tìm kiếm, phân tích, tổng hợp), bước tóm tắt rất dễ làm mất thông tin “nhận định này lấy từ đâu”. Hãy yêu cầu mỗi subagent trả về dữ liệu có cấu trúc gồm: nhận định, đoạn trích nguyên văn, đường dẫn hoặc tên tài liệu, và ngày xuất bản. Các bước sau giữ nguyên cấu trúc này.</p>
<h4>Khi hai nguồn đưa ra số liệu khác nhau</h4>
<ul>
  <li>Trình bày <b>cả hai</b>, ghi rõ nguồn của từng con số. Đừng tự chọn một số, cũng đừng lấy trung bình.</li>
  <li>Ghi kèm <b>ngày xuất bản</b> và phạm vi khảo sát. Nhiều khi hai con số khác nhau chỉ vì đo ở hai thời điểm hoặc trên hai nhóm khác nhau, chứ không phải mâu thuẫn thật.</li>
</ul>
<h4>Trình bày báo cáo</h4>
<p>Tách rõ phần đã được nhiều nguồn xác nhận và phần còn tranh cãi. Dùng hình thức phù hợp với nội dung: bảng cho số liệu so sánh, đoạn văn cho phần giải thích.</p>`,
          keyPoints: [
            "Giữ liên kết giữa nhận định và nguồn qua mọi bước xử lý.",
            "Số liệu mâu thuẫn: trình bày cả hai, ghi rõ nguồn.",
            "Ghi ngày tháng để giải thích khác biệt do thời điểm.",
          ],
          tip: "Đáp án kiểu “chọn nguồn mới hơn hoặc uy tín hơn và bỏ nguồn kia” thường sai. Đề muốn bạn giữ sự minh bạch về nguồn.",
          quiz: [
            {
              q: "Hai báo cáo uy tín đưa tỷ lệ áp dụng AI khác nhau (34% và 52%). Subagent tổng hợp nên?",
              options: ["Lấy trung bình 43% để cân bằng hai nguồn", "Chọn số của báo cáo có thương hiệu lớn hơn, vì thường có phương pháp tốt hơn", "Nêu cả hai, ghi nguồn, ngày và khác biệt phương pháp", "Bỏ số liệu khỏi báo cáo vì mâu thuẫn"],
              en: { q: "Two reputable reports give different AI adoption rates (34% and 52%). What should the synthesis subagent do?", options: ["Average them to 43% to balance the two sources", "Use the figure from the better-known publisher, since its methodology is usually stronger", "Present both, with source, date and methodology differences", "Drop the figure from the report because they conflict"] },
              answer: 2,
              explain: "Giữ minh bạch nguồn gốc giúp người đọc tự đánh giá; tự ý gộp/chọn làm mất thông tin.",
            },
          ],
        },
      ],
      flashcards: [
        { front: "Case facts block giải quyết vấn đề gì?", back: "Mất chi tiết (số tiền, ngày) khi tóm tắt lũy tiến." },
        { front: "Lost in the middle là gì?", back: "Model bỏ sót thông tin ở giữa input dài; đặt thông tin quan trọng ở đầu." },
        { front: "Tín hiệu escalate đáng tin cậy?", back: "Khách yêu cầu rõ, khoảng trống chính sách, không thể tiến triển. Không dùng sentiment." },
        { front: "Hai anti-pattern lan truyền lỗi?", back: "Nuốt lỗi (rỗng = thành công) và dừng toàn bộ workflow vì một lỗi." },
        { front: "Vì sao accuracy tổng 97% chưa đủ?", back: "Có thể che hiệu suất kém ở loại tài liệu/trường cụ thể." },
        { front: "Số liệu mâu thuẫn giữa hai nguồn?", back: "Giữ cả hai, ghi nguồn và ngày, không tự chọn." },
      ],
    },
  ],
};

/* Bổ sung nội dung chuyên sâu theo id mục (assets/js/deep/*.js):
   advanced (HTML), traps (tình huống khó), quiz (câu khó, nối thêm), widgets (danh sách mô phỏng), keyPoints (nối thêm). */
window.DEEP_ADD = (map) =>
  Object.entries(map).forEach(([id, d]) => {
    const s = window.COURSE.chapters.flatMap((c) => c.sections).find((x) => x.id === id);
    if (!s) return console.warn("Không tìm thấy mục", id);
    if (d.advanced) s.advanced = d.advanced;
    if (d.widgets) s.widgets = d.widgets;
    if (d.traps) s.traps = (s.traps || []).concat(d.traps);
    if (d.quiz) s.quiz = (s.quiz || []).concat(d.quiz);
    if (d.keyPoints) s.keyPoints = (s.keyPoints || []).concat(d.keyPoints);
  });
