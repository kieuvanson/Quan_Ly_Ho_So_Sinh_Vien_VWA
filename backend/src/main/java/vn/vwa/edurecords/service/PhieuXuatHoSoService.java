package vn.vwa.edurecords.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.vwa.edurecords.dto.request.PhieuMuonRequest;
import vn.vwa.edurecords.dto.request.PhieuMuonSearchRequest;
import vn.vwa.edurecords.dto.request.PhieuTraRequest;
import vn.vwa.edurecords.dto.response.PhieuMuonResponse;
import vn.vwa.edurecords.entity.ChiTietPhieu;
import vn.vwa.edurecords.entity.PhieuXuatHoSo;
import vn.vwa.edurecords.entity.SinhVien;
import vn.vwa.edurecords.entity.User;
import vn.vwa.edurecords.exception.BadRequestException;
import vn.vwa.edurecords.exception.ResourceNotFoundException;
import vn.vwa.edurecords.repository.ChiTietPhieuRepository;
import vn.vwa.edurecords.repository.HoSoGiayToRepository;
import vn.vwa.edurecords.repository.PhieuXuatHoSoRepository;
import vn.vwa.edurecords.repository.SinhVienRepository;
import vn.vwa.edurecords.repository.UserRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Service
public class PhieuXuatHoSoService {

    private final PhieuXuatHoSoRepository phieuXuatHoSoRepository;
    private final SinhVienRepository sinhVienRepository;
    private final ChiTietPhieuRepository chiTietPhieuRepository;
    private final HoSoGiayToRepository hoSoGiayToRepository;
    private final UserRepository userRepository;

    /** Trạng thái mặc định cho endpoint /dang-muon khi client không gửi trangThai. */
    public static final String DEFAULT_TRANG_THAI = "Đang mượn";

    /** Trạng thái hợp lệ khi tạo phiếu. */
    public static final String TRANG_THAI_MOI = "Chờ duyệt";
    public static final String TRANG_THAI_DA_DUYET = "Đã duyệt";
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
                                 UserRepository userRepository) {
        this.phieuXuatHoSoRepository = phieuXuatHoSoRepository;
        this.sinhVienRepository = sinhVienRepository;
        this.chiTietPhieuRepository = chiTietPhieuRepository;
        this.hoSoGiayToRepository = hoSoGiayToRepository;
        this.userRepository = userRepository;
    }

    // ============================================================
    // Queries
    // ============================================================

    @Transactional(readOnly = true)
    public Page<PhieuMuonResponse> getDanhSachDangMuon(PhieuMuonSearchRequest req) {
        String trangThai = (req.getTrangThai() == null || req.getTrangThai().trim().isEmpty())
                ? DEFAULT_TRANG_THAI
                : req.getTrangThai().trim();
        String loaiHoSo = trimToNull(req.getLoaiHoSo());
        String keyword = trimToNull(req.getKeyword());

        int page = Math.max(0, req.getPage());
        int size = Math.max(1, req.getSize());
        int offset = page * size;

        long total = phieuXuatHoSoRepository.countByFilters(keyword, trangThai, loaiHoSo, null, null);

        List<PhieuXuatHoSo> content = total == 0
                ? Collections.emptyList()
                : phieuXuatHoSoRepository.findByFilters(keyword, trangThai, loaiHoSo, null, null, size, offset);

        if (content.isEmpty()) {
            Pageable pageable = PageRequest.of(page, size);
            return new PageImpl<>(Collections.emptyList(), pageable, total);
        }

        return new PageImpl<>(toResponses(content), PageRequest.of(page, size), total);
    }

    @Transactional(readOnly = true)
    public Page<PhieuMuonResponse> getLichSuMuonTra(PhieuMuonSearchRequest req) {
        String trangThai = trimToNull(req.getTrangThai());
        String loaiHoSo = trimToNull(req.getLoaiHoSo());
        String keyword = trimToNull(req.getKeyword());
        String fromDate = trimToNull(req.getFromDate());
        String toDate = trimToNull(req.getToDate());

        int page = Math.max(0, req.getPage());
        int size = Math.max(1, req.getSize());
        int offset = page * size;

        long total = phieuXuatHoSoRepository.countByFilters(keyword, trangThai, loaiHoSo, fromDate, toDate);

        List<PhieuXuatHoSo> content = total == 0
                ? Collections.emptyList()
                : phieuXuatHoSoRepository.findByFilters(keyword, trangThai, loaiHoSo, fromDate, toDate, size, offset);

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

    // ============================================================
    // Mutations
    // ============================================================

    /**
     * Tạo phiếu mượn / rút hồ sơ mới.
     *
     * Quy tắc nghiệp vụ:
     *  - Sinh viên phải tồn tại.
     *  - Sinh viên có trangThaiHocVu = 'Đã rút hồ sơ' → không cho tạo phiếu Mượn tạm thời.
     *  - Tất cả maHoSo trong danhSachMaHoSo phải thuộc về mssv (validate).
     *  - LoaiPhieu = 'Mượn tạm thời' bắt buộc có ngayTraDuKien.
     *  - Phiếu mới mặc định trạng thái 'Chờ duyệt' (cán bộ duyệt sau).
     *  - Cán bộ phụ trách (nguoiTao) = user hiện đang đăng nhập (admin).
     */
    @Transactional
    public PhieuMuonResponse createPhieu(PhieuMuonRequest req) {
        // Validate sinh viên
        SinhVien sv = sinhVienRepository.findById(req.getMssv())
                .orElseThrow(() -> new ResourceNotFoundException("SINHVIEN_NOT_FOUND",
                        "Không tìm thấy sinh viên MSSV=" + req.getMssv()));

        // Rule: 'Đã rút hồ sơ' không cho Mượn tạm thời
        if (LOAI_MUON_TAM_THOI.equals(req.getLoaiPhieu())
                && "Đã rút hồ sơ".equals(sv.getTrangThaiHocVu().getDisplayName())) {
            throw new BadRequestException("SV_DA_RUT_HO_SO",
                    "Sinh viên đã rút hồ sơ, không thể tạo phiếu mượn tạm thời.");
        }

        // Validate loaiPhieu
        if (!LOAI_MUON_TAM_THOI.equals(req.getLoaiPhieu()) && !LOAI_RUT_VINH_VIEN.equals(req.getLoaiPhieu())) {
            throw new BadRequestException("INVALID_LOAI_PHIEU",
                    "loaiPhieu phải là 'Mượn tạm thời' hoặc 'Rút vĩnh viễn'");
        }

        // Mượn tạm thời bắt buộc có hạn trả
        if (LOAI_MUON_TAM_THOI.equals(req.getLoaiPhieu()) && req.getNgayTraDuKien() == null) {
            throw new BadRequestException("MISSING_HAN_TRA",
                    "Phiếu mượn tạm thời phải có hạn trả dự kiến.");
        }

        // Validate hồ sơ giấy tờ — tất cả phải thuộc về mssv
        List<String> maHoSoList = req.getDanhSachMaHoSo();
        List<vn.vwa.edurecords.entity.HoSoGiayTo> hoSoList = hoSoGiayToRepository.findAllById(maHoSoList);
        if (hoSoList.size() != maHoSoList.size()) {
            throw new BadRequestException("HO_SO_NOT_FOUND",
                    "Một hoặc nhiều mã hồ sơ không tồn tại.");
        }
        for (vn.vwa.edurecords.entity.HoSoGiayTo hs : hoSoList) {
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

        return getById(maPhieu);
    }

    /**
     * Trả hồ sơ: chuyển trạng thái sang 'Đã trả' (Mượn tạm thời)
     * hoặc 'Hoàn tất' (Rút vĩnh viễn), set ngayTraThucTe = hôm nay.
     *
     * Rule: chỉ cho trả khi trangThai ∈ {'Đang mượn', 'Quá hạn'}.
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

        return getById(maPhieu);
    }

    // ============================================================
    // Private helpers
    // ============================================================

    private List<PhieuMuonResponse> toResponses(List<PhieuXuatHoSo> content) {
        Set<String> mssvSet = content.stream()
                .map(PhieuXuatHoSo::getMssv)
                .collect(Collectors.toSet());
        Map<String, String> mssvToHoTen = sinhVienRepository.findAllById(mssvSet).stream()
                .collect(Collectors.toMap(SinhVien::getMssv, SinhVien::getHoTen, (a, b) -> a));

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
                .map(p -> toResponse(p, mssvToHoTen, maPhieuToMaHoSo))
                .toList();
    }

    private PhieuMuonResponse toResponse(
            PhieuXuatHoSo p,
            Map<String, String> mssvToHoTen,
            Map<String, List<String>> maPhieuToMaHoSo) {

        PhieuMuonResponse r = new PhieuMuonResponse();
        r.setMaPhieu(p.getMaPhieu());
        r.setMssv(p.getMssv());
        r.setHoTenSinhVien(mssvToHoTen.getOrDefault(p.getMssv(), null));
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
        // Lấy tên hiển thị (hoTen) thay vì username nếu tìm thấy trong DB
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