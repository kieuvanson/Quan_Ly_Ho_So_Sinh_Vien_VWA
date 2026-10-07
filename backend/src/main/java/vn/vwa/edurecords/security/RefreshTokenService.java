package vn.vwa.edurecords.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.Cursor;
import org.springframework.data.redis.core.ScanOptions;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.util.Base64;

/**
 * Quản lý vòng đời refresh token trong Redis.
 *
 * <h3>Cấu trúc dữ liệu</h3>
 * <ul>
 *   <li>{@code refresh_token:{sha256(token)}} → {@code username|issuedAt|jti|familyId}</li>
 *   <li>{@code refresh_family:{familyId}} → SET các hash token thuộc cùng family</li>
 * </ul>
 *
 * <p>Mỗi lần đổi token tạo một family mới. Nếu một token đã bị thu hồi bị dùng lại
 * thì đó là dấu hiệu token bị đánh cắp: {@link #revokeFamily(String)} vô hiệu hoá
 * toàn bộ family để kẻ xấu mất quyền truy cập.
 */
@Service
public class RefreshTokenService {

    private static final String KEY_PREFIX = "refresh_token:";
    private static final String FAMILY_PREFIX = "refresh_family:";
    private static final String USER_FAMILY_PREFIX = "refresh_user:";
    private static final int SCAN_BATCH = 500;

    private final StringRedisTemplate redisTemplate;
    private final Duration refreshTokenTtl;

    public RefreshTokenService(
            StringRedisTemplate redisTemplate,
            @Value("${app.security.jwt.refresh-token-ttl:P7D}") String refreshTokenTtl) {
        this.redisTemplate = redisTemplate;
        this.refreshTokenTtl = parseDuration(refreshTokenTtl);
    }

    /**
     * Parse ISO-8601 duration (P7D, PT1H, P30M, PT45S) thành {@link Duration}.
     * Dùng {@link Duration#parse} của Java thay vì tách chuỗi thủ công.
     */
    private Duration parseDuration(String duration) {
        if (duration == null || !duration.startsWith("P")) {
            return Duration.ofDays(7);
        }
        try {
            return Duration.parse(duration);
        } catch (Exception e) {
            return Duration.ofDays(7);
        }
    }

    /** SHA-256 + Base64 để không lưu token dạng rõ trong Redis. */
    public String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 không khả dụng", e);
        }
    }

    /**
     * Lưu refresh token mới kèm family, và đăng ký family vào danh sách family
     * của user để thu hồi toàn bộ phiên khi cần.
     */
    public void storeRefreshTokenWithFamily(String username, String refreshToken, String familyId) {
        String tokenHash = hashToken(refreshToken);
        String jti = extractJti(refreshToken);
        long issuedAtMs = System.currentTimeMillis();

        String tokenData = username + "|" + issuedAtMs + "|" + jti + "|" + familyId;
        redisTemplate.opsForValue().set(KEY_PREFIX + tokenHash, tokenData, refreshTokenTtl);

        redisTemplate.opsForSet().add(FAMILY_PREFIX + familyId, tokenHash);
        redisTemplate.expire(FAMILY_PREFIX + familyId, refreshTokenTtl);

        // familyId -> {user} để revokeAllUserTokens không phải SCAN toàn bộ key.
        redisTemplate.opsForSet().add(USER_FAMILY_PREFIX + username, familyId);
        redisTemplate.expire(USER_FAMILY_PREFIX + username, refreshTokenTtl);
    }

    /**
     * Đọc thông tin refresh token. Trả {@code null} nếu token không tồn tại
     * trong Redis (đã thu hồi hoặc hết hạn).
     */
    public RefreshTokenInfo validateAndParse(String refreshToken) {
        String data = redisTemplate.opsForValue().get(KEY_PREFIX + hashToken(refreshToken));
        if (data == null) {
            return null;
        }

        String[] parts = data.split("\\|");
        if (parts.length < 3) {
            return null;
        }

        return new RefreshTokenInfo(
                parts[0],
                parts[2],
                Long.parseLong(parts[1]),
                parts.length > 3 ? parts[3] : null
        );
    }

    /**
     * Thu hồi một refresh token.
     *
     * @param familyId family chứa token; nếu biết thì gỡ hash khỏi set của family.
     *               Truyền {@code null} nếu không xác định được (ví dụ khi logout).
     */
    public void revokeToken(String refreshToken, String familyId) {
        String tokenHash = hashToken(refreshToken);
        redisTemplate.delete(KEY_PREFIX + tokenHash);

        if (familyId != null && !familyId.isBlank()) {
            redisTemplate.opsForSet().remove(FAMILY_PREFIX + familyId, tokenHash);
        }
    }

    /**
     * Thu hồi toàn bộ token thuộc một family. Dùng khi phát hiện tái sử dụng
     * refresh token (nghi vấn đánh cắp).
     */
    public void revokeFamily(String familyId) {
        if (familyId == null || familyId.isBlank()) {
            return;
        }
        String familyKey = FAMILY_PREFIX + familyId;
        var tokenHashes = redisTemplate.opsForSet().members(familyKey);
        if (tokenHashes != null) {
            for (String tokenHash : tokenHashes) {
                redisTemplate.delete(KEY_PREFIX + tokenHash);
            }
        }
        redisTemplate.delete(familyKey);
    }

    /**
     * Thu hồi toàn bộ refresh token của một user, không dùng lệnh KEYS.
     *
     * Cách làm: đọc set {@code refresh_user:{username}} để biết các family thuộc
     * user, rồi thu hồi từng family. Set này được duy trì trong
     * {@link #storeRefreshTokenWithFamily}.
     */
    public void revokeAllUserTokens(String username) {
        String userFamilyKey = USER_FAMILY_PREFIX + username;
        var familyIds = redisTemplate.opsForSet().members(userFamilyKey);
        if (familyIds == null || familyIds.isEmpty()) {
            // Dữ liệu cũ hoặc token được tạo trước khi có index theo user:
            // quét theo SCAN thay vì KEYS để không chặn Redis.
            revokeByScan(username);
            redisTemplate.delete(userFamilyKey);
            return;
        }

        for (String familyId : familyIds) {
            revokeFamily(familyId);
        }
        redisTemplate.delete(userFamilyKey);
    }

    /** Dự phòng: quét key bằng SCAN (không block) cho dữ liệu tạo trước index theo user. */
    private void revokeByScan(String username) {
        ScanOptions options = ScanOptions.scanOptions().match(KEY_PREFIX + "*").count(SCAN_BATCH).build();
        try (Cursor<String> cursor = redisTemplate.scan(options)) {
            while (cursor.hasNext()) {
                String key = cursor.next();
                String data = redisTemplate.opsForValue().get(key);
                if (data != null && data.startsWith(username + "|")) {
                    redisTemplate.delete(key);
                }
            }
        }
    }

    public String generateFamilyId() {
        return java.util.UUID.randomUUID().toString();
    }

    public boolean isTokenStored(String refreshToken) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(KEY_PREFIX + hashToken(refreshToken)));
    }

    public Duration getRefreshTokenTtl() {
        return refreshTokenTtl;
    }

    /** Lấy jti từ payload JWT mà không cần verify chữ ký (dùng chỉ để định danh). */
    private String extractJti(String token) {
        String[] parts = token.split("\\.");
        if (parts.length < 2) {
            return java.util.UUID.randomUUID().toString();
        }
        try {
            String payload = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);
            int jtiIndex = payload.indexOf("\"jti\"");
            if (jtiIndex >= 0) {
                int start = payload.indexOf('"', jtiIndex + 5) + 1;
                int end = payload.indexOf('"', start);
                if (start > 0 && end > start) {
                    return payload.substring(start, end);
                }
            }
        } catch (Exception ignored) {
            // Token không phải JWT hợp lệ — dùng UUID tạm, token sẽ bị từ chối ở validate.
        }
        return java.util.UUID.randomUUID().toString();
    }

    /**
     * Thông tin refresh token đã lưu trong Redis.
     *
     * @param username chủ sở hữu token
     * @param jti      id duy nhất của token
     * @param issuedAt thời điểm cấp (epoch millis)
     * @param familyId nhóm token dùng để phát hiện tái sử dụng
     */
    public record RefreshTokenInfo(
            String username,
            String jti,
            long issuedAt,
            String familyId
    ) {}
}
