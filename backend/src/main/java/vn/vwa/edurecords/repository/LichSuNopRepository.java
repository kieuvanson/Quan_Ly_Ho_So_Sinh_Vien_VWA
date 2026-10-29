package vn.vwa.edurecords.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.vwa.edurecords.entity.LichSuNop;

import java.util.List;

@Repository
public interface LichSuNopRepository extends JpaRepository<LichSuNop, String> {
    
    List<LichSuNop> findByMaHoSoOrderByThoiGianDesc(String maHoSo);
    
    List<LichSuNop> findByMssvOrderByThoiGianDesc(String mssv);
    
    Page<LichSuNop> findByMssvOrderByThoiGianDesc(String mssv, Pageable pageable);
    
    List<LichSuNop> findByMaHoSoAndHanhDongOrderByThoiGianDesc(String maHoSo, String hanhDong);

    /**
     * Lấy lịch sử nộp trên TOÀN HỆ THỐNG, có lọc + phân trang.
     *
     * <p>Dùng cho tab "Lịch sử hồ sơ & giấy tờ" của màn hình Lịch sử hoạt động
     * (endpoint {@code GET /api/lich-su-nop/all}).</p>
     *
     * <ul>
     *   <li>{@code keyword} — MSSV, họ tên SV, mã hồ sơ, tên giấy tờ, hành động,
     *       ghi chú, người thực hiện.</li>
     *   <li>{@code hanhDong} — mã hành động (VD: {@code TAO_MOI}, {@code Nop giay to}).</li>
     *   <li>{@code nguoiThucHien} — username cán bộ (khớp chính xác, không phân biệt hoa thường).</li>
     *   <li>{@code fromDate} / {@code toDate} — khoảng ngày yyyy-MM-dd trên {@code thoi_gian}.</li>
     * </ul>
     *
     * <p>Native query + CAST tường minh (AGENTS.md mục 11):
     * {@code ILIKE} không dùng → {@code LOWER(...) LIKE LOWER(...)}.</p>
     */
    @Query(value = """
        SELECT l.* FROM lich_su_nop l
        LEFT JOIN sinhvien sv       ON sv.mssv = l.mssv
        LEFT JOIN ho_so_giay_to hsg ON hsg.ma_ho_so = l.ma_ho_so
        LEFT JOIN loai_giay_to lgt  ON lgt.ma_loai = hsg.ma_loai
        WHERE (:hanhDong IS NULL OR l.hanh_dong = :hanhDong)
          AND (:nguoiThucHien IS NULL OR LOWER(COALESCE(l.nguoi_thuc_hien, '')) LIKE LOWER(CONCAT('%', :nguoiThucHien, '%')))
          AND (:fromDate IS NULL OR l.thoi_gian >= CAST(:fromDate AS timestamp))
          AND (:toDate IS NULL OR l.thoi_gian <  CAST(:toDate AS timestamp) + INTERVAL '1 day')
          AND (
            :keyword IS NULL OR :keyword = '' OR
            LOWER(l.mssv)      LIKE LOWER(CONCAT('%', :keyword, '%')) OR
            LOWER(l.ma_ho_so)  LIKE LOWER(CONCAT('%', :keyword, '%')) OR
            LOWER(COALESCE(sv.ho_ten, ''))  LIKE LOWER(CONCAT('%', :keyword, '%')) OR
            LOWER(COALESCE(lgt.ten_giay_to, '')) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
            LOWER(l.hanh_dong) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
            LOWER(COALESCE(l.ghi_chu, '')) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
            LOWER(COALESCE(l.nguoi_thuc_hien, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
          )
        ORDER BY l.thoi_gian DESC, l.ma_log DESC
        """, nativeQuery = true)
    Page<LichSuNop> searchAll(
            @Param("keyword") String keyword,
            @Param("hanhDong") String hanhDong,
            @Param("nguoiThucHien") String nguoiThucHien,
            @Param("fromDate") String fromDate,
            @Param("toDate") String toDate,
            Pageable pageable);

    /**
     * Đếm bản ghi theo đúng bộ tiêu chí lọc của {@link #searchAll}.
     *
     * <p>Query riêng (native) thay vì suy ra từ {@code Page} — giữ nguyên điều kiện
     * lọc và tránh sinh thêm một câu count trùng lặp.</p>
     */
    @Query(value = """
        SELECT COUNT(*) FROM lich_su_nop l
        LEFT JOIN sinhvien sv       ON sv.mssv = l.mssv
        LEFT JOIN ho_so_giay_to hsg ON hsg.ma_ho_so = l.ma_ho_so
        LEFT JOIN loai_giay_to lgt  ON lgt.ma_loai = hsg.ma_loai
        WHERE (:hanhDong IS NULL OR l.hanh_dong = :hanhDong)
          AND (:nguoiThucHien IS NULL OR LOWER(COALESCE(l.nguoi_thuc_hien, '')) LIKE LOWER(CONCAT('%', :nguoiThucHien, '%')))
          AND (:fromDate IS NULL OR l.thoi_gian >= CAST(:fromDate AS timestamp))
          AND (:toDate IS NULL OR l.thoi_gian <  CAST(:toDate AS timestamp) + INTERVAL '1 day')
          AND (
            :keyword IS NULL OR :keyword = '' OR
            LOWER(l.mssv)      LIKE LOWER(CONCAT('%', :keyword, '%')) OR
            LOWER(l.ma_ho_so)  LIKE LOWER(CONCAT('%', :keyword, '%')) OR
            LOWER(COALESCE(sv.ho_ten, ''))  LIKE LOWER(CONCAT('%', :keyword, '%')) OR
            LOWER(COALESCE(lgt.ten_giay_to, '')) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
            LOWER(l.hanh_dong) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
            LOWER(COALESCE(l.ghi_chu, '')) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
            LOWER(COALESCE(l.nguoi_thuc_hien, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
          )
        """, nativeQuery = true)
    long countAll(
            @Param("keyword") String keyword,
            @Param("hanhDong") String hanhDong,
            @Param("nguoiThucHien") String nguoiThucHien,
            @Param("fromDate") String fromDate,
            @Param("toDate") String toDate);
}
