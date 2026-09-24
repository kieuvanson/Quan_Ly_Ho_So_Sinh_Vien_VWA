package vn.vwa.edurecords.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import vn.vwa.edurecords.dto.ApiResponse;
import vn.vwa.edurecords.dto.request.LoginRequest;
import vn.vwa.edurecords.dto.request.LogoutRequest;
import vn.vwa.edurecords.dto.request.RefreshTokenRequest;
import vn.vwa.edurecords.dto.response.AuthResponse;
import vn.vwa.edurecords.dto.response.TokenResponse;
import vn.vwa.edurecords.security.ClientIpResolver;
import vn.vwa.edurecords.security.RefreshTokenCookie;
import vn.vwa.edurecords.service.AuthService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final RefreshTokenCookie refreshTokenCookie;
    private final long refreshTokenTtlSeconds;

    public AuthController(AuthService authService,
                          RefreshTokenCookie refreshTokenCookie,
                          @Value("${app.security.jwt.refresh-token-ttl}") java.time.Duration refreshTokenTtl) {
        this.authService = authService;
        this.refreshTokenCookie = refreshTokenCookie;
        this.refreshTokenTtlSeconds = refreshTokenTtl.toSeconds();
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request,
                                                            HttpServletRequest http) {
        String ip = ClientIpResolver.resolve(http);
        AuthResponse response = authService.login(request, ip);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshTokenCookie
                        .create(response.token().refreshToken(), refreshTokenTtlSeconds).toString())
                .body(ApiResponse.ok(stripRefreshToken(response), "Đăng nhập thành công"));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(
            @CookieValue(name = RefreshTokenCookie.COOKIE_NAME, required = false) String cookieToken,
            @RequestBody(required = false) RefreshTokenRequest body,
            HttpServletRequest http) {

        // Ưu tiên lấy refresh token từ HttpOnly cookie; fallback body (cho Postman test thuận tiện)
        String refreshToken = (cookieToken != null && !cookieToken.isBlank())
                ? cookieToken
                : (body != null ? body.refreshToken() : null);

        String ip = ClientIpResolver.resolve(http);
        AuthResponse response = authService.refresh(refreshToken, ip);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshTokenCookie
                        .create(response.token().refreshToken(), refreshTokenTtlSeconds).toString())
                .body(ApiResponse.ok(stripRefreshToken(response), "Làm mới token thành công"));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @CookieValue(name = RefreshTokenCookie.COOKIE_NAME, required = false) String cookieToken,
            @RequestBody(required = false) LogoutRequest body,
            HttpServletRequest http) {

        String refreshToken = (cookieToken != null && !cookieToken.isBlank())
                ? cookieToken
                : (body != null ? body.refreshToken() : null);

        String ip = ClientIpResolver.resolve(http);
        authService.logout(refreshToken, ip);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshTokenCookie.clear().toString())
                .body(ApiResponse.ok(null, "Đăng xuất thành công"));
    }

    /**
     * Ẩn refreshToken khỏi response body vì giờ nó đã được set qua HttpOnly cookie.
     * Client vẫn nhận accessToken để gắn vào Authorization header.
     */
    private AuthResponse stripRefreshToken(AuthResponse auth) {
        TokenResponse tokenWithoutRefresh = new TokenResponse(
                auth.token().accessToken(),
                null,                    // refreshToken không trả trong body nữa
                auth.token().tokenType(),
                auth.token().expiresIn());
        return new AuthResponse(auth.user(), tokenWithoutRefresh);
    }
}
