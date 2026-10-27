package vn.vwa.edurecords.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.vwa.edurecords.entity.AuditLog;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    /**
     * Lọc bản ghi audit theo các tiêu chí dùng cho màn hình "Lịch sử hoạt động".
     *
     * <p>Tất cả tham số đều optional — truyền {@code null} thì bỏ qua tiêu chí
     * tương ứng.</p>
     *
     * <ul>
     *   <li>{@code bang} — tên bảng bị tác động (VD: {@code sinhvien},
     *       {@code phieu_xuat_ho_so}).</li>
     *   <li>{@code bangKhac} — tên bảng cần loại trừ (null = không loại trừ).
     *       Dùng cho tab "Nhật ký hệ thống" để không trùng với tab
     *       "Thay đổi thông tin sinh viên" ({@code bang = 'sinhvien'}).</li>
     *   <li>{@code hanhDong} — mã hành động (VD: {@code RUT_VINH_VIEN}).</li>
     *   <li>{@code keyword} — tìm trên {@code khoa_chinh}, {@code truong_thay_doi},
     *       {@code gia_tri_cu}, {@code gia_tri_moi}, {@code nguoi_thuc_hien},
     *       và họ tên/MSSV sinh viên liên quan.</li>
     *   <li>{@code nguoiThucHien} — username cán bộ thực hiện (null = tất cả).</li>
     *   <li>{@code fromDate} / {@code toDate} — khoảng thời gian (yyyy-MM-dd),
     *       so sánh trên {@code thoi_gian}.</li>
     * </ul>
     *
     * <p>Native query vì cột {@code thoi_gian} cần lọc theo mốc ngày và bản ghi
     * {@code bang = 'sinhvien'} cần JOIN {@code sinhvien} để tìm theo họ tên.
     * {@code ILIKE} không dùng (Hibernate parser không hỗ trợ) → dùng
     * {@code LOWER(...) LIKE LOWER(...)} theo AGENTS.md mục 11.</p>
     */
    @Query(value = """
        SELECT a.* FROM audit_log a
        LEFT JOIN sinhvien sv ON a.bang = 'sinhvien' AND sv.mssv = a.khoa_chinh
        WHERE (:bang IS NULL OR a.bang = :bang)
          AND (:bangKhac IS NULL OR a.bang <> :bangKhac)
          AND (:hanhDong IS NULL OR a.hanh_dong = :hanhDong)
          AND (:nguoiThucHien IS NULL OR LOWER(COALESCE(a.nguoi_thuc_hien, '')) = LOWER(:nguoiThucHien))
          AND (:fromDate IS NULL OR a.thoi_gian >= CAST(:fromDate AS timestamp))
          AND (:toDate IS NULL OR a.thoi_gian <  CAST(:toDate AS timestamp) + INTERVAL '1 day')
          AND (
            :keyword IS NULL OR :keyword = '' OR
            LOWER(a.khoa_chinh)       LIKE LOWER(CONCAT('%', :keyword, '%')) OR
            LOWER(a.truong_thay_doi)  LIKE LOWER(CONCAT('%', :keyword, '%')) OR
            LOWER(COALESCE(a.gia_tri_cu, ''))      LIKE LOWER(CONCAT('%', :keyword, '%')) OR
            LOWER(COALESCE(a.gia_tri_moi, ''))     LIKE LOWER(CONCAT('%', :keyword, '%')) OR
            LOWER(COALESCE(a.nguoi_thuc_hien, '')) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
            LOWER(sv.ho_ten) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
            LOWER(sv.mssv)   LIKE LOWER(CONCAT('%', :keyword, '%'))
          )
        ORDER BY a.thoi_gian DESC, a.id DESC
        """, nativeQuery = true)
    Page<AuditLog> findByFilters(
            @Param("bang") String bang,
            @Param("bangKhac") String bangKhac,
            @Param("hanhDong") String hanhDong,
            @Param("keyword") String keyword,
            @Param("nguoiThucHien") String nguoiThucHien,
            @Param("fromDate") String fromDate,
            @Param("toDate") String toDate,
            Pageable pageable);

    /**
     * Đếm bản ghi audit theo cùng bộ tiêu chí với {@link #findByFilters}.
     *
     * <p>Dùng native query thay vì suy ra từ {@code Page} để giữ đúng điều kiện
     * lọc và tránh sinh thêm một lần count trùng lặp.</p>
     */
    @Query(value = """
        SELECT COUNT(*) FROM audit_log a
        LEFT JOIN sinhvien sv ON a.bang = 'sinhvien' AND sv.mssv = a.khoa_chinh
        WHERE (:bang IS NULL OR a.bang = :bang)
          AND (:bangKhac IS NULL OR a.bang <> :bangKhac)
          AND (:hanhDong IS NULL OR a.hanh_dong = :hanhDong)
          AND (:nguoiThucHien IS NULL OR LOWER(COALESCE(a.nguoi_thuc_hien, '')) = LOWER(:nguoiThucHien))
          AND (:fromDate IS NULL OR a.thoi_gian >= CAST(:fromDate AS timestamp))
          AND (:toDate IS NULL OR a.thoi_gian <  CAST(:toDate AS timestamp) + INTERVAL '1 day')
          AND (
            :keyword IS NULL OR :keyword = '' OR
            LOWER(a.khoa_chinh)       LIKE LOWER(CONCAT('%', :keyword, '%')) OR
            LOWER(a.truong_thay_doi)  LIKE LOWER(CONCAT('%', :keyword, '%')) OR
            LOWER(COALESCE(a.gia_tri_cu, ''))      LIKE LOWER(CONCAT('%', :keyword, '%')) OR
            LOWER(COALESCE(a.gia_tri_moi, ''))     LIKE LOWER(CONCAT('%', :keyword, '%')) OR
            LOWER(COALESCE(a.nguoi_thuc_hien, '')) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
            LOWER(sv.ho_ten) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
            LOWER(sv.mssv)   LIKE LOWER(CONCAT('%', :keyword, '%'))
          )
        """, nativeQuery = true)
    long countByFilters(
            @Param("bang") String bang,
            @Param("bangKhac") String bangKhac,
            @Param("hanhDong") String hanhDong,
            @Param("keyword") String keyword,
            @Param("nguoiThucHien") String nguoiThucHien,
            @Param("fromDate") String fromDate,
            @Param("toDate") String toDate);
}
