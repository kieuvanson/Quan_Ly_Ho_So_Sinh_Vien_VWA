package vn.vwa.edurecords.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.vwa.edurecords.entity.KhoaHoc;

import java.util.List;
import java.util.Optional;

@Repository
public interface KhoaHocRepository extends JpaRepository<KhoaHoc, Integer> {

    List<KhoaHoc> findByDangSuDungTrueOrderByTenKhoaHocAsc();

    Optional<KhoaHoc> findByMaKhoaHoc(String maKhoaHoc);

    Optional<KhoaHoc> findByTenKhoaHocIgnoreCase(String tenKhoaHoc);

    boolean existsByMaKhoaHoc(String maKhoaHoc);

    /**
     * Trích số thứ tự lớn nhất từ mã {@code KH##} (vd KH01 → 1, KH99 → 99).
     * Trả về {@code 0} nếu bảng rỗng.
     */
    @org.springframework.data.jpa.repository.Query(
            value = "SELECT COALESCE(MAX(CAST(SUBSTRING(ma_khoa_hoc FROM 'KH([0-9]+)') AS INTEGER)), 0) FROM khoa_hoc",
            nativeQuery = true)
    int findMaxMaKhoaHocSequence();
}
