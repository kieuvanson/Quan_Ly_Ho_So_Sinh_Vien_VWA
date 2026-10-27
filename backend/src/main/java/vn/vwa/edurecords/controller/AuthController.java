package vn.vwa.edurecords.controller;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.vwa.edurecords.dto.request.LoginRequest;
import vn.vwa.edurecords.dto.request.RegisterRequest;
import vn.vwa.edurecords.dto.response.ApiResponse;
import vn.vwa.edurecords.dto.response.AuthResponse;
import vn.vwa.edurecords.dto.response.UserResponse;
import vn.vwa.edurecords.service.AuthService;
import vn.vwa.edurecords.security.RateLimitFilter;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final String REFRESH_TOKEN_COOKIE = "refresh_token";
    private static final String COOKIE_PATH = "/api/auth";

    private final AuthService authService;
    private final RateLimitFilter rateLimitFilter;
    private final boolean cookieSecure;
    private final String cookieSameSite;
    private final int refreshCookieMaxAgeSeconds;

    public AuthController(AuthService authService,
                          RateLimitFilter rateLimitFilter,
                          @Value("${app.security.cookie.secure:false}") boolean cookieSecure,
                          @Value("${app.security.cookie.samesite:Lax}") String cookieSameSite,
                          @Value("${app.security.jwt.refresh-token-ttl:P7D}") String refreshTokenTtl) {
        this.authService = authService;
        this.rateLimitFilter = rateLimitFilter;
        this.cookieSecure = cookieSecure;
        this.cookieSameSite = cookieSameSite;
        this.refreshCookieMaxAgeSeconds = (int) parseTtlSeconds(refreshTokenTtl);
    }

    private static long parseTtlSeconds(String isoDuration) {
        try {
            return java.time.Duration.parse(isoDuration).toSeconds();
        } catch (Exception e) {
            return java.time.Duration.ofDays(7).toSeconds();
        }
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request,
                                                          HttpServletRequest httpRequest,
                                                          HttpServletResponse response) {
        AuthResponse authResponse = authService.login(request);
        // Đăng nhập đúng: xoá bộ đếm để các lần đăng nhập hợp lệ sau không bị chặn nhầm.
        rateLimitFilter.resetAttempts(httpRequest.getRemoteAddr());
        issueTokens(authResponse, response);
        return ResponseEntity.ok(ApiResponse.success("Đăng nhập thành công", authResponse));
    }

    /**
     * Tạo tài khoản nhân viên. Chỉ ADMIN được gọi — không có đường đăng ký công khai.
     * Tài khoản tạo ra có vai trò STAFF, không thể tự nâng quyền qua request body.
     */
    @PostMapping("/register")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> register(@Valid @RequestBody RegisterRequest request) {
        UserResponse created = UserResponse.fromEntity(authService.createUser(request));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo tài khoản thành công", created));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(
            @CookieValue(name = REFRESH_TOKEN_COOKIE, required = false) String refreshToken,
            HttpServletResponse response) {

        if (refreshToken == null || refreshToken.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error(401, "NO_REFRESH_TOKEN", "Không tìm thấy phiên đăng nhập."));
        }

        AuthResponse authResponse = authService.refresh(refreshToken);
        issueTokens(authResponse, response);
        return ResponseEntity.ok(ApiResponse.success("Làm mới phiên đăng nhập", authResponse));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @CookieValue(name = REFRESH_TOKEN_COOKIE, required = false) String refreshToken,
            HttpServletRequest request,
            HttpServletResponse response) {

        String accessToken = extractBearerToken(request);
        authService.logout(accessToken, refreshToken);
        deleteRefreshTokenCookie(response);

        return ResponseEntity.ok(ApiResponse.success("Đăng xuất thành công", (Void) null));
    }

    /**
     * Tách refresh token khỏi response body và đặt vào cookie HttpOnly.
     * Client chỉ nhận access token trong body; refresh token nằm trong cookie
     * nên JavaScript không đọc được, giảm rủi ro lộ token qua XSS.
     */
    private void issueTokens(AuthResponse authResponse, HttpServletResponse response) {
        String refreshToken = authResponse.getToken().getRefreshToken();
        authResponse.getToken().setRefreshToken(null);
        addRefreshTokenCookie(response, refreshToken);
    }

    private String extractBearerToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        return null;
    }

    private void addRefreshTokenCookie(HttpServletResponse response, String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            return;
        }
        Cookie cookie = new Cookie(REFRESH_TOKEN_COOKIE, refreshToken);
        cookie.setHttpOnly(true);
        cookie.setSecure(cookieSecure);
        cookie.setPath(COOKIE_PATH);
        cookie.setMaxAge(refreshCookieMaxAgeSeconds);
        cookie.setAttribute("SameSite", cookieSameSite);
        response.addCookie(cookie);
    }

    private void deleteRefreshTokenCookie(HttpServletResponse response) {
        Cookie cookie = new Cookie(REFRESH_TOKEN_COOKIE, "");
        cookie.setHttpOnly(true);
        cookie.setSecure(cookieSecure);
        cookie.setPath(COOKIE_PATH);
        cookie.setMaxAge(0);
        cookie.setAttribute("SameSite", cookieSameSite);
        response.addCookie(cookie);
    }
}
