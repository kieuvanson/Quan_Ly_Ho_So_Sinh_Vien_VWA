package vn.vwa.edurecords.security;

import java.time.Duration;
import java.time.Instant;
import java.util.Deque;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * In-memory rate limiter cho /login endpoint.
 * Đếm số lần thử đăng nhập theo IP trong cửa sổ thời gian trượt.
 * - maxAttempts: số lần tối đa trong window
 * - windowSeconds: độ dài cửa sổ (giây)
 * Khi vượt ngưỡng, các attempt tiếp theo bị block đến khi entries cũ rơi khỏi window.
 *
 * Lưu ý: Đây là in-memory rate limit, phù hợp cho 1 instance.
 * Với multi-instance / production scale, dùng Redis hoặc Bucket4j + Redis.
 */
@Component
public class LoginRateLimiter {

    private final int maxAttempts;
    private final Duration window;
    private final ConcurrentHashMap<String, Deque<Instant>> attemptsByIp = new ConcurrentHashMap<>();

    public LoginRateLimiter(
            @Value("${app.security.ratelimit.login.max-attempts:5}") int maxAttempts,
            @Value("${app.security.ratelimit.login.window-seconds:60}") int windowSeconds) {
        this.maxAttempts = maxAttempts;
        this.window = Duration.ofSeconds(windowSeconds);
    }

    /**
     * Ghi nhận một attempt và trả về true nếu còn trong ngưỡng, false nếu vượt ngưỡng.
     */
    public boolean tryAcquire(String clientIp) {
        if (clientIp == null || clientIp.isBlank()) {
            clientIp = "unknown";
        }
        Instant now = Instant.now();
        Instant cutoff = now.minus(window);

        Deque<Instant> attempts = attemptsByIp.computeIfAbsent(clientIp, k -> new ConcurrentLinkedDeque<>());
        synchronized (attempts) {
            // Bỏ các attempt cũ ngoài window
            while (!attempts.isEmpty() && attempts.peekFirst().isBefore(cutoff)) {
                attempts.pollFirst();
            }
            if (attempts.size() >= maxAttempts) {
                return false;
            }
            attempts.addLast(now);
            return true;
        }
    }

    /**
     * Reset bộ đếm cho IP (gọi khi login thành công).
     */
    public void reset(String clientIp) {
        if (clientIp == null || clientIp.isBlank()) {
            return;
        }
        attemptsByIp.remove(clientIp);
    }

    /**
     * Lấy số giây user phải chờ trước khi thử lại (khi bị block).
     */
    public long getRetryAfterSeconds(String clientIp) {
        Deque<Instant> attempts = attemptsByIp.get(clientIp);
        if (attempts == null || attempts.isEmpty()) {
            return 0;
        }
        Instant oldest;
        synchronized (attempts) {
            oldest = attempts.peekFirst();
        }
        if (oldest == null) {
            return 0;
        }
        Instant retryAt = oldest.plus(window);
        long seconds = Duration.between(Instant.now(), retryAt).getSeconds();
        return Math.max(seconds, 1);
    }
}
