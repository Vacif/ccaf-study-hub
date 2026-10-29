/* Nội dung chuyên sâu — Chương 2: Tool Design & MCP Integration */
window.DEEP_ADD({
  /* ─────────────── 2-1 ─────────────── */
  "2-1": {
    widgets: ["toolSelectTrace", "toolDescription"],
    advanced: `
<h4>🔬 Description đi vào đâu?</h4>
<p>Định nghĩa <code>tools</code> được API chèn vào phần đầu prompt (cùng system) ở <b>mọi</b> request. Hệ quả: (1) mô tả là ngữ cảnh model luôn nhìn thấy khi chọn công cụ; (2) mô tả dài tốn token mỗi lượt — nhưng thường đáng giá, và có thể cache.</p>
<h4>📝 Khung mô tả công cụ chất lượng</h4>
<pre><code>{
  "name": "lookup_order",
  "description": "Tra MỘT đơn hàng theo order_id.
    Trả về: trạng thái, vị trí vận chuyển, ngày giao dự kiến, số tiền.
    Dùng khi: khách hỏi đơn ở đâu / bao giờ giao / đã giao chưa.
    KHÔNG dùng để: tra hồ sơ khách (→ get_customer), hoàn tiền (→ process_refund).
    Đầu vào: chữ số sau dấu #, ví dụ '#1234' → '1234'.",
  "input_schema": {
    "type": "object",
    "properties": {
      "order_id": {"type": "string", "description": "Chỉ chữ số, bỏ dấu #"}
    },
    "required": ["order_id"]
  }
}</code></pre>
<h4>🧭 Bốn đòn bẩy khi Claude chọn sai công cụ (từ rẻ đến đắt)</h4>
<div class="dg dg-anim">
  <div class="dn good"><b>1. Viết lại description</b>ranh giới, ví dụ, “không dùng khi”</div><span class="da">→</span>
  <div class="dn"><b>2. Đổi tên rõ nghĩa</b><code>search</code> → <code>search_kb_articles</code></div><span class="da">→</span>
  <div class="dn"><b>3. Tách / gộp công cụ</b>tách công cụ đa năng; gộp hai công cụ gần như trùng</div><span class="da">→</span>
  <div class="dn bad"><b>4. Hạ tầng thêm</b>router, fine-tune — hiếm khi cần</div>
</div>
<h4>🧲 Những thứ âm thầm “kéo” lựa chọn</h4>
<ul>
  <li>System prompt có câu “luôn kiểm tra tài khoản khách trước” → Claude nghiêng về <code>get_customer</code> ngay cả khi hỏi về đơn.</li>
  <li>Tên công cụ chung chung (<code>get_info</code>, <code>process</code>) hút mọi loại yêu cầu.</li>
  <li>Hai server MCP có công cụ cùng chức năng (ví dụ hai công cụ <code>search</code>) — mô tả cần phân biệt nguồn dữ liệu.</li>
</ul>
<h4>📤 Thiết kế cả phần trả về</h4>
<p>Kết quả công cụ cũng là prompt: trả trường có ý nghĩa (tên thay vì chỉ UUID), gọn, có cấu trúc ổn định. Kết quả rối làm Claude chọn sai ở bước <i>tiếp theo</i>.</p>`,
    traps: [
      {
        title: "System prompt vô tình định tuyến",
        level: "hard",
        scenario: "Sau khi viết lại description cẩn thận, Claude vẫn hay gọi <code>get_customer</code> cho câu hỏi về đơn. System prompt có dòng: “Trước khi trả lời bất cứ điều gì, hãy kiểm tra thông tin khách hàng.”",
        bait: "Viết description dài hơn nữa, hoặc thêm classifier.",
        why: "Chỉ dẫn trong system prompt mâu thuẫn với mô tả công cụ và thắng thế.",
        fix: ["Rà system prompt tìm từ khóa gắn với tên/chức năng công cụ.", "Sửa thành điều kiện cụ thể: “Xác minh khách trước khi thao tác liên quan tới tiền.”", "Chạy lại bộ câu hỏi kiểm thử định tuyến."],
      },
      {
        title: "Gộp hai công cụ cho “đỡ nhầm”",
        scenario: "<code>get_customer</code> và <code>lookup_order</code> hay bị nhầm. Đề xuất: gộp thành <code>get_data(type, id)</code>.",
        bait: "Ít công cụ hơn = ít nhầm hơn.",
        why: "Nhầm lẫn chỉ chuyển từ “chọn công cụ” sang “chọn tham số type”; mô tả của công cụ gộp còn khó viết rõ hơn.",
        fix: ["Giữ hai công cụ chuyên biệt, mô tả ranh giới rõ.", "Gộp chỉ hợp lý khi hai công cụ thực chất làm cùng một việc."],
      },
    ],
    quiz: [
      {
        level: "hard",
        q: "Agent có công cụ analyze_document dùng cho mọi việc với tài liệu; kết quả lúc trích số liệu, lúc tóm tắt, lúc kiểm chứng — không ổn định. Cải thiện tốt nhất?",
        options: ["Thêm tham số mode vào analyze_document", "Tách thành extract_data_points, summarize_content, verify_claim_against_source với mô tả rõ ràng", "Thêm few-shot cho analyze_document", "Tăng temperature"],
        answer: 1,
        explain: "Công cụ đa năng có ranh giới mờ. Công cụ chuyên biệt, tên và mô tả rõ giúp Claude chọn đúng hành động.",
        notes: ["Chuyển mơ hồ vào tham số, không giải quyết gốc.", "Đúng.", "Có ích một phần nhưng vẫn là một công cụ đa nghĩa.", "Tăng ngẫu nhiên, ngược mục tiêu."],
      },
    ],
  },

  /* ─────────────── 2-2 ─────────────── */
  "2-2": {
    advanced: `
<h4>🛤️ Hai kênh lỗi trong MCP</h4>
<table class="t">
  <tr><th></th><th>Lỗi giao thức (JSON-RPC <code>error</code>)</th><th>Lỗi thực thi công cụ (<code>result.isError: true</code>)</th></tr>
  <tr><td>Khi nào</td><td>Công cụ không tồn tại, tham số sai cấu trúc, server hỏng</td><td>Công cụ chạy nhưng thất bại: timeout, vi phạm nghiệp vụ, không đủ quyền</td></tr>
  <tr><td>Model thấy gì</td><td>Thông điệp lỗi chung do client chuyển tiếp</td><td>Nội dung lỗi bạn thiết kế — có thể kèm phân loại, gợi ý</td></tr>
  <tr><td>Ai nên xử lý</td><td>Hạ tầng / developer</td><td>Model tự phục hồi</td></tr>
</table>
<h4>🧾 Mẫu payload lỗi giàu thông tin</h4>
<pre><code>{
  "isError": true,
  "content": [{"type": "text", "text": "{
    \\"errorCategory\\": \\"transient\\",
    \\"isRetryable\\": true,
    \\"retryAfterMs\\": 2000,
    \\"message\\": \\"Kho đơn hàng không phản hồi sau 5s\\",
    \\"partial\\": {\\"orders_checked\\": 3}
  }"}]
}</code></pre>
<h4>🔧 Chiến lược phục hồi theo loại</h4>
<table class="t">
  <tr><th>Loại</th><th>Retry?</th><th>Hành động</th></tr>
  <tr><td>Transient</td><td>Có, giới hạn, backoff (có jitter)</td><td>Hết lượt → báo lên kèm kết quả một phần</td></tr>
  <tr><td>Validation</td><td>Sau khi sửa đầu vào</td><td>Sửa tham số hoặc hỏi lại người dùng</td></tr>
  <tr><td>Business</td><td>Không</td><td>Giải thích chính sách, đề xuất phương án khác</td></tr>
  <tr><td>Permission</td><td>Không</td><td>Escalate tới người/hệ thống có quyền</td></tr>
</table>
<h4>⚠️ Retry an toàn cho thao tác ghi</h4>
<p>Timeout khi gọi <code>process_refund</code> không có nghĩa là hoàn tiền chưa xảy ra. Retry thao tác có tác dụng phụ cần <b>idempotency key</b>, hoặc công cụ kiểm tra trạng thái trước khi thực hiện lại.</p>
<h4>🧭 Phục hồi cục bộ trước, báo lên sau</h4>
<p>Subagent tự xử lý lỗi transient (retry vài lần). Chỉ đẩy lên coordinator những gì nó không tự xử lý được — kèm: đã thử gì, kết quả một phần, phương án thay thế.</p>`,
    traps: [
      {
        title: "Rỗng hay lỗi?",
        level: "hard",
        scenario: "Công cụ <code>search_orders</code> bắt mọi exception và trả <code>{\"orders\": []}</code> để “không làm sập agent”. Khi DB bảo trì 10 phút, agent nói với 300 khách rằng “bạn chưa có đơn nào”.",
        bait: "Thêm vào prompt: “nếu không thấy đơn hãy nói hệ thống có thể đang lỗi”.",
        why: "Model không thể phân biệt hai tình huống có cùng hình dạng dữ liệu. Lỗi bị nuốt ở tầng công cụ.",
        fix: ["Lỗi → <code>isError: true</code>, <code>errorCategory: \"transient\"</code>.", "Rỗng hợp lệ → <code>isError: false</code> kèm ghi chú “truy vấn thành công, 0 kết quả”.", "Không bao giờ dùng cùng một payload cho hai ý nghĩa khác nhau."],
      },
      {
        title: "isRetryable sai gây lặp",
        scenario: "Mọi lỗi của công cụ refund đều đánh dấu <code>isRetryable: true</code>. Với đơn quá hạn 90 ngày, Claude thử lại 5 lần rồi xin lỗi “hệ thống lỗi”.",
        bait: "Giảm MAX_TURNS.",
        why: "Lỗi nghiệp vụ không bao giờ thành công khi thử lại; metadata sai dẫn dắt model sai.",
        fix: ["Phân loại đúng: business → isRetryable: false.", "Kèm thông điệp thân thiện để Claude giải thích cho khách."],
      },
    ],
    quiz: [
      {
        level: "hard",
        q: "Công cụ process_refund bị timeout khi gọi cổng thanh toán. Thiết kế phản hồi lỗi và phục hồi nào an toàn nhất?",
        options: ["isError, transient, isRetryable: true — Claude gọi lại process_refund ngay", "isError, transient, kèm thông tin để kiểm tra trạng thái; retry dùng idempotency key để không hoàn hai lần", "Trả thành công vì có thể giao dịch đã xong", "isError, business, isRetryable: false"],
        answer: 1,
        explain: "Timeout với thao tác ghi là trạng thái không chắc chắn. Retry chỉ an toàn khi có idempotency hoặc kiểm tra trạng thái trước.",
        notes: ["Có thể hoàn tiền hai lần.", "Đúng.", "Có thể báo sai cho khách.", "Phân loại sai — đây không phải vi phạm nghiệp vụ."],
        trap: "“Transient → retry” đúng với thao tác đọc, nhưng thao tác ghi cần thêm idempotency.",
      },
    ],
  },

  /* ─────────────── 2-3 ─────────────── */
  "2-3": {
    advanced: `
<h4>🎛️ Bảng đầy đủ tool_choice</h4>
<table class="t">
  <tr><th>Giá trị</th><th>Hành vi</th><th>Dùng khi</th></tr>
  <tr><td><code>{"type":"auto"}</code></td><td>Tự quyết: gọi công cụ hoặc trả text</td><td>Agent hội thoại thông thường</td></tr>
  <tr><td><code>{"type":"any"}</code></td><td>Phải gọi ít nhất một công cụ, tự chọn công cụ</td><td>Trích xuất nhiều schema, phải có JSON</td></tr>
  <tr><td><code>{"type":"tool","name":"X"}</code></td><td>Phải gọi đúng X</td><td>Ép bước đầu tiên / chỉ một schema đầu ra</td></tr>
  <tr><td><code>{"type":"none"}</code></td><td>Không được gọi công cụ</td><td>Lượt chỉ cần trả lời text, vẫn giữ tools để cache</td></tr>
</table>
<ul>
  <li><code>disable_parallel_tool_use: true</code> → tối đa một tool_use mỗi lượt (với <code>any</code>/<code>tool</code>: đúng một).</li>
  <li><code>any</code>/<code>tool</code>: response bắt đầu ngay bằng tool_use, không có text giải thích trước.</li>
  <li>Extended thinking chỉ tương thích <code>auto</code> và <code>none</code>.</li>
</ul>
<h4>🧰 Phân phối công cụ theo vai trò</h4>
<div class="dg dg-anim">
  <div class="dn"><span class="i">🔎</span><b>search</b>WebSearch, WebFetch</div>
  <div class="dn"><span class="i">🧪</span><b>analyze</b>Read, load_document</div>
  <div class="dn"><span class="i">📝</span><b>synth</b>verify_fact (hẹp)</div>
  <div class="dn bad"><span class="i">🤹</span><b>agent “biết tuốt”</b>18 công cụ → chọn sai, lạc vai trò</div>
</div>
<ul>
  <li>Công cụ chung chung → thay bằng phiên bản giới hạn: <code>fetch_url</code> (mọi URL) → <code>load_document</code> (chỉ URL trong danh sách nguồn đã duyệt).</li>
  <li>Nhu cầu xuyên vai trò thường xuyên → cấp công cụ <b>hẹp</b> (synth có <code>verify_fact</code>, không có search tổng quát).</li>
  <li>Bộ công cụ có thể đổi theo giai đoạn: giai đoạn 1 ép <code>extract_metadata</code>, giai đoạn 2 dùng <code>auto</code> với công cụ xử lý.</li>
</ul>`,
    traps: [
      {
        title: "Ép công cụ trong agent hội thoại",
        level: "hard",
        scenario: "Để “chắc chắn có JSON”, team đặt <code>tool_choice: {type:\"any\"}</code> cho agent chat CSKH. Khi khách nói “cảm ơn”, agent vẫn gọi <code>search_kb</code> vô nghĩa và không bao giờ nói lời chào kết thúc.",
        bait: "Thêm công cụ <code>reply_to_user</code> để agent “trả lời qua công cụ”.",
        why: "<code>any</code> cấm trả lời thuần text — phù hợp pipeline trích xuất, không hợp hội thoại.",
        fix: ["Agent hội thoại: <code>auto</code>.", "Chỉ ép công cụ ở lượt/pipeline cần đầu ra có cấu trúc.", "Nếu cần JSON cuối phiên, dùng một lời gọi trích xuất riêng với tool bắt buộc."],
      },
      {
        title: "any không đảm bảo thứ tự",
        scenario: "Pipeline yêu cầu luôn trích metadata trước khi trích nội dung. Đặt <code>any</code>, đôi khi Claude gọi <code>extract_invoice</code> trước.",
        bait: "Viết vào prompt “luôn gọi extract_metadata trước”.",
        why: "<code>any</code> chỉ đảm bảo có gọi công cụ, không đảm bảo công cụ nào.",
        fix: ["Lượt 1: <code>{type:\"tool\", name:\"extract_metadata\"}</code>.", "Lượt sau: chuyển sang <code>any</code>/<code>auto</code> tùy nhu cầu."],
      },
    ],
    quiz: [
      {
        level: "hard",
        q: "Pipeline phải luôn chạy extract_metadata đầu tiên, sau đó model tự chọn một trong ba công cụ trích xuất theo loại tài liệu. Cấu hình tool_choice nào đúng?",
        options: ["auto cho cả hai lượt", "Lượt 1: {type: tool, name: extract_metadata}; lượt 2: {type: any}", "any cho cả hai lượt", "Lượt 1: any; lượt 2: tool"],
        answer: 1,
        explain: "Forced tool đảm bảo đúng bước đầu; any ở lượt sau đảm bảo có JSON mà vẫn để model chọn schema.",
        notes: ["Không đảm bảo có tool call.", "Đúng.", "Không đảm bảo extract_metadata chạy đầu.", "Ngược thứ tự yêu cầu."],
      },
    ],
  },

  /* ─────────────── 2-4 ─────────────── */
  "2-4": {
    widgets: ["mcpLifecycle", "mcpConfig"],
    advanced: `
<h4>📍 Ba phạm vi cấu hình MCP trong Claude Code</h4>
<table class="t">
  <tr><th>Scope</th><th>Lưu ở</th><th>Chia sẻ</th><th>Thêm bằng</th></tr>
  <tr><td>local (mặc định)</td><td><code>~/.claude.json</code>, gắn với project hiện tại</td><td>Không</td><td><code>claude mcp add …</code></td></tr>
  <tr><td>project</td><td><code>.mcp.json</code> ở gốc repo</td><td>Có (git)</td><td><code>claude mcp add --scope project …</code></td></tr>
  <tr><td>user</td><td><code>~/.claude.json</code></td><td>Không, nhưng dùng cho mọi project</td><td><code>claude mcp add --scope user …</code></td></tr>
</table>
<p>Server project-scope cần người dùng <b>chấp thuận</b> lần đầu (bảo vệ khỏi repo độc hại tự khai báo server).</p>
<h4>🔐 Biến môi trường trong .mcp.json</h4>
<ul>
  <li><code>\${VAR}</code> → giá trị biến; <code>\${VAR:-mặc_định}</code> → dùng mặc định nếu chưa đặt.</li>
  <li>Dùng được trong <code>command</code>, <code>args</code>, <code>env</code>, <code>url</code>, <code>headers</code>.</li>
  <li>Thiếu biến bắt buộc → lỗi cấu hình; sửa ở môi trường của dev, không sửa repo.</li>
</ul>
<h4>🚚 Transport</h4>
<ul>
  <li><b>stdio</b>: Claude Code chạy server như tiến trình con, trao đổi JSON-RPC qua stdin/stdout. Phù hợp công cụ cục bộ.</li>
  <li><b>HTTP (Streamable HTTP)</b>: server từ xa, thường xác thực OAuth. (SSE là cách cũ.)</li>
</ul>
<h4>🧱 Ba loại khả năng của MCP server</h4>
<table class="t">
  <tr><th>Loại</th><th>Ai kích hoạt</th><th>Ví dụ trong Claude Code</th></tr>
  <tr><td>Tools</td><td>Model</td><td><code>mcp__github__create_issue</code></td></tr>
  <tr><td>Resources</td><td>Ứng dụng/người dùng (đọc nội dung)</td><td>Tham chiếu bằng <code>@server:…</code>; danh mục issue, schema DB</td></tr>
  <tr><td>Prompts</td><td>Người dùng</td><td>Xuất hiện như slash command <code>/mcp__server__prompt</code></td></tr>
</table>
<h4>🏪 Dùng server có sẵn hay tự viết?</h4>
<p>Tích hợp phổ biến (GitHub, Jira, Slack, Postgres…) → dùng server chính thức/cộng đồng đã kiểm chứng. Tự viết khi quy trình đặc thù của team (ví dụ API nội bộ) — và khi đó đầu tư vào description và lỗi có cấu trúc.</p>`,
    traps: [
      {
        title: "Repo private nên commit token cũng được?",
        level: "hard",
        scenario: "Team lead commit <code>.mcp.json</code> có <code>\"GITHUB_TOKEN\": \"ghp_…\"</code> với lý do “repo private, chỉ người trong team đọc được”.",
        bait: "Chấp nhận vì tiện, mọi người không phải tự cấu hình.",
        why: "Token nằm vĩnh viễn trong lịch sử git, mọi người dùng chung một danh tính (không audit được), fork/clone/CI log đều có thể lộ.",
        fix: ["Thu hồi token ngay.", "Đổi thành <code>\"\${GITHUB_TOKEN}\"</code>; mỗi dev dùng token riêng.", "Viết hướng dẫn thiết lập biến môi trường trong README/CLAUDE.md."],
      },
      {
        title: "Chỉ máy tôi có công cụ Jira",
        scenario: "Bạn thêm Jira server bằng <code>claude mcp add jira …</code> (không chỉ định scope). Đồng nghiệp pull repo nhưng Claude Code của họ không có công cụ Jira.",
        bait: "Nhắn đồng nghiệp chạy lại đúng lệnh đó.",
        why: "Scope mặc định là local — lưu trong <code>~/.claude.json</code> của bạn, không vào repo.",
        fix: ["Thêm lại với <code>--scope project</code> để tạo/cập nhật <code>.mcp.json</code>.", "Commit <code>.mcp.json</code> (không chứa secret)."],
      },
    ],
    quiz: [
      {
        level: "hard",
        q: "Dev mới clone repo, Claude Code hỏi có tin cậy server trong .mcp.json không; sau khi đồng ý, server GitHub khởi động thất bại với lỗi thiếu biến môi trường. Cách khắc phục đúng?",
        options: ["Sửa .mcp.json, dán token của dev mới vào", "Dev mới đặt biến môi trường GITHUB_TOKEN trong shell/secret manager của mình rồi khởi động lại", "Chuyển server sang ~/.claude.json của dev mới với token hardcode", "Xóa server khỏi .mcp.json"],
        answer: 1,
        explain: "Cấu hình chung đúng; thiếu là giá trị secret ở môi trường cá nhân — sửa ở môi trường, không sửa repo.",
        notes: ["Lộ secret vào git.", "Đúng.", "Mất đồng bộ với team, vẫn hardcode secret.", "Cả team mất công cụ."],
      },
    ],
  },

  /* ─────────────── 2-5 ─────────────── */
  "2-5": {
    widgets: ["builtinTrace", "builtinTools"],
    advanced: `
<h4>🧰 Tham số quan trọng của từng công cụ</h4>
<table class="t">
  <tr><th>Công cụ</th><th>Tham số chính</th><th>Lưu ý</th></tr>
  <tr><td>Grep</td><td><code>pattern</code> (regex), <code>output_mode</code>, <code>glob</code>/<code>type</code>, <code>-i</code>, <code>-C</code></td><td><code>files_with_matches</code> rẻ ngữ cảnh; <code>content</code> khi cần dòng cụ thể</td></tr>
  <tr><td>Glob</td><td><code>pattern</code>, <code>path</code></td><td>Trả đường dẫn khớp, sắp theo thời gian sửa</td></tr>
  <tr><td>Read</td><td><code>file_path</code>, <code>offset</code>, <code>limit</code></td><td>Đọc một phần file lớn; đọc được ảnh/PDF</td></tr>
  <tr><td>Edit</td><td><code>old_string</code>, <code>new_string</code>, <code>replace_all</code></td><td>Phải Read file trước; neo phải duy nhất trừ khi replace_all</td></tr>
  <tr><td>Write</td><td><code>file_path</code>, <code>content</code></td><td>Ghi đè toàn bộ; file đã có cần Read trước</td></tr>
  <tr><td>Bash</td><td><code>command</code>, <code>timeout</code></td><td>Cho test/build/git; ưu tiên Grep/Glob/Read thay cho grep/find/cat qua Bash</td></tr>
</table>
<h4>🧭 Chiến lược khám phá tăng dần</h4>
<div class="dg dg-anim">
  <div class="dn"><span class="i">🔍</span><b>Grep</b>tìm điểm vào (tên hàm, thông báo lỗi)</div><span class="da">→</span>
  <div class="dn"><span class="i">📖</span><b>Read</b>file liên quan nhất</div><span class="da">→</span>
  <div class="dn"><span class="i">🧵</span><b>Lần theo</b>import, nơi gọi</div><span class="da">→</span>
  <div class="dn"><span class="i">✏️</span><b>Edit</b>neo duy nhất</div><span class="da">→</span>
  <div class="dn good"><span class="i">▶️</span><b>Bash</b>chạy test kiểm chứng</div>
</div>
<h4>✏️ Khi Edit thất bại</h4>
<ol>
  <li>“Found N matches” → mở rộng <code>old_string</code> với dòng xung quanh cho duy nhất.</li>
  <li>Muốn đổi <b>mọi</b> chỗ (đổi tên biến) → <code>replace_all: true</code> — chỉ khi chắc mọi chỗ đều cần đổi.</li>
  <li>Nhiều chỗ giống hệt, khó tạo neo duy nhất / sửa cấu trúc lớn → Read toàn bộ rồi Write lại.</li>
  <li>“String not found” → file đã đổi từ lần Read trước; Read lại.</li>
</ol>`,
    traps: [
      {
        title: "replace_all cho nhanh",
        level: "hard",
        scenario: "Edit lỗi vì <code>return null;</code> xuất hiện 2 lần. Claude đề xuất dùng <code>replace_all: true</code> để đổi thành <code>throw new PaymentFailed()</code>.",
        bait: "Đồng ý vì lỗi đã được giải quyết.",
        why: "Lần xuất hiện thứ hai nằm trong nhánh refund có ngữ nghĩa khác — thay hàng loạt tạo bug mới.",
        fix: ["Mở rộng neo bằng dòng ngữ cảnh để chỉ khớp chỗ cần sửa.", "replace_all chỉ cho thay đổi đồng nhất có chủ ý (đổi tên)."],
      },
      {
        title: "Dùng Grep để tìm file test",
        scenario: "Cần liệt kê mọi file <code>*.spec.ts</code>. Claude chạy <code>Grep pattern=\"describe(\"</code>.",
        bait: "Kết quả gần đúng nên chấp nhận.",
        why: "Đây là tìm theo <b>tên file</b> → Glob. Grep theo nội dung bỏ sót file test không dùng describe và lẫn file không phải test.",
        fix: ["<code>Glob pattern=\"**/*.spec.ts\"</code>.", "Nhớ: tên/đường dẫn → Glob; nội dung → Grep."],
      },
    ],
    quiz: [
      {
        level: "hard",
        q: "Claude gọi Edit trên config.ts và nhận lỗi “String to replace not found”, dù 10 phút trước nó đã Read file và thấy đúng chuỗi đó. Nguyên nhân khả dĩ và cách xử lý?",
        options: ["Edit bị lỗi ngẫu nhiên, gọi lại", "File đã bị thay đổi sau lần Read (bởi người dùng, formatter hoặc lệnh khác); Read lại rồi Edit với nội dung hiện tại", "Dùng replace_all: true", "Chuyển sang Grep"],
        answer: 1,
        explain: "Edit so khớp với nội dung hiện tại của file. Nội dung trong ngữ cảnh có thể đã lỗi thời.",
        notes: ["Lặp lại y nguyên sẽ lỗi tiếp.", "Đúng.", "replace_all không giúp khi chuỗi không tồn tại.", "Grep chỉ tìm, không sửa."],
        trap: "Ngữ cảnh của Claude là ảnh chụp tại lúc Read, không tự cập nhật khi file đổi.",
      },
    ],
  },
});
