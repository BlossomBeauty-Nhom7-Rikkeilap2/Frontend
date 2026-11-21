/* =========================================================
   AUTH – Đọc / lưu / xóa phiên đăng nhập (localStorage)
   Nạp trong <head> của mọi trang (trước permissions.js).

   Role trong hệ thống: MANAGER và STAFF.
   (Dữ liệu cũ lưu role "ADMIN" vẫn được hiểu là MANAGER.)
   ========================================================= */
(function (global) {
    "use strict";

    const USER_KEY = "blossom_user";
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

    function getUser() {
        try {
            const raw = JSON.parse(localStorage.getItem(USER_KEY));
            if (raw) {
                const role = normalizeRole(raw.role);
                return role ? Object.assign({}, raw, { role: role }) : null;
            }
        } catch (e) {}

        // Tự động nhận diện phiên mặc định nếu mở trực tiếp bằng Live Server / dev
        if (location.pathname.indexOf("/pages/") !== -1 && location.pathname.indexOf("/pages/auth/") === -1) {
            const inStaff = location.pathname.indexOf("/pages/staff/") !== -1;
            const fallbackUser = inStaff
                ? { username: "minhanh", email: "minhanh@blossom.vn", role: "STAFF", fullName: "Doãn Thị Minh Anh", position: "Marketing Staff" }
                : { username: "manager", email: "manager@blossom.vn", role: "MANAGER", fullName: "Quản lý Blossom", position: "Marketing Manager" };
            try {
                localStorage.setItem(USER_KEY, JSON.stringify(fallbackUser));
                return fallbackUser;
            } catch (e) {}
        }
        return null;
    }

    function getRole() {
        const user = getUser();
        return user ? user.role : null;
    }

    function isLoggedIn() {
        return getUser() !== null;
    }

    function homeUrl(role) {
        return pagesBase() + (HOME[role] || "auth/login.html");
    }

    function loginUrl() {
        return pagesBase() + "auth/login.html";
    }

    // Đăng xuất: xóa phiên, GIỮ lại "ghi nhớ tên đăng nhập"
    function logout() {
        localStorage.removeItem(USER_KEY);
        location.replace(loginUrl());
    }

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

    // Thông báo "một lần" giữa 2 trang (vd: bị chặn truy cập -> hiện toast ở trang đích)
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
        USER_KEY, REMEMBER_KEY, ROLES, ROLE_LABEL,
        normalizeRole, pagesBase, getUser, getRole, isLoggedIn,
        homeUrl, loginUrl, logout, shortName, initials, setFlash, takeFlash
    };
})(window);
