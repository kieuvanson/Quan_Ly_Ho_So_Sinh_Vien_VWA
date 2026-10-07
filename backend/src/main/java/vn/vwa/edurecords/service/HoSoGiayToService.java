package vn.vwa.edurecords.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.vwa.edurecords.dto.request.HoSoGiayToRequest;
import vn.vwa.edurecords.entity.HoSoGiayTo;
import vn.vwa.edurecords.entity.LoaiGiayTo;
import vn.vwa.edurecords.entity.LichSuNop;
import vn.vwa.edurecords.exception.BadRequestException;
import vn.vwa.edurecords.exception.ResourceNotFoundException;
import vn.vwa.edurecords.repository.HoSoGiayToRepository;
import vn.vwa.edurecords.repository.LichSuNopRepository;
import vn.vwa.edurecords.repository.LoaiGiayToRepository;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@Service
public class HoSoGiayToService {

    private final HoSoGiayToRepository hoSoGiayToRepository;
    private final LoaiGiayToRepository loaiGiayToRepository;
    private final LichSuNopRepository lichSuNopRepository;

    private int sequenceCounter = 0;

    public HoSoGiayToService(HoSoGiayToRepository hoSoGiayToRepository,
                             LoaiGiayToRepository loaiGiayToRepository,
                             LichSuNopRepository lichSuNopRepository) {
        this.hoSoGiayToRepository = hoSoGiayToRepository;
        this.loaiGiayToRepository = loaiGiayToRepository;
        this.lichSuNopRepository = lichSuNopRepository;
    }

    private synchronized String generateMaHoSo() {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        sequenceCounter = (sequenceCounter + 1) % 100;
        return String.format("HS%s%02d", timestamp, sequenceCounter);
    }

    private synchronized String generateMaLog() {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        sequenceCounter = (sequenceCounter + 1) % 100;
        return String.format("LSN%s%02d", timestamp, sequenceCounter);
    }

    public List<HoSoGiayTo> getByMssv(String mssv) {
        return hoSoGiayToRepository.findByMssv(mssv);
    }

    public Optional<HoSoGiayTo> getByMaHoSo(String maHoSo) {
        return hoSoGiayToRepository.findById(maHoSo);
    }

    public Optional<HoSoGiayTo> getByMssvAndMaLoai(String mssv, String maLoai) {
        return hoSoGiayToRepository.findByMssvAndMaLoai(mssv, maLoai);
    }

    public long countByMssv(String mssv) {
        return hoSoGiayToRepository.countByMssv(mssv);
    }

    @Transactional
    public HoSoGiayTo create(String mssv, String maLoai, HoSoGiayToRequest request, String nguoiThucHien) {
        LoaiGiayTo loaiGiayTo = loaiGiayToRepository.findById(maLoai)
                .orElseThrow(() -> new ResourceNotFoundException("NOT_FOUND", "Loại giấy tờ không tồn tại: " + maLoai));

        if (hoSoGiayToRepository.findByMssvAndMaLoai(mssv, maLoai).isPresent()) {
            throw new BadRequestException("EXISTS", "Hồ sơ giấy tờ đã tồn tại cho sinh viên này");
        }

        HoSoGiayTo hoSo = new HoSoGiayTo();
        hoSo.setMaHoSo(generateMaHoSo());
        hoSo.setMssv(mssv);
        hoSo.setMaLoai(maLoai);
        hoSo.setTrangThaiNop(request.getTrangThaiNop() != null ? request.getTrangThaiNop() : "Chưa nộp");
        hoSo.setBanGocBanSao(request.getBanGocBanSao());
        hoSo.setFileDinhKem(request.getFileDinhKem());
        hoSo.setViTriLuuKho(request.getViTriLuuKho());
        hoSo.setNgayTao(LocalDateTime.now());
        hoSo.setNgayCapNhat(LocalDateTime.now());

        HoSoGiayTo saved = hoSoGiayToRepository.save(hoSo);

        ghiLichSuNop(saved, null, saved.getTrangThaiNop(), "Tạo hồ sơ", request.getGhiChu(), nguoiThucHien);

        return saved;
    }

    @Transactional
    public HoSoGiayTo update(String maHoSo, HoSoGiayToRequest request, String nguoiThucHien) {
        HoSoGiayTo hoSo = hoSoGiayToRepository.findById(maHoSo)
                .orElseThrow(() -> new ResourceNotFoundException("NOT_FOUND", "Hồ sơ giấy tờ không tồn tại: " + maHoSo));

        String trangThaiCu = hoSo.getTrangThaiNop();
        boolean daThayDoiTrangThai = false;

        if (request.getTrangThaiNop() != null && !request.getTrangThaiNop().equals(trangThaiCu)) {
            hoSo.setTrangThaiNop(request.getTrangThaiNop());
            daThayDoiTrangThai = true;
        }

        if (request.getBanGocBanSao() != null) {
            hoSo.setBanGocBanSao(request.getBanGocBanSao());
        }
        if (request.getFileDinhKem() != null) {
            hoSo.setFileDinhKem(request.getFileDinhKem());
        }
        if (request.getViTriLuuKho() != null) {
            hoSo.setViTriLuuKho(request.getViTriLuuKho());
        }

        hoSo.setNgayCapNhat(LocalDateTime.now());
        HoSoGiayTo updated = hoSoGiayToRepository.save(hoSo);

        if (daThayDoiTrangThai) {
            String hanhDong = xacDinhHanhDong(trangThaiCu, request.getTrangThaiNop());
            ghiLichSuNop(updated, trangThaiCu, request.getTrangThaiNop(), hanhDong, request.getGhiChu(), nguoiThucHien);
        }

        return updated;
    }

    @Transactional
    public HoSoGiayTo capNhatTrangThaiNop(String maHoSo, String trangThaiMoi, String ghiChu, String nguoiThucHien) {
        HoSoGiayTo hoSo = hoSoGiayToRepository.findById(maHoSo)
                .orElseThrow(() -> new ResourceNotFoundException("NOT_FOUND", "Hồ sơ giấy tờ không tồn tại: " + maHoSo));

        String trangThaiCu = hoSo.getTrangThaiNop();

        if (trangThaiMoi.equals(trangThaiCu)) {
            return hoSo;
        }

        hoSo.setTrangThaiNop(trangThaiMoi);
        hoSo.setNgayCapNhat(LocalDateTime.now());
        HoSoGiayTo updated = hoSoGiayToRepository.save(hoSo);

        String hanhDong = xacDinhHanhDong(trangThaiCu, trangThaiMoi);
        ghiLichSuNop(updated, trangThaiCu, trangThaiMoi, hanhDong, ghiChu, nguoiThucHien);

        return updated;
    }

    @Transactional
    public void delete(String maHoSo) {
        if (!hoSoGiayToRepository.existsById(maHoSo)) {
            throw new ResourceNotFoundException("NOT_FOUND", "Hồ sơ giấy tờ không tồn tại: " + maHoSo);
        }
        hoSoGiayToRepository.deleteById(maHoSo);
    }

    private void ghiLichSuNop(HoSoGiayTo hoSo, String trangThaiCu, String trangThaiMoi,
                              String hanhDong, String ghiChu, String nguoiThucHien) {
        LichSuNop log = new LichSuNop();
        log.setMaLog(generateMaLog());
        log.setMaHoSo(hoSo.getMaHoSo());
        log.setMssv(hoSo.getMssv());
        log.setHanhDong(hanhDong);
        log.setTrangThaiCu(trangThaiCu);
        log.setTrangThaiMoi(trangThaiMoi);
        log.setGhiChu(ghiChu);
        log.setNguoiThucHien(nguoiThucHien);
        log.setThoiGian(LocalDateTime.now());

        lichSuNopRepository.save(log);
    }

    private String xacDinhHanhDong(String trangThaiCu, String trangThaiMoi) {
        if ("Chưa nộp".equals(trangThaiCu) && "Đã nộp".equals(trangThaiMoi)) {
            return "Nộp giấy tờ";
        } else if ("Đã nộp".equals(trangThaiCu) && "Chưa nộp".equals(trangThaiMoi)) {
            return "Hủy nộp";
        } else if ("Đã nộp".equals(trangThaiCu) && "Thiếu".equals(trangThaiMoi)) {
            return "Đánh dấu thiếu";
        } else if ("Thiếu".equals(trangThaiCu) && "Đã nộp".equals(trangThaiMoi)) {
            return "Bổ sung đủ";
        } else if ("Đã nộp".equals(trangThaiCu) && "Không hợp lệ".equals(trangThaiMoi)) {
            return "Đánh dấu không hợp lệ";
        } else if ("Không hợp lệ".equals(trangThaiCu) && "Đã nộp".equals(trangThaiMoi)) {
            return "Hợp lệ trở lại";
        }
        return "Cập nhật trạng thái";
    }
}
