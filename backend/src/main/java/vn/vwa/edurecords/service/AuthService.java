package vn.vwa.edurecords.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.vwa.edurecords.dto.request.LoginRequest;
import vn.vwa.edurecords.dto.request.RegisterRequest;
import vn.vwa.edurecords.dto.response.AuthResponse;
import vn.vwa.edurecords.dto.response.UserResponse;
import vn.vwa.edurecords.entity.User;
import vn.vwa.edurecords.entity.enums.Role;
import vn.vwa.edurecords.exception.BadRequestException;
import vn.vwa.edurecords.exception.ResourceNotFoundException;
import vn.vwa.edurecords.exception.UnauthorizedException;
import vn.vwa.edurecords.repository.UserRepository;
import vn.vwa.edurecords.security.JwtService;
import vn.vwa.edurecords.security.RefreshTokenService;
import vn.vwa.edurecords.security.TokenRevocationService;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final TokenRevocationService revocationService;
    private final RefreshTokenService refreshTokenService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                      JwtService jwtService, TokenRevocationService revocationService,
                      RefreshTokenService refreshTokenService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.revocationService = revocationService;
        this.refreshTokenService = refreshTokenService;
    }

    /**
     * Đăng nhập bằng username/password.
     *
     * Message lỗi luôn chung cho cả "sai username" và "sai password" để không lộ
     * tài khoản nào tồn tại. Trạng thái tài khoản bị vô hiệu hoá cũng trả cùng
     * message 401 để tránh thu thập thông tin tài khoản.
     */
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElse(null);

        if (user == null || !passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            // Cố tình không phân biệt 2 trường hợp trong message trả về client.
            log.warn("Đăng nhập thất bại cho username '{}'", request.getUsername());
            throw new UnauthorizedException("Sai tên đăng nhập hoặc mật khẩu.");
        }

        if (!Boolean.TRUE.equals(user.getIsActive())) {
            log.warn("Đăng nhập bị từ chối: tài khoản '{}' không hoạt động", user.getUsername());
            throw new UnauthorizedException("Sai tên đăng nhập hoặc mật khẩu.");
        }

        return issueTokens(user);
    }

    /**
     * Tạo tài khoản nhân viên mới. CHỈ được gọi từ endpoint có
     * {@code @PreAuthorize("hasRole('ADMIN')")} — không có đường đăng ký công khai.
     *
     * Vai trò luôn là {@link Role#STAFF}: cấp quyền quản trị là thao tác nhạy cảm
     * phải được quyết định riêng, không nhận giá trị từ request body.
     */
    @Transactional
    public User createUser(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BadRequestException("USERNAME_EXISTS", "Tên đăng nhập đã tồn tại.");
        }

        User user = User.builder()
                .username(request.getUsername())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .hoTen(request.getHoTen())
                .email(request.getEmail())
                .role(Role.STAFF)
                .isActive(true)
                .build();

        User saved = userRepository.save(user);
        log.info("Đã tạo tài khoản nhân viên '{}' (id={})", saved.getUsername(), saved.getId());
        return saved;
    }

    /**
     * Cấp access token + refresh token mới cho user và lưu refresh token vào Redis
     * dưới một family (dùng để phát hiện tái sử dụng token).
     */
    private AuthResponse issueTokens(User user) {
        String accessToken = jwtService.generateAccessToken(user.getUsername(), user.getRole().name());
        String refreshToken = jwtService.generateRefreshToken(user.getUsername());
        String familyId = refreshTokenService.generateFamilyId();

        refreshTokenService.storeRefreshTokenWithFamily(user.getUsername(), refreshToken, familyId);

        return new AuthResponse(
                UserResponse.fromEntity(user),
                new AuthResponse.TokenInfo(accessToken, refreshToken, jwtService.getAccessTokenTtlMs() / 1000)
        );
    }

    /**
     * Đổi refresh token (rotation).
     *
     * Nếu refresh token không còn tồn tại trong Redis thì có 2 khả năng:
     *  - đã dùng trước đó và đã bị revoke (reuse) → coi là bị đánh cắp;
     *  - hết hạn.
     * Cả hai đều dẫn tới việc vô hiệu hoá toàn bộ family token để kẻ xấu mất
     * quyền truy cập, buộc đăng nhập lại.
     */
    @Transactional(readOnly = true)
    public AuthResponse refresh(String refreshToken) {
        if (!jwtService.validateToken(refreshToken) || !jwtService.isRefreshToken(refreshToken)) {
            throw new UnauthorizedException("Refresh token không hợp lệ.");
        }

        String username = jwtService.extractUsername(refreshToken);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UnauthorizedException("Refresh token không hợp lệ."));

        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw new UnauthorizedException("Tài khoản đã bị vô hiệu hoá.");
        }

        RefreshTokenService.RefreshTokenInfo tokenInfo = refreshTokenService.validateAndParse(refreshToken);
        if (tokenInfo == null) {
            // Token không còn trong Redis. Nếu token này từng được cấp thì nhiều khả
            // năng nó đã bị dùng lại (đánh cắp) hoặc đã hết hạn. Dùng chung hậu quả:
            // thu hồi toàn bộ refresh token của user, buộc đăng nhập lại.
            log.warn("Refresh token không tồn tại hoặc đã bị thu hồi cho username '{}' — thu hồi toàn bộ phiên",
                    username);
            refreshTokenService.revokeAllUserTokens(username);
            throw new UnauthorizedException("Refresh token không hợp lệ hoặc đã hết hạn.");
        }

        if (!tokenInfo.username().equals(user.getUsername())) {
            log.warn("Refresh token không khớp subject: token={} user={}",
                    tokenInfo.username(), user.getUsername());
            throw new UnauthorizedException("Refresh token không hợp lệ.");
        }

        // Rotation: thu hồi token cũ trước khi cấp token mới.
        refreshTokenService.revokeToken(refreshToken, tokenInfo.familyId());

        return issueTokens(user);
    }

    /**
     * Đăng xuất: thu hồi access token hiện tại và toàn bộ refresh token của user.
     */
    @Transactional(readOnly = true)
    public void logout(String accessToken, String refreshToken) {
        if (accessToken != null && !accessToken.isBlank()) {
            String jti = jwtService.extractJti(accessToken);
            if (jti != null) {
                revocationService.revokeToken(jti);
            }
        }
        if (refreshToken != null && !refreshToken.isBlank()) {
            refreshTokenService.revokeToken(refreshToken, null);
        }
    }

    /** Vô hiệu hoá tài khoản và thu hồi toàn bộ phiên đăng nhập. */
    @Transactional
    public UserResponse deactivateUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("USER_NOT_FOUND",
                        "Không tìm thấy tài khoản: " + username));

        user.setIsActive(false);
        userRepository.save(user);
        refreshTokenService.revokeAllUserTokens(user.getUsername());
        log.info("Đã vô hiệu hoá tài khoản '{}'", username);

        return UserResponse.fromEntity(user);
    }
}
