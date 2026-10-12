package vn.vwa.edurecords.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import vn.vwa.edurecords.dto.request.UpdateRoleRequest;
import vn.vwa.edurecords.dto.request.UserUpdateProfileRequest;
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

    /**
     * PUT /api/users/{username}/profile
     * Cập nhật hồ sơ (hoTen, email). ADMIN tự sửa hoặc sửa user khác.
     */
    @PutMapping("/{username}/profile")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(
            @PathVariable String username,
            @Valid @RequestBody UserUpdateProfileRequest req) {
        UserResponse result = userService.updateProfile(username, req);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật hồ sơ thành công.", result));
    }

    /**
     * PUT /api/users/{username}/role
     * Thay đổi vai trò user. ADMIN không thể tự thay đổi vai trò của chính mình.
     */
    @PutMapping("/{username}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> updateRole(
            @PathVariable String username,
            @AuthenticationPrincipal String currentUsername,
            @Valid @RequestBody UpdateRoleRequest req) {
        if (currentUsername.equals(username)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                    ApiResponse.error(400, "SELF_ROLE_CHANGE",
                            "Không thể thay đổi vai trò của chính mình."));
        }
        UserResponse result = userService.updateRole(username, req);
        return ResponseEntity.ok(ApiResponse.success("Thay đổi vai trò thành công.", result));
    }

    /**
     * POST /api/users/{username}/activate
     * Kích hoạt lại tài khoản đã bị vô hiệu hoá.
     */
    @PostMapping("/{username}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> activate(@PathVariable String username) {
        UserResponse result = userService.activateUser(username);
        return ResponseEntity.ok(ApiResponse.success("Kích hoạt tài khoản thành công.", result));
    }
}
