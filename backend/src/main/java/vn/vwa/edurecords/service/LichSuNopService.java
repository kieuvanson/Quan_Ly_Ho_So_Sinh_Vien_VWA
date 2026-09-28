package vn.vwa.edurecords.service;

import org.springframework.data.domain.Page;
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
import java.util.List;
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
        return logs.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public Page<LichSuNopResponse> getByMssv(String mssv, Pageable pageable) {
        Page<LichSuNop> logs = lichSuNopRepository.findByMssvOrderByThoiGianDesc(mssv, pageable);
        return logs.map(this::toResponse);
    }

    public List<LichSuNopResponse> getByMssvAll(String mssv) {
        List<LichSuNop> logs = lichSuNopRepository.findByMssvOrderByThoiGianDesc(mssv);
        return logs.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<LichSuNopResponse> getByMaHoSoAndHanhDong(String maHoSo, String hanhDong) {
        List<LichSuNop> logs = lichSuNopRepository.findByMaHoSoAndHanhDongOrderByThoiGianDesc(maHoSo, hanhDong);
        return logs.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
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

    public long countByMaHoSo(String maHoSo) {
        return lichSuNopRepository.findByMaHoSoOrderByThoiGianDesc(maHoSo).size();
    }
}
