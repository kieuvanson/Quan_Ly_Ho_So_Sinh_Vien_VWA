package vn.vwa.edurecords.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import vn.vwa.edurecords.dto.request.LoginRequest;
import vn.vwa.edurecords.dto.request.RegisterRequest;
import vn.vwa.edurecords.dto.response.AuthResponse;
import vn.vwa.edurecords.dto.response.UserResponse;
import vn.vwa.edurecords.entity.User;
import vn.vwa.edurecords.entity.enums.Role;
import vn.vwa.edurecords.repository.UserRepository;
import vn.vwa.edurecords.security.JwtService;
import vn.vwa.edurecords.security.RefreshTokenService;
import vn.vwa.edurecords.security.TokenRevocationService;

@Service
public class AuthService {

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

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("Invalid username or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Invalid username or password");
        }

        if (!user.getIsActive()) {
            throw new RuntimeException("Account is disabled");
        }

        String accessToken = jwtService.generateAccessToken(user.getUsername(), user.getRole().name());
        String refreshToken = jwtService.generateRefreshToken(user.getUsername());
        String familyId = refreshTokenService.generateFamilyId();

        refreshTokenService.storeRefreshTokenWithFamily(user.getUsername(), refreshToken, familyId);

        return new AuthResponse(
                UserResponse.fromEntity(user),
                new AuthResponse.TokenInfo(accessToken, refreshToken, jwtService.getAccessTokenTtlMs() / 1000)
        );
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists");
        }

        String hashedPassword = passwordEncoder.encode(request.getPassword());

        Role role = Role.STAFF;
        if (request.getRole() != null) {
            try {
                role = Role.valueOf(request.getRole().toUpperCase());
            } catch (IllegalArgumentException e) {
                role = Role.STAFF;
            }
        }

        User user = User.builder()
                .username(request.getUsername())
                .passwordHash(hashedPassword)
                .hoTen(request.getHoTen())
                .email(request.getEmail())
                .role(role)
                .isActive(true)
                .build();

        user = userRepository.save(user);

        String accessToken = jwtService.generateAccessToken(user.getUsername(), user.getRole().name());
        String refreshToken = jwtService.generateRefreshToken(user.getUsername());
        String familyId = refreshTokenService.generateFamilyId();

        refreshTokenService.storeRefreshTokenWithFamily(user.getUsername(), refreshToken, familyId);

        return new AuthResponse(
                UserResponse.fromEntity(user),
                new AuthResponse.TokenInfo(accessToken, refreshToken, jwtService.getAccessTokenTtlMs() / 1000)
        );
    }

    public AuthResponse refresh(String refreshToken) {
        if (!jwtService.validateToken(refreshToken) || !jwtService.isRefreshToken(refreshToken)) {
            throw new RuntimeException("Invalid refresh token");
        }

        String username = jwtService.extractUsername(refreshToken);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!user.getIsActive()) {
            throw new RuntimeException("Account is disabled");
        }

        RefreshTokenService.RefreshTokenInfo tokenInfo = refreshTokenService.validateAndParse(refreshToken);
        if (tokenInfo == null) {
            throw new RuntimeException("Refresh token reuse detected");
        }

        refreshTokenService.revokeToken(refreshToken);

        String newAccessToken = jwtService.generateAccessToken(user.getUsername(), user.getRole().name());
        String newRefreshToken = jwtService.generateRefreshToken(user.getUsername());
        String newFamilyId = refreshTokenService.generateFamilyId();

        refreshTokenService.storeRefreshTokenWithFamily(user.getUsername(), newRefreshToken, newFamilyId);

        return new AuthResponse(
                UserResponse.fromEntity(user),
                new AuthResponse.TokenInfo(newAccessToken, newRefreshToken, jwtService.getAccessTokenTtlMs() / 1000)
        );
    }

    public void logout(String accessToken) {
        String jti = jwtService.extractJti(accessToken);
        revocationService.revokeToken(jti);
    }

    public String encodePassword(String rawPassword) {
        return passwordEncoder.encode(rawPassword);
    }
}
