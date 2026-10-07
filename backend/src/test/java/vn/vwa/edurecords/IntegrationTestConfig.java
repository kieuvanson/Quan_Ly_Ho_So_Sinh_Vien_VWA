package vn.vwa.edurecords;

import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

/**
 * Cấu hình dùng chung cho test tích hợp: dựng PostgreSQL và Redis thật bằng
 * Testcontainers.
 *
 * <h3>Vì sao không dùng H2</h3>
 * Ứng dụng phụ thuộc nặng vào PostgreSQL: cột kiểu ENUM, native query với
 * {@code CAST(... AS trangthaihocvu)}, index riêng, transaction. H2 không tái tạo
 * được các hành vi này — test chạy được trên H2 lại pass trong khi chạy
 * production thì lỗi.
 *
 * <h3>Yêu cầu</h3>
 * Cần Docker đang chạy để dựng container. Nếu không, test fail với thông báo
 * rõ ràng thay vì bỏ qua âm thầm.
 */
@Testcontainers
public abstract class IntegrationTestConfig {

    @Container
    public static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>(
            DockerImageName.parse("postgres:18-alpine"))
            .withDatabaseName("vwa_edurecords_test")
            .withUsername("test")
            .withPassword("test");

    @Container
    public static final GenericContainer<?> REDIS = new GenericContainer<>(
            DockerImageName.parse("redis:7-alpine"))
            .withExposedPorts(6379);

    /**
     * Trỏ cấu hình ứng dụng sang container đang chạy.
     *
     * <p>Chỉ ghi đè các thuộc tính hạ tầng. Biến bắt buộc khác (JWT secret,
     * CORS origins) vẫn lấy từ {@code src/test/resources/application-test.properties}
     * để mọi test đều dùng cùng một bộ giá trị.
     */
    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);

        registry.add("spring.data.redis.host", REDIS::getHost);
        registry.add("spring.data.redis.port", () -> REDIS.getMappedPort(6379));
    }
}
