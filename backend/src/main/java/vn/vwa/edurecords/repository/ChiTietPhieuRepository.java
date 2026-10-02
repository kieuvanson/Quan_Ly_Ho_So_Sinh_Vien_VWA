package vn.vwa.edurecords.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.vwa.edurecords.entity.ChiTietPhieu;

import java.util.Collection;
import java.util.List;

@Repository
public interface ChiTietPhieuRepository extends JpaRepository<ChiTietPhieu, String> {

    /** Lấy tất cả chi tiết phiếu theo 1 mã phiếu. */
    List<ChiTietPhieu> findByMaPhieu(String maPhieu);

    /**
     * Lấy các chi tiết phiếu theo nhiều maPhieu (dùng cho danh sách — 1 query, không N+1).
     * Sắp xếp theo maCt ASC để danh sách maHoSo ổn định.
     */
    @Query("SELECT c FROM ChiTietPhieu c WHERE c.maPhieu IN :maPhieuList ORDER BY c.maCt ASC")
    List<ChiTietPhieu> findByMaPhieuIn(@Param("maPhieuList") Collection<String> maPhieuList);

    /** Lấy danh sách maHoSo của 1 phiếu (projection nhẹ — chỉ trả maHoSo). */
    @Query("SELECT c.maHoSo FROM ChiTietPhieu c WHERE c.maPhieu = :maPhieu ORDER BY c.maCt ASC")
    List<String> findMaHoSoByMaPhieu(@Param("maPhieu") String maPhieu);
}