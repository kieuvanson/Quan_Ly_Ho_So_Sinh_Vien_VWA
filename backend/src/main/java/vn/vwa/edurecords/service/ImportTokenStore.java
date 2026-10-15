package vn.vwa.edurecords.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;
import vn.vwa.edurecords.dto.importexcel.ImportTokenPayload;

import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * Lưu trữ snapshot import (sau khi /preview thành công) vào Redis.
 *
 * <p>Mỗi token UUID là 1 key trong Redis với TTL 5 phút. Khi /confirm gọi,
 * service lấy lại payload theo token → dùng để ghi DB.</p>
 *
 * <h3>Tại sao dùng Redis thay vì in-memory?</h3>
 * <ul>
 *   <li>Horizontal scale: nếu chạy nhiều instance backend, vẫn chia sẻ được
 *       token (in-memory chỉ local).</li>
 *   <li>Auto expire: Redis tự xóa sau TTL, không cần cleanup job.</li>
 *   <li>Tránh OOM: file 10k dòng * 2 sheet có thể tốn ~50MB RAM nếu giữ
 *       in-memory; Redis chỉ tốn dung lượng cho key đang sống.</li>
 * </ul>
 */
@Service
public class ImportTokenStore {

    private static final Logger log = LoggerFactory.getLogger(ImportTokenStore.class);
    private static final String KEY_PREFIX = "vwa:import:token:";
    private static final long TTL_MINUTES = 5L;

    private final StringRedisTemplate redis;
    private final ObjectMapper objectMapper;

    public ImportTokenStore(StringRedisTemplate redis, ObjectMapper objectMapper) {
        this.redis = redis;
        this.objectMapper = objectMapper;
    }

    /**
     * Tạo token mới, lưu payload vào Redis với TTL 5 phút.
     */
    public String save(ImportTokenPayload payload) {
        String token = UUID.randomUUID().toString();
        payload.setToken(token);
        payload.setCreatedAt(System.currentTimeMillis());
        try {
            String json = objectMapper.writeValueAsString(payload);
            redis.opsForValue().set(KEY_PREFIX + token, json, TTL_MINUTES, TimeUnit.MINUTES);
            log.info("Saved import token {} với {} sheet, TTL {} phút",
                    token, payload.getSheets().size(), TTL_MINUTES);
            return token;
        } catch (JacksonException e) {
            log.error("Không serialize được ImportTokenPayload", e);
            throw new RuntimeException("Lỗi lưu token import: " + e.getMessage(), e);
        }
    }

    /**
     * Lấy payload theo token. Trả về {@code Optional.empty()} nếu token không tồn tại
     * (hết hạn, bị xóa, hoặc không phải do hệ thống sinh ra).
     */
    public Optional<ImportTokenPayload> get(String token) {
        if (token == null || token.isBlank()) return Optional.empty();
        String json = redis.opsForValue().get(KEY_PREFIX + token);
        if (json == null) return Optional.empty();
        try {
            return Optional.of(objectMapper.readValue(json, ImportTokenPayload.class));
        } catch (JacksonException e) {
            log.error("Không deserialize được ImportTokenPayload cho token={}", token, e);
            return Optional.empty();
        }
    }

    /**
     * Xóa token sau khi confirm thành công.
     */
    public void delete(String token) {
        if (token == null || token.isBlank()) return;
        redis.delete(KEY_PREFIX + token);
    }
}
