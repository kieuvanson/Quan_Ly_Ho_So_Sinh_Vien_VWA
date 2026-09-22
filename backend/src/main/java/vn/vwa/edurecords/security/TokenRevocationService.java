package vn.vwa.edurecords.security;

import java.time.Duration;
import java.time.Instant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import io.jsonwebtoken.Claims;
import vn.vwa.edurecords.exception.UnauthorizedException;

/**
 * Quản lý danh sách JWT đã bị thu hồi (revoked) bằng Redis.
 *
 * <p>Thiết kế: JWT vẫn là stateless, nhưng ta cần 1 cách để:
 * <ul>
 *   <li>Đăng xuất (logout) -> thu hồi refresh token hiện tại, không cho dùng nữa.</li>
 *   <li>Phát hiện REUSE: nếu refresh token cũ đã được rotate mà bị dùng lại
 *       -> thu hồi toàn bộ family.</li>
 *   <li>Tuỳ chọn thu hồi cả access token khi cần (vd: đổi mật khẩu).</li>
 * </ul>
 *
 * <p>Cấu trúc key trong Redis:
 * <pre>
 *   revoked:jti:&lt;jti&gt;          -&gt; "1"               TTL = còn lại của refresh token
 *   revoked:family:&lt;familyId&gt;   -&gt; "1"               TTL = còn lại của refresh token
 * </pre>
 *
 * <p>So với cách cũ (lưu refresh token + familyId vào bảng USERS), cách này:
 * <ul>
 *   <li>Không phải ghi DB mỗi lần login/refresh/logout.</li>
 *   <li>Scale tốt khi có nhiều instance (Redis là shared state).</li>
 *   <li>Tự động xoá theo TTL, không cần cleanup job.</li>
 * </ul>
 */
@Service
public class TokenRevocationService {

    private static final Logger log = LoggerFactory.getLogger(TokenRevocationService.class);

    private static final String KEY_JTI = "revoked:jti:";
    private static final String KEY_FAMILY = "revoked:family:";

    private final StringRedisTemplate redis;
    private final JwtService jwtService;

    public TokenRevocationService(StringRedisTemplate redis, JwtService jwtService) {
        this.redis = redis;
        this.jwtService = jwtService;
    }

    /**
     * Trả về {@code true} nếu refresh token đã bị thu hồi (đã logout, đã rotate, hoặc reuse).
     * Ném {@link UnauthorizedException} nếu có dấu hiệu reuse đáng ngờ trong cùng family.
     */
    public boolean isRevoked(String refreshToken) {
        Claims claims = jwtService.parseClaims(refreshToken);
        String jti = claims.getId();
        if (jti == null || jti.isBlank()) {
            return false;
        }
        Boolean exists = redis.hasKey(KEY_JTI + jti);
        return Boolean.TRUE.equals(exists);
    }

    /**
     * Thu hồi 1 refresh token (sau khi đã rotate sang token mới, hoặc logout).
     * TTL = thời gian còn lại của token, sau đó Redis tự dọn.
     */
    public void revokeToken(String refreshToken) {
        revokeToken(refreshToken, KEY_JTI);
    }

    private void revokeToken(String token, String keyPrefix) {
        try {
            Claims claims = jwtService.parseClaims(token);
            String jti = claims.getId();
            if (jti == null || jti.isBlank()) {
                return;
            }
            Instant expiry = claims.getExpiration().toInstant();
            Duration ttl = Duration.between(Instant.now(), expiry);
            if (ttl.isNegative() || ttl.isZero()) {
                return;
            }
            redis.opsForValue().set(keyPrefix + jti, "1", ttl);
        } catch (Exception ex) {
            log.warn("Không thể thu hồi token: {}", ex.getMessage());
        }
    }

    /**
     * Thu hồi TOÀN BỘ family (khi phát hiện reuse). Đánh dấu family là revoked,
     * đồng thời revoke luôn token hiện tại.
     */
    public void revokeFamily(String familyId, String currentToken) {
        if (familyId == null || familyId.isBlank()) {
            return;
        }
        try {
            Claims claims = jwtService.parseClaims(currentToken);
            Instant expiry = claims.getExpiration().toInstant();
            Duration ttl = Duration.between(Instant.now(), expiry);
            if (ttl.isNegative() || ttl.isZero()) {
                ttl = Duration.ofMinutes(5); // fallback ngắn để đảm bảo có hiệu lực
            }
            redis.opsForValue().set(KEY_FAMILY + familyId, "1", ttl);
        } catch (Exception ex) {
            log.warn("Không thể thu hồi family {}: {}", familyId, ex.getMessage());
        }
        revokeToken(currentToken, KEY_JTI);
    }

    public boolean isFamilyRevoked(String familyId) {
        if (familyId == null || familyId.isBlank()) {
            return false;
        }
        Boolean exists = redis.hasKey(KEY_FAMILY + familyId);
        return Boolean.TRUE.equals(exists);
    }
}
