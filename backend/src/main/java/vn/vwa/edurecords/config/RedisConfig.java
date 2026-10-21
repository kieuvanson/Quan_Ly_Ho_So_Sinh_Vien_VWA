package vn.vwa.edurecords.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;

@Configuration
public class RedisConfig {

    /**
     * Token/revocation đều là chuỗi đơn giản (hash SHA-256, username, jti) nên dùng
     * {@link StringRedisTemplate} — tự cấu hình String serializer cho cả key lẫn value.
     *
     * Việc dùng serializer mặc định của {@code RedisTemplate} (JDK serialization) sẽ
     * làm key không đọc được bằng redis-cli và không tương thích giữa các service.
     *
     * <p>Bean {@link RedisConnectionFactory} được Spring Boot auto-config cung cấp
     * từ {@code spring-boot-starter-data-redis} (Lettuce theo mặc định). Truyền
     * trực tiếp vào {@link StringRedisTemplate} để tránh lệ thuộc vào tên bean ẩn
     * và giữ constructor injection rõ ràng.</p>
     */
    @Bean
    public StringRedisTemplate stringRedisTemplate(RedisConnectionFactory connectionFactory) {
        return new StringRedisTemplate(connectionFactory);
    }
}
