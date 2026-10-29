/* Mô phỏng chi tiết — Chương 3: Claude Code Configuration & Workflows */
(function () {
  const { trace } = window.SIM;
  const W = window.WIDGETS;

  /* ───────── 3-1 Claude Code nạp bộ nhớ (CLAUDE.md, rules) ───────── */
  W.memoryLoad = {
    title: "Claude Code nạp CLAUDE.md & rules theo thứ tự nào?",
    render: trace({
      intro: "Dev mở Claude Code tại <code>repo/packages/api</code> rồi nhờ sửa test. Khung bên phải là <b>những gì đang nằm trong ngữ cảnh</b>.",
      actors: [
        { id: "d", icon: "👩‍💻", name: "Dev" },
        { id: "h", icon: "🖥️", name: "Claude Code" },
        { id: "f", icon: "📁", name: "File cấu hình", sub: "~/.claude · repo" },
        { id: "c", icon: "🧠", name: "Claude" },
      ],
      stateTitle: "🧠 Bộ nhớ trong ngữ cảnh",
      steps: [
        { from: "d", to: "h", kind: "req", label: "▶ claude", title: "Khởi động trong thư mục con", payload: "~/code/repo/packages/api $ claude", state: [] },
        { from: "h", to: "f", kind: "req", label: "🔎 tìm", title: "Tìm CLAUDE.md: cấp người dùng + đi NGƯỢC lên từ thư mục hiện tại", backend: ["Chính sách tổ chức (managed policy) nếu có.", "<code>~/.claude/CLAUDE.md</code> — của riêng bạn, mọi project.", "Từ cwd đi lên: <code>packages/api/CLAUDE.md</code>, <code>repo/CLAUDE.md</code> (hoặc <code>repo/.claude/CLAUDE.md</code>).", "<code>.claude/rules/*.md</code> không có <code>paths</code> → nạp ngay; có <code>paths</code> → chờ tới khi đụng file khớp."] },
        { from: "f", to: "h", kind: "res", label: "📄 4 file", title: "Các file tìm thấy", payload: "~/.claude/CLAUDE.md                → \"Trả lời tiếng Việt, ngắn gọn\"\nrepo/CLAUDE.md                     → quy ước chung + @docs/architecture.md\nrepo/packages/api/CLAUDE.md        → quy ước riêng của API\nrepo/.claude/rules/testing.md      → paths: [\"**/*.test.ts\"]  (chưa nạp)", push: [{ r: "sys", t: "~/.claude/CLAUDE.md <i>(user, không chia sẻ)</i>" }, { r: "sys", t: "repo/CLAUDE.md <i>(project)</i>" }, { r: "sys", t: "packages/api/CLAUDE.md <i>(thư mục con / cha của cwd)</i>" }] },
        { from: "h", to: "f", kind: "req", label: "📎 @import", title: "Mở rộng @import", payload: "# repo/CLAUDE.md\nXem kiến trúc: @docs/architecture.md\nLệnh build/test: @package.json", backend: ["Mỗi <code>@đường-dẫn</code> được nạp nội dung vào ngữ cảnh (đệ quy, có giới hạn độ sâu).", "Giúp CLAUDE.md gốc ngắn, nội dung chi tiết tách ra file riêng."], push: [{ r: "sys", t: "docs/architecture.md <i>(qua @import)</i>" }] },
        { from: "h", to: "c", kind: "req", label: "📤 phiên bắt đầu", title: "Bộ nhớ được đưa vào ngữ cảnh mỗi lượt", note: "Gõ <code>/memory</code> để xem đúng danh sách file đang nạp — cách nhanh nhất để gỡ lỗi “Claude không theo quy ước”." },
        { from: "d", to: "c", kind: "req", label: "💬", title: "Dev giao việc", payload: "Sửa test đang fail trong src/user.test.ts" },
        { from: "c", to: "h", kind: "res", label: "📖 Read", title: "Claude đọc file test", payload: { name: "Read", input: { file_path: "/repo/packages/api/src/user.test.ts" } } },
        { from: "h", to: "f", kind: "internal", label: "🎯 khớp glob", title: "Đụng file khớp **/*.test.ts → nạp rule testing.md", backend: ["So đường dẫn với <code>paths</code> của từng rule.", "Khớp → nạp <code>.claude/rules/testing.md</code> vào ngữ cảnh.", "File không phải test (ví dụ README) → rule không bao giờ được nạp, không tốn token."], push: [{ r: "ok", t: ".claude/rules/testing.md <i>(paths khớp)</i>" }] },
        { from: "d", to: "h", kind: "warn", label: "🆕 dev mới", title: "Đồng nghiệp clone repo trên máy khác", desc: "Máy họ có repo/CLAUDE.md, packages/api/CLAUDE.md, rules — nhưng <b>không</b> có <code>~/.claude/CLAUDE.md</code> của bạn.", warn: "Nếu quy ước team nằm trong ~/.claude/CLAUDE.md của trưởng nhóm, mọi dev khác sẽ không nhận được.", state: [{ r: "sys", t: "repo/CLAUDE.md" }, { r: "sys", t: "packages/api/CLAUDE.md" }, { r: "sys", t: "docs/architecture.md" }, { r: "err", t: "(thiếu) quy ước chỉ có trên máy trưởng nhóm" }] },
      ],
    }),
  };

  /* ───────── 3-2 Skill với context: fork ───────── */
  const SKILL = `---
name: audit-deps
description: Kiểm tra dependency lỗi thời / có lỗ hổng trong một package.
  Dùng khi người dùng hỏi về bảo mật dependency hoặc nâng cấp thư viện.
context: fork
allowed-tools: Read, Grep, Glob, Bash(npm audit:*), Bash(npm outdated:*)
argument-hint: [đường-dẫn-package]
---
# Quy trình
1. Chạy \`npm audit --json\` và \`npm outdated --json\` trong $ARGUMENTS
2. Với mỗi lỗ hổng high/critical: Grep nơi import gói đó
3. Trả về bảng: gói | mức | nơi dùng | đề xuất nâng cấp (tối đa 15 dòng)`;
  W.skillTrace = {
    title: "Skill chạy thế nào? Progressive disclosure & context: fork",
    render: trace({
      intro: "Theo dõi số token của <b>phiên chính</b>. Bật/tắt <code>context: fork</code> để thấy output dài đi đâu.",
      actors: [
        { id: "d", icon: "👩‍💻", name: "Dev" },
        { id: "h", icon: "🖥️", name: "Claude Code" },
        { id: "m", icon: "🧠", name: "Phiên chính" },
        { id: "f", icon: "🍴", name: "Subagent fork", sub: "ngữ cảnh riêng" },
      ],
      stateTitle: "📊 Ngữ cảnh phiên chính",
      controls: [{ id: "fork", type: "toggle", label: "<code>context: fork</code> trong SKILL.md", value: true }],
      steps: ({ fork }) => {
        const s = [];
        s.push({ from: "h", to: "h", kind: "internal", title: "Khởi động: chỉ nạp name + description của mỗi skill", payloads: [{ t: ".claude/skills/audit-deps/SKILL.md", d: SKILL, hl: ["name:", "description:", "context:", "allowed-tools:"] }], fields: [["name / description", "Nạp ngay khi khởi động (~60 token/skill) để Claude biết skill tồn tại và <b>khi nào</b> nên dùng."], ["phần thân", "Chỉ nạp khi skill được gọi — progressive disclosure."], ["context: fork", "Chạy trong subagent riêng; chỉ kết quả cuối trở về phiên chính."], ["allowed-tools", "Giới hạn công cụ trong lúc skill chạy."], ["argument-hint", "Gợi ý tham số khi gõ /audit-deps."]], state: [{ r: "sys", t: "CLAUDE.md … <b>~3.000 token</b>" }, { r: "sys", t: "Danh mục skill: audit-deps (mô tả) <b>~60 token</b>" }] });
        s.push({ from: "d", to: "h", kind: "req", label: "⌨️ /audit-deps", title: "Dev gọi skill (hoặc Claude tự chọn dựa trên description)", payload: "/audit-deps packages/api" });
        s.push({ from: "h", to: "h", kind: "internal", title: "Nạp thân SKILL.md, thay $ARGUMENTS", backend: ["Đọc phần thân của SKILL.md.", "<code>$ARGUMENTS</code> → <code>packages/api</code>.", fork ? "Thấy <code>context: fork</code> → tạo subagent với thân skill làm nhiệm vụ." : "Không fork → thân skill được chèn vào <b>phiên chính</b>."] });
        if (fork) {
          s.push({ from: "h", to: "f", kind: "req", label: "🍴 fork", title: "Subagent nhận nhiệm vụ + bộ công cụ giới hạn", payload: { system: "(prompt subagent)", tools: ["Read", "Grep", "Glob", "Bash(npm audit:*)", "Bash(npm outdated:*)"], messages: [{ role: "user", content: "1. Chạy `npm audit --json` … trong packages/api …" }] }, hl: ["tools"] });
          s.push({ from: "f", to: "f", kind: "internal", title: "Subagent làm việc nặng trong ngữ cảnh riêng", backend: ["<code>npm audit --json</code> → ~28.000 token JSON.", "Grep 9 gói bị cảnh báo → ~6.000 token.", "Thử <code>Edit package.json</code> → bị chặn: Edit không có trong allowed-tools."] });
          s.push({ from: "f", to: "m", kind: "ok", label: "📋 bảng gọn", title: "Chỉ bảng kết quả trở về phiên chính", payload: "| Gói | Mức | Nơi dùng | Đề xuất |\n|---|---|---|---|\n| jsonwebtoken 8.5.1 | high | src/auth/*.ts (4) | ≥ 9.0.0 |\n| axios 0.21.1 | critical | src/clients/http.ts | ≥ 1.7.4 |\n… (7 dòng nữa)", push: [{ r: "ok", t: "Kết quả audit-deps <b>~900 token</b>" }], note: "Phiên chính tăng ~900 token thay vì ~34.000. Các câu hỏi tiếp theo vẫn có không gian ngữ cảnh." });
        } else {
          s.push({ from: "h", to: "m", kind: "warn", label: "📥 inline", title: "Skill chạy ngay trong phiên chính", backend: ["Mọi output công cụ đổ vào lịch sử phiên chính."], push: [{ r: "note", t: "Thân SKILL.md <b>~400 token</b>" }] });
          s.push({ from: "m", to: "m", kind: "err", title: "Output trung gian làm phình ngữ cảnh", push: [{ r: "err", t: "npm audit --json <b>~28.000 token</b>" }, { r: "err", t: "9 lần Grep <b>~6.000 token</b>" }], warn: "Phiên chính mất ~34.000 token cho dữ liệu thô chỉ cần một lần — sớm phải /compact và có thể mất chi tiết quan trọng khác." });
        }
        s.push({ from: "m", to: "d", kind: "ok", label: "💬", title: "Claude trình bày kết quả cho dev", payload: "2 lỗ hổng critical/high cần xử lý trước: axios, jsonwebtoken. Muốn mình tạo nhánh nâng cấp không?" });
        return s;
      },
    }),
  };

  /* ───────── 3-4 Plan mode ───────── */
  W.planModeTrace = {
    title: "Plan mode: khám phá chỉ-đọc → duyệt kế hoạch → thực thi",
    render: trace({
      intro: "Migrate Moment.js → date-fns (~47 file). Plan mode là một <b>chế độ quyền</b>: công cụ chỉ-đọc chạy được, công cụ sửa đổi bị chặn tới khi bạn duyệt kế hoạch.",
      actors: [
        { id: "d", icon: "👩‍💻", name: "Dev" },
        { id: "h", icon: "🖥️", name: "Claude Code", sub: "permission mode" },
        { id: "c", icon: "🧠", name: "Claude" },
        { id: "r", icon: "📁", name: "Repo" },
      ],
      stateTitle: "🔐 Chế độ quyền",
      steps: [
        { from: "d", to: "h", kind: "req", label: "⇧⇥ plan", title: "Bật plan mode (Shift+Tab) hoặc --permission-mode plan", payload: "⏸ plan mode on\n> Migrate toàn bộ Moment.js sang date-fns, giữ nguyên hành vi múi giờ.", state: [{ r: "sys", t: "⏸ <b>plan</b>: chỉ đọc (Read, Grep, Glob, công cụ tìm hiểu)" }] },
        { from: "c", to: "h", kind: "res", label: "🔍 Grep", title: "Đo phạm vi", payload: { name: "Grep", input: { pattern: "from ['\"]moment['\"]", output_mode: "count" } } },
        { from: "r", to: "c", kind: "res", label: "📊 47 file", title: "47 file, 212 lượt gọi", payload: "src/billing/*.ts: 61\nsrc/reports/*.ts: 88\nsrc/ui/**/*.tsx: 63" },
        { from: "c", to: "h", kind: "res", label: "🔎 Explore", title: "Ủy thác khảo sát pattern cho subagent Explore", payload: { name: "Task", input: { subagent_type: "Explore", prompt: "Liệt kê các pattern dùng moment (format, tz, duration, locale) và file tiêu biểu cho mỗi loại. Trả bảng ngắn." } }, note: "Output khảo sát dài nằm trong ngữ cảnh subagent; phiên chính chỉ nhận bảng tóm tắt." },
        { from: "c", to: "h", kind: "err", label: "✏️ Edit", title: "Claude thử sửa file khi đang plan", payload: { name: "Edit", input: { file_path: "src/billing/invoice.ts", old_string: "moment(", new_string: "parseISO(" } }, warn: "Bị từ chối: plan mode không cho công cụ sửa đổi. Đây là đảm bảo bằng cơ chế quyền, không phụ thuộc model “nhớ” lời dặn." },
        { from: "c", to: "h", kind: "res", label: "📝 ExitPlanMode", title: "Claude trình kế hoạch qua công cụ ExitPlanMode", payload: { name: "ExitPlanMode", input: { plan: "1. Thêm date-fns + date-fns-tz\n2. Tạo src/lib/date.ts bọc các hàm dùng chung\n3. Migrate theo module: billing → reports → ui (mỗi module chạy test)\n4. Ca đặc biệt: moment.tz trong reports/schedule.ts dùng formatInTimeZone\n5. Gỡ moment khỏi package.json" } } },
        { from: "h", to: "d", kind: "req", label: "❓ duyệt", title: "Dev xem và duyệt kế hoạch", payload: "Would you like to proceed?\n  1. Yes, and auto-accept edits\n  2. Yes, and manually approve edits\n  3. No, keep planning" },
        { from: "d", to: "h", kind: "ok", label: "✅ 2", title: "Duyệt, sửa từng bước có xác nhận", state: [{ r: "ok", t: "▶ <b>default</b>: được sửa file, mỗi lần sửa cần xác nhận" }] },
        { from: "c", to: "h", kind: "res", label: "✏️ Edit", title: "Thực thi theo kế hoạch", payload: { name: "Edit", input: { file_path: "src/lib/date.ts", old_string: "", new_string: "export { format, parseISO } from \"date-fns\";" } } },
        { from: "c", to: "h", kind: "ok", label: "▶️ test", title: "Chạy test sau mỗi module", payload: { name: "Bash", input: { command: "npm test -- billing" } } },
      ],
    }),
  };

  /* ───────── 3-6 Claude Code trong CI ───────── */
  W.ciPipeline = {
    title: "Claude Code trong CI — lệnh, output JSON và đăng comment",
    render: trace({
      intro: "Bật/tắt từng cờ để thấy job CI phản ứng thế nào. Đây là chế độ <b>headless</b>: không ai ngồi trước terminal để trả lời.",
      actors: [
        { id: "g", icon: "🐙", name: "GitHub", sub: "PR #77" },
        { id: "r", icon: "🏃", name: "CI runner" },
        { id: "x", icon: "🖥️", name: "claude CLI" },
        { id: "a", icon: "🧠", name: "Claude API" },
      ],
      stateTitle: "💬 Comment trên PR",
      controls: [
        { id: "p", type: "toggle", label: "Cờ <code>-p</code>", value: true },
        { id: "j", type: "toggle", label: "<code>--output-format json --json-schema</code>", value: true },
        { id: "h", type: "toggle", label: "Đưa phát hiện cũ vào prompt", value: true },
      ],
      steps: ({ p, j, h }) => {
        const s = [];
        const cmd = `claude ${p ? "-p " : ""}"$PROMPT"${j ? " \\\n  --output-format json --json-schema \"$(cat review.schema.json)\"" : ""} \\\n  --allowedTools \"Read,Grep,Glob,Bash(git diff:*)\" --max-turns 15 > out.json`;
        s.push({ from: "g", to: "r", kind: "req", label: "🔔 webhook", title: "Commit mới đẩy lên PR", payload: { action: "synchronize", number: 77, pull_request: { head: { sha: "9f3c2e1" }, base: { ref: "main" } } }, state: [{ r: "note", t: "Lần trước bot đã báo 5 vấn đề (3 đã sửa)" }] });
        s.push({ from: "r", to: "r", kind: "internal", title: "Runner chuẩn bị prompt và lệnh", snippet: `# .github/workflows/review.yml (trích)\n${h ? "gh api repos/$REPO/pulls/77/comments --jq '[.[] | select(.user.login==\"review-bot\") | {path,line,body}]' > prev.json\nPROMPT=\"$(cat .github/review-prompt.md)\nPhát hiện đã báo: $(cat prev.json). Chỉ báo vấn đề MỚI hoặc CHƯA SỬA.\"" : "PROMPT=\"$(cat .github/review-prompt.md)\""}\n${cmd}`, backend: ["<code>ANTHROPIC_API_KEY</code> lấy từ secrets của CI.", "<code>--allowedTools</code> tiền duyệt đúng các công cụ cần — không có ai để bấm “Allow”.", "<code>--max-turns</code> chặn vòng lặp chạy quá dài (lưới an toàn)."] });
        if (!p) {
          s.push({ from: "r", to: "x", kind: "err", label: "⏳ chờ…", title: "Không có -p → mở giao diện tương tác", payload: "╭──────────────────────────────╮\n│ > Review PR này theo CLAUDE.md │\n╰──────────────────────────────╯\n(đang chờ input từ bàn phím…)", warn: "Không có TTY, không có ai gõ phím → job treo tới khi CI timeout (ví dụ 60 phút)." });
          return s;
        }
        s.push({ from: "r", to: "x", kind: "req", label: "▶ claude -p", title: "Chạy một lần rồi thoát", payload: cmd });
        s.push({ from: "x", to: "x", kind: "internal", title: "CLI nạp ngữ cảnh dự án", backend: ["Nạp CLAUDE.md: tiêu chí review, chuẩn test, fixture có sẵn.", "Nạp .claude/settings.json, MCP servers (nếu có).", "Bắt đầu vòng lặp agent với các công cụ được phép."] });
        s.push({ from: "x", to: "a", kind: "req", label: "🔁 vòng lặp", title: "Nhiều lượt Messages API (Read, Grep, git diff…)", desc: "Giống hệt vòng lặp agent ở mục 1-1, chỉ là chạy không người giám sát." });
        s.push({ from: "a", to: "x", kind: "res", label: "🏁 end_turn", title: "Claude hoàn thành review" });
        if (j) {
          s.push({ from: "x", to: "r", kind: "ok", label: "📄 out.json", title: "stdout là một object JSON", payload: { type: "result", subtype: "success", is_error: false, num_turns: 9, duration_ms: 84211, total_cost_usd: 0.23, session_id: "5c1e…", result: "Tìm thấy 2 vấn đề mới.", structured_output: { findings: h ? [{ path: "src/api/user.ts", line: 88, severity: "high", rule: "sql-injection", message: "Nối chuỗi email vào câu SQL." }, { path: "src/api/user.ts", line: 120, severity: "medium", rule: "null-check", message: "profile có thể undefined." }] : "[…7 phát hiện, 5 trùng lần trước…]" } }, hl: ["subtype", "is_error", "structured_output", "path", "line"], fields: [["subtype / is_error", "Kiểm tra trước khi dùng kết quả (lỗi, chạm max-turns…)."], ["structured_output", "Dữ liệu khớp --json-schema — script đọc thẳng, không phải parse văn xuôi."], ["total_cost_usd / num_turns", "Theo dõi chi phí từng job."], ["session_id", "Có thể --resume để hỏi tiếp trong job sau."]] });
          s.push({ from: "r", to: "r", kind: "internal", title: "Script ánh xạ findings → review comments", snippet: "jq -c '.structured_output.findings[]' out.json | while read f; do\n  gh api repos/$REPO/pulls/77/comments -f path=\"$(jq -r .path <<<\"$f\")\" \\\n     -F line=\"$(jq -r .line <<<\"$f\")\" -f body=\"$(jq -r .message <<<\"$f\")\" -f commit_id=9f3c2e1\ndone" });
          s.push({ from: "r", to: "g", kind: h ? "ok" : "warn", label: h ? "💬 2 mới" : "💬 7 (5 trùng)", title: h ? "Chỉ đăng vấn đề mới" : "Đăng lại cả vấn đề đã báo", push: h ? [{ r: "ok", t: "user.ts:88 — SQL injection (high)" }, { r: "ok", t: "user.ts:120 — thiếu null-check" }] : [{ r: "err", t: "7 comment, 5 trùng lần trước → dev bắt đầu phớt lờ bot" }] });
        } else {
          s.push({ from: "x", to: "r", kind: "warn", label: "📝 văn bản", title: "stdout là văn xuôi", payload: "Mình đã xem PR. Có vài điểm đáng chú ý: ở file user.ts khoảng giữa file có một câu SQL nối chuỗi…", warn: "Không có path/line chắc chắn → không đăng được comment inline; parse bằng regex rất dễ vỡ." });
        }
        return s;
      },
    }),
  };
})();
