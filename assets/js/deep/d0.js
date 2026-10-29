/* Nội dung chuyên sâu — Chương 0: Tổng quan kỳ thi */
window.DEEP_ADD({
  "0-1": {
    advanced: `
<h4>🧭 Quy trình 4 bước giải một câu kịch bản</h4>
<div class="dg dg-anim">
  <div class="dn"><span class="i">📖</span><b>1. Kịch bản</b>Hệ thống gì? Ai dùng? Đang hỏng ở đâu?</div><span class="da">→</span>
  <div class="dn"><span class="i">⚖️</span><b>2. Ràng buộc</b>Tin cậy · chi phí · độ trễ · bảo mật · ai đang chờ?</div><span class="da">→</span>
  <div class="dn"><span class="i">✂️</span><b>3. Loại trừ</b>Quá tay · chỉ dặn prompt khi cần đảm bảo · sai tầng</div><span class="da">→</span>
  <div class="dn hot"><span class="i">🎯</span><b>4. Chọn</b>Giải pháp tối giản, đúng tầng, deterministic khi cần</div>
</div>
<h4>🧪 Giải phẫu một phương án gây nhiễu</h4>
<table class="t">
  <tr><th>Kiểu nhiễu</th><th>Dấu hiệu</th><th>Ví dụ</th></tr>
  <tr><td>Quá tay</td><td>Thêm hạ tầng/model mới cho lỗi cấu hình</td><td>“Fine-tune model”, “thêm classifier định tuyến” khi chỉ cần sửa description công cụ</td></tr>
  <tr><td>Sai tầng</td><td>Sửa ở chỗ không gây ra lỗi</td><td>Đổ lỗi cho subagent khi coordinator phân rã thiếu</td></tr>
  <tr><td>Xác suất thay vì đảm bảo</td><td>“Viết hoa”, “nhấn mạnh trong prompt” cho yêu cầu tuyệt đối</td><td>Dặn “luôn xác minh” thay vì cổng kiểm tra bằng code</td></tr>
  <tr><td>Đúng nhưng vi phạm ràng buộc</td><td>Giải pháp tốt ở bối cảnh khác</td><td>Batch API (rẻ) khi developer đang chờ kết quả</td></tr>
  <tr><td>Che triệu chứng</td><td>Tăng giới hạn, tăng retry, tăng context</td><td>Tăng context window khi vấn đề là tóm tắt làm mất dữ kiện</td></tr>
</table>
<h4>⏱️ Quản lý thời gian</h4>
<ul>
  <li>120 phút / 60 câu = 2 phút/câu. Đọc lướt đáp án <em>trước</em> khi đọc kỹ kịch bản giúp biết cần tìm thông tin gì.</li>
  <li>Đánh dấu câu phân vân, đi tiếp; quay lại sau. Không bỏ trống vì không trừ điểm.</li>
  <li>Hai đáp án “đều đúng”: chọn cái giải quyết <b>nguyên nhân gốc</b> ở <b>tầng thấp nhất, rẻ nhất</b> mà vẫn đủ độ tin cậy.</li>
</ul>`,
    traps: [
      {
        title: "Hai đáp án đều chạy được",
        scenario: "Câu hỏi: agent hỗ trợ đôi khi hoàn tiền vượt hạn mức $500. Đáp án B: “Thêm vào system prompt: TUYỆT ĐỐI không hoàn quá $500”. Đáp án C: “Hook PreToolUse chặn process_refund khi amount > 500 và chuyển escalate”.",
        bait: "Chọn B vì đơn giản, rẻ, không cần code.",
        why: "Cả hai đều giảm lỗi, nhưng yêu cầu có hệ quả tài chính cần <b>đảm bảo</b>. Prompt chỉ nâng xác suất tuân thủ; hook thì không thể bị bỏ qua.",
        fix: ["Tìm từ khóa tuyệt đối trong đề: “luôn”, “không bao giờ”, “bắt buộc”, “tuân thủ”.", "Có hậu quả tài chính/pháp lý/bảo mật → ưu tiên cơ chế bằng code (hook, gate, permission).", "Prompt chỉ đúng khi đề hỏi về hành vi mềm (giọng văn, định dạng) hoặc là bước sửa rẻ nhất cho lỗi chọn công cụ."],
      },
      {
        title: "Đáp án “mạnh nhất” chưa chắc là đúng",
        scenario: "Agent chọn nhầm giữa hai công cụ có mô tả gần giống nhau. Các đáp án: fine-tune model trên log; thêm model phân loại định tuyến; viết lại mô tả hai công cụ; gộp hai công cụ.",
        bait: "Fine-tune hoặc classifier nghe chuyên nghiệp và “mạnh”.",
        why: "Đề thường hỏi bước <b>đầu tiên / hiệu quả nhất</b>. Nguyên nhân gốc là mô tả mơ hồ — sửa trực tiếp ở đó rẻ và đủ. Hạ tầng thêm vào là quá tay.",
        fix: ["Xác định nguyên nhân gốc trước.", "Chọn thay đổi nhỏ nhất xử lý đúng nguyên nhân đó.", "Chỉ chọn giải pháp nặng khi đề nói rõ cách nhẹ đã thử và thất bại."],
      },
    ],
    quiz: [
      {
        level: "hard",
        q: "Đề: pipeline review chạy mỗi PR, developer phải chờ kết quả mới được merge; công ty muốn giảm chi phí 40%. Phương án nào phù hợp nhất?",
        options: ["Chuyển toàn bộ sang Message Batches API", "Giữ gọi đồng bộ, giảm token: cắt diff về file liên quan, prompt caching cho phần tiêu chí cố định", "Chạy review mỗi tuần một lần", "Bỏ bước review cho PR nhỏ hơn 50 dòng"],
        answer: 1,
        explain: "Ràng buộc “developer đang chờ” loại Batch API. Giảm token đầu vào và cache phần tĩnh giảm chi phí mà không đổi độ trễ.",
        notes: ["Rẻ ~50% nhưng có thể mất tới 24 giờ — vi phạm ràng buộc đang chờ merge.", "Đúng: tối ưu trong khuôn khổ đồng bộ.", "Phá mục đích kiểm tra trước merge.", "Giảm chất lượng/độ an toàn, không phải tối ưu chi phí kỹ thuật."],
        trap: "Thấy “giảm chi phí” là nghĩ ngay tới Batch API mà quên đọc ràng buộc độ trễ.",
      },
    ],
  },
  "0-2": {
    advanced: `
<h4>🗺️ Kịch bản thi ↔ chương cần nắm</h4>
<table class="t">
  <tr><th>Kịch bản</th><th>Chương chính</th><th>Câu hỏi hay gặp</th></tr>
  <tr><td>🎧 Agent hỗ trợ khách hàng</td><td>1, 2, 5</td><td>stop_reason, cổng kiểm tra, hook, lỗi có cấu trúc, escalate, case facts</td></tr>
  <tr><td>🧑‍💻 Sinh code với Claude Code</td><td>3, 2</td><td>CLAUDE.md, rules, skill, plan mode, Edit/Grep/Glob</td></tr>
  <tr><td>🔬 Nghiên cứu đa agent</td><td>1, 5</td><td>Coordinator, Task, song song, lan truyền lỗi, provenance</td></tr>
  <tr><td>🧰 Công cụ cho developer</td><td>2</td><td>.mcp.json, scope, biến môi trường, resources</td></tr>
  <tr><td>🏃 Claude Code trong CI/CD</td><td>3, 4</td><td>-p, output JSON, reviewer độc lập, Batch vs đồng bộ</td></tr>
  <tr><td>📄 Trích xuất dữ liệu</td><td>4, 5</td><td>tool_use + schema, nullable, retry, Batch, lấy mẫu phân tầng</td></tr>
</table>
<h4>🛠️ Bài thực hành nên tự làm (mỗi bài 30–60 phút)</h4>
<ol>
  <li>Viết vòng lặp agent 40 dòng với 2 công cụ giả; in ra <code>stop_reason</code> và <code>usage</code> mỗi lượt.</li>
  <li>Cố tình làm một công cụ lỗi: trả <code>is_error</code> và quan sát Claude phục hồi.</li>
  <li>Tạo repo nhỏ có CLAUDE.md, <code>.claude/rules/testing.md</code> với <code>paths</code>, một skill <code>context: fork</code>; dùng <code>/memory</code> kiểm tra.</li>
  <li>Cấu hình một MCP server qua <code>.mcp.json</code> với <code>\${TOKEN}</code>.</li>
  <li>Chạy <code>claude -p … --output-format json</code> và đọc từng trường của kết quả.</li>
</ol>`,
    traps: [
      {
        title: "Học thuộc tên cờ, không hiểu cơ chế",
        scenario: "Bạn nhớ “-p là chế độ không tương tác” nhưng gặp câu: job CI có -p vẫn bị kẹt ở bước Claude muốn chạy <code>npm install</code>.",
        bait: "Chọn đáp án “thêm cờ -p” vì đó là thứ duy nhất bạn nhớ về CI.",
        why: "Có -p rồi; vấn đề là <b>quyền công cụ</b>: không có ai bấm cho phép, nên lệnh cần quyền bị từ chối/không chạy được.",
        fix: ["Hiểu cơ chế: headless = không có người trả lời câu hỏi nào (input, quyền).", "Tiền duyệt công cụ cần thiết bằng <code>--allowedTools</code> (hoặc settings), giới hạn phạm vi hẹp nhất.", "Ôn theo câu hỏi “vì sao”, không chỉ “cái gì”."],
      },
    ],
  },
});
