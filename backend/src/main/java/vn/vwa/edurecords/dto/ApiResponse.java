package vn.vwa.edurecords.dto;

import java.time.Instant;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiResponse<T>(
        boolean success,
        int status,
        String code,
        String message,
        T data,
        Instant timestamp
) {

    public static <T> ApiResponse<T> ok(T data, String message) {
        return new ApiResponse<>(true, 200, "SUCCESS", message, data, Instant.now());
    }

    public static <T> ApiResponse<T> created(T data, String message) {
        return new ApiResponse<>(true, 201, "CREATED", message, data, Instant.now());
    }
}
