package vn.vwa.edurecords.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.vwa.edurecords.dto.request.KhoaHocRequest;
import vn.vwa.edurecords.dto.request.KhoaRequest;
import vn.vwa.edurecords.dto.request.LopRequest;
import vn.vwa.edurecords.dto.request.NganhRequest;
import vn.vwa.edurecords.dto.response.KhoaHocResponse;
import vn.vwa.edurecords.dto.response.KhoaResponse;
import vn.vwa.edurecords.dto.response.LopResponse;
import vn.vwa.edurecords.dto.response.NganhResponse;
import vn.vwa.edurecords.entity.Khoa;
import vn.vwa.edurecords.entity.KhoaHoc;
import vn.vwa.edurecords.entity.Lop;
import vn.vwa.edurecords.entity.Nganh;
import vn.vwa.edurecords.exception.BadRequestException;
import vn.vwa.edurecords.exception.ResourceNotFoundException;
import vn.vwa.edurecords.repository.KhoaHocRepository;
import vn.vwa.edurecords.repository.KhoaRepository;
import vn.vwa.edurecords.repository.LopRepository;
import vn.vwa.edurecords.repository.NganhRepository;

import java.util.List;
import java.util.Optional;

/**
 * Service dùng chung cho các danh mục: Khoa, Ngành, Khóa học, Lớp.
 *
 * Sau chuẩn hóa: Ngành BẮT BUỘC thuộc một Khoa chuyên môn.
 * Tìm ngành theo (tên ngành, khoa_id) vì tên ngành có thể trùng giữa các khoa.
 *
 * <h3>Quy tắc</h3>
 * <ul>
 *   <li>Mã tự sinh theo pattern {@code KHOAxx} / {@code NGANHxxx} / {@code KHxx}
 *       / {@code LOPxxx} để tránh trùng mã do seed tay.</li>
 *   <li>Lookup theo tên dùng {@code IgnoreCase} + {@code TRIM} để chịu được
 *       dữ liệu Excel có khoảng trắng thừa hoặc khác hoa thường.</li>
 *   <li>Lookup {@code Nganh} theo (tên ngành, khoa_id) vì ngành bắt buộc thuộc khoa.</li>
 *   <li>Lookup {@code Lop} cần biết {@code nganh} + {@code khoaHoc}.</li>
 * </ul>
 */
@Service
public class DanhMucService {

    private final KhoaRepository khoaRepository;
    private final NganhRepository nganhRepository;
    private final KhoaHocRepository khoaHocRepository;
    private final LopRepository lopRepository;

    public DanhMucService(KhoaRepository khoaRepository,
                          NganhRepository nganhRepository,
                          KhoaHocRepository khoaHocRepository,
                          LopRepository lopRepository) {
        this.khoaRepository = khoaRepository;
        this.nganhRepository = nganhRepository;
        this.khoaHocRepository = khoaHocRepository;
        this.lopRepository = lopRepository;
    }

    // ====================== LIST (cho dropdown) ======================

    @Transactional(readOnly = true)
    public List<Khoa> listKhoa() {
        return khoaRepository.findByDangSuDungTrueOrderByTenKhoaAsc();
    }

    @Transactional(readOnly = true)
    public List<Nganh> listNganh() {
        return nganhRepository.findByDangSuDungTrueOrderByTenNganhAsc();
    }

    @Transactional(readOnly = true)
    public List<Nganh> listNganhByKhoa(Integer khoaId) {
        if (khoaId == null) return listNganh();
        return nganhRepository.findByKhoa_IdAndDangSuDungTrueOrderByTenNganhAsc(khoaId);
    }

    @Transactional(readOnly = true)
    public List<KhoaHoc> listKhoaHoc() {
        return khoaHocRepository.findByDangSuDungTrueOrderByTenKhoaHocAsc();
    }

    @Transactional(readOnly = true)
    public List<Lop> listLop() {
        return lopRepository.findByDangSuDungTrueOrderByTenLopAsc();
    }

    @Transactional(readOnly = true)
    public List<Lop> listLopByNganh(Integer nganhId) {
        if (nganhId == null) return listLop();
        return lopRepository.findByNganh_IdAndDangSuDungTrueOrderByTenLopAsc(nganhId);
    }

    // ====================== LOOKUP THEO TÊN/MÃ (KHÔNG TẠO MỚI) ======================

    /**
     * Tìm Khoa theo tên. KHÔNG tạo mới nếu không tìm thấy.
     *
     * @param tenKhoa Tên khoa cần tra (ignore case, trim).
     * @return Khoa nếu tìm thấy, empty nếu không.
     */
    @Transactional(readOnly = true)
    public Optional<Khoa> findKhoaByTen(String tenKhoa) {
        if (tenKhoa == null) return Optional.empty();
        String ten = tenKhoa.trim();
        if (ten.isEmpty()) return Optional.empty();
        return khoaRepository.findByTenKhoaIgnoreCase(ten);
    }

    /**
     * Tìm Ngành theo tên (không cần Khoa, sau V6).
     *
     * @param tenNganh Tên ngành (ignore case, trim).
     * @return Nganh nếu tìm thấy, empty nếu không.
     */
    @Transactional(readOnly = true)
    public Optional<Nganh> findNganhByTen(String tenNganh) {
        if (tenNganh == null) return Optional.empty();
        String ten = tenNganh.trim();
        if (ten.isEmpty()) return Optional.empty();
        // Tìm theo tên ngành (không cần khoa vì ngành độc lập sau V6)
        return nganhRepository.findAll().stream()
                .filter(n -> n.getTenNganh() != null
                        && n.getTenNganh().equalsIgnoreCase(ten))
                .findFirst();
    }

    /**
     * Tìm Khóa học theo tên. KHÔNG tạo mới.
     *
     * @param tenKhoaHoc Tên khóa học (ignore case, trim).
     * @return KhoaHoc nếu tìm thấy, empty nếu không.
     */
    @Transactional(readOnly = true)
    public Optional<KhoaHoc> findKhoaHocByTen(String tenKhoaHoc) {
        if (tenKhoaHoc == null) return Optional.empty();
        String ten = tenKhoaHoc.trim();
        if (ten.isEmpty()) return Optional.empty();
        return khoaHocRepository.findByTenKhoaHocIgnoreCase(ten);
    }

    /**
     * Tìm Lớp theo (tên, ngành, khóa học). KHÔNG tạo mới.
     *
     * @param tenLop   Tên lớp (ignore case, trim).
     * @param nganh    Ngành cha.
     * @param khoaHoc  Khóa học cha.
     * @return Lop nếu tìm thấy, empty nếu không.
     */
    @Transactional(readOnly = true)
    public Optional<Lop> findLopByTen(String tenLop, Nganh nganh, KhoaHoc khoaHoc) {
        if (tenLop == null || nganh == null || khoaHoc == null) return Optional.empty();
        String ten = tenLop.trim();
        if (ten.isEmpty()) return Optional.empty();
        return lopRepository.findFirstByTenLopIgnoreCaseAndNganh_IdAndKhoaHoc_Id(
                ten, nganh.getId(), khoaHoc.getId());
    }

    // ====================== RESOLVE TEXT → ID (cho filter) ======================

    /**
     * Nhận {@code String} (id dạng số / mã / tên) → trả về {@code Integer id}
     * hoặc {@code null} nếu không tìm thấy / input rỗng.
     */
    @Transactional(readOnly = true)
    public Integer resolveKhoaId(String input) {
        if (input == null || input.isBlank()) return null;
        String s = input.trim();
        // 1) Thử id
        try {
            Integer id = Integer.parseInt(s);
            if (khoaRepository.existsById(id)) return id;
        } catch (NumberFormatException ignore) { /* không phải số */ }
        // 2) Thử mã
        Optional<Khoa> byMa = khoaRepository.findByMaKhoa(s);
        if (byMa.isPresent()) return byMa.get().getId();
        // 3) Thử tên
        Optional<Khoa> byTen = khoaRepository.findByTenKhoaIgnoreCase(s);
        return byTen.map(Khoa::getId).orElse(null);
    }

    @Transactional(readOnly = true)
    public Integer resolveKhoaHocId(String input) {
        if (input == null || input.isBlank()) return null;
        String s = input.trim();
        try {
            Integer id = Integer.parseInt(s);
            if (khoaHocRepository.existsById(id)) return id;
        } catch (NumberFormatException ignore) { /* */ }
        Optional<KhoaHoc> byMa = khoaHocRepository.findByMaKhoaHoc(s);
        if (byMa.isPresent()) return byMa.get().getId();
        Optional<KhoaHoc> byTen = khoaHocRepository.findByTenKhoaHocIgnoreCase(s);
        return byTen.map(KhoaHoc::getId).orElse(null);
    }

    /**
     * Resolve {@code nganh}: tìm theo mã hoặc tên (sau V6 không cần khoaId).
     */
    @Transactional(readOnly = true)
    public Integer resolveNganhId(String input) {
        if (input == null || input.isBlank()) return null;
        String s = input.trim();
        // 1) Thử id
        try {
            Integer id = Integer.parseInt(s);
            if (nganhRepository.existsById(id)) return id;
        } catch (NumberFormatException ignore) { /* */ }
        // 2) Thử mã ngành
        Optional<Nganh> byMa = nganhRepository.findByMaNganh(s);
        if (byMa.isPresent()) return byMa.get().getId();
        // 3) Thử tên ngành (sau V6: không cần khoaId)
        return nganhRepository.findAll().stream()
                .filter(n -> n.getTenNganh() != null
                        && n.getTenNganh().equalsIgnoreCase(s))
                .findFirst()
                .map(Nganh::getId)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public Integer resolveLopId(String input, Integer nganhId, Integer khoaHocId) {
        if (input == null || input.isBlank()) return null;
        String s = input.trim();
        try {
            Integer id = Integer.parseInt(s);
            if (lopRepository.existsById(id)) return id;
        } catch (NumberFormatException ignore) { /* */ }
        Optional<Lop> byMa = lopRepository.findByMaLop(s);
        if (byMa.isPresent()) return byMa.get().getId();
        if (nganhId != null && khoaHocId != null) {
            Optional<Lop> byAll = lopRepository
                    .findFirstByTenLopIgnoreCaseAndNganh_IdAndKhoaHoc_Id(s, nganhId, khoaHocId);
            if (byAll.isPresent()) return byAll.get().getId();
        }
        return lopRepository.findAll().stream()
                .filter(l -> l.getTenLop() != null
                        && l.getTenLop().equalsIgnoreCase(s))
                .findFirst()
                .map(Lop::getId)
                .orElse(null);
    }

    // ====================== SINH MÃ TỰ ĐỘNG ======================

    /**
     * Sinh mã khoa {@code KHOAxx} dựa trên MAX(st) + 1 (không phải count()+1).
     *
     * <p>Trước đây dùng {@code count()+1} nhưng có 2 lỗi:
     * <ul>
     *   <li>Record bị xóa → count giảm → count+1 có thể trùng mã cũ.</li>
     *   <li>Concurrent insert → hai thread cùng nhìn count=5 → cùng sinh KHOA06.</li>
     * </ul>
     *
     * <p>MAX+1 cũng không triệtám race condition hoàn toàn (vẫn có thể
     * concurrent insert cùng MAX=5 → cùng sinh KHOA06), nhưng nếu race xảy
     * ra DB sẽ ném {@code DataIntegrityViolationException} từ UNIQUE
     * constraint (đã có ở V4). Service retry tối đa 5 lần bằng cách gọi
     * lại MAX+1 mỗi lần.
     *
     * <p>Nếu sau 5 lần vẫn fail → throw để caller xử lý (vd controller trả
     * HTTP 500 hoặc fallback sang UUID).
     */
    private String generateMaKhoa() {
        return generateWithRetry(5, () -> {
            int max = khoaRepository.findMaxMaKhoaSequence();
            return "KHOA" + String.format("%02d", max + 1);
        });
    }

    private String generateMaNganh() {
        return generateWithRetry(5, () -> {
            int max = nganhRepository.findMaxMaNganhSequence();
            return "NGANH" + String.format("%03d", max + 1);
        });
    }

    private String generateMaKhoaHoc() {
        return generateWithRetry(5, () -> {
            int max = khoaHocRepository.findMaxMaKhoaHocSequence();
            return "KH" + String.format("%02d", max + 1);
        });
    }

    private String generateMaLop() {
        return generateWithRetry(5, () -> {
            int max = lopRepository.findMaxMaLopSequence();
            return "LOP" + String.format("%03d", max + 1);
        });
    }

    /**
     * Gọi {@code supplier} tối đa {@code maxRetries} lần. Bắt
     * {@link org.springframework.dao.DataIntegrityViolationException}
     * (UNIQUE constraint violation) để retry khi race condition.
     */
    private String generateWithRetry(int maxRetries, java.util.function.Supplier<String> supplier) {
        org.springframework.dao.DataIntegrityViolationException last = null;
        for (int i = 0; i < maxRetries; i++) {
            try {
                return supplier.get();
            } catch (org.springframework.dao.DataIntegrityViolationException e) {
                last = e;
                // tiếp tục retry — lần sau MAX sẽ tăng
            }
        }
        throw last != null ? last
                : new IllegalStateException("Không thể sinh mã tự động sau " + maxRetries + " lần");
    }

    // ====================== CRUD KHOA ======================

    @Transactional
    public KhoaResponse createKhoa(KhoaRequest req) {
        Khoa khoa = new Khoa();
        khoa.setMaKhoa(generateMaKhoa());
        khoa.setTenKhoa(req.getTenKhoa().trim());
        khoa.setMoTa(req.getMoTa());
        khoa.setDangSuDung(req.getDangSuDung() != null ? req.getDangSuDung() : true);
        Khoa saved = khoaRepository.save(khoa);
        return KhoaResponse.fromEntity(saved);
    }

    @Transactional
    public KhoaResponse updateKhoa(Integer id, KhoaRequest req) {
        Khoa khoa = khoaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("KHOA_NOT_FOUND",
                        "Không tìm thấy khoa với ID: " + id));
        khoa.setTenKhoa(req.getTenKhoa().trim());
        khoa.setMoTa(req.getMoTa());
        if (req.getDangSuDung() != null) {
            khoa.setDangSuDung(req.getDangSuDung());
        }
        Khoa saved = khoaRepository.save(khoa);
        return KhoaResponse.fromEntity(saved);
    }

    @Transactional
    public void deleteKhoa(Integer id) {
        if (!khoaRepository.existsById(id)) {
            throw new ResourceNotFoundException("KHOA_NOT_FOUND",
                    "Không tìm thấy khoa với ID: " + id);
        }
        try {
            khoaRepository.deleteById(id);
        } catch (org.springframework.dao.DataIntegrityViolationException ex) {
            throw new BadRequestException("KHOA_IN_USE",
                    "Khoa đang được sử dụng bởi ngành. Không thể xóa.");
        }
    }

    // ====================== CRUD NGANH ======================

    @Transactional
    public NganhResponse createNganh(NganhRequest req) {
        // Validate khoaId bắt buộc
        if (req.getKhoaId() == null || req.getKhoaId() <= 0) {
            throw new BadRequestException("KHOA_ID_REQUIRED", "Khoa không được để trống.");
        }
        Khoa khoa = khoaRepository.findById(req.getKhoaId())
                .orElseThrow(() -> new BadRequestException("KHOA_NOT_FOUND",
                        "Không tìm thấy khoa với ID: " + req.getKhoaId()));
        
        // Kiểm tra trùng theo (tên ngành, khoa_id)
        Optional<Nganh> existing = nganhRepository.findFirstByTenNganhIgnoreCaseAndKhoa_Id(
                req.getTenNganh().trim(), khoa.getId());
        if (existing.isPresent()) {
            throw new BadRequestException("NGANH_EXISTS",
                    "Ngành '" + req.getTenNganh() + "' đã tồn tại trong khoa '" + khoa.getTenKhoa() + "'.");
        }
        
        Nganh nganh = new Nganh();
        nganh.setMaNganh(generateMaNganh());
        nganh.setTenNganh(req.getTenNganh().trim());
        nganh.setKhoa(khoa);
        nganh.setMoTa(req.getMoTa());
        nganh.setDangSuDung(req.getDangSuDung() != null ? req.getDangSuDung() : true);
        Nganh saved = nganhRepository.save(nganh);
        return NganhResponse.fromEntity(saved);
    }

    @Transactional
    public NganhResponse updateNganh(Integer id, NganhRequest req) {
        Nganh nganh = nganhRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("NGANH_NOT_FOUND",
                        "Không tìm thấy ngành với ID: " + id));
        
        // Validate khoaId bắt buộc
        if (req.getKhoaId() == null || req.getKhoaId() <= 0) {
            throw new BadRequestException("KHOA_ID_REQUIRED", "Khoa không được để trống.");
        }
        Khoa khoa = khoaRepository.findById(req.getKhoaId())
                .orElseThrow(() -> new BadRequestException("KHOA_NOT_FOUND",
                        "Không tìm thấy khoa với ID: " + req.getKhoaId()));
        
        // Kiểm tra trùng theo (tên ngành, khoa_id) - loại trừ chính nó
        Optional<Nganh> existing = nganhRepository.findFirstByTenNganhIgnoreCaseAndKhoa_Id(
                req.getTenNganh().trim(), khoa.getId());
        if (existing.isPresent() && !existing.get().getId().equals(id)) {
            throw new BadRequestException("NGANH_EXISTS",
                    "Ngành '" + req.getTenNganh() + "' đã tồn tại trong khoa '" + khoa.getTenKhoa() + "'.");
        }
        
        nganh.setTenNganh(req.getTenNganh().trim());
        nganh.setKhoa(khoa);
        nganh.setMoTa(req.getMoTa());
        if (req.getDangSuDung() != null) {
            nganh.setDangSuDung(req.getDangSuDung());
        }
        Nganh saved = nganhRepository.save(nganh);
        return NganhResponse.fromEntity(saved);
    }

    @Transactional
    public void deleteNganh(Integer id) {
        if (!nganhRepository.existsById(id)) {
            throw new ResourceNotFoundException("NGANH_NOT_FOUND",
                    "Không tìm thấy ngành với ID: " + id);
        }
        try {
            nganhRepository.deleteById(id);
        } catch (org.springframework.dao.DataIntegrityViolationException ex) {
            throw new BadRequestException("NGANH_IN_USE",
                    "Ngành đang được sử dụng bởi lớp. Không thể xóa.");
        }
    }

    // ====================== CRUD KHOA HOC ======================

    @Transactional
    public KhoaHocResponse createKhoaHoc(KhoaHocRequest req) {
        KhoaHoc kh = new KhoaHoc();
        kh.setMaKhoaHoc(generateMaKhoaHoc());
        kh.setTenKhoaHoc(req.getTenKhoaHoc().trim());
        kh.setNamBatDau(req.getNamBatDau());
        kh.setNamKetThuc(req.getNamKetThuc());
        kh.setMoTa(req.getMoTa());
        kh.setDangSuDung(req.getDangSuDung() != null ? req.getDangSuDung() : true);
        KhoaHoc saved = khoaHocRepository.save(kh);
        return KhoaHocResponse.fromEntity(saved);
    }

    @Transactional
    public KhoaHocResponse updateKhoaHoc(Integer id, KhoaHocRequest req) {
        KhoaHoc kh = khoaHocRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("KHOAHOC_NOT_FOUND",
                        "Không tìm thấy khóa học với ID: " + id));
        kh.setTenKhoaHoc(req.getTenKhoaHoc().trim());
        kh.setNamBatDau(req.getNamBatDau());
        kh.setNamKetThuc(req.getNamKetThuc());
        kh.setMoTa(req.getMoTa());
        if (req.getDangSuDung() != null) {
            kh.setDangSuDung(req.getDangSuDung());
        }
        KhoaHoc saved = khoaHocRepository.save(kh);
        return KhoaHocResponse.fromEntity(saved);
    }

    @Transactional
    public void deleteKhoaHoc(Integer id) {
        if (!khoaHocRepository.existsById(id)) {
            throw new ResourceNotFoundException("KHOAHOC_NOT_FOUND",
                    "Không tìm thấy khóa học với ID: " + id);
        }
        try {
            khoaHocRepository.deleteById(id);
        } catch (org.springframework.dao.DataIntegrityViolationException ex) {
            throw new BadRequestException("KHOAHOC_IN_USE",
                    "Khóa học đang được sử dụng bởi lớp. Không thể xóa.");
        }
    }

    // ====================== CRUD LOP ======================

    @Transactional
    public LopResponse createLop(LopRequest req) {
        Nganh nganh = nganhRepository.findById(req.getNganhId())
                .orElseThrow(() -> new BadRequestException("NGANH_NOT_FOUND",
                        "Không tìm thấy ngành với ID: " + req.getNganhId()));
        KhoaHoc khoaHoc = khoaHocRepository.findById(req.getKhoaHocId())
                .orElseThrow(() -> new BadRequestException("KHOAHOC_NOT_FOUND",
                        "Không tìm thấy khóa học với ID: " + req.getKhoaHocId()));
        Lop lop = new Lop();
        lop.setMaLop(generateMaLop());
        lop.setTenLop(req.getTenLop().trim());
        lop.setNganh(nganh);
        lop.setKhoaHoc(khoaHoc);
        lop.setMoTa(req.getMoTa());
        lop.setDangSuDung(req.getDangSuDung() != null ? req.getDangSuDung() : true);
        Lop saved = lopRepository.save(lop);
        return LopResponse.fromEntity(saved);
    }

    @Transactional
    public LopResponse updateLop(Integer id, LopRequest req) {
        Lop lop = lopRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("LOP_NOT_FOUND",
                        "Không tìm thấy lớp với ID: " + id));
        Nganh nganh = nganhRepository.findById(req.getNganhId())
                .orElseThrow(() -> new BadRequestException("NGANH_NOT_FOUND",
                        "Không tìm thấy ngành với ID: " + req.getNganhId()));
        KhoaHoc khoaHoc = khoaHocRepository.findById(req.getKhoaHocId())
                .orElseThrow(() -> new BadRequestException("KHOAHOC_NOT_FOUND",
                        "Không tìm thấy khóa học với ID: " + req.getKhoaHocId()));
        lop.setTenLop(req.getTenLop().trim());
        lop.setNganh(nganh);
        lop.setKhoaHoc(khoaHoc);
        lop.setMoTa(req.getMoTa());
        if (req.getDangSuDung() != null) {
            lop.setDangSuDung(req.getDangSuDung());
        }
        Lop saved = lopRepository.save(lop);
        return LopResponse.fromEntity(saved);
    }

    @Transactional
    public void deleteLop(Integer id) {
        if (!lopRepository.existsById(id)) {
            throw new ResourceNotFoundException("LOP_NOT_FOUND",
                    "Không tìm thấy lớp với ID: " + id);
        }
        try {
            lopRepository.deleteById(id);
        } catch (org.springframework.dao.DataIntegrityViolationException ex) {
            throw new BadRequestException("LOP_IN_USE",
                    "Lớp đang được sử dụng bởi sinh viên. Không thể xóa.");
        }
    }
}
