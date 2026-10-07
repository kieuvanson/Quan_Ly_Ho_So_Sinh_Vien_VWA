package vn.vwa.edurecords.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import vn.vwa.edurecords.dto.request.SinhVienSearchRequest;
import vn.vwa.edurecords.dto.response.PagedResponse;
import vn.vwa.edurecords.entity.SinhVien;
import vn.vwa.edurecords.entity.enums.TrangThaiHocVu;
import vn.vwa.edurecords.exception.BadRequestException;
import vn.vwa.edurecords.repository.SinhVienRepository;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
public class SinhVienService {

    private static final Logger log = LoggerFactory.getLogger(SinhVienService.class);

    private final SinhVienRepository sinhVienRepository;
    private final SinhVienExcelService sinhVienExcelService;

    public SinhVienService(SinhVienRepository sinhVienRepository,
                           SinhVienExcelService sinhVienExcelService) {
        this.sinhVienRepository = sinhVienRepository;
        this.sinhVienExcelService = sinhVienExcelService;
    }

    /**
     * Tìm kiếm + lọc + phân trang sinh viên.
     *
     * Implementation: native SQL (cast ENUM String → ENUM literal) thay cho Specification,
     * vì Specification + cb.equal(String) gây lỗi
     * "operator does not exist: trangthaihocvu = character varying"
     * (xem AGENTS.md mục 11 + SinhVienRepository.findByFilters).
     */
    @Transactional(readOnly = true)
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

    /**
     * Kết quả import Excel.
     *
     * @param successCount  số sinh viên đã ghi thành công (thêm mới + cập nhật)
     * @param failureCount  số dòng bị loại
     * @param insertedCount số bản ghi mới
     * @param updatedCount  số bản ghi đã tồn tại và được cập nhật
     * @param errors        lỗi theo từng dòng để người dùng sửa lại file
     */
    public record ImportResult(
            int successCount,
            int failureCount,
            int insertedCount,
            int updatedCount,
            List<SinhVienExcelService.RowError> errors
    ) {}

    /**
     * Import danh sách sinh viên từ file Excel, upsert theo MSSV.
     *
     * <h3>Hành vi</h3>
     * <ul>
     *   <li>Ghi trong một transaction: nếu có lỗi dữ liệu không xử lý được thì
     *       rollback lô ghi thay vì để lại dữ liệu dở dang.</li>
     *   <li>MSSV trùng lặp trong cùng file chỉ giữ dòng đầu, dòng sau bị báo lỗi.</li>
     *   <li>CCCD trùng với sinh viên khác thì dòng đó bị loại và báo lỗi, vì CCCD
     *       là UNIQUE ở DB — một vi phạm sẽ làm hỏng cả lô import.</li>
     * </ul>
     */
    @Transactional
    public ImportResult importFromExcel(MultipartFile file) {
        SinhVienExcelService.ImportResult parsed;
        try {
            parsed = sinhVienExcelService.read(file);
        } catch (IOException e) {
            // File không đọc được (hỏng, không phải .xlsx hợp lệ, nén quá mức).
            // Chi tiết lỗi kỹ thuật chỉ ghi log, client nhận thông báo chung.
            log.error("Không đọc được file Excel import", e);
            throw new BadRequestException("IMPORT_FILE_INVALID",
                    "Không đọc được file Excel. Hãy tải mẫu và điền theo đúng định dạng.");
        }

        List<SinhVien> toInsert = new ArrayList<>();
        List<SinhVien> toUpdate = new ArrayList<>();
        List<SinhVienExcelService.RowError> errors = new ArrayList<>(parsed.errors());

        Set<String> seenMssv = new HashSet<>();
        Set<String> seenCccd = new HashSet<>();
        int nextRow = 0;

        for (SinhVien sv : parsed.sinhViens()) {
            nextRow++;
            if (!seenMssv.add(sv.getMssv())) {
                errors.add(new SinhVienExcelService.RowError(nextRow,
                        "MSSV " + sv.getMssv() + " bị lặp trong cùng file, bỏ qua dòng này."));
                continue;
            }

            if (sv.getCccd() != null && !sv.getCccd().isBlank()) {
                if (sinhVienRepository.existsByCccdAndMssvNot(sv.getCccd(), sv.getMssv())) {
                    errors.add(new SinhVienExcelService.RowError(nextRow,
                            "CCCD " + sv.getCccd() + " đã thuộc sinh viên khác, bỏ qua MSSV " + sv.getMssv() + "."));
                    continue;
                }
                if (!seenCccd.add(sv.getCccd())) {
                    errors.add(new SinhVienExcelService.RowError(nextRow,
                            "CCCD " + sv.getCccd() + " bị lặp trong cùng file, bỏ qua MSSV " + sv.getMssv() + "."));
                    continue;
                }
            }

            Optional<SinhVien> existing = sinhVienRepository.findById(sv.getMssv());
            if (existing.isPresent()) {
                copyEditableFields(existing.get(), sv);
                existing.get().setNgayCapNhat(LocalDateTime.now());
                toUpdate.add(existing.get());
            } else {
                sv.setNgayTao(LocalDateTime.now());
                toInsert.add(sv);
            }
        }

        if (!toInsert.isEmpty()) {
            sinhVienRepository.saveAll(toInsert);
        }
        if (!toUpdate.isEmpty()) {
            sinhVienRepository.saveAll(toUpdate);
        }

        return new ImportResult(toInsert.size() + toUpdate.size(), errors.size(),
                toInsert.size(), toUpdate.size(), errors);
    }

    /** Chỉ copy các trường người dùng được sửa qua import — không đụng khóa hay trạng thái hệ thống. */
    private void copyEditableFields(SinhVien target, SinhVien source) {
        target.setHoTen(source.getHoTen());
        target.setNgaySinh(source.getNgaySinh());
        target.setGioiTinh(source.getGioiTinh());
        target.setCccd(source.getCccd());
        target.setSdt(source.getSdt());
        target.setEmail(source.getEmail());
        target.setQueQuan(source.getQueQuan());
        target.setNganh(source.getNganh());
        target.setLop(source.getLop());
        target.setKhoa(source.getKhoa());
        target.setKhoaNamNhapHoc(source.getKhoaNamNhapHoc());
        target.setHeDaoTao(source.getHeDaoTao());
        if (source.getTrangThaiHocVu() != null) {
            target.setTrangThaiHocVu(source.getTrangThaiHocVu());
        }
    }

    private static String trimOrNull(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }
}