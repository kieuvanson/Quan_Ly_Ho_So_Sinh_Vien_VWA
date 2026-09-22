package vn.vwa.edurecords.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import vn.vwa.edurecords.entity.User;
import vn.vwa.edurecords.entity.enums.Role;
import vn.vwa.edurecords.repository.UserRepository;

@Component
public class AdminDataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminDataSeeder.class);

    private static final String DEFAULT_USERNAME = "Phamthuylinh";
    private static final String DEFAULT_PASSWORD = "03102004";
    private static final String DEFAULT_HOTEN = "Phạm Thùy Linh";
    private static final String DEFAULT_EMAIL = null;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminDataSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (userRepository.existsByUsername(DEFAULT_USERNAME)) {
            log.info("Tài khoản admin '{}' đã tồn tại, bỏ qua seed.", DEFAULT_USERNAME);
            return;
        }

        User admin = new User(
                DEFAULT_USERNAME,
                passwordEncoder.encode(DEFAULT_PASSWORD),
                DEFAULT_HOTEN,
                DEFAULT_EMAIL,
                Role.ADMIN);

        userRepository.save(admin);
        log.info("Đã tạo tài khoản admin mặc định: username={}, role=ADMIN", DEFAULT_USERNAME);
    }
}
