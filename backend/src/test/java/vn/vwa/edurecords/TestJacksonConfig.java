package vn.vwa.edurecords;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

/**
 * Cấu hình test cung cấp ObjectMapper bean.
 * 
 * <p>Spring Boot 4.x có thể không auto-configure ObjectMapper bean trong một số
 * trường hợp test (đặc biệt khi dùng Testcontainers + custom config).
 * TestConfiguration này đảm bảo ObjectMapper luôn available cho @Autowired.
 * 
 * <p>Bean này chỉ dùng trong test scope, không ảnh hưởng đến production.
 */
@TestConfiguration
public class TestJacksonConfig {

    @Bean
    @Primary
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        // Thử đăng ký JavaTimeModule bằng reflection (tương thích với Jackson 2.x và 3.x)
        try {
            Class<?> javaTimeModuleClass = Class.forName("com.fasterxml.jackson.datatype.jsr310.JavaTimeModule");
            Object module = javaTimeModuleClass.getDeclaredConstructor().newInstance();
            mapper.registerModule((com.fasterxml.jackson.databind.Module) module);
            // Disable serialize date as timestamp - dùng ISO-8601 string
            SerializationFeature.class.getMethod("WRITE_DATES_AS_TIMESTAMPS");
            mapper.configure(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false);
        } catch (Exception e) {
            // Không có JSR310 module hoặc feature không tồn tại, bỏ qua
        }
        return mapper;
    }
}
