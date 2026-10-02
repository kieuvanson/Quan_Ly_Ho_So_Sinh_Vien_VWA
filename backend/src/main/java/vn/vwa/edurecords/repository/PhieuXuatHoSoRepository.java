package vn.vwa.edurecords.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.vwa.edurecords.entity.PhieuXuatHoSo;

import java.util.List;

@Repository
public interface PhieuXuatHoSoRepository
        extends JpaRepository<PhieuXuatHoSo, String>,
                JpaSpecificationExecutor<PhieuXuatHoSo> {

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