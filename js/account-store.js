/* =========================================================
   ACCOUNT STORE – Kho dữ liệu tài khoản (demo, lưu localStorage)
   Dùng chung cho:
     - pages/admin/accounts.html  (quản lý tài khoản)
     - pages/auth/login.html      (chặn tài khoản đã khóa đăng nhập & xác thực tài khoản)

   Lưu trữ mật khẩu mã hóa demo trong localStorage để hỗ trợ đăng nhập
   cho toàn bộ 8 tài khoản hệ thống và bất kỳ tài khoản mới nào được tạo.
   ========================================================= */
(function (global) {
    "use strict";

    const KEY = "blossom_accounts";

    // role: "MANAGER" | "STAFF"      status: "active" | "locked"
    const SEED = [
        { id: "acc-001", fullName: "Quản lý Blossom",      email: "manager@blossom.vn",  role: "MANAGER", status: "active", createdAt: "2026-01-05", password: "Blossom@123", position: "Marketing Manager", username: "manager" },
        { id: "acc-001b", fullName: "Quản trị Hệ thống",   email: "admin@blossom.vn",    role: "MANAGER", status: "active", createdAt: "2026-01-05", password: "Blossom@123", position: "Marketing Manager", username: "admin" },
        { id: "acc-002", fullName: "Doãn Thị Minh Anh",    email: "minhanh@blossom.vn",  role: "STAFF",   status: "active", createdAt: "2026-02-12", password: "Blossom@123", position: "Marketing Staff", username: "minhanh" },
        { id: "acc-003", fullName: "Phạm Thùy Dương",      email: "thuyduong@blossom.vn", role: "STAFF",  status: "active", createdAt: "2026-02-15", password: "Blossom@123", position: "Marketing Staff", username: "thuyduong" },
        { id: "acc-004", fullName: "Trần Ngọc Mai",        email: "ngocmai@blossom.vn",  role: "STAFF",   status: "active", createdAt: "2026-02-20", password: "Blossom@123", position: "Content Creator", username: "ngocmai" },
        { id: "acc-005", fullName: "Trần Quốc Mạnh",        email: "manh@blossom.vn",     role: "STAFF",   status: "active", createdAt: "2026-02-25", password: "Manh@2026",   position: "Marketing Staff", username: "manh" },
        { id: "acc-006", fullName: "Lê Hoàng Long",         email: "hoanglong@blossom.vn", role: "STAFF",  status: "locked", createdAt: "2026-03-08", password: "Blossom@123", position: "Copywriter", username: "hoanglong" },
        { id: "acc-007", fullName: "Phạm Ngọc Diệp",        email: "ngocdiep@blossom.vn", role: "MANAGER", status: "active", createdAt: "2026-04-02", password: "Blossom@123", position: "Brand Manager", username: "ngocdiep" },
        { id: "acc-008", fullName: "Võ Khánh Linh",         email: "khanhlinh@blossom.vn", role: "STAFF",  status: "active", createdAt: "2026-05-17", password: "Blossom@123", position: "Social Media Executive", username: "khanhlinh" }
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
                // Đảm bảo các tài khoản kiểm tra quan trọng (Minh Anh - Staff, Thùy Dương - Staff, Manager) luôn có mặt
                const existingEmails = raw.map(function (a) { return normEmail(a.email); });
                SEED.forEach(function (s) {
                    if (!existingEmails.includes(normEmail(s.email))) {
                        raw.push(Object.assign({}, s));
                    }
                });
                // Đảm bảo mọi tài khoản đều có mật khẩu
                return raw.map(function (a) {
                    if (!a.password) a.password = "Blossom@123";
                    if (a.email === "minhanh@blossom.vn" && a.role !== "STAFF") a.role = "STAFF";
                    return a;
                });
            }
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

    global.AccountStore = { KEY, SEED, load, save, isLocked, normEmail };
})(window);
