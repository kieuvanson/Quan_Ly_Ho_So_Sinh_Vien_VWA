package vn.vwa.edurecords;

import org.junit.jupiter.api.Test;
import org.springframework.boot.SpringApplication;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.mock.env.MockEnvironment;
import vn.vwa.edurecords.config.DataSourceUrlEnvironmentPostProcessor;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Test cho {@link DataSourceUrlEnvironmentPostProcessor}.
 *
 * <p>Kiểm tra việc chuẩn hoá {@code DATABASE_URL} của Railway thành cấu hình
 * {@code spring.datasource.*} mà Spring Boot hiểu được.
 */
class DataSourceUrlEnvironmentPostProcessorTests {

    private final DataSourceUrlEnvironmentPostProcessor processor =
            new DataSourceUrlEnvironmentPostProcessor(
                    new org.springframework.boot.logging.DeferredLogs());

    /**
     * Dùng {@link MockEnvironment} thay {@code StandardEnvironment} để test
     * không bị ảnh hưởng bởi biến môi trường thật của máy (DATABASE_URL,
     * REDIS_URL...) — MockEnvironment chỉ đọc property được set thủ công.
     */
    private ConfigurableEnvironment environmentWith(String... keyValues) {
        MockEnvironment env = new MockEnvironment();
        for (int i = 0; i < keyValues.length; i += 2) {
            env.setProperty(keyValues[i], keyValues[i + 1]);
        }
        return env;
    }

    @Test
    void railwayDatabaseUrl_isConvertedToJdbcUrlAndCredentialsExtracted() {
        ConfigurableEnvironment env = environmentWith(
                "DATABASE_URL", "postgres://myuser:mypass@pg.railway.app:5432/vwa_edurecords");

        processor.postProcessEnvironment(env, new SpringApplication());

        assertThat(env.getProperty("spring.datasource.url"))
                .isEqualTo("jdbc:postgresql://pg.railway.app:5432/vwa_edurecords");
        assertThat(env.getProperty("spring.datasource.username")).isEqualTo("myuser");
        assertThat(env.getProperty("spring.datasource.password")).isEqualTo("mypass");
    }

    @Test
    void databaseUrlWithoutPort_usesDefaultPostgresPort() {
        ConfigurableEnvironment env = environmentWith(
                "DATABASE_URL", "postgres://u:p@pg.railway.app/vwa_edurecords");

        processor.postProcessEnvironment(env, new SpringApplication());

        assertThat(env.getProperty("spring.datasource.url"))
                .isEqualTo("jdbc:postgresql://pg.railway.app/vwa_edurecords");
    }

    @Test
    void databaseUrlWithSpecialCharactersInPassword_isDecodedByUri() {
        ConfigurableEnvironment env = environmentWith(
                "DATABASE_URL", "postgres://user:p%40ssw0rd@host:5432/db");

        processor.postProcessEnvironment(env, new SpringApplication());

        // URI.getUserInfo() giải mã percent-encoding theo chuẩn RFC 3986,
        // nên "p%40ssw0rd" thành "p@ssw0rd" — đúng với mật khẩu thật.
        assertThat(env.getProperty("spring.datasource.password")).isEqualTo("p@ssw0rd");
    }

    @Test
    void explicitSpringDataSourceUrl_takesPrecedenceAndIsNotTouched() {
        ConfigurableEnvironment env = environmentWith(
                "SPRING_DATASOURCE_URL", "jdbc:postgresql://localhost:5432/local_db",
                "DATABASE_URL", "postgres://u:p@remote.host:5432/remote_db");

        processor.postProcessEnvironment(env, new SpringApplication());

        // Không được tạo property source mới — cấu hình thủ công giữ nguyên.
        assertThat(env.getPropertySources().contains("vwa-normalized-cloud-config")).isFalse();
        assertThat(env.getProperty("spring.datasource.url")).isNull();
    }

    @Test
    void railwayRedisUrl_isMappedToSpringDataRedisUrl() {
        ConfigurableEnvironment env = environmentWith(
                "REDIS_URL", "redis://default:secret@redis.railway.app:6379");

        processor.postProcessEnvironment(env, new SpringApplication());

        assertThat(env.getProperty("spring.data.redis.url"))
                .isEqualTo("redis://default:secret@redis.railway.app:6379");
    }

    @Test
    void noRedisUrl_doesNotSetRedisUrlProperty() {
        // Regression: đặt spring.data.redis.url = "" làm LettuceConnectionFactory
        // ném "Invalid Redis URL ''" và làm hỏng toàn bộ context.
        ConfigurableEnvironment env = environmentWith();

        processor.postProcessEnvironment(env, new SpringApplication());

        assertThat(env.getProperty("spring.data.redis.url")).isNull();
    }

    @Test
    void explicitSpringDataRedisUrl_takesPrecedence() {
        ConfigurableEnvironment env = environmentWith(
                "SPRING_DATA_REDIS_URL", "redis://manual:pass@manual.host:6379",
                "REDIS_URL", "redis://default:secret@redis.railway.app:6379");

        processor.postProcessEnvironment(env, new SpringApplication());

        assertThat(env.getProperty("spring.data.redis.url")).isNull();
        assertThat(env.getPropertySources().contains("vwa-normalized-cloud-config")).isFalse();
    }

    @Test
    void noDatabaseUrl_doesNothing() {
        ConfigurableEnvironment env = environmentWith();

        processor.postProcessEnvironment(env, new SpringApplication());

        assertThat(env.getProperty("spring.datasource.url")).isNull();
    }

    @Test
    void databaseUrlWithNullHost_doesNotBreakStartup() {
        ConfigurableEnvironment env = environmentWith(
                "DATABASE_URL", "not-a-valid-uri-without-host");

        processor.postProcessEnvironment(env, new SpringApplication());

        // Phải bỏ qua an toàn, không ném exception làm hỏng startup.
        assertThat(env.getProperty("spring.datasource.url")).isNull();
    }
}
