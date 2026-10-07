package vn.vwa.edurecords.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.vwa.edurecords.entity.SinhVien;
import vn.vwa.edurecords.entity.enums.TrangThaiHocVu;

import java.util.List;

@Repository
public interface SinhVienRepository extends JpaRepository<SinhVien, String> {

    // Dùng enum - Hibernate tự cast qua AttributeConverter
    List<SinhVien> findByTrangThaiHocVu(TrangThaiHocVu trangThaiHocVu);

    long countByTrangThaiHocVu(TrangThaiHocVu trangThaiHocVu);

    /**
     * Kiểm tra CCCD đã thuộc sinh viên khác chưa.
     *
     * Cột {@code cccd} có ràng buộc UNIQUE trong DB. Khi import hàng loạt, một
     * dòng trùng CCCD sẽ làm hỏng cả lô ghi, nên phải kiểm tra trước và báo lỗi
     * theo từng dòng thay vì để ngoại lệ SQL lan ra.
     */
    boolean existsByCccdAndMssvNot(String cccd, String mssv);

    // ============================================================
    // Native query cho search/filter (sau V4: dùng *_id)
    // ============================================================
    //
    // Lý do dùng native thay vì Specification + cb.equal:
    //   - trang_thai_hoc_vu là PostgreSQL ENUM. Khi bind String qua
    //     JPA Criteria, Hibernate sinh `column = ?` với parameter varchar;
    //     PostgreSQL báo lỗi: operator does not exist: trangthaihocvu = character varying
    //     (AGENTS.md mục 11).
    //   - CAST(:p AS trangthaihocvu) ép kiểu tường minh sang ENUM literal.
    //
    // Lưu ý:
    //   - Tất cả tên cột/ENUM viết thường theo PostgreSQL convention.
    //   - ILIKE không dùng (Hibernate parser không hỗ trợ) → LOWER(...) LIKE LOWER(...).
    //   - Filter *_id: nếu truyền null/rỗng → bỏ qua filter.
    //   - Sau V4, các filter `nganh`, `lop`, `khoa`, `khoaNamNhapHoc` thực chất
    //     là *_id từ bảng danh mục. Đổi kiểu param từ String → Integer.

    @Query(value = """
        SELECT s.*
        FROM sinhvien s
        WHERE (CAST(:trangThaiHocVu AS trangthaihocvu) IS NULL OR s.trang_thai_hoc_vu = CAST(:trangThaiHocVu AS trangthaihocvu))
          AND (:nganhId     IS NULL OR s.nganh_id    = :nganhId)
          AND (:lopId       IS NULL OR s.lop_id      = :lopId)
          AND (:khoaHocId   IS NULL OR s.khoa_hoc_id = :khoaHocId)
          AND (:khoaId      IS NULL OR s.khoa_id     = :khoaId)
          AND (:heDaoTao IS NULL OR :heDaoTao = '' OR LOWER(s.he_dao_tao) = LOWER(:heDaoTao))
          AND (
            :keyword IS NULL OR :keyword = '' OR
            LOWER(s.ho_ten) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
            LOWER(s.mssv)   LIKE LOWER(CONCAT('%', :keyword, '%'))
          )
        ORDER BY s.ngay_tao DESC
        LIMIT :size OFFSET :offset
        """, nativeQuery = true)
    List<SinhVien> findByFilters(
            @Param("keyword") String keyword,
            @Param("trangThaiHocVu") String trangThaiHocVu,
            @Param("nganhId") Integer nganhId,
            @Param("lopId") Integer lopId,
            @Param("khoaHocId") Integer khoaHocId,
            @Param("khoaId") Integer khoaId,
            @Param("heDaoTao") String heDaoTao,
            @Param("size") int size,
            @Param("offset") int offset);

    @Query(value = """
        SELECT COUNT(*)
        FROM sinhvien s
        WHERE (CAST(:trangThaiHocVu AS trangthaihocvu) IS NULL OR s.trang_thai_hoc_vu = CAST(:trangThaiHocVu AS trangthaihocvu))
          AND (:nganhId     IS NULL OR s.nganh_id    = :nganhId)
          AND (:lopId       IS NULL OR s.lop_id      = :lopId)
          AND (:khoaHocId   IS NULL OR s.khoa_hoc_id = :khoaHocId)
          AND (:khoaId      IS NULL OR s.khoa_id     = :khoaId)
          AND (:heDaoTao IS NULL OR :heDaoTao = '' OR LOWER(s.he_dao_tao) = LOWER(:heDaoTao))
          AND (
            :keyword IS NULL OR :keyword = '' OR
            LOWER(s.ho_ten) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
            LOWER(s.mssv)   LIKE LOWER(CONCAT('%', :keyword, '%'))
          )
        """, nativeQuery = true)
    long countByFilters(
            @Param("keyword") String keyword,
            @Param("trangThaiHocVu") String trangThaiHocVu,
            @Param("nganhId") Integer nganhId,
            @Param("lopId") Integer lopId,
            @Param("khoaHocId") Integer khoaHocId,
            @Param("khoaId") Integer khoaId,
            @Param("heDaoTao") String heDaoTao);
}
