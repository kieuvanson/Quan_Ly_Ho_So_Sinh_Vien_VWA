package vn.vwa.edurecords.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import vn.vwa.edurecords.entity.SinhVien;

@Repository
public interface SinhVienRepository extends JpaRepository<SinhVien, String>, JpaSpecificationExecutor<SinhVien> {

    @Query(value = "SELECT * FROM sinhvien WHERE trang_thai_hoc_vu = CAST(:trangThaiHocVu AS trangthaihocvu) ORDER BY ngay_tao DESC", nativeQuery = true)
    java.util.List<SinhVien> findByTrangThaiHocVu(String trangThaiHocVu);

    @Query(value = "SELECT COUNT(*) FROM sinhvien WHERE trang_thai_hoc_vu = CAST(:trangThaiHocVu AS trangthaihocvu)", nativeQuery = true)
    long countByTrangThaiHocVu(String trangThaiHocVu);
}
