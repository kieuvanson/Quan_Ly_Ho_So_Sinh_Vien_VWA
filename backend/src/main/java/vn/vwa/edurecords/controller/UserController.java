package vn.vwa.edurecords.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.vwa.edurecords.dto.response.ApiResponse;
import vn.vwa.edurecords.dto.response.UserResponse;
import vn.vwa.edurecords.entity.User;
import vn.vwa.edurecords.repository.UserRepository;
import vn.vwa.edurecords.security.JwtService;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    private final UserRepository userRepository;
    private final JwtService jwtService;

    public UserController(UserRepository userRepository, JwtService jwtService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
    }

    /**
     * GET /api/users/me
     * Lấy thông tin cá nhân của người dùng đang đăng nhập (ADMIN).
     */
    @GetMapping("/me")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser(
            @RequestHeader("Authorization") String authHeader) {

        String token = authHeader.replace("Bearer ", "");
        String username = jwtService.extractUsername(token);

        return userRepository.findByUsername(username)
                .map(user -> ResponseEntity.ok(ApiResponse.success(UserResponse.fromEntity(user))))
                .orElseGet(() -> ResponseEntity.status(404).body(
                        ApiResponse.error(404, "NOT_FOUND", "Không tìm thấy người dùng")));
    }

    /**
     * GET /api/users
     * Lấy danh sách tất cả người dùng
     * Chỉ ADMIN
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<?>> getAllUsers() {
        return ResponseEntity.ok(ApiResponse.success("Tính năng đang phát triển"));
    }
}
