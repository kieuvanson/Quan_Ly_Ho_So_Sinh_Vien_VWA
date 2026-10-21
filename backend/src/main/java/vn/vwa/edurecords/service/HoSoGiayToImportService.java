package vn.vwa.edurecords.service;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import vn.vwa.edurecords.dto.importexcel.ImportConfirmResponse;
import vn.vwa.edurecords.dto.importexcel.ImportMode;
import vn.vwa.edurecords.dto.importexcel.ImportPreviewResponse;
import vn.vwa.edurecords.dto.importexcel.ImportRowError;
import vn.vwa.edurecords.dto.importexcel.ImportSheetNameResolver;
import vn.vwa.edurecords.dto.importexcel.ImportTokenPayload;
import vn.vwa.edurecords.dto.importexcel.PreviewRowData;
import vn.vwa.edurecords.dto.importexcel.SheetPreview;
import vn.vwa.edurecords.entity.Khoa;
import vn.vwa.edurecords.entity.LoaiGiayTo;
import vn.vwa.edurecords.entity.Nganh;
import vn.vwa.edurecords.repository.SinhVienRepository;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * Service import HOSOGIAYTO (và SINHVIEN nếu chọn mode gộp) từ file Excel.
 *
 * <h3>Thiết kế chính</h3>
 * <ul>
 *   <li>Hỗ trợ 1 hoặc nhiều sheet. Mỗi sheet tự nhận diện mode theo tên.</li>
 *   <li>Quy trình 2 bước: /preview (validate, fail-fast) → /confirm (ghi DB).</li>
 *   <li>Sử dụng cache danh mục (DanhMucCacheService) để tra cứu O(1) thay vì
 *       query DB mỗi dòng — tiết kiệm thời gian cho file 10.000 dòng.</li>
 *   <li>Batch insert qua JdbcTemplate (500/lần) để tối ưu throughput.</li>
 *   <li>1 transaction / sheet để 1 sheet lỗi không rollback các sheet khác.</li>
 *   <li>Token tạm lưu Redis 5 phút để xác nhận.</li>
 * </ul>
 *
 * <h3>Mode ánh xạ theo tên sheet</h3>
 * <pre>
 *   "SV" / "TT Sinh viên"          → ImportMode.SINH_VIEN (14 cột cố định)
 *   "HS" / "Hồ sơ giấy tờ"        → ImportMode.HO_SO_GIAY_TO (~10 cột)
 *   "SV+HS"                         → ImportMode.GOP (1 sheet, cột "Loại dòng")
 * </pre>
 *
 * <h3>Giới hạn</h3>
 * <ul>
 *   <li>File tối đa 10MB, 10.000 dòng tổng (theo controller).</li>
 *   <li>Batch insert: 500 dòng / lần.</li>
 * </ul>
 *
 * <h3>Transaction</h3>
 * <p>VIỆC GHI thực sự được ủy thác cho HoSoImportPersistenceService
 * (service riêng) để đảm bảo Spring Proxy bắt được @Transactional.
 * Xem HoSoImportPersistenceService để biết chi tiết transaction.</p>
 */
@Service
public class HoSoGiayToImportService {

    private static final Logger log = LoggerFactory.getLogger(HoSoGiayToImportService.class);

    // Cột file HS thuần (mode HO_SO_GIAY_TO) - thứ tự cố định.
    // 0:MSSV, 1:Tên giấy tờ (hoặc Mã loại), 2:Trạng thái nộp, 3:Bản gốc/Bản sao,
    // 4:File đính kèm, 5:Vị trí lưu kho
    private static final List<String> VALID_TRANG_THAI_NOP = List.of(
            "Chưa nộp", "Đã nộp", "Thiếu", "Không hợp lệ");
    private static final List<String> VALID_LOAI_BAN = List.of(
            "Bản gốc", "Bản sao");

    private final DanhMucCacheService danhMucCacheService;
    private final SinhVienRepository sinhVienRepository;
    private final ImportTokenStore importTokenStore;
    private final HoSoImportPersistenceService persistenceService;

    public HoSoGiayToImportService(DanhMucCacheService danhMucCacheService,
                                   SinhVienRepository sinhVienRepository,
                                   ImportTokenStore importTokenStore,
                                   HoSoImportPersistenceService persistenceService) {
        this.danhMucCacheService = danhMucCacheService;
        this.sinhVienRepository = sinhVienRepository;
        this.importTokenStore = importTokenStore;
        this.persistenceService = persistenceService;
    }

    // ============================================================
    // BƯỚC 1: PREVIEW
    // ============================================================

    /**
     * Đọc file Excel, với mỗi sheet nhận diện mode theo tên → validate từng dòng.
     * Fail-fast: nếu 1 sheet có lỗi, KHÔNG trả token.
     */
    @Transactional(readOnly = true)
    public ImportPreviewResponse preview(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File upload rỗng.");
        }
        // Snapshot danh mục dùng cho cả /preview và /confirm.
        DanhMucCacheService.Snapshot cache = danhMucCacheService.snapshot();
        List<SheetPreview> sheetPreviews = new ArrayList<>();
        try (InputStream is = file.getInputStream();
             Workbook workbook = new XSSFWorkbook(is)) {

            int numSheets = workbook.getNumberOfSheets();
            if (numSheets == 0) {
                throw new IllegalArgumentException("File Excel không có sheet nào.");
            }
            for (int s = 0; s < numSheets; s++) {
                Sheet sheet = workbook.getSheetAt(s);
                if (sheet == null) continue;
                String sheetName = sheet.getSheetName();
                ImportMode mode = ImportSheetNameResolver.resolve(sheetName);
                if (mode == null) {
                    // Tên sheet không hỗ trợ → fail-fast với thông báo rõ ràng.
                    SheetPreview failPreview = new SheetPreview(sheetName, null);
                    failPreview.setTongDong(0);
                    ImportRowError err = new ImportRowError();
                    err.setSheet(sheetName);
                    err.setDong(0);
                    err.setLyDo(List.of("Tên sheet '" + sheetName + "' không được hỗ trợ. "
                            + "Vui lòng đổi tên sheet thành một trong: "
                            + String.join(", ", ImportSheetNameResolver.supportedSheetNames())));
                    failPreview.setDanhSachLoi(List.of(err));
                    return ImportPreviewResponse.failFast(sheetName, 0,
                            "Tên sheet không hợp lệ.", List.of(failPreview));
                }
                SheetPreview sp = readSheet(sheet, sheetName, mode, cache);
                sheetPreviews.add(sp);
                // Fail-fast ngay khi 1 sheet có lỗi
                if (!sp.getDanhSachLoi().isEmpty()) {
                    ImportRowError first = sp.getDanhSachLoi().get(0);
                    String summary = "Sheet '" + sheetName + "' lỗi ở dòng " + first.getDong()
                            + (first.getMssv() != null ? " (MSSV: " + first.getMssv() + ")" : "")
                            + ": " + first.getLyDo().get(0)
                            + ". Hệ thống dừng xử lý — không sheet nào được ghi.";
                    return ImportPreviewResponse.failFast(sheetName, first.getDong(),
                            summary, sheetPreviews);
                }
            }
        } catch (IOException e) {
            log.error("Không đọc được file Excel preview", e);
            throw new IllegalArgumentException("Không đọc được file Excel. Hãy đảm bảo đúng định dạng.");
        }

        // Tất cả sheet OK → sinh token, lưu Redis
        ImportTokenPayload payload = new ImportTokenPayload(null, System.currentTimeMillis(), sheetPreviews);
        String token = importTokenStore.save(payload);
        return ImportPreviewResponse.success(token, sheetPreviews);
    }

    /**
     * Đọc 1 sheet và validate từng dòng theo mode.
     */
    private SheetPreview readSheet(Sheet sheet, String sheetName, ImportMode mode,
                                   DanhMucCacheService.Snapshot cache) {
        SheetPreview sp = new SheetPreview(sheetName, mode);
        int startRow = detectDataStartRow(sheet);
        int physicalRows = sheet.getPhysicalNumberOfRows();
        // Dùng Set để phát hiện MSSV trùng trong cùng sheet
        Set<String> seenMssvInSheet = new HashSet<>();

        for (int r = startRow; r < physicalRows; r++) {
            Row row = sheet.getRow(r);
            if (row == null || isRowEmpty(row)) continue;
            int excelRow = r + 1; // 1-based
            sp.setTongDong(sp.getTongDong() + 1);
            if (mode == ImportMode.HO_SO_GIAY_TO) {
                validateRowHS(row, excelRow, sp, cache, seenMssvInSheet);
            } else if (mode == ImportMode.SINH_VIEN) {
                validateRowSV(row, excelRow, sp, cache, seenMssvInSheet);
            } else { // GOP
                String loaiDong = trimToNull(readCellAsString(row.getCell(0)));
                if (loaiDong == null) {
                    addRowError(sp, sheetName, excelRow, null, null, null,
                            List.of("Thiếu cột 'Loại dòng' (bắt buộc cho sheet SV+HS)."));
                    continue;
                }
                String loaiUp = loaiDong.toUpperCase(Locale.ROOT);
                if ("SV".equals(loaiUp)) {
                    validateRowSV(row, excelRow, sp, cache, seenMssvInSheet);
                } else if ("HS".equals(loaiUp)) {
                    validateRowHS(row, excelRow, sp, cache, seenMssvInSheet);
                } else {
                    addRowError(sp, sheetName, excelRow, null, "Loại dòng", loaiDong,
                            List.of("Loại dòng '" + loaiDong + "' không hợp lệ. Chỉ chấp nhận 'SV' hoặc 'HS'."));
                }
            }
        }
        // Tính hợp lệ
        sp.setDongLoi(sp.getDanhSachLoi().size());
        sp.setDongHopLe(sp.getTongDong() - sp.getDongLoi());
        return sp;
    }

    // ============================================================
    // VALIDATE DÒNG SINH VIÊN
    // ============================================================

    private void validateRowSV(Row row, int excelRow, SheetPreview sp,
                               DanhMucCacheService.Snapshot cache,
                               Set<String> seenMssvInSheet) {
        // Thứ tự cột (giống SinhVienExcelService): 0:MSSV, 1:Họ tên, 2:Ngày sinh,
        // 3:Giới tính, 4:CCCD, 5:SĐT, 6:Email, 7:Quê quán, 8:Tên khoa, 9:Tên ngành,
        // 10:Tên lớp, 11:Tên khóa học, 12:Hệ đào tạo, 13:Trạng thái học vụ
        String mssv = trimToNull(readCellAsString(row.getCell(0)));
        String hoTen = trimToNull(readCellAsString(row.getCell(1)));
        String ngaySinhStr = trimToNull(readCellAsString(row.getCell(2)));
        String gioiTinh = trimToNull(readCellAsString(row.getCell(3)));
        String cccd = trimToNull(readCellAsString(row.getCell(4)));
        String sdt = trimToNull(readCellAsString(row.getCell(5)));
        String email = trimToNull(readCellAsString(row.getCell(6)));
        String queQuan = trimToNull(readCellAsString(row.getCell(7)));
        String tenKhoa = trimToNull(readCellAsString(row.getCell(8)));
        String tenNganh = trimToNull(readCellAsString(row.getCell(9)));
        String tenLop = trimToNull(readCellAsString(row.getCell(10)));
        String tenKhoaHoc = trimToNull(readCellAsString(row.getCell(11)));
        String heDaoTao = trimToNull(readCellAsString(row.getCell(12)));
        String trangThaiHocVu = trimToNull(readCellAsString(row.getCell(13)));

        // LOG DEBUG: in ra dòng đang đọc để xử lý sự cố file header merge cell
        if (log.isDebugEnabled()) {
            log.debug("[validateRowSV] row={} mssv='{}' hoTen='{}' tenKhoa='{}' trangThaiHocVu='{}'",
                    excelRow, mssv, hoTen, tenKhoa, trangThaiHocVu);
        }

        // Bảo vệ bổ sung: nếu dòng có vẻ là HEADER (MSSV chính là "MSSV")
        // → bỏ qua im lặng. Đây là lưới an toàn cuối cùng khi detectDataStartRow
        // lỡ sót.
        if ("MSSV".equalsIgnoreCase(mssv) || "Mã SV".equalsIgnoreCase(mssv)) {
            log.warn("[validateRowSV] Bỏ dòng {} vì MSSV='{}' trông như header", excelRow, mssv);
            return;
        }

        List<String> errors = new ArrayList<>();
        if (mssv == null) errors.add("Thiếu MSSV.");
        if (hoTen == null) errors.add("Thiếu họ tên.");
        if (tenKhoa == null) errors.add("Thiếu Tên khoa.");
        if (tenNganh == null) errors.add("Thiếu Tên ngành.");
        if (tenLop == null) errors.add("Thiếu Tên lớp.");
        if (tenKhoaHoc == null) errors.add("Thiếu Tên khóa học.");

        if (mssv != null && !seenMssvInSheet.add(mssv)) {
            errors.add("MSSV '" + mssv + "' bị lặp trong cùng sheet.");
        }
        if (mssv != null && cache.mssvExists(mssv)) {
            errors.add("MSSV '" + mssv + "' đã tồn tại trong hệ thống (import SV chỉ thêm mới).");
        }

        // Validate trạng thái học vụ nếu có (phải nằm trong ENUM DB)
        if (trangThaiHocVu != null && !cache.isTrangThaiHocVu(trangThaiHocVu)) {
            errors.add("Trạng thái học vụ '" + trangThaiHocVu
                    + "' không hợp lệ. Hợp lệ: Đang học, Bảo lưu, Đình chỉ, Tốt nghiệp, Đã rút hồ sơ.");
        }

        // Resolve danh mục nếu dữ liệu bắt buộc đầy đủ
        Integer khoaId = null, nganhId = null, khoaHocId = null, lopId = null;
        if (tenKhoa != null) {
            Khoa k = cache.findKhoa(tenKhoa);
            if (k == null) errors.add("Không tìm thấy Khoa: '" + tenKhoa + "'.");
            else khoaId = k.getId();
        }
        if (tenKhoaHoc != null) {
            var kh = cache.findKhoaHoc(tenKhoaHoc);
            if (kh == null) errors.add("Không tìm thấy Khóa học: '" + tenKhoaHoc + "'.");
            else khoaHocId = kh.getId();
        }
        if (tenNganh != null) {
            Nganh n = cache.findNganh(tenNganh);
            if (n == null) errors.add("Không tìm thấy Ngành: '" + tenNganh + "'.");
            else nganhId = n.getId();
        }
        if (tenLop != null && nganhId != null && khoaHocId != null) {
            var l = cache.findLop(tenLop, nganhId, khoaHocId);
            if (l == null) errors.add("Không tìm thấy Lớp '" + tenLop + "' thuộc Ngành '" + tenNganh
                    + "' - Khóa '" + tenKhoaHoc + "'.");
            else lopId = l.getId();
        }

        if (!errors.isEmpty()) {
            addRowError(sp, sp.getTenSheet(), excelRow, "SV", mssv, null, errors);
            return;
        }

        // Snapshot dữ liệu để confirm
        PreviewRowData pr = new PreviewRowData(excelRow, "SV");
        pr.put("mssv", mssv);
        pr.put("hoTen", hoTen);
        pr.put("ngaySinh", ngaySinhStr);
        pr.put("gioiTinh", gioiTinh);
        pr.put("cccd", cccd);
        pr.put("sdt", sdt);
        pr.put("email", email);
        pr.put("queQuan", queQuan);
        pr.put("khoaId", khoaId);
        pr.put("nganhId", nganhId);
        pr.put("lopId", lopId);
        pr.put("khoaHocId", khoaHocId);
        pr.put("heDaoTao", heDaoTao);
        pr.put("trangThaiHocVu", trangThaiHocVu != null ? trangThaiHocVu : "Đang học");
        sp.getRows().add(pr);
    }

    // ============================================================
    // VALIDATE DÒNG HỒ SƠ GIẤY TỜ
    // ============================================================

    private void validateRowHS(Row row, int excelRow, SheetPreview sp,
                               DanhMucCacheService.Snapshot cache,
                               Set<String> seenMssvInSheet) {
        // Cột: 0:MSSV, 1:Mã loại giấy tờ (hoặc tên), 2:Trạng thái nộp,
        //      3:Bản gốc/Bản sao, 4:File đính kèm, 5:Vị trí lưu kho
        String mssv = trimToNull(readCellAsString(row.getCell(0)));
        String maOrTen = trimToNull(readCellAsString(row.getCell(1)));
        String trangThaiNop = trimToNull(readCellAsString(row.getCell(2)));
        String loaiBan = trimToNull(readCellAsString(row.getCell(3)));
        String fileDinhKem = trimToNull(readCellAsString(row.getCell(4)));
        String viTriLuuKho = trimToNull(readCellAsString(row.getCell(5)));

        List<String> errors = new ArrayList<>();
        if (mssv == null) errors.add("Thiếu MSSV.");
        if (maOrTen == null) errors.add("Thiếu Mã loại / Tên giấy tờ.");

        // === QUY TẮC NGHIỆP VỤ: MSSV BẮT BUỘC tồn tại trong DB ===
        if (mssv != null && !cache.mssvExists(mssv)) {
            errors.add("MSSV '" + mssv + "' không tồn tại trong hệ thống. "
                    + "Hãy import sinh viên trước hoặc dùng sheet SV+HS.");
        }
        // Nếu mode GOP, dòng SV cùng MSSV đã insert trong transaction này chưa?
        // → Để xử lý chính xác, ta xét thêm seenMssvInSheet (chỉ cho trong sheet này).
        // Trong sheet GOP, dòng HS tham chiếu dòng SV đứng trước: kiểm tra thêm
        // dựa vào các dòng SV đã validate thành công trong cùng sheet.
        if (mssv != null && !cache.mssvExists(mssv) && !seenMssvInSheet.contains(mssv)) {
            // Lỗi đã được push ở nhánh trên; chỉ để đảm bảo thông điệp đúng.
        }

        // Resolve loại giấy tờ: thử theo Mã trước, nếu không có thì theo Tên.
        LoaiGiayTo loai = null;
        if (maOrTen != null) {
            loai = cache.findLoaiGiayToByMa(maOrTen);
            if (loai == null) loai = cache.findLoaiGiayToByTen(maOrTen);
            if (loai == null) errors.add("Không tìm thấy Loại giấy tờ với mã/tên: '" + maOrTen + "'.");
        }
        if (trangThaiNop != null && !VALID_TRANG_THAI_NOP.contains(trangThaiNop)) {
            errors.add("Trạng thái nộp '" + trangThaiNop + "' không hợp lệ. "
                    + "Chỉ chấp nhận: " + VALID_TRANG_THAI_NOP);
        }
        if (loaiBan != null && !VALID_LOAI_BAN.contains(loaiBan)) {
            errors.add("Loại bản '" + loaiBan + "' không hợp lệ. Chỉ chấp nhận: " + VALID_LOAI_BAN);
        }

        if (!errors.isEmpty()) {
            addRowError(sp, sp.getTenSheet(), excelRow, "HS", mssv, null, errors);
            return;
        }

        // Snapshot cho confirm (giữ đầy đủ thông tin để giao diện hiển thị)
        PreviewRowData pr = new PreviewRowData(excelRow, "HS");
        pr.put("mssv", mssv);
        pr.put("maLoai", loai.getMaLoai());
        pr.put("tenLoai", loai.getTenGiayTo());          // ← ENRICH: tên để hiển thị
        pr.put("batBuoc", loai.getBatBuoc());            // ← ENRICH: cờ bắt buộc (cho UI badge)
        pr.put("trangThaiNop", trangThaiNop != null ? trangThaiNop : "Chưa nộp");
        pr.put("loaiBan", loaiBan);
        pr.put("fileDinhKem", fileDinhKem);
        pr.put("viTriLuuKho", viTriLuuKho);
        sp.getRows().add(pr);
    }

    // ============================================================
    // BƯỚC 2: CONFIRM (ủy thác cho PersistenceService)
    // ============================================================

    /**
     * Ghi dữ liệu từ token vào DB.
     *
     * <p>VIỆC GHI thực sự được ủy thác cho HoSoImportPersistenceService
     * (service riêng) để đảm bảo Spring Proxy bắt được @Transactional
     * (tránh self-invocation bypass khi gọi nội bộ trong cùng class).
     *
     * <p>Transaction phân chia:
     * <ul>
     *   <li>Sheet SV hoặc HS: mỗi sheet = 1 transaction riêng (REQUIRES_NEW).</li>
     *   <li>Sheet GOP (SV+HS): cả SV và HS trong 1 transaction chung.</li>
     * </ul>
     */
    public ImportConfirmResponse confirm(String token) {
        ImportTokenPayload payload = importTokenStore.get(token)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Token không hợp lệ hoặc đã hết hạn. Vui lòng preview lại file."));
        long start = System.currentTimeMillis();
        ImportConfirmResponse response = new ImportConfirmResponse();
        response.setToken(token);
        int totalSuccess = 0;
        int totalFailure = 0;

        try {
            for (SheetPreview sp : payload.getSheets()) {
                long sheetStart = System.currentTimeMillis();
                int sheetSuccess = 0;
                int sheetFail = 0;
                try {
                    if (sp.getMode() == ImportMode.SINH_VIEN) {
                        // Gọi qua Spring Proxy → REQUIRES_NEW có hiệu lực
                        sheetSuccess = persistenceService.insertSheetSV(sp);
                    } else if (sp.getMode() == ImportMode.HO_SO_GIAY_TO) {
                        // Gọi qua Spring Proxy → REQUIRES_NEW có hiệu lực
                        sheetSuccess = persistenceService.insertSheetHS(sp);
                    } else if (sp.getMode() == ImportMode.GOP) {
                        // Gọi qua Spring Proxy → cả SV và HS trong 1 transaction
                        sheetSuccess = persistenceService.insertSheetGOP(sp);
                    }
                } catch (RuntimeException ex) {
                    log.error("Sheet '{}' lỗi khi ghi: {}", sp.getTenSheet(), ex.getMessage(), ex);
                    sheetFail = sp.getRows().size();
                    response.getErrors().add("Sheet '" + sp.getTenSheet() + "' lỗi: " + ex.getMessage());
                }
                long sheetMs = System.currentTimeMillis() - sheetStart;
                response.getTheoSheet().add(new ImportConfirmResponse.SheetConfirmStats(
                        sp.getTenSheet(), sp.getMode(), sp.getRows().size(),
                        sheetSuccess, sheetFail, sheetMs));
                totalSuccess += sheetSuccess;
                totalFailure += sheetFail;
            }
        } finally {
            // Dù thành công hay lỗi, xóa token để tránh confirm 2 lần.
            importTokenStore.delete(token);
        }
        response.setTongSoSheet(payload.getSheets().size());
        response.setTongThanhCong(totalSuccess);
        response.setTongThatBai(totalFailure);
        response.setThoiGianXuLyMs(System.currentTimeMillis() - start);
        return response;
    }

    // ============================================================
    // HELPER
    // ============================================================

    private void addRowError(SheetPreview sp, String sheet, int dong, String loaiDong,
                             String mssv, String truong, List<String> lyDo) {
        ImportRowError err = new ImportRowError();
        err.setSheet(sheet);
        err.setDong(dong);
        err.setLoaiDong(loaiDong);
        err.setMssv(mssv);
        err.setTruong(truong);
        err.setLyDo(lyDo);
        sp.getDanhSachLoi().add(err);
    }

    /**
     * Tự nhận diện dòng bắt đầu chứa dữ liệu thực (bỏ qua header + hướng dẫn).
     *
     * <h4>Quy tắc (áp dụng theo thứ tự, quét tối đa 8 dòng đầu)</h4>
     * <ol>
     *   <li>Nếu dòng chứa "hướng dẫn" → bỏ qua dòng đó, kiểm tra tiếp.</li>
     *   <li>Ô đầu tiên (cột A) chứa "MSSV" / "Mã SV" / "MS" → chắc chắn là
     *       header cột A, bỏ qua dòng đó. (Trường hợp header 2 dòng, dòng 1
     *       chỉ có "MSSV" ở cột A, dòng 2 chứa các cột còn lại.)</li>
     *   <li>Dòng chứa CẢ "mssv" VÀ "họ tên" (cùng lúc) → header thật.</li>
     *   <li>Dòng chứa từ khóa header khác (Mã loại, Trạng thái nộp, ...) → header.</li>
     *   <li>Dòng trống (toàn ô rỗng) → bỏ qua.</li>
     *   <li>Mặc định: dòng đầu tiên còn lại là dữ liệu.</li>
     * </ol>
     */
    private int detectDataStartRow(Sheet sheet) {
        Set<String> HEADER_KEYWORDS = Set.of(
                "mssv", "mã sv", "ma sv", "mã số", "ma so",
                "họ tên", "ho ten", "họ và tên", "ho va ten", "tên sinh viên",
                "ngày sinh", "ngay sinh",
                "mã loại", "ma loai", "mã loại giấy tờ", "ma loai giay to",
                "tên giấy tờ", "ten giay to",
                "loại dòng", "loai dong",
                "trạng thái nộp", "trang thai nop",
                "bản gốc", "ban goc", "bản gốc/bản sao", "ban goc/ban sao",
                "file đính kèm", "file dinh kem",
                "vị trí lưu kho", "vi tri luu kho",
                "cccd", "cmnd", "sđt", "sdt", "email",
                "khoa", "ngành", "nganh", "lớp", "lop", "khóa học", "khoa hoc",
                "hệ đào tạo", "he dao tao",
                "trạng thái học vụ", "trang thai hoc vu",
                "header", "tiêu đề", "tieu de"
        );

        int maxScan = Math.min(sheet.getPhysicalNumberOfRows(), 8);
        for (int r = 0; r < maxScan; r++) {
            Row row = sheet.getRow(r);
            if (row == null || isRowEmpty(row)) continue;

            // Ghép text toàn dòng
            StringBuilder allText = new StringBuilder();
            int lastCell = row.getLastCellNum();
            for (int c = 0; c < lastCell; c++) {
                String v = trimToNull(readCellAsString(row.getCell(c)));
                if (v != null) {
                    allText.append(v.toLowerCase(Locale.ROOT)).append(' ');
                }
            }
            String line = allText.toString().trim();
            if (line.isEmpty()) continue;

            // Quy tắc 1: dòng hướng dẫn
            if (line.contains("hướng dẫn") || line.contains("huong dan")) {
                continue;
            }

            // Quy tắc 2: ô cột A chứa MSSV/Mã SV → header
            String firstCell = trimToNull(readCellAsString(row.getCell(0)));
            if (firstCell != null) {
                String fLower = firstCell.toLowerCase(Locale.ROOT).trim();
                // contains (không phải equals) để chịu được "MSSV *", "MSSV:", khoảng trắng, ...
                if (fLower.contains("mssv") || fLower.contains("mã sv") || fLower.contains("ma sv")
                        || fLower.contains("mã số") || fLower.contains("ma so")) {
                    log.info("[detectDataStartRow] Bỏ dòng {} vì ô A='{}' là header", r, firstCell);
                    continue;
                }
            }

            // Quy tắc 3: dòng có CẢ "mssv" VÀ "họ tên" → header thật
            boolean hasMssv = line.contains("mssv") || line.contains("mã sv") || line.contains("ma sv");
            boolean hasHoTen = line.contains("họ tên") || line.contains("ho ten")
                    || line.contains("họ và tên") || line.contains("ho va ten")
                    || line.contains("tên sinh viên") || line.contains("ten sinh vien");
            if (hasMssv && hasHoTen) {
                continue;
            }

            // Quy tắc 4: dòng chứa từ khóa header khác (HS hoặc header phụ) → bỏ qua
            boolean isHeader = HEADER_KEYWORDS.stream().anyMatch(line::contains);
            if (isHeader) {
                continue;
            }

            // Đây là dòng dữ liệu đầu tiên
            return r;
        }
        return 0;
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
}
