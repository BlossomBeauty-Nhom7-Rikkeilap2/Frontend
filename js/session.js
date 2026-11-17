/* =========================================================
   SESSION – Theo dõi hoạt động của người dùng, tự đăng xuất
   sau 60 phút không hoạt động.
   Nạp trong <head>, SAU auth.js và TRƯỚC permissions.js.
   (Không nạp ở trang login.)

   Cách hoạt động:
   1. Mỗi lần người dùng thao tác (chuột, phím, cuộn, chạm) -> ghi
      mốc "lastActivity" vào localStorage qua Auth.touch(), tối đa
      1 lần / 10 giây để không ghi liên tục.
   2. Cứ 30 giây (và khi tab được mở lại) kiểm tra: nếu quá 60 phút
      kể từ lastActivity -> Auth.logout("timeout").
   3. Còn 5 phút nữa hết hạn -> hỏi "Tiếp tục làm việc?".
   4. Mốc nằm trong localStorage nên mọi tab dùng chung một phiên:
      thao tác ở tab nào cũng giữ phiên cho cả các tab còn lại.

   LƯU Ý: đây là hết hạn phía giao diện. Khi nối backend, token/JWT
   vẫn phải tự hết hạn ở server.
   ========================================================= */
(function (global) {
    "use strict";

    const TIMEOUT_MS = 60 * 60 * 1000;      // 60 phút không hoạt động
    const WARNING_MS = 5 * 60 * 1000;       // cảnh báo khi còn 5 phút
    const CHECK_INTERVAL_MS = 30 * 1000;    // chu kỳ kiểm tra
    const WRITE_THROTTLE_MS = 10 * 1000;    // ghi lastActivity tối đa 1 lần / 10 giây
    const ACTIVITY_EVENTS = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "click"];

    let lastWrite = 0;
    let warning = false;    // đang hiện hộp thoại cảnh báo
    let timer = null;

    // Số mili-giây còn lại trước khi hết hạn; null nếu chưa đăng nhập
    function remaining() {
        if (!Auth.isLoggedIn()) return null;
        const session = Auth.getSession();
        if (!session) return TIMEOUT_MS;    // dữ liệu bản cũ: check() sẽ tạo mốc mới
        return TIMEOUT_MS - (Date.now() - session.lastActivity);
    }

    function onActivity() {
        if (warning) return;                // đang cảnh báo: chỉ tính khi bấm nút trong hộp thoại
        const now = Date.now();
        if (now - lastWrite < WRITE_THROTTLE_MS) return;
        lastWrite = now;
        Auth.touch(now);
    }

    function expire() {
        stop();
        Auth.logout("timeout");
    }

    function warn(left) {
        if (warning || !global.UI || !UI.modal) return;
        warning = true;

        const minutes = Math.max(1, Math.ceil(left / 60000));
        UI.modal({
            title: "Phiên sắp hết hạn",
            body: "<p>Bạn sẽ bị đăng xuất sau khoảng " + minutes + " phút nữa do không hoạt động. Bạn có muốn tiếp tục làm việc?</p>",
            actions: [
                { label: "Đăng xuất", variant: "secondary", value: "leave" },
                { label: "Tiếp tục làm việc", variant: "primary", value: "stay" }
            ]
        }).then(function (choice) {
            warning = false;
            if (choice === "leave") {
                stop();
                Auth.logout();
            } else {
                lastWrite = Date.now();
                Auth.touch(lastWrite);      // "Tiếp tục" hoặc đóng hộp thoại = còn làm việc
            }
        });
    }

    function check() {
        const left = remaining();
        if (left === null) return;          // chưa đăng nhập: route-guard xử lý

        if (!Auth.getSession()) {           // dữ liệu bản cũ chưa có mốc phiên
            Auth.touch();
            return;
        }
        if (left <= 0) {
            expire();
        } else if (left <= WARNING_MS) {
            warn(left);
        }
    }

    function start() {
        if (timer) return;
        ACTIVITY_EVENTS.forEach(function (name) {
            document.addEventListener(name, onActivity, { passive: true, capture: true });
        });
        timer = setInterval(check, CHECK_INTERVAL_MS);
        // Máy ngủ / tab bị treo lâu rồi mở lại: kiểm tra ngay, không chờ chu kỳ
        document.addEventListener("visibilitychange", function () {
            if (document.visibilityState === "visible") check();
        });
        window.addEventListener("pageshow", check);
        check();
    }

    function stop() {
        clearInterval(timer);
        timer = null;
        ACTIVITY_EVENTS.forEach(function (name) {
            document.removeEventListener(name, onActivity, { capture: true });
        });
    }

    global.Session = { TIMEOUT_MS, WARNING_MS, remaining, check, start, stop };

    start();
})(window);