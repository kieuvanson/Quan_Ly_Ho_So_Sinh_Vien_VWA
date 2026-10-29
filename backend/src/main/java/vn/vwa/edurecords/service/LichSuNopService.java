package vn.vwa.edurecords.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import vn.vwa.edurecords.dto.response.LichSuNopResponse;
import vn.vwa.edurecords.entity.LichSuNop;
import vn.vwa.edurecords.repository.HoSoGiayToRepository;
import vn.vwa.edurecords.repository.LichSuNopRepository;
import vn.vwa.edurecords.repository.LoaiGiayToRepository;
import vn.vwa.edurecords.repository.SinhVienRepository;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class LichSuNopService {

    private final LichSuNopRepository lichSuNopRepository;
    private final HoSoGiayToRepository hoSoGiayToRepository;
    private final SinhVienRepository sinhVienRepository;
    private final LoaiGiayToRepository loaiGiayToRepository;

    private int sequenceCounter = 0;

    public LichSuNopService(LichSuNopRepository lichSuNopRepository,
                           HoSoGiayToRepository hoSoGiayToRepository,
                           SinhVienRepository sinhVienRepository,
                           LoaiGiayToRepository loaiGiayToRepository) {
        this.lichSuNopRepository = lichSuNopRepository;
        this.hoSoGiayToRepository = hoSoGiayToRepository;
        this.sinhVienRepository = sinhVienRepository;
        this.loaiGiayToRepository = loaiGiayToRepository;
    }

    private synchronized String generateMaLog() {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        sequenceCounter = (sequenceCounter + 1) % 100;
        return String.format("LSN%s%02d", timestamp, sequenceCounter);
    }

    public LichSuNop ghiLogThayDoiTrangThai(String maHoSo, String mssv, String trangThaiCu,
                                            String trangThaiMoi, String hanhDong,
                                            String ghiChu, String nguoiThucHien) {
        LichSuNop log = new LichSuNop();
        log.setMaLog(generateMaLog());
        log.setMaHoSo(maHoSo);
        log.setMssv(mssv);
        log.setHanhDong(hanhDong);
        log.setTrangThaiCu(trangThaiCu);
        log.setTrangThaiMoi(trangThaiMoi);
        log.setGhiChu(ghiChu);
        log.setNguoiThucHien(nguoiThucHien);
        log.setThoiGian(LocalDateTime.now());

        return lichSuNopRepository.save(log);
    }

    public List<LichSuNopResponse> getByMaHoSo(String maHoSo) {
        List<LichSuNop> logs = lichSuNopRepository.findByMaHoSoOrderByThoiGianDesc(maHoSo);
        return toResponses(logs);
    }

    public Page<LichSuNopResponse> getByMssv(String mssv, Pageable pageable) {
        Page<LichSuNop> logs = lichSuNopRepository.findByMssvOrderByThoiGianDesc(mssv, pageable);
        return new PageImpl<>(toResponses(logs.getContent()), pageable, logs.getTotalElements());
    }

    public List<LichSuNopResponse> getByMssvAll(String mssv) {
        List<LichSuNop> logs = lichSuNopRepository.findByMssvOrderByThoiGianDesc(mssv);
        return toResponses(logs);
    }

    public List<LichSuNopResponse> getByMaHoSoAndHanhDong(String maHoSo, String hanhDong) {
        List<LichSuNop> logs = lichSuNopRepository.findByMaHoSoAndHanhDongOrderByThoiGianDesc(maHoSo, hanhDong);
        return toResponses(logs);
    }

    public Optional<LichSuNopResponse> getByMaLog(String maLog) {
        return lichSuNopRepository.findById(maLog).map(this::toResponse);
    }

    /**
     * Lấy lịch sử nộp trên toàn hệ thống — có lọc + phân trang server-side.
     *
     * <p>Dùng cho tab "Lịch sử hồ sơ & giấy tờ" của màn hình Lịch sử hoạt động
     * (endpoint {@code GET /api/lich-su-nop/all}).</p>
     *
     * @param keyword        từ khoá (MSSV / họ tên / mã hồ sơ / tên giấy tờ / hành động / ghi chú / người thực hiện)
     * @param hanhDong       mã hành động
     * @param nguoiThucHien  username cán bộ thực hiện
     * @param fromDate       ngày bắt đầu yyyy-MM-dd
     * @param toDate         ngày kết thúc yyyy-MM-dd
     * @param page           trang 0-based
     * @param size           số bản ghi mỗi trang
     */
    public Page<LichSuNopResponse> searchAll(String keyword, String hanhDong,
                                             String nguoiThucHien, String fromDate, String toDate,
                                             int page, int size) {
        String k = trimToNull(keyword);
        String h = trimToNull(hanhDong);
        String user = trimToNull(nguoiThucHien);
        String from = trimToNull(fromDate);
        String to = trimToNull(toDate);

        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, Math.min(size, 100));

        long total = lichSuNopRepository.countAll(k, h, user, from, to);
        if (total == 0) {
            return new PageImpl<>(List.of(), PageRequest.of(safePage, safeSize), total);
        }

        Pageable pageable = PageRequest.of(safePage, safeSize);
        Page<LichSuNop> logs = lichSuNopRepository.searchAll(k, h, user, from, to, pageable);
        return new PageImpl<>(toResponses(logs.getContent()), pageable, total);
    }

    /**
     * Map danh sách bản ghi sang DTO, gom lookup sinh viên / loại giấy tờ
     * thành 1 query mỗi loại (tránh N+1 khi hiển thị danh sách dài).
     */
    private List<LichSuNopResponse> toResponses(List<LichSuNop> logs) {
        if (logs == null || logs.isEmpty()) {
            return List.of();
        }

        List<String> mssvList = logs.stream()
                .map(LichSuNop::getMssv)
                .filter(s -> s != null && !s.isBlank())
                .distinct()
                .toList();
        Map<String, String> tenSinhVien = new HashMap<>();
        if (!mssvList.isEmpty()) {
            sinhVienRepository.findAllById(mssvList)
                    .forEach(sv -> tenSinhVien.put(sv.getMssv(), sv.getHoTen()));
        }

        List<String> maHoSoList = logs.stream()
                .map(LichSuNop::getMaHoSo)
                .filter(s -> s != null && !s.isBlank())
                .distinct()
                .toList();
        Map<String, String> tenGiayToTheoMaHoSo = new HashMap<>();
        if (!maHoSoList.isEmpty()) {
            hoSoGiayToRepository.findAllById(maHoSoList).forEach(hs -> {
                if (hs.getMaLoai() == null) return;
                loaiGiayToRepository.findById(hs.getMaLoai())
                        .ifPresent(lgt -> tenGiayToTheoMaHoSo.put(hs.getMaHoSo(), lgt.getTenGiayTo()));
            });
        }

        return logs.stream()
                .map(log -> toResponse(log, tenSinhVien, tenGiayToTheoMaHoSo))
                .toList();
    }

    private LichSuNopResponse toResponse(LichSuNop log) {
        LichSuNopResponse response = new LichSuNopResponse();
        response.setMaLog(log.getMaLog());
        response.setMaHoSo(log.getMaHoSo());
        response.setMssv(log.getMssv());
        response.setHanhDong(log.getHanhDong());
        response.setTrangThaiCu(log.getTrangThaiCu());
        response.setTrangThaiMoi(log.getTrangThaiMoi());
        response.setGhiChu(log.getGhiChu());
        response.setNguoiThucHien(log.getNguoiThucHien());
        response.setThoiGian(log.getThoiGian());

        sinhVienRepository.findById(log.getMssv())
                .ifPresent(sv -> response.setHoTenSinhVien(sv.getHoTen()));

        hoSoGiayToRepository.findById(log.getMaHoSo())
                .flatMap(hs -> loaiGiayToRepository.findById(hs.getMaLoai()))
                .ifPresent(lgt -> response.setTenGiayTo(lgt.getTenGiayTo()));

        return response;
    }

    private LichSuNopResponse toResponse(LichSuNop log,
                                         Map<String, String> tenSinhVien,
                                         Map<String, String> tenGiayToTheoMaHoSo) {
        LichSuNopResponse response = new LichSuNopResponse();
        response.setMaLog(log.getMaLog());
        response.setMaHoSo(log.getMaHoSo());
        response.setMssv(log.getMssv());
        response.setHanhDong(log.getHanhDong());
        response.setTrangThaiCu(log.getTrangThaiCu());
        response.setTrangThaiMoi(log.getTrangThaiMoi());
        response.setGhiChu(log.getGhiChu());
        response.setNguoiThucHien(log.getNguoiThucHien());
        response.setThoiGian(log.getThoiGian());
        response.setHoTenSinhVien(tenSinhVien.get(log.getMssv()));
        response.setTenGiayTo(tenGiayToTheoMaHoSo.get(log.getMaHoSo()));
        return response;
    }

    public long countByMaHoSo(String maHoSo) {
        return lichSuNopRepository.findByMaHoSoOrderByThoiGianDesc(maHoSo).size();
    }

    private static String trimToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
