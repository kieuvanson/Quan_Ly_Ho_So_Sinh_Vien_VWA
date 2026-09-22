package vn.vwa.edurecords.security;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import vn.vwa.edurecords.entity.User;

/**
 * Tạo và parse JWT (HS256).
 *
 * <p>Mỗi token mang 1 {@code jti} (UUID) và {@code fid} (familyId) để:
 * <ul>
 *   <li>jti: phục vụ revocation list trong Redis.</li>
 *   <li>fid: xác định chuỗi refresh token của 1 phiên đăng nhập, dùng để
 *       phát hiện reuse & revoke toàn bộ family.</li>
 * </ul>
 */
@Service
public class JwtService {

    private static final String CLAIM_TYPE = "type";
    private static final String CLAIM_ROLE = "role";
    private static final String CLAIM_USERNAME = "username";
    private static final String CLAIM_FAMILY = "fid";
    private static final String TYPE_ACCESS = "access";
    private static final String TYPE_REFRESH = "refresh";

    private final SecretKey signingKey;
    private final Duration accessTokenTtl;
    private final Duration refreshTokenTtl;
    private final String issuer;

    public JwtService(
            @Value("${app.security.jwt.secret}") String secret,
            @Value("${app.security.jwt.access-token-ttl}") Duration accessTokenTtl,
            @Value("${app.security.jwt.refresh-token-ttl}") Duration refreshTokenTtl,
            @Value("${app.security.jwt.issuer:vwa-edurecords}") String issuer) {
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException("JWT secret không được để trống (app.security.jwt.secret)");
        }
        this.signingKey = deriveKey(secret);
        this.accessTokenTtl = accessTokenTtl;
        this.refreshTokenTtl = refreshTokenTtl;
        this.issuer = issuer;
    }

    /**
     * Derive signing key 32 bytes từ secret bất kỳ bằng SHA-256.
     * Lý do: cho phép user cấu hình secret ngắn (vd: "linhxinhgai") mà vẫn đảm bảo
     * HS256 yêu cầu >= 32 bytes. Cùng 1 secret -> cùng 1 key -> token verify được.
     */
    private static SecretKey deriveKey(String secret) {
        try {
            byte[] hash = MessageDigest.getInstance("SHA-256")
                    .digest(secret.getBytes(StandardCharsets.UTF_8));
            return Keys.hmacShaKeyFor(hash);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 không khả dụng trên JVM này", ex);
        }
    }

    public String generateAccessToken(User user, String familyId) {
        Instant now = Instant.now();
        Instant expiry = now.plus(accessTokenTtl);
        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .issuer(issuer)
                .subject(user.getId().toString())
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry))
                .claims(Map.of(
                        CLAIM_TYPE, TYPE_ACCESS,
                        CLAIM_ROLE, user.getRole().name(),
                        CLAIM_USERNAME, user.getUsername(),
                        CLAIM_FAMILY, familyId))
                .signWith(signingKey, Jwts.SIG.HS256)
                .compact();
    }

    public String generateRefreshToken(User user, String familyId) {
        Instant now = Instant.now();
        Instant expiry = now.plus(refreshTokenTtl);
        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .issuer(issuer)
                .subject(user.getId().toString())
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry))
                .claims(Map.of(
                        CLAIM_TYPE, TYPE_REFRESH,
                        CLAIM_USERNAME, user.getUsername(),
                        CLAIM_FAMILY, familyId))
                .signWith(signingKey, Jwts.SIG.HS256)
                .compact();
    }

    public long getAccessTokenTtlSeconds() {
        return accessTokenTtl.toSeconds();
    }

    public Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .requireIssuer(issuer)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public <T> T extractClaim(String token, Function<Claims, T> resolver) {
        return resolver.apply(parseClaims(token));
    }

    public String extractUsername(String token) {
        return extractClaim(token, claims -> claims.get(CLAIM_USERNAME, String.class));
    }

    public String extractRole(String token) {
        return extractClaim(token, claims -> claims.get(CLAIM_ROLE, String.class));
    }

    public String extractTokenType(String token) {
        return extractClaim(token, claims -> claims.get(CLAIM_TYPE, String.class));
    }

    public String extractFamilyId(String token) {
        return extractClaim(token, claims -> claims.get(CLAIM_FAMILY, String.class));
    }

    public String extractJti(String token) {
        return extractClaim(token, Claims::getId);
    }

    public UUID extractUserId(String token) {
        String subject = extractClaim(token, Claims::getSubject);
        return UUID.fromString(subject);
    }

    public boolean isAccessToken(String token) {
        return TYPE_ACCESS.equals(extractTokenType(token));
    }

    public boolean isRefreshToken(String token) {
        return TYPE_REFRESH.equals(extractTokenType(token));
    }

    public boolean isTokenValid(String token) {
        try {
            Claims claims = parseClaims(token);
            return claims.getExpiration().after(Date.from(Instant.now()));
        } catch (JwtException | IllegalArgumentException ex) {
            return false;
        }
    }
}
