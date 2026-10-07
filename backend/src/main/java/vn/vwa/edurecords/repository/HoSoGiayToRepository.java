package vn.vwa.edurecords.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.vwa.edurecords.entity.HoSoGiayTo;

import java.util.List;
import java.util.Optional;

@Repository
public interface HoSoGiayToRepository extends JpaRepository<HoSoGiayTo, String> {
    
    List<HoSoGiayTo> findByMssv(String mssv);
    
    Optional<HoSoGiayTo> findByMssvAndMaLoai(String mssv, String maLoai);
    
    long countByMssv(String mssv);
}
