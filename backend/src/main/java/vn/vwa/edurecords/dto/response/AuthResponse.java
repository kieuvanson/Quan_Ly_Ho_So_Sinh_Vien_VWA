package vn.vwa.edurecords.dto.response;

public record AuthResponse(
        UserResponse user,
        TokenResponse token
) {
}
