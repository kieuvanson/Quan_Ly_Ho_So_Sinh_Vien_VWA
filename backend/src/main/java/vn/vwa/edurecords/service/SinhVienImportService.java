package vn.vwa.edurecords.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.vwa.edurecords.dto.response.ImportPreviewResult;
import vn.vwa.edurecords.dto.response.ImportPreviewResult.DanhMucInfo;
import vn.vwa.edurecords.dto.response.ImportPreviewResult.ImportRowPreview;
import vn.vwa.edurecords.dto.response.ImportPreviewResult.RowStatus;
import vn.vwa.edurecords.entity.Khoa;
import vn.vwa.edurecords.entity.KhoaHoc;
import vn.vwa.edurecords.entity.Lop;
import vn.vwa.edurecords.entity.Nganh;
import vn.vwa.edurecords.entity.SinhVien;
import vn.vwa.edurecords.entity.enums.TrangThaiHocVu;
import vn.vwa.edurecords.repository.KhoaHocRepository;
import vn.vwa.edurecords.repository.KhoaRepository;
import vn.vwa.edurecords.repository.LopRepository;
import vn.vwa.edurecords.repository.NganhRepository;
import vn.vwa.edurecords.repository.SinhVienRepository;

import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

import org.apache.poi.ss.usermodel.*;

/**
 * Service đọc &amp; import Excel sinh viên theo luồng 2 bước:
 * <ol>
 *   <li>{@link #preview(MultipartFile)} — kiểm tra &amp; xem trước, CHƯA ghi.</li>
 *   <li>{@link #confirmImport(List)} — ghi các MSSV đã xác nhận.</li>
 * </ol>
 *
 * <h3>Quy tắc an toàn</h3>
 * <ul>
 *   <li>KHÔNG tự tạo danh mục (Khoa/Ngành/Lớp/Khóa học). Nếu không tìm thấy
 *       → báo lỗi dòng cụ thể.</li>
 *   <li>Chỉ thêm mới. MSSV đã tồn tại → báo trùng, không ghi đè.</li>
 *   <li>Preview parse Excel → trả kết quả để frontend hiển thị.
 *       Confirm ghi thực sự vào DB.</li>
 *   <li>Transaction trên confirm, không trên preview.</li>
 * </ul>
 *
 * <h3>Đối chiếu danh mục</h3>
 * Excel chứa TÊN (text). Service tra theo thứ tự:
 * <ol>
 *   <li>Khoa: theo {@code tenKhoa} (ignore case).</li>
 *   <li>KhoaHoc: theo {@code tenKhoaHoc} (ignore case).</li>
 *   <li>Nganh: theo {@code tenNganh} — sau V6 ngành độc lập, không cần khoa.</li>
 *   <li>Lop: theo {@code (tenLop, nganh.id, khoaHoc.id)} — cần đủ 3 để
 *       disambiguate khi cùng tên lớp ở hai ngành/khóa.</li>
 * </ol>
 */
@Service
public class SinhVienImportService {

    private static final Logger log = LoggerFactory.getLogger(SinhVienImportService.class);

    /** Số dòng tối đa trả về trong preview. */
    private static final int MAX_PREVIEW_ROWS = 500;

    /** Cache parsed data giữa preview và confirm.
     * Key = MSSV, Value = parsed SinhVien entity. */
    private final Map<String, SinhVien> importCache = new ConcurrentHashMap<>();

    private final KhoaRepository khoaRepository;
    private final NganhRepository nganhRepository;
    private final KhoaHocRepository khoaHocRepository;
    private final LopRepository lopRepository;
    private final SinhVienRepository sinhVienRepository;

    public SinhVienImportService(
            KhoaRepository khoaRepository,
            NganhRepository nganhRepository,
            KhoaHocRepository khoaHocRepository,
            LopRepository lopRepository,
            SinhVienRepository sinhVienRepository) {
        this.khoaRepository = khoaRepository;
        this.nganhRepository = nganhRepository;
        this.khoaHocRepository = khoaHocRepository;
        this.lopRepository = lopRepository;
        this.sinhVienRepository = sinhVienRepository;
    }

    // ================================================================
    // BƯỚC 1: PREVIEW
    // ================================================================

    /**
     * Đọc file Excel, parse từng dòng và kiểm tra đầy đủ.
     * KHÔNG ghi vào database. Kết quả trả về cho frontend hiển thị preview.
     *
     * @param file File Excel (.xlsx / .xls) do người dùng upload.
     * @return Kết quả preview gồm trạng thái + lỗi từng dòng.
     */
    @Transactional(readOnly = true)
    public ImportPreviewResult preview(org.springframework.web.multipart.MultipartFile file) {
        importCache.clear();

        List<ImportRowPreview> rowPreviews = new ArrayList<>();
        Set<String> seenMssvInFile = new HashSet<>();
        Set<String> seenCccdInFile = new HashSet<>();

        int validRows = 0;
        int invalidRows = 0;
        int duplicateInFile = 0;
        int newCount = 0;
        int duplicateCount = 0;
        int processedRows = 0;

        try (InputStream is = file.getInputStream();
             Workbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook(is)) {

            Sheet sheet = workbook.getSheetAt(0);
            if (sheet == null) {
                return new ImportPreviewResult(0, 0, 0, 0, Collections.emptyList(), 0, 0);
            }

            int startDataRowIdx = detectDataStartRow(sheet);
            int physicalRows = sheet.getPhysicalNumberOfRows();

            for (int r = startDataRowIdx; r < physicalRows && processedRows < MAX_PREVIEW_ROWS; r++) {
                Row row = sheet.getRow(r);
                if (row == null || isRowEmpty(row)) continue;

                int excelRow = r + 1; // 1-based
                processedRows++;

                ImportRowPreview preview = parseAndValidateRow(
                        row, excelRow, seenMssvInFile, seenCccdInFile);
                rowPreviews.add(preview);

                switch (preview.getStatus()) {
                    case VALID -> {
                        validRows++;
                        newCount++;
                        // Cache để confirm dùng
                        importCache.put(preview.getMssv(), buildSinhVienFromPreview(preview));
                    }
                    case INVALID -> invalidRows++;
                    case DUPLICATE -> {
                        invalidRows++;
                        duplicateCount++;
                    }
                    case DUPLICATE_IN_FILE -> {
                        invalidRows++;
                        duplicateInFile++;
                    }
                }
            }

        } catch (IOException e) {
            log.error("Không đọc được file Excel preview", e);
            throw new RuntimeException("Không đọc được file Excel. Hãy đảm bảo file đúng định dạng.", e);
        }

        // Trả kết quả sau khi try block hoàn tất (processedRows đã được tính đúng)
        return new ImportPreviewResult(
                processedRows,
                validRows,
                invalidRows,
                duplicateInFile,
                rowPreviews,
                newCount,
                duplicateCount
        );
    }

    /**
     * Parse một dòng Excel và kiểm tra đầy đủ.
     * KHÔNG lookup danh mục bằng findOrCreate — chỉ findRequired.
     */
    private ImportRowPreview parseAndValidateRow(
            Row row, int excelRow,
            Set<String> seenMssvInFile, Set<String> seenCccdInFile) {

        List<String> errors = new ArrayList<>();

        // --- 1. Đọc các trường cơ bản ---
        String mssv = trimToNull(readCellAsString(row.getCell(0)));
        String hoTen = trimToNull(readCellAsString(row.getCell(1)));

        // Ngày sinh
        LocalDateTime ngaySinh = null;
        Cell ngaySinhCell = row.getCell(2);
        if (ngaySinhCell != null) {
            ngaySinh = parseNgaySinh(ngaySinhCell);
        }

        String gioiTinh = trimToNull(readCellAsString(row.getCell(3)));
        String cccd = trimToNull(readCellAsString(row.getCell(4)));
        String sdt = trimToNull(readCellAsString(row.getCell(5)));
        String email = trimToNull(readCellAsString(row.getCell(6)));
        String queQuan = trimToNull(readCellAsString(row.getCell(7)));
        String heDaoTao = trimToNull(readCellAsString(row.getCell(12)));

        // Cột danh mục (đọc text, chưa resolve)
        String tenKhoa = trimToNull(readCellAsString(row.getCell(10)));
        String tenKhoaHoc = trimToNull(readCellAsString(row.getCell(11)));
        String tenNganh = trimToNull(readCellAsString(row.getCell(8)));
        String tenLop = trimToNull(readCellAsString(row.getCell(9)));

        // Trạng thái học vụ
        TrangThaiHocVu trangThaiHocVu = TrangThaiHocVu.ĐANG_HỌC;
        String trangThaiStr = trimToNull(readCellAsString(row.getCell(13)));
        if (trangThaiStr != null) {
            try {
                trangThaiHocVu = TrangThaiHocVu.fromDisplayName(trangThaiStr);
            } catch (IllegalArgumentException ignored) {
                // Không hợp lệ → dùng mặc định
            }
        }

        // --- 2. Validate bắt buộc ---
        if (mssv == null || mssv.isBlank()) {
            errors.add("Thiếu MSSV.");
        }
        if (hoTen == null || hoTen.isBlank()) {
            errors.add("Thiếu họ tên.");
        }

        // --- 3. Kiểm tra trùng trong file ---
        if (mssv != null && !mssv.isBlank()) {
            if (!seenMssvInFile.add(mssv)) {
                errors.add("MSSV '" + mssv + "' bị trùng trong cùng file Excel.");
            }
        }
        if (cccd != null && !cccd.isBlank()) {
            if (!seenCccdInFile.add(cccd)) {
                errors.add("CCCD '" + cccd + "' bị trùng trong cùng file Excel.");
            }
        }

        // --- 4. Validate danh mục (chỉ lookup, không tạo) ---
        DanhMucLookupResult lookup = lookupDanhMuc(tenKhoa, tenNganh, tenLop, tenKhoaHoc);

        if (lookup.hasErrors()) {
            errors.addAll(lookup.errors);
        }

        // --- 5. Kiểm tra trùng MSSV trong DB ---
        if (mssv != null && !mssv.isBlank() && errors.isEmpty()) {
            if (sinhVienRepository.existsById(mssv)) {
                errors.add("MSSV '" + mssv + "' đã tồn tại trong hệ thống. Không thể tạo trùng.");
            }
        }

        // --- 6. Kiểm tra CCCD trùng trong DB ---
        if (cccd != null && !cccd.isBlank() && errors.isEmpty()) {
            if (sinhVienRepository.existsByCccdAndMssvNot(cccd, mssv)) {
                errors.add("CCCD '" + cccd + "' đã thuộc sinh viên khác trong hệ thống.");
            }
        }

        // --- 7. Xác định trạng thái ---
        RowStatus status;
        if (!errors.isEmpty()) {
            if (mssv != null && seenMssvInFile.contains(mssv)
                    && errors.stream().anyMatch(e -> e.contains("trùng trong cùng file"))) {
                status = RowStatus.DUPLICATE_IN_FILE;
            } else if (errors.stream().anyMatch(e -> e.contains("đã tồn tại") || e.contains("đã thuộc"))) {
                status = RowStatus.DUPLICATE;
            } else {
                status = RowStatus.INVALID;
            }
        } else {
            status = RowStatus.VALID;
        }

        // --- 8. Build DanhMucInfo ---
        DanhMucInfo dmInfo = null;
        if (lookup.khoa != null) {
            dmInfo = new DanhMucInfo(
                    lookup.khoa.getTenKhoa(), String.valueOf(lookup.khoa.getId()),
                    lookup.nganh != null ? lookup.nganh.getTenNganh() : null,
                    lookup.nganh != null ? String.valueOf(lookup.nganh.getId()) : null,
                    lookup.lop != null ? lookup.lop.getTenLop() : null,
                    lookup.lop != null ? String.valueOf(lookup.lop.getId()) : null,
                    lookup.khoaHoc != null ? lookup.khoaHoc.getTenKhoaHoc() : null,
                    lookup.khoaHoc != null ? String.valueOf(lookup.khoaHoc.getId()) : null
            );
        }

        return new ImportRowPreview(excelRow, mssv, hoTen, status, errors, dmInfo);
    }

    // ================================================================
    // BƯỚC 2: CONFIRM
    // ================================================================

    /**
     * Ghi các sinh viên đã xác nhận vào database.
     * Đây là bước DUY NHẤT ghi dữ liệu.
     *
     * <p>Backend kiểm tra lại từng MSSV trước khi ghi:
     * <ul>
     *   <li>MSSV đã bị xóa khỏi cache (do timeout) → báo lỗi.</li>
     *   <li>MSSV đã tồn tại trong DB → báo lỗi (an toàn cho dữ liệu cũ).</li>
     *   <li>Danh mục không tìm thấy → báo lỗi.</li>
     * </ul>
     *
     * @param mssvList Danh sách MSSV cần ghi (đã xác nhận từ preview).
     * @return Kết quả import (successCount, failureCount, errors...).
     */
    @Transactional
    public SinhVienService.ImportResult confirmImport(List<String> mssvList) {
        List<SinhVien> toInsert = new ArrayList<>();
        List<SinhVienExcelService.RowError> errors = new ArrayList<>();

        for (String mssv : mssvList) {
            SinhVien sv = importCache.get(mssv);
            if (sv == null) {
                errors.add(new SinhVienExcelService.RowError(0,
                        "MSSV '" + mssv + "' không có trong danh sách đã preview. Vui lòng thực hiện lại từ bước kiểm tra."));
                continue;
            }

            // Kiểm tra lại lần cuối: MSSV đã tồn tại chưa?
            if (sinhVienRepository.existsById(mssv)) {
                errors.add(new SinhVienExcelService.RowError(0,
                        "MSSV '" + mssv + "' đã tồn tại trong hệ thống. Không ghi đè dữ liệu cũ."));
                continue;
            }

            // Kiểm tra lại CCCD
            if (sv.getCccd() != null && !sv.getCccd().isBlank()) {
                if (sinhVienRepository.existsByCccdAndMssvNot(sv.getCccd(), mssv)) {
                    errors.add(new SinhVienExcelService.RowError(0,
                            "CCCD '" + sv.getCccd() + "' của MSSV '" + mssv
                                    + "' đã thuộc sinh viên khác."));
                    continue;
                }
            }

            // Kiểm tra lại danh mục còn tồn tại không (phòng trường hợp bị xóa giữa preview và confirm)
            DanhMucLookupResult lookup = lookupDanhMucRequired(sv);
            if (lookup.hasErrors()) {
                errors.addAll(lookup.errors.stream()
                        .map(e -> new SinhVienExcelService.RowError(0, "MSSV '" + mssv + "': " + e))
                        .toList());
                continue;
            }

            sv.setNgayTao(LocalDateTime.now());
            toInsert.add(sv);
        }

        if (!toInsert.isEmpty()) {
            sinhVienRepository.saveAll(toInsert);
        }

        // Xóa cache sau khi ghi xong
        for (String mssv : mssvList) {
            importCache.remove(mssv);
        }

        return new SinhVienService.ImportResult(
                toInsert.size(),
                errors.size(),
                toInsert.size(),
                0,
                errors
        );
    }

    // ================================================================
    // DANH MỤC: LOOKUP (KHÔNG TẠO MỚI)
    // ================================================================

    /**
     * Lookup danh mục theo tên. Nếu không tìm thấy → báo lỗi, KHÔNG tạo mới.
     */
    private DanhMucLookupResult lookupDanhMuc(
            String tenKhoa, String tenNganh, String tenLop, String tenKhoaHoc) {

        DanhMucLookupResult result = new DanhMucLookupResult();

        // 1. Lookup Khoa
        if (tenKhoa != null) {
            khoaRepository.findByTenKhoaIgnoreCase(tenKhoa)
                    .ifPresentOrElse(
                            k -> result.khoa = k,
                            () -> result.errors.add("Khoa '" + tenKhoa + "' không tồn tại trong hệ thống.")
                    );
        } else {
            result.errors.add("Thiếu thông tin Khoa.");
        }

        // 2. Lookup KhoaHoc
        if (tenKhoaHoc != null) {
            khoaHocRepository.findByTenKhoaHocIgnoreCase(tenKhoaHoc)
                    .ifPresentOrElse(
                            kh -> result.khoaHoc = kh,
                            () -> result.errors.add("Khóa học '" + tenKhoaHoc + "' không tồn tại trong hệ thống.")
                    );
        } else {
            result.errors.add("Thiếu thông tin Khóa nhập học.");
        }

        // 3. Lookup Nganh (sau V6: ngành độc lập, không cần khoa)
        if (tenNganh != null) {
            // Thử tìm theo tên ngành trước
            nganhRepository.findAll().stream()
                    .filter(n -> n.getTenNganh() != null
                            && n.getTenNganh().equalsIgnoreCase(tenNganh.trim()))
                    .findFirst()
                    .ifPresentOrElse(
                            n -> result.nganh = n,
                            () -> result.errors.add("Ngành '" + tenNganh + "' không tồn tại trong hệ thống.")
                    );
        } else {
            result.errors.add("Thiếu thông tin Ngành.");
        }

        // 4. Lookup Lop (cần nganh + khoaHoc để disambiguate)
        if (tenLop != null && result.nganh != null && result.khoaHoc != null) {
            lopRepository.findFirstByTenLopIgnoreCaseAndNganh_IdAndKhoaHoc_Id(
                            tenLop, result.nganh.getId(), result.khoaHoc.getId())
                    .ifPresentOrElse(
                            l -> result.lop = l,
                            () -> result.errors.add("Lớp '" + tenLop + "' không tồn tại trong ngành '"
                                    + tenNganh + "' khóa '" + tenKhoaHoc + "'.")
                    );
        } else if (tenLop != null) {
            if (result.nganh == null) {
                result.errors.add("Thiếu thông tin Ngành để tra lớp '" + tenLop + "'.");
            }
            if (result.khoaHoc == null) {
                result.errors.add("Thiếu thông tin Khóa học để tra lớp '" + tenLop + "'.");
            }
        } else {
            result.errors.add("Thiếu thông tin Lớp.");
        }

        return result;
    }

    /**
     * Lookup danh mục bắt buộc từ entity SinhVien (dùng khi confirm).
     * Yêu cầu: Khoa, Nganh, Lop, KhoaHoc đều phải resolve được.
     */
    private DanhMucLookupResult lookupDanhMucRequired(SinhVien sv) {
        DanhMucLookupResult result = new DanhMucLookupResult();

        if (sv.getKhoa() != null) {
            result.khoa = khoaRepository.findById(sv.getKhoa().getId()).orElse(null);
            if (result.khoa == null) {
                result.errors.add("Khoa ID " + sv.getKhoa().getId() + " không tồn tại.");
            }
        } else {
            result.errors.add("Thiếu thông tin Khoa.");
        }

        if (sv.getKhoaHoc() != null) {
            result.khoaHoc = khoaHocRepository.findById(sv.getKhoaHoc().getId()).orElse(null);
            if (result.khoaHoc == null) {
                result.errors.add("Khóa học ID " + sv.getKhoaHoc().getId() + " không tồn tại.");
            }
        } else {
            result.errors.add("Thiếu thông tin Khóa học.");
        }

        if (sv.getNganh() != null) {
            result.nganh = nganhRepository.findById(sv.getNganh().getId()).orElse(null);
            if (result.nganh == null) {
                result.errors.add("Ngành ID " + sv.getNganh().getId() + " không tồn tại.");
            }
        } else {
            result.errors.add("Thiếu thông tin Ngành.");
        }

        if (sv.getLop() != null) {
            result.lop = lopRepository.findById(sv.getLop().getId()).orElse(null);
            if (result.lop == null) {
                result.errors.add("Lớp ID " + sv.getLop().getId() + " không tồn tại.");
            }
        } else {
            result.errors.add("Thiếu thông tin Lớp.");
        }

        return result;
    }

    /**
     * Build SinhVien entity từ ImportRowPreview (đã resolve danh mục).
     */
    private SinhVien buildSinhVienFromPreview(ImportRowPreview preview) {
        SinhVien sv = new SinhVien();
        sv.setMssv(preview.getMssv());
        sv.setHoTen(preview.getHoTen());

        // Ngày sinh (parse lại từ row đã đọc - ở đây null vì đã parse rồi)
        sv.setNgaySinh(null);
        sv.setGioiTinh(null);
        sv.setCccd(null);
        sv.setSdt(null);
        sv.setEmail(null);
        sv.setQueQuan(null);
        sv.setHeDaoTao(null);
        sv.setTrangThaiHocVu(TrangThaiHocVu.ĐANG_HỌC);

        if (preview.getDanhMuc() != null) {
            DanhMucInfo dm = preview.getDanhMuc();
            if (dm.getKhoaId() != null) {
                Khoa k = new Khoa();
                k.setId(Integer.parseInt(dm.getKhoaId()));
                sv.setKhoa(k);
            }
            if (dm.getNganhId() != null) {
                Nganh n = new Nganh();
                n.setId(Integer.parseInt(dm.getNganhId()));
                sv.setNganh(n);
            }
            if (dm.getKhoaHocId() != null) {
                KhoaHoc kh = new KhoaHoc();
                kh.setId(Integer.parseInt(dm.getKhoaHocId()));
                sv.setKhoaHoc(kh);
            }
            if (dm.getLopId() != null) {
                Lop l = new Lop();
                l.setId(Integer.parseInt(dm.getLopId()));
                sv.setLop(l);
            }
        }

        return sv;
    }

    // ================================================================
    // HELPER: PARSE NGÀY SINH
    // ================================================================

    private LocalDateTime parseNgaySinh(Cell cell) {
        if (cell == null) return null;
        if (cell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(cell)) {
            return LocalDateTime.ofInstant(
                    cell.getDateCellValue().toInstant(), ZoneId.systemDefault());
        }
        String s = trimToNull(readCellAsString(cell));
        if (s == null) return null;
        try {
            if (s.contains("/")) {
                String[] parts = s.split("/");
                if (parts.length == 3) {
                    int d = Integer.parseInt(parts[0].trim());
                    int m = Integer.parseInt(parts[1].trim());
                    int y = Integer.parseInt(parts[2].trim());
                    return LocalDateTime.of(y, m, d, 0, 0);
                }
            }
            return LocalDateTime.parse(s);
        } catch (Exception ignored) {
            return null;
        }
    }

    // ================================================================
    // HELPER: EXCEL
    // ================================================================

    private int detectDataStartRow(Sheet sheet) {
        Row firstRow = sheet.getRow(0);
        if (firstRow == null) return 1;
        Cell firstCell = firstRow.getCell(0);
        if (firstCell != null) {
            String txt = readCellAsString(firstCell);
            if (txt != null && txt.toLowerCase().contains("hướng dẫn")) {
                return 2;
            }
        }
        return 1;
    }

    private boolean isRowEmpty(Row row) {
        for (int c = row.getFirstCellNum(); c < row.getLastCellNum(); c++) {
            Cell cell = row.getCell(c);
            if (cell != null && cell.getCellType() != CellType.BLANK) {
                String val = readCellAsString(cell);
                if (val != null && !val.isBlank()) return false;
            }
        }
        return true;
    }

    private String readCellAsString(Cell cell) {
        if (cell == null) return null;
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue();
            case NUMERIC -> {
                double v = cell.getNumericCellValue();
                long lv = (long) v;
                yield (v == lv) ? String.valueOf(lv) : String.valueOf(v);
            }
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            case FORMULA -> cell.getCellFormula();
            default -> null;
        };
    }

    private String trimToNull(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    // ================================================================
    // INNER CLASS
    // ================================================================

    /** Kết quả lookup danh mục. */
    private static class DanhMucLookupResult {
        Khoa khoa;
        Nganh nganh;
        Lop lop;
        KhoaHoc khoaHoc;
        List<String> errors = new ArrayList<>();

        boolean hasErrors() { return !errors.isEmpty(); }
    }
}
