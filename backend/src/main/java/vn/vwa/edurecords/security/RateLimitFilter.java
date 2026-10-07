package vn.vwa.edurecords.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

/**
 * Giới hạn số lần thử đăng nhập theo IP trong một khoảng thời gian.
 *
 * <h3>Vì sao cần</h3>
 * BCrypt cost 12 rất tốn CPU. Nếu không giới hạn, một kẻ tấn công gửi hàng nghìn
 * request đăng nhập sai có thể vừa dò mật khẩu vừa làm cạn tài nguyên máy chủ.
 *
 * <h3>Cách hoạt động</h3>
 * Đếm số lần gọi trong cửa sổ thời gian (fixed window) bằng Redis {@code INCR}
 * kèm {@code EXPIRE}. Vượt ngưỡng thì trả 429. Redis hết sẵn thì cho phép đi
 * (fail-open) để sự cố Redis không chặn người dùng hợp lệ đăng nhập.
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(RateLimitFilter.class);

    private static final String KEY_PREFIX = "ratelimit:login:";
    private static final int MAX_ATTEMPTS_DEFAULT = 5;
    private static final int WINDOW_SECONDS_DEFAULT = 60;

    private final StringRedisTemplate redisTemplate;
    private final int maxAttempts;
    private final Duration window;

    public RateLimitFilter(
            StringRedisTemplate redisTemplate,
            @Value("${app.security.ratelimit.login.max-attempts:5}") int maxAttempts,
            @Value("${app.security.ratelimit.login.window-seconds:60}") int windowSeconds) {
        this.redisTemplate = redisTemplate;
        this.maxAttempts = maxAttempts > 0 ? maxAttempts : MAX_ATTEMPTS_DEFAULT;
        this.window = Duration.ofSeconds(windowSeconds > 0 ? windowSeconds : WINDOW_SECONDS_DEFAULT);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        if (!isLoginRequest(request)) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientIp = resolveClientIp(request);
        String key = KEY_PREFIX + clientIp;

        long count = increment(key);
        if (count > maxAttempts) {
            log.warn("Chặn đăng nhập quá giới hạn từ IP {} ({} lần)", clientIp, count);
            writeRateLimited(response);
            return;
        }

        filterChain.doFilter(request, response);
    }

    private boolean isLoginRequest(HttpServletRequest request) {
        return "POST".equalsIgnoreCase(request.getMethod())
                && request.getRequestURI().endsWith("/api/auth/login");
    }

    /**
     * Xoá bộ đếm sau khi đăng nhập thành công, để người dùng hợp lệ không bị
     * chặn nhầm ở những lần đăng nhập tiếp theo.
     */
    public void resetAttempts(String clientIp) {
        if (clientIp == null) {
            return;
        }
        try {
            redisTemplate.delete(KEY_PREFIX + clientIp);
        } catch (Exception e) {
            log.warn("Không xoá được bộ đếm rate limit: {}", e.getMessage());
        }
    }

    /**
     * Tăng bộ đếm và đặt TTL nếu đây là lần đầu.
     * Trả về -1 nếu Redis lỗi để chỉ ra không kiểm tra được.
     */
    private long increment(String key) {
        try {
            Long count = redisTemplate.opsForValue().increment(key);
            if (count != null && count == 1L) {
                redisTemplate.expire(key, window);
            }
            return count == null ? -1 : count;
        } catch (Exception e) {
            // Fail-open: lỗi Redis không được biến thành chặn đăng nhập hợp lệ.
            log.warn("Không kiểm tra được rate limit (Redis lỗi): {}", e.getMessage());
            return -1;
        }
    }

    /**
     * Lấy IP thật của client. Chỉ tin {@code X-Forwarded-For} khi request đến từ
     * proxy đáng tin; cấu hình để có thể tắt khi chạy trực tiếp.
     */
    private String resolveClientIp(HttpServletRequest request) {
        return request.getRemoteAddr() == null ? "unknown" : request.getRemoteAddr();
    }

    private void writeRateLimited(HttpServletResponse response) throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setHeader("Retry-After", String.valueOf(window.toSeconds()));

        // Viết JSON thủ công thay vì dùng ObjectMapper: filter chạy trước cả
        // message converter của Spring nên không cần phụ thuộc thêm thư viện,
        // và tránh rủi ro response lệch format với ApiResponse của các endpoint khác.
        String json = """
                {"success":false,"status":429,"code":"TOO_MANY_ATTEMPTS",\
                "message":"Quá nhiều lần đăng nhập. Vui lòng thử lại sau."}""";
        response.getWriter().write(json);
    }
}
