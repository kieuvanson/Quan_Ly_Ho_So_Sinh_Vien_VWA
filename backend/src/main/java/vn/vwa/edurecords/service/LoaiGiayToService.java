package vn.vwa.edurecords.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.vwa.edurecords.dto.request.LoaiGiayToRequest;
import vn.vwa.edurecords.dto.response.LoaiGiayToResponse;
import vn.vwa.edurecords.entity.LoaiGiayTo;
import vn.vwa.edurecords.exception.BadRequestException;
import vn.vwa.edurecords.exception.ResourceNotFoundException;
import vn.vwa.edurecords.repository.HoSoGiayToRepository;
import vn.vwa.edurecords.repository.LoaiGiayToRepository;

import java.util.List;
import java.util.Optional;

@Service
public class LoaiGiayToService {

    private final LoaiGiayToRepository loaiGiayToRepository;
    private final HoSoGiayToRepository hoSoGiayToRepository;

    public LoaiGiayToService(LoaiGiayToRepository loaiGiayToRepository,
                             HoSoGiayToRepository hoSoGiayToRepository) {
        this.loaiGiayToRepository = loaiGiayToRepository;
        this.hoSoGiayToRepository = hoSoGiayToRepository;
    }

    public List<LoaiGiayTo> getAllActive() {
        return loaiGiayToRepository.findByDangSuDungTrueOrderByThuTuHienThiAsc();
    }

    public List<LoaiGiayTo> getAllActiveBatBuoc() {
        return loaiGiayToRepository.findByDangSuDungTrueAndBatBuocTrueOrderByThuTuHienThiAsc();
    }

    public Optional<LoaiGiayTo> getByMaLoai(String maLoai) {
        return loaiGiayToRepository.findById(maLoai);
    }

    public long countActive() {
        return loaiGiayToRepository.countByDangSuDungTrue();
    }

    public long countActiveBatBuoc() {
        return loaiGiayToRepository.countByDangSuDungTrueAndBatBuocTrue();
    }

    // ====================== CRUD ======================

    @Transactional
    public LoaiGiayToResponse create(LoaiGiayToRequest req) {
        LoaiGiayTo entity = new LoaiGiayTo();
        entity.setMaLoai(generateMaLoai());
        entity.setTenGiayTo(req.getTenGiayTo().trim());
        entity.setMoTa(req.getMoTa());
        entity.setBatBuoc(req.getBatBuoc() != null ? req.getBatBuoc() : false);
        entity.setDangSuDung(req.getDangSuDung() != null ? req.getDangSuDung() : true);
        entity.setThuTuHienThi(req.getThuTuHienThi());
        LoaiGiayTo saved = loaiGiayToRepository.save(entity);
        return LoaiGiayToResponse.fromEntity(saved);
    }

    @Transactional
    public LoaiGiayToResponse update(String maLoai, LoaiGiayToRequest req) {
        LoaiGiayTo entity = loaiGiayToRepository.findById(maLoai)
                .orElseThrow(() -> new ResourceNotFoundException("LOAI_GIAY_TO_NOT_FOUND",
                        "Không tìm thấy loại giấy tờ với mã: " + maLoai));
        entity.setTenGiayTo(req.getTenGiayTo().trim());
        entity.setMoTa(req.getMoTa());
        if (req.getBatBuoc() != null) {
            entity.setBatBuoc(req.getBatBuoc());
        }
        if (req.getDangSuDung() != null) {
            entity.setDangSuDung(req.getDangSuDung());
        }
        if (req.getThuTuHienThi() != null) {
            entity.setThuTuHienThi(req.getThuTuHienThi());
        }
        LoaiGiayTo saved = loaiGiayToRepository.save(entity);
        return LoaiGiayToResponse.fromEntity(saved);
    }

    @Transactional
    public void delete(String maLoai) {
        if (!loaiGiayToRepository.existsById(maLoai)) {
            throw new ResourceNotFoundException("LOAI_GIAY_TO_NOT_FOUND",
                    "Không tìm thấy loại giấy tờ với mã: " + maLoai);
        }
        long usedCount = hoSoGiayToRepository.countByMaLoai(maLoai);
        if (usedCount > 0) {
            throw new BadRequestException("LOAI_GIAY_TO_IN_USE",
                    "Loại giấy tờ này đang được sử dụng bởi " + usedCount + " hồ sơ. Không thể xóa.");
        }
        try {
            loaiGiayToRepository.deleteById(maLoai);
        } catch (org.springframework.dao.DataIntegrityViolationException ex) {
            throw new BadRequestException("LOAI_GIAY_TO_IN_USE",
                    "Loại giấy tờ đang được sử dụng. Không thể xóa.");
        }
    }

    /**
     * Sinh mã tự động theo pattern GT## (GT01, GT02, ...).
     * Dùng MAX+1 để tránh trùng khi có record bị xóa.
     * Retry tối đa 5 lần khi race condition xảy ra.
     */
    private String generateMaLoai() {
        for (int retry = 0; retry < 5; retry++) {
            try {
                int maxSeq = findMaxMaLoaiSequence();
                return "GT" + String.format("%02d", maxSeq + 1);
            } catch (org.springframework.dao.DataIntegrityViolationException e) {
                // Race condition — retry với MAX mới
            }
        }
        throw new IllegalStateException("Không thể sinh mã loại giấy tờ sau 5 lần thử.");
    }

    private int findMaxMaLoaiSequence() {
        List<LoaiGiayTo> all = loaiGiayToRepository.findAll();
        int max = 0;
        for (LoaiGiayTo lgt : all) {
            String ma = lgt.getMaLoai();
            if (ma != null && ma.matches("^GT\\d+$")) {
                try {
                    int seq = Integer.parseInt(ma.substring(2));
                    if (seq > max) max = seq;
                } catch (NumberFormatException ignore) { }
            }
        }
        return max;
    }

    /**
     * Tạo mới loại giấy tờ từ import — dùng khi đã có sẵn các tham số rời.
     * Tương tự create() nhưng nhận param trực tiếp thay vì DTO.
     */
    @Transactional
    public LoaiGiayToResponse createFromImport(String tenGiayTo, String moTa,
            boolean batBuoc, Integer thuTuHienThi, boolean dangSuDung) {
        LoaiGiayTo entity = new LoaiGiayTo();
        entity.setMaLoai(generateMaLoai());
        entity.setTenGiayTo(tenGiayTo.trim());
        entity.setMoTa(moTa);
        entity.setBatBuoc(batBuoc);
        entity.setDangSuDung(dangSuDung);
        entity.setThuTuHienThi(thuTuHienThi);
        LoaiGiayTo saved = loaiGiayToRepository.save(entity);
        return LoaiGiayToResponse.fromEntity(saved);
    }
}
