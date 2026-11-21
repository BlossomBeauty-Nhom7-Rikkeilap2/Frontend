/* =========================================================
   ACCOUNT – Hồ sơ cá nhân, Đổi mật khẩu, Cài đặt hệ thống
   Dùng cho pages/admin/settings.html (Manager) và
   pages/staff/profile.html (Staff).

   Nạp CUỐI <body>, sau components.js, layout.js và account-store.js.
   Phụ thuộc: Auth, Permissions, UI, BlossomAPI (api.js), AccountStore (tùy chọn).

   Dữ liệu demo lưu ở localStorage (cùng cách login.js / auth.js đang làm):
     blossom_user                 phiên đăng nhập (cập nhật fullName để header đổi theo)
     blossom_profile_<username>   phone, dob, bio
     blossom_pwd_changed_<username>  thời điểm đổi mật khẩu gần nhất (KHÔNG lưu mật khẩu)
     blossom_settings             cài đặt hệ thống (Manager)
     blossom_accounts             kho tài khoản (js/account-store.js) – họ tên được đồng bộ vào đây

   Mật khẩu: theo quy ước của account-store.js, KHÔNG lưu mật khẩu / hash ở trình duyệt.
   Ở chế độ demo, mật khẩu hiện tại được đối chiếu với mật khẩu demo của login.js;
   khi có backend, server băm và kiểm tra.

   Khi nối FastAPI: thay thế 3 hàm saveProfileRemote / changePasswordRemote /
   saveSettingsRemote ở mục 2 bằng BlossomAPI.request(...).
   ========================================================= */
(function () {
    "use strict";

    const user = Auth.getUser();
    if (!user || !document.getElementById("accountPage")) return;

    const $ = function (id) { return document.getElementById(id); };
    const esc = UI.esc;

    /* ---------- 1. LƯU TRỮ ---------- */
    const USERNAME = user.username || "user";
    const KEY = {
        profile:   "blossom_profile_" + USERNAME,
        pwdAt:     "blossom_pwd_changed_" + USERNAME,
        settings:  "blossom_settings"
    };

    // Mật khẩu demo ban đầu của từng role (khớp tài khoản demo trong login.js)
    const DEMO_PASSWORD = { MANAGER: "Blossom@123", STAFF: "Manh@2026" };

    const DEFAULT_SETTINGS = {
        storeName: "Blossom Beauty Store",
        contactEmail: "admin@blossom.vn",
        timezone: "Asia/Ho_Chi_Minh",
        requireApproval: true,
        defaultTime: "09:00",
        platforms: ["Facebook", "Instagram", "Threads"],
        notifyPending: true,
        notifyRevision: true,
        notifyPublished: true,
        remindBefore: "30"
    };

    function read(key, fallback) {
        try {
            const v = JSON.parse(localStorage.getItem(key));
            return v == null ? fallback : v;
        } catch (e) { return fallback; }
    }

    function write(key, value) {
        try { localStorage.setItem(key, JSON.stringify(value)); return true; }
        catch (e) { return false; }
    }

    /* ---------- 2. "API" (demo) – thay bằng BlossomAPI.request khi có backend ---------- */
    function delay(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

    // Bản ghi của người đang đăng nhập trong AccountStore (khớp theo email); null nếu không có
    function findStoreAccount() {
        if (!window.AccountStore || !user.email) return null;
        const key = AccountStore.normEmail(user.email);
        return AccountStore.load().filter(function (a) { return AccountStore.normEmail(a.email) === key; })[0] || null;
    }

    function saveProfileRemote(data) {
        return delay(500).then(function () {
            if (!write(KEY.profile, { phone: data.phone, dob: data.dob, bio: data.bio })) {
                throw new Error("Không thể lưu dữ liệu trên trình duyệt này.");
            }
            // Cập nhật phiên đăng nhập để header / menu hiển thị tên mới
            let raw = {};
            try { raw = JSON.parse(localStorage.getItem(Auth.USER_KEY)) || {}; } catch (e) { /* bỏ qua */ }
            raw.fullName = data.fullName;
            localStorage.setItem(Auth.USER_KEY, JSON.stringify(raw));
            // Đồng bộ họ tên sang kho tài khoản để trang Tài khoản & Phân quyền hiển thị khớp
            const acc = findStoreAccount();
            if (acc) {
                const list = AccountStore.load();
                const rec = list.filter(function (a) { return a.id === acc.id; })[0];
                if (rec) { rec.fullName = data.fullName; AccountStore.save(list); }
            }
        });
    }

    function changePasswordRemote(current, next) {
        // TODO(API): gửi { current, next } lên server – server băm và kiểm tra, không lưu ở trình duyệt.
        return delay(600).then(function () {
            if (current !== DEMO_PASSWORD[user.role]) {
                const err = new Error("Mật khẩu hiện tại không chính xác.");
                err.field = "current";
                throw err;
            }
            write(KEY.pwdAt, new Date().toISOString());   // chỉ ghi thời điểm đổi
        });
    }

    function saveSettingsRemote(data) {
        return delay(500).then(function () {
            if (!write(KEY.settings, data)) throw new Error("Không thể lưu dữ liệu trên trình duyệt này.");
        });
    }

    /* ---------- 3. TIỆN ÍCH FORM ---------- */
    function setError(name, message) {
        const wrap = $("fld-" + name);
        const msg = $("err-" + name);
        if (wrap) wrap.classList.toggle("is-error", !!message);
        if (msg) msg.textContent = message || "";
    }

    function clearErrors(names) { names.forEach(function (n) { setError(n, ""); }); }

    function setBusy(btn, busy, busyText) {
        if (!btn) return;
        if (busy) {
            btn.dataset.label = btn.innerHTML;
            btn.innerHTML = "<span>" + esc(busyText || "Đang xử lý...") + "</span>";
            btn.disabled = true;
        } else {
            if (btn.dataset.label) {
                btn.innerHTML = btn.dataset.label;
                delete btn.dataset.label;
                UI.renderIcons(btn);
            }
            btn.disabled = false;
        }
    }

    function formatDateTime(iso) {
        const d = new Date(iso);
        if (isNaN(d)) return "";
        return UI.pad(d.getDate()) + "/" + UI.pad(d.getMonth() + 1) + "/" + d.getFullYear() +
            " " + UI.pad(d.getHours()) + ":" + UI.pad(d.getMinutes());
    }

    /* ---------- 4. TABS + URL HASH ---------- */
    const tabsEl = document.querySelector(".acc-tabbar .tabs");
    const tabs = Array.prototype.slice.call(tabsEl.querySelectorAll(".tab"));
    const TAB_KEYS = tabs.map(function (t) { return t.dataset.tab; });

    function showTab(key, updateUrl) {
        if (TAB_KEYS.indexOf(key) === -1) key = TAB_KEYS[0];
        tabs.forEach(function (t) {
            const on = t.dataset.tab === key;
            t.classList.toggle("active", on);
            t.setAttribute("aria-selected", String(on));
        });
        TAB_KEYS.forEach(function (k) {
            const panel = $("panel-" + k);
            if (panel) panel.hidden = k !== key;
        });
        if (updateUrl) history.replaceState(null, "", "#" + key);
    }

    // components.js đã bật/tắt .active; ở đây chỉ đồng bộ panel + URL
    tabsEl.addEventListener("tabchange", function (e) { showTab(e.detail.tab.dataset.tab, true); });

    // Bấm "Hồ sơ cá nhân" / "Đổi mật khẩu" ở menu người dùng (cùng trang, khác hash)
    window.addEventListener("hashchange", function () {
        showTab(location.hash.slice(1), false);
        const menu = $("menu"), btn = $("userBtn");
        if (menu) menu.classList.remove("open");
        if (btn) btn.setAttribute("aria-expanded", "false");
    });

    /* ---------- 5. HỒ SƠ CÁ NHÂN ---------- */
    const profileForm = $("profileForm");
    const positionText = user.position || Auth.ROLE_LABEL[user.role];
    const roleTone = user.role === Auth.ROLES.MANAGER ? "pink" : "purple";
    let profileSaved = {};

    function currentUser() { return Auth.getUser() || user; }

    function getAvatarSrc(u) {
        if (!u) return "";
        let src = "";
        try {
            src = localStorage.getItem("blossom_avatar_" + (u.username || u.email || "")) || "";
        } catch (_) {}
        if (!src && u.avatar) src = u.avatar;
        if (!src) {
            const acc = findStoreAccount();
            if (acc && acc.avatar) src = acc.avatar;
        }
        return src;
    }

    function renderSummary() {
        const u = currentUser();
        const avatarSrc = getAvatarSrc(u);
        const sumAvatar = $("sumAvatar");
        const avatarRemove = $("avatarRemove");

        if (sumAvatar) {
            if (avatarSrc) {
                sumAvatar.innerHTML = '<img src="' + esc(avatarSrc) + '" alt="Ảnh đại diện" style="width:100%;height:100%;border-radius:50%;object-fit:cover;display:block;">';
            } else {
                sumAvatar.textContent = Auth.initials(u);
            }
        }

        if (avatarRemove) {
            avatarRemove.hidden = !avatarSrc;
        }

        $("sumName").textContent = u.fullName || u.username;
        $("sumPos").textContent = positionText;
        $("sumRole").innerHTML = UI.badge(Auth.ROLE_LABEL[u.role], roleTone);
        $("sumUsername").textContent = u.username || "—";
        $("sumEmail").textContent = u.email || "—";

        const acc = findStoreAccount();
        const joined = $("sumJoinedRow");
        if (acc && acc.createdAt) {
            const p = String(acc.createdAt).split("-");
            $("sumJoined").textContent = p.length === 3 ? p[2] + "/" + p[1] + "/" + p[0] : acc.createdAt;
            joined.hidden = false;
        } else {
            joined.hidden = true;
        }
    }

    // Header (topbar) được render một lần bởi layout.js → cập nhật tại chỗ sau khi lưu
    function refreshHeader() {
        const u = currentUser();
        const avatar = document.querySelector("#topbar .avatar");
        const short = document.querySelector("#topbar .user-info b");
        const full = document.querySelector("#topbar .menu .who b");
        const avatarSrc = getAvatarSrc(u);

        if (avatar) {
            if (avatarSrc) {
                avatar.innerHTML = '<img src="' + esc(avatarSrc) + '" alt="" style="width:100%;height:100%;border-radius:50%;object-fit:cover;display:block;">';
            } else {
                avatar.textContent = Auth.initials(u);
            }
        }
        if (short) short.textContent = Auth.shortName(u);
        if (full) full.textContent = u.fullName || u.username;
    }

    function setupAvatarHandlers() {
        const fileInput = $("avatarFile");
        const pickBtn = $("avatarPick");
        const editBtn = $("avatarEdit");
        const removeBtn = $("avatarRemove");

        function openFilePicker() {
            if (fileInput) fileInput.click();
        }

        if (pickBtn) pickBtn.addEventListener("click", openFilePicker);
        if (editBtn) editBtn.addEventListener("click", openFilePicker);

        if (fileInput) {
            fileInput.addEventListener("change", function () {
                const file = fileInput.files && fileInput.files[0];
                if (!file) return;

                if (!/^image\/(png|jpe?g|webp)$/i.test(file.type)) {
                    UI.toast("error", "Định dạng không hợp lệ", "Vui lòng chọn ảnh JPG, PNG hoặc WebP.");
                    fileInput.value = "";
                    return;
                }

                if (file.size > 5 * 1024 * 1024) {
                    UI.toast("error", "Ảnh quá lớn", "Dung lượng ảnh tối đa cho phép là 5 MB.");
                    fileInput.value = "";
                    return;
                }

                const reader = new FileReader();
                reader.onload = function (e) {
                    const dataUrl = e.target.result;
                    const u = currentUser();
                    const key = "blossom_avatar_" + (u.username || u.email || "user");

                    try { localStorage.setItem(key, dataUrl); } catch (_) {}
                    u.avatar = dataUrl;
                    try { localStorage.setItem(Auth.USER_KEY, JSON.stringify(u)); } catch (_) {}

                    try {
                        if (window.AccountStore && typeof AccountStore.load === "function") {
                            const list = AccountStore.load();
                            const acc = list.find(function (a) {
                                return AccountStore.normEmail(a.email) === AccountStore.normEmail(u.email);
                            });
                            if (acc) {
                                acc.avatar = dataUrl;
                                AccountStore.save(list);
                            }
                        }
                    } catch (_) {}

                    renderSummary();
                    refreshHeader();
                    UI.toast("success", "Đã cập nhật ảnh đại diện", "Ảnh đại diện mới đã được áp dụng thành công.");
                };
                reader.readAsDataURL(file);
            });
        }

        if (removeBtn) {
            removeBtn.addEventListener("click", function () {
                const u = currentUser();
                const key = "blossom_avatar_" + (u.username || u.email || "user");

                try { localStorage.removeItem(key); } catch (_) {}
                delete u.avatar;
                try { localStorage.setItem(Auth.USER_KEY, JSON.stringify(u)); } catch (_) {}

                try {
                    if (window.AccountStore && typeof AccountStore.load === "function") {
                        const list = AccountStore.load();
                        const acc = list.find(function (a) {
                            return AccountStore.normEmail(a.email) === AccountStore.normEmail(u.email);
                        });
                        if (acc) {
                            delete acc.avatar;
                            AccountStore.save(list);
                        }
                    }
                } catch (_) {}

                if (fileInput) fileInput.value = "";
                renderSummary();
                refreshHeader();
                UI.toast("info", "Đã xóa ảnh đại diện", "Ảnh đại diện đã được gỡ bỏ, quay lại hiển thị chữ cái viết tắt.");
            });
        }
    }

    function renderPermissions() {
        const items = [
            ["post:create",     "Tạo, sửa, xóa bài viết"],
            ["post:approve",    "Duyệt bài viết"],
            ["report:view",     "Xem báo cáo & thống kê"],
            ["account:manage",  "Quản lý tài khoản & phân quyền"],
            ["settings:manage", "Thiết lập hệ thống"]
        ];
        $("permList").innerHTML = items.map(function (it) {
            const ok = Permissions.can(it[0]);
            return '<li class="' + (ok ? "" : "is-off") + '"><span class="acc-perm__ico">' + UI.icon(ok ? "tick" : "close") +
                "</span><span>" + esc(it[1]) + "</span></li>";
        }).join("");
    }

    function fillProfile() {
        const u = currentUser();
        profileSaved = Object.assign({ phone: "", dob: "", bio: "" }, read(KEY.profile, {}));
        profileSaved.fullName = u.fullName || "";

        $("pfFullName").value = profileSaved.fullName;
        $("pfPhone").value = profileSaved.phone;
        $("pfDob").value = profileSaved.dob;
        $("pfBio").value = profileSaved.bio;
        $("pfPosition").value = positionText;
        $("pfUsername").value = u.username || "";
        $("pfEmail").value = u.email || "";
        $("pfRole").value = Auth.ROLE_LABEL[u.role];
        $("pfDob").max = new Date().toISOString().slice(0, 10);

        updateBioCount();
        syncProfileDirty();
    }

    function profileValues() {
        return {
            fullName: $("pfFullName").value.trim().replace(/\s+/g, " "),
            phone: $("pfPhone").value.trim(),
            dob: $("pfDob").value,
            bio: $("pfBio").value.trim()
        };
    }

    function isProfileDirty() {
        const v = profileValues();
        return Object.keys(v).some(function (k) { return v[k] !== (profileSaved[k] || ""); });
    }

    function syncProfileDirty() {
        const dirty = isProfileDirty();
        $("profileSave").disabled = !dirty;
        $("profileReset").disabled = !dirty;
        $("profileDirty").hidden = !dirty;
    }

    function updateBioCount() { $("bioCount").textContent = $("pfBio").value.length + "/200"; }

    function validateProfile(v) {
        let ok = true;
        clearErrors(["fullName", "phone", "dob", "bio"]);

        if (!v.fullName) { setError("fullName", "Vui lòng nhập họ và tên."); ok = false; }
        else if (v.fullName.length < 2) { setError("fullName", "Họ và tên phải có ít nhất 2 ký tự."); ok = false; }

        if (v.phone && !/^(0|\+84)\d{9}$/.test(v.phone.replace(/[\s.\-]/g, ""))) {
            setError("phone", "Số điện thoại không hợp lệ (ví dụ: 0901 234 567)."); ok = false;
        }

        if (v.dob && new Date(v.dob) > new Date()) {
            setError("dob", "Ngày sinh không được ở tương lai."); ok = false;
        }
        return ok;
    }

    profileForm.addEventListener("input", function (e) {
        const map = { pfFullName: "fullName", pfPhone: "phone", pfDob: "dob", pfBio: "bio" };
        if (map[e.target.id]) setError(map[e.target.id], "");
        if (e.target.id === "pfBio") updateBioCount();
        syncProfileDirty();
    });

    $("profileReset").addEventListener("click", function () {
        clearErrors(["fullName", "phone", "dob", "bio"]);
        fillProfile();
    });

    profileForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const v = profileValues();
        if (!validateProfile(v)) {
            const first = profileForm.querySelector(".field.is-error .input, .field.is-error .textarea");
            if (first) first.focus();
            return;
        }
        const btn = $("profileSave");
        setBusy(btn, true, "Đang lưu...");
        saveProfileRemote(v).then(function () {
            setBusy(btn, false);
            renderSummary();
            refreshHeader();
            fillProfile();
            UI.toast("success", "Đã lưu hồ sơ", "Thông tin cá nhân của bạn đã được cập nhật.");
        }).catch(function (err) {
            setBusy(btn, false);
            syncProfileDirty();
            UI.toast("error", "Không thể lưu hồ sơ", err.message);
        });
    });

    /* ---------- 6. ĐỔI MẬT KHẨU ---------- */
    const pwdForm = $("passwordForm");
    const PWD_FIELDS = ["current", "new", "confirm"];
    const ICON_EYE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
    const ICON_EYE_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3l18 18"/><path d="M10.6 6.1A10 10 0 0112 5c6.5 0 10 7 10 7a17 17 0 01-3.2 4.1M6.6 6.6A17 17 0 002 12s3.5 7 10 7a9.7 9.7 0 004.4-1"/><path d="M9.9 9.9a3 3 0 004.2 4.2"/></svg>';
    const METER_TEXT = ["Chưa nhập", "Yếu", "Trung bình", "Khá", "Mạnh"];

    function rulesOf(pwd) {
        if (window.BlossomAPI && BlossomAPI.validatePasswordComplexity) {
            return BlossomAPI.validatePasswordComplexity(pwd);
        }
        const rules = {
            minLength: pwd.length >= 8, hasUpper: /[A-Z]/.test(pwd),
            hasLower: /[a-z]/.test(pwd), hasDigit: /[0-9]/.test(pwd)
        };
        const valid = rules.minLength && rules.hasUpper && rules.hasLower && rules.hasDigit;
        return { valid: valid, rules: rules, message: valid ? "" : "Mật khẩu chưa đủ mạnh." };
    }

    function strengthLevel(pwd) {
        if (!pwd) return 0;
        const r = rulesOf(pwd);
        const met = Object.keys(r.rules).filter(function (k) { return r.rules[k]; }).length;
        if (!r.valid) return met >= 3 ? 2 : 1;
        return (pwd.length >= 12 || /[^A-Za-z0-9]/.test(pwd)) ? 4 : 3;
    }

    function updateStrength() {
        const pwd = $("pwNew").value;
        const r = rulesOf(pwd);
        document.querySelectorAll("#pwRules li").forEach(function (li) {
            li.classList.toggle("is-ok", !!r.rules[li.dataset.rule]);
        });
        const level = strengthLevel(pwd);
        $("pwMeter").dataset.level = String(level);
        $("pwMeterText").textContent = METER_TEXT[level];
    }

    function renderLastChanged() {
        const at = read(KEY.pwdAt, null);
        $("pwdLastChanged").textContent = at
            ? "Lần đổi gần nhất: " + formatDateTime(at)
            : "Dùng mật khẩu mạnh và không chia sẻ cho người khác.";
    }

    function resetPasswordForm() {
        pwdForm.reset();
        clearErrors(PWD_FIELDS);
        document.querySelectorAll(".acc-eye").forEach(function (b) { setEye(b, false); });
        updateStrength();
    }

    function setEye(btn, visible) {
        const input = $(btn.dataset.eye);
        input.type = visible ? "text" : "password";
        btn.innerHTML = visible ? ICON_EYE : ICON_EYE_OFF;
        btn.setAttribute("aria-label", visible ? "Ẩn mật khẩu" : "Hiện mật khẩu");
    }

    document.querySelectorAll(".acc-eye").forEach(function (btn) {
        setEye(btn, false);
        btn.addEventListener("click", function () { setEye(btn, $(btn.dataset.eye).type === "password"); });
    });

    pwdForm.addEventListener("input", function (e) {
        const map = { pwCurrent: "current", pwNew: "new", pwConfirm: "confirm" };
        if (map[e.target.id]) setError(map[e.target.id], "");
        if (e.target.id === "pwNew") updateStrength();
    });

    $("passwordClear").addEventListener("click", resetPasswordForm);

    function validatePassword(cur, next, again) {
        let ok = true;
        clearErrors(PWD_FIELDS);

        if (!cur) { setError("current", "Vui lòng nhập mật khẩu hiện tại."); ok = false; }

        if (!next) { setError("new", "Vui lòng nhập mật khẩu mới."); ok = false; }
        else if (!rulesOf(next).valid) { setError("new", rulesOf(next).message); ok = false; }
        else if (cur && next === cur) { setError("new", "Mật khẩu mới phải khác mật khẩu hiện tại."); ok = false; }

        if (!again) { setError("confirm", "Vui lòng nhập lại mật khẩu mới."); ok = false; }
        else if (next && again !== next) { setError("confirm", "Mật khẩu nhập lại không khớp."); ok = false; }
        return ok;
    }

    pwdForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const cur = $("pwCurrent").value, next = $("pwNew").value, again = $("pwConfirm").value;

        if (!validatePassword(cur, next, again)) {
            const first = pwdForm.querySelector(".field.is-error input");
            if (first) first.focus();
            return;
        }

        const btn = $("passwordSave");
        setBusy(btn, true, "Đang cập nhật...");
        changePasswordRemote(cur, next).then(function () {
            setBusy(btn, false);
            resetPasswordForm();
            renderLastChanged();
            UI.toast("success", "Đổi mật khẩu thành công", "Hãy dùng mật khẩu mới ở lần đăng nhập tiếp theo.", 4000);
        }).catch(function (err) {
            setBusy(btn, false);
            if (err.field === "current") {
                setError("current", err.message);
                $("pwCurrent").select();
            } else {
                UI.toast("error", "Không thể đổi mật khẩu", err.message);
            }
        });
    });

    /* ---------- 7. CÀI ĐẶT HỆ THỐNG (Manager) ---------- */
    const systemForm = $("systemForm");
    let settingsSaved = null;

    function platformInputs() {
        return Array.prototype.slice.call(systemForm.querySelectorAll('input[name="platform"]'));
    }

    function fillSettings() {
        settingsSaved = Object.assign({}, DEFAULT_SETTINGS, read(KEY.settings, {}));
        const s = settingsSaved;
        $("sysStoreName").value = s.storeName;
        $("sysContactEmail").value = s.contactEmail;
        $("sysTimezone").value = s.timezone;
        $("sysRequireApproval").checked = !!s.requireApproval;
        $("sysDefaultTime").value = s.defaultTime;
        $("sysNotifyPending").checked = !!s.notifyPending;
        $("sysNotifyRevision").checked = !!s.notifyRevision;
        $("sysNotifyPublished").checked = !!s.notifyPublished;
        $("sysRemind").value = String(s.remindBefore);
        platformInputs().forEach(function (i) { i.checked = s.platforms.indexOf(i.value) !== -1; });
        syncSettingsDirty();
    }

    function settingsValues() {
        return {
            storeName: $("sysStoreName").value.trim(),
            contactEmail: $("sysContactEmail").value.trim(),
            timezone: $("sysTimezone").value,
            requireApproval: $("sysRequireApproval").checked,
            defaultTime: $("sysDefaultTime").value,
            platforms: platformInputs().filter(function (i) { return i.checked; }).map(function (i) { return i.value; }),
            notifyPending: $("sysNotifyPending").checked,
            notifyRevision: $("sysNotifyRevision").checked,
            notifyPublished: $("sysNotifyPublished").checked,
            remindBefore: $("sysRemind").value
        };
    }

    function syncSettingsDirty() {
        const dirty = JSON.stringify(settingsValues()) !== JSON.stringify(settingsSaved);
        $("systemSave").disabled = !dirty;
        $("systemReset").disabled = !dirty;
        $("systemDirty").hidden = !dirty;
    }

    function validateSettings(v) {
        let ok = true;
        clearErrors(["storeName", "contactEmail", "platforms"]);
        if (!v.storeName) { setError("storeName", "Vui lòng nhập tên cửa hàng."); ok = false; }
        if (!v.contactEmail) { setError("contactEmail", "Vui lòng nhập email liên hệ."); ok = false; }
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.contactEmail)) { setError("contactEmail", "Email không đúng định dạng."); ok = false; }
        if (!v.platforms.length) { setError("platforms", "Chọn ít nhất một nền tảng đăng bài."); ok = false; }
        return ok;
    }

    if (systemForm) {
        systemForm.addEventListener("input", function (e) {
            if (e.target.id === "sysStoreName") setError("storeName", "");
            if (e.target.id === "sysContactEmail") setError("contactEmail", "");
            syncSettingsDirty();
        });
        systemForm.addEventListener("change", function (e) {
            if (e.target.name === "platform") setError("platforms", "");
            syncSettingsDirty();
        });

        $("systemReset").addEventListener("click", function () {
            clearErrors(["storeName", "contactEmail", "platforms"]);
            fillSettings();
        });

        systemForm.addEventListener("submit", function (e) {
            e.preventDefault();
            if (!Permissions.can("settings:manage")) return;
            const v = settingsValues();
            if (!validateSettings(v)) {
                const first = systemForm.querySelector(".field.is-error input");
                if (first) first.focus();
                return;
            }
            const btn = $("systemSave");
            setBusy(btn, true, "Đang lưu...");
            saveSettingsRemote(v).then(function () {
                setBusy(btn, false);
                fillSettings();
                UI.toast("success", "Đã lưu cài đặt", "Cài đặt hệ thống đã được cập nhật.");
            }).catch(function (err) {
                setBusy(btn, false);
                syncSettingsDirty();
                UI.toast("error", "Không thể lưu cài đặt", err.message);
            });
        });
    }

    /* ---------- 8. Cảnh báo khi rời trang với thay đổi chưa lưu ---------- */
    window.addEventListener("beforeunload", function (e) {
        const dirty = isProfileDirty() || (systemForm && !$("systemSave").disabled);
        if (dirty) { e.preventDefault(); e.returnValue = ""; }
    });

    /* ---------- 9. KHỞI TẠO ---------- */
    renderSummary();
    setupAvatarHandlers();
    renderPermissions();
    fillProfile();
    updateStrength();
    renderLastChanged();
    if (systemForm) fillSettings();
    UI.renderIcons();
    showTab(location.hash.slice(1), false);
})();
