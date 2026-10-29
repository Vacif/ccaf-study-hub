/* Nội dung chuyên sâu — Chương 4: Prompt Engineering & Structured Output */
window.DEEP_ADD({
  /* ─────────────── 4-1 ─────────────── */
  "4-1": {
    advanced: `
<section class="adv-block">
  <h4>Báo nhầm hay bỏ sót, cái nào đáng lo hơn?</h4>
  <p>Một bot review có thể sai theo hai kiểu: <b>báo nhầm</b> (báo một thứ không phải lỗi) và <b>bỏ sót</b> (không báo một lỗi có thật). Với bot mới triển khai, báo nhầm thường nguy hiểm hơn. Một bot ít bình luận nhưng bình luận nào cũng đúng sẽ được người ta đọc. Một bot bình luận tràn lan sẽ bị tắt hoặc bị phớt lờ, và khi đó cả những lỗi thật cũng không ai nhìn tới.</p>
</section>
<section class="adv-block">
  <h4>Một bộ tiêu chí rõ ràng</h4>
  <pre><code>Báo khi:
- Dữ liệu người dùng nhập đi thẳng vào câu SQL, lệnh shell hoặc HTML
  mà không được làm sạch.
- Comment mô tả SAI hành vi thật của code (trích cả comment lẫn code).
- Lỗi đọc ghi mạng, file, cơ sở dữ liệu không được xử lý.

Không báo:
- Cách đặt tên, định dạng, thứ tự import, sở thích cá nhân.
- Gợi ý viết lại code mà không sửa một lỗi cụ thể nào.

Mức độ:
- NGHIÊM TRỌNG: có thể bị tấn công từ xa.
  Ví dụ: query = "SELECT ... WHERE id=" + req.query.id
- CAO: làm sai hoặc mất dữ liệu ở luồng chính.

Mỗi phát hiện phải trích nguyên văn dòng code liên quan.</code></pre>
  <p>Yêu cầu trích dẫn dòng code giúp giảm những phát hiện “tưởng tượng”: nếu không chỉ ra được dòng nào sai, phát hiện đó khó có thể là thật.</p>
</section>
<section class="adv-block">
  <h4>Đo trước khi chỉnh</h4>
  <p>Cho lập trình viên đánh dấu những bình luận “không hữu ích”, rồi thống kê tỷ lệ báo nhầm theo <b>từng loại</b> vấn đề. Loại nào nhiều báo nhầm thì tạm tắt, chỉnh lại tiêu chí và ví dụ cho loại đó, rồi mới bật lại.</p>
</section>`,
    traps: [
      {
        title: "Thêm câu “chỉ báo khi chắc chắn”",
        level: "hard",
        scenario: "Bot review đăng khoảng 20 bình luận mỗi pull request, phần lớn về cách viết code cho đẹp. Quản lý đề xuất thêm câu: “Chỉ báo những vấn đề bạn rất chắc chắn là quan trọng.”",
        bait: "Thêm câu đó vì nó ngắn gọn và đi thẳng vào vấn đề.",
        why: "Model không biết với nhóm bạn thì “quan trọng” là gì, và mức “chắc chắn” do nó tự đánh giá chưa được kiểm chứng. Kết quả thường lúc nhiều lúc ít, không ổn định.",
        fix: ["Liệt kê cụ thể loại vấn đề cần báo và loại cần bỏ qua.", "Định nghĩa từng mức độ nghiêm trọng, kèm ví dụ code.", "Tạm tắt nhóm bình luận về cách viết trong lúc chỉnh tiêu chí."],
      },
      {
        title: "Lọc bằng mức độ tự tin do model tự báo",
        scenario: "Nhóm yêu cầu model ghi mức độ tự tin cho mỗi phát hiện và chỉ đăng những phát hiện trên 0,9. Một số lỗi bảo mật thật chỉ được chấm 0,7 nên bị lọc mất.",
        bait: "Hạ ngưỡng xuống 0,7.",
        why: "Con số tự tin chưa được đối chiếu với thực tế thì không phản ánh đúng khả năng phát hiện đó đúng hay sai. Đổi ngưỡng một cách cảm tính chỉ chuyển vấn đề sang chỗ khác.",
        fix: ["Dùng tiêu chí cụ thể để giảm báo nhầm ngay từ gốc.", "Nếu dùng mức độ tự tin, hãy đối chiếu nó với một tập dữ liệu đã biết đúng sai, và dùng nó để quyết định chuyển cho người xem lại, chứ không phải để âm thầm xóa phát hiện."],
      },
    ],
    quiz: [
      {
        level: "hard",
        q: "Bot review có ba nhóm phát hiện: bảo mật (báo nhầm 5%), hiệu năng (báo nhầm 10%), comment lỗi thời (báo nhầm 60%). Lập trình viên bắt đầu phớt lờ bot. Nên làm gì trước tiên?",
        options: ["Thêm câu “hãy thận trọng, chỉ báo khi chắc chắn” vào hướng dẫn", "Tạm tắt nhóm comment lỗi thời, viết lại tiêu chí cụ thể rồi mới bật lại", "Tắt toàn bộ bot cho tới khi tỷ lệ báo nhầm giảm", "Thêm ví dụ cho nhóm bảo mật vì đây là nhóm quan trọng nhất, rồi theo dõi thêm một thời gian"],
        en: { q: "A review bot has three finding categories: security (5% false positives), performance (10%), stale comments (60%). Developers are starting to ignore the bot. What should you do first?", options: ["Add “be careful, only report when certain” to the general instructions", "Pause the stale-comment category, rewrite its criteria concretely, then re-enable it", "Turn off the entire bot until false positives drop", "Add examples to the security category since it matters most, then keep monitoring"] },
        answer: 1,
        explain: "Xử lý đúng nguồn gây nhiễu, giữ lại những nhóm đang hoạt động tốt, và lấy lại niềm tin của người dùng.",
        notes: ["Chung chung, không nhắm vào nhóm đang gây nhiễu.", "Đúng.", "Mất luôn nhóm bảo mật đang hoạt động tốt.", "Nhóm bảo mật không phải là vấn đề."],
      },
    ],
  },

  /* ─────────────── 4-2 ─────────────── */
  "4-2": {
    advanced: `
<section class="adv-block">
  <h4>Đặt ví dụ vào prompt như thế nào</h4>
  <pre><code>Bạn phân loại yêu cầu hỗ trợ vào một nhóm chính.

&lt;examples&gt;
  &lt;example&gt;
    &lt;ticket&gt;Bị trừ tiền hai lần sau khi app báo lỗi thanh toán&lt;/ticket&gt;
    &lt;label&gt;billing&lt;/label&gt;
    &lt;why&gt;Khách bị ảnh hưởng về tiền nên xếp vào billing;
         lỗi app chỉ là nguyên nhân phụ.&lt;/why&gt;
  &lt;/example&gt;
  ...
&lt;/examples&gt;</code></pre>
  <p>Thẻ <code>&lt;example&gt;</code> giúp model phân biệt đâu là ví dụ, đâu là dữ liệu thật cần xử lý. Phần <code>&lt;why&gt;</code> dạy model <b>cách quyết định</b>, nhờ đó nó áp dụng được cho những trường hợp chưa gặp, thay vì chỉ học thuộc đáp án.</p>
</section>
<section class="adv-block">
  <h4>Chọn ví dụ cho tốt</h4>
  <p><b>Nên</b> chọn những trường hợp nằm ở ranh giới giữa các lựa chọn, vì đó là chỗ model đang hay nhầm. Ví dụ nên đa dạng về hình thức: ngắn, dài, viết lộn xộn, viết gọn gàng. Có cả ví dụ “nên báo” và “không cần báo”.</p>
  <p><b>Tránh</b> đưa nhiều ví dụ dễ và giống nhau; khi đó model học bắt chước những chi tiết bề ngoài. Đặc biệt tránh ví dụ mâu thuẫn với hướng dẫn đã viết, vì model thường nghe theo ví dụ hơn là nghe theo lời dặn.</p>
</section>`,
    traps: [
      {
        title: "Các ví dụ quá giống nhau",
        level: "hard",
        scenario: "Bốn ví dụ trích xuất đều là hóa đơn của cùng một nhà cung cấp, cùng một mẫu in. Gặp hóa đơn mẫu khác, model điền luôn tên nhà cung cấp cũ vào ô tên nhà cung cấp.",
        bait: "Thêm mười ví dụ nữa từ chính nhà cung cấp đó cho chắc.",
        why: "Ví dụ giống hệt nhau dạy model sao chép đặc điểm bề ngoài, thay vì hiểu quy tắc lấy dữ liệu.",
        fix: ["Đa dạng hóa ví dụ: nhiều mẫu hóa đơn, nhiều ngôn ngữ, có cả trường hợp thiếu thông tin.", "Thêm một ví dụ có trường bị thiếu, trả về null.", "Kèm giải thích dữ liệu được lấy từ vị trí nào trên hóa đơn."],
      },
      {
        title: "Ví dụ mâu thuẫn với hướng dẫn",
        scenario: "Hướng dẫn ghi: yêu cầu vừa liên quan tiền vừa liên quan lỗi app thì xếp vào billing. Một ví dụ cũ lại xếp trường hợp y như vậy vào bug. Kết quả phân loại lúc thế này lúc thế khác.",
        bait: "Viết hoa câu hướng dẫn.",
        why: "Model thường coi trọng ví dụ, nên ví dụ mâu thuẫn tạo ra hai tín hiệu ngược nhau.",
        fix: ["Rà lại toàn bộ ví dụ cho khớp với hướng dẫn.", "Coi ví dụ là một phần của bản yêu cầu, xem xét kỹ như xem xét code."],
      },
    ],
    quiz: [
      {
        level: "hard",
        q: "Model phân loại tốt những trường hợp rõ ràng, nhưng dao động ở những trường hợp nằm giữa hai nhóm. Bạn chỉ có chỗ cho bốn ví dụ. Nên chọn ví dụ nào?",
        options: ["Bốn trường hợp rõ ràng, tiêu biểu nhất của mỗi nhóm", "Bốn ca nằm ở ranh giới, mỗi ca giải thích vì sao chọn nhóm đó", "Bốn trường hợp lấy ngẫu nhiên từ dữ liệu cũ cho khách quan", "Bốn trường hợp dài nhất để model thấy nhiều chi tiết"],
        en: { q: "A model classifies clear cases well but wavers on cases between two categories. You only have room for four examples. Which should you choose?", options: ["The four clearest, most typical cases of each category", "Four borderline cases, each explaining why that category was chosen", "Four cases sampled at random from past data to stay objective", "The four longest cases so the model sees more detail"] },
        answer: 1,
        explain: "Ví dụ có giá trị nhất là ở chỗ model đang làm sai. Phần giải thích giúp model hiểu quy tắc để áp dụng cho trường hợp mới.",
        notes: ["Model vốn đã làm tốt những trường hợp rõ ràng.", "Đúng.", "Phần lớn sẽ là trường hợp dễ.", "Độ dài không liên quan tới ranh giới quyết định."],
      },
    ],
  },

  /* ─────────────── 4-3 ─────────────── */
  "4-3": {
    widgets: ["extractionTrace", "schemaDemo"],
    advanced: `
<section class="adv-block">
  <h4>Schema đảm bảo được gì, không đảm bảo được gì</h4>
  <p>Schema đảm bảo <b>hình dạng</b> của dữ liệu: JSON hợp lệ, đủ các trường bắt buộc, đúng kiểu dữ liệu, giá trị nằm trong danh sách cho phép.</p>
  <p>Schema không đảm bảo <b>nội dung đúng</b>: con số có khớp với tài liệu không, tổng các dòng có bằng tổng tiền không, ngày có hợp lý không, giá trị có nằm đúng ô không. Những điều này cần code của bạn kiểm tra thêm sau khi nhận kết quả.</p>
  <p>API hiện có thêm chế độ đầu ra có cấu trúc nghiêm ngặt (structured outputs), ép model sinh đúng theo schema ngay khi tạo câu trả lời. Chế độ này làm phần “hình dạng” chắc chắn hơn nữa, nhưng phần “nội dung đúng” vẫn là việc của bạn.</p>
</section>
<section class="adv-block">
  <h4>Bốn mẹo thiết kế schema</h4>
  <p><b>Cho phép null</b> với những trường có thể không có trong tài liệu, ví dụ ngày gia hạn hợp đồng. Nếu bắt buộc phải điền, model sẽ bịa ra một giá trị trông hợp lý.</p>
  <p><b>Thêm “other” kèm ô mô tả</b> cho danh sách lựa chọn. Nếu không có lối thoát này, một hợp đồng tư vấn pháp lý sẽ bị ép vào nhóm gần nhất, ví dụ “it”.</p>
  <p><b>Thêm ô trích dẫn</b>, ví dụ <code>evidence_quote</code>, để biết giá trị lấy từ câu nào trong tài liệu. Code có thể kiểm tra câu đó có thật trong tài liệu hay không.</p>
  <p><b>Ghi định dạng ngay trong mô tả trường</b>, ví dụ “YYYY-MM-DD”, để mọi ngày tháng đều về cùng một dạng.</p>
</section>
<section class="adv-block">
  <h4>Khi làm thật với model mới nhất</h4>
  <p>Đề thi mô tả cách lấy JSON bằng một công cụ có schema kèm <code>tool_choice</code> ép gọi công cụ đó. Với các model mới nhất, kiểu ép này bị từ chối; cách nên dùng là structured outputs (<code>output_config.format</code> với JSON schema), cho kết quả là JSON đúng schema ngay trong câu trả lời. Các mẹo thiết kế schema ở trên vẫn áp dụng y nguyên. Bài thực hành chương 4 có code mẫu đầy đủ.</p>
</section>`,
    traps: [
      {
        title: "Ngày gia hạn “trông rất hợp lý”",
        level: "hard",
        scenario: "Trong pipeline trích xuất hợp đồng, trường <code>renewal_date</code> là bắt buộc và kiểu chuỗi. Với hợp đồng không có điều khoản gia hạn, model điền ngày kết thúc cộng thêm một năm. Bước kiểm tra không phát hiện được vì định dạng đúng và ngày nghe hợp lý.",
        bait: "Thêm vào prompt: “không được bịa thông tin”.",
        why: "Schema bắt buộc phải có một chuỗi, nên model không có cách hợp lệ nào để nói “không có”.",
        fix: ["Cho phép trường nhận null, và ghi trong mô tả: “để null nếu hợp đồng không có điều khoản gia hạn”.", "Thêm ô trích dẫn bắt buộc khi trường có giá trị, rồi kiểm tra câu trích dẫn có thật trong tài liệu."],
      },
      {
        title: "Tin rằng JSON hợp lệ là dữ liệu đúng",
        scenario: "Sau khi chuyển sang trích xuất bằng công cụ có schema, lỗi đọc JSON giảm về 0. Nhóm bỏ luôn bước kiểm tra tổng tiền. Một tháng sau mới phát hiện 3% hóa đơn bị sai tổng.",
        bait: "Kết luận rằng schema đã giải quyết xong vấn đề chất lượng.",
        why: "Schema chỉ loại bỏ lỗi cú pháp, không loại bỏ lỗi về nội dung.",
        fix: ["Giữ bước kiểm tra nội dung: tổng các dòng bằng tổng ghi trên hóa đơn, ngày hợp lệ, đối chiếu chéo.", "Khi phát hiện lỗi nội dung thì thử lại kèm mô tả lỗi, hoặc chuyển cho người kiểm tra."],
      },
    ],
    quiz: [
      {
        level: "hard",
        q: "Trường loại dịch vụ chỉ cho phép hai giá trị [it, marketing]. Một hợp đồng tư vấn pháp lý bị xếp vào \"it\". Sửa schema thế nào là tốt nhất?",
        options: ["Thêm \"legal\" vào danh sách giá trị cho phép", "Thêm \"other\" kèm trường service_detail (nullable) để mô tả", "Bỏ danh sách cố định, cho trường loại dịch vụ nhận chữ tự do để ghi đúng loại", "Cho trường loại dịch vụ nhận null khi không khớp"],
        en: { q: "A service-type field only allows two values: [it, marketing]. A legal consulting contract gets classified as \"it\". What is the best schema fix?", options: ["Add \"legal\" to the allowed values", "Add \"other\" plus a nullable service_detail field to describe it", "Drop the fixed list and let the service-type field accept free text so it is always accurate", "Allow the service-type field to be null when nothing matches"] },
        answer: 1,
        explain: "Danh sách có thể còn mở rộng thì cần một lối thoát “other” kèm mô tả. Cách này vẫn giữ được các giá trị chuẩn để thống kê.",
        notes: ["Chỉ sửa được trường hợp này; loại dịch vụ mới khác vẫn bị ép sai.", "Đúng.", "Mất tính thống nhất, khó thống kê.", "Mất thông tin: loại dịch vụ có tồn tại, chỉ là không nằm trong danh sách."],
        trap: "Cách “thêm legal vào danh sách” giải quyết đúng trường hợp trước mắt nên rất hấp dẫn, nhưng không bền.",
      },
    ],
  },

  /* ─────────────── 4-4 ─────────────── */
  "4-4": {
    advanced: `
<section class="adv-block">
  <h4>Thử lại kèm phản hồi thực chất là một cuộc trò chuyện</h4>
  <pre><code>messages = [
  {"role": "user", "content": "&lt;document&gt;...&lt;/document&gt;"},
  {"role": "assistant", "content": [kết quả trích xuất lần 1]},
  {"role": "user", "content": [{
     "type": "tool_result", "is_error": true,
     "content": "Lỗi kiểm tra:\\n- invoice_date phải theo dạng YYYY-MM-DD\\n- tổng các dòng 1140 khác tổng ghi 1240"
  }]}
]</code></pre>
  <p>Trong lần thử lại, Claude nhìn thấy cả tài liệu gốc, kết quả lần trước của chính nó, và lỗi cụ thể. Vì vậy nó sửa đúng chỗ thay vì làm lại một cách ngẫu nhiên.</p>
</section>
<section class="adv-block">
  <h4>Lỗi nào thử lại có ích</h4>
  <p><b>Có ích:</b> sai định dạng (ngày, số), điền nhầm ô (ngày giao hàng vào ô ngày hóa đơn), sót một dòng khiến tổng bị lệch.</p>
  <p><b>Vô ích:</b> thông tin không có trong tài liệu, hoặc tài liệu bị mờ, hỏng. Thử lại lúc này chỉ làm tăng khả năng model bịa ra giá trị. Cách đúng là để trống và chuyển cho người kiểm tra.</p>
  <p>Hãy giới hạn số lần thử, thường là một đến hai lần. Hết lượt thì chuyển cho người kiểm tra, kèm lỗi cuối cùng. Trước khi thử lại vì thiếu một trường, nên kiểm tra nhanh xem tài liệu có chứa dấu hiệu nào của trường đó không.</p>
</section>`,
    traps: [
      {
        title: "Tăng số lần thử lại",
        level: "hard",
        scenario: "8% hóa đơn vẫn thiếu số đơn đặt hàng (PO) sau ba lần thử lại. Nhóm tăng lên mười lần. Tỷ lệ thiếu giảm còn 1%, nhưng khi kiểm tra mẫu thì phát hiện nhiều số PO là bịa.",
        bait: "Vui mừng vì tỷ lệ thiếu đã giảm.",
        why: "Phần lớn các hóa đơn đó vốn không ghi số PO. Bị ép thử lại nhiều lần, model điền một chuỗi trông hợp lệ cho xong.",
        fix: ["Trước khi thử lại vì thiếu trường, kiểm tra tài liệu có chứa thông tin đó không.", "Nếu tài liệu không có: để null, đánh dấu “không có trong tài liệu”, chuyển cho người kiểm tra hoặc tra hệ thống mua hàng.", "Đánh giá chất lượng bằng cách kiểm tra mẫu, không chỉ nhìn tỷ lệ điền đủ."],
      },
      {
        title: "Thử lại mà không nói lỗi gì",
        scenario: "Bước kiểm tra phát hiện lỗi, và pipeline gửi lại y nguyên yêu cầu ban đầu, không kèm thêm gì.",
        bait: "Nghĩ rằng thử lại biết đâu sẽ ra kết quả khác.",
        why: "Model không biết mình sai ở đâu. Kết quả mới có thể sai theo một kiểu khác.",
        fix: ["Gửi kèm kết quả lần trước và mô tả lỗi cụ thể.", "Giới hạn số lần thử."],
      },
    ],
    quiz: [
      {
        level: "hard",
        q: "Bước kiểm tra báo: ngày hóa đơn \"15/03/2026\" sai định dạng, và ô mã số thuế bị trống. Kiểm tra tài liệu gốc thì thấy có ngày, nhưng không hề có mã số thuế. Nên làm gì?",
        options: ["Thử lại, kèm mô tả cả hai lỗi cho model sửa", "Thử lại kèm lỗi ngày; mã số thuế để null, ghi “không có trong tài liệu”", "Không thử lại, chuyển ngay cả hai lỗi cho người kiểm tra vì tài liệu đã có vấn đề", "Thử lại năm lần liên tiếp mà không cần kèm mô tả lỗi"],
        en: { q: "Validation reports: the invoice date \"15/03/2026\" has the wrong format, and the tax ID field is empty. The source document has the date, but no tax ID at all. What should you do?", options: ["Retry, describing both errors for the model to fix", "Retry with the date error only; set tax ID to null, marked “not in document”", "Do not retry; send both errors to a human reviewer right away because the document is problematic", "Retry five times in a row without including any error description"] },
        answer: 1,
        explain: "Tách phần sửa được (định dạng ngày) khỏi phần thông tin không tồn tại (thử lại vô ích và dễ dẫn tới bịa).",
        notes: ["Thử lại với trường không có trong tài liệu sẽ khuyến khích model bịa.", "Đúng.", "Bỏ lỡ cơ hội tự sửa một lỗi dễ.", "Thử lại không kèm thông tin, lại còn quá nhiều lần."],
      },
    ],
  },

  /* ─────────────── 4-5 ─────────────── */
  "4-5": {
    widgets: ["batchTrace", "batchDecider"],
    advanced: `
<section class="adv-block">
  <h4>Vòng đời của một batch</h4>
  <ol class="steps-dg">
    <li>Gửi một danh sách yêu cầu lên <code>/v1/messages/batches</code>, mỗi yêu cầu có một <code>custom_id</code> do bạn đặt.</li>
    <li>Nhận về mã batch. Trạng thái ban đầu là “đang xử lý” (<code>in_progress</code>).</li>
    <li>Thỉnh thoảng hỏi lại trạng thái, ví dụ vài phút một lần, cho tới khi trạng thái là “đã xong” (<code>ended</code>).</li>
    <li>Tải file kết quả. Mỗi dòng là kết quả của một yêu cầu, và <b>không theo thứ tự đã gửi</b>.</li>
    <li class="hot">Ghép kết quả theo <code>custom_id</code>, rồi gửi lại riêng những yêu cầu bị lỗi.</li>
  </ol>
</section>
<section class="adv-block">
  <h4>Batch và vòng lặp gọi công cụ</h4>
  <p>Mỗi yêu cầu trong batch chỉ là một lượt hỏi và đáp. Claude có thể trả về yêu cầu chạy công cụ, nhưng không có ai chạy công cụ đó và gửi kết quả lại ngay trong batch. Vì vậy những việc cần nhiều lượt gọi công cụ không phù hợp với batch, trừ khi bạn chấp nhận chia thành nhiều vòng: batch lượt 1, chạy công cụ, rồi batch lượt 2, và cứ thế.</p>
</section>
<section class="adv-block">
  <h4>Tính giờ gửi cho kịp hạn</h4>
  <p>Hạn chót trừ đi 24 giờ (thời gian xử lý tối đa) là thời điểm muộn nhất phải gửi batch. Nên trừ thêm vài giờ dự phòng cho vòng gửi lại những yêu cầu bị lỗi. Ví dụ hạn là 30 giờ nữa thì nên gửi trong khoảng 4 tới 6 giờ đầu.</p>
</section>`,
    traps: [
      {
        title: "Agent cần nhiều lượt nhưng lại chạy bằng batch",
        level: "hard",
        scenario: "Nhóm muốn chạy agent điều tra (mỗi việc cần 5 tới 10 lượt gọi công cụ) cho 5.000 yêu cầu hỗ trợ qua đêm bằng Batch API để tiết kiệm. Mỗi yêu cầu trong batch chỉ trả về một lệnh gọi công cụ rồi dừng.",
        bait: "Kết luận rằng Batch API bị lỗi.",
        why: "Batch xử lý mỗi yêu cầu như một lượt riêng. Không có ai chạy công cụ và gửi kết quả lại trong cùng yêu cầu đó.",
        fix: ["Cách 1: chạy trực tiếp, song song có giới hạn, cho những việc cần nhiều lượt.", "Cách 2: chia thành nhiều vòng batch, sau mỗi vòng chạy công cụ rồi gửi vòng tiếp theo, chấp nhận chờ lâu hơn.", "Cách 3: thiết kế lại để mỗi việc chỉ cần một lượt, bằng cách đưa sẵn dữ liệu cần thiết vào yêu cầu."],
      },
      {
        title: "Ghép kết quả theo số thứ tự dòng",
        scenario: "Script ghép dòng thứ i của file kết quả với tài liệu thứ i đã gửi. Báo cáo gán nhầm kết quả của khách hàng này sang khách hàng khác.",
        bait: "Sắp xếp lại danh sách gửi đi cho khớp.",
        why: "Thứ tự kết quả không được đảm bảo giống thứ tự gửi.",
        fix: ["Luôn ghép bằng <code>custom_id</code>, đặt bằng mã tài liệu duy nhất."],
      },
    ],
    quiz: [
      {
        level: "hard",
        q: "Báo cáo tuân thủ phải có trước 9 giờ sáng thứ Hai. Dữ liệu sẵn sàng lúc 18 giờ thứ Sáu. Kế hoạch dùng Batch API nào hợp lý nhất?",
        options: ["Gửi batch lúc 8 giờ sáng thứ Hai để dữ liệu mới nhất", "Gửi ngay tối thứ Sáu; xong thì gửi lại phần lỗi theo custom_id", "Không dùng Batch vì Batch không cam kết thời gian hoàn thành", "Gửi từng yêu cầu trực tiếp vào sáng thứ Hai cho nhanh"],
        en: { q: "A compliance report must be ready by 9 a.m. Monday. The data is available at 6 p.m. Friday. Which Batch API plan makes the most sense?", options: ["Submit the batch at 8 a.m. Monday so the data is freshest", "Submit Friday evening; when done, resubmit failures by custom_id", "Do not use Batch because it has no completion-time guarantee", "Send each request directly on Monday morning for speed"] },
        answer: 1,
        explain: "Khoảng 63 giờ dư sức cho tối đa 24 giờ xử lý, cộng thêm một vòng gửi lại.",
        notes: ["Chỉ còn 1 giờ, trong khi batch có thể mất tới 24 giờ.", "Đúng.", "Không có cam kết thời gian không có nghĩa là không dùng được; chỉ cần tính giờ gửi hợp lý.", "Chi phí gấp đôi và dồn hết việc vào phút chót."],
      },
    ],
  },

  /* ─────────────── 4-6 ─────────────── */
  "4-6": {
    widgets: ["multiPassTrace", "multiPass"],
    advanced: `
<section class="adv-block">
  <h4>Vì sao suy nghĩ lâu hơn vẫn không bằng người khác đọc</h4>
  <p>Phiên vừa viết code mang theo toàn bộ cách lập luận đã dẫn tới đoạn code đó. Khi tự review, nó có xu hướng xác nhận lại những giả định của chính mình. Bật chế độ suy nghĩ mở rộng trong <b>cùng</b> phiên đó không giúp nó thoát khỏi những giả định này.</p>
  <p>Một phiên review độc lập bắt đầu với ngữ cảnh sạch: chỉ có đoạn code và tiêu chí review. Có thể giao cho nó vai trò khác hẳn, ví dụ “hãy tìm mọi cách làm cho đoạn code này hỏng”. Với thay đổi quan trọng, có thể dùng nhiều phiên review chuyên biệt chạy song song: một phiên về bảo mật, một phiên về xử lý đồng thời, một phiên về xử lý lỗi.</p>
</section>
<section class="adv-block">
  <h4>Dùng mức độ tự tin để chia việc, không để xóa</h4>
  <p>Phát hiện có độ tự tin cao có thể đăng tự động. Độ tự tin trung bình thì chuyển cho người xem lại. Độ tự tin thấp thì ghi lại để cải thiện tiêu chí sau này. Mức độ tự tin chỉ đáng tin sau khi đã được đối chiếu với kết quả thực tế (xem mục 5-5).</p>
</section>`,
    traps: [
      {
        title: "Bật suy nghĩ mở rộng để tự review",
        level: "hard",
        scenario: "Code do Claude viết hay có lỗi khi nhiều yêu cầu chạy cùng lúc (race condition). Có người đề xuất bật chế độ suy nghĩ mở rộng thật lâu và yêu cầu chính phiên đó “suy nghĩ kỹ rồi tự review”.",
        bait: "Nghĩ rằng suy nghĩ lâu hơn thì review tốt hơn.",
        why: "Vẫn là cùng ngữ cảnh, cùng những giả định đã dẫn tới lỗi.",
        fix: ["Dùng một phiên riêng, không mang ngữ cảnh lúc viết code, để review.", "Thêm một phiên review chuyên về xử lý đồng thời, với tiêu chí cụ thể."],
      },
      {
        title: "Một lượt review khổng lồ",
        scenario: "Pull request 40 file được gửi trong một lần gọi. Sáu file đầu được nhận xét kỹ, những file cuối chỉ có một dòng “trông ổn”.",
        bait: "Dùng model có ngữ cảnh lớn hơn.",
        why: "Vấn đề là sự chú ý bị dàn mỏng, không phải thiếu chỗ chứa.",
        fix: ["Review từng file riêng, chạy song song.", "Thêm một lượt xem liên kết giữa các file, dựa trên bản tóm tắt của từng file."],
      },
    ],
    quiz: [
      {
        level: "hard",
        q: "Sau khi chuyển sang review từng file riêng, bot tìm được nhiều lỗi trong từng file hơn, nhưng bỏ sót lỗi do hai module hiểu khác nhau về định dạng dữ liệu. Nên bổ sung gì?",
        options: ["Quay lại review cả pull request trong một lượt duy nhất", "Thêm một lượt xem tóm tắt giao tiếp của các file để tìm lỗi giữa module", "Viết hướng dẫn review từng file dài và chi tiết hơn", "Cho mỗi phiên review từng file đọc thêm toàn bộ repo để hiểu các module khác dùng dữ liệu thế nào"],
        en: { q: "After switching to per-file reviews, the bot finds more bugs within each file but misses bugs caused by two modules assuming different data formats. What should you add?", options: ["Go back to reviewing the whole pull request in a single pass", "Add a pass over each file's interface summary to find cross-module issues", "Write longer, more detailed per-file review instructions", "Let each per-file review session also read the whole repo to see how other modules use the data"] },
        answer: 1,
        explain: "Lỗi giữa các file cần một lượt nhìn tổng thể, nhưng đầu vào phải gọn để sự chú ý không bị dàn mỏng.",
        notes: ["Quay lại vấn đề chú ý bị dàn mỏng.", "Đúng.", "Phiên review vẫn không nhìn thấy file kia.", "Làm phình ngữ cảnh của mỗi phiên, mất lợi ích tập trung."],
      },
    ],
  },
});
