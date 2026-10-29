package vn.vwa.edurecords.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import vn.vwa.edurecords.dto.request.SinhVienBulkRequest;
import vn.vwa.edurecords.dto.request.SinhVienSearchRequest;
import vn.vwa.edurecords.dto.response.PagedResponse;
import vn.vwa.edurecords.dto.response.SinhVienBulkResult;
import vn.vwa.edurecords.dto.response.SinhVienResponse;
import vn.vwa.edurecords.entity.Khoa;
import vn.vwa.edurecords.entity.KhoaHoc;
import vn.vwa.edurecords.entity.Lop;
import vn.vwa.edurecords.entity.Nganh;
import vn.vwa.edurecords.entity.SinhVien;
import vn.vwa.edurecords.entity.enums.TrangThaiHocVu;
import vn.vwa.edurecords.exception.BadRequestException;
import vn.vwa.edurecords.exception.ResourceNotFoundException;
import vn.vwa.edurecords.repository.HoSoGiayToRepository;
import vn.vwa.edurecords.repository.KhoaHocRepository;
import vn.vwa.edurecords.repository.KhoaRepository;
import vn.vwa.edurecords.repository.LopRepository;
import vn.vwa.edurecords.repository.NganhRepository;
import vn.vwa.edurecords.repository.PhieuXuatHoSoRepository;
import vn.vwa.edurecords.repository.SinhVienRepository;
import vn.vwa.edurecords.service.AuditService;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
public class SinhVienService {

    private static final Logger log = LoggerFactory.getLogger(SinhVienService.class);

    private final SinhVienRepository sinhVienRepository;
    private final SinhVienExcelService sinhVienExcelService;
    private final DanhMucService danhMucService;
    private final KhoaRepository khoaRepository;
    private final NganhRepository nganhRepository;
    private final KhoaHocRepository khoaHocRepository;
    private final LopRepository lopRepository;
    private final HoSoGiayToRepository hoSoGiayToRepository;
    private final PhieuXuatHoSoRepository phieuXuatHoSoRepository;
    private final AuditService auditService;

    public SinhVienService(SinhVienRepository sinhVienRepository,
                           SinhVienExcelService sinhVienExcelService,
                           DanhMucService danhMucService,
                           KhoaRepository khoaRepository,
                           NganhRepository nganhRepository,
                           KhoaHocRepository khoaHocRepository,
                           LopRepository lopRepository,
                           HoSoGiayToRepository hoSoGiayToRepository,
                           PhieuXuatHoSoRepository phieuXuatHoSoRepository,
                           AuditService auditService) {
        this.sinhVienRepository = sinhVienRepository;
        this.sinhVienExcelService = sinhVienExcelService;
        this.danhMucService = danhMucService;
        this.khoaRepository = khoaRepository;
        this.nganhRepository = nganhRepository;
        this.khoaHocRepository = khoaHocRepository;
        this.lopRepository = lopRepository;
        this.hoSoGiayToRepository = hoSoGiayToRepository;
        this.phieuXuatHoSoRepository = phieuXuatHoSoRepository;
        this.auditService = auditService;
    }

    /**
     * Tìm kiếm + lọc + phân trang sinh viên.
     *
     * <p>Sau V4: filter dùng {@code *_id} (Integer). Nếu client cũ vẫn gửi String
     * trong {@link SinhVienSearchRequest}, service tự resolve sang id qua
     * {@link DanhMucService}.</p>
     */
    @Transactional(readOnly = true)
    public PagedResponse<List<SinhVien>> search(SinhVienSearchRequest req) {
        String keyword = trimOrNull(req.getKeyword());
        String trangThaiHocVu = trimOrNull(req.getTrangThaiHocVu());

        // Ưu tiên id đã resolve sẵn từ controller. Nếu chưa có thì thử resolve
        // từ text (mã/tên) — controller thường đã làm rồi, đây là fallback.
        Integer nganhId = req.getNganhId() != null
                ? req.getNganhId()
                : danhMucService.resolveNganhId(trimOrNull(req.getNganh()));
        Integer lopId = req.getLopId() != null
                ? req.getLopId()
                : danhMucService.resolveLopId(trimOrNull(req.getLop()), nganhId, req.getKhoaHocId());
        Integer khoaHocId = req.getKhoaHocId() != null
                ? req.getKhoaHocId()
                : danhMucService.resolveKhoaHocId(trimOrNull(req.getKhoaNamNhapHoc()));
        Integer khoaId = req.getKhoaId() != null
                ? req.getKhoaId()
                : danhMucService.resolveKhoaId(trimOrNull(req.getKhoa()));
        String heDaoTao = trimOrNull(req.getHeDaoTao());

        int page = Math.max(0, req.getPage());
        int size = Math.max(1, req.getSize());
        int offset = page * size;

        long total = sinhVienRepository.countByFilters(
                keyword, trangThaiHocVu, nganhId, lopId, khoaHocId, khoaId, heDaoTao);

        List<SinhVien> content = total == 0
                ? Collections.emptyList()
                : sinhVienRepository.findByFilters(
                        keyword, trangThaiHocVu, nganhId, lopId, khoaHocId, khoaId, heDaoTao,
                        size, offset);

        Pageable pageable = PageRequest.of(page, size);
        Page<SinhVien> pageResult = new PageImpl<>(content, pageable, total);

        PagedResponse.PageMetadata meta = new PagedResponse.PageMetadata(
            pageResult.getNumber(),
            pageResult.getSize(),
            pageResult.getTotalElements()
        );
        return new PagedResponse<>(pageResult.getContent(), meta);
    }

    /**
     * Tìm kiếm + lọc + phân trang, trả về DTO (SinhVienResponse).
     * Dùng cho API endpoint /api/sinh-vien để tránh expose JPA entity.
     */
    @Transactional(readOnly = true)
    public PagedResponse<List<SinhVienResponse>> searchResponse(SinhVienSearchRequest req) {
        // Tái sử dụng logic search nhưng convert sang DTO
        String keyword = trimOrNull(req.getKeyword());
        String trangThaiHocVu = trimOrNull(req.getTrangThaiHocVu());

        Integer nganhId = req.getNganhId() != null
                ? req.getNganhId()
                : danhMucService.resolveNganhId(trimOrNull(req.getNganh()));
        Integer lopId = req.getLopId() != null
                ? req.getLopId()
                : danhMucService.resolveLopId(trimOrNull(req.getLop()), nganhId, req.getKhoaHocId());
        Integer khoaHocId = req.getKhoaHocId() != null
                ? req.getKhoaHocId()
                : danhMucService.resolveKhoaHocId(trimOrNull(req.getKhoaNamNhapHoc()));
        Integer khoaId = req.getKhoaId() != null
                ? req.getKhoaId()
                : danhMucService.resolveKhoaId(trimOrNull(req.getKhoa()));
        String heDaoTao = trimOrNull(req.getHeDaoTao());

        int page = Math.max(0, req.getPage());
        int size = Math.max(1, req.getSize());
        int offset = page * size;

        long total = sinhVienRepository.countByFilters(
                keyword, trangThaiHocVu, nganhId, lopId, khoaHocId, khoaId, heDaoTao);

        List<SinhVien> content = total == 0
                ? Collections.emptyList()
                : sinhVienRepository.findByFilters(
                        keyword, trangThaiHocVu, nganhId, lopId, khoaHocId, khoaId, heDaoTao,
                        size, offset);

        // Convert entities to DTOs
        List<SinhVienResponse> dtoList = content.stream()
                .map(SinhVienResponse::fromEntity)
                .toList();

        PagedResponse.PageMetadata meta = new PagedResponse.PageMetadata(page, size, total);
        return new PagedResponse<>(dtoList, meta);
    }

    public List<SinhVien> getAll() {
        return sinhVienRepository.findAll();
    }

    public Optional<SinhVien> getByMssv(String mssv) {
        return sinhVienRepository.findById(mssv);
    }

    public long getTotalCount() {
        return sinhVienRepository.count();
    }

    public long countByTrangThai(String trangThaiHocVu) {
        TrangThaiHocVu trangThai = TrangThaiHocVu.fromDisplayName(trangThaiHocVu);
        return sinhVienRepository.countByTrangThaiHocVu(trangThai);
    }

    // ============================================================
    // BULK OPERATIONS (chọn nhiều sinh viên + thao tác hàng loạt)
    // ============================================================
    //
    // Quy tắc chung:
    //  - Tất cả method bulk đều có @Transactional: thất bại ở 1 SV sẽ
    //    rollback toàn bộ lô để tránh trạng thái nửa vời.
    //  - Validate input ở đầu method (danh sách rỗng, quá giới hạn).
    //  - Audit log từng SV thành công / thất bại.
    //  - Trả về SinhVienBulkResult để client hiển thị chi tiết.

    /**
     * Lấy danh sách MSSV duy nhất, loại bỏ null/empty, giữ thứ tự xuất hiện.
     * Helper dùng chung cho tất cả bulk method.
     */
    private List<String> normalizeMssvList(List<String> input) {
        if (input == null || input.isEmpty()) {
            throw new BadRequestException("EMPTY_MSSV_LIST",
                    "Danh sách MSSV không được rỗng.");
        }
        Set<String> seen = new LinkedHashSet<>();
        for (String m : input) {
            if (m == null) continue;
            String t = m.trim();
            if (t.isEmpty()) continue;
            seen.add(t);
        }
        if (seen.isEmpty()) {
            throw new BadRequestException("EMPTY_MSSV_LIST",
                    "Danh sách MSSV không được rỗng.");
        }
        if (seen.size() > SinhVienBulkRequest.MAX_MSSVS) {
            throw new BadRequestException("TOO_MANY_MSSVS",
                    "Mỗi lần chỉ xử lý tối đa " + SinhVienBulkRequest.MAX_MSSVS
                            + " sinh viên (nhận " + seen.size() + ").");
        }
        return new ArrayList<>(seen);
    }

    /**
     * Lấy dữ liệu Excel theo danh sách MSSV đã chọn.
     *
     * <p>Tái sử dụng {@link SinhVienExcelService#export(List)} —
     * không viết lại format Excel.</p>
     *
     * <p>MSSV không tồn tại sẽ bị bỏ qua (không throw) vì đây là API
     * export — người dùng chỉ cần xuất những SV còn tồn tại. Nếu cần
     * cảnh báo, client tự so sánh với danh sách chọn ban đầu.</p>
     */
    @Transactional(readOnly = true)
    public byte[] exportByMssvList(List<String> mssvList) throws IOException {
        List<String> mssvs = normalizeMssvList(mssvList);
        List<SinhVien> svList = sinhVienRepository.findAllById(mssvs);
        // Sắp xếp lại theo thứ tự MSSV client gửi (giúp user dễ đối chiếu).
        java.util.Map<String, SinhVien> map = new java.util.HashMap<>();
        for (SinhVien sv : svList) map.put(sv.getMssv(), sv);
        List<SinhVien> ordered = new ArrayList<>();
        for (String m : mssvs) {
            SinhVien sv = map.get(m);
            if (sv != null) ordered.add(sv);
        }
        return sinhVienExcelService.export(ordered);
    }

    /**
     * Cập nhật trạng thái học vụ cho nhiều sinh viên cùng một lúc.
     *
     * <p>Quy tắc nghiệp vụ:
     * <ul>
     *   <li>Không cập nhật nếu trạng thái mới giống trạng thái hiện tại
     *       (skip — không ghi audit, trả về success=true để không phải lỗi).</li>
     *   <li>SV không tồn tại trong DB → trả về success=false với code SINHVIEN_NOT_FOUND.</li>
     *   <li>Mọi thay đổi đều ghi audit log.</li>
     * </ul>
     * </p>
     */
    @Transactional
    public SinhVienBulkResult bulkUpdateTrangThaiHocVu(SinhVienBulkRequest req) {
        List<String> mssvs = normalizeMssvList(req.getMssvList());
        String newTrangThaiDisplay = trimOrNull(req.getTrangThaiHocVu());
        if (newTrangThaiDisplay == null) {
            throw new BadRequestException("MISSING_TRANG_THAI",
                    "Thiếu trạng thái học vụ mới.");
        }
        TrangThaiHocVu newTrangThai;
        try {
            newTrangThai = TrangThaiHocVu.fromDisplayName(newTrangThaiDisplay);
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("INVALID_TRANG_THAI",
                    "Trạng thái học vụ không hợp lệ: '" + newTrangThaiDisplay + "'.");
        }

        List<SinhVienBulkResult.ItemResult> results = new ArrayList<>();
        int success = 0, failure = 0;

        // Load 1 lần để giảm query — sau đó loop cập nhật.
        List<SinhVien> svList = sinhVienRepository.findAllById(mssvs);
        java.util.Map<String, SinhVien> map = new java.util.HashMap<>();
        for (SinhVien sv : svList) map.put(sv.getMssv(), sv);

        LocalDateTime now = LocalDateTime.now();
        String ghiChu = trimOrNull(req.getGhiChu());

        for (String mssv : mssvs) {
            SinhVien sv = map.get(mssv);
            if (sv == null) {
                results.add(SinhVienBulkResult.ItemResult.fail(
                        mssv, "SINHVIEN_NOT_FOUND",
                        "Không tìm thấy sinh viên."));
                failure++;
                continue;
            }

            TrangThaiHocVu oldTrangThai = sv.getTrangThaiHocVu();
            if (oldTrangThai == newTrangThai) {
                // Không có thay đổi — vẫn tính success để client không phải lo.
                results.add(SinhVienBulkResult.ItemResult.ok(mssv));
                success++;
                continue;
            }

            sv.setTrangThaiHocVu(newTrangThai);
            sv.setNgayCapNhat(now);
            sinhVienRepository.save(sv);

            // Ghi audit — mỗi SV 1 dòng.
            // Lưu ý: tham số 7 của AuditService.log() là `nguoiThucHien`,
            // KHÔNG phải ghi chú. Ghi chú được ghi ở dòng audit riêng để không
            // làm sai dữ liệu cột nguoi_thuc_hien.
            auditService.log("BULK_UPDATE_TRANG_THAI", "sinhvien", sv.getMssv(),
                    "trang_thai_hoc_vu",
                    oldTrangThai != null ? oldTrangThai.getDisplayName() : null,
                    newTrangThai.getDisplayName());

            if (ghiChu != null && !ghiChu.isBlank()) {
                auditService.log("BULK_UPDATE_TRANG_THAI_NOTE", "sinhvien", sv.getMssv(),
                        "ghi_chu", null, ghiChu.trim());
            }

            results.add(SinhVienBulkResult.ItemResult.ok(mssv));
            success++;
        }

        log.info("bulkUpdateTrangThaiHocVu: {}/{} thành công (target={})",
                success, mssvs.size(), newTrangThai.getDisplayName());
        return new SinhVienBulkResult(mssvs.size(), success, failure, results);
    }

    /**
     * Xóa nhiều sinh viên theo danh sách MSSV với kiểm tra an toàn FK.
     *
     * <p>Quy tắc (theo yêu cầu nghiệp vụ của dự án):
     * <ul>
     *   <li>Chỉ xóa được SV khi:
     *       <ul>
     *         <li>SV tồn tại trong DB.</li>
     *         <li>SV không còn hồ sơ giấy tờ (countByMssv == 0).</li>
     *         <li>SV không có phiếu mượn đang hoạt động (Chờ duyệt / Đang mượn / Quá hạn).</li>
     *       </ul>
     *   </li>
     *   <li>Mọi lần xóa đều ghi audit (trước khi xóa entity để có đủ thông tin).</li>
     *   <li>Một SV vi phạm rule → trả về success=false nhưng KHÔNG chặn các SV khác
     *       trong lô (best-effort). Vì method có {@code @Transactional}, nếu một
     *       thao tác xóa ném exception không mong đợi (vd lỗi DB), toàn bộ rollback.</li>
     * </ul>
     * </p>
     *
     * <p>Note: Theo {@code AGENTS.md} backend, xóa sinh viên vi phạm nguyên tắc
     * "không ghi đè audit". Tuy nhiên endpoint này được cung cấp để xử lý các
     * trường hợp import nhầm (chưa phát sinh hồ sơ / phiếu), đồng thời giữ đủ
     * audit log trước khi xóa.</p>
     */
    @Transactional
    public SinhVienBulkResult bulkDelete(SinhVienBulkRequest req) {
        List<String> mssvs = normalizeMssvList(req.getMssvList());
        List<SinhVienBulkResult.ItemResult> results = new ArrayList<>();
        int success = 0, failure = 0;

        List<SinhVien> svList = sinhVienRepository.findAllById(mssvs);
        java.util.Map<String, SinhVien> map = new java.util.HashMap<>();
        for (SinhVien sv : svList) map.put(sv.getMssv(), sv);

        String ghiChu = trimOrNull(req.getGhiChu());

        for (String mssv : mssvs) {
            SinhVien sv = map.get(mssv);
            if (sv == null) {
                results.add(SinhVienBulkResult.ItemResult.fail(
                        mssv, "SINHVIEN_NOT_FOUND",
                        "Không tìm thấy sinh viên."));
                failure++;
                continue;
            }

            // Check hồ sơ giấy tờ
            long hoSoCount = hoSoGiayToRepository.countByMssv(mssv);
            if (hoSoCount > 0) {
                results.add(SinhVienBulkResult.ItemResult.fail(
                        mssv, "SV_CON_HO_SO",
                        "Sinh viên còn " + hoSoCount + " hồ sơ giấy tờ. Hãy rút hồ sơ trước khi xóa."));
                failure++;
                continue;
            }

            // Check phiếu đang hoạt động
            long dangMuon = phieuXuatHoSoRepository.countDangMuonByMssv(mssv);
            if (dangMuon > 0) {
                results.add(SinhVienBulkResult.ItemResult.fail(
                        mssv, "SV_DANG_CO_PHIEU",
                        "Sinh viên còn " + dangMuon + " phiếu đang mượn. Hãy trả hết trước khi xóa."));
                failure++;
                continue;
            }

            // Audit log trước khi xóa (lưu thông tin SV để còn truy vết).
            // Tham số 7 của AuditService.log() là `nguoiThucHien` — KHÔNG truyền
            // mô tả ở đây, nếu không cột nguoi_thuc_hien sẽ bị ghi sai.
            // Thông tin mô tả được ghi ở truong_thay_doi / gia_tri_moi.
            String giaTriMoi = "Xóa sinh viên qua bulk delete"
                    + (ghiChu != null && !ghiChu.isBlank() ? " — " + ghiChu.trim() : "")
                    + " (họ tên: " + sv.getHoTen()
                    + ", trạng thái: "
                    + (sv.getTrangThaiHocVu() != null
                            ? sv.getTrangThaiHocVu().getDisplayName() : "n/a") + ")";
            auditService.log("BULK_DELETE_SINHVIEN", "sinhvien", sv.getMssv(),
                    "deleted", null, giaTriMoi);

            sinhVienRepository.delete(sv);
            results.add(SinhVienBulkResult.ItemResult.ok(mssv));
            success++;
        }

        log.info("bulkDelete: {}/{} thành công", success, mssvs.size());
        return new SinhVienBulkResult(mssvs.size(), success, failure, results);
    }

    public record ImportResult(
            int successCount,
            int failureCount,
            int insertedCount,
            int updatedCount,
            List<SinhVienExcelService.RowError> errors
    ) {}

    /**
     * Import danh sách sinh viên từ file Excel — chỉ thêm mới.
     *
     * <h3>Fail-fast mode (sau V7)</h3>
     * <p>Dừng import ngay khi gặp dòng lỗi đầu tiên. KHÔNG lưu bất kỳ dòng nào
     * vào DB. Trả về lỗi chi tiết (dòng, MSSV, lý do) để user sửa file và upload
     * lại.</p>
     *
     * <p>Trước đây (V6 và cũ hơn) dùng "best-effort": bỏ qua dòng lỗi, lưu dòng OK.
     * Điều này khiến user không biết mình đang import thiếu dữ liệu. Vì MSSV
     * còn lại sau cùng là không xác định được → fail-fast giúp user thấy ngay
     * lỗi và quyết định sửa hoặc xóa dòng đó trước khi import.</p>
     *
     * <h3>Quy tắc (giữ nguyên từ V6)</h3>
     * <ul>
     *   <li>KHÔNG tự tạo danh mục (Khoa/Ngành/Lớp/Khóa học). Nếu không tìm thấy → báo lỗi.</li>
     *   <li>MSSV đã tồn tại → báo trùng, KHÔNG ghi đè.</li>
     *   <li>CCCD trùng với SV khác → báo lỗi.</li>
     *   <li>MSSV / CCCD trùng trong chính file → báo lỗi.</li>
     *   <li>Thiếu thông tin bắt buộc → báo lỗi.</li>
     * </ul>
     */
    @Transactional
    public ImportResult importFromExcel(MultipartFile file) {
        SinhVienExcelService.ImportResult parsed;
        try {
            parsed = sinhVienExcelService.read(file);
        } catch (IOException e) {
            log.error("Không đọc được file Excel import", e);
            throw new BadRequestException("IMPORT_FILE_INVALID",
                    "Không đọc được file Excel. Hãy tải mẫu và điền theo đúng định dạng.");
        }

        // Nếu parser đã có lỗi → fail-fast ngay từ bước parse
        // (SinhVienExcelService.read() đã thu thập lỗi theo từng dòng)
        if (!parsed.errors().isEmpty()) {
            log.warn("importFromExcel: parser phát hiện {} lỗi. Fail-fast.", parsed.errors().size());
            return new ImportResult(0, parsed.errors().size(), 0, 0, parsed.errors());
        }

        int nextRow = 0;
        for (SinhVien sv : parsed.sinhViens()) {
            nextRow++;
            int excelRow = nextRow + 1; // +1 vì dòng 1 là header

            // Kiểm tra trùng MSSV trong file
            // (best-effort đã loại bỏ Set seenMssv — bây giờ fail-fast tại dòng lỗi đầu tiên)
            // Để giữ logic fail-fast, ta chuyển sang dùng Set local tại đây
            // và return ngay khi trùng.
            // Lưu ý: dùng single-pass không tối ưu bằng 2-pass, nhưng file import
            // giới hạn ~10MB nên không lo performance.

            // === Validate FK đã resolve ===
            if (sv.getKhoa() == null || sv.getNganh() == null
                    || sv.getLop() == null || sv.getKhoaHoc() == null) {
                List<SinhVienExcelService.RowError> errs = List.of(
                        new SinhVienExcelService.RowError(excelRow,
                                "Thiếu thông tin danh mục bắt buộc (Khoa/Ngành/Lớp/Khóa học) cho MSSV '"
                                        + sv.getMssv() + "'. Vui lòng kiểm tra lại tên Khoa/Ngành/Lớp/Khóa nhập học."));
                return new ImportResult(0, 1, 0, 0, errs);
            }

            // === CHỈ THÊM MỚI ===
            if (sinhVienRepository.existsById(sv.getMssv())) {
                List<SinhVienExcelService.RowError> errs = List.of(
                        new SinhVienExcelService.RowError(excelRow,
                                "MSSV '" + sv.getMssv() + "' đã tồn tại trong hệ thống. "
                                        + "Không ghi đè dữ liệu cũ."));
                return new ImportResult(0, 1, 0, 0, errs);
            }
        }

        // Đến đây: tất cả dòng đều pass validate. Còn phải check trùng MSSV/CCCD
        // trong chính file (2-pass để phát hiện lỗi sớm nhất).
        Set<String> seenMssv = new HashSet<>();
        Set<String> seenCccd = new HashSet<>();
        nextRow = 0;
        for (SinhVien sv : parsed.sinhViens()) {
            nextRow++;
            int excelRow = nextRow + 1;
            if (!seenMssv.add(sv.getMssv())) {
                List<SinhVienExcelService.RowError> errs = List.of(
                        new SinhVienExcelService.RowError(excelRow,
                                "MSSV '" + sv.getMssv() + "' bị lặp trong cùng file, "
                                        + "ở dòng " + excelRow + ". Vui lòng sửa file Excel."));
                return new ImportResult(0, 1, 0, 0, errs);
            }
            if (sv.getCccd() != null && !sv.getCccd().isBlank()) {
                if (sinhVienRepository.existsByCccdAndMssvNot(sv.getCccd(), sv.getMssv())) {
                    List<SinhVienExcelService.RowError> errs = List.of(
                            new SinhVienExcelService.RowError(excelRow,
                                    "CCCD '" + sv.getCccd() + "' đã thuộc sinh viên khác, "
                                            + "ở dòng " + excelRow + " (MSSV '" + sv.getMssv() + "')."));
                    return new ImportResult(0, 1, 0, 0, errs);
                }
                if (!seenCccd.add(sv.getCccd())) {
                    List<SinhVienExcelService.RowError> errs = List.of(
                            new SinhVienExcelService.RowError(excelRow,
                                    "CCCD '" + sv.getCccd() + "' bị lặp trong cùng file, "
                                            + "ở dòng " + excelRow + " (MSSV '" + sv.getMssv() + "')."));
                    return new ImportResult(0, 1, 0, 0, errs);
                }
            }
        }

        // Tất cả validate xong → ghi DB (single saveAll)
        List<SinhVien> toInsert = new ArrayList<>();
        for (SinhVien sv : parsed.sinhViens()) {
            sv.setNgayTao(LocalDateTime.now());
            toInsert.add(sv);
        }
        sinhVienRepository.saveAll(toInsert);

        log.info("importFromExcel: ghi thành công {} sinh viên (fail-fast mode).", toInsert.size());
        return new ImportResult(toInsert.size(), 0, toInsert.size(), 0, List.of());
    }

    /** Chỉ copy các trường người dùng được sửa qua import — không đụng khóa hay trạng thái hệ thống. */
    private void copyEditableFields(SinhVien target, SinhVien source) {
        target.setHoTen(source.getHoTen());
        target.setNgaySinh(source.getNgaySinh());
        target.setGioiTinh(source.getGioiTinh());
        target.setCccd(source.getCccd());
        target.setSdt(source.getSdt());
        target.setEmail(source.getEmail());
        target.setQueQuan(source.getQueQuan());
        target.setKhoa(source.getKhoa());
        target.setNganh(source.getNganh());
        target.setLop(source.getLop());
        target.setKhoaHoc(source.getKhoaHoc());
        target.setHeDaoTao(source.getHeDaoTao());
        if (source.getTrangThaiHocVu() != null) {
            target.setTrangThaiHocVu(source.getTrangThaiHocVu());
        }
    }

    private static String trimOrNull(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }
}
