package vn.vwa.edurecords;

import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.postgresql.PostgreSQLContainer;
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
 *
 * <h3>Vì sao không dùng annotation {@code @Testcontainers}</h3>
 * Annotation này tự dừng container ở {@code afterAll} của MỖI lớp test — kể cả
 * lớp {@code @Nested}. Lớp test của dự án có nhiều lớp con {@code @Nested}
 * dùng chung một đôi container này, nên container bị dừng sau lớp con đầu tiên
 * và các lớp sau không kết nối được ("Connection refused"). Tương tự, nếu gọi
 * start/stop thủ công ở {@code @BeforeAll}/{@code @AfterAll} thì JUnit cũng chạy
 * hook đó cho từng lớp con {@code @Nested}, vẫn dẫn tới dừng/đổi port giữa
 * chừng trong khi Spring context đã cache vẫn giữ URL cũ.
 *
 * <p>Vì vậy vòng đời container được quản lý hoàn toàn ở đây:
 * <ul>
 *   <li>Khởi động đúng một lần, trong {@link #configureProperties} — chạy trước
 *       lúc Spring đọc bất kỳ property nào nên chắc chắn container đã sẵn sàng.</li>
 *   <li>Dọn bằng JVM shutdown hook, tức là sau khi đã chạy hết test.</li>
 * </ul>
 * Nhờ vậy một đôi container duy nhất phục vụ toàn bộ test suite, kể cả các lớp
 * {@code @Nested}, và không bao giờ bị restart giữa chừng.
 */
public abstract class IntegrationTestConfig {

    private static final Object LOCK = new Object();

    private static boolean started = false;
    private static boolean shutdownHookRegistered = false;

    public static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer(
            DockerImageName.parse("postgres:18-alpine"))
            .withDatabaseName("vwa_edurecords_test")
            .withUsername("test")
            .withPassword("test");

    public static final GenericContainer<?> REDIS = new GenericContainer<>(
            DockerImageName.parse("redis:7-alpine"))
            .withExposedPorts(6379);

    /**
     * Trỏ cấu hình ứng dụng sang container đang chạy.
     *
     * <p>Chỉ ghi đè các thuộc tính hạ tầng. Biến bắt buộc khác (JWT secret,
     * CORS origins) vẫn lấy từ {@code src/test/resources/application-test.properties}
     * để mọi test đều dùng cùng một bộ giá trị.
     *
     * <p>Container được khởi động ngay trong method này, trước khi Spring đọc
     * các giá trị bên dưới.
     */
    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        startContainersOnce();

        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);

        registry.add("spring.data.redis.host", REDIS::getHost);
        registry.add("spring.data.redis.port", () -> REDIS.getMappedPort(6379));
    }

    /**
     * Khởi động container đúng một lần cho cả JVM.
     *
     * <p>Idempotent và an toàn khi nhiều thread gọi đồng thời. Các lớp test có
     * thể chạy song song, nhưng chỉ một đôi container được dựng.
     */
    private static void startContainersOnce() {
        synchronized (LOCK) {
            if (started) {
                return;
            }
            POSTGRES.start();
            REDIS.start();
            started = true;

            if (!shutdownHookRegistered) {
                Runtime.getRuntime().addShutdownHook(new Thread(IntegrationTestConfig::stopContainers));
                shutdownHookRegistered = true;
            }
        }
    }

    /**
     * Dừng và xoá container.
     *
     * <p>Chỉ được gọi khi JVM kết thúc (shutdown hook), không gọi giữa các lớp
     * test — nếu gọi sớm thì các lớp test chạy sau sẽ không kết nối được.
     */
    private static void stopContainers() {
        synchronized (LOCK) {
            try {
                if (POSTGRES.isRunning()) {
                    POSTGRES.stop();
                }
            } finally {
                if (REDIS.isRunning()) {
                    REDIS.stop();
                }
            }
        }
    }
}