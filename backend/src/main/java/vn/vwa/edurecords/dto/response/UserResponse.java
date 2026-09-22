package vn.vwa.edurecords.dto.response;

import java.util.UUID;

public record UserResponse(
        UUID id,
        String username,
        String hoTen,
        String email,
        String role
) {
}
