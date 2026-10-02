package vn.vwa.edurecords.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import vn.vwa.edurecords.dto.request.SinhVienSearchRequest;
import vn.vwa.edurecords.dto.response.PagedResponse;
import vn.vwa.edurecords.entity.SinhVien;
import vn.vwa.edurecords.entity.enums.TrangThaiHocVu;
import vn.vwa.edurecords.repository.SinhVienRepository;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Service
public class SinhVienService {

    private final SinhVienRepository sinhVienRepository;

    public SinhVienService(SinhVienRepository sinhVienRepository) {
        this.sinhVienRepository = sinhVienRepository;
    }

    /**
     * Tìm kiếm + lọc + phân trang sinh viên.
     *
     * Implementation: native SQL (cast ENUM String → ENUM literal) thay cho Specification,
     * vì Specification + cb.equal(String) gây lỗi
     * "operator does not exist: trangthaihocvu = character varying"
     * (xem AGENTS.md mục 11 + SinhVienRepository.findByFilters).
     */
    public PagedResponse<List<SinhVien>> search(SinhVienSearchRequest req) {
        String keyword = trimOrNull(req.getKeyword());
        String trangThaiHocVu = trimOrNull(req.getTrangThaiHocVu());
        String nganh = trimOrNull(req.getNganh());
        String lop = trimOrNull(req.getLop());
        String khoaNamNhapHoc = trimOrNull(req.getKhoaNamNhapHoc());
        String khoa = trimOrNull(req.getKhoa());
        String heDaoTao = trimOrNull(req.getHeDaoTao());

        int page = Math.max(0, req.getPage());
        int size = Math.max(1, req.getSize());
        int offset = page * size;

        long total = sinhVienRepository.countByFilters(
                keyword, trangThaiHocVu, nganh, lop, khoaNamNhapHoc, khoa, heDaoTao);

        List<SinhVien> content = total == 0
                ? Collections.emptyList()
                : sinhVienRepository.findByFilters(
                        keyword, trangThaiHocVu, nganh, lop, khoaNamNhapHoc, khoa, heDaoTao,
                        size, offset);

        Pageable pageable = PageRequest.of(page, size);
        Page<SinhVien> pageResult = new PageImpl<>(content, pageable, total);

        PagedResponse.PageMetadata meta = new PagedResponse.PageMetadata(
            pageResult.getNumber(),
            pageResult.getSize(),
            pageResult.getTotalElements()
        );
        return new PagedResponse<>(pageResult.getContent(), meta);
    }

    /**
     * Lấy tất cả sinh viên (không phân trang).
     */
    public List<SinhVien> getAll() {
        return sinhVienRepository.findAll();
    }

    /**
     * Lấy chi tiết sinh viên theo MSSV.
     */
    public Optional<SinhVien> getByMssv(String mssv) {
        return sinhVienRepository.findById(mssv);
    }

    /**
     * Đếm tổng sinh viên.
     */
    public long getTotalCount() {
        return sinhVienRepository.count();
    }

    /**
     * Đếm sinh viên theo trạng thái học vụ.
     * Truyền vào displayName tiếng Việt (vd: "Đang học") khớp với giá trị ENUM trong DB.
     * Service sẽ convert sang enum để Hibernate tự cast qua TrangThaiHocVuConverter.
     */
    public long countByTrangThai(String trangThaiHocVu) {
        TrangThaiHocVu trangThai = TrangThaiHocVu.fromDisplayName(trangThaiHocVu);
        return sinhVienRepository.countByTrangThaiHocVu(trangThai);
    }

    private static String trimOrNull(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }
}