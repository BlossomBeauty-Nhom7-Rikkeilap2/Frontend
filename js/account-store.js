/* =========================================================
   ACCOUNT STORE – Kho dữ liệu tài khoản (demo, lưu localStorage)
   Dùng chung cho:
     - pages/admin/accounts.html  (quản lý tài khoản)
     - pages/auth/login.html      (chặn tài khoản đã khóa đăng nhập)

   Khi nối backend: thay load()/save() bằng lời gọi API.
   Lưu ý: KHÔNG lưu mật khẩu ở phía trình duyệt – mật khẩu do server băm và kiểm tra.
   ========================================================= */
(function (global) {
    "use strict";

    const KEY = "blossom_accounts";

    // role: "MANAGER" | "STAFF"      status: "active" | "locked"
    const SEED = [
        { id: "acc-001", fullName: "Doãn Thị Minh Anh", email: "admin@blossom.vn",    role: "MANAGER", status: "active", createdAt: "2026-01-05" },
        { id: "acc-002", fullName: "Trần Quốc Mạnh",    email: "manh@blossom.vn",     role: "STAFF",   status: "active", createdAt: "2026-02-12" },
        { id: "acc-003", fullName: "Nguyễn Thu Hà",     email: "thuha@blossom.vn",    role: "STAFF",   status: "active", createdAt: "2026-02-20" },
        { id: "acc-004", fullName: "Lê Hoàng Long",     email: "hoanglong@blossom.vn", role: "STAFF",  status: "locked", createdAt: "2026-03-08" },
        { id: "acc-005", fullName: "Phạm Ngọc Diệp",    email: "ngocdiep@blossom.vn", role: "MANAGER", status: "active", createdAt: "2026-04-02" },
        { id: "acc-006", fullName: "Võ Khánh Linh",     email: "khanhlinh@blossom.vn", role: "STAFF",  status: "active", createdAt: "2026-05-17" },
        { id: "acc-007", fullName: "Đặng Bảo Châu",     email: "baochau@blossom.vn",  role: "STAFF",   status: "active", createdAt: "2026-07-01" },
        { id: "acc-008", fullName: "Bùi Gia Hân",       email: "giahan@blossom.vn",   role: "STAFF",   status: "locked", createdAt: "2026-09-22" }
    ];

    function normEmail(email) {
        return String(email || "").trim().toLowerCase();
    }

    function save(list) {
        try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) { /* bỏ qua */ }
    }

    function load() {
        try {
            const raw = JSON.parse(localStorage.getItem(KEY));
            if (Array.isArray(raw)) return raw;
        } catch (e) { /* dữ liệu hỏng -> dùng dữ liệu mẫu */ }
        const seed = SEED.map(function (a) { return Object.assign({}, a); });
        save(seed);
        return seed;
    }

    // Tài khoản có email này đang bị khóa không? (login.js dùng để chặn đăng nhập)
    function isLocked(email) {
        const key = normEmail(email);
        return load().some(function (a) { return normEmail(a.email) === key && a.status === "locked"; });
    }

    global.AccountStore = { KEY, load, save, isLocked, normEmail };
})(window);
