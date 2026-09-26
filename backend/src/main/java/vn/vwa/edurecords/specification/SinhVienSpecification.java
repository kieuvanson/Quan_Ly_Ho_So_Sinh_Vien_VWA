package vn.vwa.edurecords.specification;

import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import org.springframework.data.jpa.domain.Specification;
import vn.vwa.edurecords.dto.request.SinhVienSearchRequest;
import vn.vwa.edurecords.entity.SinhVien;

import java.util.ArrayList;
import java.util.List;

public class SinhVienSpecification {

    private SinhVienSpecification() {}

    public static Specification<SinhVien> withFilters(SinhVienSearchRequest req) {
        return (Root<SinhVien> root, CriteriaQuery<?> query, CriteriaBuilder cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Tìm kiếm keyword (họ tên hoặc MSSV, LIKE, không phân biệt hoa thường)
            if (req.hasKeyword()) {
                String kw = req.getKeyword().trim().toLowerCase();
                Predicate byName = cb.like(cb.lower(root.get("hoTen")), "%" + kw + "%");
                Predicate byMssv = cb.like(cb.lower(root.get("mssv")), "%" + kw + "%");
                predicates.add(cb.or(byName, byMssv));
            }

            // Lọc theo trạng thái học vụ
            if (req.getTrangThaiHocVu() != null && !req.getTrangThaiHocVu().trim().isEmpty()) {
                predicates.add(cb.equal(
                    root.get("trangThaiHocVu"),
                    req.getTrangThaiHocVu().trim()
                ));
            }

            // Lọc theo ngành
            if (req.getNganh() != null && !req.getNganh().trim().isEmpty()) {
                predicates.add(cb.equal(root.get("nganh"), req.getNganh().trim()));
            }

            // Lọc theo lớp
            if (req.getLop() != null && !req.getLop().trim().isEmpty()) {
                predicates.add(cb.equal(root.get("lop"), req.getLop().trim()));
            }

            // Lọc theo khóa/năm nhập học
            if (req.getKhoaNamNhapHoc() != null && !req.getKhoaNamNhapHoc().trim().isEmpty()) {
                predicates.add(cb.equal(root.get("khoaNamNhapHoc"), req.getKhoaNamNhapHoc().trim()));
            }

            // Lọc theo khoa
            if (req.getKhoa() != null && !req.getKhoa().trim().isEmpty()) {
                predicates.add(cb.equal(root.get("khoa"), req.getKhoa().trim()));
            }

            // Lọc theo hệ đào tạo
            if (req.getHeDaoTao() != null && !req.getHeDaoTao().trim().isEmpty()) {
                predicates.add(cb.equal(root.get("heDaoTao"), req.getHeDaoTao().trim()));
            }

            // Sắp xếp mặc định: ngày tạo giảm dần (mới nhất trước)
            if (req.getSortDirection() == 1) {
                query.orderBy(cb.asc(root.get("ngayTao")));
            } else {
                query.orderBy(cb.desc(root.get("ngayTao")));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
