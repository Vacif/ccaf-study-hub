/* Nội dung chuyên sâu — Chương 5: Context Management & Reliability */
window.DEEP_ADD({
  /* ─────────────── 5-1 ─────────────── */
  "5-1": {
    widgets: ["contextAssembly", "contextWindow"],
    advanced: `
<section class="adv-block">
  <h4>Sắp xếp ngữ cảnh cho một cuộc trò chuyện dài</h4>
  <p>Mỗi lần gọi Claude, chương trình tự “lắp ráp” nội dung gửi đi. Một thứ tự hợp lý từ trên xuống:</p>
  <ol class="steps-dg">
    <li>Hướng dẫn chung và danh sách công cụ. Phần này không đổi, nên đặt đầu để tận dụng lưu đệm.</li>
    <li class="hot">Khối dữ kiện quan trọng (case facts): số tiền, ngày, mã đơn, ghi nguyên văn và không bao giờ tóm tắt.</li>
    <li>Bản tóm tắt các lượt trò chuyện cũ.</li>
    <li>Vài lượt gần nhất, giữ nguyên văn.</li>
    <li>Kết quả công cụ, đã được cắt gọn chỉ còn các trường cần thiết.</li>
  </ol>
</section>
<section class="adv-block">
  <h4>Ngữ cảnh lớn hơn không giải quyết được vấn đề</h4>
  <p>Đổi sang model có ngữ cảnh lớn hơn nghe như một giải pháp đơn giản, nhưng nó không cứu được thông tin đã bị tóm tắt làm mất. Nó cũng không làm hết hiện tượng bỏ sót phần giữa, và chi phí mỗi lượt còn tăng lên. Cách hiệu quả là giữ thông tin quan trọng ở chỗ dễ thấy, và bỏ bớt những gì không cần.</p>
</section>
<section class="adv-block">
  <h4>Những cách giảm tải ngữ cảnh</h4>
  <p>Cắt gọn kết quả ngay tại công cụ, hoặc trong hook PostToolUse. Xóa bớt kết quả công cụ cũ đã dùng xong, chỉ giữ lại kết luận. Giao những việc phải đọc nhiều cho agent con và chỉ nhận về kết quả gọn. Khi tóm tắt, chỉ rõ những gì phải giữ nguyên văn.</p>
</section>`,
    traps: [
      {
        title: "“Cứ tăng kích thước ngữ cảnh lên”",
        level: "hard",
        scenario: "Agent hỗ trợ nhắc sai số tiền sau 50 lượt trò chuyện. Có người đề xuất chuyển sang model có ngữ cảnh một triệu token.",
        bait: "Nghĩ rằng có nhiều chỗ hơn thì không phải tóm tắt nữa.",
        why: "Hệ thống hiện tại vẫn sẽ tóm tắt khi chạm ngưỡng. Ngữ cảnh dài hơn còn khiến thông tin quan trọng dễ chìm hơn, và chi phí mỗi lượt tăng lên.",
        fix: ["Ghi dữ kiện quan trọng vào khối case facts ngay khi chúng xuất hiện, đặt ở đầu ngữ cảnh.", "Cắt gọn kết quả công cụ.", "Chỉ tóm tắt những phần ít quan trọng của cuộc trò chuyện."],
      },
      {
        title: "Phát hiện quan trọng nằm giữa một báo cáo dài",
        scenario: "Agent con trả về báo cáo dài 6.000 chữ. Phát hiện “lỗ hổng xác thực nghiêm trọng” nằm ở đoạn thứ 14. Báo cáo tổng hợp của coordinator không nhắc gì tới nó.",
        bait: "Dặn coordinator “đọc kỹ toàn bộ”.",
        why: "Thông tin ở giữa nội dung dài dễ bị bỏ sót. Văn bản dài cũng không làm nổi bật mức độ quan trọng của từng phát hiện.",
        fix: ["Yêu cầu agent con trả kết quả có cấu trúc: danh sách phát hiện chính, xếp theo mức độ nghiêm trọng, đặt ở đầu; phần chi tiết để sau.", "Coordinator đọc phần tóm tắt có cấu trúc trước."],
      },
    ],
    quiz: [
      {
        level: "hard",
        q: "Công cụ lookup_order trả về 45 trường, trong khi agent chỉ cần 5. Sau nhiều lần tra cứu, chất lượng trả lời giảm. Nên xử lý ở đâu?",
        options: ["Dặn trong prompt: “chỉ chú ý các trường liên quan”", "Lọc chỉ giữ các trường cần thiết trước khi thêm vào hội thoại", "Tóm tắt toàn bộ cuộc trò chuyện sau mỗi lượt tra cứu để ngữ cảnh luôn gọn gàng", "Tăng max_tokens để Claude có chỗ xử lý 45 trường"],
        en: { q: "The lookup_order tool returns 45 fields, while the agent needs only 5. After several lookups, answer quality drops. Where should you handle this?", options: ["Tell the prompt: “only pay attention to the relevant fields”", "Filter down to the needed fields before adding results to the conversation", "Summarize the whole conversation after every lookup to keep the context small", "Raise max_tokens so Claude has room to process 45 fields"] },
        answer: 1,
        explain: "Loại bỏ phần thừa trước khi nó vào ngữ cảnh. Cách này chắc chắn, và tiết kiệm cho mọi lượt sau.",
        notes: ["Phần thừa vẫn chiếm chỗ và chiếm sự chú ý.", "Đúng.", "Tóm tắt dày đặc làm mất những chi tiết khác.", "max_tokens là giới hạn độ dài câu trả lời."],
      },
    ],
  },

  /* ─────────────── 5-2 ─────────────── */
  "5-2": {
    widgets: ["handoffTrace", "escalation"],
    advanced: `
<section class="adv-block">
  <h4>Các bước agent nên tự hỏi</h4>
  <ol class="steps-dg">
    <li>Khách có yêu cầu nói chuyện với người thật không? Nếu có, chuyển ngay, kèm bản bàn giao.</li>
    <li>Có nhiều tài khoản khớp với thông tin khách đưa không? Nếu có, hỏi thêm email hoặc mã đơn.</li>
    <li>Chính sách có quy định cho trường hợp này không? Nếu không, chuyển cho người có thẩm quyền.</li>
    <li>Việc này có nằm trong khả năng và quyền hạn của agent không? Nếu có, tự xử lý, đồng thời ghi nhận cảm xúc của khách.</li>
    <li class="hot">Đã thử nhiều cách mà vẫn không tiến triển? Chuyển cho người, kèm danh sách những gì đã thử.</li>
  </ol>
</section>
<section class="adv-block">
  <h4>Vì sao không dựa vào điểm cảm xúc</h4>
  <p>Một khách bực bội vì giao hàng trễ hai ngày có điểm cảm xúc rất thấp, nhưng vấn đề lại đơn giản và agent tự xử lý được. Một khách lịch sự xin được giảm giá theo giá đối thủ có điểm cảm xúc cao, nhưng lại là trường hợp chính sách chưa quy định và cần người có thẩm quyền. Cảm xúc chỉ nên dùng để điều chỉnh cách nói chuyện, không dùng để quyết định có chuyển hay không.</p>
</section>`,
    traps: [
      {
        title: "Chuyển cho người dựa vào điểm cảm xúc",
        level: "hard",
        scenario: "Hệ thống chuyển cho nhân viên khi điểm cảm xúc thấp hơn 0,3. Hàng đợi của nhân viên quá tải bởi những khách bực vì giao trễ, việc mà agent tự xử lý được. Trong khi đó, những trường hợp chính sách chưa quy định với khách lịch sự lại không được chuyển.",
        bait: "Điều chỉnh ngưỡng xuống 0,2.",
        why: "Cảm xúc của khách không phản ánh độ khó của vụ việc, cũng không cho biết có cần người có thẩm quyền hay không.",
        fix: ["Bỏ điểm cảm xúc khỏi điều kiện chuyển cho người.", "Dùng các tín hiệu rõ ràng: khách yêu cầu, chính sách chưa quy định, không thể tiến triển, vượt hạn mức.", "Chỉ dùng điểm cảm xúc để điều chỉnh giọng điệu khi trả lời."],
      },
      {
        title: "Đoán khách khi có nhiều tài khoản trùng tên",
        scenario: "Tra cứu “Nguyễn Văn A” trả về ba tài khoản. Agent chọn tài khoản có đơn gần nhất, rồi hủy nhầm đơn của người khác.",
        bait: "Thêm cách đoán thông minh hơn, như khớp thành phố hay khớp một phần số điện thoại.",
        why: "Cách đoán nào cũng có khả năng sai, và thao tác trên tài khoản của người khác là lỗi nghiêm trọng.",
        fix: ["Khi có nhiều kết quả, hỏi thêm thông tin định danh duy nhất như email hoặc mã đơn.", "Công cụ thao tác trên tài khoản chỉ nhận mã khách hàng đã được xác minh."],
      },
    ],
    quiz: [
      {
        level: "hard",
        q: "Một khách lịch sự xin được bồi thường thêm vì đơn bị giao nhầm màu. Chính sách chỉ quy định đổi trả, không nói gì về bồi thường. Model tự báo độ tự tin 0,95 rằng có thể tặng voucher 200.000 đồng. Agent nên làm gì?",
        options: ["Tặng voucher vì độ tự tin 0,95 là rất cao", "Đổi trả theo chính sách; phần bồi thường chuyển người có thẩm quyền", "Từ chối lịch sự yêu cầu bồi thường vì chính sách hiện tại không có điều khoản cho phép", "Hỏi khách muốn được bồi thường bao nhiêu rồi đáp ứng"],
        en: { q: "A polite customer asks for extra compensation because the order arrived in the wrong color. Policy only covers returns and exchanges, and says nothing about compensation. The model reports 0.95 confidence that it can offer a 200,000 VND voucher. What should the agent do?", options: ["Offer the voucher because 0.95 confidence is very high", "Handle the exchange per policy; route the compensation request to someone authorized", "Politely refuse compensation because current policy has no clause allowing it", "Ask how much compensation the customer wants and grant it"] },
        answer: 1,
        explain: "Trường hợp chính sách chưa quy định cần người có thẩm quyền quyết định. Độ tự tin model tự báo không thay thế được chính sách.",
        notes: ["Agent tự đặt ra chính sách dựa trên một tín hiệu không đáng tin.", "Đúng: làm phần đã rõ ràng, chuyển phần chưa rõ.", "Chính sách không cấm, chỉ là chưa quy định.", "Không giải quyết được vấn đề ai có quyền quyết định."],
        trap: "Con số 0,95 được đưa vào để kéo bạn chọn cách tặng voucher.",
      },
    ],
  },

  /* ─────────────── 5-3 ─────────────── */
  "5-3": {
    widgets: ["errorPropTrace", "errorPropagation"],
    advanced: `
<section class="adv-block">
  <h4>Một mẫu kết quả chuẩn cho agent con</h4>
  <pre><code>{
  "status": "partial",
  "results": [...],
  "errors": [{
    "source": "journal-db", "type": "transient",
    "attempted": "truy vấn đã thử", "retries": 2,
    "alternatives": ["thử lại sau 15 phút", "dùng nguồn scholar-api"]
  }],
  "coverage": {"news": "ok", "journal-db": "missing"}
}</code></pre>
  <p>Trường <code>status</code> có ba giá trị: <code>ok</code> (đầy đủ), <code>partial</code> (một phần) hoặc <code>failed</code> (thất bại). Chỉ cần nhìn mẫu này, coordinator biết ngay đã có gì, thiếu gì, và có thể thử cách nào khác.</p>
</section>
<section class="adv-block">
  <h4>Mỗi tầng xử lý phần việc của mình</h4>
  <p><b>Công cụ</b> phân loại lỗi và trả về thông tin rõ ràng. <b>Agent con</b> tự thử lại những lỗi tạm thời (có giới hạn số lần), rồi trả về kết quả một phần cùng mô tả lỗi. <b>Coordinator</b> quyết định thử nguồn khác, giao lại việc, hay chấp nhận thiếu. <b>Báo cáo cuối</b> ghi chú độ bao phủ để người đọc biết kết luận nào có cơ sở chắc chắn tới đâu.</p>
  <p>Nếu một nguồn liên tục lỗi, nên tạm ngừng gọi nó một thời gian thay vì gọi mãi. Và đừng bao giờ ghi “thành công” khi kết quả thực ra còn thiếu.</p>
</section>`,
    traps: [
      {
        title: "Báo cáo nhận là “toàn diện” nhưng thực ra thiếu",
        level: "hard",
        scenario: "Agent con bắt mọi lỗi và trả về <code>{status: \"success\", results: [...]}</code> với những gì nó lấy được. Báo cáo cuối khẳng định “dựa trên toàn bộ nguồn học thuật”, trong khi nguồn học thuật duy nhất đã bị hết thời gian chờ.",
        bait: "Dặn agent tổng hợp: “hãy nêu rõ các hạn chế của nghiên cứu”.",
        why: "Agent tổng hợp không hề biết có hạn chế, vì thông tin lỗi đã bị giấu ngay từ agent con.",
        fix: ["Agent con trả <code>status: \"partial\"</code>, kèm danh sách lỗi và độ bao phủ.", "Coordinator chuyển thông tin độ bao phủ cho agent tổng hợp.", "Báo cáo có mục ghi chú độ bao phủ."],
      },
      {
        title: "Thử lại không giới hạn",
        scenario: "Agent con thử lại một nguồn bị lỗi “cho tới khi được”. Có job chạy suốt 9 tiếng và tốn rất nhiều chi phí.",
        bait: "Tăng thời gian chờ giữa các lần thử.",
        why: "Lỗi có thể kéo dài, ví dụ nguồn đang bảo trì, hoặc vốn không phải lỗi tạm thời.",
        fix: ["Đặt giới hạn số lần thử, ví dụ 2 đến 3 lần với thời gian chờ tăng dần.", "Hết lượt thì báo lên coordinator kèm các phương án thay thế."],
      },
    ],
    quiz: [
      {
        level: "hard",
        q: "Agent con kiểm chứng không truy cập được 2 trong 10 nguồn vì bị từ chối quyền truy cập (lỗi 403). Nó nên làm gì?",
        options: ["Thử lại 10 lần với thời gian chờ tăng dần", "Trả kết quả 8 nguồn, kèm lỗi loại “quyền truy cập” cho 2 nguồn", "Ghi 2 nguồn là “không kiểm chứng được” và báo thành công", "Hủy toàn bộ việc kiểm chứng vì dữ liệu không đầy đủ"],
        en: { q: "A verification subagent cannot access 2 of 10 sources because access is denied (HTTP 403). What should it do?", options: ["Retry 10 times with exponential backoff", "Return results for 8 sources plus a “permission” error for the other 2", "Mark the 2 sources as “unverifiable” and report success", "Cancel the whole verification because the data is incomplete"] },
        answer: 1,
        explain: "Lỗi quyền truy cập không tự hết khi thử lại. Báo lên kèm đầy đủ thông tin để coordinator chọn hướng: dùng nguồn khác, hoặc xin cấp quyền.",
        notes: ["Thử lại vô ích với lỗi quyền truy cập.", "Đúng.", "Giấu mất lý do, coordinator không biết đây là vấn đề quyền truy cập.", "Mất luôn 8 kết quả tốt."],
      },
    ],
  },

  /* ─────────────── 5-4 ─────────────── */
  "5-4": {
    advanced: `
<section class="adv-block">
  <h4>Nhịp làm việc cho một phiên khám phá dài</h4>
  <ol class="steps-dg">
    <li>Giao những câu hỏi khảo sát cụ thể cho agent con, ví dụ “lần theo luồng hoàn tiền, trả về danh sách hàm và file”.</li>
    <li>Ghi các phát hiện quan trọng vào file ghi chú, kèm đường dẫn và số dòng.</li>
    <li class="hot">Kết thúc mỗi giai đoạn bằng một đoạn tóm tắt: đã biết gì, đã loại trừ gì, câu hỏi nào còn mở.</li>
    <li>Nén cuộc trò chuyện bằng <code>/compact</code>, hoặc mở phiên mới và đọc lại file ghi chú.</li>
    <li>Chuyển sang giai đoạn tiếp theo.</li>
  </ol>
  <p>Lệnh <code>/compact</code> có thể kèm chỉ dẫn những gì cần giữ, ví dụ <code>/compact giữ lại danh sách file và các giả thuyết đã loại</code>. Lệnh <code>/clear</code> xóa sạch để bắt đầu một việc hoàn toàn khác. Những hiểu biết bền vững về codebase, cần cho mọi phiên sau, nên ghi vào CLAUDE.md.</p>
</section>
<section class="adv-block">
  <h4>Lưu trạng thái để tiếp tục sau sự cố</h4>
  <pre><code>{"phase": "analysis",
 "done": ["map_modules", "find_entrypoints"],
 "pending": ["trace_refund_flow"],
 "artifacts": ["notes/modules.md"],
 "updated_at": "2026-10-29T10:12:00Z"}</code></pre>
  <p>Nếu mỗi agent ghi một file trạng thái như trên sau mỗi bước, khi hệ thống bị gián đoạn, coordinator đọc file này là biết cần tiếp tục từ đâu, không phải làm lại từ đầu.</p>
</section>`,
    traps: [
      {
        title: "/compact làm mất phát hiện",
        level: "hard",
        scenario: "Sau hai giờ khảo sát, bạn chạy <code>/compact</code>. Bản nén chỉ còn một câu “đã khảo sát module thanh toán”, mất hết danh sách 7 hàm và các dòng code quan trọng.",
        bait: "Không dùng /compact nữa, chấp nhận ngữ cảnh đầy.",
        why: "Nén là tóm tắt. Chi tiết nào không được ghi ở chỗ khác sẽ mất.",
        fix: ["Trước khi nén, ghi các phát hiện chi tiết vào file ghi chú.", "Dùng <code>/compact</code> kèm chỉ dẫn những gì cần giữ.", "Sau khi nén, đọc lại file ghi chú khi cần chi tiết."],
      },
      {
        title: "Đọc cả codebase cho chắc",
        scenario: "Để hiểu luồng hoàn tiền trong một repo 2.000 file, bạn yêu cầu Claude đọc hết mọi file trong <code>src/</code> trước.",
        bait: "Nghĩ rằng có nhiều thông tin hơn thì hiểu tốt hơn.",
        why: "Ngữ cảnh đã đầy những thứ không liên quan trước khi bạn kịp hỏi câu hỏi thật.",
        fix: ["Dùng Grep tìm điểm bắt đầu (từ khóa “refund”), rồi lần theo các lời gọi hàm.", "Giao cho agent con: “lần theo luồng hoàn tiền, trả về danh sách hàm và file liên quan”."],
      },
    ],
    quiz: [
      {
        level: "hard",
        q: "Một hệ thống phân tích nhiều giai đoạn đôi khi bị dừng giữa chừng (máy chủ bị thu hồi) và phải chạy lại từ đầu, mất 3 giờ. Cải thiện nào tốt nhất?",
        options: ["Nâng cấu hình máy chủ lên mạnh hơn để chạy nhanh hơn và ít bị thu hồi giữa chừng", "Mỗi agent ghi file trạng thái sau mỗi bước để chạy tiếp từ chỗ dừng", "Gộp toàn bộ vào một agent để dễ quản lý", "Giảm bớt số giai đoạn để chạy nhanh hơn"],
        en: { q: "A multi-stage analysis system is sometimes interrupted midway (the server gets reclaimed) and must restart from scratch, losing 3 hours. What is the best improvement?", options: ["Upgrade to a more powerful server so it runs faster and is reclaimed less often", "Have each agent write a state file after every step so work can resume", "Merge everything into one agent to simplify management", "Cut the number of stages so it runs faster"] },
        answer: 1,
        explain: "Trạng thái được lưu bên ngoài ngữ cảnh cho phép tiếp tục từ điểm dừng.",
        notes: ["Giảm khả năng bị dừng, nhưng không giải quyết chuyện tiếp tục khi bị dừng.", "Đúng.", "Một agent lại càng dễ đầy ngữ cảnh, và vẫn mất hết khi bị dừng.", "Không giải quyết được vấn đề."],
      },
    ],
  },

  /* ─────────────── 5-5 ─────────────── */
  "5-5": {
    advanced: `
<section class="adv-block">
  <h4>Chia nhóm để đo cho đúng</h4>
  <p>Đừng chỉ nhìn một con số tổng. Hãy đo độ chính xác theo từng loại tài liệu (hóa đơn in, hóa đơn viết tay, hợp đồng), theo từng trường (tổng tiền, mã số thuế, ngày), theo nguồn (file PDF gốc hay ảnh chụp), và theo thời gian (tháng này so với tháng trước, để phát hiện khi dữ liệu đầu vào thay đổi).</p>
</section>
<section class="adv-block">
  <h4>Vì sao cần lấy mẫu phân tầng</h4>
  <p>Giả sử hóa đơn viết tay chỉ chiếm 1,5% tổng số. Lấy ngẫu nhiên 200 tài liệu để kiểm tra, bạn chỉ bốc được khoảng 3 hóa đơn viết tay, quá ít để kết luận điều gì. Lấy mẫu phân tầng nghĩa là chia tài liệu theo nhóm rồi lấy đủ số lượng từ mỗi nhóm, kể cả nhóm hiếm. Ngoài ra, vẫn nên lấy mẫu cả những kết quả model báo là rất tự tin, để phát hiện kiểu lỗi “tự tin nhưng sai”.</p>
</section>
<section class="adv-block">
  <h4>Đối chiếu độ tự tin với thực tế</h4>
  <ol class="steps-dg">
    <li>Chuẩn bị một tập dữ liệu đã được người kiểm tra, biết rõ kết quả nào đúng, kết quả nào sai.</li>
    <li>So sánh: trong những kết quả model báo tự tin 90%, thực tế đúng bao nhiêu phần trăm?</li>
    <li class="hot">Đặt ngưỡng riêng cho từng trường: trên ngưỡng thì tự động chấp nhận, dưới ngưỡng thì chuyển cho người kiểm tra.</li>
    <li>Theo dõi định kỳ và điều chỉnh lại khi dữ liệu thay đổi.</li>
  </ol>
  <p>Ví dụ: nếu trong nhóm model báo tự tin trên 90% mà thực tế chỉ đúng 80%, thì model đang tự tin quá mức. Cần nâng ngưỡng, hoặc tiếp tục để người kiểm tra nhóm đó.</p>
</section>`,
    traps: [
      {
        title: "Bỏ người kiểm tra vì độ chính xác 97%",
        level: "hard",
        scenario: "Pipeline đạt 97% độ chính xác tổng. Quản lý muốn bỏ hoàn toàn người kiểm tra. Hóa đơn viết tay, chỉ chiếm 1,5% khối lượng, thực tế chỉ đúng 61%, nhưng không ai biết.",
        bait: "97% vượt mục tiêu 95%, nên bỏ người kiểm tra.",
        why: "Con số tổng chủ yếu phản ánh nhóm lớn. Nhóm nhỏ làm kém bị che mất.",
        fix: ["Báo cáo độ chính xác theo từng loại tài liệu và từng trường.", "Giảm dần người kiểm tra cho những nhóm đã chứng minh làm tốt; giữ người kiểm tra cho nhóm còn yếu.", "Duy trì lấy mẫu phân tầng định kỳ."],
      },
      {
        title: "Tin ngay con số tự tin của model",
        scenario: "Quy tắc: độ tự tin từ 0,9 trở lên thì tự động chấp nhận. Kiểm tra mẫu cho thấy nhóm này vẫn sai 12% ở trường mã số thuế.",
        bait: "Nâng ngưỡng lên 0,99 cho mọi trường.",
        why: "Con số tự tin chưa được đối chiếu với thực tế, và mỗi trường có đặc điểm khác nhau.",
        fix: ["Đối chiếu độ tự tin với thực tế cho từng trường, dựa trên một tập dữ liệu đã kiểm tra.", "Đặt ngưỡng riêng cho từng trường. Trường có rủi ro cao có thể luôn cần người kiểm tra."],
      },
    ],
    quiz: [
      {
        level: "hard",
        q: "Bạn có thể cho người kiểm tra 300 tài liệu mỗi tuần để theo dõi chất lượng. 2% khối lượng là hợp đồng nước ngoài, chưa rõ độ chính xác. Nên lấy mẫu thế nào?",
        options: ["Lấy ngẫu nhiên 300 tài liệu mỗi tuần từ toàn bộ khối lượng để kết quả khách quan, đại diện", "Phân tầng theo loại tài liệu, đủ mẫu hợp đồng nước ngoài, có cả mẫu tự tin cao", "Chỉ kiểm tra những kết quả có độ tự tin thấp", "Kiểm tra 300 tài liệu mới nhất mỗi tuần"],
        en: { q: "You can have reviewers check 300 documents per week to monitor quality. 2% of volume is foreign contracts with unknown accuracy. How should you sample?", options: ["Randomly sample 300 documents a week from the full volume so results are objective and representative", "Stratify by document type, with enough foreign contracts and some high-confidence samples", "Only check results with low confidence scores", "Check the 300 most recent documents each week"] },
        answer: 1,
        explain: "Lấy mẫu phân tầng đảm bảo nhóm hiếm có đủ mẫu. Lấy mẫu cả nhóm tự tin cao giúp phát hiện lỗi “tự tin nhưng sai”.",
        notes: ["Chỉ được khoảng 6 hợp đồng nước ngoài, quá ít để kết luận.", "Đúng.", "Bỏ sót kiểu lỗi tự tin nhưng sai.", "Lệch theo thời gian, không đại diện cho toàn bộ."],
      },
    ],
  },

  /* ─────────────── 5-6 ─────────────── */
  "5-6": {
    advanced: `
<section class="adv-block">
  <h4>Giữ nguồn qua từng bước</h4>
  <ol class="steps-dg">
    <li>Agent tìm kiếm trả về từng nhận định kèm đoạn trích, đường dẫn và ngày.</li>
    <li>Agent phân tích gắn mã nguồn (ví dụ S3) cho mọi nhận định nó đưa ra.</li>
    <li>Agent tổng hợp chỉ được trích dẫn những mã nguồn có trong dữ liệu được giao.</li>
    <li class="good">Một bước kiểm tra tự động xác nhận mọi trích dẫn trong báo cáo đều thuộc danh sách nguồn đầu vào.</li>
  </ol>
  <pre><code>{"claim": "Tỷ lệ doanh nghiệp áp dụng AI", "value": "34%",
 "source_id": "S3", "quote": "...34% of surveyed SMEs...",
 "published": "2024-06", "method": "khảo sát 1.000 doanh nghiệp nhỏ",
 "status": "established"}</code></pre>
</section>
<section class="adv-block">
  <h4>Hai con số khác nhau chưa chắc đã mâu thuẫn</h4>
  <p>Nếu hai nguồn đo ở <b>hai thời điểm</b> khác nhau, sự khác biệt có thể là một xu hướng tăng giảm. Nếu hai nguồn khảo sát <b>hai nhóm</b> khác nhau, ví dụ doanh nghiệp nhỏ và doanh nghiệp lớn, chúng đang đo hai thứ khác nhau. Chỉ khi cùng thời điểm, cùng phạm vi mà vẫn khác nhau thì mới là mâu thuẫn thật; khi đó đánh dấu “còn tranh cãi” và trình bày cả hai. Trong mọi trường hợp, đừng tự chọn một con số và đừng lấy trung bình.</p>
</section>`,
    traps: [
      {
        title: "Lấy trung bình hai nguồn",
        level: "hard",
        scenario: "Nguồn A (2024, khảo sát doanh nghiệp nhỏ) cho kết quả 34%. Nguồn B (2025, khảo sát doanh nghiệp lớn) cho 52%. Agent tổng hợp viết: “khoảng 43% doanh nghiệp đã áp dụng AI”.",
        bait: "Lấy trung bình nghe có vẻ khách quan.",
        why: "Con số 43% không do nguồn nào đưa ra. Nó trộn hai nhóm doanh nghiệp khác nhau, và che mất sự khác biệt về thời điểm.",
        fix: ["Trình bày cả hai con số, kèm nguồn, ngày và phạm vi khảo sát.", "Giải thích lý do chúng khác nhau (quy mô doanh nghiệp, thời điểm).", "Không tạo ra con số mới không có nguồn."],
      },
      {
        title: "Trích dẫn bị rơi mất ở bước tóm tắt",
        scenario: "Agent tìm kiếm có đầy đủ đường dẫn nguồn, nhưng báo cáo cuối chỉ ghi “theo các nghiên cứu gần đây”.",
        bait: "Dặn agent tổng hợp “thêm danh sách nguồn ở cuối báo cáo”.",
        why: "Agent tổng hợp chỉ nhận được đoạn văn đã tóm tắt từ coordinator, không còn thông tin nhận định nào đi với nguồn nào.",
        fix: ["Truyền dữ liệu có cấu trúc (nhận định, mã nguồn, đường dẫn, ngày) qua mọi bước.", "Bắt buộc agent tổng hợp gắn mã nguồn cho từng nhận định."],
      },
    ],
    quiz: [
      {
        level: "hard",
        q: "Hai nguồn uy tín đưa ra tốc độ tăng trưởng thị trường năm 2025 là 12% và 19%. Nguồn 12% công bố hồi tháng 1 (dự báo), nguồn 19% công bố tháng 11 với số liệu cả năm. Nên trình bày thế nào?",
        options: ["Chọn 19% vì đây là số liệu mới hơn", "Nêu cả hai, ghi ngày và loại số liệu, giải thích vì sao khác", "Lấy trung bình 15,5% để cân bằng hai nguồn và ghi chú đó là số ước tính", "Bỏ số liệu này vì hai nguồn mâu thuẫn nhau"],
        en: { q: "Two reputable sources give 2025 market growth as 12% and 19%. The 12% source was published in January (a forecast); the 19% source was published in November with full-year data. How should you present this?", options: ["Use 19% because it is more recent", "Present both, with dates and data type, and explain why they differ", "Average them to 15.5% to balance the sources and label it as an estimate", "Drop the figure because the sources conflict"] },
        answer: 1,
        explain: "Thông tin về thời điểm giải thích được sự khác biệt, và người đọc tự đánh giá được.",
        notes: ["Mất thông tin, và không minh bạch về lý do chọn.", "Đúng.", "Tạo ra con số không nguồn nào đưa ra.", "Mất thông tin hữu ích."],
        trap: "“Mới hơn thì đúng hơn” nghe hợp lý, nhưng đề đang kiểm tra việc giữ minh bạch về nguồn.",
      },
    ],
  },
});
