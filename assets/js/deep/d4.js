/* Nội dung chuyên sâu — Chương 4: Prompt Engineering & Structured Output */
window.DEEP_ADD({
  /* ─────────────── 4-1 ─────────────── */
  "4-1": {
    advanced: `
<h4>🎯 Precision vs recall trong review tự động</h4>
<table class="t">
  <tr><th></th><th>Precision thấp (nhiều báo sai)</th><th>Recall thấp (bỏ sót)</th></tr>
  <tr><td>Hậu quả</td><td>Dev mất niềm tin, phớt lờ cả phát hiện đúng</td><td>Lỗi lọt qua</td></tr>
  <tr><td>Đòn bẩy</td><td>Tiêu chí “báo khi…”, “bỏ qua…”, yêu cầu bằng chứng</td><td>Mở rộng hạng mục, lượt chuyên biệt</td></tr>
</table>
<p>Với bot review, precision thường quan trọng hơn ở giai đoạn đầu: một bot ít comment nhưng đúng được đọc; bot nhiều comment bị tắt.</p>
<h4>🧱 Khung tiêu chí rõ ràng</h4>
<pre><code>&lt;report_when&gt;
- Input người dùng tới SQL/shell/HTML không qua tham số hóa/escape
- Comment mô tả SAI hành vi thực tế của code (trích cả hai)
- Lỗi không được xử lý ở ranh giới I/O (mạng, file, DB)
&lt;/report_when&gt;
&lt;do_not_report&gt;
- Đặt tên, định dạng, thứ tự import, sở thích style
- Đề xuất refactor không sửa lỗi cụ thể
&lt;/do_not_report&gt;
&lt;severity&gt;
CRITICAL: khai thác từ xa được. Ví dụ: query = "…" + req.query.id
HIGH: mất/sai dữ liệu trong luồng chính. Ví dụ: …
&lt;/severity&gt;
Mỗi phát hiện PHẢI kèm dòng code trích nguyên văn.</code></pre>
<h4>📏 Đo trước khi chỉnh</h4>
<ul>
  <li>Theo dõi tỷ lệ báo sai theo <b>từng hạng mục</b> (dev đánh dấu “không hữu ích”).</li>
  <li>Hạng mục nhiễu → tạm tắt, tinh chỉnh tiêu chí và ví dụ, bật lại khi đạt ngưỡng.</li>
  <li>Yêu cầu bằng chứng (trích dòng) làm giảm phát hiện “tưởng tượng”.</li>
</ul>`,
    traps: [
      {
        title: "“Chỉ báo khi chắc chắn”",
        level: "hard",
        scenario: "Bot báo 20 comment/PR, phần lớn là style. PM đề xuất thêm câu “Chỉ báo những vấn đề bạn rất chắc chắn là quan trọng”.",
        bait: "Thêm câu đó vì nó ngắn gọn và trực tiếp.",
        why: "Model không biết “quan trọng” với team bạn là gì; mức độ “chắc chắn” do model tự đánh giá không được hiệu chỉnh. Kết quả thường dao động.",
        fix: ["Liệt kê cụ thể hạng mục cần báo và hạng mục bỏ qua.", "Định nghĩa mức độ nghiêm trọng kèm ví dụ code.", "Tạm tắt hạng mục style trong lúc chỉnh."],
      },
      {
        title: "Lọc bằng confidence model tự báo",
        scenario: "Team yêu cầu model ghi <code>confidence</code> và chỉ đăng comment có confidence > 0.9. Lỗi bảo mật thật đôi khi có 0.7 nên bị lọc.",
        bait: "Hạ ngưỡng xuống 0.7.",
        why: "Confidence chưa hiệu chỉnh không tương quan ổn định với độ đúng; chỉnh ngưỡng mù quáng chỉ dịch chuyển vấn đề.",
        fix: ["Dùng tiêu chí rõ ràng để giảm báo sai từ gốc.", "Nếu dùng confidence, hiệu chỉnh bằng tập có nhãn và dùng để <b>định tuyến</b> (sang người duyệt), không âm thầm xóa."],
      },
    ],
    quiz: [
      {
        level: "hard",
        q: "Bot review có 3 hạng mục: bảo mật (báo sai 5%), hiệu năng (10%), comment lỗi thời (60%). Dev bắt đầu bỏ qua bot. Bước đầu tiên tốt nhất?",
        options: ["Thêm “hãy thận trọng” vào prompt chung", "Tạm tắt hạng mục comment lỗi thời và viết lại tiêu chí cụ thể cho nó (ví dụ: chỉ báo khi comment mô tả sai hành vi thực tế) trước khi bật lại", "Tắt toàn bộ bot", "Tăng số ví dụ cho hạng mục bảo mật"],
        answer: 1,
        explain: "Xử lý đúng nguồn nhiễu, giữ các hạng mục đang có giá trị, khôi phục niềm tin.",
        notes: ["Mơ hồ, không nhắm vào hạng mục gây nhiễu.", "Đúng.", "Mất cả hạng mục bảo mật đang tốt.", "Hạng mục bảo mật không phải vấn đề."],
      },
    ],
  },

  /* ─────────────── 4-2 ─────────────── */
  "4-2": {
    advanced: `
<h4>📍 Đặt ví dụ ở đâu trong request?</h4>
<pre><code>system: "Bạn phân loại ticket hỗ trợ…
&lt;examples&gt;
  &lt;example&gt;
    &lt;ticket&gt;Bị trừ tiền 2 lần sau khi app báo lỗi&lt;/ticket&gt;
    &lt;label&gt;billing&lt;/label&gt;&lt;secondary&gt;bug&lt;/secondary&gt;
    &lt;why&gt;Khách bị ảnh hưởng tài chính → billing là chính; lỗi app là phụ.&lt;/why&gt;
  &lt;/example&gt;
  …
&lt;/examples&gt;"
messages: [{role: "user", content: "&lt;ticket&gt;…ticket mới…&lt;/ticket&gt;"}]</code></pre>
<ul>
  <li>Bọc trong thẻ <code>&lt;example&gt;</code> để model tách ví dụ khỏi dữ liệu thật.</li>
  <li>Kèm <code>&lt;why&gt;</code>: model học <b>quy tắc quyết định</b>, không chỉ học nhãn.</li>
  <li>Có thể dùng cặp lượt user/assistant giả lập khi muốn mô phỏng đúng định dạng hội thoại.</li>
</ul>
<h4>🎨 Chọn ví dụ</h4>
<table class="t">
  <tr><th>Nên</th><th>Tránh</th></tr>
  <tr><td>2–4 ví dụ nhắm vào ca <b>mơ hồ</b>, ranh giới giữa các nhãn</td><td>Nhiều ví dụ dễ, giống nhau</td></tr>
  <tr><td>Đa dạng về hình thức (ngắn/dài, có/không định dạng)</td><td>Ví dụ cùng chủ đề → model bắt chước nội dung bề mặt</td></tr>
  <tr><td>Cả ví dụ “nên báo” lẫn “chấp nhận được”</td><td>Chỉ ví dụ tích cực → báo quá tay</td></tr>
  <tr><td>Nhất quán với chỉ dẫn</td><td>Ví dụ mâu thuẫn với quy tắc đã viết</td></tr>
</table>
<h4>🧪 Few-shot cho trích xuất</h4>
<p>Tài liệu có nhiều cấu trúc (trích dẫn inline vs danh mục tham khảo cuối bài; bảng vs đoạn văn): mỗi cấu trúc một ví dụ ngắn cho thấy chỗ cần lấy dữ liệu và khi nào trả <code>null</code> → giảm bịa.</p>`,
    traps: [
      {
        title: "Ví dụ quá giống nhau",
        level: "hard",
        scenario: "4 ví dụ trích xuất đều là hóa đơn của cùng một nhà cung cấp, mẫu in giống nhau. Với hóa đơn mẫu khác, model điền tên nhà cung cấp cũ vào trường vendor.",
        bait: "Thêm 10 ví dụ nữa từ cùng nhà cung cấp cho “chắc”.",
        why: "Ví dụ đồng dạng dạy model sao chép đặc điểm bề mặt thay vì quy tắc.",
        fix: ["Đa dạng hóa: các bố cục, ngôn ngữ, ca thiếu trường.", "Thêm một ví dụ có trường vắng mặt → null.", "Ghi <code>why</code> giải thích vị trí lấy dữ liệu."],
      },
      {
        title: "Ví dụ mâu thuẫn chỉ dẫn",
        scenario: "Chỉ dẫn: “ticket vừa billing vừa bug → nhãn chính billing”. Một ví dụ cũ lại gán bug cho ca tương tự. Kết quả dao động.",
        bait: "Viết HOA chỉ dẫn.",
        why: "Ví dụ thường có sức nặng lớn; mâu thuẫn tạo hai tín hiệu đối nghịch.",
        fix: ["Rà toàn bộ ví dụ cho nhất quán với quy tắc.", "Coi ví dụ là một phần đặc tả, review như code."],
      },
    ],
    quiz: [
      {
        level: "hard",
        q: "Model phân loại tốt ca rõ ràng nhưng dao động ở ca nằm giữa hai nhãn. Bạn có ngân sách cho 4 ví dụ. Chọn bộ ví dụ nào?",
        options: ["4 ca rõ ràng nhất của mỗi nhãn", "4 ca ranh giới giữa các nhãn, mỗi ca kèm lý do chọn nhãn", "4 ca ngẫu nhiên từ log", "4 ca dài nhất"],
        answer: 1,
        explain: "Ví dụ có giá trị nhất là ở chỗ model đang sai; lý do giúp khái quát quy tắc.",
        notes: ["Model đã làm tốt ca rõ ràng.", "Đúng.", "Phần lớn sẽ là ca dễ.", "Độ dài không liên quan tới ranh giới quyết định."],
      },
    ],
  },

  /* ─────────────── 4-3 ─────────────── */
  "4-3": {
    widgets: ["extractionTrace", "schemaDemo"],
    advanced: `
<h4>🧪 Schema đảm bảo gì, không đảm bảo gì</h4>
<table class="t">
  <tr><th>Đảm bảo (cấu trúc)</th><th>Không đảm bảo (ngữ nghĩa)</th></tr>
  <tr><td>JSON hợp lệ, đúng kiểu, có trường bắt buộc, giá trị trong enum</td><td>Giá trị đúng với tài liệu, tổng khớp, ngày hợp lý, đúng trường</td></tr>
</table>
<p>API còn có chế độ <b>structured outputs / strict</b> (ràng buộc giải mã theo schema) giúp đảm bảo tuân thủ schema chặt hơn — đối chiếu tài liệu hiện hành. Dù vậy, kiểm tra ngữ nghĩa vẫn là việc của code bạn.</p>
<h4>🧩 Mẫu thiết kế schema</h4>
<table class="t">
  <tr><th>Mẫu</th><th>Ví dụ</th><th>Chống lỗi gì</th></tr>
  <tr><td>Nullable cho trường có thể vắng</td><td><code>"renewal_date": {"type": ["string","null"]}</code></td><td>Bịa giá trị</td></tr>
  <tr><td>enum + "other" + detail</td><td><code>service_type: other</code>, <code>service_detail: "tư vấn pháp lý"</code></td><td>Ép sai danh mục</td></tr>
  <tr><td>Giá trị “unclear”</td><td><code>status: "unclear"</code></td><td>Đoán khi tài liệu mơ hồ</td></tr>
  <tr><td>Trường bằng chứng</td><td><code>evidence_quote</code></td><td>Giá trị không có nguồn</td></tr>
  <tr><td>Tự đối chiếu</td><td><code>stated_total</code> + <code>line_items</code></td><td>Sót dòng, tổng sai</td></tr>
  <tr><td>Mô tả trong schema</td><td><code>"description": "YYYY-MM-DD"</code></td><td>Định dạng không đồng nhất</td></tr>
</table>
<h4>⚙️ Pipeline đầy đủ</h4>
<div class="dg dg-anim">
  <div class="dn"><b>Tool + schema</b></div><span class="da">→</span><div class="dn"><b>tool_choice ép</b></div><span class="da">→</span><div class="dn"><b>Lấy tool_use.input</b></div><span class="da">→</span><div class="dn hot"><b>Validator ngữ nghĩa</b></div><span class="da">→</span><div class="dn good"><b>Lưu / retry / duyệt tay</b></div>
</div>`,
    traps: [
      {
        title: "Ngày gia hạn “trông hợp lý”",
        level: "hard",
        scenario: "Pipeline hợp đồng có <code>renewal_date</code> required, kiểu string. Hợp đồng không gia hạn được trích thành ngày kết thúc + 1 năm. Validator không bắt vì định dạng đúng và ngày hợp lý.",
        bait: "Thêm vào prompt “không được bịa”.",
        why: "Schema buộc model phải điền một chuỗi; không có cách hợp lệ để nói “không có”.",
        fix: ["Đổi sang <code>[\"string\",\"null\"]</code> với mô tả “null nếu không có điều khoản gia hạn”.", "Thêm <code>evidence_quote</code> bắt buộc khi có giá trị; validator kiểm tra trích đoạn có trong nguồn."],
      },
      {
        title: "Tin rằng JSON hợp lệ là dữ liệu đúng",
        scenario: "Sau khi chuyển sang tool_use + schema, tỷ lệ lỗi parse về 0. Team bỏ bước kiểm tra tổng tiền. Một tháng sau phát hiện 3% hóa đơn sai tổng.",
        bait: "Kết luận schema đã giải quyết chất lượng.",
        why: "Schema loại lỗi cú pháp, không loại lỗi ngữ nghĩa.",
        fix: ["Giữ validator ngữ nghĩa: tổng dòng = tổng ghi, ngày hợp lệ, tham chiếu chéo.", "Lỗi ngữ nghĩa → retry kèm lỗi cụ thể (4-4) hoặc duyệt tay."],
      },
    ],
    quiz: [
      {
        level: "hard",
        q: "Trích xuất loại dịch vụ với enum [it, marketing]. Hợp đồng tư vấn pháp lý bị gán \"it\". Sửa schema thế nào tốt nhất?",
        options: ["Thêm \"legal\" vào enum", "Thêm \"other\" vào enum kèm trường service_detail (nullable) để mô tả", "Bỏ enum, cho string tự do", "Đặt service_type nullable"],
        answer: 1,
        explain: "Danh mục mở rộng được cần lối thoát “other” + chi tiết; vẫn giữ được giá trị chuẩn cho phân tích.",
        notes: ["Sửa một ca, ca mới khác vẫn bị ép sai.", "Đúng.", "Mất chuẩn hóa, khó thống kê.", "Mất thông tin — loại dịch vụ có tồn tại, chỉ không nằm trong danh sách."],
        trap: "A giải quyết đúng ca trước mắt nên rất hấp dẫn, nhưng không bền.",
      },
    ],
  },

  /* ─────────────── 4-4 ─────────────── */
  "4-4": {
    advanced: `
<h4>🔁 Retry kèm phản hồi = hội thoại nhiều lượt</h4>
<pre><code>messages = [
  {"role": "user", "content": "&lt;document&gt;…&lt;/document&gt;"},
  {"role": "assistant", "content": [tool_use(extract_invoice, input=bản_lỗi)]},
  {"role": "user", "content": [{
     "type": "tool_result", "tool_use_id": "…", "is_error": true,
     "content": "Lỗi kiểm tra:\\n- invoice_date phải YYYY-MM-DD\\n- tổng dòng 1140 ≠ 1240"
  }]}
]</code></pre>
<p>Model thấy: nguồn, câu trả lời cũ của chính nó, và lỗi cụ thể → sửa có mục tiêu thay vì sinh lại ngẫu nhiên.</p>
<h4>🧭 Retry có ích hay vô ích?</h4>
<table class="t">
  <tr><th>Loại lỗi</th><th>Retry kèm phản hồi</th></tr>
  <tr><td>Sai định dạng (ngày, số)</td><td>✅ Hiệu quả</td></tr>
  <tr><td>Đặt sai trường (ngày giao vào ngày hóa đơn)</td><td>✅ Hiệu quả</td></tr>
  <tr><td>Sót dòng / tổng lệch</td><td>✅ Thường hiệu quả</td></tr>
  <tr><td>Thông tin không có trong nguồn</td><td>❌ Vô ích — retry chỉ tăng nguy cơ bịa</td></tr>
  <tr><td>Nguồn mờ/hỏng (scan kém)</td><td>❌ Cần nguồn tốt hơn hoặc người duyệt</td></tr>
</table>
<h4>🧰 Thiết kế vòng lặp</h4>
<ul>
  <li>Ngân sách retry nhỏ (1–2 lần); hết ngân sách → hàng đợi người duyệt kèm lỗi cuối.</li>
  <li>Trước khi retry trường thiếu: kiểm tra nhanh nguồn có chứa dấu hiệu của trường đó không.</li>
  <li>Ghi <code>detected_pattern</code> (ví dụ “hóa đơn 2 trang”, “bảng không viền”) để thống kê cấu trúc nào hay lỗi và cải thiện prompt có mục tiêu.</li>
</ul>`,
    traps: [
      {
        title: "Tăng số lần retry",
        level: "hard",
        scenario: "8% hóa đơn thiếu <code>po_number</code> sau 3 lần retry. Đề xuất: tăng lên 10 lần. Sau thay đổi, tỷ lệ thiếu giảm còn 1% — nhưng kiểm tra mẫu cho thấy nhiều số PO là bịa.",
        bait: "Ăn mừng vì chỉ số thiếu giảm.",
        why: "Phần lớn hóa đơn đó không ghi số PO. Áp lực retry khiến model điền chuỗi “hợp lệ” cho xong.",
        fix: ["Kiểm tra nguồn trước khi retry trường thiếu.", "Nguồn không có → null + cờ <code>missing_in_source</code> → người duyệt / tra hệ thống mua hàng.", "Theo dõi chất lượng bằng lấy mẫu kiểm tra, không chỉ tỷ lệ điền đủ."],
      },
      {
        title: "Retry mù",
        scenario: "Validator lỗi → pipeline gửi lại đúng request ban đầu (không kèm gì).",
        bait: "“Thử lại có thể ra kết quả khác.”",
        why: "Model không biết đã sai ở đâu; kết quả mới có thể sai theo cách khác.",
        fix: ["Gửi kèm output cũ + lỗi cụ thể như tool_result is_error.", "Giới hạn số lần."],
      },
    ],
    quiz: [
      {
        level: "hard",
        q: "Validator báo: invoice_date \"15/03/2026\" sai định dạng và vendor_tax_id trống. Kiểm tra nguồn: có ngày, nhưng không có mã số thuế. Hành động đúng?",
        options: ["Retry kèm cả hai lỗi", "Retry kèm lỗi định dạng ngày; với vendor_tax_id: giữ null, gắn cờ thiếu trong nguồn", "Không retry, gửi cả hai cho người duyệt", "Retry 5 lần không kèm lỗi"],
        answer: 1,
        explain: "Tách lỗi sửa được (định dạng) khỏi thông tin vắng mặt (retry vô ích, dễ gây bịa).",
        notes: ["Retry trường vắng mặt khuyến khích bịa.", "Đúng.", "Bỏ lỡ việc sửa tự động dễ dàng.", "Retry mù và quá nhiều."],
      },
    ],
  },

  /* ─────────────── 4-5 ─────────────── */
  "4-5": {
    widgets: ["batchTrace", "batchDecider"],
    advanced: `
<h4>📮 Các endpoint</h4>
<table class="t">
  <tr><th>Thao tác</th><th>Endpoint</th></tr>
  <tr><td>Tạo</td><td><code>POST /v1/messages/batches</code></td></tr>
  <tr><td>Xem trạng thái</td><td><code>GET /v1/messages/batches/{id}</code></td></tr>
  <tr><td>Tải kết quả (JSONL)</td><td><code>results_url</code> khi <code>processing_status = ended</code></td></tr>
  <tr><td>Hủy</td><td><code>POST /v1/messages/batches/{id}/cancel</code></td></tr>
</table>
<h4>📏 Đặc điểm cần nhớ</h4>
<ul>
  <li>Giảm khoảng 50% chi phí; xử lý bất đồng bộ, tối đa 24 giờ — request chưa xong thì <code>expired</code>.</li>
  <li>Giới hạn kích thước mỗi batch (hàng chục nghìn request / vài trăm MB — xem tài liệu hiện hành); kết quả lưu có thời hạn.</li>
  <li>Kết quả <b>không theo thứ tự</b> — ghép bằng <code>custom_id</code>.</li>
  <li>Mỗi request là <b>một lượt</b>: có thể kèm tools và nhận tool_use, nhưng muốn chạy công cụ rồi tiếp tục thì phải gửi lượt sau (batch mới hoặc gọi đồng bộ).</li>
  <li>Kết hợp được với prompt caching (phần system/tài liệu chung).</li>
</ul>
<h4>🧮 Tính lịch gửi theo SLA</h4>
<div class="dg dg-anim">
  <div class="dn"><b>Hạn chót</b>T + 30h</div><span class="da">−</span><div class="dn"><b>Cửa sổ batch tối đa</b>24h</div><span class="da">−</span><div class="dn"><b>Dự phòng gửi lại phần lỗi</b>vài giờ</div><span class="da">=</span><div class="dn hot"><b>Gửi trước</b>≈ T + 4–6h</div>
</div>
<h4>🧭 Khi nào không dùng</h4>
<ul><li>Có người đang chờ (chat, pre-merge check, API đồng bộ).</li><li>Vòng lặp agent nhiều lượt cần kết quả công cụ ngay.</li><li>Hạn chót ngắn hơn cửa sổ xử lý.</li></ul>`,
    traps: [
      {
        title: "Agent nhiều lượt trong batch",
        level: "hard",
        scenario: "Team muốn chạy agent điều tra (cần 5–10 lượt gọi công cụ) cho 5.000 ticket qua đêm bằng Batch API để tiết kiệm. Mỗi request trong batch chỉ trả về một tool_use rồi dừng.",
        bait: "Kết luận Batch API bị lỗi.",
        why: "Batch xử lý mỗi request như một lượt riêng; không ai chạy công cụ và gửi tool_result trong cùng request.",
        fix: ["Cách 1: chạy đồng bộ (song song có giới hạn) cho tác vụ nhiều lượt.", "Cách 2: thiết kế theo vòng: batch lượt 1 → chạy công cụ → batch lượt 2 với messages đã nối tool_result… (chấp nhận độ trễ nhiều vòng).", "Hoặc tái thiết kế thành tác vụ một lượt (đưa sẵn dữ liệu cần thiết vào prompt)."],
      },
      {
        title: "Ghép kết quả theo số dòng",
        scenario: "Script ghép dòng thứ i của results.jsonl với tài liệu thứ i. Báo cáo gán nhầm kết quả giữa các khách hàng.",
        bait: "Sắp xếp lại input cho khớp.",
        why: "Thứ tự kết quả không được đảm bảo.",
        fix: ["Luôn ghép bằng <code>custom_id</code> (mã tài liệu duy nhất)."],
      },
    ],
    quiz: [
      {
        level: "hard",
        q: "Báo cáo tuân thủ phải có trước 09:00 sáng thứ Hai. Dữ liệu sẵn sàng lúc 18:00 thứ Sáu. Kế hoạch dùng Batch API hợp lý nhất?",
        options: ["Gửi batch lúc 08:00 thứ Hai", "Gửi batch ngay tối thứ Sáu; khi xong, gửi lại phần errored theo custom_id — vẫn còn nhiều thời gian dự phòng", "Không dùng Batch vì không có SLA", "Gửi từng request đồng bộ vào sáng thứ Hai"],
        answer: 1,
        explain: "Cửa sổ ~63 giờ dư cho tối đa 24 giờ xử lý cộng một vòng gửi lại phần lỗi.",
        notes: ["Chỉ còn 1 giờ, batch có thể mất tới 24 giờ.", "Đúng.", "Không có SLA không có nghĩa là không dùng được — chỉ cần lịch gửi hợp lý.", "Đắt gấp đôi và rủi ro dồn việc."],
      },
    ],
  },

  /* ─────────────── 4-6 ─────────────── */
  "4-6": {
    widgets: ["multiPassTrace", "multiPass"],
    advanced: `
<h4>🪞 Vì sao tự review kém hiệu quả?</h4>
<p>Phiên vừa sinh code mang theo chuỗi lập luận đã dẫn tới code đó. Khi review, nó có xu hướng xác nhận lại giả định của chính mình. Bật extended thinking trong <b>cùng</b> phiên không xóa được neo này.</p>
<h4>🧪 Thiết kế reviewer độc lập</h4>
<ul>
  <li>Instance mới, ngữ cảnh sạch: chỉ có diff/code + tiêu chí, không có lịch sử sinh.</li>
  <li>Prompt vai trò khác (“tìm cách làm code này hỏng”).</li>
  <li>Có thể dùng nhiều reviewer chuyên biệt (bảo mật, đồng thời, xử lý lỗi) chạy song song.</li>
</ul>
<h4>🧭 Định tuyến theo độ tin cậy</h4>
<table class="t">
  <tr><th>Confidence (đã hiệu chỉnh)</th><th>Hành động</th></tr>
  <tr><td>Cao</td><td>Đăng comment tự động</td></tr>
  <tr><td>Trung bình</td><td>Người duyệt xác nhận</td></tr>
  <tr><td>Thấp</td><td>Ghi log, dùng để cải thiện tiêu chí</td></tr>
</table>
<p>Confidence là tín hiệu <b>định tuyến</b>, không phải bộ lọc xóa — và chỉ đáng tin sau khi so với nhãn thực tế (xem 5-5).</p>
<h4>🔄 Evaluator–optimizer</h4>
<p>Một instance sinh, một instance đánh giá theo rubric, lặp tới khi đạt hoặc hết ngân sách — tách vai giúp đánh giá khách quan hơn.</p>`,
    traps: [
      {
        title: "Extended thinking để tự review",
        level: "hard",
        scenario: "Code sinh tự động hay có race condition. Đề xuất: bật extended thinking với ngân sách lớn và yêu cầu chính phiên đó “suy nghĩ kỹ và tự review”.",
        bait: "Suy nghĩ lâu hơn = review tốt hơn.",
        why: "Vẫn là cùng ngữ cảnh, cùng giả định đã dẫn tới lỗi.",
        fix: ["Reviewer là instance riêng, không có ngữ cảnh sinh.", "Thêm reviewer chuyên về đồng thời với tiêu chí cụ thể."],
      },
      {
        title: "Một lượt review khổng lồ",
        scenario: "PR 40 file gửi trong một request. Review chi tiết 6 file đầu, các file cuối chỉ một dòng “trông ổn”.",
        bait: "Dùng model có context lớn hơn.",
        why: "Vấn đề là chú ý bị loãng, không phải không đủ chỗ.",
        fix: ["Per-file pass song song.", "Integration pass với tóm tắt giao diện để bắt lỗi xuyên file."],
      },
    ],
    quiz: [
      {
        level: "hard",
        q: "Sau khi tách per-file review, bot bắt được nhiều lỗi cục bộ hơn nhưng bỏ sót lỗi do hai module hiểu khác nhau về định dạng dữ liệu. Bổ sung tốt nhất?",
        options: ["Gộp lại thành một lượt review toàn PR", "Thêm lượt tích hợp nhận tóm tắt giao diện/giả định của từng file để tìm vấn đề xuyên module", "Tăng độ dài prompt per-file", "Cho mỗi reviewer per-file đọc thêm toàn bộ repo"],
        answer: 1,
        explain: "Lỗi xuyên file cần một lượt nhìn toàn cục — nhưng với đầu vào cô đọng để không loãng chú ý.",
        notes: ["Quay lại vấn đề chú ý loãng.", "Đúng.", "Không cho reviewer thấy file kia.", "Làm phình ngữ cảnh mỗi reviewer, mất lợi ích tập trung."],
      },
    ],
  },
});
