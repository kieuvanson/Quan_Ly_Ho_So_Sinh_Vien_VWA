package vn.vwa.edurecords.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.vwa.edurecords.dto.request.PhieuMuonBulkRequest;
import vn.vwa.edurecords.dto.request.PhieuMuonRequest;
import vn.vwa.edurecords.dto.request.PhieuMuonSearchRequest;
import vn.vwa.edurecords.dto.request.PhieuTraRequest;
import vn.vwa.edurecords.dto.response.PhieuMuonResponse;
import vn.vwa.edurecords.dto.response.SinhVienBulkResult;
import vn.vwa.edurecords.entity.ChiTietPhieu;
import vn.vwa.edurecords.entity.HoSoGiayTo;
import vn.vwa.edurecords.entity.KhoaHoc;
import vn.vwa.edurecords.entity.PhieuXuatHoSo;
import vn.vwa.edurecords.entity.SinhVien;
import vn.vwa.edurecords.entity.User;
import vn.vwa.edurecords.entity.enums.TrangThaiHocVu;
import vn.vwa.edurecords.exception.BadRequestException;
import vn.vwa.edurecords.exception.ResourceNotFoundException;
import vn.vwa.edurecords.repository.ChiTietPhieuRepository;
import vn.vwa.edurecords.repository.HoSoGiayToRepository;
import vn.vwa.edurecords.repository.PhieuXuatHoSoRepository;
import vn.vwa.edurecords.repository.SinhVienRepository;
import vn.vwa.edurecords.repository.UserRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Service
public class PhieuXuatHoSoService {

    private static final Logger log = LoggerFactory.getLogger(PhieuXuatHoSoService.class);

    private final PhieuXuatHoSoRepository phieuXuatHoSoRepository;
    private final SinhVienRepository sinhVienRepository;
    private final ChiTietPhieuRepository chiTietPhieuRepository;
    private final HoSoGiayToRepository hoSoGiayToRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;
    private final LichSuNopService lichSuNopService;

    /** Trạng thái mặc định cho endpoint /dang-muon khi client không gửi trangThai. */
    public static final String DEFAULT_TRANG_THAI = "Đang mượn";

    /** Các trạng thái hợp lệ của phiếu (xem entity PhieuXuatHoSo comment). */
    public static final String TRANG_THAI_MOI = "Chờ duyệt";
    public static final String TRANG_THAI_DA_DUYET = "Đã duyệt";
    public static final String TRANG_THAI_TU_CHOI = "Từ chối";
    public static final String TRANG_THAI_DANG_MUON = "Đang mượn";
    public static final String TRANG_THAI_DA_TRA = "Đã trả";
    public static final String TRANG_THAI_QUA_HAN = "Quá hạn";
    public static final String TRANG_THAI_HOAN_TAT = "Hoàn tất";

    /** Loại phiếu hợp lệ. */
    public static final String LOAI_MUON_TAM_THOI = "Mượn tạm thời";
    public static final String LOAI_RUT_VINH_VIEN = "Rút vĩnh viễn";

    public PhieuXuatHoSoService(PhieuXuatHoSoRepository phieuXuatHoSoRepository,
                                 SinhVienRepository sinhVienRepository,
                                 ChiTietPhieuRepository chiTietPhieuRepository,
                                 HoSoGiayToRepository hoSoGiayToRepository,
                                 UserRepository userRepository,
                                 AuditService auditService,
                                 LichSuNopService lichSuNopService) {
        this.phieuXuatHoSoRepository = phieuXuatHoSoRepository;
        this.sinhVienRepository = sinhVienRepository;
        this.chiTietPhieuRepository = chiTietPhieuRepository;
        this.hoSoGiayToRepository = hoSoGiayToRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
        this.lichSuNopService = lichSuNopService;
    }

    // ============================================================
    // Queries
    // ============================================================

    @Transactional(readOnly = true)
    public Page<PhieuMuonResponse> getDanhSachDangMuon(PhieuMuonSearchRequest req) {
        // Nếu client KHÔNG gửi trangThai (null/empty) → trả về tất cả phiếu
        // đang hoạt động (Chờ duyệt + Đang mượn + Quá hạn). Ngược lại → filter
        // theo trangThai client gửi.
        String trangThai = trimToNull(req.getTrangThai());
        // Mặc định lọc theo 'Mượn tạm thời' — method này chỉ phục vụ trang Mượn/Trả.
        // Nếu client gửi loaiHoSo cụ thể → dùng giá trị client gửi.
        String loaiHoSo = trimToNull(req.getLoaiHoSo());
        if (loaiHoSo == null) {
            loaiHoSo = LOAI_MUON_TAM_THOI;
        }
        String keyword = trimToNull(req.getKeyword());

        int page = Math.max(0, req.getPage());
        int size = Math.max(1, req.getSize());
        int offset = page * size;

        List<PhieuXuatHoSo> content;
        long total;
        if (trangThai == null) {
            // Mặc định: tất cả phiếu đang hoạt động
            total = phieuXuatHoSoRepository.countActive(keyword, loaiHoSo);
            content = total == 0
                    ? Collections.emptyList()
                    : phieuXuatHoSoRepository.findActive(keyword, loaiHoSo, size, offset);
        } else {
            total = phieuXuatHoSoRepository.countByFilters(keyword, trangThai, loaiHoSo, null, null, null);
            content = total == 0
                    ? Collections.emptyList()
                    : phieuXuatHoSoRepository.findByFilters(keyword, trangThai, loaiHoSo, null, null, null, size, offset);
        }

        if (content.isEmpty()) {
            Pageable pageable = PageRequest.of(page, size);
            return new PageImpl<>(Collections.emptyList(), pageable, total);
        }

        return new PageImpl<>(toResponses(content), PageRequest.of(page, size), total);
    }

    @Transactional(readOnly = true)
    public Page<PhieuMuonResponse> getLichSuMuonTra(PhieuMuonSearchRequest req) {
        String trangThai = trimToNull(req.getTrangThai());
        // Mặc định lọc theo 'Mượn tạm thời' — method này chỉ phục vụ trang Mượn/Trả.
        // Nếu client gửi loaiHoSo cụ thể → dùng giá trị client gửi.
        String loaiHoSo = trimToNull(req.getLoaiHoSo());
        if (loaiHoSo == null) {
            loaiHoSo = LOAI_MUON_TAM_THOI;
        }
        String keyword = trimToNull(req.getKeyword());
        String nguoiThucHien = trimToNull(req.getNguoiThucHien());
        String fromDate = trimToNull(req.getFromDate());
        String toDate = trimToNull(req.getToDate());

        int page = Math.max(0, req.getPage());
        int size = Math.max(1, req.getSize());
        int offset = page * size;

        long total = phieuXuatHoSoRepository.countByFilters(
                keyword, trangThai, loaiHoSo, nguoiThucHien, fromDate, toDate);

        List<PhieuXuatHoSo> content = total == 0
                ? Collections.emptyList()
                : phieuXuatHoSoRepository.findByFilters(
                        keyword, trangThai, loaiHoSo, nguoiThucHien, fromDate, toDate, size, offset);

        if (content.isEmpty()) {
            Pageable pageable = PageRequest.of(page, size);
            return new PageImpl<>(Collections.emptyList(), pageable, total);
        }

        return new PageImpl<>(toResponses(content), PageRequest.of(page, size), total);
    }

    @Transactional(readOnly = true)
    public PhieuMuonResponse getById(String maPhieu) {
        PhieuXuatHoSo p = phieuXuatHoSoRepository.findById(maPhieu)
                .orElseThrow(() -> new ResourceNotFoundException("PHIEU_NOT_FOUND",
                        "Không tìm thấy phiếu mã " + maPhieu));
        return toResponses(List.of(p)).get(0);
    }

    /**
     * Lấy tất cả phiếu đang hoạt động (Chờ duyệt / Đang mượn / Quá hạn) của 1 SV.
     * Dùng cho trang chi tiết SV.
     */
    @Transactional(readOnly = true)
    public List<PhieuMuonResponse> getActiveByMssv(String mssv) {
        List<PhieuXuatHoSo> list = phieuXuatHoSoRepository.findActiveByMssv(mssv);
        if (list.isEmpty()) return Collections.emptyList();
        return toResponses(list);
    }

    // ============================================================
    // Mutations
    // ============================================================

    /**
     * Tạo phiếu mượn / rút hồ sơ mới.
     *
     * Quy tắc nghiệp vụ (theo AGENTS.md mục 5):
     *  - Sinh viên phải tồn tại.
     *  - Sinh viên có trangThaiHocVu = 'Đã rút hồ sơ' → không cho tạo phiếu Mượn tạm thời.
     *  - Rút vĩnh viễn KHÔNG cho tạo khi còn phiếu Mượn tạm thời 'Đang mượn' chưa trả.
     *  - Rút vĩnh viễn LUÔN áp dụng cho TOÀN BỘ giấy tờ hiện có (force override danhSachMaHoSo).
     *  - Tất cả maHoSo trong danhSachMaHoSo phải thuộc về mssv (validate).
     *  - LoaiPhieu = 'Mượn tạm thời' bắt buộc có ngayTraDuKien.
     *  - Phiếu mới mặc định trạng thái 'Chờ duyệt' (cán bộ duyệt sau).
     *  - Cán bộ phụ trách (nguoiTao) = user hiện đang đăng nhập.
     *  - Ghi audit log khi tạo phiếu.
     */
    @Transactional
    public PhieuMuonResponse createPhieu(PhieuMuonRequest req) {
        // Validate sinh viên
        SinhVien sv = sinhVienRepository.findById(req.getMssv())
                .orElseThrow(() -> new ResourceNotFoundException("SINHVIEN_NOT_FOUND",
                        "Không tìm thấy sinh viên MSSV=" + req.getMssv()));

        // Validate loaiPhieu
        if (!LOAI_MUON_TAM_THOI.equals(req.getLoaiPhieu()) && !LOAI_RUT_VINH_VIEN.equals(req.getLoaiPhieu())) {
            throw new BadRequestException("INVALID_LOAI_PHIEU",
                    "loaiPhieu phải là 'Mượn tạm thời' hoặc 'Rút vĩnh viễn'");
        }

        // Rule #3: Sinh viên 'Đã rút hồ sơ' không cho Mượn tạm thời
        if (LOAI_MUON_TAM_THOI.equals(req.getLoaiPhieu())
                && TrangThaiHocVu.ĐÃ_RÚT_HỒ_SƠ.getDisplayName().equals(sv.getTrangThaiHocVu().getDisplayName())) {
            throw new BadRequestException("SV_DA_RUT_HO_SO",
                    "Sinh viên đã rút hồ sơ, không thể tạo phiếu mượn tạm thời.");
        }

        // Mượn tạm thời bắt buộc có hạn trả
        if (LOAI_MUON_TAM_THOI.equals(req.getLoaiPhieu()) && req.getNgayTraDuKien() == null) {
            throw new BadRequestException("MISSING_HAN_TRA",
                    "Phiếu mượn tạm thời phải có hạn trả dự kiến.");
        }

        // Mượn tạm thời bắt buộc phải có ít nhất 1 hồ sơ giấy tờ
        if (LOAI_MUON_TAM_THOI.equals(req.getLoaiPhieu())
                && (req.getDanhSachMaHoSo() == null || req.getDanhSachMaHoSo().isEmpty())) {
            throw new BadRequestException("MISSING_HO_SO",
                    "Phiếu mượn tạm thời phải chọn ít nhất 1 hồ sơ giấy tờ.");
        }

        // Rule #4: Rút vĩnh viễn không cho tạo khi còn phiếu 'Đang mượn' chưa trả
        if (LOAI_RUT_VINH_VIEN.equals(req.getLoaiPhieu())) {
            long dangMuon = phieuXuatHoSoRepository.countDangMuonByMssv(req.getMssv());
            if (dangMuon > 0) {
                List<PhieuXuatHoSo> phieuDangMuon = phieuXuatHoSoRepository.findDangMuonByMssv(req.getMssv());
                String dsMaPhieu = phieuDangMuon.stream()
                        .map(PhieuXuatHoSo::getMaPhieu)
                        .collect(Collectors.joining(", "));
                throw new BadRequestException("SV_DANG_CO_PHIEU_MUON",
                        "Sinh viên đang có " + dangMuon + " phiếu mượn tạm thời chưa trả: " + dsMaPhieu
                                + ". Vui lòng trả hết trước khi tạo phiếu rút vĩnh viễn.");
            }
        }

        // Rule #5: Rút vĩnh viễn LUÔN áp dụng cho TOÀN BỘ giấy tờ hiện có
        List<String> maHoSoList;
        if (LOAI_RUT_VINH_VIEN.equals(req.getLoaiPhieu())) {
            maHoSoList = phieuXuatHoSoRepository.findMaHoSoByMssv(req.getMssv());
            if (maHoSoList.isEmpty()) {
                throw new BadRequestException("SV_KHONG_CO_HO_SO",
                        "Sinh viên không có hồ sơ giấy tờ nào để rút vĩnh viễn.");
            }
            // Nếu client có gửi danh sách, vẫn cho phép nhưng phải khớp toàn bộ
            if (req.getDanhSachMaHoSo() != null && !req.getDanhSachMaHoSo().isEmpty()) {
                Set<String> clientSet = req.getDanhSachMaHoSo().stream().collect(Collectors.toSet());
                Set<String> dbSet = maHoSoList.stream().collect(Collectors.toSet());
                if (!clientSet.equals(dbSet)) {
                    throw new BadRequestException("RUT_VINH_VIEN_PHAI_TOAN_BO",
                            "Rút vĩnh viễn phải áp dụng cho TOÀN BỘ giấy tờ của sinh viên ("
                                    + dbSet.size() + " hồ sơ).");
                }
            }
        } else {
            maHoSoList = req.getDanhSachMaHoSo();
        }

        // Validate hồ sơ giấy tờ — tất cả phải thuộc về mssv
        List<HoSoGiayTo> hoSoList = hoSoGiayToRepository.findAllById(maHoSoList);
        if (hoSoList.size() != maHoSoList.size()) {
            throw new BadRequestException("HO_SO_NOT_FOUND",
                    "Một hoặc nhiều mã hồ sơ không tồn tại.");
        }
        for (HoSoGiayTo hs : hoSoList) {
            if (!req.getMssv().equals(hs.getMssv())) {
                throw new BadRequestException("HO_SO_KHONG_THUOC_SV",
                        "Hồ sơ " + hs.getMaHoSo() + " không thuộc sinh viên " + req.getMssv());
            }
        }

        // Sinh mã phiếu mới (PXxxx — 4 số tăng dần)
        String maPhieu = generateMaPhieu();

        // Lấy username hiện tại làm nguoiTao + cán bộ phụ trách
        String nguoiTao = currentUsername();

        PhieuXuatHoSo phieu = new PhieuXuatHoSo();
        phieu.setMaPhieu(maPhieu);
        phieu.setMssv(req.getMssv());
        phieu.setLoaiPhieu(req.getLoaiPhieu());
        phieu.setTrangThai(TRANG_THAI_MOI);
        phieu.setLyDo(req.getLyDo());
        phieu.setNgayMuon(req.getNgayMuon());
        phieu.setNgayTraDuKien(req.getNgayTraDuKien());
        phieu.setGhiChu(req.getGhiChu());
        phieu.setNguoiTao(nguoiTao);
        phieu.setNgayTao(LocalDateTime.now());

        phieuXuatHoSoRepository.save(phieu);

        // Tạo các dòng chi tiết phiếu
        for (String maHoSo : maHoSoList) {
            ChiTietPhieu ct = new ChiTietPhieu();
            ct.setMaCt(generateMaCt());
            ct.setMaPhieu(maPhieu);
            ct.setMaHoSo(maHoSo);
            ct.setNgayTao(LocalDateTime.now());
            chiTietPhieuRepository.save(ct);
        }

        // Rule #7: ghi audit log
        auditService.log("CREATE_PHIEU", "phieu_xuat_ho_so", maPhieu,
                "loaiPhieu+trangThai", null,
                req.getLoaiPhieu() + "|" + TRANG_THAI_MOI, nguoiTao);
        auditService.log("CREATE_PHIEU", "phieu_xuat_ho_so", maPhieu,
                "soLuongHoSo", null, String.valueOf(maHoSoList.size()), nguoiTao);

        return getById(maPhieu);
    }

    /**
     * Bulk tạo phiếu Mượn tạm thời / Rút vĩnh viễn cho nhiều sinh viên.
     *
     * <p>Endpoint lý dựng từ trang "Danh sách hồ sơ" — khi user chọn nhiều SV
     * rồi bấm "Mượn/Trả lô" hoặc "Rút hồ sơ lô". Mỗi SV được xử lý độc lập
     * (best-effort); một SV lỗi không chặn các SV khác.</p>
     *
     * <p><b>Quy tắc nghiệp vụ (giữ nguyên với {@link #createPhieu}):</b></p>
     * <ul>
     *   <li>SV 'Đã rút hồ sơ' → không cho Mượn tạm thời.</li>
     *   <li>Mượn tạm thời bắt buộc có ngayTraDuKien + danhSachMaHoSo có ít nhất
     *       1 mã thuộc về SV.</li>
     *   <li>Rút vĩnh viễn không cho khi còn phiếu 'Đang mượn' chưa trả.</li>
     *   <li>Rút vĩnh viễn áp dụng TOÀN BỘ giấy tờ hiện có của SV (kể cả khi
     *       client không gửi danhSachMaHoSo).</li>
     * </ul>
     *
     * <p>Lỗi trả về theo từng SV qua {@link SinhVienBulkResult.ItemResult}.</p>
     *
     * @param req   Yêu cầu bulk (chứa mssvList, loaiPhieu, ngayMuon, ...).
     * @return      Tổng số SV, success/failure, danh sách kết quả từng SV
     *        (kèm maPhieu nếu tạo thành công).
     */
    @Transactional
    public SinhVienBulkResult bulkCreatePhieu(PhieuMuonBulkRequest req) {
        // === Validate inputs ===
        if (req == null) {
            throw new BadRequestException("EMPTY_REQUEST", "Thiếu body request.");
        }
        if (req.getMssvList() == null || req.getMssvList().isEmpty()) {
            throw new BadRequestException("EMPTY_MSSV_LIST", "Danh sách MSSV không được rỗng.");
        }
        if (req.getMssvList().size() > PhieuMuonBulkRequest.MAX_MSSVS) {
            throw new BadRequestException("TOO_MANY_MSSVS",
                    "Mỗi lần chỉ xử lý tối đa " + PhieuMuonBulkRequest.MAX_MSSVS
                            + " sinh viên (nhận " + req.getMssvList().size() + ").");
        }

        // Chuẩn hoá + dedupe MSSV nhưng giữ thứ tự
        Set<String> mssvSet = new LinkedHashSet<>();
        for (String m : req.getMssvList()) {
            if (m == null) continue;
            String t = m.trim();
            if (!t.isEmpty()) mssvSet.add(t);
        }
        if (mssvSet.isEmpty()) {
            throw new BadRequestException("EMPTY_MSSV_LIST", "Danh sách MSSV không được rỗng.");
        }
        List<String> mssvs = new ArrayList<>(mssvSet);

        String loaiPhieu = req.getLoaiPhieu() == null ? "" : req.getLoaiPhieu().trim();
        if (!LOAI_MUON_TAM_THOI.equals(loaiPhieu) && !LOAI_RUT_VINH_VIEN.equals(loaiPhieu)) {
            throw new BadRequestException("INVALID_LOAI_PHIEU",
                    "loaiPhieu phải là 'Mượn tạm thời' hoặc 'Rút vĩnh viễn'.");
        }

        LocalDate ngayMuon;
        try {
            ngayMuon = LocalDate.parse(req.getNgayMuon());
        } catch (DateTimeParseException ex) {
            throw new BadRequestException("INVALID_NGAY_MUON",
                    "ngayMuon phải có định dạng yyyy-MM-dd.");
        }
        LocalDate ngayTraDuKien = null;
        if (req.getNgayTraDuKien() != null && !req.getNgayTraDuKien().isBlank()) {
            try {
                ngayTraDuKien = LocalDate.parse(req.getNgayTraDuKien());
            } catch (DateTimeParseException ex) {
                throw new BadRequestException("INVALID_NGAY_TRA_DU_KIEN",
                        "ngayTraDuKien phải có định dạng yyyy-MM-dd.");
            }
        }

        if (LOAI_MUON_TAM_THOI.equals(loaiPhieu) && ngayTraDuKien == null) {
            throw new BadRequestException("MISSING_HAN_TRA",
                    "Phiếu mượn tạm thời phải có hạn trả dự kiến.");
        }

        String lyDo = req.getLyDo() == null ? "" : req.getLyDo().trim();
        if (lyDo.isEmpty()) {
            throw new BadRequestException("MISSING_LY_DO", "Thiếu lý do mượn / rút.");
        }
        String ghiChu = req.getGhiChu();

        List<String> inputMaHoSo = req.getDanhSachMaHoSo() == null
                ? Collections.emptyList()
                : req.getDanhSachMaHoSo().stream()
                    .filter(s -> s != null && !s.isBlank())
                    .map(String::trim)
                    .collect(Collectors.toList());

        // Load tất cả SV một lần để tránh N+1
        List<SinhVien> svList = sinhVienRepository.findAllById(mssvs);
        Map<String, SinhVien> svMap = svList.stream()
                .collect(Collectors.toMap(SinhVien::getMssv, s -> s, (a, b) -> a));

        // Load tất cả hồ sơ theo MSSV (gộp 1 query thay vì N query)
        Map<String, List<String>> hoSoByMssv = new java.util.HashMap<>();
        for (String mssv : mssvs) {
            hoSoByMssv.put(mssv, phieuXuatHoSoRepository.findMaHoSoByMssv(mssv));
        }
        // Map maHoSo -> mssv để check quyền sở hữu
        Map<String, String> maHoSoToMssv = new java.util.HashMap<>();
        for (Map.Entry<String, List<String>> e : hoSoByMssv.entrySet()) {
            for (String ma : e.getValue()) {
                maHoSoToMssv.put(ma, e.getKey());
            }
        }

        List<SinhVienBulkResult.ItemResult> results = new ArrayList<>();
        int success = 0, failure = 0;

        for (String mssv : mssvs) {
            SinhVien sv = svMap.get(mssv);
            if (sv == null) {
                results.add(SinhVienBulkResult.ItemResult.fail(
                        mssv, "SINHVIEN_NOT_FOUND", "Không tìm thấy sinh viên."));
                failure++;
                continue;
            }

            // === Validate rule cho SV này ===
            if (LOAI_MUON_TAM_THOI.equals(loaiPhieu)
                    && TrangThaiHocVu.ĐÃ_RÚT_HỒ_SƠ.getDisplayName()
                            .equals(sv.getTrangThaiHocVu().getDisplayName())) {
                results.add(SinhVienBulkResult.ItemResult.fail(
                        mssv, "SV_DA_RUT_HO_SO",
                        "Sinh viên đã rút hồ sơ, không thể tạo phiếu mượn tạm thời."));
                failure++;
                continue;
            }

            if (LOAI_RUT_VINH_VIEN.equals(loaiPhieu)) {
                long dangMuon = phieuXuatHoSoRepository.countDangMuonByMssv(mssv);
                if (dangMuon > 0) {
                    results.add(SinhVienBulkResult.ItemResult.fail(
                            mssv, "SV_DANG_CO_PHIEU_MUON",
                            "Sinh viên đang có " + dangMuon
                                    + " phiếu mượn tạm thời chưa trả. "
                                    + "Vui lòng trả hết trước khi rút vĩnh viễn."));
                    failure++;
                    continue;
                }
            }

            // === Xác định danh sách mã hồ sơ áp dụng cho SV này ===
            List<String> maHoSoList;
            if (LOAI_RUT_VINH_VIEN.equals(loaiPhieu)) {
                maHoSoList = hoSoByMssv.getOrDefault(mssv, Collections.emptyList());
                if (maHoSoList.isEmpty()) {
                    results.add(SinhVienBulkResult.ItemResult.fail(
                            mssv, "SV_KHONG_CO_HO_SO",
                            "Sinh viên không có hồ sơ giấy tờ nào để rút vĩnh viễn."));
                    failure++;
                    continue;
                }
                // Nếu client có gửi danh sách → đối chiếu với toàn bộ hồ sơ
                if (!inputMaHoSo.isEmpty()) {
                    Set<String> clientSet = new LinkedHashSet<>(inputMaHoSo);
                    Set<String> dbSet = new LinkedHashSet<>(maHoSoList);
                    if (!clientSet.equals(dbSet)) {
                        results.add(SinhVienBulkResult.ItemResult.fail(
                                mssv, "RUT_VINH_VIEN_PHAI_TOAN_BO",
                                "Rút vĩnh viễn phải áp dụng cho TOÀN BỘ giấy tờ của sinh viên ("
                                        + dbSet.size() + " hồ sơ)."));
                        failure++;
                        continue;
                    }
                }
            } else {
                // Mượn tạm thời — lọc chỉ giữ những mã thuộc về SV này
                maHoSoList = new ArrayList<>();
                for (String ma : inputMaHoSo) {
                    String owner = maHoSoToMssv.get(ma);
                    if (owner == null) {
                        results.add(SinhVienBulkResult.ItemResult.fail(
                                mssv, "HO_SO_NOT_FOUND",
                                "Mã hồ sơ '" + ma + "' không tồn tại."));
                        failure++;
                        maHoSoList = null;
                        break;
                    }
                    if (!mssv.equals(owner)) {
                        results.add(SinhVienBulkResult.ItemResult.fail(
                                mssv, "HO_SO_KHONG_THUOC_SV",
                                "Hồ sơ '" + ma + "' không thuộc sinh viên " + mssv));
                        failure++;
                        maHoSoList = null;
                        break;
                    }
                    maHoSoList.add(ma);
                }
                if (maHoSoList == null) {
                    continue;
                }
                if (maHoSoList.isEmpty()) {
                    results.add(SinhVienBulkResult.ItemResult.fail(
                            mssv, "MISSING_HO_SO",
                            "Phiếu mượn tạm thời phải chọn ít nhất 1 hồ sơ giấy tờ."));
                    failure++;
                    continue;
                }
            }

            // === Tạo phiếu (giống logic createPhieu đơn lẻ) ===
            try {
                String maPhieu = generateMaPhieu();
                String nguoiTao = currentUsername();

                PhieuXuatHoSo phieu = new PhieuXuatHoSo();
                phieu.setMaPhieu(maPhieu);
                phieu.setMssv(mssv);
                phieu.setLoaiPhieu(loaiPhieu);
                phieu.setTrangThai(TRANG_THAI_MOI);
                phieu.setLyDo(lyDo);
                phieu.setNgayMuon(ngayMuon);
                phieu.setNgayTraDuKien(ngayTraDuKien);
                phieu.setGhiChu(ghiChu);
                phieu.setNguoiTao(nguoiTao);
                phieu.setNgayTao(LocalDateTime.now());

                phieuXuatHoSoRepository.save(phieu);

                for (String maHoSo : maHoSoList) {
                    ChiTietPhieu ct = new ChiTietPhieu();
                    ct.setMaCt(generateMaCt());
                    ct.setMaPhieu(maPhieu);
                    ct.setMaHoSo(maHoSo);
                    ct.setNgayTao(LocalDateTime.now());
                    chiTietPhieuRepository.save(ct);
                }

                auditService.log("CREATE_PHIEU_BULK", "phieu_xuat_ho_so", maPhieu,
                        "loaiPhieu+trangThai", null,
                        loaiPhieu + "|" + TRANG_THAI_MOI, nguoiTao);
                auditService.log("CREATE_PHIEU_BULK", "phieu_xuat_ho_so", maPhieu,
                        "soLuongHoSo", null, String.valueOf(maHoSoList.size()), nguoiTao);

                // Trả về ItemResult "ok" với maPhieu trong message để client có thể liên kết
                SinhVienBulkResult.ItemResult r = new SinhVienBulkResult.ItemResult(
                        mssv, true, "PHIEU_CREATED",
                        "Tạo phiếu " + maPhieu + " (" + maHoSoList.size() + " hồ sơ).");
                results.add(r);
                success++;
            } catch (Exception ex) {
                log.error("bulkCreatePhieu lỗi cho MSSV={}", mssv, ex);
                results.add(SinhVienBulkResult.ItemResult.fail(
                        mssv, "INTERNAL_ERROR",
                        "Lỗi hệ thống: " + ex.getMessage()));
                failure++;
            }
        }

        log.info("bulkCreatePhieu: {}/{} thành công (loaiPhieu={})",
                success, mssvs.size(), loaiPhieu);
        return new SinhVienBulkResult(mssvs.size(), success, failure, results);
    }

    /**
     * Duyệt phiếu: Chờ duyệt → Đang mượn (Mượn tạm thời) hoặc Hoàn tất (Rút vĩnh viễn).
     * Với Rút vĩnh viễn: đồng thời set TrangThaiHocVu của SV = Đã rút hồ sơ (Rule #6).
     */
    @Transactional
    public PhieuMuonResponse duyetPhieu(String maPhieu) {
        PhieuXuatHoSo phieu = phieuXuatHoSoRepository.findById(maPhieu)
                .orElseThrow(() -> new ResourceNotFoundException("PHIEU_NOT_FOUND",
                        "Không tìm thấy phiếu mã " + maPhieu));

        if (!TRANG_THAI_MOI.equals(phieu.getTrangThai())) {
            throw new BadRequestException("INVALID_TRANG_THAI_DUYET",
                    "Chỉ duyệt được phiếu ở trạng thái 'Chờ duyệt'. Hiện tại: '" + phieu.getTrangThai() + "'");
        }

        String nguoiDuyet = currentUsername();
        String oldTrangThai = phieu.getTrangThai();

        if (LOAI_RUT_VINH_VIEN.equals(phieu.getLoaiPhieu())) {
            // Rút vĩnh viễn: duyệt = hoàn tất luôn + đổi TrangThaiHocVu của SV
            phieu.setTrangThai(TRANG_THAI_HOAN_TAT);
            phieu.setNgayTraThucTe(LocalDate.now());

            // Rule #6: set TrangThaiHocVu = Đã rút hồ sơ
            SinhVien sv = sinhVienRepository.findById(phieu.getMssv())
                    .orElseThrow(() -> new ResourceNotFoundException("SINHVIEN_NOT_FOUND",
                            "Không tìm thấy sinh viên MSSV=" + phieu.getMssv()));
            TrangThaiHocVu oldHocVu = sv.getTrangThaiHocVu();
            sv.setTrangThaiHocVu(TrangThaiHocVu.ĐÃ_RÚT_HỒ_SƠ);
            sv.setNgayCapNhat(LocalDateTime.now());
            sinhVienRepository.save(sv);

            auditService.log("DUYET_PHIEU", "phieu_xuat_ho_so", maPhieu,
                    "trangThai", oldTrangThai, TRANG_THAI_HOAN_TAT, nguoiDuyet);
            auditService.log("RUT_VINH_VIEN", "sinhvien", phieu.getMssv(),
                    "trang_thai_hoc_vu",
                    oldHocVu != null ? oldHocVu.getDisplayName() : null,
                    TrangThaiHocVu.ĐÃ_RÚT_HỒ_SƠ.getDisplayName(), nguoiDuyet);
        } else {
            // Mượn tạm thời: duyệt = chuyển sang Đang mượn
            phieu.setTrangThai(TRANG_THAI_DANG_MUON);
            auditService.log("DUYET_PHIEU", "phieu_xuat_ho_so", maPhieu,
                    "trangThai", oldTrangThai, TRANG_THAI_DANG_MUON, nguoiDuyet);
        }
        phieu.setNgayCapNhat(LocalDateTime.now());
        phieuXuatHoSoRepository.save(phieu);

        return getById(maPhieu);
    }

    /**
     * Từ chối phiếu: Chờ duyệt → Từ chối.
     * Lý do từ chối được ghi vào ghiChu.
     */
    @Transactional
    public PhieuMuonResponse tuChoiPhieu(String maPhieu, String lyDoTuChoi) {
        PhieuXuatHoSo phieu = phieuXuatHoSoRepository.findById(maPhieu)
                .orElseThrow(() -> new ResourceNotFoundException("PHIEU_NOT_FOUND",
                        "Không tìm thấy phiếu mã " + maPhieu));

        if (!TRANG_THAI_MOI.equals(phieu.getTrangThai())) {
            throw new BadRequestException("INVALID_TRANG_THAI_TU_CHOI",
                    "Chỉ từ chối được phiếu ở trạng thái 'Chờ duyệt'. Hiện tại: '" + phieu.getTrangThai() + "'");
        }

        String nguoiTuChoi = currentUsername();
        String oldTrangThai = phieu.getTrangThai();
        phieu.setTrangThai(TRANG_THAI_TU_CHOI);
        if (lyDoTuChoi != null && !lyDoTuChoi.isBlank()) {
            String existing = phieu.getGhiChu();
            String prefix = existing == null || existing.isBlank() ? "" : existing + " | ";
            phieu.setGhiChu(prefix + "[Từ chối] " + lyDoTuChoi.trim());
        }
        phieu.setNgayCapNhat(LocalDateTime.now());
        phieuXuatHoSoRepository.save(phieu);

        auditService.log("TU_CHOI_PHIEU", "phieu_xuat_ho_so", maPhieu,
                "trangThai", oldTrangThai, TRANG_THAI_TU_CHOI, nguoiTuChoi);

        return getById(maPhieu);
    }

    /**
     * Trả hồ sơ: chuyển trạng thái sang 'Đã trả' (Mượn tạm thời)
     * hoặc 'Hoàn tất' (Rút vĩnh viễn), set ngayTraThucTe = hôm nay.
     *
     * Rule: chỉ cho trả khi trangThai ∈ {'Đang mượn', 'Quá hạn'}.
     * Lưu ý: Rút vĩnh viễn thường đã được duyệt = Hoàn tất ngay (xem {@link #duyetPhieu}).
     * Method này vẫn hỗ trợ trả Rút vĩnh viễn phòng trường hợp đặc biệt.
     */
    @Transactional
    public PhieuMuonResponse traPhieu(String maPhieu, PhieuTraRequest req) {
        PhieuXuatHoSo phieu = phieuXuatHoSoRepository.findById(maPhieu)
                .orElseThrow(() -> new ResourceNotFoundException("PHIEU_NOT_FOUND",
                        "Không tìm thấy phiếu mã " + maPhieu));

        String trangThai = phieu.getTrangThai();
        if (!TRANG_THAI_DANG_MUON.equals(trangThai) && !TRANG_THAI_QUA_HAN.equals(trangThai)) {
            throw new BadRequestException("INVALID_TRANG_THAI_TRA",
                    "Chỉ có thể trả phiếu đang ở trạng thái 'Đang mượn' hoặc 'Quá hạn'. "
                            + "Hiện tại: '" + trangThai + "'");
        }

        LocalDate today = LocalDate.now();
        String oldTrangThai = phieu.getTrangThai();
        String newTrangThai = LOAI_RUT_VINH_VIEN.equals(phieu.getLoaiPhieu())
                ? TRANG_THAI_HOAN_TAT
                : TRANG_THAI_DA_TRA;

        phieu.setTrangThai(newTrangThai);
        phieu.setNgayTraThucTe(today);
        if (req != null && req.getGhiChu() != null && !req.getGhiChu().isBlank()) {
            // Ghi chú trả: append vào ghiChu hiện có (nếu có)
            String existing = phieu.getGhiChu();
            String prefix = existing == null || existing.isBlank() ? "" : existing + " | ";
            phieu.setGhiChu(prefix + "[Trả " + today + "] " + req.getGhiChu().trim());
        }
        phieu.setNgayCapNhat(LocalDateTime.now());
        phieuXuatHoSoRepository.save(phieu);

        // Rule #6: Nếu là Rút vĩnh viễn → đồng thời set TrangThaiHocVu = Đã rút hồ sơ
        if (LOAI_RUT_VINH_VIEN.equals(phieu.getLoaiPhieu())) {
            SinhVien sv = sinhVienRepository.findById(phieu.getMssv())
                    .orElseThrow(() -> new ResourceNotFoundException("SINHVIEN_NOT_FOUND",
                            "Không tìm thấy sinh viên MSSV=" + phieu.getMssv()));
            TrangThaiHocVu oldHocVu = sv.getTrangThaiHocVu();
            sv.setTrangThaiHocVu(TrangThaiHocVu.ĐÃ_RÚT_HỒ_SƠ);
            sv.setNgayCapNhat(LocalDateTime.now());
            sinhVienRepository.save(sv);

            auditService.log("RUT_VINH_VIEN", "sinhvien", phieu.getMssv(),
                    "trang_thai_hoc_vu",
                    oldHocVu != null ? oldHocVu.getDisplayName() : null,
                    TrangThaiHocVu.ĐÃ_RÚT_HỒ_SƠ.getDisplayName(), currentUsername());
        }

        // Ghi audit log cho phiếu
        auditService.log("TRA_PHIEU", "phieu_xuat_ho_so", maPhieu,
                "trangThai", oldTrangThai, newTrangThai, currentUsername());

        return getById(maPhieu);
    }

    // ============================================================
    // Scheduled job — Rule #8
    // ============================================================

    /**
     * Tự động chuyển trạng thái các phiếu Mượn tạm thời quá hạn.
     * Theo AGENTS.md mục 5: "Quá hạn trả của Mượn tạm thời phải được hệ thống
     * tự động chuyển sang trạng thái 'Quá hạn', không thao tác thủ công."
     *
     * Cron mặc định: 01:00 sáng mỗi ngày. Có thể override qua application.properties:
     *   app.phieu-muon.quahan.cron=...
     * Để test nhanh trong dev, có thể set: app.phieu-muon.quahan.cron=0 * * * * *
     */
    @Scheduled(cron = "${app.phieu-muon.quahan.cron:0 0 1 * * *}")
    @Transactional
    public void autoMarkQuaHan() {
        LocalDate today = LocalDate.now();
        List<PhieuXuatHoSo> quaHanList = phieuXuatHoSoRepository.findQuaHan(today);
        if (quaHanList.isEmpty()) {
            return;
        }

        for (PhieuXuatHoSo p : quaHanList) {
            String oldTrangThai = p.getTrangThai();
            p.setTrangThai(TRANG_THAI_QUA_HAN);
            p.setNgayCapNhat(LocalDateTime.now());
            phieuXuatHoSoRepository.save(p);

            auditService.log("AUTO_QUA_HAN", "phieu_xuat_ho_so", p.getMaPhieu(),
                    "trangThai", oldTrangThai, TRANG_THAI_QUA_HAN, "system");
        }
    }

    // ============================================================
    // Private helpers
    // ============================================================

    private List<PhieuMuonResponse> toResponses(List<PhieuXuatHoSo> content) {
        Set<String> mssvSet = content.stream()
                .map(PhieuXuatHoSo::getMssv)
                .collect(Collectors.toSet());

        // Lookup sinh viên một lần (thay vì N query) — lấy đầy đủ thông tin
        Map<String, SinhVien> mssvToSv = sinhVienRepository.findAllById(mssvSet).stream()
                .collect(Collectors.toMap(SinhVien::getMssv, s -> s, (a, b) -> a));

        List<String> maPhieuList = content.stream()
                .map(PhieuXuatHoSo::getMaPhieu)
                .toList();
        Map<String, List<String>> maPhieuToMaHoSo = chiTietPhieuRepository
                .findByMaPhieuIn(maPhieuList).stream()
                .collect(Collectors.groupingBy(
                        ChiTietPhieu::getMaPhieu,
                        Collectors.mapping(ChiTietPhieu::getMaHoSo, Collectors.toList())
                ));

        return content.stream()
                .map(p -> toResponse(p, mssvToSv, maPhieuToMaHoSo))
                .toList();
    }

    private PhieuMuonResponse toResponse(
            PhieuXuatHoSo p,
            Map<String, SinhVien> mssvToSv,
            Map<String, List<String>> maPhieuToMaHoSo) {

        SinhVien sv = mssvToSv.get(p.getMssv());

        PhieuMuonResponse r = new PhieuMuonResponse();
        r.setMaPhieu(p.getMaPhieu());
        r.setMssv(p.getMssv());
        r.setHoTenSinhVien(sv != null ? sv.getHoTen() : null);
        r.setLoaiPhieu(p.getLoaiPhieu());
        r.setTrangThai(p.getTrangThai());
        r.setLyDo(p.getLyDo());
        r.setNgayMuon(p.getNgayMuon());
        r.setNgayTraDuKien(p.getNgayTraDuKien());
        r.setNgayTraThucTe(p.getNgayTraThucTe());
        r.setGhiChu(p.getGhiChu());
        r.setNguoiTao(p.getNguoiTao());
        r.setNgayTao(p.getNgayTao());
        r.setNgayCapNhat(p.getNgayCapNhat());

        if (sv != null) {
            r.setTenLop(sv.getLop() != null ? sv.getLop().getTenLop() : null);
            r.setSdt(sv.getSdt());
            r.setGioiTinh(sv.getGioiTinh());
            r.setTenNganh(sv.getNganh() != null ? sv.getNganh().getTenNganh() : null);
            r.setTenKhoa(sv.getKhoa() != null ? sv.getKhoa().getTenKhoa() : null);
            if (sv.getKhoaHoc() != null) {
                KhoaHoc kh = sv.getKhoaHoc();
                if (kh.getNamBatDau() != null && kh.getNamKetThuc() != null) {
                    r.setKhoaNamHoc(kh.getNamBatDau() + "–" + kh.getNamKetThuc());
                } else {
                    r.setKhoaNamHoc(kh.getTenKhoaHoc());
                }
            }
            if (sv.getNgaySinh() != null) {
                r.setNgaySinh(sv.getNgaySinh().toLocalDate().toString());
            }
        }

        List<String> maHsList = maPhieuToMaHoSo.getOrDefault(p.getMaPhieu(), Collections.emptyList());
        r.setSoLuongHoSo(maHsList.size());
        r.setDanhSachMaHoSo(maHsList);
        return r;
    }

    private static String trimToNull(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    /** Lấy username của user hiện đang đăng nhập qua SecurityContext. */
    private String currentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            return "system";
        }
        try {
            String username = auth.getName();
            return userRepository.findByUsername(username)
                    .map(User::getHoTen)
                    .orElse(username);
        } catch (Exception e) {
            return auth.getName();
        }
    }

    /**
     * Sinh mã phiếu mới: PXxxx với 4 chữ số tăng dần.
     * Tìm số lớn nhất hiện tại trong DB rồi +1.
     */
    private String generateMaPhieu() {
        List<PhieuXuatHoSo> all = phieuXuatHoSoRepository.findAll();
        AtomicInteger max = new AtomicInteger(0);
        for (PhieuXuatHoSo p : all) {
            String m = p.getMaPhieu();
            if (m != null && m.startsWith("PX")) {
                try {
                    int n = Integer.parseInt(m.substring(2));
                    if (n > max.get()) max.set(n);
                } catch (NumberFormatException ignored) {}
            }
        }
        return String.format("PX%04d", max.get() + 1);
    }

    /**
     * Sinh mã chi tiết phiếu: CTxxx với 4 chữ số tăng dần.
     */
    private String generateMaCt() {
        List<ChiTietPhieu> all = chiTietPhieuRepository.findAll();
        AtomicInteger max = new AtomicInteger(0);
        for (ChiTietPhieu c : all) {
            String m = c.getMaCt();
            if (m != null && m.startsWith("CT")) {
                try {
                    int n = Integer.parseInt(m.substring(2));
                    if (n > max.get()) max.set(n);
                } catch (NumberFormatException ignored) {}
            }
        }
        return String.format("CT%04d", max.get() + 1);
    }
}