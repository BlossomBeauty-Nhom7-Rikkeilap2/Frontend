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

        // Không còn tự động đăng nhập: chưa có phiên => trang bảo vệ sẽ chuyển về trang đăng nhập
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
    async function logout() {
        if (global.BlossomAPI && typeof global.BlossomAPI.logout === "function") {
            try { await global.BlossomAPI.logout(); } catch (e) {}
        }
        localStorage.removeItem(USER_KEY);
        try { localStorage.removeItem("blossom_access_token"); } catch (e) {}
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

    // Chuẩn hóa chuỗi để tra cứu ảnh đại diện đồng bộ theo username, email hoặc họ tên
    function normAvatarKey(s) {
        return String(s == null ? "" : s)
            .toLowerCase()
            .replace(/đ/g, "d")
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, " ")
            .trim();
    }

    function avatarKeysFor(target) {
        const keys = [];
        const add = function (k) { if (k && keys.indexOf(k) === -1) keys.push(k); };
        if (!target) return keys;
        if (typeof target === "string") {
            const raw = target.trim().toLowerCase();
            if (raw) {
                add("blossom_avatar_" + raw);
                if (raw.indexOf("@") !== -1) {
                    add("blossom_avatar_email_" + raw);
                    add("blossom_avatar_" + raw.split("@")[0]);
                }
            }
            const nm = normAvatarKey(target);
            if (nm) add("blossom_avatar_name_" + nm);
            return keys;
        }
        const uname = String(target.username || "").trim().toLowerCase();
        const email = String(target.email || "").trim().toLowerCase();
        const emailPrefix = email && email.indexOf("@") !== -1 ? email.split("@")[0] : "";
        const fullName = normAvatarKey(target.fullName || target.name || "");
        if (uname) add("blossom_avatar_" + uname);
        if (emailPrefix) add("blossom_avatar_" + emailPrefix);
        if (email) add("blossom_avatar_email_" + email);
        if (fullName) add("blossom_avatar_name_" + fullName);
        return keys;
    }

    function getAvatarFor(target) {
        const keys = avatarKeysFor(target);
        for (let i = 0; i < keys.length; i++) {
            try {
                const v = localStorage.getItem(keys[i]);
                if (v) return v;
            } catch (e) { /* bỏ qua */ }
        }
        return "";
    }

    function setAvatarFor(user, dataUrl) {
        const keys = avatarKeysFor(user);
        keys.forEach(function (k) {
            try {
                if (dataUrl) localStorage.setItem(k, dataUrl);
                else localStorage.removeItem(k);
            } catch (e) { /* bỏ qua */ }
        });
        try { global.dispatchEvent(new Event("blossom_avatar_updated")); } catch (e) { /* bỏ qua */ }
    }

    function avatarHtml(target, fallbackName) {
        const src = getAvatarFor(target);
        if (src) {
            const safeSrc = String(src).replace(/"/g, "&quot;");
            return '<img src="' + safeSrc + '" alt="" style="width:100%;height:100%;border-radius:50%;object-fit:cover;display:block">';
        }
        const obj = (typeof target === "string") ? { fullName: fallbackName || target } : (target || { fullName: fallbackName || "" });
        return initials(obj);
    }

    global.Auth = {
        USER_KEY, REMEMBER_KEY, ROLES, ROLE_LABEL,
        normalizeRole, pagesBase, getUser, getRole, isLoggedIn,
        homeUrl, loginUrl, logout, shortName, initials, setFlash, takeFlash,
        getAvatarFor, setAvatarFor, avatarHtml
    };
})(window);
