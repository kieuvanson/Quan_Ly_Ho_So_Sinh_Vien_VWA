package vn.vwa.edurecords.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private final JwtService jwtService;
    private final TokenRevocationService revocationService;

    public JwtAuthenticationFilter(JwtService jwtService, TokenRevocationService revocationService) {
        this.jwtService = jwtService;
        this.revocationService = revocationService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String token = resolveBearerToken(request);
        if (token == null) {
            filterChain.doFilter(request, response);
            return;
        }

        // Kiểm tra chữ ký/thời hạn trước để không gọi Redis cho token vô hiệu.
        if (!jwtService.isAccessToken(token)) {
            log.debug("Token không phải access token hoặc đã hết hạn");
            filterChain.doFilter(request, response);
            return;
        }

        // Kiểm tra thu hồi có thể lỗi Redis — không được để lỗi hạ tầng biến thành 500.
        if (isRevoked(token)) {
            log.debug("Access token đã bị thu hồi");
            filterChain.doFilter(request, response);
            return;
        }

        String username = jwtService.extractUsername(token);
        String role = jwtService.extractRole(token);

        if (username == null || role == null) {
            filterChain.doFilter(request, response);
            return;
        }

        var authentication = new UsernamePasswordAuthenticationToken(
                username, null, List.of(new SimpleGrantedAuthority("ROLE_" + role)));
        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authentication);

        filterChain.doFilter(request, response);
    }

    /** Trả về true nếu token đã bị thu hồi; lỗi Redis thì coi như chưa thu hồi và ghi log. */
    private boolean isRevoked(String token) {
        try {
            String jti = jwtService.extractJti(token);
            return revocationService.isTokenRevoked(jti);
        } catch (Exception e) {
            log.warn("Không kiểm tra được danh sách token thu hồi: {}", e.getMessage());
            return false;
        }
    }

    private String resolveBearerToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (!StringUtils.hasText(header) || !header.startsWith("Bearer ")) {
            return null;
        }
        String token = header.substring(7).trim();
        return token.isEmpty() ? null : token;
    }
}
