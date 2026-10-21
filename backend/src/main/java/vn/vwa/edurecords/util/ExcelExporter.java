package vn.vwa.edurecords.util;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Utility để export danh sách thành file Excel (.xlsx).
 * Sử dụng Apache POI đã có sẵn trong pom.xml.
 *
 * Cách dùng:
 * <pre>
 * ExcelExporter exporter = new ExcelExporter(List.of("Mã", "Tên", "Mô tả"));
 * for (MyItem item : items) {
 *     exporter.addRow(List.of(item.getMa(), item.getTen(), item.getMoTa()));
 * }
 * byte[] bytes = exporter.toBytes();
 * </pre>
 */
public class ExcelExporter {

    private final String[] headers;
    private final Workbook workbook;
    private final Sheet sheet;
    private Row currentRow;

    private static final DateTimeFormatter DATE_FMT =
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");

    /**
     * Tạo exporter với tiêu đề cột cho trước.
     *
     * @param headers Mảng tiêu đề tiếng Việt — phải khớp số cột với dữ liệu.
     */
    public ExcelExporter(String[] headers) {
        this.headers = headers;
        this.workbook = new XSSFWorkbook();
        this.sheet = workbook.createSheet();
        writeHeader();
    }

    private void writeHeader() {
        Row headerRow = sheet.createRow(0);
        CellStyle style = createHeaderStyle(workbook);
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(style);
            sheet.setColumnWidth(i, 5000 * 3); // ~15cm
        }
        // Freeze dòng tiêu đề
        sheet.createFreezePane(0, 1);
    }

    /**
     * Thêm một dòng dữ liệu.
     *
     * @param values Giá trị các cột. Hỗ trợ String, Number, Boolean, LocalDateTime, null.
     */
    public void addRow(List<?> values) {
        int rowNum = sheet.getLastRowNum() + 1;
        this.currentRow = sheet.createRow(rowNum);
        int col = 0;
        for (Object val : values) {
            Cell cell = currentRow.createCell(col++);
            if (val == null) {
                cell.setCellValue("");
            } else if (val instanceof String s) {
                cell.setCellValue(s);
            } else if (val instanceof Number n) {
                cell.setCellValue(n.doubleValue());
            } else if (val instanceof Boolean b) {
                cell.setCellValue(b ? "Có" : "Không");
            } else if (val instanceof LocalDateTime dt) {
                cell.setCellValue(dt.format(DATE_FMT));
            } else {
                cell.setCellValue(val.toString());
            }
        }
    }

    /**
     * Chuyển thành byte array (để trả về qua ResponseEntity).
     */
    public byte[] toBytes() throws IOException {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            workbook.write(out);
            return out.toByteArray();
        } finally {
            workbook.close();
        }
    }

    /** Tạo style cho dòng tiêu đề. */
    private static CellStyle createHeaderStyle(Workbook wb) {
        Font font = wb.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 11);
        font.setColor(IndexedColors.WHITE.getIndex());

        CellStyle style = wb.createCellStyle();
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);

        return style;
    }

    // ---- Template helpers ----

    /**
     * Tạo một file Excel template rỗng với tiêu đề cột cho trước.
     * Dùng để download làm file mẫu import.
     */
    public static byte[] createTemplate(String[] headers) throws IOException {
        ExcelExporter exporter = new ExcelExporter(headers);
        // Thêm 3 dòng mẫu trống để người dùng biết format
        for (int i = 0; i < 3; i++) {
            exporter.addRow(java.util.Collections.nCopies(headers.length, ""));
        }
        return exporter.toBytes();
    }
}
