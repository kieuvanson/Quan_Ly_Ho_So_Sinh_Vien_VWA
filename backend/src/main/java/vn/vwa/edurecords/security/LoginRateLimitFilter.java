package vn.vwa.edurecords.security;

import java.io.IOException;

import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Rate-limit filter cho POST /api/auth/login.
 * - Đếm số attempt theo IP qua LoginRateLimiter
 * - Trả về 429 + Retry-After khi vượt ngưỡng
 * Chỉ áp dụng cho /api/auth/login, các endpoint khác đi qua bình thường.
 */
@Component
public class LoginRateLimitFilter extends OncePerRequestFilter {

    private static final String LOGIN_PATH = "/api/auth/login";

    private final LoginRateLimiter rateLimiter;

    public LoginRateLimitFilter(LoginRateLimiter rateLimiter) {
        this.rateLimiter = rateLimiter;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        if (!"POST".equalsIgnoreCase(request.getMethod()) || !LOGIN_PATH.equals(request.getRequestURI())) {
            filterChain.doFilter(request, response);
            return;
        }

        String ip = ClientIpResolver.resolve(request);
        if (!rateLimiter.tryAcquire(ip)) {
            long retryAfter = rateLimiter.getRetryAfterSeconds(ip);
            writeTooManyRequests(response, retryAfter);
            return;
        }

        filterChain.doFilter(request, response);
    }

    private void writeTooManyRequests(HttpServletResponse response, long retryAfter) throws IOException {
        response.setStatus(429);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setHeader("Retry-After", String.valueOf(retryAfter));
        String body = "{\"success\":false,\"status\":429,\"code\":\"TOO_MANY_REQUESTS\","
                + "\"message\":\"Quá nhiều lần thử đăng nhập, vui lòng thử lại sau "
                + retryAfter + " giây\","
                + "\"timestamp\":\"" + java.time.Instant.now() + "\"}";
        response.getOutputStream().write(body.getBytes(java.nio.charset.StandardCharsets.UTF_8));
        response.getOutputStream().flush();
    }
}
