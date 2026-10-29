/* Mô phỏng chi tiết — Chương 3: Claude Code Configuration & Workflows */
(function () {
  const { trace } = window.SIM;
  const W = window.WIDGETS;

  /* ───────── 3-1 Nạp CLAUDE.md và rules ───────── */
  W.memoryLoad = {
    title: "Claude Code nạp các file hướng dẫn theo thứ tự nào?",
    render: trace({
      intro: "Một lập trình viên mở Claude Code trong thư mục <code>repo/packages/api</code> rồi nhờ sửa một file test. Mở tab “Hướng dẫn đang được nạp” để xem những gì Claude đang đọc ở mỗi bước.",
      actors: [
        { id: "d", icon: "👩‍💻", name: "Lập trình viên" },
        { id: "h", icon: "🖥️", name: "Claude Code" },
        { id: "f", icon: "📁", name: "Các file hướng dẫn", sub: "máy cá nhân và repo" },
        { id: "c", icon: "🧠", name: "Claude" },
      ],
      stateTitle: "Hướng dẫn đang được nạp",
      steps: [
        { from: "d", to: "h", kind: "req", label: "mở", title: "Mở Claude Code trong một thư mục con", desc: "Thư mục đang đứng là <code>packages/api</code>, nằm bên trong repo.", payload: "~/code/repo/packages/api $ claude", state: [] },
        { from: "h", to: "f", kind: "req", label: "tìm", title: "Claude Code đi tìm các file hướng dẫn", desc: "Claude Code đọc file cá nhân trong thư mục home, rồi đi từ thư mục hiện tại ngược lên tới gốc repo và đọc mọi CLAUDE.md gặp trên đường. Các rule không khai báo <code>paths</code> được nạp ngay; rule có <code>paths</code> thì chờ tới khi cần." },
        { from: "f", to: "h", kind: "res", label: "tìm thấy", title: "Tìm thấy bốn file", desc: "Ba file được nạp ngay. File rule về viết test có khai báo <code>paths</code>, nên chưa được nạp.", payload: "~/.claude/CLAUDE.md                (cá nhân)  → \"Trả lời tiếng Việt, ngắn gọn\"\nrepo/CLAUDE.md                     (dự án)    → quy ước chung, có dòng @docs/architecture.md\nrepo/packages/api/CLAUDE.md        (thư mục)  → quy ước riêng của phần API\nrepo/.claude/rules/testing.md      (rule)     → paths: [\"**/*.test.ts\"], chưa nạp", push: [{ r: "sys", t: "~/.claude/CLAUDE.md <i>(cá nhân, không chia sẻ)</i>" }, { r: "sys", t: "repo/CLAUDE.md <i>(của dự án)</i>" }, { r: "sys", t: "packages/api/CLAUDE.md <i>(thư mục đang đứng)</i>" }] },
        { from: "h", to: "f", kind: "req", label: "@import", title: "Nạp thêm file được nhắc tới bằng @", desc: "Trong repo/CLAUDE.md có dòng <code>@docs/architecture.md</code>. Claude Code nạp luôn nội dung file đó. Cách này giúp CLAUDE.md chính ngắn gọn, phần chi tiết để ở file riêng.", payload: "# repo/CLAUDE.md\nXem kiến trúc tại: @docs/architecture.md\nLệnh build và test: @package.json", push: [{ r: "sys", t: "docs/architecture.md <i>(nạp qua @)</i>" }] },
        { from: "h", to: "c", kind: "req", label: "bắt đầu", title: "Các hướng dẫn được gửi kèm ở mọi lượt", desc: "Từ giờ, mỗi lần gọi Claude đều kèm theo những hướng dẫn này.", note: "Gõ <code>/memory</code> để xem chính xác những file nào đang được nạp. Đây là cách nhanh nhất để tìm hiểu vì sao Claude không làm theo quy ước." },
        { from: "d", to: "c", kind: "req", label: "giao việc", title: "Lập trình viên giao việc", desc: "Nhờ sửa một test đang chạy lỗi.", payload: "Sửa giúp test đang lỗi trong src/user.test.ts" },
        { from: "c", to: "h", kind: "res", label: "Read", title: "Claude mở file test", desc: "Claude dùng Read để mở file test.", payload: { name: "Read", input: { file_path: "/repo/packages/api/src/user.test.ts" } } },
        { from: "h", to: "f", kind: "internal", label: "khớp mẫu", title: "File khớp mẫu **/*.test.ts, rule về viết test được nạp", desc: "Claude Code so đường dẫn file vừa mở với mẫu <code>paths</code> của từng rule. File này khớp với rule testing.md, nên rule đó được nạp. Nếu Claude chỉ mở README, rule này sẽ không bao giờ được nạp và không tốn chỗ.", push: [{ r: "ok", t: ".claude/rules/testing.md <i>(khớp mẫu đường dẫn)</i>" }] },
        { from: "d", to: "h", kind: "warn", label: "người mới", title: "Một đồng nghiệp clone repo về máy khác", desc: "Máy đồng nghiệp có đủ mọi file trong repo, nhưng <b>không</b> có file <code>~/.claude/CLAUDE.md</code> của bạn, vì file đó nằm trên máy bạn.", warn: "Nếu quy ước của nhóm được ghi trong file cá nhân của trưởng nhóm, mọi người khác sẽ không nhận được.", state: [{ r: "sys", t: "repo/CLAUDE.md" }, { r: "sys", t: "packages/api/CLAUDE.md" }, { r: "sys", t: "docs/architecture.md" }, { r: "err", t: "(thiếu) quy ước chỉ có trên máy trưởng nhóm" }] },
      ],
    }),
  };

  /* ───────── 3-2 Skill với context: fork ───────── */
  const SKILL = `---
name: audit-deps
description: Kiểm tra thư viện lỗi thời hoặc có lỗ hổng bảo mật trong một package.
  Dùng khi người dùng hỏi về bảo mật thư viện hoặc muốn nâng cấp thư viện.
context: fork
allowed-tools: Read, Grep, Glob, Bash(npm audit:*), Bash(npm outdated:*)
argument-hint: [đường-dẫn-package]
---
# Quy trình
1. Chạy \`npm audit --json\` và \`npm outdated --json\` trong $ARGUMENTS
2. Với mỗi lỗ hổng mức cao trở lên: tìm những nơi đang dùng thư viện đó
3. Trả về một bảng: thư viện | mức độ | nơi dùng | phiên bản nên nâng (tối đa 15 dòng)`;
  W.skillTrace = {
    title: "Skill chạy thế nào, và context: fork giúp gì",
    render: trace({
      intro: "Theo dõi số token mà phiên chính phải chứa. Bật hoặc tắt <code>context: fork</code> để thấy phần kết quả dài dòng đi đâu.",
      actors: [
        { id: "d", icon: "👩‍💻", name: "Lập trình viên" },
        { id: "h", icon: "🖥️", name: "Claude Code" },
        { id: "m", icon: "🧠", name: "Phiên chính" },
        { id: "f", icon: "🍴", name: "Agent con", sub: "ngữ cảnh riêng" },
      ],
      stateTitle: "Phiên chính đang chứa gì",
      controls: [{ id: "fork", type: "toggle", label: "Có dòng <code>context: fork</code> trong SKILL.md", value: true }],
      steps: ({ fork }) => {
        const s = [];
        s.push({ from: "h", to: "h", kind: "internal", title: "Lúc khởi động, chỉ đọc tên và mô tả của skill", desc: "Claude Code chỉ đọc vài dòng đầu của SKILL.md (tên và mô tả), khoảng 60 token, để Claude biết skill này tồn tại và khi nào nên dùng. Phần hướng dẫn chi tiết bên dưới chưa được đọc.", payloads: [{ t: ".claude/skills/audit-deps/SKILL.md", d: SKILL, hl: ["name:", "description:", "context:", "allowed-tools:"] }], fields: [["name, description", "Được đọc ngay lúc khởi động. Claude dựa vào mô tả để quyết định khi nào dùng skill."], ["phần hướng dẫn", "Chỉ được đọc khi skill thực sự chạy."], ["context: fork", "Chạy skill trong một agent con riêng; chỉ kết quả cuối quay về phiên chính."], ["allowed-tools", "Giới hạn công cụ được dùng trong lúc chạy skill."], ["argument-hint", "Gợi ý tham số khi gõ /audit-deps."]], state: [{ r: "sys", t: "CLAUDE.md và các hướng dẫn khác, <b>khoảng 3.000 token</b>" }, { r: "sys", t: "Danh sách skill: audit-deps (chỉ mô tả), <b>khoảng 60 token</b>" }] });
        s.push({ from: "d", to: "h", kind: "req", label: "/audit-deps", title: "Lập trình viên gọi skill", desc: "Gõ <code>/audit-deps packages/api</code>. Claude cũng có thể tự chọn skill này nếu người dùng hỏi điều gì khớp với đoạn mô tả.", payload: "/audit-deps packages/api" });
        s.push({ from: "h", to: "h", kind: "internal", title: "Đọc phần hướng dẫn, điền tham số", desc: fork ? "Claude Code đọc phần hướng dẫn và thay <code>$ARGUMENTS</code> bằng <code>packages/api</code>. Vì có <code>context: fork</code>, nó tạo một agent con để chạy skill." : "Claude Code đọc phần hướng dẫn và thay <code>$ARGUMENTS</code> bằng <code>packages/api</code>. Vì không có <code>context: fork</code>, skill sẽ chạy ngay trong phiên chính." });
        if (fork) {
          s.push({ from: "h", to: "f", kind: "req", label: "tạo agent con", title: "Agent con nhận nhiệm vụ và bộ công cụ giới hạn", desc: "Agent con chỉ được dùng những công cụ ghi trong <code>allowed-tools</code>.", payload: { tools: ["Read", "Grep", "Glob", "Bash(npm audit:*)", "Bash(npm outdated:*)"], messages: [{ role: "user", content: "1. Chạy `npm audit --json` ... trong packages/api ..." }] }, hl: ["tools"] });
          s.push({ from: "f", to: "f", kind: "internal", title: "Agent con làm phần việc nặng trong ngữ cảnh riêng", desc: "Lệnh <code>npm audit --json</code> trả về khoảng 28.000 token dữ liệu. Tìm kiếm chín thư viện bị cảnh báo thêm khoảng 6.000 token. Tất cả nằm ở phía agent con. Khi agent con thử sửa file package.json, nó bị chặn, vì Edit không có trong danh sách công cụ được phép." });
          s.push({ from: "f", to: "m", kind: "ok", label: "bảng gọn", title: "Chỉ bảng kết quả quay về phiên chính", desc: "Phiên chính chỉ tăng khoảng 900 token, thay vì khoảng 34.000. Vẫn còn nhiều chỗ cho những câu hỏi tiếp theo.", payload: "| Thư viện | Mức độ | Nơi dùng | Nên nâng lên |\n|---|---|---|---|\n| jsonwebtoken 8.5.1 | cao | src/auth/*.ts (4 file) | 9.0.0 trở lên |\n| axios 0.21.1 | nghiêm trọng | src/clients/http.ts | 1.7.4 trở lên |\n... (7 dòng nữa)", push: [{ r: "ok", t: "Kết quả audit-deps, <b>khoảng 900 token</b>" }] });
        } else {
          s.push({ from: "h", to: "m", kind: "warn", label: "chạy trong phiên chính", title: "Skill chạy ngay trong phiên chính", desc: "Phần hướng dẫn được đưa vào phiên chính, và mọi kết quả trung gian cũng đổ vào đây.", push: [{ r: "note", t: "Hướng dẫn trong SKILL.md, <b>khoảng 400 token</b>" }] });
          s.push({ from: "m", to: "m", kind: "err", title: "Kết quả trung gian làm đầy phiên chính", desc: "Toàn bộ dữ liệu thô của npm audit và các lần tìm kiếm đều nằm trong phiên chính.", push: [{ r: "err", t: "Kết quả npm audit, <b>khoảng 28.000 token</b>" }, { r: "err", t: "9 lần tìm kiếm, <b>khoảng 6.000 token</b>" }], warn: "Phiên chính mất khoảng 34.000 token cho dữ liệu chỉ cần dùng một lần. Bạn sẽ sớm phải nén cuộc trò chuyện, và có thể mất những chi tiết quan trọng khác." });
        }
        s.push({ from: "m", to: "d", kind: "ok", label: "trả lời", title: "Claude trình bày kết quả", desc: "Claude tóm tắt những việc cần làm ngay và hỏi bạn có muốn bắt tay vào sửa không.", payload: "Có 2 lỗ hổng mức nghiêm trọng và cao cần xử lý trước: axios và jsonwebtoken. Bạn có muốn mình tạo nhánh để nâng cấp không?" });
        return s;
      },
    }),
  };

  /* ───────── 3-4 Plan mode ───────── */
  W.planModeTrace = {
    title: "Plan mode: tìm hiểu trước, duyệt kế hoạch, rồi mới sửa",
    render: trace({
      intro: "Nhiệm vụ: chuyển thư viện ngày tháng Moment.js sang date-fns, ảnh hưởng khoảng 47 file. Ở plan mode, Claude chỉ được đọc và tìm hiểu; mọi lệnh sửa file đều bị chặn cho tới khi bạn duyệt kế hoạch.",
      actors: [
        { id: "d", icon: "👩‍💻", name: "Lập trình viên" },
        { id: "h", icon: "🖥️", name: "Claude Code", sub: "quản lý quyền" },
        { id: "c", icon: "🧠", name: "Claude" },
        { id: "r", icon: "📁", name: "Repo" },
      ],
      stateTitle: "Chế độ hiện tại",
      steps: [
        { from: "d", to: "h", kind: "req", label: "bật plan mode", key: true, title: "Bật plan mode rồi giao việc", desc: "Bấm <kbd>Shift</kbd>+<kbd>Tab</kbd> để chuyển sang plan mode (hoặc khởi động với <code>--permission-mode plan</code>), rồi mô tả nhiệm vụ.", payload: "⏸ plan mode on\n> Chuyển toàn bộ Moment.js sang date-fns, giữ nguyên cách xử lý múi giờ.", state: [{ r: "sys", t: "<b>plan mode</b>: chỉ được đọc và tìm hiểu" }] },
        { from: "c", to: "h", kind: "res", label: "Grep", title: "Claude đo phạm vi công việc", desc: "Claude đếm xem có bao nhiêu chỗ đang dùng Moment.js.", payload: { name: "Grep", input: { pattern: "from ['\"]moment['\"]", output_mode: "count" } } },
        { from: "r", to: "c", kind: "res", label: "47 file", title: "Có 47 file, 212 chỗ dùng", desc: "Tập trung ở ba khu vực: thanh toán, báo cáo và giao diện.", payload: "src/billing/*.ts: 61\nsrc/reports/*.ts: 88\nsrc/ui/**/*.tsx: 63" },
        { from: "c", to: "h", kind: "res", label: "giao khảo sát", key: true, title: "Giao phần khảo sát chi tiết cho Explore subagent", desc: "Thay vì tự đọc 47 file, Claude giao cho agent con chuyên khảo sát. Agent con đọc trong ngữ cảnh riêng và chỉ trả về bảng tóm tắt các kiểu sử dụng.", payload: { name: "Task", input: { subagent_type: "Explore", prompt: "Liệt kê các cách dùng moment (định dạng, múi giờ, khoảng thời gian, ngôn ngữ) và file tiêu biểu cho mỗi cách. Trả về bảng ngắn." } } },
        { from: "c", to: "h", kind: "err", label: "thử sửa", key: true, title: "Claude thử sửa file khi vẫn đang ở plan mode", desc: "Claude gọi Edit, nhưng Claude Code từ chối vì đang ở plan mode.", payload: { name: "Edit", input: { file_path: "src/billing/invoice.ts", old_string: "moment(", new_string: "parseISO(" } }, warn: "Việc chặn này do hệ thống phân quyền thực hiện, nên chắc chắn xảy ra, không phụ thuộc vào việc Claude có nhớ lời dặn hay không." },
        { from: "c", to: "h", kind: "res", label: "trình kế hoạch", key: true, title: "Claude trình kế hoạch", desc: "Khi đã đủ thông tin, Claude dùng công cụ ExitPlanMode để trình kế hoạch cho bạn duyệt.", payload: { name: "ExitPlanMode", input: { plan: "1. Cài date-fns và date-fns-tz\n2. Tạo src/lib/date.ts gom các hàm dùng chung\n3. Chuyển lần lượt từng phần: thanh toán, báo cáo, giao diện; chạy test sau mỗi phần\n4. Trường hợp đặc biệt: moment.tz trong reports/schedule.ts dùng formatInTimeZone\n5. Gỡ moment khỏi package.json" } } },
        { from: "h", to: "d", kind: "req", label: "hỏi duyệt", title: "Claude Code hỏi bạn có đồng ý không", desc: "Bạn đọc kế hoạch và chọn cách tiếp tục. Nếu chưa ổn, chọn “tiếp tục lập kế hoạch” và góp ý thêm.", payload: "Would you like to proceed?\n  1. Yes, and auto-accept edits\n  2. Yes, and manually approve edits\n  3. No, keep planning" },
        { from: "d", to: "h", kind: "ok", label: "đồng ý", key: true, title: "Bạn duyệt, chọn xác nhận từng lần sửa", desc: "Claude Code rời plan mode. Từ giờ Claude được sửa file, và mỗi lần sửa sẽ hỏi bạn.", state: [{ r: "ok", t: "<b>chế độ thường</b>: được sửa file, mỗi lần sửa cần xác nhận" }] },
        { from: "c", to: "h", kind: "res", label: "sửa", key: true, title: "Claude làm theo kế hoạch", desc: "Bắt đầu từ bước 2: tạo file gom các hàm ngày tháng dùng chung.", payload: { name: "Edit", input: { file_path: "src/lib/date.ts", old_string: "", new_string: "export { format, parseISO } from \"date-fns\";" } } },
        { from: "c", to: "h", kind: "ok", label: "chạy test", title: "Chạy test sau mỗi phần", desc: "Xong phần thanh toán thì chạy test của phần đó trước khi sang phần tiếp theo, để phát hiện lỗi sớm.", payload: { name: "Bash", input: { command: "npm test -- billing" } } },
      ],
    }),
  };

  /* ───────── 3-6 Claude Code trong CI ───────── */
  W.ciPipeline = {
    title: "Claude Code trong CI: câu lệnh, kết quả JSON và bình luận trên pull request",
    render: trace({
      intro: "Trong CI không có ai ngồi trước màn hình để trả lời câu hỏi. Bật tắt từng tùy chọn để xem job CI chạy thế nào.",
      actors: [
        { id: "g", icon: "🐙", name: "GitHub", sub: "pull request #77" },
        { id: "r", icon: "🏃", name: "Máy chạy CI" },
        { id: "x", icon: "🖥️", name: "Claude Code", sub: "chạy dòng lệnh" },
        { id: "a", icon: "🧠", name: "Claude API" },
      ],
      stateTitle: "Bình luận trên pull request",
      controls: [
        { id: "p", type: "toggle", label: "Có cờ <code>-p</code>", value: true },
        { id: "j", type: "toggle", label: "Có <code>--output-format json --json-schema</code>", value: true },
        { id: "h", type: "toggle", label: "Đưa các phát hiện cũ vào yêu cầu", value: true },
      ],
      steps: ({ p, j, h }) => {
        const s = [];
        const cmd = `claude ${p ? "-p " : ""}"$PROMPT"${j ? " \\\n  --output-format json --json-schema \"$(cat review.schema.json)\"" : ""} \\\n  --allowedTools \"Read,Grep,Glob,Bash(git diff:*)\" --max-turns 15 > out.json`;
        s.push({ from: "g", to: "r", kind: "req", label: "commit mới", title: "Có commit mới trên pull request", desc: "GitHub báo cho hệ thống CI biết có code mới cần review. Lần trước, bot đã báo 5 vấn đề, trong đó 3 vấn đề đã được sửa.", payload: { action: "synchronize", number: 77, pull_request: { head: { sha: "9f3c2e1" }, base: { ref: "main" } } }, state: [{ r: "note", t: "Lần trước bot đã báo 5 vấn đề (3 đã được sửa)" }] });
        s.push({ from: "r", to: "r", kind: "internal", title: "Máy CI chuẩn bị yêu cầu và câu lệnh", desc: h ? "Máy CI lấy danh sách bình luận cũ của bot, đưa vào yêu cầu, và dặn Claude chỉ báo vấn đề mới hoặc vấn đề cũ chưa được sửa." : "Máy CI chỉ dùng yêu cầu review cố định, không nhắc gì tới những lần review trước.", snippet: `# Trích từ file .github/workflows/review.yml\n${h ? "gh api repos/$REPO/pulls/77/comments --jq '[.[] | select(.user.login==\"review-bot\") | {path,line,body}]' > prev.json\nPROMPT=\"$(cat .github/review-prompt.md)\nNhững vấn đề đã báo: $(cat prev.json). Chỉ báo vấn đề MỚI hoặc CHƯA SỬA.\"" : "PROMPT=\"$(cat .github/review-prompt.md)\""}\n${cmd}`, backend: ["Khóa API được lấy từ phần lưu trữ bí mật của CI.", "<code>--allowedTools</code> cho phép trước đúng những công cụ cần dùng, vì không có ai để bấm “cho phép”.", "<code>--max-turns</code> giới hạn số lượt, để job không chạy mãi."] });
        if (!p) {
          s.push({ from: "r", to: "x", kind: "err", label: "đứng chờ", title: "Thiếu -p nên Claude Code mở giao diện trò chuyện", desc: "Không có cờ <code>-p</code>, Claude Code mở khung trò chuyện và chờ người gõ phím. Trong CI không có ai gõ cả.", payload: "╭────────────────────────────────╮\n│ > Review PR này theo CLAUDE.md  │\n╰────────────────────────────────╯\n(đang chờ nhập từ bàn phím...)", warn: "Job đứng chờ mãi cho tới khi CI tự hủy vì quá giờ, ví dụ sau 60 phút." });
          return s;
        }
        s.push({ from: "r", to: "x", kind: "req", label: "claude -p", title: "Chạy một lần rồi tự thoát", desc: "Với cờ <code>-p</code>, Claude Code nhận yêu cầu, làm xong, in kết quả ra rồi tự thoát.", payload: cmd });
        s.push({ from: "x", to: "x", kind: "internal", title: "Claude Code đọc bối cảnh của dự án", desc: "Giống khi chạy trên máy, Claude Code đọc CLAUDE.md (chứa tiêu chí review và tiêu chuẩn test), các cài đặt của dự án, rồi bắt đầu vòng lặp làm việc." });
        s.push({ from: "x", to: "a", kind: "req", label: "nhiều lượt", title: "Claude đọc code qua nhiều lượt", desc: "Claude dùng các công cụ được phép như đọc file, tìm kiếm, xem thay đổi. Đây chính là vòng lặp agent ở mục 1-1, chỉ khác là không có ai theo dõi." });
        s.push({ from: "a", to: "x", kind: "res", label: "xong", title: "Claude hoàn tất việc review", desc: "Claude kết thúc với <code>stop_reason</code> là <code>end_turn</code>." });
        if (j) {
          s.push({ from: "x", to: "r", kind: "ok", label: "out.json", title: "Kết quả được in ra dưới dạng JSON", desc: "Kết quả có cấu trúc rõ ràng. Script đọc được chính xác từng phát hiện nằm ở file nào, dòng nào.", payload: { type: "result", subtype: "success", is_error: false, num_turns: 9, duration_ms: 84211, total_cost_usd: 0.23, session_id: "5c1e...", result: "Tìm thấy 2 vấn đề mới.", structured_output: { findings: h ? [{ path: "src/api/user.ts", line: 88, severity: "high", rule: "sql-injection", message: "Nối chuỗi email trực tiếp vào câu SQL." }, { path: "src/api/user.ts", line: 120, severity: "medium", rule: "null-check", message: "Biến profile có thể chưa có giá trị." }] : "[...7 phát hiện, 5 trùng lần trước...]" } }, hl: ["subtype", "is_error", "structured_output", "path", "line"], fields: [["subtype, is_error", "Cho biết lần chạy có thành công không. Script nên kiểm tra trước khi dùng kết quả."], ["structured_output", "Dữ liệu theo đúng mẫu đã khai báo bằng --json-schema."], ["total_cost_usd, num_turns", "Chi phí và số lượt, để theo dõi."], ["session_id", "Mã phiên, dùng khi muốn tiếp tục phiên này ở lần chạy sau."]] });
          s.push({ from: "r", to: "r", kind: "internal", title: "Script đọc từng phát hiện và chuẩn bị bình luận", desc: "Với mỗi phát hiện, script lấy đường dẫn file, số dòng và nội dung, rồi gửi lên GitHub thành một bình luận gắn đúng vào dòng code đó.", snippet: "jq -c '.structured_output.findings[]' out.json | while read f; do\n  gh api repos/$REPO/pulls/77/comments -f path=\"$(jq -r .path <<<\"$f\")\" \\\n     -F line=\"$(jq -r .line <<<\"$f\")\" -f body=\"$(jq -r .message <<<\"$f\")\" -f commit_id=9f3c2e1\ndone" });
          s.push({ from: "r", to: "g", kind: h ? "ok" : "warn", label: h ? "2 bình luận mới" : "7 bình luận", title: h ? "Chỉ đăng những vấn đề mới" : "Đăng lại cả những vấn đề đã báo", desc: h ? "Nhờ biết những gì đã báo trước đó, bot chỉ đăng hai vấn đề mới." : "Không biết những gì đã báo, bot đăng lại cả năm vấn đề cũ. Lập trình viên sẽ bắt đầu bỏ qua bot.", push: h ? [{ r: "ok", t: "user.ts dòng 88: nguy cơ SQL injection (cao)" }, { r: "ok", t: "user.ts dòng 120: thiếu kiểm tra giá trị rỗng" }] : [{ r: "err", t: "7 bình luận, 5 bình luận trùng với lần trước" }] });
        } else {
          s.push({ from: "x", to: "r", kind: "warn", label: "văn bản", title: "Kết quả là một đoạn văn", desc: "Không có định dạng JSON, kết quả chỉ là một đoạn văn tự do.", payload: "Mình đã xem PR. Có vài điểm đáng chú ý: ở file user.ts, khoảng giữa file có một câu SQL nối chuỗi...", warn: "Không có số dòng chính xác thì không gắn bình luận vào đúng dòng code được. Tự viết code tách thông tin từ đoạn văn thì rất dễ hỏng." });
        }
        return s;
      },
    }),
  };
})();
