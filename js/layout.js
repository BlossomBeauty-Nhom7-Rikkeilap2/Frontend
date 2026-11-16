/* =========================================================
   LAYOUT – Render Sidebar + Header + Footer dùng chung cho mọi trang
   Nạp ở CUỐI <body>, sau auth.js, permissions.js, components.js.

   Trang chỉ cần có các điểm gắn:
     <aside class="sidebar" id="sidebar"></aside>
     <div class="main">
         <header class="topbar" id="topbar"></header>
         <main class="content"> ... </main>
         <footer class="footer" id="footer"></footer>
     </div>
   Tùy chọn trên <body>:
     data-search="Tìm kiếm bài viết..."   placeholder ô tìm kiếm
     data-active="posts.html"             ép mục sidebar đang chọn (trang con)
   ========================================================= */
(function (global) {
    "use strict";

    const ROLES = Auth.ROLES;
    const esc = UI.esc;
    const icon = UI.icon;

    /* ---------- Cấu hình menu theo role ----------
       href là đường dẫn so với thư mục chứa trang (admin/ hoặc staff/).
       Mục nào Role hiện tại không được phép truy cập (Permissions) sẽ tự bị ẩn. */
    const NAV = {
        MANAGER: {
            area: "admin",
            label: "Không gian quản trị",
            quote: "Chăm chút từng điều nhỏ.",
            items: [
                { icon: "grid",       name: "Tổng quan",              href: "dashboard.html" },
                { icon: "editSquare", name: "Bài viết",               href: "posts.html" },
                { icon: "cal",        name: "Lịch đăng bài",          href: "calendar.html" },
                { icon: "clipboard",  name: "Duyệt bài",              href: "approvals.html" },
                { icon: "chart",      name: "Báo cáo & Thống kê",     href: "reports.html" },
                { icon: "bell",       name: "Thông báo",              href: "notifications.html" },
                { icon: "users",      name: "Tài khoản & Phân quyền", href: "accounts.html" },
                { icon: "cog",        name: "Cài đặt",                href: "settings.html" }
            ],
            profileHref: "settings.html",
            passwordHref: "settings.html"
        },
        STAFF: {
            area: "staff",
            label: "Không gian nhân viên",
            quote: "Mỗi bài viết là một câu chuyện.",
            items: [
                { icon: "home", name: "Tổng quan",        href: "dashboard.html" },
                { icon: "doc",  name: "Bài viết của tôi", href: "posts.html" },
                { icon: "cal",  name: "Lịch đăng bài",    href: "calendar.html" },
                { icon: "bell", name: "Thông báo",        href: "notifications.html" },
                { icon: "user", name: "Hồ sơ cá nhân",    href: "profile.html" }
            ],
            profileHref: "profile.html",
            passwordHref: "profile.html#change-password"
        }
    };

    function currentFile() {
        return location.pathname.split("/").pop() || "dashboard.html";
    }

    /* ---------- Render từng vùng ---------- */
    function sidebarHTML(cfg, role) {
        const active = document.body.dataset.active || currentFile();

        const items = cfg.items
            .filter(function (it) { return Permissions.canAccessPage(role, cfg.area + "/" + it.href); })
            .map(function (it) {
                return '<li><a href="' + esc(it.href) + '"' + (it.href === active ? ' class="active" aria-current="page"' : "") + ">" +
                    icon(it.icon) + "<span>" + esc(it.name) + "</span></a></li>";
            }).join("");

        return '<div class="logo"><h1>Blossom.</h1><span>BEAUTY STORE</span></div>' +
            '<div class="side-label">' + esc(cfg.label) + "</div>" +
            '<ul class="nav" id="nav">' + items + "</ul>" +
            '<div class="side-bottom"><div class="quote">' + esc(cfg.quote) + "</div>" +
            '<button type="button" class="help" id="helpBtn">' + icon("help") + "Bạn cần hỗ trợ?</button></div>";
    }

    function topbarHTML(cfg, user) {
        const placeholder = document.body.dataset.search || "Tìm kiếm...";
        const position = user.position || Auth.ROLE_LABEL[user.role];

        return '<button type="button" class="menu-btn" id="menuBtn" aria-label="Mở menu">' + icon("menu") + "</button>" +
            '<label class="search">' + icon("search") +
            '<input type="text" id="searchInput" placeholder="' + esc(placeholder) + '" autocomplete="off"><kbd>Ctrl K</kbd></label>' +
            '<div class="top-right">' +
            '<a href="notifications.html" class="bell" aria-label="Thông báo">' + icon("bell") + '<span class="dot" id="notifDot" hidden></span></a>' +
            '<button type="button" class="user" id="userBtn" aria-haspopup="true" aria-expanded="false">' +
            '<span class="avatar">' + esc(Auth.initials(user)) + "</span>" +
            '<span class="user-info"><b>' + esc(Auth.shortName(user)) + "</b><small>" + esc(position) + "</small></span>" +
            '<span class="chev">' + icon("chev") + "</span></button>" +
            '<div class="menu" id="menu" role="menu">' +
            '<div class="who"><b>' + esc(user.fullName || user.username) + "</b>" +
            "<span>" + esc(user.email || "") + "</span>" +
            "<em>" + esc(position) + " · " + Auth.ROLE_LABEL[user.role] + "</em></div>" +
            '<a class="item" role="menuitem" href="' + esc(cfg.profileHref) + '">' + icon("user") + "Hồ sơ cá nhân</a>" +
            '<a class="item" role="menuitem" href="' + esc(cfg.passwordHref) + '">' + icon("key") + "Đổi mật khẩu</a>" +
            "<hr>" +
            '<button type="button" class="item logout" id="logout" role="menuitem">' + icon("logout") + "Đăng xuất</button>" +
            "</div></div>";
    }

    function footerHTML() {
        return "<span>© 2026 Blossom Beauty Store. Đẹp từ những điều nhỏ.</span>" +
            "<span>Phiên bản 1.0 · Trung tâm trợ giúp</span>";
    }

    /* ---------- Hành vi ---------- */
    function bindBehavior() {
        const userBtn = document.getElementById("userBtn");
        const menu = document.getElementById("menu");
        const overlay = document.getElementById("overlay");

        function closeMenu() {
            menu.classList.remove("open");
            userBtn.setAttribute("aria-expanded", "false");
        }

        userBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            userBtn.setAttribute("aria-expanded", String(menu.classList.toggle("open")));
        });

        document.addEventListener("click", function (e) {
            if (!menu.contains(e.target) && !userBtn.contains(e.target)) closeMenu();
        });

        // Sidebar trên màn hình nhỏ
        document.getElementById("menuBtn").addEventListener("click", function () {
            document.body.classList.toggle("sb-open");
        });
        overlay.addEventListener("click", function () { document.body.classList.remove("sb-open"); });
        document.getElementById("nav").addEventListener("click", function () { document.body.classList.remove("sb-open"); });

        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape") {
                closeMenu();
                document.body.classList.remove("sb-open");
            }
            // Ctrl/⌘ + K -> focus ô tìm kiếm
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                document.getElementById("searchInput").focus();
            }
        });

        document.getElementById("logout").addEventListener("click", function () {
            closeMenu();
            UI.confirm({
                title: "Đăng xuất",
                message: "Bạn có chắc muốn đăng xuất khỏi Blossom Beauty Store?",
                confirmText: "Đăng xuất",
                cancelText: "Ở lại"
            }).then(function (ok) { if (ok) Auth.logout(); });
        });

        document.getElementById("helpBtn").addEventListener("click", function () {
            UI.modal({
                title: "Bạn cần hỗ trợ?",
                body: "<p>Vui lòng liên hệ quản trị viên của Blossom Beauty Store để được hỗ trợ.</p>",
                actions: [{ label: "Đã hiểu", variant: "primary", value: true }]
            });
        });
    }

    /* Hiện/ẩn chấm đỏ trên chuông thông báo: Layout.setUnread(3) */
    function setUnread(count) {
        const dot = document.getElementById("notifDot");
        if (dot) dot.hidden = !(Number(count) > 0);
    }

    function mount() {
        const user = Auth.getUser();
        const sidebar = document.getElementById("sidebar");
        if (!user || !sidebar) return;                  // guard() đã xử lý trường hợp chưa đăng nhập

        const cfg = NAV[user.role];

        if (!document.getElementById("overlay")) {
            const overlay = document.createElement("div");
            overlay.className = "overlay";
            overlay.id = "overlay";
            document.body.prepend(overlay);
        }

        sidebar.innerHTML = sidebarHTML(cfg, user.role);
        document.getElementById("topbar").innerHTML = topbarHTML(cfg, user);
        const footer = document.getElementById("footer");
        if (footer) footer.innerHTML = footerHTML();

        bindBehavior();
        Permissions.apply();

        // Thông báo một lần (vd: vừa bị chặn truy cập trang khác)
        const flash = Auth.takeFlash();
        if (flash) UI.toast(flash.type, flash.title, flash.message, 4000);
    }

    global.Layout = { NAV, mount, setUnread };

    mount();
})(window);
