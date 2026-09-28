package vn.vwa.edurecords.service;

import org.springframework.stereotype.Service;
import vn.vwa.edurecords.entity.LoaiGiayTo;
import vn.vwa.edurecords.repository.LoaiGiayToRepository;

import java.util.List;
import java.util.Optional;

@Service
public class LoaiGiayToService {

    private final LoaiGiayToRepository loaiGiayToRepository;

    public LoaiGiayToService(LoaiGiayToRepository loaiGiayToRepository) {
        this.loaiGiayToRepository = loaiGiayToRepository;
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
}
