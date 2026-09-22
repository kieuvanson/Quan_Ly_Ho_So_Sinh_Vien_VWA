package vn.vwa.edurecords.dto;

import java.time.Instant;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErrorResponse(
        boolean success,
        int status,
        String code,
        String message,
        List<FieldError> errors,
        Instant timestamp
) {

    public record FieldError(String field, String message) {
    }

    public static ErrorResponse of(int status, String code, String message) {
        return new ErrorResponse(false, status, code, message, null, Instant.now());
    }

    public static ErrorResponse of(int status, String code, String message, List<FieldError> errors) {
        return new ErrorResponse(false, status, code, message, errors, Instant.now());
    }
}
