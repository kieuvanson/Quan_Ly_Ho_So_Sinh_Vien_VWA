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
import vn.vwa.edurecords.entity.Khoa;
import vn.vwa.edurecords.entity.KhoaHoc;
import vn.vwa.edurecords.entity.Lop;
import vn.vwa.edurecords.entity.Nganh;
import vn.vwa.edurecords.entity.SinhVien;
import vn.vwa.edurecords.entity.enums.TrangThaiHocVu;
import vn.vwa.edurecords.exception.BadRequestException;
import vn.vwa.edurecords.repository.KhoaHocRepository;
import vn.vwa.edurecords.repository.KhoaRepository;
import vn.vwa.edurecords.repository.LopRepository;
import vn.vwa.edurecords.repository.NganhRepository;
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
    private final DanhMucService danhMucService;
    private final KhoaRepository khoaRepository;
    private final NganhRepository nganhRepository;
    private final KhoaHocRepository khoaHocRepository;
    private final LopRepository lopRepository;

    public SinhVienService(SinhVienRepository sinhVienRepository,
                           SinhVienExcelService sinhVienExcelService,
                           DanhMucService danhMucService,
                           KhoaRepository khoaRepository,
                           NganhRepository nganhRepository,
                           KhoaHocRepository khoaHocRepository,
                           LopRepository lopRepository) {
        this.sinhVienRepository = sinhVienRepository;
        this.sinhVienExcelService = sinhVienExcelService;
        this.danhMucService = danhMucService;
        this.khoaRepository = khoaRepository;
        this.nganhRepository = nganhRepository;
        this.khoaHocRepository = khoaHocRepository;
        this.lopRepository = lopRepository;
    }

    /**
     * Tìm kiếm + lọc + phân trang sinh viên.
     *
     * <p>Sau V4: filter dùng {@code *_id} (Integer). Nếu client cũ vẫn gửi String
     * trong {@link SinhVienSearchRequest}, service tự resolve sang id qua
     * {@link DanhMucService}.</p>
     */
    @Transactional(readOnly = true)
    public PagedResponse<List<SinhVien>> search(SinhVienSearchRequest req) {
        String keyword = trimOrNull(req.getKeyword());
        String trangThaiHocVu = trimOrNull(req.getTrangThaiHocVu());

        // Ưu tiên id đã resolve sẵn từ controller. Nếu chưa có thì thử resolve
        // từ text (mã/tên) — controller thường đã làm rồi, đây là fallback.
        Integer nganhId = req.getNganhId() != null
                ? req.getNganhId()
                : danhMucService.resolveNganhId(trimOrNull(req.getNganh()), req.getKhoaId());
        Integer lopId = req.getLopId() != null
                ? req.getLopId()
                : danhMucService.resolveLopId(trimOrNull(req.getLop()), nganhId, req.getKhoaHocId());
        Integer khoaHocId = req.getKhoaHocId() != null
                ? req.getKhoaHocId()
                : danhMucService.resolveKhoaHocId(trimOrNull(req.getKhoaNamNhapHoc()));
        Integer khoaId = req.getKhoaId() != null
                ? req.getKhoaId()
                : danhMucService.resolveKhoaId(trimOrNull(req.getKhoa()));
        String heDaoTao = trimOrNull(req.getHeDaoTao());

        int page = Math.max(0, req.getPage());
        int size = Math.max(1, req.getSize());
        int offset = page * size;

        long total = sinhVienRepository.countByFilters(
                keyword, trangThaiHocVu, nganhId, lopId, khoaHocId, khoaId, heDaoTao);

        List<SinhVien> content = total == 0
                ? Collections.emptyList()
                : sinhVienRepository.findByFilters(
                        keyword, trangThaiHocVu, nganhId, lopId, khoaHocId, khoaId, heDaoTao,
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

    public List<SinhVien> getAll() {
        return sinhVienRepository.findAll();
    }

    public Optional<SinhVien> getByMssv(String mssv) {
        return sinhVienRepository.findById(mssv);
    }

    public long getTotalCount() {
        return sinhVienRepository.count();
    }

    public long countByTrangThai(String trangThaiHocVu) {
        TrangThaiHocVu trangThai = TrangThaiHocVu.fromDisplayName(trangThaiHocVu);
        return sinhVienRepository.countByTrangThaiHocVu(trangThai);
    }

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
     * <p>Sau V4: Excel vẫn ghi text (Khoa/Ngành/Lớp/Khóa) để người dùng cuối
     * không cần biết id. Service tự lookup / tạo danh mục qua
     * {@link DanhMucService} rồi gắn FK vào SinhVien. Nếu thiếu thông tin danh
     * mục bắt buộc → dòng bị loại và báo lỗi chi tiết.</p>
     */
    @Transactional
    public ImportResult importFromExcel(MultipartFile file) {
        SinhVienExcelService.ImportResult parsed;
        try {
            parsed = sinhVienExcelService.read(file);
        } catch (IOException e) {
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

            // Sau V4: Excel chỉ chứa TEXT (Khoa/Ngành/Lớp/Khóa), SinhVienExcelService
            // tạm set text vào các field VARCHAR. Ở đây resolve sang FK entity.
            // Nếu dòng đã set *_id (qua API), giữ nguyên.
            if (sv.getKhoa() == null || sv.getNganh() == null
                    || sv.getLop() == null || sv.getKhoaHoc() == null) {
                errors.add(new SinhVienExcelService.RowError(nextRow,
                        "Thiếu thông tin danh mục bắt buộc (Khoa/Ngành/Lớp/Khóa học) cho MSSV "
                                + sv.getMssv() + "."));
                continue;
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
        target.setKhoa(source.getKhoa());
        target.setNganh(source.getNganh());
        target.setLop(source.getLop());
        target.setKhoaHoc(source.getKhoaHoc());
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
