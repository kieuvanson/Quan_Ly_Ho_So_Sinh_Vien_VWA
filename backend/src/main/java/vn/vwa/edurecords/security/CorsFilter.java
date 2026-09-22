package vn.vwa.edurecords.security;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * CORS filter whitelist các origin được khai báo trong app.security.cors.allowed-origins.
 * - Chỉ cho phép origin trong whitelist, không dùng "*"
 * - Hỗ trợ preflight (OPTIONS) với các method/header phổ biến
 * - Cho phép credentials (cookie) khi frontend cùng origin / whitelist
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class CorsFilter extends OncePerRequestFilter {

    private static final List<String> ALLOWED_METHODS = List.of(
            HttpMethod.GET.name(), HttpMethod.POST.name(),
            HttpMethod.PUT.name(), HttpMethod.PATCH.name(),
            HttpMethod.DELETE.name(), HttpMethod.OPTIONS.name());

    private static final List<String> ALLOWED_HEADERS = List.of(
            "Authorization", "Content-Type", "Accept", "Origin",
            "X-Requested-With", "X-CSRF-Token");

    private static final List<String> EXPOSED_HEADERS = List.of(
            "X-Total-Count", "Retry-After");

    private final List<String> allowedOrigins;

    public CorsFilter(@Value("${app.security.cors.allowed-origins}") String allowedOriginsCsv) {
        this.allowedOrigins = Arrays.stream(allowedOriginsCsv.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String origin = request.getHeader("Origin");

        if (origin != null && allowedOrigins.contains(origin)) {
            response.setHeader("Access-Control-Allow-Origin", origin);
            response.setHeader("Access-Control-Allow-Credentials", "true");
            response.setHeader("Vary", "Origin");
            response.setHeader("Access-Control-Allow-Methods", String.join(", ", ALLOWED_METHODS));
            response.setHeader("Access-Control-Allow-Headers", String.join(", ", ALLOWED_HEADERS));
            response.setHeader("Access-Control-Expose-Headers", String.join(", ", EXPOSED_HEADERS));
            response.setHeader("Access-Control-Max-Age", "3600");
        }

        if (HttpMethod.OPTIONS.matches(request.getMethod())) {
            response.setStatus(HttpServletResponse.SC_NO_CONTENT);
            return;
        }

        filterChain.doFilter(request, response);
    }
}
