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
<p><strong>CCA-F</strong> là chứng chỉ nền tảng dành cho kiến trúc sư giải pháp xây dựng ứng dụng production với Claude: Claude API, Claude Agent SDK, Claude Code và Model Context Protocol (MCP).</p>
<ul>
  <li><strong>60 câu hỏi</strong> trắc nghiệm, một đáp án đúng, ba phương án gây nhiễu.</li>
  <li><strong>120 phút</strong> làm bài.</li>
  <li>Thang điểm quy đổi <strong>100–1000</strong>, cần tối thiểu <strong>720</strong> để đạt.</li>
  <li>Câu hỏi dựa trên <strong>kịch bản thực tế</strong> (scenario-based): bạn đóng vai kiến trúc sư và chọn quyết định thiết kế đúng nhất.</li>
  <li>Không trừ điểm khi sai — đừng bỏ trống câu nào.</li>
</ul>
<p>Điểm được tính trên toàn bộ 5 lĩnh vực (domain) với trọng số khác nhau. Biểu đồ bên dưới cho thấy số câu xấp xỉ của từng lĩnh vực trong 60 câu.</p>`,
          keyPoints: [
            "60 câu / 120 phút / đạt từ 720 điểm trên thang 1000.",
            "5 lĩnh vực: Agentic 27%, Claude Code 20%, Prompt & Structured Output 20%, Tool & MCP 18%, Context & Reliability 15%.",
            "Đề dựa trên kịch bản: đáp án đúng thường là giải pháp production-grade, có tính quyết định (deterministic) và tối giản.",
          ],
          tip: "Khi hai phương án đều 'chạy được', đáp án đúng thường là phương án đáng tin cậy nhất trong production — ví dụ ép buộc bằng code (hook, gate) thay vì chỉ dặn trong prompt.",
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
<p>Các câu hỏi được nhóm quanh những <strong>kịch bản production</strong> điển hình. Khi đọc một câu hỏi, hãy xác định trước: hệ thống đang ở kịch bản nào, ràng buộc chính là gì (độ tin cậy, chi phí, độ trễ, bảo mật), rồi mới đọc đáp án.</p>
<ul>
  <li><strong>Agent hỗ trợ khách hàng</strong> — xử lý hoàn tiền, xác minh danh tính, chuyển tiếp cho người thật.</li>
  <li><strong>Sinh code với Claude Code</strong> — CLAUDE.md, slash command, plan mode.</li>
  <li><strong>Hệ thống nghiên cứu đa agent</strong> — coordinator + subagent tìm kiếm, phân tích, tổng hợp.</li>
  <li><strong>Công cụ năng suất cho developer</strong> — MCP server, công cụ tích hợp sẵn.</li>
  <li><strong>Claude Code trong CI/CD</strong> — chế độ không tương tác, review tự động.</li>
  <li><strong>Trích xuất dữ liệu có cấu trúc</strong> — JSON schema, kiểm tra hợp lệ, Batch API.</li>
</ul>
<p>Lộ trình gợi ý bên dưới phân bổ thời gian theo trọng số. Bấm vào từng tuần để đánh dấu đã hoàn thành.</p>`,
          keyPoints: [
            "Đọc câu hỏi theo thứ tự: kịch bản → ràng buộc → đáp án.",
            "Phân bổ thời gian ôn tỷ lệ với trọng số lĩnh vực.",
            "Thực hành thật: dựng agent loop nhỏ, viết CLAUDE.md, cấu hình .mcp.json.",
          ],
          tip: "Loại trừ nhanh các đáp án 'quá tay' (dựng hạ tầng mới, fine-tune model) khi vấn đề có thể giải bằng cấu hình hoặc prompt tốt hơn.",
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
<p>Một agent là một <strong>vòng lặp</strong>: gửi yêu cầu tới Claude → kiểm tra <code>stop_reason</code> → nếu Claude muốn dùng công cụ thì thực thi công cụ, nối <code>tool_result</code> vào lịch sử hội thoại, rồi gửi lại.</p>
<ul>
  <li><code>stop_reason: "tool_use"</code> → thực thi các công cụ được yêu cầu, thêm kết quả vào messages, <strong>tiếp tục</strong> vòng lặp.</li>
  <li><code>stop_reason: "end_turn"</code> → Claude đã hoàn thành, <strong>kết thúc</strong> vòng lặp.</li>
</ul>
<p>Kết quả công cụ phải được đưa lại vào lịch sử để Claude suy luận cho bước tiếp theo — chính Claude quyết định gọi công cụ nào kế tiếp dựa trên ngữ cảnh (model-driven), không phải một cây quyết định cứng.</p>
<h4>Anti-pattern cần tránh</h4>
<ul>
  <li>Phân tích văn bản trả lời (ví dụ tìm chữ "xong rồi") để quyết định dừng.</li>
  <li>Dùng giới hạn số vòng lặp tùy ý làm cơ chế dừng <em>chính</em>.</li>
  <li>Coi việc response có chứa text là dấu hiệu hoàn thành — Claude có thể vừa nói vừa gọi công cụ.</li>
</ul>`,
          keyPoints: [
            "Điều khiển vòng lặp bằng stop_reason, không bằng nội dung văn bản.",
            "tool_use → chạy công cụ + nối tool_result → gọi lại; end_turn → dừng.",
            "Giới hạn số vòng chỉ là lưới an toàn, không phải tín hiệu hoàn thành.",
          ],
          tip: "Đáp án nhắc tới 'kiểm tra stop_reason' gần như luôn đúng hơn đáp án 'phân tích câu trả lời của model'.",
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
<p>Mô hình <strong>hub-and-spoke</strong>: một agent điều phối (coordinator) quản lý toàn bộ giao tiếp giữa các subagent, xử lý lỗi và định tuyến thông tin.</p>
<ul>
  <li>Subagent có <strong>ngữ cảnh cô lập</strong>: chúng <strong>không</strong> tự kế thừa lịch sử hội thoại của coordinator.</li>
  <li>Coordinator chịu trách nhiệm: phân rã tác vụ, chọn subagent nào cần gọi, truyền ngữ cảnh, tổng hợp kết quả.</li>
  <li>Mọi giao tiếp đi qua coordinator → dễ quan sát, xử lý lỗi nhất quán.</li>
  <li>Chọn subagent <strong>động</strong> theo độ phức tạp của truy vấn, thay vì luôn chạy toàn bộ pipeline.</li>
</ul>
<h4>Rủi ro điển hình</h4>
<p>Coordinator phân rã chủ đề <strong>quá hẹp</strong> → báo cáo cuối thiếu mảng quan trọng dù từng subagent làm đúng việc. Ví dụ: nghiên cứu "AI trong sáng tạo" nhưng chỉ giao các mảng nghệ thuật thị giác, bỏ sót âm nhạc, văn học. Nguyên nhân gốc nằm ở bước phân rã của coordinator, không phải ở subagent.</p>`,
          keyPoints: [
            "Subagent không kế thừa ngữ cảnh — phải truyền rõ ràng trong prompt.",
            "Coordinator: phân rã, ủy thác, tổng hợp, xử lý lỗi.",
            "Lỗ hổng bao phủ thường do phân rã quá hẹp ở coordinator.",
          ],
          tip: "Khi báo cáo tổng hợp thiếu nội dung, hãy truy nguyên về logic phân rã của coordinator trước khi đổ lỗi cho subagent.",
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
<p>Trong Claude Agent SDK, subagent được tạo qua công cụ <strong>Task</strong>. Coordinator phải có <code>"Task"</code> trong <code>allowedTools</code> thì mới gọi được subagent.</p>
<ul>
  <li>Mỗi loại subagent được khai báo bằng <code>AgentDefinition</code>: mô tả (description), system prompt và danh sách công cụ được phép.</li>
  <li>Prompt gửi cho subagent phải <strong>tự đầy đủ</strong>: kết quả từ bước trước, mục tiêu, tiêu chí chất lượng.</li>
  <li>Dùng định dạng có cấu trúc để tách nội dung khỏi metadata (URL nguồn, tên tài liệu, số trang) — giữ được nguồn gốc thông tin.</li>
  <li>Muốn chạy <strong>song song</strong>: coordinator phát ra nhiều lệnh gọi Task trong <strong>cùng một</strong> response, thay vì lần lượt qua nhiều lượt.</li>
  <li>Prompt cho coordinator nên nêu <strong>mục tiêu và tiêu chí</strong>, không phải hướng dẫn từng bước cứng nhắc — để subagent còn khả năng thích ứng.</li>
</ul>`,
          keyPoints: [
            "allowedTools của coordinator phải chứa \"Task\".",
            "Nhiều Task call trong một response = chạy song song.",
            "Truyền dữ liệu kèm metadata nguồn ở dạng có cấu trúc.",
          ],
          tip: "Nếu câu hỏi hỏi về giảm độ trễ của hệ thống đa agent, hãy tìm phương án 'gọi nhiều subagent song song trong một lượt'.",
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
<p>Có hai cách khiến agent tuân theo một quy trình: <strong>hướng dẫn trong prompt</strong> và <strong>ép buộc bằng code</strong> (programmatic enforcement).</p>
<ul>
  <li>Hướng dẫn trong prompt mang tính <strong>xác suất</strong> — đa số lần đúng nhưng vẫn có tỷ lệ sai khác 0.</li>
  <li>Khi cần tuân thủ <strong>tuyệt đối</strong> (xác minh danh tính trước khi hoàn tiền, kiểm tra tiền điều kiện trước giao dịch tài chính) → dùng <strong>cổng kiểm tra bằng code</strong>: chặn <code>process_refund</code> cho tới khi <code>get_customer</code> trả về ID đã xác minh.</li>
  <li>Khi chuyển cho người thật (escalate), gửi kèm <strong>bản tóm tắt bàn giao có cấu trúc</strong>: ID khách hàng, nguyên nhân gốc, số tiền, hành động đề xuất — vì nhân viên không đọc được toàn bộ transcript.</li>
  <li>Yêu cầu nhiều vấn đề trong một tin nhắn: phân tách thành từng mục, xử lý song song với ngữ cảnh chung, rồi tổng hợp một câu trả lời thống nhất.</li>
</ul>`,
          keyPoints: [
            "Rủi ro tài chính/pháp lý → ép buộc bằng code, không chỉ dặn trong prompt.",
            "Bản bàn giao cho người thật phải tự đầy đủ và có cấu trúc.",
            "Prompt = xác suất; hook/gate = quyết định (deterministic).",
          ],
          tip: "Từ khóa 'luôn luôn', 'bắt buộc', 'không bao giờ được' trong đề là gợi ý đáp án ép buộc bằng code.",
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
<p><strong>Hook</strong> cho phép chèn code của bạn vào vòng đời gọi công cụ của agent.</p>
<ul>
  <li><strong>PreToolUse</strong>: chạy <em>trước</em> khi công cụ thực thi — chặn hành vi vi phạm chính sách (ví dụ hoàn tiền vượt $500) và chuyển hướng sang quy trình escalate.</li>
  <li><strong>PostToolUse</strong>: chạy <em>sau</em> khi công cụ trả về — chuẩn hóa dữ liệu không đồng nhất (Unix timestamp, ISO 8601, mã trạng thái số) trước khi model xử lý.</li>
</ul>
<p>Hook cho <strong>đảm bảo tuyệt đối</strong>; prompt chỉ cho <strong>tuân thủ xác suất</strong>. Chọn hook khi quy tắc nghiệp vụ bắt buộc phải được thực thi.</p>`,
          keyPoints: [
            "PreToolUse = chặn/chỉnh trước khi chạy công cụ.",
            "PostToolUse = chuẩn hóa/biến đổi kết quả công cụ.",
            "Hook là cơ chế deterministic cho quy tắc nghiệp vụ.",
          ],
          tip: "Dữ liệu từ nhiều MCP server có định dạng ngày khác nhau → đáp án là hook PostToolUse chuẩn hóa, không phải dặn model 'hãy cẩn thận với định dạng ngày'.",
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
<p><strong>Hai chiến lược phân rã</strong>:</p>
<ul>
  <li><strong>Prompt chaining (chuỗi cố định)</strong>: các bước tuần tự đã biết trước — phù hợp với tác vụ có cấu trúc ổn định như review code nhiều khía cạnh.</li>
  <li><strong>Phân rã động (adaptive)</strong>: sinh tác vụ con dựa trên những gì phát hiện được ở mỗi bước — phù hợp với điều tra mở (ví dụ "thêm test cho codebase cũ": lập bản đồ cấu trúc trước, rồi ưu tiên vùng rủi ro cao).</li>
</ul>
<p>Review nhiều file: chia thành <strong>từng lượt phân tích theo file</strong> + <strong>một lượt tích hợp xuyên file</strong> để tránh hiện tượng "loãng chú ý" (attention dilution).</p>
<h4>Quản lý phiên</h4>
<ul>
  <li><code>--resume &lt;tên-phiên&gt;</code>: tiếp tục phiên điều tra đã đặt tên.</li>
  <li><code>fork_session</code>: tách nhánh từ một baseline chung để thử các hướng khác nhau.</li>
  <li>Khi kết quả công cụ cũ đã lỗi thời (code thay đổi nhiều), <strong>bắt đầu phiên mới với bản tóm tắt</strong> thường tốt hơn resume — và báo cho agent biết file nào đã thay đổi.</li>
</ul>`,
          keyPoints: [
            "Quy trình biết trước → prompt chaining; điều tra mở → phân rã động.",
            "Review lớn: per-file pass + cross-file integration pass.",
            "Ngữ cảnh lỗi thời → phiên mới + bản tóm tắt thay vì resume.",
          ],
          tip: "Một lượt review 'nhồi' 40 file thường bỏ sót lỗi — đáp án đúng chia nhỏ thành nhiều lượt tập trung.",
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
<p><strong>Mô tả công cụ (description)</strong> là cơ chế chính để Claude quyết định gọi công cụ nào. Mô tả tối giản → chọn sai công cụ, đặc biệt khi có hai công cụ gần giống nhau.</p>
<p>Một mô tả tốt nên có:</p>
<ul>
  <li>Công cụ làm gì và <strong>khi nào nên dùng</strong> (và khi nào <em>không</em>).</li>
  <li>Định dạng đầu vào, ví dụ truy vấn mẫu.</li>
  <li>Các trường hợp biên và <strong>ranh giới</strong> so với công cụ tương tự.</li>
</ul>
<p>Nếu hai công cụ chồng chéo chức năng, cân nhắc <strong>đổi tên hoặc tách</strong> công cụ chung chung thành các công cụ chuyên biệt (ví dụ <code>analyze_document</code> → <code>extract_data_points</code>, <code>summarize_content</code>, <code>verify_claim_against_source</code>). Ngoài ra, kiểm tra system prompt có từ khóa nào vô tình "kéo" model về một công cụ sai hay không.</p>`,
          keyPoints: [
            "Description là tín hiệu chọn công cụ quan trọng nhất.",
            "Nêu rõ ranh giới với công cụ tương tự.",
            "Công cụ chồng chéo → đổi tên hoặc tách nhỏ.",
          ],
          tip: "Bước sửa đầu tiên, chi phí thấp nhất cho lỗi chọn sai công cụ thường là cải thiện description — không phải thêm lớp định tuyến hay fine-tune.",
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
<p>Trong MCP, công cụ báo lỗi bằng cờ <code>isError: true</code>. Nhưng chỉ báo "Operation failed" thì agent không biết phải làm gì tiếp theo.</p>
<p>Phân loại lỗi để agent phục hồi đúng cách:</p>
<ul>
  <li><strong>Transient</strong> (tạm thời): timeout, dịch vụ quá tải → có thể thử lại.</li>
  <li><strong>Validation</strong>: đầu vào sai định dạng → sửa đầu vào rồi gọi lại.</li>
  <li><strong>Business</strong>: vi phạm quy tắc nghiệp vụ (quá hạn hoàn tiền) → không thử lại, giải thích cho khách.</li>
  <li><strong>Permission</strong>: không có quyền → escalate.</li>
</ul>
<p>Trả về metadata như <code>errorCategory</code>, <code>isRetryable</code> và mô tả dễ hiểu. Subagent nên <strong>tự phục hồi lỗi tạm thời</strong> tại chỗ, chỉ đẩy lên coordinator những lỗi không tự xử lý được — kèm kết quả một phần và những gì đã thử.</p>
<p><strong>Quan trọng:</strong> phân biệt <em>lỗi truy cập</em> (cần thử lại) với <em>kết quả rỗng hợp lệ</em> (truy vấn thành công nhưng không có dữ liệu khớp).</p>`,
          keyPoints: [
            "isError + errorCategory + isRetryable + thông điệp dễ hiểu.",
            "Lỗi nghiệp vụ không thử lại; lỗi tạm thời có thể thử lại.",
            "Rỗng hợp lệ ≠ lỗi truy cập.",
          ],
          tip: "Trả về mảng rỗng khi gặp timeout là 'nuốt lỗi' — một anti-pattern thường xuất hiện trong đáp án gây nhiễu.",
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
<p>Cho một agent <strong>quá nhiều công cụ</strong> (ví dụ 18 thay vì 4–5) làm giảm độ tin cậy khi chọn công cụ. Agent có công cụ ngoài chuyên môn của mình dễ dùng sai mục đích (subagent tổng hợp lại đi tìm kiếm web).</p>
<ul>
  <li>Giới hạn mỗi subagent vào bộ công cụ phù hợp vai trò.</li>
  <li>Có thể thay công cụ chung chung bằng phiên bản giới hạn (<code>fetch_url</code> → <code>load_document</code> chỉ nhận URL tài liệu).</li>
  <li>Cho phép công cụ <em>xuyên vai trò</em> có phạm vi hẹp cho nhu cầu thường xuyên (ví dụ subagent tổng hợp có <code>verify_fact</code>).</li>
</ul>
<h4>tool_choice</h4>
<ul>
  <li><code>"auto"</code>: model tự quyết có gọi công cụ hay trả lời bằng text.</li>
  <li><code>"any"</code>: bắt buộc gọi <em>một</em> công cụ nào đó (model chọn công cụ).</li>
  <li><code>{"type":"tool","name":"..."}</code>: bắt buộc gọi <em>đúng</em> công cụ đó — ví dụ ép bước trích xuất metadata chạy trước.</li>
</ul>`,
          keyPoints: [
            "Ít công cụ, đúng vai trò → chọn công cụ chính xác hơn.",
            "\"any\" đảm bảo có tool call thay vì text.",
            "Forced tool để ép thứ tự bước.",
          ],
          tip: "Cần chắc chắn model trả về JSON có cấu trúc khi có nhiều schema → tool_choice: \"any\". Cần đúng một schema cụ thể → forced tool.",
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
<p>MCP server có thể cấu hình ở hai phạm vi:</p>
<ul>
  <li><strong>Project</strong>: file <code>.mcp.json</code> ở gốc repo — commit vào version control, cả team dùng chung.</li>
  <li><strong>User</strong>: <code>~/.claude.json</code> — cá nhân, thử nghiệm, không chia sẻ.</li>
</ul>
<p>Không commit secret: dùng <strong>mở rộng biến môi trường</strong> trong <code>.mcp.json</code>, ví dụ <code>"\${GITHUB_TOKEN}"</code>.</p>
<p>Công cụ từ mọi MCP server đã cấu hình được phát hiện khi kết nối và có sẵn cùng lúc cho agent. Ngoài <strong>tools</strong>, MCP còn có <strong>resources</strong> — phơi bày danh mục nội dung (tóm tắt issue, cây tài liệu, schema database) để agent biết có gì mà không cần gọi công cụ khám phá nhiều lần.</p>
<p>Với tích hợp phổ biến (Jira, GitHub…) ưu tiên <strong>MCP server cộng đồng có sẵn</strong>; chỉ tự viết server cho quy trình đặc thù của team.</p>`,
          keyPoints: [
            ".mcp.json = chia sẻ team; ~/.claude.json = cá nhân.",
            "Secret qua ${ENV_VAR}, không hardcode.",
            "Resources = danh mục nội dung; Tools = hành động.",
          ],
          tip: "Đề hỏi 'cả team cần dùng cùng MCP server' → .mcp.json trong repo với biến môi trường cho token.",
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
<ul>
  <li><strong>Grep</strong>: tìm theo <em>nội dung</em> file — tên hàm, thông báo lỗi, câu lệnh import.</li>
  <li><strong>Glob</strong>: tìm theo <em>mẫu đường dẫn/tên file</em> — ví dụ <code>**/*.test.tsx</code>.</li>
  <li><strong>Read / Write</strong>: đọc và ghi toàn bộ file.</li>
  <li><strong>Edit</strong>: sửa có mục tiêu dựa trên đoạn văn bản neo <em>duy nhất</em>. Nếu đoạn neo không duy nhất → Edit thất bại; khi đó có thể Read rồi Write lại.</li>
  <li><strong>Bash</strong>: chạy lệnh shell (test, build, git).</li>
</ul>
<p>Hiểu codebase theo kiểu <strong>tăng dần</strong>: Grep tìm điểm vào → Read theo dấu import và luồng gọi, thay vì đọc tất cả file ngay từ đầu.</p>`,
          keyPoints: [
            "Grep = nội dung; Glob = tên/đường dẫn.",
            "Edit cần neo duy nhất; thất bại → Read + Write.",
            "Khám phá tăng dần, không đọc toàn bộ codebase trước.",
          ],
          tip: "Câu hỏi 'tìm tất cả file test' → Glob. 'Tìm mọi nơi gọi hàm X' → Grep.",
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
<p>Claude Code nạp hướng dẫn từ nhiều cấp <strong>CLAUDE.md</strong>:</p>
<ul>
  <li><strong>User</strong>: <code>~/.claude/CLAUDE.md</code> — chỉ áp dụng cho bạn, <strong>không</strong> được chia sẻ qua version control.</li>
  <li><strong>Project</strong>: <code>CLAUDE.md</code> hoặc <code>.claude/CLAUDE.md</code> ở gốc repo — chia sẻ cho cả team.</li>
  <li><strong>Thư mục con</strong>: <code>CLAUDE.md</code> trong thư mục con — áp dụng khi làm việc trong thư mục đó.</li>
</ul>
<p>Giữ CLAUDE.md gọn gàng bằng cú pháp <code>@import</code> để tham chiếu file khác, hoặc tách chủ đề vào thư mục <code>.claude/rules/</code> (testing.md, api-conventions.md…).</p>
<p>Lỗi kinh điển: thành viên mới không nhận được hướng dẫn vì nó nằm trong <code>~/.claude/CLAUDE.md</code> của một người thay vì CLAUDE.md của project. Dùng lệnh <code>/memory</code> để kiểm tra những file nào đang được nạp.</p>`,
          keyPoints: [
            "User-level không được chia sẻ; project-level thì có.",
            "@import và .claude/rules/ giúp module hóa.",
            "/memory để kiểm tra file nào đang được nạp.",
          ],
          tip: "'Chỉ máy của một người hoạt động đúng' → hướng dẫn đang nằm ở user-level, cần chuyển lên project-level.",
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
<ul>
  <li><strong>Custom slash command</strong> của project: <code>.claude/commands/</code> — commit vào repo, cả team có khi clone/pull.</li>
  <li>Command cá nhân: <code>~/.claude/commands/</code>.</li>
  <li><strong>Skill</strong>: <code>.claude/skills/&lt;tên&gt;/SKILL.md</code> với frontmatter:
    <ul>
      <li><code>context: fork</code> — chạy trong ngữ cảnh subagent riêng, output dài dòng không làm bẩn hội thoại chính.</li>
      <li><code>allowed-tools</code> — giới hạn công cụ được dùng khi skill chạy.</li>
      <li><code>argument-hint</code> — gợi ý tham số cần nhập.</li>
    </ul>
  </li>
</ul>
<p><strong>Skill vs CLAUDE.md</strong>: skill được gọi <em>theo yêu cầu</em> cho tác vụ cụ thể; CLAUDE.md là chuẩn mực <em>luôn được nạp</em>.</p>`,
          keyPoints: [
            ".claude/commands/ = chia sẻ team; ~/.claude/commands/ = cá nhân.",
            "context: fork cô lập output dài của skill.",
            "Skill theo yêu cầu; CLAUDE.md luôn nạp.",
          ],
          tip: "Skill phân tích codebase sinh rất nhiều output → context: fork để không chiếm ngữ cảnh phiên chính.",
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
<p>File trong <code>.claude/rules/</code> có thể khai báo frontmatter <code>paths</code> với mẫu glob. Rule chỉ được nạp khi Claude làm việc với file khớp mẫu — giảm ngữ cảnh và token thừa.</p>
<pre><code>---
paths: ["**/*.test.tsx", "**/*.test.ts"]
---
Dùng React Testing Library, không dùng Enzyme.
Mỗi test mô tả hành vi người dùng.</code></pre>
<p><strong>Rule theo glob vs CLAUDE.md thư mục con</strong>: khi quy ước áp dụng cho loại file <em>rải rác khắp codebase</em> (ví dụ mọi file test nằm cạnh code), rule theo glob tốt hơn — CLAUDE.md thư mục con chỉ gắn với một thư mục.</p>`,
          keyPoints: [
            "paths: [glob] → nạp có điều kiện.",
            "Quy ước xuyên thư mục → rule glob.",
            "Quy ước gắn với một thư mục → CLAUDE.md thư mục con.",
          ],
          tip: "Đề nhắc 'file test nằm rải rác cạnh code nguồn' → .claude/rules/ với paths glob.",
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
<p><strong>Plan mode</strong> phù hợp khi:</p>
<ul>
  <li>Thay đổi quy mô lớn, nhiều file (ví dụ migrate thư viện ảnh hưởng 45+ file).</li>
  <li>Có nhiều cách tiếp cận hợp lệ, cần quyết định kiến trúc (tích hợp dịch vụ, chọn mô hình dữ liệu).</li>
  <li>Cần khám phá an toàn trước khi chỉnh sửa.</li>
</ul>
<p><strong>Thực thi trực tiếp</strong> phù hợp với thay đổi đơn giản, phạm vi rõ ràng (sửa bug một hàm có stack trace rõ, thêm một điều kiện kiểm tra).</p>
<p>Có thể kết hợp: plan mode để điều tra → thực thi trực tiếp để triển khai. Dùng <strong>Explore subagent</strong> để cô lập output khám phá dài dòng, chỉ trả về tóm tắt.</p>`,
          keyPoints: [
            "Lớn, mơ hồ, kiến trúc → plan mode.",
            "Nhỏ, rõ ràng → thực thi trực tiếp.",
            "Explore subagent giữ ngữ cảnh chính gọn gàng.",
          ],
          tip: "Bug fix một dòng với stack trace rõ ràng mà chọn plan mode là 'quá tay'.",
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
<p>Khi mô tả bằng lời không cho kết quả nhất quán:</p>
<ul>
  <li><strong>Ví dụ input/output cụ thể</strong> (2–3 cặp) truyền đạt phép biến đổi tốt hơn mô tả trừu tượng.</li>
  <li><strong>Lặp theo test</strong>: viết test trước, chạy, gửi lỗi test cho Claude sửa tiếp.</li>
  <li><strong>Interview pattern</strong>: để Claude đặt câu hỏi làm rõ (chính sách cache, chế độ lỗi…) trước khi triển khai ở lĩnh vực bạn chưa quen.</li>
  <li>Các vấn đề <strong>liên quan nhau</strong> → gửi chung một lượt; vấn đề <strong>độc lập</strong> → sửa tuần tự.</li>
</ul>`,
          keyPoints: [
            "Ví dụ cụ thể > mô tả trừu tượng.",
            "Test thất bại là phản hồi chính xác nhất.",
            "Interview pattern làm lộ các yếu tố chưa tính tới.",
          ],
          tip: "Model hiểu sai yêu cầu biến đổi dữ liệu dù đã mô tả kỹ → thêm 2–3 ví dụ input/output.",
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
<ul>
  <li>Cờ <code>-p</code> (<code>--print</code>): chạy <strong>không tương tác</strong> — bắt buộc trong pipeline, nếu không job sẽ treo chờ input.</li>
  <li><code>--output-format json</code> kèm <code>--json-schema</code>: output máy đọc được, có thể đăng thành comment inline trên PR.</li>
  <li>CLAUDE.md cung cấp ngữ cảnh cho CI: tiêu chuẩn test, fixture có sẵn, tiêu chí review.</li>
  <li>Khi chạy review lại sau commit mới, đưa <strong>các phát hiện trước đó</strong> vào ngữ cảnh và yêu cầu chỉ báo vấn đề mới/chưa sửa → tránh comment trùng.</li>
  <li><strong>Review độc lập</strong>: phiên đã sinh code kém hiệu quả khi tự review chính nó (giữ nguyên ngữ cảnh suy luận). Dùng một instance Claude riêng, không có ngữ cảnh sinh code.</li>
</ul>`,
          keyPoints: [
            "-p cho chế độ không tương tác.",
            "--output-format json + --json-schema cho output có cấu trúc.",
            "Reviewer độc lập > tự review.",
          ],
          tip: "Job CI 'bị treo không kết thúc' → thiếu cờ -p.",
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
<p>Chỉ dẫn chung chung như "hãy thận trọng" hay "chỉ báo các vấn đề có độ tin cậy cao" <strong>không</strong> cải thiện độ chính xác. Thay vào đó, nêu <strong>tiêu chí cụ thể</strong>: báo gì, bỏ qua gì.</p>
<ul>
  <li>Ví dụ: "Chỉ báo comment khi nó mô tả sai hành vi thực tế của code" thay vì "kiểm tra comment có chính xác không".</li>
  <li><strong>False positive cao</strong> làm mất niềm tin của developer vào cả những phát hiện đúng.</li>
  <li>Có thể <strong>tạm tắt</strong> các hạng mục có tỷ lệ false positive cao trong lúc cải thiện prompt cho hạng mục đó.</li>
  <li>Định nghĩa rõ mức độ nghiêm trọng kèm <strong>ví dụ code cụ thể</strong> cho từng mức.</li>
</ul>`,
          keyPoints: [
            "Tiêu chí cụ thể > tính từ mơ hồ.",
            "False positive phá hủy niềm tin.",
            "Mức độ nghiêm trọng cần ví dụ cụ thể.",
          ],
          tip: "Đáp án 'thêm câu: hãy cẩn thận / chỉ báo khi chắc chắn' gần như luôn là đáp án gây nhiễu.",
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
<p><strong>Few-shot examples</strong> là kỹ thuật hiệu quả nhất để có output nhất quán khi chỉ dẫn chi tiết vẫn cho kết quả lộn xộn.</p>
<ul>
  <li>Chọn 2–4 ví dụ <strong>có mục tiêu</strong> cho các tình huống mơ hồ, kèm <strong>lý do</strong> vì sao chọn hành động đó.</li>
  <li>Ví dụ giúp model <strong>khái quát hóa</strong> sang mẫu mới, không chỉ khớp y hệt các ca đã cho.</li>
  <li>Hữu ích để giảm ảo giác trong trích xuất: ví dụ cho tài liệu có cấu trúc khác nhau (trích dẫn inline vs thư mục tham khảo).</li>
  <li>Phân biệt ví dụ "đáng báo" và "chấp nhận được" để giảm false positive.</li>
</ul>`,
          keyPoints: [
            "2–4 ví dụ nhắm vào ca mơ hồ.",
            "Kèm lý do để model khái quát hóa.",
            "Ví dụ đa dạng định dạng giảm ảo giác.",
          ],
          tip: "Output định dạng không nhất quán dù đã có chỉ dẫn chi tiết → few-shot.",
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
<p>Dùng <strong>tool_use với JSON schema</strong> là cách đáng tin cậy nhất để có output tuân thủ schema — loại bỏ lỗi <em>cú pháp</em> JSON.</p>
<p>Nhưng schema <strong>không</strong> ngăn lỗi <em>ngữ nghĩa</em>: tổng các dòng không bằng tổng tiền, giá trị đặt sai trường.</p>
<h4>Thiết kế schema</h4>
<ul>
  <li><strong>Trường bắt buộc vs tùy chọn</strong>: nếu bắt buộc một trường mà tài liệu không có thông tin → model dễ <strong>bịa</strong> giá trị. Hãy cho phép <code>null</code> (nullable).</li>
  <li><strong>enum</strong> kèm giá trị <code>"other"</code> + trường mô tả chi tiết cho các danh mục mở rộng được.</li>
  <li>Giá trị <code>"unclear"</code> cho trường hợp mơ hồ.</li>
  <li>Chỉ dẫn chuẩn hóa định dạng ngay trong prompt đi cùng schema.</li>
</ul>`,
          keyPoints: [
            "tool_use + schema loại lỗi cú pháp, không loại lỗi ngữ nghĩa.",
            "Trường có thể vắng mặt → nullable để tránh bịa.",
            "enum + \"other\" + detail cho danh mục mở.",
          ],
          tip: "Model 'bịa' ngày tháng khi tài liệu không có → trường đó đang bị đặt là required; sửa thành nullable.",
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
<ul>
  <li><strong>Retry kèm phản hồi lỗi</strong>: gửi lại tài liệu gốc + output lỗi + <strong>lỗi kiểm tra cụ thể</strong> để model tự sửa.</li>
  <li>Thử lại <strong>vô ích</strong> khi thông tin <strong>không có trong tài liệu nguồn</strong> (khác với lỗi định dạng hay đặt sai trường).</li>
  <li>Tự kiểm tra: trích xuất cả <code>calculated_total</code> lẫn <code>stated_total</code> để phát hiện chênh lệch.</li>
  <li>Thêm trường <code>detected_pattern</code> để theo dõi cấu trúc nào hay gây false positive, phục vụ phân tích sau.</li>
</ul>`,
          keyPoints: [
            "Retry phải kèm lỗi cụ thể.",
            "Thông tin không tồn tại → retry vô ích.",
            "calculated vs stated total để tự phát hiện sai.",
          ],
          tip: "Đề hỏi 'retry 5 lần vẫn thiếu trường X' — kiểm tra xem X có thật trong tài liệu không trước khi tăng số lần retry.",
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
<p><strong>Message Batches API</strong>:</p>
<ul>
  <li>Tiết kiệm <strong>~50% chi phí</strong>.</li>
  <li>Thời gian xử lý <strong>tới 24 giờ</strong>, không có SLA độ trễ.</li>
  <li>Không hỗ trợ gọi công cụ nhiều lượt trong <em>một</em> request.</li>
  <li><code>custom_id</code> để ghép cặp request/response.</li>
</ul>
<p>Phù hợp: báo cáo đêm, audit hàng tuần, test sinh hàng loạt — <strong>không chặn</strong> ai. Không phù hợp: kiểm tra pre-merge mà developer đang chờ.</p>
<p>Tính lịch gửi theo SLA: nếu cần kết quả trong 30 giờ và batch có thể mất 24 giờ → phải gửi trong vòng 6 giờ đầu. Khi một số request thất bại, chỉ gửi lại các request đó (theo <code>custom_id</code>), có thể chia nhỏ tài liệu quá dài.</p>`,
          keyPoints: [
            "−50% chi phí, ≤24 giờ, không SLA.",
            "Chỉ cho tác vụ không chặn ai.",
            "custom_id để ghép và gửi lại phần lỗi.",
          ],
          tip: "'Developer chờ kết quả trước khi merge' → loại Batch API ngay.",
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
<ul>
  <li><strong>Tự review có giới hạn</strong>: model giữ ngữ cảnh suy luận lúc sinh output nên khó nghi ngờ quyết định của chính mình.</li>
  <li><strong>Instance review độc lập</strong> (không có ngữ cảnh sinh) phát hiện lỗi tinh vi hiệu quả hơn so với tự review hoặc "extended thinking" trong cùng phiên.</li>
  <li><strong>Nhiều lượt</strong>: lượt phân tích cục bộ từng file + lượt tích hợp xuyên file để tránh chú ý loãng.</li>
  <li>Có thể yêu cầu model tự báo <strong>độ tin cậy</strong> cho từng phát hiện để định tuyến sang người duyệt.</li>
</ul>`,
          keyPoints: [
            "Reviewer độc lập > tự review.",
            "Per-file + cross-file pass.",
            "Confidence theo từng phát hiện để định tuyến.",
          ],
          tip: "Cùng một phiên vừa sinh vừa review → đáp án đúng thường là tách instance.",
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
<ul>
  <li><strong>Tóm tắt lũy tiến</strong> làm mất chi tiết: số tiền, ngày, phần trăm bị nén thành "khách muốn hoàn tiền". → Giữ một <strong>khối "case facts"</strong> cố định chứa dữ kiện giao dịch, đưa vào mỗi prompt, nằm ngoài phần được tóm tắt.</li>
  <li><strong>Lost in the middle</strong>: model xử lý tốt thông tin ở đầu và cuối, dễ bỏ sót ở giữa. → Đặt tóm tắt phát hiện quan trọng ở <strong>đầu</strong> input, dùng tiêu đề mục rõ ràng.</li>
  <li><strong>Kết quả công cụ dài dòng</strong> (ví dụ 40+ trường cho một đơn hàng, chỉ 5 trường liên quan) chiếm ngữ cảnh → <strong>cắt gọn</strong> chỉ giữ trường liên quan trước khi đưa vào lịch sử.</li>
  <li>Subagent trả về dữ liệu có cấu trúc kèm metadata (ngày, nguồn, phương pháp) thay vì văn xuôi dài.</li>
</ul>`,
          keyPoints: [
            "Case facts block chống mất chi tiết khi tóm tắt.",
            "Thông tin quan trọng ở đầu (lost in the middle).",
            "Cắt gọn output công cụ về trường liên quan.",
          ],
          tip: "Agent 'quên' số tiền khách nói từ đầu cuộc hội thoại dài → case facts block, không phải tăng context window.",
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
<p><strong>Nên escalate</strong> khi:</p>
<ul>
  <li>Khách <strong>yêu cầu rõ ràng</strong> gặp người thật → chuyển ngay, không cố giải quyết tiếp.</li>
  <li>Chính sách có <strong>khoảng trống/ngoại lệ</strong> (ví dụ yêu cầu khớp giá đối thủ khi chính sách chỉ nói về điều chỉnh giá nội bộ).</li>
  <li>Agent không thể tiến triển.</li>
</ul>
<p><strong>Không nên</strong> dựa vào: điểm cảm xúc (sentiment) hay độ tự tin model tự báo — đây là tín hiệu không đáng tin cậy cho độ phức tạp thực sự của ca.</p>
<p>Khách bực bội nhưng vấn đề đơn giản, nằm trong khả năng xử lý → ghi nhận cảm xúc, <strong>đề nghị giải quyết</strong>; chỉ escalate nếu khách vẫn yêu cầu.</p>
<p>Tra cứu ra <strong>nhiều khách hàng khớp</strong> → hỏi thêm thông tin định danh, không đoán bằng heuristic.</p>`,
          keyPoints: [
            "Yêu cầu gặp người thật → escalate ngay.",
            "Khoảng trống chính sách → escalate.",
            "Sentiment & self-confidence là tín hiệu kém.",
          ],
          tip: "Đáp án 'escalate khi sentiment < ngưỡng' thường là đáp án gây nhiễu.",
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
<p>Khi subagent gặp lỗi không tự phục hồi được, trả về <strong>ngữ cảnh lỗi có cấu trúc</strong> cho coordinator:</p>
<ul>
  <li>Loại lỗi, truy vấn đã thử.</li>
  <li><strong>Kết quả một phần</strong> đã thu được.</li>
  <li>Các phương án thay thế khả dĩ.</li>
</ul>
<p>Hai anti-pattern:</p>
<ul>
  <li><strong>Nuốt lỗi</strong>: trả kết quả rỗng đánh dấu thành công → coordinator tưởng không có dữ liệu.</li>
  <li><strong>Dừng toàn bộ workflow</strong> chỉ vì một lỗi đơn lẻ.</li>
</ul>
<p>Báo cáo tổng hợp nên có phần <strong>ghi chú độ bao phủ</strong>: mảng nào có dữ liệu đầy đủ, mảng nào thiếu do nguồn không khả dụng.</p>`,
          keyPoints: [
            "Lỗi có cấu trúc + kết quả một phần.",
            "Không nuốt lỗi, không dừng toàn bộ.",
            "Ghi chú độ bao phủ trong báo cáo cuối.",
          ],
          tip: "Phương án tốt cho phép coordinator quyết định: thử lại, dùng nguồn khác, hay tiếp tục với ghi chú thiếu sót.",
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
<ul>
  <li>Phiên dài → <strong>suy giảm ngữ cảnh</strong>: model bắt đầu đưa ra câu trả lời chung chung, "quên" các class cụ thể đã thấy trước đó.</li>
  <li><strong>File scratchpad</strong>: ghi các phát hiện quan trọng ra file, tham chiếu lại khi cần.</li>
  <li><strong>Ủy thác cho subagent</strong>: câu hỏi điều tra cụ thể ("tìm mọi test file", "lần dấu luồng hoàn tiền") để output dài dòng nằm ngoài ngữ cảnh chính.</li>
  <li>Mỗi giai đoạn khám phá kết thúc bằng tóm tắt các phát hiện chính trước khi sang giai đoạn tiếp theo.</li>
  <li><code>/compact</code> để nén ngữ cảnh khi đã đầy output khám phá.</li>
  <li>Hệ thống nhiều giai đoạn: mỗi agent xuất <strong>manifest trạng thái</strong> để coordinator khôi phục sau sự cố.</li>
</ul>`,
          keyPoints: [
            "Scratchpad + subagent để chống suy giảm ngữ cảnh.",
            "Tóm tắt cuối mỗi giai đoạn.",
            "/compact khi ngữ cảnh đầy.",
          ],
          tip: "Dấu hiệu 'model bắt đầu nói về pattern chung thay vì class cụ thể' = suy giảm ngữ cảnh.",
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
<ul>
  <li><strong>Độ chính xác tổng</strong> (ví dụ 97%) có thể <strong>che giấu</strong> hiệu suất kém ở một loại tài liệu hoặc một trường cụ thể.</li>
  <li>Trước khi giảm khối lượng duyệt thủ công, xác thực độ chính xác <strong>theo từng loại tài liệu và từng trường</strong>.</li>
  <li><strong>Lấy mẫu ngẫu nhiên phân tầng</strong> (stratified) các trích xuất có độ tin cậy cao để đo tỷ lệ lỗi và phát hiện lỗi mới.</li>
  <li>Độ tin cậy theo trường được <strong>hiệu chỉnh</strong> bằng tập kiểm định có nhãn; định tuyến trích xuất có độ tin cậy thấp hoặc nguồn mơ hồ sang người duyệt.</li>
</ul>`,
          keyPoints: [
            "Accuracy tổng có thể che lỗi theo nhóm.",
            "Đo theo loại tài liệu và trường.",
            "Stratified sampling + calibrated confidence.",
          ],
          tip: "Đề đưa con số accuracy tổng rất cao và hỏi có nên bỏ người duyệt không → kiểm tra theo phân nhóm trước.",
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
<ul>
  <li>Bước tóm tắt dễ làm <strong>mất liên kết claim–nguồn</strong>. Yêu cầu subagent xuất mapping có cấu trúc: claim, trích đoạn, URL/tên tài liệu, ngày.</li>
  <li>Hai nguồn uy tín đưa <strong>số liệu mâu thuẫn</strong> → giữ cả hai, ghi chú nguồn, không tự ý chọn một.</li>
  <li>Kèm <strong>ngày xuất bản/thu thập</strong> để tránh hiểu nhầm khác biệt theo thời gian là mâu thuẫn.</li>
  <li>Báo cáo phân biệt rõ phát hiện <strong>đã xác lập</strong> và <strong>còn tranh cãi</strong>; trình bày theo định dạng hợp với nội dung (bảng cho số liệu, văn xuôi cho diễn giải).</li>
</ul>`,
          keyPoints: [
            "Claim–source mapping xuyên suốt pipeline.",
            "Mâu thuẫn → ghi chú cả hai nguồn.",
            "Ngày tháng giúp giải thích khác biệt.",
          ],
          tip: "Đáp án 'chọn nguồn mới hơn/uy tín hơn và bỏ nguồn kia' thường sai — đề muốn giữ minh bạch.",
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
