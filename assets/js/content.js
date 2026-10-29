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
      title: "Tổng quan kỳ thi",
      short: "Tổng quan",
      weight: 0,
      color: "slate",
      summary: "Cấu trúc đề, cách tính điểm, các kịch bản thực tế và lộ trình ôn tập.",
      sections: [
        {
          id: "0-1",
          title: "Định dạng kỳ thi & cách tính điểm",
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
              answer: 1,
              explain: "Agentic Architecture & Orchestration chiếm khoảng 27% — tương đương ~16 câu trong 60 câu.",
            },
          ],
        },
        {
          id: "0-2",
          title: "Các kịch bản thi & lộ trình ôn tập",
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
              options: ["Chọn đáp án dài nhất", "Xác định kịch bản và ràng buộc chính (độ tin cậy, chi phí, độ trễ)", "Tìm từ khóa trùng với tên công cụ", "Loại các đáp án có nhắc đến hook"],
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
      short: "Kiến trúc Agent",
      weight: 27,
      color: "violet",
      summary: "Vòng lặp agent, hệ thống đa agent, subagent, hook, phân rã tác vụ và quản lý phiên.",
      sections: [
        {
          id: "1-1",
          title: "Vòng lặp agent (agentic loop)",
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
                "Thêm vào system prompt: 'chỉ trả lời text khi đã xong'",
                "Kết thúc vòng lặp khi stop_reason là \"end_turn\", tiếp tục khi là \"tool_use\"",
                "Giới hạn cứng 10 vòng lặp rồi dừng",
                "Tìm các cụm từ như 'hoàn thành' trong câu trả lời",
              ],
              answer: 1,
              explain: "stop_reason là tín hiệu có cấu trúc, đáng tin cậy. Response có thể vừa chứa text vừa chứa tool_use, nên kiểm tra text là sai.",
            },
            {
              q: "Sau khi thực thi công cụ, kết quả cần được xử lý thế nào?",
              options: [
                "Lưu vào database, không cần gửi lại cho Claude",
                "Nối vào messages dưới dạng tool_result rồi gửi yêu cầu tiếp theo",
                "Ghi đè system prompt bằng kết quả",
                "Chỉ gửi lại nếu công cụ báo lỗi",
              ],
              answer: 1,
              explain: "Claude cần thấy tool_result trong lịch sử hội thoại để suy luận bước tiếp theo.",
            },
          ],
        },
        {
          id: "1-2",
          title: "Hệ thống đa agent: coordinator – subagent",
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
                "Subagent tìm kiếm dùng truy vấn quá ngắn",
                "Coordinator phân rã chủ đề thành các tác vụ con quá hẹp",
                "Subagent tổng hợp bị giới hạn token",
                "Cần thêm subagent kiểm tra chính tả",
              ],
              answer: 1,
              explain: "Subagent chỉ làm những gì được giao. Nếu tất cả đều làm đúng mà vẫn thiếu, lỗi nằm ở bước phân rã.",
            },
            {
              q: "Subagent phân tích không biết các nguồn mà subagent tìm kiếm đã thu thập. Cách khắc phục?",
              options: [
                "Bật tùy chọn chia sẻ bộ nhớ toàn cục giữa các subagent",
                "Coordinator đưa trực tiếp kết quả tìm kiếm vào prompt của subagent phân tích",
                "Cho subagent phân tích tự gọi lại subagent tìm kiếm",
                "Tăng max_tokens cho subagent phân tích",
              ],
              answer: 1,
              explain: "Ngữ cảnh subagent là cô lập; coordinator phải truyền thông tin cần thiết một cách tường minh.",
            },
          ],
        },
        {
          id: "1-3",
          title: "Gọi subagent & truyền ngữ cảnh",
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
                "Gộp 4 subagent thành một subagent lớn",
                "Phát ra 4 lệnh gọi Task trong cùng một response để chạy song song",
                "Chuyển sang Message Batches API",
                "Giảm số nguồn tìm kiếm xuống còn 1",
              ],
              answer: 1,
              explain: "Các tác vụ độc lập nên được gọi song song trong một lượt. Batch API không phù hợp vì có độ trễ tới 24 giờ.",
            },
            {
              q: "Coordinator không thể tạo subagent nào. Kiểm tra điều gì đầu tiên?",
              options: ["allowedTools có chứa \"Task\" không", "Phiên bản model", "Biến môi trường ANTHROPIC_LOG", "Kích thước system prompt"],
              answer: 0,
              explain: "Subagent được gọi qua công cụ Task; thiếu nó trong allowedTools thì coordinator không thể ủy thác.",
            },
          ],
        },
        {
          id: "1-4",
          title: "Ép buộc quy trình & bàn giao (handoff)",
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
                "Viết hoa và lặp lại yêu cầu trong system prompt",
                "Thêm few-shot ví dụ về việc xác minh",
                "Thêm cổng kiểm tra bằng code chặn process_refund cho tới khi có ID khách hàng đã xác minh",
                "Đổi sang model lớn hơn",
              ],
              answer: 2,
              explain: "Với yêu cầu tuân thủ tuyệt đối có hệ quả tài chính, cần đảm bảo mang tính quyết định — prompt chỉ cho xác suất.",
            },
            {
              q: "Khi chuyển cuộc hội thoại cho nhân viên, thông tin nào hữu ích nhất?",
              options: [
                "Toàn bộ transcript thô",
                "Tóm tắt có cấu trúc: ID khách hàng, nguyên nhân gốc, số tiền liên quan, hành động đề xuất",
                "Chỉ câu hỏi cuối cùng của khách",
                "Điểm cảm xúc (sentiment) của khách",
              ],
              answer: 1,
              explain: "Nhân viên cần nắm vấn đề nhanh mà không phải đọc lại toàn bộ hội thoại.",
            },
          ],
        },
        {
          id: "1-5",
          title: "Hook trong Agent SDK",
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
                "Thêm hướng dẫn chuyển đổi định dạng vào system prompt",
                "Dùng hook PostToolUse chuẩn hóa mọi ngày về ISO 8601 trước khi model nhận",
                "Yêu cầu người dùng nhập ngày theo một định dạng",
                "Dùng PreToolUse để chặn công cụ trả ngày sai định dạng",
              ],
              answer: 1,
              explain: "PostToolUse biến đổi kết quả công cụ một cách nhất quán, không phụ thuộc vào việc model có làm theo hướng dẫn hay không.",
            },
            {
              q: "Chính sách: hoàn tiền trên $500 phải do người duyệt. Hook nào phù hợp?",
              options: ["PostToolUse trên process_refund", "PreToolUse chặn process_refund khi số tiền > 500 và chuyển sang escalate", "Hook khi phiên kết thúc", "Không cần hook, chỉ cần prompt"],
              answer: 1,
              explain: "Phải chặn trước khi hành động xảy ra — PostToolUse thì đã muộn.",
            },
          ],
        },
        {
          id: "1-6",
          title: "Phân rã tác vụ & quản lý phiên",
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
                "Dùng model có context window lớn hơn",
                "Phân tích từng file riêng rồi thêm một lượt tích hợp để tìm vấn đề xuyên file",
                "Yêu cầu model 'đọc kỹ hơn'",
                "Chỉ review 5 file đầu tiên",
              ],
              answer: 1,
              explain: "Chia nhỏ giúp mỗi lượt có chú ý tập trung; lượt tích hợp bắt các vấn đề luồng dữ liệu giữa file.",
            },
            {
              q: "Bạn quay lại một phiên điều tra sau khi đồng nghiệp refactor lớn. Cách tiếp cận đáng tin cậy nhất?",
              options: [
                "Resume phiên cũ và tiếp tục như bình thường",
                "Bắt đầu phiên mới với bản tóm tắt phát hiện trước đó và nêu rõ file nào đã thay đổi",
                "Xóa toàn bộ ghi chú và điều tra lại từ đầu",
                "Fork phiên cũ thành 3 nhánh",
              ],
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
      short: "Công cụ & MCP",
      weight: 18,
      color: "teal",
      summary: "Mô tả công cụ, lỗi có cấu trúc, phân phối công cụ, cấu hình MCP server và công cụ tích hợp sẵn.",
      sections: [
        {
          id: "2-1",
          title: "Thiết kế mô tả công cụ",
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
                "Thêm classifier định tuyến trước agent",
                "Viết lại mô tả hai công cụ: nêu đầu vào, ví dụ truy vấn và khi nào dùng công cụ nào",
                "Gộp hai công cụ làm một",
                "Fine-tune model trên log hội thoại",
              ],
              answer: 1,
              explain: "Mô tả rõ ràng, phân biệt là cách khắc phục trực tiếp và rẻ nhất cho lỗi chọn công cụ.",
            },
          ],
        },
        {
          id: "2-2",
          title: "Phản hồi lỗi có cấu trúc trong MCP",
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
                "Timeout quá dài",
                "Lỗi truy cập bị che giấu thành kết quả rỗng hợp lệ — cần trả isError với errorCategory transient",
                "Agent cần prompt tốt hơn",
                "Nên dùng Batch API",
              ],
              answer: 1,
              explain: "Agent không thể phân biệt 'không có dữ liệu' với 'không truy cập được' nếu công cụ che lỗi.",
            },
            {
              q: "Khách yêu cầu hoàn tiền cho đơn đã quá hạn 90 ngày. Công cụ nên trả về gì?",
              options: [
                "isError, category business, isRetryable false, kèm lý do dễ hiểu",
                "isError, category transient, isRetryable true",
                "Thành công với số tiền 0",
                "Ném exception không có thông điệp",
              ],
              answer: 0,
              explain: "Đây là vi phạm quy tắc nghiệp vụ — thử lại cũng vô ích, agent cần giải thích cho khách.",
            },
          ],
        },
        {
          id: "2-3",
          title: "Phân phối công cụ & tool_choice",
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
              answer: 1,
              explain: "\"any\" bắt buộc model gọi một công cụ, đồng thời vẫn để model chọn schema phù hợp với loại tài liệu.",
            },
            {
              q: "Subagent tổng hợp thường tự đi tìm kiếm web thay vì dùng tài liệu được cung cấp. Nguyên nhân khả dĩ?",
              options: [
                "Model quá nhỏ",
                "Subagent được cấp công cụ tìm kiếm vốn không thuộc vai trò của nó",
                "Coordinator chạy song song",
                "Thiếu hook PostToolUse",
              ],
              answer: 1,
              explain: "Công cụ ngoài vai trò tạo cơ hội dùng sai. Giới hạn công cụ theo vai trò.",
            },
          ],
        },
        {
          id: "2-4",
          title: "Cấu hình MCP server",
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
                "Mỗi người tự thêm vào ~/.claude.json",
                "Commit .mcp.json với \"${GITHUB_TOKEN}\", mỗi người đặt biến môi trường riêng",
                "Commit .mcp.json chứa token thật trong repo private",
                "Gửi file cấu hình qua chat nội bộ",
              ],
              answer: 1,
              explain: ".mcp.json ở project scope được chia sẻ qua git; biến môi trường giữ secret ngoài repo.",
            },
          ],
        },
        {
          id: "2-5",
          title: "Công cụ tích hợp sẵn: Read, Write, Edit, Grep, Glob, Bash",
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
              options: ["Glob", "Grep", "Read từng file", "Edit"],
              answer: 1,
              explain: "Grep tìm theo nội dung bên trong file.",
            },
            {
              q: "Edit thất bại vì đoạn văn bản neo xuất hiện 3 lần trong file. Phương án dự phòng hợp lý?",
              options: ["Gọi Edit lặp lại cho đến khi thành công", "Read toàn bộ file rồi Write phiên bản đã sửa", "Dùng Glob", "Xóa file và tạo lại thủ công"],
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
      short: "Claude Code",
      weight: 20,
      color: "orange",
      summary: "Phân cấp CLAUDE.md, slash command & skill, rule theo đường dẫn, plan mode, tinh chỉnh lặp và CI/CD.",
      sections: [
        {
          id: "3-1",
          title: "Phân cấp CLAUDE.md",
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
                "Dev mới dùng phiên bản Claude Code cũ",
                "Quy ước nằm trong ~/.claude/CLAUDE.md của trưởng nhóm, không nằm trong repo",
                "File .mcp.json bị thiếu",
                "Dev mới chưa bật plan mode",
              ],
              answer: 1,
              explain: "User-level CLAUDE.md không được chia sẻ qua git. Chuyển quy ước vào CLAUDE.md của project.",
            },
          ],
        },
        {
          id: "3-2",
          title: "Slash command & Skill",
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
              options: ["~/.claude/commands/review.md", ".claude/commands/review.md trong repo", "CLAUDE.md", ".mcp.json"],
              answer: 1,
              explain: "Command trong .claude/commands/ của project được version control và chia sẻ.",
            },
            {
              q: "Skill khám phá codebase tạo output rất dài làm phiên chính bị đầy ngữ cảnh. Giải pháp?",
              options: ["Thêm context: fork vào frontmatter của SKILL.md", "Chuyển nội dung skill vào CLAUDE.md", "Dùng /compact sau mỗi lần chạy", "Tách thành 5 slash command"],
              answer: 0,
              explain: "context: fork chạy skill trong subagent riêng, chỉ trả kết quả gọn về phiên chính.",
            },
          ],
        },
        {
          id: "3-3",
          title: "Rule theo đường dẫn (path-specific rules)",
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
                "Tạo CLAUDE.md trong từng thư mục trong 40 thư mục",
                "File .claude/rules/testing.md với paths: [\"**/*.test.ts\"]",
                "Ghi vào ~/.claude/CLAUDE.md",
                "Thêm vào system prompt của mỗi phiên",
              ],
              answer: 1,
              explain: "Rule theo glob tự nạp khi chỉnh file khớp mẫu ở bất kỳ đâu.",
            },
          ],
        },
        {
          id: "3-4",
          title: "Plan mode vs thực thi trực tiếp",
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
              options: ["Thực thi trực tiếp, sửa dần", "Plan mode để khám phá và chốt phương án trước khi sửa", "Tạo slash command", "Dùng Batch API"],
              answer: 1,
              explain: "Quyết định kiến trúc, nhiều phương án hợp lệ, ảnh hưởng rộng → plan mode.",
            },
          ],
        },
        {
          id: "3-5",
          title: "Tinh chỉnh lặp (iterative refinement)",
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
              options: ["Mô tả dài hơn nữa", "Cung cấp 2–3 ví dụ input → output cụ thể", "Đổi sang plan mode", "Tăng temperature"],
              answer: 1,
              explain: "Ví dụ cụ thể truyền đạt phép biến đổi rõ ràng hơn văn mô tả.",
            },
          ],
        },
        {
          id: "3-6",
          title: "Claude Code trong CI/CD",
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
              options: ["Thiếu cờ -p nên Claude Code chờ input tương tác", "Thiếu .mcp.json", "CLAUDE.md quá dài", "Model đang quá tải"],
              answer: 0,
              explain: "-p (--print) chạy một lần và thoát, phù hợp với pipeline.",
            },
            {
              q: "Bot review trên PR lặp lại các comment cũ mỗi lần có commit mới. Cách khắc phục?",
              options: ["Tắt bot sau lần chạy đầu", "Đưa các phát hiện trước đó vào ngữ cảnh, yêu cầu chỉ báo vấn đề mới hoặc chưa được sửa", "Dùng model nhỏ hơn", "Chỉ chạy bot vào cuối tuần"],
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
      short: "Prompt & Output",
      weight: 20,
      color: "blue",
      summary: "Tiêu chí rõ ràng, few-shot, tool_use + JSON schema, vòng kiểm tra–thử lại, Batch API và review nhiều lượt.",
      sections: [
        {
          id: "4-1",
          title: "Tiêu chí rõ ràng thay vì chỉ dẫn mơ hồ",
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
                "Thêm 'chỉ báo vấn đề quan trọng' vào prompt",
                "Định nghĩa tiêu chí cụ thể cho từng hạng mục cần báo, tạm tắt hạng mục style trong lúc tinh chỉnh",
                "Tăng số comment để không bỏ sót",
                "Chuyển sang review thủ công hoàn toàn",
              ],
              answer: 1,
              explain: "Tiêu chí tường minh giảm false positive; tạm tắt hạng mục nhiễu giúp khôi phục niềm tin.",
            },
          ],
        },
        {
          id: "4-2",
          title: "Few-shot prompting",
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
                "Thêm 3 ví dụ ca mơ hồ kèm lý giải vì sao chọn nhãn đó",
                "Thêm 50 ví dụ ca rõ ràng",
                "Tăng temperature",
                "Viết hoa chỉ dẫn phân loại",
              ],
              answer: 0,
              explain: "Ví dụ có mục tiêu cho ca mơ hồ, có lý do, giúp model khái quát quyết định.",
            },
          ],
        },
        {
          id: "4-3",
          title: "Structured output với tool_use & JSON schema",
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
                "Model quá sáng tạo; giảm temperature",
                "Trường renewal_date là required; đổi thành nullable để model trả null khi không có",
                "Cần thêm OCR tốt hơn",
                "Chuyển sang Batch API",
              ],
              answer: 1,
              explain: "Trường bắt buộc ép model phải điền gì đó; nullable cho phép thể hiện 'không có thông tin'.",
            },
            {
              q: "Dùng tool_use với JSON schema đảm bảo điều gì?",
              options: ["Giá trị luôn đúng ngữ nghĩa", "Output đúng cú pháp và cấu trúc schema", "Không bao giờ có ảo giác", "Tổng các dòng luôn khớp"],
              answer: 1,
              explain: "Schema đảm bảo cấu trúc, còn tính đúng của giá trị cần kiểm tra thêm.",
            },
          ],
        },
        {
          id: "4-4",
          title: "Vòng kiểm tra hợp lệ & thử lại",
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
                "Tăng số lần retry lên 10",
                "Cho trường PO nullable và gắn cờ để người duyệt, vì retry không thể tạo ra thông tin không tồn tại",
                "Đổi sang model lớn hơn",
                "Bịa số PO theo định dạng chuẩn",
              ],
              answer: 1,
              explain: "Retry chỉ hữu ích khi lỗi nằm ở cách model trích xuất, không phải khi dữ liệu vắng mặt.",
            },
          ],
        },
        {
          id: "4-5",
          title: "Message Batches API",
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
              options: ["Batch cho cả hai", "Batch cho B, giữ gọi đồng bộ cho A", "Batch cho A, đồng bộ cho B", "Không dùng Batch cho cái nào"],
              answer: 1,
              explain: "Batch có thể mất tới 24 giờ — chỉ hợp với tác vụ không ai đang chờ.",
            },
            {
              q: "100 trong 10.000 request batch thất bại do tài liệu quá dài. Cách xử lý hiệu quả?",
              options: ["Gửi lại toàn bộ 10.000 request", "Dùng custom_id xác định 100 request lỗi, chia nhỏ tài liệu và gửi lại riêng chúng", "Bỏ qua 100 tài liệu", "Chuyển cả pipeline sang đồng bộ"],
              answer: 1,
              explain: "custom_id cho phép xử lý lại chính xác phần thất bại.",
            },
          ],
        },
        {
          id: "4-6",
          title: "Review nhiều instance & nhiều lượt",
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
              options: ["Yêu cầu phiên đó 'review kỹ hơn'", "Dùng instance Claude riêng, không có ngữ cảnh sinh code, để review", "Bật extended thinking trong cùng phiên", "Bỏ bước review"],
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
      short: "Ngữ cảnh & Tin cậy",
      weight: 15,
      color: "rose",
      summary: "Giữ thông tin quan trọng, escalate đúng lúc, lan truyền lỗi, codebase lớn, người duyệt và nguồn gốc thông tin.",
      sections: [
        {
          id: "5-1",
          title: "Giữ thông tin quan trọng trong ngữ cảnh dài",
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
                "Tóm tắt thường xuyên hơn",
                "Trích các dữ kiện giao dịch vào khối 'case facts' cố định đưa vào mọi prompt",
                "Yêu cầu khách nhắc lại thông tin",
                "Dùng model có context lớn hơn mà không đổi gì khác",
              ],
              answer: 1,
              explain: "Dữ kiện chính xác được giữ nguyên văn, không bị tóm tắt làm mờ.",
            },
          ],
        },
        {
          id: "5-2",
          title: "Escalation & xử lý mơ hồ",
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
              options: ["Cố giải quyết trước rồi mới chuyển", "Chuyển cho người thật ngay theo yêu cầu", "Hỏi lý do vì sao khách muốn gặp người", "Phớt lờ và tiếp tục"],
              answer: 1,
              explain: "Yêu cầu rõ ràng gặp người thật cần được tôn trọng ngay.",
            },
            {
              q: "get_customer trả về 3 khách cùng tên. Agent nên?",
              options: ["Chọn khách có đơn gần nhất", "Hỏi thêm thông tin định danh (email, mã đơn)", "Chọn ngẫu nhiên", "Escalate ngay"],
              answer: 1,
              explain: "Đoán bằng heuristic có thể thao tác nhầm tài khoản.",
            },
          ],
        },
        {
          id: "5-3",
          title: "Lan truyền lỗi trong hệ thống đa agent",
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
                "Trả về danh sách rỗng đánh dấu thành công",
                "Hủy toàn bộ tác vụ nghiên cứu",
                "Trả kết quả từ 4 nguồn + lỗi có cấu trúc về nguồn thứ 5 (loại lỗi, truy vấn, phương án thay thế)",
                "Thử lại vô hạn",
              ],
              answer: 2,
              explain: "Coordinator có đủ thông tin để quyết định phục hồi, báo cáo cuối ghi chú được phần thiếu.",
            },
          ],
        },
        {
          id: "5-4",
          title: "Khám phá codebase lớn",
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
                "Tiếp tục hỏi lại chi tiết",
                "Ghi phát hiện ra file scratchpad, dùng /compact hoặc phiên mới và ủy thác điều tra cụ thể cho subagent",
                "Đọc lại toàn bộ codebase",
                "Tăng max_tokens",
              ],
              answer: 1,
              explain: "Giữ phát hiện ngoài ngữ cảnh và cô lập output khám phá là cách chống suy giảm ngữ cảnh.",
            },
          ],
        },
        {
          id: "5-5",
          title: "Người duyệt & hiệu chỉnh độ tin cậy",
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
                "Bỏ ngay vì 97% là đủ",
                "Đánh giá độ chính xác theo từng loại tài liệu và trường, lấy mẫu phân tầng, rồi mới giảm duyệt cho các nhóm đã chứng minh tốt",
                "Tăng gấp đôi người duyệt",
                "Chuyển sang model khác",
              ],
              answer: 1,
              explain: "Một loại tài liệu hiếm có thể chỉ đạt 60% nhưng bị che bởi con số tổng.",
            },
          ],
        },
        {
          id: "5-6",
          title: "Nguồn gốc thông tin (provenance)",
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
              options: ["Lấy trung bình 43%", "Chọn số lớn hơn", "Trình bày cả hai, ghi nguồn và ngày, chú thích khác biệt phương pháp nếu có", "Bỏ số liệu khỏi báo cáo"],
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
