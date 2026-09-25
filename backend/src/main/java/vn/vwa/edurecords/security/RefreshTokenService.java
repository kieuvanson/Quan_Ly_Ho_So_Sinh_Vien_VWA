package vn.vwa.edurecords.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.concurrent.TimeUnit;

@Service
public class RefreshTokenService {

    private final RedisTemplate<String, String> redisTemplate;
    private final Duration refreshTokenTtl;

    private static final String KEY_PREFIX = "refresh_token:";
    private static final String FAMILY_PREFIX = "refresh_family:";

    public RefreshTokenService(
            RedisTemplate<String, String> redisTemplate,
            @Value("${app.security.jwt.refresh-token-ttl:P7D}") String refreshTokenTtl) {
        this.redisTemplate = redisTemplate;
        this.refreshTokenTtl = parseDuration(refreshTokenTtl);
    }

    private Duration parseDuration(String duration) {
        if (duration.startsWith("PT")) {
            long ms = 0;
            if (duration.contains("H")) {
                ms += Long.parseLong(duration.split("H")[0].replace("PT", "")) * 3600000L;
            }
            if (duration.contains("D")) {
                String dayPart = duration.replaceAll(".*?(\\d+)D.*", "$1");
                ms += Long.parseLong(dayPart) * 86400000L;
            }
            if (duration.contains("M") && !duration.contains("D")) {
                String minPart = duration.replaceAll(".*?(\\d+)M.*", "$1");
                ms += Long.parseLong(minPart) * 60000L;
            }
            if (duration.contains("S")) {
                String secPart = duration.replaceAll(".*?(\\d+)S", "$1");
                ms += Long.parseLong(secPart) * 1000L;
            }
            return Duration.ofMillis(ms > 0 ? ms : 604800000L);
        }
        return Duration.ofDays(7);
    }

    public String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }

    public void storeRefreshToken(String username, String refreshToken) {
        String tokenHash = hashToken(refreshToken);
        String jti = extractJti(refreshToken);
        Instant issuedAt = Instant.now();

        String tokenKey = KEY_PREFIX + tokenHash;
        String tokenData = username + "|" + issuedAt.toEpochMilli() + "|" + jti;

        redisTemplate.opsForValue().set(tokenKey, tokenData, refreshTokenTtl);
    }

    public void storeRefreshTokenWithFamily(String username, String refreshToken, String familyId) {
        String tokenHash = hashToken(refreshToken);
        String jti = extractJti(refreshToken);
        Instant issuedAt = Instant.now();

        String tokenKey = KEY_PREFIX + tokenHash;
        String tokenData = username + "|" + issuedAt.toEpochMilli() + "|" + jti + "|" + familyId;

        redisTemplate.opsForValue().set(tokenKey, tokenData, refreshTokenTtl);

        redisTemplate.opsForSet().add(FAMILY_PREFIX + familyId, tokenHash);
        redisTemplate.expire(FAMILY_PREFIX + familyId, refreshTokenTtl);
    }

    public RefreshTokenInfo validateAndParse(String refreshToken) {
        String tokenHash = hashToken(refreshToken);
        String tokenKey = KEY_PREFIX + tokenHash;

        String data = redisTemplate.opsForValue().get(tokenKey);
        if (data == null) {
            return null;
        }

        String[] parts = data.split("\\|");
        if (parts.length < 3) {
            return null;
        }

        String username = parts[0];
        long issuedAtMs = Long.parseLong(parts[1]);
        String jti = parts[2];
        String familyId = parts.length > 3 ? parts[3] : null;

        return new RefreshTokenInfo(username, jti, Instant.ofEpochMilli(issuedAtMs), familyId);
    }

    public void revokeToken(String refreshToken) {
        String tokenHash = hashToken(refreshToken);
        String tokenKey = KEY_PREFIX + tokenHash;
        redisTemplate.delete(tokenKey);

        redisTemplate.opsForSet().remove(tokenKey, tokenHash);
    }

    public void revokeFamily(String familyId) {
        String familyKey = FAMILY_PREFIX + familyId;
        var tokenHashes = redisTemplate.opsForSet().members(familyKey);
        if (tokenHashes != null) {
            for (String tokenHash : tokenHashes) {
                redisTemplate.delete(KEY_PREFIX + tokenHash);
            }
        }
        redisTemplate.delete(familyKey);
    }

    public void revokeAllUserTokens(String username) {
        var keys = redisTemplate.keys(KEY_PREFIX + "*");
        if (keys != null) {
            for (String key : keys) {
                String data = redisTemplate.opsForValue().get(key);
                if (data != null && data.startsWith(username + "|")) {
                    redisTemplate.delete(key);
                }
            }
        }
    }

    public void revokeReusedToken(String refreshToken, String familyId) {
        revokeFamily(familyId);
    }

    public String generateFamilyId() {
        return java.util.UUID.randomUUID().toString();
    }

    public boolean isTokenStored(String refreshToken) {
        String tokenHash = hashToken(refreshToken);
        String tokenKey = KEY_PREFIX + tokenHash;
        return Boolean.TRUE.equals(redisTemplate.hasKey(tokenKey));
    }

    private String extractJti(String token) {
        String[] parts = token.split("\\.");
        if (parts.length < 3) {
            return java.util.UUID.randomUUID().toString();
        }
        try {
            String payload = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);
            int jtiIndex = payload.indexOf("\"jti\"");
            if (jtiIndex >= 0) {
                int start = payload.indexOf("\"", jtiIndex + 5) + 1;
                int end = payload.indexOf("\"", start);
                return payload.substring(start, end);
            }
        } catch (Exception e) {
        }
        return java.util.UUID.randomUUID().toString();
    }

    public record RefreshTokenInfo(
            String username,
            String jti,
            Instant issuedAt,
            String familyId
    ) {}
}
