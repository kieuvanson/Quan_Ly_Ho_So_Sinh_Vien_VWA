package vn.vwa.edurecords.dto.request;

import jakarta.validation.constraints.NotNull;
import vn.vwa.edurecords.entity.enums.Role;

/**
 * Request body cho admin thay đổi vai trò user.
 */
public class UpdateRoleRequest {

    @NotNull(message = "Vai trò không được để trống.")
    private Role role;

    public UpdateRoleRequest() {}

    public UpdateRoleRequest(Role role) {
        this.role = role;
    }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
}
