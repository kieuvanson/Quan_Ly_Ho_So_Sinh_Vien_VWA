package vn.vwa.edurecords.controller;

import jakarta.validation.Valid;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import vn.vwa.edurecords.dto.request.SinhVienSearchRequest;
import vn.vwa.edurecords.dto.response.ApiResponse;
import vn.vwa.edurecords.dto.response.PagedResponse;
import vn.vwa.edurecords.entity.SinhVien;
import vn.vwa.edurecords.repository.SinhVienRepository;
import vn.vwa.edurecords.service.SinhVienExcelService;
import vn.vwa.edurecords.service.SinhVienService;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/sinh-vien")
@CrossOrigin(origins = "*")
public class SinhVienController {

    private final SinhVienService sinhVienService;
    private final SinhVienExcelService sinhVienExcelService;
    private final SinhVienRepository sinhVienRepository;

    public SinhVienController(
        SinhVienService sinhVienService,
        SinhVienExcelService sinhVienExcelService,
        SinhVienRepository sinhVienRepository
    ) {
        this.sinhVienService = sinhVienService;
        this.sinhVienExcelService = sinhVienExcelService;
        this.sinhVienRepository = sinhVienRepository;
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
        Map<String, Object> stats = new HashMap<>();
        stats.put("tongSoSinhVien", sinhVienService.getTotalCount());
        stats.put("dangHoc", sinhVienService.countByTrangThai("Đang học"));
        stats.put("totNghiep", sinhVienService.countByTrangThai("Tốt nghiệp"));
        stats.put("baoLuu", sinhVienService.countByTrangThai("Bảo lưu"));
        stats.put("dinhChi", sinhVienService.countByTrangThai("Đình chỉ"));
        stats.put("daRutHoSo", sinhVienService.countByTrangThai("Đã rút hớ sơ"));
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    /**
     * POST /api/sinh-vien - Tạo sinh viên (ADMIN).
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> create(@Valid @RequestBody SinhVien sinhVien) {
        return ResponseEntity.ok(ApiResponse.success("Tính năng đang phát triển", (Void) null));
    }

    /**
     * PUT /api/sinh-vien/{mssv} - Cập nhật (ADMIN).
     */
    @PutMapping("/{mssv}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> update(
            @PathVariable String mssv,
            @Valid @RequestBody SinhVien sinhVien) {
        return ResponseEntity.ok(ApiResponse.success("Tính năng đang phát triển", (Void) null));
    }

    /**
     * DELETE /api/sinh-vien/{mssv} - Xóa (ADMIN).
     */
    @DeleteMapping("/{mssv}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String mssv) {
        return ResponseEntity.ok(ApiResponse.success("Tính năng đang phát triển", (Void) null));
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
        } catch (Exception ex) {
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
        } catch (Exception ex) {
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
    public ResponseEntity<ApiResponse<Map<String, Object>>> importExcel(
            @RequestParam("file") MultipartFile file) {

        Map<String, Object> result = new HashMap<>();
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(
                ApiResponse.error(400, "BAD_REQUEST", "File upload rỗng."));
        }

        String name = file.getOriginalFilename();
        if (name == null || !(name.toLowerCase().endsWith(".xlsx") || name.toLowerCase().endsWith(".xls"))) {
            return ResponseEntity.badRequest().body(
                ApiResponse.error(400, "BAD_REQUEST", "Chỉ chấp nhận file .xlsx hoặc .xls."));
        }

        try {
            SinhVienExcelService.ImportResult parsed = sinhVienExcelService.read(file);
            int inserted = 0;
            int updated = 0;

            for (SinhVien sv : parsed.sinhViens()) {
                Optional<SinhVien> existing = sinhVienRepository.findById(sv.getMssv());
                if (existing.isPresent()) {
                    SinhVien cur = existing.get();
                    copyEditableFields(cur, sv);
                    cur.setNgayCapNhat(LocalDateTime.now());
                    sinhVienRepository.save(cur);
                    updated++;
                } else {
                    sv.setNgayTao(LocalDateTime.now());
                    sinhVienRepository.save(sv);
                    inserted++;
                }
            }

            result.put("successCount", parsed.successCount());
            result.put("failureCount", parsed.failureCount());
            result.put("insertedCount", inserted);
            result.put("updatedCount", updated);
            result.put("errors", parsed.errors());
            return ResponseEntity.ok(ApiResponse.success(result));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(
                ApiResponse.error(500, "IMPORT_FAILED", "Lỗi import: " + ex.getMessage()));
        }
    }

    private void copyEditableFields(SinhVien target, SinhVien source) {
        target.setHoTen(source.getHoTen());
        target.setNgaySinh(source.getNgaySinh());
        target.setGioiTinh(source.getGioiTinh());
        target.setCccd(source.getCccd());
        target.setSdt(source.getSdt());
        target.setEmail(source.getEmail());
        target.setQueQuan(source.getQueQuan());
        target.setNganh(source.getNganh());
        target.setLop(source.getLop());
        target.setKhoa(source.getKhoa());
        target.setKhoaNamNhapHoc(source.getKhoaNamNhapHoc());
        target.setHeDaoTao(source.getHeDaoTao());
        if (source.getTrangThaiHocVu() != null) {
            target.setTrangThaiHocVu(source.getTrangThaiHocVu());
        }
    }
}