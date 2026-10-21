package vn.vwa.edurecords.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request body cho admin cập nhật hồ sơ user (hoTen, email).
 * KHÔNG cho sửa username — đó là khóa không đổi.
 * KHÔNG cho sửa role qua endpoint này — dùng UpdateRoleRequest.
 */
public class UserUpdateProfileRequest {

    @NotBlank(message = "Họ tên không được để trống.")
    @Size(max = 150, message = "Họ tên tối đa 150 ký tự.")
    private String hoTen;

    @Email(message = "Email không hợp lệ.")
    @Size(max = 150, message = "Email tối đa 150 ký tự.")
    private String email;

    public String getHoTen() { return hoTen; }
    public void setHoTen(String hoTen) { this.hoTen = hoTen; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}
