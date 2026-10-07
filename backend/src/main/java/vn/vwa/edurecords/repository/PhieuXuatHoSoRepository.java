package vn.vwa.edurecords.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.vwa.edurecords.entity.PhieuXuatHoSo;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface PhieuXuatHoSoRepository
        extends JpaRepository<PhieuXuatHoSo, String>,
                JpaSpecificationExecutor<PhieuXuatHoSo> {

    /**
     * Đếm số phiếu của 1 sinh viên đang ở trạng thái 'Đang mượn'.
     * Dùng để check rule: "Không cho tạo phiếu Rút vĩnh viễn khi còn
     * phiếu Mượn tạm thời chưa trả."
     * Native query + CAST ENUM (giống AGENTS.md mục 11).
     */
    @Query(value = """
        SELECT COUNT(*) FROM phieu_xuat_ho_so
        WHERE mssv = :mssv
          AND trang_thai = CAST('Đang mượn' AS trangthaiphieu)
        """, nativeQuery = true)
    long countDangMuonByMssv(@Param("mssv") String mssv);

    /**
     * Lấy danh sách các phiếu Mượn tạm thời của 1 SV đang ở trạng thái 'Đang mượn'.
     * Dùng cho debug/audit khi block rút vĩnh viễn.
     */
    @Query(value = """
        SELECT * FROM phieu_xuat_ho_so
        WHERE mssv = :mssv
          AND loai_phieu = CAST('Mượn tạm thời' AS loaiphieu)
          AND trang_thai = CAST('Đang mượn' AS trangthaiphieu)
        ORDER BY ngay_tao ASC
        """, nativeQuery = true)
    List<PhieuXuatHoSo> findDangMuonByMssv(@Param("mssv") String mssv);

    /**
     * Lấy tất cả phiếu của 1 sinh viên ở các trạng thái đang hoạt động
     * (Chờ duyệt / Đang mượn / Quá hạn). Dùng cho trang chi tiết SV
     * để hiển thị "Phiếu mượn / trả đang hoạt động".
     */
    @Query(value = """
        SELECT * FROM phieu_xuat_ho_so
        WHERE mssv = :mssv
          AND trang_thai IN (
            CAST('Chờ duyệt' AS trangthaiphieu),
            CAST('Đang mượn' AS trangthaiphieu),
            CAST('Quá hạn'  AS trangthaiphieu)
          )
        ORDER BY
          CASE trang_thai
            WHEN CAST('Quá hạn'  AS trangthaiphieu) THEN 0
            WHEN CAST('Đang mượn' AS trangthaiphieu) THEN 1
            WHEN CAST('Chờ duyệt' AS trangthaiphieu) THEN 2
          END,
          ngay_tao DESC
        """, nativeQuery = true)
    List<PhieuXuatHoSo> findActiveByMssv(@Param("mssv") String mssv);

    /**
     * Lấy TẤT CẢ phiếu đang hoạt động (Chờ duyệt / Đang mượn / Quá hạn) — dùng
     * cho trang Mượn/Trả khi client KHÔNG gửi trangThai filter.
     */
    @Query(value = """
        SELECT p.*
        FROM phieu_xuat_ho_so p
        WHERE p.trang_thai IN (
            CAST('Chờ duyệt' AS trangthaiphieu),
            CAST('Đang mượn' AS trangthaiphieu),
            CAST('Quá hạn'  AS trangthaiphieu)
          )
          AND (:keyword IS NULL OR :keyword = '' OR
            LOWER(p.ma_phieu) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
            LOWER(p.mssv)     LIKE LOWER(CONCAT('%', :keyword, '%')) OR
            LOWER(p.ly_do)    LIKE LOWER(CONCAT('%', :keyword, '%')) OR
            LOWER((SELECT sv.ho_ten FROM sinhvien sv WHERE sv.mssv = p.mssv)) LIKE LOWER(CONCAT('%', :keyword, '%'))
          )
          AND (CAST(:loaiPhieu AS loaiphieu) IS NULL OR p.loai_phieu = CAST(:loaiPhieu AS loaiphieu))
        ORDER BY
          CASE p.trang_thai
            WHEN CAST('Quá hạn'  AS trangthaiphieu) THEN 0
            WHEN CAST('Đang mượn' AS trangthaiphieu) THEN 1
            WHEN CAST('Chờ duyệt' AS trangthaiphieu) THEN 2
          END,
          p.ngay_tao DESC
        LIMIT :size OFFSET :offset
        """, nativeQuery = true)
    List<PhieuXuatHoSo> findActive(
            @Param("keyword") String keyword,
            @Param("loaiPhieu") String loaiPhieu,
            @Param("size") int size,
            @Param("offset") int offset);

    @Query(value = """
        SELECT COUNT(*)
        FROM phieu_xuat_ho_so p
        WHERE p.trang_thai IN (
            CAST('Chờ duyệt' AS trangthaiphieu),
            CAST('Đang mượn' AS trangthaiphieu),
            CAST('Quá hạn'  AS trangthaiphieu)
          )
          AND (:keyword IS NULL OR :keyword = '' OR
            LOWER(p.ma_phieu) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
            LOWER(p.mssv)     LIKE LOWER(CONCAT('%', :keyword, '%')) OR
            LOWER(p.ly_do)    LIKE LOWER(CONCAT('%', :keyword, '%')) OR
            LOWER((SELECT sv.ho_ten FROM sinhvien sv WHERE sv.mssv = p.mssv)) LIKE LOWER(CONCAT('%', :keyword, '%'))
          )
          AND (CAST(:loaiPhieu AS loaiphieu) IS NULL OR p.loai_phieu = CAST(:loaiPhieu AS loaiphieu))
        """, nativeQuery = true)
    long countActive(
            @Param("keyword") String keyword,
            @Param("loaiPhieu") String loaiPhieu);

    /**
     * Lấy tất cả phiếu Mượn tạm thời đã đến hạn trả mà vẫn còn 'Đang mượn'.
     * Dùng cho scheduled job: tự động chuyển trạng thái sang 'Quá hạn'.
     */
    @Query(value = """
        SELECT * FROM phieu_xuat_ho_so
        WHERE loai_phieu = CAST('Mượn tạm thời' AS loaiphieu)
          AND trang_thai = CAST('Đang mượn' AS trangthaiphieu)
          AND ngay_tra_du_kien IS NOT NULL
          AND ngay_tra_du_kien < :today
        """, nativeQuery = true)
    List<PhieuXuatHoSo> findQuaHan(@Param("today") LocalDate today);

    /**
     * Lấy tất cả mã hồ sơ giấy tờ hiện có của 1 SV (dùng cho rule "Rút vĩnh viễn
     * = toàn bộ giấy tờ").
     */
    @Query(value = """
        SELECT ma_ho_so FROM ho_so_giay_to
        WHERE mssv = :mssv
        ORDER BY ma_ho_so
        """, nativeQuery = true)
    List<String> findMaHoSoByMssv(@Param("mssv") String mssv);

    /**
     * Native query cho danh sách hồ sơ đang mượn.
     *
     * Lý do dùng native (không phải JPQL/Specification):
     *  - trang_thai, loai_phieu là PostgreSQL ENUM. Khi bind String tham số qua JPA
     *    Criteria/Specification, Hibernate sinh `column = ?` với parameter varchar,
     *    PostgreSQL báo lỗi: operator does not exist: trangthaiphieu = character varying.
     *  - CAST(:p AS trangthaiphieu) ép kiểu tường minh sang ENUM literal.
     *
     * Lưu ý:
     *  - Tất cả tên cột/ENUM viết thường theo PostgreSQL convention.
     *  - ILIKE không dùng (Hibernate parser không hỗ trợ) → LOWER(...) LIKE LOWER(...).
     *  - Keyword tìm trên maPhieu, mssv, lyDo và hoTen (qua subquery).
     *  - Khi truyền null cho trangThai/loaiPhieu → bỏ qua filter đó (build query linh hoạt
     *    trong service).
     */
    @Query(value = """
        SELECT p.*
        FROM phieu_xuat_ho_so p
        WHERE (CAST(:trangThai AS trangthaiphieu) IS NULL OR p.trang_thai = CAST(:trangThai AS trangthaiphieu))
          AND (CAST(:loaiPhieu AS loaiphieu) IS NULL OR p.loai_phieu = CAST(:loaiPhieu AS loaiphieu))
          AND (:fromDate IS NULL OR p.ngay_tao >= CAST(:fromDate AS timestamp))
          AND (:toDate IS NULL OR p.ngay_tao <  CAST(:toDate AS timestamp) + INTERVAL '1 day')
          AND (
            :keyword IS NULL OR :keyword = '' OR
            LOWER(p.ma_phieu) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
            LOWER(p.mssv)     LIKE LOWER(CONCAT('%', :keyword, '%')) OR
            LOWER(p.ly_do)    LIKE LOWER(CONCAT('%', :keyword, '%')) OR
            LOWER((SELECT sv.ho_ten FROM sinhvien sv WHERE sv.mssv = p.mssv)) LIKE LOWER(CONCAT('%', :keyword, '%'))
          )
        ORDER BY p.ngay_tao DESC
        LIMIT :size OFFSET :offset
        """, nativeQuery = true)
    List<PhieuXuatHoSo> findByFilters(
            @Param("keyword") String keyword,
            @Param("trangThai") String trangThai,
            @Param("loaiPhieu") String loaiPhieu,
            @Param("fromDate") String fromDate,
            @Param("toDate") String toDate,
            @Param("size") int size,
            @Param("offset") int offset);

    @Query(value = """
        SELECT COUNT(*)
        FROM phieu_xuat_ho_so p
        WHERE (CAST(:trangThai AS trangthaiphieu) IS NULL OR p.trang_thai = CAST(:trangThai AS trangthaiphieu))
          AND (CAST(:loaiPhieu AS loaiphieu) IS NULL OR p.loai_phieu = CAST(:loaiPhieu AS loaiphieu))
          AND (:fromDate IS NULL OR p.ngay_tao >= CAST(:fromDate AS timestamp))
          AND (:toDate IS NULL OR p.ngay_tao <  CAST(:toDate AS timestamp) + INTERVAL '1 day')
          AND (
            :keyword IS NULL OR :keyword = '' OR
            LOWER(p.ma_phieu) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
            LOWER(p.mssv)     LIKE LOWER(CONCAT('%', :keyword, '%')) OR
            LOWER(p.ly_do)    LIKE LOWER(CONCAT('%', :keyword, '%')) OR
            LOWER((SELECT sv.ho_ten FROM sinhvien sv WHERE sv.mssv = p.mssv)) LIKE LOWER(CONCAT('%', :keyword, '%'))
          )
        """, nativeQuery = true)
    long countByFilters(
            @Param("keyword") String keyword,
            @Param("trangThai") String trangThai,
            @Param("loaiPhieu") String loaiPhieu,
            @Param("fromDate") String fromDate,
            @Param("toDate") String toDate);
}