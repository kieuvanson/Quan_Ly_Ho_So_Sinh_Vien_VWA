package vn.vwa.edurecords;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.junit.jupiter.Testcontainers;
import vn.vwa.edurecords.security.JwtAuthenticationFilter;
import vn.vwa.edurecords.security.RateLimitFilter;
import vn.vwa.edurecords.security.RefreshTokenService;
import vn.vwa.edurecords.security.TokenRevocationService;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Kiểm tra application context khởi động được với đầy đủ hạ tầng.
 *
 * <p>Chạy PostgreSQL + Redis thật qua Testcontainers: nếu cấu hình sai, native
 * query hoặc bean Redis sai, test này đỏ trước khi các test nghiệp vụ chạy.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Testcontainers
class VwaEdurecordsApplicationTests extends IntegrationTestConfig {

    @Autowired
    private ApplicationContext applicationContext;

    @Autowired
    private MockMvc mockMvc;

    @Test
    void contextLoads() {
        assertThat(applicationContext).isNotNull();
    }

    @Test
    void shouldRegisterSecurityBeans() {
        assertThat(applicationContext.getBean(SecurityFilterChain.class)).isNotNull();
        assertThat(applicationContext.getBean(JwtAuthenticationFilter.class)).isNotNull();
        assertThat(applicationContext.getBean(RateLimitFilter.class)).isNotNull();
        assertThat(applicationContext.getBean(RefreshTokenService.class)).isNotNull();
        assertThat(applicationContext.getBean(TokenRevocationService.class)).isNotNull();
    }

    @Test
    void shouldExposeHealthEndpoint() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk());
    }
}
