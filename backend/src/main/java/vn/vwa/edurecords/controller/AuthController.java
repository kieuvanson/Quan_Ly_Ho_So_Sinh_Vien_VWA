package vn.vwa.edurecords.controller;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.vwa.edurecords.dto.request.LoginRequest;
import vn.vwa.edurecords.dto.request.RegisterRequest;
import vn.vwa.edurecords.dto.response.ApiResponse;
import vn.vwa.edurecords.dto.response.AuthResponse;
import vn.vwa.edurecords.service.AuthService;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final boolean cookieSecure;
    private final String cookieSameSite;

    private static final String REFRESH_TOKEN_COOKIE = "refresh_token";

    public AuthController(AuthService authService,
                          @Value("${app.security.cookie.secure:false}") boolean cookieSecure,
                          @Value("${app.security.cookie.samesite:Lax}") String cookieSameSite) {
        this.authService = authService;
        this.cookieSecure = cookieSecure;
        this.cookieSameSite = cookieSameSite;
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request,
                                                          HttpServletResponse response) {
        AuthResponse authResponse = authService.login(request);
        String refreshToken = authResponse.getToken().getRefreshToken();
        authResponse.getToken().setRefreshToken(null);
        addRefreshTokenCookie(response, refreshToken);
        return ResponseEntity.ok(ApiResponse.success(authResponse));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request,
                                                             HttpServletResponse response) {
        AuthResponse authResponse = authService.register(request);
        String refreshToken = authResponse.getToken().getRefreshToken();
        authResponse.getToken().setRefreshToken(null);
        addRefreshTokenCookie(response, refreshToken);
        return ResponseEntity.ok(ApiResponse.success(authResponse));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(HttpServletRequest request,
                                                            HttpServletResponse response) {
        String refreshToken = extractRefreshTokenFromCookie(request);
        if (refreshToken == null) {
            return ResponseEntity.status(401).body(ApiResponse.error(401, "NO_REFRESH_TOKEN", "Không tìm thấy refresh token"));
        }

        AuthResponse authResponse = authService.refresh(refreshToken);

        deleteRefreshTokenCookie(response);
        String newRefreshToken = authResponse.getToken().getRefreshToken();
        authResponse.getToken().setRefreshToken(null);
        addRefreshTokenCookie(response, newRefreshToken);

        return ResponseEntity.ok(ApiResponse.success(authResponse));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Map<String, String>>> logout(HttpServletRequest request,
                                                                  HttpServletResponse response) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            authService.logout(token);
        }
        deleteRefreshTokenCookie(response);
        return ResponseEntity.ok(ApiResponse.success("Đăng xuất thành công", Map.of("message", "Logged out successfully")));
    }

    @PostMapping("/encode-password")
    public ResponseEntity<Map<String, String>> encodePassword(@RequestBody Map<String, String> body) {
        String password = body.get("password");
        return ResponseEntity.ok(Map.of("bcryptHash", authService.encodePassword(password)));
    }

    private void addRefreshTokenCookie(HttpServletResponse response, String refreshToken) {
        Cookie cookie = new Cookie(REFRESH_TOKEN_COOKIE, refreshToken);
        cookie.setHttpOnly(true);
        cookie.setSecure(cookieSecure);
        cookie.setPath("/api/auth/refresh");
        cookie.setMaxAge(7 * 24 * 60 * 60);
        cookie.setAttribute("SameSite", cookieSameSite);
        response.addCookie(cookie);
    }

    private String extractRefreshTokenFromCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }
        for (Cookie cookie : cookies) {
            if (REFRESH_TOKEN_COOKIE.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }

    private void deleteRefreshTokenCookie(HttpServletResponse response) {
        Cookie cookie = new Cookie(REFRESH_TOKEN_COOKIE, "");
        cookie.setHttpOnly(true);
        cookie.setSecure(cookieSecure);
        cookie.setPath("/api/auth/refresh");
        cookie.setMaxAge(0);
        cookie.setAttribute("SameSite", cookieSameSite);
        response.addCookie(cookie);
    }
}
