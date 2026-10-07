package vn.vwa.edurecords.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request body cho tạo tài khoản nhân viên.
 *
 * KHÔNG có field `role`: vai trò do Admin quyết định, không bao giờ nhận từ client.
 * Client tự gửi `role` sẽ bị Jackson bỏ qua (FAIL_ON_UNKNOWN_PROPERTIES) hoặc
 * bị từ chối tường minh — xem {@code AuthService.createUser}.
 */
public class RegisterRequest {

    @NotBlank(message = "Username không được để trống")
    @Size(min = 3, max = 50, message = "Username phải dài 3-50 ký tự")
    private String username;

    @NotBlank(message = "Password không được để trống")
    @Size(min = 8, max = 100, message = "Password phải dài ít nhất 8 ký tự")
    private String password;

    @NotBlank(message = "Họ tên không được để trống")
    @Size(max = 150, message = "Họ tên tối đa 150 ký tự")
    private String hoTen;

    @Email(message = "Email không hợp lệ")
    @Size(max = 150, message = "Email tối đa 150 ký tự")
    private String email;

    public RegisterRequest() {}

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getHoTen() { return hoTen; }
    public void setHoTen(String hoTen) { this.hoTen = hoTen; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}
