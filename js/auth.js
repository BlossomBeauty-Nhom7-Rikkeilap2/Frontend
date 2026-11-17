
/* =========================================================
   AUTH – Quản lý phiên đăng nhập, thông tin người dùng, đăng xuất
   Nạp trong <head> của mọi trang (đầu tiên, trước session.js,
   permissions.js và route-guard.js). Trang login cũng nạp file này.

   Lưu trong localStorage (dùng chung giữa các tab):
     blossom_user    -> thông tin người dùng (KHÔNG chứa mật khẩu)
     blossom_session -> mốc thời gian của phiên { loginAt, lastActivity }
   Lưu trong sessionStorage (riêng từng tab):
     blossom_flash   -> thông báo "một lần" hiện ở trang kế tiếp

   Role trong hệ thống: MANAGER và STAFF.
   (Dữ liệu cũ lưu role "ADMIN" vẫn được hiểu là MANAGER.)

   File này CHỈ quản lý dữ liệu phiên. Việc theo dõi hoạt động và
   hết hạn do session.js làm; chặn truy cập trang do route-guard.js làm.
   ========================================================= */
(function (global) {
    "use strict";

    const USER_KEY = "blossom_user";
    const SESSION_KEY = "blossom_session";
    const REMEMBER_KEY = "blossom_remember_user";
    const FLASH_KEY = "blossom_flash";

    const ROLES = { MANAGER: "MANAGER", STAFF: "STAFF" };
    const ROLE_LABEL = { MANAGER: "Manager", STAFF: "Staff" };
    const LEGACY_ROLE = { ADMIN: "MANAGER" };

    // Trang chủ (dashboard) của từng role, tính từ thư mục /pages/
    const HOME = {
    MANAGER: "admin/dashboard.html",
    STAFF: "staff/dashboard.html"
    };

    /* ---------- Role & đường dẫn ---------- */

    function normalizeRole(role) {
        const key = String(role || "").toUpperCase();
        return ROLES[LEGACY_ROLE[key] || key] || null;
    }

    // Thư mục gốc của /pages/ (hoạt động với mọi base path: "/", "/Frontend-main/", ...)
    function pagesBase() {
        const path = location.pathname;
        const i = path.indexOf("/pages/");
        return i === -1 ? "pages/" : path.slice(0, i + "/pages/".length);
    }

    function homeUrl(role) {
        return pagesBase() + (HOME[role] || "auth/login.html");
    }

    function loginUrl() {
        return pagesBase() + "auth/login.html";
    }

    /* ---------- Thông tin người dùng ---------- */

    function getUser() {
        try {
            const raw = JSON.parse(localStorage.getItem(USER_KEY));
            if (!raw) return null;
            const role = normalizeRole(raw.role);
            return role ? Object.assign({}, raw, { role: role }) : null;
        } catch (e) {
            return null;
        }
    }

    function getRole() {
        const user = getUser();
        return user ? user.role : null;
    }

    function isLoggedIn() {
        return getUser() !== null;
    }

    /* ---------- Phiên đăng nhập ---------- */

    function readSession() {
        try {
            const raw = JSON.parse(localStorage.getItem(SESSION_KEY));
            if (!raw || !isFinite(raw.loginAt) || !isFinite(raw.lastActivity)) return null;
            return { loginAt: Number(raw.loginAt), lastActivity: Number(raw.lastActivity) };
        } catch (e) {
            return null;
        }
    }

    function writeSession(session) {
        try { localStorage.setItem(SESSION_KEY, JSON.stringify(session)); } catch (e) { /* bỏ qua */ }
    }

    // { loginAt, lastActivity } (mili-giây) hoặc null nếu chưa có phiên
    function getSession() {
        return readSession();
    }

    // Bắt đầu phiên mới sau khi xác thực thành công.
    // Chỉ lưu các trường công khai; trả về user đã lưu, hoặc null nếu role không hợp lệ.
    function login(user) {
        const role = normalizeRole(user && user.role);
        if (!role) return null;

        const saved = {
            username: user.username,
            email: user.email,
            role: role,
            fullName: user.fullName,
            position: user.position
        };

        const now = Date.now();
        try {
            localStorage.setItem(USER_KEY, JSON.stringify(saved));
        } catch (e) {
            return null;
        }
        writeSession({ loginAt: now, lastActivity: now });
        return saved;
    }

    // Ghi nhận hoạt động mới nhất. Nếu đã đăng nhập nhưng chưa có mốc phiên
    // (dữ liệu từ bản cũ) thì tạo mốc mới. Không làm gì khi chưa đăng nhập.
    function touch(time) {
        if (!isLoggedIn()) return;
        const now = time || Date.now();
        const session = readSession();
        writeSession({ loginAt: session ? session.loginAt : now, lastActivity: now });
    }

    // Xóa phiên nhưng KHÔNG chuyển trang
    function clearSession() {
        try {
            localStorage.removeItem(USER_KEY);
            localStorage.removeItem(SESSION_KEY);
        } catch (e) { /* bỏ qua */ }
    }

    // Đăng xuất: xóa phiên rồi về trang login, GIỮ lại "ghi nhớ tên đăng nhập".
    // reason = "timeout" -> hiện thông báo phiên hết hạn ở trang login.
    function logout(reason) {
        clearSession();
        if (reason === "timeout") {
            setFlash({
                type: "error",
                title: "Phiên đăng nhập đã hết hạn",
                message: "Bạn không hoạt động quá lâu. Vui lòng đăng nhập lại."
            });
        }
        location.replace(loginUrl());
    }

    /* ---------- Hiển thị tên ---------- */

    // "Doãn Thị Minh Anh" -> "Minh Anh"
    function shortName(user) {
        const name = ((user && (user.fullName || user.username)) || "").trim();
        const parts = name.split(/\s+/).filter(Boolean);
        return parts.length > 2 ? parts.slice(-2).join(" ") : name;
    }

    // "Doãn Thị Minh Anh" -> "MA"
    function initials(user) {
        const parts = shortName(user).split(/\s+/).filter(Boolean);
        if (!parts.length) return "?";
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }

    /* ---------- Thông báo "một lần" giữa 2 trang ---------- */

    function setFlash(flash) {
        try { sessionStorage.setItem(FLASH_KEY, JSON.stringify(flash)); } catch (e) { /* bỏ qua */ }
    }

    function takeFlash() {
        try {
            const raw = sessionStorage.getItem(FLASH_KEY);
            sessionStorage.removeItem(FLASH_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    global.Auth = {
        USER_KEY, SESSION_KEY, REMEMBER_KEY, ROLES, ROLE_LABEL,
        normalizeRole, pagesBase, homeUrl, loginUrl,
        getUser, getRole, isLoggedIn,
        getSession, login, touch, clearSession, logout,
        shortName, initials, setFlash, takeFlash
    };
})(window);
