package vn.vwa.edurecords.controller;

import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import vn.vwa.edurecords.dto.importexcel.ImportConfirmRequest;
import vn.vwa.edurecords.dto.importexcel.ImportConfirmResponse;
import vn.vwa.edurecords.dto.importexcel.ImportPreviewResponse;
import vn.vwa.edurecords.dto.response.ApiResponse;
import vn.vwa.edurecords.service.HoSoGiayToImportService;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

/**
 * REST API cho Import HOSOGIAYTO (hỗ trợ 1 hoặc nhiều sheet).
 *
 * <h3>3 endpoint</h3>
 * <ul>
 *   <li>POST /api/ho-so-giay-to/import/preview — Upload file → kiểm tra, fail-fast.</li>
 *   <li>POST /api/ho-so-giay-to/import/confirm — Xác nhận bằng token → ghi DB.</li>
 *   <li>GET /api/ho-so-giay-to/import/mau — Tải file mẫu (3 sheet: SV, HS, SV+HS).</li>
 * </ul>
 *
 * <h3>Quy tắc nhận diện sheet</h3>
 * <ul>
 *   <li>"SV" hoặc "TT Sinh viên" → import SINHVIEN.</li>
 *   <li>"HS" hoặc "Hồ sơ giấy tờ" → import HOSOGIAYTO.</li>
 *   <li>"SV+HS" → import gộp (1 sheet, có cột "Loại dòng").</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/ho-so-giay-to")
public class HoSoGiayToImportController {

    private static final Logger log = LoggerFactory.getLogger(HoSoGiayToImportController.class);

    /** Giới hạn kích thước file (10MB). */
    private static final long MAX_FILE_SIZE = 10L * 1024 * 1024;
    /** Số dòng tối đa tổng cộng (mọi sheet) — phòng OOM. */
    private static final int MAX_TOTAL_ROWS = 10_000;

    private final HoSoGiayToImportService importService;

    public HoSoGiayToImportController(HoSoGiayToImportService importService) {
        this.importService = importService;
    }

    /**
     * Bước 1: Upload file → kiểm tra. KHÔNG ghi DB. Trả về token nếu OK.
     */
    @PostMapping(value = "/import/preview", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ImportPreviewResponse>> preview(
            @RequestParam("file") MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.error(400, "BAD_REQUEST", "File upload rỗng."));
        }
        String name = file.getOriginalFilename();
        if (name == null || !name.toLowerCase().endsWith(".xlsx")) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.error(400, "BAD_REQUEST", "Chỉ chấp nhận file .xlsx."));
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.error(400, "FILE_TOO_LARGE",
                            "File vượt quá giới hạn " + (MAX_FILE_SIZE / (1024 * 1024)) + " MB."));
        }
        // Đếm số dòng để chặn file quá lớn
        int totalRows = countTotalRows(file);
        if (totalRows > MAX_TOTAL_ROWS) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.error(400, "TOO_MANY_ROWS",
                            "Tổng số dòng (" + totalRows + ") vượt quá giới hạn " + MAX_TOTAL_ROWS + ". "
                                    + "Vui lòng chia nhỏ file."));
        }
        try {
            ImportPreviewResponse result = importService.preview(file);
            if (result.isFailFast()) {
                return ResponseEntity.ok(ApiResponse.success("File có lỗi — vui lòng sửa và upload lại.", result));
            }
            return ResponseEntity.ok(ApiResponse.success("Kiểm tra file thành công.", result));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.error(400, "IMPORT_PREVIEW_FAILED", ex.getMessage()));
        } catch (RuntimeException ex) {
            log.error("Preview lỗi", ex);
            return ResponseEntity.internalServerError().body(
                    ApiResponse.error(500, "INTERNAL_ERROR", ex.getMessage()));
        }
    }

    /**
     * Bước 2: Confirm bằng token → ghi DB. Token có TTL 5 phút trong Redis.
     */
    @PostMapping("/import/confirm")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ImportConfirmResponse>> confirm(
            @RequestBody ImportConfirmRequest request) {
        if (request == null || request.getToken() == null || request.getToken().isBlank()) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.error(400, "BAD_REQUEST", "Thiếu token xác nhận."));
        }
        try {
            ImportConfirmResponse result = importService.confirm(request.getToken());
            return ResponseEntity.ok(ApiResponse.success("Import hoàn tất.", result));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.error(400, "TOKEN_INVALID", ex.getMessage()));
        } catch (RuntimeException ex) {
            log.error("Confirm lỗi", ex);
            return ResponseEntity.internalServerError().body(
                    ApiResponse.error(500, "INTERNAL_ERROR", ex.getMessage()));
        }
    }

    /**
     * Tải file mẫu gồm 3 sheet: SV, HS, SV+HS.
     * Người dùng có thể xóa 2 sheet không cần để upload 1 mode duy nhất.
     */
    @GetMapping("/import/mau")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ByteArrayResource> downloadTemplate() {
        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {

            // Sheet 1: SV (14 cột)
            org.apache.poi.ss.usermodel.Sheet sheetSV = workbook.createSheet("SV");
            String[] headersSV = {"MSSV", "Họ tên", "Ngày sinh", "Giới tính", "CCCD", "SĐT",
                    "Email", "Quê quán", "Tên khoa", "Tên ngành", "Tên lớp", "Tên khóa học",
                    "Hệ đào tạo", "Trạng thái học vụ"};
            org.apache.poi.ss.usermodel.Row headerSV = sheetSV.createRow(0);
            for (int i = 0; i < headersSV.length; i++) headerSV.createCell(i).setCellValue(headersSV[i]);
            org.apache.poi.ss.usermodel.Row exSV = sheetSV.createRow(1);
            exSV.createCell(0).setCellValue("B23DCCN001");
            exSV.createCell(1).setCellValue("Nguyễn Văn A");
            exSV.createCell(8).setCellValue("Khoa CNTT");
            exSV.createCell(9).setCellValue("Công nghệ thông tin");
            exSV.createCell(10).setCellValue("CNTT-2023.1");
            exSV.createCell(11).setCellValue("Khóa 2023");
            exSV.createCell(13).setCellValue("Đang học");

            // Sheet 2: HS (6 cột)
            org.apache.poi.ss.usermodel.Sheet sheetHS = workbook.createSheet("HS");
            String[] headersHS = {"MSSV", "Mã loại giấy tờ", "Trạng thái nộp",
                    "Bản gốc/Bản sao", "File đính kèm", "Vị trí lưu kho"};
            org.apache.poi.ss.usermodel.Row headerHS = sheetHS.createRow(0);
            for (int i = 0; i < headersHS.length; i++) headerHS.createCell(i).setCellValue(headersHS[i]);
            org.apache.poi.ss.usermodel.Row exHS = sheetHS.createRow(1);
            exHS.createCell(0).setCellValue("B23DCCN001");
            exHS.createCell(1).setCellValue("CCCD");
            exHS.createCell(2).setCellValue("Đã nộp");
            exHS.createCell(3).setCellValue("Bản sao");

            // Sheet 3: SV+HS (15 cột: Loại dòng + 14 cột SV, hoặc Loại dòng + 6 cột HS)
            org.apache.poi.ss.usermodel.Sheet sheetGop = workbook.createSheet("SV+HS");
            String[] headersGop = {"Loại dòng", "MSSV", "Họ tên", "Tên khoa", "Tên ngành",
                    "Tên lớp", "Tên khóa học", "Mã loại giấy tờ", "Trạng thái nộp", "Bản gốc/Bản sao"};
            org.apache.poi.ss.usermodel.Row headerGop = sheetGop.createRow(0);
            for (int i = 0; i < headersGop.length; i++) headerGop.createCell(i).setCellValue(headersGop[i]);
            // Dòng ví dụ SV
            org.apache.poi.ss.usermodel.Row exGopSV = sheetGop.createRow(1);
            exGopSV.createCell(0).setCellValue("SV");
            exGopSV.createCell(1).setCellValue("B23DCCN002");
            exGopSV.createCell(2).setCellValue("Trần Thị B");
            exGopSV.createCell(3).setCellValue("Khoa CNTT");
            exGopSV.createCell(4).setCellValue("Công nghệ thông tin");
            exGopSV.createCell(5).setCellValue("CNTT-2023.1");
            exGopSV.createCell(6).setCellValue("Khóa 2023");
            // Dòng ví dụ HS (tham chiếu SV trên)
            org.apache.poi.ss.usermodel.Row exGopHS = sheetGop.createRow(2);
            exGopHS.createCell(0).setCellValue("HS");
            exGopHS.createCell(1).setCellValue("B23DCCN002");
            exGopHS.createCell(7).setCellValue("CCCD");
            exGopHS.createCell(8).setCellValue("Đã nộp");
            exGopHS.createCell(9).setCellValue("Bản gốc");

            workbook.write(baos);
            byte[] bytes = baos.toByteArray();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            headers.set(HttpHeaders.CONTENT_DISPOSITION,
                    "attachment; filename=\"mau-import-ho-so.xlsx\"");
            headers.setContentLength(bytes.length);
            return ResponseEntity.ok().headers(headers).body(new ByteArrayResource(bytes));
        } catch (IOException ex) {
            log.error("Không tạo được file Excel mẫu", ex);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Đếm tổng số dòng có dữ liệu trong tất cả sheet để chặn trước khi parse đầy đủ.
     */
    private int countTotalRows(MultipartFile file) {
        try (var is = file.getInputStream();
             Workbook wb = new XSSFWorkbook(is)) {
            int total = 0;
            for (int s = 0; s < wb.getNumberOfSheets(); s++) {
                Sheet sheet = wb.getSheetAt(s);
                if (sheet == null) continue;
                int start = 0;
                // Bỏ dòng hướng dẫn nếu có
                if (sheet.getRow(0) != null && sheet.getRow(0).getCell(0) != null) {
                    String v = sheet.getRow(0).getCell(0).getStringCellValue();
                    if (v != null && v.toLowerCase().contains("hướng dẫn")) start = 1;
                }
                for (int r = start; r <= sheet.getLastRowNum(); r++) {
                    if (sheet.getRow(r) != null) total++;
                }
            }
            return total;
        } catch (Exception e) {
            // Nếu lỗi đếm, vẫn cho parse tiếp (service sẽ báo lỗi cụ thể).
            log.warn("Không đếm được số dòng, cho phép parse tiếp.", e);
            return 0;
        }
    }
}
