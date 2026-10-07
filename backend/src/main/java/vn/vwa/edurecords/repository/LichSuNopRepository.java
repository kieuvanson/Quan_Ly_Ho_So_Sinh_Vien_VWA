package vn.vwa.edurecords.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.vwa.edurecords.entity.LichSuNop;

import java.util.List;

@Repository
public interface LichSuNopRepository extends JpaRepository<LichSuNop, String> {
    
    List<LichSuNop> findByMaHoSoOrderByThoiGianDesc(String maHoSo);
    
    List<LichSuNop> findByMssvOrderByThoiGianDesc(String mssv);
    
    Page<LichSuNop> findByMssvOrderByThoiGianDesc(String mssv, Pageable pageable);
    
    List<LichSuNop> findByMaHoSoAndHanhDongOrderByThoiGianDesc(String maHoSo, String hanhDong);
}
