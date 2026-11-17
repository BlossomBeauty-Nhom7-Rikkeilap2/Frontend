/* =========================================================
   ROUTE GUARD – Chặn người chưa đăng nhập và kiểm tra quyền
   truy cập trang theo URL.
   Nạp trong <head>, SAU auth.js, session.js và permissions.js.

   Quy tắc phân quyền theo thư mục (pages/admin, pages/staff,
   pages/auth) và các ngoại lệ PAGE_ACCESS được khai báo ở
   permissions.js – file này dùng lại đúng các quy tắc đó, nên chỉ
   cần chỉnh quyền ở MỘT nơi.

   Kết quả kiểm tra:
   - Trang công khai (pages/auth/*)    -> cho qua.
   - Chưa đăng nhập / phiên đã bị xóa  -> về trang login.
   - Sai quyền (vd: Staff vào admin/*) -> về dashboard của role mình
                                          + toast báo lỗi.

   Ngoài lúc nạp trang, guard còn kiểm tra lại khi:
   - Trang được khôi phục từ bộ nhớ đệm (nút Back sau khi đăng xuất).
   - Tab khác đăng xuất / đăng nhập bằng role khác (sự kiện storage).
   - Tab được mở lại sau khi bị ẩn.

   LƯU Ý: đây là kiểm tra phía giao diện (UX). Khi nối backend,
   API vẫn phải tự kiểm tra role/JWT ở server.
   ========================================================= */
(function (global) {
    "use strict";

    let redirecting = false;

    function hidePage() {
        document.documentElement.style.visibility = "hidden";
    }

    function go(url) {
        if (redirecting) return;
        redirecting = true;
        hidePage();
        location.replace(url);
    }

    // Trang hiện tại có công khai không? (role = null chỉ qua được trang public)
    function isPublic(key) {
        return Permissions.canAccessPage(null, key);
    }

    // URL hiện tại: "/Frontend-main/pages/admin/posts.html" -> "admin/posts.html"
    function currentKey() {
        return Permissions.pageKey(location.pathname);
    }

    function check() {
        if (redirecting) return false;

        if (!global.Permissions) {
            console.error("[RouteGuard] Cần nạp permissions.js trước route-guard.js.");
            return true;
        }

        const key = currentKey();
        if (key === null) return true;              // không nằm trong /pages/ (vd: index.html)
        if (isPublic(key)) return true;             // trang công khai

        const user = Auth.getUser();

        if (!user) {                                // chưa đăng nhập
            go(Auth.loginUrl());
            return false;
        }

        if (!Permissions.canAccessPage(user.role, key)) {   // sai quyền
            Auth.setFlash({
                type: "error",
                title: "Không có quyền truy cập",
                message: "Tài khoản " + Auth.ROLE_LABEL[user.role] + " không được phép vào trang này."
            });
            go(Auth.homeUrl(user.role));
            return false;
        }

        return true;
    }

    global.RouteGuard = { check, currentKey };

    check();

    // Nút Back sau khi đăng xuất: trang lấy từ bộ nhớ đệm -> kiểm tra lại
    window.addEventListener("pageshow", function (e) {
        if (e.persisted) check();
    });

    // Tab khác đăng xuất / đổi tài khoản -> tab này kiểm tra lại ngay
    window.addEventListener("storage", function (e) {
        if (e.key === null || e.key === Auth.USER_KEY) check();
    });

    document.addEventListener("visibilitychange", function () {
        if (document.visibilityState === "visible") check();
    });
})(window);