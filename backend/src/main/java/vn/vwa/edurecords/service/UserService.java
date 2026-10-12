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

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
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
        user.setHoTen(req.getHoTen().trim());
        user.setEmail(req.getEmail() != null ? req.getEmail().trim() : null);
        return UserResponse.fromEntity(userRepository.save(user));
    }

    @Transactional
    public UserResponse updateRole(String username, UpdateRoleRequest req) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("USER_NOT_FOUND",
                        "Không tìm thấy tài khoản: " + username));
        user.setRole(req.getRole());
        return UserResponse.fromEntity(userRepository.save(user));
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
        return UserResponse.fromEntity(userRepository.save(user));
    }

    /**
     * Đếm số admin đang hoạt động.
     */
    @Transactional(readOnly = true)
    public long countActiveAdmins() {
        return userRepository.countByRoleAndIsActiveTrue(Role.ADMIN);
    }
}
