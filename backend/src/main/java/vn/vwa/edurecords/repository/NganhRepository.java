package vn.vwa.edurecords.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.vwa.edurecords.entity.Nganh;

import java.util.List;
import java.util.Optional;

@Repository
public interface NganhRepository extends JpaRepository<Nganh, Integer> {

    List<Nganh> findByDangSuDungTrueOrderByTenNganhAsc();

    List<Nganh> findByKhoa_IdAndDangSuDungTrueOrderByTenNganhAsc(Integer khoaId);

    Optional<Nganh> findByMaNganh(String maNganh);

    /**
     * Tra cứu ngành theo (tên ngành, khoa_id) — định danh logic sau V4.
     * Tên ngành có thể trùng giữa các khoa, nên cần khoa_id để disambiguate.
     */
    Optional<Nganh> findFirstByTenNganhIgnoreCaseAndKhoa_Id(String tenNganh, Integer khoaId);

    boolean existsByMaNganh(String maNganh);

    /**
     * Trích số thứ tự lớn nhất từ mã {@code NGANH###} (vd NGANH001 → 1, NGANH999 → 999).
     * Trả về {@code 0} nếu bảng rỗng. Xem {@link KhoaRepository#findMaxMaKhoaSequence()}
     * để biết lý do dùng MAX thay cho count().
     */
    @org.springframework.data.jpa.repository.Query(
            value = "SELECT COALESCE(MAX(CAST(SUBSTRING(ma_nganh FROM 'NGANH([0-9]+)') AS INTEGER)), 0) FROM nganh",
            nativeQuery = true)
    int findMaxMaNganhSequence();
}
