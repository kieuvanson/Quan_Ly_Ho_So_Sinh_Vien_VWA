package vn.vwa.edurecords.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Kiểm tra cấu hình xác thực Redis lúc khởi động.
 *
 * <h3>Vì sao cần</h3>
 * <p>Redis của VWA chứa refresh token (hash SHA-256), danh sách token đã thu hồi
 * và bộ đếm rate limit đăng nhập. Redis không mã hoá dữ liệu và mặc định không
 * xác thực: nếu cổng 6379 bị publish ra mạng ngoài thì bất kỳ ai cũng đọc được
 * và ghi được vào Redis — đủ để đánh cắp phiên đăng nhập và vô hiệu hoá rate
 * limit.</p>
 *
 * <p>Vì vậy ở môi trường thật, backend <b>không được khởi động</b> nếu Redis không
 * có mật khẩu (fail-fast). Ngoại lệ duy nhất là môi trường dev/test, nơi Redis chỉ
 * lắp nghe trên loopback và được bật/tắt bằng cờ
 * {@code app.security.redis.require-password}.</p>
 */
@Component
public class RedisCredentialGuard {

    private static final Logger log = LoggerFactory.getLogger(RedisCredentialGuard.class);

    public RedisCredentialGuard(
            @Value("${spring.data.redis.password:}") String password,
            @Value("${app.security.redis.require-password:true}") boolean requirePassword) {

        boolean hasPassword = password != null && !password.isBlank();

        if (requirePassword && !hasPassword) {
            throw new IllegalStateException(
                    "Redis phải có mật khẩu. Đặt biến môi trường SPRING_DATA_REDIS_PASSWORD "
                            + "(khớp với REDIS_PASSWORD trong .env / docker-compose) hoặc tắt yêu cầu "
                            + "bằng app.security.redis.require-password=false khi chạy local.");
        }

        if (hasPassword) {
            log.info("Redis đã được cấu hình xác thực bằng mật khẩu.");
        } else {
            log.warn("Redis KHÔNG có mật khẩu — chỉ chấp nhận khi Redis chỉ lắp nghe trên loopback.");
        }
    }
}
