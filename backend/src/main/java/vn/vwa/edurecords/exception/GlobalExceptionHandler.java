package vn.vwa.edurecords.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import vn.vwa.edurecords.dto.response.ApiResponse;

import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /** Trả 404 kèm mã lỗi ổn định do service định nghĩa. */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(404, ex.getCode(), ex.getMessage()));
    }

    /**
     * Trả 409 thay vì 400 khi request vi phạm trạng thái nghiệp vụ hiện tại
     * (ví dụ rút hồ sơ khi còn phiếu chưa trả). 409 giúp client phân biệt được
     * "dữ liệu sai" với "trạng thái không cho phép thao tác".
     */
    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ApiResponse<Void>> handleBadRequest(BadRequestException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiResponse.error(409, ex.getCode(), ex.getMessage()));
    }

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ApiResponse<Void>> handleApi(ApiException ex) {
        return ResponseEntity.status(ex.getStatus().value())
                .body(ApiResponse.error(ex.getStatus().value(), ex.getCode(), ex.getMessage()));
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ApiResponse<Void>> handleUnauthorized(UnauthorizedException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error(401, "UNAUTHORIZED", ex.getMessage()));
    }

    /** Token hợp lệ về mặt hình thức nhưng không đủ quyền. */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDenied(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error(403, "FORBIDDEN", "Bạn không có quyền thực hiện thao tác này."));
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiResponse<Void>> handleAuthentication(AuthenticationException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error(401, "UNAUTHORIZED", "Yêu cầu xác thực không hợp lệ."));
    }

    /**
     * Bean Validation trên {@code @RequestBody}. Trả 400 kèm danh sách lỗi theo
     * từng field để frontend hiển thị được ngay cạnh input.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(MethodArgumentNotValidException ex) {
        String detail = ex.getBindingResult().getFieldErrors().stream()
                .map(this::describeFieldError)
                .collect(Collectors.joining("; "));

        return ResponseEntity.badRequest()
                .body(ApiResponse.error(400, "VALIDATION_FAILED",
                        detail.isEmpty() ? "Dữ liệu gửi lên không hợp lệ." : detail));
    }

    private String describeFieldError(FieldError error) {
        return error.getField() + ": " + error.getDefaultMessage();
    }

    /** Body không đọc được: JSON sai cú pháp, kiểu dữ liệu không khớp, enum không hợp lệ. */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<Void>> handleNotReadable(HttpMessageNotReadableException ex) {
        log.debug("Body không đọc được: {}", ex.getMessage());
        return ResponseEntity.badRequest()
                .body(ApiResponse.error(400, "MALFORMED_REQUEST",
                        "Định dạng dữ liệu gửi lên không hợp lệ."));
    }

    /**
     * Vi phạm ràng buộc DB (unique, foreign key, check). Trả 409 kèm mã lỗi
     * chung — không trả message của driver vì có thể chứa tên bảng/cột.
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleDataIntegrity(DataIntegrityViolationException ex) {
        log.warn("Vi phạm ràng buộc dữ liệu: {}", ex.getMostSpecificCause().getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiResponse.error(409, "DATA_CONFLICT",
                        "Dữ liệu đã tồn tại hoặc vi phạm ràng buộc với dữ liệu khác."));
    }

    /**
     * Lỗi ngoài dự kiến. Chi tiết (stack trace, câu SQL) chỉ ghi log server,
     * không trả về client để tránh lộ thông tin nội bộ.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGeneral(Exception ex) {
        log.error("Lỗi không mong đợi khi xử lý request", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error(500, "INTERNAL_ERROR",
                        "Đã xảy ra lỗi. Vui lòng thử lại hoặc liên hệ quản trị viên."));
    }
}
