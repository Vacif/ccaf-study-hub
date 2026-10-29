/* Nội dung chuyên sâu — Chương 1: Agentic Architecture & Orchestration */
window.DEEP_ADD({
  /* ─────────────── 1-1 ─────────────── */
  "1-1": {
    advanced: `
<h4>🔁 Máy trạng thái của vòng lặp</h4>
<div class="dg dg-anim">
  <div class="dn"><span class="i">📤</span><b>Gửi request</b>system + tools + messages</div><span class="da">→</span>
  <div class="dn"><span class="i">📥</span><b>Đọc stop_reason</b></div><span class="da">→</span>
  <div class="dn hot"><span class="i">🛠️</span><b>tool_use</b>chạy công cụ → nối tool_result → gửi lại</div><span class="da">|</span>
  <div class="dn good"><span class="i">🏁</span><b>end_turn</b>trả lời người dùng, lưu lịch sử</div><span class="da">|</span>
  <div class="dn bad"><span class="i">✂️</span><b>max_tokens</b>bị cắt → tăng trần / xử lý riêng</div>
</div>
<h4>📋 Mọi giá trị stop_reason cần xử lý</h4>
<table class="t">
  <tr><th>stop_reason</th><th>Ý nghĩa</th><th>Backend nên làm</th></tr>
  <tr><td><code>end_turn</code></td><td>Claude kết thúc tự nhiên</td><td>Thoát vòng lặp, trả lời</td></tr>
  <tr><td><code>tool_use</code></td><td>Claude yêu cầu chạy ≥ 1 công cụ</td><td>Chạy tất cả, trả tool_result cho từng <code>id</code>, gọi lại</td></tr>
  <tr><td><code>max_tokens</code></td><td>Chạm trần token đầu ra</td><td>Không coi là xong; tool_use có thể dở dang → tăng <code>max_tokens</code> và gọi lại</td></tr>
  <tr><td><code>stop_sequence</code></td><td>Gặp chuỗi dừng bạn đặt</td><td>Xử lý theo logic của bạn</td></tr>
  <tr><td><code>pause_turn</code></td><td>Lượt dài với <em>server tool</em> (ví dụ web search chạy phía Anthropic) bị tạm dừng</td><td>Gửi lại response như message assistant để Claude tiếp tục</td></tr>
  <tr><td><code>refusal</code></td><td>Model từ chối vì lý do an toàn</td><td>Không retry y nguyên; xử lý/escalate</td></tr>
</table>
<h4>📐 Luật cấu trúc message (sai là API trả lỗi 400)</h4>
<ul>
  <li>Mỗi khối <code>tool_use</code> phải có đúng một <code>tool_result</code> với <code>tool_use_id</code> trùng khớp, nằm trong message <code>user</code> <b>ngay sau</b> message assistant đó.</li>
  <li>Nhiều tool_use trong một lượt → <b>một</b> message user chứa tất cả tool_result; các khối tool_result đặt trước mọi text.</li>
  <li>Nối <b>nguyên văn</b> <code>resp.content</code> (kể cả text) vào lịch sử với role assistant — đừng chỉ giữ phần text.</li>
  <li>Công cụ lỗi vẫn phải có tool_result: <code>is_error: true</code> + mô tả.</li>
</ul>
<h4>💰 Chi phí & độ dài ngữ cảnh</h4>
<p>API <b>stateless</b>: lượt thứ <i>n</i> gửi lại toàn bộ <i>n−1</i> lượt trước. Token đầu vào mỗi lượt tăng tuyến tính, tổng chi phí cả phiên tăng nhanh hơn tuyến tính. Ba đòn bẩy:</p>
<ul>
  <li><b>Prompt caching</b>: đánh dấu <code>cache_control</code> ở cuối phần tĩnh (tools, system, phần đầu lịch sử) — phần lặp lại được tính giá rẻ hơn nhiều và nhanh hơn.</li>
  <li><b>Cắt gọn tool_result</b> về trường cần thiết trước khi nối vào lịch sử.</li>
  <li><b>Tóm tắt / nén</b> lịch sử cũ khi gần ngưỡng (nhưng giữ dữ kiện quan trọng nguyên văn — xem mục 5-1).</li>
</ul>
<h4>🧯 Lưới an toàn — không phải tín hiệu dừng</h4>
<ul>
  <li><code>MAX_TURNS</code>, timeout tổng, ngân sách token/chi phí: chạm ngưỡng → kết thúc <b>có kiểm soát</b> (escalate, báo người dùng), không im lặng cắt.</li>
  <li>Phát hiện lặp: cùng công cụ + cùng input nhiều lần liên tiếp → dấu hiệu lỗi trả về không đủ thông tin để Claude đổi hướng.</li>
</ul>
<h4>🧰 Bạn có thể không phải tự viết vòng lặp</h4>
<p>Claude Agent SDK và tool runner của SDK chạy vòng lặp này cho bạn (gọi công cụ, nối kết quả, dừng ở end_turn). Nhưng đề thi kiểm tra bạn <b>hiểu</b> vòng lặp: tín hiệu nào điều khiển, dữ liệu nào phải đi đâu.</p>`,
    traps: [
      {
        title: "Text + tool_use trong cùng response",
        level: "hard",
        scenario: "Response có <code>content: [{type:\"text\", text:\"Đã xong, mình đang hoàn tiền cho bạn\"}, {type:\"tool_use\", name:\"process_refund\", …}]</code>. Code của bạn: <code>if any(b.type == \"text\"): return text</code>.",
        bait: "“Có câu trả lời rồi, gửi cho khách thôi” — hoặc tìm chữ “xong” để quyết định dừng.",
        why: "Claude có thể nói trước khi gọi công cụ. Hoàn tiền chưa hề được thực hiện; khách nhận lời hứa sai.",
        fix: ["Chỉ dùng <code>stop_reason</code> để điều khiển vòng lặp.", "<code>tool_use</code> → chạy công cụ, nối kết quả, gọi lại; chỉ trả lời khi <code>end_turn</code>.", "Không phân tích ngôn ngữ tự nhiên để ra quyết định điều khiển."],
        code: "while True:\n    resp = call(messages)\n    messages.append({\"role\": \"assistant\", \"content\": resp.content})\n    if resp.stop_reason == \"end_turn\": break\n    if resp.stop_reason == \"tool_use\": messages.append(run_tools(resp))",
      },
      {
        title: "Một trong hai công cụ song song bị lỗi",
        level: "hard",
        scenario: "Claude gọi song song <code>lookup_order</code> và <code>get_refund_policy</code>. Policy service ném exception. Backend chỉ gửi lại tool_result của lookup_order rồi gọi API → nhận lỗi 400.",
        bait: "Bỏ qua công cụ lỗi cho “gọn”, hoặc throw exception lên trên làm sập cả phiên chat.",
        why: "API yêu cầu mọi tool_use phải có tool_result tương ứng. Bỏ qua → request không hợp lệ; throw → khách mất phiên.",
        fix: ["Bọc từng công cụ trong try/except.", "Lỗi → vẫn tạo tool_result với <code>is_error: true</code> và nội dung có phân loại (transient/validation/…).", "Gửi tất cả tool_result trong <b>một</b> message user.", "Để Claude quyết định thử lại hay báo khách."],
      },
      {
        title: "Vòng lặp lặp vô tận",
        scenario: "Log cho thấy Claude gọi <code>search_kb(\"chính sách hoàn tiền\")</code> 14 lần liên tiếp tới khi chạm MAX_TURNS = 15. Mỗi lần công cụ trả <code>\"Operation failed\"</code>.",
        bait: "Tăng MAX_TURNS lên 50, hoặc hạ xuống 3 để “đỡ tốn tiền”.",
        why: "Giới hạn chỉ che triệu chứng. Nguyên nhân là lỗi mơ hồ: Claude không biết lỗi do đâu nên thử lại y hệt.",
        fix: ["Trả lỗi có cấu trúc: loại lỗi, có retry được không, gợi ý sửa.", "Phát hiện lặp (cùng tên + cùng input ≥ 3 lần) → dừng, escalate có tóm tắt.", "Giữ MAX_TURNS hợp lý làm lưới an toàn, xử lý khi chạm (escalate) thay vì cắt im lặng."],
      },
    ],
    quiz: [
      {
        level: "hard",
        q: "Response của Claude có stop_reason \"tool_use\" với hai khối tool_use (A, B). Công cụ B ném exception. Backend nên gửi gì ở request tiếp theo?",
        options: ["Một message user chỉ chứa tool_result của A", "Một message user chứa tool_result của A và tool_result của B với is_error: true kèm mô tả lỗi", "Hai message user liên tiếp, mỗi message một tool_result", "Không gửi gì, trả lỗi 500 cho người dùng"],
        answer: 1,
        explain: "Mọi tool_use cần một tool_result tương ứng trong cùng một message user ngay sau đó; lỗi được báo bằng is_error để Claude tự phục hồi.",
        notes: ["Thiếu kết quả cho B → API từ chối request.", "Đúng cấu trúc và cho Claude đủ thông tin để xử lý lỗi.", "Các tool_result của cùng một lượt phải nằm chung một message.", "Làm hỏng trải nghiệm vì một lỗi có thể phục hồi được."],
        trap: "Phương án A trông “sạch sẽ” nhưng vi phạm luật cặp tool_use ↔ tool_result.",
      },
      {
        level: "hard",
        q: "Agent thỉnh thoảng gửi cho khách câu trả lời bị cụt giữa chừng. Log cho thấy stop_reason của các response đó là \"max_tokens\". Code hiện tại dừng vòng lặp khi stop_reason khác \"tool_use\". Cách sửa đúng?",
        options: ["Thêm vào prompt: “trả lời ngắn gọn”", "Xử lý riêng max_tokens: không coi là hoàn thành, tăng max_tokens (hoặc tiếp tục sinh) rồi mới trả lời", "Giảm số công cụ", "Dừng khi response có text"],
        answer: 1,
        explain: "Điều kiện dừng đúng là end_turn, không phải “khác tool_use”. max_tokens nghĩa là bị cắt — cần xử lý riêng.",
        notes: ["Có thể giảm tần suất nhưng không sửa logic sai; câu dài vẫn bị cắt.", "Đúng: phân biệt từng stop_reason.", "Không liên quan đến việc bị cắt.", "Chính là anti-pattern gây ra lỗi."],
        trap: "Điều kiện “!= tool_use” trông tương đương “== end_turn” nhưng gộp chung max_tokens, stop_sequence, refusal… vào nhánh “xong”.",
      },
      {
        level: "hard",
        q: "Một phiên hỗ trợ 40 lượt có chi phí đầu vào tăng rất nhanh về cuối phiên. Nguyên nhân gốc và cách giảm phù hợp nhất?",
        options: ["Model tự nhớ hội thoại nên tốn bộ nhớ; chuyển model nhỏ hơn", "API stateless nên mỗi lượt gửi lại toàn bộ lịch sử; dùng prompt caching cho phần tĩnh và cắt gọn tool_result", "Chuyển sang Message Batches API", "Tăng max_tokens"],
        answer: 1,
        explain: "Mỗi request gửi lại system + tools + toàn bộ messages. Cache phần lặp lại và giảm kích thước kết quả công cụ là đòn bẩy trực tiếp.",
        notes: ["Model không lưu trạng thái giữa các request.", "Đúng nguyên nhân và đúng đòn bẩy.", "Chat cần phản hồi ngay — Batch không phù hợp.", "max_tokens là trần đầu ra, không giảm đầu vào."],
      },
    ],
  },

  /* ─────────────── 1-2 ─────────────── */
  "1-2": {
    advanced: `
<h4>🏗️ So sánh các kiểu phối hợp đa agent</h4>
<table class="t">
  <tr><th>Mô hình</th><th>Ưu</th><th>Nhược</th><th>Khi nào</th></tr>
  <tr><td>🧭 Hub-and-spoke (coordinator)</td><td>Một điểm quan sát, xử lý lỗi & áp chính sách nhất quán</td><td>Coordinator là nút cổ chai; mọi dữ liệu phải đi qua nó</td><td>Mặc định cho hệ thống production</td></tr>
  <tr><td>➡️ Pipeline cố định</td><td>Dễ đoán, dễ test</td><td>Không thích ứng với phát hiện mới</td><td>Các bước biết trước (OCR → trích → kiểm tra)</td></tr>
  <tr><td>🕸️ Agent nói chuyện trực tiếp</td><td>Linh hoạt</td><td>Khó theo dõi, lỗi lan truyền khó kiểm soát</td><td>Hiếm khi là đáp án đúng trong đề</td></tr>
</table>
<h4>🧠 Coordinator làm 5 việc</h4>
<div class="dg dg-anim">
  <div class="dn"><span class="i">🧩</span><b>Phân rã</b>đủ mảng, không chồng lấn</div><span class="da">→</span>
  <div class="dn"><span class="i">🎯</span><b>Chọn</b>subagent theo độ phức tạp</div><span class="da">→</span>
  <div class="dn"><span class="i">📨</span><b>Truyền ngữ cảnh</b>tường minh</div><span class="da">→</span>
  <div class="dn"><span class="i">🧪</span><b>Đánh giá</b>kết quả, phát hiện lỗ hổng</div><span class="da">→</span>
  <div class="dn"><span class="i">🧵</span><b>Tổng hợp</b>+ ghi chú bao phủ</div>
</div>
<h4>🔄 Vòng tinh chỉnh của coordinator</h4>
<p>Coordinator tốt không chỉ “giao một lần rồi gộp”. Sau khi nhận bản tổng hợp, nó so với tiêu chí ban đầu: mảng nào thiếu bằng chứng, nhận định nào chỉ có một nguồn → ủy thác thêm có mục tiêu, rồi mới kết thúc.</p>
<h4>📏 Chọn subagent động</h4>
<ul>
  <li>“Thủ đô của Pháp?” → không cần cả pipeline 4 subagent; trả lời trực tiếp hoặc 1 subagent.</li>
  <li>Câu hỏi nghiên cứu rộng → nhiều subagent search song song + synth.</li>
  <li>Luôn chạy đủ pipeline cho mọi truy vấn: tốn chi phí, tăng độ trễ, không tăng chất lượng.</li>
</ul>
<h4>🔍 Truy nguyên lỗi báo cáo thiếu</h4>
<ol>
  <li>Xem danh sách tác vụ coordinator đã tạo (log các lệnh Task). Thiếu mảng ở đây → lỗi phân rã.</li>
  <li>Nếu đủ mảng: xem output từng subagent. Thiếu ở đây → lỗi prompt/công cụ subagent.</li>
  <li>Nếu subagent đủ mà báo cáo thiếu → lỗi bước tổng hợp (prompt synth không nhận đủ dữ liệu).</li>
</ol>`,
    traps: [
      {
        title: "Mọi subagent đều “xanh” mà báo cáo vẫn thiếu",
        level: "hard",
        scenario: "Chủ đề “Tác động của AI tới ngành sáng tạo”. Log: 3 subagent search (hội họa, thiết kế đồ họa, nhiếp ảnh) đều trả kết quả tốt, synth viết mạch lạc. Người đọc phàn nàn báo cáo không nhắc tới âm nhạc, văn học, điện ảnh.",
        bait: "Tăng số kết quả mỗi subagent search, hoặc đổi model mạnh hơn cho synth.",
        why: "Subagent chỉ làm đúng phần được giao. Ba mảng được giao đều thuộc nghệ thuật thị giác — lỗi nằm ở <b>bước phân rã</b> của coordinator.",
        fix: ["Sửa prompt coordinator: liệt kê các chiều cần bao phủ (loại hình sáng tạo, khía cạnh kinh tế/pháp lý…) trước khi giao.", "Thêm bước tự kiểm tra: “danh sách mảng có bao phủ đủ chủ đề không?”.", "Báo cáo cuối có phần ghi chú độ bao phủ."],
      },
      {
        title: "Subagent muốn hỏi subagent khác",
        scenario: "Subagent phân tích cần thêm nguồn. Một kỹ sư đề xuất cho subagent phân tích quyền gọi trực tiếp subagent search.",
        bait: "Cho các subagent gọi nhau để “linh hoạt”.",
        why: "Phá vỡ hub-and-spoke: mất điểm quan sát chung, lỗi lan truyền khó theo dõi, coordinator không biết phạm vi thực tế. (Trong Claude Code, subagent cũng không tự tạo subagent lồng nhau.)",
        fix: ["Subagent trả về yêu cầu có cấu trúc: “cần thêm nguồn về X vì Y”.", "Coordinator quyết định có ủy thác thêm hay không.", "Mọi giao tiếp đi qua coordinator."],
      },
    ],
    quiz: [
      {
        level: "hard",
        q: "Hệ thống nghiên cứu luôn chạy đủ 4 subagent (search, phân tích, kiểm chứng, tổng hợp) cho mọi câu hỏi, kể cả câu tra cứu đơn giản. Chi phí và độ trễ cao. Cải thiện phù hợp nhất?",
        options: ["Gộp 4 subagent thành một agent lớn", "Để coordinator chọn subagent động theo độ phức tạp của truy vấn", "Chuyển tất cả sang Batch API", "Bỏ subagent kiểm chứng"],
        answer: 1,
        explain: "Coordinator đánh giá truy vấn và chỉ kích hoạt những subagent cần thiết — giảm chi phí mà không hi sinh chất lượng ca phức tạp.",
        notes: ["Mất lợi ích cô lập ngữ cảnh và chuyên môn hóa.", "Đúng: định tuyến động.", "Người dùng đang chờ — Batch không phù hợp.", "Giảm chất lượng ở các ca phức tạp cần kiểm chứng."],
        trap: "Phương án D cũng giảm chi phí nhưng là cắt giảm mù quáng thay vì định tuyến theo nhu cầu.",
      },
    ],
  },

  /* ─────────────── 1-3 ─────────────── */
  "1-3": {
    widgets: ["subagentTrace", "contextPassing"],
    advanced: `
<h4>🧱 Giải phẫu AgentDefinition và lệnh Task</h4>
<table class="t">
  <tr><th>Trường</th><th>Nằm ở</th><th>Tác dụng</th></tr>
  <tr><td><code>description</code></td><td>AgentDefinition</td><td>Coordinator dùng để quyết định gọi subagent nào (như description của công cụ)</td></tr>
  <tr><td><code>prompt</code></td><td>AgentDefinition</td><td>System prompt của subagent</td></tr>
  <tr><td><code>tools</code></td><td>AgentDefinition</td><td>Công cụ subagent được dùng — giới hạn theo vai trò</td></tr>
  <tr><td><code>model</code></td><td>AgentDefinition</td><td>Model cho subagent (rẻ hơn cho việc đơn giản)</td></tr>
  <tr><td><code>subagent_type</code></td><td>input của Task</td><td>Chọn định nghĩa nào</td></tr>
  <tr><td><code>prompt</code></td><td>input của Task</td><td><b>Toàn bộ</b> thông tin nhiệm vụ subagent nhận được</td></tr>
</table>
<p>Trong Claude Code, subagent còn có thể khai báo bằng file Markdown trong <code>.claude/agents/</code> (frontmatter: name, description, tools, model). Ở một số phiên bản, công cụ Task có thể hiển thị dưới tên khác — đề thi dùng tên <b>Task</b>.</p>
<h4>📦 Định dạng truyền ngữ cảnh nên dùng</h4>
<pre><code>Mục tiêu: …
Tiêu chí hoàn thành: …
Dữ liệu đầu vào:
&lt;source id="S1" url="…" date="2025-09" title="…"&gt;
  trích đoạn …
&lt;/source&gt;
Định dạng trả về: JSON {findings:[{claim, source_id, quote}]}
Giới hạn: tối đa 8 phát hiện; không tìm nguồn mới.</code></pre>
<ul>
  <li>Thẻ XML tách <b>nội dung</b> khỏi <b>metadata</b> → subagent trích dẫn chính xác, synth giữ được nguồn.</li>
  <li>Chỉ đưa dữ liệu <b>đã chọn lọc</b> — dán cả transcript coordinator vào là lãng phí và gây nhiễu.</li>
</ul>
<h4>⚡ Song song hóa đúng cách</h4>
<ul>
  <li>Song song khi các nhiệm vụ <b>độc lập</b> (các mảng chủ đề khác nhau). Phụ thuộc dữ liệu (synth cần kết quả search) → tuần tự.</li>
  <li>Độ trễ song song ≈ subagent chậm nhất; tuần tự ≈ tổng.</li>
  <li>Coordinator chỉ nhận <b>kết quả cuối</b> của mỗi subagent — yêu cầu kết quả đó có cấu trúc, gọn.</li>
</ul>
<h4>🎯 Prompt cho coordinator: mục tiêu, không phải kịch bản</h4>
<p>“Bước 1 search A, bước 2 search B…” khiến hệ thống không thích ứng khi phát hiện mảng mới. Hãy nêu mục tiêu, tiêu chí chất lượng, ràng buộc (ngân sách, nguồn ưu tiên) và để coordinator tự phân rã.</p>`,
    traps: [
      {
        title: "Synth “bịa” nguồn",
        level: "hard",
        scenario: "Coordinator gửi cho synth: “Tổng hợp các phát hiện ở trên thành báo cáo có trích nguồn.” Báo cáo có trích dẫn nhưng nhiều URL không tồn tại.",
        bait: "Thêm vào prompt synth: “Chỉ dùng nguồn thật, không bịa”.",
        why: "“Ở trên” là ngữ cảnh của coordinator — synth không nhìn thấy. Nó không có dữ liệu nguồn nên phải tự tạo.",
        fix: ["Dán findings (kèm url/date) trực tiếp vào prompt Task của synth, bọc trong thẻ có cấu trúc.", "Yêu cầu synth chỉ trích dẫn theo <code>source_id</code> có trong input.", "Thêm bước kiểm tra: mọi url trong báo cáo phải thuộc tập nguồn đầu vào."],
      },
      {
        title: "Coordinator không tạo được subagent",
        scenario: "Đã khai báo <code>agents: {search, synth}</code> đầy đủ, nhưng coordinator chỉ tự làm mọi thứ, không bao giờ ủy thác.",
        bait: "Viết lại description của subagent cho “hấp dẫn” hơn.",
        why: "Coordinator gọi subagent qua công cụ Task. Nếu <code>allowedTools</code> không có \"Task\", nó không có công cụ để ủy thác.",
        fix: ["Thêm \"Task\" vào allowedTools của coordinator.", "Sau đó mới tối ưu description để coordinator chọn đúng subagent."],
      },
    ],
    quiz: [
      {
        level: "hard",
        q: "Subagent synth cần biết cả kết quả của search lẫn các bước trung gian search đã thử (truy vấn nào không ra kết quả). Thiết kế nào đúng?",
        options: ["Bật chia sẻ ngữ cảnh giữa các subagent", "Yêu cầu search trả về output có cấu trúc gồm findings và attempted_queries; coordinator chuyển cả hai vào prompt của synth", "Cho synth đọc transcript của search", "Cho synth quyền WebSearch để tự kiểm tra lại"],
        answer: 1,
        explain: "Coordinator chỉ nhận kết quả cuối của subagent. Muốn chuyển thông tin gì thì phải yêu cầu nó nằm trong kết quả cuối và truyền tường minh.",
        notes: ["Không có cơ chế chia sẻ ngữ cảnh tự động giữa subagent.", "Đúng: thiết kế output có cấu trúc + truyền tường minh.", "Phá vỡ cô lập; transcript dài, nhiều nhiễu.", "Synth đi tìm lại là lặp việc và ra ngoài vai trò."],
        trap: "Phương án A nghe như một tính năng có thật — nhưng cô lập ngữ cảnh là thiết kế có chủ đích.",
      },
    ],
  },

  /* ─────────────── 1-4 ─────────────── */
  "1-4": {
    widgets: ["refundGate", "enforcement"],
    advanced: `
<h4>🪜 Thang độ mạnh của cơ chế ép buộc</h4>
<div class="dg v dg-anim">
  <div class="dn"><b>📝 Chỉ dẫn trong prompt</b>xác suất — tốt cho hành vi mềm</div><span class="da">↓ mạnh hơn</span>
  <div class="dn"><b>🧪 Few-shot ví dụ</b>xác suất cao hơn với ca mơ hồ</div><span class="da">↓</span>
  <div class="dn"><b>🧰 Thiết kế công cụ</b>không cấp công cụ = không thể làm (process_refund chỉ cho agent được phép)</div><span class="da">↓</span>
  <div class="dn hot"><b>🛡️ Cổng kiểm tra trong code công cụ / hook</b>deterministic — kiểm tra điều kiện trước khi thực thi</div><span class="da">↓</span>
  <div class="dn good"><b>🔐 Hệ thống quyền bên ngoài</b>token, IAM, giới hạn ở API Billing — kể cả khi agent bị compromise</div>
</div>
<h4>🔑 Trạng thái xác minh phải sống ở server</h4>
<ul>
  <li>Đúng: backend ghi <code>verified_customer_id</code> khi <b>kết quả</b> get_customer khớp; gate đọc giá trị này.</li>
  <li>Sai: thêm tham số <code>verified: true</code> vào process_refund để Claude tự khai — model (hoặc prompt injection) có thể khai sai.</li>
  <li>Thông báo lỗi của gate nên chỉ <b>bước tiếp theo</b> (“gọi get_customer trước”) để Claude tự sửa thay vì thử lại vô ích.</li>
  <li>Hành động tiền tệ: dùng <b>idempotency key</b> (ví dụ id của tool_use) để retry không thực thi hai lần.</li>
</ul>
<h4>🤝 Mẫu bản bàn giao (handoff) cho người thật</h4>
<pre><code>{
  "customer_id": "C-88", "verified": true,
  "issue": "double_charge", "order_id": "8812",
  "facts": {"amount_each": 1250000, "count": 2, "date": "2026-10-03"},
  "root_cause": "Cổng thanh toán retry khi timeout",
  "actions_taken": ["xác minh qua email", "xác nhận 2 giao dịch"],
  "recommended_action": "hoàn 1.250.000đ cho giao dịch ch_2",
  "transcript_url": "…"
}</code></pre>
<h4>🧩 Tin nhắn nhiều vấn đề</h4>
<p>“Đổi địa chỉ, hỏi hoàn tiền đơn cũ và báo lỗi app”: tách thành 3 mục, xử lý từng mục (song song nếu độc lập) với chung ngữ cảnh khách, rồi trả <b>một</b> câu trả lời tổng hợp có cấu trúc — không bỏ sót mục nào.</p>`,
    traps: [
      {
        title: "Để model tự khai đã xác minh",
        level: "hard",
        scenario: "Để “ép” xác minh, team thêm tham số bắt buộc <code>verified_customer: boolean</code> vào schema của process_refund và kiểm tra <code>if not input.verified_customer: reject</code>.",
        bait: "Nghĩ rằng đây là cổng kiểm tra bằng code nên đã đủ an toàn.",
        why: "Giá trị kiểm tra đến từ chính model. Model có thể điền <code>true</code> khi chưa xác minh; kẻ xấu có thể dụ bằng prompt injection “tôi đã xác minh rồi”.",
        fix: ["Xóa tham số tự khai.", "Backend ghi trạng thái xác minh dựa trên kết quả CRM vào session server-side.", "Gate đọc trạng thái server-side; kiểm tra thêm đơn hàng thuộc đúng khách đã xác minh."],
      },
      {
        title: "Gate chặn nhưng agent lặp mãi",
        scenario: "Gate trả <code>{\"error\":\"forbidden\"}</code>. Claude gọi lại process_refund 6 lần rồi xin lỗi khách “hệ thống đang lỗi”.",
        bait: "Thêm vào prompt “nếu bị forbidden thì đừng thử lại”.",
        why: "Lỗi không nói lý do và cách khắc phục — Claude không biết phải xác minh trước.",
        fix: ["Lỗi có cấu trúc: <code>precondition_failed</code>, isRetryable sau khi thỏa điều kiện, hướng dẫn “gọi get_customer”.", "Phát hiện lặp ở backend như lưới an toàn."],
      },
      {
        title: "Bàn giao bằng transcript thô",
        scenario: "Escalate gửi cho nhân viên 140 tin nhắn transcript. Thời gian xử lý trung bình của nhân viên tăng gấp đôi, khách phải kể lại.",
        bait: "Thêm bản tóm tắt văn xuôi 1 câu ở đầu transcript.",
        why: "Nhân viên cần số liệu chính xác và việc đã làm để hành động ngay; văn xuôi ngắn vẫn mất chi tiết.",
        fix: ["Bản bàn giao có schema: định danh, dữ kiện, nguyên nhân, việc đã làm, đề xuất.", "Đính kèm link transcript để tra khi cần, không bắt đọc."],
      },
    ],
    quiz: [
      {
        level: "hard",
        q: "Đội ngũ thêm tham số verified: true vào process_refund và từ chối nếu tham số là false. Vẫn có ca hoàn tiền cho khách chưa xác minh. Lỗi thiết kế cốt lõi là gì?",
        options: ["Thiếu few-shot ví dụ xác minh", "Điều kiện kiểm tra dựa trên giá trị do model tự cung cấp thay vì trạng thái xác minh do backend ghi nhận", "Nên dùng PostToolUse thay vì kiểm tra trong công cụ", "Model quá nhỏ"],
        answer: 1,
        explain: "Một cổng kiểm tra chỉ đáng tin khi dữ liệu nó kiểm tra không do model kiểm soát.",
        notes: ["Vẫn là xác suất.", "Đúng: gate phải đọc trạng thái server-side.", "PostToolUse chạy sau khi tiền đã đi.", "Model lớn hơn vẫn có thể khai sai hoặc bị injection."],
        trap: "Phương án sai trông giống “ép buộc bằng code” nên dễ được coi là đủ.",
      },
    ],
  },

  /* ─────────────── 1-5 ─────────────── */
  "1-5": {
    advanced: `
<h4>🪝 Các sự kiện hook thường gặp</h4>
<table class="t">
  <tr><th>Sự kiện</th><th>Thời điểm</th><th>Dùng để</th></tr>
  <tr><td><code>PreToolUse</code></td><td>Trước khi công cụ chạy</td><td>Chặn (deny), cho phép (allow), hỏi (ask), sửa input (<code>updatedInput</code>)</td></tr>
  <tr><td><code>PostToolUse</code></td><td>Sau khi công cụ trả kết quả</td><td>Chuẩn hóa/bổ sung ngữ cảnh, ghi log, kiểm tra output</td></tr>
  <tr><td><code>UserPromptSubmit</code></td><td>Khi người dùng gửi prompt</td><td>Thêm ngữ cảnh, chặn prompt vi phạm</td></tr>
  <tr><td><code>Stop</code> / <code>SubagentStop</code></td><td>Khi agent/subagent định dừng</td><td>Kiểm tra điều kiện hoàn thành (ví dụ test phải pass)</td></tr>
  <tr><td><code>PreCompact</code>, <code>SessionStart</code>, <code>SessionEnd</code>, <code>Notification</code></td><td>Vòng đời phiên</td><td>Lưu trạng thái, nạp ngữ cảnh, thông báo</td></tr>
</table>
<h4>🎯 Matcher</h4>
<ul>
  <li>So với tên công cụ, phân biệt hoa thường. Chuỗi đơn giản khớp <b>chính xác</b>; có thể dùng regex: <code>Edit|Write</code>, <code>mcp__billing__.*</code>.</li>
  <li>Công cụ MCP mang tên đầy đủ <code>mcp__&lt;server&gt;__&lt;tool&gt;</code> — matcher <code>process_refund</code> sẽ <b>không</b> khớp <code>mcp__billing__process_refund</code>.</li>
</ul>
<h4>🔀 Hook trong Agent SDK và trong Claude Code</h4>
<table class="t">
  <tr><th></th><th>Agent SDK</th><th>Claude Code (settings.json)</th></tr>
  <tr><td>Hình thức</td><td>Hàm callback trong code</td><td>Lệnh shell (command) khai báo trong settings</td></tr>
  <tr><td>Đầu vào</td><td>Object input (hook_event_name, tool_name, tool_input…)</td><td>JSON qua stdin, cùng các trường</td></tr>
  <tr><td>Chặn</td><td>Trả <code>permissionDecision: "deny"</code> + lý do</td><td>Exit code 2 (stderr chuyển cho Claude) hoặc JSON quyết định trên stdout</td></tr>
</table>
<h4>⚖️ Hook vs kiểm tra trong công cụ vs quyền</h4>
<ul>
  <li><b>Kiểm tra trong code công cụ</b>: gắn chặt với một công cụ; tốt cho tiền điều kiện nghiệp vụ.</li>
  <li><b>Hook</b>: chính sách cắt ngang nhiều công cụ (giới hạn tiền cho mọi công cụ billing, chuẩn hóa ngày cho mọi server MCP), không phải sửa từng công cụ — đặc biệt với MCP server của bên thứ ba bạn không sửa được.</li>
  <li><b>Quyền (allow/deny list, permission mode)</b>: chặn cả công cụ, không xét tham số.</li>
</ul>
<h4>⏱️ Lưu ý vận hành</h4>
<ul><li>Hook chạy trên đường nóng của mỗi lần gọi công cụ → giữ nhanh, có timeout, xử lý lỗi của chính hook (hook lỗi không được làm sập agent).</li></ul>`,
    traps: [
      {
        title: "Hook không bao giờ chạy",
        level: "hard",
        scenario: "Team cấu hình <code>PreToolUse: [{matcher: \"process_refund\", hooks: [limit]}]</code>. Công cụ hoàn tiền đến từ MCP server <code>billing</code>. Hoàn $900 vẫn lọt qua; log không thấy hook được gọi.",
        bait: "Nghĩ hook có lỗi logic, sửa điều kiện <code>amount > 500</code>.",
        why: "Tên thực của công cụ là <code>mcp__billing__process_refund</code>. Matcher chuỗi đơn giản khớp chính xác nên không khớp.",
        fix: ["Dùng tên đầy đủ hoặc regex: <code>mcp__billing__process_refund</code> / <code>mcp__billing__.*</code>.", "Viết test: giả lập một lần gọi công cụ và khẳng định hook được kích hoạt.", "Log khi hook chạy để phát hiện sớm."],
      },
      {
        title: "Chặn bằng PostToolUse",
        scenario: "Kỹ sư đặt kiểm tra hạn mức trong PostToolUse: nếu amount > 500 thì trả lỗi cho Claude.",
        bait: "“Dù sao cũng chặn được Claude báo thành công cho khách.”",
        why: "PostToolUse chạy <b>sau</b> khi process_refund đã thực thi — tiền đã chuyển. Chặn hành động phải ở PreToolUse.",
        fix: ["Di chuyển kiểm tra sang PreToolUse với deny + lý do.", "PostToolUse chỉ dùng cho xử lý kết quả (chuẩn hóa, ghi log)."],
      },
    ],
    quiz: [
      {
        level: "hard",
        q: "Agent dùng 3 MCP server của bên thứ ba (không sửa được mã) trả về ngày theo 3 định dạng. Bạn cần mọi ngày tới Claude đều là ISO 8601. Cách tốt nhất?",
        options: ["Fork cả 3 server để sửa định dạng", "Hook PostToolUse với matcher mcp__.* chuẩn hóa ngày trong kết quả trước khi tới model", "Dặn Claude trong system prompt tự quy đổi", "Hook PreToolUse yêu cầu server trả ISO"],
        answer: 1,
        explain: "PostToolUse là điểm chặn cắt ngang mọi công cụ MCP, xử lý deterministic mà không cần sửa server.",
        notes: ["Tốn công bảo trì, phải theo dõi upstream.", "Đúng: một hook, mọi server.", "Chỉ cho tuân thủ xác suất.", "PreToolUse chạy trước khi có kết quả, không đổi được định dạng server trả."],
      },
    ],
  },

  /* ─────────────── 1-6 ─────────────── */
  "1-6": {
    widgets: ["decomposition", "sessionBranches"],
    advanced: `
<h4>🧩 Các mẫu phân rã thường gặp</h4>
<table class="t">
  <tr><th>Mẫu</th><th>Mô tả</th><th>Ví dụ</th></tr>
  <tr><td>Prompt chaining</td><td>Chuỗi bước cố định, output bước trước là input bước sau; có thể chèn kiểm tra giữa các bước</td><td>Trích xuất → kiểm tra → định dạng</td></tr>
  <tr><td>Orchestrator–workers (động)</td><td>Coordinator sinh tác vụ con theo phát hiện</td><td>Điều tra bug, nghiên cứu mở</td></tr>
  <tr><td>Song song hóa (sectioning)</td><td>Chia phần độc lập chạy đồng thời rồi gộp</td><td>Review từng file</td></tr>
  <tr><td>Evaluator–optimizer</td><td>Một bên sinh, một bên đánh giá theo tiêu chí, lặp lại</td><td>Viết lại tài liệu tới khi đạt rubric</td></tr>
</table>
<h4>🗂️ Review PR lớn: per-file + integration</h4>
<div class="dg dg-anim">
  <div class="dn"><span class="i">📄</span><b>Lượt per-file</b>mỗi file một ngữ cảnh tập trung</div><span class="da">→</span>
  <div class="dn"><span class="i">📋</span><b>Tóm tắt giao diện</b>hàm export, schema, giả định của từng file</div><span class="da">→</span>
  <div class="dn hot"><span class="i">🔗</span><b>Lượt tích hợp</b>luồng dữ liệu, hợp đồng giữa module</div>
</div>
<h4>🧭 Quản lý phiên trong Claude Code / SDK</h4>
<table class="t">
  <tr><th>Thao tác</th><th>Lệnh</th><th>Dùng khi</th></tr>
  <tr><td>Tiếp tục phiên gần nhất</td><td><code>claude --continue</code></td><td>Quay lại ngay việc vừa làm</td></tr>
  <tr><td>Tiếp tục phiên chỉ định</td><td><code>claude --resume &lt;id|tên&gt;</code></td><td>Điều tra dài nhiều ngày, code không đổi nhiều</td></tr>
  <tr><td>Rẽ nhánh</td><td><code>forkSession</code> khi resume (SDK)</td><td>Thử nhiều hướng từ cùng baseline</td></tr>
  <tr><td>Phiên mới + tóm tắt</td><td>phiên mới, dán summary</td><td>Code đã đổi, ngữ cảnh cũ lỗi thời hoặc quá đầy</td></tr>
</table>
<p>Dấu hiệu nên bỏ phiên cũ: nhiều file đã bị sửa từ lần đọc trước; Claude nhắc tới hàm/đường dẫn không còn tồn tại; ngữ cảnh gần đầy.</p>`,
    traps: [
      {
        title: "Resume sau đợt refactor lớn",
        level: "hard",
        scenario: "Thứ Hai bạn điều tra bug thanh toán trong phiên <code>pay-bug</code>. Thứ Tư đồng nghiệp tách <code>PaymentService</code> thành 3 file. Bạn <code>--resume pay-bug</code>, Claude tự tin đề xuất sửa dòng 142 của <code>PaymentService.ts</code> — file đó không còn tồn tại.",
        bait: "Tiếp tục hỏi trong phiên cũ và nhắc “file đã đổi rồi”.",
        why: "Ngữ cảnh chứa hàng chục kết quả Read/Grep lỗi thời. Một câu nhắc không xóa được chúng; Claude vẫn lập luận trên dữ liệu cũ.",
        fix: ["Yêu cầu phiên cũ (hoặc tự viết) bản tóm tắt phát hiện: giả thuyết, bằng chứng, việc đã loại trừ.", "Mở phiên mới, dán tóm tắt + danh sách file đã đổi (git diff --stat).", "Đọc lại code hiện tại trước khi kết luận."],
      },
      {
        title: "Dùng phân rã động cho pipeline cố định",
        scenario: "Pipeline trích xuất hóa đơn (OCR → trích → kiểm tổng) được chuyển sang coordinator “tự quyết bước tiếp theo”. Kết quả: thỉnh thoảng bỏ qua bước kiểm tổng.",
        bait: "Thêm vào prompt coordinator “nhớ luôn kiểm tổng”.",
        why: "Các bước đã biết trước và bắt buộc → prompt chaining cố định cho tính dự đoán được; linh hoạt ở đây chỉ thêm rủi ro.",
        fix: ["Trở về chuỗi cố định trong code.", "Dùng Claude cho từng bước, không cho việc điều phối các bước bắt buộc."],
      },
    ],
    quiz: [
      {
        level: "hard",
        q: "Bạn muốn so sánh hai hướng tối ưu (cache Redis vs cache in-memory) sau khi đã khảo sát kỹ codebase trong một phiên. Code không thay đổi. Cách hiệu quả nhất?",
        options: ["Mở hai phiên mới và khảo sát lại từ đầu", "Fork phiên khảo sát thành hai nhánh, mỗi nhánh thử một hướng", "Làm cả hai hướng tuần tự trong cùng một phiên", "Resume phiên và để Claude tự chọn hướng"],
        answer: 1,
        explain: "Fork giữ nguyên baseline khảo sát (vẫn còn đúng vì code không đổi) và cô lập hai hướng thử nghiệm.",
        notes: ["Lãng phí công khảo sát.", "Đúng.", "Hai hướng làm bẩn ngữ cảnh của nhau.", "Không so sánh được hai hướng độc lập."],
        trap: "Nếu đề nói code đã đổi nhiều thì đáp án sẽ chuyển sang “phiên mới + tóm tắt” — đọc kỹ điều kiện.",
      },
    ],
  },
});
