package vn.vwa.edurecords.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.vwa.edurecords.entity.Lop;

import java.util.List;
import java.util.Optional;

@Repository
public interface LopRepository extends JpaRepository<Lop, Integer> {

    List<Lop> findByDangSuDungTrueOrderByTenLopAsc();

    List<Lop> findByNganh_IdAndDangSuDungTrueOrderByTenLopAsc(Integer nganhId);

    List<Lop> findByKhoaHoc_IdAndDangSuDungTrueOrderByTenLopAsc(Integer khoaHocId);

    Optional<Lop> findByMaLop(String maLop);

    /**
     * Tra cứu lớp theo (tên lớp, ngành, khóa học) — định danh logic sau V4.
     * Tên lớp có thể trùng giữa các ngành/khóa, nên cần đủ 3 thuộc tính để lookup chính xác.
     */
    Optional<Lop> findFirstByTenLopIgnoreCaseAndNganh_IdAndKhoaHoc_Id(
            String tenLop, Integer nganhId, Integer khoaHocId);

    boolean existsByMaLop(String maLop);

    /**
     * Trích số thứ tự lớn nhất từ mã {@code LOP###} (vd LOP001 → 1, LOP999 → 999).
     * Trả về {@code 0} nếu bảng rỗng.
     */
    @org.springframework.data.jpa.repository.Query(
            value = "SELECT COALESCE(MAX(CAST(SUBSTRING(ma_lop FROM 'LOP([0-9]+)') AS INTEGER)), 0) FROM lop",
            nativeQuery = true)
    int findMaxMaLopSequence();
}
