package vn.vwa.edurecords.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

/**
 * Danh sách jti của access token đã bị thu hồi.
 *
 * TTL được đặt bằng access token TTL: token đã hết hạn thì không cần giữ trong
 * danh sách nữa, nên bảng blacklist không phình vô hạn.
 */
@Service
public class TokenRevocationService {

    private static final String REVOKED_PREFIX = "revoked:";

    private final StringRedisTemplate redisTemplate;
    private final Duration revocationTtl;

    public TokenRevocationService(
            StringRedisTemplate redisTemplate,
            @Value("${app.security.jwt.access-token-ttl:PT1H}") String accessTokenTtl) {
        this.redisTemplate = redisTemplate;
        this.revocationTtl = parseDuration(accessTokenTtl);
    }

    /** TTL của access token: giữ blacklist đúng bằng thời gian token còn hiệu lực. */
    private Duration parseDuration(String duration) {
        if (duration != null && duration.startsWith("P")) {
            try {
                return Duration.parse(duration);
            } catch (Exception ignored) {
                // Rơi xuống giá trị mặc định bên dưới.
            }
        }
        return Duration.ofHours(1);
    }

    public void revokeToken(String jti) {
        if (jti == null || jti.isBlank()) {
            return;
        }
        redisTemplate.opsForValue().set(REVOKED_PREFIX + jti, "true", revocationTtl);
    }

    public boolean isTokenRevoked(String jti) {
        if (jti == null || jti.isBlank()) {
            return false;
        }
        return Boolean.TRUE.equals(redisTemplate.hasKey(REVOKED_PREFIX + jti));
    }
}
