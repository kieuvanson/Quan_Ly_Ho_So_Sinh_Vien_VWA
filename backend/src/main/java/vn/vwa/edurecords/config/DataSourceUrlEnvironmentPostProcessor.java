package vn.vwa.edurecords.config;

import org.apache.commons.logging.Log;
import org.springframework.boot.EnvironmentPostProcessor;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.logging.DeferredLogFactory;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.HashMap;
import java.util.Map;

/**
 * Chuẩn hoá các biến môi trường của môi trường cloud thành cấu hình mà
 * Spring Boot hiểu được.
 *
 * <h3>1. DATABASE_URL → spring.datasource.*</h3>
 * Railway, Render, Heroku inject {@code DATABASE_URL} dạng
 * {@code postgres://user:pass@host:port/db}. Backend cần hai thứ mà biến
 * này không cung cấp sẵn:
 *
 * <ul>
 *   <li><b>Scheme đúng.</b> Driver PostgreSQL (pgjdbc) chỉ chấp nhận URL
 *       bắt đầu bằng {@code jdbc:postgresql:}. URL {@code postgres://...}
 *       bị từ chối với lỗi "No suitable driver found".</li>
 *   <li><b>Username/password riêng.</b> Spring Boot KHÔNG tự đọc phần
 *       user-info trong JDBC URL: {@code DataSourceProperties.determineUsername()}
 *       chỉ trả về giá trị đã set thủ công, nếu không thì trả {@code null}.
 *       Thiếu username/password thì không kết nối được database.</li>
 * </ul>
 *
 * <h3>2. REDIS_URL → spring.data.redis.*</h3>
 * Railway inject {@code REDIS_URL} dạng {@code redis://user:pass@host:port}.
 * Spring Boot 4 hỗ trợ {@code spring.data.redis.url} và tự tách
 * user-info, nhưng chỉ khi giá trị **không rỗng** — đặt rỗng sẽ gây lỗi
 * {@code Invalid Redis URL ''}. Vì vậy class này chỉ set thuộc tính khi
 * biến thực sự có giá trị.
 *
 * <h3>Cách hoạt động</h3>
 * Chạy rất sớm trong vòng đời ứng dụng (trước khi tạo DataSource) nên
 * đặt thẳng vào {@link ConfigurableEnvironment}. Cấu hình thủ công
 * ({@code SPRING_DATASOURCE_URL}, {@code SPRING_DATA_REDIS_*}) luôn được
 * giữ nguyên — class này chỉ can thiệp khi biến đó vắng mặt.
 *
 * <h3>Đăng ký</h3>
 * Spring Boot 4 đọc interface {@link EnvironmentPostProcessor} (package
 * {@code org.springframework.boot}) qua file
 * {@code META-INF/spring.factories} — xem file cùng thư mục.
 *
 * <p>Giá trị lấy từ {@code DATABASE_URL} / {@code REDIS_URL} KHÔNG bao giờ
 * được ghi log.
 */
public class DataSourceUrlEnvironmentPostProcessor implements EnvironmentPostProcessor {

    private static final String PROPERTY_SOURCE_NAME = "vwa-normalized-cloud-config";

    private static final String JDBC_PREFIX = "jdbc:postgresql://";

    private final Log log;

    /**
     * Constructor dùng bởi Spring Boot: {@code DeferredLogFactory} được
     * Spring Boot 4 tiêm vào qua {@code SpringFactoriesLoader}. Log ghi ra
     * ở giai đoạn này được giữ lại cho tới khi logging system sẵn sàng.
     *
     * <p>CHỈ có constructor này: nếu có thêm constructor không tham số,
     * {@code SpringFactoriesLoader} có thể chọn nhầm và log sẽ ghi vào
     * commons-logging trước khi logging system khởi tạo → mất log.
     */
    public DataSourceUrlEnvironmentPostProcessor(DeferredLogFactory logFactory) {
        this.log = logFactory.getLog(getClass());
    }

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment,
                                       SpringApplication application) {
        Map<String, Object> props = new HashMap<>();

        normalizeDataSource(environment, props);
        normalizeRedis(environment, props);

        if (!props.isEmpty()) {
            environment.getPropertySources().addFirst(
                    new MapPropertySource(PROPERTY_SOURCE_NAME, props));
        }
    }

    /**
     * Chuyển {@code DATABASE_URL} thành {@code spring.datasource.*}.
     */
    private void normalizeDataSource(ConfigurableEnvironment environment, Map<String, Object> props) {
        if (isNotBlank(environment.getProperty("SPRING_DATASOURCE_URL"))) {
            // Cấu hình thủ công đã đúng định dạng — không đụng gì.
            return;
        }

        String databaseUrl = environment.getProperty("DATABASE_URL");
        if (isBlank(databaseUrl)) {
            return;
        }

        try {
            URI uri = new URI(databaseUrl);
            String host = uri.getHost();
            if (isBlank(host)) {
                log.warn("DATABASE_URL không có host hợp lệ — bỏ qua việc chuẩn hoá");
                return;
            }

            int port = uri.getPort();
            String path = uri.getPath();

            String username = environment.getProperty("SPRING_DATASOURCE_USERNAME");
            String password = environment.getProperty("SPRING_DATASOURCE_PASSWORD");

            String userInfo = uri.getUserInfo();
            if (isNotBlank(userInfo)) {
                int sep = userInfo.indexOf(':');
                if (sep >= 0) {
                    if (isBlank(username)) {
                        username = userInfo.substring(0, sep);
                    }
                    if (isBlank(password)) {
                        password = userInfo.substring(sep + 1);
                    }
                } else if (isBlank(username)) {
                    username = userInfo;
                }
            }

            StringBuilder jdbc = new StringBuilder(JDBC_PREFIX).append(host);
            if (port > 0) {
                jdbc.append(':').append(port);
            }
            if (isNotBlank(path)) {
                jdbc.append(path);
            }

            props.put("spring.datasource.url", jdbc.toString());
            if (isNotBlank(username)) {
                props.put("spring.datasource.username", username);
            }
            if (isNotBlank(password)) {
                props.put("spring.datasource.password", password);
            }

            log.info("Đã chuẩn hoá DATABASE_URL thành JDBC URL cho PostgreSQL (host="
                    + host + ", port=" + (port > 0 ? port : 5432) + ")");
        } catch (URISyntaxException e) {
            log.error("DATABASE_URL không phải URI hợp lệ: " + e.getMessage());
        }
    }

    /**
     * Chuyển {@code REDIS_URL} thành {@code spring.data.redis.url}.
     *
     * <p>Chỉ set khi biến có giá trị thật: đặt {@code spring.data.redis.url}
     * bằng chuỗi rỗng sẽ gây lỗi {@code Invalid Redis URL ''} trong
     * LettuceConnectionFactory.
     */
    private void normalizeRedis(ConfigurableEnvironment environment, Map<String, Object> props) {
        if (isNotBlank(environment.getProperty("SPRING_DATA_REDIS_URL"))) {
            return;
        }

        String redisUrl = environment.getProperty("REDIS_URL");
        if (isBlank(redisUrl)) {
            return;
        }

        try {
            URI uri = new URI(redisUrl);
            if (isBlank(uri.getHost())) {
                log.warn("REDIS_URL không có host hợp lệ — bỏ qua việc chuẩn hoá");
                return;
            }

            props.put("spring.data.redis.url", redisUrl);
            log.info("Đã dùng REDIS_URL cho cấu hình Redis (host=" + uri.getHost()
                    + ", port=" + (uri.getPort() > 0 ? uri.getPort() : 6379) + ")");
        } catch (URISyntaxException e) {
            log.error("REDIS_URL không phải URI hợp lệ: " + e.getMessage());
        }
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }

    private static boolean isNotBlank(String s) {
        return s != null && !s.isBlank();
    }
}
