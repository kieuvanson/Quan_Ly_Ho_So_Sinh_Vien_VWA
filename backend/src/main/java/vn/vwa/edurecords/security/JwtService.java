package vn.vwa.edurecords.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.Map;
import java.util.UUID;

@Service
public class JwtService {

    private static final Logger log = LoggerFactory.getLogger(JwtService.class);

    private static final String TYPE_ACCESS = "access";
    private static final String TYPE_REFRESH = "refresh";
    private static final String CLAIM_ROLE = "role";
    private static final String CLAIM_TYPE = "type";

    /** Chấp nhận lệch thời gian nhỏ giữa server và nơi cấp token. */
    private static final Duration CLOCK_SKEW = Duration.ofSeconds(30);

    private final SecretKey secretKey;
    private final Duration accessTokenTtl;
    private final Duration refreshTokenTtl;
    private final String issuer;

    public JwtService(
            @Value("${app.security.jwt.secret}") String secret,
            @Value("${app.security.jwt.access-token-ttl:PT1H}") String accessTokenTtl,
            @Value("${app.security.jwt.refresh-token-ttl:P7D}") String refreshTokenTtl,
            @Value("${app.security.jwt.issuer:vwa-edurecords}") String issuer) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessTokenTtl = parseDuration(accessTokenTtl, Duration.ofHours(1));
        this.refreshTokenTtl = parseDuration(refreshTokenTtl, Duration.ofDays(7));
        this.issuer = issuer;
    }

    /** Parse ISO-8601 duration (PT1H, P7D, PT30M). Không nhận đơn vị ngày dạng P1D? Hỗ trợ P7D. */
    private Duration parseDuration(String value, Duration fallback) {
        if (value == null || !value.startsWith("P")) {
            return fallback;
        }
        try {
            return Duration.parse(value);
        } catch (Exception e) {
            log.warn("Không parse được TTL '{}', dùng giá trị mặc định {}", value, fallback);
            return fallback;
        }
    }

    public String generateAccessToken(String username, String role) {
        return buildToken(username, accessTokenTtl, Map.of(CLAIM_ROLE, role, CLAIM_TYPE, TYPE_ACCESS));
    }

    public String generateRefreshToken(String username) {
        return buildToken(username, refreshTokenTtl, Map.of(CLAIM_TYPE, TYPE_REFRESH));
    }

    private String buildToken(String subject, Duration ttl, Map<String, String> claims) {
        Instant now = Instant.now();
        var builder = Jwts.builder()
                .subject(subject)
                .id(UUID.randomUUID().toString())
                .issuer(issuer)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(ttl)));

        claims.forEach(builder::claim);
        return builder.signWith(secretKey).compact();
    }

    public String extractUsername(String token) {
        return extractClaims(token).getSubject();
    }

    public String extractRole(String token) {
        return extractClaims(token).get(CLAIM_ROLE, String.class);
    }

    public String extractJti(String token) {
        return extractClaims(token).getId();
    }

    /**
     * Kiểm tra chữ ký, issuer và thời hạn.
     *
     * @return true nếu token hợp lệ.
     */
    public boolean validateToken(String token) {
        try {
            extractClaims(token);
            return true;
        } catch (ExpiredJwtException e) {
            // Hết hạn là trạng thái bình thường, không cần log mức WARN.
            return false;
        } catch (JwtException | IllegalArgumentException e) {
            log.debug("Token không hợp lệ: {}", e.getMessage());
            return false;
        }
    }

    public boolean isAccessToken(String token) {
        return hasType(token, TYPE_ACCESS);
    }

    public boolean isRefreshToken(String token) {
        return hasType(token, TYPE_REFRESH);
    }

    private boolean hasType(String token, String expectedType) {
        try {
            return expectedType.equals(extractClaims(token).get(CLAIM_TYPE, String.class));
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    /**
     * Parse và kiểm tra token.
     *
     * Bắt buộc {@code requireIssuer}: token ký đúng secret nhưng phát hành bởi
     * hệ thống khác sẽ bị từ chối, tránh chấp nhận token dùng chung khoá.
     */
    private Claims extractClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .requireIssuer(issuer)
                .clockSkewSeconds(CLOCK_SKEW.toSeconds())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public long getAccessTokenTtlMs() {
        return accessTokenTtl.toMillis();
    }

    public long getRefreshTokenTtlMs() {
        return refreshTokenTtl.toMillis();
    }
}
