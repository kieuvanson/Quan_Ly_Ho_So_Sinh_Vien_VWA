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
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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
        "Email", "Quê quán", "Khoa", "Ngành", "Lớp", "Khóa nhập học",
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
                writeCell(row, 8, khoa != null ? khoa.getTenKhoa() : null);
                writeCell(row, 9, nganh != null ? safeGetTenNganh(nganh) : null);
                writeCell(row, 10, lop != null ? lop.getTenLop() : null);
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
            writeCell(exampleRow, 8, "Khoa CNTT");
            writeCell(exampleRow, 9, "Công nghệ thông tin");
            writeCell(exampleRow, 10, "CNTT-2023.1");
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
            // Tự động nhận diện vị trí cột từ header để KHÔNG phụ thuộc thứ tự cố định.
            int[] colIdx = detectColumns(sheet, startDataRowIdx - 1, errors);

            int physicalRows = sheet.getPhysicalNumberOfRows();
            int importedRowNumber = 0;

            for (int r = startDataRowIdx; r < physicalRows; r++) {
                Row row = sheet.getRow(r);
                if (row == null || isRowEmpty(row)) continue;

                importedRowNumber++;
                int excelRow = r + 1;
                try {
                    SinhVien sv = parseRow(row, excelRow, errors, importedRowNumber, colIdx);
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
     * Tự động phát hiện vị trí cột từ dòng header.
     * Trả về mảng int[] có 14 phần tử theo thứ tự:
     * 0:MSSV, 1:Họ tên, 2:Ngày sinh, 3:Giới tính, 4:CCCD, 5:SĐT,
     * 6:Email, 7:Quê quán, 8:Khoa, 9:Ngành, 10:Lớp, 11:Khóa, 12:Hệ, 13:Trạng thái.
     * Nếu không tìm thấy cột danh mục, trả về -1 để báo lỗi ở từng dòng.
     */
    private int[] detectColumns(Sheet sheet, int headerRowIdx, List<RowError> errors) {
        int[] idx = new int[] { -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1 };
        Row header = sheet.getRow(headerRowIdx);
        if (header == null) return idx;

        Map<String, Integer> headerMap = new HashMap<>();
        for (int c = header.getFirstCellNum(); c < header.getLastCellNum(); c++) {
            Cell cell = header.getCell(c);
            if (cell == null) continue;
            String name = trimToNull(readCellAsString(cell));
            if (name != null) headerMap.put(normalize(name), c);
        }

        idx[0] = findHeader(headerMap, "mssv", "ma so sinh vien", "mã số sv");
        idx[1] = findHeader(headerMap, "ho ten", "ho va ten", "họ tên", "họ và tên", "ten", "tên", "ten sinh vien", "tên sinh viên");
        idx[2] = findHeader(headerMap, "ngay sinh", "ngày sinh", "ngay sinh:", "dob", "ngày sinh:");
        idx[3] = findHeader(headerMap, "gioi tinh", "giới tính", "gioi tinh:", "sex", "gender", "giới tính:");
        idx[4] = findHeader(headerMap, "cccd", "cmnd", "so cccd", "số cccd", "căn cước");
        idx[5] = findHeader(headerMap, "sdt", "số điện thoại", "so dien thoai", "phone", "số dt", "điện thoại");
        idx[6] = findHeader(headerMap, "email", "mail", "thư điện tử");
        idx[7] = findHeader(headerMap, "que quan", "quê quán", "que quan:", "address", "dia chi", "địa chỉ", "quê quán:");
        idx[8] = findHeader(headerMap, "khoa", "khoa:", "tên khoa", "ten khoa", "khoa chuyen mon", "khoa chuyên môn");
        idx[9] = findHeader(headerMap, "nganh", "ngành", "nganh:", "tên ngành", "ten nganh", "ngành:");
        idx[10] = findHeader(headerMap, "lop", "lớp", "lop:", "tên lớp", "ten lop", "lớp:");
        idx[11] = findHeader(headerMap, "khoa hoc", "khóa học", "ten khoa hoc", "tên khóa học", "khoa nhap hoc", "khóa nhập học", "khoa nien hoc", "khóa niên học", "khoa dao tao", "khóa đào tạo", "khoa hoc:", "khoa nhap hoc:");
        idx[12] = findHeader(headerMap, "he dao tao", "hệ đào tạo", "he:", "training system", "ten he dao tao", "tên hệ đào tạo", "hệ:");
        idx[13] = findHeader(headerMap, "trang thai hoc vu", "trạng thái học vụ", "trang thai:", "trang thai hoc vu:", "trang thai:", "ten trang thai", "tên trạng thái", "status", "trang thai");

        if (idx[0] == -1) errors.add(new RowError(0, "Không tìm thấy cột MSSV trong header."));
        if (idx[1] == -1) errors.add(new RowError(0, "Không tìm thấy cột Họ tên trong header."));

        return idx;
    }

    private int findHeader(Map<String, Integer> map, String... candidates) {
        for (String c : candidates) {
            Integer idx = map.get(normalize(c));
            if (idx != null) return idx;
        }
        return -1;
    }

    private String normalize(String s) {
        if (s == null) return "";
        return s.toLowerCase()
                .replaceAll("[\\s:]+", " ")
                .trim();
    }

    /**
     * Parse 1 dòng Excel thành SinhVien, có resolve FK qua {@link DanhMucService}.
     *
     * @param colIdx mảng vị trí cột do {@link #detectColumns} trả về.
     * @return SinhVien nếu parse OK, hoặc {@code null} nếu dòng bị loại (lỗi đã push vào errors).
     */
    private SinhVien parseRow(Row row, int excelRow, List<RowError> errors, int importedRowNumber, int[] colIdx) {
        SinhVien sv = new SinhVien();
        sv.setMssv(trimToNull(readCellAsString(safeCell(row, colIdx[0]))));
        sv.setHoTen(trimToNull(readCellAsString(safeCell(row, colIdx[1]))));

        Cell ngaySinhCell = safeCell(row, colIdx[2]);
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

        sv.setGioiTinh(trimToNull(readCellAsString(safeCell(row, colIdx[3]))));
        sv.setCccd(trimToNull(readCellAsString(safeCell(row, colIdx[4]))));
        sv.setSdt(trimToNull(readCellAsString(safeCell(row, colIdx[5]))));
        sv.setEmail(trimToNull(readCellAsString(safeCell(row, colIdx[6]))));
        sv.setQueQuan(trimToNull(readCellAsString(safeCell(row, colIdx[7]))));

        // Tự động resolve FK theo vị trí cột đã detect từ header.
        String tenKhoa     = trimToNull(readCellAsString(safeCell(row, colIdx[8])));
        String tenNganh    = trimToNull(readCellAsString(safeCell(row, colIdx[9])));
        String tenLop      = trimToNull(readCellAsString(safeCell(row, colIdx[10])));
        String tenKhoaHoc  = trimToNull(readCellAsString(safeCell(row, colIdx[11])));

        Optional<Khoa> khoa = tenKhoa == null
                ? Optional.empty()
                : danhMucService.findKhoaByTen(tenKhoa);
        Optional<KhoaHoc> khoaHoc = tenKhoaHoc == null
                ? Optional.empty()
                : danhMucService.findKhoaHocByTen(tenKhoaHoc);
        // Sau V6: nganh là danh mục độc lập, không cần khoa để lookup
        Optional<Nganh> nganh = tenNganh == null
                ? Optional.empty()
                : danhMucService.findNganhByTen(tenNganh);
        Optional<Lop> lop = (tenLop != null && nganh.isPresent() && khoaHoc.isPresent())
                ? danhMucService.findLopByTen(tenLop, nganh.get(), khoaHoc.get())
                : Optional.empty();

        // Đối với 4 trường bắt buộc (Khoa, Ngành, Lớp, Khóa học):
        //   - Nếu Excel có ghi tên mà không tìm thấy → báo lỗi NGAY tại parse
        //     để người dùng biết dòng nào sai, thay vì đợi tới lúc INSERT mới
        //     nổ FK constraint (Not-Null).
        //   - Nếu Excel bỏ trống cả 4 → để null, SinhVienService sẽ báo lỗi
        //     "Thiếu thông tin danh mục bắt buộc" ở bước validate trước save.
        if (tenKhoa != null && khoa.isEmpty()) {
            errors.add(new RowError(excelRow, "Không tìm thấy Khoa: '" + tenKhoa + "'."));
            return null;
        }
        if (tenKhoaHoc != null && khoaHoc.isEmpty()) {
            errors.add(new RowError(excelRow, "Không tìm thấy Khóa học: '" + tenKhoaHoc + "'."));
            return null;
        }
        if (tenNganh != null && nganh.isEmpty()) {
            errors.add(new RowError(excelRow, "Không tìm thấy Ngành: '" + tenNganh + "'."));
            return null;
        }
        if (tenLop != null && (nganh.isEmpty() || khoaHoc.isEmpty())) {
            // Lớp cần cả Ngành + Khóa học mới lookup được
            String missing = new StringBuilder()
                    .append(nganh.isEmpty() ? "Ngành '" + tenNganh + "' " : "")
                    .append(khoaHoc.isEmpty() ? "Khóa học '" + tenKhoaHoc + "' " : "")
                    .toString().trim();
            errors.add(new RowError(excelRow,
                    "Không thể tìm Lớp '" + tenLop + "' vì thiếu " + missing + "."));
            return null;
        }
        if (tenLop != null && nganh.isPresent() && khoaHoc.isPresent() && lop.isEmpty()) {
            errors.add(new RowError(excelRow,
                    "Không tìm thấy Lớp '" + tenLop + "' thuộc Ngành '" + tenNganh
                            + "' - Khóa học '" + tenKhoaHoc + "'."));
            return null;
        }

        khoa.ifPresent(sv::setKhoa);
        nganh.ifPresent(sv::setNganh);
        lop.ifPresent(sv::setLop);
        khoaHoc.ifPresent(sv::setKhoaHoc);

        sv.setHeDaoTao(trimToNull(readCellAsString(safeCell(row, colIdx[12]))));

        String trangThai = trimToNull(readCellAsString(safeCell(row, colIdx[13])));
        if (trangThai != null) {
            try {
                sv.setTrangThaiHocVu(TrangThaiHocVu.fromDisplayName(trangThai));
            } catch (IllegalArgumentException ex) {
                // Không set - để null, người gọi xử lý
            }
        }

        return sv;
    }

    /** Lấy cell an toàn: trả về null nếu colIdx = -1 (cột không tồn tại trong header). */
    private Cell safeCell(Row row, int colIdx) {
        if (colIdx < 0) return null;
        return row.getCell(colIdx);
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
