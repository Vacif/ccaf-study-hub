/* Nội dung chuyên sâu — Chương 1: Agentic Architecture & Orchestration */
window.DEEP_ADD({
  /* ─────────────── 1-1 ─────────────── */
  "1-1": {
    advanced: `
<section class="adv-block">
  <h4>Một lượt của vòng lặp, chi tiết từng bước</h4>
  <ol class="steps-dg">
    <li>Chương trình gửi một request gồm: hướng dẫn chung (<code>system</code>), danh sách công cụ (<code>tools</code>) và toàn bộ cuộc trò chuyện tới thời điểm đó (<code>messages</code>).</li>
    <li>Claude trả về một danh sách các khối nội dung. Có thể là chữ, có thể là yêu cầu chạy công cụ (<code>tool_use</code>), hoặc cả hai.</li>
    <li class="hot">Chương trình xem <code>stop_reason</code>. Nếu là <code>tool_use</code>, nó chạy từng công cụ được yêu cầu.</li>
    <li>Mỗi kết quả được đóng gói thành một khối <code>tool_result</code>, mang đúng mã <code>tool_use_id</code> của yêu cầu tương ứng, rồi thêm vào cuộc trò chuyện.</li>
    <li class="good">Gửi lại cho Claude và lặp lại, cho tới khi <code>stop_reason</code> là <code>end_turn</code>.</li>
  </ol>
</section>
<section class="adv-block">
  <h4>Các giá trị stop_reason cần xử lý</h4>
  <p>Ngoài <code>tool_use</code> và <code>end_turn</code>, có một giá trị rất hay bị bỏ quên là <code>max_tokens</code>. Nó nghĩa là Claude bị cắt ngang vì đã viết tới giới hạn độ dài cho phép, chứ không phải đã làm xong. Lúc này câu trả lời có thể dang dở, thậm chí yêu cầu công cụ cũng có thể bị cắt nửa chừng. Cách xử lý thường là tăng giới hạn <code>max_tokens</code> rồi gọi lại.</p>
  <p>Vì vậy, điều kiện dừng nên viết là “dừng khi bằng <code>end_turn</code>”, chứ đừng viết “dừng khi khác <code>tool_use</code>”. Cách viết thứ hai vô tình coi trường hợp bị cắt ngang là đã hoàn thành.</p>
</section>
<section class="adv-block">
  <h4>Ba quy tắc ghép yêu cầu và kết quả</h4>
  <p>Nếu làm sai, API sẽ từ chối request:</p>
  <ul>
    <li>Mỗi yêu cầu <code>tool_use</code> phải có đúng một <code>tool_result</code> với mã trùng khớp, nằm ngay trong tin nhắn kế tiếp.</li>
    <li>Nếu Claude xin chạy nhiều công cụ trong một lượt, gửi tất cả kết quả trong <b>một</b> tin nhắn, không tách thành nhiều tin.</li>
    <li>Công cụ bị lỗi vẫn phải có kết quả: đánh dấu <code>is_error: true</code> và mô tả lỗi để Claude biết đường xử lý.</li>
  </ul>
</section>
<section class="adv-block">
  <h4>Vì sao cuộc trò chuyện càng dài càng tốn tiền</h4>
  <p>API không ghi nhớ gì giữa các lần gọi, nên mỗi lượt chương trình phải gửi lại toàn bộ cuộc trò chuyện. Lượt thứ 30 gửi lại cả 29 lượt trước, nên chi phí tăng nhanh theo độ dài. Hai cách giảm hiệu quả nhất là dùng <b>prompt caching</b> (cho phép API lưu đệm phần đầu lặp lại như hướng dẫn và danh sách công cụ, những lần sau tính giá rẻ hơn), và <b>cắt gọn kết quả công cụ</b> trước khi thêm vào cuộc trò chuyện.</p>
</section>`,
    traps: [
      {
        title: "Câu trả lời vừa có chữ vừa có yêu cầu chạy công cụ",
        level: "hard",
        scenario: "Claude trả về hai khối: một khối chữ “Đã xong, mình đang hoàn tiền cho bạn”, và một khối <code>tool_use</code> gọi <code>process_refund</code>. Chương trình của bạn có điều kiện: hễ câu trả lời có chữ thì gửi chữ đó cho khách và dừng.",
        bait: "Nghĩ rằng đã có câu trả lời thì gửi cho khách luôn, hoặc tìm chữ “xong” để quyết định dừng.",
        why: "Claude có thể nói trước rồi mới xin chạy công cụ. Ở đây lệnh hoàn tiền chưa hề được thực hiện, nên khách nhận được một lời hứa không có thật.",
        fix: ["Chỉ dùng <code>stop_reason</code> để quyết định dừng hay chạy tiếp.", "Nếu là <code>tool_use</code> thì chạy công cụ, thêm kết quả vào cuộc trò chuyện và gọi lại. Chỉ trả lời khách khi gặp <code>end_turn</code>.", "Không dựa vào việc đọc nội dung chữ để điều khiển chương trình."],
        code: "while True:\n    resp = call_claude(messages)\n    messages.append({\"role\": \"assistant\", \"content\": resp.content})\n    if resp.stop_reason == \"end_turn\":\n        break\n    if resp.stop_reason == \"tool_use\":\n        messages.append(run_tools(resp))",
      },
      {
        title: "Một trong hai công cụ chạy song song bị lỗi",
        level: "hard",
        scenario: "Claude xin chạy cùng lúc <code>lookup_order</code> và <code>get_refund_policy</code>. Dịch vụ chính sách bị lỗi. Chương trình chỉ gửi lại kết quả của <code>lookup_order</code>, và API trả về lỗi 400.",
        bait: "Bỏ qua công cụ bị lỗi cho gọn, hoặc để lỗi làm dừng luôn cả cuộc trò chuyện.",
        why: "API yêu cầu mọi yêu cầu chạy công cụ đều phải có kết quả tương ứng. Bỏ qua thì request không hợp lệ; để lỗi làm dừng chương trình thì khách mất cả cuộc trò chuyện vì một lỗi có thể khắc phục.",
        fix: ["Bọc từng công cụ trong khối bắt lỗi (try/except).", "Khi lỗi, vẫn tạo <code>tool_result</code> với <code>is_error: true</code>, kèm mô tả loại lỗi.", "Gửi cả hai kết quả trong một tin nhắn.", "Để Claude tự quyết định thử lại hay báo cho khách."],
      },
      {
        title: "Claude gọi đi gọi lại một công cụ",
        scenario: "Nhật ký cho thấy Claude gọi <code>search_kb(\"chính sách hoàn tiền\")</code> 14 lần liên tiếp cho tới khi chạm giới hạn 15 vòng. Lần nào công cụ cũng trả về “Operation failed”.",
        bait: "Tăng giới hạn lên 50 vòng, hoặc giảm xuống 3 vòng cho đỡ tốn tiền.",
        why: "Đổi giới hạn chỉ che đi triệu chứng. Nguyên nhân thật là thông báo lỗi quá mơ hồ, Claude không biết lỗi do đâu nên cứ thử lại y nguyên.",
        fix: ["Cho công cụ trả lỗi rõ ràng: loại lỗi, có nên thử lại không, và gợi ý cách sửa.", "Phát hiện việc lặp (cùng công cụ, cùng tham số từ ba lần trở lên) thì dừng và chuyển cho người, kèm tóm tắt.", "Vẫn giữ giới hạn số vòng như một lưới an toàn, và khi chạm giới hạn thì kết thúc có thông báo rõ ràng."],
      },
    ],
    quiz: [
      {
        level: "hard",
        q: "Claude trả về stop_reason \"tool_use\" với hai yêu cầu chạy công cụ A và B. Công cụ B bị lỗi. Lần gọi tiếp theo nên gửi gì?",
        options: ["Một tin nhắn chỉ chứa kết quả của A, bỏ qua B vì B đã lỗi", "Một tin nhắn gồm kết quả của A và kết quả của B có is_error: true", "Hai tin nhắn user liên tiếp, mỗi tin chứa kết quả của một công cụ", "Dừng vòng lặp và báo lỗi 500 cho người dùng vì có công cụ hỏng"],
        en: { q: "Claude returns stop_reason \"tool_use\" with two tool calls, A and B. Tool B fails. What should the next request contain?", options: ["One message with only A's result, skipping B because it failed", "One message with A's result and B's result marked is_error: true", "Two consecutive user messages, each holding one tool's result", "Stop the loop and return a 500 error to the user because a tool broke"] },
        answer: 1,
        explain: "Mỗi yêu cầu chạy công cụ đều cần một kết quả tương ứng, tất cả nằm trong cùng một tin nhắn ngay sau đó. Lỗi được báo bằng is_error để Claude tự tìm cách xử lý.",
        notes: ["Thiếu kết quả cho B nên API sẽ từ chối request.", "Đúng cấu trúc, và cho Claude đủ thông tin để xử lý lỗi.", "Các kết quả của cùng một lượt phải nằm chung một tin nhắn.", "Làm hỏng trải nghiệm người dùng chỉ vì một lỗi có thể khắc phục."],
        trap: "Cách “chỉ gửi kết quả của A” trông gọn gàng nhưng vi phạm quy tắc: mỗi yêu cầu chạy công cụ phải có một kết quả.",
      },
      {
        level: "hard",
        q: "Agent thỉnh thoảng gửi cho khách câu trả lời bị cụt giữa chừng. Nhật ký cho thấy stop_reason của các câu đó là \"max_tokens\". Code hiện tại dừng vòng lặp khi stop_reason khác \"tool_use\". Nên sửa thế nào?",
        options: ["Thêm vào prompt “hãy trả lời ngắn gọn” để câu trả lời không bị cắt", "Xử lý riêng max_tokens: chưa coi là xong, tăng giới hạn rồi gọi tiếp", "Giảm số công cụ để Claude có thêm chỗ cho câu trả lời", "Dừng vòng lặp ngay khi câu trả lời có chữ, không cần xem stop_reason"],
        en: { q: "The agent sometimes sends customers truncated replies. Logs show stop_reason \"max_tokens\" for those replies. The current code stops the loop whenever stop_reason is not \"tool_use\". How should you fix it?", options: ["Add “keep your answer short” to the prompt so replies are not cut off", "Handle max_tokens separately: not finished yet, raise the limit and continue", "Remove some tools so Claude has more room for its answer", "Stop the loop as soon as the reply contains text, ignoring stop_reason"] },
        answer: 1,
        explain: "Điều kiện dừng đúng là end_turn. max_tokens nghĩa là câu trả lời bị cắt ngang, cần xử lý riêng.",
        notes: ["Có thể giảm tần suất, nhưng không sửa được logic sai; câu dài vẫn bị cắt.", "Đúng. Mỗi giá trị stop_reason được xử lý theo đúng ý nghĩa của nó.", "Số công cụ không liên quan tới việc câu trả lời bị cắt ngang.", "Dừng dựa vào nội dung chữ vẫn là cách làm sai, còn tệ hơn."],
        trap: "“Khác tool_use” nghe giống “bằng end_turn”, nhưng thực ra gộp luôn cả trường hợp bị cắt ngang vào nhóm “đã xong”.",
      },
      {
        level: "hard",
        q: "Một cuộc trò chuyện hỗ trợ dài 40 lượt có chi phí tăng rất nhanh về cuối. Nguyên nhân và cách giảm phù hợp nhất là gì?",
        options: ["Model tự lưu toàn bộ hội thoại trong bộ nhớ nên tốn dần; đổi sang model nhỏ", "Mỗi lượt phải gửi lại cả hội thoại; dùng prompt caching và cắt gọn kết quả công cụ", "Phí tính theo số lượt nên càng về cuối càng đắt; chuyển các lượt sau sang Message Batches API cho rẻ", "Câu trả lời ngày càng dài; giảm max_tokens để giới hạn chi phí đầu ra"],
        en: { q: "A 40-turn support conversation gets much more expensive toward the end. What is the cause and the best way to reduce it?", options: ["The model stores the whole conversation in memory; switch to a smaller model", "Every turn resends the full conversation; use prompt caching and trim tool results", "Pricing is per turn, so later turns cost more; move later turns to the Message Batches API to save money", "Replies keep getting longer; lower max_tokens to cap output cost"] },
        answer: 1,
        explain: "Mỗi lần gọi đều gửi lại hướng dẫn, danh sách công cụ và toàn bộ hội thoại. Lưu đệm phần lặp lại và giảm kích thước kết quả công cụ tác động thẳng vào nguyên nhân.",
        notes: ["Model không lưu gì giữa các lần gọi.", "Đúng nguyên nhân và đúng cách giảm.", "Phí tính theo token, và trò chuyện cần phản hồi ngay nên Batch không phù hợp.", "Phần tăng chủ yếu nằm ở dữ liệu gửi đi (đầu vào), không phải câu trả lời."],
      },
    ],
  },

  /* ─────────────── 1-2 ─────────────── */
  "1-2": {
    advanced: `
<section class="adv-block">
  <h4>Vì sao nên để mọi thứ đi qua coordinator</h4>
  <p>Nếu các agent con được phép nói chuyện trực tiếp với nhau, hệ thống trở nên khó theo dõi: không ai biết chắc thông tin nào đã đi đâu, và một lỗi ở chỗ này có thể lan sang chỗ khác mà không ai hay. Khi mọi thông tin đều đi qua coordinator, bạn có một chỗ duy nhất để ghi nhật ký, xử lý lỗi và áp dụng chính sách.</p>
  <p>Cái giá phải trả là coordinator trở thành điểm tập trung: mọi dữ liệu đều phải đi qua nó. Với hầu hết hệ thống thật, đánh đổi này là đáng.</p>
</section>
<section class="adv-block">
  <h4>Coordinator nên kiểm tra lại trước khi kết thúc</h4>
  <p>Một coordinator tốt không chỉ giao việc một lần rồi ghép kết quả. Sau khi nhận bản tổng hợp, nó so lại với yêu cầu ban đầu: còn khía cạnh nào thiếu bằng chứng, nhận định nào mới chỉ có một nguồn. Sau đó nó giao thêm việc có mục tiêu cho những chỗ thiếu, rồi mới kết thúc.</p>
</section>
<section class="adv-block">
  <h4>Không phải câu hỏi nào cũng cần cả đội</h4>
  <p>Câu hỏi tra cứu đơn giản không cần bốn agent con chạy đủ quy trình. Coordinator nên đánh giá độ phức tạp của câu hỏi và chỉ gọi những agent con thật sự cần. Luôn chạy đủ quy trình cho mọi câu hỏi chỉ làm tăng chi phí và thời gian chờ, không làm tăng chất lượng.</p>
</section>
<section class="adv-block">
  <h4>Lần ra nguyên nhân khi báo cáo bị thiếu</h4>
  <ol class="steps-dg">
    <li>Xem danh sách việc coordinator đã giao. Nếu thiếu khía cạnh ngay ở đây, lỗi nằm ở bước chia việc.</li>
    <li>Nếu đã giao đủ, xem kết quả từng agent con. Thiếu ở đây thì lỗi nằm ở hướng dẫn hoặc công cụ của agent con.</li>
    <li>Nếu agent con đã trả đủ mà báo cáo vẫn thiếu, lỗi nằm ở bước tổng hợp, thường do agent tổng hợp không được nhận đủ dữ liệu.</li>
  </ol>
</section>`,
    traps: [
      {
        title: "Agent con nào cũng làm tốt mà báo cáo vẫn thiếu",
        level: "hard",
        scenario: "Đề tài: “Tác động của AI tới các ngành sáng tạo”. Nhật ký cho thấy ba agent con tìm kiếm (hội họa, thiết kế đồ họa, nhiếp ảnh) đều trả kết quả tốt, agent tổng hợp viết mạch lạc. Người đọc phàn nàn báo cáo không nhắc gì tới âm nhạc, văn học, điện ảnh.",
        bait: "Tăng số kết quả mỗi agent tìm kiếm phải lấy, hoặc đổi sang model mạnh hơn cho agent tổng hợp.",
        why: "Agent con chỉ làm đúng phần được giao, và cả ba phần được giao đều thuộc nghệ thuật thị giác. Lỗi nằm ở bước coordinator chia việc.",
        fix: ["Sửa hướng dẫn cho coordinator: trước khi giao việc, liệt kê các khía cạnh cần bao quát của đề tài.", "Thêm một bước tự kiểm tra: danh sách việc đã giao có phủ hết đề tài chưa?", "Thêm phần ghi chú độ bao phủ vào cuối báo cáo."],
      },
      {
        title: "Agent con muốn hỏi thẳng agent con khác",
        scenario: "Agent phân tích cần thêm nguồn. Một kỹ sư đề xuất cho agent phân tích quyền gọi trực tiếp agent tìm kiếm cho nhanh.",
        bait: "Đồng ý vì linh hoạt và nhanh hơn.",
        why: "Làm vậy phá vỡ mô hình đi qua coordinator: mất chỗ theo dõi chung, lỗi lan ra khó kiểm soát, và coordinator không còn biết phạm vi công việc thật sự.",
        fix: ["Agent phân tích trả về một yêu cầu rõ ràng, ví dụ “cần thêm nguồn về X vì Y”.", "Coordinator quyết định có giao thêm việc tìm kiếm hay không.", "Giữ nguyên quy tắc mọi trao đổi đều đi qua coordinator."],
      },
    ],
    quiz: [
      {
        level: "hard",
        q: "Hệ thống nghiên cứu luôn chạy đủ bốn agent con (tìm kiếm, phân tích, kiểm chứng, tổng hợp) cho mọi câu hỏi, kể cả câu tra cứu đơn giản. Chi phí và thời gian chờ đều cao. Nên cải thiện thế nào?",
        options: ["Gộp bốn agent con thành một agent lớn làm hết mọi việc để giảm số lần gọi API", "Coordinator đánh giá câu hỏi rồi chỉ gọi các agent con cần thiết", "Chuyển các agent con sang Batch API để giảm một nửa chi phí", "Bỏ hẳn agent kiểm chứng vì nó tốn thời gian nhất"],
        en: { q: "A research system always runs all four subagents (search, analysis, verification, synthesis) for every question, even simple lookups. Cost and latency are both high. How should you improve it?", options: ["Merge the four subagents into one large agent that does everything, to reduce API calls", "Let the coordinator assess the question and call only the subagents it needs", "Move the subagents to the Batch API to halve the cost", "Remove the verification subagent because it takes the longest"] },
        answer: 1,
        explain: "Coordinator chọn agent con theo độ phức tạp của câu hỏi, giảm chi phí mà không làm giảm chất lượng của những câu hỏi khó.",
        notes: ["Mất lợi ích của việc chia vai trò và tách ngữ cảnh.", "Đúng: chọn agent con theo nhu cầu.", "Người dùng đang chờ nên Batch không phù hợp.", "Câu hỏi khó cần kiểm chứng sẽ bị giảm chất lượng."],
        trap: "Bỏ hẳn agent kiểm chứng cũng giảm chi phí, nhưng là cắt bỏ một cách máy móc thay vì chọn theo nhu cầu.",
      },
    ],
  },

  /* ─────────────── 1-3 ─────────────── */
  "1-3": {
    widgets: ["subagentTrace", "contextPassing"],
    advanced: `
<section class="adv-block">
  <h4>Khai báo một agent con gồm những gì</h4>
  <p>Mỗi loại agent con được khai báo bằng một <code>AgentDefinition</code> có bốn phần: <code>description</code> là đoạn mô tả để coordinator biết khi nào nên gọi agent này; <code>prompt</code> là hướng dẫn riêng cho agent con; <code>tools</code> là danh sách công cụ nó được dùng; và <code>model</code> là model sẽ chạy nó, có thể chọn model rẻ hơn cho việc đơn giản.</p>
  <p>Khi giao việc, coordinator gọi công cụ Task với hai thông tin chính: chọn loại agent con nào (<code>subagent_type</code>) và nội dung nhiệm vụ (<code>prompt</code>). Nội dung nhiệm vụ là <b>toàn bộ</b> những gì agent con biết khi bắt đầu làm việc.</p>
</section>
<section class="adv-block">
  <h4>Một mẫu phiếu giao việc rõ ràng</h4>
  <pre><code>Mục tiêu: ...
Thế nào là hoàn thành: ...
Dữ liệu đầu vào:
&lt;source id="S1" url="..." date="2025-09"&gt;
  đoạn trích ...
&lt;/source&gt;
Trả kết quả theo dạng: {findings: [{claim, source_id, quote}]}
Giới hạn: tối đa 8 phát hiện, không tìm thêm nguồn mới.</code></pre>
  <p>Các thẻ như <code>&lt;source&gt;</code> giúp tách rõ nội dung với thông tin nguồn, nhờ đó các bước sau trích dẫn chính xác. Chỉ đưa vào những dữ liệu đã chọn lọc; dán cả lịch sử trò chuyện của coordinator vào vừa tốn kém vừa gây nhiễu.</p>
</section>
<section class="adv-block">
  <h4>Khi nào chạy song song, khi nào chạy lần lượt</h4>
  <p>Chạy song song khi các phần việc <b>không phụ thuộc nhau</b>, ví dụ tìm kiếm bốn chủ đề khác nhau. Khi đó thời gian chờ bằng thời gian của agent con chậm nhất. Nếu một bước cần kết quả của bước khác, ví dụ tổng hợp cần kết quả tìm kiếm, thì phải chạy lần lượt.</p>
  <p>Coordinator chỉ nhận về <b>kết quả cuối cùng</b> của mỗi agent con, không nhận các bước trung gian. Vì vậy hãy yêu cầu kết quả cuối đó gọn và có cấu trúc.</p>
</section>`,
    traps: [
      {
        title: "Agent tổng hợp “bịa” nguồn",
        level: "hard",
        scenario: "Coordinator giao cho agent tổng hợp: “Tổng hợp các phát hiện ở trên thành báo cáo có trích nguồn.” Báo cáo có trích dẫn, nhưng nhiều đường dẫn không tồn tại.",
        bait: "Thêm vào hướng dẫn của agent tổng hợp: “chỉ dùng nguồn thật, không được bịa”.",
        why: "Chữ “ở trên” chỉ có nghĩa với coordinator. Agent tổng hợp không nhìn thấy lịch sử của coordinator, nên nó không có dữ liệu nguồn nào và đành tự tạo ra.",
        fix: ["Dán trực tiếp các phát hiện (kèm đường dẫn và ngày) vào nhiệm vụ giao cho agent tổng hợp, theo định dạng rõ ràng.", "Yêu cầu agent tổng hợp chỉ trích dẫn theo mã nguồn có trong dữ liệu được giao.", "Thêm bước kiểm tra tự động: mọi đường dẫn trong báo cáo phải thuộc danh sách nguồn đầu vào."],
      },
      {
        title: "Coordinator không bao giờ giao việc",
        scenario: "Đã khai báo đầy đủ hai agent con là search và synth, nhưng coordinator vẫn tự làm mọi thứ và chưa lần nào giao việc.",
        bait: "Viết lại mô tả của agent con cho hấp dẫn hơn.",
        why: "Coordinator giao việc thông qua công cụ Task. Nếu danh sách <code>allowedTools</code> của nó không có \"Task\", nó không có công cụ nào để giao việc.",
        fix: ["Thêm \"Task\" vào allowedTools của coordinator.", "Sau đó mới tinh chỉnh mô tả để coordinator chọn đúng agent con."],
      },
    ],
    quiz: [
      {
        level: "hard",
        q: "Agent tổng hợp cần biết cả kết quả tìm kiếm lẫn những truy vấn mà agent tìm kiếm đã thử nhưng không ra kết quả. Thiết kế nào đúng?",
        options: ["Bật chế độ chia sẻ ngữ cảnh để agent tổng hợp thấy mọi thứ agent tìm kiếm đã làm", "Agent tìm kiếm trả kết quả có cấu trúc gồm phát hiện và truy vấn đã thử; coordinator chuyển tiếp", "Cho agent tổng hợp đọc toàn bộ nhật ký chạy của agent tìm kiếm", "Cấp cho agent tổng hợp quyền tìm kiếm web để tự chạy lại các truy vấn và xem truy vấn nào không ra kết quả"],
        en: { q: "The synthesis agent needs both the search results and the queries the search agent tried that returned nothing. Which design is correct?", options: ["Enable context sharing so the synthesis agent sees everything the search agent did", "Have the search agent return structured output with findings and attempted queries; the coordinator forwards both", "Let the synthesis agent read the search agent's full execution log", "Give the synthesis agent web search so it can rerun the queries itself and see which ones return nothing"] },
        answer: 1,
        explain: "Coordinator chỉ nhận kết quả cuối của agent con. Muốn truyền thông tin gì thì phải yêu cầu thông tin đó nằm trong kết quả cuối, rồi chuyển đi một cách rõ ràng.",
        notes: ["Không có cơ chế tự động chia sẻ ngữ cảnh giữa các agent con.", "Đúng: thiết kế kết quả có cấu trúc và truyền đi rõ ràng.", "Nhật ký dài, nhiều thông tin thừa, và phá vỡ việc tách ngữ cảnh.", "Agent tổng hợp đi tìm lại là làm trùng việc và vượt vai trò."],
        trap: "Cách “bật chế độ chia sẻ ngữ cảnh” nghe như một tính năng có thật, nhưng việc tách ngữ cảnh giữa các agent con là thiết kế có chủ đích.",
      },
    ],
  },

  /* ─────────────── 1-4 ─────────────── */
  "1-4": {
    widgets: ["refundGate", "enforcement"],
    advanced: `
<section class="adv-block">
  <h4>Các mức độ bắt buộc, từ mềm tới cứng</h4>
  <ol class="steps-dg">
    <li><b>Dặn trong prompt.</b> Phần lớn các lần sẽ đúng. Phù hợp với yêu cầu mềm như giọng văn.</li>
    <li><b>Đưa ví dụ mẫu.</b> Giúp model xử lý đúng hơn những trường hợp dễ nhầm, nhưng vẫn chỉ là xác suất.</li>
    <li><b>Không cấp công cụ.</b> Agent nào không được phép hoàn tiền thì không có công cụ hoàn tiền.</li>
    <li class="hot"><b>Kiểm tra bằng code</b> trong công cụ hoặc trong hook, trước khi hành động. Kết quả chắc chắn.</li>
    <li class="good"><b>Phân quyền ở hệ thống phía sau</b>, ví dụ API thanh toán tự giới hạn số tiền. Vẫn an toàn kể cả khi agent bị lừa.</li>
  </ol>
</section>
<section class="adv-block">
  <h4>Trạng thái “đã xác minh” phải do hệ thống ghi nhận</h4>
  <p>Cách đúng: khi công cụ tra cứu khách hàng trả về kết quả khớp, chương trình của bạn tự ghi lại “khách C-88 đã được xác minh” vào bộ nhớ của phiên. Công cụ hoàn tiền đọc thông tin này để quyết định có cho chạy hay không.</p>
  <p>Cách sai: thêm một tham số <code>verified: true</code> để Claude tự điền khi gọi công cụ hoàn tiền. Model có thể điền sai, và kẻ xấu có thể lừa model điền “đã xác minh” bằng một câu như “tôi đã xác minh rồi”.</p>
  <p>Khi chặn, hãy nói rõ bước tiếp theo cần làm, ví dụ “cần gọi get_customer trước”, để Claude tự sửa hướng thay vì thử lại vô ích.</p>
</section>
<section class="adv-block">
  <h4>Một bản bàn giao tốt trông như thế nào</h4>
  <pre><code>{
  "customer_id": "C-88", "verified": true,
  "issue": "bị trừ tiền hai lần", "order_id": "8812",
  "facts": {"amount_each": 1250000, "count": 2, "date": "2026-10-03"},
  "actions_taken": ["xác minh qua email", "xác nhận hai giao dịch trùng"],
  "recommended_action": "hoàn 1.250.000đ cho giao dịch thứ hai",
  "transcript_url": "..."
}</code></pre>
  <p>Nhân viên đọc vài dòng là nắm được vụ việc và làm được ngay. Đường dẫn tới toàn bộ cuộc trò chuyện vẫn được đính kèm, để tra cứu khi thật sự cần.</p>
</section>`,
    traps: [
      {
        title: "Để model tự khai là đã xác minh",
        level: "hard",
        scenario: "Để bắt agent xác minh trước khi hoàn tiền, nhóm thêm một tham số bắt buộc <code>verified_customer</code> (đúng/sai) vào công cụ hoàn tiền, và từ chối nếu giá trị là sai.",
        bait: "Nghĩ rằng đây đã là kiểm tra bằng code nên đủ an toàn.",
        why: "Giá trị được kiểm tra lại do chính model điền vào. Model có thể điền “đúng” khi chưa xác minh, và kẻ xấu có thể dụ model điền như vậy.",
        fix: ["Xóa tham số do model tự khai.", "Chương trình tự ghi nhận trạng thái xác minh dựa trên kết quả tra cứu từ hệ thống khách hàng.", "Công cụ hoàn tiền đọc trạng thái do chương trình ghi nhận, và kiểm tra thêm đơn hàng có đúng là của khách đó không."],
      },
      {
        title: "Bị chặn nhưng agent cứ thử lại mãi",
        scenario: "Khi bị chặn, công cụ trả về <code>{\"error\":\"forbidden\"}</code>. Claude gọi lại lệnh hoàn tiền sáu lần, rồi xin lỗi khách rằng hệ thống đang gặp sự cố.",
        bait: "Thêm vào prompt: “nếu bị forbidden thì đừng thử lại”.",
        why: "Thông báo lỗi không nói vì sao bị chặn và cần làm gì, nên Claude không biết là phải xác minh khách trước.",
        fix: ["Trả lỗi rõ ràng: thiếu điều kiện gì, và gợi ý bước tiếp theo, ví dụ “hãy hỏi email của khách rồi gọi get_customer”.", "Ở phía chương trình, phát hiện việc thử lại liên tục để làm lưới an toàn."],
      },
      {
        title: "Bàn giao bằng nguyên đoạn chat",
        scenario: "Khi chuyển cho nhân viên, hệ thống gửi kèm 140 tin nhắn. Thời gian xử lý của nhân viên tăng gấp đôi, và khách phải kể lại từ đầu.",
        bait: "Thêm một câu tóm tắt ở đầu đoạn chat.",
        why: "Một câu tóm tắt vẫn thiếu những con số và thông tin “đã làm gì” mà nhân viên cần để xử lý ngay.",
        fix: ["Dùng bản bàn giao có cấu trúc: khách là ai, dữ kiện, nguyên nhân, việc đã làm, đề xuất.", "Đính kèm đường dẫn tới đoạn chat để tra khi cần, không bắt nhân viên đọc."],
      },
    ],
    quiz: [
      {
        level: "hard",
        q: "Nhóm thêm tham số verified: true vào công cụ hoàn tiền và từ chối nếu tham số là false. Vẫn có trường hợp hoàn tiền cho khách chưa xác minh. Lỗi thiết kế cốt lõi là gì?",
        options: ["Thiếu ví dụ mẫu trong prompt cho thấy khi nào được điền verified: true và khi nào phải điền false", "Điều kiện dựa vào giá trị model tự điền, không phải trạng thái hệ thống ghi nhận", "Nên kiểm tra trong hook PostToolUse thay vì bên trong công cụ", "Model quá nhỏ nên điền sai tham số; cần đổi model lớn hơn"],
        en: { q: "The team adds a verified: true parameter to the refund tool and rejects calls where it is false. Unverified customers still get refunds sometimes. What is the core design flaw?", options: ["The prompt lacks examples showing when verified: true may be set and when it must be false", "The check relies on a value the model fills in, not on state the system recorded", "The check should be in a PostToolUse hook instead of inside the tool", "The model is too small and fills parameters wrongly; use a bigger model"] },
        answer: 1,
        explain: "Một bước kiểm tra chỉ đáng tin khi dữ liệu nó kiểm tra không nằm trong tay model.",
        notes: ["Thêm ví dụ vẫn chỉ cải thiện theo xác suất.", "Đúng: phải đọc trạng thái do chương trình ghi nhận.", "PostToolUse chạy sau khi tiền đã được chuyển.", "Model lớn hơn vẫn có thể điền sai hoặc bị lừa."],
        trap: "Cách làm sai này trông giống “kiểm tra bằng code” nên dễ được coi là đủ.",
      },
    ],
  },

  /* ─────────────── 1-5 ─────────────── */
  "1-5": {
    advanced: `
<section class="adv-block">
  <h4>Hook nhận được gì và trả lại gì</h4>
  <p>Khi một công cụ sắp chạy, hook PreToolUse nhận được tên công cụ (<code>tool_name</code>) và các tham số Claude định truyền vào (<code>tool_input</code>). Hook có thể trả lại một trong ba quyết định: <code>allow</code> (cho chạy), <code>deny</code> (chặn, kèm lý do) hoặc <code>ask</code> (hỏi người dùng). Khi chặn, lý do được chuyển cho Claude để nó đổi hướng, ví dụ chuyển sang quy trình duyệt.</p>
  <p>Hook PostToolUse nhận thêm kết quả của công cụ (<code>tool_response</code>), và có thể bổ sung hoặc chỉnh lại thông tin trước khi Claude đọc.</p>
</section>
<section class="adv-block">
  <h4>Tên công cụ phải khớp chính xác</h4>
  <p>Mỗi hook có một <code>matcher</code> để chỉ định nó áp dụng cho công cụ nào. Nếu ghi một tên đơn giản, nó phải khớp chính xác. Riêng công cụ đến từ máy chủ MCP có tên đầy đủ dạng <code>mcp__&lt;tên-máy-chủ&gt;__&lt;tên-công-cụ&gt;</code>. Vì vậy matcher <code>process_refund</code> sẽ <b>không</b> khớp với <code>mcp__billing__process_refund</code>, và hook không bao giờ chạy. Có thể dùng biểu thức như <code>mcp__billing__.*</code> để áp dụng cho mọi công cụ của máy chủ billing.</p>
</section>
<section class="adv-block">
  <h4>Khi nào dùng hook, khi nào kiểm tra ngay trong công cụ</h4>
  <p>Nếu quy tắc chỉ liên quan tới một công cụ và bạn sửa được code của công cụ đó, kiểm tra ngay bên trong công cụ là đủ. Hook phù hợp hơn khi quy tắc áp dụng chung cho nhiều công cụ (ví dụ chuẩn hóa ngày tháng cho mọi máy chủ MCP), hoặc khi công cụ do bên thứ ba viết và bạn không sửa được.</p>
  <p>Hook chạy ở mỗi lần gọi công cụ, nên cần chạy nhanh và tự xử lý lỗi của chính nó, để một lỗi trong hook không làm dừng cả agent.</p>
</section>`,
    traps: [
      {
        title: "Hook không bao giờ chạy",
        level: "hard",
        scenario: "Nhóm cấu hình hook PreToolUse với <code>matcher: \"process_refund\"</code>. Công cụ hoàn tiền đến từ máy chủ MCP tên <code>billing</code>. Lệnh hoàn $900 vẫn lọt qua, và nhật ký không ghi nhận lần nào hook được gọi.",
        bait: "Nghĩ rằng điều kiện trong hook bị sai, rồi đi sửa phép so sánh số tiền.",
        why: "Tên thật của công cụ là <code>mcp__billing__process_refund</code>. Matcher dạng tên đơn giản phải khớp chính xác, nên không khớp và hook không được gọi.",
        fix: ["Ghi tên đầy đủ hoặc dùng biểu thức: <code>mcp__billing__process_refund</code> hoặc <code>mcp__billing__.*</code>.", "Viết một bài test giả lập lời gọi công cụ và kiểm tra hook có được gọi hay không.", "Ghi nhật ký mỗi khi hook chạy để phát hiện sớm."],
      },
      {
        title: "Chặn hoàn tiền bằng PostToolUse",
        scenario: "Một kỹ sư đặt phép kiểm tra hạn mức vào PostToolUse: nếu số tiền lớn hơn 500 thì báo lỗi cho Claude.",
        bait: "Nghĩ rằng ít nhất cũng ngăn được Claude báo “thành công” cho khách.",
        why: "PostToolUse chạy sau khi công cụ hoàn tiền đã thực thi, tức là tiền đã được chuyển. Muốn ngăn hành động thì phải chặn trước khi nó xảy ra.",
        fix: ["Chuyển phép kiểm tra sang PreToolUse, trả về quyết định deny kèm lý do.", "Chỉ dùng PostToolUse để xử lý kết quả: chuẩn hóa, ghi nhật ký."],
      },
    ],
    quiz: [
      {
        level: "hard",
        q: "Agent dùng ba máy chủ MCP do bên thứ ba viết (không sửa được code), mỗi máy chủ trả ngày tháng theo một định dạng khác nhau. Bạn muốn mọi ngày tháng tới tay Claude đều theo cùng một định dạng. Cách tốt nhất?",
        options: ["Sao chép code của cả ba máy chủ về và tự sửa định dạng ngày", "Hook PostToolUse cho mọi công cụ MCP, chuẩn hóa ngày trước khi tới Claude", "Dặn Claude trong system prompt tự quy đổi mọi ngày về một định dạng", "Hook PreToolUse yêu cầu máy chủ trả ngày theo đúng định dạng mong muốn"],
        en: { q: "An agent uses three third-party MCP servers (you cannot change their code), each returning dates in a different format. You want every date that reaches Claude to use one format. What is the best approach?", options: ["Fork the code of all three servers and fix the date format yourself", "A PostToolUse hook for all MCP tools that normalizes dates before they reach Claude", "Tell Claude in the system prompt to convert every date to one format", "A PreToolUse hook that asks the servers to return the desired date format"] },
        answer: 1,
        explain: "PostToolUse là điểm xử lý chung cho mọi công cụ MCP, cho kết quả nhất quán mà không cần sửa máy chủ.",
        notes: ["Tốn công bảo trì lâu dài, phải theo dõi mọi bản cập nhật của bên thứ ba.", "Đúng: một hook xử lý cho mọi máy chủ.", "Chỉ làm đúng theo xác suất.", "PreToolUse chạy trước khi có kết quả, không đổi được định dạng máy chủ trả về."],
      },
    ],
  },

  /* ─────────────── 1-6 ─────────────── */
  "1-6": {
    widgets: ["decomposition", "sessionBranches"],
    advanced: `
<section class="adv-block">
  <h4>Review thay đổi lớn theo hai lượt</h4>
  <ol class="steps-dg">
    <li><b>Lượt xem từng file.</b> Mỗi file được xem riêng trong một lần gọi, để sự chú ý không bị chia sẻ cho các file khác.</li>
    <li><b>Tóm tắt phần giao tiếp.</b> Từ mỗi file, rút ra những gì file khác cần biết: hàm nào được dùng bên ngoài, dữ liệu có dạng gì, file đó đang giả định điều gì.</li>
    <li class="hot"><b>Lượt xem liên kết.</b> Đọc các bản tóm tắt đó cùng lúc để tìm lỗi ở chỗ nối giữa các file, ví dụ một bên gửi dữ liệu chưa chuẩn hóa trong khi bên kia giả định đã chuẩn hóa.</li>
  </ol>
</section>
<section class="adv-block">
  <h4>Chọn cách quản lý phiên</h4>
  <p><b>Tiếp tục phiên cũ</b> (<code>claude --continue</code> cho phiên gần nhất, <code>claude --resume &lt;tên&gt;</code> cho một phiên cụ thể) phù hợp khi bạn quay lại công việc mà code chưa thay đổi nhiều.</p>
  <p><b>Tách nhánh</b> (fork) phù hợp khi bạn đã khảo sát xong và muốn thử hai hướng khác nhau từ cùng điểm xuất phát, mà không để hai hướng ảnh hưởng lẫn nhau.</p>
  <p><b>Mở phiên mới kèm bản tóm tắt</b> phù hợp khi code đã đổi nhiều, hoặc phiên cũ đã quá dài. Dấu hiệu nên bỏ phiên cũ: Claude nhắc tới hàm hay file không còn tồn tại, hoặc ngữ cảnh đã gần đầy.</p>
</section>`,
    traps: [
      {
        title: "Mở lại phiên cũ sau một đợt sửa code lớn",
        level: "hard",
        scenario: "Thứ Hai bạn điều tra lỗi thanh toán trong phiên <code>pay-bug</code>. Thứ Tư, đồng nghiệp tách <code>PaymentService</code> thành ba file. Bạn mở lại phiên cũ, và Claude tự tin đề xuất sửa dòng 142 của <code>PaymentService.ts</code>, một file không còn tồn tại.",
        bait: "Cứ hỏi tiếp trong phiên cũ, và nhắc Claude rằng “file đã thay đổi rồi”.",
        why: "Phiên cũ chứa hàng chục kết quả đọc file đã lỗi thời. Một câu nhắc không xóa được những thông tin đó, nên Claude vẫn lập luận dựa trên phiên bản code cũ.",
        fix: ["Lấy từ phiên cũ (hoặc tự viết) một bản tóm tắt: giả thuyết, bằng chứng, những khả năng đã loại trừ.", "Mở phiên mới, đưa vào bản tóm tắt và danh sách file đã thay đổi (ví dụ kết quả của <code>git diff --stat</code>).", "Yêu cầu Claude đọc lại code hiện tại trước khi kết luận."],
      },
      {
        title: "Dùng cách chia việc linh hoạt cho một quy trình cố định",
        scenario: "Quy trình trích xuất hóa đơn (đọc ảnh, trích các trường, kiểm tra tổng) được chuyển sang để coordinator tự quyết định bước tiếp theo. Kết quả là thỉnh thoảng bước kiểm tra tổng bị bỏ qua.",
        bait: "Thêm vào hướng dẫn của coordinator: “nhớ luôn kiểm tra tổng tiền”.",
        why: "Các bước đã biết trước và đều bắt buộc, nên một chuỗi cố định đáng tin cậy hơn. Để model tự quyết ở đây chỉ thêm rủi ro.",
        fix: ["Quay lại chuỗi bước cố định, viết bằng code.", "Dùng Claude cho từng bước, nhưng không giao cho Claude việc quyết định có làm các bước bắt buộc hay không."],
      },
    ],
    quiz: [
      {
        level: "hard",
        q: "Bạn đã khảo sát kỹ codebase trong một phiên và muốn so sánh hai hướng tối ưu: dùng Redis hay dùng bộ nhớ trong. Code không thay đổi gì. Cách hiệu quả nhất?",
        options: ["Mở hai phiên mới hoàn toàn và khảo sát lại codebase từ đầu", "Fork phiên khảo sát thành hai nhánh, mỗi nhánh thử một hướng", "Thử lần lượt cả hai hướng trong cùng một phiên rồi so sánh", "Resume phiên cũ và để Claude tự chọn hướng tốt hơn"],
        en: { q: "You explored a codebase thoroughly in one session and want to compare two optimizations: Redis versus in-memory caching. The code has not changed. What is the most efficient approach?", options: ["Open two brand-new sessions and explore the codebase again from scratch", "Fork the exploration session into two branches, one per approach", "Try both approaches one after another in the same session, then compare", "Resume the old session and let Claude pick the better approach"] },
        answer: 1,
        explain: "Tách nhánh giữ nguyên phần khảo sát (vẫn còn đúng vì code không đổi) và cho hai hướng thử nghiệm chạy độc lập.",
        notes: ["Lãng phí công khảo sát đã làm.", "Đúng.", "Hai hướng làm lẫn ngữ cảnh của nhau.", "Không so sánh được hai hướng một cách độc lập."],
        trap: "Nếu đề nói code đã thay đổi nhiều, đáp án sẽ chuyển thành “mở phiên mới kèm bản tóm tắt”. Hãy đọc kỹ điều kiện.",
      },
    ],
  },
});
