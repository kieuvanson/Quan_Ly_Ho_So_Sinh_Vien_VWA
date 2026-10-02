package vn.vwa.edurecords.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.vwa.edurecords.dto.request.PhieuMuonSearchRequest;
import vn.vwa.edurecords.dto.response.PhieuMuonResponse;
import vn.vwa.edurecords.entity.ChiTietPhieu;
import vn.vwa.edurecords.entity.PhieuXuatHoSo;
import vn.vwa.edurecords.entity.SinhVien;
import vn.vwa.edurecords.repository.ChiTietPhieuRepository;
import vn.vwa.edurecords.repository.PhieuXuatHoSoRepository;
import vn.vwa.edurecords.repository.SinhVienRepository;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class PhieuXuatHoSoService {

    private final PhieuXuatHoSoRepository phieuXuatHoSoRepository;
    private final SinhVienRepository sinhVienRepository;
    private final ChiTietPhieuRepository chiTietPhieuRepository;

    /** Trạng thái mặc định cho endpoint /dang-muon khi client không gửi trangThai. */
    public static final String DEFAULT_TRANG_THAI = "Đang mượn";

    public PhieuXuatHoSoService(PhieuXuatHoSoRepository phieuXuatHoSoRepository,
                                 SinhVienRepository sinhVienRepository,
                                 ChiTietPhieuRepository chiTietPhieuRepository) {
        this.phieuXuatHoSoRepository = phieuXuatHoSoRepository;
        this.sinhVienRepository = sinhVienRepository;
        this.chiTietPhieuRepository = chiTietPhieuRepository;
    }

    /**
     * Lấy danh sách hồ sơ đang mượn (mỗi dòng = 1 phiếu xuất hồ sơ).
     *
     * Implementation:
     *  - Dùng native query (cast ENUM String → ENUM) thay cho Specification, vì
     *    Specification + cb.equal(String) gây lỗi
     *    "operator does not exist: trangthaiphieu = character varying"
     *    (xem AGENTS.md mục 11 + PhieuXuatHoSoRepository.findByFilters).
     *  - Bulk-fetch SinhVien (1) + ChiTietPhieu (1) tránh N+1.
     *  - Mặc định trangThai='Đang mượn' nếu client không gửi.
     */
    @Transactional(readOnly = true)
    public Page<PhieuMuonResponse> getDanhSachDangMuon(PhieuMuonSearchRequest req) {
        // Chuẩn hoá filter
        String trangThai = (req.getTrangThai() == null || req.getTrangThai().trim().isEmpty())
                ? DEFAULT_TRANG_THAI
                : req.getTrangThai().trim();
        String loaiHoSo = trimToNull(req.getLoaiHoSo());
        String keyword = trimToNull(req.getKeyword());

        int page = Math.max(0, req.getPage());
        int size = Math.max(1, req.getSize());
        int offset = page * size;

        // Đếm tổng + lấy trang
        long total = phieuXuatHoSoRepository.countByFilters(keyword, trangThai, loaiHoSo, null, null);

        List<PhieuXuatHoSo> content = total == 0
                ? Collections.emptyList()
                : phieuXuatHoSoRepository.findByFilters(keyword, trangThai, loaiHoSo, null, null, size, offset);

        if (content.isEmpty()) {
            Pageable pageable = PageRequest.of(page, size);
            return new PageImpl<>(Collections.emptyList(), pageable, total);
        }

        Page<PhieuMuonResponse> pageResult = new PageImpl<>(toResponses(content), PageRequest.of(page, size), total);
        return pageResult;
    }

    /**
     * Lấy lịch sử mượn / trả (mỗi dòng = 1 phiếu xuất hồ sơ, MỌI trạng thái).
     *
     * Khác {@link #getDanhSachDangMuon} ở chỗ:
     *  - Không filter trạng thái mặc định (trả hết các trạng thái: Chờ duyệt / Đã duyệt /
     *    Từ chối / Đang mượn / Đã trả / Quá hạn / Hoàn tất).
     *  - Có thêm filter fromDate / toDate (lọc theo ngayTao).
     *
     * Hỗ trợ filter (tất cả optional):
     *  - keyword: maPhieu | mssv | hoTen | lyDo
     *  - trangThai: 1 trong 7 giá trị ENUM
     *  - loaiHoSo: 'Mượn tạm thời' | 'Rút vĩnh viễn'
     *  - fromDate, toDate: yyyy-MM-dd (so sánh trên ngayTao)
     */
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

    // ============================================================
    // Private helpers
    // ============================================================

    private List<PhieuMuonResponse> toResponses(List<PhieuXuatHoSo> content) {
        // Bulk-fetch SinhVien (1)
        Set<String> mssvSet = content.stream()
                .map(PhieuXuatHoSo::getMssv)
                .collect(Collectors.toSet());
        Map<String, String> mssvToHoTen = sinhVienRepository.findAllById(mssvSet).stream()
                .collect(Collectors.toMap(SinhVien::getMssv, SinhVien::getHoTen, (a, b) -> a));

        // Bulk-fetch ChiTietPhieu (1)
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
}