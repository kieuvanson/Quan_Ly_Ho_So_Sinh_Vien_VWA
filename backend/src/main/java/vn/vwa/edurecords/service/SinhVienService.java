package vn.vwa.edurecords.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import vn.vwa.edurecords.dto.request.SinhVienSearchRequest;
import vn.vwa.edurecords.dto.response.PagedResponse;
import vn.vwa.edurecords.entity.SinhVien;
import vn.vwa.edurecords.entity.enums.TrangThaiHocVu;
import vn.vwa.edurecords.repository.SinhVienRepository;
import vn.vwa.edurecords.specification.SinhVienSpecification;

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
     * Tất cả filter được áp dụng đồng thời (AND).
     */
    public PagedResponse<List<SinhVien>> search(SinhVienSearchRequest req) {
        Pageable pageable = PageRequest.of(req.getPage(), req.getSize());
        Page<SinhVien> page = sinhVienRepository.findAll(
            SinhVienSpecification.withFilters(req),
            pageable
        );

        PagedResponse.PageMetadata meta = new PagedResponse.PageMetadata(
            page.getNumber(),
            page.getSize(),
            page.getTotalElements()
        );
        return new PagedResponse<>(page.getContent(), meta);
    }

    /**
     * Lấy tất cả sinh viên (không phân trang).
     */
    public java.util.List<SinhVien> getAll() {
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
}
