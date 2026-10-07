package vn.vwa.edurecords;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.junit.jupiter.Testcontainers;
import vn.vwa.edurecords.dto.request.RegisterRequest;
import vn.vwa.edurecords.entity.User;
import vn.vwa.edurecords.entity.enums.Role;
import vn.vwa.edurecords.repository.UserRepository;
import vn.vwa.edurecords.security.JwtService;
import vn.vwa.edurecords.service.AuthService;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Kiểm chứng các sửa đổi bảo mật ở tầng HTTP và service.
 *
 * <p>Mỗi test tương ứng với một lỗ hổng đã sửa; nếu ai đó vô tình mở lại
 * endpoint hoặc giao quyền từ request body, test này phải đỏ.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Testcontainers
class AuthSecurityTests extends IntegrationTestConfig {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthService authService;

    @Autowired
    private JwtService jwtService;

    private User createUser(String username, Role role) {
        return userRepository.save(User.builder()
                .username(username)
                .passwordHash(passwordEncoder.encode("MatKhau@12345"))
                .hoTen("Nguyen Van " + username)
                .email(username + "@vwa.edu.vn")
                .role(role)
                .isActive(true)
                .build());
    }

    // ------------------------------------------------------------------
    // Lỗ hổng 1: endpoint /api/auth/encode-password từng cho phép public
    // ------------------------------------------------------------------

    @Test
    @Transactional
    void shouldNotExposeEncodePasswordEndpoint() throws Exception {
        mockMvc.perform(post("/api/auth/encode-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"password\":\"x\"}"))
                // Endpoint đã bị xoá. Dù không có handler, request không được
                // trả 200 với bcrypt hash; phải là 404 hoặc 401/403.
                .andExpect(result -> assertThat(result.getResponse().getStatus())
                        .isIn(404, 401, 403));
    }

    // ------------------------------------------------------------------
    // Lỗ hổng 2: /api/auth/** permitAll từng mở cả register
    // ------------------------------------------------------------------

    @Test
    @Transactional
    void shouldRejectPublicRegistration() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("attacker01");
        request.setPassword("MatKhau@12345");
        request.setHoTen("Attacker");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());

        assertThat(userRepository.existsByUsername("attacker01")).isFalse();
    }

    // ------------------------------------------------------------------
    // Lỗ hổng 3: role lấy từ request body → tự nâng quyền ADMIN
    // ------------------------------------------------------------------

    @Test
    @Transactional
    void shouldIgnoreRoleSuppliedByClient() throws Exception {
        User admin = createUser("admin01", Role.ADMIN);
        String adminToken = jwtService.generateAccessToken(admin.getUsername(), Role.ADMIN.name());

        // Client cố gắng tự chỉ định role trong body.
        Map<String, String> payload = Map.of(
                "username", "staff01",
                "password", "MatKhau@12345",
                "hoTen", "Nhan Vien",
                "role", "ADMIN");

        mockMvc.perform(post("/api/auth/register")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isCreated());

        User created = userRepository.findByUsername("staff01").orElseThrow();
        // Dù client gửi role=ADMIN, tài khoản tạo ra phải là STAFF.
        assertThat(created.getRole()).isEqualTo(Role.STAFF);
    }

    // ------------------------------------------------------------------
    // Lỗ hổng 4: message đăng nhập lộ tài khoản tồn tại
    // ------------------------------------------------------------------

    @Test
    @Transactional
    void shouldReturnSameMessageForWrongUsernameAndWrongPassword() throws Exception {
        createUser("realuser", Role.ADMIN);

        String wrongPassword = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"realuser\",\"password\":\"sai-mat-khau\"}"))
                .andExpect(status().isUnauthorized())
                .andReturn().getResponse().getContentAsString();

        String wrongUser = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"khongtontai\",\"password\":\"sai-mat-khau\"}"))
                .andExpect(status().isUnauthorized())
                .andReturn().getResponse().getContentAsString();

        // Hai nguyên nhân khác nhau phải trả cùng thông báo để không dò được
        // tài khoản nào tồn tại.
        String messageOfWrongPassword = objectMapper.readTree(wrongPassword).get("message").asText();
        String messageOfWrongUser = objectMapper.readTree(wrongUser).get("message").asText();
        assertThat(messageOfWrongPassword).isEqualTo(messageOfWrongUser);
    }

    // ------------------------------------------------------------------
    // Lỗ hổng 5: tài khoản bị vô hiệu hoá vẫn đăng nhập được
    // ------------------------------------------------------------------

    @Test
    @Transactional
    void shouldRejectDisabledAccount() throws Exception {
        User user = createUser("disabled01", Role.STAFF);
        user.setIsActive(false);
        userRepository.save(user);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"disabled01\",\"password\":\"MatKhau@12345\"}"))
                .andExpect(status().isUnauthorized());
    }

    // ------------------------------------------------------------------
    // Lỗ hổng 6: refresh token dùng như access token
    // ------------------------------------------------------------------

    @Test
    @Transactional
    void shouldNotAcceptRefreshTokenAsAccessToken() {
        String refreshToken = jwtService.generateRefreshToken("someuser");

        assertThat(jwtService.isRefreshToken(refreshToken)).isTrue();
        assertThat(jwtService.isAccessToken(refreshToken)).isFalse();
    }

    // ------------------------------------------------------------------
    // Endpoint khác phải yêu cầu xác thực
    // ------------------------------------------------------------------

    @Test
    @Transactional
    void shouldRequireAuthenticationForBusinessEndpoints() throws Exception {
        mockMvc.perform(post("/api/sinh-vien").contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/phieu-muon").contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    // ------------------------------------------------------------------
    // Logout chỉ được gọi khi đã đăng nhập
    // ------------------------------------------------------------------

    @Test
    @Transactional
    void shouldRequireAuthenticationForLogout() throws Exception {
        mockMvc.perform(post("/api/auth/logout"))
                .andExpect(status().isUnauthorized());
    }

    // ------------------------------------------------------------------
    // Tài khoản tạo qua service không bao giờ có role ADMIN
    // ------------------------------------------------------------------

    @Test
    @Transactional
    void shouldAlwaysCreateStaffWhenUsingRegisterService() {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("svcstaff");
        request.setPassword("MatKhau@12345");
        request.setHoTen("Nhan Vien Service");

        User created = authService.createUser(request);

        assertThat(created.getRole()).isEqualTo(Role.STAFF);
    }

    // ------------------------------------------------------------------
    // DTO register không còn trường role
    // ------------------------------------------------------------------

    @Test
    @Transactional
    void shouldNotExposeRoleFieldInRegisterRequest() {
        boolean hasRole = false;
        for (var field : RegisterRequest.class.getDeclaredFields()) {
            if ("role".equalsIgnoreCase(field.getName())) {
                hasRole = true;
                break;
            }
        }
        // Client không có trường role để gửi lên, nên không thể tự nâng quyền
        // dù cố tình thêm vào JSON.
        assertThat(hasRole).isFalse();
    }

    // ------------------------------------------------------------------
    // Vô hiệu hoá tài khoản chặn đăng nhập
    // ------------------------------------------------------------------

    @Test
    @Transactional
    void shouldBlockLoginAfterDeactivation() {
        createUser("deact01", Role.STAFF);

        authService.deactivateUser("deact01");

        assertThat(userRepository.findByUsername("deact01").orElseThrow().getIsActive())
                .isFalse();
    }

    // ------------------------------------------------------------------
    // Refresh token không hợp lệ phải bị từ chối
    // ------------------------------------------------------------------

    @Test
    @Transactional
    void shouldRejectGarbageRefreshToken() {
        assertThat(jwtService.validateToken("abc.def.ghi")).isFalse();
        assertThat(jwtService.isRefreshToken("abc.def.ghi")).isFalse();
    }
}
