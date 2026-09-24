package vn.vwa.edurecords.security;

import java.time.Instant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Ghi log audit cho các sự kiện bảo mật (login/logout/refresh thành công/thất bại).
 * Hiện tại ghi qua SLF4J; tương lai có thể chuyển sang bảng DB riêng.
 *
 * Format cố định để dễ parse: AUDIT_EVENT event=... username=... ip=... reason=...
 */
@Component
public class AuditLogger {

    private static final Logger log = LoggerFactory.getLogger("AUDIT");

    public void event(String event, String username, String ip, boolean success, String reason) {
        if (log.isInfoEnabled()) {
            log.info("event={} username={} ip={} success={} reason={} timestamp={}",
                    event,
                    username == null ? "-" : username,
                    ip == null ? "-" : ip,
                    success,
                    reason == null ? "-" : reason,
                    Instant.now());
        }
    }
}
