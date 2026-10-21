package vn.vwa.edurecords.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vn.vwa.edurecords.dto.response.ApiResponse;
import vn.vwa.edurecords.dto.response.ThongKeHoSoResponse;
import vn.vwa.edurecords.dto.response.ThongKeMuonTraResponse;
import vn.vwa.edurecords.dto.response.ThongKeNganhResponse;
import vn.vwa.edurecords.service.ThongKeService;

/**
 * Controller xử lý các API thống kê tổng hợp cho trang Báo cáo - Thống kê.
 * 
 * <p>Tất cả endpoints yêu cầu quyền ADMIN.</p>
 */
@RestController
@RequestMapping("/api/thong-ke")
public class ThongKeController {

    private final ThongKeService thongKeService;

    public ThongKeController(ThongKeService thongKeService) {
        this.thongKeService = thongKeService;
    }

    /**
     * GET /api/thong-ke/sinh-vien-theo-nganh
     * 
     * Thống kê sinh viên theo ngành, có filter theo khóa học.
     *
     * @param khoaHocId ID khóa học để filter (optional)
     * @return Danh sách ngành với số lượng và tỷ lệ sinh viên
     */
    @GetMapping("/sinh-vien-theo-nganh")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ThongKeNganhResponse>> thongKeSinhVienTheoNganh(
            @RequestParam(required = false) Integer khoaHocId) {
        ThongKeNganhResponse result = thongKeService.thongKeSinhVienTheoNganh(khoaHocId);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * GET /api/thong-ke/ho-so
     * 
     * Thống kê hồ sơ toàn hệ thống (đầy đủ/còn thiếu).
     *
     * <p>Quy tắc:
     * <ul>
     *   <li>Chỉ 8 giấy tờ bắt buộc (GT01-GT08) được tính.</li>
     *   <li>Hồ sơ đầy đủ = sinh viên có đủ 8/8 giấy tờ bắt buộc với trạng thái "Đã nộp".</li>
     *   <li>Hồ sơ còn thiếu = sinh viên còn thiếu ít nhất 1 giấy tờ bắt buộc.</li>
     * </ul>
     *
     * @return Thống kê hồ sơ
     */
    @GetMapping("/ho-so")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ThongKeHoSoResponse>> thongKeHoSo() {
        ThongKeHoSoResponse result = thongKeService.thongKeHoSo();
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * GET /api/thong-ke/muon-tra
     * 
     * Thống kê mượn/trả hồ sơ toàn hệ thống.
     *
     * <p>Chỉ thống kê phiếu "Mượn tạm thời":
     * <ul>
     *   <li>Đang mượn: trạng thái "Đang mượn".</li>
     *   <li>Đã trả: trạng thái "Đã trả".</li>
     *   <li>Quá hạn: trạng thái "Quá hạn".</li>
     * </ul>
     *
     * @return Thống kê mượn/trả
     */
    @GetMapping("/muon-tra")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ThongKeMuonTraResponse>> thongKeMuonTra() {
        ThongKeMuonTraResponse result = thongKeService.thongKeMuonTra();
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
