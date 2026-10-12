package vn.vwa.edurecords.service;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import vn.vwa.edurecords.dto.request.KhoaRequest;
import vn.vwa.edurecords.dto.request.KhoaHocRequest;
import vn.vwa.edurecords.dto.request.NganhRequest;
import vn.vwa.edurecords.dto.request.LopRequest;
import vn.vwa.edurecords.dto.response.*;
import vn.vwa.edurecords.entity.Khoa;
import vn.vwa.edurecords.entity.KhoaHoc;
import vn.vwa.edurecords.entity.Nganh;
import vn.vwa.edurecords.entity.Lop;
import vn.vwa.edurecords.exception.BadRequestException;
import vn.vwa.edurecords.repository.KhoaRepository;
import vn.vwa.edurecords.repository.KhoaHocRepository;
import vn.vwa.edurecords.repository.NganhRepository;
import vn.vwa.edurecords.repository.LopRepository;
import vn.vwa.edurecords.util.ExcelExporter;

import java.io.IOException;
import java.io.InputStream;
import java.util.*;

/**
 * Service xử lý Import/Export Excel cho các danh mục: Khoa, Nganh, KhoaHoc, Lop, LoaiGiayTo.
 *
 * <h3>Import</h3>
 * <ul>
 *   <li>Chính sách trùng mã: <b>BÁO LỖI</b> — không thêm mới, không cập nhật.</li>
 *   <li>Cascade: import Lớp tự tạo Ngành/Khóa năm học nếu chưa có.</li>
 *   <li>Validation: tên rỗng, năm không hợp lệ.</li>
 *   <li>Tất cả dòng hợp lệ mới ghi transaction.</li>
 * </ul>
 *
 * <h3>Export</h3>
 * Xuất tất cả bản ghi (kể cả ngừng sử dụng) để phục vụ backup.
 */
@Service
public class DanhMucExcelService {

    private final DanhMucService danhMucService;
    private final LoaiGiayToService loaiGiayToService;
    private final KhoaRepository khoaRepository;
    private final NganhRepository nganhRepository;
    private final KhoaHocRepository khoaHocRepository;
    private final LopRepository lopRepository;

    // Giới hạn
    private static final int MAX_ROWS = 1000;

    public DanhMucExcelService(DanhMucService danhMucService, LoaiGiayToService loaiGiayToService,
            KhoaRepository khoaRepository, NganhRepository nganhRepository,
            KhoaHocRepository khoaHocRepository, LopRepository lopRepository) {
        this.danhMucService = danhMucService;
        this.loaiGiayToService = loaiGiayToService;
        this.khoaRepository = khoaRepository;
        this.nganhRepository = nganhRepository;
        this.khoaHocRepository = khoaHocRepository;
        this.lopRepository = lopRepository;
    }

    // ========================================================================
    // EXPORT
    // ========================================================================

    public byte[] exportKhoa() throws IOException {
        List<Khoa> all = khoaRepository.findAll();
        String[] headers = { "Mã khoa", "Tên khoa", "Mô tả", "Đang sử dụng", "Ngày tạo" };
        ExcelExporter ex = new ExcelExporter(headers);
        for (Khoa k : all) {
            KhoaExcelResponse r = KhoaExcelResponse.fromEntity(k);
            ex.addRow(List.of(
                    r.getMaKhoa(), r.getTenKhoa(), r.getMoTa(),
                    r.getDangSuDung() ? "Có" : "Không", r.getNgayTao()
            ));
        }
        return ex.toBytes();
    }

    public byte[] exportNganh() throws IOException {
        List<Nganh> all = nganhRepository.findAll();
        String[] headers = { "Mã ngành", "Tên ngành", "Mô tả", "Đang sử dụng", "Ngày tạo" };
        ExcelExporter ex = new ExcelExporter(headers);
        for (Nganh n : all) {
            NganhExcelResponse r = NganhExcelResponse.fromEntity(n);
            ex.addRow(List.of(
                    r.getMaNganh(), r.getTenNganh(),
                    r.getMoTa(), r.getDangSuDung() ? "Có" : "Không", r.getNgayTao()
            ));
        }
        return ex.toBytes();
    }

    public byte[] exportKhoaHoc() throws IOException {
        List<KhoaHoc> all = khoaHocRepository.findAll();
        String[] headers = { "Mã khóa năm học", "Tên khóa năm học", "Năm bắt đầu", "Năm kết thúc", "Mô tả", "Đang sử dụng", "Ngày tạo" };
        ExcelExporter ex = new ExcelExporter(headers);
        for (KhoaHoc kh : all) {
            KhoaHocExcelResponse r = KhoaHocExcelResponse.fromEntity(kh);
            ex.addRow(List.of(
                    r.getMaKhoaHoc(), r.getTenKhoaHoc(),
                    r.getNamBatDau(), r.getNamKetThuc(),
                    r.getMoTa(), r.getDangSuDung() ? "Có" : "Không", r.getNgayTao()
            ));
        }
        return ex.toBytes();
    }

    public byte[] exportLop() throws IOException {
        List<Lop> all = lopRepository.findAll();
        String[] headers = { "Mã lớp", "Tên lớp", "Ngành", "Khóa năm học", "Mô tả", "Đang sử dụng", "Ngày tạo" };
        ExcelExporter ex = new ExcelExporter(headers);
        for (Lop l : all) {
            LopExcelResponse r = LopExcelResponse.fromEntity(l);
            ex.addRow(List.of(
                    r.getMaLop(), r.getTenLop(), r.getNganhTen(),
                    r.getKhoaHocNam(), r.getMoTa(),
                    r.getDangSuDung() ? "Có" : "Không", r.getNgayTao()
            ));
        }
        return ex.toBytes();
    }

    public byte[] exportLoaiGiayTo() throws IOException {
        List<?> all = loaiGiayToService.getAllActive();
        String[] headers = { "Mã loại", "Tên giấy tờ", "Mô tả", "Bắt buộc", "Thứ tự hiển thị", "Đang sử dụng", "Ngày tạo" };
        ExcelExporter ex = new ExcelExporter(headers);
        for (Object item : all) {
            var lgt = (vn.vwa.edurecords.entity.LoaiGiayTo) item;
            ex.addRow(List.of(
                    lgt.getMaLoai(), lgt.getTenGiayTo(), lgt.getMoTa(),
                    lgt.getBatBuoc() ? "Có" : "Không",
                    lgt.getThuTuHienThi(),
                    lgt.getDangSuDung() ? "Có" : "Không",
                    lgt.getNgayTao()
            ));
        }
        return ex.toBytes();
    }

    // ========================================================================
    // TEMPLATES
    // ========================================================================

    public byte[] templateKhoa() throws IOException {
        return ExcelExporter.createTemplate(new String[]{ "Tên khoa", "Mô tả" });
    }

    public byte[] templateNganh() throws IOException {
        return ExcelExporter.createTemplate(new String[]{ "Tên ngành", "Mô tả" });
    }

    public byte[] templateKhoaHoc() throws IOException {
        return ExcelExporter.createTemplate(new String[]{ "Tên khóa năm học", "Năm bắt đầu", "Năm kết thúc", "Mô tả" });
    }

    public byte[] templateLop() throws IOException {
        return ExcelExporter.createTemplate(new String[]{ "Tên lớp", "Tên ngành", "Tên khóa năm học", "Mô tả" });
    }

    public byte[] templateLoaiGiayTo() throws IOException {
        return ExcelExporter.createTemplate(new String[]{ "Tên giấy tờ", "Mô tả", "Bắt buộc (Có/Không)", "Thứ tự hiển thị", "Đang sử dụng (Có/Không)" });
    }

    // ========================================================================
    // IMPORT
    // ========================================================================

    /** Kết quả import — trả về cho frontend. */
    public record ImportResult(
            int totalRows,
            int successCount,
            int failureCount,
            int duplicateCount,
            int newCount,
            List<RowError> errors
    ) {}

    /** Lỗi ở một dòng. */
    public record RowError(int rowNumber, String message) {}

    // ----- KHOA -----

    @Transactional
    public ImportResult importKhoa(MultipartFile file) throws IOException {
        validateFile(file);
        List<RowError> errors = new ArrayList<>();
        List<String[]> validRows = new ArrayList<>();
        int totalRows = 0;

        try (InputStream is = file.getInputStream();
             Workbook wb = new XSSFWorkbook(is)) {
            Sheet sheet = wb.getSheetAt(0);
            int lastRow = Math.min(sheet.getLastRowNum(), MAX_ROWS);
            for (int i = 1; i <= lastRow; i++) {
                Row row = sheet.getRow(i);
                if (row == null || isRowEmpty(row)) continue;
                totalRows++;
                String tenKhoa = getStringCell(row, 0);
                String moTa = getStringCell(row, 1);

                List<String> errs = validateKhoa(tenKhoa);
                if (!errs.isEmpty()) {
                    errors.add(new RowError(i + 1, String.join("; ", errs)));
                } else {
                    // Kiểm tra trùng
                    if (danhMucService.findKhoaByTen(tenKhoa).isPresent()) {
                        errors.add(new RowError(i + 1, "Khoa '" + tenKhoa + "' đã tồn tại."));
                    } else {
                        validRows.add(new String[]{ tenKhoa, moTa });
                    }
                }
            }
        }

        int newCount = 0;
        for (String[] row : validRows) {
            danhMucService.createKhoa(new KhoaRequest(row[0], row[1], true));
            newCount++;
        }

        return new ImportResult(totalRows, newCount, errors.size(), 0, newCount, errors);
    }

    private List<String> validateKhoa(String tenKhoa) {
        List<String> errs = new ArrayList<>();
        if (tenKhoa == null || tenKhoa.trim().isEmpty()) {
            errs.add("Tên khoa không được để trống.");
        }
        return errs;
    }

    // ----- NGANH -----

    /**
     * Import Ngành — sau chuẩn hóa: bắt buộc có Tên khoa.
     * Cột Excel: Tên ngành, Tên khoa, Mô tả.
     */
    @Transactional
    public ImportResult importNganh(MultipartFile file) throws IOException {
        validateFile(file);
        List<RowError> errors = new ArrayList<>();
        List<String[]> validRows = new ArrayList<>();
        int totalRows = 0;

        try (InputStream is = file.getInputStream();
             Workbook wb = new XSSFWorkbook(is)) {
            Sheet sheet = wb.getSheetAt(0);
            int lastRow = Math.min(sheet.getLastRowNum(), MAX_ROWS);
            for (int i = 1; i <= lastRow; i++) {
                Row row = sheet.getRow(i);
                if (row == null || isRowEmpty(row)) continue;
                totalRows++;
                String tenNganh = getStringCell(row, 0);
                String tenKhoa = getStringCell(row, 1);
                String moTa = getStringCell(row, 2);

                List<String> errs = validateNganh(tenNganh, tenKhoa);
                if (!errs.isEmpty()) {
                    errors.add(new RowError(i + 1, String.join("; ", errs)));
                } else {
                    // Tìm Khoa theo tên
                    Optional<Khoa> khoaOpt = khoaRepository.findByTenKhoaIgnoreCase(tenKhoa.trim());
                    if (khoaOpt.isEmpty()) {
                        errors.add(new RowError(i + 1, "Khoa '" + tenKhoa + "' không tồn tại. Vui lòng tạo Khoa trước."));
                    } else {
                        // Kiểm tra trùng theo (tên ngành, khoa)
                        Optional<Nganh> existing = nganhRepository.findFirstByTenNganhIgnoreCaseAndKhoa_Id(tenNganh.trim(), khoaOpt.get().getId());
                        if (existing.isPresent()) {
                            errors.add(new RowError(i + 1, "Ngành '" + tenNganh + "' đã tồn tại trong khoa '" + tenKhoa + "'."));
                        } else {
                            validRows.add(new String[]{ tenNganh, String.valueOf(khoaOpt.get().getId()), moTa });
                        }
                    }
                }
            }
        }

        int newCount = 0;
        for (String[] row : validRows) {
            NganhRequest req = new NganhRequest();
            req.setKhoaId(Integer.parseInt(row[1]));
            req.setTenNganh(row[0]);
            req.setMoTa(row[2]);
            req.setDangSuDung(true);
            danhMucService.createNganh(req);
            newCount++;
        }

        return new ImportResult(totalRows, newCount, errors.size(), 0, newCount, errors);
    }

    private List<String> validateNganh(String tenNganh, String tenKhoa) {
        List<String> errs = new ArrayList<>();
        if (tenNganh == null || tenNganh.trim().isEmpty()) {
            errs.add("Tên ngành không được để trống.");
        }
        if (tenKhoa == null || tenKhoa.trim().isEmpty()) {
            errs.add("Tên khoa không được để trống.");
        }
        return errs;
    }

    // ----- KHOA HOC -----

    @Transactional
    public ImportResult importKhoaHoc(MultipartFile file) throws IOException {
        validateFile(file);
        List<RowError> errors = new ArrayList<>();
        List<String[]> validRows = new ArrayList<>();
        int totalRows = 0;

        try (InputStream is = file.getInputStream();
             Workbook wb = new XSSFWorkbook(is)) {
            Sheet sheet = wb.getSheetAt(0);
            int lastRow = Math.min(sheet.getLastRowNum(), MAX_ROWS);
            for (int i = 1; i <= lastRow; i++) {
                Row row = sheet.getRow(i);
                if (row == null || isRowEmpty(row)) continue;
                totalRows++;
                String tenKhoaHoc = getStringCell(row, 0);
                String namBD = getStringCell(row, 1);
                String namKT = getStringCell(row, 2);
                String moTa = getStringCell(row, 3);

                List<String> errs = validateKhoaHoc(tenKhoaHoc, namBD, namKT);
                if (!errs.isEmpty()) {
                    errors.add(new RowError(i + 1, String.join("; ", errs)));
                } else {
                    if (danhMucService.findKhoaHocByTen(tenKhoaHoc).isPresent()) {
                        errors.add(new RowError(i + 1, "Khóa học '" + tenKhoaHoc + "' đã tồn tại."));
                    } else {
                        validRows.add(new String[]{
                                tenKhoaHoc,
                                namBD.isEmpty() ? null : namBD,
                                namKT.isEmpty() ? null : namKT,
                                moTa
                        });
                    }
                }
            }
        }

        int newCount = 0;
        for (String[] row : validRows) {
            KhoaHocRequest req = new KhoaHocRequest(
                    row[0],
                    row[1] != null ? Integer.parseInt(row[1]) : null,
                    row[2] != null ? Integer.parseInt(row[2]) : null,
                    row[3], true
            );
            danhMucService.createKhoaHoc(req);
            newCount++;
        }

        return new ImportResult(totalRows, newCount, errors.size(), 0, newCount, errors);
    }

    private List<String> validateKhoaHoc(String ten, String namBD, String namKT) {
        List<String> errs = new ArrayList<>();
        if (ten == null || ten.trim().isEmpty()) errs.add("Tên khóa học không được để trống.");
        if (!namBD.isEmpty()) {
            try { Integer.parseInt(namBD); } catch (NumberFormatException e) {
                errs.add("Năm bắt đầu phải là số."); }
        }
        if (!namKT.isEmpty()) {
            try { Integer.parseInt(namKT); } catch (NumberFormatException e) {
                errs.add("Năm kết thúc phải là số."); }
        }
        if (!namBD.isEmpty() && !namKT.isEmpty()) {
            try {
                if (Integer.parseInt(namKT) < Integer.parseInt(namBD))
                    errs.add("Năm kết thúc phải lớn hơn hoặc bằng năm bắt đầu.");
            } catch (NumberFormatException ignored) {}
        }
        return errs;
    }

    // ----- LOP -----

    /**
     * Import Lớp - CHỈ TRA CỨU, không tự tạo Ngành/Khóa năm học.
     * Thứ tự: Tìm Ngành theo (tên ngành, tên khoa) → Tìm Khóa năm học theo tên → Tạo Lớp
     * Báo lỗi nếu Ngành hoặc Khóa năm học không tồn tại.
     */
    @Transactional
    public ImportResult importLop(MultipartFile file) throws IOException {
        validateFile(file);
        List<RowError> errors = new ArrayList<>();
        int totalRows = 0;

        try (InputStream is = file.getInputStream();
             Workbook wb = new XSSFWorkbook(is)) {
            Sheet sheet = wb.getSheetAt(0);
            int lastRow = Math.min(sheet.getLastRowNum(), MAX_ROWS);
            for (int i = 1; i <= lastRow; i++) {
                Row row = sheet.getRow(i);
                if (row == null || isRowEmpty(row)) continue;
                totalRows++;

                String tenLop = getStringCell(row, 0).trim();
                String tenNganh = getStringCell(row, 1).trim();
                String tenKhoa = getStringCell(row, 2).trim(); // Tên khoa chuyên môn
                String moTa = getStringCell(row, 3);

                // Validate bắt buộc
                List<String> rowErrs = validateLopImport(tenLop, tenNganh, tenKhoa);
                if (!rowErrs.isEmpty()) {
                    errors.add(new RowError(i + 1, String.join("; ", rowErrs)));
                    continue;
                }

                // 1. Tìm Khoa theo tên
                Optional<Khoa> khoaOpt = khoaRepository.findByTenKhoaIgnoreCase(tenKhoa);
                if (khoaOpt.isEmpty()) {
                    errors.add(new RowError(i + 1, "Khoa '" + tenKhoa + "' không tồn tại. Vui lòng tạo Khoa trước."));
                    continue;
                }

                // 2. Tìm Ngành theo (tên ngành, khoa_id)
                Optional<Nganh> nganhOpt = nganhRepository.findFirstByTenNganhIgnoreCaseAndKhoa_Id(tenNganh, khoaOpt.get().getId());
                if (nganhOpt.isEmpty()) {
                    errors.add(new RowError(i + 1, "Ngành '" + tenNganh + "' không tồn tại trong khoa '" + tenKhoa + "'. Vui lòng tạo Ngành trước."));
                    continue;
                }
                Nganh nganh = nganhOpt.get();

                // 3. Tìm Khóa năm học theo tên
                Optional<KhoaHoc> khoaHocOpt = khoaHocRepository.findByTenKhoaHocIgnoreCase(tenKhoa);
                if (khoaHocOpt.isEmpty()) {
                    errors.add(new RowError(i + 1, "Khóa năm học '" + tenKhoa + "' không tồn tại. Vui lòng tạo Khóa năm học trước."));
                    continue;
                }
                KhoaHoc khoaHoc = khoaHocOpt.get();

                // 4. Kiểm tra trùng Lớp
                Optional<Lop> existingLop = lopRepository.findFirstByTenLopIgnoreCaseAndNganh_IdAndKhoaHoc_Id(
                        tenLop, nganh.getId(), khoaHoc.getId());
                if (existingLop.isPresent()) {
                    errors.add(new RowError(i + 1, "Lớp '" + tenLop + "' đã tồn tại trong ngành '" + tenNganh + "' khóa '" + tenKhoa + "'."));
                    continue;
                }

                // 5. Tạo Lớp
                Lop lop = new Lop();
                lop.setMaLop(generateMaLop());
                lop.setTenLop(tenLop);
                lop.setNganh(nganh);
                lop.setKhoaHoc(khoaHoc);
                lop.setMoTa(moTa);
                lop.setDangSuDung(true);
                lop.setNgayTao(java.time.LocalDateTime.now());
                lopRepository.save(lop);
            }
        }

        int successCount = totalRows - errors.size();
        return new ImportResult(totalRows, successCount, errors.size(), 0, successCount, errors);
    }

    // Xóa các method findOrCreate không còn sử dụng
    // (findOrCreateNganh, findOrCreateKhoaHoc đã được thay bằng lookup có báo lỗi)

    private String generateMaLop() {
        int max = lopRepository.findAll().stream()
                .map(l -> {
                    String ma = l.getMaLop();
                    if (ma == null) return 0;
                    try { return Integer.parseInt(ma.replaceAll("[^0-9]", "")); } catch (Exception e) { return 0; }
                })
                .max(Integer::compareTo).orElse(0);
        return "LOP" + String.format("%03d", max + 1);
    }

    private String generateMaNganh() {
        int max = nganhRepository.findAll().stream()
                .map(n -> {
                    String ma = n.getMaNganh();
                    if (ma == null) return 0;
                    try { return Integer.parseInt(ma.replaceAll("[^0-9]", "")); } catch (Exception e) { return 0; }
                })
                .max(Integer::compareTo).orElse(0);
        return "NGANH" + String.format("%03d", max + 1);
    }

    private String generateMaKhoaHoc() {
        int max = khoaHocRepository.findAll().stream()
                .map(kh -> {
                    String ma = kh.getMaKhoaHoc();
                    if (ma == null) return 0;
                    try { return Integer.parseInt(ma.replaceAll("[^0-9]", "")); } catch (Exception e) { return 0; }
                })
                .max(Integer::compareTo).orElse(0);
        return "KH" + String.format("%02d", max + 1);
    }

    private List<String> validateLopImport(String tenLop, String tenNganh, String tenKhoa) {
        List<String> errs = new ArrayList<>();
        if (tenLop.isEmpty()) errs.add("Tên lớp không được để trống.");
        if (tenNganh.isEmpty()) errs.add("Tên ngành không được để trống.");
        if (tenKhoa.isEmpty()) errs.add("Tên khoa không được để trống.");
        return errs;
    }

    // ----- LOAI GIAY TO -----

    @Transactional
    public ImportResult importLoaiGiayTo(MultipartFile file) throws IOException {
        validateFile(file);
        List<RowError> errors = new ArrayList<>();
        List<String[]> validRows = new ArrayList<>();
        int totalRows = 0;

        try (InputStream is = file.getInputStream();
             Workbook wb = new XSSFWorkbook(is)) {
            Sheet sheet = wb.getSheetAt(0);
            int lastRow = Math.min(sheet.getLastRowNum(), MAX_ROWS);
            for (int i = 1; i <= lastRow; i++) {
                Row row = sheet.getRow(i);
                if (row == null || isRowEmpty(row)) continue;
                totalRows++;
                String tenGiayTo = getStringCell(row, 0);
                String moTa = getStringCell(row, 1);
                String batBuocStr = getStringCell(row, 2);
                String thuTuStr = getStringCell(row, 3);
                String dangSdStr = getStringCell(row, 4);

                List<String> errs = validateLoaiGiayTo(tenGiayTo, batBuocStr, thuTuStr);
                if (!errs.isEmpty()) {
                    errors.add(new RowError(i + 1, String.join("; ", errs)));
                } else {
                    // Kiểm tra trùng theo tên
                    boolean exists = loaiGiayToService.getAllActive().stream()
                            .anyMatch(lgt -> lgt.getTenGiayTo().equalsIgnoreCase(tenGiayTo.trim()));
                    if (exists) {
                        errors.add(new RowError(i + 1, "Loại giấy tờ '" + tenGiayTo + "' đã tồn tại."));
                    } else {
                        Boolean batBuoc = batBuocStr.trim().equalsIgnoreCase("Có");
                        Integer thuTu = thuTuStr.isEmpty() ? null : Integer.parseInt(thuTuStr.trim());
                        Boolean dangSd = dangSdStr.isEmpty() || dangSdStr.trim().equalsIgnoreCase("Có");
                        validRows.add(new String[]{ tenGiayTo, moTa, String.valueOf(batBuoc), thuTuStr, String.valueOf(dangSd) });
                    }
                }
            }
        }

        int newCount = 0;
        for (String[] row : validRows) {
            loaiGiayToService.createFromImport(
                    row[0], row[1],
                    Boolean.parseBoolean(row[2]),
                    row[3].isEmpty() ? null : Integer.parseInt(row[3]),
                    Boolean.parseBoolean(row[4])
            );
            newCount++;
        }

        return new ImportResult(totalRows, newCount, errors.size(), 0, newCount, errors);
    }

    private List<String> validateLoaiGiayTo(String ten, String batBuoc, String thuTu) {
        List<String> errs = new ArrayList<>();
        if (ten == null || ten.trim().isEmpty()) errs.add("Tên giấy tờ không được để trống.");
        if (!batBuoc.trim().isEmpty() && !batBuoc.trim().equalsIgnoreCase("Có") && !batBuoc.trim().equalsIgnoreCase("Không"))
            errs.add("Cờ bắt buộc phải là 'Có' hoặc 'Không'.");
        if (!thuTu.isEmpty()) {
            try { Integer.parseInt(thuTu.trim()); } catch (NumberFormatException e) {
                errs.add("Thứ tự hiển thị phải là số."); }
        }
        return errs;
    }

    // ========================================================================
    // HELPERS
    // ========================================================================

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty())
            throw new BadRequestException("FILE_EMPTY", "File không được để trống.");
        String name = file.getOriginalFilename();
        if (name == null || (!name.toLowerCase().endsWith(".xlsx") && !name.toLowerCase().endsWith(".xls")))
            throw new BadRequestException("INVALID_FILE", "Chỉ chấp nhận file .xlsx hoặc .xls.");
    }

    private boolean isRowEmpty(Row row) {
        for (int i = 0; i < 10; i++) {
            Cell c = row.getCell(i);
            if (c != null && c.getCellType() != CellType.BLANK) {
                String v = getStringCell(row, i);
                if (v != null && !v.trim().isEmpty()) return false;
            }
        }
        return true;
    }

    private String getStringCell(Row row, int colIndex) {
        Cell cell = row.getCell(colIndex);
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue().trim();
            case NUMERIC -> {
                if (DateUtil.isCellDateFormatted(cell)) {
                    yield cell.getLocalDateTimeCellValue().toLocalDate().toString();
                }
                double v = cell.getNumericCellValue();
                yield (v == Math.floor(v)) ? String.valueOf((long) v) : String.valueOf(v);
            }
            case BOOLEAN -> cell.getBooleanCellValue() ? "Có" : "Không";
            default -> "";
        };
    }
}
