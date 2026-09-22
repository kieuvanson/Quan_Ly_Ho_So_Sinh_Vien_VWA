package vn.vwa.edurecords.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

/**
 * Utility tạo / xoá HttpOnly Secure Cookie cho refreshToken.
 * Mục đích: tránh JavaScript phía frontend đọc được refresh token, chống XSS đánh cắp.
 */
@Component
public class RefreshTokenCookie {

    public static final String COOKIE_NAME = "refresh_token";

    private final boolean secure;
    private final String sameSite;

    public RefreshTokenCookie(
            @Value("${app.security.cookie.secure:false}") boolean secure,
            @Value("${app.security.cookie.samesite:Lax}") String sameSite) {
        this.secure = secure;
        this.sameSite = sameSite;
    }

    public ResponseCookie create(String token, long maxAgeSeconds) {
        return ResponseCookie.from(COOKIE_NAME, token)
                .httpOnly(true)
                .secure(secure)
                .sameSite(sameSite)
                .path("/api/auth")
                .maxAge(maxAgeSeconds)
                .build();
    }

    public ResponseCookie clear() {
        return ResponseCookie.from(COOKIE_NAME, "")
                .httpOnly(true)
                .secure(secure)
                .sameSite(sameSite)
                .path("/api/auth")
                .maxAge(0)
                .build();
    }
}
