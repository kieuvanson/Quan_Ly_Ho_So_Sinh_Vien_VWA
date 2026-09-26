package vn.vwa.edurecords.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.vwa.edurecords.dto.request.SinhVienSearchRequest;
import vn.vwa.edurecords.dto.response.ApiResponse;
import vn.vwa.edurecords.dto.response.PagedResponse;
import vn.vwa.edurecords.entity.SinhVien;
import vn.vwa.edurecords.service.SinhVienService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sinh-vien")
@CrossOrigin(origins = "*")
public class SinhVienController {

    private final SinhVienService sinhVienService;

    public SinhVienController(SinhVienService sinhVienService) {
        this.sinhVienService = sinhVienService;
    }

    /**
     * GET /api/sinh-vien
     * Tìm kiếm + lọc + phân trang.
     * Tất cả query params được áp dụng đồng thời (AND).
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<PagedResponse<List<SinhVien>>>> search(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String trangThaiHocVu,
            @RequestParam(required = false) String nganh,
            @RequestParam(required = false) String lop,
            @RequestParam(required = false) String khoaNamNhapHoc,
            @RequestParam(required = false) String khoa,
            @RequestParam(required = false) String heDaoTao,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "0") int sortDirection) {

        SinhVienSearchRequest req = new SinhVienSearchRequest();
        req.setKeyword(keyword);
        req.setTrangThaiHocVu(trangThaiHocVu);
        req.setNganh(nganh);
        req.setLop(lop);
        req.setKhoaNamNhapHoc(khoaNamNhapHoc);
        req.setKhoa(khoa);
        req.setHeDaoTao(heDaoTao);
        req.setPage(page);
        req.setSize(Math.min(size, 100));
        req.setSortDirection(sortDirection);

        PagedResponse<List<SinhVien>> result = sinhVienService.search(req);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * GET /api/sinh-vien/{mssv}
     * Chi tiết sinh viên.
     */
    @GetMapping("/{mssv}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<SinhVien>> getByMssv(@PathVariable String mssv) {
        return sinhVienService.getByMssv(mssv)
                .map(sv -> ResponseEntity.ok(ApiResponse.success(sv)))
                .orElse(ResponseEntity.ok(ApiResponse.error(
                        404, "NOT_FOUND", "Không tìm thấy sinh viên với MSSV: " + mssv)));
    }

    /**
     * GET /api/sinh-vien/stats
     * Thống kê tổng quan.
     */
    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("tongSoSinhVien", sinhVienService.getTotalCount());
        stats.put("dangHoc", sinhVienService.countByTrangThai("Đang học"));
        stats.put("totNghiep", sinhVienService.countByTrangThai("Tốt nghiệp"));
        stats.put("baoLuu", sinhVienService.countByTrangThai("Bảo lưu"));
        stats.put("dinhChi", sinhVienService.countByTrangThai("Đình chỉ"));
        stats.put("daRutHoSo", sinhVienService.countByTrangThai("Đã rút hồ sơ"));
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    /**
     * POST /api/sinh-vien
     * Tạo sinh viên mới.
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> create(@Valid @RequestBody SinhVien sinhVien) {
        return ResponseEntity.ok(ApiResponse.success("Tính năng đang phát triển", (Void) null));
    }

    /**
     * PUT /api/sinh-vien/{mssv}
     * Cập nhật sinh viên.
     */
    @PutMapping("/{mssv}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> update(
            @PathVariable String mssv,
            @Valid @RequestBody SinhVien sinhVien) {
        return ResponseEntity.ok(ApiResponse.success("Tính năng đang phát triển", (Void) null));
    }

    /**
     * DELETE /api/sinh-vien/{mssv}
     * Xóa sinh viên.
     */
    @DeleteMapping("/{mssv}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String mssv) {
        return ResponseEntity.ok(ApiResponse.success("Tính năng đang phát triển", (Void) null));
    }
}
