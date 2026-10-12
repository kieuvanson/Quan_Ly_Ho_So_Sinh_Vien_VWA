package vn.vwa.edurecords.controller;

import jakarta.validation.Valid;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import vn.vwa.edurecords.dto.request.LoaiGiayToRequest;
import vn.vwa.edurecords.dto.response.ApiResponse;
import vn.vwa.edurecords.dto.response.LoaiGiayToResponse;
import vn.vwa.edurecords.entity.LoaiGiayTo;
import vn.vwa.edurecords.service.DanhMucExcelService;
import vn.vwa.edurecords.service.LoaiGiayToService;

import java.io.IOException;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/loai-giay-to")
public class LoaiGiayToController {

    private final LoaiGiayToService loaiGiayToService;
    private final DanhMucExcelService excelService;

    public LoaiGiayToController(LoaiGiayToService loaiGiayToService, DanhMucExcelService excelService) {
        this.loaiGiayToService = loaiGiayToService;
        this.excelService = excelService;
    }

    /**
     * GET /api/loai-giay-to
     * Lấy danh sách tất cả loại giấy tờ đang sử dụng (ADMIN)
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<LoaiGiayTo>>> getAll() {
        List<LoaiGiayTo> result = loaiGiayToService.getAllActive();
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * GET /api/loai-giay-to/bat-buoc
     * Lấy danh sách loại giấy tờ bắt buộc (ADMIN)
     */
    @GetMapping("/bat-buoc")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<LoaiGiayTo>>> getAllBatBuoc() {
        List<LoaiGiayTo> result = loaiGiayToService.getAllActiveBatBuoc();
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * GET /api/loai-giay-to/{maLoai}
     * Lấy chi tiết một loại giấy tờ theo mã (ADMIN)
     */
    @GetMapping("/{maLoai}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<LoaiGiayTo>> getByMaLoai(@PathVariable String maLoai) {
        return loaiGiayToService.getByMaLoai(maLoai)
                .map(lgt -> ResponseEntity.ok(ApiResponse.success(lgt)))
                .orElseGet(() -> ResponseEntity.status(404).body(
                        ApiResponse.error(404, "NOT_FOUND", "Không tìm thấy loại giấy tờ với mã: " + maLoai)));
    }

    /**
     * GET /api/loai-giay-to/stats
     * Thống kê số lượng loại giấy tờ (ADMIN)
     */
    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("tongSoLoai", loaiGiayToService.countActive());
        stats.put("soLoaiBatBuoc", loaiGiayToService.countActiveBatBuoc());
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    /**
     * POST /api/loai-giay-to
     * Tạo mới loại giấy tờ (ADMIN)
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<LoaiGiayToResponse>> create(
            @Valid @RequestBody LoaiGiayToRequest req) {
        LoaiGiayToResponse result = loaiGiayToService.create(req);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo loại giấy tờ thành công.", result));
    }

    /**
     * PUT /api/loai-giay-to/{maLoai}
     * Cập nhật loại giấy tờ (ADMIN)
     */
    @PutMapping("/{maLoai}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<LoaiGiayToResponse>> update(
            @PathVariable String maLoai,
            @Valid @RequestBody LoaiGiayToRequest req) {
        LoaiGiayToResponse result = loaiGiayToService.update(maLoai, req);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật loại giấy tờ thành công.", result));
    }

    /**
     * DELETE /api/loai-giay-to/{maLoai}
     * Xóa loại giấy tờ (ADMIN)
     */
    @DeleteMapping("/{maLoai}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String maLoai) {
        loaiGiayToService.delete(maLoai);
        return ResponseEntity.ok(ApiResponse.success("Xóa loại giấy tờ thành công.", null));
    }

    // ================== IMPORT / EXPORT EXCEL ==================

    private String today() { return LocalDate.now().toString(); }

    @GetMapping("/export")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ByteArrayResource> export() throws IOException {
        byte[] bytes = excelService.exportLoaiGiayTo();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"danh-muc-loai-giay-to-" + today() + ".xlsx\"")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .contentLength(bytes.length)
                .body(new ByteArrayResource(bytes));
    }

    @GetMapping("/template")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ByteArrayResource> template() throws IOException {
        byte[] bytes = excelService.templateLoaiGiayTo();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"mau-import-loai-giay-to.xlsx\"")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .contentLength(bytes.length)
                .body(new ByteArrayResource(bytes));
    }

    @PostMapping("/import")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<DanhMucExcelService.ImportResult>> importExcel(
            @RequestParam("file") MultipartFile file) throws IOException {
        DanhMucExcelService.ImportResult result = excelService.importLoaiGiayTo(file);
        return ResponseEntity.ok(ApiResponse.success("Import loại giấy tờ hoàn tất.", result));
    }
}
