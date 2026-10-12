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
import vn.vwa.edurecords.dto.response.SinhVienResponse;
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
                : danhMucService.resolveNganhId(trimOrNull(req.getNganh()));
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

    /**
     * Tìm kiếm + lọc + phân trang, trả về DTO (SinhVienResponse).
     * Dùng cho API endpoint /api/sinh-vien để tránh expose JPA entity.
     */
    @Transactional(readOnly = true)
    public PagedResponse<List<SinhVienResponse>> searchResponse(SinhVienSearchRequest req) {
        // Tái sử dụng logic search nhưng convert sang DTO
        String keyword = trimOrNull(req.getKeyword());
        String trangThaiHocVu = trimOrNull(req.getTrangThaiHocVu());

        Integer nganhId = req.getNganhId() != null
                ? req.getNganhId()
                : danhMucService.resolveNganhId(trimOrNull(req.getNganh()));
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

        // Convert entities to DTOs
        List<SinhVienResponse> dtoList = content.stream()
                .map(SinhVienResponse::fromEntity)
                .toList();

        PagedResponse.PageMetadata meta = new PagedResponse.PageMetadata(page, size, total);
        return new PagedResponse<>(dtoList, meta);
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
     * Import danh sách sinh viên từ file Excel — chỉ thêm mới.
     *
     * <h3>Fail-fast mode (sau V7)</h3>
     * <p>Dừng import ngay khi gặp dòng lỗi đầu tiên. KHÔNG lưu bất kỳ dòng nào
     * vào DB. Trả về lỗi chi tiết (dòng, MSSV, lý do) để user sửa file và upload
     * lại.</p>
     *
     * <p>Trước đây (V6 và cũ hơn) dùng "best-effort": bỏ qua dòng lỗi, lưu dòng OK.
     * Điều này khiến user không biết mình đang import thiếu dữ liệu. Vì MSSV
     * còn lại sau cùng là không xác định được → fail-fast giúp user thấy ngay
     * lỗi và quyết định sửa hoặc xóa dòng đó trước khi import.</p>
     *
     * <h3>Quy tắc (giữ nguyên từ V6)</h3>
     * <ul>
     *   <li>KHÔNG tự tạo danh mục (Khoa/Ngành/Lớp/Khóa học). Nếu không tìm thấy → báo lỗi.</li>
     *   <li>MSSV đã tồn tại → báo trùng, KHÔNG ghi đè.</li>
     *   <li>CCCD trùng với SV khác → báo lỗi.</li>
     *   <li>MSSV / CCCD trùng trong chính file → báo lỗi.</li>
     *   <li>Thiếu thông tin bắt buộc → báo lỗi.</li>
     * </ul>
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

        // Nếu parser đã có lỗi → fail-fast ngay từ bước parse
        // (SinhVienExcelService.read() đã thu thập lỗi theo từng dòng)
        if (!parsed.errors().isEmpty()) {
            log.warn("importFromExcel: parser phát hiện {} lỗi. Fail-fast.", parsed.errors().size());
            return new ImportResult(0, parsed.errors().size(), 0, 0, parsed.errors());
        }

        int nextRow = 0;
        for (SinhVien sv : parsed.sinhViens()) {
            nextRow++;
            int excelRow = nextRow + 1; // +1 vì dòng 1 là header

            // Kiểm tra trùng MSSV trong file
            // (best-effort đã loại bỏ Set seenMssv — bây giờ fail-fast tại dòng lỗi đầu tiên)
            // Để giữ logic fail-fast, ta chuyển sang dùng Set local tại đây
            // và return ngay khi trùng.
            // Lưu ý: dùng single-pass không tối ưu bằng 2-pass, nhưng file import
            // giới hạn ~10MB nên không lo performance.

            // === Validate FK đã resolve ===
            if (sv.getKhoa() == null || sv.getNganh() == null
                    || sv.getLop() == null || sv.getKhoaHoc() == null) {
                List<SinhVienExcelService.RowError> errs = List.of(
                        new SinhVienExcelService.RowError(excelRow,
                                "Thiếu thông tin danh mục bắt buộc (Khoa/Ngành/Lớp/Khóa học) cho MSSV '"
                                        + sv.getMssv() + "'. Vui lòng kiểm tra lại tên Khoa/Ngành/Lớp/Khóa nhập học."));
                return new ImportResult(0, 1, 0, 0, errs);
            }

            // === CHỈ THÊM MỚI ===
            if (sinhVienRepository.existsById(sv.getMssv())) {
                List<SinhVienExcelService.RowError> errs = List.of(
                        new SinhVienExcelService.RowError(excelRow,
                                "MSSV '" + sv.getMssv() + "' đã tồn tại trong hệ thống. "
                                        + "Không ghi đè dữ liệu cũ."));
                return new ImportResult(0, 1, 0, 0, errs);
            }
        }

        // Đến đây: tất cả dòng đều pass validate. Còn phải check trùng MSSV/CCCD
        // trong chính file (2-pass để phát hiện lỗi sớm nhất).
        Set<String> seenMssv = new HashSet<>();
        Set<String> seenCccd = new HashSet<>();
        nextRow = 0;
        for (SinhVien sv : parsed.sinhViens()) {
            nextRow++;
            int excelRow = nextRow + 1;
            if (!seenMssv.add(sv.getMssv())) {
                List<SinhVienExcelService.RowError> errs = List.of(
                        new SinhVienExcelService.RowError(excelRow,
                                "MSSV '" + sv.getMssv() + "' bị lặp trong cùng file, "
                                        + "ở dòng " + excelRow + ". Vui lòng sửa file Excel."));
                return new ImportResult(0, 1, 0, 0, errs);
            }
            if (sv.getCccd() != null && !sv.getCccd().isBlank()) {
                if (sinhVienRepository.existsByCccdAndMssvNot(sv.getCccd(), sv.getMssv())) {
                    List<SinhVienExcelService.RowError> errs = List.of(
                            new SinhVienExcelService.RowError(excelRow,
                                    "CCCD '" + sv.getCccd() + "' đã thuộc sinh viên khác, "
                                            + "ở dòng " + excelRow + " (MSSV '" + sv.getMssv() + "')."));
                    return new ImportResult(0, 1, 0, 0, errs);
                }
                if (!seenCccd.add(sv.getCccd())) {
                    List<SinhVienExcelService.RowError> errs = List.of(
                            new SinhVienExcelService.RowError(excelRow,
                                    "CCCD '" + sv.getCccd() + "' bị lặp trong cùng file, "
                                            + "ở dòng " + excelRow + " (MSSV '" + sv.getMssv() + "')."));
                    return new ImportResult(0, 1, 0, 0, errs);
                }
            }
        }

        // Tất cả validate xong → ghi DB (single saveAll)
        List<SinhVien> toInsert = new ArrayList<>();
        for (SinhVien sv : parsed.sinhViens()) {
            sv.setNgayTao(LocalDateTime.now());
            toInsert.add(sv);
        }
        sinhVienRepository.saveAll(toInsert);

        log.info("importFromExcel: ghi thành công {} sinh viên (fail-fast mode).", toInsert.size());
        return new ImportResult(toInsert.size(), 0, toInsert.size(), 0, List.of());
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
