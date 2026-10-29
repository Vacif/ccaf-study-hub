/* Nội dung chuyên sâu — Chương 2: Tool Design & MCP Integration */
window.DEEP_ADD({
  /* ─────────────── 2-1 ─────────────── */
  "2-1": {
    widgets: ["toolSelectTrace", "toolDescription"],
    advanced: `
<section class="adv-block">
  <h4>Mô tả công cụ nằm ở đâu khi Claude đọc</h4>
  <p>Danh sách công cụ bạn khai báo được API đặt vào phần đầu nội dung gửi cho Claude, cạnh hướng dẫn chung, và lặp lại ở <b>mọi</b> lần gọi. Có hai điều rút ra: mô tả là thứ Claude luôn nhìn thấy khi chọn công cụ, và mô tả dài sẽ tốn thêm một ít chi phí mỗi lượt. Thường thì khoản chi phí đó đáng bỏ ra, và có thể giảm bằng prompt caching.</p>
</section>
<section class="adv-block">
  <h4>Một mô tả tốt trông như thế nào</h4>
  <pre><code>{
  "name": "lookup_order",
  "description": "Tra MỘT đơn hàng theo mã đơn.
    Trả về: trạng thái, vị trí vận chuyển, ngày giao dự kiến, số tiền.
    Dùng khi khách hỏi đơn đang ở đâu, bao giờ giao, đã giao chưa.
    Không dùng để tra hồ sơ khách (dùng get_customer)
    hay để hoàn tiền (dùng process_refund).
    Đầu vào: phần chữ số sau dấu #, ví dụ '#1234' thì nhập '1234'.",
  "input_schema": {
    "type": "object",
    "properties": {
      "order_id": {"type": "string", "description": "Chỉ chữ số, bỏ dấu #"}
    },
    "required": ["order_id"]
  }
}</code></pre>
  <p>Lưu ý từng tham số cũng có mô tả riêng. Nhờ vậy Claude biết phải bỏ dấu # trước khi truyền vào.</p>
</section>
<section class="adv-block">
  <h4>Thứ tự sửa khi Claude chọn nhầm công cụ</h4>
  <ol class="steps-dg">
    <li class="good">Viết lại mô tả: nêu rõ khi nào dùng, khi nào không dùng, kèm ví dụ.</li>
    <li>Đổi tên cho rõ nghĩa, ví dụ <code>search</code> thành <code>search_help_articles</code>.</li>
    <li>Tách công cụ “làm đủ thứ” thành nhiều công cụ chuyên biệt, hoặc gộp hai công cụ thực chất làm cùng một việc.</li>
    <li class="bad">Chỉ nghĩ tới thêm hệ thống định tuyến hay fine-tune khi các bước trên đã thất bại.</li>
  </ol>
  <p>Ngoài mô tả, hãy đọc lại system prompt. Một câu như “luôn kiểm tra tài khoản khách trước” có thể khiến Claude nghiêng về <code>get_customer</code> ngay cả khi khách chỉ hỏi về đơn hàng.</p>
</section>`,
    traps: [
      {
        title: "System prompt vô tình kéo Claude về công cụ sai",
        level: "hard",
        scenario: "Sau khi viết lại mô tả cẩn thận, Claude vẫn hay gọi <code>get_customer</code> khi khách hỏi về đơn hàng. Trong system prompt có câu: “Trước khi trả lời bất cứ điều gì, hãy kiểm tra thông tin khách hàng.”",
        bait: "Viết mô tả dài hơn nữa, hoặc thêm một model phân loại để định tuyến.",
        why: "Câu chỉ dẫn trong system prompt mâu thuẫn với mô tả công cụ, và nó đang thắng thế.",
        fix: ["Rà lại system prompt, tìm những câu nhắc tới tên hoặc chức năng của công cụ.", "Viết lại thành điều kiện cụ thể: “Xác minh khách trước mọi thao tác liên quan tới tiền.”", "Chạy lại một bộ câu hỏi thử để chắc chắn Claude đã chọn đúng."],
      },
      {
        title: "Gộp hai công cụ cho đỡ nhầm",
        scenario: "<code>get_customer</code> và <code>lookup_order</code> hay bị nhầm. Có người đề xuất gộp lại thành một công cụ <code>get_data(type, id)</code>.",
        bait: "Nghĩ rằng ít công cụ hơn thì ít nhầm hơn.",
        why: "Sự nhầm lẫn chỉ chuyển từ “chọn công cụ nào” sang “điền type là gì”. Mô tả của công cụ gộp còn khó viết rõ hơn.",
        fix: ["Giữ hai công cụ riêng, mô tả rõ ranh giới giữa chúng.", "Chỉ gộp khi hai công cụ thực chất làm cùng một việc."],
      },
    ],
    quiz: [
      {
        level: "hard",
        q: "Agent có một công cụ analyze_document dùng cho mọi việc liên quan tới tài liệu. Kết quả lúc thì trích số liệu, lúc thì tóm tắt, lúc thì kiểm chứng, rất thiếu ổn định. Nên cải thiện thế nào?",
        options: ["Thêm tham số mode vào analyze_document", "Tách thành extract_data_points, summarize_content và verify_claim_against_source, mỗi công cụ có mô tả rõ ràng", "Thêm ví dụ mẫu cho analyze_document", "Tăng temperature"],
        answer: 1,
        explain: "Công cụ làm đủ thứ thì ranh giới mờ. Công cụ chuyên biệt, tên và mô tả rõ ràng giúp Claude chọn đúng việc cần làm.",
        notes: ["Chỉ chuyển sự mơ hồ sang tham số mode, không giải quyết gốc rễ.", "Đúng.", "Có ích một phần, nhưng vẫn là một công cụ mang nhiều nghĩa.", "Làm kết quả càng ngẫu nhiên hơn, đi ngược mục tiêu."],
      },
    ],
  },

  /* ─────────────── 2-2 ─────────────── */
  "2-2": {
    advanced: `
<section class="adv-block">
  <h4>Hai loại lỗi khác nhau trong MCP</h4>
  <p><b>Lỗi giao thức</b> xảy ra khi bản thân lời gọi không hợp lệ, ví dụ gọi một công cụ không tồn tại hoặc tham số sai cấu trúc. Máy chủ trả về một khối <code>error</code> theo chuẩn JSON-RPC. Loại lỗi này thường là việc của lập trình viên cần sửa.</p>
  <p><b>Lỗi khi chạy công cụ</b> xảy ra khi lời gọi hợp lệ nhưng công việc thất bại: hết thời gian chờ, vi phạm quy định, không đủ quyền. Máy chủ trả về kết quả bình thường nhưng có <code>isError: true</code>, và nội dung lỗi do bạn tự thiết kế. Claude đọc được nội dung này, nên nó chính là cơ hội để hướng dẫn Claude tự xử lý.</p>
</section>
<section class="adv-block">
  <h4>Mẫu nội dung lỗi giàu thông tin</h4>
  <pre><code>{
  "errorCategory": "transient",
  "isRetryable": true,
  "retryAfterMs": 2000,
  "message": "Kho đơn hàng không phản hồi sau 5 giây",
  "partial": {"orders_checked": 3}
}</code></pre>
  <p>Chỉ với năm trường này, Claude biết đây là lỗi tạm thời, nên đợi khoảng 2 giây rồi thử lại, và đã kiểm tra được 3 đơn trước khi lỗi.</p>
</section>
<section class="adv-block">
  <h4>Cẩn thận khi thử lại một thao tác ghi</h4>
  <p>Khi lệnh hoàn tiền bị hết thời gian chờ, chưa chắc tiền chưa được chuyển: có thể giao dịch đã xong nhưng phản hồi bị mất trên đường về. Nếu thử lại ngay, khách có thể được hoàn tiền hai lần. Với những thao tác thay đổi dữ liệu, hãy dùng <b>khóa chống trùng</b> (idempotency key): mỗi lần thử lại gửi cùng một khóa để hệ thống thanh toán nhận ra và không thực hiện hai lần. Hoặc kiểm tra trạng thái giao dịch trước khi thử lại.</p>
</section>`,
    traps: [
      {
        title: "Không có kết quả, hay bị lỗi?",
        level: "hard",
        scenario: "Công cụ <code>search_orders</code> bắt mọi lỗi và trả về <code>{\"orders\": []}</code> để “không làm sập agent”. Khi cơ sở dữ liệu bảo trì 10 phút, agent nói với 300 khách rằng “bạn chưa có đơn hàng nào”.",
        bait: "Thêm vào prompt: “nếu không thấy đơn, hãy nói rằng hệ thống có thể đang lỗi”.",
        why: "Hai tình huống hoàn toàn khác nhau nhưng trả về cùng một dạng dữ liệu, nên model không thể phân biệt. Lỗi đã bị “nuốt” ngay trong công cụ.",
        fix: ["Khi bị lỗi: trả <code>isError: true</code> kèm <code>errorCategory: \"transient\"</code>.", "Khi thật sự không có kết quả: trả <code>isError: false</code> kèm ghi chú “tìm kiếm thành công, không có đơn nào khớp”.", "Không bao giờ dùng cùng một dạng dữ liệu cho hai ý nghĩa khác nhau."],
      },
      {
        title: "Đánh dấu sai “có thể thử lại”",
        scenario: "Mọi lỗi của công cụ hoàn tiền đều được đánh dấu <code>isRetryable: true</code>. Với một đơn đã quá hạn 90 ngày, Claude thử lại năm lần rồi xin lỗi khách rằng hệ thống đang gặp sự cố.",
        bait: "Giảm giới hạn số vòng lặp.",
        why: "Lỗi do vi phạm quy định thì thử lại bao nhiêu lần cũng không thành công. Thông tin sai đã dẫn Claude đi sai hướng.",
        fix: ["Phân loại đúng: lỗi nghiệp vụ thì <code>isRetryable: false</code>.", "Kèm một câu giải thích thân thiện để Claude nói lại với khách."],
      },
    ],
    quiz: [
      {
        level: "hard",
        q: "Công cụ process_refund bị hết thời gian chờ khi gọi cổng thanh toán. Cách báo lỗi và xử lý nào an toàn nhất?",
        options: ["Báo lỗi tạm thời, có thể thử lại, và Claude gọi lại ngay", "Báo lỗi tạm thời kèm thông tin để kiểm tra trạng thái giao dịch; nếu thử lại thì dùng khóa chống trùng để không hoàn tiền hai lần", "Báo thành công vì nhiều khả năng giao dịch đã xong", "Báo lỗi nghiệp vụ, không thử lại"],
        answer: 1,
        explain: "Hết thời gian chờ khi thực hiện thao tác ghi là trạng thái chưa rõ ràng. Chỉ nên thử lại khi có khóa chống trùng, hoặc sau khi đã kiểm tra trạng thái.",
        notes: ["Có thể hoàn tiền cho khách hai lần.", "Đúng.", "Có thể báo sai sự thật cho khách.", "Phân loại sai: đây không phải vi phạm quy định."],
        trap: "“Lỗi tạm thời thì thử lại” đúng với thao tác đọc, nhưng thao tác ghi cần thêm khóa chống trùng.",
      },
    ],
  },

  /* ─────────────── 2-3 ─────────────── */
  "2-3": {
    advanced: `
<section class="adv-block">
  <h4>Đủ bốn giá trị của tool_choice</h4>
  <p>Ngoài <code>auto</code>, <code>any</code> và chỉ định đích danh công cụ, còn có <code>none</code>: cấm gọi công cụ dù danh sách công cụ vẫn được gửi kèm. Giá trị này hữu ích khi một lượt chỉ cần Claude trả lời bằng chữ, mà bạn vẫn muốn giữ nguyên danh sách công cụ để tận dụng phần đã lưu đệm.</p>
  <p>Hai điều cần nhớ thêm. Khi đặt <code>any</code> hoặc chỉ định đích danh, Claude bắt đầu ngay bằng yêu cầu gọi công cụ, không có câu giải thích nào trước đó. Và nếu bạn bật chế độ suy nghĩ mở rộng (extended thinking), chỉ dùng được <code>auto</code> hoặc <code>none</code>.</p>
</section>
<section class="adv-block">
  <h4>Đổi tool_choice theo từng giai đoạn</h4>
  <p>Một quy trình có thể dùng các giá trị khác nhau ở mỗi lượt. Ví dụ, lượt đầu chỉ định đích danh <code>extract_metadata</code> để chắc chắn bước này chạy trước. Lượt sau chuyển sang <code>any</code> để Claude tự chọn công cụ trích xuất phù hợp với loại tài liệu. Với agent trò chuyện bình thường, hãy để <code>auto</code>, nếu không agent sẽ không bao giờ trả lời được bằng chữ.</p>
</section>
<section class="adv-block">
  <h4>Phân công cụ theo vai trò</h4>
  <p>Agent tìm kiếm cần công cụ tìm kiếm web và đọc trang. Agent phân tích cần công cụ đọc tài liệu. Agent tổng hợp chỉ cần một công cụ kiểm chứng phạm vi hẹp. Một agent “biết làm mọi thứ” với 18 công cụ sẽ chọn kém chính xác hơn, và dễ làm những việc ngoài vai trò của nó.</p>
</section>`,
    traps: [
      {
        title: "Bắt buộc gọi công cụ trong agent trò chuyện",
        level: "hard",
        scenario: "Để chắc chắn luôn có JSON, nhóm đặt <code>tool_choice: {\"type\":\"any\"}</code> cho agent chăm sóc khách hàng. Khi khách chỉ nói “cảm ơn”, agent vẫn gọi công cụ tìm kiếm vô nghĩa và không bao giờ nói được lời chào kết thúc.",
        bait: "Thêm một công cụ <code>reply_to_user</code> để agent “trả lời thông qua công cụ”.",
        why: "Giá trị <code>any</code> cấm trả lời bằng chữ thuần. Nó phù hợp với quy trình trích xuất dữ liệu, không phù hợp với hội thoại.",
        fix: ["Dùng <code>auto</code> cho agent trò chuyện.", "Chỉ bắt buộc gọi công cụ ở những bước thật sự cần đầu ra có cấu trúc.", "Nếu cần JSON tóm tắt cuộc trò chuyện, dùng một lần gọi trích xuất riêng có chỉ định công cụ."],
      },
      {
        title: "any không đảm bảo thứ tự",
        scenario: "Quy trình yêu cầu luôn trích thông tin chung của tài liệu trước, rồi mới trích nội dung. Đặt <code>any</code>, nhưng đôi khi Claude gọi <code>extract_invoice</code> trước.",
        bait: "Thêm vào prompt: “luôn gọi extract_metadata trước”.",
        why: "<code>any</code> chỉ đảm bảo Claude gọi một công cụ nào đó, không đảm bảo đó là công cụ nào.",
        fix: ["Lượt đầu: chỉ định đích danh <code>extract_metadata</code>.", "Các lượt sau: chuyển sang <code>any</code> hoặc <code>auto</code> tùy nhu cầu."],
      },
    ],
    quiz: [
      {
        level: "hard",
        q: "Quy trình phải luôn chạy extract_metadata trước tiên, sau đó Claude tự chọn một trong ba công cụ trích xuất tùy loại tài liệu. Cấu hình tool_choice nào đúng?",
        options: ["auto cho cả hai lượt", "Lượt 1 chỉ định đích danh extract_metadata; lượt 2 dùng any", "any cho cả hai lượt", "Lượt 1 dùng any; lượt 2 chỉ định đích danh"],
        answer: 1,
        explain: "Chỉ định đích danh đảm bảo đúng bước đầu tiên. any ở lượt sau đảm bảo có JSON mà vẫn để Claude chọn mẫu phù hợp.",
        notes: ["Không đảm bảo Claude gọi công cụ.", "Đúng.", "Không đảm bảo extract_metadata chạy trước.", "Ngược thứ tự yêu cầu."],
      },
    ],
  },

  /* ─────────────── 2-4 ─────────────── */
  "2-4": {
    widgets: ["mcpLifecycle", "mcpConfig"],
    advanced: `
<section class="adv-block">
  <h4>Ba phạm vi cấu hình</h4>
  <p>Khi thêm máy chủ bằng lệnh <code>claude mcp add</code>, bạn chọn phạm vi bằng cờ <code>--scope</code>:</p>
  <ul>
    <li><b>local</b> (mặc định): chỉ bạn dùng, chỉ trong dự án hiện tại. Lưu trong <code>~/.claude.json</code>.</li>
    <li><b>project</b>: cả nhóm dùng. Lưu trong <code>.mcp.json</code> ở gốc repo và được commit vào git.</li>
    <li><b>user</b>: chỉ bạn dùng, nhưng áp dụng cho mọi dự án. Cũng lưu trong <code>~/.claude.json</code>.</li>
  </ul>
  <p>Lần đầu gặp một máy chủ khai báo trong <code>.mcp.json</code>, Claude Code sẽ hỏi bạn có tin tưởng máy chủ đó không. Điều này để tránh việc clone một repo lạ rồi vô tình chạy công cụ do người khác cài sẵn.</p>
</section>
<section class="adv-block">
  <h4>Biến môi trường trong .mcp.json</h4>
  <p><code>\${GITHUB_TOKEN}</code> sẽ được thay bằng giá trị của biến môi trường GITHUB_TOKEN trên máy của từng người. Cú pháp <code>\${TÊN:-giá_trị_mặc_định}</code> cho phép dùng giá trị mặc định khi biến chưa được đặt. Nếu thiếu một biến bắt buộc, Claude Code báo lỗi cấu hình; khi đó hãy đặt biến trên máy của mình, đừng sửa file trong repo.</p>
</section>
<section class="adv-block">
  <h4>Ba thứ một máy chủ MCP có thể cung cấp</h4>
  <p><b>Tools</b> là công cụ do Claude quyết định gọi, ví dụ tạo issue trên GitHub. Trong Claude Code, tên công cụ có dạng <code>mcp__github__create_issue</code>.</p>
  <p><b>Resources</b> là nội dung để đọc, như danh sách issue hay cấu trúc cơ sở dữ liệu. Bạn có thể nhắc tới chúng bằng ký hiệu <code>@</code> trong Claude Code.</p>
  <p><b>Prompts</b> là các mẫu lời nhắc soạn sẵn, xuất hiện trong Claude Code dưới dạng lệnh tắt bắt đầu bằng <code>/mcp__</code>.</p>
</section>`,
    traps: [
      {
        title: "Repo riêng tư nên ghi token vào cũng được?",
        level: "hard",
        scenario: "Trưởng nhóm commit <code>.mcp.json</code> có ghi thẳng <code>\"GITHUB_TOKEN\": \"ghp_...\"</code>, với lý do repo là riêng tư, chỉ người trong nhóm đọc được.",
        bait: "Đồng ý vì tiện, mọi người không phải tự cấu hình gì.",
        why: "Token sẽ nằm vĩnh viễn trong lịch sử git. Mọi người dùng chung một danh tính nên không biết ai đã làm gì. Bản sao, bản fork hay nhật ký CI đều có thể làm lộ token.",
        fix: ["Thu hồi token đó ngay lập tức.", "Đổi thành <code>\"\${GITHUB_TOKEN}\"</code> để mỗi người dùng token của riêng mình.", "Ghi hướng dẫn cách đặt biến môi trường vào README."],
      },
      {
        title: "Chỉ máy của tôi có công cụ Jira",
        scenario: "Bạn thêm máy chủ Jira bằng <code>claude mcp add jira ...</code> mà không chỉ định phạm vi. Đồng nghiệp lấy code mới về nhưng Claude Code của họ không có công cụ Jira.",
        bait: "Nhắn đồng nghiệp chạy lại đúng câu lệnh đó.",
        why: "Phạm vi mặc định là local, tức cấu hình chỉ nằm trên máy của bạn, không vào repo.",
        fix: ["Thêm lại với <code>--scope project</code> để cấu hình được ghi vào <code>.mcp.json</code>.", "Commit <code>.mcp.json</code> (không chứa khóa bí mật)."],
      },
    ],
    quiz: [
      {
        level: "hard",
        q: "Thành viên mới clone repo. Claude Code hỏi có tin tưởng máy chủ trong .mcp.json không; sau khi đồng ý, máy chủ GitHub khởi động thất bại vì thiếu biến môi trường. Cách khắc phục đúng là gì?",
        options: ["Sửa .mcp.json và dán token của thành viên mới vào", "Thành viên mới đặt biến môi trường GITHUB_TOKEN trên máy của mình rồi khởi động lại", "Chuyển cấu hình sang ~/.claude.json của thành viên mới, ghi thẳng token", "Xóa máy chủ khỏi .mcp.json"],
        answer: 1,
        explain: "Cấu hình chung đã đúng; thứ còn thiếu là giá trị bí mật trên máy cá nhân. Hãy sửa ở môi trường của người đó, không sửa repo.",
        notes: ["Làm lộ khóa bí mật vào git.", "Đúng.", "Lệch cấu hình so với cả nhóm, và vẫn ghi thẳng khóa bí mật.", "Cả nhóm mất luôn công cụ."],
      },
    ],
  },

  /* ─────────────── 2-5 ─────────────── */
  "2-5": {
    widgets: ["builtinTrace", "builtinTools"],
    advanced: `
<section class="adv-block">
  <h4>Những tham số đáng nhớ</h4>
  <p><b>Grep</b> nhận một mẫu tìm kiếm. Tùy chọn <code>output_mode</code> quyết định trả về gì: chỉ danh sách file chứa kết quả (rất gọn), hay cả những dòng khớp (khi cần xem nội dung). Có thể lọc theo loại file để bớt kết quả thừa.</p>
  <p><b>Read</b> đọc một file; với file lớn có thể đọc từng phần bằng <code>offset</code> và <code>limit</code>.</p>
  <p><b>Edit</b> nhận đoạn cũ (<code>old_string</code>) và đoạn mới (<code>new_string</code>). File phải được đọc bằng Read trước đó. Tùy chọn <code>replace_all</code> thay mọi chỗ khớp, chỉ nên dùng khi chắc chắn mọi chỗ đều cần đổi, ví dụ đổi tên một biến.</p>
  <p><b>Bash</b> dùng để chạy test, build, git. Để tìm file hay đọc nội dung, nên dùng Grep, Glob, Read thay vì gõ lệnh tương đương qua Bash.</p>
</section>
<section class="adv-block">
  <h4>Khi Edit báo lỗi</h4>
  <p><b>“Tìm thấy N chỗ khớp”</b>: đoạn cần thay xuất hiện nhiều lần. Hãy lấy thêm vài dòng xung quanh để đoạn đó chỉ còn khớp một chỗ. Nếu nhiều chỗ giống hệt nhau và khó phân biệt, đọc cả file rồi ghi lại bằng Write.</p>
  <p><b>“Không tìm thấy đoạn cần thay”</b>: file đã thay đổi kể từ lần đọc trước, có thể do bạn sửa tay hoặc do công cụ định dạng code tự chạy. Hãy đọc lại file rồi mới sửa.</p>
</section>`,
    traps: [
      {
        title: "Dùng replace_all cho nhanh",
        level: "hard",
        scenario: "Edit báo lỗi vì <code>return null;</code> xuất hiện hai lần trong file. Claude đề xuất bật <code>replace_all: true</code> để đổi cả hai thành <code>throw new PaymentFailed()</code>.",
        bait: "Đồng ý vì lỗi đã hết.",
        why: "Chỗ thứ hai nằm trong nhánh xử lý hoàn tiền, có ý nghĩa khác hẳn. Thay hàng loạt sẽ tạo ra lỗi mới.",
        fix: ["Lấy thêm dòng xung quanh để đoạn cần thay chỉ khớp đúng chỗ cần sửa.", "Chỉ dùng replace_all cho những thay đổi đồng loạt có chủ ý, như đổi tên biến."],
      },
      {
        title: "Dùng Grep để tìm file test",
        scenario: "Cần liệt kê mọi file có đuôi <code>.spec.ts</code>. Claude chạy Grep tìm chuỗi <code>describe(</code>.",
        bait: "Chấp nhận vì kết quả trông gần đúng.",
        why: "Đây là tìm theo tên file, nên phải dùng Glob. Tìm theo nội dung sẽ sót những file test không dùng describe, và lẫn vào những file không phải test.",
        fix: ["Dùng Glob với mẫu <code>**/*.spec.ts</code>.", "Nhớ quy tắc: tìm theo tên hoặc đường dẫn thì dùng Glob; tìm theo nội dung thì dùng Grep."],
      },
    ],
    quiz: [
      {
        level: "hard",
        q: "Claude gọi Edit trên file config.ts và nhận lỗi “không tìm thấy đoạn cần thay”, dù 10 phút trước nó vừa đọc file và thấy đúng đoạn đó. Nguyên nhân khả dĩ và cách xử lý?",
        options: ["Edit lỗi ngẫu nhiên, cứ gọi lại", "File đã bị thay đổi sau lần đọc (do người dùng, công cụ định dạng code, hoặc lệnh khác); đọc lại rồi sửa theo nội dung hiện tại", "Bật replace_all: true", "Chuyển sang dùng Grep"],
        answer: 1,
        explain: "Edit so khớp với nội dung hiện tại của file. Những gì Claude đọc trước đó có thể đã cũ.",
        notes: ["Gọi lại y nguyên sẽ lỗi tiếp.", "Đúng.", "replace_all không giúp gì khi đoạn cần thay không còn tồn tại.", "Grep chỉ để tìm, không sửa được."],
        trap: "Thông tin Claude đọc được là bản chụp tại thời điểm đọc, không tự cập nhật khi file thay đổi.",
      },
    ],
  },
});
