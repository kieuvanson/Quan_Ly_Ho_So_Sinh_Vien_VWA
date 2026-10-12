package vn.vwa.edurecords.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import vn.vwa.edurecords.dto.request.KhoaHocRequest;
import vn.vwa.edurecords.dto.request.KhoaRequest;
import vn.vwa.edurecords.dto.request.LopRequest;
import vn.vwa.edurecords.dto.request.NganhRequest;
import vn.vwa.edurecords.dto.response.ApiResponse;
import vn.vwa.edurecords.dto.response.KhoaHocResponse;
import vn.vwa.edurecords.dto.response.KhoaResponse;
import vn.vwa.edurecords.dto.response.LopResponse;
import vn.vwa.edurecords.dto.response.NganhResponse;
import vn.vwa.edurecords.dto.response.TrangThaiHocVuResponse;
import vn.vwa.edurecords.dto.response.TrangThaiNopResponse;
import vn.vwa.edurecords.dto.response.TrangThaiPhieuResponse;
import vn.vwa.edurecords.entity.enums.TrangThaiHocVu;
import vn.vwa.edurecords.service.DanhMucExcelService;
import vn.vwa.edurecords.service.DanhMucService;

import java.io.IOException;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

/**
 * API danh mục (Khoa, Ngành, Lớp, Khóa học) cho form sinh viên + filter dropdown.
 * Hỗ trợ CRUD đầy đủ cho ADMIN.
 */
@RestController
@RequestMapping("/api/danh-muc")
public class DanhMucController {

    private final DanhMucService danhMucService;
    private final DanhMucExcelService excelService;

    public DanhMucController(DanhMucService danhMucService, DanhMucExcelService excelService) {
        this.danhMucService = danhMucService;
        this.excelService = excelService;
    }

    // ====================== KHOA ======================

    /**
     * Trạng thái học vụ — ENUM cố định, chỉ đọc.
     * Không có CREATE/UPDATE/DELETE: giá trị do hệ thống định nghĩa, không phải danh mục vận hành.
     */
    @GetMapping("/trang-thai-hoc-vu")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<TrangThaiHocVuResponse>>> listTrangThaiHocVu() {
        List<TrangThaiHocVuResponse> result = Arrays.stream(TrangThaiHocVu.values())
                .map(TrangThaiHocVuResponse::fromEnum)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    // ====================== TRANG THAI NOP GIAY TO (ENUM cố định, chỉ đọc) ======================

    private static final List<String> TRANG_THAI_NOP_VALUES =
            List.of("Chưa nộp", "Đã nộp", "Thiếu", "Không hợp lệ");

    /**
     * Trạng thái nộp giấy tờ — ENUM cố định, chỉ đọc.
     * Không có CREATE/UPDATE/DELETE: giá trị do hệ thống định nghĩa.
     */
    @GetMapping("/trang-thai-nop")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<TrangThaiNopResponse>>> listTrangThaiNop() {
        List<TrangThaiNopResponse> result = TRANG_THAI_NOP_VALUES.stream()
                .map(TrangThaiNopResponse::fromValue)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    // ====================== TRANG THAI PHIEU (ENUM cố định, chỉ đọc) ======================

    private static final List<String> TRANG_THAI_PHIEU_VALUES =
            List.of("Chờ duyệt", "Đã duyệt", "Từ chối", "Đang mượn", "Đã trả", "Quá hạn", "Hoàn tất");

    /**
     * Trạng thái phiếu xuất hồ sơ — ENUM cố định, chỉ đọc.
     * Không có CREATE/UPDATE/DELETE: giá trị do hệ thống định nghĩa.
     */
    @GetMapping("/trang-thai-phieu")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<TrangThaiPhieuResponse>>> listTrangThaiPhieu() {
        List<TrangThaiPhieuResponse> result = TRANG_THAI_PHIEU_VALUES.stream()
                .map(TrangThaiPhieuResponse::fromValue)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/khoa")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<KhoaResponse>>> listKhoa() {
        return ResponseEntity.ok(ApiResponse.success(
                danhMucService.listKhoa().stream()
                        .map(KhoaResponse::fromEntity).toList()));
    }

    @PostMapping("/khoa")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<KhoaResponse>> createKhoa(
            @Valid @RequestBody KhoaRequest req) {
        KhoaResponse result = danhMucService.createKhoa(req);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo khoa thành công.", result));
    }

    @PutMapping("/khoa/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<KhoaResponse>> updateKhoa(
            @PathVariable Integer id,
            @Valid @RequestBody KhoaRequest req) {
        KhoaResponse result = danhMucService.updateKhoa(id, req);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật khoa thành công.", result));
    }

    @DeleteMapping("/khoa/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteKhoa(@PathVariable Integer id) {
        danhMucService.deleteKhoa(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa khoa thành công.", null));
    }

    // ====================== NGANH ======================

    @GetMapping("/nganh")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<NganhResponse>>> listNganh(
            @RequestParam(required = false) Integer khoaId) {
        return ResponseEntity.ok(ApiResponse.success(
                danhMucService.listNganhByKhoa(khoaId).stream()
                        .map(NganhResponse::fromEntity).toList()));
    }

    @PostMapping("/nganh")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<NganhResponse>> createNganh(
            @Valid @RequestBody NganhRequest req) {
        NganhResponse result = danhMucService.createNganh(req);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo ngành thành công.", result));
    }

    @PutMapping("/nganh/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<NganhResponse>> updateNganh(
            @PathVariable Integer id,
            @Valid @RequestBody NganhRequest req) {
        NganhResponse result = danhMucService.updateNganh(id, req);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật ngành thành công.", result));
    }

    @DeleteMapping("/nganh/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteNganh(@PathVariable Integer id) {
        danhMucService.deleteNganh(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa ngành thành công.", null));
    }

    // ====================== KHOA HOC ======================

    @GetMapping("/khoa-hoc")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<KhoaHocResponse>>> listKhoaHoc() {
        return ResponseEntity.ok(ApiResponse.success(
                danhMucService.listKhoaHoc().stream()
                        .map(KhoaHocResponse::fromEntity).toList()));
    }

    @PostMapping("/khoa-hoc")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<KhoaHocResponse>> createKhoaHoc(
            @Valid @RequestBody KhoaHocRequest req) {
        KhoaHocResponse result = danhMucService.createKhoaHoc(req);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo khóa học thành công.", result));
    }

    @PutMapping("/khoa-hoc/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<KhoaHocResponse>> updateKhoaHoc(
            @PathVariable Integer id,
            @Valid @RequestBody KhoaHocRequest req) {
        KhoaHocResponse result = danhMucService.updateKhoaHoc(id, req);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật khóa học thành công.", result));
    }

    @DeleteMapping("/khoa-hoc/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteKhoaHoc(@PathVariable Integer id) {
        danhMucService.deleteKhoaHoc(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa khóa học thành công.", null));
    }

    // ====================== LOP ======================

    @GetMapping("/lop")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<LopResponse>>> listLop(
            @RequestParam(required = false) Integer nganhId) {
        return ResponseEntity.ok(ApiResponse.success(
                danhMucService.listLopByNganh(nganhId).stream()
                        .map(LopResponse::fromEntity).toList()));
    }

    @PostMapping("/lop")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<LopResponse>> createLop(
            @Valid @RequestBody LopRequest req) {
        LopResponse result = danhMucService.createLop(req);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo lớp thành công.", result));
    }

    @PutMapping("/lop/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<LopResponse>> updateLop(
            @PathVariable Integer id,
            @Valid @RequestBody LopRequest req) {
        LopResponse result = danhMucService.updateLop(id, req);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật lớp thành công.", result));
    }

    @DeleteMapping("/lop/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteLop(@PathVariable Integer id) {
        danhMucService.deleteLop(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa lớp thành công.", null));
    }

    // ================== IMPORT / EXPORT EXCEL ==================

    private String today() { return LocalDate.now().toString(); }

    // --- KHOA ---
    @GetMapping("/khoa/export")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ByteArrayResource> exportKhoa() throws IOException {
        byte[] bytes = excelService.exportKhoa();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"danh-muc-khoa-" + today() + ".xlsx\"")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .contentLength(bytes.length)
                .body(new ByteArrayResource(bytes));
    }

    @GetMapping("/khoa/template")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ByteArrayResource> templateKhoa() throws IOException {
        byte[] bytes = excelService.templateKhoa();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"mau-import-khoa.xlsx\"")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .contentLength(bytes.length)
                .body(new ByteArrayResource(bytes));
    }

    @PostMapping("/khoa/import")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<DanhMucExcelService.ImportResult>> importKhoa(
            @RequestParam("file") MultipartFile file) throws IOException {
        DanhMucExcelService.ImportResult result = excelService.importKhoa(file);
        return ResponseEntity.ok(ApiResponse.success("Import khoa hoàn tất.", result));
    }

    // --- NGANH ---
    @GetMapping("/nganh/export")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ByteArrayResource> exportNganh() throws IOException {
        byte[] bytes = excelService.exportNganh();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"danh-muc-nganh-" + today() + ".xlsx\"")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .contentLength(bytes.length)
                .body(new ByteArrayResource(bytes));
    }

    @GetMapping("/nganh/template")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ByteArrayResource> templateNganh() throws IOException {
        byte[] bytes = excelService.templateNganh();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"mau-import-nganh.xlsx\"")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .contentLength(bytes.length)
                .body(new ByteArrayResource(bytes));
    }

    @PostMapping("/nganh/import")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<DanhMucExcelService.ImportResult>> importNganh(
            @RequestParam("file") MultipartFile file) throws IOException {
        DanhMucExcelService.ImportResult result = excelService.importNganh(file);
        return ResponseEntity.ok(ApiResponse.success("Import ngành hoàn tất.", result));
    }

    // --- KHOA HOC ---
    @GetMapping("/khoa-hoc/export")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ByteArrayResource> exportKhoaHoc() throws IOException {
        byte[] bytes = excelService.exportKhoaHoc();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"danh-muc-khoa-hoc-" + today() + ".xlsx\"")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .contentLength(bytes.length)
                .body(new ByteArrayResource(bytes));
    }

    @GetMapping("/khoa-hoc/template")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ByteArrayResource> templateKhoaHoc() throws IOException {
        byte[] bytes = excelService.templateKhoaHoc();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"mau-import-khoa-hoc.xlsx\"")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .contentLength(bytes.length)
                .body(new ByteArrayResource(bytes));
    }

    @PostMapping("/khoa-hoc/import")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<DanhMucExcelService.ImportResult>> importKhoaHoc(
            @RequestParam("file") MultipartFile file) throws IOException {
        DanhMucExcelService.ImportResult result = excelService.importKhoaHoc(file);
        return ResponseEntity.ok(ApiResponse.success("Import khóa học hoàn tất.", result));
    }

    // --- LOP ---
    @GetMapping("/lop/export")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ByteArrayResource> exportLop() throws IOException {
        byte[] bytes = excelService.exportLop();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"danh-muc-lop-" + today() + ".xlsx\"")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .contentLength(bytes.length)
                .body(new ByteArrayResource(bytes));
    }

    @GetMapping("/lop/template")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ByteArrayResource> templateLop() throws IOException {
        byte[] bytes = excelService.templateLop();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"mau-import-lop.xlsx\"")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .contentLength(bytes.length)
                .body(new ByteArrayResource(bytes));
    }

    @PostMapping("/lop/import")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<DanhMucExcelService.ImportResult>> importLop(
            @RequestParam("file") MultipartFile file) throws IOException {
        DanhMucExcelService.ImportResult result = excelService.importLop(file);
        return ResponseEntity.ok(ApiResponse.success("Import lớp hoàn tất.", result));
    }
}
