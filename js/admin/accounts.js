/* =========================================================
   ACCOUNTS – Quản lý tài khoản (Manager)
   Dùng cho pages/admin/accounts.html

   Nạp CUỐI <body>, sau account-store.js, components.js, layout.js.
   Phụ thuộc: Auth, Permissions, UI, AccountStore, BlossomAPI (tùy chọn).

   Chức năng:
     1. Danh sách: Họ tên, Email, Vai trò, Trạng thái, Ngày tạo, Thao tác
        (Sửa, Khóa / Mở khóa) + tìm theo tên / email + lọc + phân trang.
     2. Thêm tài khoản: kiểm tra định dạng Email, Email trùng, độ mạnh mật khẩu.
     3. Sửa tài khoản: họ tên, Email (báo lỗi nếu trùng), vai trò, đặt lại mật khẩu (tùy chọn).
     4. Khóa / Mở khóa có hộp thoại xác nhận. Tài khoản bị khóa không đăng nhập được
        (login.js đã chặn qua AccountStore.isLocked).

   Mật khẩu: KHÔNG lưu ở trình duyệt (đúng quy ước của account-store.js).
   Việc MÃ HÓA (băm bcrypt/argon2) mật khẩu trước khi lưu database do server (FastAPI) thực hiện;
   frontend chỉ gửi mật khẩu qua HTTPS. Khi nối backend, thay 3 hàm ở mục 2
   (createAccountRemote / updateAccountRemote / setStatusRemote) bằng BlossomAPI.request(...).
   ========================================================= */
(function () {
    "use strict";

    if (!window.Auth || !window.UI || !window.AccountStore || !document.getElementById("tbody")) return;

    const $ = function (id) { return document.getElementById(id); };
    const esc = UI.esc;

    /* ---------- 1. HẰNG SỐ + TRẠNG THÁI ---------- */
    const PAGE_SIZE = 6;
    const ROLE = {
        MANAGER: { label: "Manager", tone: "pink" },
        STAFF:   { label: "Staff",   tone: "purple" }
    };
    const STATUS = {
        active: { label: "Đang hoạt động", tone: "green" },
        locked: { label: "Đã khóa",        tone: "red" }
    };
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    const state = { q: "", role: "", status: "", page: 1, selectedId: null };
    let accounts = AccountStore.load();

    const listEl = $("tbody");
    const layoutEl = $("layout");
    const detailEl = $("detail");

    /* ---------- 2. "API" (demo) – thay bằng BlossomAPI.request khi có backend ---------- */
    function delay(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

    function fail(message, field) {
        const err = new Error(message);
        if (field) err.field = field;
        return err;
    }

    function today() {
        const d = new Date();
        return d.getFullYear() + "-" + UI.pad(d.getMonth() + 1) + "-" + UI.pad(d.getDate());
    }

    function nextId(list) {
        const max = list.reduce(function (m, a) {
            const n = parseInt(String(a.id).replace(/\D/g, ""), 10);
            return isNaN(n) ? m : Math.max(m, n);
        }, 0);
        return "acc-" + String(max + 1).padStart(3, "0");
    }

    // Email đã tồn tại chưa (không phân biệt hoa/thường), bỏ qua chính tài khoản đang sửa
    function emailTaken(list, email, exceptId) {
        const key = AccountStore.normEmail(email);
        return list.some(function (a) { return a.id !== exceptId && AccountStore.normEmail(a.email) === key; });
    }

    function activeManagersExcept(list, id) {
        return list.filter(function (a) { return a.id !== id && a.role === "MANAGER" && a.status === "active"; }).length;
    }

    // TODO(API): POST /accounts { fullName, email, password, role } – server băm mật khẩu, trả 409 nếu trùng Email.
    function createAccountRemote(data) {
        return delay(500).then(function () {
            const list = AccountStore.load();                       // đọc lại để chặn trùng khi mở nhiều tab
            if (emailTaken(list, data.email)) throw fail("Email này đã được sử dụng.", "email");
            const rec = {
                id: nextId(list), fullName: data.fullName, email: data.email,
                role: data.role, status: "active", createdAt: today()
            };                                                      // KHÔNG lưu mật khẩu ở trình duyệt
            list.push(rec);
            AccountStore.save(list);
            return rec;
        });
    }

    // TODO(API): PATCH /accounts/{id} { fullName, email, role, password? }
    function updateAccountRemote(id, data) {
        return delay(500).then(function () {
            const list = AccountStore.load();
            const rec = list.filter(function (a) { return a.id === id; })[0];
            if (!rec) throw fail("Tài khoản không còn tồn tại.");
            if (emailTaken(list, data.email, id)) throw fail("Email này đã được sử dụng.", "email");
            if (rec.role === "MANAGER" && data.role !== "MANAGER" && rec.status === "active" && !activeManagersExcept(list, id)) {
                throw fail("Hệ thống phải còn ít nhất một Manager đang hoạt động.", "role");
            }
            rec.fullName = data.fullName;
            rec.email = data.email;
            rec.role = data.role;
            AccountStore.save(list);                                // data.password (nếu có) chỉ gửi lên server
            return rec;
        });
    }

    // TODO(API): PATCH /accounts/{id}/status { status: "active" | "locked" }
    function setStatusRemote(id, status) {
        return delay(400).then(function () {
            const list = AccountStore.load();
            const rec = list.filter(function (a) { return a.id === id; })[0];
            if (!rec) throw fail("Tài khoản không còn tồn tại.");
            if (status === "locked" && rec.role === "MANAGER" && rec.status === "active" && !activeManagersExcept(list, id)) {
                throw fail("Không thể khóa Manager đang hoạt động cuối cùng.");
            }
            rec.status = status;
            AccountStore.save(list);
            return rec;
        });
    }

    /* ---------- 3. TIỆN ÍCH ---------- */
    function currentUser() { return Auth.getUser() || {}; }

    function isSelf(acc) {
        const me = currentUser();
        return !!acc && !!me.email && AccountStore.normEmail(acc.email) === AccountStore.normEmail(me.email);
    }

    function findById(id) {
        return accounts.filter(function (a) { return a.id === id; })[0] || null;
    }

    function reload() { accounts = AccountStore.load(); }

    // Bỏ dấu để tìm "minh anh" ra "Minh Anh"
    function fold(s) {
        return String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().trim();
    }

    function formatDate(iso) {
        const p = String(iso || "").split("-");
        return p.length === 3 ? p[2] + "/" + p[1] + "/" + p[0] : String(iso || "—");
    }

    function initials(name) { return Auth.initials({ fullName: name }); }

    function roleBadge(role) { const r = ROLE[role] || ROLE.STAFF; return UI.badge(r.label, r.tone); }
    function statusBadge(status) { const s = STATUS[status] || STATUS.active; return UI.badge(s.label, s.tone); }

    function setBusy(btn, busy, text) {
        if (!btn) return;
        if (busy) {
            btn.dataset.label = btn.innerHTML;
            btn.innerHTML = "<span>" + esc(text || "Đang xử lý...") + "</span>";
            btn.disabled = true;
        } else {
            if (btn.dataset.label) { btn.innerHTML = btn.dataset.label; delete btn.dataset.label; }
            btn.disabled = false;
        }
    }

    function canManage() { return !window.Permissions || Permissions.can("account:manage"); }

    /* ---------- 4. LỌC + HIỂN THỊ DANH SÁCH ---------- */
    function filtered() {
        const q = fold(state.q);
        return accounts.filter(function (a) {
            if (state.role && a.role !== state.role) return false;
            if (state.status && a.status !== state.status) return false;
            if (q && fold(a.fullName).indexOf(q) === -1 && fold(a.email).indexOf(q) === -1) return false;
            return true;
        }).sort(function (a, b) {                                   // mới tạo lên đầu
            return String(b.createdAt).localeCompare(String(a.createdAt)) || String(b.id).localeCompare(String(a.id));
        });
    }

    function renderStats() {
        const total = accounts.length;
        const active = accounts.filter(function (a) { return a.status === "active"; }).length;
        const locked = total - active;
        const managers = accounts.filter(function (a) { return a.role === "MANAGER"; }).length;
        $("stats").innerHTML =
            UI.statCard({ icon: "users",     tone: "pink",   label: "Tổng tài khoản",  value: String(total),    note: managers + " Manager · " + (total - managers) + " Staff" }) +
            UI.statCard({ icon: "userCheck",  tone: "green",  label: "Đang hoạt động",  value: String(active),   note: "Có thể đăng nhập", noteTone: "green" }) +
            UI.statCard({ icon: "lock",       tone: "orange", label: "Đã khóa",         value: String(locked),   note: locked ? "Không thể đăng nhập" : "Không có tài khoản bị khóa" }) +
            UI.statCard({ icon: "shield",     tone: "purple", label: "Manager",         value: String(managers), note: "Toàn quyền quản trị" });
    }

    function actionButtons(a) {
        const self = isSelf(a);
        const locking = a.status === "active";
        const lockLabel = locking ? "Khóa" : "Mở khóa";
        const lockTitle = self ? "Bạn không thể tự khóa tài khoản của mình" : lockLabel + " tài khoản " + a.fullName;
        return '<div class="acc-actions">' +
            '<button type="button" class="btn btn--secondary btn--sm" data-act="edit" data-id="' + esc(a.id) + '" title="Sửa ' + esc(a.fullName) + '" aria-label="Sửa ' + esc(a.fullName) + '">' +
                UI.icon("edit") + "<span>Sửa</span></button>" +
            '<button type="button" class="btn ' + (locking ? "btn--danger-outline" : "btn--secondary") + ' btn--sm" data-act="toggle" data-id="' + esc(a.id) + '" title="' + esc(lockTitle) + '" aria-label="' + esc(lockTitle) + '"' + (self ? " disabled" : "") + ">" +
                UI.icon(locking ? "lock" : "unlock") + "<span>" + lockLabel + "</span></button>" +
            "</div>";
    }

    function renderTable() {
        const rows = filtered();
        const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
        if (state.page > pages) state.page = pages;
        const start = (state.page - 1) * PAGE_SIZE;
        const view = rows.slice(start, start + PAGE_SIZE);

        $("countBadge").textContent = rows.length + " thành viên";

        if (!view.length) {
            const filteredOut = state.q || state.role || state.status;
            listEl.innerHTML = '<tr class="acc-empty"><td colspan="5">' +
                UI.emptyState({ icon: "search", text: filteredOut ? "Không tìm thấy tài khoản phù hợp." : "Chưa có tài khoản nào." }) +
                "</td></tr>";
        } else {
            listEl.innerHTML = view.map(function (a) {
                const cls = (a.id === state.selectedId ? "is-selected " : "") + (a.status === "locked" ? "is-locked" : "");
                return '<tr data-id="' + esc(a.id) + '" class="' + cls.trim() + '" tabindex="0">' +
                    '<td><div class="acc-user"><span class="avatar avatar--sm">' + esc(initials(a.fullName)) + "</span>" +
                        "<div><b>" + esc(a.fullName) + "</b><small>" + esc(a.email) + "</small></div></div></td>" +
                    "<td>" + roleBadge(a.role) + "</td>" +
                    "<td>" + statusBadge(a.status) + "</td>" +
                    '<td class="acc-date">' + esc(formatDate(a.createdAt)) + "</td>" +
                    "<td>" + actionButtons(a) + "</td></tr>";
            }).join("");
        }

        $("rangeText").textContent = rows.length
            ? "Hiển thị " + (start + 1) + "–" + (start + view.length) + " trên " + rows.length + " tài khoản"
            : "Không có tài khoản nào";
        renderPager(pages);
    }

    function renderPager(pages) {
        const pager = $("pager");
        if (pages <= 1) { pager.innerHTML = ""; return; }
        const cur = state.page;
        let html = '<button type="button" data-page="' + (cur - 1) + '" aria-label="Trang trước"' + (cur === 1 ? " disabled" : "") + ">‹</button>";
        let last = 0;
        for (let p = 1; p <= pages; p++) {
            if (p === 1 || p === pages || Math.abs(p - cur) <= 1) {
                if (last && p - last > 1) html += '<button type="button" disabled aria-hidden="true">…</button>';
                html += '<button type="button" data-page="' + p + '"' + (p === cur ? ' class="active" aria-current="page"' : "") + ">" + p + "</button>";
                last = p;
            }
        }
        html += '<button type="button" data-page="' + (cur + 1) + '" aria-label="Trang sau"' + (cur === pages ? " disabled" : "") + ">›</button>";
        pager.innerHTML = html;
    }

    function renderDetail() {
        const a = findById(state.selectedId);
        if (!a) {
            state.selectedId = null;
            detailEl.hidden = true;
            detailEl.innerHTML = "";
            layoutEl.classList.remove("has-detail");
            return;
        }
        const self = isSelf(a);
        const locking = a.status === "active";
        detailEl.hidden = false;
        layoutEl.classList.add("has-detail");
        detailEl.innerHTML =
            '<div class="card__head"><h3 class="card__title">Chi tiết tài khoản</h3>' +
                '<button type="button" class="icon-btn" data-act="close-detail" aria-label="Đóng chi tiết">' + UI.icon("close") + "</button></div>" +
            '<div class="acc-detail__who"><span class="avatar avatar--lg">' + esc(initials(a.fullName)) + "</span>" +
                "<div><b>" + esc(a.fullName) + "</b><small>" + esc(a.email) + "</small></div></div>" +
            '<dl class="kv">' +
                "<dt>Vai trò</dt><dd>" + roleBadge(a.role) + "</dd>" +
                "<dt>Trạng thái</dt><dd>" + statusBadge(a.status) + "</dd>" +
                "<dt>Ngày tạo</dt><dd>" + esc(formatDate(a.createdAt)) + "</dd>" +
                "<dt>Mã tài khoản</dt><dd>" + esc(a.id) + "</dd>" +
            "</dl>" +
            '<p class="acc-detail__note">' +
                (a.status === "locked"
                    ? "Tài khoản đang bị khóa và không thể đăng nhập. Mở khóa để nhân viên đăng nhập lại."
                    : (self ? "Đây là tài khoản của bạn nên không thể tự khóa." : "Khóa tài khoản sẽ chặn đăng nhập cho đến khi được mở khóa.")) +
            "</p>" +
            '<div class="acc-detail__actions">' +
                '<button type="button" class="btn btn--primary" data-act="edit" data-id="' + esc(a.id) + '">' + UI.icon("edit") + "<span>Sửa tài khoản</span></button>" +
                '<button type="button" class="btn ' + (locking ? "btn--danger-outline" : "btn--secondary") + '" data-act="toggle" data-id="' + esc(a.id) + '"' + (self ? " disabled" : "") + ">" +
                    UI.icon(locking ? "lock" : "unlock") + "<span>" + (locking ? "Khóa tài khoản" : "Mở khóa tài khoản") + "</span></button>" +
            "</div>";
    }

    function renderAll() {
        renderStats();
        renderTable();
        renderDetail();
    }

    /* ---------- 5. FORM TRONG MODAL ---------- */
    const ICON_EYE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
    const ICON_EYE_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3l18 18"/><path d="M10.6 6.1A10 10 0 0112 5c6.5 0 10 7 10 7a17 17 0 01-3.2 4.1M6.6 6.6A17 17 0 002 12s3.5 7 10 7a9.7 9.7 0 004.4-1"/><path d="M9.9 9.9a3 3 0 004.2 4.2"/></svg>';
    const METER_TEXT = ["Chưa nhập", "Yếu", "Trung bình", "Khá", "Mạnh"];

    function rulesOf(pwd) {
        if (window.BlossomAPI && BlossomAPI.validatePasswordComplexity) return BlossomAPI.validatePasswordComplexity(pwd);
        const rules = {
            minLength: pwd.length >= 8, hasUpper: /[A-Z]/.test(pwd),
            hasLower: /[a-z]/.test(pwd), hasDigit: /[0-9]/.test(pwd)
        };
        const valid = rules.minLength && rules.hasUpper && rules.hasLower && rules.hasDigit;
        return { valid: valid, rules: rules, message: valid ? "" : "Mật khẩu cần tối thiểu 8 ký tự, gồm chữ hoa, chữ thường và số." };
    }

    function strengthLevel(pwd) {
        if (!pwd) return 0;
        const r = rulesOf(pwd);
        const met = Object.keys(r.rules).filter(function (k) { return r.rules[k]; }).length;
        if (!r.valid) return met >= 3 ? 2 : 1;
        return (pwd.length >= 12 || /[^A-Za-z0-9]/.test(pwd)) ? 4 : 3;
    }

    function fieldHtml(name, label, control, o) {
        o = o || {};
        return '<div class="field" id="af-fld-' + name + '">' +
            '<label class="field__label" for="af-' + name + '">' + esc(label) + (o.required ? ' <span class="req">*</span>' : "") + "</label>" +
            control +
            (o.hint ? '<p class="field__hint">' + esc(o.hint) + "</p>" : "") +
            '<p class="field__error" id="af-err-' + name + '" role="alert"></p></div>';
    }

    function passwordControl(name, autocomplete) {
        return '<div class="af-pass"><input class="input" id="af-' + name + '" type="password" autocomplete="' + autocomplete + '" aria-describedby="af-err-' + name + '">' +
            '<button type="button" class="af-eye" data-eye="af-' + name + '" aria-label="Hiện mật khẩu">' + ICON_EYE_OFF + "</button></div>";
    }

    function passwordBlock(newLabel) {
        return fieldHtml("password", newLabel, passwordControl("password", "new-password") +
            '<div class="af-meter" id="af-meter" data-level="0" aria-live="polite"><div class="af-meter__bars"><i></i><i></i><i></i><i></i></div>' +
            '<span class="af-meter__text" id="af-meter-text">Chưa nhập</span></div>',
            { required: true, hint: "Tối thiểu 8 ký tự, gồm chữ hoa, chữ thường và số." }) +
            fieldHtml("confirm", "Xác nhận mật khẩu", passwordControl("confirm", "new-password"), { required: true });
    }

    function roleSelect(value, disabled) {
        return '<select class="select" id="af-role"' + (disabled ? " disabled" : "") + ">" +
            ["STAFF", "MANAGER"].map(function (r) {
                return '<option value="' + r + '"' + (r === value ? " selected" : "") + ">" + ROLE[r].label + "</option>";
            }).join("") + "</select>";
    }

    // Modal dạng form: giữ mở khi dữ liệu sai; chỉ đóng khi submit thành công hoặc bấm Hủy / X / Esc
    function openFormModal(o) {
        const previous = document.activeElement;
        const backdrop = document.createElement("div");
        backdrop.className = "modal-backdrop";
        backdrop.innerHTML =
            '<div class="modal modal--form" role="dialog" aria-modal="true" aria-labelledby="afTitle">' +
            '<div class="modal__head"><h3 class="modal__title" id="afTitle">' + esc(o.title) + "</h3>" +
                '<button type="button" class="modal__close" data-close aria-label="Đóng">' + UI.icon("close") + "</button></div>" +
            '<div class="modal__body"><form id="afForm" class="form-grid" novalidate>' + o.body + "</form></div>" +
            '<div class="modal__foot"><button type="button" class="btn btn--secondary" data-close>Hủy</button>' +
                '<button type="submit" form="afForm" class="btn btn--primary" id="afSubmit">' + esc(o.submitLabel) + "</button></div></div>";

        const form = backdrop.querySelector("#afForm");
        const submitBtn = backdrop.querySelector("#afSubmit");
        let busy = false;

        function close() {
            document.removeEventListener("keydown", onKey, true);
            backdrop.remove();
            document.body.classList.remove("modal-open");
            if (previous && previous.focus) previous.focus();
        }

        function onKey(e) {
            if (e.key === "Escape") { e.stopPropagation(); if (!busy) close(); return; }
            if (e.key !== "Tab") return;
            const items = Array.prototype.filter.call(
                backdrop.querySelectorAll("button, a[href], input, select, textarea"),
                function (el) { return !el.disabled && el.offsetParent !== null; });
            if (!items.length) return;
            const first = items[0], lastEl = items[items.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastEl.focus(); }
            else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); first.focus(); }
        }

        backdrop.addEventListener("click", function (e) {
            if (e.target.closest("[data-close]") && !busy) { close(); return; }
            const eye = e.target.closest(".af-eye");
            if (eye) {
                const input = backdrop.querySelector("#" + eye.dataset.eye);
                const show = input.type === "password";
                input.type = show ? "text" : "password";
                eye.innerHTML = show ? ICON_EYE : ICON_EYE_OFF;
                eye.setAttribute("aria-label", show ? "Ẩn mật khẩu" : "Hiện mật khẩu");
            }
        });

        form.addEventListener("input", function (e) {
            const name = (e.target.id || "").replace(/^af-/, "");
            setFieldError(backdrop, name, "");
            if (name === "password") updateMeter(backdrop);
            if (name === "password") setFieldError(backdrop, "confirm", "");
        });

        form.addEventListener("submit", function (e) {
            e.preventDefault();
            if (busy) return;
            const values = o.read(backdrop);
            const errors = o.validate(values);
            const keys = Object.keys(errors);
            keys.forEach(function (k) { setFieldError(backdrop, k, errors[k]); });
            if (keys.length) {
                const first = backdrop.querySelector(".field.is-error .input, .field.is-error .select");
                if (first) first.focus();
                return;
            }
            busy = true;
            setBusy(submitBtn, true, o.busyText);
            o.submit(values).then(function (result) {
                busy = false;
                close();
                o.done(result, values);
            }).catch(function (err) {
                busy = false;
                setBusy(submitBtn, false);
                if (err.field && backdrop.querySelector("#af-fld-" + err.field)) {
                    setFieldError(backdrop, err.field, err.message);
                    const f = backdrop.querySelector("#af-" + err.field);
                    if (f && f.focus) f.focus();
                } else {
                    UI.toast("error", o.errorTitle, err.message);
                }
            });
        });

        document.addEventListener("keydown", onKey, true);
        document.body.classList.add("modal-open");
        document.body.appendChild(backdrop);
        if (o.init) o.init(backdrop);
        const firstInput = backdrop.querySelector(".input:not([disabled])");
        if (firstInput) firstInput.focus();
    }

    function setFieldError(root, name, message) {
        const wrap = root.querySelector("#af-fld-" + name);
        const msg = root.querySelector("#af-err-" + name);
        if (wrap) wrap.classList.toggle("is-error", !!message);
        if (msg) msg.textContent = message || "";
    }

    function updateMeter(root) {
        const input = root.querySelector("#af-password");
        const meter = root.querySelector("#af-meter");
        if (!input || !meter) return;
        const level = strengthLevel(input.value);
        meter.dataset.level = String(level);
        root.querySelector("#af-meter-text").textContent = METER_TEXT[level];
    }

    function val(root, name) {
        const el = root.querySelector("#af-" + name);
        return el ? el.value : "";
    }

    function readCommon(root) {
        return {
            fullName: val(root, "fullName").trim().replace(/\s+/g, " "),
            email: val(root, "email").trim(),
            role: val(root, "role")
        };
    }

    function validateCommon(v, exceptId) {
        const errors = {};
        if (!v.fullName) errors.fullName = "Vui lòng nhập họ tên.";
        else if (v.fullName.length < 2) errors.fullName = "Họ tên phải có ít nhất 2 ký tự.";
        else if (v.fullName.length > 80) errors.fullName = "Họ tên tối đa 80 ký tự.";

        if (!v.email) errors.email = "Vui lòng nhập email.";
        else if (v.email.length > 120 || !EMAIL_RE.test(v.email)) errors.email = "Email không đúng định dạng (ví dụ: ten@blossom.vn).";
        else if (emailTaken(AccountStore.load(), v.email, exceptId)) errors.email = "Email này đã được sử dụng.";

        if (!ROLE[v.role]) errors.role = "Vui lòng chọn vai trò.";
        return errors;
    }

    function validatePasswordPair(v, errors) {
        if (!v.password) errors.password = "Vui lòng nhập mật khẩu.";
        else if (v.password.length > 64) errors.password = "Mật khẩu tối đa 64 ký tự.";
        else if (!rulesOf(v.password).valid) errors.password = rulesOf(v.password).message;

        if (!v.confirm) errors.confirm = "Vui lòng xác nhận mật khẩu.";
        else if (v.password && v.confirm !== v.password) errors.confirm = "Mật khẩu xác nhận không khớp.";
    }

    /* ---------- 5a. THÊM TÀI KHOẢN ---------- */
    function openAddModal() {
        if (!canManage()) return;
        openFormModal({
            title: "Thêm tài khoản",
            submitLabel: "Thêm tài khoản",
            busyText: "Đang thêm...",
            errorTitle: "Không thể thêm tài khoản",
            body:
                fieldHtml("fullName", "Họ tên", '<input class="input" id="af-fullName" type="text" autocomplete="off" maxlength="80" placeholder="Nguyễn Văn A">', { required: true }) +
                fieldHtml("email", "Email", '<input class="input" id="af-email" type="email" autocomplete="off" maxlength="120" placeholder="ten@blossom.vn">', { required: true }) +
                fieldHtml("role", "Vai trò", roleSelect("STAFF", false), { required: true, hint: "Staff: tạo & chỉnh sửa bài viết. Manager: toàn quyền quản trị." }) +
                passwordBlock("Mật khẩu"),
            read: function (root) {
                const v = readCommon(root);
                v.password = val(root, "password");
                v.confirm = val(root, "confirm");
                return v;
            },
            validate: function (v) {
                const errors = validateCommon(v, null);
                validatePasswordPair(v, errors);
                return errors;
            },
            submit: function (v) { return createAccountRemote(v); },
            done: function (rec) {
                state.q = ""; state.role = ""; state.status = "";
                $("q").value = ""; $("roleFilter").value = ""; $("statusFilter").value = "";
                state.page = 1;
                state.selectedId = rec.id;
                reload();
                renderAll();
                UI.toast("success", "Đã thêm tài khoản", rec.fullName + " (" + ROLE[rec.role].label + ") đã được tạo.");
            }
        });
    }

    /* ---------- 5b. SỬA TÀI KHOẢN ---------- */
    function openEditModal(id) {
        if (!canManage()) return;
        const acc = findById(id);
        if (!acc) { UI.toast("error", "Không tìm thấy tài khoản", "Tài khoản có thể đã bị xóa."); reload(); renderAll(); return; }
        const self = isSelf(acc);
        const oldEmailKey = AccountStore.normEmail(acc.email);

        openFormModal({
            title: "Sửa tài khoản",
            submitLabel: "Lưu thay đổi",
            busyText: "Đang lưu...",
            errorTitle: "Không thể lưu thay đổi",
            body:
                fieldHtml("fullName", "Họ tên", '<input class="input" id="af-fullName" type="text" autocomplete="off" maxlength="80" value="' + esc(acc.fullName) + '">', { required: true }) +
                fieldHtml("email", "Email", '<input class="input" id="af-email" type="email" autocomplete="off" maxlength="120" value="' + esc(acc.email) + '">', { required: true }) +
                fieldHtml("role", "Vai trò", roleSelect(acc.role, self), {
                    required: true,
                    hint: self ? "Bạn không thể tự thay đổi vai trò của chính mình." : "Thay đổi vai trò sẽ cập nhật quyền truy cập của tài khoản."
                }) +
                '<label class="af-check"><input type="checkbox" id="af-changePwd"><span>Đặt lại mật khẩu cho tài khoản này</span></label>' +
                '<div class="af-pwd-box" id="af-pwdBox" hidden>' + passwordBlock("Mật khẩu mới") + "</div>",
            init: function (root) {
                const chk = root.querySelector("#af-changePwd");
                const box = root.querySelector("#af-pwdBox");
                chk.addEventListener("change", function () {
                    box.hidden = !chk.checked;
                    if (!chk.checked) {
                        ["password", "confirm"].forEach(function (n) { root.querySelector("#af-" + n).value = ""; setFieldError(root, n, ""); });
                        updateMeter(root);
                    } else {
                        root.querySelector("#af-password").focus();
                    }
                });
            },
            read: function (root) {
                const v = readCommon(root);
                if (self) v.role = acc.role;                        // select bị vô hiệu hóa -> giữ nguyên
                v.changePwd = root.querySelector("#af-changePwd").checked;
                if (v.changePwd) { v.password = val(root, "password"); v.confirm = val(root, "confirm"); }
                return v;
            },
            validate: function (v) {
                const errors = validateCommon(v, acc.id);
                if (!errors.role && acc.role === "MANAGER" && v.role !== "MANAGER" && acc.status === "active" &&
                    !activeManagersExcept(AccountStore.load(), acc.id)) {
                    errors.role = "Hệ thống phải còn ít nhất một Manager đang hoạt động.";
                }
                if (v.changePwd) validatePasswordPair(v, errors);
                return errors;
            },
            submit: function (v) { return updateAccountRemote(acc.id, v); },
            done: function (rec, v) {
                if (self) syncSession(rec, oldEmailKey);
                reload();
                state.selectedId = rec.id;
                renderAll();
                UI.toast("success", "Đã cập nhật tài khoản", v.changePwd ? "Thông tin và mật khẩu mới đã được lưu." : "Thông tin của " + rec.fullName + " đã được lưu.");
            }
        });
    }

    // Sửa chính mình: cập nhật phiên đăng nhập + header để không lệch dữ liệu
    function syncSession(rec) {
        let raw = {};
        try { raw = JSON.parse(localStorage.getItem(Auth.USER_KEY)) || {}; } catch (e) { /* bỏ qua */ }
        raw.fullName = rec.fullName;
        raw.email = rec.email;
        try { localStorage.setItem(Auth.USER_KEY, JSON.stringify(raw)); } catch (e) { /* bỏ qua */ }

        const u = Auth.getUser() || raw;
        const short = document.querySelector("#topbar .user-info b");
        const full = document.querySelector("#topbar .menu .who b");
        const avatar = document.querySelector("#topbar .avatar");
        if (short) short.textContent = Auth.shortName(u);
        if (full) full.textContent = u.fullName || u.username;
        if (avatar && !avatar.querySelector("img")) avatar.textContent = Auth.initials(u);
    }

    /* ---------- 6. KHÓA / MỞ KHÓA ---------- */
    function toggleLock(id) {
        if (!canManage()) return;
        const acc = findById(id);
        if (!acc) { UI.toast("error", "Không tìm thấy tài khoản", "Tài khoản có thể đã bị xóa."); reload(); renderAll(); return; }

        const locking = acc.status === "active";
        if (locking && isSelf(acc)) {
            UI.toast("error", "Không thể khóa", "Bạn không thể tự khóa tài khoản của chính mình.");
            return;
        }
        if (locking && acc.role === "MANAGER" && !activeManagersExcept(accounts, acc.id)) {
            UI.toast("error", "Không thể khóa", "Không thể khóa Manager đang hoạt động cuối cùng.");
            return;
        }

        UI.confirm(locking ? {
            title: "Khóa tài khoản?",
            message: "Tài khoản " + acc.fullName + " (" + acc.email + ") sẽ không thể đăng nhập cho đến khi bạn mở khóa.",
            confirmText: "Khóa tài khoản",
            cancelText: "Hủy",
            tone: "danger"
        } : {
            title: "Mở khóa tài khoản?",
            message: "Tài khoản " + acc.fullName + " (" + acc.email + ") sẽ có thể đăng nhập lại.",
            confirmText: "Mở khóa",
            cancelText: "Hủy"
        }).then(function (ok) {
            if (!ok) return;
            return setStatusRemote(acc.id, locking ? "locked" : "active").then(function (rec) {
                reload();
                renderAll();
                UI.toast("success", locking ? "Đã khóa tài khoản" : "Đã mở khóa tài khoản",
                    locking ? rec.fullName + " không thể đăng nhập nữa." : rec.fullName + " có thể đăng nhập lại.");
            }).catch(function (err) {
                reload();
                renderAll();
                UI.toast("error", locking ? "Không thể khóa tài khoản" : "Không thể mở khóa tài khoản", err.message);
            });
        });
    }

    /* ---------- 7. SỰ KIỆN ---------- */
    function onActionClick(e) {
        const btn = e.target.closest("[data-act]");
        if (!btn || btn.disabled) return false;
        e.stopPropagation();
        const act = btn.dataset.act;
        if (act === "edit") openEditModal(btn.dataset.id);
        else if (act === "toggle") toggleLock(btn.dataset.id);
        else if (act === "close-detail") { state.selectedId = null; renderTable(); renderDetail(); }
        return true;
    }

    function selectRow(id) {
        state.selectedId = id;
        renderTable();
        renderDetail();
    }

    listEl.addEventListener("click", function (e) {
        if (onActionClick(e)) return;
        const row = e.target.closest("tr[data-id]");
        if (row) selectRow(row.dataset.id);
    });

    listEl.addEventListener("keydown", function (e) {
        if ((e.key === "Enter" || e.key === " ") && e.target.matches("tr[data-id]")) {
            e.preventDefault();
            selectRow(e.target.dataset.id);
        }
    });

    detailEl.addEventListener("click", onActionClick);

    $("pager").addEventListener("click", function (e) {
        const b = e.target.closest("button[data-page]");
        if (!b || b.disabled) return;
        state.page = Number(b.dataset.page);
        renderTable();
    });

    let searchTimer = null;
    $("q").addEventListener("input", function (e) {
        const value = e.target.value;
        clearTimeout(searchTimer);
        searchTimer = setTimeout(function () { state.q = value; state.page = 1; renderTable(); }, 150);
    });
    $("roleFilter").addEventListener("change", function (e) { state.role = e.target.value; state.page = 1; renderTable(); });
    $("statusFilter").addEventListener("change", function (e) { state.status = e.target.value; state.page = 1; renderTable(); });

    const addBtn = $("addBtn");                                      // Permissions.apply() có thể đã gỡ nút này
    if (addBtn) addBtn.addEventListener("click", openAddModal);

    // Đồng bộ khi tab khác thay đổi dữ liệu (khóa / mở khóa / thêm...)
    window.addEventListener("storage", function (e) {
        if (e.key === AccountStore.KEY) { reload(); renderAll(); }
    });

    /* ---------- 8. KHỞI TẠO ---------- */
    renderAll();
    UI.renderIcons();
})();
