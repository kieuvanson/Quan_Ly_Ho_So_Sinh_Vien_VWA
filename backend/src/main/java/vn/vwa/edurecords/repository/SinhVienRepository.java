package vn.vwa.edurecords.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;
import vn.vwa.edurecords.entity.SinhVien;
import vn.vwa.edurecords.entity.enums.TrangThaiHocVu;

@Repository
public interface SinhVienRepository extends JpaRepository<SinhVien, String>, JpaSpecificationExecutor<SinhVien> {

    // Dùng enum - Hibernate tự cast qua AttributeConverter
    java.util.List<SinhVien> findByTrangThaiHocVu(TrangThaiHocVu trangThaiHocVu);

    long countByTrangThaiHocVu(TrangThaiHocVu trangThaiHocVu);
}
