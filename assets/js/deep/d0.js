/* Nội dung chuyên sâu — Chương 0: Tổng quan kỳ thi */
window.DEEP_ADD({
  "0-1": {
    advanced: `
<section class="adv-block">
  <h4>Cách giải một câu hỏi tình huống</h4>
  <p>Hãy làm theo bốn bước, đừng nhảy ngay vào đọc đáp án:</p>
  <ol class="steps-dg">
    <li><b>Hiểu tình huống.</b> Đây là hệ thống gì, ai đang dùng, và đang hỏng ở đâu?</li>
    <li><b>Tìm ràng buộc.</b> Đề cần chắc chắn tuyệt đối, cần rẻ, cần nhanh hay cần an toàn? Có ai đang ngồi chờ kết quả không?</li>
    <li><b>Loại đáp án.</b> Gạch bỏ những cách vi phạm ràng buộc, những cách sửa sai chỗ, và những cách làm quá tay.</li>
    <li class="hot"><b>Chọn đáp án.</b> Trong các đáp án còn lại, chọn cách sửa đúng nguyên nhân gốc, đủ tin cậy và gọn nhất.</li>
  </ol>
</section>
<section class="adv-block">
  <h4>Bốn kiểu đáp án sai hay gặp</h4>
  <p><b>Làm quá tay.</b> Đề hỏi một lỗi có thể sửa bằng cấu hình, nhưng đáp án đề xuất fine-tune model hoặc dựng thêm một hệ thống định tuyến.</p>
  <p><b>Sửa sai chỗ.</b> Báo cáo thiếu nội dung vì agent điều phối chia việc thiếu, nhưng đáp án lại đi sửa agent con.</p>
  <p><b>Chỉ dặn khi cần chắc chắn.</b> Quy tắc liên quan tới tiền bạc mà đáp án chỉ “nhấn mạnh trong prompt”, trong khi cần chặn bằng code.</p>
  <p><b>Đúng nhưng không hợp hoàn cảnh.</b> Batch API rẻ thật, nhưng sai khi đề nói lập trình viên đang ngồi chờ kết quả.</p>
</section>
<section class="adv-block">
  <h4>Phân bổ thời gian</h4>
  <p>Bạn có trung bình 2 phút cho mỗi câu. Câu nào phân vân quá một phút rưỡi thì chọn tạm một đáp án, đánh dấu, rồi đi tiếp; cuối giờ quay lại xem. Vì sai không bị trừ điểm nên đừng để trống câu nào.</p>
</section>`,
    traps: [
      {
        title: "Hai đáp án đều chạy được",
        scenario: "Agent hỗ trợ thỉnh thoảng hoàn tiền vượt hạn mức $500. Đáp án B: thêm vào system prompt câu “TUYỆT ĐỐI không hoàn quá $500”. Đáp án C: dùng hook PreToolUse chặn lệnh hoàn tiền khi số tiền lớn hơn 500 và chuyển sang quy trình duyệt.",
        bait: "Chọn B vì đơn giản, rẻ và không phải viết code.",
        why: "Cả hai cách đều làm giảm lỗi, nhưng quy tắc này liên quan tới tiền nên cần chắc chắn 100%. Dặn trong prompt chỉ làm tăng khả năng model làm đúng; hook thì luôn chạy và model không thể bỏ qua.",
        fix: ["Để ý các từ tuyệt đối trong đề như “luôn”, “không bao giờ”, “bắt buộc”.", "Nếu sai sót gây hậu quả về tiền, pháp lý hoặc bảo mật, ưu tiên cách chặn bằng code (hook, kiểm tra trong công cụ, phân quyền).", "Chỉ chọn cách dặn trong prompt khi yêu cầu mang tính mềm, như giọng văn hay cách trình bày."],
      },
      {
        title: "Đáp án “mạnh” nhất chưa chắc đã đúng",
        scenario: "Agent hay chọn nhầm giữa hai công cụ có mô tả gần giống nhau. Bốn đáp án: fine-tune model trên dữ liệu cũ; thêm một model phân loại để định tuyến; viết lại mô tả của hai công cụ; gộp hai công cụ làm một.",
        bait: "Chọn fine-tune hoặc model phân loại vì nghe chuyên nghiệp và “mạnh tay”.",
        why: "Đề hỏi bước nên làm đầu tiên. Nguyên nhân là mô tả công cụ mơ hồ, nên sửa trực tiếp ở đó là rẻ nhất và đủ hiệu quả. Thêm hệ thống mới là làm quá tay.",
        fix: ["Xác định nguyên nhân gốc trước khi đọc đáp án.", "Chọn thay đổi nhỏ nhất mà vẫn xử lý được nguyên nhân đó.", "Chỉ chọn giải pháp nặng khi đề nói rõ cách nhẹ đã được thử và thất bại."],
      },
    ],
    quiz: [
      {
        level: "hard",
        q: "Pipeline review chạy trên mỗi pull request, và lập trình viên phải chờ kết quả mới được merge. Công ty muốn giảm 40% chi phí. Phương án nào phù hợp nhất?",
        options: ["Chuyển toàn bộ review sang Message Batches API, vì Batch rẻ hơn khoảng 50% so với gọi trực tiếp", "Giữ gọi trực tiếp nhưng chỉ gửi phần diff liên quan, kèm prompt caching cho tiêu chí cố định", "Gom các pull request lại và chạy review theo lịch mỗi tuần một lần để giảm số lần gọi", "Bỏ review với pull request dưới 50 dòng và chỉ review các pull request lớn"],
        en: { q: "A review pipeline runs on every pull request, and developers must wait for the result before merging. The company wants to cut costs by 40%. Which option fits best?", options: ["Move all reviews to the Message Batches API, since batches cost about 50% less than direct calls", "Keep direct calls but send only the relevant diff, with prompt caching for the fixed review criteria", "Group pull requests and run reviews on a weekly schedule to reduce the number of calls", "Skip review for pull requests under 50 lines and only review the large ones"] },
        answer: 1,
        explain: "Vì lập trình viên đang chờ, Batch API (có thể mất tới 24 giờ) bị loại. Giảm lượng dữ liệu gửi đi và lưu đệm phần lặp lại giúp tiết kiệm mà không làm chậm.",
        notes: ["Rẻ hơn khoảng một nửa, nhưng có thể mất tới 24 giờ, trong khi lập trình viên đang chờ để merge.", "Đúng. Giảm chi phí mà vẫn giữ được tốc độ.", "Làm mất ý nghĩa của việc kiểm tra trước khi merge.", "Đây là cắt bớt chất lượng, không phải tối ưu chi phí."],
        trap: "Thấy “giảm chi phí” là nghĩ ngay tới Batch API mà quên đọc điều kiện “phải chờ kết quả”.",
      },
    ],
  },
  "0-2": {
    advanced: `
<section class="adv-block">
  <h4>Mỗi kịch bản thường hỏi về điều gì</h4>
  <p><b>Agent chăm sóc khách hàng</b> hay hỏi về vòng lặp agent, cách chặn hành động nguy hiểm bằng code, cách báo lỗi của công cụ, và khi nào chuyển cho nhân viên thật.</p>
  <p><b>Viết code với Claude Code</b> hay hỏi file cấu hình đặt ở đâu (CLAUDE.md, rules, skill), khi nào dùng plan mode, và chọn công cụ Grep, Glob hay Edit.</p>
  <p><b>Hệ thống nghiên cứu nhiều agent</b> hay hỏi về cách chia việc, cách truyền thông tin cho agent con, chạy song song, xử lý khi một nguồn bị lỗi và giữ trích dẫn nguồn.</p>
  <p><b>Claude Code trong CI/CD</b> hay hỏi về cờ <code>-p</code>, kết quả dạng JSON và review độc lập. <b>Trích xuất dữ liệu</b> hay hỏi về JSON schema, thử lại khi lỗi, Batch API và kiểm tra chất lượng.</p>
</section>
<section class="adv-block">
  <h4>Năm bài tự thực hành nên làm</h4>
  <p>Đọc hiểu là chưa đủ; tự tay làm sẽ giúp bạn nhớ lâu hơn nhiều. Mỗi bài mất khoảng 30 đến 60 phút:</p>
  <ol class="steps-dg">
    <li>Viết một vòng lặp agent ngắn với hai công cụ giả, và in ra <code>stop_reason</code> sau mỗi lượt.</li>
    <li>Cố ý cho một công cụ báo lỗi, rồi quan sát Claude xử lý tiếp như thế nào.</li>
    <li>Tạo một repo nhỏ có CLAUDE.md và một file rule có <code>paths</code>. Dùng lệnh <code>/memory</code> để xem file nào được nạp.</li>
    <li>Kết nối một máy chủ MCP qua <code>.mcp.json</code>, lấy token từ biến môi trường.</li>
    <li>Chạy <code>claude -p "..." --output-format json</code> và đọc từng trường trong kết quả.</li>
  </ol>
</section>`,
    traps: [
      {
        title: "Thuộc tên lệnh nhưng không hiểu cơ chế",
        scenario: "Bạn nhớ rằng “cờ -p dùng để chạy không cần người tương tác”. Đề hỏi: job CI đã có -p, nhưng mỗi khi Claude muốn chạy <code>npm test</code> thì không chạy được, và job kết thúc mà không có kết quả test.",
        bait: "Chọn đáp án “thêm cờ -p”, vì đó là điều duy nhất bạn nhớ về chạy trong CI.",
        why: "Lệnh đã có -p rồi. Vấn đề nằm ở quyền dùng công cụ: trong CI không có ai bấm “cho phép”, nên những lệnh cần xin phép sẽ không được chạy.",
        fix: ["Hiểu bản chất: chạy trong CI nghĩa là không có ai trả lời bất kỳ câu hỏi nào, kể cả câu hỏi xin quyền.", "Cho phép trước đúng những lệnh cần thiết bằng <code>--allowedTools</code>, giới hạn càng hẹp càng tốt.", "Khi ôn, luôn tự hỏi “tại sao” chứ không chỉ nhớ “cái gì”."],
      },
    ],
  },
});
