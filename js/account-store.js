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
    const REAL_MODE_FLAG = "blossom_accounts_real_v1";

    function normEmail(email) {
        return String(email || "").trim().toLowerCase();
    }

    function usernameFromEmail(email) {
        const clean = normEmail(email);
        const at = clean.indexOf("@");
        return at > 0 ? clean.slice(0, at) : clean;
    }

    function defaultPasswordFor() {
        return "";
    }

    function save(list) {
        try { localStorage.setItem(KEY, JSON.stringify(list || [])); } catch (e) { /* bỏ qua */ }
    }

    function load() {
        try {
            if (!localStorage.getItem(REAL_MODE_FLAG)) {
                localStorage.removeItem(KEY);
                localStorage.setItem(REAL_MODE_FLAG, "1");
            }
            const raw = JSON.parse(localStorage.getItem(KEY));
            if (Array.isArray(raw)) {
                return raw;
            }
        } catch (e) { /* bỏ qua */ }
        return [];
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

    async function syncFromBackend() {
        if (!global.BlossomAPI || !global.BlossomAPI.getToken()) return;
        const role = global.Auth && typeof global.Auth.getRole === "function" ? global.Auth.getRole() : null;
        if (role && role !== "MANAGER") return;
        try {
            const users = await global.BlossomAPI.request("/users");
            if (Array.isArray(users)) {
                const realList = users.map(function (u) {
                    const isMgr = (u.role && u.role.role_code === "MANAGER") || u.role_id === 1;
                    const statusStr = (u.status === "ACTIVE" ? "active" : "locked");
                    const dateStr = u.created_at ? u.created_at.slice(0, 10) : "";
                    return {
                        id: u.user_id,
                        username: u.username,
                        fullName: u.full_name,
                        email: u.email,
                        role: isMgr ? "MANAGER" : "STAFF",
                        status: statusStr,
                        createdAt: dateStr
                    };
                });

                save(realList);
                try { global.dispatchEvent(new Event("blossom_accounts_updated")); } catch (e) {}
            }
        } catch (e) {
            console.warn("[AccountStore] syncFromBackend error:", e.message);
        }
    }

    global.AccountStore = {
        KEY, load, save, isLocked, normEmail,
        usernameFromEmail, defaultPasswordFor, findByIdentifier, verifyPassword, updatePassword,
        syncFromBackend: syncFromBackend
    };

    if (typeof window !== "undefined") {
        window.addEventListener("DOMContentLoaded", function () {
            if (global.BlossomAPI && global.BlossomAPI.getToken()) {
                syncFromBackend();
            }
        });
    }
})(window);
