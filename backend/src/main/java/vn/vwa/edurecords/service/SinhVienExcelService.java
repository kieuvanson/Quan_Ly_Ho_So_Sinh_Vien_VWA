package vn.vwa.edurecords.service;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.DataFormat;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import vn.vwa.edurecords.entity.SinhVien;
import vn.vwa.edurecords.entity.enums.TrangThaiHocVu;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

/**
 * Service hỗ trợ đọc/ghi Excel cho SinhVien.
 * - Export: trả về byte[] file .xlsx.
 * - ImportTemplate: trả về byte[] file .xlsx mẫu (chỉ header + 1 dòng ví dụ).
 * - Read: chuyển file upload thành danh sách SinhVien + danh sách lỗi từng dòng.
 *
 * Định dạng cột cố định theo thứ tự:
 *   MSSV | Họ tên | Ngày sinh | Giới tính | CCCD | SĐT | Email | Quê quán
 *   | Ngành | Lớp | Khóa | Khóa nhập học | Hệ đào tạo | Trạng thái học vụ
 */
@Service
public class SinhVienExcelService {

    /**
     * Tên cột header tiếng Việt (hiển thị trong file Excel).
     * Thứ tự là chuẩn - phải khớp với COLUMN_ORDER_TO_INDEX.
     */
    private static final String[] HEADERS = new String[] {
        "MSSV", "Họ tên", "Ngày sinh", "Giới tính", "CCCD", "SĐT",
        "Email", "Quê quán", "Ngành", "Lớp", "Khóa", "Khóa nhập học",
        "Hệ đào tạo", "Trạng thái học vụ"
    };

    /**
     * Kết quả import một file Excel.
     */
    public record ImportResult(
        int successCount,
        int failureCount,
        List<SinhVien> sinhViens,
        List<RowError> errors
    ) {}

    /**
     * Lỗi của một dòng trong file Excel.
     */
    public record RowError(int rowNumber, String message) {}

    /**
     * Tạo file Excel (.xlsx) từ danh sách SinhVien. Dùng SXSSF cho streaming - không tốn heap khi xuất lớn.
     */
    public byte[] export(List<SinhVien> data) throws IOException {
        try (SXSSFWorkbook workbook = new SXSSFWorkbook(100);
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet("Danh sách sinh viên");
            sheet.setDefaultColumnWidth(18);

            // Header style
            CellStyle headerStyle = workbook.createCellStyle();
            org.apache.poi.ss.usermodel.Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.GREY_50_PERCENT.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);

            // Date style
            CellStyle dateStyle = workbook.createCellStyle();
            DataFormat format = workbook.createDataFormat();
            dateStyle.setDataFormat(format.getFormat("dd/MM/yyyy"));

            // Header row
            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < HEADERS.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(HEADERS[i]);
                cell.setCellStyle(headerStyle);
            }

            // Data rows
            int rowIdx = 1;
            for (SinhVien sv : data) {
                Row row = sheet.createRow(rowIdx++);
                writeCell(row, 0, sv.getMssv());
                writeCell(row, 1, sv.getHoTen());
                writeDateCell(row, 2, sv.getNgaySinh(), dateStyle);
                writeCell(row, 3, sv.getGioiTinh());
                writeCell(row, 4, sv.getCccd());
                writeCell(row, 5, sv.getSdt());
                writeCell(row, 6, sv.getEmail());
                writeCell(row, 7, sv.getQueQuan());
                writeCell(row, 8, sv.getNganh());
                writeCell(row, 9, sv.getLop());
                writeCell(row, 10, sv.getKhoa());
                writeCell(row, 11, sv.getKhoaNamNhapHoc());
                writeCell(row, 12, sv.getHeDaoTao());
                writeCell(row, 13, sv.getTrangThaiHocVu() != null ? sv.getTrangThaiHocVu().getDisplayName() : null);
            }

            workbook.write(baos);
            workbook.dispose();
            return baos.toByteArray();
        }
    }

    /**
     * Tạo file mẫu Excel (.xlsx) chỉ chứa header + 1 dòng ví dụ để người dùng tham khảo.
     */
    public byte[] exportTemplate() throws IOException {
        try (XSSFWorkbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet("Mẫu danh sách sinh viên");
            sheet.setDefaultColumnWidth(18);

            CellStyle headerStyle = workbook.createCellStyle();
            org.apache.poi.ss.usermodel.Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.GREY_50_PERCENT.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);

            // Hướng dẫn
            Row noteRow = sheet.createRow(0);
            Cell noteCell = noteRow.createCell(0);
            noteCell.setCellValue("Hướng dẫn: Giữ nguyên dòng header phía dưới. Các giá trị điền từ dòng 3 trở đi. MSSV không được trống và phải duy nhất.");

            // Header row
            Row headerRow = sheet.createRow(1);
            for (int i = 0; i < HEADERS.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(HEADERS[i]);
                cell.setCellStyle(headerStyle);
            }

            // Ví dụ
            Row exampleRow = sheet.createRow(2);
            writeCell(exampleRow, 0, "B23DCCN001");
            writeCell(exampleRow, 1, "Nguyễn Văn A");
            writeCell(exampleRow, 2, "2005-01-15");
            writeCell(exampleRow, 3, "Nam");
            writeCell(exampleRow, 4, "079205001234");
            writeCell(exampleRow, 5, "0912345678");
            writeCell(exampleRow, 6, "a@example.com");
            writeCell(exampleRow, 7, "Hà Nội");
            writeCell(exampleRow, 8, "Công nghệ thông tin");
            writeCell(exampleRow, 9, "CNTT-2023.1");
            writeCell(exampleRow, 10, "K23");
            writeCell(exampleRow, 11, "2023");
            writeCell(exampleRow, 12, "Chính quy");
            writeCell(exampleRow, 13, "Đang học");

            workbook.write(baos);
            return baos.toByteArray();
        }
    }

    /**
     * Đọc file Excel upload, validate từng dòng, trả về danh sách SinhVien hợp lệ + danh sách lỗi.
     * - Bỏ qua dòng trống hoàn toàn.
     * - Dòng 1 (index 0) là hướng dẫn (nếu có), dòng 2 (index 1) là header -> bắt đầu dữ liệu từ index 2.
     * - Quy ước: nếu dòng đầu tiên có ô[0] chứa từ "Hướng dẫn" thì bỏ 2 dòng đầu, ngược lại chỉ bỏ 1 dòng header.
     */
    public ImportResult read(MultipartFile file) throws IOException {
        List<SinhVien> valid = new ArrayList<>();
        List<RowError> errors = new ArrayList<>();

        try (InputStream is = file.getInputStream();
             Workbook workbook = new XSSFWorkbook(is)) {

            Sheet sheet = workbook.getSheetAt(0);
            if (sheet == null) {
                errors.add(new RowError(0, "File Excel không có sheet nào."));
                return new ImportResult(0, 1, valid, errors);
            }

            int startDataRowIdx = detectDataStartRow(sheet);
            int physicalRows = sheet.getPhysicalNumberOfRows();
            int importedRowNumber = 0; // số thứ tự dòng dữ liệu (1-based) cho thân thiện

            for (int r = startDataRowIdx; r < physicalRows; r++) {
                Row row = sheet.getRow(r);
                if (row == null || isRowEmpty(row)) continue;

                importedRowNumber++;
                // Số dòng hiển thị trong Excel (1-based): r + 1
                int excelRow = r + 1;
                try {
                    SinhVien sv = parseRow(row);
                    if (sv.getMssv() == null || sv.getMssv().isBlank()) {
                        errors.add(new RowError(excelRow, "Thiếu MSSV."));
                        continue;
                    }
                    if (sv.getHoTen() == null || sv.getHoTen().isBlank()) {
                        errors.add(new RowError(excelRow, "Thiếu họ tên."));
                        continue;
                    }
                    if (sv.getTrangThaiHocVu() == null) {
                        sv.setTrangThaiHocVu(TrangThaiHocVu.ĐANG_HỌC);
                    }
                    sv.setNgayTao(LocalDateTime.now());
                    valid.add(sv);
                } catch (Exception ex) {
                    errors.add(new RowError(excelRow, "Lỗi đọc dòng: " + ex.getMessage()));
                }
            }
        }

        return new ImportResult(valid.size(), errors.size(), valid, errors);
    }

    /**
     * Phát hiện dòng bắt đầu dữ liệu: nếu ô A1 chứa "Hướng dẫn" -> bỏ 2 dòng, ngược lại bỏ 1.
     */
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

    /**
     * Parse 1 dòng Excel thành SinhVien (chưa validate).
     */
    private SinhVien parseRow(Row row) {
        SinhVien sv = new SinhVien();
        sv.setMssv(trimToNull(readCellAsString(row.getCell(0))));
        sv.setHoTen(trimToNull(readCellAsString(row.getCell(1))));

        Cell ngaySinhCell = row.getCell(2);
        if (ngaySinhCell != null) {
            if (ngaySinhCell.getCellType() == CellType.NUMERIC) {
                Date d = ngaySinhCell.getDateCellValue();
                if (d != null) {
                    sv.setNgaySinh(LocalDateTime.ofInstant(d.toInstant(), ZoneId.systemDefault()));
                }
            } else {
                String s = trimToNull(readCellAsString(ngaySinhCell));
                if (s != null) {
                    try {
                        // Chấp nhận "yyyy-MM-dd" hoặc "dd/MM/yyyy"
                        if (s.contains("/")) {
                            String[] parts = s.split("/");
                            if (parts.length == 3) {
                                int d = Integer.parseInt(parts[0]);
                                int m = Integer.parseInt(parts[1]);
                                int y = Integer.parseInt(parts[2]);
                                sv.setNgaySinh(LocalDateTime.of(y, m, d, 0, 0));
                            }
                        } else {
                            sv.setNgaySinh(LocalDateTime.parse(s));
                        }
                    } catch (Exception ignore) {
                        // bỏ qua ngày sinh nếu không parse được
                    }
                }
            }
        }

        sv.setGioiTinh(trimToNull(readCellAsString(row.getCell(3))));
        sv.setCccd(trimToNull(readCellAsString(row.getCell(4))));
        sv.setSdt(trimToNull(readCellAsString(row.getCell(5))));
        sv.setEmail(trimToNull(readCellAsString(row.getCell(6))));
        sv.setQueQuan(trimToNull(readCellAsString(row.getCell(7))));
        sv.setNganh(trimToNull(readCellAsString(row.getCell(8))));
        sv.setLop(trimToNull(readCellAsString(row.getCell(9))));
        sv.setKhoa(trimToNull(readCellAsString(row.getCell(10))));
        sv.setKhoaNamNhapHoc(trimToNull(readCellAsString(row.getCell(11))));
        sv.setHeDaoTao(trimToNull(readCellAsString(row.getCell(12))));

        String trangThai = trimToNull(readCellAsString(row.getCell(13)));
        if (trangThai != null) {
            try {
                sv.setTrangThaiHocVu(TrangThaiHocVu.fromDisplayName(trangThai));
            } catch (IllegalArgumentException ex) {
                // Không set - để null, người gọi xử lý
            }
        }

        return sv;
    }

    private void writeCell(Row row, int col, String value) {
        Cell cell = row.createCell(col);
        cell.setCellValue(value == null ? "" : value);
    }

    private void writeDateCell(Row row, int col, LocalDateTime value, CellStyle style) {
        if (value == null) return;
        Cell cell = row.createCell(col);
        cell.setCellValue(Date.from(value.atZone(ZoneId.systemDefault()).toInstant()));
        cell.setCellStyle(style);
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
}