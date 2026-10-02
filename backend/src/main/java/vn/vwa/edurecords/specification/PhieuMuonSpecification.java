package vn.vwa.edurecords.specification;

import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.jpa.domain.Specification;
import vn.vwa.edurecords.dto.request.PhieuMuonSearchRequest;
import vn.vwa.edurecords.entity.PhieuXuatHoSo;
import vn.vwa.edurecords.entity.SinhVien;

import java.util.ArrayList;
import java.util.List;

/**
 * Specification cho PhieuXuatHoSo — build dynamic WHERE theo filter request.
 *
 * Lưu ý:
 * - loaiphieu, trangthai là PostgreSQL ENUM. Khi bind qua cb.equal(String, Object) Hibernate gửi
 *   "column = ?" với parameter String; PostgreSQL sẽ cast String -> ENUM (so sánh literal).
 *   Đây là cùng cơ chế AGENTS.md mô tả ở mục 11 — vẫn ổn vì literal đã khớp enum value.
 * - Keyword search tìm trên: maPhieu, mssv, lyDo và hoTen (qua subquery).
 *   Subquery phù hợp hơn JOIN vì tránh duplicate row + không cần khai báo relationship.
 */
public class PhieuMuonSpecification {

    private PhieuMuonSpecification() {}

    public static Specification<PhieuXuatHoSo> withFilters(PhieuMuonSearchRequest req) {
        return (Root<PhieuXuatHoSo> root, CriteriaQuery<?> query, CriteriaBuilder cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Keyword: maPhieu | mssv | hoTen | lyDo
            if (req.hasKeyword()) {
                String kw = req.getKeyword().trim().toLowerCase();
                Predicate byMaPhieu = cb.like(cb.lower(root.get("maPhieu")), "%" + kw + "%");
                Predicate byMssv = cb.like(cb.lower(root.get("mssv")), "%" + kw + "%");
                Predicate byLyDo = cb.like(cb.lower(root.get("lyDo")), "%" + kw + "%");

                // Subquery: tìm hoTen của sinh viên có mssv = root.mssv
                Subquery<String> sub = query.subquery(String.class);
                Root<SinhVien> svRoot = sub.from(SinhVien.class);
                sub.select(cb.lower(svRoot.get("hoTen")))
                    .where(cb.equal(svRoot.get("mssv"), root.get("mssv")));
                Predicate byHoTen = cb.like(sub, "%" + kw + "%");

                predicates.add(cb.or(byMaPhieu, byMssv, byLyDo, byHoTen));
            }

            // Trạng thái phiếu ('Đang mượn' | 'Quá hạn' | ...)
            if (req.getTrangThai() != null && !req.getTrangThai().trim().isEmpty()) {
                predicates.add(cb.equal(root.get("trangThai"), req.getTrangThai().trim()));
            }

            // Loại phiếu ('Mượn tạm thời' | 'Rút vĩnh viễn')
            if (req.getLoaiHoSo() != null && !req.getLoaiHoSo().trim().isEmpty()) {
                predicates.add(cb.equal(root.get("loaiPhieu"), req.getLoaiHoSo().trim()));
            }

            // Sắp xếp mặc định: ngayTao DESC (phiếu mới nhất trước)
            query.orderBy(cb.desc(root.get("ngayTao")));

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}