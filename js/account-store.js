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
        { id: "acc-001", username: "admin",     fullName: "Đoàn Thị Minh Anh", email: "admin@blossom.vn",     password: "Blossom@123", role: "MANAGER", status: "active", createdAt: "2026-01-05" },
        { id: "acc-002", username: "manh",      fullName: "Trần Quốc Mạnh",    email: "manh@blossom.vn",      password: "Manh@2026",   role: "STAFF",   status: "active", createdAt: "2026-02-12" },
        { id: "acc-003", username: "thuha",     fullName: "Nguyễn Thu Hà",     email: "thuha@blossom.vn",     password: "Staff@123",   role: "STAFF",   status: "active", createdAt: "2026-02-20" },
        { id: "acc-004", username: "hoanglong", fullName: "Lê Hoàng Long",     email: "hoanglong@blossom.vn", password: "Staff@123",   role: "STAFF",   status: "locked", createdAt: "2026-03-08" },
        { id: "acc-005", username: "ngocdiep",  fullName: "Phạm Ngọc Diệp",    email: "ngocdiep@blossom.vn",  password: "Blossom@123", role: "MANAGER", status: "active", createdAt: "2026-04-02" },
        { id: "acc-006", username: "khanhlinh", fullName: "Võ Khánh Linh",     email: "khanhlinh@blossom.vn", password: "Staff@123",   role: "STAFF",   status: "active", createdAt: "2026-05-17" },
        { id: "acc-007", username: "baochau",   fullName: "Đặng Bảo Châu",     email: "baochau@blossom.vn",   password: "Staff@123",   role: "STAFF",   status: "active", createdAt: "2026-07-01" },
        { id: "acc-008", username: "giahan",    fullName: "Bùi Gia Hân",       email: "giahan@blossom.vn",    password: "Staff@123",   role: "STAFF",   status: "locked", createdAt: "2026-09-22" },
        { id: "acc-009", username: "minhanh",   fullName: "Doãn Thị Minh Anh", email: "minhanh@blossom.vn",   password: "Staff@123",   role: "STAFF",   status: "active", createdAt: "2026-02-15" },
        { id: "acc-010", username: "thuyduong", fullName: "Nguyễn Thùy Dương", email: "thuyduong@blossom.vn", password: "Staff@123",   role: "STAFF",   status: "active", createdAt: "2026-02-18" }
    ];

    function normEmail(email) {
        return String(email || "").trim().toLowerCase();
    }

    function usernameFromEmail(email) {
        const clean = normEmail(email);
        const at = clean.indexOf("@");
        return at > 0 ? clean.slice(0, at) : clean;
    }

    function defaultPasswordFor(email, role) {
        const key = normEmail(email);
        const found = SEED.filter(function (s) { return normEmail(s.email) === key; })[0];
        if (found) return found.password;
        return role === "MANAGER" ? "Blossom@123" : "Staff@123";
    }

    function save(list) {
        try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) { /* bỏ qua */ }
    }

    function load() {
        try {
            const raw = JSON.parse(localStorage.getItem(KEY));
            if (Array.isArray(raw)) {
                let changed = false;
                raw.forEach(function (a) {
                    if (!a.username && a.email) {
                        a.username = usernameFromEmail(a.email);
                        changed = true;
                    }
                    if (!a.password) {
                        a.password = defaultPasswordFor(a.email, a.role);
                        changed = true;
                    }
                });
                // Đảm bảo tài khoản nhân viên mặc định (minhanh, thuyduong) luôn tồn tại nếu chưa có
                ["minhanh@blossom.vn", "thuyduong@blossom.vn"].forEach(function (em) {
                    const exists = raw.some(function (a) { return normEmail(a.email) === em; });
                    if (!exists) {
                        const seedItem = SEED.filter(function (s) { return s.email === em; })[0];
                        if (seedItem) { raw.push(Object.assign({}, seedItem)); changed = true; }
                    }
                });
                if (changed) save(raw);
                return raw;
            }
        } catch (e) { /* dữ liệu hỏng -> dùng dữ liệu mẫu */ }
        const seed = SEED.map(function (a) { return Object.assign({}, a); });
        save(seed);
        return seed;
    }

    function findByIdentifier(identifier) {
        const key = normEmail(identifier);
        if (!key) return null;
        return load().filter(function (a) {
            return normEmail(a.email) === key || normEmail(a.username || usernameFromEmail(a.email)) === key;
        })[0] || null;
    }

    function verifyPassword(acc, pwd) {
        if (!acc) return false;
        const expected = acc.password || defaultPasswordFor(acc.email, acc.role);
        return String(pwd) === String(expected);
    }

    function updatePassword(idOrEmail, newPassword) {
        const list = load();
        const key = normEmail(idOrEmail);
        const rec = list.filter(function (a) {
            return a.id === idOrEmail || normEmail(a.email) === key || normEmail(a.username || usernameFromEmail(a.email)) === key;
        })[0];
        if (!rec) return false;
        rec.password = String(newPassword);
        save(list);
        return true;
    }

    // Tài khoản có email/username này đang bị khóa không? (login.js dùng để chặn đăng nhập)
    function isLocked(identifier) {
        const acc = findByIdentifier(identifier);
        return !!acc && acc.status === "locked";
    }

    global.AccountStore = {
        KEY, load, save, isLocked, normEmail,
        usernameFromEmail, defaultPasswordFor, findByIdentifier, verifyPassword, updatePassword
    };
})(window);
