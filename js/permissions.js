/* =========================================================
   PERMISSIONS – Phân quyền truy cập trang giữa Staff và Manager
   Nạp trong <head>, SAU auth.js. Tự chạy guard() ngay khi nạp
   để người không đủ quyền bị chuyển đi trước khi trang kịp hiển thị.
   ========================================================= */
(function (global) {
    "use strict";

    const M = Auth.ROLES.MANAGER;
    const S = Auth.ROLES.STAFF;

    /* ---------- 1. Quy tắc theo thư mục ----------
       pages/admin/* -> CHỈ MANAGER (Admin)
       pages/staff/* -> CHỈ STAFF (Nhân viên)
       pages/auth/*  -> Công khai
    */
    const AREA_ACCESS = {
        auth: "public",
        admin: [M],
        staff: [S]
    };

    /* ---------- 2. Ngoại lệ theo từng trang ----------
       Chỉ chia sẻ trang Tạo/Chỉnh sửa bài viết cho cả Manager và Staff.
       Nhân viên (STAFF) tuyệt đối không được vào bất kỳ trang /pages/admin/* nào.
    */
    const PAGE_ACCESS = {
        "staff/create-post.html": [M, S],
        "staff/edit-post.html":   [M, S]
    };

    /* ---------- 3. Quyền theo chức năng ---------- */
    const FEATURES = {
        "post:create":     [S, M],
        "post:edit":       [S, M],
        "post:delete":     [M],
        "post:approve":    [M],
        "report:view":     [M],
        "account:manage":  [M],
        "settings:manage": [M]
    };

    function pageKey(pathname) {
        const match = (pathname || location.pathname).match(/\/pages\/([^/]+\/[^/?#]+)$/);
        return match ? match[1] : null;
    }

    function ruleFor(key) {
        if (key in PAGE_ACCESS) return PAGE_ACCESS[key];
        const area = key.split("/")[0];
        return area in AREA_ACCESS ? AREA_ACCESS[area] : null;
    }

    function canAccessPage(role, key) {
        const rule = ruleFor(key);
        if (rule === "public") return true;
        return Array.isArray(rule) && rule.indexOf(role) !== -1;
    }

    function can(feature, role) {
        const r = role || Auth.getRole();
        const allowed = FEATURES[feature];
        return !!allowed && allowed.indexOf(r) !== -1;
    }

    function hidePage() {
        document.documentElement.style.visibility = "hidden";
    }

    function guard() {
        const key = pageKey();
        if (key === null) return true;

        if (ruleFor(key) === "public") return true;

        const user = Auth.getUser();

        if (!user) {
            hidePage();
            location.replace(Auth.loginUrl());
            return false;
        }

        if (!canAccessPage(user.role, key)) {
            Auth.setFlash({
                type: "error",
                title: "Không có quyền truy cập",
                message: "Tài khoản nhân viên không được phép truy cập trang quản trị."
            });
            hidePage();
            location.replace(Auth.homeUrl(user.role));
            return false;
        }

        return true;
    }

    function apply(root) {
        const scope = root || document;
        const role = Auth.getRole();

        scope.querySelectorAll("[data-roles]").forEach(function (el) {
            const roles = el.dataset.roles.split(",").map(function (r) { return Auth.normalizeRole(r.trim()); });
            if (roles.indexOf(role) === -1) el.remove();
        });

        scope.querySelectorAll("[data-can]").forEach(function (el) {
            if (!can(el.dataset.can, role)) el.remove();
        });
    }

    global.Permissions = { AREA_ACCESS, PAGE_ACCESS, FEATURES, pageKey, canAccessPage, can, guard, apply };

    guard();

    window.addEventListener("pageshow", function (e) {
        if (e.persisted) guard();
    });
})(window);
