package vn.vwa.edurecords.service;

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
import vn.vwa.edurecords.entity.Khoa;
import vn.vwa.edurecords.entity.KhoaHoc;
import vn.vwa.edurecords.entity.Lop;
import vn.vwa.edurecords.entity.Nganh;
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
import java.util.Optional;

/**
 * Service đọc/ghi Excel cho SinhVien.
 *
 * <h3>Sau V4</h3>
 * <ul>
 *   <li>Excel vẫn có cột "Khoa", "Ngành", "Lớp", "Khóa nhập học" dạng TEXT
 *       để người dùng cuối không cần biết id.</li>
 *   <li>Service dùng {@link DanhMucService} để lookup (hoặc tự tạo cascade) các
 *       bản ghi danh mục, rồi gắn FK entity vào {@code SinhVien}.</li>
 *   <li>Export: lấy {@code tenKhoa/tenNganh/tenLop/tenKhoaHoc} từ entity FK
 *       (qua {@code @ManyToOne}) để ghi lại cột text cho người dùng đọc.</li>
 * </ul>
 */
@Service
public class SinhVienExcelService {

    private static final String[] HEADERS = new String[] {
        "MSSV", "Họ tên", "Ngày sinh", "Giới tính", "CCCD", "SĐT",
        "Email", "Quê quán", "Ngành", "Lớp", "Khoa", "Khóa nhập học",
        "Hệ đào tạo", "Trạng thái học vụ"
    };

    private final DanhMucService danhMucService;

    public SinhVienExcelService(DanhMucService danhMucService) {
        this.danhMucService = danhMucService;
    }

    public record ImportResult(
        int successCount,
        int failureCount,
        List<SinhVien> sinhViens,
        List<RowError> errors
    ) {}

    public record RowError(int rowNumber, String message) {}

    public byte[] export(List<SinhVien> data) throws IOException {
        try (SXSSFWorkbook workbook = new SXSSFWorkbook(100);
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet("Danh sách sinh viên");
            sheet.setDefaultColumnWidth(18);

            CellStyle headerStyle = workbook.createCellStyle();
            org.apache.poi.ss.usermodel.Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.GREY_50_PERCENT.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);

            CellStyle dateStyle = workbook.createCellStyle();
            DataFormat format = workbook.createDataFormat();
            dateStyle.setDataFormat(format.getFormat("dd/MM/yyyy"));

            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < HEADERS.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(HEADERS[i]);
                cell.setCellStyle(headerStyle);
            }

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
                // Sau V4: lấy tên từ FK entity (có thể null khi admin chưa
                // load lazy — ghi "" thay vì crash).
                Khoa khoa = sv.getKhoa();
                Nganh nganh = sv.getNganh();
                Lop lop = sv.getLop();
                KhoaHoc kh = sv.getKhoaHoc();
                writeCell(row, 8, nganh != null ? safeGetTenNganh(nganh) : null);
                writeCell(row, 9, lop != null ? lop.getTenLop() : null);
                writeCell(row, 10, khoa != null ? khoa.getTenKhoa() : null);
                writeCell(row, 11, kh != null ? kh.getTenKhoaHoc() : null);
                writeCell(row, 12, sv.getHeDaoTao());
                writeCell(row, 13, sv.getTrangThaiHocVu() != null ? sv.getTrangThaiHocVu().getDisplayName() : null);
            }

            workbook.write(baos);
            workbook.dispose();
            return baos.toByteArray();
        }
    }

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

            Row noteRow = sheet.createRow(0);
            Cell noteCell = noteRow.createCell(0);
            noteCell.setCellValue("Hướng dẫn: Giữ nguyên dòng header phía dưới. "
                    + "Cột Khoa/Ngành/Lớp/Khóa nhập học điền TÊN danh mục "
                    + "(vd 'Khoa CNTT', 'Công nghệ thông tin', 'CNTT-2023.1', '2023'). "
                    + "MSSV không được trống và phải duy nhất.");

            Row headerRow = sheet.createRow(1);
            for (int i = 0; i < HEADERS.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(HEADERS[i]);
                cell.setCellStyle(headerStyle);
            }

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
            writeCell(exampleRow, 10, "Khoa CNTT");
            writeCell(exampleRow, 11, "2023");
            writeCell(exampleRow, 12, "Chính quy");
            writeCell(exampleRow, 13, "Đang học");

            workbook.write(baos);
            return baos.toByteArray();
        }
    }

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
            int importedRowNumber = 0;

            for (int r = startDataRowIdx; r < physicalRows; r++) {
                Row row = sheet.getRow(r);
                if (row == null || isRowEmpty(row)) continue;

                importedRowNumber++;
                int excelRow = r + 1;
                try {
                    SinhVien sv = parseRow(row, excelRow, errors, importedRowNumber);
                    if (sv == null) continue; // parseRow đã push lỗi
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
     * Parse 1 dòng Excel thành SinhVien, có resolve FK qua {@link DanhMucService}.
     *
     * @return SinhVien nếu parse OK, hoặc {@code null} nếu dòng bị loại (lỗi đã push vào errors).
     */
    private SinhVien parseRow(Row row, int excelRow, List<RowError> errors, int importedRowNumber) {
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

        // Sau V4: cột 8..11 là TÊN danh mục. Resolve qua DanhMucService.
        // Thứ tự: Ngành(8), Lớp(9), Khoa(10), Khóa học(11) — cần Khoa trước
        // Ngành, Khóa học trước Lớp.
        String tenNganh    = trimToNull(readCellAsString(row.getCell(8)));
        String tenLop      = trimToNull(readCellAsString(row.getCell(9)));
        String tenKhoa     = trimToNull(readCellAsString(row.getCell(10)));
        String tenKhoaHoc  = trimToNull(readCellAsString(row.getCell(11)));

        Optional<Khoa> khoa = tenKhoa == null
                ? Optional.empty()
                : danhMucService.findOrCreateKhoaByTen(tenKhoa);
        Optional<KhoaHoc> khoaHoc = tenKhoaHoc == null
                ? Optional.empty()
                : danhMucService.findOrCreateKhoaHocByTen(tenKhoaHoc);
        Optional<Nganh> nganh = (tenNganh != null && khoa.isPresent())
                ? danhMucService.findOrCreateNganhByTen(tenNganh, khoa.get())
                : Optional.empty();
        Optional<Lop> lop = (tenLop != null && nganh.isPresent() && khoaHoc.isPresent())
                ? danhMucService.findOrCreateLopByTen(tenLop, nganh.get(), khoaHoc.get())
                : Optional.empty();

        khoa.ifPresent(sv::setKhoa);
        nganh.ifPresent(sv::setNganh);
        lop.ifPresent(sv::setLop);
        khoaHoc.ifPresent(sv::setKhoaHoc);

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

    /**
     * Sau V4, {@code SinhVien.nganh} là {@code Nganh} entity (lazy). Khi export
     * từ danh sách đã load FK (qua JOIN FETCH hoặc {@code Hibernate.initialize})
     * thì gọi được {@code nganh.getTenNganh()}; nếu lazy chưa load, trả về
     * {@code null} thay vì crash {@code LazyInitializationException}.
     */
    private String safeGetTenNganh(Nganh nganh) {
        try {
            return nganh.getTenNganh();
        } catch (Exception ignore) {
            return null;
        }
    }
}
