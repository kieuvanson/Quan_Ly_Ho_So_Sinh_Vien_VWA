package vn.vwa.edurecords.config;

import java.io.IOException;

import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JsonSecurityErrorHandlers {

    public AuthenticationEntryPoint authenticationEntryPoint() {
        return (HttpServletRequest request, HttpServletResponse response,
                org.springframework.security.core.AuthenticationException authException) ->
                writeJson(response, 401, "UNAUTHORIZED", "Bạn cần đăng nhập để truy cập tài nguyên này");
    }

    public AccessDeniedHandler accessDeniedHandler() {
        return (HttpServletRequest request, HttpServletResponse response,
                org.springframework.security.access.AccessDeniedException accessDeniedException) ->
                writeJson(response, 403, "FORBIDDEN", "Bạn không có quyền truy cập tài nguyên này");
    }

    private void writeJson(HttpServletResponse response, int status, String code, String message) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json;charset=UTF-8");
        String safeMessage = message.replace("\\", "\\\\").replace("\"", "\\\"");
        String body = "{\"success\":false,\"status\":" + status
                + ",\"code\":\"" + code + "\""
                + ",\"message\":\"" + safeMessage + "\""
                + ",\"timestamp\":\"" + java.time.Instant.now() + "\"}";
        response.getOutputStream().write(body.getBytes(java.nio.charset.StandardCharsets.UTF_8));
        response.getOutputStream().flush();
    }
}
