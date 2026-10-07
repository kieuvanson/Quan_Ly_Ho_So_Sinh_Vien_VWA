package vn.vwa.edurecords.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import vn.vwa.edurecords.entity.User;
import vn.vwa.edurecords.entity.enums.Role;
import vn.vwa.edurecords.repository.UserRepository;

/**
 * Tạo tài khoản quản trị đầu tiên khi khởi động nếu chưa có.
 *
 * <h3>Quy tắc an toàn</h3>
 * <ul>
 *   <li>Thông tin tài khoản và mật khẩu lấy từ biến môi trường, không hardcode
 *       trong mã nguồn. Không có biến thì bỏ qua, KHÔNG tạo tài khoản mặc định.</li>
 *   <li>Chỉ chạy khi bảng {@code users} đang trống hoàn toàn — không tự reset mật
 *       khẩu của tài khoản đã tồn tại.</li>
 * </ul>
 *
 * Biến môi trường cần đặt:
 * {@code APP_ADMIN_USERNAME}, {@code APP_ADMIN_PASSWORD}, {@code APP_ADMIN_HO_TEN},
 * {@code APP_ADMIN_EMAIL} (tuỳ chọn).
 */
@Component
public class AdminBootstrap implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminBootstrap.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String username;
    private final String password;
    private final String hoTen;
    private final String email;

    public AdminBootstrap(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.admin.username:}") String username,
            @Value("${app.admin.password:}") String password,
            @Value("${app.admin.ho-ten:}") String hoTen,
            @Value("${app.admin.email:}") String email) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.username = username;
        this.password = password;
        this.hoTen = hoTen;
        this.email = email;
    }

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            log.debug("Đã có tài khoản trong hệ thống, bỏ qua bước khởi tạo admin.");
            return;
        }

        if (username.isBlank() || password.isBlank()) {
            log.warn("Bảng users đang trống nhưng thiếu APP_ADMIN_USERNAME/APP_ADMIN_PASSWORD. "
                    + "Bỏ qua khởi tạo. Hãy đặt các biến này rồi khởi động lại, "
                    + "hoặc dùng script quản trị riêng để tạo tài khoản đầu tiên.");
            return;
        }

        if (password.length() < 12) {
            log.error("Mật khẩu admin từ biến môi trường quá ngắn (cần ít nhất 12 ký tự). Bỏ qua khởi tạo.");
            return;
        }

        userRepository.save(User.builder()
                .username(username)
                .passwordHash(passwordEncoder.encode(password))
                .hoTen(hoTen.isBlank() ? username : hoTen)
                .email(email.isBlank() ? null : email)
                .role(Role.ADMIN)
                .isActive(true)
                .build());

        log.info("Đã tạo tài khoản quản trị '{}'. Đổi mật khẩu sau lần đăng nhập đầu tiên.", username);
    }
}
