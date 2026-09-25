package vn.vwa.edurecords.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import vn.vwa.edurecords.entity.User;
import vn.vwa.edurecords.entity.enums.Role;
import vn.vwa.edurecords.repository.UserRepository;

@Component
public class AdminBootstrap implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (!userRepository.existsByUsername("Phamthuylinh")) {
            User admin = User.builder()
                    .username("Phamthuylinh")
                    .passwordHash(passwordEncoder.encode("03102004"))
                    .hoTen("Phạm Thị Linh")
                    .email("phamthuylinh@vwa.edu.vn")
                    .role(Role.ADMIN)
                    .isActive(true)
                    .build();
            userRepository.save(admin);
            System.out.println("✅ Created default user: Phamthuylinh / 03102004");
        }
    }
}
