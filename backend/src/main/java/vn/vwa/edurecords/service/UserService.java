package vn.vwa.edurecords.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.vwa.edurecords.dto.request.RegisterRequest;
import vn.vwa.edurecords.dto.request.UpdateRoleRequest;
import vn.vwa.edurecords.dto.request.UserUpdateProfileRequest;
import vn.vwa.edurecords.dto.response.UserResponse;
import vn.vwa.edurecords.entity.User;
import vn.vwa.edurecords.entity.enums.Role;
import vn.vwa.edurecords.exception.BadRequestException;
import vn.vwa.edurecords.exception.ResourceNotFoundException;
import vn.vwa.edurecords.repository.UserRepository;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    /** Tên bảng dùng cho các bản ghi audit liên quan tới tài khoản người dùng. */
    private static final String BANG_USERS = "users";

    private final UserRepository userRepository;
    private final AuditService auditService;

    public UserService(UserRepository userRepository, AuditService auditService) {
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public Optional<User> findByUsername(String username) {
        if (username == null || username.isBlank()) {
            return Optional.empty();
        }
        return userRepository.findByUsername(username);
    }

    @Transactional(readOnly = true)
    public List<User> findAll() {
        return userRepository.findAll();
    }

    @Transactional
    public UserResponse updateProfile(String username, UserUpdateProfileRequest req) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("USER_NOT_FOUND",
                        "Không tìm thấy tài khoản: " + username));
        String hoTenCu = user.getHoTen();
        user.setHoTen(req.getHoTen().trim());
        user.setEmail(req.getEmail() != null ? req.getEmail().trim() : null);
        UserResponse result = UserResponse.fromEntity(userRepository.save(user));
        auditService.log("UPDATE_PROFILE", BANG_USERS, username,
                "ho_ten", hoTenCu, user.getHoTen());
        return result;
    }

    @Transactional
    public UserResponse updateRole(String username, UpdateRoleRequest req) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("USER_NOT_FOUND",
                        "Không tìm thấy tài khoản: " + username));
        String roleCu = user.getRole().name();
        user.setRole(req.getRole());
        UserResponse result = UserResponse.fromEntity(userRepository.save(user));
        auditService.log("UPDATE_ROLE", BANG_USERS, username,
                "role", roleCu, req.getRole().name());
        return result;
    }

    /**
     * Kích hoạt tài khoản.
     */
    @Transactional
    public UserResponse activateUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("USER_NOT_FOUND",
                        "Không tìm thấy tài khoản: " + username));
        user.setIsActive(true);
        UserResponse result = UserResponse.fromEntity(userRepository.save(user));
        auditService.log("ACTIVATE_USER", BANG_USERS, username,
                "is_active", "false", "true");
        return result;
    }

    /**
     * Đếm số admin đang hoạt động.
     */
    @Transactional(readOnly = true)
    public long countActiveAdmins() {
        return userRepository.countByRoleAndIsActiveTrue(Role.ADMIN);
    }
}
