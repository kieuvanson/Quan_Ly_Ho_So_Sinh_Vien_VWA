package vn.vwa.edurecords.security;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
public class TokenRevocationService {

    private final RedisTemplate<String, String> redisTemplate;
    private static final Duration REVOCATION_TTL = Duration.ofDays(7);

    public TokenRevocationService(RedisTemplate<String, String> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public void revokeToken(String jti) {
        redisTemplate.opsForValue().set("revoked:" + jti, "true", REVOCATION_TTL);
    }

    public boolean isTokenRevoked(String jti) {
        return Boolean.TRUE.equals(redisTemplate.hasKey("revoked:" + jti));
    }
}
