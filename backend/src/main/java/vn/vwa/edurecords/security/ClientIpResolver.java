package vn.vwa.edurecords.security;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Lấy IP thật của client, ưu tiên header X-Forwarded-For (nếu chạy sau proxy/load balancer).
 * Rơi về remoteAddr khi header không có.
 */
public final class ClientIpResolver {

    private static final String XFF_HEADER = "X-Forwarded-For";

    private ClientIpResolver() {
    }

    public static String resolve(HttpServletRequest request) {
        String xff = request.getHeader(XFF_HEADER);
        if (xff != null && !xff.isBlank()) {
            int comma = xff.indexOf(',');
            return (comma > 0 ? xff.substring(0, comma) : xff).trim();
        }
        return request.getRemoteAddr();
    }
}
