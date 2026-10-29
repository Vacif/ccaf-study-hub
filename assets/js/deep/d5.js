/* Nội dung chuyên sâu — Chương 5: Context Management & Reliability */
window.DEEP_ADD({
  /* ─────────────── 5-1 ─────────────── */
  "5-1": {
    widgets: ["contextAssembly", "contextWindow"],
    advanced: `
<h4>🧱 Bố cục ngữ cảnh khuyến nghị cho agent phiên dài</h4>
<div class="dg v dg-anim">
  <div class="dn"><b>⚙️ system + tools</b>tĩnh → đặt đầu, cache được</div>
  <div class="dn hot"><b>📌 &lt;case_facts&gt;</b>dữ kiện chính xác (số tiền, ngày, mã) — không bao giờ tóm tắt</div>
  <div class="dn"><b>🗜️ &lt;summary&gt;</b>các lượt cũ đã nén</div>
  <div class="dn"><b>💬 các lượt gần nhất</b>nguyên văn</div>
  <div class="dn"><b>🛠️ kết quả công cụ</b>đã cắt gọn về trường liên quan</div>
</div>
<h4>📉 Ba cơ chế làm mất thông tin</h4>
<table class="t">
  <tr><th>Cơ chế</th><th>Triệu chứng</th><th>Khắc phục</th></tr>
  <tr><td>Tóm tắt lũy tiến</td><td>“khách muốn hoàn tiền” thay vì “2 × 1.250.000đ ngày 03/10”</td><td>Khối case facts giữ nguyên văn</td></tr>
  <tr><td>Lost in the middle</td><td>Bỏ sót thông tin nằm giữa input dài</td><td>Đặt điều quan trọng ở đầu (hoặc cuối), dùng tiêu đề/thẻ rõ</td></tr>
  <tr><td>Nhiễu từ output công cụ</td><td>40 trường không liên quan đẩy dữ kiện ra xa</td><td>Cắt gọn trước khi nối vào lịch sử</td></tr>
</table>
<h4>🧰 Các công cụ giảm áp lực ngữ cảnh</h4>
<ul>
  <li><b>Cắt gọn tại nguồn</b>: công cụ trả trường cần thiết; hoặc lọc trong hook PostToolUse.</li>
  <li><b>Xóa kết quả công cụ cũ</b> đã dùng xong (giữ lại kết luận rút ra).</li>
  <li><b>Subagent</b> cho việc đọc nhiều; nhận về kết quả có cấu trúc kèm metadata (ngày, nguồn, phương pháp).</li>
  <li><b>Nén có định hướng</b>: khi tóm tắt, chỉ rõ cái gì phải giữ nguyên văn.</li>
</ul>
<p>Lưu ý: cửa sổ ngữ cảnh lớn hơn <b>không</b> sửa được thông tin đã bị tóm tắt mất, và cũng không loại bỏ hiệu ứng lost-in-the-middle.</p>`,
    traps: [
      {
        title: "“Cứ tăng context window”",
        level: "hard",
        scenario: "Agent hỗ trợ nhắc sai số tiền sau 50 lượt. Đề xuất: chuyển sang model có context 1 triệu token.",
        bait: "Nhiều chỗ hơn thì không phải tóm tắt nữa.",
        why: "Kiến trúc hiện tại vẫn tóm tắt theo ngưỡng; và ngữ cảnh dài hơn còn làm thông tin quan trọng dễ chìm hơn. Chi phí mỗi lượt cũng tăng.",
        fix: ["Trích dữ kiện vào case facts ngay khi xuất hiện, đặt đầu ngữ cảnh.", "Cắt gọn output công cụ.", "Giữ tóm tắt cho phần hội thoại ít quan trọng."],
      },
      {
        title: "Phát hiện quan trọng ở giữa báo cáo dài",
        scenario: "Subagent trả báo cáo 6.000 từ; phát hiện “lỗ hổng xác thực nghiêm trọng” nằm ở đoạn thứ 14. Coordinator tổng hợp không nhắc tới.",
        bait: "Yêu cầu coordinator “đọc kỹ toàn bộ”.",
        why: "Lost in the middle; định dạng văn xuôi dài không làm nổi bật mức độ quan trọng.",
        fix: ["Yêu cầu subagent trả cấu trúc: <code>key_findings</code> (xếp theo mức độ) ở đầu, chi tiết sau.", "Coordinator nhận phần tóm tắt có cấu trúc trước."],
      },
    ],
    quiz: [
      {
        level: "hard",
        q: "Công cụ lookup_order trả 45 trường, agent chỉ cần 5. Sau nhiều lần tra cứu, chất lượng trả lời giảm. Giải pháp phù hợp nhất ở tầng nào?",
        options: ["Prompt: “bỏ qua các trường không liên quan”", "Lọc kết quả về trường liên quan trước khi nối vào lịch sử (trong công cụ hoặc hook PostToolUse)", "Tóm tắt toàn bộ hội thoại sau mỗi lượt", "Tăng max_tokens"],
        answer: 1,
        explain: "Loại nhiễu trước khi nó vào ngữ cảnh — deterministic và tiết kiệm token mọi lượt sau.",
        notes: ["Nhiễu vẫn chiếm ngữ cảnh và chú ý.", "Đúng.", "Tóm tắt dày làm mất chi tiết khác.", "max_tokens là đầu ra."],
      },
    ],
  },

  /* ─────────────── 5-2 ─────────────── */
  "5-2": {
    widgets: ["handoffTrace", "escalation"],
    advanced: `
<h4>🚦 Tín hiệu escalate: đáng tin vs không đáng tin</h4>
<table class="t">
  <tr><th>✅ Đáng tin</th><th>❌ Không đáng tin</th></tr>
  <tr><td>Khách yêu cầu rõ gặp người thật</td><td>Điểm sentiment thấp</td></tr>
  <tr><td>Chính sách không quy định / có ngoại lệ cần thẩm quyền</td><td>Độ tự tin model tự báo</td></tr>
  <tr><td>Không thể tiến triển (công cụ lỗi liên tục, thiếu quyền)</td><td>Độ dài hội thoại</td></tr>
  <tr><td>Hành động vượt hạn mức đã định (tiền, rủi ro)</td><td>Khách dùng từ ngữ gay gắt</td></tr>
</table>
<h4>🧭 Cây quyết định</h4>
<div class="dg v dg-anim">
  <div class="dn"><b>Khách yêu cầu người thật?</b> → Có: chuyển ngay kèm bàn giao</div>
  <div class="dn"><b>Định danh mơ hồ (nhiều khách khớp)?</b> → Hỏi thêm thông tin định danh</div>
  <div class="dn"><b>Chính sách có quy định rõ?</b> → Không: escalate (khoảng trống chính sách)</div>
  <div class="dn"><b>Trong khả năng & thẩm quyền?</b> → Có: tự xử lý, ghi nhận cảm xúc</div>
  <div class="dn hot"><b>Đã thử mà không tiến triển?</b> → escalate kèm việc đã thử</div>
</div>
<h4>🤝 Chất lượng bàn giao</h4>
<ul>
  <li>Schema bàn giao bắt buộc: định danh, đã xác minh chưa, tóm tắt, dữ kiện, việc đã làm, đề xuất, link transcript.</li>
  <li>Báo khách: đã chuyển, mã ticket, thời gian chờ, không cần kể lại.</li>
  <li>Không “cố thêm một chút” khi khách đã yêu cầu người thật — làm giảm niềm tin.</li>
</ul>`,
    traps: [
      {
        title: "Escalate theo sentiment",
        level: "hard",
        scenario: "Hệ thống escalate khi sentiment &lt; 0.3. Hàng đợi nhân viên quá tải bởi khách bực vì giao trễ (việc agent tự xử lý được), trong khi các ca khoảng trống chính sách với khách lịch sự lại không được escalate.",
        bait: "Điều chỉnh ngưỡng sentiment xuống 0.2.",
        why: "Cảm xúc không tương quan với độ phức tạp của ca hay nhu cầu thẩm quyền.",
        fix: ["Bỏ sentiment khỏi điều kiện escalate.", "Dùng tín hiệu rõ: yêu cầu của khách, khoảng trống chính sách, không tiến triển, vượt hạn mức.", "Sentiment chỉ dùng để điều chỉnh giọng điệu."],
      },
      {
        title: "Đoán khách trong nhiều kết quả khớp",
        scenario: "get_customer(\"Nguyễn Văn A\") trả 3 tài khoản. Agent chọn tài khoản có đơn gần nhất và hủy đơn của người khác.",
        bait: "Thêm heuristic thông minh hơn (khớp thành phố, khớp số điện thoại một phần).",
        why: "Mọi heuristic đều có xác suất sai; thao tác trên tài khoản nhầm là lỗi nghiêm trọng.",
        fix: ["Nhiều kết quả → hỏi thêm định danh duy nhất (email, mã đơn).", "Công cụ thao tác chỉ nhận customer_id đã xác minh."],
      },
    ],
    quiz: [
      {
        level: "hard",
        q: "Khách lịch sự yêu cầu được bồi thường thêm vì đơn bị giao nhầm màu; chính sách chỉ nói về đổi trả, không nói về bồi thường. Model tự báo độ tự tin 0.95 rằng có thể tặng voucher 200.000đ. Agent nên?",
        options: ["Tặng voucher vì độ tự tin cao", "Xử lý phần đổi trả theo chính sách; với yêu cầu bồi thường (khoảng trống chính sách) thì escalate kèm tóm tắt", "Từ chối bồi thường vì chính sách không cho phép", "Hỏi khách muốn bao nhiêu"],
        answer: 1,
        explain: "Khoảng trống chính sách cần người có thẩm quyền; độ tự tin tự báo không thay được chính sách.",
        notes: ["Tự sáng tạo chính sách dựa trên tín hiệu không đáng tin.", "Đúng: làm phần rõ ràng, escalate phần mơ hồ.", "Chính sách không cấm — nó không quy định.", "Không giải quyết vấn đề thẩm quyền."],
        trap: "Con số 0.95 được đưa vào để lôi kéo chọn A.",
      },
    ],
  },

  /* ─────────────── 5-3 ─────────────── */
  "5-3": {
    widgets: ["errorPropTrace", "errorPropagation"],
    advanced: `
<h4>📦 Phong bì kết quả chuẩn cho subagent</h4>
<pre><code>{
  "status": "ok | partial | failed",
  "results": [...],
  "errors": [{
    "source": "journal-db", "type": "transient|permission|...",
    "attempted": "truy vấn / thao tác đã thử", "retries": 2,
    "alternatives": ["nguồn thay thế", "thử lại sau"]
  }],
  "coverage": {"news": "ok", "journal-db": "missing"}
}</code></pre>
<h4>🔀 Ai xử lý lỗi nào?</h4>
<table class="t">
  <tr><th>Tầng</th><th>Xử lý</th></tr>
  <tr><td>Công cụ</td><td>Phân loại lỗi, trả metadata</td></tr>
  <tr><td>Subagent</td><td>Retry transient có giới hạn; trả partial + lỗi có cấu trúc</td></tr>
  <tr><td>Coordinator</td><td>Quyết định: nguồn thay thế, ủy thác lại, chấp nhận thiếu</td></tr>
  <tr><td>Báo cáo cuối</td><td>Ghi chú độ bao phủ cho người đọc</td></tr>
</table>
<h4>🧯 Cơ chế bảo vệ</h4>
<ul>
  <li>Giới hạn retry + backoff; nguồn lỗi liên tục → tạm ngắt (circuit breaker) thay vì gọi mãi.</li>
  <li>Không để một lỗi đơn lẻ dừng toàn bộ workflow nếu kết quả một phần vẫn có giá trị.</li>
  <li>Không đánh dấu “success” khi có phần thiếu.</li>
</ul>`,
    traps: [
      {
        title: "Báo cáo “toàn diện” nhưng thiếu",
        level: "hard",
        scenario: "Subagent bắt mọi exception, trả <code>{status: \"success\", results: [...]}</code> với những gì có được. Báo cáo cuối khẳng định “dựa trên toàn bộ nguồn học thuật” — trong khi nguồn học thuật duy nhất đã timeout.",
        bait: "Thêm vào prompt synth: “nêu rõ hạn chế của nghiên cứu”.",
        why: "Synth không biết có hạn chế — thông tin lỗi đã bị nuốt ở subagent.",
        fix: ["Subagent trả <code>status: partial</code> + errors + coverage.", "Coordinator truyền coverage cho synth.", "Báo cáo có mục ghi chú độ bao phủ."],
      },
      {
        title: "Retry vô hạn",
        scenario: "Subagent retry nguồn lỗi không giới hạn “cho tới khi được”. Một job chạy 9 giờ và tốn chi phí lớn.",
        bait: "Tăng thời gian chờ giữa các lần retry.",
        why: "Lỗi có thể kéo dài (bảo trì) hoặc không phải transient.",
        fix: ["Ngân sách retry (ví dụ 2–3 lần, backoff).", "Hết ngân sách → báo lên coordinator với phương án thay thế."],
      },
    ],
    quiz: [
      {
        level: "hard",
        q: "Subagent kiểm chứng không truy cập được 2/10 nguồn do lỗi quyền (403). Nó nên làm gì?",
        options: ["Retry 10 lần với backoff", "Trả kết quả kiểm chứng của 8 nguồn, kèm lỗi có cấu trúc loại permission cho 2 nguồn (không retry) để coordinator quyết định", "Đánh dấu 2 nguồn là “không xác minh được” và trả success", "Hủy toàn bộ kiểm chứng"],
        answer: 1,
        explain: "Lỗi quyền không tự hết khi retry; báo lên với ngữ cảnh để coordinator chọn hướng (nguồn khác, escalate quyền).",
        notes: ["Retry vô ích với lỗi permission.", "Đúng.", "Che giấu lý do — coordinator không biết đây là vấn đề truy cập.", "Mất 8 kết quả tốt."],
      },
    ],
  },

  /* ─────────────── 5-4 ─────────────── */
  "5-4": {
    advanced: `
<h4>🩺 Dấu hiệu suy giảm ngữ cảnh</h4>
<ul>
  <li>Trả lời chung chung (“theo pattern phổ biến…”) thay vì tên class/hàm cụ thể.</li>
  <li>Hỏi lại điều đã được trả lời; đọc lại file đã đọc.</li>
  <li>Mâu thuẫn với phát hiện trước đó.</li>
</ul>
<h4>🧰 Bộ công cụ cho phiên khám phá dài</h4>
<table class="t">
  <tr><th>Công cụ</th><th>Cách dùng</th></tr>
  <tr><td>📝 Scratchpad file</td><td><code>NOTES.md</code>: phát hiện, đường dẫn, dòng, giả thuyết đã loại — đọc lại khi cần</td></tr>
  <tr><td>🔎 Subagent / Explore</td><td>Câu hỏi điều tra cụ thể; nhận kết quả gọn</td></tr>
  <tr><td>🗜️ <code>/compact [chỉ dẫn]</code></td><td>Nén hội thoại, có thể chỉ rõ cần giữ gì (“giữ danh sách file và giả thuyết”)</td></tr>
  <tr><td>🧹 <code>/clear</code></td><td>Bắt đầu sạch khi chuyển sang việc khác hẳn</td></tr>
  <tr><td>📌 CLAUDE.md</td><td>Kiến thức bền vững về codebase cho mọi phiên sau</td></tr>
</table>
<h4>🧭 Nhịp làm việc theo giai đoạn</h4>
<div class="dg dg-anim">
  <div class="dn"><b>Khám phá</b>qua subagent</div><span class="da">→</span><div class="dn"><b>Ghi scratchpad</b></div><span class="da">→</span><div class="dn hot"><b>Tóm tắt giai đoạn</b></div><span class="da">→</span><div class="dn"><b>/compact hoặc phiên mới</b></div><span class="da">→</span><div class="dn"><b>Giai đoạn tiếp</b></div>
</div>
<h4>💾 Manifest trạng thái cho hệ nhiều giai đoạn</h4>
<pre><code>{"phase": "analysis", "done": ["map_modules", "find_entrypoints"],
 "pending": ["trace_refund_flow"], "artifacts": ["notes/modules.md"],
 "updated_at": "2026-10-29T10:12:00Z"}</code></pre>
<p>Mỗi agent ghi manifest sau mỗi bước → coordinator khôi phục sau sự cố mà không làm lại từ đầu.</p>`,
    traps: [
      {
        title: "/compact làm mất phát hiện",
        level: "hard",
        scenario: "Sau 2 giờ khám phá, bạn chạy <code>/compact</code>. Bản nén chỉ còn “đã khảo sát module thanh toán”, mất danh sách 7 hàm và dòng code quan trọng.",
        bait: "Không dùng /compact nữa, chịu ngữ cảnh đầy.",
        why: "Nén là tóm tắt — chi tiết không được ghi lại ở đâu khác sẽ mất.",
        fix: ["Trước khi nén: ghi phát hiện chi tiết vào scratchpad file.", "Dùng <code>/compact</code> kèm chỉ dẫn những gì phải giữ.", "Sau nén: tham chiếu scratchpad khi cần chi tiết."],
      },
      {
        title: "Đọc cả codebase “cho chắc”",
        scenario: "Để hiểu luồng hoàn tiền trong repo 2.000 file, bạn yêu cầu Claude đọc mọi file trong <code>src/</code> trước.",
        bait: "Nhiều thông tin hơn thì hiểu tốt hơn.",
        why: "Ngữ cảnh đầy nhiễu trước khi bắt đầu câu hỏi thật.",
        fix: ["Grep điểm vào (refund), lần theo luồng gọi.", "Giao subagent: “lần dấu luồng hoàn tiền, trả danh sách hàm và file”."],
      },
    ],
    quiz: [
      {
        level: "hard",
        q: "Hệ thống phân tích nhiều giai đoạn đôi khi bị dừng giữa chừng (container bị thu hồi) và phải chạy lại từ đầu mất 3 giờ. Cải thiện tốt nhất?",
        options: ["Tăng tài nguyên container", "Mỗi agent ghi manifest trạng thái (đã xong, đang chờ, artifact) sau mỗi bước để coordinator khôi phục", "Chạy toàn bộ trong một agent", "Giảm số giai đoạn"],
        answer: 1,
        explain: "Trạng thái bền vững bên ngoài ngữ cảnh cho phép tiếp tục từ điểm dừng.",
        notes: ["Giảm tần suất, không giải quyết khôi phục.", "Đúng.", "Một agent càng dễ đầy ngữ cảnh, vẫn mất khi dừng.", "Không giải quyết vấn đề."],
      },
    ],
  },

  /* ─────────────── 5-5 ─────────────── */
  "5-5": {
    advanced: `
<h4>📊 Đo theo phân nhóm</h4>
<table class="t">
  <tr><th>Chiều phân nhóm</th><th>Ví dụ</th></tr>
  <tr><td>Loại tài liệu</td><td>Hóa đơn chuẩn, viết tay, hợp đồng, biên lai</td></tr>
  <tr><td>Trường</td><td>Tổng tiền 99%, mã số thuế 88%, ngày 97%</td></tr>
  <tr><td>Nguồn / định dạng</td><td>PDF gốc vs ảnh chụp</td></tr>
  <tr><td>Thời gian</td><td>Tháng này vs tháng trước (trôi dạt dữ liệu)</td></tr>
</table>
<h4>🎯 Lấy mẫu phân tầng</h4>
<p>Lấy mẫu ngẫu nhiên đơn giản 200 tài liệu sẽ chỉ có ~3 hóa đơn viết tay (1,5%) — không đủ để đo. Phân tầng: lấy cỡ mẫu đủ cho <b>mỗi</b> nhóm (kể cả nhóm hiếm), và vẫn lấy mẫu cả trích xuất có độ tin cậy cao để phát hiện lỗi “tự tin nhưng sai”.</p>
<h4>📐 Hiệu chỉnh độ tin cậy</h4>
<div class="dg dg-anim">
  <div class="dn"><b>Tập có nhãn</b>kết quả đúng/sai thật</div><span class="da">→</span>
  <div class="dn"><b>So sánh</b>confidence dự đoán vs tỷ lệ đúng thực tế theo từng khoảng</div><span class="da">→</span>
  <div class="dn hot"><b>Đặt ngưỡng theo trường</b>tự động / duyệt tay</div><span class="da">→</span>
  <div class="dn"><b>Theo dõi liên tục</b>trôi dạt → hiệu chỉnh lại</div>
</div>
<p>Ví dụ: trong khoảng confidence 0.9–1.0, nếu chỉ 80% thực sự đúng thì con số 0.9 đang “tự tin quá mức” — ngưỡng phải nâng hoặc nhóm đó phải duyệt tay.</p>`,
    traps: [
      {
        title: "Bỏ người duyệt vì 97%",
        level: "hard",
        scenario: "Pipeline đạt 97% tổng thể. Quản lý muốn bỏ 100% người duyệt. Hóa đơn viết tay (1,5% khối lượng) có độ chính xác 61% nhưng không ai biết.",
        bait: "97% vượt mục tiêu 95% → bỏ duyệt.",
        why: "Con số tổng bị chi phối bởi nhóm lớn; nhóm nhỏ kém bị che.",
        fix: ["Báo cáo độ chính xác theo loại tài liệu và trường.", "Giảm duyệt dần cho nhóm đã chứng minh tốt; giữ duyệt cho nhóm kém.", "Duy trì lấy mẫu phân tầng định kỳ."],
      },
      {
        title: "Tin confidence thô",
        scenario: "Định tuyến: confidence ≥ 0.9 thì tự động. Kiểm tra mẫu thấy nhóm này vẫn sai 12% ở trường mã số thuế.",
        bait: "Nâng ngưỡng lên 0.99 cho mọi trường.",
        why: "Confidence chưa hiệu chỉnh và mỗi trường có đặc tính khác nhau.",
        fix: ["Hiệu chỉnh theo từng trường trên tập có nhãn.", "Ngưỡng riêng theo trường; trường rủi ro cao có thể luôn duyệt."],
      },
    ],
    quiz: [
      {
        level: "hard",
        q: "Bạn có ngân sách duyệt tay 300 tài liệu/tuần để giám sát chất lượng; 2% khối lượng là hợp đồng nước ngoài (độ chính xác chưa rõ). Cách lấy mẫu tốt nhất?",
        options: ["Ngẫu nhiên đơn giản 300 tài liệu", "Phân tầng theo loại tài liệu, đảm bảo đủ mẫu cho hợp đồng nước ngoài, và lấy cả mẫu từ trích xuất có độ tin cậy cao", "Chỉ duyệt các trích xuất có độ tin cậy thấp", "Duyệt 300 tài liệu mới nhất"],
        answer: 1,
        explain: "Phân tầng đảm bảo nhóm hiếm có đủ mẫu; lấy mẫu cả nhóm tin cậy cao để phát hiện lỗi tự tin.",
        notes: ["Chỉ ~6 hợp đồng nước ngoài — quá ít để kết luận.", "Đúng.", "Bỏ sót lỗi “tự tin nhưng sai”.", "Thiên lệch theo thời gian, không đại diện."],
      },
    ],
  },

  /* ─────────────── 5-6 ─────────────── */
  "5-6": {
    advanced: `
<h4>🔗 Giữ liên kết claim–nguồn xuyên suốt pipeline</h4>
<div class="dg dg-anim">
  <div class="dn"><span class="i">🔎</span><b>Search</b>trả {claim, quote, url, date}</div><span class="da">→</span>
  <div class="dn"><span class="i">🧪</span><b>Analyze</b>giữ source_id cho mọi nhận định</div><span class="da">→</span>
  <div class="dn"><span class="i">📝</span><b>Synth</b>chỉ trích theo source_id có sẵn</div><span class="da">→</span>
  <div class="dn good"><span class="i">✅</span><b>Kiểm tra</b>mọi trích dẫn thuộc tập nguồn</div>
</div>
<h4>🧾 Schema claim</h4>
<pre><code>{"claim": "Tỷ lệ DN áp dụng AI", "value": "34%",
 "source_id": "S3", "quote": "…34% of surveyed SMEs…",
 "published": "2024-06", "method": "khảo sát 1.000 DN nhỏ",
 "status": "established | contested"}</code></pre>
<h4>⚔️ Xử lý số liệu mâu thuẫn</h4>
<table class="t">
  <tr><th>Tình huống</th><th>Cách trình bày</th></tr>
  <tr><td>Khác thời điểm</td><td>Nêu cả hai kèm ngày — có thể là xu hướng, không phải mâu thuẫn</td></tr>
  <tr><td>Khác phương pháp/phạm vi</td><td>Nêu cả hai, giải thích khác biệt mẫu</td></tr>
  <tr><td>Mâu thuẫn thật</td><td>Đánh dấu “còn tranh cãi”, không tự chọn hay lấy trung bình</td></tr>
</table>
<h4>🖼️ Định dạng theo nội dung</h4>
<p>Số liệu so sánh → bảng có cột nguồn/ngày; diễn giải nguyên nhân → văn xuôi có trích dẫn; phát hiện đã xác lập và còn tranh cãi → tách mục riêng.</p>`,
    traps: [
      {
        title: "Lấy trung bình hai nguồn",
        level: "hard",
        scenario: "Nguồn A (2024, DN nhỏ): 34%. Nguồn B (2025, DN lớn): 52%. Synth viết “khoảng 43% doanh nghiệp đã áp dụng AI”.",
        bait: "Trung bình nghe khách quan.",
        why: "Con số 43% không do nguồn nào đưa ra, gộp hai tổng thể khác nhau và che khác biệt thời gian.",
        fix: ["Trình bày cả hai giá trị với nguồn, ngày, phạm vi khảo sát.", "Giải thích khác biệt (quy mô DN, thời điểm).", "Không tạo số liệu mới không có nguồn."],
      },
      {
        title: "Trích dẫn rơi mất ở bước tóm tắt",
        scenario: "Subagent search có url đầy đủ, nhưng báo cáo cuối chỉ có “theo các nghiên cứu gần đây”.",
        bait: "Yêu cầu synth “thêm nguồn vào cuối báo cáo”.",
        why: "Synth chỉ nhận văn xuôi đã tóm tắt từ coordinator, không còn mapping claim–nguồn.",
        fix: ["Truyền dữ liệu có cấu trúc (claim + source_id + url + date) xuyên suốt.", "Synth bắt buộc gắn source_id cho mọi nhận định."],
      },
    ],
    quiz: [
      {
        level: "hard",
        q: "Hai nguồn uy tín cho tốc độ tăng trưởng thị trường 2025 là 12% và 19%; nguồn 12% công bố tháng 1, nguồn 19% công bố tháng 11 với dữ liệu cả năm. Synth nên trình bày thế nào?",
        options: ["Chọn 19% vì mới hơn", "Nêu cả hai, ghi ngày công bố và phạm vi dữ liệu (dự báo đầu năm vs số liệu cả năm), giải thích khác biệt", "Lấy trung bình 15,5%", "Bỏ số liệu vì mâu thuẫn"],
        answer: 1,
        explain: "Metadata thời gian giải thích khác biệt; người đọc tự đánh giá được.",
        notes: ["Mất thông tin, không minh bạch lý do chọn.", "Đúng.", "Tạo số liệu không nguồn nào nêu.", "Mất thông tin hữu ích."],
        trap: "“Mới hơn thì đúng hơn” nghe hợp lý nhưng đề kiểm tra tính minh bạch nguồn gốc.",
      },
    ],
  },
});
