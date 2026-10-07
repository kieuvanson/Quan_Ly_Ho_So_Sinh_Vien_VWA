package vn.vwa.edurecords.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.vwa.edurecords.dto.response.ApiResponse;
import vn.vwa.edurecords.dto.response.UserResponse;
import vn.vwa.edurecords.exception.ResourceNotFoundException;
import vn.vwa.edurecords.service.AuthService;
import vn.vwa.edurecords.service.UserService;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final AuthService authService;

    public UserController(UserService userService, AuthService authService) {
        this.userService = userService;
        this.authService = authService;
    }

    /**
     * Thông tin tài khoản đang đăng nhập.
     *
     * Username lấy từ SecurityContext (do JwtAuthenticationFilter thiết lập),
     * không đọc và parse lại JWT trong controller — tránh lặp logic xác thực
     * và tránh phụ thuộc header Authorization phải có mặt.
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser(
            @AuthenticationPrincipal String username) {
        return userService.findByUsername(username)
                .map(user -> ResponseEntity.ok(ApiResponse.success(UserResponse.fromEntity(user))))
                .orElseThrow(() -> new ResourceNotFoundException("USER_NOT_FOUND",
                        "Không tìm thấy tài khoản đang đăng nhập."));
    }

    /** Danh sách tài khoản — chỉ ADMIN. */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<java.util.List<UserResponse>>> getAllUsers() {
        return ResponseEntity.ok(ApiResponse.success(userService.findAll().stream()
                .map(UserResponse::fromEntity)
                .toList()));
    }

    /** Vô hiệu hoá tài khoản và thu hồi toàn bộ phiên đăng nhập của tài khoản đó. */
    @PostMapping("/{username}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> deactivate(@PathVariable String username) {
        return ResponseEntity.ok(ApiResponse.success("Vô hiệu hoá tài khoản thành công",
                authService.deactivateUser(username)));
    }
}
