package vn.vwa.edurecords.controller;

import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vn.vwa.edurecords.dto.response.ApiResponse;
import vn.vwa.edurecords.dto.response.AuditLogResponse;
import vn.vwa.edurecords.dto.response.PagedResponse;
import vn.vwa.edurecords.service.AuditLogQueryService;

import java.util.List;

/**
 * Controller đọc nhật ký hệ thống (bảng {@code audit_log}).
 *
 * <p>Dùng cho màn hình "Lịch sử hoạt động":
 * <ul>
 *   <li>tab "Thay đổi thông tin sinh viên" — {@code bang=sinhvien}
 *       (chỉ đúng nhóm bản ghi tác động bảng {@code sinhvien}).</li>
 *   <li>tab "Nhật ký hệ thống" — {@code bangKhac=sinhvien}
 *       (mọi bản ghi audit TRỪ nhóm {@code sinhvien}, tránh trùng tab trên).</li>
 * </ul>
 *
 * <p>Toàn bộ endpoint yêu cầu quyền ADMIN — nhật ký hệ thống là dữ liệu nội bộ
 * của đơn vị, không cho STAFF xem.</p>
 */
@RestController
@RequestMapping("/api/audit-log")
public class AuditLogController {

    private final AuditLogQueryService auditLogQueryService;

    public AuditLogController(AuditLogQueryService auditLogQueryService) {
        this.auditLogQueryService = auditLogQueryService;
    }

    /**
     * GET /api/audit-log?bang=&bangKhac=&hanhDong=&keyword=&nguoiThucHien=&fromDate=&toDate=&page=&size=
     *
     * <p>Lấy danh sách bản ghi nhật ký hệ thống, có lọc + phân trang.</p>
     *
     * <ul>
     *   <li>{@code bang} — tên bảng bị tác động (VD: {@code sinhvien},
     *       {@code phieu_xuat_ho_so}). Bỏ trống = tất cả.</li>
     *   <li>{@code bangKhac} — tên bảng cần loại trừ (VD: {@code sinhvien} để
     *       lấy nhật ký hệ thống mà không trùng tab thay đổi thông tin SV).</li>
     *   <li>{@code hanhDong} — mã hành động. Bỏ trống = tất cả.</li>
     *   <li>{@code keyword} — từ khoá: MSSV, họ tên SV, khoá chính, trường
     *       thay đổi, giá trị trước/sau, người thực hiện.</li>
     *   <li>{@code nguoiThucHien} — username cán bộ thực hiện. Khớp CHÍNH XÁC
     *       (không phân biệt hoa thường), không phải tìm gần đúng. Bỏ trống = tất cả.</li>
     *   <li>{@code fromDate} / {@code toDate} — khoảng ngày (yyyy-MM-dd), so sánh
     *       trên {@code audit_log.thoi_gian}.</li>
     * </ul>
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PagedResponse<List<AuditLogResponse>>>> search(
            @RequestParam(required = false) String bang,
            @RequestParam(required = false) String bangKhac,
            @RequestParam(required = false) String hanhDong,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String nguoiThucHien,
            @RequestParam(required = false) String fromDate,
            @RequestParam(required = false) String toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Page<AuditLogResponse> result = auditLogQueryService.search(
                bang, bangKhac, hanhDong, keyword, nguoiThucHien, fromDate, toDate, page, size);

        PagedResponse.PageMetadata meta = new PagedResponse.PageMetadata(
                result.getNumber(), result.getSize(), result.getTotalElements());
        PagedResponse<List<AuditLogResponse>> paged =
                new PagedResponse<>(result.getContent(), meta);

        return ResponseEntity.ok(ApiResponse.success("Lấy nhật ký hệ thống thành công", paged));
    }

    /**
     * GET /api/audit-log/{id}
     * Lấy chi tiết một bản ghi nhật ký hệ thống (ADMIN).
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AuditLogResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(
                "Lấy chi tiết nhật ký hệ thống thành công",
                auditLogQueryService.requireById(id)));
    }
}
