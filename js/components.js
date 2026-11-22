/* =========================================================
   COMPONENTS – Hàm dựng component theo Design System (window.UI)
   CSS tương ứng nằm ở css/components.css.

   Cách dùng:
     el.innerHTML = UI.statCard({ icon: 'doc', label: 'Bài viết', value: '08' });
     UI.toast('success', 'Đã lưu', 'Bài viết đã được cập nhật');
     if (await UI.confirm({ title: 'Xóa bài viết?', message: '...', tone: 'danger' })) { ... }

   Mọi hàm trả về chuỗi HTML đã escape dữ liệu người dùng.
   ========================================================= */
(function (global) {
    "use strict";

    /* ---------- Tiện ích ---------- */
    const ESC_MAP = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    const esc = function (s) {
        return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return ESC_MAP[c]; });
    };
    const pad = function (n) { return String(n).padStart(2, "0"); };

    /* ---------- Icon ---------- */
    const ICONS = {
        home:         '<path d="M3 11l9-8 9 8M5 10v10h14V10"/>',
        grid:         '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
        doc:          '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h4"/>',
        edit:         '<path d="M12 20h9M16 4l4 4L8 20H4v-4z"/>',
        editSquare:   '<path d="M11 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-6"/><path d="m18 3 3 3-9 9H9v-3z"/>',
        plus:         '<path d="M12 5v14M5 12h14"/>',
        cal:          '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
        check:        '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
        clipboard:    '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="m9 13 2 2 4-4M9 4h6v2H9z"/>',
        tick:         '<path d="m5 12 5 5 9-10"/>',
        chart:        '<path d="M5 20v-6M11 20V6M17 20v-9M3 20h18"/>',
        bell:         '<path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10 20a2 2 0 0 0 4 0"/>',
        user:         '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
        users:        '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M16 4a4 4 0 0 1 0 8M22 21a7 7 0 0 0-4-6"/>',
        cog:          '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/><circle cx="12" cy="12" r="7.5"/>',
        search:       '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
        clock:        '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
        alert:        '<circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16h.01"/>',
        key:          '<circle cx="8" cy="15" r="4"/><path d="m11 12 8-8M16 7l3 3"/>',
        logout:       '<path d="M9 4H5v16h4M16 8l4 4-4 4M20 12H9"/>',
        menu:         '<path d="M4 6h16M4 12h16M4 18h16"/>',
        help:         '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01"/>',
        chev:         '<path d="m6 9 6 6 6-6"/>',
        spark:        '<path d="M12 2c.6 5 2.5 7.4 8 8-5.5.6-7.4 3-8 12-.6-9-2.5-11.4-8-12 5.5-.6 7.4-3 8-8z"/>',
        close:        '<path d="M6 6l12 12M18 6L6 18"/>',
        empty:        '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 10h8M8 14h5"/>',
        lock:         '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
        unlock:       '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 7.5-2"/>',
        shield:       '<path d="M12 3l8 3v6c0 4.5-3.2 7.8-8 9-4.8-1.2-8-4.5-8-9V6z"/><path d="m9 12 2 2 4-4"/>',
        userCheck:    '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M16 11l2 2 4-4"/>'
    };

    function icon(name, extraClass) {
        return '<svg class="ico' + (extraClass ? " " + extraClass : "") + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || "") + "</svg>";
    }

    // Hỗ trợ cú pháp <i data-icon="bell"></i> viết thẳng trong HTML
    function renderIcons(root) {
        (root || document).querySelectorAll("i[data-icon]:not([data-done])").forEach(function (el) {
            el.innerHTML = icon(el.dataset.icon);
            el.dataset.done = "1";
        });
    }

    /* ---------- Button ----------
       UI.button({ label, variant: primary|secondary|ghost|danger, size: sm|lg,
                   icon, href, type, id, block, disabled, attrs }) */
    function button(o) {
        o = o || {};
        const cls = ["btn", "btn--" + (o.variant || "primary")];
        if (o.size) cls.push("btn--" + o.size);
        if (o.block) cls.push("btn--block");
        const inner = (o.icon ? icon(o.icon) : "") + (o.label ? "<span>" + esc(o.label) + "</span>" : "");
        const common = ' class="' + cls.join(" ") + '"' + (o.id ? ' id="' + esc(o.id) + '"' : "") + (o.attrs ? " " + o.attrs : "");

        if (o.href) {
            return "<a" + common + ' href="' + esc(o.href) + '"' + (o.disabled ? ' aria-disabled="true"' : "") + ">" + inner + "</a>";
        }
        return "<button" + common + ' type="' + (o.type || "button") + '"' + (o.disabled ? " disabled" : "") + ">" + inner + "</button>";
    }

    /* ---------- Badge / Status ---------- */
    function badge(text, tone) {
        return '<span class="badge badge--' + esc(tone || "gray") + '">' + esc(text) + "</span>";
    }

    // Trạng thái bài viết: dùng chung cho Staff và Manager
    const POST_STATUS = {
        draft:  { label: "Bản nháp",       tone: "purple" },
        review: { label: "Chờ duyệt",      tone: "orange" },
        edit:   { label: "Cần chỉnh sửa",  tone: "pink" },
        ready:  { label: "Sẵn sàng đăng",  tone: "green" },
        done:   { label: "Đã xuất bản",    tone: "green" }
    };

    function statusBadge(status) {
        const s = POST_STATUS[status];
        return s ? badge(s.label, s.tone) : badge(status);
    }

    /* ---------- Stat card ----------
       UI.statCard({ icon, tone: pink|orange|purple|green, label, value, note, noteTone: green|pink }) */
    function statCard(o) {
        return '<div class="stat-card">' +
            '<div class="stat-card__icon tone-' + esc(o.tone || "pink") + '">' + icon(o.icon || "doc") + "</div>" +
            "<div>" +
            '<small class="stat-card__label">' + esc(o.label) + "</small>" +
            '<strong class="stat-card__value">' + esc(o.value) + "</strong>" +
            (o.note != null ? '<p class="stat-card__note' + (o.noteTone ? " stat-card__note--" + esc(o.noteTone) : "") + '">' + esc(o.note) + "</p>" : "") +
            "</div></div>";
    }

    /* ---------- Card ----------
       UI.card({ title, subtitle, action: '<html>', body: '<html>', className, id }) */
    function card(o) {
        const head = (o.title || o.action)
            ? '<div class="card__head"><div>' +
              (o.title ? '<h3 class="card__title">' + esc(o.title) + "</h3>" : "") +
              (o.subtitle ? '<p class="card__sub">' + esc(o.subtitle) + "</p>" : "") +
              "</div>" + (o.action || "") + "</div>"
            : "";
        return '<section class="card' + (o.className ? " " + esc(o.className) : "") + '"' + (o.id ? ' id="' + esc(o.id) + '"' : "") + ">" + head + (o.body || "") + "</section>";
    }

    /* ---------- Empty state ---------- */
    function emptyState(o) {
        o = o || {};
        return '<div class="empty-state">' + icon(o.icon || "empty") + "<span>" + esc(o.text || "Chưa có dữ liệu") + "</span></div>";
    }

    /* ---------- Progress ---------- */
    function progress(percent) {
        const p = Math.max(0, Math.min(100, Number(percent) || 0));
        return '<div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + p + '"><div class="progress__fill" style="width:' + p + '%"></div></div>';
    }

    /* ---------- Tabs ----------
       HTML:  <div class="tabs"><button class="tab active">A</button><button class="tab">B</button></div>
       Tự bật/tắt .active; phát sự kiện "tabchange" (detail.index) trên .tabs. */
    document.addEventListener("click", function (e) {
        const tab = e.target.closest(".tabs .tab");
        if (!tab) return;
        const tabs = tab.closest(".tabs");
        const list = Array.prototype.slice.call(tabs.querySelectorAll(".tab"));
        list.forEach(function (t) { t.classList.remove("active"); });
        tab.classList.add("active");
        tabs.dispatchEvent(new CustomEvent("tabchange", { bubbles: true, detail: { index: list.indexOf(tab), tab: tab } }));
    });

    /* ---------- Toast ---------- */
    let toastStack = null;

    function toast(type, title, message, duration) {
        if (!toastStack) {
            toastStack = document.createElement("div");
            toastStack.className = "toast-stack";
            toastStack.setAttribute("role", "status");
            toastStack.setAttribute("aria-live", "polite");
            document.body.appendChild(toastStack);
        }
        const symbol = { success: "✓", error: "!", warning: "!" }[type] || "i";
        const el = document.createElement("div");
        el.className = "toast toast--" + (type || "info");
        el.innerHTML = '<span class="toast__icon">' + symbol + '</span><div class="toast__body"><strong>' + esc(title) + "</strong>" + (message ? "<span>" + esc(message) + "</span>" : "") + "</div>";
        toastStack.appendChild(el);
        setTimeout(function () { el.remove(); }, duration || 3000);
        return el;
    }

    /* ---------- Modal ----------
       UI.modal({ title, body: '<html>', size: 'lg', actions: [{ label, variant, value }] })
       -> Promise resolve với value của nút được bấm (null nếu đóng bằng Esc / nền / dấu X). */
    function modal(o) {
        o = o || {};
        const actions = o.actions || [{ label: "Đóng", variant: "secondary", value: true }];

        return new Promise(function (resolve) {
            const previous = document.activeElement;
            const backdrop = document.createElement("div");
            backdrop.className = "modal-backdrop";
            backdrop.innerHTML =
                '<div class="modal' + (o.size ? " modal--" + esc(o.size) : "") + '" role="dialog" aria-modal="true" aria-labelledby="modalTitle">' +
                '<div class="modal__head"><h3 class="modal__title" id="modalTitle">' + esc(o.title) + "</h3>" +
                '<button type="button" class="modal__close" data-close aria-label="Đóng">' + icon("close") + "</button></div>" +
                '<div class="modal__body">' + (o.body || "") + "</div>" +
                '<div class="modal__foot">' +
                actions.map(function (a, i) { return button({ label: a.label, variant: a.variant || "secondary", attrs: 'data-action="' + i + '"' }); }).join("") +
                "</div></div>";

            function close(value) {
                document.removeEventListener("keydown", onKey, true);
                document.body.classList.remove("modal-open");
                if (previous && previous.focus) previous.focus();
                resolve(value);
                try { backdrop.remove(); } catch (_) {}
            }

            function onKey(e) {
                if (e.key === "Escape") { e.stopPropagation(); close(null); return; }
                if (e.key !== "Tab") return;
                const items = backdrop.querySelectorAll("button, a[href], input, select, textarea");
                if (!items.length) return;
                const first = items[0], last = items[items.length - 1];
                if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
                else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
            }

            backdrop.addEventListener("mousedown", function (e) { if (e.target === backdrop) close(null); });
            backdrop.addEventListener("click", function (e) {
                if (e.target.closest("[data-close]")) return close(null);
                const btn = e.target.closest("[data-action]");
                if (btn) {
                    const actIndex = Number(btn.dataset.action);
                    const act = actions[actIndex];
                    if (act && typeof act.onClick === "function") {
                        const canClose = act.onClick(backdrop, close);
                        if (canClose === false) return;
                    }
                    close(act ? act.value : null);
                }
            });

            document.addEventListener("keydown", onKey, true);
            document.body.classList.add("modal-open");
            document.body.appendChild(backdrop);

            // Focus nút cuối (hành động chính)
            const btns = backdrop.querySelectorAll(".modal__foot .btn");
            (btns[btns.length - 1] || backdrop.querySelector(".modal")).focus();
        });
    }

    /* UI.confirm({ title, message, confirmText, cancelText, tone: 'danger' }) -> Promise<boolean> */
    function confirmDialog(o) {
        o = o || {};
        return modal({
            title: o.title || "Xác nhận",
            body: "<p>" + esc(o.message || "") + "</p>",
            actions: [
                { label: o.cancelText || "Hủy", variant: "secondary", value: false },
                { label: o.confirmText || "Đồng ý", variant: o.tone === "danger" ? "danger" : "primary", value: true }
            ]
        }).then(function (v) { return v === true; });
    }

    global.UI = {
        esc, pad, icon, renderIcons, button, badge, POST_STATUS, statusBadge,
        statCard, card, emptyState, progress, toast, modal, confirm: confirmDialog
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", function () { renderIcons(); });
    } else {
        renderIcons();
    }
})(window);
