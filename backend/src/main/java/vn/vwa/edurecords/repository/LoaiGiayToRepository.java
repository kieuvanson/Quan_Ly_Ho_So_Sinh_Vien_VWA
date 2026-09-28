package vn.vwa.edurecords.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.vwa.edurecords.entity.LoaiGiayTo;

import java.util.List;

@Repository
public interface LoaiGiayToRepository extends JpaRepository<LoaiGiayTo, String> {

    List<LoaiGiayTo> findByDangSuDungTrueOrderByThuTuHienThiAsc();

    List<LoaiGiayTo> findByDangSuDungTrueAndBatBuocTrueOrderByThuTuHienThiAsc();

    long countByDangSuDungTrue();

    long countByDangSuDungTrueAndBatBuocTrue();
}
