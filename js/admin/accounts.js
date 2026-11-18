/* =========================================================
   MANAGER – Trang Tài khoản & Phân quyền (logic riêng của trang)
   Sidebar / Header / đăng xuất: js/layout.js
   Component: js/components.js (UI.*)
   Dữ liệu:   js/account-store.js (AccountStore) – demo localStorage

   Chức năng:
   1. Danh sách (tìm kiếm, lọc vai trò / trạng thái, phân trang)
   2. Thêm tài khoản
   3. Sửa tài khoản (họ tên, email, vai trò, mật khẩu tùy chọn)
   4. Khóa / Mở khóa tài khoản
   ========================================================= */
(function () {
    "use strict";

    const ROLES = Auth.ROLES;
    const ROLE_LABEL = Auth.ROLE_LABEL;
    const esc = UI.esc;
    const icon = UI.icon;
    const pad = UI.pad;

    const PAGE_SIZE = 6;
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const ROLE_INFO = {
        MANAGER: "Quản lý bài viết, lịch đăng, duyệt nội dung, xem báo cáo và quản lý tài khoản.",
        STAFF: "Tạo, chỉnh sửa bài viết và gửi duyệt. Không có quyền quản lý tài khoản."
    };

    let me = Auth.getUser();
    let accounts = AccountStore.load();
    const state = { q: "", role: "", status: "", page: 1, selectedId: null };

    const $ = function (id) { return document.getElementById(id); };

    /* =========================================================
       TIỆN ÍCH
       ========================================================= */
    // Bỏ dấu để tìm "minh anh" ra "Minh Anh"
    function fold(s) {
        return String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();
    }

    function fmtDate(iso) {
        const p = String(iso || "").split("-");
        return p.length === 3 ? p[2] + "/" + p[1] + "/" + p[0] : "—";
    }

    function todayISO() {
        const t = new Date();
        return t.getFullYear() + "-" + pad(t.getMonth() + 1) + "-" + pad(t.getDate());
    }

    function find(id) {
        return accounts.find(function (a) { return a.id === id; });
    }

    function isSelf(acc) {
        return !!me && AccountStore.normEmail(acc.email) === AccountStore.normEmail(me.email);
    }

    function otherActiveManagers(id) {
        return accounts.filter(function (a) {
            return a.id !== id && a.role === ROLES.MANAGER && a.status === "active";
        }).length;
    }

    function persist() {
        AccountStore.save(accounts);
    }

    function roleBadge(role) {
        return UI.badge(ROLE_LABEL[role] || role, role === ROLES.MANAGER ? "pink" : "purple");
    }

    function statusBadge(status) {
        return status === "locked" ? UI.badge("Đã khóa", "red") : UI.badge("Đang hoạt động", "green");
    }

    function avatar(acc, cls) {
        return '<span class="avatar ' + cls + '">' + esc(Auth.initials({ fullName: acc.fullName })) + "</span>";
    }

    // Nút Khóa / Mở khóa dùng chung cho bảng và panel chi tiết
    function toggleButton(acc, extra) {
        const locked = acc.status === "locked";
        return '<button type="button" class="btn btn--sm ' + (locked ? "btn--secondary" : "btn--danger-outline") + (extra || "") + '" data-act="toggle" data-id="' + esc(acc.id) + '" title="' + (locked ? "Mở khóa" : "Khóa") + '" aria-label="' + (locked ? "Mở khóa " : "Khóa ") + esc(acc.fullName) + '">' +
            icon(locked ? "unlock" : "lock") + "<span>" + (locked ? "Mở khóa" : "Khóa") + "</span></button>";
    }

    /* =========================================================
       RENDER
       ========================================================= */
    function filtered() {
        const q = fold(state.q.trim());
        return accounts.filter(function (a) {
            if (state.role && a.role !== state.role) return false;
            if (state.status && a.status !== state.status) return false;
            if (!q) return true;
            return fold(a.fullName).indexOf(q) !== -1 || fold(a.email).indexOf(q) !== -1;
        });
    }

    function renderStats() {
        const active = accounts.filter(function (a) { return a.status === "active"; }).length;
        const locked = accounts.length - active;
        const stats = [
            { icon: "users",     tone: "pink", label: "Tổng tài khoản",   value: pad(accounts.length), note: "Thành viên trong đội ngũ" },
            { icon: "userCheck", tone: "pink", label: "Đang hoạt động",   value: pad(active),          note: "Sẵn sàng truy cập hệ thống", noteTone: "green" },
            { icon: "lock",      tone: "pink", label: "Đã khóa",          value: pad(locked),          note: "Tạm ngừng quyền truy cập",   noteTone: locked ? "pink" : "" },
            { icon: "shield",    tone: "pink", label: "Nhóm vai trò",     value: pad(Object.keys(ROLES).length), note: "Manager & Staff" }
        ];
        $("stats").innerHTML = stats.map(UI.statCard).join("");
    }

    function renderTable() {
        const list = filtered();
        const total = list.length;
        const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
        state.page = Math.min(state.page, pages);

        const start = (state.page - 1) * PAGE_SIZE;
        const rows = list.slice(start, start + PAGE_SIZE);

        $("countBadge").textContent = accounts.length + " thành viên";

        $("tbody").innerHTML = rows.length
            ? rows.map(function (a) {
                const locked = a.status === "locked";
                return '<tr data-id="' + esc(a.id) + '" tabindex="0" class="' + (a.id === state.selectedId ? "is-selected " : "") + (locked ? "is-locked" : "") + '">' +
                    '<td><div class="acc-user">' + avatar(a, "avatar--sm") +
                    "<div><b>" + esc(a.fullName) + "</b><small>" + esc(a.email) + "</small></div></div></td>" +
                    "<td>" + roleBadge(a.role) + "</td>" +
                    "<td>" + statusBadge(a.status) + "</td>" +
                    '<td class="acc-date">' + fmtDate(a.createdAt) + "</td>" +
                    '<td><div class="acc-actions">' +
                    '<button type="button" class="btn btn--secondary btn--sm" data-act="edit" data-id="' + esc(a.id) + '" title="Sửa" aria-label="Sửa ' + esc(a.fullName) + '">' + icon("edit") + "<span>Sửa</span></button>" +
                    toggleButton(a) +
                    "</div></td></tr>";
            }).join("")
            : '<tr class="acc-empty"><td colspan="5">' + UI.emptyState({
                text: accounts.length
                    ? "Không tìm thấy tài khoản phù hợp với bộ lọc."
                    : 'Chưa có tài khoản người dùng nào. Nhấn "+ Thêm tài khoản" ở trên để tạo thành viên mới.'
            }) + "</td></tr>";

        $("rangeText").textContent = total
            ? "Hiển thị " + (start + 1) + "–" + (start + rows.length) + " trên " + total + " tài khoản"
            : "Không có tài khoản nào";

        renderPager(pages);
    }

    function renderPager(pages) {
        const pager = $("pager");
        if (pages <= 1) { pager.innerHTML = ""; return; }

        let html = '<button type="button" data-page="' + (state.page - 1) + '" aria-label="Trang trước"' + (state.page === 1 ? " disabled" : "") + ">‹</button>";
        for (let i = 1; i <= pages; i++) {
            html += '<button type="button" data-page="' + i + '"' + (i === state.page ? ' class="active" aria-current="page"' : "") + ">" + i + "</button>";
        }
        html += '<button type="button" data-page="' + (state.page + 1) + '" aria-label="Trang sau"' + (state.page === pages ? " disabled" : "") + ">›</button>";
        pager.innerHTML = html;
    }

    function renderDetail() {
        const panel = $("detail");
        const acc = state.selectedId && find(state.selectedId);

        if (!acc) {
            state.selectedId = null;
            panel.hidden = true;
            $("layout").classList.remove("has-detail");
            return;
        }

        $("layout").classList.add("has-detail");
        panel.hidden = false;
        panel.innerHTML =
            '<div class="card__head"><h3 class="card__title">Chi tiết tài khoản</h3>' +
            '<button type="button" class="icon-btn" data-act="close" aria-label="Đóng">' + icon("close") + "</button></div>" +
            '<div class="acc-detail__who">' + avatar(acc, "avatar--lg") +
            "<div><b>" + esc(acc.fullName) + "</b><small>" + esc(acc.email) + "</small></div></div>" +
            '<dl class="kv">' +
            "<dt>Vai trò</dt><dd>" + roleBadge(acc.role) + "</dd>" +
            "<dt>Trạng thái</dt><dd>" + statusBadge(acc.status) + "</dd>" +
            "<dt>Ngày tạo</dt><dd>" + fmtDate(acc.createdAt) + "</dd></dl>" +
            '<p class="acc-detail__note">' + esc(ROLE_INFO[acc.role] || "") + "</p>" +
            '<div class="acc-detail__actions">' +
            '<button type="button" class="btn btn--primary btn--block" data-act="edit" data-id="' + esc(acc.id) + '">' + icon("edit") + "<span>Sửa tài khoản</span></button>" +
            toggleButton(acc, " btn--block") +
            "</div>";
    }

    function renderAll() {
        renderStats();
        renderTable();
        renderDetail();
    }

    /* =========================================================
       FORM (thêm / sửa) – modal có kiểm tra dữ liệu
       Dùng lại class .modal của components.css; UI.modal không chặn được
       nút bấm khi dữ liệu sai nên form được dựng riêng ở đây.
       ========================================================= */
    function field(o) {
        return '<div class="field" data-field="' + o.name + '">' +
            '<label class="field__label" for="f-' + o.name + '">' + esc(o.label) + "</label>" +
            '<input class="input" id="f-' + o.name + '" name="' + o.name + '" type="' + (o.type || "text") + '"' +
            ' value="' + esc(o.value || "") + '" placeholder="' + esc(o.placeholder || "") + '" autocomplete="' + (o.autocomplete || "off") + '">' +
            (o.hint ? '<span class="field__hint">' + esc(o.hint) + "</span>" : "") +
            '<span class="field__error" role="alert"></span></div>';
    }

    function formModal(o) {
        const v = o.values || {};
        const editing = o.mode === "edit";

        return new Promise(function (resolve) {
            const previous = document.activeElement;
            const backdrop = document.createElement("div");
            backdrop.className = "modal-backdrop";
            backdrop.innerHTML =
                '<form class="modal modal--form" role="dialog" aria-modal="true" aria-labelledby="formTitle" novalidate>' +
                '<div class="modal__head"><h3 class="modal__title" id="formTitle">' + esc(o.title) + "</h3>" +
                '<button type="button" class="modal__close" data-close aria-label="Đóng">' + icon("close") + "</button></div>" +
                '<div class="modal__body"><div class="form-grid">' +
                field({ name: "fullName", label: "Họ và tên", value: v.fullName, placeholder: "Ví dụ: Nguyễn Thu Hà", autocomplete: "name" }) +
                field({ name: "email", label: "Email", type: "email", value: v.email, placeholder: "ten@blossom.vn", autocomplete: "off" }) +
                '<div class="form-row">' +
                field({ name: "password", label: editing ? "Mật khẩu mới" : "Mật khẩu", type: "password", placeholder: editing ? "Để trống nếu không đổi" : "Tối thiểu 8 ký tự", autocomplete: "new-password" }) +
                field({ name: "confirm", label: "Nhập lại mật khẩu", type: "password", placeholder: "Nhập lại mật khẩu", autocomplete: "new-password" }) +
                "</div>" +
                '<div class="field" data-field="role"><label class="field__label" for="f-role">Vai trò</label>' +
                '<select class="select" id="f-role" name="role"' + (o.lockRole ? " disabled" : "") + ">" +
                Object.keys(ROLES).map(function (k) {
                    return '<option value="' + k + '"' + (v.role === k ? " selected" : "") + ">" + ROLE_LABEL[k] + "</option>";
                }).join("") + "</select>" +
                '<span class="field__hint" id="roleHint"></span>' +
                '<span class="field__error" role="alert"></span></div>' +
                "</div></div>" +
                '<div class="modal__foot">' +
                '<button type="button" class="btn btn--secondary" data-close>Hủy</button>' +
                '<button type="submit" class="btn btn--primary">' + esc(o.submitText) + "</button></div></form>";

            const form = backdrop.querySelector("form");

            function close(value) {
                document.removeEventListener("keydown", onKey, true);
                backdrop.remove();
                document.body.classList.remove("modal-open");
                if (previous && previous.focus) previous.focus();
                resolve(value);
            }

            function onKey(e) {
                if (e.key === "Escape") { e.stopPropagation(); close(null); return; }
                if (e.key !== "Tab") return;
                const items = form.querySelectorAll("button, input, select");
                const list = Array.prototype.filter.call(items, function (el) { return !el.disabled; });
                const first = list[0], last = list[list.length - 1];
                if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
                else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
            }

            function setError(name, message) {
                const wrap = form.querySelector('[data-field="' + name + '"]');
                wrap.classList.toggle("is-error", !!message);
                wrap.querySelector(".field__error").textContent = message || "";
            }

            function updateRoleHint() {
                const hint = o.lockRole
                    ? "Bạn không thể tự đổi vai trò của chính mình."
                    : ROLE_INFO[form.elements.role.value];
                $("roleHint").textContent = hint;
            }

            form.addEventListener("input", function (e) {
                const wrap = e.target.closest("[data-field]");
                if (wrap) setError(wrap.dataset.field, "");
            });
            form.elements.role.addEventListener("change", updateRoleHint);

            form.addEventListener("submit", function (e) {
                e.preventDefault();
                const values = {
                    fullName: form.elements.fullName.value.trim(),
                    email: form.elements.email.value.trim(),
                    password: form.elements.password.value,
                    confirm: form.elements.confirm.value,
                    role: form.elements.role.value
                };
                const errors = o.validate(values);
                const names = Object.keys(errors);

                ["fullName", "email", "password", "confirm", "role"].forEach(function (n) { setError(n, errors[n]); });

                if (names.length) {
                    const target = form.elements[["fullName", "email", "password", "confirm", "role"].filter(function (n) { return errors[n]; })[0]];
                    if (target) target.focus();
                    return;
                }
                close(values);
            });

            backdrop.addEventListener("mousedown", function (e) { if (e.target === backdrop) close(null); });
            backdrop.addEventListener("click", function (e) { if (e.target.closest("[data-close]")) close(null); });

            document.addEventListener("keydown", onKey, true);
            document.body.classList.add("modal-open");
            document.body.appendChild(backdrop);
            updateRoleHint();
            form.elements.fullName.focus();
        });
    }

    // Kiểm tra dữ liệu form. acc = null khi thêm mới.
    function validate(v, acc) {
        const e = {};

        if (!v.fullName) e.fullName = "Vui lòng nhập họ và tên.";
        else if (v.fullName.length < 2) e.fullName = "Họ và tên quá ngắn.";

        if (!v.email) e.email = "Vui lòng nhập email.";
        else if (!EMAIL_RE.test(v.email)) e.email = "Email không đúng định dạng.";
        else if (accounts.some(function (a) {
            return (!acc || a.id !== acc.id) && AccountStore.normEmail(a.email) === AccountStore.normEmail(v.email);
        })) e.email = "Email này đã được sử dụng.";

        const needPassword = !acc || v.password || v.confirm;   // khi sửa: bỏ trống = giữ mật khẩu cũ
        if (needPassword) {
            if (!v.password) e.password = "Vui lòng nhập mật khẩu.";
            else if (v.password.length < 8 || !/[A-Za-z]/.test(v.password) || !/\d/.test(v.password)) {
                e.password = "Tối thiểu 8 ký tự, gồm cả chữ và số.";
            }
            if (!v.confirm) e.confirm = "Vui lòng nhập lại mật khẩu.";
            else if (v.password !== v.confirm) e.confirm = "Mật khẩu nhập lại không khớp.";
        }

        if (!ROLES[v.role]) e.role = "Vui lòng chọn vai trò.";
        else if (acc && acc.role === ROLES.MANAGER && acc.status === "active" && v.role !== ROLES.MANAGER && !otherActiveManagers(acc.id)) {
            e.role = "Hệ thống cần ít nhất một Manager đang hoạt động.";
        }

        return e;
    }

    /* =========================================================
       HÀNH ĐỘNG
       ========================================================= */
    async function addAccount() {
        const v = await formModal({
            mode: "add",
            title: "Thêm tài khoản",
            submitText: "Tạo tài khoản",
            values: { role: ROLES.STAFF },
            validate: function (values) { return validate(values, null); }
        });
        if (!v) return;

        // TODO(API): gửi v.password lên server để băm – không lưu mật khẩu ở trình duyệt.
        const acc = {
            id: "acc-" + Date.now().toString(36),
            fullName: v.fullName,
            email: v.email,
            role: v.role,
            status: "active",
            createdAt: todayISO()
        };
        accounts.unshift(acc);
        persist();

        state.page = 1;
        state.selectedId = acc.id;
        renderAll();
        UI.toast("success", "Đã thêm tài khoản", acc.fullName + " (" + ROLE_LABEL[acc.role] + ")");
    }

    async function editAccount(id) {
        const acc = find(id);
        if (!acc) return;
        const self = isSelf(acc);

        const v = await formModal({
            mode: "edit",
            title: "Sửa tài khoản",
            submitText: "Lưu thay đổi",
            lockRole: self,
            values: { fullName: acc.fullName, email: acc.email, role: acc.role },
            validate: function (values) { return validate(values, acc); }
        });
        if (!v) return;

        acc.fullName = v.fullName;
        acc.email = v.email;
        if (!self) acc.role = v.role;
        // TODO(API): nếu v.password có giá trị thì gửi lên server để đổi mật khẩu.
        persist();

        if (self) syncCurrentUser(acc);

        state.selectedId = acc.id;
        renderAll();
        UI.toast("success", "Đã cập nhật tài khoản", v.password ? "Thông tin và mật khẩu đã được lưu." : "Thông tin đã được lưu.");
    }

    // Manager tự sửa tên/email của mình: cập nhật phiên đăng nhập để khớp
    function syncCurrentUser(acc) {
        try {
            const raw = JSON.parse(localStorage.getItem(Auth.USER_KEY));
            if (raw) {
                raw.fullName = acc.fullName;
                raw.email = acc.email;
                localStorage.setItem(Auth.USER_KEY, JSON.stringify(raw));
            }
        } catch (e) { /* bỏ qua */ }
        me = Auth.getUser();
    }

    async function toggleAccount(id) {
        const acc = find(id);
        if (!acc) return;

        // Mở khóa: chuyển về Đang hoạt động, đăng nhập lại được
        if (acc.status === "locked") {
            acc.status = "active";
            persist();
            renderAll();
            UI.toast("success", "Đã mở khóa", acc.fullName + " có thể đăng nhập lại.");
            return;
        }

        // Khóa
        if (isSelf(acc)) {
            UI.toast("warning", "Không thể khóa", "Bạn không thể khóa tài khoản đang đăng nhập.");
            return;
        }
        if (acc.role === ROLES.MANAGER && !otherActiveManagers(acc.id)) {
            UI.toast("warning", "Không thể khóa", "Hệ thống cần ít nhất một Manager đang hoạt động.");
            return;
        }

        const ok = await UI.confirm({
            title: "Khóa tài khoản?",
            message: 'Tài khoản "' + acc.fullName + '" sẽ chuyển sang trạng thái Đã khóa và không thể đăng nhập cho đến khi được mở khóa.',
            confirmText: "Khóa tài khoản",
            cancelText: "Hủy",
            tone: "danger"
        });
        if (!ok) return;

        acc.status = "locked";
        persist();
        renderAll();
        UI.toast("success", "Đã khóa tài khoản", acc.fullName + " không thể đăng nhập.");
    }

    /* =========================================================
       SỰ KIỆN
       ========================================================= */
    function select(id) {
        state.selectedId = id;
        renderTable();
        renderDetail();
    }

    function handleAction(btn) {
        const act = btn.dataset.act;
        if (act === "edit") editAccount(btn.dataset.id);
        else if (act === "toggle") toggleAccount(btn.dataset.id);
        else if (act === "close") select(null);
    }

    $("tbody").addEventListener("click", function (e) {
        const btn = e.target.closest("button[data-act]");
        if (btn) { handleAction(btn); return; }
        const row = e.target.closest("tr[data-id]");
        if (row) select(row.dataset.id);
    });

    $("tbody").addEventListener("keydown", function (e) {
        if (e.key !== "Enter" || e.target.closest("button")) return;
        const row = e.target.closest("tr[data-id]");
        if (row) select(row.dataset.id);
    });

    $("detail").addEventListener("click", function (e) {
        const btn = e.target.closest("button[data-act]");
        if (btn) handleAction(btn);
    });

    $("pager").addEventListener("click", function (e) {
        const btn = e.target.closest("button[data-page]");
        if (!btn || btn.disabled) return;
        state.page = Number(btn.dataset.page);
        renderTable();
    });

    $("q").addEventListener("input", function (e) { state.q = e.target.value; state.page = 1; renderTable(); });
    $("roleFilter").addEventListener("change", function (e) { state.role = e.target.value; state.page = 1; renderTable(); });
    $("statusFilter").addEventListener("change", function (e) { state.status = e.target.value; state.page = 1; renderTable(); });

    const addBtn = $("addBtn");
    if (addBtn) addBtn.addEventListener("click", addAccount);

    renderAll();
})();
