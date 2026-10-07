package vn.vwa.edurecords.controller;

import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import vn.vwa.edurecords.dto.request.SinhVienSearchRequest;
import vn.vwa.edurecords.dto.response.ApiResponse;
import vn.vwa.edurecords.dto.response.PagedResponse;
import vn.vwa.edurecords.entity.SinhVien;
import vn.vwa.edurecords.service.SinhVienExcelService;
import vn.vwa.edurecords.service.SinhVienService;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sinh-vien")
public class SinhVienController {

    private static final Logger log = LoggerFactory.getLogger(SinhVienController.class);

    /** Giới hạn kích thước file import để tránh cạn bộ nhớ khi đọc .xlsx. */
    private static final long MAX_IMPORT_FILE_SIZE = 10L * 1024 * 1024;

    private final SinhVienService sinhVienService;
    private final SinhVienExcelService sinhVienExcelService;

    public SinhVienController(
        SinhVienService sinhVienService,
        SinhVienExcelService sinhVienExcelService
    ) {
        this.sinhVienService = sinhVienService;
        this.sinhVienExcelService = sinhVienExcelService;
    }

    /**
     * GET /api/sinh-vien
     * Tìm kiếm + lọc + phân trang (ADMIN).
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PagedResponse<List<SinhVien>>>> search(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String trangThaiHocVu,
            @RequestParam(required = false) String nganh,
            @RequestParam(required = false) String lop,
            @RequestParam(required = false) String khoaNamNhapHoc,
            @RequestParam(required = false) String khoa,
            @RequestParam(required = false) String heDaoTao,
            // *_id trực tiếp (ưu tiên nếu client gửi cả 2 — *_id thắng).
            @RequestParam(required = false) Integer khoaId,
            @RequestParam(required = false) Integer nganhId,
            @RequestParam(required = false) Integer lopId,
            @RequestParam(required = false) Integer khoaHocId,
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
        req.setKhoaId(khoaId);
        req.setNganhId(nganhId);
        req.setLopId(lopId);
        req.setKhoaHocId(khoaHocId);
        req.setPage(page);
        req.setSize(Math.min(size, 100));
        req.setSortDirection(sortDirection);

        PagedResponse<List<SinhVien>> result = sinhVienService.search(req);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * GET /api/sinh-vien/{mssv}
     * Chi tiết sinh viên (ADMIN).
     */
    @GetMapping("/{mssv}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<SinhVien>> getByMssv(@PathVariable String mssv) {
        return sinhVienService.getByMssv(mssv)
                .map(sv -> ResponseEntity.ok(ApiResponse.success(sv)))
                .orElseGet(() -> ResponseEntity.status(404).body(
                        ApiResponse.error(404, "NOT_FOUND", "Không tìm thấy sinh viên với MSSV: " + mssv)));
    }

    /**
     * GET /api/sinh-vien/stats
     * Thống kê tổng quan (ADMIN).
     */
    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStats() {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("tongSoSinhVien", sinhVienService.getTotalCount());
        stats.put("dangHoc", sinhVienService.countByTrangThai("Đang học"));
        stats.put("totNghiep", sinhVienService.countByTrangThai("Tốt nghiệp"));
        stats.put("baoLuu", sinhVienService.countByTrangThai("Bảo lưu"));
        stats.put("dinhChi", sinhVienService.countByTrangThai("Đình chỉ"));
        stats.put("daRutHoSo", sinhVienService.countByTrangThai("Đã rút hồ sơ"));
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    /**
     * POST /api/sinh-vien - Tạo sinh viên (ADMIN).
     *
     * Chưa implement. Trả 501 NOT_IMPLEMENTED thay vì 200 với message "đang phát
     * triển": trả 200 khiến client tưởng đã ghi thành công rồi refresh dữ liệu và
     * mất những gì người dùng vừa nhập.
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> create(@Valid @RequestBody SinhVien sinhVien) {
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED)
                .body(ApiResponse.error(501, "NOT_IMPLEMENTED",
                        "Tạo sinh viên chưa được hỗ trợ. Hãy dùng chức năng import Excel."));
    }

    /**
     * PUT /api/sinh-vien/{mssv} - Cập nhật (ADMIN).
     */
    @PutMapping("/{mssv}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> update(
            @PathVariable String mssv,
            @Valid @RequestBody SinhVien sinhVien) {
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED)
                .body(ApiResponse.error(501, "NOT_IMPLEMENTED",
                        "Cập nhật sinh viên chưa được hỗ trợ. Hãy dùng chức năng import Excel."));
    }

    /**
     * DELETE /api/sinh-vien/{mssv} - Xóa (ADMIN).
     *
     * Xóa sinh viên sẽ cascade xoá hồ sơ giấy tờ và lịch sử nộp — vi phạm nguyên
     * tắc "không ghi đè dữ liệu audit". Cần chuyển sang soft-delete hoặc chỉ cho
     * đổi trạng thái học vụ thay vì xóa hẳn.
     */
    @DeleteMapping("/{mssv}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String mssv) {
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED)
                .body(ApiResponse.error(501, "NOT_IMPLEMENTED",
                        "Xóa sinh viên không được phép vì sẽ mất lịch sử hồ sơ. "
                                + "Hãy cập nhật trạng thái học vụ thay vì xóa."));
    }

    // ================== IMPORT / EXPORT EXCEL ==================

    /**
     * GET /api/sinh-vien/export?keyword=&nganh=&...
     * Trả về file .xlsx theo cùng filter với search.
     * Hỗ trợ thêm tham số scope:
     *   - "filtered" (mặc định): toàn bộ kết quả theo filter (size=10000)
     *   - "page": chỉ trang hiện tại
     */
    @GetMapping("/export")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ByteArrayResource> exportExcel(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String trangThaiHocVu,
            @RequestParam(required = false) String nganh,
            @RequestParam(required = false) String lop,
            @RequestParam(required = false) String khoaNamNhapHoc,
            @RequestParam(required = false) String khoa,
            @RequestParam(required = false) String heDaoTao,
            @RequestParam(required = false) Integer khoaId,
            @RequestParam(required = false) Integer nganhId,
            @RequestParam(required = false) Integer lopId,
            @RequestParam(required = false) Integer khoaHocId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "0") int sortDirection,
            @RequestParam(defaultValue = "filtered") String scope) {

        try {
            SinhVienSearchRequest req = new SinhVienSearchRequest();
            req.setKeyword(keyword);
            req.setTrangThaiHocVu(trangThaiHocVu);
            req.setNganh(nganh);
            req.setLop(lop);
            req.setKhoaNamNhapHoc(khoaNamNhapHoc);
            req.setKhoa(khoa);
            req.setHeDaoTao(heDaoTao);
            req.setKhoaId(khoaId);
            req.setNganhId(nganhId);
            req.setLopId(lopId);
            req.setKhoaHocId(khoaHocId);
            req.setSortDirection(sortDirection);

            List<SinhVien> data;
            if ("page".equalsIgnoreCase(scope)) {
                req.setPage(page);
                req.setSize(size);
                PagedResponse<List<SinhVien>> result = sinhVienService.search(req);
                data = result.getData();
            } else {
                // filtered: lấy tất cả - size tối đa
                req.setPage(0);
                req.setSize(10000);
                PagedResponse<List<SinhVien>> result = sinhVienService.search(req);
                data = result.getData();
            }

            byte[] bytes = sinhVienExcelService.export(data);
            String filename = "danh-sach-sinh-vien-" + System.currentTimeMillis() + ".xlsx";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            headers.set(HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename=\"" + filename + "\"");
            headers.setContentLength(bytes.length);

            return ResponseEntity.ok().headers(headers).body(new ByteArrayResource(bytes));
        } catch (IOException ex) {
            // Để GlobalExceptionHandler ghi log và trả response thống nhất,
            // không nuốt lỗi thành 500 rỗng không có thông tin chẩn đoán.
            log.error("Không xuất được file Excel danh sách sinh viên", ex);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * GET /api/sinh-vien/import-template
     * Trả về file Excel mẫu để người dùng tải về làm template.
     */
    @GetMapping("/import-template")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ByteArrayResource> downloadTemplate() {
        try {
            byte[] bytes = sinhVienExcelService.exportTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            headers.set(HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename=\"mau-import-sinh-vien.xlsx\"");
            headers.setContentLength(bytes.length);
            return ResponseEntity.ok().headers(headers).body(new ByteArrayResource(bytes));
        } catch (IOException ex) {
            log.error("Không tạo được file Excel mẫu", ex);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * POST /api/sinh-vien/import
     * Multipart upload file .xlsx. Upsert theo MSSV + báo lỗi từng dòng.
     * Response: { successCount, failureCount, updatedCount, insertedCount, errors: [{row, message}] }
     */
    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<SinhVienService.ImportResult>> importExcel(
            @RequestParam("file") MultipartFile file) {

        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(
                ApiResponse.error(400, "BAD_REQUEST", "File upload rỗng."));
        }

        String name = file.getOriginalFilename();
        if (name == null || !(name.toLowerCase().endsWith(".xlsx") || name.toLowerCase().endsWith(".xls"))) {
            return ResponseEntity.badRequest().body(
                ApiResponse.error(400, "BAD_REQUEST", "Chỉ chấp nhận file .xlsx hoặc .xls."));
        }

        if (file.getSize() > MAX_IMPORT_FILE_SIZE) {
            return ResponseEntity.badRequest().body(
                ApiResponse.error(400, "FILE_TOO_LARGE",
                    "File vượt quá giới hạn " + (MAX_IMPORT_FILE_SIZE / (1024 * 1024)) + " MB."));
        }

        // Logic import nằm trong service (transaction + validate), controller chỉ
        // kiểm tra định dạng file theo giao thức HTTP.
        SinhVienService.ImportResult result = sinhVienService.importFromExcel(file);
        return ResponseEntity.ok(ApiResponse.success("Import sinh viên hoàn tất", result));
    }
}