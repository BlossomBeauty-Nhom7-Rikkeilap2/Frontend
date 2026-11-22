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
        { id: "acc-001", fullName: "Doãn Thị Minh Anh", email: "admin@blossom.vn",     username: "admin",     password: "Blossom@123", role: "MANAGER", status: "active", createdAt: "2026-01-05" },
        { id: "acc-002", fullName: "Doãn Thị Minh Anh", email: "minhanh@blossom.vn",   username: "minhanh",   password: "Staff@123",   role: "STAFF",   status: "active", createdAt: "2026-01-10" },
        { id: "acc-003", fullName: "Nguyễn Thùy Dương", email: "thuyduong@blossom.vn", username: "thuyduong", password: "Staff@123",   role: "STAFF",   status: "active", createdAt: "2026-01-15" },
        { id: "acc-004", fullName: "Trần Quốc Mạnh",    email: "manh@blossom.vn",      username: "manh",      password: "Manh@2026",   role: "STAFF",   status: "active", createdAt: "2026-02-12" },
        { id: "acc-005", fullName: "Nguyễn Thu Hà",     email: "thuha@blossom.vn",     username: "thuha",     password: "Staff@123",   role: "STAFF",   status: "active", createdAt: "2026-02-20" },
        { id: "acc-006", fullName: "Lê Hoàng Long",     email: "hoanglong@blossom.vn", username: "hoanglong", password: "Staff@123",   role: "STAFF",   status: "locked", createdAt: "2026-03-08" },
        { id: "acc-007", fullName: "Phạm Ngọc Diệp",    email: "ngocdiep@blossom.vn",  username: "ngocdiep",  password: "Blossom@123", role: "MANAGER", status: "active", createdAt: "2026-04-02" },
        { id: "acc-008", fullName: "Võ Khánh Linh",     email: "khanhlinh@blossom.vn", username: "khanhlinh", password: "Staff@123",   role: "STAFF",   status: "active", createdAt: "2026-05-17" },
        { id: "acc-009", fullName: "Đặng Bảo Châu",     email: "baochau@blossom.vn",   username: "baochau",   password: "Staff@123",   role: "STAFF",   status: "active", createdAt: "2026-07-01" },
        { id: "acc-010", fullName: "Bùi Gia Hân",       email: "giahan@blossom.vn",    username: "giahan",    password: "Staff@123",   role: "STAFF",   status: "locked", createdAt: "2026-09-22" }
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
            if (Array.isArray(raw) && raw.length > 0) {
                let changed = false;
                raw.forEach(function (a) {
                    if (!a.username) { a.username = a.email ? a.email.split("@")[0].toLowerCase() : ""; changed = true; }
                    if (!a.password) { a.password = a.role === "MANAGER" ? "Blossom@123" : "Staff@123"; changed = true; }
                });
                if (changed) save(raw);
                return raw;
            }
        } catch (e) { /* dữ liệu hỏng -> dùng dữ liệu mẫu */ }
        const seed = SEED.map(function (a) { return Object.assign({}, a); });
        save(seed);
        return seed;
    }

    // Tài khoản có email/username này đang bị khóa không? (login.js dùng để chặn đăng nhập)
    function isLocked(identifier) {
        const key = String(identifier || "").trim().toLowerCase();
        return load().some(function (a) {
            const em = normEmail(a.email);
            const un = String(a.username || "").trim().toLowerCase();
            return (em === key || un === key) && a.status === "locked";
        });
    }

    global.AccountStore = { KEY, load, save, isLocked, normEmail };
})(window);
