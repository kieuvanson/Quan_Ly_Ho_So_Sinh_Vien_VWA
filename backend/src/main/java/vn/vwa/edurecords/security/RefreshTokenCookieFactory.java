package vn.vwa.edurecords.security;

import jakarta.servlet.http.Cookie;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Locale;
import java.util.Set;

/**
 * Tạo cookie refresh token theo cấu hình bảo mật.
 *
 * <h3>Vì sao tách riêng</h3>
 * <p>Cookie refresh token là thứ duy nhất giữ phiên đăng nhập. Cấu hình sai
 * (thiếu {@code Secure}, đặt {@code SameSite=None} khi không có HTTPS) làm token
 * bị gửi qua kênh plaintext hoặc bị gửi kèm request chéo site. Vì vậy cấu hình
 * được kiểm tra <b>lúc khởi động</b> (fail-fast) thay vì phát hiện khi đang
 * chạy production.</p>
 *
 * <h3>Quy tắc áp dụng</h3>
 * <ul>
 *   <li>{@code SameSite} chỉ nhận {@code Lax}, {@code Strict} hoặc {@code None}.
 *       Giá trị khác → không khởi động (tránh rơi vào trạng thái mơ hồ).</li>
 *   <li>{@code SameSite=None} bắt buộc phải có {@code Secure=true}; nếu không
 *       browser sẽ từ chối cookie hoặc gửi nó không mã hoá.</li>
 *   <li>{@code SameSite=None} là cấu hình mở rộng chính sách CSRF, nên mặc
 *       định bị chặn. Muốn bật phải bật cờ cho phép tường minh.</li>
 *   <li>Khi {@code requireSecure=true} mà {@code Secure=false} → không khởi động.
 *       Đây là cơ chế bắt buộc {@code Secure=true} ở production.</li>
 * </ul>
 */
@Component
public class RefreshTokenCookieFactory {

    private static final Logger log = LoggerFactory.getLogger(RefreshTokenCookieFactory.class);

    public static final String COOKIE_NAME = "refresh_token";
    public static final String COOKIE_PATH = "/api/auth";

    private static final String SAME_SITE_LAX = "Lax";
    private static final String SAME_SITE_STRICT = "Strict";
    private static final String SAME_SITE_NONE = "None";

    private static final Set<String> ALLOWED_SAME_SITE =
            Set.of(SAME_SITE_LAX, SAME_SITE_STRICT, SAME_SITE_NONE);

    private final boolean secure;
    private final String sameSite;
    private final int maxAgeSeconds;

    public RefreshTokenCookieFactory(
            @Value("${app.security.cookie.secure:true}") boolean secure,
            @Value("${app.security.cookie.samesite:Lax}") String sameSite,
            @Value("${app.security.jwt.refresh-token-ttl:P7D}") String refreshTokenTtl,
            @Value("${app.security.cookie.require-secure:true}") boolean requireSecure,
            @Value("${app.security.cookie.allow-samesite-none:false}") boolean allowSameSiteNone) {

        String normalized = normalizeSameSite(sameSite);

        if (!ALLOWED_SAME_SITE.contains(normalized)) {
            throw new IllegalStateException(
                    "Cấu hình app.security.cookie.samesite không hợp lệ. Chỉ chấp nhận: "
                            + String.join(", ", ALLOWED_SAME_SITE) + ".");
        }

        if (SAME_SITE_NONE.equals(normalized) && !secure) {
            throw new IllegalStateException(
                    "SameSite=None yêu cầu cookie Secure=true. Hãy đặt app.security.cookie.secure=true.");
        }

        if (SAME_SITE_NONE.equals(normalized) && !allowSameSiteNone) {
            throw new IllegalStateException(
                    "SameSite=None làm cookie refresh token được gửi kèm request chéo site "
                            + "(nới lỏng chính sách CSRF). Nếu thực sự cần, hãy đặt rõ ràng "
                            + "app.security.cookie.allow-samesite-none=true sau khi đánh giá rủi ro.");
        }

        if (requireSecure && !secure) {
            throw new IllegalStateException(
                    "app.security.cookie.secure phải là true. Trong production hãy đặt biến môi "
                            + "trường APP_SECURITY_COOKIE_SECURE=true; chỉ được đặt false ở môi "
                            + "trường local chạy HTTP (và khi đó app.security.cookie.require-secure "
                            + "phải được tắt qua profile dev/local).");
        }

        this.secure = secure;
        this.sameSite = normalized;
        this.maxAgeSeconds = (int) parseTtlSeconds(refreshTokenTtl);

        if (SAME_SITE_NONE.equals(normalized)) {
            log.warn("Cookie refresh token đang dùng SameSite=None — cookie sẽ được gửi kèm "
                    + "request chéo site. Hãy chắc chắn đã bật CSRF protection ở phía frontend.");
        }
    }

    private static String normalizeSameSite(String value) {
        if (value == null || value.isBlank()) {
            return SAME_SITE_LAX;
        }
        String trimmed = value.trim();
        // Chấp nhận "lax"/"LAX"/"Lax" — tránh lỗi cấu hình do khác biệt hoa/thường.
        if (trimmed.equalsIgnoreCase(SAME_SITE_LAX)) {
            return SAME_SITE_LAX;
        }
        if (trimmed.equalsIgnoreCase(SAME_SITE_STRICT)) {
            return SAME_SITE_STRICT;
        }
        if (trimmed.equalsIgnoreCase(SAME_SITE_NONE)) {
            return SAME_SITE_NONE;
        }
        return trimmed.toUpperCase(Locale.ROOT);
    }

    private static long parseTtlSeconds(String isoDuration) {
        try {
            return Duration.parse(isoDuration).toSeconds();
        } catch (Exception e) {
            return Duration.ofDays(7).toSeconds();
        }
    }

    /** Cookie chứa refresh token (giá trị rỗng dùng để xoá cookie khi logout). */
    public Cookie create(String tokenValue) {
        Cookie cookie = new Cookie(COOKIE_NAME, tokenValue == null ? "" : tokenValue);
        cookie.setHttpOnly(true);
        cookie.setSecure(secure);
        cookie.setPath(COOKIE_PATH);
        cookie.setMaxAge(tokenValue == null || tokenValue.isBlank() ? 0 : maxAgeSeconds);
        cookie.setAttribute("SameSite", sameSite);
        return cookie;
    }

    public boolean isSecure() {
        return secure;
    }

    public String getSameSite() {
        return sameSite;
    }
}
