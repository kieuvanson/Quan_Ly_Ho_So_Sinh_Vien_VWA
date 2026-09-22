package vn.vwa.edurecords.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.vwa.edurecords.dto.request.LoginRequest;
import vn.vwa.edurecords.dto.response.AuthResponse;
import vn.vwa.edurecords.dto.response.TokenResponse;
import vn.vwa.edurecords.dto.response.UserResponse;
import vn.vwa.edurecords.entity.User;
import vn.vwa.edurecords.entity.enums.Role;
import vn.vwa.edurecords.exception.UnauthorizedException;
import vn.vwa.edurecords.repository.UserRepository;
import vn.vwa.edurecords.security.AuditLogger;
import vn.vwa.edurecords.security.JwtService;
import vn.vwa.edurecords.security.TokenRevocationService;

/**
 * Auth flow:
 * <ul>
 *   <li>JWT là STATELESS — không lưu refresh token / familyId trong DB.</li>
 *   <li>Token family (chuỗi refresh liên tiếp) được lưu trong Redis như
 *       <i>revocation marker</i>, không phải lưu token thật.</li>
 *   <li>Mỗi lần refresh: revoke token cũ (jti), cấp cặp token mới với cùng familyId.</li>
 *   <li>Phát hiện REUSE (token cũ đã bị revoke mà bị dùng lại): revoke toàn bộ family.</li>
 * </ul>
 */
@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private static final String BEARER_TYPE = "Bearer";
    private static final String FAMILY_CLAIM = "fid";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final TokenRevocationService revocationService;
    private final AuditLogger auditLogger;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       TokenRevocationService revocationService,
                       AuditLogger auditLogger) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.revocationService = revocationService;
        this.auditLogger = auditLogger;
    }

    @Transactional
    public AuthResponse login(LoginRequest request, String clientIp) {
        try {
            User user = userRepository.findByUsername(request.username())
                    .orElseThrow(() -> new UnauthorizedException("INVALID_CREDENTIALS",
                            "Tên đăng nhập hoặc mật khẩu không đúng"));

            if (!Boolean.TRUE.equals(user.getIsActive())) {
                auditLogger.event("LOGIN", user.getUsername(), clientIp, false, "ACCOUNT_DISABLED");
                throw new UnauthorizedException("ACCOUNT_DISABLED",
                        "Tài khoản đã bị vô hiệu hóa");
            }

            if (user.getRole() != Role.ADMIN) {
                auditLogger.event("LOGIN", user.getUsername(), clientIp, false, "INSUFFICIENT_ROLE");
                throw new UnauthorizedException("INSUFFICIENT_ROLE",
                        "Tài khoản không có quyền truy cập hệ thống");
            }

            if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
                auditLogger.event("LOGIN", request.username(), clientIp, false, "INVALID_PASSWORD");
                throw new UnauthorizedException("INVALID_CREDENTIALS",
                        "Tên đăng nhập hoặc mật khẩu không đúng");
            }

            String familyId = java.util.UUID.randomUUID().toString();
            AuthResponse response = issueNewTokenPair(user, familyId);
            auditLogger.event("LOGIN", user.getUsername(), clientIp, true, null);
            return response;
        } catch (UnauthorizedException ex) {
            if ("INVALID_CREDENTIALS".equals(ex.getCode()) && request.username() != null) {
                auditLogger.event("LOGIN", request.username(), clientIp, false,
                        "USER_NOT_FOUND_OR_BAD_PASSWORD");
            }
            throw ex;
        }
    }

    @Transactional
    public AuthResponse refresh(String refreshToken, String clientIp) {
        if (refreshToken == null || refreshToken.isBlank()) {
            auditLogger.event("REFRESH", null, clientIp, false, "MISSING_REFRESH_TOKEN");
            throw new UnauthorizedException("MISSING_REFRESH_TOKEN",
                    "Refresh token không được để trống");
        }
        if (!jwtService.isTokenValid(refreshToken) || !jwtService.isRefreshToken(refreshToken)) {
            auditLogger.event("REFRESH", null, clientIp, false, "INVALID_OR_EXPIRED_TOKEN");
            throw new UnauthorizedException("INVALID_REFRESH_TOKEN",
                    "Refresh token không hợp lệ hoặc đã hết hạn");
        }

        // 1. Token đã bị thu hồi (revoked) -> REUSE DETECTED
        if (revocationService.isRevoked(refreshToken)) {
            String familyId = jwtService.extractFamilyId(refreshToken);
            log.warn("REFRESH_REUSE_DETECTED family={} - revoking entire family", familyId);
            revocationService.revokeFamily(familyId, refreshToken);
            String username = safeUsername(refreshToken);
            auditLogger.event("REFRESH", username, clientIp, false, "REUSE_DETECTED_FAMILY_REVOKED");
            throw new UnauthorizedException("REFRESH_TOKEN_REVOKED",
                    "Refresh token đã bị thu hồi - phát hiện reuse, vui lòng đăng nhập lại");
        }

        // 2. Family đã bị revoke (vd: đổi mật khẩu, admin khóa account)
        String familyId = jwtService.extractFamilyId(refreshToken);
        if (revocationService.isFamilyRevoked(familyId)) {
            String username = safeUsername(refreshToken);
            auditLogger.event("REFRESH", username, clientIp, false, "FAMILY_REVOKED");
            throw new UnauthorizedException("REFRESH_TOKEN_REVOKED",
                    "Phiên đăng nhập đã bị thu hồi, vui lòng đăng nhập lại");
        }

        String username = jwtService.extractUsername(refreshToken);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> {
                    auditLogger.event("REFRESH", username, clientIp, false, "USER_NOT_FOUND");
                    return new UnauthorizedException("USER_NOT_FOUND", "Người dùng không tồn tại");
                });

        if (!Boolean.TRUE.equals(user.getIsActive())) {
            revocationService.revokeFamily(familyId, refreshToken);
            auditLogger.event("REFRESH", username, clientIp, false, "ACCOUNT_DISABLED");
            throw new UnauthorizedException("ACCOUNT_DISABLED",
                    "Tài khoản đã bị vô hiệu hóa");
        }

        if (user.getRole() != Role.ADMIN) {
            revocationService.revokeFamily(familyId, refreshToken);
            auditLogger.event("REFRESH", username, clientIp, false, "INSUFFICIENT_ROLE");
            throw new UnauthorizedException("INSUFFICIENT_ROLE",
                    "Tài khoản không có quyền truy cập hệ thống");
        }

        // 3. OK -> revoke token cũ, cấp cặp mới với cùng family
        revocationService.revokeToken(refreshToken);
        AuthResponse response = issueNewTokenPair(user, familyId);
        auditLogger.event("REFRESH", username, clientIp, true, null);
        return response;
    }

    @Transactional
    public void logout(String refreshToken, String clientIp) {
        if (refreshToken == null || refreshToken.isBlank()) {
            return;
        }
        if (!jwtService.isTokenValid(refreshToken) || !jwtService.isRefreshToken(refreshToken)) {
            return;
        }
        String username = safeUsername(refreshToken);
        String familyId = jwtService.extractFamilyId(refreshToken);
        revocationService.revokeFamily(familyId, refreshToken);
        if (username != null) {
            auditLogger.event("LOGOUT", username, clientIp, true, null);
        }
    }

    private String safeUsername(String refreshToken) {
        try {
            return jwtService.extractUsername(refreshToken);
        } catch (Exception ex) {
            return null;
        }
    }

    private AuthResponse issueNewTokenPair(User user, String familyId) {
        String accessToken = jwtService.generateAccessToken(user, familyId);
        String refreshToken = jwtService.generateRefreshToken(user, familyId);

        TokenResponse token = new TokenResponse(
                accessToken,
                refreshToken,
                BEARER_TYPE,
                jwtService.getAccessTokenTtlSeconds());

        UserResponse userResponse = new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getHoTen(),
                user.getEmail(),
                user.getRole().name());

        return new AuthResponse(userResponse, token);
    }
}
