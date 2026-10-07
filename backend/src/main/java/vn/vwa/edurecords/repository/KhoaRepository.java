package vn.vwa.edurecords.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.vwa.edurecords.entity.Khoa;

import java.util.List;
import java.util.Optional;

@Repository
public interface KhoaRepository extends JpaRepository<Khoa, Integer> {

    List<Khoa> findByDangSuDungTrueOrderByTenKhoaAsc();

    Optional<Khoa> findByMaKhoa(String maKhoa);

    Optional<Khoa> findByTenKhoaIgnoreCase(String tenKhoa);

    boolean existsByMaKhoa(String maKhoa);

    boolean existsByTenKhoaIgnoreCase(String tenKhoa);

    /**
     * Trích số thứ tự lớn nhất từ mã {@code KHOA##} (vd KHOA01 → 1, KHOA99 → 99).
     * Trả về {@code 0} nếu bảng rỗng.
     *
     * <p>Mục đích: {@code DanhMucService.generateMaKhoa()} dùng kết quả này
     * thay cho {@code count() + 1} để tránh trùng mã khi:
     * <ul>
     *   <li>Có record bị xóa → count giảm → count+1 có thể trùng mã cũ.</li>
     *   <li>Concurrent insert → hai thread cùng nhìn count=5 → cùng sinh KHOA06.</li>
     * </ul>
     */
    @org.springframework.data.jpa.repository.Query(
            value = "SELECT COALESCE(MAX(CAST(SUBSTRING(ma_khoa FROM 'KHOA([0-9]+)') AS INTEGER)), 0) FROM khoa",
            nativeQuery = true)
    int findMaxMaKhoaSequence();
}
