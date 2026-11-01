/* Mô phỏng chi tiết — Chương 3: Claude Code Configuration & Workflows */
(function () {
  const { trace, claude, http } = window.SIM;
  const { ccConv, BUILTIN } = window.SIM.cc;
  const W = window.WIDGETS;
  const J = (o) => JSON.stringify(o);
  const DEV = { id: "d", icon: "👩‍💻", name: "Lập trình viên", sub: "gõ lệnh trong terminal", desc: "Bạn. Chỉ nói chuyện với Claude Code trong terminal, không gọi thẳng Claude API." };
  const CC = { id: "h", icon: "🖥️", name: "Claude Code", sub: "chạy trên máy bạn", desc: "Đọc file cấu hình, gửi request tới Claude API, chạy công cụ trên máy bạn và kiểm soát quyền. Mọi dữ liệu đều đi qua đây." };
  const API = { id: "c", icon: "🧠", name: "Claude API", sub: "model", desc: "Đọc request Claude Code gửi lên và trả về câu trả lời hoặc yêu cầu dùng công cụ. Không tự đọc được file trên máy bạn." };
  const TERM = { "d>h": "gõ trong terminal", "h>d": "hiển thị trong terminal", "h>c": "HTTPS · POST api.anthropic.com/v1/messages (Claude Code gửi)", "c>h": "HTTPS · response 200 OK" };
  const num = (src, from = 1) => src.split("\n").map((l, i) => String(i + from).padStart(6) + "\t" + l).join("\n");

  /* ───────── 3-1 Nạp CLAUDE.md và rules ───────── */
  const FILES = {
    personal: "Trả lời bằng tiếng Việt, ngắn gọn.\nLuôn chạy test trước khi báo xong.",
    repo: "# Quy ước của dự án\n- TypeScript strict, không dùng any.\n- Test viết bằng Vitest, đặt cạnh file code.\n- Commit theo Conventional Commits.\n\nXem kiến trúc tại: @docs/architecture.md\nLệnh build và test: @package.json",
    api: "# packages/api\n- Mọi endpoint trả lỗi theo dạng { code, message }.\n- Không gọi thẳng cơ sở dữ liệu từ route; đi qua src/services.",
    rule: "---\npaths:\n  - \"**/*.test.ts\"\n---\n# Quy ước viết test\n- Mỗi test chỉ kiểm tra một hành vi; tên test mô tả hành vi đó.\n- Dùng factory trong test/factories, không tạo dữ liệu bằng tay.\n- Không mock module của chính dự án; chỉ mock dịch vụ bên ngoài.",
    arch: "# Kiến trúc\nmonorepo: packages/api (Fastify), packages/web (Next.js), packages/shared.\napi → services → repositories → PostgreSQL.",
    pkg: "{\n  \"scripts\": { \"build\": \"turbo build\", \"test\": \"vitest run\" }\n}",
  };
  const reminder = (parts) => "<system-reminder>\nNội dung các file hướng dẫn (Claude Code chèn vào; mỗi lượt đều được gửi lại):\n" + parts.map(([p, t]) => `\nContents of ${p}:\n${t}`).join("\n") + "\n</system-reminder>";
  W.memoryLoad = {
    title: "Claude Code nạp các file hướng dẫn theo thứ tự nào?",
    render: trace({
      intro: "Một lập trình viên mở Claude Code trong thư mục <code>repo/packages/api</code> rồi nhờ sửa một file test. Mở tab “Hướng dẫn đang được nạp” để xem Claude đang đọc gì ở mỗi bước. Lưu ý: chính Claude Code đọc các file rồi chèn nội dung vào request; Claude không tự mở file nào.",
      actors: [DEV, CC, { id: "f", icon: "📁", name: "Các file hướng dẫn", sub: "trên ổ đĩa: thư mục home và repo", desc: "CLAUDE.md cá nhân (~/.claude), CLAUDE.md của repo và thư mục con, các rule trong .claude/rules." }, API],
      links: { ...TERM, "h>f": "đọc file trên ổ đĩa", "f>h": "nội dung file" },
      stateTitle: "Hướng dẫn đang được nạp",
      steps: () => {
        const s = [];
        s.push({ phase: "Khởi động", from: "d", to: "h", kind: "req", label: "claude", title: "Mở Claude Code trong một thư mục con", desc: "Thư mục đang đứng là <code>packages/api</code>, nằm bên trong repo.", payload: "~/code/repo/packages/api $ claude", pnote: "Toàn bộ lệnh gõ trong terminal.", state: [] });
        s.push({ from: "h", to: "f", kind: "req", label: "tìm", title: "Claude Code đi tìm các file hướng dẫn", desc: "Claude Code đọc file cá nhân trong thư mục home, rồi đi từ thư mục hiện tại ngược lên tới gốc repo và đọc mọi CLAUDE.md gặp trên đường. Rule không khai báo <code>paths</code> được nạp ngay; rule có <code>paths</code> thì chờ tới khi cần.", payload: "~/.claude/CLAUDE.md\n~/code/repo/packages/api/CLAUDE.md\n~/code/repo/packages/CLAUDE.md        (không có)\n~/code/repo/CLAUDE.md\n~/code/repo/.claude/rules/*.md", pnote: "Toàn bộ các vị trí Claude Code kiểm tra trong ví dụ này." });
        s.push({ from: "f", to: "h", kind: "res", label: "4 file", key: true, title: "Tìm thấy bốn file", desc: "Ba file được nạp ngay. File rule về viết test có khai báo <code>paths</code>, nên chưa được nạp.", views: [{ t: "Nội dung 4 file", parts: [{ t: "~/.claude/CLAUDE.md (cá nhân, chỉ có trên máy bạn)", d: FILES.personal }, { t: "repo/CLAUDE.md (của dự án, commit trong repo)", d: FILES.repo, hl: ["@"] }, { t: "repo/packages/api/CLAUDE.md (thư mục đang đứng)", d: FILES.api }, { t: "repo/.claude/rules/testing.md (rule có paths, chưa nạp)", d: FILES.rule, hl: ["paths", "*.test.ts"] }], note: "Toàn bộ nội dung bốn file." }], push: [{ r: "sys", t: "~/.claude/CLAUDE.md <i>(cá nhân, không chia sẻ)</i>" }, { r: "sys", t: "repo/CLAUDE.md <i>(của dự án)</i>" }, { r: "sys", t: "packages/api/CLAUDE.md <i>(thư mục đang đứng)</i>" }] });
        s.push({ from: "f", to: "h", kind: "res", label: "@import", title: "Nạp thêm file được nhắc tới bằng @", via: "đọc file trên ổ đĩa, theo các dòng @ trong repo/CLAUDE.md", desc: "Trong repo/CLAUDE.md có dòng <code>@docs/architecture.md</code> và <code>@package.json</code>. Claude Code nạp luôn nội dung hai file đó. Cách này giúp CLAUDE.md chính ngắn gọn, phần chi tiết để ở file riêng.", views: [{ t: "Nội dung 2 file", parts: [{ t: "repo/docs/architecture.md", d: FILES.arch }, { t: "repo/package.json", d: FILES.pkg }], note: "Toàn bộ nội dung hai file (package.json rút gọn còn phần scripts cho dễ đọc)." }], push: [{ r: "sys", t: "docs/architecture.md, package.json <i>(nạp qua @)</i>" }] });
        const ask = "Sửa giúp test đang lỗi trong src/user.test.ts";
        s.push({ phase: "Lượt đầu tiên", from: "d", to: "h", kind: "req", label: "giao việc", title: "Lập trình viên giao việc", desc: "Bạn gõ yêu cầu vào Claude Code, không phải gửi thẳng cho Claude.", payload: "> " + ask, pnote: "Toàn bộ những gì bạn gõ." });
        const cv = ccConv([], "L");
        const mem = reminder([["~/.claude/CLAUDE.md", FILES.personal], ["/home/lan/code/repo/CLAUDE.md", FILES.repo], ["/home/lan/code/repo/docs/architecture.md", FILES.arch], ["/home/lan/code/repo/package.json", FILES.pkg], ["/home/lan/code/repo/packages/api/CLAUDE.md", FILES.api]]);
        cv.user([{ type: "text", text: mem }, { type: "text", text: ask }]);
        s.push({ from: "h", to: "c", kind: "req", label: "request #1", key: true, title: "Các hướng dẫn đi kèm trong request", desc: "Claude Code đặt nội dung các file hướng dẫn vào một khối nhắc nhở ở đầu tin nhắn, ngay trước yêu cầu của bạn. Mỗi lần gọi Claude đều gửi lại khối này.", ...cv.req({ hl: ["system-reminder"] }), note: "Gõ <code>/memory</code> để xem chính xác những file nào đang được nạp. Đây là cách nhanh nhất để tìm hiểu vì sao Claude không làm theo quy ước." });
        s.push({ from: "c", to: "h", kind: "res", label: "Read", title: "Claude xin mở file test", desc: "Claude xin dùng Read để mở file test.", ...cv.res({ content: [{ type: "tool_use", id: "toolu_71", name: "Read", input: { file_path: "/home/lan/code/repo/packages/api/src/user.test.ts" } }], stop_reason: "tool_use", in: 11200, out: 52 }, { hl: ["file_path"] }) });
        const test = "import { describe, it, expect } from \"vitest\";\nimport { makeUser } from \"../test/factories\";\nimport { getUser } from \"./user\";\n\ndescribe(\"getUser\", () => {\n  it(\"trả về user theo email không phân biệt hoa thường\", async () => {\n    const u = await makeUser({ email: \"Lan@Example.com\" });\n    expect(await getUser(\"lan@example.com\")).toEqual(u);\n  });\n});";
        s.push({ from: "f", to: "h", kind: "res", label: "file + rule", key: true, title: "File khớp mẫu **/*.test.ts, rule về viết test được nạp", via: "đọc file trên ổ đĩa; so đường dẫn với paths của từng rule", desc: "Claude Code đọc file test, rồi so đường dẫn với mẫu <code>paths</code> của từng rule. File này khớp với rule testing.md, nên rule đó được nạp. Nếu Claude chỉ mở README, rule này sẽ không bao giờ được nạp và không tốn chỗ.", views: [{ t: "2 file được đọc", parts: [{ t: "src/user.test.ts (file Claude xin đọc)", d: num(test) }, { t: ".claude/rules/testing.md (nạp vì khớp mẫu)", d: FILES.rule, hl: ["*.test.ts"] }], note: "Toàn bộ nội dung hai file." }], push: [{ r: "ok", t: ".claude/rules/testing.md <i>(khớp mẫu đường dẫn)</i>" }] });
        cv.push({ role: "user", content: [{ type: "tool_result", tool_use_id: "toolu_71", content: num(test) }, { type: "text", text: reminder([["/home/lan/code/repo/.claude/rules/testing.md", FILES.rule.split("---\n").pop()]]) }] });
        s.push({ from: "h", to: "c", kind: "req", label: "tool_result + rule", title: "Kết quả đọc file, kèm rule vừa nạp", desc: "Request tiếp theo có nội dung file test, và một khối nhắc nhở chứa rule testing.md. Từ đây, rule này đi kèm mọi lượt sau.", ...cv.req({ hl: ["toolu_71", "system-reminder"] }) });
        s.push({ phase: "Trên máy đồng nghiệp", from: "d", to: "h", kind: "warn", label: "người mới", title: "Một đồng nghiệp clone repo về máy khác", desc: "Máy đồng nghiệp có đủ mọi file trong repo, nhưng <b>không</b> có file <code>~/.claude/CLAUDE.md</code> của bạn, vì file đó nằm trên máy bạn.", payload: "~/work/repo/packages/api $ claude\n\n# Các file hướng dẫn Claude Code tìm thấy trên máy đồng nghiệp:\nrepo/CLAUDE.md\nrepo/packages/api/CLAUDE.md\nrepo/docs/architecture.md   (qua @)\nrepo/package.json           (qua @)\n# không có ~/.claude/CLAUDE.md", pnote: "Toàn bộ danh sách file được nạp trên máy đồng nghiệp.", warn: "Nếu quy ước của nhóm được ghi trong file cá nhân của trưởng nhóm, mọi người khác sẽ không nhận được.", state: [{ r: "sys", t: "repo/CLAUDE.md" }, { r: "sys", t: "packages/api/CLAUDE.md" }, { r: "sys", t: "docs/architecture.md, package.json" }, { r: "err", t: "(thiếu) quy ước chỉ có trên máy trưởng nhóm" }] });
        return s;
      },
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
  const BODY = SKILL.split("---\n").pop().replace("$ARGUMENTS", "packages/api");
  const TABLE = "| Thư viện | Mức độ | Nơi dùng | Nên nâng lên |\n|---|---|---|---|\n| axios 0.21.1 | nghiêm trọng | src/clients/http.ts | 1.7.4 trở lên |\n| jsonwebtoken 8.5.1 | cao | src/auth/*.ts (4 file) | 9.0.0 trở lên |\n| semver 7.3.5 | cao | scripts/release.ts | 7.5.2 trở lên |\n| tough-cookie 4.0.0 | trung bình | (qua axios) | 4.1.3 trở lên |\n| express 4.17.1 | trung bình | src/server.ts | 4.19.2 trở lên |\n| lodash 4.17.20 | thấp | src/utils/*.ts (6 file) | 4.17.21 |\n| dayjs 1.10.4 | lỗi thời | src/reports/*.ts | 1.11.13 |\n| zod 3.20.2 | lỗi thời | src/schemas/*.ts | 3.23.8 |\n| vitest 0.34.6 | lỗi thời | (dev) | 2.1.4 |";
  W.skillTrace = {
    title: "Skill chạy thế nào, và context: fork giúp gì",
    render: trace({
      intro: "Theo dõi số token mà phiên chính phải chứa. Bật hoặc tắt <code>context: fork</code> để thấy phần kết quả dài dòng đi đâu. Phiên chính và agent con là <b>hai cuộc hội thoại riêng</b> với Claude API; Claude Code đứng giữa, chuyển kết quả từ bên này sang bên kia.",
      actors: [
        DEV,
        CC,
        { id: "m", icon: "🧠", name: "Phiên chính", sub: "Claude · hội thoại chính", desc: "Cuộc hội thoại bạn đang trò chuyện, gửi tới Claude API. Mọi thứ đưa vào đây đều chiếm chỗ cho các lượt sau." },
        { id: "f", icon: "🍴", name: "Agent con", sub: "Claude · hội thoại riêng", desc: "Một cuộc hội thoại riêng với Claude API, chỉ tồn tại trong lúc skill chạy. Kết quả trung gian nằm ở đây, không lan sang phiên chính." },
      ],
      links: { ...TERM, "h>m": "HTTPS · POST /v1/messages (hội thoại chính)", "m>h": "HTTPS · response 200 OK", "h>f": "HTTPS · POST /v1/messages (hội thoại riêng của agent con)", "f>h": "HTTPS · response 200 OK" },
      stateTitle: "Phiên chính đang chứa gì",
      controls: [{ id: "fork", type: "toggle", label: "Có dòng <code>context: fork</code> trong SKILL.md", value: true }],
      steps: ({ fork }) => {
        const s = [];
        s.push({ phase: "Khởi động", from: "h", to: "h", kind: "internal", via: "đọc phần đầu file SKILL.md trên ổ đĩa", title: "Lúc khởi động, chỉ đọc tên và mô tả của skill", desc: "Claude Code chỉ đọc phần đầu của SKILL.md (tên và mô tả), khoảng 60 token, để Claude biết skill này tồn tại và khi nào nên dùng. Phần hướng dẫn bên dưới chưa được đưa vào hội thoại.", payload: SKILL, payloadTitle: ".claude/skills/audit-deps/SKILL.md", pnote: "Toàn bộ nội dung file; dòng tô vàng là phần được dùng lúc khởi động.", hl: ["name:", "description:", "Dùng khi"], fields: [["name, description", "Được đọc ngay lúc khởi động. Claude dựa vào mô tả để quyết định khi nào dùng skill."], ["phần hướng dẫn", "Chỉ được đọc khi skill thực sự chạy."], ["context: fork", "Chạy skill trong một agent con riêng; chỉ kết quả cuối quay về phiên chính."], ["allowed-tools", "Giới hạn công cụ được dùng trong lúc chạy skill."], ["argument-hint", "Gợi ý tham số khi gõ /audit-deps."]], state: [{ r: "sys", t: "CLAUDE.md và các hướng dẫn khác, <b>khoảng 3.000 token</b>" }, { r: "sys", t: "Danh sách skill: audit-deps (chỉ mô tả), <b>khoảng 60 token</b>" }] });
        s.push({ phase: "Gọi skill", from: "d", to: "h", kind: "req", label: "/audit-deps", title: "Lập trình viên gọi skill", desc: "Gõ <code>/audit-deps packages/api</code>. Claude cũng có thể tự chọn skill này nếu bạn hỏi điều gì khớp với đoạn mô tả.", payload: "> /audit-deps packages/api", pnote: "Toàn bộ những gì bạn gõ." });
        s.push({ from: "h", to: "h", kind: "internal", via: "đọc phần hướng dẫn của SKILL.md, thay tham số", title: "Đọc phần hướng dẫn, điền tham số", desc: fork ? "Claude Code đọc phần hướng dẫn và thay <code>$ARGUMENTS</code> bằng <code>packages/api</code>. Vì có <code>context: fork</code>, nó sẽ mở một hội thoại mới cho agent con." : "Claude Code đọc phần hướng dẫn và thay <code>$ARGUMENTS</code> bằng <code>packages/api</code>. Vì không có <code>context: fork</code>, skill sẽ chạy ngay trong phiên chính.", payload: BODY, pnote: "Toàn bộ phần hướng dẫn sau khi thay tham số." });
        const main = ccConv([], "S");
        main.user("Chào, mình đang làm ở packages/api.");
        main.push({ role: "assistant", content: [{ type: "text", text: "Chào bạn, mình sẵn sàng. Bạn cần làm gì?" }] });
        main.req(); // hai tin nhắn trên đã gửi ở các lượt trước
        if (fork) {
          const sub = ccConv([], "F", { tools: ["Read", "Grep", "Glob", "Bash"].map((name) => ({ name })), part: "Claude Code tự dựng request này. <code>messages</code> hiện đầy đủ. <code>system</code> thật là hướng dẫn cho agent con; <code>tools</code> chỉ gồm công cụ trong <code>allowed-tools</code> (Bash bị giới hạn ở hai lệnh npm audit, npm outdated), định nghĩa đầy đủ của chúng không hiện." });
          sub.user(BODY);
          s.push({ phase: "Agent con làm việc", from: "h", to: "f", kind: "req", label: "hội thoại mới", key: true, title: "Agent con nhận nhiệm vụ và bộ công cụ giới hạn", desc: "Request đầu tiên của agent con chỉ có phần hướng dẫn của skill. Agent con chỉ được dùng những công cụ ghi trong <code>allowed-tools</code>.", ...sub.req({ hl: ["tools"] }) });
          s.push({ from: "f", to: "f", kind: "internal", via: "khoảng 12 lượt request/response giữa Claude Code và Claude API, gộp lại thành một bước", title: "Agent con làm phần việc nặng trong hội thoại riêng (gộp nhiều lượt)", desc: "Lệnh <code>npm audit --json</code> trả về khoảng 28.000 token dữ liệu. Tìm kiếm chín thư viện bị cảnh báo thêm khoảng 6.000 token. Tất cả nằm trong hội thoại của agent con. Khi agent con thử sửa file package.json, nó bị chặn, vì Edit không có trong danh sách công cụ được phép." });
          s.push({ from: "f", to: "h", kind: "ok", label: "bảng gọn", key: true, title: "Agent con trả kết quả cuối", desc: "Response cuối của agent con chỉ có bảng kết quả, <code>stop_reason: end_turn</code>.", ...sub.res({ content: [{ type: "text", text: TABLE }], stop_reason: "end_turn", in: 41200, out: 610 }) });
          main.user([{ type: "text", text: "/audit-deps packages/api" }, { type: "text", text: "Kết quả của skill audit-deps:\n" + TABLE }]);
          s.push({ phase: "Kết quả về phiên chính", from: "h", to: "m", kind: "ok", label: "chỉ bảng", key: true, title: "Chỉ bảng kết quả đi vào phiên chính", desc: "Claude Code đưa bảng vào hội thoại chính. Phiên chính chỉ tăng khoảng 900 token, thay vì khoảng 34.000. Vẫn còn nhiều chỗ cho những câu hỏi tiếp theo.", ...main.req({ hl: ["Kết quả của skill"] }), push: [{ r: "ok", t: "Kết quả audit-deps, <b>khoảng 900 token</b>" }] });
        } else {
          main.user([{ type: "text", text: "/audit-deps packages/api" }, { type: "text", text: BODY }]);
          s.push({ phase: "Skill chạy trong phiên chính", from: "h", to: "m", kind: "warn", label: "chạy trong phiên chính", key: true, title: "Skill chạy ngay trong phiên chính", desc: "Phần hướng dẫn được đưa thẳng vào hội thoại chính, và mọi kết quả trung gian sau đó cũng đổ vào đây.", ...main.req({ hl: ["Quy trình"] }), push: [{ r: "note", t: "Hướng dẫn trong SKILL.md, <b>khoảng 400 token</b>" }] });
          s.push({ from: "m", to: "m", kind: "err", via: "khoảng 12 lượt request/response trong chính hội thoại này, gộp lại thành một bước", title: "Kết quả trung gian làm đầy phiên chính (gộp nhiều lượt)", desc: "Toàn bộ dữ liệu thô của npm audit và các lần tìm kiếm đều nằm trong phiên chính, và bị gửi lại ở mọi lượt sau.", push: [{ r: "err", t: "Kết quả npm audit, <b>khoảng 28.000 token</b>" }, { r: "err", t: "9 lần tìm kiếm, <b>khoảng 6.000 token</b>" }], warn: "Phiên chính mất khoảng 34.000 token cho dữ liệu chỉ cần dùng một lần. Bạn sẽ sớm phải nén cuộc trò chuyện, và có thể mất những chi tiết quan trọng khác." });
        }
        const say = "Có 2 lỗ hổng mức nghiêm trọng và cao cần xử lý trước: axios và jsonwebtoken. Bạn có muốn mình tạo nhánh để nâng cấp không?";
        s.push({ phase: "Trả lời bạn", from: "m", to: "h", kind: "ok", label: "end_turn", title: "Claude tóm tắt việc cần làm", desc: "Phiên chính trả lời bằng chữ.", ...main.res({ content: [{ type: "text", text: say }], stop_reason: "end_turn", in: fork ? 4100 : 38200, out: 48 }) });
        s.push({ from: "h", to: "d", kind: "ok", label: "hiển thị", title: "Claude Code hiển thị câu trả lời", desc: "Bạn thấy câu trả lời trong terminal.", payload: "● " + say, pnote: "Toàn bộ những gì hiện trong terminal." });
        return s;
      },
    }),
  };

  /* ───────── 3-4 Plan mode ───────── */
  W.planModeTrace = {
    title: "Plan mode: tìm hiểu trước, duyệt kế hoạch, rồi mới sửa",
    render: trace({
      intro: "Nhiệm vụ: chuyển thư viện ngày tháng Moment.js sang date-fns, ảnh hưởng khoảng 47 file. Ở plan mode, Claude chỉ được đọc và tìm hiểu; Claude Code chặn mọi lệnh sửa file cho tới khi bạn duyệt kế hoạch.",
      actors: [DEV, { ...CC, sub: "chạy công cụ, quản lý quyền" }, API, { id: "r", icon: "📁", name: "Repo", sub: "file trên ổ đĩa", desc: "Mã nguồn. Chỉ Claude Code đọc, ghi, chạy lệnh trên đây." }],
      links: { ...TERM, "h>r": "Claude Code thao tác trên ổ đĩa", "r>h": "dữ liệu đọc từ ổ đĩa / kết quả lệnh" },
      stateTitle: "Chế độ hiện tại",
      steps: () => {
        const s = [];
        const cv = ccConv([{ name: "ExitPlanMode" }], "P");
        const ask = "Chuyển toàn bộ Moment.js sang date-fns, giữ nguyên cách xử lý múi giờ.";
        const tr = (id, text, err) => { cv.push({ role: "user", content: [{ type: "tool_result", tool_use_id: id, ...(err ? { is_error: true } : {}), content: text }] }); return cv.req({ hl: [id] }); };
        const ask1 = (content, hl, n) => cv.res({ content, stop_reason: "tool_use", in: 10600 + n * 400, out: 80 }, { hl });
        s.push({ phase: "Bật plan mode", from: "d", to: "h", kind: "req", label: "plan mode", key: true, title: "Bật plan mode rồi giao việc", desc: "Bấm <kbd>Shift</kbd>+<kbd>Tab</kbd> để chuyển sang plan mode (hoặc khởi động với <code>--permission-mode plan</code>), rồi gõ nhiệm vụ.", payload: "⏸ plan mode on (shift+tab to cycle)\n> " + ask, pnote: "Toàn bộ những gì hiện trong terminal.", state: [{ r: "sys", t: "<b>plan mode</b>: chỉ được đọc và tìm hiểu" }] });
        cv.user([{ type: "text", text: "<system-reminder>\nPlan mode is active. Chỉ được đọc và tìm hiểu, không được sửa file hay chạy lệnh thay đổi hệ thống. Khi đã có kế hoạch, dùng ExitPlanMode để trình cho người dùng.\n</system-reminder>" }, { type: "text", text: ask }]);
        s.push({ from: "h", to: "c", kind: "req", label: "request #1", title: "Claude Code báo cho Claude biết đang ở plan mode", desc: "Claude Code chèn một khối nhắc nhở trước yêu cầu của bạn. Nhưng lời nhắc chỉ là để Claude biết; việc chặn thật sự do Claude Code làm ở các bước sau.", ...cv.req({ hl: ["Plan mode"] }) });
        s.push({ phase: "Tìm hiểu (chỉ đọc)", from: "c", to: "h", kind: "res", label: "Grep", title: "Claude đo phạm vi công việc", desc: "Claude xin đếm xem có bao nhiêu chỗ đang dùng Moment.js.", ...ask1([{ type: "tool_use", id: "toolu_81", name: "Grep", input: { pattern: "from ['\"]moment['\"]", output_mode: "count" } }], ["input"], 0) });
        const counts = "src/billing/invoice.ts:9\nsrc/billing/schedule.ts:14\nsrc/billing/tax.ts:38\nsrc/reports/daily.ts:41\nsrc/reports/schedule.ts:47\nsrc/ui/components/DatePicker.tsx:22\nsrc/ui/pages/Orders.tsx:41\n(và 40 file khác, mỗi file 1 tới 6 chỗ)\n\nTổng: 212 chỗ trong 47 file";
        s.push({ from: "r", to: "h", kind: "res", label: "47 file", title: "Có 47 file, 212 chỗ dùng", via: "Claude Code chạy ripgrep trên repo", desc: "Tập trung ở ba khu vực: thanh toán, báo cáo và giao diện. Đọc được, nên plan mode cho phép.", payload: counts, part: "Kết quả thật liệt kê đủ 47 dòng (mỗi file một dòng); ở đây giữ 7 file nhiều nhất và dòng tổng." });
        s.push({ from: "h", to: "c", kind: "req", label: "tool_result", title: "Gửi kết quả đếm cho Claude", desc: "Kết quả đi vào <code>tool_result</code>.", ...tr("toolu_81", counts) });
        s.push({ from: "c", to: "h", kind: "res", label: "Task", key: true, title: "Giao phần khảo sát chi tiết cho Explore subagent", desc: "Thay vì tự đọc 47 file, Claude xin giao cho agent con chuyên khảo sát. Agent con đọc trong hội thoại riêng và chỉ trả về bảng tóm tắt các kiểu sử dụng.", ...ask1([{ type: "tool_use", id: "toolu_82", name: "Task", input: { description: "Khảo sát cách dùng moment", subagent_type: "Explore", prompt: "Liệt kê các cách dùng moment (định dạng, múi giờ, khoảng thời gian, ngôn ngữ) và file tiêu biểu cho mỗi cách. Trả về bảng ngắn." } }], ["subagent_type"], 1) });
        const survey = "| Cách dùng | Số chỗ | File tiêu biểu |\n|---|---|---|\n| format(\"DD/MM/YYYY\") | 96 | ui/pages/Orders.tsx |\n| moment.tz(...) | 31 | reports/schedule.ts |\n| diff / add / subtract | 58 | billing/schedule.ts |\n| locale(\"vi\") | 27 | ui/components/DatePicker.tsx |";
        s.push({ from: "h", to: "h", kind: "internal", via: "Claude Code chạy agent con Explore: một hội thoại riêng với Claude API, gộp nhiều lượt", title: "Agent con Explore khảo sát và trả bảng tóm tắt (gộp nhiều lượt)", desc: "Agent con đọc khoảng 20 file trong hội thoại riêng của nó. Chỉ bảng cuối cùng quay về.", payload: survey, pnote: "Toàn bộ kết quả cuối agent con trả về." });
        s.push({ from: "h", to: "c", kind: "req", label: "tool_result", title: "Gửi bảng khảo sát cho Claude", desc: "Bảng khảo sát đi vào <code>tool_result</code> của lệnh Task.", ...tr("toolu_82", survey) });
        s.push({ from: "c", to: "h", kind: "err", label: "Edit", key: true, title: "Claude thử sửa file khi vẫn đang ở plan mode", desc: "Claude xin dùng Edit để sửa một file.", ...ask1([{ type: "tool_use", id: "toolu_83", name: "Edit", input: { file_path: "/repo/src/billing/invoice.ts", old_string: "moment(order.createdAt)", new_string: "parseISO(order.createdAt)" } }], ["Edit"], 2) });
        s.push({ from: "h", to: "h", kind: "err", key: true, via: "hệ thống phân quyền của Claude Code, không ghi gì vào ổ đĩa", title: "Claude Code từ chối: đang ở plan mode", desc: "Lệnh Edit không bao giờ chạm tới file.", warn: "Việc chặn này do hệ thống phân quyền thực hiện, nên chắc chắn xảy ra, không phụ thuộc vào việc Claude có nhớ lời dặn hay không." });
        s.push({ from: "h", to: "c", kind: "err", label: "is_error", title: "Báo cho Claude là lệnh bị chặn", desc: "Kết quả của lệnh Edit là một lỗi giải thích lý do.", ...tr("toolu_83", "Không được sửa file khi đang ở plan mode. Hãy hoàn thiện kế hoạch rồi dùng ExitPlanMode.", true) });
        const plan = "1. Cài date-fns và date-fns-tz\n2. Tạo src/lib/date.ts gom các hàm dùng chung\n3. Chuyển lần lượt từng phần: thanh toán, báo cáo, giao diện; chạy test sau mỗi phần\n4. Trường hợp đặc biệt: moment.tz trong reports/schedule.ts dùng formatInTimeZone\n5. Gỡ moment khỏi package.json";
        s.push({ phase: "Duyệt kế hoạch", from: "c", to: "h", kind: "res", label: "ExitPlanMode", key: true, title: "Claude trình kế hoạch", desc: "Khi đã đủ thông tin, Claude xin dùng công cụ ExitPlanMode để trình kế hoạch cho bạn duyệt.", ...ask1([{ type: "tool_use", id: "toolu_84", name: "ExitPlanMode", input: { plan } }], ["plan"], 3) });
        s.push({ from: "h", to: "d", kind: "req", label: "hỏi duyệt", title: "Claude Code hỏi bạn có đồng ý không", desc: "Bạn đọc kế hoạch và chọn cách tiếp tục. Nếu chưa ổn, chọn “tiếp tục lập kế hoạch” và góp ý thêm.", payload: "Kế hoạch của Claude:\n" + plan + "\n\nWould you like to proceed?\n❯ 1. Yes, and auto-accept edits\n  2. Yes, and manually approve edits\n  3. No, keep planning", pnote: "Toàn bộ những gì hiện trong terminal." });
        s.push({ from: "d", to: "h", kind: "ok", label: "chọn 2", key: true, title: "Bạn duyệt, chọn xác nhận từng lần sửa", desc: "Claude Code rời plan mode. Từ giờ Claude được sửa file, và mỗi lần sửa sẽ hỏi bạn.", payload: "2. Yes, and manually approve edits", pnote: "Lựa chọn của bạn.", state: [{ r: "ok", t: "<b>chế độ thường</b>: được sửa file, mỗi lần sửa cần xác nhận" }] });
        s.push({ from: "h", to: "c", kind: "ok", label: "tool_result", title: "Báo cho Claude là kế hoạch đã được duyệt", desc: "Kết quả của ExitPlanMode cho Claude biết có thể bắt đầu sửa.", ...tr("toolu_84", "User has approved your plan. You can now start coding.") });
        const dateTs = "export { format, parseISO, addDays, differenceInDays } from \"date-fns\";\nexport { formatInTimeZone } from \"date-fns-tz\";\n";
        s.push({ phase: "Làm theo kế hoạch", from: "c", to: "h", kind: "res", label: "Write", key: true, title: "Claude bắt đầu từ bước 2 của kế hoạch", desc: "Claude xin tạo file mới gom các hàm ngày tháng dùng chung (bước 1, cài thư viện, đã làm ở lượt trước).", ...ask1([{ type: "tool_use", id: "toolu_85", name: "Write", input: { file_path: "/repo/src/lib/date.ts", content: dateTs } }], ["Write"], 5) });
        s.push({ from: "h", to: "d", kind: "req", label: "xác nhận", title: "Claude Code hỏi trước khi ghi file", desc: "Vì bạn chọn xác nhận từng lần sửa.", payload: "Create file src/lib/date.ts?\n❯ 1. Yes\n  2. No, and tell Claude what to do differently", pnote: "Toàn bộ câu hỏi trong terminal." });
        s.push({ from: "d", to: "h", kind: "ok", label: "Yes", title: "Bạn đồng ý", desc: "Bạn chọn Yes.", payload: "1. Yes", pnote: "Lựa chọn của bạn." });
        s.push({ from: "h", to: "r", kind: "ok", label: "ghi file", title: "Claude Code ghi file mới", desc: "File được tạo trên ổ đĩa.", payload: dateTs, payloadTitle: "src/lib/date.ts", pnote: "Toàn bộ nội dung file được ghi." });
        s.push({ from: "h", to: "c", kind: "ok", label: "tool_result", title: "Báo ghi file thành công", desc: "Claude sẽ tiếp tục chuyển phần thanh toán rồi chạy test của phần đó trước khi sang phần tiếp theo.", ...tr("toolu_85", "File created successfully at: /repo/src/lib/date.ts") });
        return s;
      },
    }),
  };

  /* ───────── 3-6 Claude Code trong CI ───────── */
  W.ciPipeline = {
    title: "Claude Code trong CI: câu lệnh, kết quả JSON và bình luận trên pull request",
    render: trace({
      intro: "Trong CI không có ai ngồi trước màn hình để trả lời câu hỏi. Bật tắt từng tùy chọn để xem job CI chạy thế nào. Lần review trước, bot đã báo 5 vấn đề; 3 vấn đề đã được sửa, 2 vấn đề vẫn còn.",
      actors: [
        { id: "g", icon: "🐙", name: "GitHub", sub: "pull request #77", desc: "Nơi chứa code và pull request. Gửi sự kiện cho CI và nhận bình luận qua API." },
        { id: "r", icon: "🏃", name: "Máy chạy CI", sub: "GitHub Actions runner", desc: "Máy ảo chạy file workflow: chuẩn bị yêu cầu, chạy lệnh <code>claude</code>, đọc kết quả, đăng bình luận." },
        { id: "x", icon: "🖥️", name: "Claude Code", sub: "chạy bằng lệnh claude -p", desc: "Chạy như một chương trình dòng lệnh trên máy CI: gọi Claude API, chạy công cụ được phép, in kết quả ra stdout rồi thoát." },
        { id: "a", icon: "🧠", name: "Claude API", sub: "model", desc: "Nhận request từ Claude Code, trả về yêu cầu dùng công cụ hoặc kết quả review." },
      ],
      links: { "g>r": "webhook của GitHub kích hoạt workflow", "r>x": "chạy lệnh trong shell của máy CI", "x>r": "stdout của lệnh (ghi vào out.json)", "x>a": "HTTPS · POST api.anthropic.com/v1/messages", "a>x": "HTTPS · response 200 OK", "r>g": "HTTPS · REST API của GitHub (lệnh gh api)" },
      stateTitle: "Bình luận trên pull request",
      controls: [
        { id: "p", type: "toggle", label: "Có cờ <code>-p</code>", value: true },
        { id: "j", type: "toggle", label: "Có <code>--output-format json --json-schema</code>", value: true },
        { id: "h", type: "toggle", label: "Đưa các phát hiện cũ vào yêu cầu", value: true },
      ],
      steps: ({ p, j, h }) => {
        const s = [];
        const cmd = `claude ${p ? "-p " : ""}"$PROMPT"${j ? " \\\n  --output-format json --json-schema \"$(cat review.schema.json)\"" : ""} \\\n  --allowedTools \"Read,Grep,Glob,Bash(git diff:*)\" --max-turns 15 > out.json`;
        const PREV = [{ path: "src/api/user.ts", line: 42, body: "Thiếu kiểm tra quyền admin" }, { path: "src/api/orders.ts", line: 17, body: "Không xử lý lỗi khi gọi thanh toán" }];
        const prompt = "Review pull request này theo tiêu chí trong CLAUDE.md. Chỉ báo: lỗi logic, lỗi bảo mật, thiếu xử lý lỗi." + (h ? "\nNhững vấn đề đã báo trước đây (chưa sửa): " + J(PREV) + "\nChỉ báo vấn đề MỚI; vấn đề đã báo thì không lặp lại." : "");
        s.push({ phase: "Kích hoạt", from: "g", to: "r", kind: "req", label: "commit mới", title: "Có commit mới trên pull request", desc: "GitHub báo cho hệ thống CI biết có code mới cần review, và workflow review bắt đầu chạy.", payload: { action: "synchronize", number: 77, pull_request: { number: 77, head: { ref: "fix/user-email", sha: "9f3c2e1" }, base: { ref: "main" } }, repository: { full_name: "acme/web" } }, part: "Sự kiện thật có hàng trăm trường (thông tin repo, người gửi, cài đặt…); ở đây giữ các trường workflow dùng tới.", state: [{ r: "note", t: "Lần trước bot đã báo 5 vấn đề (3 đã sửa, 2 chưa sửa)" }] });
        s.push({ from: "r", to: "r", kind: "internal", via: "các lệnh shell trong file workflow", title: "Máy CI chuẩn bị yêu cầu và câu lệnh", desc: h ? "Máy CI lấy danh sách bình luận cũ của bot, đưa vào yêu cầu, và dặn Claude chỉ báo vấn đề mới." : "Máy CI chỉ dùng yêu cầu review cố định, không nhắc gì tới những lần review trước.", payload: `# Trích từ file .github/workflows/review.yml\n${h ? "gh api repos/$REPO/pulls/77/comments --jq '[.[] | select(.user.login==\"review-bot\") | {path,line,body}]' > prev.json\nPROMPT=\"$(cat .github/review-prompt.md)\nNhững vấn đề đã báo trước đây (chưa sửa): $(cat prev.json)\nChỉ báo vấn đề MỚI; vấn đề đã báo thì không lặp lại.\"" : "PROMPT=\"$(cat .github/review-prompt.md)\""}\n${cmd}`, pnote: "Toàn bộ phần lệnh của bước review trong workflow.", backend: ["Khóa API được lấy từ phần lưu trữ bí mật của CI (biến ANTHROPIC_API_KEY).", "<code>--allowedTools</code> cho phép trước đúng những công cụ cần dùng, vì không có ai để bấm “cho phép”.", "<code>--max-turns</code> giới hạn số lượt, để job không chạy mãi."] });
        if (!p) {
          s.push({ phase: "Chạy Claude Code", from: "r", to: "x", kind: "err", label: "đứng chờ", key: true, title: "Thiếu -p nên Claude Code mở giao diện trò chuyện", desc: "Không có cờ <code>-p</code>, Claude Code mở khung trò chuyện và chờ người gõ phím. Trong CI không có ai gõ cả.", payload: "╭──────────────────────────────────────╮\n│ > Review pull request này theo CLAUDE.md │\n╰──────────────────────────────────────╯\n(đang chờ nhập từ bàn phím)", pnote: "Những gì Claude Code hiện ra trên máy CI.", warn: "Job đứng chờ mãi cho tới khi CI tự hủy vì quá giờ, ví dụ sau 60 phút." });
          return s;
        }
        s.push({ phase: "Chạy Claude Code", from: "r", to: "x", kind: "req", label: "claude -p", key: true, title: "Chạy một lần rồi tự thoát", desc: "Với cờ <code>-p</code>, Claude Code nhận yêu cầu, làm xong, in kết quả ra stdout rồi tự thoát.", payload: cmd, pnote: "Toàn bộ câu lệnh (biến $PROMPT chứa yêu cầu ở bước trước)." });
        s.push({ from: "x", to: "x", kind: "internal", via: "đọc CLAUDE.md và cài đặt của dự án trên máy CI", title: "Claude Code đọc bối cảnh của dự án", desc: "Giống khi chạy trên máy, Claude Code đọc CLAUDE.md (chứa tiêu chí review và tiêu chuẩn test), các cài đặt của dự án, rồi bắt đầu vòng lặp làm việc." });
        const cv = ccConv([], "R", { tools: ["Read", "Grep", "Glob", "Bash"].map((name) => ({ name })), part: "Claude Code tự dựng request này. <code>messages</code> hiện đầy đủ. <code>system</code> thật là system prompt có sẵn của Claude Code cộng nội dung CLAUDE.md; <code>tools</code> chỉ gồm các công cụ trong <code>--allowedTools</code>, định nghĩa đầy đủ không hiện." });
        cv.user(prompt);
        s.push({ from: "x", to: "a", kind: "req", label: "request #1", title: "Request đầu tiên tới Claude API", desc: h ? "Yêu cầu có kèm danh sách vấn đề đã báo." : "Yêu cầu không nhắc gì tới lần review trước.", ...cv.req({ hl: h ? ["Những vấn đề đã báo"] : [] }) });
        const calls = [{ name: "Bash", input: { command: "git diff origin/main...HEAD --stat" } }, { name: "Bash", input: { command: "git diff origin/main...HEAD -- src/api" } }, { name: "Read", input: { file_path: "/runner/work/web/src/api/user.ts" } }, { name: "Grep", input: { pattern: "getUser\\(", output_mode: "content" } }, { name: "Read", input: { file_path: "/runner/work/web/src/api/signup.ts" } }, { name: "Read", input: { file_path: "/runner/work/web/src/db/query.ts" } }, { name: "Grep", input: { pattern: "profile\\.", path: "src/api/user.ts", output_mode: "content" } }, { name: "Read", input: { file_path: "/runner/work/web/CLAUDE.md" } }];
        s.push({ from: "a", to: "x", kind: "res", label: "8 vòng", via: "8 vòng: response có tool_use → Claude Code chạy công cụ → request kèm tool_result; gộp lại thành một bước", title: "Claude đọc code qua nhiều lượt (gộp 8 vòng)", desc: "Claude dùng các công cụ được phép như xem thay đổi, đọc file, tìm kiếm. Đây chính là vòng lặp agent ở mục 1-1, chỉ khác là không có ai theo dõi.", payload: calls, payloadTitle: "8 lệnh công cụ, theo thứ tự", part: "Gộp 8 vòng thành một bước: chỉ hiện các lệnh Claude xin chạy (mỗi lệnh nằm trong một response riêng), không hiện kết quả từng lệnh." });
        const NEW = [{ path: "src/api/user.ts", line: 88, severity: "high", rule: "sql-injection", message: "Nối chuỗi email trực tiếp vào câu SQL." }, { path: "src/api/user.ts", line: 120, severity: "medium", rule: "null-check", message: "Biến profile có thể chưa có giá trị." }];
        const OLD = [{ path: "src/api/user.ts", line: 42, severity: "high", rule: "authz", message: "Thiếu kiểm tra quyền admin." }, { path: "src/api/orders.ts", line: 17, severity: "medium", rule: "error-handling", message: "Không xử lý lỗi khi gọi thanh toán." }];
        const findings = h ? NEW : NEW.concat(OLD);
        const text = h ? "Tìm thấy 2 vấn đề mới." : "Tìm thấy 4 vấn đề.";
        s.push({ from: "a", to: "x", kind: "res", label: "end_turn", key: true, title: "Claude hoàn tất việc review", desc: "Response cuối có <code>stop_reason: end_turn</code>." + (j ? " Vì có <code>--json-schema</code>, Claude Code còn lấy từ Claude danh sách phát hiện theo đúng schema và đặt vào <code>structured_output</code> ở bước sau." : ""), ...cv.res({ content: [{ type: "text", text: text + "\n" + findings.map((f) => `- ${f.path}:${f.line} (${f.severity}) ${f.message}`).join("\n") }], stop_reason: "end_turn", in: 48200, out: 260 }) });
        if (j) {
          s.push({ phase: "Đọc kết quả", from: "x", to: "r", kind: "ok", label: "out.json", key: true, title: "Kết quả được in ra dưới dạng JSON", desc: "Kết quả có cấu trúc rõ ràng. Script đọc được chính xác từng phát hiện nằm ở file nào, dòng nào.", payload: { type: "result", subtype: "success", is_error: false, duration_ms: 84211, duration_api_ms: 79530, num_turns: 9, result: text, session_id: "5c1e8a42-93f0-4d6b-b8e2-1a7c0f9d3e55", total_cost_usd: 0.23, usage: { input_tokens: 61840, output_tokens: 2120, cache_read_input_tokens: 38900 }, structured_output: { findings } }, pnote: "Toàn bộ nội dung file out.json.", hl: ["subtype", "is_error", "structured_output", "path", "line"], fields: [["subtype, is_error", "Cho biết lần chạy có thành công không. Script nên kiểm tra trước khi dùng kết quả."], ["structured_output", "Dữ liệu theo đúng mẫu đã khai báo bằng --json-schema."], ["total_cost_usd, num_turns", "Chi phí và số lượt, để theo dõi."], ["session_id", "Mã phiên, dùng khi muốn tiếp tục phiên này ở lần chạy sau."]] });
          s.push({ from: "r", to: "r", kind: "internal", via: "lệnh jq đọc file out.json trên máy CI", title: "Script đọc từng phát hiện và chuẩn bị bình luận", desc: "Với mỗi phát hiện, script lấy đường dẫn file, số dòng và nội dung, rồi gửi lên GitHub thành một bình luận gắn đúng vào dòng code đó.", payload: "jq -c '.structured_output.findings[]' out.json | while read f; do\n  gh api repos/$REPO/pulls/77/comments -f path=\"$(jq -r .path <<<\"$f\")\" \\\n     -F line=\"$(jq -r .line <<<\"$f\")\" -f body=\"$(jq -r .message <<<\"$f\")\" -f commit_id=9f3c2e1\ndone", pnote: "Toàn bộ đoạn script." });
          s.push({ phase: "Đăng bình luận", from: "r", to: "g", kind: h ? "ok" : "warn", label: h ? "2 bình luận mới" : "4 bình luận", key: true, title: h ? "Chỉ đăng những vấn đề mới" : "Đăng lại cả những vấn đề đã báo", desc: h ? "Nhờ biết những gì đã báo trước đó, bot chỉ đăng hai vấn đề mới." : "Không biết những gì đã báo, bot đăng lại hai vấn đề cũ chưa sửa bên cạnh hai vấn đề mới. Lập trình viên sẽ bắt đầu bỏ qua bot.", views: [{ t: `${findings.length} request HTTP`, parts: findings.map((f, i) => ({ t: `Bình luận ${i + 1}`, d: http.req("POST", "https://api.github.com/repos/acme/web/pulls/77/comments", { authorization: "Bearer $GITHUB_TOKEN   # token của workflow, được che", accept: "application/vnd.github+json" }, { body: f.message, commit_id: "9f3c2e1", path: f.path, line: f.line, side: "RIGHT" }) })), note: "Toàn bộ các request lệnh gh api gửi đi, mỗi phát hiện một request." }], push: h ? [{ r: "ok", t: "user.ts dòng 88: nguy cơ SQL injection (cao)" }, { r: "ok", t: "user.ts dòng 120: thiếu kiểm tra giá trị rỗng" }] : [{ r: "err", t: "4 bình luận, 2 bình luận trùng với lần trước" }] });
        } else {
          s.push({ phase: "Đọc kết quả", from: "x", to: "r", kind: "warn", label: "văn bản", key: true, title: "Kết quả là một đoạn văn", desc: "Không có định dạng JSON, stdout chỉ là câu trả lời cuối của Claude, dạng văn tự do.", payload: text + "\n" + findings.map((f) => `- ${f.path}:${f.line} (${f.severity}) ${f.message}`).join("\n"), pnote: "Toàn bộ nội dung file out.json (lúc này là văn bản thường).", warn: "Định dạng văn bản có thể đổi giữa các lần chạy. Tự viết code tách đường dẫn và số dòng từ đoạn văn thì rất dễ hỏng; không có số dòng chính xác thì không gắn bình luận vào đúng dòng code được." });
        }
        return s;
      },
    }),
  };
})();
